import { useTheme } from "@/theme/theme";
import { toKebab } from "@/lib/utils";
import { BusinessCategory } from "@/types/business.type";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionButton from "../inputs/ActionButton";
import GlobalInput from "../UI/GlobalInput";
import Label from "../UI/Label";

type PollFormProps = {
  onSubmit: (data: { question: string; options: BusinessCategory[] }) => void;
  loading?: boolean;
  error?: string | null;
};

const MAX_OPTIONS = 5;
const MIN_OPTIONS = 2;

/** Create Poll form — same visual language (cards, spacing, brand green) as Create Event. */
export default function PollForm({
  onSubmit,
  loading = false,
  error,
}: PollFormProps) {
  const t = useTheme();
  const [question, setQuestion] = useState("");
  const [errors, setErrors] = useState<{
    question?: string;
    options?: string[];
  }>({});
  const [options, setOptions] = useState<BusinessCategory[]>([
    { id: "", name: "" },
    { id: "", name: "" },
  ]);

  const filledOptionCount = useMemo(
    () => options.map((o) => o.name.trim()).filter(Boolean).length,
    [options],
  );
  // Live (as-you-type) duplicate detection — trimmed, case-insensitive.
  const duplicateIndexes = useMemo(() => {
    const seen = new Map<string, number>();
    const dupes = new Set<number>();
    options.forEach((o, idx) => {
      const key = o.name.trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) {
        dupes.add(seen.get(key)!);
        dupes.add(idx);
      } else {
        seen.set(key, idx);
      }
    });
    return dupes;
  }, [options]);
  const hasDuplicateOptions = duplicateIndexes.size > 0;
  const canSubmit =
    question.trim().length > 0 &&
    filledOptionCount >= MIN_OPTIONS &&
    !hasDuplicateOptions;

  const handleOptionChange = useCallback(
    (text: string, idx: number) => {
      setOptions((prev) => {
        const updated = prev.map((opt, i) =>
          i === idx ? { ...opt, name: text, id: toKebab(text) } : opt
        );
        const validOptions = updated.map((o) => o.name.trim()).filter(Boolean);
        if (validOptions.length >= MIN_OPTIONS && errors.options) {
          setErrors((prevErr) => ({ ...prevErr, options: undefined }));
        }
        return updated;
      });
    },
    [errors.options]
  );

  const handleAddOption = useCallback(() => {
    if (options.length < MAX_OPTIONS)
      setOptions((prev) => [...prev, { id: "", name: "" }]);
  }, [options.length]);

  const handleRemoveOption = useCallback(
    (idx: number) => {
      if (options.length > MIN_OPTIONS)
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
    if (validOptions.length < MIN_OPTIONS) {
      setErrors((prev) => ({
        ...prev,
        options: ["Please provide at least two options."],
      }));
      valid = false;
    } else {
      const seen = new Set<string>();
      const hasDuplicate = validOptions.some((o) => {
        const key = o.name.toLowerCase();
        if (seen.has(key)) return true;
        seen.add(key);
        return false;
      });
      if (hasDuplicate) {
        setErrors((prev) => ({
          ...prev,
          options: ["Options must be unique."],
        }));
        valid = false;
      } else {
        setErrors((prev) => ({ ...prev, options: undefined }));
      }
    }
    if (!valid || loading) return;
    // Fields are intentionally left as-is here — the API request is in
    // flight, and clearing them would flash an "unfilled" form while it
    // runs. The caller navigates away / shows success once it resolves.
    onSubmit({ question, options: validOptions });
  }, [question, options, onSubmit, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={t.colors.brand} />
        <Text style={[t.typography.body, { color: t.colors.textSecondary, marginTop: t.spacing.m }]}>
          Publishing your poll...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 100}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            t.typography.h5,
            { color: t.colors.brandDark, marginBottom: t.spacing.m },
          ]}
        >
          Poll Details
        </Text>

        <GlobalInput
          label="Poll Question *"
          placeholder="What should your neighbours vote on?"
          value={question}
          onChangeText={(text) => {
            setQuestion(text);
            if (errors.question && text.trim())
              setErrors({ ...errors, question: undefined });
          }}
          error={errors.question}
          multiline
          numberOfLines={2}
        />

        <View
          style={{
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: t.radii.medium,
            padding: t.spacing.l,
            marginBottom: t.spacing.l,
          }}
        >
          <Label>{`Options (Min ${MIN_OPTIONS}, Max ${MAX_OPTIONS})`}</Label>
          <Text
            style={[
              t.typography.small,
              { color: t.colors.secondaryText, marginBottom: t.spacing.m },
            ]}
          >
            Add choices for your neighbours to vote on.
          </Text>

          {options.map((opt, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: duplicateIndexes.has(idx) ? t.colors.error : t.colors.border,
                borderRadius: t.radii.small,
                backgroundColor: t.colors.surface,
                paddingHorizontal: t.spacing.m,
                marginBottom: t.spacing.s,
              }}
            >
              <TextInput
                style={[
                  t.typography.body,
                  { flex: 1, color: t.colors.textPrimary, paddingVertical: t.spacing.s },
                ]}
                placeholder={`Option ${idx + 1}`}
                placeholderTextColor={t.colors.secondaryText}
                value={opt.name}
                onChangeText={(text) => handleOptionChange(text, idx)}
              />
              {options.length > MIN_OPTIONS && (
                <TouchableOpacity onPress={() => handleRemoveOption(idx)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={t.colors.secondaryText} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {hasDuplicateOptions ? (
            <Text
              style={[
                t.typography.small,
                { color: t.colors.error, marginTop: t.spacing.xs },
              ]}
            >
              Options must be unique.
            </Text>
          ) : (
            !!errors.options && (
              <Text
                style={[
                  t.typography.small,
                  { color: t.colors.error, marginTop: t.spacing.xs },
                ]}
              >
                {errors.options[0]}
              </Text>
            )
          )}

          {options.length < MAX_OPTIONS && (
            <TouchableOpacity
              onPress={handleAddOption}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: t.colors.brand,
                borderRadius: t.radii.small,
                paddingVertical: t.spacing.s,
                marginTop: t.spacing.xs,
              }}
            >
              <Ionicons name="add" size={18} color={t.colors.brandDark} style={{ marginRight: 6 }} />
              <Text style={[t.typography.button1, { color: t.colors.brandDark }]}>
                Add Option
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!!error && (
          <Text
            style={[
              t.typography.small,
              { color: t.colors.error, marginBottom: t.spacing.s },
            ]}
          >
            {error}
          </Text>
        )}
      </ScrollView>

      {/* Bottom action bar — same treatment as the Create Event sticky CTA. */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: t.colors.border,
          paddingTop: t.spacing.m,
          backgroundColor: t.colors.surface,
        }}
      >
        <ActionButton
          title={loading ? "Publishing..." : "Publish Poll"}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || !canSubmit}
          loading={loading}
          containerStyle={{
            backgroundColor: canSubmit ? t.colors.brandDark : t.colors.surfaceAlt,
            borderRadius: t.radii.medium,
          }}
          textStyle={{ color: canSubmit ? "#fff" : t.colors.secondaryText }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
