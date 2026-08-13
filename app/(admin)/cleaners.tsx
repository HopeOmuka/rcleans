import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
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

interface AdminCleaner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  rating: number;
  completed_jobs: number;
  years_experience: number | null;
  is_available: boolean;
  is_active: boolean;
  background_check_status: string;
  insurance_status: string;
}

const Cleaners = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const {
    data: cleaners,
    loading,
    error,
    refetch,
  } = useFetch<AdminCleaner[]>("/(api)/admin/cleaners");

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

  const runAction = async (id: string, action: string, toast: string) => {
    setProcessingId(id);
    try {
      await fetchAPI<ApiResponse<AdminCleaner>>(`/(api)/admin/cleaners/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      showToast(toast, "success");
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Action failed. Try again.";
      showToast(message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const bgBadge = (cleaner: AdminCleaner) => {
    const approved = cleaner.background_check_status === "approved";
    return (
      <View
        className="px-2.5 py-0.5 rounded-full"
        style={{
          backgroundColor: approved
            ? theme.colors.primarySoft
            : theme.colors.dangerSoft,
        }}
      >
        <Text
          className="text-xs font-JakartaSemiBold"
          style={{
            color: approved ? theme.colors.success : theme.colors.danger,
          }}
        >
          {approved ? "Background ✓" : "Background ✗"}
        </Text>
      </View>
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
          Cleaners
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !cleaners ? (
          <ActivityIndicator size="large" color="#4ADE80" className="mt-10" />
        ) : error && !cleaners ? (
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
        ) : (
          cleaners?.map((cleaner) => {
            const busy = processingId === cleaner.id;
            const needsApproval =
              cleaner.background_check_status !== "approved";
            return (
              <TouchableOpacity
                key={cleaner.id}
                onPress={() =>
                  router.push(`/(admin)/cleaner/${cleaner.id}` as Href)
                }
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`View ${cleaner.first_name} ${cleaner.last_name}`}
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
                    {cleaner.first_name} {cleaner.last_name}
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: cleaner.is_active
                        ? theme.colors.primarySoft
                        : theme.colors.surfaceMuted,
                    }}
                  >
                    <Text
                      className="text-xs font-JakartaSemiBold"
                      style={{
                        color: cleaner.is_active
                          ? theme.colors.success
                          : theme.colors.textSecondary,
                      }}
                    >
                      {cleaner.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-sm mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {cleaner.email}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    ★ {cleaner.rating.toFixed(1)}
                  </Text>
                  <Text
                    className="text-sm ml-3"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {cleaner.completed_jobs} jobs
                  </Text>
                  <Text
                    className="text-sm ml-3"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {cleaner.years_experience ?? 0} yrs exp
                  </Text>
                </View>
                <View className="flex-row items-center mt-2">
                  {bgBadge(cleaner)}
                  <View
                    className="ml-2 px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: cleaner.is_available
                        ? theme.colors.primarySoft
                        : theme.colors.surfaceMuted,
                    }}
                  >
                    <Text
                      className="text-xs font-JakartaSemiBold"
                      style={{
                        color: cleaner.is_available
                          ? theme.colors.success
                          : theme.colors.textSecondary,
                      }}
                    >
                      {cleaner.is_available ? "Available" : "Unavailable"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-3 gap-2">
                  <TouchableOpacity
                    onPress={() =>
                      void runAction(
                        cleaner.id,
                        cleaner.is_available
                          ? "set_unavailable"
                          : "set_available",
                        cleaner.is_available
                          ? "Cleaner marked unavailable"
                          : "Cleaner marked available",
                      )
                    }
                    disabled={busy}
                    className={`flex-1 rounded-lg py-2 items-center ${cleaner.is_available ? "" : "border border-amber-400"}`}
                    style={
                      cleaner.is_available
                        ? { backgroundColor: theme.colors.primarySoft }
                        : undefined
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${cleaner.is_available ? "Mark unavailable" : "Mark available"} ${cleaner.first_name}`}
                  >
                    <Text
                      className={`text-sm font-JakartaSemiBold ${cleaner.is_available ? "" : "text-amber-500"}`}
                      style={
                        cleaner.is_available
                          ? { color: theme.colors.success }
                          : undefined
                      }
                    >
                      {busy
                        ? "Updating..."
                        : cleaner.is_available
                          ? "Set unavailable"
                          : "Set available"}
                    </Text>
                  </TouchableOpacity>
                  {needsApproval ? (
                    <TouchableOpacity
                      onPress={() =>
                        void runAction(
                          cleaner.id,
                          "approve",
                          "Cleaner approved",
                        )
                      }
                      disabled={busy}
                      className="flex-1 bg-green-600 rounded-lg py-2 items-center"
                      accessibilityRole="button"
                      accessibilityLabel={`Approve ${cleaner.first_name}`}
                    >
                      <Text className="text-white text-sm font-JakartaSemiBold">
                        {busy ? "Updating..." : "Approve"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {needsApproval ? (
                    <TouchableOpacity
                      onPress={() =>
                        void runAction(cleaner.id, "reject", "Cleaner rejected")
                      }
                      disabled={busy}
                      className="flex-1 rounded-lg py-2 items-center"
                      style={{ backgroundColor: theme.colors.dangerSoft }}
                      accessibilityRole="button"
                      accessibilityLabel={`Reject ${cleaner.first_name}`}
                    >
                      <Text
                        className="text-sm font-JakartaSemiBold"
                        style={{ color: theme.colors.danger }}
                      >
                        Reject
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() =>
                        void runAction(
                          cleaner.id,
                          cleaner.is_active ? "deactivate" : "activate",
                          cleaner.is_active
                            ? "Cleaner deactivated"
                            : "Cleaner activated",
                        )
                      }
                      disabled={busy}
                      className={`flex-1 rounded-lg py-2 items-center ${cleaner.is_active ? "" : "bg-primary-500"}`}
                      style={
                        cleaner.is_active
                          ? { backgroundColor: theme.colors.surfaceMuted }
                          : undefined
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${cleaner.is_active ? "Deactivate" : "Activate"} ${cleaner.first_name}`}
                    >
                      <Text
                        className={`text-sm font-JakartaSemiBold ${cleaner.is_active ? "" : "text-white"}`}
                        style={
                          cleaner.is_active
                            ? { color: theme.colors.text }
                            : undefined
                        }
                      >
                        {busy
                          ? "Updating..."
                          : cleaner.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Cleaners;
