import { router } from "expo-router";
import type { Href } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import { useTheme } from "@/lib/theme";

const sections = [
  {
    label: "Service Types",
    description: "Pricing, durations and availability",
    route: "/catalog/service-types" as Href,
  },
  {
    label: "Addons",
    description: "Extra services and their pricing",
    route: "/catalog/addons" as Href,
  },
  {
    label: "Promo Codes",
    description: "Discount codes for customers",
    route: "/catalog/promos" as Href,
  },
];

const Catalog = () => {
  const { theme } = useTheme();
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
          <BootstrapIcon
            name="chevron-left"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text
          className="text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Service Catalog
        </Text>
      </View>

      <View className="p-5">
        <View
          className="rounded-2xl border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          {sections.map((section, index) => (
            <TouchableOpacity
              key={section.label}
              onPress={() => router.push(`/(admin)${section.route}` as Href)}
              accessibilityRole="button"
              accessibilityLabel={section.label}
              className="flex-row items-center px-4 py-4"
              style={
                index < sections.length - 1
                  ? {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }
                  : undefined
              }
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.colors.primarySoft }}
              >
                <BootstrapIcon
                  name="list-ul"
                  size={20}
                  color={theme.colors.primaryBright}
                />
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-base font-JakartaSemiBold"
                  style={{ color: theme.colors.text }}
                >
                  {section.label}
                </Text>
                <Text
                  className="text-sm mt-0.5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {section.description}
                </Text>
              </View>
              <BootstrapIcon
                name="arrow-up"
                size={16}
                color={theme.colors.textMuted}
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Catalog;
