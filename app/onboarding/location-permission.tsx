import { LOCATION_SCREEN, TERRACE_COLORS } from "@/assets/constants/auth.constant";
import TerraceHeader from "@/components/auth/TerraceHeader";
import { useToast } from "@/components/common/Toast";
import ActionButton from "@/components/inputs/ActionButton";
import { useUserStore } from "@/store/useUserStore";
import { getHeight, getWidth } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Best-effort human-readable address from reverse geocoding. Falls back to
// null (not blocking) — the coordinates are what the backend actually gates on.
async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return null;
    return [place.name, place.street, place.city, place.region, place.postalCode]
      .filter(Boolean)
      .join(", ");
  } catch {
    return null;
  }
}

export default function LocationPermissionScreen() {
  const { showToast } = useToast();
  const saveLocation = useUserStore((s) => s.saveLocation);
  const [loading, setLoading] = useState(false);
  const settledRef = useRef(false);

  const goNext = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    router.replace("/onboarding/select-society");
  }, []);

  const captureAndSave = useCallback(async () => {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;
    const address = await reverseGeocode(latitude, longitude);

    await AsyncStorage.setItem(
      LOCATION_SCREEN.STORAGE_KEY,
      JSON.stringify({ latitude, longitude, address }),
    );
    await saveLocation({ address: address ?? undefined, latitude, longitude });
  }, [saveLocation]);

  // Skip this screen if location access has already been granted — but still
  // capture and persist coordinates first, since the society list is gated on
  // the backend having a saved location.
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;
      setLoading(true);
      try {
        await captureAndSave();
      } catch (e) {
        console.warn("Location error:", e);
      } finally {
        setLoading(false);
        goNext();
      }
    })();
  }, [captureAndSave, goNext]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  }, []);

  const handleAllow = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(LOCATION_SCREEN.deniedToast, "info");
        goNext();
        return;
      }
      await captureAndSave();
      showToast(LOCATION_SCREEN.savedToast, "success");
      goNext();
    } catch (e: any) {
      console.warn("Location error:", e);
      showToast(e?.message || LOCATION_SCREEN.errorToast, "error");
    } finally {
      setLoading(false);
    }
  }, [captureAndSave, goNext, showToast]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <TerraceHeader compact onBack={goBack} />

        <View style={styles.badge}>
          <Ionicons name="location" size={getWidth(28)} color={TERRACE_COLORS.orange} />
        </View>

        <Text style={styles.title}>{LOCATION_SCREEN.title}</Text>
        <Text style={styles.subtitle}>{LOCATION_SCREEN.subtitle}</Text>

        {/* Illustration */}
        <View style={styles.illustration}>
          <View style={styles.shield}>
            <Ionicons name="shield-checkmark" size={getWidth(56)} color="#fff" />
          </View>
          <Ionicons
            name="business-outline"
            size={getWidth(40)}
            color={TERRACE_COLORS.textMuted}
            style={styles.building1}
          />
          <Ionicons
            name="business-outline"
            size={getWidth(52)}
            color="#C9C6BF"
            style={styles.building2}
          />
        </View>

        <View style={styles.actions}>
          <ActionButton
            title={LOCATION_SCREEN.allow}
            onPress={handleAllow}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            leftIcon={
              <Ionicons name="paper-plane" size={getWidth(18)} color="#fff" />
            }
            containerStyle={styles.primaryBtn}
          />
          <ActionButton
            title={LOCATION_SCREEN.notNow}
            onPress={goNext}
            variant="outline"
            size="lg"
            fullWidth
            disabled={loading}
            containerStyle={styles.outlineBtn}
          />
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="lock-closed-outline"
            size={getWidth(15)}
            color={TERRACE_COLORS.textMuted}
          />
          <Text style={styles.footerText}>{LOCATION_SCREEN.footer}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TERRACE_COLORS.screenBg,
  },
  container: {
    flex: 1,
    paddingHorizontal: getWidth(24),
    paddingTop: getHeight(8),
  },
  badge: {
    width: getWidth(64),
    height: getWidth(64),
    borderRadius: getWidth(32),
    backgroundColor: TERRACE_COLORS.orangeTint,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: getHeight(28),
  },
  title: {
    fontSize: getWidth(26),
    fontWeight: "700",
    color: TERRACE_COLORS.textDark,
    textAlign: "center",
    marginTop: getHeight(16),
  },
  subtitle: {
    fontSize: getWidth(15),
    lineHeight: getHeight(22),
    color: TERRACE_COLORS.textMuted,
    textAlign: "center",
    marginTop: getHeight(10),
    paddingHorizontal: getWidth(16),
  },
  illustration: {
    flex: 1,
    marginTop: getHeight(24),
    marginBottom: getHeight(16),
    // Edge-to-edge: break out of the container's horizontal padding.
    marginHorizontal: -getWidth(24),
    backgroundColor: "#F3EEE4",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shield: {
    width: getWidth(96),
    height: getWidth(96),
    borderRadius: getWidth(20),
    backgroundColor: TERRACE_COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: TERRACE_COLORS.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  building1: {
    position: "absolute",
    left: getWidth(48),
    top: getHeight(40),
  },
  building2: {
    position: "absolute",
    right: getWidth(44),
    bottom: getHeight(40),
  },
  actions: {
    gap: getHeight(12),
  },
  primaryBtn: {
    borderRadius: getWidth(28),
    paddingVertical: getHeight(16),
  },
  outlineBtn: {
    borderRadius: getWidth(28),
    paddingVertical: getHeight(15),
    borderWidth: 1.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: getHeight(16),
    marginBottom: getHeight(6),
  },
  footerText: {
    fontSize: getWidth(13),
    color: TERRACE_COLORS.textMuted,
    marginLeft: getWidth(8),
  },
});
