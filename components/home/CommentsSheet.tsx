import FormSheetModal from "@/components/modals/FormSheetModal";
import { useTheme } from "@/theme/theme";
import { HomeFeedComment } from "@/types/homeFeed.type";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  comments: HomeFeedComment[];
  onSubmit: (text: string) => Promise<void>;
};

/** Comment thread + composer. Submission is delegated to the caller. */
export default function CommentsSheet({ visible, onClose, comments, onSubmit }: Props) {
  const t = useTheme();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await onSubmit(value);
      setText("");
    } catch {
      // Caller surfaces the failure; keep the draft so nothing is lost.
    } finally {
      setSending(false);
    }
  }, [text, sending, onSubmit]);

  if (!visible) return null;

  // FormSheetModal's default body is a ScrollView. A FlatList inside that
  // triggers "VirtualizedLists should never be nested inside plain
  // ScrollViews" — so this uses `scroll={false}` (the modal's own escape
  // hatch for exactly this case) and puts the composer in `footer`, which
  // renders as a sibling below the body, not inside it.
  const composer = (
    <View style={styles.composer}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Add a comment…"
        placeholderTextColor={t.colors.textSecondary}
        multiline
        style={[
          styles.input,
          {
            color: t.colors.textPrimary,
            backgroundColor: t.colors.surfaceAlt,
            borderColor: t.colors.border,
          },
        ]}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || sending}
        style={[
          styles.send,
          { backgroundColor: t.colors.brand, opacity: !text.trim() || sending ? 0.5 : 1 },
        ]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={t.colors.onBrand} />
        ) : (
          <Ionicons name="send" size={16} color={t.colors.onBrand} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <FormSheetModal
      visible={visible}
      onClose={onClose}
      title="Comments"
      subtitle={`${comments.length} comment${comments.length === 1 ? "" : "s"}`}
      scroll={false}
      footer={composer}
    >
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: t.colors.textSecondary }]}>
            No comments yet. Be the first to reply.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.comment}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.fallback, { backgroundColor: t.colors.brand }]}>
                <Text style={[styles.initial, { color: t.colors.onBrand }]}>
                  {item.author.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.commentBody}>
              <Text style={[styles.author, { color: t.colors.textPrimary }]}>
                {item.author}
                <Text style={[styles.time, { color: t.colors.textSecondary }]}>
                  {`  ${item.createdAt}`}
                </Text>
              </Text>
              <Text style={[styles.text, { color: t.colors.textSecondary }]}>{item.text}</Text>
            </View>
          </View>
        )}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 150 },
  empty: { textAlign: "center", paddingVertical: 28, fontSize: 13 },
  comment: { flexDirection: "row", gap: 10, paddingVertical: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 12, fontWeight: "700" },
  commentBody: { flex: 1 },
  author: { fontSize: 13, fontWeight: "600" },
  time: { fontSize: 11, fontWeight: "400" },
  text: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  // FormSheetModal's footer slot already supplies the top border + spacing
  // above this (footerContainer), so this only needs the row layout.
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
