// Business Registration store (Zustand) — mirrors the existing store pattern
// (see useAuthStore / useSocietyStore). All calls hit the REAL backend defined
// in home-connect-server/BUSINESS_API_DOCUMENTATION.txt. No mock data.

import { API_BASE, Delete, Get, Post, Put } from "@/lib/httpMethods";
import { getToken } from "@/lib/tokenManager";
import {
  BusinessCategory,
  BusinessRegistration,
  BusinessTypeOption,
  BusinessTypeValue,
  Step2Payload,
  Step3Payload,
  Step4Payload,
  Step5Payload,
  Step6Payload,
} from "@/types/businessRegistration.type";
import { create } from "zustand";

type UploadFile = { uri: string; name: string; type: string };

type BusinessResponse = { business: BusinessRegistration };

// multipart/form-data upload — the HTTP client must set the boundary itself,
// so we call fetch directly (NOT httpMethods JSON helpers) and only attach auth.
async function uploadMultipart<T>(
  path: string,
  parts: { field: string; files: UploadFile[] },
): Promise<T> {
  const token = getToken();
  const form = new FormData();
  parts.files.forEach((f) => {
    // React Native FormData file shape
    form.append(parts.field, {
      uri: f.uri,
      name: f.name,
      type: f.type,
    } as any);
  });
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err: any = new Error(json?.error || json?.message || `HTTP ${r.status}`);
    err.status = r.status;
    err.body = json;
    throw err;
  }
  return json as T;
}

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";
  return "image/jpeg";
}

export function toFile(uri: string, fallbackName: string): UploadFile {
  const fromUri = uri.split("/").pop();
  const name = fromUri && fromUri.includes(".") ? fromUri : fallbackName;
  return { uri, name, type: mimeFromName(name) };
}

type State = {
  business: BusinessRegistration | null;
  businessTypes: BusinessTypeOption[];
  categories: BusinessCategory[];
  otherOption: { slug: string; name: string } | null;
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  error: string | null;
};

type Actions = {
  getBusinessTypes: () => Promise<BusinessTypeOption[]>;
  getCategories: (businessType: BusinessTypeValue) => Promise<BusinessCategory[]>;
  loadCurrent: () => Promise<BusinessRegistration | null>;
  startRegistration: (businessType?: BusinessTypeValue) => Promise<BusinessRegistration>;
  saveStep1: (businessType: BusinessTypeValue) => Promise<BusinessRegistration>;
  saveStep2: (payload: Step2Payload) => Promise<BusinessRegistration>;
  saveStep3: (payload: Step3Payload) => Promise<BusinessRegistration>;
  saveStep4: (payload: Step4Payload) => Promise<BusinessRegistration>;
  saveStep5: (payload: Step5Payload) => Promise<BusinessRegistration>;
  saveStep6: (payload: Step6Payload) => Promise<BusinessRegistration>;
  uploadRegistrationProof: (file: UploadFile) => Promise<BusinessRegistration>;
  uploadLogo: (file: UploadFile) => Promise<BusinessRegistration>;
  uploadPhotos: (files: UploadFile[]) => Promise<BusinessRegistration>;
  deletePhoto: (photoId: number) => Promise<BusinessRegistration>;
  submit: () => Promise<BusinessRegistration>;
  getStatus: () => Promise<BusinessStatusResponse>;
  reset: () => void;
  clear: () => void;
};

export type BusinessStatusResponse = {
  business_id: number;
  business_status: BusinessRegistration["business_status"];
  verification_status: BusinessRegistration["verification_status"];
  rejection_reason: string | null;
  current_step: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  is_live: boolean;
};

const REG = "/api/business/registration";

