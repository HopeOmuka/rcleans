import { useUser, useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState, useEffect, useMemo } from "react";
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
import DateTimePicker from "@/components/DateTimePicker";
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
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();

  const {
    setUserLocation,
    setServiceLocation,
    userLatitude,
    userLongitude,
    userAddress,
  } = useLocationStore();
  const {
    serviceTypes,
    selectedServiceType,
    setServiceTypes,
    setSelectedServiceType,
  } = useServiceTypeStore();

  const DEFAULT_LOCATION = useMemo(
    () => ({
      latitude: -1.2921,
      longitude: 36.8219,
      address: "Nairobi, Kenya",
    }),
    [],
  );

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const handleServiceTypeSelect = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setSelectedAddons([]);
    setAppliedPromo(null);
  };

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [showAddons, setShowAddons] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  const { data: recentServices, loading } = useFetch<Service[]>(
    isLoaded && user?.id
      ? `/(api)/service/${encodeURIComponent(user.id)}`
      : null,
  );

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
          setUserLocation(DEFAULT_LOCATION);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
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
        setUserLocation(DEFAULT_LOCATION);
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
    (sum, addon) => sum + Number(addon.price),
    0,
  );
  const totalAddonDuration = selectedAddons.reduce(
    (sum, addon) => sum + Number(addon.estimated_duration_minutes),
    0,
  );
  const basePrice = Number(selectedServiceType?.base_price) || 0;
  const subtotal = basePrice + totalAddonPrice;
  const discountAmount = Number(appliedPromo?.discountAmount) || 0;
  const finalPrice = subtotal - discountAmount;

  return (
    <SafeAreaView className="flex-1 bg-dark-500">
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
          <View className="flex flex-col items-center justify-center py-10">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-32 h-32 opacity-50"
                  alt="No recent services found"
                  resizeMode="contain"
                  tintColor="#666"
                />
                <Text className="text-gray-500 mt-4">
                  No recent services found
                </Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#4ADE80" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold text-white">
                Welcome {user?.firstName}👋
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "RCleans Support",
                      "Contact us: support@rcleans.com",
                    )
                  }
                  className="mr-3 justify-center items-center w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30"
                >
                  <Text className="text-red-400 font-JakartaBold text-xs">
                    SOS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="justify-center items-center w-10 h-10 rounded-full bg-dark-300 border border-gray-700"
                >
                  <Image
                    source={icons.out}
                    className="w-4 h-4"
                    tintColor="white"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-xl font-JakartaBold text-white mt-5 mb-3">
              What service do you need?
            </Text>
            {serviceTypesError ? (
              <View className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <Text className="text-red-400 text-sm">
                  Failed to load service types. Please try again.
                </Text>
              </View>
            ) : serviceTypesLoading ? (
              <ActivityIndicator
                size="small"
                color="#4ADE80"
                className="mb-5"
              />
            ) : (
              <FlatList
                data={serviceTypes}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleServiceTypeSelect(item)}
                    className={`mr-3 p-4 rounded-2xl border ${
                      selectedServiceType?.id === item.id
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-gray-800 bg-dark-200"
                    }`}
                  >
                    <Text className="text-white font-JakartaMedium">
                      {item.name}
                    </Text>
                    <Text className="text-primary-500 text-xs mt-1 font-JakartaBold">
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
                  className="flex-row items-center justify-between p-4 bg-dark-200 rounded-2xl border border-gray-800 mb-5"
                >
                  <Text className="text-white font-JakartaSemiBold text-lg">
                    Add Extra Services
                  </Text>
                  <Text className="text-primary-500 font-JakartaMedium">
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
                  <View className="p-4 bg-dark-200 rounded-2xl border border-gray-800 mb-5">
                    <Text className="text-white font-JakartaSemiBold text-lg mb-3">
                      Price Summary
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-gray-400">
                          {selectedServiceType.name}
                        </Text>
                        <Text className="text-white font-JakartaMedium">
                          ${basePrice}
                        </Text>
                      </View>
                      {selectedAddons.map((addon) => (
                        <View
                          key={addon.id}
                          className="flex-row justify-between"
                        >
                          <Text className="text-gray-400">{addon.name}</Text>
                          <Text className="text-white font-JakartaMedium">
                            ${addon.price}
                          </Text>
                        </View>
                      ))}
                      {appliedPromo && (
                        <View className="flex-row justify-between">
                          <Text className="text-primary-500">
                            Promo ({appliedPromo.promoCode})
                          </Text>
                          <Text className="text-primary-500 font-JakartaMedium">
                            -${appliedPromo.discountAmount}
                          </Text>
                        </View>
                      )}
                      <View className="border-t border-gray-700 pt-2 mt-2">
                        <View className="flex-row justify-between">
                          <Text className="text-white text-lg font-JakartaSemiBold">
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

            <Text className="text-xl font-JakartaBold text-white mt-5 mb-3">
              When do you need the service?
            </Text>
            <View className="flex-row mb-5">
              <TouchableOpacity
                onPress={() => setIsScheduled(false)}
                className={`mr-3 px-5 py-3 rounded-2xl border ${
                  !isScheduled
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-gray-700 bg-dark-200"
                }`}
              >
                <Text
                  className={`text-sm font-JakartaMedium ${!isScheduled ? "text-primary-500" : "text-gray-400"}`}
                >
                  Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsScheduled(true)}
                className={`px-5 py-3 rounded-2xl border ${
                  isScheduled
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-gray-700 bg-dark-200"
                }`}
              >
                <Text
                  className={`text-sm font-JakartaMedium ${isScheduled ? "text-primary-500" : "text-gray-400"}`}
                >
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {isScheduled && (
              <View className="mb-5">
                <Text className="text-gray-400 text-sm font-JakartaMedium mb-2">
                  Select Date & Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="border border-gray-700 bg-dark-200 rounded-2xl p-4"
                >
                  <Text className="text-white">
                    {scheduledDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {scheduledDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-dark-200 border border-gray-700 rounded-2xl"
              handlePress={handleServiceLocationPress}
              initialLocation="Enter service location"
            />

            <>
              <Text className="text-xl font-JakartaBold text-white mt-5 mb-3">
                Your Area
              </Text>
              <View className="flex flex-row items-center bg-dark-300 rounded-2xl overflow-hidden h-[250px] border border-gray-800">
                <Map
                  userLatitude={userLatitude}
                  userLongitude={userLongitude}
                  userAddress={userAddress || undefined}
                />
              </View>
            </>

            <Text className="text-xl font-JakartaBold text-white mt-5 mb-3">
              Recent Bookings
            </Text>
          </>
        }
      />
      <DateTimePicker
        visible={showDatePicker}
        value={scheduledDate}
        onClose={() => setShowDatePicker(false)}
        onChange={(date) => setScheduledDate(date)}
      />
    </SafeAreaView>
  );
};

export default Home;
