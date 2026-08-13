import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import BootstrapIcon from "@/components/BootstrapIcon";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { formatChatTime } from "@/lib/utils";
import { ChatMessage } from "@/types/type";

const POLL_MS = 5000;
const TYPING_HEARTBEAT_MS = 3000;

interface ChatThreadProps {
  serviceId: string;
  otherName: string;
  recipientId: string;
  role: "user" | "cleaner";
  theme?: "light" | "dark";
}

const ChatThread: React.FC<ChatThreadProps> = ({
  serviceId,
  otherName,
  recipientId,
  role,
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const isMountedRef = useRef(true);
  const lastTypingSentRef = useRef(0);

  const markRead = useCallback(async () => {
    try {
      await fetchAPI<ApiResponse<{ success: boolean }>>("/(api)/chat/read", {
        method: "POST",
        body: JSON.stringify({ serviceId }),
      });
    } catch {
      // Best-effort; unread state is cosmetic.
    }
  }, [serviceId]);

  const loadMessages = useCallback(
    async (silent = false) => {
      try {
        const result = await fetchAPI<ApiResponse<ChatMessage[]>>(
          `/(api)/chat?serviceId=${serviceId}`,
        );
        if (!isMountedRef.current) return;
        if (result.data) {
          // Keep optimistic (temp) messages until their POST resolves, and
          // merge the server list (newest first, as the inverted list needs).
          setMessages((prev) => {
            const serverIds = new Set(result.data!.map((m) => m.id));
            const temps = prev.filter(
              (m) => m.id.startsWith("temp-") && !serverIds.has(m.id),
            );
            return [...temps, ...result.data!];
          });
          setError(null);
          if (result.data.some((m) => !m.is_read && m.sender_type !== role)) {
            void markRead();
          }
        }
      } catch {
        if (!isMountedRef.current) return;
        if (!silent) setError("Couldn't load messages");
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [serviceId, role, markRead],
  );

  // Poll whether the other participant is currently typing.
  const loadTyping = useCallback(async () => {
    try {
      const result = await fetchAPI<
        ApiResponse<{ typing: ("user" | "cleaner")[] }>
      >(`/(api)/chat/typing?serviceId=${serviceId}`);
      if (!isMountedRef.current) return;
      if (result.data) {
        setOtherTyping(
          result.data.typing.includes(role === "user" ? "cleaner" : "user"),
        );
      }
    } catch {
      // Typing presence is best-effort; ignore failures.
    }
  }, [serviceId, role]);

  // Stamp "I am typing" on a heartbeat while the input has text, but never
  // more often than TYPING_HEARTBEAT_MS.
  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_HEARTBEAT_MS) return;
    lastTypingSentRef.current = now;
    fetchAPI
      .post<ApiResponse<{ success: boolean }>>("/(api)/chat/typing", {
        serviceId,
      })
      .catch(() => {
        // Best-effort; presence is ephemeral anyway.
      });
  }, [serviceId]);

  const onInputChange = useCallback(
    (text: string) => {
      setInput(text);
      if (text.trim()) emitTyping();
    },
    [emitTyping],
  );

  useEffect(() => {
    isMountedRef.current = true;
    void loadMessages(false);
    void loadTyping();

    const interval = setInterval(() => {
      void loadMessages(true);
      void loadTyping();
    }, POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadMessages, loadTyping]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      service_id: serviceId,
      sender_id: "me",
      sender_type: role,
      recipient_id: recipientId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [optimistic, ...prev]);
    setInput("");
    setSending(true);

    try {
      const result = await fetchAPI<ApiResponse<ChatMessage>>("/(api)/chat", {
        method: "POST",
        body: JSON.stringify({ serviceId, recipientId, content }),
      });
      if (!isMountedRef.current) return;
      if (result.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? result.data! : m)),
        );
      } else {
        showToast(result.error || "Failed to send message", "error");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(content);
      }
    } catch {
      if (isMountedRef.current) {
        showToast("Failed to send message", "error");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(content);
      }
    } finally {
      if (isMountedRef.current) setSending(false);
    }
  }, [input, sending, serviceId, recipientId, role]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_type === role;
    return (
      <View
        className={`my-1 max-w-[80%] ${
          isMine ? "self-end items-end" : "self-start items-start"
        }`}
        accessibilityLabel={`${isMine ? "You" : otherName}: ${item.content}`}
      >
        <View
          className={`px-4 py-2.5 rounded-2xl ${
            isMine
              ? "bg-primary-500 rounded-br-md"
              : isDark
                ? "bg-dark-200 border border-gray-700 rounded-bl-md"
                : "bg-general-100 rounded-bl-md"
          }`}
        >
          <Text
            className={`text-base leading-snug ${
              isMine
                ? "text-primary-900"
                : isDark
                  ? "text-white"
                  : "text-general-900"
            }`}
          >
            {item.content}
          </Text>
        </View>
        <Text
          className={`text-xs mt-1 ${
            isDark ? "text-gray-500" : "text-general-400"
          }`}
        >
          {formatChatTime(item.created_at)}
        </Text>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className={`flex-1 ${isDark ? "bg-dark-500" : "bg-white"}`}
    >
      {error && messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className={`text-base text-center mb-4 ${
              isDark ? "text-gray-400" : "text-general-500"
            }`}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setLoading(true);
              void loadMessages(false);
            }}
            className="bg-accent-500 px-5 py-2.5 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Retry loading messages"
          >
            <Text className="text-white font-JakartaMedium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 mt-10">
              <BootstrapIcon
                name="chat-dots"
                size={56}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text
                className={`text-center font-JakartaMedium ${
                  isDark ? "text-gray-400" : "text-general-500"
                }`}
              >
                No messages yet. Say hi to {otherName}!
              </Text>
            </View>
          }
          ListFooterComponent={
            otherTyping ? (
              <View
                className="flex-row items-center self-start px-4 py-2.5 rounded-2xl mb-2"
                style={{
                  backgroundColor: isDark ? "#1F2937" : "#F1F5F9",
                }}
                accessibilityLabel={`${otherName} is typing`}
              >
                <View className="flex-row items-center mr-2">
                  {[0, 1, 2].map((dot) => (
                    <View
                      key={dot}
                      className="w-1.5 h-1.5 rounded-full mx-0.5"
                      style={{ backgroundColor: "#9CA3AF" }}
                    />
                  ))}
                </View>
                <Text
                  className="text-sm"
                  style={{
                    color: isDark ? "#D1D5DB" : "#6B7280",
                  }}
                >
                  {otherName} is typing
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <View
        className={`flex-row items-center px-4 py-3 border-t ${
          isDark ? "bg-dark-200 border-gray-800" : "bg-white border-general-200"
        }`}
      >
        <TextInput
          className={`flex-1 rounded-full px-4 py-2.5 text-base ${
            isDark
              ? "bg-dark-100 text-white border border-gray-700"
              : "bg-general-100 text-general-900"
          }`}
          placeholder="Type a message..."
          placeholderTextColor={isDark ? "#9CA3AF" : "#94A3B8"}
          value={input}
          onChangeText={onInputChange}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || sending}
          className={`ml-2 w-11 h-11 rounded-full bg-primary-500 items-center justify-center ${
            !input.trim() || sending ? "opacity-40" : ""
          }`}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {sending ? (
            <ActivityIndicator size="small" color="#052E16" />
          ) : (
            <BootstrapIcon
              name="arrow-up"
              size={20}
              color={isDark ? "#FFFFFF" : "#052E16"}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatThread;
