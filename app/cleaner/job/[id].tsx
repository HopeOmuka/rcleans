import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import type MapboxGLModule from "@rnmapbox/maps";

import ChatThread from "@/components/ChatThread";
import CustomButton from "@/components/CustomButton";
import { showToast } from "@/components/Toast";
import { icons } from "@/constants";
import { APIFetchError, ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { formatDate } from "@/lib/utils";
import { CleanerJobDetail, CleanerSession } from "@/types/type";

type MapboxGLModuleType = typeof MapboxGLModule;

let MapboxGL: MapboxGLModuleType | null = null;

try {
  // Lazy require so screens that render without the native module (e.g.
  // Expo Go) still work instead of crashing at import time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@rnmapbox/maps");
  MapboxGL = (mod?.default ?? mod) as MapboxGLModuleType;
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
  if (accessToken) {
    MapboxGL.setAccessToken(accessToken);
  }
} catch {
  MapboxGL = null;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-500",
  matched: "bg-blue-500",
  arrived: "bg-purple-500",
  in_progress: "bg-primary-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const JobLocationMap = ({ lat, lng }: { lat: number; lng: number }) => {
  if (!MapboxGL) {
    return (
      <View className="h-48 rounded-2xl mb-4 items-center justify-center bg-dark-200 border border-gray-700">
        <Image
          source={icons.map}
          className="w-8 h-8 opacity-40"
          tintColor="#9CA3AF"
        />
        <Text className="text-gray-500 text-sm mt-2">
          Map requires a development build
        </Text>
      </View>
    );
  }
  return (
    <View className="h-48 rounded-2xl overflow-hidden mb-4 border border-gray-700">
      <MapboxGL.MapView
        style={{ flex: 1 }}
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          defaultSettings={{
            centerCoordinate: [lng, lat],
            zoomLevel: 14,
          }}
        />
        <MapboxGL.PointAnnotation id="job" coordinate={[lng, lat]}>
          <Image source={icons.pin} className="w-8 h-8" resizeMode="contain" />
        </MapboxGL.PointAnnotation>
      </MapboxGL.MapView>
    </View>
  );
};

const JobDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cleaner, setCleaner] = useState<CleanerSession | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [denying, setDenying] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);

  const {
    data: job,
    loading,
    error,
    refetch,
  } = useFetch<CleanerJobDetail>(`/(api)/cleaner/job/${id}`, {
    enabled: !!id,
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  // Poll while focused so status changes land live.
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => void refetch(), 30_000);
      return () => clearInterval(interval);
    }, [refetch]),
  );

  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync("cleaner_session")
        .then((data) => {
          if (data) setCleaner(JSON.parse(data));
          else router.replace("/cleaner/sign-in");
        })
        .catch(() => router.replace("/cleaner/sign-in"));
    }, []),
  );

  const handleAcceptJob = async () => {
    if (!cleaner || !job || accepting) return;
    setAccepting(true);
    try {
      const result = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/cleaner/accept-job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id, cleanerId: cleaner.id }),
        },
      );
      if (result.data) {
        showToast("Job accepted! It is now in your jobs tab.", "success");
        void refetch();
      } else {
        showToast(result.error || "Failed to accept job", "error");
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
      void refetch();
    } finally {
      setAccepting(false);
    }
  };

  const handleDenyJob = async () => {
    if (!cleaner || !job || denying) return;
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Deny Job",
        "The customer's payment (if held) will be released and the job returns to the open list. No charge is taken from the customer.",
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

    setDenying(true);
    try {
      const result = await fetchAPI<ApiResponse<{ status: string }>>(
        "/(api)/cleaner/deny-job",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id, cleanerId: cleaner.id }),
        },
      );
      if (result.data) {
        showToast("Job denied — customer can pick another cleaner", "info");
      } else {
        showToast(result.error || "Failed to deny job", "error");
      }
      void refetch();
    } catch (error) {
      console.error("Error denying job:", error);
      showToast("Failed to deny job", "error");
      void refetch();
    } finally {
      setDenying(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!job || updating) return;
    setUpdating(newStatus);
    try {
      const result = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/cleaner/update-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id, status: newStatus }),
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
      void refetch();
    } catch (err) {
      const isConflict =
        err instanceof APIFetchError &&
        (err.statusCode === 409 ||
          err.errorCode === "CONFLICT" ||
          err.errorCode === "INVALID_TRANSITION");
      showToast(
        isConflict ? "This job was already updated" : "Failed to update status",
        isConflict ? "info" : "error",
      );
      void refetch();
    } finally {
      setUpdating(null);
    }
  };

  const confirmAndUpdateStatus = (newStatus: string) => {
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
      void handleUpdateStatus(newStatus);
      return;
    }
    Alert.alert(config.title, config.message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: () => void handleUpdateStatus(newStatus),
      },
    ]);
  };

  const renderActions = (item: CleanerJobDetail) => {
    if (item.status === "requested") {
      return (
        <View className="flex-row gap-3">
          <CustomButton
            title={accepting ? "Accepting..." : "Accept Job"}
            onPress={() => void handleAcceptJob()}
            disabled={accepting || denying}
            bgVariant="success"
            className="flex-1"
            accessibilityLabel="Accept this job"
          />
          <CustomButton
            title={denying ? "Denying..." : "Deny"}
            onPress={() => void handleDenyJob()}
            disabled={accepting || denying}
            bgVariant="danger"
            className="flex-1"
            accessibilityLabel="Deny this job"
          />
        </View>
      );
    }
    switch (item.status) {
      case "matched":
        return (
          <CustomButton
            title={updating === "arrived" ? "Updating..." : "Confirm Arrival"}
            onPress={() => confirmAndUpdateStatus("arrived")}
            disabled={updating !== null}
            className="mt-3"
            accessibilityLabel="Confirm arrival at job location"
          />
        );
      case "arrived":
        return (
          <CustomButton
            title={
              updating === "in_progress" ? "Starting..." : "Start Cleaning"
            }
            onPress={() => confirmAndUpdateStatus("in_progress")}
            disabled={updating !== null}
            className="mt-3"
            accessibilityLabel="Start cleaning"
          />
        );
      case "in_progress":
        return (
          <CustomButton
            title={updating === "completed" ? "Completing..." : "Complete Job"}
            onPress={() => confirmAndUpdateStatus("completed")}
            disabled={updating !== null}
            bgVariant="success"
            className="mt-3"
            accessibilityLabel="Mark job as completed"
          />
        );
      case "completed":
        return (
          <View className="mt-3 p-3 bg-green-500/20 rounded-lg">
            <Text className="text-green-400 text-sm text-center">
              Job completed! Payment will be processed.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (chatting && job) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-800 bg-dark-200">
          <TouchableOpacity
            onPress={() => setChatting(false)}
            className="w-10 h-10 rounded-full bg-dark-300 items-center justify-center mr-3"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Image
              source={icons.backArrow}
              className="w-5 h-5"
              tintColor="white"
            />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-lg font-JakartaSemiBold text-white"
              numberOfLines={1}
            >
              {job.user_name}
            </Text>
            <Text className="text-xs text-primary-500 font-JakartaMedium">
              {job.service_type_name}
            </Text>
          </View>
        </View>
        <ChatThread
          serviceId={job.id}
          otherName={job.user_name}
          recipientId={job.user_id}
          role="cleaner"
          theme="dark"
        />
      </SafeAreaView>
    );
  }

  if (loading && !job) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
      </SafeAreaView>
    );
  }

  if (error && !job) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500 items-center justify-center px-6">
        <Text className="text-red-400 text-center">{error}</Text>
        <CustomButton
          title="Retry"
          onPress={() => void refetch()}
          className="mt-4"
        />
      </SafeAreaView>
    );
  }

  if (!job) return null;

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800 bg-dark-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-dark-300 items-center justify-center mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Image
            source={icons.backArrow}
            className="w-5 h-5"
            tintColor="white"
          />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-JakartaSemiBold text-white">
          Job Details
        </Text>
        <View
          className={`px-3 py-1 rounded-full ${STATUS_COLORS[job.status] ?? "bg-gray-500"}`}
        >
          <Text className="text-white text-xs font-JakartaMedium capitalize">
            {job.status.replaceAll("_", " ")}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <JobLocationMap lat={job.location_lat} lng={job.location_lng} />

        <View className="bg-dark-200 rounded-xl p-4 border border-gray-700 mb-4">
          <Text className="text-white font-JakartaSemiBold text-lg">
            {job.service_type_name}
          </Text>
          {job.service_type_description && (
            <Text className="text-gray-400 text-sm mt-1">
              {job.service_type_description}
            </Text>
          )}
          <View className="flex-row items-center mt-3">
            <Image
              source={icons.calendar}
              className="w-4 h-4"
              tintColor="#9CA3AF"
            />
            <Text className="text-gray-400 text-sm ml-2">
              {job.scheduled_date
                ? formatDate(job.scheduled_date)
                : "As soon as possible"}
            </Text>
          </View>
          <View className="flex-row items-center mt-1.5">
            <Image
              source={icons.point}
              className="w-4 h-4"
              tintColor="#9CA3AF"
            />
            <Text className="text-gray-400 text-sm ml-2 flex-1">
              {job.location_address}
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-gray-400 text-sm">
              {job.estimated_duration} hour
              {job.estimated_duration === 1 ? "" : "s"} estimated
            </Text>
            <View className="flex-row items-center">
              <Image
                source={icons.dollar}
                className="w-4 h-4"
                tintColor="#22C55E"
              />
              <Text className="text-primary-500 font-JakartaBold ml-1">
                ${job.total_price}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-dark-200 rounded-xl p-4 border border-gray-700 mb-4">
          <Text className="text-white font-JakartaSemiBold mb-3">Customer</Text>
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 items-center justify-center">
              {job.user_avatar ? (
                <Image
                  source={{ uri: job.user_avatar }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-white text-base font-JakartaBold">
                  {job.user_name?.charAt(0) || "?"}
                </Text>
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white text-sm font-JakartaMedium">
                {job.user_name}
              </Text>
              <Text className="text-gray-500 text-xs">{job.user_phone}</Text>
            </View>
          </View>
          <View className="flex-row mt-4 gap-3">
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${job.user_phone}`)}
              className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg bg-dark-300 border border-gray-600"
              accessibilityRole="button"
              accessibilityLabel={`Call ${job.user_name}`}
            >
              <Image
                source={icons.phone}
                className="w-4 h-4"
                tintColor="#22C55E"
              />
              <Text className="text-primary-500 font-JakartaMedium ml-2">
                Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChatting(true)}
              className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg bg-primary-500"
              accessibilityRole="button"
              accessibilityLabel={`Message ${job.user_name}`}
            >
              <Image
                source={icons.chat}
                className="w-4 h-4"
                tintColor="white"
              />
              <Text className="text-white font-JakartaMedium ml-2">
                Message
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {(job.special_instructions || job.addons.length > 0) && (
          <View className="bg-dark-200 rounded-xl p-4 border border-gray-700 mb-4">
            <Text className="text-white font-JakartaSemiBold mb-3">
              Service Details
            </Text>
            {job.addons.map((addon) => (
              <View key={addon.id} className="flex-row justify-between py-1">
                <Text className="text-gray-400 text-sm">
                  {addon.name}
                  {addon.quantity > 1 ? ` ×${addon.quantity}` : ""}
                </Text>
                <Text className="text-gray-300 text-sm font-JakartaMedium">
                  ${addon.price * addon.quantity}
                </Text>
              </View>
            ))}
            {job.special_instructions && (
              <View className="mt-2 p-3 bg-dark-300 rounded-lg">
                <Text className="text-xs text-gray-500 font-JakartaMedium uppercase">
                  Instructions
                </Text>
                <Text className="text-gray-300 text-sm mt-1">
                  {job.special_instructions}
                </Text>
              </View>
            )}
          </View>
        )}

        {renderActions(job)}
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobDetails;
