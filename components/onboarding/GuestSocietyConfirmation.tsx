import { useSocietyStore } from "@/store/useSocietyStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GuestSocietyConfirmationProps {
  onConfirm: () => void;
  onChangeSociety: () => void;
  onNotAResident?: () => void;
}

export default function GuestSocietyConfirmation({
  onConfirm,
  onChangeSociety,
  onNotAResident,
}: GuestSocietyConfirmationProps) {
  const t = useTheme();
  const societyName = useSocietyStore((s) => s.selectedSociety?.name);

  return (
    <View style={styles.container}>
      {/* Society icon */}
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: t.colors.lightBackground },
        ]}
      >
        <Ionicons name="business-outline" size={36} color={t.colors.primary} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: t.colors.textPrimary }]}>
        Confirm Your Society
      </Text>

      {/* Society name pill */}
      <View
        style={[
          styles.societyPill,
          {
            backgroundColor: t.colors.lightBackground,
            borderColor: t.colors.border,
          },
        ]}
      >
        <Ionicons name="location-outline" size={16} color={t.colors.primary} />
        <Text
          style={[styles.societyName, { color: t.colors.primary }]}
          numberOfLines={1}
        >
          {societyName ?? "Unknown Society"}
        </Text>
      </View>

      {/* Warning */}
      <View
        style={[
          styles.warningBox,
          { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
        ]}
      >
        <Ionicons
          name="warning-outline"
          size={16}
          color="#92400E"
          style={styles.warningIcon}
        />
        <Text style={styles.warningText}>
          Once registered, your society cannot be changed. Please make sure you
          are registering in the correct society.
        </Text>
      </View>

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: t.colors.primary }]}
        onPress={onConfirm}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmButtonText}>I live here, register me</Text>
      </TouchableOpacity>

      {/* Does not live here — direct business registration */}
      {onNotAResident && (
        <TouchableOpacity
          style={[styles.notAResidentButton, { borderColor: t.colors.border }]}
          onPress={onNotAResident}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={t.colors.textSecondary}
          />
          <Text
            style={[
              styles.notAResidentButtonText,
              { color: t.colors.textSecondary },
            ]}
          >
            I don&apos;t live here, register my business
          </Text>
        </TouchableOpacity>
      )}

      {/* Change society link */}
      <TouchableOpacity
        style={styles.changeLink}
        onPress={onChangeSociety}
        activeOpacity={0.7}
      >
        <Ionicons
          name="swap-horizontal-outline"
          size={15}
          color={t.colors.primary}
        />
        <Text style={[styles.changeLinkText, { color: t.colors.primary }]}>
          Register in a different society
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  societyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    maxWidth: "100%",
  },
  societyName: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  confirmButton: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  notAResidentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  notAResidentButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  changeLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  changeLinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
