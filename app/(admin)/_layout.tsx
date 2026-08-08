import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";

const AdminLayout = () => {
  const { theme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchAPI<ApiResponse<{ is_admin: boolean }>>("/(api)/admin/me")
        .then((result) => {
          if (active) setIsAdmin(!!result.data?.is_admin);
        })
        .catch(() => {
          if (active) setIsAdmin(false);
        })
        .finally(() => {
          if (active) setChecking(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  if (checking) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color="#4ADE80" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <View
          className="flex-row items-center px-4 py-3 border-b"
          style={{
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: theme.colors.surfaceMuted }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Image
              source={icons.backArrow}
              className="w-5 h-5"
              tintColor={theme.colors.text}
            />
          </TouchableOpacity>
          <Text
            className="text-lg font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            Admin
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: theme.colors.dangerSoft }}
          >
            <Image
              source={icons.lock}
              className="w-7 h-7"
              tintColor={theme.colors.danger}
            />
          </View>
          <Text
            className="text-lg font-JakartaBold text-center"
            style={{ color: theme.colors.text }}
          >
            Access Denied
          </Text>
          <Text
            className="text-sm text-center mt-2"
            style={{ color: theme.colors.textSecondary }}
          >
            This area is restricted to administrators.
          </Text>
          <CustomButton
            title="Go Back"
            onPress={() => router.back()}
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="booking/[bookingId]" />
      <Stack.Screen name="cleaners" />
      <Stack.Screen name="cleaner/[cleanerId]" />
      <Stack.Screen name="users" />
      <Stack.Screen name="user/[userId]" />
      <Stack.Screen name="support" />
      <Stack.Screen name="catalog/index" />
      <Stack.Screen name="catalog/service-types" />
      <Stack.Screen name="catalog/addons" />
      <Stack.Screen name="catalog/promos" />
    </Stack>
  );
};

export default AdminLayout;
