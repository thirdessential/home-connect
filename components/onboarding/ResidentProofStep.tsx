import ActionButton from "@/components/inputs/ActionButton";
import { useImageUpload } from "@/lib/cloudinary";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { memo, useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  const { upload } = useImageUpload();
  const [proofType, setProofType] = useState<string>(PROOF_TYPES[0].id);
  const [documentUrl, setDocumentUrl] = useState<string | undefined>();
  const [selfieUrl, setSelfieUrl] = useState<string | undefined>();
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  const handleUploadDocument = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setUploadingDoc(true);
    try {
      const result = await upload(res.assets[0].uri, "resident-proof");
      setDocumentUrl(result.secure_url);
    } catch {
      // upload() already tracks its own error state; nothing to add here
    } finally {
      setUploadingDoc(false);
    }
  }, [upload]);

  const handleTakeSelfie = useCallback(async () => {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setUploadingSelfie(true);
    try {
      const result = await upload(res.assets[0].uri, "resident-selfies");
      setSelfieUrl(result.secure_url);
    } catch {
      // upload() already tracks its own error state; nothing to add here
    } finally {
      setUploadingSelfie(false);
    }
  }, [upload]);

  const canContinue = !!documentUrl && !uploadingDoc && !uploadingSelfie && !submitting;

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
          disabled={uploadingDoc}
          style={[styles.uploadBox, { borderColor: t.colors.border }]}
        >
          {uploadingDoc ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : (
            <Ionicons
              name={documentUrl ? "checkmark-circle" : "cloud-upload-outline"}
              size={20}
              color={documentUrl ? "#16A34A" : t.colors.primary}
            />
          )}
          <Text style={[styles.uploadText, { color: t.colors.textPrimary }]}>
            {documentUrl ? "Document uploaded" : "Upload Document"}
          </Text>
        </TouchableOpacity>
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
          disabled={uploadingSelfie}
          style={[styles.uploadBox, { borderColor: t.colors.border }]}
        >
          {uploadingSelfie ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : (
            <Ionicons
              name={selfieUrl ? "checkmark-circle" : "camera-outline"}
              size={20}
              color={selfieUrl ? "#16A34A" : t.colors.primary}
            />
          )}
          <Text style={[styles.uploadText, { color: t.colors.textPrimary }]}>
            {selfieUrl ? "Selfie captured" : "Take Selfie"}
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
