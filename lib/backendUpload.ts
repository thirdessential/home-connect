import { API_BASE } from "@/lib/httpMethods";
import { getToken } from "@/lib/tokenManager";

// Real backend local-storage upload (POST /api/media/upload, multipart field
// "file") — NOT Cloudinary. The single shared implementation of this pattern;
// reused by ResidentProofStep and PostForm rather than duplicated per-screen.
export async function uploadToBackend(uri: string): Promise<string> {
  const token = getToken();
  const form = new FormData();
  const name = uri.split("/").pop() || "upload.jpg";
  form.append("file", { uri, name, type: "image/jpeg" } as any);

  const r = await fetch(`${API_BASE}/api/media/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok || !json?.success || !json?.data?.url) {
    throw new Error(json?.error || `Upload failed (HTTP ${r.status})`);
  }
  return json.data.url as string;
}
