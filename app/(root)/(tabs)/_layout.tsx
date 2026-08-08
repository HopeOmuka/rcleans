import { Tabs } from "expo-router";
import { View } from "react-native";

import BootstrapIcon, {
  type BootstrapIconProps,
} from "@/components/BootstrapIcon";
import { useTheme } from "@/lib/theme";

const TAB_ICONS: {
  [key: string]: {
    outline: BootstrapIconProps["name"];
    fill: BootstrapIconProps["name"];
  };
} = {
  home: { outline: "house", fill: "house-fill" },
  services: { outline: "grid-3x3-gap", fill: "grid-3x3-gap-fill" },
  chat: { outline: "chat-dots", fill: "chat-dots-fill" },
  profile: { outline: "person", fill: "person-fill" },
};

const TabIcon = ({
  route,
  focused,
}: {
  route: keyof typeof TAB_ICONS;
  focused: boolean;
}) => {
  const { theme } = useTheme();
  const icon = TAB_ICONS[route];
  return (
    <View
      className={`w-9 h-9 rounded-full items-center justify-center ${
        focused ? "bg-primary-500" : "bg-transparent"
      }`}
    >
      <BootstrapIcon
        name={focused ? icon.fill : icon.outline}
        size={20}
        color={focused ? theme.colors.primaryContrast : theme.colors.textMuted}
      />
    </View>
  );
};

export default function Layout() {
  const { theme } = useTheme();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        animation: "fade",
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon route="home" focused={focused} />
          ),
          tabBarAccessibilityLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon route="services" focused={focused} />
          ),
          tabBarAccessibilityLabel: "Services",
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon route="chat" focused={focused} />
          ),
          tabBarAccessibilityLabel: "Chat",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon route="profile" focused={focused} />
          ),
          tabBarAccessibilityLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
