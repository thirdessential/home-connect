import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import ImagePickerField from "@/components/form/ImagePickerField";
import TerraceSelectField from "@/components/inputs/TerraceSelectField";
import TerraceTextField from "@/components/inputs/TerraceTextField";
import TerraceStepper from "@/components/onboarding/TerraceStepper";
import { API_BASE } from "@/lib/httpMethods";
import { useSocietyStore } from "@/store/useSocietyStore";
import {
  toFile,
  useBusinessRegistrationStore,
} from "@/store/useBusinessRegistrationStore";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, getWidth } from "@/theme/theme";
import * as Location from "expo-location";
import {
  BusinessTypeValue,
  DeliveryAvailability,
  LocationType,
  RegistrationType,
  Step4Payload,
} from "@/types/businessRegistration.type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

// Digits only; strip a leading country code so "+919876543210" -> "9876543210".
const strip91 = (v?: string | null) => {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length > 10 ? d.slice(-10) : d;
};

// +91-prefixed 10-digit field (same behaviour as the Login screen).
function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={phoneStyles.wrap}>
      <Text style={phoneStyles.label}>{label}</Text>
      <View style={phoneStyles.row}>
        <Text style={phoneStyles.cc}>+91</Text>
        <TextInput
          style={phoneStyles.input}
          value={value}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="10-digit mobile"
          placeholderTextColor="#9CA3AF"
          onChangeText={(t) => {
            const d = t.replace(/\D/g, "").slice(0, 10);
            onChange(d);
            if (d.length === 10) Keyboard.dismiss();
          }}
        />
      </View>
    </View>
  );
}

const STEP_LABELS = ["Type", "Basic", "Category", "Location", "Verify", "Details"];

const BUSINESS_TYPES: { value: BusinessTypeValue; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "shops_businesses", label: "Shops & Businesses", icon: "storefront-outline" },
  { value: "services", label: "Services", icon: "briefcase-outline" },
  { value: "home_services", label: "Home Services", icon: "home-outline" },
];

const REG_TYPES: { value: RegistrationType; label: string }[] = [
  { value: "not_registered", label: "Not Registered" },
  { value: "gst", label: "GST" },
  { value: "fssai", label: "FSSAI" },
  { value: "shop_establishment", label: "Shop & Establishment" },
  { value: "udyam", label: "UDYAM" },
  { value: "other", label: "Other" },
];

const DELIVERY: { value: DeliveryAvailability; label: string }[] = [
  { value: "within_life_republic", label: "Within Life Republic" },
  { value: "outside_life_republic", label: "Outside Life Republic" },
];

function OptionCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={getWidth(22)}
          color={selected ? TERRACE_COLORS.orange : TERRACE_COLORS.textMuted}
          style={{ marginRight: getWidth(12) }}
        />
      ) : null}
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

// Server file paths are relative ("/uploads/..."); the picker needs a full URL.
const toDisplayUrl = (p?: string | null) =>
  !p ? null : p.startsWith("http") ? p : `${API_BASE}${p}`;

const isRemote = (uri: string) => uri.startsWith("http") || uri.startsWith("/uploads");

