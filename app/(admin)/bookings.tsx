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

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/utils";

interface AdminService {
  id: string;
  status: string;
  total_price: number;
  payment_status: string;
  created_at: string;
  scheduled_date: string | null;
  service_type_name: string;
  user_name: string;
  user_email: string;
  cleaner_first_name: string | null;
  cleaner_last_name: string | null;
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

const Bookings = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: bookings,
    loading,
    error,
    refetch,
  } = useFetch<AdminService[]>("/(api)/admin/services");

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
          Bookings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !bookings ? (
          <ActivityIndicator size="large" color="#4ADE80" className="mt-10" />
        ) : error && !bookings ? (
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
        ) : bookings && bookings.length === 0 ? (
          <Text
            className="text-center mt-10"
            style={{ color: theme.colors.textSecondary }}
          >
            No bookings yet.
          </Text>
        ) : (
          bookings?.map((booking) => {
            const style =
              STATUS_STYLES[booking.status] ?? STATUS_STYLES.requested;
            const paid = booking.payment_status === "paid";
            return (
              <TouchableOpacity
                key={booking.id}
                onPress={() =>
                  router.push(`/(admin)/booking/${booking.id}` as Href)
                }
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Open ${booking.service_type_name} booking`}
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
                    {booking.service_type_name}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${style.pill}`}>
                    <Text
                      className={`text-xs font-JakartaSemiBold ${style.label}`}
                    >
                      {booking.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center mt-2">
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {booking.user_name}
                  </Text>
                  {booking.cleaner_first_name ? (
                    <Text
                      className="text-sm ml-2"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      • {booking.cleaner_first_name} {booking.cleaner_last_name}
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <View>
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {formatDate(booking.created_at)}
                    </Text>
                    {booking.scheduled_date ? (
                      <Text
                        className="text-xs"
                        style={{ color: theme.colors.textMuted }}
                      >
                        Scheduled: {formatDate(booking.scheduled_date)}
                      </Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-base font-JakartaBold"
                      style={{ color: theme.colors.text }}
                    >
                      ${booking.total_price.toFixed(2)}
                    </Text>
                    <Text
                      className={`text-xs font-JakartaSemiBold ${paid ? "text-green-600" : "text-amber-600"}`}
                    >
                      {booking.payment_status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bookings;
