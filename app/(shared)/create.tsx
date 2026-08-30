import { useToast } from "@/components/common/Toast";
import { useCreatePostModal } from "@/hooks/useCreatePostModal";
import { pickImageCropped } from "@/lib/ImagePicker";
import { uploadToBackend } from "@/lib/backendUpload";
import { useFeedsStore } from "@/store/useFeedsStore";
import { useSocietyStore } from "@/store/useSocietyStore";
import { useUserStore } from "@/store/useUserStore";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ImgStatus = "uploading" | "success" | "failed";

const MAX_LEN = 300;

type CreateOption = {
  key: "post" | "event" | "poll" | "business";
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const OPTIONS: CreateOption[] = [
  { key: "post", label: "Post", icon: "create-outline", color: "#166534" },
  { key: "event", label: "Event", icon: "calendar-outline", color: "#7C3AED" },
  { key: "poll", label: "Poll", icon: "bar-chart-outline", color: "#D97706" },
  { key: "business", label: "Business", icon: "storefront-outline", color: "#0D9488" },
];

/** Full-screen Create page — reference: preview/craete-option.html.
 * Post is composed + submitted here via the existing feed store/API.
 * Event/Poll/Business hand off to their existing, already-working flows
 * rather than re-implementing them. */
export default function CreatePostScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { openWithForm } = useCreatePostModal();

  const currentUser = useUserStore((s) => s.user);
  const societyId = useUserStore((s) => (s.user as any)?.societyId);
  const societyName = useSocietyStore((s) => s.selectedSociety?.name);
  const createFeed = useFeedsStore((s) => s.createFeed);
  const addFeedOptimistically = useFeedsStore((s) => s.addFeedOptimistically);

  const [selected, setSelected] = useState<CreateOption["key"]>("post");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<{ localUri: string; status: ImgStatus; url?: string } | null>(null);

  // Photo → device camera; Gallery → device photo library. pickImageCropped
  // already requests/handles permissions (with a clear denial alert) and
  // returns null on cancel — no separate permission code needed here.
  const runUpload = useCallback(async (localUri: string) => {
    setImage({ localUri, status: "uploading" });
    try {
      const url = await uploadToBackend(localUri);
      setImage({ localUri, status: "success", url });
    } catch {
      setImage({ localUri, status: "failed" });
    }
  }, []);

  const handlePhoto = useCallback(async () => {
    const asset = await pickImageCropped("camera", { quality: 0.85 });
    if (!asset?.uri) return; // denied or cancelled — pickImageCropped already alerted
    await runUpload(asset.uri);
  }, [runUpload]);

  const handleGallery = useCallback(async () => {
    const asset = await pickImageCropped("library", { quality: 0.85 });
    if (!asset?.uri) return;
    await runUpload(asset.uri);
  }, [runUpload]);

  const handleRemoveImage = useCallback(() => setImage(null), []);
  const handleRetryImage = useCallback(() => {
    if (image) runUpload(image.localUri);
  }, [image, runUpload]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home");
  }, []);

  const handleSelectOption = useCallback(
    (key: CreateOption["key"]) => {
      setSelected(key);
      if (key === "post") return;
      if (key === "event") {
        router.push("/(shared)/create-event");
        return;
      }
      // Poll / Business reuse the existing, already-working modal flows —
      // not rebuilt here per this task's scope.
      openWithForm(key === "poll" ? "poll" : "createBusiness");
    },
    [openWithForm],
  );

  const handlePost = useCallback(async () => {
    const content = text.trim();
    if (!content || submitting || image?.status === "uploading") return;
    setSubmitting(true);
    try {
      const societyIdStr =
        typeof societyId === "object" && societyId !== null ? societyId._id : societyId;
      const towerName =
        typeof societyId === "object" && societyId !== null ? societyId.name : undefined;
      // Only a successful backend URL is ever sent — never the local file:// URI.
      const images = image?.status === "success" && image.url ? [image.url] : [];

      addFeedOptimistically({
        _id: `temp-${Date.now()}`,
        type: "post",
        content,
        images,
        user: currentUser
          ? {
              _id: currentUser._id,
              fullName: currentUser.fullName,
              profilePhotoUrl: currentUser.profilePhotoUrl,
              flatNo: currentUser.flatNo,
            }
          : undefined,
        society: societyIdStr,
        flatNo: currentUser?.flatNo,
        towerName,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);

      await createFeed({
        type: "post",
        content,
        images,
        user: currentUser?._id,
        society: societyIdStr,
        flatNo: currentUser?.flatNo,
        towerName,
      } as any);

      setText("");
      setImage(null);
      goBack();
    } catch (err: any) {
      showToast(err?.message || "Failed to create post. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, image, currentUser, societyId, createFeed, addFeedOptimistically, goBack, showToast]);

  return (
    <View style={[styles.root, { backgroundColor: t.colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={t.colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>Create Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!text.trim() || submitting}
          style={[
            styles.postBtn,
            { backgroundColor: t.colors.brand, opacity: !text.trim() || submitting ? 0.5 : 1 },
          ]}
        >
          <Text style={styles.postBtnText}>{submitting ? "Posting…" : "Post"}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.userRow, { backgroundColor: t.colors.surface }]}>
            {currentUser?.profilePhotoUrl ? (
              <Image source={{ uri: currentUser.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: t.colors.brandWeak }]}>
                <Text style={{ color: t.colors.brandDark, fontWeight: "700" }}>
                  {(currentUser?.fullName || "U").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: t.colors.textPrimary }]}>
                {currentUser?.fullName || "Resident"}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={t.colors.textSecondary} />
                <Text style={[styles.locationText, { color: t.colors.textSecondary }]} numberOfLines={1}>
                  {[currentUser?.flatNo, societyName].filter(Boolean).join(", ") || "Society not set"}
                </Text>
                <Text style={{ color: t.colors.textSecondary }}>•</Text>
                <Ionicons name="globe-outline" size={12} color={t.colors.textSecondary} />
              </View>
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <View style={[styles.composer, { borderColor: t.colors.border }]}>
              <TextInput
                value={text}
                onChangeText={(v) => setText(v.slice(0, MAX_LEN))}
                placeholder="What's on your mind, neighbours?"
                placeholderTextColor={t.colors.textSecondary}
                multiline
                maxLength={MAX_LEN}
                style={[styles.textArea, { color: t.colors.textPrimary }]}
              />

              {image && (
                <View style={[styles.imagePreview, { borderColor: t.colors.border }]}>
                  <Image source={{ uri: image.localUri }} style={styles.imagePreviewImg} />
                  {image.status === "uploading" && (
                    <View style={styles.imageOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                  {image.status === "failed" && (
                    <TouchableOpacity style={styles.imageOverlay} onPress={handleRetryImage}>
                      <Ionicons name="refresh" size={20} color="#fff" />
                      <Text style={styles.retryText}>Retry upload</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}>
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.composerFooter}>
                <View style={styles.composerActions}>
                  <TouchableOpacity onPress={handlePhoto} style={[styles.chip, { borderColor: t.colors.border }]}>
                    <Ionicons name="camera-outline" size={16} color={t.colors.brand} />
                    <Text style={[styles.chipText, { color: t.colors.textPrimary }]}>Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleGallery} style={[styles.chip, { borderColor: t.colors.border }]}>
                    <Ionicons name="image-outline" size={16} color={t.colors.brand} />
                    <Text style={[styles.chipText, { color: t.colors.textPrimary }]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.counter, { color: t.colors.textSecondary }]}>
                  {text.length}/{MAX_LEN}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: t.colors.surface }]}>
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
              <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>Create Something</Text>
              <View style={[styles.divider, { backgroundColor: t.colors.border }]} />
            </View>

            <View style={styles.optionsGrid}>
              {OPTIONS.map((opt) => {
                const isSelected = selected === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => handleSelectOption(opt.key)}
                    style={styles.optionItem}
                  >
                    <View style={[styles.optionCircle, { backgroundColor: t.colors.surfaceAlt }]}>
                      <Ionicons name={opt.icon} size={24} color={opt.color} />
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? opt.color : t.colors.textPrimary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && <View style={[styles.optionUnderline, { backgroundColor: opt.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <View style={[styles.banner, { backgroundColor: t.colors.brandWeak, borderColor: t.colors.brand + "40" }]}>
              <Ionicons name="shield-checkmark" size={20} color={t.colors.brandDark} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: t.colors.brandDark }]}>
                  We keep Terrace positive and spam free.
                </Text>
                <Text style={[styles.bannerSubtitle, { color: t.colors.textSecondary }]}>
                  No harmful or disruptive content.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  postBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  postBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 15, fontWeight: "700" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  locationText: { fontSize: 12, flexShrink: 1 },
  composer: { borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 220 },
  textArea: { flex: 1, fontSize: 16, textAlignVertical: "top" },
  imagePreview: {
    marginTop: 12,
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  imagePreviewImg: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "600", marginTop: 4 },
  removeImageBtn: { position: "absolute", top: 8, right: 8 },
  composerFooter: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 12 },
  composerActions: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  counter: { fontSize: 12 },
  section: { paddingVertical: 20, paddingHorizontal: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  divider: { flex: 1, height: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "700", paddingHorizontal: 12 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around" },
  optionItem: { width: "30%", alignItems: "center", gap: 6, marginBottom: 16 },
  optionCircle: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  optionLabel: { fontSize: 13, fontWeight: "600" },
  optionUnderline: { width: 28, height: 2, borderRadius: 1, marginTop: 2 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  bannerTitle: { fontSize: 13, fontWeight: "700" },
  bannerSubtitle: { fontSize: 11, marginTop: 2 },
});
