import { router } from "expo-router";
import { Text, View, Image } from "react-native";

import CustomButton from "@/components/CustomButton";
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
      <ServiceLayout title="Confirm Service" snapPoints={["65%", "85%"]}>
        <View className="p-5">
          {!selectedServiceType ? (
            <View className="bg-dark-200 p-6 rounded-2xl border border-gray-700 items-center">
              <Text className="text-white text-lg font-JakartaSemiBold mb-2">
                No Service Selected
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Please select a service type from the home screen
              </Text>
              <CustomButton
                title="Go to Home"
                onPress={() => router.push("/(root)/(tabs)/home")}
                className="mt-4"
              />
            </View>
          ) : !selectedCleanerData ? (
            <View className="bg-dark-200 p-6 rounded-2xl border border-gray-700 items-center">
              <Text className="text-white text-lg font-JakartaSemiBold mb-2">
                No Cleaner Selected
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Please select a cleaner from the find service screen
              </Text>
              <CustomButton
                title="Find a Cleaner"
                onPress={() => router.push("/(root)/find-service")}
                className="mt-4"
              />
            </View>
          ) : null}
        </View>
      </ServiceLayout>
    );
  }

  const estimatedPrice =
    Number(selectedServiceType.base_price) +
    Number(selectedServiceType.price_per_hour) *
      Number(selectedServiceType.estimated_duration_hours);

  return (
    <ServiceLayout title="Confirm Service" snapPoints={["65%", "85%"]}>
      <View className="p-5">
        <Text className="text-xl font-JakartaBold mb-5 text-white">
          Service Details
        </Text>

        <View className="bg-dark-200 p-4 rounded-lg mb-5 border border-gray-700">
          <Text className="text-lg font-JakartaSemiBold text-white">
            {selectedServiceType.name}
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            {selectedServiceType.description}
          </Text>
          <Text className="text-sm text-gray-400 mt-2">
            Location: {serviceAddress}
          </Text>
          <Text className="text-sm text-gray-400">
            Duration: {selectedServiceType.estimated_duration_hours} hours
          </Text>
          <Text className="text-lg font-JakartaBold mt-2 text-primary-500">
            Total: ${estimatedPrice.toFixed(2)}
          </Text>
        </View>

        <Text className="text-xl font-JakartaBold mb-5 text-white">
          Your Cleaner
        </Text>

        <View className="bg-dark-200 p-4 rounded-lg flex-row items-center border border-gray-700">
          {selectedCleanerData.profile_image_url ? (
            <Image
              source={{ uri: selectedCleanerData.profile_image_url }}
              className="w-16 h-16 rounded-full mr-4"
            />
          ) : (
            <View className="w-16 h-16 rounded-full mr-4 bg-primary-500 items-center justify-center">
              <Text className="text-white text-xl font-JakartaBold">
                {selectedCleanerData.first_name?.charAt(0) || "?"}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-lg font-JakartaSemiBold text-white">
              {selectedCleanerData.first_name} {selectedCleanerData.last_name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Image
                source={icons.star}
                className="w-4 h-4 mr-1"
                tintColor="#FACC15"
              />
              <Text className="text-sm text-gray-400">
                {selectedCleanerData.rating}
              </Text>
            </View>
            <Text className="text-sm text-gray-400 mt-1">
              Arrives in: {selectedCleanerData.time} min
            </Text>
            <Text className="text-sm text-gray-400">
              Specialties: {selectedCleanerData.specialties?.join(", ")}
            </Text>
          </View>
        </View>

        <View className="mt-10">
          <CustomButton
            title="Book Service"
            onPress={() => router.push("/(root)/book-service")}
          />
        </View>
      </View>
    </ServiceLayout>
  );
};

export default ConfirmService;
