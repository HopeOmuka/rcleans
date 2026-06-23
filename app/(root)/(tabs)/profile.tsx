import { useUser } from "@clerk/clerk-expo";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Application from "expo-application";

import InputField from "@/components/InputField";
import { icons } from "@/constants";
import { showToast } from "@/components/Toast";

const Profile = () => {
  const { user } = useUser();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          router.replace("/(root)/(tabs)/home");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-2xl font-JakartaBold my-5">My profile</Text>

        <View className="flex items-center justify-center my-5">
          <Image
            source={{
              uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
            }}
            className="rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300"
            accessibilityLabel="Profile picture"
          />
        </View>

        <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
          <View className="flex flex-col items-start justify-start w-full">
            <InputField
              label="First name"
              placeholder={user?.firstName || "Not Found"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Last name"
              placeholder={user?.lastName || "Not Found"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Email"
              placeholder={
                user?.primaryEmailAddress?.emailAddress || "Not Found"
              }
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Phone"
              placeholder={user?.primaryPhoneNumber?.phoneNumber || "Not Found"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />
          </View>
        </View>

        <Text className="text-xl font-JakartaBold mt-8 mb-3">
          Saved Locations
        </Text>
        <View className="bg-white rounded-lg shadow-sm shadow-neutral-300 p-5">
          <TouchableOpacity
            accessibilityLabel="Home address"
            accessibilityRole="button"
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
          >
            <View className="flex-row items-center">
              <Image source={icons.home} className="w-5 h-5 mr-3" />
              <Text className="text-base font-JakartaMedium">Home</Text>
            </View>
            <Text className="text-sm text-gray-500">Add address</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Work address"
            accessibilityRole="button"
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
          >
            <View className="flex-row items-center">
              <Image source={icons.point} className="w-5 h-5 mr-3" />
              <Text className="text-base font-JakartaMedium">Work</Text>
            </View>
            <Text className="text-sm text-gray-500">Add address</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Favorite locations"
            accessibilityRole="button"
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Image source={icons.star} className="w-5 h-5 mr-3" />
              <Text className="text-base font-JakartaMedium">Favorites</Text>
            </View>
            <Text className="text-sm text-gray-500">0 saved</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-JakartaBold mt-8 mb-3">
          Cleaner Tools
        </Text>
        <View className="bg-white rounded-lg shadow-sm shadow-neutral-300 p-5">
          <TouchableOpacity
            accessibilityLabel="Manage Availability"
            accessibilityRole="button"
            onPress={() => router.push("/(root)/availability")}
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
          >
            <View className="flex-row items-center">
              <Image source={icons.calendar} className="w-5 h-5 mr-3" />
              <Text className="text-base font-JakartaMedium">
                Manage Availability
              </Text>
            </View>
            <Image source={icons.arrowUp} className="w-4 h-4 rotate-90" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Service Settings"
            accessibilityRole="button"
            onPress={() => showToast("Coming soon")}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Image source={icons.settings} className="w-5 h-5 mr-3" />
              <Text className="text-base font-JakartaMedium">
                Service Settings
              </Text>
            </View>
            <Image source={icons.arrowUp} className="w-4 h-4 rotate-90" />
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-JakartaBold mt-8 mb-3">Support</Text>
        <View className="bg-white rounded-lg shadow-sm shadow-neutral-300 p-5">
          <TouchableOpacity
            accessibilityLabel="Help Center"
            accessibilityRole="button"
            onPress={() => showToast("Coming soon")}
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
          >
            <Text className="text-base font-JakartaMedium">Help Center</Text>
            <Image source={icons.arrowUp} className="w-4 h-4 rotate-90" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Contact Support"
            accessibilityRole="button"
            onPress={() => showToast("Coming soon")}
            className="flex-row items-center justify-between py-3"
          >
            <Text className="text-base font-JakartaMedium">
              Contact Support
            </Text>
            <Image source={icons.arrowUp} className="w-4 h-4 rotate-90" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-50 border border-red-200 rounded-lg py-3.5 mt-8"
        >
          <Image
            source={icons.out}
            className="w-5 h-5 mr-2"
            tintColor="#EF4444"
          />
          <Text className="text-red-500 font-JakartaMedium">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 mt-4 mb-2">
          Version {Application.nativeApplicationVersion ?? "1.0.0"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
