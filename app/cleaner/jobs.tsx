import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import BootstrapIcon from "@/components/BootstrapIcon";
import ChatThread from "@/components/ChatThread";
import CustomButton from "@/components/CustomButton";
import { showToast } from "@/components/Toast";
import { APIFetchError, ApiResponse, fetchAPI } from "@/lib/fetch";
import { CleanerSession } from "@/types/type";

interface MyJob {
  id: string;
  user_id: string;
  service_type_name: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  scheduled_date: string;
  estimated_duration: number;
  total_price: number;
  status: string;
  user_name: string;
  user_phone: string;
  user_avatar: string;
}

const CleanerJobs = () => {
  const [cleaner, setCleaner] = useState<CleanerSession | null>(null);
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [active, setActive] = useState<MyJob | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  const fetchMyJobs = useCallback(async (cleanerId: string) => {
    try {
      setError(null);
      const result = await fetchAPI<ApiResponse<MyJob[]>>(
        `/(api)/cleaner/my-jobs?cleanerId=${cleanerId}`,
      );
      if (result.data) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching my jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCleanerSession = useCallback(async () => {
    try {
      const sessionData = await SecureStore.getItemAsync("cleaner_session");
      if (sessionData) {
        const cleanerData = JSON.parse(sessionData);
        setCleaner(cleanerData);
        void fetchMyJobs(cleanerData.id);
      } else {
        router.replace("/cleaner/sign-in");
      }
    } catch {
      router.replace("/cleaner/sign-in");
    }
  }, [fetchMyJobs]);

  useEffect(() => {
    void loadCleanerSession();
  }, [loadCleanerSession]);

  // Refresh when the tab regains focus, and poll while focused so status
  // changes made on the dashboard (or by the customer) stay in sync.
  useEffect(() => {
    if (!isFocused || !cleaner) return;
    void fetchMyJobs(cleaner.id);
  }, [isFocused, cleaner, fetchMyJobs]);

  useEffect(() => {
    if (!isFocused || !cleaner) return;
    const interval = setInterval(() => {
      void fetchMyJobs(cleaner.id);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isFocused, cleaner, fetchMyJobs]);

  const onRefresh = useCallback(() => {
    if (!cleaner) return;
    setRefreshing(true);
    fetchMyJobs(cleaner.id);
  }, [cleaner, fetchMyJobs]);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    if (!cleaner) return;
    setUpdating(jobId);

    // Optimistic update for a snappy UI; the server is the source of truth
    // and the refetch below reconciles any divergence.
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: newStatus } : job,
      ),
    );

    try {
      const result = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/cleaner/update-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, status: newStatus }),
        },
      );

      if (result.data) {
        showToast(
          `Status updated to ${newStatus.replaceAll("_", " ")}`,
          "success",
        );
      } else {
        showToast(result.error || "Failed to update status", "error");
      }
      void fetchMyJobs(cleaner.id);
    } catch (err) {
      const isConflict =
        err instanceof APIFetchError &&
        (err.statusCode === 409 ||
          err.errorCode === "CONFLICT" ||
          err.errorCode === "INVALID_TRANSITION");
      if (isConflict) {
        // Another request (or this one's first attempt) already moved the
        // job forward — the list below is stale, so re-sync it.
        showToast("This job was already updated", "info");
      } else {
        console.error("Error updating status:", err);
        showToast("Failed to update status", "error");
      }
      void fetchMyJobs(cleaner.id);
    } finally {
      setUpdating(null);
    }
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

  const confirmAndUpdateStatus = (jobId: string, newStatus: string) => {
    const messages: Record<string, { title: string; message: string }> = {
      arrived: {
        title: "Mark as Arrived?",
        message:
          "Confirm you have arrived at the job location. This cannot be undone.",
      },
      in_progress: {
        title: "Start Cleaning?",
        message:
          "Confirm you are starting the cleaning service. This affects payment processing.",
      },
      completed: {
        title: "Mark as Completed?",
        message:
          "Confirm the service is done. Payment will be processed immediately.",
      },
    };

    const config = messages[newStatus];
    if (!config) {
      handleUpdateStatus(jobId, newStatus);
      return;
    }

    Alert.alert(config.title, config.message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: () => handleUpdateStatus(jobId, newStatus),
      },
    ]);
  };

  const getNextActions = (status: string, jobId: string) => {
    switch (status) {
      case "matched":
        return (
          <CustomButton
            title={updating === jobId ? "Updating..." : "Confirm Arrival"}
            onPress={() => confirmAndUpdateStatus(jobId, "arrived")}
            disabled={updating === jobId}
            className="mt-3"
            accessibilityLabel="Confirm arrival at job location"
          />
        );
      case "arrived":
        return (
          <CustomButton
            title={updating === jobId ? "Starting..." : "Start Cleaning"}
            onPress={() => confirmAndUpdateStatus(jobId, "in_progress")}
            disabled={updating === jobId}
            className="mt-3"
            accessibilityLabel="Start cleaning"
          />
        );
      case "in_progress":
        return (
          <CustomButton
            title={updating === jobId ? "Completing..." : "Complete Job"}
            onPress={() => confirmAndUpdateStatus(jobId, "completed")}
            disabled={updating === jobId}
            bgVariant="success"
            className="mt-3"
            accessibilityLabel="Mark job as completed"
          />
        );
      default:
        return null;
    }
  };

  const renderJobCard = ({ item }: { item: MyJob }) => (
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
            <BootstrapIcon name="geo-alt" size={16} color="#9CA3AF" />
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
          <BootstrapIcon name="calendar" size={16} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm ml-2">
            {formatDate(item.scheduled_date)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <BootstrapIcon name="currency-dollar" size={16} color="#22C55E" />
          <Text className="text-primary-500 font-JakartaBold ml-1">
            ${item.total_price}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
          {item.user_avatar ? (
            <Image
              source={{ uri: item.user_avatar }}
              className="w-full h-full"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-white text-xs">
                {item.user_name?.charAt(0) || "?"}
              </Text>
            </View>
          )}
        </View>
        <View className="ml-2">
          <Text className="text-white text-sm">{item.user_name}</Text>
          <Text className="text-gray-500 text-xs">{item.user_phone}</Text>
        </View>
      </View>

      {getNextActions(item.status, item.id)}

      {["matched", "arrived", "in_progress"].includes(item.status) && (
        <TouchableOpacity
          onPress={() => setActive(item)}
          className="mt-3 flex-row items-center justify-center py-2.5 rounded-lg border border-gray-600"
          accessibilityRole="button"
          accessibilityLabel={`Message ${item.user_name}`}
        >
          <BootstrapIcon name="chat-dots" size={16} color="#4ADE80" />
          <Text className="text-primary-500 font-JakartaMedium ml-2">
            Message customer
          </Text>
        </TouchableOpacity>
      )}

      {item.status === "completed" && (
        <View className="mt-3 p-3 bg-green-500/20 rounded-lg">
          <Text className="text-green-400 text-sm text-center">
            Job completed! Payment will be processed.
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const ACTIVE_STATUSES = new Set([
    "requested",
    "matched",
    "arrived",
    "in_progress",
  ]);
  const activeCount = jobs.filter((job) =>
    ACTIVE_STATUSES.has(job.status),
  ).length;

  if (active) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-800 bg-dark-200">
          <TouchableOpacity
            onPress={() => setActive(null)}
            className="w-10 h-10 rounded-full bg-dark-300 items-center justify-center mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BootstrapIcon name="chevron-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-lg font-JakartaSemiBold text-white"
              numberOfLines={1}
            >
              {active.user_name}
            </Text>
            <Text className="text-xs text-primary-500 font-JakartaMedium">
              {active.service_type_name}
            </Text>
          </View>
        </View>

        <ChatThread
          serviceId={active.id}
          otherName={active.user_name}
          recipientId={active.user_id}
          role="cleaner"
          theme="dark"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="p-5 border-b border-gray-800">
        <Text className="text-white text-2xl font-JakartaBold">My Jobs</Text>
        <Text className="text-gray-400 text-sm mt-1">
          {activeCount} active job{activeCount !== 1 ? "s" : ""}
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
                onPress={() => cleaner && fetchMyJobs(cleaner.id)}
                className="mt-4"
              />
            </View>
          ) : (
            <View className="items-center mt-10 px-6">
              <BootstrapIcon
                name="list-ul"
                size={64}
                color="#6B7280"
                style={{ marginBottom: 16 }}
              />
              <Text className="text-general-500 text-center font-JakartaMedium">
                No active jobs
              </Text>
              <Text className="text-general-600 text-sm text-center mt-1">
                Accept a job from the Available tab to get started
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default CleanerJobs;
