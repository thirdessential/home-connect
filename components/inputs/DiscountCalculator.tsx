import { getDiscountPercentage } from "@/lib/utils";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface DiscountCalculatorProps {
  mrp: string | number;
  sellingPrice: string | number;
  quantityUnit?: string;
  onCalculate?: (result: DiscountResult) => void;
}

export interface DiscountResult {
  discountPercent: string;
  saveAmount: string;
}

const DiscountCalculator: React.FC<DiscountCalculatorProps> = ({
  mrp,
  sellingPrice,
  quantityUnit = "unit",
  onCalculate,
}) => {
  const t = useTheme();

  // Animation states
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [calculatedSaveAmount, setCalculatedSaveAmount] = useState("");

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculate discount percentage
  const discountPercent = useMemo(() => {
    return getDiscountPercentage(Number(mrp), Number(sellingPrice)).toFixed(2);
  }, [mrp, sellingPrice]);

  // Spin interpolation
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Handle discount calculation with animation
  const handleCalculateDiscount = useCallback(() => {
    const mrpValue = parseFloat(String(mrp) ?? "0");
    const dealPrice = parseFloat(String(sellingPrice) ?? "0");

    // Clear previous error
    setDiscountError("");

    if (!mrpValue || !dealPrice || mrpValue <= 0) {
      setDiscountError("Please enter valid MRP and Deal Price");
      return;
    }

    // Validate MRP is greater than deal price
    if (mrpValue <= dealPrice) {
      setDiscountError("MRP must be greater than Deal Price");
      return;
    }

    // Calculate save amount
    const saveAmount = (mrpValue - dealPrice).toFixed(2);

    // Start calculating animation
    setIsCalculating(true);
    spinAnim.setValue(0);
    scaleAnim.setValue(1);
    fadeAnim.setValue(0);

    // Spin animation for calculating
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    // After 1.5 seconds, show the discount result
    setTimeout(() => {
      spinAnimation.stop();
      setIsCalculating(false);
      setShowDiscount(true);
      setCalculatedSaveAmount(saveAmount);

      // Bounce and fade in animation for result
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Scale back to normal
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
      });

      // Callback with discount result
      if (onCalculate) {
        onCalculate({
          discountPercent,
          saveAmount,
        });
      }

      // After 5 seconds, fade out and reset
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowDiscount(false);
        });
      }, 5000);
    }, 1500);
  }, [
    mrp,
    sellingPrice,
    discountPercent,
    onCalculate,
    spinAnim,
    scaleAnim,
    fadeAnim,
  ]);

  return (
    <View>
      {/* Calculate Discount Button with Animation */}
      <TouchableOpacity
        onPress={handleCalculateDiscount}
        disabled={isCalculating}
        style={[
          styles.discountButton,
          {
            backgroundColor: showDiscount ? "#DCFCE7" : t.colors.surface,
            borderColor: showDiscount ? "#86EFAC" : "#E5E7EB",
          },
        ]}
      >
        {isCalculating ? (
          <View style={styles.discountButtonContent}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons
                name="calculator-outline"
                size={20}
                color={t.colors.primary}
              />
            </Animated.View>
            <Text
              style={[styles.discountButtonText, { color: t.colors.primary }]}
            >
              Calculating...
            </Text>
          </View>
        ) : showDiscount ? (
          <Animated.View
            style={[
              styles.discountButtonContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={t.colors.success ?? "#22C55E"}
            />
            <View style={styles.discountResultContainer}>
              <Text
                style={[
                  styles.discountPercentText,
                  { color: t.colors.success ?? "#22C55E" },
                ]}
              >
                {discountPercent}% OFF
              </Text>
              <Text
                style={[
                  styles.discountSaveText,
                  { color: t.colors.textSecondary },
                ]}
              >
                You save ₹{calculatedSaveAmount} per {quantityUnit}
              </Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.discountButtonContent}>
            <Ionicons
              name="calculator-outline"
              size={20}
              color={t.colors.primary}
            />
            <Text
              style={[styles.discountButtonText, { color: t.colors.primary }]}
            >
              Calculate Discount
            </Text>
          </View>
        )}
      </TouchableOpacity>
      {discountError ? (
        <Text style={[styles.errorText, { marginTop: 4 }]}>
          {discountError}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  discountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
  },
  discountButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  discountButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  discountResultContainer: {
    gap: 2,
  },
  discountPercentText: {
    fontSize: 16,
    fontWeight: "700",
  },
  discountSaveText: {
    fontSize: 12,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
    fontWeight: "500",
  },
});

export default DiscountCalculator;
