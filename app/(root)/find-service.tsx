import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View, FlatList, ActivityIndicator } from "react-native";

import CleanerCard from "@/components/CleanerCard";
import CustomButton from "@/components/CustomButton";
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
    // Clear selected cleaner when entering this screen
    setSelectedCleaner(null);
  }, []);

  const handleConfirmService = () => {
    if (selectedCleaner && selectedServiceType) {
      router.push(`/(root)/confirm-service`);
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
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <FlatList
            data={cleaners}
            renderItem={({ item }) => (
              <CleanerCard
                item={item}
                selected={selectedCleaner!}
                setSelected={() => setSelectedCleaner(item.id)}
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
      />
    </ServiceLayout>
  );
};

export default FindService;
