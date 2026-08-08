import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import ChatThread from "@/components/ChatThread";
import { useTheme } from "@/lib/theme";

const ChatThreadScreen = () => {
  const { theme } = useTheme();
  const { serviceId, otherName, otherId } = useLocalSearchParams<{
    serviceId: string;
    otherName: string;
    otherId: string;
  }>();

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
        <View className="flex-1">
          <Text
            className="text-lg font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
            numberOfLines={1}
          >
            {otherName || "Cleaner"}
          </Text>
          <Text
            className="text-xs font-JakartaMedium"
            style={{ color: theme.colors.primary }}
          >
            Cleaning professional
          </Text>
        </View>
      </View>

      <ChatThread
        serviceId={serviceId}
        otherName={otherName || "Cleaner"}
        recipientId={otherId}
        role="user"
        theme={theme.scheme === "dark" ? "dark" : "light"}
      />
    </SafeAreaView>
  );
};

export default ChatThreadScreen;