export const useBusinessRegistrationStore = create<State & Actions>((set, get) => {
  const requireId = () => {
    const id = get().business?.id;
    if (!id) throw new Error("No active business registration");
    return id;
  };
  const applyBusiness = (b: BusinessRegistration) => {
    set({ business: b });
    return b;
  };

  return {
    business: null,
    businessTypes: [],
    categories: [],
    otherOption: null,
    loading: false,
    saving: false,
    uploading: false,
    error: null,

    getBusinessTypes: async () => {
      const res = await Get<{ business_types: BusinessTypeOption[] }>(
        "/api/business/types",
      );
      const types = res.business_types || [];
      set({ businessTypes: types });
      return types;
    },

    getCategories: async (businessType) => {
      const res = await Get<{
        categories: BusinessCategory[];
        other_option: { slug: string; name: string };
      }>(`/api/business/categories?business_type=${businessType}`);
      set({ categories: res.categories || [], otherOption: res.other_option || null });
      return res.categories || [];
    },

    loadCurrent: async () => {
      set({ loading: true, error: null });
      try {
        const res = await Get<{ business: BusinessRegistration | null }>(
          `${REG}/me`,
        );
        set({ business: res.business ?? null });
        return res.business ?? null;
      } catch (e: any) {
        set({ error: e?.message ?? "Failed to load registration" });
        throw e;
      } finally {
        set({ loading: false });
      }
    },

    startRegistration: async (businessType) => {
      set({ saving: true, error: null });
      try {
        const res = await Post<BusinessResponse>(
          REG,
          businessType ? { business_type: businessType } : {},
        );
        return applyBusiness(res.business);
      } catch (e: any) {
        set({ error: e?.message ?? "Failed to start registration" });
        throw e;
      } finally {
        set({ saving: false });
      }
    },

    saveStep1: async (businessType) => {
      set({ saving: true, error: null });
      try {
        const res = await Put<BusinessResponse>(`${REG}/${requireId()}/step-1`, {
          business_type: businessType,
        });
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    saveStep2: async (payload) => {
      set({ saving: true, error: null });
      try {
        const res = await Put<BusinessResponse>(`${REG}/${requireId()}/step-2`, payload);
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    saveStep3: async (payload) => {
      set({ saving: true, error: null });
      try {
        const res = await Put<BusinessResponse>(`${REG}/${requireId()}/step-3`, payload);
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    saveStep4: async (payload) => {
      set({ saving: true, error: null });
      try {
        const res = await Put<BusinessResponse>(`${REG}/${requireId()}/step-4`, payload);
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    saveStep5: async (payload) => {
      set({ saving: true, error: null });
      try {
        const res = await Put<BusinessResponse>(`${REG}/${requireId()}/step-5`, payload);
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    saveStep6: async (payload) => {
      set({ saving: true, error: null });
      try {
        const res = await Put<BusinessResponse>(`${REG}/${requireId()}/step-6`, payload);
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    uploadRegistrationProof: async (file) => {
      set({ uploading: true, error: null });
      try {
        const res = await uploadMultipart<BusinessResponse>(
          `${REG}/${requireId()}/registration-proof`,
          { field: "registration_proof", files: [file] },
        );
        return applyBusiness(res.business);
      } finally {
        set({ uploading: false });
      }
    },

    uploadLogo: async (file) => {
      set({ uploading: true, error: null });
      try {
        const res = await uploadMultipart<BusinessResponse>(
          `${REG}/${requireId()}/logo`,
          { field: "logo", files: [file] },
        );
        return applyBusiness(res.business);
      } finally {
        set({ uploading: false });
      }
    },

    uploadPhotos: async (files) => {
      set({ uploading: true, error: null });
      try {
        const res = await uploadMultipart<BusinessResponse>(
          `${REG}/${requireId()}/photos`,
          { field: "photos", files },
        );
        return applyBusiness(res.business);
      } finally {
        set({ uploading: false });
      }
    },

    deletePhoto: async (photoId) => {
      set({ uploading: true, error: null });
      try {
        const res = await Delete<BusinessResponse>(
          `${REG}/${requireId()}/photos/${photoId}`,
        );
        return applyBusiness(res.business);
      } finally {
        set({ uploading: false });
      }
    },

    submit: async () => {
      set({ saving: true, error: null });
      try {
        const res = await Post<BusinessResponse>(`${REG}/${requireId()}/submit`, {});
        return applyBusiness(res.business);
      } finally {
        set({ saving: false });
      }
    },

    getStatus: async () => {
      const res = await Get<BusinessStatusResponse & { success: boolean }>(
        `${REG}/${requireId()}/status`,
      );
      const b = get().business;
      if (b) {
        set({
          business: {
            ...b,
            business_status: res.business_status,
            verification_status: res.verification_status,
            rejection_reason: res.rejection_reason,
          },
        });
      }
      return res;
    },

    reset: () =>
      set({ business: null, categories: [], otherOption: null, error: null }),

    // Called by useAuthStore's sign-out cascade, like every other store.
    clear: () =>
      set({
        business: null,
        businessTypes: [],
        categories: [],
        otherOption: null,
        loading: false,
        saving: false,
        uploading: false,
        error: null,
      }),
  };
});
