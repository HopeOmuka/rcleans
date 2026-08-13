import { Href, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showToast } from "@/components/Toast";
import BootstrapIcon from "@/components/BootstrapIcon";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDateTime } from "@/lib/utils";

interface SupportTicket {
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

const Support = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState<"help_center" | "contact_support">(
    "contact_support",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    data: tickets,
    loading,
    error,
    refetch,
  } = useFetch<SupportTicket[]>("/(api)/support");

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const submit = async () => {
    if (!message.trim()) {
      showToast("Please write a message", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchAPI.post<ApiResponse<{ success: boolean }>>(
        "/(api)/support",
        { subject, message: message.trim() },
      );
      if (res.data) {
        showToast("Ticket submitted", "success");
        setShowForm(false);
        setMessage("");
        void refetch();
      } else {
        showToast(res.error ?? "Could not send ticket", "error");
      }
    } catch {
      showToast("Could not send ticket", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTicket = ({ item }: { item: SupportTicket }) => {
    const style = STATUS_STYLES[item.status] ?? STATUS_STYLES.open;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(root)/support/${item.id}` as Href)}
        className="rounded-2xl border p-4 mb-3"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open ticket ${SUBJECT_LABELS[item.subject] ?? item.subject}`}
      >
        <View className="flex-row items-center justify-between">
          <Text
            className="text-base font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            {SUBJECT_LABELS[item.subject] ?? item.subject}
          </Text>
          <View className={`px-2.5 py-0.5 rounded-full ${style.pill}`}>
            <Text className={`text-xs font-JakartaSemiBold ${style.label}`}>
              {item.status.replace("_", " ")}
            </Text>
          </View>
        </View>
        <Text
          className="text-sm mt-1.5"
          style={{ color: theme.colors.textSecondary }}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text
          className="text-xs mt-2"
          style={{ color: theme.colors.textMuted }}
        >
          {formatDateTime(item.created_at)}
        </Text>
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
          className="text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Support
        </Text>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="ml-auto bg-primary-500 px-4 py-2 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel="Contact support"
        >
          <Text className="text-white text-sm font-JakartaSemiBold">
            New ticket
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tickets}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          loading && !tickets ? (
            <Text
              className="text-center mt-10"
              style={{ color: theme.colors.textMuted }}
            >
              Loading...
            </Text>
          ) : (
            <View className="items-center px-6 py-10">
              <Text
                className="text-center"
                style={{ color: theme.colors.textSecondary }}
              >
                No support tickets yet.
              </Text>
              <Text
                className="text-xs text-center mt-1"
                style={{ color: theme.colors.textMuted }}
              >
                {error || "Tap 'New ticket' to reach our team."}
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="rounded-t-3xl p-5"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-lg font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                Contact support
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={8}>
                <BootstrapIcon
                  name="x-lg"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2 mb-3">
              {(["contact_support", "help_center"] as const).map((s) => {
                const isActive = subject === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSubject(s)}
                    accessibilityRole="button"
                    style={
                      isActive
                        ? {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                          }
                        : {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          }
                    }
                    className="px-4 py-2 rounded-lg border"
                  >
                    <Text
                      className="text-sm font-JakartaSemiBold"
                      style={{
                        color: isActive
                          ? theme.colors.primaryContrast
                          : theme.colors.textSecondary,
                      }}
                    >
                      {SUBJECT_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue or question..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
              className="border rounded-xl p-3 min-h-[100px] text-base"
            />

            <TouchableOpacity
              onPress={() => void submit()}
              disabled={submitting}
              accessibilityRole="button"
              style={{
                backgroundColor: submitting
                  ? theme.colors.primary + "88"
                  : theme.colors.primary,
              }}
              className="mt-4 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-JakartaSemiBold">
                {submitting ? "Sending..." : "Send ticket"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Support;
