import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ServiceCard from "@/components/ServiceCard";
import { images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { Service } from "@/types/type";
import React from "react";

const Services = () => {
  const { user, isLoaded } = useUser();

  const { data: recentServices, loading } = useFetch<Service[]>(
    isLoaded && user?.id
      ? `/(api)/service/${encodeURIComponent(user.id)}`
      : null,
  );

  const handleRatePress = (service: Service) => {
    router.push(
      `/rate-service?serviceId=${service.id}&userId=${service.user_id}&cleanerId=${service.cleaner_id}`,
    );
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500 items-center justify-center">
        <ActivityIndicator size="small" color="#4ADE80" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <FlatList
        data={recentServices || []}
        renderItem={({ item }) => (
          <ServiceCard service={item} onRatePress={handleRatePress} />
        )}
        keyExtractor={(item, index) => index.toString()}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center py-20">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-32 h-32 opacity-50"
                  alt="No recent services found"
                  resizeMode="contain"
                  tintColor="#666"
                />
                <Text className="text-gray-500 mt-4">
                  No cleaning services booked yet
                </Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#4ADE80" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <Text className="text-2xl font-JakartaBold text-white my-5">
              Your Bookings
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Services;
