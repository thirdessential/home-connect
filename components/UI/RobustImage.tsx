import { buildImageUrl } from "@/lib/imageUtils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

// URIs that already failed this session. Shared across instances so a known-bad
// URL (e.g. a deleted upload used by many cards) is not re-requested or re-logged.
// Keyed by exact URI, so a newly uploaded image (new URI) is always attempted.
const failedUris = new Set<string>();

interface RobustImageProps {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  fallbackIcon?: string;
  fallbackBackgroundColor?: string;
  /** When set, shows these initials instead of fallbackIcon (no dummy image, no retry loop). */
  fallbackText?: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
}

/**
 * RobustImage Component
 * Handles image loading with error states, fallbacks, and loading indicators
 *
 * Features:
 * - Graceful error handling with fallback icons
 * - Loading state indicator
 * - Proper fallback when image URL is invalid or missing
 * - Retry mechanism on error
 */
const RobustImage = memo(
  ({
    uri,
    style,
    resizeMode = "cover",
    fallbackIcon = "image-outline",
    fallbackBackgroundColor = "#e5e7eb",
    fallbackText,
    onLoadStart,
    onLoadEnd,
    onError: onErrorProp,
  }: RobustImageProps) => {
    // Normalize once here so every caller (CircularImage included) gets a
    // correctly joined absolute URL regardless of what shape `uri` arrives
    // in (relative path, missing/extra slash, or already-absolute).
    const resolvedUri = useMemo(() => buildImageUrl(uri), [uri]);

    const [isLoading, setIsLoading] = useState(!!resolvedUri && !failedUris.has(resolvedUri));
    const [error, setError] = useState(!!resolvedUri && failedUris.has(resolvedUri));

    // New URI -> reset failure state and try it; a known-bad URI stays failed.
    useEffect(() => {
      const failed = !!resolvedUri && failedUris.has(resolvedUri);
      setError(failed);
      setIsLoading(!!resolvedUri && !failed);
    }, [resolvedUri]);

    const hasValidUri = !!resolvedUri;

    const handleLoadStart = useCallback(() => {
      setIsLoading(true);
      onLoadStart?.();
    }, [onLoadStart]);

    const handleLoadEnd = useCallback(() => {
      setIsLoading(false);
      onLoadEnd?.();
    }, [onLoadEnd]);

    const handleError = useCallback(
      (err: any) => {
        // Single diagnostic per bad URI; no retry (a 404 will not fix itself).
        if (resolvedUri && !failedUris.has(resolvedUri)) {
          failedUris.add(resolvedUri);
          console.warn(`[RobustImage] Failed to load image: ${resolvedUri}`, err?.error ?? err);
          onErrorProp?.(err);
        }
        setError(true);
        setIsLoading(false);
      },
      [resolvedUri, onErrorProp]
    );

    // If no URI provided, show fallback immediately
    if (!hasValidUri || error) {
      return (
        <View
          style={[
            style,
            {
              backgroundColor: fallbackBackgroundColor,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          {fallbackText ? (
            <Text style={{ fontSize: 16, color: "#4b5563" }}>
              {fallbackText}
            </Text>
          ) : (
            <Ionicons name={fallbackIcon as any} size={40} color="#999" />
          )}
        </View>
      );
    }

    return (
      <View style={style}>
        {/* Main Image */}
        <Image
          source={resolvedUri}
          style={{ flex: 1 }}
          contentFit={resizeMode === "stretch" ? "fill" : resizeMode === "center" ? "none" : resizeMode}
          cachePolicy="disk"
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />

        {/* Loading Indicator */}
        {isLoading && !error && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="hourglass-outline"
              size={30}
              color="#999"
              style={{ opacity: 0.5 }}
            />
          </View>
        )}

        {/* Error Fallback */}
        {error && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: fallbackBackgroundColor,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {fallbackText ? (
              <Text style={{ fontSize: 16, color: "#4b5563" }}>
                {fallbackText}
              </Text>
            ) : (
              <Ionicons name="alert-circle-outline" size={30} color="#ef4444" />
            )}
          </View>
        )}
      </View>
    );
  }
);

RobustImage.displayName = "RobustImage";

export default RobustImage;
