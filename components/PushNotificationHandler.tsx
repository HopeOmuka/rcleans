"use client";

import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { ApiResponse, fetchAPI, getAuthToken } from "@/lib/fetch";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers the device push token for the current session (customer JWT or
 * cleaner token) and deep-links on notification taps. Best-effort: any
 * failure is swallowed so push problems never break the app.
 */
const PushNotificationHandler = ({ role }: { role: "user" | "cleaner" }) => {
  useEffect(() => {
    let active = true;

    const register = async () => {
      try {
        if (Platform.OS === "web") return;
        // Only register once an authenticated session owns an API token;
        // otherwise this fires unauthenticated 401s on the sign-in screen.
        if (!getAuthToken()) return;

        const existing = await Notifications.getPermissionsAsync();
        const granted =
          existing.status === "granted"
            ? true
            : (await Notifications.requestPermissionsAsync()).status ===
              "granted";
        if (!granted) return;

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Notifications",
            importance: Notifications.AndroidImportance.HIGH,
          });
        }

        const token = await Notifications.getExpoPushTokenAsync();
        const pushToken =
          typeof token === "string" ? token : (token.data as string);
        if (!pushToken || !active) return;

        await fetchAPI<ApiResponse<{ token: string }>>("/(api)/push/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
        });
      } catch {
        // Best-effort: skip on failure.
      }
    };

    void register();

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = (response.notification.request.content.data ||
          {}) as Record<string, unknown>;
        const serviceId =
          (data.service_id as string) || (data.serviceId as string);
        if (!serviceId) return;
        if (role === "cleaner") {
          router.push(`/cleaner/job/${serviceId}` as Href);
        } else {
          router.push(`/(root)/service/${serviceId}` as Href);
        }
      },
    );

    return () => {
      active = false;
      sub.remove();
    };
  }, [role]);

  return null;
};

export default PushNotificationHandler;
