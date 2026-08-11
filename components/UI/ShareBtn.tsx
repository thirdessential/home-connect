import { useTheme } from "@/theme/theme";
import { ShareButtonProps } from "@/types/common.type";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef } from "react";
import {
  Alert,
  GestureResponderEvent,
  Platform,
  Share,
  TouchableOpacity,
} from "react-native";

function formatINR(value: number | undefined, currency: "₹" | "Rs" = "Rs") {
  if (value == null) return "";
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
  return currency === "₹" ? `₹${formatted}` : `Rs ${formatted}`;
}

export default function ShareButton({
  product,
  message,
  url,
  subject,
  icon = "share-outline",
  size = 40,
  bgColor,
  iconColor,
  style,
  stopPropagation = true,
  onShared,
  disabled,
}: ShareButtonProps) {
  const t = useTheme();
  const lockRef = useRef(false);

  const handlePress = useCallback(
    async (e?: GestureResponderEvent) => {
      if (stopPropagation) e?.stopPropagation?.();
      if (disabled || lockRef.current) return;
      lockRef.current = true;

      try {
        // Build defaults from product (if provided)
        const deeplink =
          product?.url ||
          (product?.id ? `homeconnect://product/${product.id}` : undefined);
        const priceLabel =
          product?.price != null
            ? formatINR(
                product.price,
                product.currency === "₹" || product.currency === "Rs"
                  ? product.currency
                  : "Rs"
              )
            : "";

        const finalSubject =
          subject || (product ? `Check this out: ${product.title}` : "Share");

        const composed =
          message ||
          (product
            ? [
                `${product.title}${priceLabel ? ` — ${priceLabel}` : ""}`,
                deeplink ? `\n${deeplink}` : "",
                "\nShared via HomeConnect",
              ].join("")
            : "Shared via HomeConnect");

        // iOS supports a separate url field; Android ignores it (so we include url in message too)
        const result = await Share.share(
          {
            title: finalSubject,
            message: composed,
            ...(Platform.OS === "ios" && url
              ? { url } // if you explicitly passed url prop
              : Platform.OS === "ios" && !url && deeplink
                ? { url: deeplink }
                : {}),
            ...(Platform.OS === "ios" ? { subject: finalSubject } : {}),
          },
          {
            dialogTitle: finalSubject,
          }
        );

        const success = result.action === Share.sharedAction;
        onShared?.(success);
      } catch (err: any) {
        onShared?.(false);
        Alert.alert("Unable to share", err?.message ?? "Please try again.");
      } finally {
        setTimeout(() => (lockRef.current = false), 500);
      }
    },
    [stopPropagation, disabled, product, message, url, subject, onShared]
  );

  const diameter = size;
  const tint = iconColor ?? t.colors.primary;
  const bg = bgColor ?? t.colors.surfaceAlt;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={10}
      style={[
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: t.colors.border,
        },
        style,
        disabled ? { opacity: 0.6 } : null,
      ]}
    >
      <Ionicons
        name={icon}
        size={Math.max(16, Math.round(diameter * 0.48))}
        color={tint}
      />
    </TouchableOpacity>
  );
}
