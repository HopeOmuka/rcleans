import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View } from "react-native";

import { icons } from "@/constants";
import { useTheme } from "@/lib/theme";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => {
  const { theme } = useTheme();
  return (
    <View
      className={`w-9 h-9 rounded-full items-center justify-center ${
        focused ? "bg-primary-500" : "bg-transparent"
      }`}
    >
      <Image
        source={source}
        tintColor={focused ? theme.colors.primaryContrast : theme.colors.textMuted}
        resizeMode="contain"
        className="w-5 h-5"
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
            <TabIcon source={icons.home} focused={focused} />
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
            <TabIcon source={icons.list} focused={focused} />
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
            <TabIcon source={icons.chat} focused={focused} />
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
            <TabIcon source={icons.profile} focused={focused} />
          ),
          tabBarAccessibilityLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
