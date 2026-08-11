import { SERVICE_TYPE_OPTIONS } from "@/assets/mocks/category";
import FilterChips from "@/components/common/FilterChips";
import { useTheme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card } from "../UI/Card";
import CircularImage from "../form/CircularImage";
import NoDataCard from "./NoDataCard";

interface ApprovedDailyServicesViewProps {
  approvedServices: any[];
}

const ApprovedDailyServicesView: React.FC<ApprovedDailyServicesViewProps> = ({
  approvedServices,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>(
    SERVICE_TYPE_OPTIONS[0].id,
  );

  // When filter changes, update selectedFilter
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  // Filter services based on selectedFilter
  const filteredServices = useMemo(() => {
    if (!approvedServices || approvedServices.length === 0) return [];
    return approvedServices.filter(
      (service) => service.serviceType === selectedFilter,
    );
  }, [approvedServices, selectedFilter]);

  const handleCardPress = useCallback(
    (providerId: string) => {
      router.navigate(`/(tabs)/directory/service/${providerId}`);
    },
    [router],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: any }) => (
      <Card style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleCardPress(item?._id)}
        >
          <View style={styles.rowCenter}>
            <View style={styles.avatarWrapper}>
              <CircularImage uri={item.images?.[0]} size={50} mode="view" />
            </View>
            <View style={styles.flex1}>
              <Text
                style={[
                  theme.typography.body,
                  styles.nameText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  styles.categoryText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.categoryId}
              </Text>
            </View>
          </View>
          <View style={styles.ratingStarsRow}>
            <Ionicons name="star" size={12} color="#facc15" />
            <Text style={styles.ratingValue}>{item.averageRating || 0}</Text>
            <Text style={styles.ratingCountText}>
              ({item.reviews?.length ?? 0}) reviews
            </Text>
          </View>
        </TouchableOpacity>
      </Card>
    ),
    [theme, handleCardPress],
  );

  return (
    <ScrollView
      style={[styles.flex1, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filters */}
      <View style={styles.serviceSection}>
        <FilterChips
          options={SERVICE_TYPE_OPTIONS}
          initialValue={selectedFilter}
          onChange={handleFilterChange}
          horizontal
          style={styles.filterContainer}
        />
        {filteredServices.length === 0 ? (
          <NoDataCard
            iconName="reader-outline"
            message="No Results Found"
            subText="You have not added any products to your catalogue yet."
          />
        ) : (
          filteredServices.map((item) => (
            <View key={item?._id || item?.id}>
              {renderRequestItem({ item })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default ApprovedDailyServicesView;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  serviceSection: {},
  filterContainer: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  card: {
    marginBottom: 12,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    marginRight: 12,
  },
  nameText: {
    fontWeight: "600",
    fontSize: 16,
  },
  categoryText: {
    marginTop: 4,
    fontSize: 14,
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 12,
    marginBottom: 0,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: "600",
    fontSize: 12,
    color: "#374151",
  },
  ratingCountText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },
});
