import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useCallback } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatChatTime } from "@/lib/utils";
import { ChatConversation } from "@/types/type";

const Chat = () => {
  const { theme } = useTheme();
  const {
    data: conversations,
    loading,
    error,
    refetch,
  } = useFetch<ChatConversation[]>("/(api)/chat/conversations");

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const renderConversation = ({ item }: { item: ChatConversation }) => {
    const initial = item.other_name?.charAt(0)?.toUpperCase() || "C";
    return (
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/(root)/chat/${item.service_id}?otherName=${encodeURIComponent(item.other_name)}&otherId=${item.other_id}` as Href,
          )
        }
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
        className="flex-row items-center px-4 py-3 border rounded-2xl mb-2.5"
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${item.other_name} about ${item.service_type_name}`}
      >
        <View className="w-12 h-12 rounded-full bg-primary-gradient items-center justify-center mr-3">
          {item.other_avatar ? (
            <Image
              source={{ uri: item.other_avatar }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <Text className="text-white text-lg font-JakartaExtraBold">
              {initial}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-base font-JakartaSemiBold flex-1"
              numberOfLines={1}
              style={{ color: theme.colors.text }}
            >
              {item.other_name}
            </Text>
            {item.last_message_at && (
              <Text
                className="text-xs ml-2"
                style={{ color: theme.colors.textMuted }}
              >
                {formatChatTime(item.last_message_at)}
              </Text>
            )}
          </View>
          <Text
            className="text-xs font-JakartaMedium mt-0.5"
            style={{ color: theme.colors.primary }}
          >
            {item.service_type_name}
          </Text>
          <Text
            className="text-sm mt-0.5"
            numberOfLines={1}
            style={{ color: theme.colors.textSecondary }}
          >
            {item.last_message || "Start the conversation"}
          </Text>
        </View>

        {item.unread_count > 0 && (
          <View className="ml-3 min-w-6 h-6 px-1.5 rounded-full bg-primary-500 items-center justify-center">
            <Text className="text-white text-xs font-JakartaBold">
              {item.unread_count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 p-5"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Text
        className="text-2xl font-JakartaBold mb-4"
        style={{ color: theme.colors.text }}
      >
        Chat
      </Text>

      {loading && !conversations ? (
        <View>
          {[1, 2, 3].map((key) => (
            <View
              key={key}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
              className="flex-row items-center px-4 py-3 border rounded-2xl mb-2.5"
            >
              <SkeletonLoader width={48} height={48} borderRadius={24} />
              <View className="flex-1 ml-3">
                <SkeletonLoader width="40%" height={14} />
                <SkeletonLoader
                  width="70%"
                  height={12}
                  borderRadius={6}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : error && !conversations ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="text-center mb-4"
            style={{ color: theme.colors.textSecondary }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-accent-500 px-5 py-2.5 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Retry loading chats"
          >
            <Text className="text-white font-JakartaMedium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.service_id}
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
            <View className="flex-1 items-center justify-center pt-16 px-7">
              <BootstrapIcon
                name="chat-dots"
                size={112}
                color={theme.colors.textMuted}
              />
              <Text
                className="text-2xl font-JakartaBold mt-3"
                style={{ color: theme.colors.text }}
              >
                No Conversations Yet
              </Text>
              <Text
                className="text-base mt-2 text-center"
                style={{ color: theme.colors.textSecondary }}
              >
                Once a cleaner is matched to your booking, you can chat with
                them right here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Chat;
