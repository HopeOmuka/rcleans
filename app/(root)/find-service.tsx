import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View, FlatList } from "react-native";
import type { Href } from "expo-router";

import BootstrapIcon from "@/components/BootstrapIcon";
import CleanerCard from "@/components/CleanerCard";
import CustomButton from "@/components/CustomButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Map from "@/components/Map";
import ServiceLayout from "@/components/ServiceLayout";
import { useTheme } from "@/lib/theme";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const FindService = () => {
  const { theme } = useTheme();
  const { serviceAddress } = useLocationStore();
  const {
    cleaners,
    selectedCleaner,
    setSelectedCleaner,
    cleanersLoading,
    cleanersError,
  } = useCleanerStore();
  const { selectedServiceType } = useServiceTypeStore();

  useEffect(() => {
    setSelectedCleaner(null);
  }, [setSelectedCleaner]);

  const handleConfirmService = () => {
    if (selectedCleaner && selectedServiceType) {
      router.push("/(root)/confirm-service");
    }
  };

  return (
    <ServiceLayout title="Find Cleaner">
      <View
        className="my-3 p-4 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.border,
        }}
      >
        <View className="flex-row items-center">
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: theme.colors.primarySoft }}
          >
            <BootstrapIcon
              name="geo-alt"
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-JakartaSemiBold"
              style={{ color: theme.colors.text }}
            >
              {selectedServiceType?.name}
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
              numberOfLines={1}
            >
              {serviceAddress}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1">
        <Map />
      </View>

      <View className="mt-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-lg font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            Available Cleaners
          </Text>
          {cleaners.length > 0 && (
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: theme.colors.primarySoft }}
            >
              <Text
                className="text-xs font-JakartaBold"
                style={{ color: theme.colors.primary }}
              >
                {cleaners.length}{" "}
                {cleaners.length === 1 ? "cleaner" : "cleaners"}
              </Text>
            </View>
          )}
        </View>
        {cleaners.length === 0 ? (
          cleanersError ? (
            <View
              className="items-center px-6 py-8 rounded-2xl border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.dangerSoft,
              }}
            >
              <Text
                className="text-base font-JakartaSemiBold text-center"
                style={{ color: theme.colors.text }}
              >
                Could not load cleaners
              </Text>
              <Text
                className="text-sm text-center mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {cleanersError}
              </Text>
              <Text
                className="text-xs text-center mt-2"
                style={{ color: theme.colors.textMuted }}
              >
                Use &apos;Retry&apos; on the map above to try again.
              </Text>
            </View>
          ) : cleanersLoading ? (
            <LoadingSpinner text="Finding cleaners near you..." />
          ) : (
            <View
              className="items-center px-6 py-8 rounded-2xl border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                className="text-base font-JakartaSemiBold text-center"
                style={{ color: theme.colors.text }}
              >
                No cleaners available
              </Text>
              <Text
                className="text-sm text-center mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                Please try again later or pick a different location.
              </Text>
            </View>
          )
        ) : (
          <View style={{ maxHeight: 280 }}>
            <FlatList
              data={cleaners}
              renderItem={({ item }) => (
                <CleanerCard
                  item={item}
                  selected={selectedCleaner ?? ""}
                  setSelected={() => setSelectedCleaner(item.id)}
                  accessibilityLabel={`Select ${item.title}, rated ${item.rating} stars`}
                  onViewProfile={() =>
                    router.push(`/(root)/cleaner/${item.id}` as Href)
                  }
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8, gap: 10 }}
            />
          </View>
        )}
      </View>

      <CustomButton
        title="Confirm Service"
        onPress={handleConfirmService}
        disabled={!selectedCleaner}
        className="mt-5"
        accessibilityLabel="Confirm selected cleaner and proceed to service confirmation"
        accessibilityRole="button"
      />
    </ServiceLayout>
  );
};

export default FindService;
