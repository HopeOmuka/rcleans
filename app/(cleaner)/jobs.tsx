import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { icons } from "@/constants";
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
  const [updating, setUpdating] = useState<string | null>(null);

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
    } catch (error) {
      router.replace("/(cleaner)/sign-in");
    }
  };

  const fetchMyJobs = async (cleanerId: string) => {
    try {
      const response = await fetch(
        `/(api)/cleaner/my-jobs?cleanerId=${cleanerId}`,
      );
      const result = await response.json();
      if (result.data) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching my jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    try {
      setUpdating(jobId);
      const response = await fetch("/(api)/cleaner/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, status: newStatus }),
      });

      const result = await response.json();
      if (result.data) {
        Alert.alert(
          "Success",
          `Status updated to ${newStatus.replace("_", " ")}`,
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

  const getNextActions = (status: string, jobId: string) => {
    switch (status) {
      case "matched":
        return (
          <CustomButton
            title={updating === jobId ? "Updating..." : "Confirm Arrival"}
            onPress={() => handleUpdateStatus(jobId, "arrived")}
            disabled={updating === jobId}
            className="mt-3"
          />
        );
      case "arrived":
        return (
          <CustomButton
            title={updating === jobId ? "Starting..." : "Start Cleaning"}
            onPress={() => handleUpdateStatus(jobId, "in_progress")}
            disabled={updating === jobId}
            className="mt-3"
          />
        );
      case "in_progress":
        return (
          <CustomButton
            title={updating === jobId ? "Completing..." : "Complete Job"}
            onPress={() => handleUpdateStatus(jobId, "completed")}
            disabled={updating === jobId}
            bgVariant="success"
            className="mt-3"
          />
        );
      default:
        return null;
    }
  };

  const renderJobCard = ({ item }: { item: MyJob }) => (
    <View className="bg-dark-200 rounded-xl p-4 mb-4 border border-gray-700">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-JakartaSemiBold text-lg">
            {item.service_type_name}
          </Text>
          <View className="flex-row items-center mt-1">
            <Image source={icons.point} className="w-4 h-4" tintColor="#666" />
            <Text className="text-gray-400 text-sm ml-1" numberOfLines={1}>
              {item.location_address}
            </Text>
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}
        >
          <Text className="text-white text-xs font-JakartaMedium capitalize">
            {item.status.replace("_", " ")}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Image source={icons.calendar} className="w-4 h-4" tintColor="#666" />
          <Text className="text-gray-400 text-sm ml-2">
            {formatDate(item.scheduled_date)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Image
            source={icons.dollar}
            className="w-4 h-4"
            tintColor="#4ADE80"
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
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator className="mt-10" color="#4ADE80" />
          ) : (
            <View className="items-center mt-10">
              <Text className="text-gray-500">No active jobs</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default CleanerJobs;
