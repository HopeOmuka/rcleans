import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import CustomButton from "@/components/CustomButton";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { formatChatTime } from "@/lib/utils";
import { NotificationItem } from "@/types/type";

const Notifications = () => {
  const {
    data: notifications,
    loading,
    error,
    refetch,
  } = useFetch<NotificationItem[]>("/notifications");
  const [markingRead, setMarkingRead] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      // Opening the center counts as reading everything.
      setMarkingRead(true);
      fetchAPI
        .post<ApiResponse<{ success: boolean }>>("/notifications/read")
        .then(() => {
          void refetch();
        })
        .catch(() => {
          // Read receipts are best-effort.
        })
        .finally(() => setMarkingRead(false));
    }, [refetch]),
  );

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.service_id) return;
    router.push(`/cleaner/job/${item.service_id}` as Href);
  };

  const renderNotificationCard = (item: NotificationItem) => (
    <View
      className={`mb-2.5 p-4 rounded-xl border ${
        item.is_read
          ? "bg-dark-200 border-gray-700"
          : "bg-dark-300 border-primary-500/50"
      }`}
    >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 text-base font-JakartaSemiBold text-white pr-3">
          {item.title}
        </Text>
        {!item.is_read && (
          <View className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5" />
        )}
      </View>
      <Text className="text-sm text-gray-400 mt-1">{item.message}</Text>
      <Text className="text-xs text-gray-500 mt-2 font-JakartaMedium">
        {formatChatTime(item.created_at)}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: NotificationItem }) => {
    if (!item.service_id) return renderNotificationCard(item);
    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`View job: ${item.title}`}
      >
        {renderNotificationCard(item)}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="p-5 border-b border-gray-800">
        <Text className="text-white text-2xl font-JakartaBold">
          Notifications
        </Text>
        <Text className="text-gray-400 text-sm mt-1">
          Booking updates from customers
        </Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => void refetch()}
            tintColor="#22C55E"
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator className="mt-10" color="#22C55E" />
          ) : error ? (
            <View className="items-center mt-10 px-6">
              <Text className="text-red-400 text-center">{error}</Text>
              <CustomButton
                title="Retry"
                onPress={() => void refetch()}
                className="mt-4"
              />
            </View>
          ) : (
            <View className="items-center mt-16 px-6">
              <BootstrapIcon
                name="list-ul"
                size={64}
                color="#6B7280"
                style={{ marginBottom: 16 }}
              />
              <Text className="text-general-500 text-center font-JakartaMedium">
                No notifications yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Cancellations and booking updates will appear here
              </Text>
            </View>
          )
        }
      />

      {markingRead && (
        <ActivityIndicator
          size="small"
          color="#22C55E"
          className="absolute bottom-6 self-center"
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;
