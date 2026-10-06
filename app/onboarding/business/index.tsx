import VerificationRouteGuard from "@/components/verification/VerificationRouteGuard";
import { TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import CountdownFillButton from "@/components/UI/CountdownFillButton";
import ActionButton from "@/components/inputs/ActionButton";
import ImagePickerField from "@/components/form/ImagePickerField";
import TerraceSelectField from "@/components/inputs/TerraceSelectField";
import TerraceTextField from "@/components/inputs/TerraceTextField";
import TerraceStepper from "@/components/onboarding/TerraceStepper";
import INDIA_STATES_CITIES from "@/lib/data/indiaStatesCities.json";
import { buildImageUrl } from "@/lib/imageUtils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  toFile,
  useBusinessRegistrationStore,
} from "@/store/useBusinessRegistrationStore";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, getWidth } from "@/theme/theme";
import * as Location from "expo-location";
import {
  BusinessTypeValue,
  OperatingLocation,
  LocationType,
  RegistrationType,
  Step4Payload,
} from "@/types/businessRegistration.type";
import { UserRole } from "@/types/roles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <View style={phoneStyles.wrap}>
      <Text style={phoneStyles.label}>{label}</Text>
      <View style={[phoneStyles.row, invalid && { borderColor: "#DC2626" }]}>
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

const INDIA_CITIES = INDIA_STATES_CITIES as Record<string, string[]>;
const OTHER_ID = "other";
const OTHER_CATEGORY_MAX = 20;
const STEP_LABELS = ["Type", "Basic", "Category", "Location", "Verify", "Details"];

// Step 1 asks WHERE the business runs (not its category). The backend derives
// business_type (and so the category list) from this value.
const OPERATING_LOCATIONS: {
  value: OperatingLocation;
  businessType: BusinessTypeValue;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "SHOP_OR_OFFICE",
    businessType: "shops_businesses",
    label: "From a shop or office",
    subtitle: "I run my business from a shop, office, or other commercial location.",
    icon: "business-outline",
  },
  {
    value: "HOME",
    businessType: "home_services",
    label: "From home",
    subtitle: "I run my business from my home.",
    icon: "home-outline",
  },
];

const REG_TYPES: { value: RegistrationType; label: string }[] = [
  { value: "not_registered", label: "Not Registered" },
  { value: "gst", label: "GST" },
  { value: "fssai", label: "FSSAI" },
  { value: "shop_establishment", label: "Shop & Establishment" },
  { value: "udyam", label: "UDYAM" },
  { value: "other", label: "Other" },
];


