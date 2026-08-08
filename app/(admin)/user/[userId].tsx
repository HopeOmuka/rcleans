import { router, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showToast } from "@/components/Toast";
import { icons } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate, formatDateTime } from "@/lib/utils";

interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  stats: {
    total_bookings: number;
    active_bookings: number;
    total_spent: number;
  };
  recent: {
    id: string;
    status: string;
    payment_status: string;
    total_price: number;
    created_at: string;
    scheduled_date: string | null;
    service_type_name: string;
    cleaner_first_name: string | null;
    cleaner_last_name: string | null;
  }[];
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  requested: { pill: "bg-amber-100", label: "text-amber-700" },
  matched: { pill: "bg-blue-100", label: "text-blue-700" },
  confirmed: { pill: "bg-blue-100", label: "text-blue-700" },
  arrived: { pill: "bg-indigo-100", label: "text-indigo-700" },
  in_progress: { pill: "bg-cyan-100", label: "text-cyan-700" },
  completed: { pill: "bg-green-100", label: "text-green-700" },
  cancelled: { pill: "bg-red-100", label: "text-red-700" },
  refunded: { pill: "bg-red-100", label: "text-red-700" },
};

const UserDetail = () => {
  const { theme } = useTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    data: user,
    loading,
    error,
    refetch,
  } = useFetch<AdminUserDetail>(`/(api)/admin/users/${userId}`, {
    enabled: Boolean(userId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleActive = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const res = await fetchAPI.post<ApiResponse<{ is_active: boolean }>>(
        `/(api)/admin/users/${user!.id}`,
        {
          action: user!.is_active ? "deactivate" : "activate",
        },
      );
      if (res.data) {
        showToast(
          res.data.is_active ? "User activated" : "User deactivated",
          "success",
        );
        void refetch();
      } else {
        showToast(res.error ?? "Action failed", "error");
      }
    } catch {
      showToast("Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !user) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color="#4ADE80" />
      </SafeAreaView>
    );
  }

  if ((error || !user) && !loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text className="text-center" style={{ color: theme.colors.danger }}>
          {error ?? "User not found"}
        </Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          className="mt-4 bg-primary-500 px-5 py-2.5 rounded-lg"
        >
          <Text className="text-white font-JakartaMedium">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          <Image
            source={icons.backArrow}
            className="w-5 h-5"
            tintColor={theme.colors.text}
          />
        </TouchableOpacity>
        <Text
          className="text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          User detail
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row items-center">
            {user!.profile_image_url ? (
              <Image
                source={{ uri: user!.profile_image_url }}
                className="w-16 h-16 rounded-full"
                style={{ backgroundColor: theme.colors.surfaceMuted }}
              />
            ) : (
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.colors.primarySoft }}
              >
                <Text
                  className="text-2xl font-JakartaBold"
                  style={{ color: theme.colors.primary }}
                >
                  {user!.name?.charAt(0) || "U"}
                </Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text
                  className="text-lg font-JakartaSemiBold"
                  style={{ color: theme.colors.text }}
                >
                  {user!.name}
                </Text>
                {user!.is_admin ? (
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: theme.colors.primarySoft }}
                  >
                    <Text
                      className="text-[10px] font-JakartaSemiBold"
                      style={{ color: theme.colors.primary }}
                    >
                      ADMIN
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {user!.email}
              </Text>
              {user!.phone ? (
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {user!.phone}
                </Text>
              ) : null}
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: user!.is_active
                  ? theme.colors.primarySoft
                  : theme.colors.dangerSoft,
              }}
            >
              <Text
                className="text-xs font-JakartaSemiBold"
                style={{
                  color: user!.is_active
                    ? theme.colors.success
                    : theme.colors.danger,
                }}
              >
                {user!.is_active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <Text
            className="text-xs mt-3"
            style={{ color: theme.colors.textMuted }}
          >
            Joined {formatDate(user!.created_at)}
          </Text>
        </View>

        <View
          className="rounded-2xl border p-4 mt-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-sm font-JakartaSemiBold mb-3"
            style={{ color: theme.colors.text }}
          >
            Summary
          </Text>
          <View className="flex-row justify-between">
            <View>
              <Text
                className="text-2xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                {user!.stats.total_bookings}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Total bookings
              </Text>
            </View>
            <View className="items-center">
              <Text
                className="text-2xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                {user!.stats.active_bookings}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Active
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-2xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                ${Number(user!.stats.total_spent).toFixed(2)}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Total spent
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => void toggleActive()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            user!.is_active ? "Deactivate user" : "Activate user"
          }
          className={`mt-4 py-3 rounded-xl items-center ${
            user!.is_active ? "bg-amber-500" : "bg-primary-500"
          }`}
        >
          <Text className="text-white font-JakartaSemiBold">
            {busy
              ? "..."
              : user!.is_active
                ? "Deactivate user"
                : "Activate user"}
          </Text>
        </TouchableOpacity>

        <View
          className="rounded-2xl border p-4 mt-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-sm font-JakartaSemiBold mb-3"
            style={{ color: theme.colors.text }}
          >
            Bookings
          </Text>
          {user!.recent.length === 0 ? (
            <Text className="text-sm" style={{ color: theme.colors.textMuted }}>
              No bookings yet.
            </Text>
          ) : (
            user!.recent.map((booking) => {
              const style =
                STATUS_STYLES[booking.status] ?? STATUS_STYLES.requested;
              return (
                <TouchableOpacity
                  key={booking.id}
                  onPress={() =>
                    router.push(`/(admin)/booking/${booking.id}` as Href)
                  }
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between py-3"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-sm font-JakartaSemiBold"
                      style={{ color: theme.colors.text }}
                    >
                      {booking.service_type_name}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {booking.cleaner_first_name
                        ? `${booking.cleaner_first_name} ${booking.cleaner_last_name ?? ""} · `
                        : ""}
                      {formatDateTime(booking.created_at)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-sm font-JakartaBold"
                      style={{ color: theme.colors.text }}
                    >
                      ${Number(booking.total_price).toFixed(2)}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full mt-1 ${style.pill}`}
                    >
                      <Text
                        className={`text-[10px] font-JakartaSemiBold ${style.label}`}
                      >
                        {booking.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserDetail;
