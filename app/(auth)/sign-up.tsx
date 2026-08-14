import { isClerkAPIResponseError, useAuth, useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNativeModal } from "react-native-modal";

import BootstrapIcon from "@/components/BootstrapIcon";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { images } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";

const SignUp = () => {
  const { theme } = useTheme();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) {
      Alert.alert("Notice", "Please enter your name.");
      return;
    }
    if (!email) {
      Alert.alert("Notice", "Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Notice", "Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      Alert.alert("Notice", "Please choose a password.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Notice", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password: form.password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
      const message =
        isClerkAPIResponseError(err) && err.errors?.[0]?.longMessage
          ? err.errors[0].longMessage
          : "An error occurred";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };
  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        const token = await getToken({ skipCache: true });
        await fetchAPI<ApiResponse<{ id: string }>>("/(api)/user", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });
        setVerification({
          ...verification,
          state: "success",
        });
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      setVerification({
        ...verification,
        error: err?.errors?.[0]?.longMessage || "An error occurred",
        state: "failed",
      });
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["bottom"]}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            className="flex-1"
            style={{ backgroundColor: theme.colors.background }}
          >
            <View className="relative w-full h-[260px] bg-primary-gradient items-center justify-center rounded-b-[36px]">
              <View className="w-20 h-20 rounded-2xl bg-white/15 border border-white/25 items-center justify-center mb-4 overflow-hidden">
                <Image
                  source={images.logo}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-3xl text-white font-JakartaExtraBold">
                Create Your Account
              </Text>
              <Text className="text-white/85 mt-2 font-JakartaMedium text-base">
                Join rcleans and book trusted cleaners
              </Text>
            </View>
            <View className="p-6">
              <InputField
                label="Name"
                placeholder="Enter name"
                icon="person"
                value={form.name}
                onChangeText={(value) => setForm({ ...form, name: value })}
              />
              <InputField
                label="Email"
                placeholder="Enter email"
                icon="envelope"
                textContentType="emailAddress"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(value) => setForm({ ...form, email: value })}
              />
              <InputField
                label="Password"
                placeholder="Enter password"
                icon="lock"
                secureTextEntry={true}
                textContentType="password"
                value={form.password}
                onChangeText={(value) => setForm({ ...form, password: value })}
              />
              <CustomButton
                title={loading ? "Signing Up..." : "Sign Up"}
                onPress={onSignUpPress}
                loading={loading}
                className="mt-6"
              />
              <OAuth />
              <Link
                href="/(auth)/sign-in"
                className="text-lg text-center mt-8 font-JakartaMedium"
                style={{ color: theme.colors.textSecondary }}
              >
                Already have an account?{" "}
                <Text className="text-primary-600 font-JakartaBold">
                  Log In
                </Text>
              </Link>
            </View>
            <ReactNativeModal
              isVisible={verification.state === "pending"}
              onModalHide={() => {
                if (verification.state === "success") {
                  setShowSuccessModal(true);
                }
              }}
            >
              <View
                className="px-7 py-9 rounded-2xl min-h-[300px]"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <Text
                  className="font-JakartaExtraBold text-2xl mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Verification
                </Text>
                <Text
                  className="font-Jakarta mb-5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  We&apos;ve sent a verification code to {form.email}.
                </Text>
                <InputField
                  label={"Code"}
                  icon="lock"
                  placeholder={"123456"}
                  value={verification.code}
                  keyboardType="numeric"
                  onChangeText={(code) =>
                    setVerification({ ...verification, code })
                  }
                />
                {verification.error && (
                  <Text className="text-danger-500 text-sm mt-1">
                    {verification.error}
                  </Text>
                )}
                <CustomButton
                  title="Verify Email"
                  onPress={onPressVerify}
                  bgVariant="success"
                  className="mt-5"
                />
              </View>
            </ReactNativeModal>
            <ReactNativeModal isVisible={showSuccessModal}>
              <View
                className="px-7 py-9 rounded-2xl min-h-[300px]"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <BootstrapIcon
                  name="check-circle-fill"
                  size={110}
                  color={theme.colors.success}
                  style={{ alignSelf: "center", marginVertical: 20 }}
                />
                <Text
                  className="text-3xl font-JakartaBold text-center"
                  style={{ color: theme.colors.text }}
                >
                  Verified
                </Text>
                <Text
                  className="text-base font-Jakarta text-center mt-2"
                  style={{ color: theme.colors.textMuted }}
                >
                  You have successfully verified your account.
                </Text>
                <CustomButton
                  title="Browse Home"
                  onPress={() => router.push(`/(root)/(tabs)/home`)}
                  className="mt-5"
                />
              </View>
            </ReactNativeModal>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
export default SignUp;
