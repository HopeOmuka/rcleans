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

import BootstrapIcon from "@/components/BootstrapIcon";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate, formatDateTime } from "@/lib/utils";

interface AdminCleanerDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  rating: number;
  total_ratings: number;
  completed_jobs: number;
  years_experience: number | null;
  is_available: boolean;
  is_active: boolean;
  background_check_status: string;
  insurance_status: string;
  specialties: string[];
  bio: string | null;
  created_at: string;
  earnings: { paid_jobs: number; gross: number; avg_rating: number };
  recent: {
    id: string;
    status: string;
    payment_status: string;
    total_price: number;
    created_at: string;
    scheduled_date: string | null;
    service_type_name: string;
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

const CleanerDetail = () => {
  const { theme } = useTheme();
  const { cleanerId } = useLocalSearchParams<{ cleanerId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const {
    data: cleaner,
    loading,
    error,
    refetch,
  } = useFetch<AdminCleanerDetail>(`/(api)/admin/cleaners/${cleanerId}`, {
    enabled: Boolean(cleanerId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAction = async (action: string) => {
    if (!cleaner) return;
    setBusyAction(action);
    try {
      const res = await fetchAPI.post<ApiResponse<{ is_active: boolean }>>(
        `/(api)/admin/cleaners/${cleaner!.id}`,
        { action },
      );
      if (res.data) {
        showToast(
          action === "approve"
            ? "Cleaner approved"
            : action === "reject"
              ? "Cleaner rejected"
              : res.data.is_active
                ? "Cleaner activated"
                : "Cleaner deactivated",
          "success",
        );
        void refetch();
      } else {
        showToast(res.error ?? "Action failed", "error");
      }
    } catch {
      showToast("Action failed", "error");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading && !cleaner) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color="#4ADE80" />
      </SafeAreaView>
    );
  }

  if ((error || !cleaner) && !loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text className="text-center" style={{ color: theme.colors.danger }}>
          {error ?? "Cleaner not found"}
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

  const statusOk =
    cleaner!.background_check_status === "approved" &&
    cleaner!.insurance_status === "approved";

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
          Cleaner detail
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
            {cleaner!.profile_image_url ? (
              <Image
                source={{ uri: cleaner!.profile_image_url }}
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
                  {cleaner!.first_name?.charAt(0) || "C"}
                </Text>
              </View>
            )}
            <View className="ml-4 flex-1">
              <Text
                className="text-lg font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                {cleaner!.first_name} {cleaner!.last_name}
              </Text>
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {cleaner!.email}
              </Text>
              {cleaner!.phone ? (
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {cleaner!.phone}
                </Text>
              ) : null}
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: cleaner!.is_active
                  ? theme.colors.primarySoft
                  : theme.colors.dangerSoft,
              }}
            >
              <Text
                className="text-xs font-JakartaSemiBold"
                style={{
                  color: cleaner!.is_active
                    ? theme.colors.success
                    : theme.colors.danger,
                }}
              >
                {cleaner!.is_active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          {cleaner!.bio ? (
            <Text
              className="text-sm mt-3"
              style={{ color: theme.colors.textSecondary }}
            >
              {cleaner!.bio}
            </Text>
          ) : null}

          {cleaner!.specialties?.length > 0 ? (
            <Text
              className="text-sm mt-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {cleaner!.specialties.join(", ")}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap items-center justify-between mt-3">
            <Text className="text-xs" style={{ color: theme.colors.textMuted }}>
              Joined {formatDate(cleaner!.created_at)}
            </Text>
            <View className="flex-row items-center">
              <BootstrapIcon name="star" size={12} color="#4B5563" />
              <Text
                className="text-xs font-JakartaMedium ml-0.5"
                style={{ color: theme.colors.text }}
              >
                {Number(cleaner!.rating).toFixed(1)} ({cleaner!.total_ratings})
              </Text>
            </View>
          </View>
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
            Earnings (paid & completed)
          </Text>
          <View className="flex-row justify-between">
            <View>
              <Text
                className="text-2xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                ${Number(cleaner!.earnings.gross).toFixed(2)}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Gross earnings
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-2xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                {cleaner!.earnings.paid_jobs}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Paid jobs
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-2xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                {Number(cleaner!.earnings.avg_rating).toFixed(1)}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Avg rating
              </Text>
            </View>
          </View>
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
            Verification
          </Text>
          <View className="flex-row justify-between">
            <View>
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Background check
              </Text>
              <Text
                className={`text-sm font-JakartaSemiBold ${
                  cleaner!.background_check_status === "approved"
                    ? "text-green-600"
                    : cleaner!.background_check_status === "pending"
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {cleaner!.background_check_status}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Insurance
              </Text>
              <Text
                className={`text-sm font-JakartaSemiBold ${
                  cleaner!.insurance_status === "approved"
                    ? "text-green-600"
                    : cleaner!.insurance_status === "pending"
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {cleaner!.insurance_status}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Available
              </Text>
              <Text
                className={`text-sm font-JakartaSemiBold ${
                  cleaner!.is_available ? "text-green-600" : ""
                }`}
                style={
                  cleaner!.is_available
                    ? undefined
                    : { color: theme.colors.textSecondary }
                }
              >
                {cleaner!.is_available ? "Yes" : "No"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row mt-4">
          {cleaner!.is_active ? (
            <TouchableOpacity
              onPress={() => void handleAction("deactivate")}
              disabled={busyAction !== null}
              accessibilityRole="button"
              className="flex-1 py-3 rounded-xl bg-amber-500 items-center mr-2"
            >
              <Text className="text-white font-JakartaSemiBold">
                {busyAction === "deactivate" ? "..." : "Deactivate"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => void handleAction("activate")}
              disabled={busyAction !== null}
              accessibilityRole="button"
              className="flex-1 py-3 rounded-xl bg-primary-500 items-center mr-2"
            >
              <Text className="text-white font-JakartaSemiBold">
                {busyAction === "activate" ? "..." : "Activate"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => void handleAction(statusOk ? "reject" : "approve")}
            disabled={busyAction !== null}
            accessibilityRole="button"
            className={`flex-1 py-3 rounded-xl items-center ${
              statusOk ? "bg-red-500" : "bg-green-500"
            }`}
          >
            <Text className="text-white font-JakartaSemiBold">
              {busyAction === "approve" || busyAction === "reject"
                ? "..."
                : statusOk
                  ? "Revoke approval"
                  : "Approve"}
            </Text>
          </TouchableOpacity>
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
            Recent bookings
          </Text>
          {cleaner!.recent.length === 0 ? (
            <Text className="text-sm" style={{ color: theme.colors.textMuted }}>
              No bookings yet.
            </Text>
          ) : (
            cleaner!.recent.map((job) => {
              const style =
                STATUS_STYLES[job.status] ?? STATUS_STYLES.requested;
              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() =>
                    router.push(`/(admin)/booking/${job.id}` as Href)
                  }
                  activeOpacity={0.8}
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
                      {job.service_type_name}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {formatDateTime(job.created_at)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-sm font-JakartaBold"
                      style={{ color: theme.colors.text }}
                    >
                      ${Number(job.total_price).toFixed(2)}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full mt-1 ${style.pill}`}
                    >
                      <Text
                        className={`text-[10px] font-JakartaSemiBold ${style.label}`}
                      >
                        {job.status.replace("_", " ")}
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

export default CleanerDetail;
