import {
  ensureFreshAccessToken,
  expireSession,
  getToken,
  refreshAccessToken,
  waitForAuthReady,
} from "@/lib/tokenManager";
import { useConfigWarningStore } from "@/store/useConfigWarningStore";
import Constants from "expo-constants";

const PRODUCTION_URL = "https://api.myterraceapp.com";
// WARNING: cleartext HTTP — only selected when EXPO_PUBLIC_MY_TERRACE_APP_BACKEND=development.
// Avoid using on shared/untrusted networks; prefer HTTPS via a local tunnel
// (e.g. ngrok / localtunnel) when testing with bearer-token auth.
// const DEVELOPMENT_URL = "http://192.168.1.11:4200";

const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.50:8081" or "10.0.2.2:8081"
let packagerIp = hostUri ? hostUri.split(":")[0] : null;

// 💡 Replace 4200 with your backend port
const DEVELOPMENT_URL = `http://${packagerIp || "localhost"}:4200`;

// Single source of truth for backend selection: EXPO_PUBLIC_MY_TERRACE_APP_BACKEND=development|live
// (see .env). Must carry the EXPO_PUBLIC_ prefix — Metro only inlines .env vars into
// process.env for client code when they're prefixed that way; an unprefixed name here
// would always read as undefined at runtime regardless of what .env sets.
// Any other/missing value falls back to production rather than silently
// resolving to a LAN IP (e.g. 192.168.x.x:4200) that no longer has a server running.
const backendEnv = process.env.EXPO_PUBLIC_MY_TERRACE_APP_BACKEND;
if (__DEV__ && backendEnv !== "development" && backendEnv !== "live") {
  const message = `Invalid or missing EXPO_PUBLIC_MY_TERRACE_APP_BACKEND ("${backendEnv}"). Expected "development" or "live". Falling back to live/production.`;
  console.warn(`[httpMethods] ${message}`);
  // Also surface it in-app (ConfigWarningBanner) — most testers on a device
  // never see the Metro console, only the JS warning above.
  useConfigWarningStore.getState().setWarning(message);
}

export const API_BASE = backendEnv === "development" ? DEVELOPMENT_URL : PRODUCTION_URL;


// Build headers with Authorization token if present. Skips Content-Type for
// FormData bodies — fetch must set its own multipart boundary, and forcing
// application/json here breaks multipart uploads (e.g. image attachments).
function buildHeaders(isFormData: boolean, extra?: Record<string, string>) {
  const token = getToken();
  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  } as Record<string, string>;
}

async function handleResponse<T>(r: Response, authed = true): Promise<T> {
  let json: any = {};
  try {
    json = await r.json();
  } catch {
    // Non-JSON response (rare) – keep empty json silently
  }

  if (!r.ok) {
    const message = json?.error || json?.message || `HTTP ${r.status}`;
    const err: any = new Error(message);
    err.status = r.status;
    err.body = json;
    throw err;
  }
  return json as T;
}

// A 401 that a refresh can fix (access token expired), as opposed to a bad
// signature / unknown user (refreshing won't help) or a plain permission error.
const isExpiredAuthError = (err: any) =>
  err?.status === 401 &&
  (err?.body?.tokenExpired === true || /expired/i.test(String(err?.body?.error ?? err?.message ?? "")));

const isHardAuthError = (err: any) =>
  err?.status === 401 && /invalid token|user not found/i.test(String(err?.body?.error ?? err?.message ?? ""));

// Generic request wrapper
let __apiCallCount = 0;

async function request<T>(method: string, path: string, body?: any, retried = false): Promise<T> {
  if (__DEV__ && !retried) {
    console.log(`[API #${++__apiCallCount}] ${method} ${path}`);
  }
  // Don't fire authenticated calls before the stored session is restored, and
  // renew a token that is about to expire so the call doesn't 401 at all.
  await waitForAuthReady();
  const hadToken = !!getToken();
  if (hadToken && !retried) await ensureFreshAccessToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(isFormData),
      credentials: "include",
      signal: controller.signal,
      ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    });
    clearTimeout(timeoutId);
    return await handleResponse<T>(r);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (hadToken) {
      if (isExpiredAuthError(error) && !retried) {
        // One refresh for any number of concurrent 401s (single-flight in the
        // store); then retry exactly once — no retry loops.
        const outcome = await refreshAccessToken();
        if (outcome === "ok") return request<T>(method, path, body, true);
        // "invalid": the store already logged the user out. "network": keep the
        // session and surface the original error so the caller can show retry.
      } else if (isHardAuthError(error) || (isExpiredAuthError(error) && retried)) {
        expireSession();
      }
    }
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
    return handleResponse<T>(r, false);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
