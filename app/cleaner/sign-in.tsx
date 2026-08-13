import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { images } from "@/constants";
import { fetchAPI, setAuthToken, ApiResponse } from "@/lib/fetch";
import { CleanerSession } from "@/types/type";

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const validate = useCallback((): boolean => {
    const newErrors = { email: "", phone: "" };
    let valid = true;

    const email = form.email.trim();
    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    const digits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (digits.length < 7 || digits.length > 15) {
      newErrors.phone = "Enter a valid phone number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  }, [form.email, form.phone]);

  const onSignInPress = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await fetchAPI<
        ApiResponse<{ cleaner: CleanerSession; token: string }>
      >("/(api)/cleaner/login", {
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
        setAuthToken(result.data.token);
        router.replace("/cleaner/dashboard");
      } else {
        Alert.alert("Error", result.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form.email, form.phone, validate]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-dark-500"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-8 justify-between">
          <View>
            <View className="items-center mb-10">
              <View className="w-20 h-20 rounded-2xl bg-primary-gradient items-center justify-center mb-5 shadow-lg shadow-primary-500/30 overflow-hidden">
                <Image
                  source={images.logo}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-white text-3xl font-JakartaBold">
                Cleaner Portal
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-8">
                Sign in with your registered email and phone number to access
                your jobs
              </Text>
            </View>

            <View className="bg-dark-200 rounded-2xl p-5 border border-gray-800">
              <InputField
                label="Email"
                placeholder="Enter your email"
                icon="envelope"
                tintColor="#9CA3AF"
                textContentType="emailAddress"
                value={form.email}
                onChangeText={(value) => {
                  setForm({ ...form, email: value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                labelStyle="text-white"
                containerStyle="bg-dark-300 border-dark-300"
                inputStyle="text-white placeholder:text-gray-500"
                iconStyle="opacity-80"
                accessibilityLabel="Email address"
              />
              {errors.email ? (
                <Text className="text-red-400 text-sm mt-1">
                  {errors.email}
                </Text>
              ) : null}

              <InputField
                label="Phone"
                placeholder="Enter your phone number"
                icon="telephone-fill"
                tintColor="#9CA3AF"
                textContentType="telephoneNumber"
                value={form.phone}
                onChangeText={(value) => {
                  setForm({ ...form, phone: value });
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                labelStyle="text-white"
                containerStyle="bg-dark-300 border-dark-300"
                inputStyle="text-white placeholder:text-gray-500"
                iconStyle="opacity-80"
                accessibilityLabel="Phone number"
              />
              {errors.phone ? (
                <Text className="text-red-400 text-sm mt-1">
                  {errors.phone}
                </Text>
              ) : null}
            </View>
          </View>

          <View>
            <CustomButton
              title={loading ? "Signing in..." : "Sign In"}
              onPress={onSignInPress}
              disabled={loading}
              bgVariant="success"
              className="mt-6"
              accessibilityLabel="Sign in"
            />

            <Link
              href="/cleaner/sign-up"
              className="text-center text-gray-400 mt-8"
            >
              New to rcleans?{" "}
              <Text className="text-primary-500">
                Apply to become a cleaner
              </Text>
            </Link>

            <Link
              href="/(auth)/sign-in"
              className="text-center text-gray-400 mt-6"
            >
              Are you a customer?{" "}
              <Text className="text-primary-500">Sign in as customer</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;
