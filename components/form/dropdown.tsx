import { BusinessCategory } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/theme";
import { Card } from "../UI/Card";

type Props = {
  label: string;
  options: BusinessCategory[];
  selectedId: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  modalTitle?: string;
  testID?: string;
  noOption?: boolean;
  error?: boolean;
  disabled?: boolean;
};

export default function SelectField({
  label,
  options,
  selectedId,
  onChange,
  placeholder = "Select…",
  style,
  modalTitle = "Select option",
  testID,
  noOption = false,
  error = false,
  disabled = false,
}: Props) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  // Add "Other" option if noOption is true
  const finalOptions = useMemo(() => {
    if (noOption) {
      return [...options, { id: "other", name: "Other" }];
    }
    return options;
  }, [options, noOption]);

  const selected = useMemo(
    () => finalOptions.find((o) => o.id === selectedId)?.name,
    [finalOptions, selectedId]
  );

  const borderColor = error ? "#EF4444" : t.colors.border;
  const surface = t.colors.surface;
  const textPrimary = t.colors.textPrimary;
  const textSecondary = t.colors.textSecondary;

  return (
    <View style={[style, disabled && { opacity: 0.5 }]} testID={testID}>
      {/* Field container (relative for floating label) */}
      <View style={{ position: "relative" }}>
        {/* Floating label sitting on the border */}
        <TouchableOpacity
          // pressing the label also opens the picker
          onPress={() => {
            if (!disabled) setOpen(true);
          }}
          style={{
            position: "absolute",
            left: t.spacing.m - 4,
            top: -6, // sits inside the top border
            zIndex: 2,
            backgroundColor: surface,
            paddingHorizontal: 6,
            borderRadius: 6,
          }}
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${selected ?? placeholder}`}
          disabled={disabled}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: textSecondary,
            }}
          >
            {label}
          </Text>
        </TouchableOpacity>

        {/* Trigger / field */}
        <TouchableOpacity
          onPress={() => {
            if (!disabled) setOpen(true);
          }}
          accessibilityRole="button"
          style={{
            borderWidth: 1,
            borderColor,
            backgroundColor: surface,
            borderRadius: t.radii.m,
            paddingHorizontal: t.spacing.m,
            minHeight: 48,
            justifyContent: "center",
            opacity: disabled ? 0.7 : 1,
          }}
          disabled={disabled}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: selected ? textPrimary : textSecondary,
                fontWeight: selected ? "600" : "400",
              }}
            >
              {selected ?? placeholder}
            </Text>
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={18}
              color={textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal list */}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: 16,
            justifyContent: "flex-end",
          }}
        >
          <Card style={{ maxHeight: "70%" }}>
            <Text
              style={{
                ...t.typography.h3,
                color: textPrimary,
                marginBottom: 8,
              }}
            >
              {modalTitle}
            </Text>

            <FlatList
              data={finalOptions}
              keyExtractor={(x) => x.id}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const isSel = item.id === selectedId;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                    style={{
                      paddingVertical: t.spacing.m,
                      paddingHorizontal: t.spacing.m,
                      borderRadius: t.radii.m,
                      backgroundColor: isSel
                        ? t.colors.primaryWeak
                        : t.colors.surfaceAlt,
                    }}
                  >
                    <Text
                      style={{
                        color: isSel ? t.colors.primaryStrong : textPrimary,
                        fontWeight: isSel ? "700" : "500",
                      }}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
            />

            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={{ alignSelf: "center", marginTop: 12, padding: 8 }}
            >
              <Text style={{ color: textSecondary, fontWeight: "600" }}>
                Close
              </Text>
            </TouchableOpacity>
          </Card>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
