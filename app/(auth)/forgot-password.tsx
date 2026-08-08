import { useSignIn } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
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

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { useTheme } from "@/lib/theme";

type Step = "request" | "code" | "reset";

const ForgotPassword = () => {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [step, setStep] = useState<Step>("request");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const sendResetCode = async () => {
    if (!isLoaded || !signIn) return;
    if (!email.trim()) {
      Alert.alert("Error", "Enter the email for your account.");
      return;
    }
    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStep("code");
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Could not send a reset code. Try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!isLoaded || !signIn) return;
    if (!code.trim()) {
      Alert.alert("Error", "Enter the code from your email.");
      return;
    }
    setLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
      });
      if (attempt.status === "needs_new_password") {
        setStep("reset");
      } else {
        Alert.alert("Error", "The code did not verify. Please try again.");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!isLoaded || !signIn) return;
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.resetPassword({ password });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        Alert.alert(
          "Password set",
          "You can now log in with your email and new password.",
        );
        router.replace("/(root)/(tabs)/home");
      } else {
        Alert.alert("Error", "Could not set your password. Please try again.");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          "Could not set your password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
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
              Reset Password
            </Text>
            <Text className="text-white/85 mt-2 font-JakartaMedium text-base">
              {step === "request" && "Get a code to reset your password"}
              {step === "code" && `Code sent to ${email}`}
              {step === "reset" && "Choose a new password"}
            </Text>
          </View>

          <View className="p-6">
            {step === "request" && (
              <>
                <InputField
                  label="Email"
                  placeholder="Enter the email on your account"
                  icon={icons.email}
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <CustomButton
                  title={loading ? "Sending..." : "Send Reset Code"}
                  onPress={sendResetCode}
                  loading={loading}
                  className="mt-6"
                />
              </>
            )}

            {step === "code" && (
              <>
                <Text
                  className="font-Jakarta text-base mb-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Enter the verification code we emailed to {email}.
                </Text>
                <InputField
                  label="Verification Code"
                  placeholder="123456"
                  icon={icons.lock}
                  value={code}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  onChangeText={setCode}
                />
                <CustomButton
                  title={loading ? "Verifying..." : "Verify Code"}
                  onPress={verifyCode}
                  loading={loading}
                  className="mt-6"
                />
                <CustomButton
                  title="Resend Code"
                  bgVariant="outline"
                  textVariant="primary"
                  onPress={() => {
                    setCode("");
                    sendResetCode();
                  }}
                  className="mt-3"
                />
              </>
            )}

            {step === "reset" && (
              <>
                <InputField
                  label="New Password"
                  placeholder="At least 8 characters"
                  icon={icons.lock}
                  secureTextEntry
                  textContentType="newPassword"
                  value={password}
                  onChangeText={setPassword}
                />
                <InputField
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  icon={icons.lock}
                  secureTextEntry
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <CustomButton
                  title={loading ? "Saving..." : "Save New Password"}
                  onPress={resetPassword}
                  loading={loading}
                  className="mt-6"
                />
              </>
            )}

            <View className="mt-8 items-center">
              <Link
                href="/(auth)/sign-in"
                className="text-lg text-center font-JakartaMedium"
                style={{ color: theme.colors.textSecondary }}
              >
                <Text className="text-primary-600 font-JakartaBold">
                  Back to Sign In
                </Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
