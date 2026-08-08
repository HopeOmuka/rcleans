import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

import { useTheme } from "@/lib/theme";

export default function NotFoundScreen() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View
        className="flex-1 items-center justify-center p-5"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text
          className="text-lg font-JakartaBold"
          style={{ color: theme.colors.text }}
        >
          This screen doesn&apos;t exist.
        </Text>
        <Link
          href="/"
          className="mt-4 py-4"
          accessibilityLabel="Go to home screen"
        >
          <Text style={{ color: theme.colors.primary }}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}
