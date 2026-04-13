import { useUser, useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddonSelector from "@/components/AddonSelector";
import GoogleTextInput from "@/components/MapboxTextInput";
import Map from "@/components/Map";
import PromoCodeInput from "@/components/PromoCodeInput";
import ServiceCard from "@/components/ServiceCard";
import { reverseGeocodeWithMapbox } from "@/lib/map";
import { icons, images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { useLocationStore, useServiceTypeStore } from "@/store";
import { Service, ServiceType } from "@/types/type";

const Home = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const { setUserLocation, setServiceLocation } = useLocationStore();
  const {
    serviceTypes,
    selectedServiceType,
    setServiceTypes,
    setSelectedServiceType,
  } = useServiceTypeStore();

  const DEFAULT_LOCATION = {
    latitude: -1.2921, // Nairobi latitude
    longitude: 36.8219, // Nairobi longitude
    address: "Nairobi, Kenya",
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const handleServiceTypeSelect = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setSelectedAddons([]); // Reset addons when service type changes
    setAppliedPromo(null); // Reset promo when service type changes
  };

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [showAddons, setShowAddons] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  const {
    data: recentServices,
    loading,
    error,
  } = useFetch<Service[]>(`/(api)/service/${user?.id}`);

  const {
    data: fetchedServiceTypes,
    loading: serviceTypesLoading,
    error: serviceTypesError,
  } = useFetch<ServiceType[]>(`/(api)/service-type`);

  useEffect(() => {
    if (fetchedServiceTypes) {
      setServiceTypes(fetchedServiceTypes);
    }
  }, [fetchedServiceTypes, setServiceTypes]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Location permission denied");
          Alert.alert(
            "Location Permission Required",
            "Please enable location services to find cleaners near you and get accurate service locations.",
            [{ text: "OK", style: "default" }],
          );
          setUserLocation(DEFAULT_LOCATION); // fallback
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000, // 15 seconds timeout
        });

        const address = await reverseGeocodeWithMapbox(
          location.coords.latitude,
          location.coords.longitude,
        );

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address,
        });
      } catch (err) {
        console.error("Location error:", err);

        // Provide more specific error handling
        if (err instanceof Error) {
          if (err.message.includes("unavailable")) {
            console.log(
              "Location services are disabled. Using default location.",
            );
          } else if (err.message.includes("timeout")) {
            console.log("Location request timed out. Using default location.");
          }
        }

        setUserLocation(DEFAULT_LOCATION); // fallback
      }
    })();
  }, [DEFAULT_LOCATION, setUserLocation]);

  const handleServiceLocationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    if (!selectedServiceType) {
      Alert.alert("Service Required", "Please select a service type first");
      return;
    }
    setServiceLocation(location);
    router.push("/(root)/find-service");
  };

  const handleAddonToggle = (addon: any) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon],
    );
  };

  const handlePromoApplied = (promoData: any) => {
    setAppliedPromo(promoData);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  const totalAddonPrice = selectedAddons.reduce(
    (sum, addon) => sum + addon.price,
    0,
  );
  const totalAddonDuration = selectedAddons.reduce(
    (sum, addon) => sum + addon.estimated_duration_minutes,
    0,
  );
  const basePrice = selectedServiceType?.base_price || 0;
  const subtotal = basePrice + totalAddonPrice;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const finalPrice = subtotal - discountAmount;

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={recentServices?.slice(0, 5)}
        renderItem={({ item }) => <ServiceCard service={item} />}
        keyExtractor={(item, index) => index.toString()}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No recent services found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No recent services found</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold">
                Welcome {user?.firstName}👋
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Emergency", "Emergency contact: +1-800-CLEAN")
                  }
                  className="mr-3 justify-center items-center w-10 h-10 rounded-full bg-red-500"
                >
                  <Text className="text-white font-JakartaBold text-xs">
                    SOS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="justify-center items-center w-10 h-10 rounded-full bg-white"
                >
                  <Image source={icons.out} className="w-4 h-4" />
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              What service do you need?
            </Text>
            {serviceTypesError ? (
              <View className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600 text-sm">
                  Failed to load service types. Please try again.
                </Text>
              </View>
            ) : serviceTypesLoading ? (
              <ActivityIndicator size="small" color="#000" className="mb-5" />
            ) : (
              <FlatList
                data={serviceTypes}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleServiceTypeSelect(item)}
                    className={`mr-3 p-4 rounded-lg border ${
                      selectedServiceType?.id === item.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <Text className="text-sm font-JakartaMedium">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      From ${item.base_price}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-5"
              />
            )}

            {selectedServiceType && (
              <>
                <TouchableOpacity
                  onPress={() => setShowAddons(!showAddons)}
                  className="flex-row items-center justify-between p-4 bg-white rounded-lg border border-gray-200 mb-5"
                >
                  <Text className="text-lg font-JakartaSemiBold">
                    Add Extra Services
                  </Text>
                  <Text className="text-primary-500">
                    {selectedAddons.length > 0
                      ? `${selectedAddons.length} selected`
                      : "Optional"}
                  </Text>
                </TouchableOpacity>

                {showAddons && (
                  <AddonSelector
                    selectedAddons={selectedAddons}
                    onAddonToggle={handleAddonToggle}
                    totalAddonPrice={totalAddonPrice}
                    totalAddonDuration={totalAddonDuration}
                  />
                )}

                {selectedServiceType && (
                  <PromoCodeInput
                    serviceTypeId={selectedServiceType.id}
                    baseAmount={subtotal}
                    onPromoApplied={handlePromoApplied}
                    onPromoRemoved={handlePromoRemoved}
                  />
                )}

                {selectedServiceType && (
                  <View className="p-4 bg-white rounded-lg border border-gray-200 mb-5">
                    <Text className="text-lg font-JakartaSemiBold mb-3">
                      Price Summary
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">
                          {selectedServiceType.name}
                        </Text>
                        <Text className="font-JakartaMedium">${basePrice}</Text>
                      </View>
                      {selectedAddons.map((addon) => (
                        <View
                          key={addon.id}
                          className="flex-row justify-between"
                        >
                          <Text className="text-gray-600">{addon.name}</Text>
                          <Text className="font-JakartaMedium">
                            ${addon.price}
                          </Text>
                        </View>
                      ))}
                      {appliedPromo && (
                        <View className="flex-row justify-between">
                          <Text className="text-green-600">
                            Promo ({appliedPromo.promoCode})
                          </Text>
                          <Text className="text-green-600 font-JakartaMedium">
                            -${appliedPromo.discountAmount}
                          </Text>
                        </View>
                      )}
                      <View className="border-t border-gray-200 pt-2 mt-2">
                        <View className="flex-row justify-between">
                          <Text className="text-lg font-JakartaSemiBold">
                            Total
                          </Text>
                          <Text className="text-lg font-JakartaBold text-primary-500">
                            ${finalPrice}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              When do you need the service?
            </Text>
            <View className="flex-row mb-5">
              <TouchableOpacity
                onPress={() => setIsScheduled(false)}
                className={`mr-3 px-4 py-2 rounded-lg border ${
                  !isScheduled
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300"
                }`}
              >
                <Text className="text-sm font-JakartaMedium">Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsScheduled(true)}
                className={`px-4 py-2 rounded-lg border ${
                  isScheduled
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300"
                }`}
              >
                <Text className="text-sm font-JakartaMedium">Schedule</Text>
              </TouchableOpacity>
            </View>

            {isScheduled && (
              <View className="mb-5">
                <Text className="text-sm font-JakartaMedium mb-2">
                  Select Date & Time
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    // Simple date picker - in real app, use a proper date picker
                    Alert.alert("Schedule", "Date picker would go here");
                  }}
                  className="border border-gray-300 rounded-lg p-3"
                >
                  <Text className="text-sm">
                    {scheduledDate.toLocaleDateString()}{" "}
                    {scheduledDate.toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white shadow-md shadow-neutral-300"
              handlePress={handleServiceLocationPress}
              placeholder="Enter service location"
            />

            <>
              <Text className="text-xl font-JakartaBold mt-5 mb-3">
                Your current location
              </Text>
              <View className="flex flex-row items-center bg-transparent h-[300px]">
                <Map />
              </View>
            </>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Recent Services
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
