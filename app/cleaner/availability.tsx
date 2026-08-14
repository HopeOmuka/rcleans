import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

import AvailabilityManager from "@/components/AvailabilityManager";
import CustomButton from "@/components/CustomButton";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { AvailabilitySlot, CleanerSession } from "@/types/type";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const CleanerAvailability = () => {
  const [cleanerId, setCleanerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilitySlot[]>(
    [],
  );

  const handleDataChange = useCallback(
    (slots: AvailabilitySlot[]) => setAvailabilityData(slots),
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const session = await SecureStore.getItemAsync("cleaner_session");
        if (session) {
          const cleaner: CleanerSession = JSON.parse(session);
          setCleanerId(cleaner.id);
        }
      } catch (error) {
        console.error("Error loading cleaner session:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (availabilityData.length === 0) {
      Alert.alert("Availability", "Set at least one available day to save.");
      return;
    }

    for (const slot of availabilityData) {
      if (!TIME_RE.test(slot.start_time) || !TIME_RE.test(slot.end_time)) {
        Alert.alert(
          "Invalid Time",
          `Use HH:MM format (e.g. 09:00) for all time fields.`,
        );
        return;
      }
      if (slot.end_time <= slot.start_time) {
        Alert.alert(
          "Invalid Time",
          "End time must be after start time for every day.",
        );
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/cleaner/availability",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability: availabilityData }),
        },
      );

      if (response.error) {
        Alert.alert("Error", response.error);
        return;
      }

      Alert.alert("Success", "Your availability has been updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error saving availability:", error);
      Alert.alert("Error", "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your availability..." fullScreen />;
  }

  if (!cleanerId) {
    return (
      <EmptyState
        title="Not Signed In"
        description="Sign in as a cleaner to manage your availability."
        actionLabel="Go to Sign In"
        onAction={() => router.replace("/cleaner/sign-in")}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500" edges={["bottom"]}>
      <AvailabilityManager
        cleanerId={cleanerId}
        onDataChange={handleDataChange}
      />
      <View className="p-4 bg-dark-200 border-t border-gray-800">
        <Text className="text-sm text-gray-400 text-center mb-3">
          Customers will only see you as available during these hours.
        </Text>
        <CustomButton
          title={saving ? "Saving..." : "Save Availability"}
          onPress={handleSave}
          disabled={saving}
          bgVariant="success"
        />
      </View>
    </SafeAreaView>
  );
};

export default CleanerAvailability;
