import FormSheetModal from "@/components/modals/FormSheetModal";
import ReportModal from "@/components/modals/ReportModal";
import UserAvatar from "@/components/UI/UserAvatar";
import { useTheme } from "@/theme/theme";
import { HomeFeedComment } from "@/types/homeFeed.type";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "@/components/common/Toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/** Characters (not words) — mirrors FEED_COMMENT_MAX on the server. */
const MAX_CHARS = 200;
// Code-point aware so emoji count once, matching the backend's [...text].length.
const clampChars = (v: string) => {
  const chars = Array.from(v);
  return chars.length > MAX_CHARS ? chars.slice(0, MAX_CHARS).join("") : v;
};
const charCount = (v: string) => Array.from(v).length;

type Props = {
  visible: boolean;
  onClose: () => void;
  comments: HomeFeedComment[];
  onSubmit: (text: string, parentCommentId?: string) => Promise<void>;
  feedId?: string; // needed to report an individual comment
};

/** Comment thread + composer. Submission is delegated to the caller. */
export default function CommentsSheet({ visible, onClose, comments, onSubmit, feedId }: Props) {
  const t = useTheme();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  // Synchronous lock — `sending` state alone lags a render, so a fast double
  // tap could slip two requests through.
  const submittingRef = useRef(false);

  // Open the keyboard as soon as the sheet appears. The Modal's slide-in
  // animation swallows an immediate focus() on iOS, hence the short delay.
  useEffect(() => {
    if (!visible) {
      setText("");
      setReplyTo(null);
      return;
    }
    const id = setTimeout(() => inputRef.current?.focus(), 350);
    return () => {
      clearTimeout(id);
      // Blur before the Modal's input is torn down so no keyboard event
      // resolves a focused view that no longer exists.
      Keyboard.dismiss();
    };
  }, [visible]);

  const startReply = useCallback((c: HomeFeedComment) => {
    setReplyTo({ id: c.parentId ?? c.id, author: c.author });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Top-level comments, each followed by its replies.
  const rows = useMemo(() => {
    const replies = new Map<string, HomeFeedComment[]>();
    comments.forEach((c) => {
      if (c.parentId) replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
    });
    return comments
      .filter((c) => !c.parentId)
      .flatMap((c) => [c, ...(replies.get(c.id) ?? [])]);
  }, [comments]);
  const topLevelCount = useMemo(() => comments.filter((c) => !c.parentId).length, [comments]);

  const handleSend = useCallback(async () => {
    const value = text.trim();
    if (!value || submittingRef.current) return;
    submittingRef.current = true;
    setSending(true);
    try {
      await onSubmit(value, replyTo?.id);
      setText("");
      setReplyTo(null);
    } catch (e: any) {
      // Keep the draft so nothing is lost.
      showToast(e?.message || "Couldn't post. Please try again.", "error");
    } finally {
      submittingRef.current = false;
      setSending(false);
    }
  }, [text, onSubmit, replyTo, showToast]);

  if (!visible) return null;

  // FormSheetModal's default body is a ScrollView. A FlatList inside that
  // triggers "VirtualizedLists should never be nested inside plain
  // ScrollViews" — so this uses `scroll={false}` (the modal's own escape
  // hatch for exactly this case) and puts the composer in `footer`, which
  // renders as a sibling below the body, not inside it.
  const composer = (
    <View>
      {replyTo && (
        <View style={styles.replyBanner}>
          <Text style={[styles.replyText, { color: t.colors.textSecondary }]} numberOfLines={1}>
            {`Replying to ${replyTo.author}`}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={t.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    <View style={styles.composer}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={(v) => setText(clampChars(v))}
        placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
        placeholderTextColor={t.colors.textSecondary}
        multiline
        returnKeyType="default"
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
      <Text
        style={[
          styles.counter,
          { color: charCount(text) >= MAX_CHARS ? t.colors.brand : t.colors.textSecondary },
        ]}
      >
        {`${charCount(text)}/${MAX_CHARS}`}
      </Text>
    </View>
  );

  return (
    <FormSheetModal
      visible={visible}
      onClose={onClose}
      title="Comments"
      subtitle={`${topLevelCount} comment${topLevelCount === 1 ? "" : "s"}`}
      scroll={false}
      footer={composer}
    >
      <FlatList
        data={rows}
        keyExtractor={(c) => c.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.empty, { color: t.colors.textSecondary }]}>
            No comments yet. Be the first to comment.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.comment, item.parentId ? styles.reply : null]}>
            <UserAvatar uri={item.avatarUrl} name={item.author} userId={item.authorId} size={32} />
            <View style={styles.commentBody}>
              <Text style={[styles.author, { color: t.colors.textPrimary }]}>
                {item.author}
                <Text style={[styles.time, { color: t.colors.textSecondary }]}>
                  {`  ${item.createdAt}`}
                </Text>
              </Text>
              <Text style={[styles.text, { color: t.colors.textSecondary }]}>{item.text}</Text>
              <TouchableOpacity onPress={() => startReply(item)} hitSlop={8} style={styles.replyBtn}>
                <Text style={[styles.replyLabel, { color: t.colors.textSecondary }]}>Reply</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setReportCommentId(item.id)} hitSlop={8} style={styles.commentMenu}>
              <Ionicons name="ellipsis-vertical" size={16} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />
      {feedId && (
        <ReportModal
          visible={!!reportCommentId}
          onClose={() => setReportCommentId(null)}
          reportType="comment"
          itemId={reportCommentId ?? ""}
          parentId={feedId}
        />
      )}
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 240 },
  reply: { marginLeft: 42 },
  replyBtn: { alignSelf: "flex-start", paddingTop: 4 },
  replyLabel: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  replyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  replyText: { fontSize: 12, flex: 1 },
  counter: { fontSize: 11, textAlign: "right", marginTop: 4 },
  empty: { textAlign: "center", paddingVertical: 28, fontSize: 13 },
  comment: { flexDirection: "row", gap: 10, paddingVertical: 10 },
  commentMenu: { padding: 4, alignSelf: "flex-start" },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 12, fontFamily: "Manrope_700Bold" },
  commentBody: { flex: 1 },
  author: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  time: { fontSize: 11, fontFamily: "Manrope_400Regular" },
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