export default function BusinessWizard() {
  const { showToast } = useToast();
  const s = useBusinessRegistrationStore();
  const societies = useSocietyStore((st) => st.societies);
  const getAllSociety = useSocietyStore((st) => st.getAllSociety);
  const user = useUserStore((st) => st.user);

  const [step, setStep] = useState(1);
  // Step 1 renders immediately — the draft lookup happens in the background and
  // the registration row is created on Continue. The screen must never be
  // gated behind a network round-trip.
  const [hydrating, setHydrating] = useState(true);

  // form state
  const [businessType, setBusinessType] = useState<BusinessTypeValue | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [otherCategory, setOtherCategory] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [locationType, setLocationType] = useState<LocationType | null>(null);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const [unitShop, setUnitShop] = useState("");
  const [building, setBuilding] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [pin, setPin] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateVal] = useState("");
  const [regType, setRegType] = useState<RegistrationType | null>(null);
  const [proofUri, setProofUri] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [delivery, setDelivery] = useState<DeliveryAvailability | null>(null);
  const [deliveryCategory, setDeliveryCategory] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [altMobile, setAltMobile] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [logoUri, setLogoUri] = useState<string[]>([]);
  const [socialUrl, setSocialUrl] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // Resume: load an existing draft in the background (never blocks the UI).
  useEffect(() => {
    (async () => {
      try {
        if (societies.length === 0) getAllSociety().catch(() => {});
        if (user?.phone) setMobile((m) => m || strip91(user.phone));
        const biz = await s.loadCurrent();
        if (!biz || biz.business_status === "approved") return;
        // hydrate local state from the returned draft
        if (biz.business_type) setBusinessType(biz.business_type);
        setName(biz.business_name ?? "");
        // Pre-fill from the logged-in user's number when the draft has none.
        setMobile(strip91(biz.mobile_number) || strip91(user?.phone));
        setEmail(biz.email ?? "");
        setCategoryId(biz.category_id ?? null);
        setIsOther(!!biz.other_category);
        setOtherCategory(biz.other_category ?? "");
        setLocationType(biz.location_type ?? null);
        setSocietyId(biz.society_id != null ? String(biz.society_id) : null);
        setUnitShop(biz.unit_shop_no ?? "");
        setBuilding(biz.building_block ?? "");
        setMapUrl(biz.google_maps_location ?? "");
        setAddr1(biz.address_line1 ?? "");
        setAddr2(biz.address_line2 ?? "");
        setPin(biz.pin_code ?? "");
        setLocality(biz.area_locality ?? "");
        setCity(biz.city ?? "");
        setStateVal(biz.state ?? "");
        setRegType(biz.registration_type ?? null);
        setDescription(biz.business_description ?? "");
        setDelivery(biz.delivery_availability ?? null);
        setDeliveryCategory(biz.delivery_category ?? "");
        setBizPhone(strip91(biz.business_phone));
        setAltMobile(biz.alternative_mobile ?? "");
        setBizEmail(biz.business_email ?? "");
        setSocialUrl(biz.social_media_url ?? "");
        // Already-uploaded files come back as server paths — show them instead
        // of making the user pick everything again.
        setProofUri(biz.registration_proof ? [toDisplayUrl(biz.registration_proof)!] : []);
        setLogoUri(biz.logo_url ? [toDisplayUrl(biz.logo_url)!] : []);
        setPhotoUris((biz.photos ?? []).map((p) => toDisplayUrl(p.url || p.photo_url)!));
        if (biz.latitude != null) setLat(biz.latitude);
        if (biz.longitude != null) setLng(biz.longitude);
        if (biz.business_status === "pending") {
          setStep(7);
        } else {
          setStep(Math.min(Math.max(biz.current_step || 1, 1), 6));
        }
        if (biz.business_type) s.getCategories(biz.business_type).catch(() => {});
      } catch (e: any) {
        showToast(e?.message ?? "Failed to load business flow", "error");
      } finally {
        setHydrating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = useMemo(
    () => s.categories.map((c) => ({ id: String(c.id), name: c.name })),
    [s.categories],
  );
  const societyOptions = useMemo(
    () => societies.map((x: any) => ({ id: String(x.id ?? x._id), name: x.name })),
    [societies],
  );

  const err = useCallback(
    (e: any) => {
      const details = e?.body?.details;
      const msg = Array.isArray(details) && details[0]?.message
        ? details[0].message
        : e?.message ?? "Something went wrong";
      showToast(msg, "error");
    },
    [showToast],
  );

  // Outside-society requires real coordinates. Try the device GPS, and fall
  // back to the location the user already saved during onboarding.
  const captureLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location permission denied");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (place) {
        if (!addr1.trim()) setAddr1([place.name, place.street].filter(Boolean).join(", "));
        if (!pin.trim() && place.postalCode) setPin(place.postalCode);
        if (!locality.trim() && (place.district || place.subregion)) {
          setLocality(place.district || place.subregion || "");
        }
        if (!city.trim() && place.city) setCity(place.city);
        if (!state.trim() && place.region) setStateVal(place.region);
      }
      if (!mapUrl.trim()) {
        setMapUrl(
          `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`,
        );
      }
      showToast("Location captured", "success");
    } catch (e: any) {
      const saved = (user as any)?.location;
      if (saved?.latitude != null && saved?.longitude != null) {
        setLat(Number(saved.latitude));
        setLng(Number(saved.longitude));
        if (!mapUrl.trim()) {
          setMapUrl(`https://maps.google.com/?q=${saved.latitude},${saved.longitude}`);
        }
        showToast("Using your saved location", "info");
      } else {
        showToast(e?.message ?? "Could not get your location", "error");
      }
    } finally {
      setLocating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr1, pin, locality, city, state, mapUrl, user, showToast]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((p) => p - 1);
    else if (router.canGoBack()) router.back();
  }, [step]);

  // ---- per-step submit handlers (save to backend, then advance) ----
  const next1 = async () => {
    if (!businessType) return showToast("Select a business type", "error");
    try {
      // The registration row is created here (or reused if a draft exists),
      // so opening the screen never needs the network.
      if (!s.business) await s.startRegistration(businessType);
      else await s.saveStep1(businessType);
      await s.getCategories(businessType);
      setStep(2);
    } catch (e) { err(e); }
  };

  const next2 = async () => {
    if (name.trim().length < 2) return showToast("Business name is required", "error");
    if (mobile.replace(/\D/g, "").length < 10) return showToast("Valid mobile is required", "error");
    try {
      await s.saveStep2({
        business_name: name.trim(),
        mobile_number: mobile.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setStep(3);
    } catch (e) { err(e); }
  };

  const next3 = async () => {
    try {
      if (isOther) {
        if (otherCategory.trim().length < 2) return showToast("Enter your category", "error");
        await s.saveStep3({ category_slug: "other", other_category: otherCategory.trim() });
      } else {
        if (!categoryId) return showToast("Select a category", "error");
        await s.saveStep3({ category_id: categoryId });
      }
      setStep(4);
    } catch (e) { err(e); }
  };

  const next4 = async () => {
    if (!locationType) return showToast("Select where your business is located", "error");
    try {
      let payload: Step4Payload;
      if (locationType === "within_society") {
        if (!societyId) return showToast("Select your society", "error");
        if (!unitShop.trim()) return showToast("Unit / Shop no. is required", "error");
        payload = {
          location_type: "within_society",
          society_id: societyId,
          unit_shop_no: unitShop.trim(),
          ...(building.trim() ? { building_block: building.trim() } : {}),
          ...(mapUrl.trim() ? { google_maps_location: mapUrl.trim() } : {}),
          ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
        };
      } else {
        if (!mapUrl.trim() || !unitShop.trim() || !addr1.trim() || !pin.trim() || !locality.trim() || !city.trim() || !state.trim()) {
          return showToast("Please fill all required location fields", "error");
        }
        if (lat == null || lng == null) {
          return showToast("Tap 'Use my current location' to set the map pin", "error");
        }
        payload = {
          location_type: "outside_society",
          google_maps_location: mapUrl.trim(),
          latitude: lat,
          longitude: lng,
          unit_shop_no: unitShop.trim(),
          ...(building.trim() ? { building_block: building.trim() } : {}),
          address_line1: addr1.trim(),
          ...(addr2.trim() ? { address_line2: addr2.trim() } : {}),
          pin_code: pin.trim(),
          area_locality: locality.trim(),
          city: city.trim(),
          state: state.trim(),
        };
      }
      await s.saveStep4(payload);
      setStep(5);
    } catch (e) { err(e); }
  };

  const next5 = async () => {
    if (!regType) return showToast("Select a registration type", "error");
    try {
      if (regType !== "not_registered" && proofUri[0] && !isRemote(proofUri[0])) {
        await s.uploadRegistrationProof(toFile(proofUri[0], "proof.jpg"));
      }
      await s.saveStep5({ registration_type: regType });
      setStep(6);
    } catch (e) { err(e); }
  };

  // Removing an already-uploaded photo must delete it on the server too,
  // otherwise the 5-photo cap stays full.
  const onPhotosChange = async (next: string[]) => {
    const removed = photoUris.filter((u) => isRemote(u) && !next.includes(u));
    setPhotoUris(next);
    for (const uri of removed) {
      const photo = (s.business?.photos ?? []).find(
        (p) => toDisplayUrl(p.url || p.photo_url) === uri,
      );
      if (photo) {
        try {
          await s.deletePhoto(photo.id);
        } catch (e) {
          err(e);
        }
      }
    }
  };

  const next6 = async () => {
    if (!delivery) return showToast("Select delivery availability", "error");
    if (!deliveryCategory.trim()) return showToast("Delivery category is required", "error");
    if (!bizPhone.trim()) return showToast("Business phone is required", "error");
    try {
      if (logoUri[0] && !isRemote(logoUri[0])) {
        await s.uploadLogo(toFile(logoUri[0], "logo.jpg"));
      }
      const fresh = photoUris.filter((u) => !isRemote(u));
      if (fresh.length) {
        const alreadyUploaded = s.business?.photos?.length ?? 0;
        if (alreadyUploaded + fresh.length > 5) {
          return showToast(
            `You can upload up to 5 photos (${alreadyUploaded} already added)`,
            "error",
          );
        }
        await s.uploadPhotos(fresh.map((u, i) => toFile(u, `photo-${i}.jpg`)));
      }
      await s.saveStep6({
        ...(description.trim() ? { business_description: description.trim() } : {}),
        delivery_availability: delivery,
        delivery_category: deliveryCategory.trim(),
        business_phone: bizPhone.trim(),
        ...(altMobile.trim() ? { alternative_mobile: altMobile.trim() } : {}),
        ...(bizEmail.trim() ? { business_email: bizEmail.trim() } : {}),
        ...(socialUrl.trim() ? { social_media_url: socialUrl.trim() } : {}),
      });
      await handleSubmit();
    } catch (e) { err(e); }
  };

  const handleSubmit = async () => {
    try {
      await s.submit();
      setStep(7);
    } catch (e: any) {
      if (Array.isArray(e?.body?.missing_fields)) {
        showToast(`Missing: ${e.body.missing_fields.join(", ")}`, "error");
      } else {
        err(e);
      }
    }
  };

  const saving = s.saving || s.uploading || hydrating;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={getHeight(24)}
      >
        <TerraceHeader compact onBack={goBack} />
        {step <= 6 ? (
          <View style={styles.stepperWrap}>
            <TerraceStepper steps={STEP_LABELS} currentStep={step} />
          </View>
        ) : null}

        {s.business?.business_status === "rejected" && step <= 6 ? (
          <View style={styles.rejectedBanner}>
            <Ionicons name="alert-circle" size={getWidth(18)} color="#B42318" />
            <Text style={styles.rejectedText}>
              Your submission was rejected
              {s.business.rejection_reason ? `: ${s.business.rejection_reason}` : ""}.
              Update the details and submit again.
            </Text>
          </View>
        ) : null}

        {step === 1 && (
          <View>
            <Text style={styles.title}>What type of business?</Text>
            {BUSINESS_TYPES.map((b) => (
              <OptionCard
                key={b.value}
                label={b.label}
                icon={b.icon}
                selected={businessType === b.value}
                onPress={() => setBusinessType(b.value)}
              />
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Basic details</Text>
            <TerraceTextField label="Business Name *" value={name} onChangeText={setName} placeholder="Business name" />
            <PhoneField label="Mobile *" value={mobile} onChange={setMobile} />
            <TerraceTextField label="Email (optional)" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Select category</Text>
            <TerraceSelectField
              label="Category"
              options={categoryOptions}
              selectedId={isOther ? null : categoryId != null ? String(categoryId) : null}
              onChange={(id) => { setCategoryId(Number(id)); setIsOther(false); }}
              placeholder="Select a category"
              leftIcon="pricetag-outline"
            />
            <OptionCard label="Other" selected={isOther} onPress={() => { setIsOther(true); setCategoryId(null); }} />
            {isOther ? (
              <TerraceTextField label="Other Category *" value={otherCategory} onChangeText={setOtherCategory} placeholder="Describe your category" />
            ) : null}
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.title}>Where is your business located?</Text>
            <OptionCard label="Within Society" selected={locationType === "within_society"} onPress={() => setLocationType("within_society")} />
            <OptionCard label="Outside Society" selected={locationType === "outside_society"} onPress={() => setLocationType("outside_society")} />
            {locationType === "within_society" ? (
              <>
                <TerraceSelectField label="Society *" options={societyOptions} selectedId={societyId} onChange={setSocietyId} placeholder="Select society" leftIcon="business-outline" />
                <TerraceTextField label="Unit / Shop No. *" value={unitShop} onChangeText={setUnitShop} placeholder="e.g. S-14" />
                <TerraceTextField label="Building / Tower / Block" value={building} onChangeText={setBuilding} placeholder="e.g. Tower B" />
                <TerraceTextField label="Google Maps Location" value={mapUrl} onChangeText={setMapUrl} placeholder="Map URL" autoCapitalize="none" />
              </>
            ) : locationType === "outside_society" ? (
              <>
                <Pressable
                  onPress={captureLocation}
                  disabled={locating}
                  style={[styles.optionCard, lat != null && styles.optionCardSelected]}
                >
                  {locating ? (
                    <ActivityIndicator
                      color={TERRACE_COLORS.orange}
                      style={{ marginRight: getWidth(12) }}
                    />
                  ) : (
                    <Ionicons
                      name="locate-outline"
                      size={getWidth(22)}
                      color={lat != null ? TERRACE_COLORS.orange : TERRACE_COLORS.textMuted}
                      style={{ marginRight: getWidth(12) }}
                    />
                  )}
                  <Text style={styles.optionLabel}>
                    {lat != null
                      ? `Location set (${lat.toFixed(4)}, ${lng?.toFixed(4)})`
                      : "Use my current location *"}
                  </Text>
                </Pressable>
                <TerraceTextField label="Google Maps Location *" value={mapUrl} onChangeText={setMapUrl} placeholder="Map URL" autoCapitalize="none" />
                <TerraceTextField label="Unit / Shop No. *" value={unitShop} onChangeText={setUnitShop} placeholder="e.g. Shop 4" />
                <TerraceTextField label="Building / Block" value={building} onChangeText={setBuilding} placeholder="e.g. Sai Plaza" />
                <TerraceTextField label="Address Line 1 *" value={addr1} onChangeText={setAddr1} placeholder="Street / road" />
                <TerraceTextField label="Address Line 2" value={addr2} onChangeText={setAddr2} placeholder="Landmark" />
                <TerraceTextField label="PIN Code *" value={pin} onChangeText={setPin} placeholder="6-digit PIN" keyboardType="number-pad" maxLength={6} />
                <TerraceTextField label="Area / Locality *" value={locality} onChangeText={setLocality} placeholder="Locality" />
                <TerraceTextField label="City *" value={city} onChangeText={setCity} placeholder="City" />
                <TerraceTextField label="State *" value={state} onChangeText={setStateVal} placeholder="State" />
              </>
            ) : null}
          </View>
        )}

        {step === 5 && (
          <View>
            <Text style={styles.title}>Verification</Text>
            <TerraceSelectField
              label="Registration Type *"
              options={REG_TYPES.map((r) => ({ id: r.value, name: r.label }))}
              selectedId={regType}
              onChange={(id) => setRegType(id as RegistrationType)}
              placeholder="Select registration type"
              leftIcon="document-text-outline"
            />
            {regType && regType !== "not_registered" ? (
              <ImagePickerField label="Registration Proof" mode="single" value={proofUri} onChange={setProofUri} max={1} />
            ) : null}
          </View>
        )}

        {step === 6 && (
          <View>
            <Text style={styles.title}>Business details</Text>
            <TerraceTextField label="Description" value={description} onChangeText={setDescription} placeholder="About your business" multiline numberOfLines={3} />
            <TerraceSelectField label="Delivery / Service Availability *" options={DELIVERY.map((d) => ({ id: d.value, name: d.label }))} selectedId={delivery} onChange={(id) => setDelivery(id as DeliveryAvailability)} placeholder="Select availability" leftIcon="bicycle-outline" />
            <TerraceTextField label="Delivery Category *" value={deliveryCategory} onChangeText={setDeliveryCategory} placeholder="e.g. Grocery & Essentials" />
            <PhoneField label="Business Phone / WhatsApp *" value={bizPhone} onChange={setBizPhone} />
            <TerraceTextField label="Alternative Mobile" value={altMobile} onChangeText={setAltMobile} placeholder="Alternate number" keyboardType="phone-pad" maxLength={13} />
            <TerraceTextField label="Email" value={bizEmail} onChangeText={setBizEmail} placeholder="business@example.com" keyboardType="email-address" autoCapitalize="none" />
            <TerraceTextField label="Social Media / Website" value={socialUrl} onChangeText={setSocialUrl} placeholder="https://..." autoCapitalize="none" />
            <ImagePickerField label="Logo" mode="single" value={logoUri} onChange={setLogoUri} max={1} />
            <ImagePickerField label="Photos (max 5)" mode="multiple" value={photoUris} onChange={onPhotosChange} max={5} />
          </View>
        )}

        {step === 7 && (
          <View style={styles.center}>
            <View style={styles.doneBadge}>
              <Ionicons name="shield-checkmark" size={getWidth(40)} color="#fff" />
            </View>
            <Text style={styles.title}>You&apos;re almost live!</Text>
            <Text style={styles.doneSub}>
              Your business is submitted and pending admin approval. We&apos;ll notify you once it&apos;s verified.
            </Text>
            <ActionButton title="Go to Home" onPress={() => router.replace("/(tabs)/home")} variant="primary" size="lg" fullWidth containerStyle={styles.cta} />
          </View>
        )}
      </KeyboardAwareScrollView>

      {step <= 6 ? (
        <View style={styles.footerBar}>
          <ActionButton
            title={step === 6 ? "Submit" : "Continue"}
            onPress={
              step === 1 ? next1 : step === 2 ? next2 : step === 3 ? next3 : step === 4 ? next4 : step === 5 ? next5 : next6
            }
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            disabled={saving}
            containerStyle={styles.cta}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TERRACE_COLORS.screenBg },
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  scroll: { paddingHorizontal: getWidth(20), paddingTop: getHeight(8), paddingBottom: getHeight(24) },
  stepperWrap: { marginTop: getHeight(12), marginBottom: getHeight(8) },
  title: {
    fontSize: getWidth(22),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    marginTop: getHeight(16),
    marginBottom: getHeight(14),
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: getWidth(14),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    paddingVertical: getHeight(14),
    paddingHorizontal: getWidth(16),
    marginBottom: getHeight(12),
  },
  optionCardSelected: { borderColor: TERRACE_COLORS.orange, backgroundColor: "#FFFDFB" },
  optionLabel: { flex: 1, fontSize: getWidth(16), fontWeight: "600", color: TERRACE_COLORS.textDark },
  radio: {
    width: getWidth(22),
    height: getWidth(22),
    borderRadius: getWidth(11),
    borderWidth: 2,
    borderColor: "#C7C1B6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: TERRACE_COLORS.orange },
  radioDot: { width: getWidth(11), height: getWidth(11), borderRadius: getWidth(6), backgroundColor: TERRACE_COLORS.orange },
  footerBar: {
    paddingHorizontal: getWidth(20),
    paddingTop: getHeight(10),
    paddingBottom: getHeight(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TERRACE_COLORS.inputBorder,
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  cta: { borderRadius: getWidth(28), paddingVertical: getHeight(16), marginTop: getHeight(8) },
  rejectedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: getWidth(8),
    backgroundColor: "#FEF3F2",
    borderRadius: getWidth(12),
    borderWidth: 1,
    borderColor: "#FDA29B",
    padding: getWidth(12),
    marginTop: getHeight(12),
  },
  rejectedText: { flex: 1, fontSize: getWidth(13), lineHeight: getHeight(19), color: "#B42318" },
  doneBadge: {
    width: getWidth(80),
    height: getWidth(80),
    borderRadius: getWidth(40),
    backgroundColor: TERRACE_COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getHeight(20),
  },
  doneSub: {
    fontSize: getWidth(15),
    lineHeight: getHeight(22),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: getWidth(16),
    marginBottom: getHeight(24),
  },
});

const phoneStyles = StyleSheet.create({
  wrap: { marginBottom: getHeight(18) },
  label: {
    fontSize: getWidth(13),
    fontWeight: "600",
    color: TERRACE_COLORS.textDark,
    marginBottom: getHeight(6),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: getWidth(12),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    height: getHeight(50),
    overflow: "hidden",
  },
  cc: {
    paddingHorizontal: getWidth(14),
    fontSize: getWidth(16),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    borderRightWidth: 1.5,
    borderRightColor: TERRACE_COLORS.inputBorder,
    height: "100%",
    textAlignVertical: "center",
    lineHeight: getHeight(50),
  },
  input: {
    flex: 1,
    fontSize: getWidth(16),
    color: TERRACE_COLORS.textDark,
    paddingHorizontal: getWidth(12),
    height: "100%",
  },
});
