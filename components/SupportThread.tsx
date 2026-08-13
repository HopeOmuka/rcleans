import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDateTime } from "@/lib/utils";
export interface SupportReply {
  id: string;
  sender_type: "user" | "admin";
  sender_name: string;
  message: string;
  created_at: string;
}

interface SupportTicketMeta {
  id: string;
  subject: "help_center" | "contact_support";
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  help_center: "Help Center",
  contact_support: "Contact Support",
};

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  open: { pill: "bg-amber-100", label: "text-amber-700" },
  in_progress: { pill: "bg-blue-100", label: "text-blue-700" },
  resolved: { pill: "bg-green-100", label: "text-green-700" },
};

interface SupportThreadProps {
  ticketId: string;
}

const SupportThread = ({ ticketId }: SupportThreadProps) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { data, loading, error, refetch } = useFetch<{
    ticket: SupportTicketMeta;
    replies: SupportReply[];
  }>(`/(api)/support?replies=${ticketId}`);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const sendReply = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const res = await fetchAPI.post<ApiResponse<SupportReply>>(
        "/(api)/support",
        { action: "reply", ticketId, message: draft.trim() },
      );
      if (res.data) {
        setDraft("");
        void refetch();
      } else {
        showToast(res.error ?? "Could not send reply", "error");
      }
    } catch {
      showToast("Could not send reply", "error");
    } finally {
      setSending(false);
    }
  };

  const ticket = data?.ticket;
  const replies = data?.replies ?? [];
  const statusStyle = STATUS_STYLES[ticket?.status ?? "open"];

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
          onPress={() => router.back()}
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
          className="text-lg font-JakartaSemiBold flex-1"
          style={{ color: theme.colors.text }}
          numberOfLines={1}
        >
          {ticket
            ? (SUBJECT_LABELS[ticket.subject] ?? ticket.subject)
            : "Ticket"}
        </Text>
        {ticket ? (
          <View className={`px-2.5 py-0.5 rounded-full ${statusStyle.pill}`}>
            <Text
              className={`text-xs font-JakartaSemiBold ${statusStyle.label}`}
            >
              {ticket.status.replace("_", " ")}
            </Text>
          </View>
        ) : null}
      </View>

      <FlatList
        className="flex-1"
        data={replies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          loading && !ticket ? (
            <ActivityIndicator className="mt-10" color={theme.colors.primary} />
          ) : error && !ticket ? (
            <View className="items-center mt-10 px-6">
              <Text
                className="text-center"
                style={{ color: theme.colors.danger }}
              >
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => void refetch()}
                className="mt-4 bg-primary-500 px-5 py-2.5 rounded-lg"
                accessibilityRole="button"
              >
                <Text className="text-white font-JakartaMedium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : ticket ? (
            <View
              className="rounded-2xl border p-4 mb-4"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <Text
                className="text-sm font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                Your message
              </Text>
              <Text
                className="text-sm mt-1.5"
                style={{ color: theme.colors.textSecondary }}
              >
                {ticket.message}
              </Text>
              <Text
                className="text-xs mt-2"
                style={{ color: theme.colors.textMuted }}
              >
                {formatDateTime(ticket.created_at)}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const fromUser = item.sender_type === "user";
          return (
            <View
              className={`mb-3 max-w-[82%] ${
                fromUser ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <Text
                className="text-xs mb-1 font-JakartaMedium"
                style={{ color: theme.colors.textMuted }}
              >
                {fromUser ? "You" : item.sender_name}
              </Text>
              <View
                className="rounded-2xl px-4 py-2.5"
                style={{
                  backgroundColor: fromUser
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: fromUser
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderWidth: fromUser ? 0 : 1,
                }}
              >
                <Text
                  className="text-sm"
                  style={{
                    color: fromUser
                      ? theme.colors.primaryContrast
                      : theme.colors.text,
                  }}
                >
                  {item.message}
                </Text>
                <Text
                  className="text-[10px] mt-1"
                  style={{
                    color: fromUser
                      ? theme.colors.primaryContrast + "AA"
                      : theme.colors.textMuted,
                  }}
                >
                  {formatDateTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          ticket && replies.length === 0 ? (
            <Text
              className="text-center mt-6"
              style={{ color: theme.colors.textMuted }}
            >
              No replies yet.
            </Text>
          ) : null
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-row items-center px-3 py-2.5 border-t"
          style={{
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a reply..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={{
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
            className="flex-1 border rounded-xl px-3 py-2 text-sm max-h-24"
          />
          <TouchableOpacity
            onPress={() => void sendReply()}
            disabled={sending || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send reply"
            style={{
              backgroundColor:
                sending || !draft.trim()
                  ? theme.colors.primary + "88"
                  : theme.colors.primary,
            }}
            className="ml-2 w-11 h-11 rounded-full items-center justify-center"
          >
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <BootstrapIcon name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SupportThread;
