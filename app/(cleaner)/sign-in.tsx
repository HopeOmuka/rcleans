import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const validate = (): boolean => {
    const newErrors = { email: "", phone: "" };
    let valid = true;

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const onSignInPress = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await fetchAPI("/(api)/cleaner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });

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
            onChangeText={(value) => {
              setForm({ ...form, email: value });
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            containerStyle="bg-dark-200"
            inputStyle="text-white"
            accessibilityLabel="Email address"
          />
          {errors.email ? (
            <Text className="text-red-400 text-sm mt-1">{errors.email}</Text>
          ) : null}

          <InputField
            label="Phone"
            placeholder="Enter your phone number"
            icon={icons.phone || icons.person}
            textContentType="telephoneNumber"
            value={form.phone}
            onChangeText={(value) => {
              setForm({ ...form, phone: value });
              if (errors.phone) setErrors({ ...errors, phone: "" });
            }}
            containerStyle="bg-dark-200"
            inputStyle="text-white"
            accessibilityLabel="Phone number"
          />
          {errors.phone ? (
            <Text className="text-red-400 text-sm mt-1">{errors.phone}</Text>
          ) : null}

          <CustomButton
            title={loading ? "Signing in..." : "Sign In"}
            onPress={onSignInPress}
            disabled={loading}
            className="mt-6"
            accessibilityLabel="Sign in"
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
