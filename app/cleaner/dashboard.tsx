import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { icons } from "@/constants";
import {
  APIFetchError,
  ApiResponse,
  fetchAPI,
  setAuthToken,
} from "@/lib/fetch";
import { showToast } from "@/components/Toast";
import CustomButton from "@/components/CustomButton";
import { CleanerSession } from "@/types/type";

interface CleanerJob {
  id: string;
  service_type_name: string;
  location_address: string;
  scheduled_date: string;
  estimated_duration: number;
  total_price: number;
  status: string;
  user_name: string;
  user_phone: string;
}

const Dashboard = () => {
  const [cleaner, setCleaner] = useState<CleanerSession | null>(null);
  const [jobs, setJobs] = useState<CleanerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [denying, setDenying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [earnings, setEarnings] = useState<{
    total_earned: number;
    paid_jobs: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const fetchAvailableJobs = useCallback(async (cleanerId: string) => {
    try {
      setError(null);
      const result = await fetchAPI<ApiResponse<CleanerJob[]>>(
        `/(api)/cleaner/jobs?cleanerId=${cleanerId}`,
      );
      if (result.data) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      const result = await fetchAPI<
        ApiResponse<{ total_earned: number; paid_jobs: number }>
      >(`/(api)/cleaner/earnings`);
      if (result.data) {
        setEarnings(result.data);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  }, []);

  const loadCleanerSession = useCallback(async () => {
    try {
      const sessionData = await SecureStore.getItemAsync("cleaner_session");
      if (sessionData) {
        const cleanerData = JSON.parse(sessionData);
        setCleaner(cleanerData);
        void fetchAvailableJobs(cleanerData.id);
        void fetchEarnings();
      } else {
        router.replace("/cleaner/sign-in");
      }
    } catch (error) {
      console.error("Error loading session:", error);
      router.replace("/cleaner/sign-in");
    }
  }, [fetchAvailableJobs, fetchEarnings]);

  useEffect(() => {
    void loadCleanerSession();
  }, [loadCleanerSession]);

  // Refresh when the tab regains focus, and poll while focused so new
  // bookings appear without manual refresh.
  useEffect(() => {
    if (!isFocused || !cleaner) return;
    void fetchAvailableJobs(cleaner.id);
    void fetchEarnings();
  }, [isFocused, cleaner, fetchAvailableJobs, fetchEarnings]);

  useEffect(() => {
    if (!isFocused || !cleaner) return;
    const interval = setInterval(() => {
      void fetchAvailableJobs(cleaner.id);
      void fetchEarnings();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isFocused, cleaner, fetchAvailableJobs, fetchEarnings]);

  // Poll the unread notification count while focused (cancellations and
  // customer activity land server-side) so the header badge stays fresh.
  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    const tick = async () => {
      try {
        const result = await fetchAPI<ApiResponse<{ count: number }>>(
          `/(api)/notifications/unread`,
        );
        if (active && result.data) {
          setUnreadCount(result.data.count);
        }
      } catch {
        // Best-effort badge; failures just keep the last known count.
      }
    };
    void tick();
    const interval = setInterval(() => void tick(), 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    if (!cleaner) return;
    setRefreshing(true);
    fetchAvailableJobs(cleaner.id);
  }, [cleaner, fetchAvailableJobs]);

  const handleAcceptJob = async (jobId: string) => {
    if (!cleaner) return;
    try {
      setAccepting(jobId);
      const result = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/cleaner/accept-job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, cleanerId: cleaner.id }),
        },
      );

      if (result.data) {
        showToast("Job accepted! Check your jobs tab.", "success");
        void fetchAvailableJobs(cleaner.id);
      } else {
        showToast(result.error || "Failed to accept job", "error");
        void fetchAvailableJobs(cleaner.id);
      }
    } catch (error) {
      const isConflict =
        error instanceof APIFetchError &&
        (error.statusCode === 409 || error.errorCode === "CONFLICT");
      if (isConflict) {
        showToast("This job was just taken by another cleaner", "info");
      } else {
        console.error("Error accepting job:", error);
        showToast("Failed to accept job", "error");
      }
      void fetchAvailableJobs(cleaner.id);
    } finally {
      setAccepting(null);
    }
  };

  const handleDenyJob = async (jobId: string) => {
    if (!cleaner) return;
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Deny Job",
        "The customer paid for this job. Denying returns it to the open list and releases their payment (no charge taken).",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Deny Job",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true },
      );
    });
    if (!confirmed) return;

    try {
      setDenying(jobId);
      const result = await fetchAPI<ApiResponse<{ status: string }>>(
        "/(api)/cleaner/deny-job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, cleanerId: cleaner.id }),
        },
      );

      if (result.data) {
        showToast("Job denied — customer can pick another cleaner", "info");
      } else {
        showToast(result.error || "Failed to deny job", "error");
      }
      void fetchAvailableJobs(cleaner.id);
    } catch (error) {
      console.error("Error denying job:", error);
      showToast("Failed to deny job", "error");
      void fetchAvailableJobs(cleaner.id);
    } finally {
      setDenying(null);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("cleaner_session");
            await SecureStore.deleteItemAsync("cleaner_token");
            setAuthToken(null);
            router.replace("/cleaner/sign-in");
          } catch (error) {
            console.error("Error signing out:", error);
            showToast("Failed to sign out", "error");
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-500";
      case "matched":
        return "bg-blue-500";
      case "arrived":
        return "bg-purple-500";
      case "in_progress":
        return "bg-primary-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const renderJobCard = ({ item }: { item: CleanerJob }) => (
    <TouchableOpacity
      onPress={() => router.push(`/cleaner/job/${item.id}` as Href)}
      activeOpacity={0.8}
      className="bg-dark-200 rounded-xl p-4 mb-4 border border-gray-700"
      accessibilityLabel={`Job: ${item.service_type_name}, status: ${item.status.replaceAll("_", " ")}`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-JakartaSemiBold text-lg">
            {item.service_type_name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Image
              source={icons.point}
              className="w-4 h-4"
              tintColor="#9CA3AF"
            />
            <Text className="text-gray-400 text-sm ml-1" numberOfLines={1}>
              {item.location_address}
            </Text>
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}
        >
          <Text className="text-white text-xs font-JakartaMedium capitalize">
            {item.status.replaceAll("_", " ")}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Image
            source={icons.calendar}
            className="w-4 h-4"
            tintColor="#9CA3AF"
          />
          <Text className="text-gray-400 text-sm ml-2">
            {formatDate(item.scheduled_date)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Image
            source={icons.dollar}
            className="w-4 h-4"
            tintColor="#22C55E"
          />
          <Text className="text-primary-500 font-JakartaBold ml-1">
            ${item.total_price}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-4">
        <Image source={icons.person} className="w-4 h-4" tintColor="#9CA3AF" />
        <Text className="text-gray-400 text-sm ml-2">{item.user_name}</Text>
        <Text className="text-gray-500 text-sm ml-1">• {item.user_phone}</Text>
      </View>

      {item.status === "requested" && (
        <View className="flex-row gap-3">
          <CustomButton
            title={accepting === item.id ? "Accepting..." : "Accept Job"}
            onPress={() => handleAcceptJob(item.id)}
            disabled={accepting === item.id || denying === item.id}
            bgVariant="success"
            className="flex-1"
            accessibilityLabel={`Accept job ${item.service_type_name}`}
          />
          <CustomButton
            title={denying === item.id ? "Denying..." : "Deny"}
            onPress={() => handleDenyJob(item.id)}
            disabled={accepting === item.id || denying === item.id}
            bgVariant="danger"
            className="flex-1"
            accessibilityLabel={`Deny job ${item.service_type_name}`}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  if (!cleaner) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="p-5 border-b border-gray-800">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-JakartaBold">
              Welcome, {cleaner.first_name}!
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {cleaner.is_available ? "Available for jobs" : "Currently busy"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/cleaner/notifications" as Href)}
            className="bg-dark-300 p-3 rounded-full mr-3"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Image source={icons.list} className="w-5 h-5" tintColor="white" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1 border border-dark-500">
                <Text className="text-white text-[10px] font-JakartaBold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-dark-300 p-3 rounded-full"
          >
            <Image source={icons.out} className="w-5 h-5" tintColor="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row p-5 gap-4">
        <View className="flex-1 bg-dark-200 rounded-xl p-4 border border-gray-700">
          <Text className="text-gray-400 text-sm">Rating</Text>
          <View className="flex-row items-center mt-1">
            <Image
              source={icons.star}
              className="w-4 h-4"
              tintColor="#FBBF24"
            />
            <Text className="text-white font-JakartaBold text-lg ml-1">
              {typeof cleaner.rating === "number"
                ? cleaner.rating.toFixed(1)
                : "N/A"}
            </Text>
          </View>
        </View>
        <View className="flex-1 bg-dark-200 rounded-xl p-4 border border-gray-700">
          <Text className="text-gray-400 text-sm">Jobs Completed</Text>
          <View className="flex-row items-center mt-1">
            <Image
              source={icons.list}
              className="w-4 h-4"
              tintColor="#22C55E"
            />
            <Text className="text-white font-JakartaBold text-lg ml-1">
              {cleaner.completed_jobs || 0}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/earnings" as Href)}
        className="mx-5 mb-3 bg-dark-200 rounded-xl p-4 border border-gray-700"
        activeOpacity={0.7}
      >
        <Text className="text-gray-400 text-sm">Total Earnings</Text>
        <View className="flex-row items-end justify-between mt-1">
          <View className="flex-row items-center">
            <Image
              source={icons.dollar}
              className="w-5 h-5"
              tintColor="#22C55E"
            />
            <Text className="text-white font-JakartaBold text-xl ml-1.5">
              ${earnings ? earnings.total_earned.toFixed(2) : "0.00"}
            </Text>
          </View>
          <Text className="text-gray-500 text-sm">
            {earnings?.paid_jobs ?? 0} paid{" "}
            {(earnings?.paid_jobs ?? 0) === 1 ? "job" : "jobs"}
          </Text>
        </View>
      </TouchableOpacity>

      <View className="px-5 mb-3">
        <Text className="text-white text-lg font-JakartaSemiBold">
          Available Jobs
        </Text>
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
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
            <View className="items-center mt-10">
              <Text className="text-red-400 text-center">{error}</Text>
              <CustomButton
                title="Retry"
                onPress={() => fetchAvailableJobs(cleaner.id)}
                className="mt-4"
              />
            </View>
          ) : (
            <View className="items-center mt-10 px-6">
              <Image
                source={icons.list}
                className="w-16 h-16 mb-4"
                tintColor="#6B7280"
              />
              <Text className="text-general-500 text-center font-JakartaMedium">
                No jobs available right now
              </Text>
              <Text className="text-general-600 text-sm text-center mt-1">
                New jobs will appear here when customers book services
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Dashboard;
