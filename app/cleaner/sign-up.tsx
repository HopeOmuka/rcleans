import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { ServiceType } from "@/types/type";

const CLEANER_SPECIALTIES: ServiceType[] = [
  "home-cleaning",
  "office-cleaning",
  "deep-cleaning",
  "move-in-out",
  "post-construction",
].map((slug) => ({
  id: slug,
  name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  description: "",
  base_price: 0,
  price_per_hour: 0,
  estimated_duration_hours: 1,
}));

const SignUp = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    yearsExperience: "",
    bio: "",
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAPI<ApiResponse<ServiceType[]>>("/(api)/service-type")
      .then((result) => {
        if (cancelled) return;
        if (result.data && result.data.length > 0) {
          setServiceTypes(result.data);
          setSpecialties((prev) =>
            prev.filter((id) => result.data!.some((st) => st.id === id)),
          );
        }
      })
      .catch(() => {
        // Fall back to the static list if the API is unreachable.
        setServiceTypes(CLEANER_SPECIALTIES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSpecialty = useCallback(
    (id: string) => {
      setSpecialties((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
      );
      if (errors.specialties) setErrors((e) => ({ ...e, specialties: "" }));
    },
    [errors.specialties],
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (form.firstName.trim().length < 2) {
      newErrors.firstName = "First name is required";
    }
    if (form.lastName.trim().length < 2) {
      newErrors.lastName = "Last name is required";
    }
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
    if (specialties.length === 0) {
      newErrors.specialties = "Select at least one specialty";
    }
    const years = Number(form.yearsExperience);
    if (
      form.yearsExperience.trim() === "" ||
      !Number.isInteger(years) ||
      years < 0 ||
      years > 50
    ) {
      newErrors.yearsExperience = "Enter whole years (0-50), or 0 if none yet";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, specialties]);

  const onRegister = useCallback(async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await fetchAPI<
        ApiResponse<{ id: string; status: string }>
      >("/(api)/cleaner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          specialties,
          years_experience: Number(form.yearsExperience),
          bio: form.bio.trim() || undefined,
        }),
      });

      if (result.data) {
        setRegistered(true);
      } else {
        setErrors({ form: result.error || "Registration failed" });
      }
    } catch {
      setErrors({ form: "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [form, specialties, validate]);

  if (registered) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-dark-500"
      >
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-2xl bg-primary-gradient items-center justify-center mb-6">
            <Text className="text-white text-4xl font-JakartaBold">✓</Text>
          </View>
          <Text className="text-white text-2xl font-JakartaBold text-center">
            Application submitted!
          </Text>
          <Text className="text-gray-400 text-center mt-3 leading-6">
            Your application is under review. An admin will approve your
            registration, after which you can sign in with your email, phone
            number and password.
          </Text>
          <CustomButton
            title="Go to Sign In"
            bgVariant="success"
            onPress={() => router.replace("/cleaner/sign-in")}
            className="mt-8 w-full"
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-dark-500"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6">
          <Text className="text-white text-2xl font-JakartaBold">
            Become a Cleaner
          </Text>
          <Text className="text-gray-400 mt-2 leading-6">
            Join the rcleans professional network. Submit your details — an
            admin will review and approve your application.
          </Text>

          {errors.form ? (
            <Text className="text-red-400 text-sm mt-3">{errors.form}</Text>
          ) : null}

          <View className="bg-dark-200 rounded-2xl p-5 border border-gray-800 mt-5">
            <InputField
              label="First name"
              placeholder="Enter your first name"
              icon="person"
              tintColor="#9CA3AF"
              value={form.firstName}
              onChangeText={(value) => {
                setForm({ ...form, firstName: value });
                if (errors.firstName)
                  setErrors((e) => ({ ...e, firstName: "" }));
              }}
              labelStyle="text-white"
              containerStyle="bg-dark-300 border-dark-300"
              inputStyle="text-white placeholder:text-gray-500"
              iconStyle="opacity-80"
              accessibilityLabel="First name"
            />
            {errors.firstName ? (
              <Text className="text-red-400 text-sm mt-1">
                {errors.firstName}
              </Text>
            ) : null}

            <InputField
              label="Last name"
              placeholder="Enter your last name"
              icon="person-fill"
              tintColor="#9CA3AF"
              value={form.lastName}
              onChangeText={(value) => {
                setForm({ ...form, lastName: value });
                if (errors.lastName) setErrors((e) => ({ ...e, lastName: "" }));
              }}
              labelStyle="text-white"
              containerStyle="bg-dark-300 border-dark-300"
              inputStyle="text-white placeholder:text-gray-500"
              iconStyle="opacity-80"
              accessibilityLabel="Last name"
            />
            {errors.lastName ? (
              <Text className="text-red-400 text-sm mt-1">
                {errors.lastName}
              </Text>
            ) : null}

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
              <Text className="text-red-400 text-sm mt-1">{errors.email}</Text>
            ) : null}

            <InputField
              label="Phone"
              placeholder="Enter your phone number"
              icon="telephone-fill"
              tintColor="#9CA3AF"
              textContentType="telephoneNumber"
              keyboardType="phone-pad"
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
              <Text className="text-red-400 text-sm mt-1">{errors.phone}</Text>
            ) : null}

            <InputField
              label="Password"
              placeholder="At least 8 characters"
              icon="lock-fill"
              tintColor="#9CA3AF"
              secureTextEntry
              textContentType="newPassword"
              value={form.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (errors.password) setErrors((e) => ({ ...e, password: "" }));
              }}
              labelStyle="text-white"
              containerStyle="bg-dark-300 border-dark-300"
              inputStyle="text-white placeholder:text-gray-500"
              iconStyle="opacity-80"
              accessibilityLabel="Password"
            />
            {errors.password ? (
              <Text className="text-red-400 text-sm mt-1">
                {errors.password}
              </Text>
            ) : null}

            <InputField
              label="Confirm password"
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
              accessibilityLabel="Confirm password"
            />
            {errors.confirmPassword ? (
              <Text className="text-red-400 text-sm mt-1">
                {errors.confirmPassword}
              </Text>
            ) : null}

            <InputField
              label="Years of experience"
              placeholder="e.g. 3"
              icon="clock-fill"
              tintColor="#9CA3AF"
              keyboardType="number-pad"
              value={form.yearsExperience}
              onChangeText={(value) => {
                setForm({ ...form, yearsExperience: value });
                if (errors.yearsExperience)
                  setErrors((e) => ({ ...e, yearsExperience: "" }));
              }}
              labelStyle="text-white"
              containerStyle="bg-dark-300 border-dark-300"
              inputStyle="text-white placeholder:text-gray-500"
              iconStyle="opacity-80"
              accessibilityLabel="Years of experience"
            />
            {errors.yearsExperience ? (
              <Text className="text-red-400 text-sm mt-1">
                {errors.yearsExperience}
              </Text>
            ) : null}

            <InputField
              label="Short bio (optional)"
              placeholder="Tell customers about yourself"
              icon="chat-text"
              tintColor="#9CA3AF"
              value={form.bio}
              onChangeText={(value) => setForm({ ...form, bio: value })}
              labelStyle="text-white"
              containerStyle="bg-dark-300 border-dark-300"
              inputStyle="text-white placeholder:text-gray-500"
              iconStyle="opacity-80"
              accessibilityLabel="Short bio"
            />
          </View>

          <Text className="text-white font-JakartaSemiBold mt-5 mb-3">
            Service specialties
          </Text>
          <Text className="text-gray-400 text-sm mb-3">
            Select all the services you offer.
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {(serviceTypes.length > 0 ? serviceTypes : CLEANER_SPECIALTIES).map(
              (st) => {
                const active = specialties.includes(st.id);
                return (
                  <TouchableOpacity
                    key={st.id}
                    onPress={() => toggleSpecialty(st.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${st.name} specialty`}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? "bg-primary-600 border-primary-600"
                        : "border-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-sm font-JakartaMedium ${active ? "text-white" : "text-gray-300"}`}
                    >
                      {st.name}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
          {errors.specialties ? (
            <Text className="text-red-400 text-sm mt-2">
              {errors.specialties}
            </Text>
          ) : null}

          <CustomButton
            title={loading ? "Submitting..." : "Submit Application"}
            onPress={onRegister}
            disabled={loading}
            bgVariant="success"
            className="mt-8"
            accessibilityLabel="Submit cleaner application"
          />

          <Link
            href="/cleaner/sign-in"
            className="text-center text-gray-400 mt-6"
          >
            Already registered?{" "}
            <Text className="text-primary-500">Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;
