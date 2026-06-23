import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

import AvailabilityManager from "@/components/AvailabilityManager";
import CustomButton from "@/components/CustomButton";
import EmptyState from "@/components/EmptyState";
import { fetchAPI } from "@/lib/fetch";

const AvailabilityScreen = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadCurrentAvailability = useCallback(async () => {
    try {
      setLoadError(false);
      const response = await fetchAPI(
        `/(api)/cleaner/availability?cleanerId=${user?.id}`,
      );
      if (response.data) {
        setAvailabilityData(response.data);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCurrentAvailability();
  }, [loadCurrentAvailability]);

  const saveAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetchAPI("/(api)/cleaner/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleaner_id: user?.id,
          availability: availabilityData,
        }),
      });

      if (response.error) {
        Alert.alert("Error", response.error);
        return;
      }

      setHasUnsavedChanges(false);
      Alert.alert("Success", "Your availability has been updated!");
    } catch (error) {
      console.error("Error saving availability:", error);
      Alert.alert("Error", "Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView className="flex-1 bg-general-500">
        <EmptyState
          title="Failed to Load"
          description="Could not load your availability. Please check your connection and try again."
          actionLabel="Retry"
          onAction={loadCurrentAvailability}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center justify-between my-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-xl font-JakartaBold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-JakartaBold">Manage Availability</Text>
          <View style={{ width: 50 }} />
        </View>

        <Text className="text-base text-gray-600 mb-5">
          Set your weekly availability schedule. Customers will only see you as
          available during these times.
        </Text>

        <AvailabilityManager
          cleanerId={user?.id || ""}
          onDataChange={() => setHasUnsavedChanges(true)}
        />

        {hasUnsavedChanges && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5">
            <Text className="text-yellow-800 text-sm font-JakartaMedium">
              You have unsaved changes. Don&apos;t forget to save your
              availability schedule.
            </Text>
          </View>
        )}

        <CustomButton
          title={loading ? "Saving..." : "Save Availability"}
          onPress={saveAvailability}
          className="mt-5"
          disabled={loading}
          accessibilityLabel="Save your availability schedule"
        />

        <Text className="text-sm text-gray-500 mt-5 text-center">
          Your availability will be visible to customers when booking services.
          You can update this anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AvailabilityScreen;
