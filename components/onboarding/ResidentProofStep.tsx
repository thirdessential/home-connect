import ActionButton from "@/components/inputs/ActionButton";
import { pickImageCropped } from "@/lib/ImagePicker";
import { uploadToBackend } from "@/lib/backendUpload";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type UploadStatus = "idle" | "uploading" | "success" | "failed";

const PROOF_TYPES = [
  { id: "aadhaar", label: "Aadhaar Card", icon: "card-outline" as const },
  { id: "rent_agreement", label: "Rent Agreement", icon: "document-text-outline" as const },
  { id: "electricity_bill", label: "Electricity Bill", icon: "flash-outline" as const },
  { id: "maintenance_bill", label: "Maintenance Bill", icon: "business-outline" as const },
  { id: "other", label: "Other", icon: "ellipsis-horizontal" as const },
];

export type ResidentProofResult = {
  resident_proof_type?: string;
  document_url?: string;
  selfie_url?: string;
};

type Props = {
  onContinue: (data: ResidentProofResult) => void;
  submitting?: boolean;
};

function ResidentProofStep({ onContinue, submitting }: Props) {
  const t = useTheme();
  const [proofType, setProofType] = useState<string>(PROOF_TYPES[0].id);
  const [documentUrl, setDocumentUrl] = useState<string | undefined>();
  const [selfieUrl, setSelfieUrl] = useState<string | undefined>();
  const [docStatus, setDocStatus] = useState<UploadStatus>("idle");
  const [selfieStatus, setSelfieStatus] = useState<UploadStatus>("idle");

  const handleUploadDocument = useCallback(async () => {
    const asset = await pickImageCropped("library", { quality: 0.85 });
    if (!asset?.uri) return;
    setDocumentUrl(undefined);
    setDocStatus("uploading");
    try {
      const url = await uploadToBackend(asset.uri);
      setDocumentUrl(url);
      setDocStatus("success");
    } catch {
      setDocStatus("failed");
    }
  }, []);

  const handleRemoveDocument = useCallback(() => {
    setDocumentUrl(undefined);
    setDocStatus("idle");
  }, []);

  const handleTakeSelfie = useCallback(async () => {
    const asset = await pickImageCropped("camera", { quality: 0.85 });
    if (!asset?.uri) return;
    setSelfieUrl(undefined);
    setSelfieStatus("uploading");
    try {
      const url = await uploadToBackend(asset.uri);
      setSelfieUrl(url);
      setSelfieStatus("success");
    } catch {
      setSelfieStatus("failed");
    }
  }, []);

  // Required: a real backend URL, not just a local file selection/in-flight upload.
  const canContinue =
    docStatus === "success" && !!documentUrl && selfieStatus !== "uploading" && !submitting;

  return (
    <View style={styles.container}>
      <View style={[styles.infoBox, { backgroundColor: t.colors.primary + "12" }]}>
        <Ionicons name="shield-checkmark" size={18} color={t.colors.primary} />
        <Text style={[styles.infoText, { color: t.colors.textPrimary }]}>
          Society admins will be doing the verification. Incorrect details may
          lead to rejection.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>
            Residence Proof
          </Text>
          <View style={[styles.requiredBadge, { backgroundColor: "#DCFCE7" }]}>
            <Text style={styles.requiredBadgeText}>Required</Text>
          </View>
        </View>
        <Text style={[styles.sectionSubtitle, { color: t.colors.textSecondary }]}>
          Upload any one document.
        </Text>

        <View style={styles.chipRow}>
          {PROOF_TYPES.map((p) => {
            const isSelected = proofType === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setProofType(p.id)}
                style={[
                  styles.proofChip,
                  { borderColor: isSelected ? t.colors.primary : t.colors.border },
                ]}
              >
                <Ionicons
                  name={p.icon}
                  size={20}
                  color={isSelected ? t.colors.primary : t.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.proofChipText,
                    { color: isSelected ? t.colors.primary : t.colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleUploadDocument}
          disabled={docStatus === "uploading"}
          style={[
            styles.uploadBox,
            { borderColor: docStatus === "failed" ? "#DC2626" : t.colors.border },
          ]}
        >
          {docStatus === "uploading" ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : (
            <Ionicons
              name={
                docStatus === "success"
                  ? "checkmark-circle"
                  : docStatus === "failed"
                    ? "alert-circle"
                    : "cloud-upload-outline"
              }
              size={20}
              color={docStatus === "success" ? "#16A34A" : docStatus === "failed" ? "#DC2626" : t.colors.primary}
            />
          )}
          <Text
            style={[
              styles.uploadText,
              { color: docStatus === "failed" ? "#DC2626" : t.colors.textPrimary },
            ]}
          >
            {docStatus === "uploading"
              ? "Uploading..."
              : docStatus === "success"
                ? "✓ Document uploaded"
                : docStatus === "failed"
                  ? "Upload failed — tap to retry"
                  : "Upload verification document"}
          </Text>
        </TouchableOpacity>
        {docStatus === "success" && (
          <TouchableOpacity onPress={handleRemoveDocument} style={styles.removeRow}>
            <Ionicons name="trash-outline" size={14} color="#DC2626" />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
        {docStatus === "idle" && (
          <Text style={[styles.sectionSubtitle, { color: "#DC2626" }]}>
            Please upload the required verification document.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>Selfie</Text>
          <View style={[styles.requiredBadge, { backgroundColor: "#F3F4F6" }]}>
            <Text style={[styles.requiredBadgeText, { color: "#6B7280" }]}>Optional</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleTakeSelfie}
          disabled={selfieStatus === "uploading"}
          style={[styles.uploadBox, { borderColor: t.colors.border }]}
        >
          {selfieStatus === "uploading" ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : (
            <Ionicons
              name={selfieStatus === "success" ? "checkmark-circle" : "camera-outline"}
              size={20}
              color={selfieStatus === "success" ? "#16A34A" : t.colors.primary}
            />
          )}
          <Text style={[styles.uploadText, { color: t.colors.textPrimary }]}>
            {selfieStatus === "uploading"
              ? "Uploading..."
              : selfieStatus === "success"
                ? "✓ Selfie captured"
                : selfieStatus === "failed"
                  ? "Upload failed — tap to retry"
                  : "Take Selfie"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.locationRow, { borderColor: t.colors.border }]}>
        <Ionicons name="location-outline" size={18} color={t.colors.textSecondary} />
        <Text style={[styles.locationText, { color: t.colors.textPrimary }]}>
          Location has been shared
        </Text>
        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
      </View>

      <ActionButton
        title="Continue"
        onPress={() =>
          onContinue({ resident_proof_type: proofType, document_url: documentUrl, selfie_url: selfieUrl })
        }
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={!canContinue}
        containerStyle={{ marginTop: 4 }}
      />
    </View>
  );
}

export default memo(ResidentProofStep);

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  requiredBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  proofChip: {
    width: "18%",
    minWidth: 64,
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  proofChipText: {
    fontSize: 10,
    textAlign: "center",
  },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
  },
  removeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
});
