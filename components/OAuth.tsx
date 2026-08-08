import { useAuth, useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const OAuth = () => {
  const { theme } = useTheme();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { getToken } = useAuth();

  const handleGoogleSignIn = async () => {
    const result = await googleOAuth(startOAuthFlow, getToken);

    if (result.code === "session_exists") {
      Alert.alert("Success", "Session exists. Redirecting to home screen.");
      router.replace("/(root)/(tabs)/home");
      return;
    }

    Alert.alert(result.success ? "Success" : "Error", result.message);
  };

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View
          className="flex-1 h-[1px]"
          style={{ backgroundColor: theme.colors.border }}
        />
        <Text className="text-lg" style={{ color: theme.colors.textSecondary }}>
          Or
        </Text>
        <View
          className="flex-1 h-[1px]"
          style={{ backgroundColor: theme.colors.border }}
        />
      </View>

      <CustomButton
        title="Continue with Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
