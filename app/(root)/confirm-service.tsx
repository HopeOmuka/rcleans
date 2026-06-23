import { router } from "expo-router";
import { View, Image, Text } from "react-native";

import CustomButton from "@/components/CustomButton";
import EmptyState from "@/components/EmptyState";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const ConfirmService = () => {
  const { cleaners, selectedCleaner } = useCleanerStore();
  const { serviceAddress } = useLocationStore();
  const { selectedServiceType } = useServiceTypeStore();

  const selectedCleanerData = cleaners.find((c) => c.id === selectedCleaner);

  if (!selectedCleanerData || !selectedServiceType) {
    return (
      <ServiceLayout title="Confirm Service">
        <EmptyState
          title="No Service Selected"
          description="Please go back and select a service type and cleaner to continue."
          icon={icons.pin}
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </ServiceLayout>
    );
  }

  const estimatedPrice =
    selectedServiceType.base_price +
    selectedServiceType.price_per_hour *
      selectedServiceType.estimated_duration_hours;

  return (
    <ServiceLayout title="Confirm Service" snapPoints={["65%", "85%"]}>
      <View className="p-5">
        <Text className="text-xl font-JakartaBold mb-5">Service Details</Text>

        <View className="bg-white p-4 rounded-lg mb-5">
          <Text className="text-lg font-JakartaSemiBold">
            {selectedServiceType.name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {selectedServiceType.description}
          </Text>
          <Text className="text-sm mt-2">Location: {serviceAddress}</Text>
          <Text className="text-sm">
            Duration: {selectedServiceType.estimated_duration_hours} hours
          </Text>
          <Text className="text-lg font-JakartaBold mt-2">
            Total: ${estimatedPrice.toFixed(2)}
          </Text>
        </View>

        <Text className="text-xl font-JakartaBold mb-5">Your Cleaner</Text>

        <View className="bg-white p-4 rounded-lg flex-row items-center">
          <Image
            source={{ uri: selectedCleanerData.profile_image_url }}
            className="w-16 h-16 rounded-full mr-4"
            accessibilityLabel={`Profile picture of ${selectedCleanerData.title}`}
          />
          <View className="flex-1">
            <Text className="text-lg font-JakartaSemiBold">
              {selectedCleanerData.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Image source={icons.star} className="w-4 h-4 mr-1" />
              <Text className="text-sm">{selectedCleanerData.rating}</Text>
            </View>
            <Text className="text-sm text-gray-600 mt-1">
              Arrives in: {selectedCleanerData.time} min
            </Text>
            <Text className="text-sm text-gray-600">
              Specialties: {selectedCleanerData.specialties?.join(", ")}
            </Text>
          </View>
        </View>

        <View className="mt-10">
          <CustomButton
            title="Book Service"
            onPress={() => router.push("/(root)/book-service")}
            accessibilityLabel="Confirm and proceed to book this service"
          />
          <CustomButton
            title="Back"
            onPress={() => router.back()}
            bgVariant="outline"
            className="mt-3"
            accessibilityLabel="Go back to the previous screen"
          />
        </View>
      </View>
    </ServiceLayout>
  );
};

export default ConfirmService;
