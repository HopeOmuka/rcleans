import { useOAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { user } = useUser();

  const handleGoogleSignIn = async () => {
    const result = await googleOAuth(startOAuthFlow, () => user);

    if (result.code === "session_exists" || result.success) {
      Alert.alert("Success", "Welcome back! Redirecting to home.");
      router.replace("/(root)/(tabs)/home");
    } else {
      Alert.alert("Error", result.message);
    }
  };

  return (
    <View className="mt-6">
      <View className="flex flex-row justify-center items-center gap-x-3">
        <View className="flex-1 h-[1px] bg-gray-800" />
        <Text className="text-gray-500 text-sm">Or</Text>
        <View className="flex-1 h-[1px] bg-gray-800" />
      </View>

      <CustomButton
        title="Continue with Google"
        className="mt-5"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5"
          />
        )}
        bgVariant="secondary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
