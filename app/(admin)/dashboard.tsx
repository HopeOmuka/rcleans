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

interface AdminStats {
  total_users: number;
  total_cleaners: number;
  available_cleaners: number;
  active_cleaners: number;
  total_services: number;
  pending_services: number;
  matched_services: number;
  in_progress_services: number;
  completed_services: number;
  cancelled_services: number;
  revenue: number;
  avg_rating: number;
  open_support: number;
}

interface AdminBooking {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  service_type_name: string;
  user_name: string;
}

const BOOKING_STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  requested: { pill: "bg-amber-100", label: "text-amber-700" },
  matched: { pill: "bg-blue-100", label: "text-blue-700" },
  confirmed: { pill: "bg-blue-100", label: "text-blue-700" },
  arrived: { pill: "bg-indigo-100", label: "text-indigo-700" },
  in_progress: { pill: "bg-cyan-100", label: "text-cyan-700" },
  completed: { pill: "bg-green-100", label: "text-green-700" },
  cancelled: { pill: "bg-red-100", label: "text-red-700" },
  refunded: { pill: "bg-red-100", label: "text-red-700" },
};

const Dashboard = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: stats,
    loading,
    error,
    refetch,
  } = useFetch<AdminStats>("/(api)/admin/stats");

  const { data: bookings, refetch: refetchBookings } = useFetch<AdminBooking[]>(
    "/(api)/admin/services",
  );

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchBookings();
    }, [refetch, refetchBookings]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    await refetchBookings();
    setRefreshing(false);
  };

  const statCards: { label: string; value: string; accent?: boolean }[] = stats
    ? [
        { label: "Customers", value: String(stats.total_users) },
        { label: "Cleaners", value: String(stats.total_cleaners) },
        {
          label: "Active Cleaners",
          value: String(stats.active_cleaners),
        },
        { label: "Total Bookings", value: String(stats.total_services) },
        { label: "Pending Requests", value: String(stats.pending_services) },
        {
          label: "In Progress",
          value: String(stats.in_progress_services),
        },
        { label: "Completed", value: String(stats.completed_services) },
        { label: "Cancelled", value: String(stats.cancelled_services) },
        {
          label: "Revenue",
          value: `$${stats.revenue.toFixed(2)}`,
          accent: true,
        },
        {
          label: "Avg Rating",
          value: stats.avg_rating ? `${stats.avg_rating.toFixed(1)} ★` : "—",
        },
        { label: "Open Support", value: String(stats.open_support) },
      ]
    : [];

  const sections = [
    {
      label: "Bookings",
      description: "All service requests and their status",
      route: "/bookings" as Href,
      icon: icons.list,
    },
    {
      label: "Cleaners",
      description: "Approvals, availability and ratings",
      route: "/cleaners" as Href,
      icon: icons.person,
    },
    {
      label: "Users",
      description: "Registered customer accounts",
      route: "/users" as Href,
      icon: icons.profile,
    },
    {
      label: "Service Catalog",
      description: "Service types, addons and promos",
      route: "/catalog" as Href,
      icon: icons.dollar,
    },
    {
      label: "Support Inbox",
      description: `Open tickets (${stats?.open_support ?? 0})`,
      route: "/support" as Href,
      icon: icons.chat,
    },
  ];

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
          Admin Dashboard
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !stats ? (
          <ActivityIndicator size="large" color="#4ADE80" className="mt-10" />
        ) : error && !stats ? (
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
          <>
            <View className="flex-row flex-wrap">
              {statCards.map((card) => (
                <View
                  key={card.label}
                  className={`w-[48%] m-[1%] rounded-2xl p-4 border ${
                    card.accent ? "border-primary-500 bg-primary-500" : ""
                  }`}
                  style={
                    card.accent
                      ? undefined
                      : {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        }
                  }
                >
                  <Text
                    className={`text-sm font-JakartaMedium ${card.accent ? "text-white/85" : ""}`}
                    style={
                      card.accent
                        ? undefined
                        : { color: theme.colors.textSecondary }
                    }
                  >
                    {card.label}
                  </Text>
                  <Text
                    className={`text-xl font-JakartaBold mt-1 ${card.accent ? "text-white" : ""}`}
                    style={
                      card.accent ? undefined : { color: theme.colors.text }
                    }
                  >
                    {card.value}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              className="text-xl font-JakartaBold mt-6 mb-3"
              style={{ color: theme.colors.text }}
            >
              Recent Bookings
            </Text>
            <View
              className="rounded-2xl border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              {!bookings || bookings.length === 0 ? (
                <Text
                  className="text-sm px-4 py-4"
                  style={{ color: theme.colors.textMuted }}
                >
                  {bookings ? "No bookings yet." : "Loading..."}
                </Text>
              ) : (
                bookings.slice(0, 5).map((booking, index) => {
                  const style =
                    BOOKING_STATUS_STYLES[booking.status] ??
                    BOOKING_STATUS_STYLES.requested;
                  return (
                    <TouchableOpacity
                      key={booking.id}
                      onPress={() =>
                        router.push(`/(admin)/booking/${booking.id}` as Href)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${booking.service_type_name} booking`}
                      className="flex-row items-center px-4 py-3"
                      style={
                        index < 4
                          ? {
                              borderBottomWidth: 1,
                              borderBottomColor: theme.colors.border,
                            }
                          : undefined
                      }
                    >
                      <View className="flex-1 mr-3">
                        <Text
                          className="text-sm font-JakartaSemiBold"
                          style={{ color: theme.colors.text }}
                        >
                          {booking.service_type_name}
                        </Text>
                        <Text
                          className="text-xs mt-0.5"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {booking.user_name}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded-full mr-3 ${style.pill}`}
                      >
                        <Text
                          className={`text-[10px] font-JakartaSemiBold ${style.label}`}
                        >
                          {booking.status.replace("_", " ")}
                        </Text>
                      </View>
                      <Text
                        className="text-sm font-JakartaBold"
                        style={{ color: theme.colors.text }}
                      >
                        ${Number(booking.total_price).toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
              {bookings && bookings.length > 5 ? (
                <TouchableOpacity
                  onPress={() => router.push("/(admin)/bookings" as Href)}
                  accessibilityRole="button"
                  className="px-4 py-3 border-t items-center"
                  style={{ borderTopColor: theme.colors.border }}
                >
                  <Text
                    className="text-sm font-JakartaSemiBold"
                    style={{ color: theme.colors.primary }}
                  >
                    View all bookings
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text
              className="text-xl font-JakartaBold mt-6 mb-3"
              style={{ color: theme.colors.text }}
            >
              Manage
            </Text>
            <View
              className="rounded-2xl border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              {sections.map((section, index) => (
                <TouchableOpacity
                  key={section.label}
                  onPress={() =>
                    router.push(`/(admin)${section.route}` as Href)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={section.label}
                  className="flex-row items-center px-4 py-4"
                  style={
                    index < sections.length - 1
                      ? {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.border,
                        }
                      : undefined
                  }
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: theme.colors.primarySoft }}
                  >
                    <Image
                      source={section.icon}
                      className="w-5 h-5"
                      tintColor={theme.colors.primaryBright}
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text
                      className="text-base font-JakartaSemiBold"
                      style={{ color: theme.colors.text }}
                    >
                      {section.label}
                    </Text>
                    <Text
                      className="text-sm mt-0.5"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {section.description}
                    </Text>
                  </View>
                  <Image
                    source={icons.arrowUp}
                    className="w-4 h-4 rotate-90"
                    tintColor={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
