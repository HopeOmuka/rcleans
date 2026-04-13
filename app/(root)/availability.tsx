import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

import AvailabilityManager from "@/components/AvailabilityManager";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

const AvailabilityScreen = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadCurrentAvailability = useCallback(async () => {
    try {
      const response = await fetchAPI(
        `/(api)/cleaner/availability/${user?.id}`,
      );
      if (response.data) {
        setAvailabilityData(response.data);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
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

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center justify-between my-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Image
              source={icons.backArrow}
              className="w-6 h-6"
              tintColor="white"
            />
            <Text className="text-white text-xl font-JakartaBold ml-2">
              Back
            </Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-JakartaBold">
            Availability
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <Text className="text-gray-400 text-base mb-5">
          Set your weekly availability schedule. Customers will only see you as
          available during these times.
        </Text>

        <AvailabilityManager cleanerId={user?.id || ""} />

        {hasUnsavedChanges && (
          <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-5">
            <Text className="text-yellow-400 text-sm font-JakartaMedium">
              You have unsaved changes. Don't forget to save your availability
              schedule.
            </Text>
          </View>
        )}

        <CustomButton
          title={loading ? "Saving..." : "Save Availability"}
          onPress={saveAvailability}
          className="mt-5"
          disabled={loading}
        />

        <Text className="text-gray-500 text-sm mt-5 text-center">
          Your availability will be visible to customers when booking services.
          You can update this anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AvailabilityScreen;
