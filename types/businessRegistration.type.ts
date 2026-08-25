// Types for the Business Registration 7-step flow.
// Source of truth: home-connect-server/BUSINESS_API_DOCUMENTATION.txt

export type BusinessTypeValue =
  | "shops_businesses"
  | "services"
  | "home_services";

export type LocationType = "within_society" | "outside_society";

export type RegistrationType =
  | "not_registered"
  | "gst"
  | "fssai"
  | "shop_establishment"
  | "udyam"
  | "other";

export type DeliveryAvailability =
  | "within_life_republic"
  | "outside_life_republic";

export type BusinessStatus = "draft" | "pending" | "approved" | "rejected";
export type VerificationStatus = "pending" | "approved" | "rejected";

export type BusinessTypeOption = { value: BusinessTypeValue; label: string };

export type BusinessCategory = {
  id: number;
  slug: string;
  name: string;
  business_type: BusinessTypeValue;
};

export type BusinessPhoto = {
  id: number;
  photo_url: string;
  sort_order: number;
  url?: string;
};

export type BusinessRegistration = {
  id: number;
  user_id?: number;
  business_type: BusinessTypeValue | null;
  business_type_label?: string | null;

  business_name: string | null;
  mobile_number: string | null;
  email: string | null;

  category_id: number | null;
  other_category: string | null;
  category: BusinessCategory | null;

  location_type: LocationType | null;
  society_id: number | string | null;
  society: any | null;
  unit_shop_no: string | null;
  building_block: string | null;
  google_maps_location: string | null;
  latitude: number | null;
  longitude: number | null;
  address_line1: string | null;
  address_line2: string | null;
  pin_code: string | null;
  area_locality: string | null;
  city: string | null;
  state: string | null;

  registration_type: RegistrationType | null;
  registration_proof: string | null;

  business_description: string | null;
  delivery_availability: DeliveryAvailability | null;
  delivery_category: string | null;
  business_phone: string | null;
  alternative_mobile: string | null;
  business_email: string | null;
  logo_url: string | null;
  social_media_url: string | null;
  photos: BusinessPhoto[];

  current_step: number;
  business_status: BusinessStatus;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  created_at?: string;
  updated_at?: string;
};

// ---- Step payloads (exact shapes from the API doc) ----

export type Step2Payload = {
  business_name: string;
  mobile_number: string;
  email?: string;
};

export type Step3Payload =
  | { category_id: number }
  | { category_slug: string }
  | { category_slug: "other"; other_category: string };

export type Step4WithinPayload = {
  location_type: "within_society";
  society_id: number | string;
  unit_shop_no: string;
  building_block?: string;
  google_maps_location?: string;
  latitude?: number;
  longitude?: number;
};

export type Step4OutsidePayload = {
  location_type: "outside_society";
  google_maps_location: string;
  latitude: number;
  longitude: number;
  unit_shop_no: string;
  building_block?: string;
  address_line1: string;
  address_line2?: string;
  pin_code: string;
  area_locality: string;
  city: string;
  state: string;
};

export type Step4Payload = Step4WithinPayload | Step4OutsidePayload;

export type Step5Payload = {
  registration_type: RegistrationType;
  registration_proof?: string | null;
};

export type Step6Payload = {
  business_description?: string;
  delivery_availability: DeliveryAvailability;
  delivery_category: string;
  business_phone: string;
  alternative_mobile?: string;
  business_email?: string;
  logo_url?: string | null;
  social_media_url?: string;
};
