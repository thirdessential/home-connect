import { getToken, signOutUser } from "@/lib/tokenManager";
import Constants from "expo-constants";

const PRODUCTION_URL = "http://13.127.67.104:4200";
// WARNING: cleartext HTTP — restricted to local development builds only.
// `__DEV__` is false in production so this URL is never selected in release builds.
// Avoid using on shared/untrusted networks; prefer HTTPS via a local tunnel
// (e.g. ngrok / localtunnel) when testing with bearer-token auth.
// const DEVELOPMENT_URL = "http://192.168.1.11:4200";

const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.50:8081" or "10.0.2.2:8081"
let packagerIp = hostUri ? hostUri.split(":")[0] : null;

// 💡 Replace 4200 with your backend port
const DEVELOPMENT_URL = `http://${packagerIp || "localhost"}:4200`;


export const API_BASE = __DEV__ ? DEVELOPMENT_URL : PRODUCTION_URL;


// Build headers with Authorization token if presentn
function buildHeaders(extra?: Record<string, string>) {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  } as Record<string, string>;
}

async function handleResponse<T>(r: Response): Promise<T> {
  let json: any = {};
  try {
    json = await r.json();
  } catch {
    // Non-JSON response (rare) – keep empty json silently
  }

  if (!r.ok) {
    // If unauthorized or expired - but only signOut if it's a real auth error from server
    if (r.status === 401) {
      const msg = (json?.error || json?.message || "").toLowerCase();
      // Only sign out if server explicitly says token is invalid/expired
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes("user not found")) {
        console.warn("Server says token is invalid, signing out:", msg);
        try {
          // Use token manager to avoid circular dependency
          await signOutUser();
        } catch (err) {
          console.error("Failed to sign out:", err);
        }
      } else {
        console.warn("401 error but not token related:", msg);
      }
    }
    const message = json?.error || json?.message || `HTTP ${r.status}`;
    const err: any = new Error(message);
    err.status = r.status;
    err.body = json;
    throw err;
  }
  return json as T;
}

// Generic request wrapper
let __apiCallCount = 0;

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  if (__DEV__) {
    console.log(`[API #${++__apiCallCount}] ${method} ${path}`);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(),
      credentials: "include",
      signal: controller.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    clearTimeout(timeoutId);
    return handleResponse<T>(r);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const Get = <T>(path: string) => request<T>("GET", path);
export const Post = <T>(path: string, body: any) => request<T>("POST", path, body);
export const Put = <T>(path: string, body: any) => request<T>("PUT", path, body);
export const Patch = <T>(path: string, body: any) => request<T>("PATCH", path, body);
export const Delete = <T>(path: string, body?: any) => request<T>("DELETE", path, body);

// Explicit unauthenticated POST (e.g. login / verify-otp) if needed
export async function PostPublic<T>(path: string, body: any): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify(body),
    });
    clearTimeout(timeoutId);
    return handleResponse<T>(r);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
