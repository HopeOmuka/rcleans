import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { icons, images } from "@/constants";

interface Message {
  id: string;
  user_id: string;
  cleaner_id: string;
  service_id: string;
  sender_type: "user" | "cleaner";
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
  service_type_name: string;
  last_message: string;
  last_message_time: string;
  is_read: boolean;
  other_user_name: string;
  other_user_avatar: string;
}

const Chat = () => {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/(api)/conversations?userId=${user?.id}`);
      const result = await response.json();
      if (result.data) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/(api)/chat?userId=${user?.id}&serviceId=${conversationId}`,
      );
      const result = await response.json();
      if (result.data) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    try {
      setSending(true);
      const response = await fetch("/(api)/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          serviceId: selectedConversation,
          senderType: "user",
          senderId: user.id,
          message: newMessage.trim(),
        }),
      });

      const result = await response.json();
      if (result.data) {
        setMessages((prev) => [...prev, result.data]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    fetchMessages(conversationId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    return date.toLocaleDateString();
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => handleConversationSelect(item.conversation_id)}
      className="flex-row items-center p-4 border-b border-gray-800 bg-dark-200"
    >
      <View className="w-12 h-12 rounded-full overflow-hidden mr-3">
        {item.other_user_avatar ? (
          <Image
            source={{ uri: item.other_user_avatar }}
            className="w-full h-full"
          />
        ) : (
          <View className="w-full h-full bg-primary-500 items-center justify-center">
            <Text className="text-white font-JakartaBold">
              {item.other_user_name?.charAt(0) || "?"}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center">
          <Text className="text-white font-JakartaSemiBold">
            {item.other_user_name || "Unknown"}
          </Text>
          <Text className="text-gray-400 text-xs">
            {formatTime(item.last_message_time)}
          </Text>
        </View>
        <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
          {item.service_type_name}
        </Text>
        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
          {item.last_message || "No messages yet"}
        </Text>
      </View>
      {!item.is_read && (
        <View className="w-3 h-3 bg-primary-500 rounded-full ml-2" />
      )}
    </TouchableOpacity>
  );

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_type === "user";

    return (
      <View
        className={`flex ${isOwnMessage ? "items-end" : "items-start"} mb-3 px-4`}
      >
        <View
          className={`max-w-[70%] p-3 rounded-2xl ${
            isOwnMessage
              ? "bg-primary-500 rounded-br-none"
              : "bg-dark-300 rounded-bl-none"
          }`}
        >
          <Text className="text-white">{item.message}</Text>
        </View>
        <Text className="text-gray-500 text-xs mt-1">
          {formatTime(item.created_at)}
        </Text>
      </View>
    );
  };

  if (selectedConversation) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500">
        <View className="flex-row items-center p-4 border-b border-gray-800 bg-dark-300">
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <Image
              source={icons.backArrow}
              className="w-6 h-6"
              tintColor="white"
            />
          </TouchableOpacity>
          <Text className="text-white font-JakartaSemiBold text-lg ml-4">
            Chat
          </Text>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessageBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator className="mt-10" color="#4ADE80" />
            ) : (
              <View className="items-center mt-10">
                <Text className="text-gray-500">No messages yet</Text>
              </View>
            )
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={90}
        >
          <View className="flex-row items-center p-4 border-t border-gray-800 bg-dark-300">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              className="flex-1 bg-dark-100 text-white p-3 rounded-lg mr-2"
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-primary-500 p-3 rounded-lg"
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Image
                  source={icons.arrowUp}
                  className="w-5 h-5"
                  tintColor="white"
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="p-5 border-b border-gray-800">
        <Text className="text-2xl font-JakartaBold text-white">Messages</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.conversation_id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator className="mt-10" color="#4ADE80" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Image
                source={images.message}
                className="w-40 h-40 opacity-50"
                resizeMode="contain"
              />
              <Text className="text-gray-500 mt-4 text-center px-7">
                No conversations yet. Book a service to start chatting with your
                cleaner!
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Chat;
