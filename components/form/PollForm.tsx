import { toKebab } from "@/lib/utils";
import { BusinessCategory } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../inputs/ActionButton";
import TextField from "../inputs/TextField";

type PollFormProps = {
  onSubmit: (data: { question: string; options: BusinessCategory[] }) => void;
  loading?: boolean;
  error?: string | null;
};

export default function PollForm({
  onSubmit,
  loading = false,
  error,
}: PollFormProps) {
  const [question, setQuestion] = useState("");
  const [errors, setErrors] = useState<{
    question?: string;
    options?: string[];
  }>({});
  const [options, setOptions] = useState<BusinessCategory[]>([
    { id: "", name: "" },
    { id: "", name: "" },
  ]);

  const handleOptionChange = useCallback(
    (text: string, idx: number) => {
      setOptions((prev) => {
        const updated = prev.map((opt, i) =>
          i === idx ? { ...opt, name: text, id: toKebab(text) } : opt
        );
        // Clear error if now at least 2 options are filled
        const validOptions = updated.map((o) => o.name.trim()).filter(Boolean);
        if (validOptions.length >= 2 && errors.options) {
          setErrors((prevErr) => ({ ...prevErr, options: undefined }));
        }
        return updated;
      });
    },
    [errors.options]
  );

  const handleAddOption = useCallback(() => {
    if (options.length < 5)
      setOptions((prev) => [...prev, { id: "", name: "" }]);
  }, [options.length]);

  const handleRemoveOption = useCallback(
    (idx: number) => {
      if (options.length > 2)
        setOptions((prev) => prev.filter((_, i) => i !== idx));
    },
    [options.length]
  );

  const handleSubmit = useCallback(() => {
    let valid = true;
    const validOptions = options
      .map((o) => ({ ...o, name: o.name.trim() }))
      .filter((o) => o.name);
    if (!question.trim()) {
      setErrors((prev) => ({
        ...prev,
        question: "Please enter a poll question.",
      }));
      valid = false;
    } else {
      setErrors((prev) => ({ ...prev, question: undefined }));
    }
    if (validOptions.length < 2) {
      setErrors((prev) => ({
        ...prev,
        options: ["Please provide at least two options."],
      }));
      valid = false;
    }
    if (!valid) return;
    onSubmit({ question, options: validOptions });
    setQuestion("");
    setOptions([
      { id: "", name: "" },
      { id: "", name: "" },
    ]);
    setErrors({});
  }, [question, options, onSubmit]);

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
        <View style={styles.optionsSection}>
          <TextField
            value={question}
            label="Post a Question"
            onChangeText={(text) => {
              setQuestion(text);
              if (errors.question && text.trim())
                setErrors({ ...errors, question: undefined });
            }}
            placeholder="What should your neighbours vote on? (Question)"
            error={errors.question}
            inputStyle={styles.questionInput}
          />
          <Text style={styles.optionsLabel}>Options (Min 2, Max 5)</Text>
          {options.map((opt, idx) => (
            <View key={idx} style={styles.optionRow}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${idx + 1}${idx > 1 ? " (Optional)" : ""}`}
                placeholderTextColor="#9CA3AF"
                value={opt.name}
                onChangeText={(text) => handleOptionChange(text, idx)}
              />
              {options.length > 2 && (
                <TouchableOpacity onPress={() => handleRemoveOption(idx)}>
                  <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {!!errors.options && (
            <Text
              style={{
                color: "#EF4444",
                marginBottom: 8,
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              {errors.options[0]}
            </Text>
          )}
          {options.length < 5 && (
            <ActionButton
              title="Add Option"
              onPress={handleAddOption}
              containerStyle={styles.addOptionButton}
              textStyle={styles.addOptionText}
              leftIcon={
                <Ionicons
                  name="add"
                  size={18}
                  color="#F97316"
                  style={styles.addIcon}
                />
              }
              variant="outline"
            />
          )}
          {!!error && (
            <Text
              style={{
                color: "#EF4444",
                marginBottom: 8,
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          )}
          <ActionButton
            title={loading ? "Publishing..." : "Publish Poll"}
            onPress={handleSubmit}
            containerStyle={styles.submitButton}
            textStyle={styles.submitButtonText}
            disabled={loading}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {},
  questionInput: {
    color: "#111827",
    fontSize: 16,
    minHeight: 30,
    backgroundColor: "white",
  },
  optionsSection: {
    marginVertical: 16,
  },
  optionsLabel: {
    color: "#6B7280",
    fontWeight: "600",
    marginVertical: 12,
  },
  optionRow: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionInput: {
    flex: 1,
    color: "#111827",
    backgroundColor: "#fff",
  },
  addOptionButton: {
    borderWidth: 1,
    borderColor: "#F97316",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  addIcon: {
    marginRight: 6,
  },
  addOptionText: {
    color: "#F97316",
    fontWeight: "600",
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
