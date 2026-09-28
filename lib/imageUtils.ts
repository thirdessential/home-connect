/**
 * Image URL Utilities
 * Provides functions for validating, sanitizing, and optimizing image URLs
 */
import { API_BASE } from "@/lib/httpMethods";

/**
 * Safely joins the API base URL with a relative image path returned by the
 * backend. Handles both "/societies/..." and "societies/..." (missing
 * leading slash) without producing a double slash or double protocol.
 * @param path - Relative (or already-absolute) image path from the API
 * @returns Absolute image URL, or undefined if path is empty
 */
export const buildImageUrl = (path?: string | null): string | undefined => {
    if (!path || typeof path !== "string") return undefined;

    const trimmed = path.trim();
    if (!trimmed) return undefined;

    // Already absolute — don't touch it.
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const base = API_BASE.replace(/\/+$/, "");
    const relative = trimmed.replace(/^\/+/, "");
    return `${base}/${relative}`;
};

/**
 * Validates if a URL is a valid image URL
 * @param url - The URL to validate
 * @returns true if URL is valid, false otherwise
 */
export const isValidImageUrl = (url: any): url is string => {
    if (!url || typeof url !== "string") return false;

    const trimmedUrl = url.trim();

    // Check if URL is not empty
    if (trimmedUrl.length === 0) return false;

    // Check if URL starts with http or https
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        return false;
    }

    try {
        // Try to parse as URL
        new URL(trimmedUrl);
        return true;
    } catch {
        return false;
    }
};

/**
 * Gets the first valid image URL from an array
 * @param images - Array of image URLs
 * @returns First valid URL or undefined
 */
export const getFirstValidImageUrl = (
    images: any[] | undefined
): string | undefined => {
    if (!Array.isArray(images)) return undefined;

    return images.find((img) => isValidImageUrl(img));
};

/**
 * Sanitizes and cleans image URL
 * @param url - The URL to sanitize
 * @returns Sanitized URL or undefined
 */
export const sanitizeImageUrl = (url: any): string | undefined => {
    if (!isValidImageUrl(url)) return undefined;

    let sanitized = url.trim();

    // Remove any extra whitespace
    sanitized = sanitized.replace(/\s+/g, "");

    // Do NOT blindly force https here: the local dev backend
    // (EXPO_PUBLIC_MY_TERRACE_APP_BACKEND=development, see lib/httpMethods.ts DEVELOPMENT_URL)
    // intentionally serves plain HTTP on a non-TLS port. Rewriting its
    // http:// image URLs to https:// makes RCTImageView attempt a TLS
    // handshake against a plain-HTTP port, which fails as
    // "Unable to parse TLS packet header". Each URL's own scheme already
    // reflects what its host actually serves (https in production).

    return sanitized;
};

/**
 * Derives 2-letter initials from a display name for avatar fallbacks.
 * 2+ words: first letter of first word + first letter of last word.
 * 1 word: first two letters. Missing/empty name: "?".
 * @param name - Display name (business/service/user)
 * @returns Uppercase 2-letter initials
 */
export const getInitials = (name?: string | null): string => {
    if (!name || typeof name !== "string") return "?";

    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase() || "?";
    }

    const first = words[0][0] || "";
    const last = words[words.length - 1][0] || "";
    return (first + last).toUpperCase() || "?";
};

/**
 * Gets the best image URL from object with multiple fields
 * Checks common image field names in order of preference
 * @param obj - Object that might contain image fields
 * @returns Best available image URL or undefined
 */
export const getBestImageUrl = (obj: any): string | undefined => {
    if (!obj || typeof obj !== "object") return undefined;

    // Common image field names in order of preference
    const imageFields = [
        "imageUrl",
        "image",
        "photo",
        "profileImage",
        "profilePhotoUrl",
        "avatar",
        "avatarUrl",
        "images",
        "media",
    ];

    for (const field of imageFields) {
        const value = obj[field];

        // If it's an array, get the first valid URL
        if (Array.isArray(value)) {
            const validUrl = getFirstValidImageUrl(value);
            if (validUrl) return sanitizeImageUrl(validUrl);
        }

        // If it's a string, validate and return
        if (isValidImageUrl(value)) {
            return sanitizeImageUrl(value);
        }
    }

    return undefined;
};

/**
 * Resizes Cloudinary image URL to specified dimensions
 * @param url - Cloudinary image URL
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns Resized image URL
 */
export const resizeCloudinaryImage = (
    url: string | undefined,
    width?: number,
    height?: number
): string | undefined => {
    if (!isValidImageUrl(url)) return undefined;

    if (!url.includes("res.cloudinary.com")) return url;

    try {
        // Extract upload path and file path
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/upload/");

        if (pathParts.length !== 2) return url;

        // Build transformation string
        let transform = "c_fill"; // Crop to fill
        if (width) transform += `,w_${width}`;
        if (height) transform += `,h_${height}`;
        if (width && height) transform += `,q_auto`; // Auto quality

        // Reconstruct URL with transformation
        const newPath =
            pathParts[0] + `/upload/${transform}/` + pathParts[1];
        return url.replace(urlObj.pathname, newPath);
    } catch (error) {
        console.warn("[resizeCloudinaryImage] Error resizing image:", error);
        return url;
    }
};

/**
 * Generates a placeholder image URL
 * @param width - Width in pixels (default: 200)
 * @param height - Height in pixels (default: 200)
 * @param text - Text to display on placeholder (default: "Image")
 * @param bgColor - Background color hex (default: "cccccc")
 * @returns Placeholder image URL
 */
export const getPlaceholderImageUrl = (
    width: number = 200,
    height: number = 200,
    text: string = "Image",
    bgColor: string = "cccccc"
): string => {
    return `https://via.placeholder.com/${width}x${height}/${bgColor}/000000?text=${encodeURIComponent(
        text
    )}`;
};

/**
 * Batch validates multiple image URLs
 * @param urls - Array of URLs to validate
 * @returns Object with valid and invalid URLs
 */
export const batchValidateImageUrls = (
    urls: any[]
): { valid: string[]; invalid: any[] } => {
    const valid: string[] = [];
    const invalid: any[] = [];

    for (const url of urls) {
        if (isValidImageUrl(url)) {
            valid.push(sanitizeImageUrl(url)!);
        } else {
            invalid.push(url);
        }
    }

    return { valid, invalid };
};

/**
 * Logs image loading debug information
 * @param imageSource - Description of image source
 * @param url - Image URL
 * @param status - Loading status ('loading', 'success', 'error')
 * @param error - Error message if any
 */
export const logImageLoadDebug = (
    imageSource: string,
    url: string | undefined,
    status: "loading" | "success" | "error",
    error?: any
): void => {
    const timestamp = new Date().toISOString();
    const isValid = isValidImageUrl(url);

    const logMessage = {
        timestamp,
        source: imageSource,
        url,
        isValidUrl: isValid,
        status,
        error: error?.message || error,
    };

    if (status === "error") {
        console.warn("[Image Load Error]", logMessage);
    } else if (status === "loading") {
        console.debug("[Image Loading]", logMessage);
    } else {
        console.debug("[Image Success]", logMessage);
    }
};
