import { API_BASE } from "@/lib/httpMethods";

// Android's own captive-portal check target: tiny, always-up, returns 204.
const REACHABILITY_URL = "https://clients3.google.com/generate_204";

async function reachable(url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        // Any HTTP response (including 4xx/5xx) proves the network path works.
        await fetch(url, { method, signal: controller.signal });
        return true;
    } catch {
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * True when the device has internet. The backend is tried first (cheap, and
 * the common case), but a backend that is down/slow/unreachable (e.g. a dev
 * server not running) must NOT read as "no internet" — so on failure we fall
 * back to a neutral endpoint. Offline only when both fail.
 */
export async function checkInternetConnection(timeoutMs = 4000): Promise<boolean> {
    if (await reachable(API_BASE, "HEAD", timeoutMs)) return true;
    return reachable(REACHABILITY_URL, "GET", timeoutMs);
}
