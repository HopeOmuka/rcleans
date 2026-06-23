import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View, FlatList } from "react-native";

import CleanerCard from "@/components/CleanerCard";
import CustomButton from "@/components/CustomButton";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import Map from "@/components/Map";
import ServiceLayout from "@/components/ServiceLayout";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const FindService = () => {
  const { serviceAddress } = useLocationStore();
  const { cleaners, selectedCleaner, setSelectedCleaner } = useCleanerStore();
  const { selectedServiceType } = useServiceTypeStore();

  useEffect(() => {
    setSelectedCleaner(null);
  }, []);

  const handleConfirmService = () => {
    if (selectedCleaner && selectedServiceType) {
      router.push("/(root)/confirm-service");
    }
  };

  return (
    <ServiceLayout title="Find Cleaner">
      <View className="my-3">
        <Text className="text-lg font-JakartaSemiBold mb-3">
          Service: {selectedServiceType?.name}
        </Text>
        <Text className="text-lg font-JakartaSemiBold mb-3">
          Location: {serviceAddress}
        </Text>
      </View>

      <View className="flex-1">
        <Map />
      </View>

      <View className="mt-5">
        <Text className="text-lg font-JakartaSemiBold mb-3">
          Available Cleaners
        </Text>
        {cleaners.length === 0 ? (
          <LoadingSpinner text="Finding cleaners near you..." />
        ) : (
          <FlatList
            data={cleaners}
            renderItem={({ item }) => (
              <CleanerCard
                item={item}
                selected={selectedCleaner ?? 0}
                setSelected={() => setSelectedCleaner(item.id)}
                accessibilityLabel={`Select ${item.title}, rated ${item.rating} stars`}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5"
          />
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
