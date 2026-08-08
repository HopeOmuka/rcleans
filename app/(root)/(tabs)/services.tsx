import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import type { Href } from "expo-router";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";

import CancelBookingModal from "@/components/CancelBookingModal";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import ServiceCard from "@/components/ServiceCard";
import BootstrapIcon from "@/components/BootstrapIcon";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { Service } from "@/types/type";

const CANCELLABLE_STATUSES = ["requested", "matched", "confirmed"];

const ACTIVE_STATUSES = [
  "requested",
  "matched",
  "confirmed",
  "arrived",
  "in_progress",
] as const;

type FilterTab = "all" | "active" | "past";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
];

const Services = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [cancellingService, setCancellingService] =
    React.useState<Service | null>(null);

  const {
    data: recentServices,
    loading,
    error,
    refetch,
  } = useFetch<Service[]>(`/(api)/services?user_id=${user?.id}`, {
    enabled: !!user?.id,
  });

  const filteredServices = React.useMemo(() => {
    if (!recentServices) return recentServices;
    if (filter === "all") return recentServices;
    if (filter === "active") {
      return recentServices.filter((s) =>
        (ACTIVE_STATUSES as readonly string[]).includes(s.status),
      );
    }
    return recentServices.filter(
      (s) => !(ACTIVE_STATUSES as readonly string[]).includes(s.status),
    );
  }, [recentServices, filter]);

  const handleRatePress = (service: Service) => {
    router.push(
      `/rate-service?serviceId=${service.id}&userId=${service.user_id}&cleanerId=${service.cleaner_id}`,
    );
  };

  const handleCancelPress = (service: Service) => {
    setCancellingService(service);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
      {loading && !recentServices ? (
        <LoadingSpinner text="Loading services..." />
      ) : error ? (
        <EmptyState
          title="Something went wrong"
          description={error}
          icon="exclamation-triangle"
          variant="light"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={(service) =>
                router.push(`/service/${service.id}` as Href)
              }
              onRatePress={handleRatePress}
              onCancelPress={
                CANCELLABLE_STATUSES.includes(item.status)
                  ? handleCancelPress
                  : undefined
              }
            />
          )}
          keyExtractor={(item) => item.id}
          className="px-5"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View className="flex flex-col items-center justify-center px-5 pt-6">
              <BootstrapIcon
                name="calendar"
                size={112}
                color={theme.colors.textMuted}
              />
              <Text
                className="text-base font-JakartaSemiBold text-center mt-1"
                style={{ color: theme.colors.text }}
              >
                {filter === "active"
                  ? "No active services"
                  : filter === "past"
                    ? "No past services yet"
                    : "No services yet"}
              </Text>
              <Text
                className="text-sm text-center mt-1 mb-5"
                style={{ color: theme.colors.textSecondary }}
              >
                {filter === "active"
                  ? "Book a cleaning and track it here."
                  : filter === "past"
                    ? "Completed cleanings will show up here."
                    : "Book your first cleaning to get started."}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Browse services"
                onPress={() => router.push("/(root)/(tabs)/home" as Href)}
                className="bg-primary-500 px-6 py-3 rounded-full shadow-sm shadow-primary-200"
              >
                <Text className="text-white font-JakartaBold">
                  Book a cleaning
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={
            <View>
              <Text
                className="text-2xl font-JakartaBold my-5"
                style={{ color: theme.colors.text }}
              >
                My Services
              </Text>
              <View className="flex-row mb-3 gap-2">
                {FILTER_TABS.map((tab) => {
                  const count =
                    tab.key === "all"
                      ? (recentServices?.length ?? 0)
                      : tab.key === "active"
                        ? (recentServices?.filter((s) =>
                            (ACTIVE_STATUSES as readonly string[]).includes(
                              s.status,
                            ),
                          ).length ?? 0)
                        : (recentServices?.filter(
                            (s) =>
                              !(ACTIVE_STATUSES as readonly string[]).includes(
                                s.status,
                              ),
                          ).length ?? 0);
                  const isActive = filter === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setFilter(tab.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`${tab.label} services`}
                      style={{
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: isActive
                          ? theme.colors.primary
                          : theme.colors.border,
                      }}
                      className={`flex-1 py-2.5 rounded-full items-center border flex-row justify-center gap-1.5 ${
                        isActive ? "shadow-sm shadow-primary-200" : ""
                      }`}
                    >
                      <Text
                        className="text-sm font-JakartaSemiBold"
                        style={{
                          color: isActive
                            ? "#FFFFFF"
                            : theme.colors.textSecondary,
                        }}
                      >
                        {tab.label}
                      </Text>
                      <View
                        className="min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.25)"
                            : theme.colors.surfaceMuted,
                        }}
                      >
                        <Text
                          className="text-[11px] font-JakartaBold"
                          style={{
                            color: isActive
                              ? "#FFFFFF"
                              : theme.colors.textSecondary,
                          }}
                        >
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
        />
      )}

      <CancelBookingModal
        service={cancellingService}
        onClose={() => setCancellingService(null)}
        onCancelled={() => void refetch()}
      />
    </SafeAreaView>
  );
};

export default Services;
