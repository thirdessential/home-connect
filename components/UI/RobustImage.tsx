import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

interface RobustImageProps {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  fallbackIcon?: string;
  fallbackBackgroundColor?: string;
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
    onLoadStart,
    onLoadEnd,
    onError: onErrorProp,
  }: RobustImageProps) => {
    const [isLoading, setIsLoading] = useState(!!uri);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const hasValidUri = !!uri && typeof uri === "string" && uri.length > 0;

    const handleLoadStart = useCallback(() => {
      setIsLoading(true);
      onLoadStart?.();
    }, [onLoadStart]);

    const handleLoadEnd = useCallback(() => {
      setIsLoading(false);
      onLoadEnd?.();
    }, [onLoadEnd]);

    const handleError = useCallback(
      (error: any) => {
        console.warn(
          `[RobustImage] Failed to load image from URI: ${uri}`,
          error
        );
        setError(true);
        setIsLoading(false);
        onErrorProp?.(error);

        // Retry mechanism: retry up to 3 times with exponential backoff
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            setError(false);
            setIsLoading(true);
          }, Math.pow(2, retryCount) * 1000); // 1s, 2s, 4s
        }
      },
      [uri, retryCount, onErrorProp]
    );

    // If no URI provided, show fallback immediately
    if (!hasValidUri) {
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
          <Ionicons name={fallbackIcon as any} size={40} color="#999" />
        </View>
      );
    }

    return (
      <View style={style}>
        {/* Main Image */}
        <Image
          source={{ uri } as ImageSourcePropType}
          style={{ flex: 1 }}
          resizeMode={resizeMode}
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
            <Ionicons name="alert-circle-outline" size={30} color="#ef4444" />
          </View>
        )}
      </View>
    );
  }
);

RobustImage.displayName = "RobustImage";

export default RobustImage;
