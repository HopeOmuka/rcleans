import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import CleanerCard from "@/components/CleanerCard";
import CustomButton from "@/components/CustomButton";
import Map from "@/components/Map";
import ServiceLayout from "@/components/ServiceLayout";
import { generateMarkersFromData, calculateCleanerTimes } from "@/lib/map";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const FindService = () => {
  const { serviceAddress, serviceLatitude, serviceLongitude } =
    useLocationStore();
  const { cleaners, setCleaners, selectedCleaner, setSelectedCleaner } =
    useCleanerStore();
  const { selectedServiceType } = useServiceTypeStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCleaner(null);
  }, [setSelectedCleaner]);

  useEffect(() => {
    const fetchCleaners = async () => {
      try {
        setLoading(true);
        const response = await fetch("/(api)/cleaner");
        const result = await response.json();

        if (result.data && result.data.length > 0) {
          let markers = generateMarkersFromData({
            data: result.data,
            userLatitude: serviceLatitude || -1.2921,
            userLongitude: serviceLongitude || 36.8219,
          });

          if (serviceLatitude && serviceLongitude) {
            const markersWithTimes = await calculateCleanerTimes({
              markers,
              serviceLatitude: Number(serviceLatitude),
              serviceLongitude: Number(serviceLongitude),
            });
            if (markersWithTimes) {
              markers = markersWithTimes;
            }
          }

          setCleaners(markers);
        } else {
          setCleaners([]);
        }
      } catch (error) {
        console.error("Error fetching cleaners:", error);
        setCleaners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCleaners();
  }, [serviceLatitude, serviceLongitude, setCleaners]);

  const handleConfirmService = () => {
    if (selectedCleaner && selectedServiceType) {
      router.push(`/(root)/confirm-service`);
    }
  };

  return (
    <ServiceLayout title="Find Cleaners">
      <View className="my-3">
        <Text className="text-white text-lg font-JakartaSemiBold mb-3">
          Service: {selectedServiceType?.name}
        </Text>
        <Text className="text-gray-400 text-lg font-JakartaSemiBold mb-3">
          Location: {serviceAddress}
        </Text>
      </View>

      <View className="flex-1 rounded-2xl overflow-hidden">
        <Map
          userLatitude={serviceLatitude ?? undefined}
          userLongitude={serviceLongitude ?? undefined}
          serviceLatitude={serviceLatitude ?? undefined}
          serviceLongitude={serviceLongitude ?? undefined}
          userAddress={serviceAddress || undefined}
          cleanerMarkers={cleaners}
        />
      </View>

      <View className="flex-1 mt-5">
        <Text className="text-white text-lg font-JakartaSemiBold mb-3">
          Available Cleaners{" "}
          {cleaners.length > 0 && `(${cleaners.length} nearby)`}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#4ADE80" />
        ) : cleaners.length === 0 ? (
          <Text className="text-gray-500 text-center py-4">
            No cleaners available in your area
          </Text>
        ) : (
          <ScrollView
            className="mb-3"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="gap-3 pb-40">
              {cleaners.map((item) => (
                <CleanerCard
                  key={item.id}
                  item={item}
                  selected={selectedCleaner!}
                  setSelected={() => setSelectedCleaner(item.id)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View className="pb-4">
        <CustomButton
          title="Continue to Booking"
          onPress={handleConfirmService}
          disabled={!selectedCleaner}
        />
      </View>
    </ServiceLayout>
  );
};

export default FindService;
