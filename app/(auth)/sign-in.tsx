import { useSignIn } from "@clerk/clerk-expo";
import { Link, router, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { useTheme } from "@/lib/theme";

const SignIn = () => {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    const email = form.email.trim();
    if (!email) {
      Alert.alert("Notice", "Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Notice", "Please enter a valid email address.");
      return;
    }
    if (!form.password) {
      Alert.alert("Notice", "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/home");
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert(
        "Error",
        err?.errors?.[0]?.longMessage || "An error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, form.email, form.password, setActive]);

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
                Welcome Back
              </Text>
              <Text className="text-white/85 mt-2 font-JakartaMedium text-base">
                Sign in to book a cleaner
              </Text>
            </View>

            <View className="p-6">
              <InputField
                label="Email"
                placeholder="Enter email"
                icon={icons.email}
                textContentType="emailAddress"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(value) => setForm({ ...form, email: value })}
              />

              <InputField
                label="Password"
                placeholder="Enter password"
                icon={icons.lock}
                secureTextEntry={true}
                textContentType="password"
                value={form.password}
                onChangeText={(value) => setForm({ ...form, password: value })}
              />

              <View className="flex-row justify-end mt-1">
                <Link
                  href={"/(auth)/forgot-password" as Href}
                  className="text-sm text-primary-600 font-JakartaSemiBold"
                >
                  Forgot password?
                </Link>
              </View>

              <CustomButton
                title={loading ? "Signing In..." : "Sign In"}
                onPress={onSignInPress}
                loading={loading}
                className="mt-4"
              />

              <View
                className="mt-4 rounded-xl px-4 py-3"
                style={{ backgroundColor: theme.colors.surfaceMuted }}
              >
                <Text
                  className="text-sm font-Jakarta text-center"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Signed up with Google only? Tap{" "}
                  <Text className="text-primary-600 font-JakartaBold">
                    Forgot password?
                  </Text>{" "}
                  above to set an email password and log in without Google.
                </Text>
              </View>

              <OAuth />

              <Link
                href="/(auth)/sign-up"
                className="text-lg text-center mt-8 font-JakartaMedium"
                style={{ color: theme.colors.textSecondary }}
              >
                Don&apos;t have an account?{" "}
                <Text className="text-primary-600 font-JakartaBold">
                  Sign Up
                </Text>
              </Link>

              <Link
                href="/cleaner/sign-in"
                className="text-lg text-center mt-3 font-JakartaMedium"
                style={{ color: theme.colors.textSecondary }}
              >
                Are you a cleaner?{" "}
                <Text className="text-primary-600 font-JakartaBold">
                  Sign in as cleaner
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default SignIn;
