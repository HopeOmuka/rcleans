import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InputField from "@/components/InputField";
import GoogleTextInput from "@/components/MapboxTextInput";
import { icons } from "@/constants";

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location_type: string;
  is_default: boolean;
}

const Profile = () => {
  const { user } = useUser();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(
    null,
  );
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    latitude: 0,
    longitude: 0,
    locationType: "other",
  });

  useEffect(() => {
    if (user?.id) {
      fetchLocations();
    }
  }, [user?.id]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/(api)/saved-locations?userId=${user?.id}`);
      const result = await response.json();
      if (result.data) {
        setLocations(result.data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setNewLocation((prev) => ({
      ...prev,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const handleSaveLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/(api)/saved-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          name: newLocation.name,
          address: newLocation.address,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          locationType: newLocation.locationType,
          isDefault: locations.length === 0,
        }),
      });

      const result = await response.json();
      if (result.data) {
        setModalVisible(false);
        setNewLocation({
          name: "",
          address: "",
          latitude: 0,
          longitude: 0,
          locationType: "other",
        });
        fetchLocations();
      }
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location");
    }
  };

  const handleDeleteLocation = (locationId: string) => {
    Alert.alert(
      "Delete Location",
      "Are you sure you want to delete this location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`/(api)/saved-locations?locationId=${locationId}`, {
                method: "DELETE",
              });
              fetchLocations();
            } catch (error) {
              console.error("Error deleting location:", error);
            }
          },
        },
      ],
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Email: support@rcleans.com\nPhone: +1 (555) 123-4567\n\nWe typically respond within 24 hours.",
      [{ text: "OK" }],
    );
  };

  const handleHelpCenter = () => {
    Alert.alert(
      "Help Center",
      "FAQs and help articles coming soon!\n\nIn the meantime, contact our support team for assistance.",
      [{ text: "OK" }],
    );
  };

  const handleServiceSettings = () => {
    router.push("/(root)/service-settings");
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "home":
        return icons.home;
      case "work":
        return icons.map;
      default:
        return icons.point;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-2xl font-JakartaBold text-white my-5">
          My profile
        </Text>

        <View className="flex items-center justify-center my-5">
          <Image
            source={{
              uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
            }}
            style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
            className="rounded-full h-[110px] w-[110px] border-[3px] border-primary-500"
          />
        </View>

        <View className="flex flex-col items-start justify-center bg-dark-200 rounded-lg p-4 border border-gray-700">
          <View className="flex flex-col items-start justify-start w-full">
            <InputField
              label="First name"
              placeholder={user?.firstName || "Not Found"}
              containerStyle="w-full"
              inputStyle="p-3.5 text-white"
              editable={false}
              labelStyle="text-gray-400"
            />

            <InputField
              label="Last name"
              placeholder={user?.lastName || "Not Found"}
              containerStyle="w-full"
              inputStyle="p-3.5 text-white"
              editable={false}
              labelStyle="text-gray-400"
            />

            <InputField
              label="Email"
              placeholder={
                user?.primaryEmailAddress?.emailAddress || "Not Found"
              }
              containerStyle="w-full"
              inputStyle="p-3.5 text-white"
              editable={false}
              labelStyle="text-gray-400"
            />

            <InputField
              label="Phone"
              placeholder={user?.primaryPhoneNumber?.phoneNumber || "Not Found"}
              containerStyle="w-full"
              inputStyle="p-3.5 text-white"
              editable={false}
              labelStyle="text-gray-400"
            />
          </View>
        </View>

        <Text className="text-xl font-JakartaBold text-white mt-8 mb-3">
          Saved Locations
        </Text>
        <View className="bg-dark-200 rounded-lg border border-gray-700 p-2">
          {loading ? (
            <ActivityIndicator className="py-4" color="#4ADE80" />
          ) : locations.length > 0 ? (
            locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                onLongPress={() => handleDeleteLocation(location.id)}
                className="flex-row items-center justify-between py-3 px-3 border-b border-gray-700"
              >
                <View className="flex-row items-center flex-1">
                  <Image
                    source={getLocationIcon(location.location_type)}
                    className="w-5 h-5 mr-3"
                    tintColor="#4ADE80"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-JakartaMedium">
                        {location.name}
                      </Text>
                      {location.is_default && (
                        <View className="ml-2 bg-primary-500/20 px-2 py-0.5 rounded">
                          <Text className="text-primary-500 text-xs">
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>
                      {location.address}
                    </Text>
                  </View>
                </View>
                <Image
                  source={icons.arrowUp}
                  className="w-4 h-4"
                  tintColor="#666"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="flex-row items-center justify-between py-3 px-3"
            >
              <View className="flex-row items-center">
                <Image
                  source={icons.home}
                  className="w-5 h-5 mr-3"
                  tintColor="#666"
                />
                <Text className="text-gray-400 font-JakartaMedium">
                  Add your first location
                </Text>
              </View>
              <Image
                source={icons.arrowUp}
                className="w-4 h-4"
                tintColor="#666"
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="flex-row items-center justify-center py-3 mt-2"
          >
            <Image
              source={icons.arrowUp}
              className="w-4 h-4 mr-2"
              tintColor="#4ADE80"
            />
            <Text className="text-primary-500 font-JakartaMedium">
              Add New Location
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-JakartaBold text-white mt-8 mb-3">
          Cleaner Tools
        </Text>
        <View className="bg-dark-200 rounded-lg border border-gray-700 p-2">
          <TouchableOpacity
            onPress={() => router.push("/(root)/availability")}
            className="flex-row items-center justify-between py-3 px-3 border-b border-gray-700"
          >
            <View className="flex-row items-center">
              <Image
                source={icons.calendar}
                className="w-5 h-5 mr-3"
                tintColor="#4ADE80"
              />
              <Text className="text-white font-JakartaMedium">
                Manage Availability
              </Text>
            </View>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleServiceSettings}
            className="flex-row items-center justify-between py-3 px-3"
          >
            <View className="flex-row items-center">
              <Image
                source={icons.settings}
                className="w-5 h-5 mr-3"
                tintColor="#4ADE80"
              />
              <Text className="text-white font-JakartaMedium">
                Service Settings
              </Text>
            </View>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-JakartaBold text-white mt-8 mb-3">
          Support
        </Text>
        <View className="bg-dark-200 rounded-lg border border-gray-700 p-2">
          <TouchableOpacity
            onPress={handleHelpCenter}
            className="flex-row items-center justify-between py-3 px-3 border-b border-gray-700"
          >
            <Text className="text-white font-JakartaMedium">Help Center</Text>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContactSupport}
            className="flex-row items-center justify-between py-3 px-3"
          >
            <Text className="text-white font-JakartaMedium">
              Contact Support
            </Text>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4"
              tintColor="#666"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </TouchableOpacity>
        </View>

        <View className="mt-8 mb-4 flex-row justify-center">
          <TouchableOpacity
            onPress={() => router.push("/(cleaner)/sign-in")}
            className="px-4 py-2"
          >
            <Text className="text-primary-500 text-center">
              Sign in as a Cleaner
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-dark-500/90 justify-end">
          <View className="bg-dark-200 rounded-t-3xl p-5 border-t border-gray-700">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-white text-xl font-JakartaBold">
                Add New Location
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Image
                  source={icons.close}
                  className="w-6 h-6"
                  tintColor="white"
                />
              </TouchableOpacity>
            </View>

            <InputField
              label="Location Name"
              placeholder="Home, Work, etc."
              value={newLocation.name}
              onChangeText={(value) =>
                setNewLocation((prev) => ({ ...prev, name: value }))
              }
              containerStyle="bg-dark-100"
              inputStyle="text-white"
              labelStyle="text-gray-400"
            />

            <View className="mt-4">
              <Text className="text-gray-400 text-sm mb-2">Address</Text>
              <GoogleTextInput
                containerStyle="bg-dark-100"
                handlePress={handleLocationSelect}
                initialLocation={newLocation.address || "Search address"}
              />
            </View>

            <View className="mt-4">
              <Text className="text-gray-400 text-sm mb-2">Location Type</Text>
              <View className="flex-row gap-3">
                {["home", "work", "other"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() =>
                      setNewLocation((prev) => ({
                        ...prev,
                        locationType: type,
                      }))
                    }
                    className={`px-4 py-2 rounded-lg ${
                      newLocation.locationType === type
                        ? "bg-primary-500"
                        : "bg-dark-100"
                    }`}
                  >
                    <Text
                      className={
                        newLocation.locationType === type
                          ? "text-white"
                          : "text-gray-400"
                      }
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveLocation}
              className="bg-primary-500 mt-6 p-4 rounded-xl"
            >
              <Text className="text-white text-center font-JakartaSemiBold">
                Save Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
