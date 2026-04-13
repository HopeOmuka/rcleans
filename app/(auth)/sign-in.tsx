import { useSignIn } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
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
      Alert.alert("Error", err.errors[0].longMessage);
    }
  }, [isLoaded, signIn, form.email, form.password, setActive]);

  return (
    <ScrollView className="flex-1 bg-dark-500">
      <View className="flex-1">
        <View className="relative w-full h-[200px]">
          <View className="absolute inset-0 bg-primary-gradient opacity-80" />
          <Text className="absolute bottom-5 left-5 text-2xl text-white font-JakartaSemiBold">
            Welcome to RCleans 👋
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
            containerStyle="bg-dark-200"
            inputStyle="text-white"
            labelStyle="text-gray-400"
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
            containerStyle="bg-dark-200"
            inputStyle="text-white"
            labelStyle="text-gray-400"
          />

          <CustomButton
            title="Sign In"
            onPress={onSignInPress}
            className="mt-6"
          />

          <OAuth />

          <Link
            href="/sign-up"
            className="text-lg text-center text-gray-400 mt-10"
          >
            Don&apos;t have an account?{" "}
            <Text className="text-primary-500">Sign Up</Text>
          </Link>

          <Link
            href="/(cleaner)/sign-in"
            className="text-lg text-center text-gray-500 mt-6"
          >
            Are you a cleaner?{" "}
            <Text className="text-accent-500">Sign in here</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
