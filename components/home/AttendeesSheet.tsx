import FormSheetModal from "@/components/modals/FormSheetModal";
import { useTheme } from "@/theme/theme";
import { HomeFeedAttendee } from "@/types/homeFeed.type";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  attendees: HomeFeedAttendee[];
};

/** "See all" attendee list for an event card. */
export default function AttendeesSheet({ visible, onClose, attendees }: Props) {
  const t = useTheme();
  if (!visible) return null;

  return (
    <FormSheetModal
      visible={visible}
      onClose={onClose}
      title="Attending"
      subtitle={`${attendees.length} neighbour${attendees.length === 1 ? "" : "s"}`}
    >
      <FlatList
        data={attendees}
        keyExtractor={(a) => a.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.fallback, { backgroundColor: t.colors.brand }]}>
                <Text style={[styles.initial, { color: t.colors.onBrand }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[styles.name, { color: t.colors.textPrimary }]}>{item.name}</Text>
          </View>
        )}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 16, maxHeight: 400 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 13, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "500" },
});
