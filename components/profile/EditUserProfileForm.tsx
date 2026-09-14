import ActionButton from "@/components/inputs/ActionButton";
import TextField from "@/components/inputs/TextField";
import { useState } from "react";
import { View } from "react-native";

export type EditUserProfilePayload = { fullName: string; email?: string };

export default function EditUserProfileForm({
  initialName,
  initialEmail,
  submitting,
  onCancel,
  onSubmit,
}: {
  initialName?: string;
  initialEmail?: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: EditUserProfilePayload) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const submit = () => {
    if (submitting) return;
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({ fullName: name.trim(), email: email.trim() });
  };

  return (
    <View style={{ paddingVertical: 16, marginBottom: 16 }}>
      <TextField
        label="Name*"
        required
        placeholder="Enter your name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
        containerStyle={{ marginBottom: 12 }}
        editable={!submitting}
      />

      <TextField
        label="Email"
        placeholder="Enter your email (optional)"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setErrors((e) => ({ ...e, email: undefined }));
        }}
        error={errors.email}
        containerStyle={{ marginBottom: 12 }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!submitting}
      />

      <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <ActionButton
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            fullWidth
            disabled={submitting}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ActionButton
            title="Save"
            variant="primary"
            onPress={submit}
            fullWidth
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </View>
    </View>
  );
}
