import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { icons } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";

const CleanerProfile = () => {
  const [cleaner, setCleaner] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCleanerSession();
  }, []);

  const loadCleanerSession = async () => {
    try {
      const sessionData = await SecureStore.getItemAsync("cleaner_session");
      if (sessionData) {
        const cleanerData = JSON.parse(sessionData);
        setCleaner(cleanerData);
        setIsAvailable(cleanerData.is_available ?? true);
      } else {
        router.replace("/(cleaner)/sign-in");
      }
    } catch (error) {
      console.error("Error loading session:", error);
      router.replace("/(cleaner)/sign-in");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    try {
      const response = await fetch("/(api)/cleaner/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanerId: cleaner.id,
          isAvailable: value,
        }),
      });

      const result = await response.json();
      if (result.data) {
        setIsAvailable(value);
        const updatedCleaner = { ...cleaner, is_available: value };
        await SecureStore.setItemAsync(
          "cleaner_session",
          JSON.stringify(updatedCleaner),
        );
        setCleaner(updatedCleaner);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      Alert.alert("Error", "Failed to update availability");
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("cleaner_session");
          await SecureStore.deleteItemAsync("cleaner_token");
          router.replace("/(cleaner)/sign-in");
        },
      },
    ]);
  };

  const handleServiceSettings = () => {
    Alert.alert("Service Settings", "Configure your service preferences here.");
  };

  if (loading || !cleaner) {
    return (
      <SafeAreaView className="flex-1 bg-dark-500 items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        className="px-5"
      >
        <Text className="text-2xl font-JakartaBold text-white my-5">
          Profile
        </Text>

        <View className="flex items-center justify-center my-5">
          <View className="relative">
            {cleaner.profile_image_url ? (
              <Image
                source={{ uri: cleaner.profile_image_url }}
                style={{ width: 110, height: 110, borderRadius: 55 }}
                className="rounded-full border-[3px] border-primary-500"
              />
            ) : (
              <View className="w-[110px] h-[110px] rounded-full bg-primary-500 items-center justify-center border-[3px] border-white">
                <Text className="text-white text-4xl font-JakartaBold">
                  {cleaner.first_name?.charAt(0) || "?"}
                </Text>
              </View>
            )}
            <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-dark-500" />
          </View>
        </View>

        <Text className="text-white text-xl font-JakartaBold text-center">
          {cleaner.first_name} {cleaner.last_name}
        </Text>
        <Text className="text-gray-400 text-center mt-1">{cleaner.email}</Text>

        <View className="flex-row justify-center mt-4 gap-4">
          <View className="bg-dark-200 px-4 py-2 rounded-lg">
            <View className="flex-row items-center">
              <Image
                source={icons.star}
                className="w-4 h-4"
                tintColor="#FACC15"
              />
              <Text className="text-white font-JakartaBold ml-1">
                {typeof cleaner.rating === "number"
                  ? cleaner.rating.toFixed(1)
                  : "N/A"}
              </Text>
            </View>
          </View>
          <View className="bg-dark-200 px-4 py-2 rounded-lg">
            <Text className="text-gray-400 text-sm">Jobs</Text>
            <Text className="text-white font-JakartaBold">
              {cleaner.completed_jobs || 0}
            </Text>
          </View>
        </View>

        <View className="bg-dark-200 rounded-xl p-4 mt-6 border border-gray-700">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={icons.checkmark}
                className="w-5 h-5"
                tintColor="#4ADE80"
              />
              <Text className="text-white font-JakartaMedium ml-3">
                Available for Jobs
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              trackColor={{ false: "#333", true: "#4ADE80" }}
              thumbColor="white"
            />
          </View>
        </View>

        <Text className="text-xl font-JakartaBold text-white mt-8 mb-3">
          Account
        </Text>
        <View className="bg-dark-200 rounded-xl border border-gray-700 overflow-hidden">
          <View className="p-4 border-b border-gray-700">
            <Text className="text-gray-400 text-sm">Phone</Text>
            <Text className="text-white mt-1">
              {cleaner.phone || "Not set"}
            </Text>
          </View>
          <View className="p-4 border-b border-gray-700">
            <Text className="text-gray-400 text-sm">Specialties</Text>
            <View className="flex-row flex-wrap mt-2 gap-2">
              {cleaner.specialties?.map((spec: string, index: number) => (
                <View
                  key={index}
                  className="bg-primary-500/20 px-3 py-1 rounded-full"
                >
                  <Text className="text-primary-500 text-sm">{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text className="text-xl font-JakartaBold text-white mt-8 mb-3">
          Settings
        </Text>
        <View className="bg-dark-200 rounded-xl border border-gray-700 overflow-hidden">
          <TouchableOpacity
            onPress={handleServiceSettings}
            className="flex-row items-center justify-between p-4 border-b border-gray-700"
          >
            <View className="flex-row items-center">
              <Image
                source={icons.settings}
                className="w-5 h-5"
                tintColor="#666"
              />
              <Text className="text-white font-JakartaMedium ml-3">
                Service Settings
              </Text>
            </View>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <Image
                source={icons.out}
                className="w-5 h-5"
                tintColor="#F87171"
              />
              <Text className="text-red-400 font-JakartaMedium ml-3">
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CleanerProfile;
