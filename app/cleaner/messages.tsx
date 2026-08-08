import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ChatThread from "@/components/ChatThread";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch-hook";
import { formatChatTime } from "@/lib/utils";
import { ChatConversation } from "@/types/type";

const Messages = () => {
  const {
    data: conversations,
    loading,
    error,
    refetch,
  } = useFetch<ChatConversation[]>("/(api)/chat/conversations");
  const [active, setActive] = useState<ChatConversation | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const renderConversation = ({ item }: { item: ChatConversation }) => {
    const initial = item.other_name?.charAt(0)?.toUpperCase() || "C";
    return (
      <TouchableOpacity
        onPress={() => setActive(item)}
        className="flex-row items-center p-4 bg-dark-200 rounded-xl mb-2.5 border border-gray-700"
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
              className="text-base font-JakartaSemiBold text-white flex-1"
              numberOfLines={1}
            >
              {item.other_name}
            </Text>
            {item.last_message_at && (
              <Text className="text-xs text-gray-500 ml-2">
                {formatChatTime(item.last_message_at)}
              </Text>
            )}
          </View>
          <Text className="text-xs text-primary-500 font-JakartaMedium mt-0.5 capitalize">
            {item.status.replaceAll("_", " ")} • {item.service_type_name}
          </Text>
          <Text className="text-sm text-gray-400 mt-0.5" numberOfLines={1}>
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

  if (active) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-800 bg-dark-200">
          <TouchableOpacity
            onPress={() => {
              setActive(null);
              void refetch();
            }}
            className="w-10 h-10 rounded-full bg-dark-300 items-center justify-center mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Image
              source={icons.backArrow}
              className="w-5 h-5"
              tintColor="white"
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-lg font-JakartaSemiBold text-white"
              numberOfLines={1}
            >
              {active.other_name}
            </Text>
            <Text className="text-xs text-primary-500 font-JakartaMedium capitalize">
              {active.service_type_name}
            </Text>
          </View>
        </View>

        <ChatThread
          serviceId={active.service_id}
          otherName={active.other_name}
          recipientId={active.other_id}
          role="cleaner"
          theme="dark"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="p-5 border-b border-gray-800">
        <Text className="text-white text-2xl font-JakartaBold">Messages</Text>
        <Text className="text-gray-400 text-sm mt-1">
          Chat with your customers
        </Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.service_id}
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
              <Image
                source={icons.chat}
                className="w-16 h-16 mb-4"
                tintColor="#6B7280"
              />
              <Text className="text-general-500 text-center font-JakartaMedium">
                No conversations yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Messages from customers appear here once you accept a job
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Messages;
