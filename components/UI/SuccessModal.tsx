import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButton from "../inputs/ActionButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode; // e.g. an event summary card
};

// Global success/confirmation bottom sheet — reused for "You're in!" (join)
// and "Event Published!" (create) per the reference designs, so the app
// doesn't grow a second one-off success screen for every new flow.
const SuccessModal = memo(function SuccessModal({
  visible,
  onClose,
  title,
  subtitle,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.cardBackground,
            borderTopLeftRadius: t.radii.large,
            borderTopRightRadius: t.radii.large,
            paddingHorizontal: t.spacing.l,
            paddingTop: t.spacing.xl,
            paddingBottom: insets.bottom + t.spacing.l,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: t.colors.brandWeak,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: t.spacing.m,
            }}
          >
            <Ionicons name="checkmark" size={40} color={t.colors.brandDark} />
          </View>

          <Text style={[t.typography.h2, { color: t.colors.heading2, textAlign: "center" }]}>{title}</Text>
          {subtitle ? (
            <Text style={[t.typography.body, { color: t.colors.secondaryText, textAlign: "center", marginTop: t.spacing.xs }]}>
              {subtitle}
            </Text>
          ) : null}

          {children ? <View style={{ width: "100%", marginTop: t.spacing.l }}>{children}</View> : null}

          {primaryActionLabel ? (
            <ActionButton
              title={primaryActionLabel}
              onPress={onPrimaryAction ?? onClose}
              variant="primary"
              size="lg"
              fullWidth
              containerStyle={{
                marginTop: t.spacing.l,
                width: "100%",
                backgroundColor: t.colors.brandDark,
                borderRadius: t.radii.round,
              }}
            />
          ) : null}
          {secondaryActionLabel ? (
            <Text
              onPress={onSecondaryAction ?? onClose}
              style={[t.typography.body, { color: t.colors.secondaryText, marginTop: t.spacing.m }]}
            >
              {secondaryActionLabel}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default SuccessModal;
