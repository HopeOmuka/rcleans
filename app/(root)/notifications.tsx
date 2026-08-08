import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useCallback } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import BootstrapIcon from "@/components/BootstrapIcon";
import SkeletonLoader from "@/components/SkeletonLoader";

import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatChatTime } from "@/lib/utils";
import { NotificationItem } from "@/types/type";

const Notifications = () => {
  const { theme } = useTheme();
  const {
    data: notifications,
    loading,
    error,
    refetch,
  } = useFetch<NotificationItem[]>(`/(api)/notifications`, {
    enabled: true,
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
      // Opening the center counts as reading everything.
      fetchAPI
        .post<ApiResponse<{ success: boolean }>>(`/(api)/notifications/read`)
        .then(() => {
          void refetch();
        })
        .catch(() => {
          // Read receipts are best-effort.
        });
    }, [refetch]),
  );

  const handleBack = () => {
    router.back();
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.service_id) return;
    router.push(`/service/${item.service_id}` as Href);
  };

  const renderNotificationCard = (item: NotificationItem) => (
    <View
      className="mb-3 p-4 rounded-2xl border"
      style={
        item.is_read
          ? {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          : {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.primary,
            }
      }
    >
      <View className="flex-row items-start justify-between">
        <Text
          className="flex-1 text-base font-JakartaSemiBold pr-3"
          style={{ color: theme.colors.text }}
        >
          {item.title}
        </Text>
        {!item.is_read && (
          <View
            className="w-2.5 h-2.5 rounded-full mt-1.5"
            style={{ backgroundColor: theme.colors.primary }}
          />
        )}
      </View>
      <Text
        className="text-sm mt-1"
        style={{ color: theme.colors.textSecondary }}
      >
        {item.message}
      </Text>
      <Text
        className="text-xs mt-2 font-JakartaMedium"
        style={{ color: theme.colors.textMuted }}
      >
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
        accessibilityLabel={`View booking: ${item.title}`}
      >
        {renderNotificationCard(item)}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View
        className="flex-row items-center px-4 py-3 border-b"
        style={{
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BootstrapIcon
            name="chevron-left"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text
          className="text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Notifications
        </Text>
      </View>

      {loading && !notifications ? (
        <View className="px-5 pt-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} height={110} borderRadius={16} />
          ))}
        </View>
      ) : error ? (
        <EmptyState
          title="Something went wrong"
          description={error}
          icon="exclamation-triangle"
          variant="light"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          className="px-5 pt-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center pt-16">
              <BootstrapIcon
                name="bell"
                size={96}
                color={theme.colors.textMuted}
              />
              <Text
                className="text-sm mt-2"
                style={{ color: theme.colors.textSecondary }}
              >
                No notifications yet
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;
