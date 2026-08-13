import { router } from "expo-router";
import type { Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import { get } from "@/lib/fetch";
import { formatDate } from "@/lib/utils";

interface EarningJob {
  id: string;
  total_price: number;
  payment_status: string;
  scheduled_date: string | null;
  created_at: string;
  completed_at: string | null;
  service_type_name: string;
}

interface EarningSummary {
  total_earned: number;
  paid_jobs: number;
  jobs: EarningJob[];
}

const Earnings = () => {
  const [data, setData] = useState<EarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"all" | "week" | "month">("all");

  const fetchEarnings = useCallback(async () => {
    try {
      const result = await get<{ data: EarningSummary }>(
        `/(api)/cleaner/earnings?period=${period}`,
      );
      setData(
        result && typeof result === "object" && "data" in result
          ? (result as { data: EarningSummary }).data
          : result,
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    void fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  };

  const renderJob = ({ item }: { item: EarningJob }) => (
    <TouchableOpacity
      onPress={() => router.push(`/cleaner/job/${item.id}` as Href)}
      className="bg-dark-200 rounded-xl p-4 mb-3 border border-gray-700"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white font-JakartaSemiBold text-base flex-1 mr-2">
          {item.service_type_name}
        </Text>
        <Text className="text-primary-400 font-JakartaBold text-base">
          ${item.total_price.toFixed(2)}
        </Text>
      </View>
      <View className="flex-row items-center mt-2">
        <BootstrapIcon name="check" size={16} color="#22C55E" />
        <Text className="text-gray-400 text-sm ml-1.5">
          Paid {formatDate(item.completed_at ?? item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="flex-row items-center px-5 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-dark-300 items-center justify-center mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BootstrapIcon name="chevron-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-JakartaSemiBold">
          Earnings
        </Text>
      </View>

      <FlatList
        data={data?.jobs ?? []}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-5">
            <View className="bg-primary-500 rounded-xl p-5 mb-4">
              <Text className="text-primary-50/80 text-sm">Total Earnings</Text>
              <Text className="text-white font-JakartaExtraBold text-3xl mt-1">
                ${(data?.total_earned ?? 0).toFixed(2)}
              </Text>
              <Text className="text-primary-50/80 text-sm mt-1">
                {data?.paid_jobs ?? 0} paid{" "}
                {data?.paid_jobs === 1 ? "job" : "jobs"}
              </Text>
            </View>

            <View className="flex-row mb-4">
              {(
                [
                  { value: "week", label: "Last 7 days" },
                  { value: "month", label: "Last 30 days" },
                  { value: "all", label: "All time" },
                ] as const
              ).map(({ value, label }) => {
                const active = period === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setPeriod(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${label} earnings`}
                    className={`mr-2 px-4 py-2 rounded-full border ${
                      active ? "bg-primary-500 border-primary-500" : ""
                    }`}
                    style={active ? undefined : { borderColor: "#374151" }}
                  >
                    <Text
                      className={`text-sm font-JakartaMedium ${
                        active ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-JakartaSemiBold">
                Paid Jobs
              </Text>
              <Text className="text-gray-500 text-sm">
                {data?.jobs.length ?? 0}
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22C55E"
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator className="mt-10" color="#22C55E" />
          ) : error ? (
            <View className="items-center mt-10 px-6">
              <Text className="text-red-400 text-center">{error}</Text>
            </View>
          ) : (
            <Text className="text-gray-500 text-center mt-10">
              No paid jobs yet.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Earnings;
