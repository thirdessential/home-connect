import { API_BASE } from "@/lib/httpMethods";

/** A response (including 4xx/5xx) means the device can reach the network. */
export async function checkInternetConnection(timeoutMs = 4000): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        await fetch(API_BASE, { method: "HEAD", signal: controller.signal });
        return true;
    } catch {
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}
