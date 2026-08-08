import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useCallback, useState } from "react";
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
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

const Users = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const {
    data: users,
    loading,
    error,
    refetch,
  } = useFetch<AdminUser[]>("/(api)/admin/users");

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

  const toggleActive = async (user: AdminUser) => {
    setProcessingId(user.id);
    try {
      await fetchAPI<ApiResponse<AdminUser>>(`/(api)/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: user.is_active ? "deactivate" : "activate",
        }),
      });
      showToast(
        user.is_active ? "User deactivated" : "User activated",
        "success",
      );
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Action failed. Try again.";
      showToast(message, "error");
    } finally {
      setProcessingId(null);
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
          Users
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !users ? (
          <ActivityIndicator size="large" color="#4ADE80" className="mt-10" />
        ) : error && !users ? (
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
          users?.map((user) => {
            const busy = processingId === user.id;
            return (
              <TouchableOpacity
                key={user.id}
                onPress={() => router.push(`/(admin)/user/${user.id}` as Href)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`View ${user.name || "user"} detail`}
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
                    {user.name || "Unnamed"}
                  </Text>
                  <View className="flex-row gap-2">
                    {user.is_admin ? (
                      <View className="px-2.5 py-0.5 rounded-full bg-purple-100">
                        <Text className="text-xs font-JakartaSemiBold text-purple-700">
                          Admin
                        </Text>
                      </View>
                    ) : null}
                    <View
                      className="px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: user.is_active
                          ? theme.colors.primarySoft
                          : theme.colors.surfaceMuted,
                      }}
                    >
                      <Text
                        className="text-xs font-JakartaSemiBold"
                        style={{
                          color: user.is_active
                            ? theme.colors.success
                            : theme.colors.textSecondary,
                        }}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text
                  className="text-sm mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {user.email}
                </Text>
                <View className="flex-row items-center justify-between mt-1">
                  <View>
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {user.phone ?? "No phone"}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Joined {formatDate(user.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => void toggleActive(user)}
                    disabled={busy || user.is_admin}
                    className={`px-4 py-1.5 rounded-lg ${user.is_active ? "" : "bg-primary-500"} ${user.is_admin ? "opacity-40" : ""}`}
                    style={
                      user.is_active
                        ? { backgroundColor: theme.colors.surfaceMuted }
                        : undefined
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${user.is_active ? "Deactivate" : "Activate"} ${user.name}`}
                  >
                    <Text
                      className={`text-xs font-JakartaSemiBold ${user.is_active ? "" : "text-white"}`}
                      style={
                        user.is_active
                          ? { color: theme.colors.text }
                          : undefined
                      }
                    >
                      {busy
                        ? "Updating..."
                        : user.is_active
                          ? "Deactivate"
                          : "Activate"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Users;
