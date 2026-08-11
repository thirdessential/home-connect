import { useCallback, useEffect, useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import ActionButton from "../inputs/ActionButton";
import TextArea from "../inputs/TextArea";
import CloudinaryImagePickerField from "./CloudinaryImagePickerField";

export default function PostForm({
  onSubmit,
}: {
  onSubmit: (data: { text: string; images: string[] }) => void;
}) {
  const [formData, setFormData] = useState<{ text: string; images: string[] }>({
    text: "",
    images: [],
  });
  const [errors, setErrors] = useState<{ text?: string }>({});
  useEffect(() => {
    return () => {
      setFormData({ text: "", images: [] });
      setErrors({});
    };
  }, []);

  const handleChangeText = useCallback((val: string) => {
    setFormData((prev) => ({ ...prev, text: val }));
    if (val.trim()) setErrors({});
  }, []);

  const handleChangeImages = useCallback((images: string[]) => {
    setFormData((prev) => ({ ...prev, images }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.text.trim()) {
      setErrors({ text: "Please enter some text for your post." });
      return;
    }
    onSubmit({ text: formData.text, images: formData.images });
    setFormData({ text: "", images: [] });
    setErrors({});
  }, [formData, onSubmit]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 100}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextArea
          label="Post Content"
          value={formData.text}
          onChangeText={handleChangeText}
          lines={4}
          maxLength={230}
          error={errors.text}
          containerStyle={styles.textAreaContainer}
          placeholder="What's on your mind? Share an update, a question, or a simple thought..."
        />
        <CloudinaryImagePickerField
          label="Upload Item Photos"
          max={6}
          value={formData.images}
          onChange={handleChangeImages}
          tileSize={96}
          style={styles.imagePickerContainer}
        />
        <ActionButton
          title={"Post to Community"}
          onPress={handleSubmit}
          variant="primary"
          size="md"
          fullWidth
          containerStyle={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  textAreaContainer: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  imagePickerContainer: {
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    elevation: 0,
  },
  submitButton: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
