import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/utils";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  user_name: string;
  user_email: string;
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  open: { pill: "bg-amber-100", label: "text-amber-700" },
  in_progress: { pill: "bg-blue-100", label: "text-blue-700" },
  resolved: { pill: "bg-green-100", label: "text-green-700" },
};

const AdminSupport = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    data: tickets,
    loading,
    error,
    refetch,
  } = useFetch<SupportTicket[]>("/(api)/support?all=true");

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

  const updateStatus = async (ticket: SupportTicket, status: string) => {
    setBusyId(ticket.id);
    try {
      const res = await fetchAPI.post<
        ApiResponse<{ id: string; status: string }>
      >("/(api)/support", {
        action: "updateStatus",
        ticketId: ticket.id,
        status,
      });
      if (res.data) {
        showToast(`Ticket marked ${status.replace("_", " ")}`, "success");
        void refetch();
      } else {
        showToast(res.error ?? "Update failed", "error");
      }
    } catch {
      showToast("Update failed", "error");
    } finally {
      setBusyId(null);
    }
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
          Support inbox
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !tickets ? (
          <ActivityIndicator size="large" color="#4ADE80" className="mt-10" />
        ) : error && !tickets ? (
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
            >
              <Text className="text-white font-JakartaMedium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tickets && tickets.length === 0 ? (
          <Text
            className="text-center mt-10"
            style={{ color: theme.colors.textSecondary }}
          >
            No support tickets.
          </Text>
        ) : (
          tickets?.map((ticket) => {
            const style = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.open;
            const busy = busyId === ticket.id;
            return (
              <View
                key={ticket.id}
                className="rounded-2xl border p-4 mb-3"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-JakartaSemiBold"
                    style={{ color: theme.colors.text }}
                  >
                    {ticket.subject.replace("_", " ")}
                  </Text>
                  <View className={`px-2.5 py-0.5 rounded-full ${style.pill}`}>
                    <Text
                      className={`text-xs font-JakartaSemiBold ${style.label}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-sm mt-1.5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {ticket.message}
                </Text>
                <View className="flex-row justify-between items-end mt-2">
                  <View>
                    <Text
                      className="text-xs font-JakartaMedium"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {ticket.user_name} · {ticket.user_email}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {formatDate(ticket.created_at)}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    {ticket.status !== "in_progress" ? (
                      <TouchableOpacity
                        onPress={() => void updateStatus(ticket, "in_progress")}
                        disabled={busy}
                        className="bg-blue-50 px-3 py-1.5 rounded-lg"
                      >
                        <Text className="text-blue-700 text-xs font-JakartaSemiBold">
                          Start
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {ticket.status !== "resolved" ? (
                      <TouchableOpacity
                        onPress={() => void updateStatus(ticket, "resolved")}
                        disabled={busy}
                        className="bg-green-50 px-3 py-1.5 rounded-lg"
                      >
                        <Text className="text-green-700 text-xs font-JakartaSemiBold">
                          Resolve
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminSupport;
