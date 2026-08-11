import CircularImage from "@/components/form/CircularImage";
import { Card } from "@/components/UI/Card";
import { useTheme } from "@/theme/theme";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface ApprovedBusinessViewProps {
  approvedBusinesses: any[];
}

// Memoized business card item to prevent re-renders
interface BusinessCardProps {
  business: any;
  onPress: (id: string) => void;
  theme: any;
}

const BusinessCardItem = memo(
  ({ business, onPress, theme }: BusinessCardProps) => {
    const handlePress = useCallback(() => {
      onPress(business._id);
    }, [business._id, onPress]);

    return (
      <Card style={styles.card}>
        <Pressable onPress={handlePress} style={styles.cardPressable}>
          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <CircularImage uri={business.image} size={50} mode="view" />
            </View>
            <View style={styles.infoContainer}>
              <Text
                style={[
                  theme.typography.body,
                  styles.businessTitle,
                  { color: theme.colors.primary },
                ]}
              >
                {business.title}
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  styles.secondaryText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {business.category}
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  styles.secondaryText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {business.completeAddress}
              </Text>
            </View>
          </View>
          <View style={styles.approvedBadge}>
            <Text style={styles.approvedText}>Approved</Text>
          </View>
        </Pressable>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.business._id === nextProps.business._id &&
      prevProps.business.title === nextProps.business.title &&
      prevProps.business.category === nextProps.business.category &&
      prevProps.business.image === nextProps.business.image &&
      prevProps.theme === nextProps.theme &&
      prevProps.onPress === nextProps.onPress
    );
  }
);

BusinessCardItem.displayName = "BusinessCardItem";

const ApprovedBusinessView: React.FC<ApprovedBusinessViewProps> = ({
  approvedBusinesses,
}) => {
  const theme = useTheme();
  const router = useRouter();

  const handleBusinessPress = useCallback(
    (businessId: string) => {
      router.navigate(`/(tabs)/profile/user-business-screen?id=${businessId}`);
    },
    [router]
  );

  const businessList = useMemo(
    () =>
      approvedBusinesses.map((business) => (
        <BusinessCardItem
          key={business._id}
          business={business}
          onPress={handleBusinessPress}
          theme={theme}
        />
      )),
    [approvedBusinesses, handleBusinessPress, theme]
  );

  return (
    <View style={styles.container}>
      {/* List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {businessList}
      </ScrollView>
    </View>
  );
};

export default ApprovedBusinessView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 12,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
  },
  cardPressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  imageContainer: {
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  businessTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  secondaryText: {
    marginTop: 2,
    fontSize: 14,
  },
  approvedBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 12,
  },
});
