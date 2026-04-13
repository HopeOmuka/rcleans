import { router } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { icons } from "@/constants";
import CustomButton from "@/components/CustomButton";

interface ServiceSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const ServiceSettings = () => {
  const [settings, setSettings] = useState<ServiceSetting[]>([
    {
      id: "1",
      name: "Email Notifications",
      description: "Receive updates about your bookings via email",
      enabled: true,
    },
    {
      id: "2",
      name: "Push Notifications",
      description: "Get instant push notifications on your device",
      enabled: true,
    },
    {
      id: "3",
      name: "SMS Notifications",
      description: "Receive text messages for important updates",
      enabled: false,
    },
    {
      id: "4",
      name: "Marketing Emails",
      description: "Receive promotional offers and deals",
      enabled: false,
    },
  ]);

  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("card");

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting,
      ),
    );
  };

  const handleSave = () => {
    Alert.alert("Success", "Your preferences have been saved!");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <View className="flex-row items-center p-5 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={icons.backArrow}
            className="w-6 h-6"
            tintColor="white"
          />
        </TouchableOpacity>
        <Text className="text-white text-xl font-JakartaBold ml-4">
          Service Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        className="px-5"
      >
        <Text className="text-lg font-JakartaSemiBold text-white mt-6 mb-3">
          Notifications
        </Text>
        <View className="bg-dark-200 rounded-xl border border-gray-700 overflow-hidden">
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              className={`flex-row items-center justify-between p-4 ${
                index < settings.length - 1 ? "border-b border-gray-700" : ""
              }`}
            >
              <View className="flex-1 mr-4">
                <Text className="text-white font-JakartaMedium">
                  {setting.name}
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {setting.description}
                </Text>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: "#333", true: "#4ADE80" }}
                thumbColor="white"
              />
            </View>
          ))}
        </View>

        <Text className="text-lg font-JakartaSemiBold text-white mt-8 mb-3">
          Language
        </Text>
        <View className="bg-dark-200 rounded-xl border border-gray-700 overflow-hidden">
          {["English", "Spanish", "French", "German"].map((lang, index) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setPreferredLanguage(lang)}
              className={`flex-row items-center justify-between p-4 ${
                index < 3 ? "border-b border-gray-700" : ""
              }`}
            >
              <Text
                className={
                  preferredLanguage === lang ? "text-primary-500" : "text-white"
                }
              >
                {lang}
              </Text>
              {preferredLanguage === lang && (
                <Image
                  source={icons.checkmark}
                  className="w-5 h-5"
                  tintColor="#4ADE80"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-lg font-JakartaSemiBold text-white mt-8 mb-3">
          Default Payment Method
        </Text>
        <View className="bg-dark-200 rounded-xl border border-gray-700 overflow-hidden">
          {[
            { id: "card", name: "Credit/Debit Card" },
            { id: "wallet", name: "RCleans Wallet" },
            { id: "cash", name: "Cash on Delivery" },
          ].map((method, index) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setDefaultPaymentMethod(method.id)}
              className={`flex-row items-center justify-between p-4 ${
                index < 2 ? "border-b border-gray-700" : ""
              }`}
            >
              <Text
                className={
                  defaultPaymentMethod === method.id
                    ? "text-primary-500"
                    : "text-white"
                }
              >
                {method.name}
              </Text>
              {defaultPaymentMethod === method.id && (
                <Image
                  source={icons.checkmark}
                  className="w-5 h-5"
                  tintColor="#4ADE80"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-lg font-JakartaSemiBold text-white mt-8 mb-3">
          Service Preferences
        </Text>
        <View className="bg-dark-200 rounded-xl border border-gray-700 p-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white font-JakartaMedium">
                Preferred Cleaner Gender
              </Text>
              <Text className="text-gray-400 text-sm">
                No preference by default
              </Text>
            </View>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </View>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white font-JakartaMedium">
                Default Service Duration
              </Text>
              <Text className="text-gray-400 text-sm">2 hours</Text>
            </View>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </View>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-JakartaMedium">
                Preferred Start Time
              </Text>
              <Text className="text-gray-400 text-sm">
                Morning (8 AM - 12 PM)
              </Text>
            </View>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </View>
        </View>

        <CustomButton
          title="Save Preferences"
          onPress={handleSave}
          className="mt-8 mb-4"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServiceSettings;
