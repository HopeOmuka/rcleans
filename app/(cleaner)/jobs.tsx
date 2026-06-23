import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import CustomButton from "@/components/CustomButton";

interface MyJob {
  id: string;
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
  const [cleaner, setCleaner] = useState<any>(null);
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCleanerSession();
  }, []);

  const loadCleanerSession = async () => {
    try {
      const sessionData = await SecureStore.getItemAsync("cleaner_session");
      if (sessionData) {
        const cleanerData = JSON.parse(sessionData);
        setCleaner(cleanerData);
        fetchMyJobs(cleanerData.id);
      } else {
        router.replace("/(cleaner)/sign-in");
      }
    } catch {
      router.replace("/(cleaner)/sign-in");
    }
  };

  const fetchMyJobs = async (cleanerId: string) => {
    try {
      setError(null);
      const result = await fetchAPI(
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
  };

  const onRefresh = useCallback(() => {
    if (!cleaner) return;
    setRefreshing(true);
    fetchMyJobs(cleaner.id);
  }, [cleaner]);

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      setUpdating(jobId);
      const result = await fetchAPI("/(api)/cleaner/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: newStatus }),
      });

      if (result.data) {
        Alert.alert(
          "Success",
          `Status updated to ${newStatus.replaceAll("_", " ")}`,
        );
        fetchMyJobs(cleaner.id);
      } else {
        Alert.alert("Error", result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update status");
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
    <View
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

      {item.status === "completed" && (
        <View className="mt-3 p-3 bg-green-500/20 rounded-lg">
          <Text className="text-green-400 text-sm text-center">
            Job completed! Payment will be processed.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="p-5 border-b border-gray-800">
        <Text className="text-white text-2xl font-JakartaBold">My Jobs</Text>
        <Text className="text-gray-400 text-sm mt-1">
          {jobs.length} active job{jobs.length !== 1 ? "s" : ""}
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
                onPress={() => fetchMyJobs(cleaner.id)}
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
                No active jobs
              </Text>
              <Text className="text-general-600 text-sm text-center mt-1">
                Accept a job from the dashboard to get started
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default CleanerJobs;
