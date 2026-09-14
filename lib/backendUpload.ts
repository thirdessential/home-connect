import { API_BASE } from "@/lib/httpMethods";
import { fileNameFromUri, inferMimeType } from "@/lib/imageValidation";
import { getToken } from "@/lib/tokenManager";

// Real backend local-storage upload (POST /api/media/upload, multipart field
// "file") — NOT Cloudinary. The single shared implementation of this pattern;
// reused by ResidentProofStep and PostForm rather than duplicated per-screen.
// Same endpoint as uploadToBackend(), but also returns the permanent S3 key
// (`public_id`) — needed by callers that persist the image reference (e.g.
// profile picture) rather than just displaying it once. The signed `url` in
// the response expires; only the key is safe to store.
export async function uploadToBackendKeyed(uri: string): Promise<{ key: string; url: string }> {
  const token = getToken();
  const form = new FormData();
  // Filename and MIME must agree with the actual file, otherwise the server's
  // type check rejects the part.
  const name = fileNameFromUri(uri);
  const type = inferMimeType(uri);
  form.append("file", { uri, name, type } as any);

  const url = `${API_BASE}/api/media/upload`;
  if (__DEV__) console.log("[uploadToBackend] POST", url, { name, type, hasToken: !!token });

  let r: Response;
  try {
    r = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch (networkErr) {
    // fetch() throws here (not an HTTP error) on DNS failure, connection
    // refused, or — on iOS — an ATS-blocked cleartext (http://) request.
    if (__DEV__) console.warn("[uploadToBackend] network error", url, networkErr);
    throw networkErr;
  }

  const json: any = await r.json().catch(() => ({}));
  if (!r.ok || !json?.success || !json?.data?.url || !json?.data?.public_id) {
    if (__DEV__) console.warn("[uploadToBackend] rejected", { status: r.status, json });
    throw new Error(json?.error || `Upload failed (HTTP ${r.status})`);
  }
  return { key: json.data.public_id as string, url: json.data.url as string };
}

// Real backend local-storage upload (POST /api/media/upload, multipart field
// "file") — NOT Cloudinary. The single shared implementation of this pattern;
// reused by ResidentProofStep and PostForm rather than duplicated per-screen.
export async function uploadToBackend(uri: string): Promise<string> {
  const { url } = await uploadToBackendKeyed(uri);
  return url;
}
