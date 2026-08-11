import { useState } from 'react';
import { Delete, Post } from "./httpMethods";

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
}

export interface UploadSignature {
    timestamp: number;
    signature: string;
    api_key: string;
    cloud_name: string;
    folder?: string;
}

/**
 * Upload an image to Cloudinary with signed upload
 * @param uri - Local file URI from ImagePicker
 * @param folder - Optional folder in Cloudinary (e.g., 'profiles', 'posts', 'businesses')
 * @param onProgress - Optional progress callback (0-100)
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadImage(
    uri: string,
    folder?: string,
    onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
    try {
        // 1. Get signed upload parameters from backend
        onProgress?.(10);
        const signature = await getUploadSignature(folder);
        if (!signature || typeof signature.timestamp === 'undefined' || !signature.signature || !signature.api_key || !signature.cloud_name) {
            throw new Error('Failed to get valid Cloudinary signature from backend. Check your /api/media/sign endpoint and network connection.');
        }
        onProgress?.(20);

        // 2. Prepare form data for Cloudinary upload
        const formData = new FormData();

        // Add the image file
        formData.append('file', {
            uri,
            type: 'image/jpeg', // You might want to detect this from the URI
            name: 'upload.jpg',
        } as any);

        // Add signature parameters
        formData.append('timestamp', signature.timestamp.toString());
        formData.append('signature', signature.signature);
        formData.append('api_key', signature.api_key);

        if (signature.folder) {
            formData.append('folder', signature.folder);
        }


        // Add additional upload parameters
        formData.append('quality', 'auto');
        formData.append('fetch_format', 'auto');

        onProgress?.(30);

        // 3. Upload to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
            {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        onProgress?.(80);

        if (!response.ok) {
            // Throw an error instead of returning null to satisfy the return type
            const text = await response.text().catch(() => '');
            throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} ${text}`);
        }

        const result: CloudinaryUploadResult = await response.json();
        onProgress?.(100);

        return result;
    } catch (error) {
        throw error;
    }
}

/**
 * Get signed upload parameters from your backend
 */
async function getUploadSignature(folder?: string): Promise<UploadSignature> {
    try {
        const payload: { folder?: string } = {};
        if (folder) payload.folder = folder;

        // The backend returns { code, data, success }
        const response = await Post<{ data: UploadSignature }>('/api/media/sign', payload);
        if (!response || !response.data) {
            throw new Error('No signature data returned from backend');
        }
        return response.data;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get upload signature from server: ${message}`);
    }
}

/**
 * Delete an image from Cloudinary
 * @param public_id - The public_id returned from upload
 */
export async function deleteImage(public_id: string): Promise<void> {
    try {
        await Delete('/api/media/delete', { public_id });
    } catch (error) {
        throw error;
    }
}

/**
 * Generate optimized image URL with transformations
 * @param public_id - The public_id from Cloudinary
 * @param transformations - Cloudinary transformation parameters
 * @param cloudName - Your Cloudinary cloud name (get from env or config)
 */
export function getOptimizedImageUrl(
    public_id: string,
    transformations: {
        width?: number;
        height?: number;
        crop?: 'fill' | 'fit' | 'scale' | 'pad';
        quality?: 'auto' | number;
        format?: 'auto' | 'webp' | 'jpg' | 'png';
    } = {},
    cloudName = 'your-cloud-name' // TODO: Replace with your actual cloud name
): string {

    const transforms = [];

    if (transformations.width) transforms.push(`w_${transformations.width}`);
    if (transformations.height) transforms.push(`h_${transformations.height}`);
    if (transformations.crop) transforms.push(`c_${transformations.crop}`);
    if (transformations.quality) transforms.push(`q_${transformations.quality}`);
    if (transformations.format) transforms.push(`f_${transformations.format}`);

    const transformString = transforms.length > 0 ? `${transforms.join(',')}` : '';

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${public_id}`;
}

/**
 * Hook for easier image upload in components
 */

export function useImageUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const upload = async (uri: string, folder?: string) => {
        try {
            setUploading(true);
            setError(null);
            setProgress(0);

            const result = await uploadImage(uri, folder, setProgress);
            setUploading(false);
            return result;
        } catch (err) {
            setUploading(false);
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMessage);
            throw err;
        }
    };

    return {
        upload,
        uploading,
        progress,
        error,
        clearError: () => setError(null),
    };
}