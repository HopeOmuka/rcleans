import { router, useLocalSearchParams } from "expo-router";
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

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { images } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { SafeAreaView } from "react-native-safe-area-context";

const SetPassword = () => {
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const [form, setForm] = useState({
    email: params.email ?? "",
    phone: params.phone ?? "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      newErrors.phone = "Enter a valid phone number";
    }
    if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.email, form.phone, form.password, form.confirmPassword]);

  const onSetPassword = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/cleaner/set-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            phone: form.phone.trim(),
            password: form.password,
          }),
        },
      );

      if (result.data) {
        Alert.alert(
          "Password set",
          "Sign in with your email, phone number and new password.",
        );
        router.replace("/cleaner/sign-in");
      } else {
        setErrors({ form: result.error || "Could not set password" });
      }
    } catch {
      setErrors({ form: "Could not set password. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [form.email, form.phone, form.password, validate]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-dark-500"
    >
      <SafeAreaView className="flex-1" edges={["bottom"]}>
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
                  Set a password
                </Text>
                <Text className="text-gray-400 text-center mt-2 px-8 leading-6">
                  Cleaner accounts now require a password. Verify your email and
                  phone number to choose one.
                </Text>
              </View>

              {errors.form ? (
                <Text className="text-red-400 text-sm mb-3">{errors.form}</Text>
              ) : null}

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
                    if (errors.email) setErrors((e) => ({ ...e, email: "" }));
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
                    if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
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

                <InputField
                  label="New password"
                  placeholder="At least 8 characters"
                  icon="lock-fill"
                  tintColor="#9CA3AF"
                  secureTextEntry
                  textContentType="newPassword"
                  value={form.password}
                  onChangeText={(value) => {
                    setForm({ ...form, password: value });
                    if (errors.password)
                      setErrors((e) => ({ ...e, password: "" }));
                  }}
                  labelStyle="text-white"
                  containerStyle="bg-dark-300 border-dark-300"
                  inputStyle="text-white placeholder:text-gray-500"
                  iconStyle="opacity-80"
                  accessibilityLabel="New password"
                />
                {errors.password ? (
                  <Text className="text-red-400 text-sm mt-1">
                    {errors.password}
                  </Text>
                ) : null}

                <InputField
                  label="Confirm new password"
                  placeholder="Re-enter your password"
                  icon="shield-lock"
                  tintColor="#9CA3AF"
                  secureTextEntry
                  textContentType="newPassword"
                  value={form.confirmPassword}
                  onChangeText={(value) => {
                    setForm({ ...form, confirmPassword: value });
                    if (errors.confirmPassword)
                      setErrors((e) => ({ ...e, confirmPassword: "" }));
                  }}
                  labelStyle="text-white"
                  containerStyle="bg-dark-300 border-dark-300"
                  inputStyle="text-white placeholder:text-gray-500"
                  iconStyle="opacity-80"
                  accessibilityLabel="Confirm new password"
                />
                {errors.confirmPassword ? (
                  <Text className="text-red-400 text-sm mt-1">
                    {errors.confirmPassword}
                  </Text>
                ) : null}
              </View>
            </View>

            <View>
              <CustomButton
                title={loading ? "Saving..." : "Set Password"}
                onPress={onSetPassword}
                disabled={loading}
                bgVariant="success"
                className="mt-6"
                accessibilityLabel="Set password"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default SetPassword;
