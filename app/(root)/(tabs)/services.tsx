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
  const { user } = useUser();

  const { data: recentServices, loading } = useFetch<Service[]>(
    `/(api)/service/${user?.id}`,
  );

  const handleRatePress = (service: Service) => {
    router.push(
      `/rate-service?serviceId=${service.id}&userId=${service.user_id}&cleanerId=${service.cleaner_id}`,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={recentServices}
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
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No recent services found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No recent services found</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <Text className="text-2xl font-JakartaBold my-5">All Services</Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Services;
