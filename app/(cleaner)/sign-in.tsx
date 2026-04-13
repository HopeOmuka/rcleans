import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const onSignInPress = useCallback(async () => {
    if (!form.email || !form.phone) {
      Alert.alert("Error", "Please enter email and phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/(api)/cleaner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
        }),
      });

      const result = await response.json();

      if (result.data && result.data.cleaner) {
        await SecureStore.setItemAsync(
          "cleaner_session",
          JSON.stringify(result.data.cleaner),
        );
        await SecureStore.setItemAsync("cleaner_token", result.data.token);
        router.replace("/(cleaner)/dashboard");
      } else {
        Alert.alert("Error", result.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form.email, form.phone]);

  return (
    <ScrollView className="flex-1 bg-dark-500">
      <View className="flex-1">
        <View className="relative w-full h-[200px]">
          <View className="absolute inset-0 bg-primary-gradient opacity-80" />
          <Text className="absolute bottom-5 left-5 text-2xl text-white font-JakartaSemiBold">
            Cleaner Portal 👷
          </Text>
        </View>

        <View className="p-5">
          <Text className="text-white text-lg font-JakartaMedium mb-6">
            Sign in to access your jobs
          </Text>

          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
            containerStyle="bg-dark-200"
            inputStyle="text-white"
          />

          <InputField
            label="Phone"
            placeholder="Enter your phone number"
            icon={icons.phone || icons.person}
            textContentType="telephoneNumber"
            value={form.phone}
            onChangeText={(value) => setForm({ ...form, phone: value })}
            containerStyle="bg-dark-200"
            inputStyle="text-white"
          />

          <CustomButton
            title={loading ? "Signing in..." : "Sign In"}
            onPress={onSignInPress}
            disabled={loading}
            className="mt-6"
          />

          <Link
            href="/(auth)/sign-in"
            className="text-lg text-center text-gray-400 mt-10"
          >
            Are you a customer?{" "}
            <Text className="text-primary-500">Sign in as customer</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
