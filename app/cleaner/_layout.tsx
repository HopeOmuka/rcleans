import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import BootstrapIcon, {
  type BootstrapIconProps,
} from "@/components/BootstrapIcon";
import PushNotificationHandler from "@/components/PushNotificationHandler";
import { setAuthToken } from "@/lib/fetch";

const TabIcon = ({
  name,
  focused,
}: {
  name: BootstrapIconProps["name"];
  focused: boolean;
}) => (
  <View
    className={`flex flex-row justify-center items-center rounded-full ${focused ? "bg-primary-500" : "bg-dark-300"}`}
  >
    <View
      className={`rounded-full w-12 h-12 items-center justify-center ${focused ? "bg-primary-600" : ""}`}
    >
      <BootstrapIcon name={name} size={24} color="#FFFFFF" />
    </View>
  </View>
);

export default function Layout() {
  const [tokenReady, setTokenReady] = useState(false);

  // Gate every screen behind the auth token: tab screens fetch as soon as
  // they mount, so they must never run before the SecureStore token is
  // loaded (otherwise the first requests race the token and 401).
  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync("cleaner_token").then((token) => {
      if (cancelled) return;
      setAuthToken(token ?? null);
      setTokenReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!tokenReady) {
    return (
      <View className="flex-1 bg-dark-500 items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <PushNotificationHandler role="cleaner" />
      <Tabs
        initialRouteName="dashboard"
        screenOptions={{
          animation: "fade",
          tabBarActiveTintColor: "#4ADE80",
          tabBarInactiveTintColor: "#666",
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          tabBarStyle: {
            backgroundColor: "#1F1F1F",
            borderRadius: 50,
            paddingBottom: 4,
            overflow: "hidden",
            marginHorizontal: 20,
            marginBottom: 20,
            height: 90,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            position: "absolute",
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Available",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="house-fill" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "My Jobs",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="clipboard-check" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="chat-dots-fill" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon name="person-fill" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="sign-in"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="availability"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="job/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
