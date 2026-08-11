import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type FormSheetModalProps = {
  visible: boolean;
  onClose: () => void;

  // Header
  title: string;
  subtitle?: string;

  // Body
  children: ReactNode;
  scroll?: boolean; // default true
  contentContainerStyle?: StyleProp<ViewStyle>;

  // Footer (optional actions like Cancel/Save)
  footer?: ReactNode;

  // Behavior
  dismissOnBackdrop?: boolean; // default true
};

export default function FormSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  scroll = true,
  contentContainerStyle,
  footer,
  dismissOnBackdrop = true,
}: FormSheetModalProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
    const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
      const show = Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardOpen(true);
      });
  
      const hide = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardOpen(false);
      });
  
      return () => {
        show.remove();
        hide.remove();
      };
    }, []);

  const Header = (
    <View style={styles.headerRow}>
      {/* Spacer to keep title centered relative to close icon */}
      <View style={{ width: 24, height: 24 }} />

      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={[t.typography.h2, { color: t.colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...t.typography.body,
              color: t.colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={24} color={t.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const Body = scroll ? (
    <ScrollView
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      scrollEnabled={true}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentContainerStyle}>{children}</View>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : keyboardOpen ? "height" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={dismissOnBackdrop ? onClose : undefined}
            />
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: t.colors.surface,
                  paddingBottom: insets.bottom + 16,
                  maxHeight: "80%",
                },
              ]}
            >
              {Header}
              {Body}
              {footer ? (
                <View style={styles.footerContainer}>{footer}</View>
              ) : null}
            </View>
          </View>
        {/* </TouchableWithoutFeedback> */}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  footerContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
