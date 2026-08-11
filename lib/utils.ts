// Generate a PNG data URL with initials for use as a fallback avatar
import { Review, WhatsAppMessageParams } from "@/types/common.type";
import { Alert, Linking, Share } from "react-native";

export function joinWithComma(arr: string[]): string {
    if (!Array.isArray(arr)) return '';
    return arr.filter(Boolean).join(', ');
}

export function toKebab(str: string): string {
    return str.trim().replace(/\s+/g, "-");
}

export function getDiscountPercentage(mrp: number, sellingPrice: number): number {
    if (!isNaN(mrp) && !isNaN(sellingPrice) && mrp > 0) {
        const discount = mrp - sellingPrice;
        return (discount / mrp) * 100;
    }
    return 0;
}

export async function shareProduct({
    name,
    description,
    price,
    link,
}: {
    name: string;
    description?: string;
    price?: string | number;
    link?: string;
}) {
    let message = `Check out this product: ${name}`;
    if (description) message += `\n${description}`;
    if (price) message += `\nPrice: ${price}`;
    if (link) message += `\n${link}`;
    try {
        await Share.share({ message });
    } catch {
        Alert.alert("Share Failed", "Unable to share product details. Please try again.");
    }
}

export function toE164India(mobile10: string): string | null {
    const clean = mobile10.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) return null;
    return `+91${clean}`;
}

export async function callUser(number: string | undefined) {


    try {
        // Clean the phone number
        const cleanNumber = number?.replace(/[^+\d]/g, '') || '';

        // Open keypad with pre-filled number
        Linking.openURL(`tel:${cleanNumber}`);
    } catch (error) {
        console.error("Error making phone call:", error);
        Alert.alert(
            "Call Failed",
            "Unable to initiate the phone call. Please try again.",
            [{ text: "OK" }]
        );
    }
}

export const formatPrice = (val: number | string, currency: string) => {
    if (typeof val === "number") {
        try {
            // Indian formatting by default
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: currency === "₹" ? "INR" : currency,
                maximumFractionDigits: 0,
            }).format(val);
        } catch {
            return `${currency}${val}`;
        }
    }
    return String(val);
};

export const removeCountryCodeSafe = (phone: string): string => {
    if (!phone || typeof phone !== 'string') {
        return '';
    }

    // Trim whitespace first
    const cleanPhone = phone.trim();

    // Remove +91 if it starts with it
    if (cleanPhone.startsWith('+91')) {
        return cleanPhone.substring(3);
    }

    return cleanPhone;
};

export function joinWithPlus(arr: string[]): string {
    if (!Array.isArray(arr)) return '';
    return arr.filter(Boolean).join(' + ');
}

export const calculateAvgRating = (reviews: Review[]) =>
    reviews.reduce((acc, review) => acc + (review.rating ?? 0), 0) / (reviews.length || 1);


export const sendWhatsAppMessage = async ({
    phone,
    message,
    productDetails,
}: WhatsAppMessageParams): Promise<void> => {
    if (!phone) {
        Alert.alert("Error", "Contact number not available");
        return;
    }

    const cleanPhone = phone.replace(/[^+\d]/g, '');
    let finalMessage = message || '';

    // If product details are provided, construct order message
    if (productDetails) {
        finalMessage = `Hi, I'm interested in ordering ${productDetails.name}${productDetails.price ? ` for Rs.${productDetails.price}` : ''
            }. Please provide more details.`;
    }

    try {
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
        const canOpen = await Linking.canOpenURL(url);

        if (!canOpen) {
            throw new Error("WhatsApp not installed");
        }

        await Linking.openURL(url);
    } catch {
        Alert.alert(
            "WhatsApp Not Installed",
            "Please install WhatsApp to use this feature"
        );
    }
};

export function getTruncatedDescription(text: string, maxLength = 80): string {
    if (!text) return "";
    if (text.length <= maxLength) return text; // within 2 lines limit
    return text.substring(0, maxLength).trim() + "...";
}

export function capitalizeWords(input: string): string {
    if (typeof input !== "string" || input.length === 0) return "";
    // Uppercase letters at the start of the string or after common separators
    return input.replace(/(^|[\s\-_/\.])([a-zA-Z])/g, (_match, sep: string, chr: string) => `${sep}${chr.toUpperCase()}`);
}

/**
 * Generate initials from a person's name
 * @param name - The full name or title
 * @returns Two-letter initials or "?" if name is empty
 * @example
 * getInitials("John Doe") // Returns "JD"
 * getInitials("John") // Returns "J"
 * getInitials("") // Returns "?"
 */
export function getInitials(name: string | undefined | null): string {
    if (!name || typeof name !== "string") return "?";

    const trimmed = name.trim();
    if (!trimmed) return "?";

    const names = trimmed.split(/\s+/);

    // Single name - return first letter
    if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
    }

    // Multiple names - return first letter of first and last name
    return (
        names[0].charAt(0).toUpperCase() +
        names[names.length - 1].charAt(0).toUpperCase()
    );
}

/**
 * Validate and sanitize image URIs to prevent malicious content
 * Accepts only https://, http://, or file:// URIs
 * @param uri - Image URI to validate
 * @returns Validated URI or empty string if invalid
 */
export function validateImageUri(uri: string | undefined): string {
    if (!uri || typeof uri !== "string") return "";

    const trimmed = uri.trim();

    // Only allow https, http, or file protocols (safe for React Native)
    if (trimmed.match(/^(https?|file):\/\/.+/i)) {
        return trimmed;
    }

    // Return empty string for invalid or potentially malicious URIs
    return "";
}

/**
 * Type guard to check if a value is a User object with photo URL
 * @param value - Value to check
 * @returns True if value is a valid User object with profilePhotoUrl
 */
export function isUserWithPhoto(value: any): value is { profilePhotoUrl: string;[key: string]: any } {
    return (
        value &&
        typeof value === "object" &&
        "profilePhotoUrl" in value &&
        typeof value.profilePhotoUrl === "string"
    );
}

/**
 * Type guard to check if a value is a User object
 * @param value - Value to check
 * @returns True if value is a valid User object
 */
export function isUserObject(value: any): value is { fullName?: string; phone?: string;[key: string]: any } {
    return value && typeof value === "object";
}
