import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
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
  const [cleaner, setCleaner] = useState<any>(null);
  const [jobs, setJobs] = useState<CleanerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    loadCleanerSession();
  }, []);

  const loadCleanerSession = async () => {
    try {
      const sessionData = await SecureStore.getItemAsync("cleaner_session");
      if (sessionData) {
        const cleanerData = JSON.parse(sessionData);
        setCleaner(cleanerData);
        fetchAvailableJobs(cleanerData.id);
      } else {
        router.replace("/(cleaner)/sign-in");
      }
    } catch (error) {
      console.error("Error loading session:", error);
      router.replace("/(cleaner)/sign-in");
    }
  };

  const fetchAvailableJobs = async (cleanerId: string) => {
    try {
      const response = await fetch(
        `/(api)/cleaner/jobs?cleanerId=${cleanerId}`,
      );
      const result = await response.json();
      if (result.data) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      setAccepting(jobId);
      const response = await fetch("/(api)/cleaner/accept-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, cleanerId: cleaner.id }),
      });

      const result = await response.json();
      if (result.data) {
        Alert.alert("Success", "Job accepted! Check your jobs tab.");
        fetchAvailableJobs(cleaner.id);
      } else {
        Alert.alert("Error", result.error || "Failed to accept job");
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      Alert.alert("Error", "Failed to accept job");
    } finally {
      setAccepting(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync("cleaner_session");
      await SecureStore.deleteItemAsync("cleaner_token");
      router.replace("/(cleaner)/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
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

  const renderJobCard = ({ item }: { item: CleanerJob }) => (
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
        <Image source={icons.person} className="w-4 h-4" tintColor="#666" />
        <Text className="text-gray-400 text-sm ml-2">{item.user_name}</Text>
        <Text className="text-gray-500 text-sm ml-1">• {item.user_phone}</Text>
      </View>

      {item.status === "requested" && (
        <CustomButton
          title={accepting === item.id ? "Accepting..." : "Accept Job"}
          onPress={() => handleAcceptJob(item.id)}
          disabled={accepting === item.id}
          bgVariant="success"
        />
      )}
    </View>
  );

  if (!cleaner) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500 items-center justify-center">
        <ActivityIndicator size="large" color="#4ADE80" />
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
              tintColor="#FACC15"
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
          <Text className="text-white font-JakartaBold text-lg mt-1">
            {cleaner.completed_jobs || 0}
          </Text>
        </View>
      </View>

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
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator className="mt-10" color="#4ADE80" />
          ) : (
            <View className="items-center mt-10">
              <Text className="text-gray-500">No jobs available right now</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Dashboard;
