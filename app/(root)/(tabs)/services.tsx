import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { FlatList, Image, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";

import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import ServiceCard from "@/components/ServiceCard";
import { images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { Service } from "@/types/type";

const Services = () => {
  const { user } = useUser();
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: recentServices,
    loading,
    error,
    refetch,
  } = useFetch<Service[]>(`/(api)/services?user_id=${user?.id}`);

  const handleRatePress = (service: Service) => {
    router.push(
      `/rate-service?serviceId=${service.id}&userId=${service.user_id}&cleanerId=${service.cleaner_id}`,
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-general-50">
      {loading && !recentServices ? (
        <LoadingSpinner text="Loading services..." />
      ) : error ? (
        <EmptyState
          title="Something went wrong"
          description={error}
          icon={images.noResult}
        />
      ) : (
        <FlatList
          data={recentServices}
          renderItem={({ item }) => (
            <ServiceCard service={item} onRatePress={handleRatePress} />
          )}
          keyExtractor={(item) => item.id}
          className="px-5"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View className="flex flex-col items-center justify-center">
              <Image
                source={images.noResult}
                className="w-40 h-40"
                alt="No recent services found"
                resizeMode="contain"
              />
              <Text className="text-sm">No recent services found</Text>
            </View>
          )}
          ListHeaderComponent={
            <>
              <Text className="text-2xl font-JakartaBold my-5">
                All Services
              </Text>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Services;