function OptionCard({
  label,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  label: string;
  subtitle?: string;
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
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

// Server file paths are relative (e.g. "/uploads/..." or "societies/..."
// without a leading slash); the picker needs a full URL.
const toDisplayUrl = (p?: string | null) => buildImageUrl(p) ?? null;

const isRemote = (uri: string) => uri.startsWith("http") || uri.startsWith("/uploads");

function BusinessWizard({ onSubmitted }: { onSubmitted: () => void }) {
  const { showToast } = useToast();
  const s = useBusinessRegistrationStore();
  const user = useUserStore((st) => st.user);

  // This screen is for a non-Business account to become one — an existing
  // Business user must never be able to open it. Role comes from the
  // JWT-backed session, never a client-controlled param.
  const { hasRole } = usePermissions();
  const isBusinessUser = hasRole(UserRole.BUSINESS);
  useEffect(() => {
    if (!isBusinessUser) return;
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/create");
  }, [isBusinessUser]);

  const [step, setStep] = useState(1);
  // Step 1 renders immediately — the draft lookup happens in the background and
  // the registration row is created on Continue. The screen must never be
  // gated behind a network round-trip.
  const [hydrating, setHydrating] = useState(true);

  // form state
  const [operatingLocation, setOperatingLocation] = useState<OperatingLocation | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [otherCategory, setOtherCategory] = useState("");
  const [isOther, setIsOther] = useState(false);
  const [locationType, setLocationType] = useState<LocationType | null>(null);
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
        if (user?.phone) setMobile((m) => m || strip91(user.phone));
        const biz = await s.loadCurrent();
        if (!biz || biz.business_status === "approved") return;
        // hydrate local state from the returned draft
        // Draft resume: prefer the stored answer; older drafts only have a type.
        if (biz.operating_location) setOperatingLocation(biz.operating_location);
        else if (biz.business_type)
          setOperatingLocation(biz.business_type === "home_services" ? "HOME" : "SHOP_OR_OFFICE");
        setName(biz.business_name ?? "");
        // Pre-fill from the logged-in user's number when the draft has none.
        setMobile(strip91(biz.mobile_number) || strip91(user?.phone));
        setEmail(biz.email ?? "");
        setCategoryId(biz.category_id ?? null);
        setIsOther(!!biz.other_category);
        setOtherCategory(biz.other_category ?? "");
        setLocationType(biz.location_type ?? null);
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
    () => [
      ...s.categories.map((c) => ({ id: String(c.id), name: c.name })),
      // "Other" lives inside the dropdown; backend still gets category_slug "other".
      { id: OTHER_ID, name: "Other" },
    ],
    [s.categories],
  );
  // Registered society comes from the logged-in user's profile — never asked again.
  const mySocietyName: string | undefined = (user?.societyId as any)?.name;

  // Offline India State/UT → cities dataset (generated from country-state-city).
  const stateOptions = useMemo(
    () => Object.keys(INDIA_CITIES).sort().map((n) => ({ id: n, name: n })),
    [],
  );
  const cityOptions = useMemo(() => {
    const list = INDIA_CITIES[state] ?? [];
    // A saved city missing from the dataset must still show/remain selectable.
    const withSaved = city && !list.includes(city) ? [city, ...list] : list;
    return withSaved.map((n) => ({ id: n, name: n }));
  }, [state, city]);

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

  // Per-field validation errors for the location step (key -> message).
  const [fe, setFe] = useState<Record<string, string>>({});
  const clearErr = useCallback((k: string) => setFe((e) => (e[k] ? { ...e, [k]: "" } : e)), []);
  const scrollRef = useRef<any>(null);
  const fieldY = useRef<Record<string, number>>({});
  const containerY = useRef(0);
  const fieldWrap = (k: string, node: React.ReactNode, ownMsg = false) => (
    <View key={k} onLayout={(e) => { fieldY.current[k] = e.nativeEvent.layout.y; }}>
      {node}
      {fe[k] && !ownMsg ? <Text style={styles.fieldError}>{fe[k]}</Text> : null}
    </View>
  );

  // Shared: show all errors, scroll to the first (in the given visual order).
  const flagErrors = (errs: Record<string, string>, order: string[]) => {
    setFe(errs);
    const first = order.find((k) => errs[k]);
    if (!first) return false;
    const y = containerY.current + (fieldY.current[first] ?? 0) - getHeight(16);
    scrollRef.current?.scrollToPosition?.(0, Math.max(0, y), true);
    return true;
  };
  useEffect(() => { setFe({}); }, [step]);

  // Outside-society requires real coordinates. Try the device GPS, and fall
  // back to the location the user already saved during onboarding.
  const captureLocation = useCallback(async () => {
    setLocating(true);
    try {
      // Ask only if not already granted (avoids repeat prompts).
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") throw new Error("Location permission denied. Enable it in Settings to continue.");
      if (!(await Location.hasServicesEnabledAsync())) throw new Error("Turn on GPS / location services and try again.");

      // Fast path: a fix from the last 2 minutes is instant. Otherwise a
      // low-accuracy fix (network/cell, ~1s) with a hard 6s timeout.
      let pos = await Location.getLastKnownPositionAsync({ maxAge: 120000, requiredAccuracy: 500 });
      if (!pos) {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Couldn't get your location in time. Move to an open area and retry.")), 6000)),
        ]);
      }
      const { latitude, longitude } = pos.coords;
      setLat(latitude);
      setLng(longitude);
      clearErr("loc");
      if (!mapUrl.trim()) {
        setMapUrl(`https://maps.google.com/?q=${latitude},${longitude}`);
        clearErr("map");
      }
      showToast("Location captured", "success");
      setLocating(false);

      // Address prefill is best-effort and runs after the pin is already set.
      Location.reverseGeocodeAsync({ latitude, longitude })
        .then(([place]) => {
          if (!place) return;
          if (!addr1.trim()) setAddr1([place.name, place.street].filter(Boolean).join(", "));
          if (!pin.trim() && place.postalCode) setPin(place.postalCode);
          if (!locality.trim() && (place.district || place.subregion)) {
            setLocality(place.district || place.subregion || "");
          }
          if (!state.trim() && place.region && INDIA_CITIES[place.region]) {
            setStateVal(place.region);
            if (!city.trim() && place.city && INDIA_CITIES[place.region].includes(place.city)) setCity(place.city);
          }
        })
        .catch(() => {});
    } catch (e: any) {
      const saved = (user as any)?.location;
      if (saved?.latitude != null && saved?.longitude != null) {
        setLat(Number(saved.latitude));
        setLng(Number(saved.longitude));
        clearErr("loc");
        if (!mapUrl.trim()) {
          setMapUrl(`https://maps.google.com/?q=${saved.latitude},${saved.longitude}`);
          clearErr("map");
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
    const choice = OPERATING_LOCATIONS.find((o) => o.value === operatingLocation);
    if (!choice) return showToast("Select where you run your business", "error");
    const businessType = choice.businessType;
    try {
      // The registration row is created here (or reused if a draft exists),
      // so opening the screen never needs the network.
      if (!s.business) await s.startRegistration(businessType, choice.value);
      else await s.saveStep1(businessType, choice.value);
      await s.getCategories(businessType);
      setStep(2);
    } catch (e) { err(e); }
  };

  const next2 = async () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Business name is required";
    if (mobile.replace(/\D/g, "").length < 10) errs.mobile = "Enter a valid 10-digit mobile number";
    if (flagErrors(errs, ["name", "mobile"])) return;
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
      const errs: Record<string, string> = {};
      if (!isOther && !categoryId) errs.cat = "Select a category";
      if (isOther && otherCategory.trim().length < 2) errs.other = "Enter your category";
      if (flagErrors(errs, ["cat", "other"])) return;
      if (isOther) {
        await s.saveStep3({ category_slug: "other", other_category: otherCategory.trim() });
      } else {
        await s.saveStep3({ category_id: categoryId as number });
      }
      setStep(4);
    } catch (e) { err(e); }
  };

  const next4 = async () => {
    if (!locationType) return showToast("Select where your business is located", "error");
    // Validate everything at once, flag every invalid field, scroll to the first.
    const errs: Record<string, string> = {};
    if (locationType === "within_society") {
      if (!user?.societyId) return showToast("Your account has no registered society", "error");
      if (!unitShop.trim()) errs.unit = "Unit / Shop no. is required";
    } else {
      if (lat == null || lng == null) errs.loc = "Tap 'Use my current location' to set the map pin";
      if (!mapUrl.trim()) errs.map = "Google Maps location is required";
      if (!unitShop.trim()) errs.unit = "Unit / Shop no. is required";
      if (!addr1.trim()) errs.addr1 = "Address line 1 is required";
      if (!pin.trim()) errs.pin = "PIN code is required";
      else if (!/^[1-9][0-9]{5}$/.test(pin.trim())) errs.pin = "Enter a valid 6-digit PIN code";
      if (!locality.trim()) errs.locality = "Area / locality is required";
      if (!state.trim()) errs.state = "Select a state";
      if (!city.trim()) errs.city = "Select a city";
    }
    setFe(errs);
    const order = ["loc", "map", "unit", "addr1", "pin", "locality", "state", "city"];
    const first = order.find((k) => errs[k]);
    if (first) {
      const y = containerY.current + (fieldY.current[first] ?? 0) - getHeight(16);
      scrollRef.current?.scrollToPosition?.(0, Math.max(0, y), true);
      return;
    }
    try {
      let payload: Step4Payload;
      if (locationType === "within_society") {
        payload = {
          location_type: "within_society",
          unit_shop_no: unitShop.trim(),
          ...(building.trim() ? { building_block: building.trim() } : {}),
          ...(mapUrl.trim() ? { google_maps_location: mapUrl.trim() } : {}),
          ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
        };
      } else {
        payload = {
          location_type: "outside_society",
          google_maps_location: mapUrl.trim(),
          latitude: lat as number, // validated non-null above
          longitude: lng as number,
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

  // Verification is optional — the user can continue to Step 6 without
  // choosing a registration type. If they do complete it, the proof/type is
  // saved as usual.
  const next5 = async () => {
    try {
      if (regType && regType !== "not_registered" && proofUri[0] && !isRemote(proofUri[0])) {
        await s.uploadRegistrationProof(toFile(proofUri[0], "proof.jpg"));
      }
      await s.saveStep5(regType ? { registration_type: regType } : {});
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
    const errs: Record<string, string> = {};
    if (bizPhone.replace(/\D/g, "").length < 10) errs.bizphone = "Enter a valid 10-digit business phone";
    if (flagErrors(errs, ["bizphone"])) return;
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
      onSubmitted(); // lets this session's success screen through the pending guard
      setStep(7);
      // Pull the backend state so Home/Profile switch to "Verification Pending" at once.
      const uid = useUserStore.getState().user?._id;
      if (uid) useUserStore.getState().fetchUser(uid).catch(() => {});
    } catch (e: any) {
      if (Array.isArray(e?.body?.missing_fields)) {
        showToast(`Missing: ${e.body.missing_fields.join(", ")}`, "error");
      } else {
        err(e);
      }
    }
  };

  const saving = s.saving || s.uploading || hydrating;

  // Blocked: never render the Business creation form for an existing
  // Business account — the effect above is already navigating away.
  if (isBusinessUser) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, step === 7 && styles.scrollDone]}
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
            <Text style={styles.title}>Where do you run your business?</Text>
            {OPERATING_LOCATIONS.map((o) => (
              <OptionCard
                key={o.value}
                label={o.label}
                subtitle={o.subtitle}
                icon={o.icon}
                selected={operatingLocation === o.value}
                onPress={() => setOperatingLocation(o.value)}
              />
            ))}
          </View>
        )}

        {step === 2 && (
          <View onLayout={(e) => { containerY.current = e.nativeEvent.layout.y; }}>
            <Text style={styles.title}>Basic details</Text>
            {fieldWrap("name", <TerraceTextField label="Business Name *" value={name} onChangeText={(v) => { setName(v); clearErr("name"); }} placeholder="Business name" error={fe.name || undefined} />, true)}
            {fieldWrap("mobile", <PhoneField label="Mobile *" value={mobile} onChange={(v) => { setMobile(v); clearErr("mobile"); }} invalid={!!fe.mobile} />)}
            <TerraceTextField label="Email (optional)" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
          </View>
        )}

        {step === 3 && (
          <View onLayout={(e) => { containerY.current = e.nativeEvent.layout.y; }}>
            <Text style={styles.title}>Select category</Text>
            {fieldWrap("cat", <TerraceSelectField
              label="Category"
              options={categoryOptions}
              selectedId={isOther ? OTHER_ID : categoryId != null ? String(categoryId) : null}
              onChange={(id) => {
                if (id === OTHER_ID) { setIsOther(true); setCategoryId(null); clearErr("cat"); return; }
                // Normal category: drop any custom text so it can't be submitted.
                setCategoryId(Number(id)); setIsOther(false); setOtherCategory(""); clearErr("cat");
              }}
              placeholder="Select a category"
              leftIcon="pricetag-outline"
              error={!!fe.cat}
            />)}
            {isOther ? (
              <TerraceTextField label="Custom category *" error={fe.other || undefined} value={otherCategory} onChangeText={(v) => { setOtherCategory(v.slice(0, OTHER_CATEGORY_MAX)); clearErr("other"); }} maxLength={OTHER_CATEGORY_MAX} helperText={`${otherCategory.length}/${OTHER_CATEGORY_MAX}`} placeholder="Enter your category" />
            ) : null}
          </View>
        )}

        {step === 4 && (
          <View onLayout={(e) => { containerY.current = e.nativeEvent.layout.y; }}>
            <Text style={styles.title}>{`Is your business located inside ${mySocietyName ?? "your society"}?`}</Text>
            <View style={styles.segRow}>
              {([["Yes", "within_society"], ["No", "outside_society"]] as const).map(([label, val]) => {
                const sel = locationType === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => { setLocationType(val); setFe({}); }}
                    style={[styles.segItem, sel && styles.segItemSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: sel }}
                  >
                    {sel ? <Ionicons name="checkmark-circle" size={getWidth(18)} color={TERRACE_COLORS.orange} style={{ marginRight: getWidth(6) }} /> : null}
                    <Text style={[styles.segText, sel && { color: TERRACE_COLORS.orange }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {locationType === "within_society" ? (
              <>
                {fieldWrap("unit", <TerraceTextField label="Unit / Shop No. *" value={unitShop} onChangeText={(v) => { setUnitShop(v); clearErr("unit"); }} placeholder="e.g. S-14" error={fe.unit || undefined} />, true)}
                <TerraceTextField label="Building / Tower / Block" value={building} onChangeText={setBuilding} placeholder="e.g. Tower B" />
                <TerraceTextField label="Google Maps Location" value={mapUrl} onChangeText={setMapUrl} placeholder="Map URL" autoCapitalize="none" />
              </>
            ) : locationType === "outside_society" ? (
              <>
                {fieldWrap("loc",
                <Pressable
                  onPress={captureLocation}
                  disabled={locating}
                  style={[styles.optionCard, lat != null && styles.optionCardSelected, !!fe.loc && { borderColor: "#DC2626" }]}
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
                    {locating
                      ? "Getting your location..."
                      : lat != null
                        ? `Location set (${lat.toFixed(4)}, ${lng?.toFixed(4)})`
                        : "Use my current location *"}
                  </Text>
                </Pressable>)}
                {fieldWrap("map", <TerraceTextField label="Google Maps Location *" value={mapUrl} onChangeText={(v) => { setMapUrl(v); clearErr("map"); }} placeholder="Map URL" autoCapitalize="none" error={fe.map || undefined} />, true)}
                {fieldWrap("unit", <TerraceTextField label="Unit / Shop No. *" value={unitShop} onChangeText={(v) => { setUnitShop(v); clearErr("unit"); }} placeholder="e.g. Shop 4" error={fe.unit || undefined} />, true)}
                <TerraceTextField label="Building / Block" value={building} onChangeText={setBuilding} placeholder="e.g. Sai Plaza" />
                {fieldWrap("addr1", <TerraceTextField label="Address Line 1 *" value={addr1} onChangeText={(v) => { setAddr1(v); clearErr("addr1"); }} placeholder="Street / road" error={fe.addr1 || undefined} />, true)}
                <TerraceTextField label="Address Line 2" value={addr2} onChangeText={setAddr2} placeholder="Landmark" />
                {fieldWrap("pin", <TerraceTextField label="PIN Code *" value={pin} onChangeText={(v) => { setPin(v.replace(/\D/g, "").slice(0, 6)); clearErr("pin"); }} placeholder="6-digit PIN" keyboardType="number-pad" maxLength={6} error={fe.pin || undefined} />, true)}
                {fieldWrap("locality", <TerraceTextField label="Area / Locality *" value={locality} onChangeText={(v) => { setLocality(v); clearErr("locality"); }} placeholder="Locality" error={fe.locality || undefined} />, true)}
                {fieldWrap("state", <TerraceSelectField label="State / UT *" options={stateOptions} selectedId={state || null} onChange={(id) => { setStateVal(id); setCity(""); clearErr("state"); }} placeholder="Select state" modalTitle="Select state / UT" leftIcon="map-outline" searchable error={!!fe.state} />)}
                {fieldWrap("city", <TerraceSelectField label="City *" options={cityOptions} selectedId={city || null} onChange={(c) => { setCity(c); clearErr("city"); }} placeholder={state ? "Select city" : "Select a state first"} modalTitle="Select city" leftIcon="location-outline" disabled={!state} searchable error={!!fe.city} />)}
              </>
            ) : null}
          </View>
        )}

        {step === 5 && (
          <View>
            <Text style={styles.title}>Verification</Text>
            <TerraceSelectField
              label="Registration Type (Optional)"
              options={REG_TYPES.map((r) => ({ id: r.value, name: r.label }))}
              selectedId={regType}
              onChange={(id) => setRegType(id as RegistrationType)}
              placeholder="Select registration type"
              leftIcon="document-text-outline"
            />
            {regType && regType !== "not_registered" ? (
              <ImagePickerField
                label="Registration Proof"
                mode="single"
                value={proofUri}
                onChange={setProofUri}
                max={1}
                aspectRatios={["4:5", "1:1", "16:9"]}
                defaultAspectRatio="4:5"
              />
            ) : null}
          </View>
        )}

        {step === 6 && (
          <View onLayout={(e) => { containerY.current = e.nativeEvent.layout.y; }}>
            <Text style={styles.title}>Business details</Text>
            <TerraceTextField label="Business Description (Optional)" value={description} onChangeText={setDescription} placeholder="About your business" multiline numberOfLines={4} />
            {fieldWrap("bizphone", <PhoneField label="Business Phone / WhatsApp *" value={bizPhone} onChange={(v) => { setBizPhone(v); clearErr("bizphone"); }} invalid={!!fe.bizphone} />)}
            <TerraceTextField label="Alternative Mobile (Optional)" value={altMobile} onChangeText={setAltMobile} placeholder="Alternate number" keyboardType="phone-pad" maxLength={13} />
            <TerraceTextField label="Email (Optional)" value={bizEmail} onChangeText={setBizEmail} placeholder="business@example.com" keyboardType="email-address" autoCapitalize="none" />
            <TerraceTextField label="Social Media / Website (Optional)" value={socialUrl} onChangeText={setSocialUrl} placeholder="https://..." autoCapitalize="none" />
            <ImagePickerField
              label="Logo"
              mode="single"
              value={logoUri}
              onChange={setLogoUri}
              max={1}
              aspectRatios={["1:1"]}
              defaultAspectRatio="1:1"
            />
            <ImagePickerField
              label="Photos (max 5)"
              mode="multiple"
              value={photoUris}
              onChange={onPhotosChange}
              max={5}
              aspectRatios={["4:5", "1:1", "16:9"]}
              defaultAspectRatio="4:5"
            />
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
            <View style={styles.doneBtn}><CountdownFillButton label="Go to Home" durationMs={3000} onComplete={() => router.dismissTo("/(tabs)/home")} /></View>
          </View>
        )}
      </KeyboardAwareScrollView>

      {step <= 6 ? (
        <View style={styles.footerBar}>
          <ActionButton
            title={step === 6 ? "Submit" : "Continues"}
            onPress={
              step === 1 ? next1 : step === 2 ? next2 : step === 3 ? next3 : step === 4 ? next4 : step === 5 ? next5 : next6
            }
            variant="primary"
            size="lg"
            fullWidth
            loading={saving}
            disabled={saving || (step === 1 && !operatingLocation)}
            containerStyle={styles.cta}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TERRACE_COLORS.screenBg },
  center: { alignItems: "center", justifyContent: "center", width: "100%" },
  // Success step: let the content group sit vertically centered in the free area.
  scrollDone: { flexGrow: 1, justifyContent: "center", paddingBottom: getHeight(48) },
  doneBtn: { width: "100%", marginTop: getHeight(24) },
  scroll: { paddingHorizontal: getWidth(20), paddingTop: getHeight(8), paddingBottom: getHeight(24) },
  stepperWrap: { marginTop: getHeight(12), marginBottom: getHeight(8) },
  title: {
    fontSize: getWidth(20),
    fontFamily: "Manrope_700Bold",
    color: TERRACE_COLORS.textDark,
    marginTop: getHeight(16),
    marginBottom: getHeight(14),
  },
  segRow: { flexDirection: "row", gap: getWidth(12), marginBottom: getHeight(12) },
  segItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: getWidth(14),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    paddingVertical: getHeight(14),
  },
  segItemSelected: { borderColor: TERRACE_COLORS.orange, backgroundColor: TERRACE_COLORS.greenTint },
  segText: { fontSize: getWidth(16), fontFamily: "Manrope_600SemiBold", color: TERRACE_COLORS.textDark },
  fieldError: { marginTop: -getHeight(8), marginBottom: getHeight(10), fontSize: getWidth(12), color: "#DC2626", fontFamily: "Manrope_500Medium" },
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
  optionCardSelected: { borderColor: TERRACE_COLORS.orange, backgroundColor: TERRACE_COLORS.greenTint },
  optionSubtitle: { marginTop: getHeight(4), fontSize: getWidth(13), color: TERRACE_COLORS.textMuted, fontFamily: "Manrope_400Regular" },
  optionLabel: { fontSize: getWidth(16),  fontFamily: "Manrope_600SemiBold", color: TERRACE_COLORS.textDark },
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
  cta: { borderRadius: getWidth(14), paddingVertical: getHeight(16), marginTop: getHeight(8) },
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
     fontFamily: "Manrope_600SemiBold",
    color: TERRACE_COLORS.textDark,
    marginBottom: getHeight(6),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: getWidth(8),
    borderWidth: 1.5,
    borderColor: TERRACE_COLORS.inputBorder,
    height: getHeight(50),
    overflow: "hidden",
  },
  cc: {
    paddingHorizontal: getWidth(14),
    fontSize: getWidth(16),
    fontFamily: "Manrope_700Bold",
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

export default function BusinessWizardScreen() {
  const [submittedHere, setSubmittedHere] = useState(false);
  const onSubmitted = useCallback(() => setSubmittedHere(true), []);
  return (
    <VerificationRouteGuard bypass={submittedHere}>
      <BusinessWizard onSubmitted={onSubmitted} />
    </VerificationRouteGuard>
  );
}
