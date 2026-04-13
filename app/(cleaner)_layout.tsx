import { Redirect } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useState } from "react";

export default function CleanerLayout() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const cleanerId = "demo-cleaner-id";
      if (cleanerId) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-500">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(cleaner)/sign-in" />;
  }

  return (
    <View className="flex-1 bg-dark-500">
      <Text className="text-white">Cleaner Portal</Text>
    </View>
  );
}
