import { useUser, useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import type { Href } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddonSelector from "@/components/AddonSelector";
import BootstrapIcon from "@/components/BootstrapIcon";
import CancelBookingModal from "@/components/CancelBookingModal";
import GoogleTextInput from "@/components/MapboxTextInput";
import Map from "@/components/Map";
import PromoCodeInput from "@/components/PromoCodeInput";
import SchedulePicker from "@/components/SchedulePicker";
import ServiceCard from "@/components/ServiceCard";
import SkeletonLoader from "@/components/SkeletonLoader";
import {
  reverseGeocodeWithMapbox,
  DEFAULT_LOCATION,
  isWithinKenya,
} from "@/lib/map";
import { icons, images } from "@/constants";
import { useFetch } from "@/lib/fetch-hook";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";
import {
  useBookingStore,
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";
import {
  Service,
  ServiceType,
  PromoDiscount,
  SelectedAddon,
  SavedLocation,
} from "@/types/type";

const Home = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();

  const { setUserLocation, setServiceLocation, serviceAddress } =
    useLocationStore();
  const {
    serviceTypes,
    selectedServiceType,
    setServiceTypes,
    setSelectedServiceType,
  } = useServiceTypeStore();
  const cleanerStore = useCleanerStore();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          cleanerStore.setCleaners([]);
          cleanerStore.setCleanersLoading(false);
          cleanerStore.setCleanersError(null);
          cleanerStore.clearSelectedCleaner();
          setSelectedServiceType(null);
          useBookingStore.getState().resetBooking();
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const handleServiceTypeSelect = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setSelectedAddons([]);
    setAppliedPromo(null);
  };

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [showAddons, setShowAddons] = useState(false);
  const [specialNotes, setSpecialNotes] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cancellingService, setCancellingService] = useState<Service | null>(
    null,
  );
  const bookingStore = useBookingStore();

  // A completed booking (or a reset elsewhere) clears the store; mirror that
  // into the local booking UI so home never shows stale selections.
  useEffect(() => {
    const hasActiveBooking =
      bookingStore.selectedAddons.length > 0 ||
      bookingStore.appliedPromoCode !== null ||
      bookingStore.specialInstructions !== null ||
      bookingStore.isScheduled ||
      bookingStore.scheduledDate !== null;
    if (!hasActiveBooking) {
      setSelectedAddons([]);
      setAppliedPromo(null);
      setIsScheduled(false);
      setScheduledDate(null);
      setSpecialNotes("");
    }
  }, [
    bookingStore.selectedAddons,
    bookingStore.appliedPromoCode,
    bookingStore.specialInstructions,
    bookingStore.isScheduled,
    bookingStore.scheduledDate,
  ]);

  const {
    data: recentServices,
    loading,
    error: servicesError,
    refetch: refetchServices,
  } = useFetch<Service[]>(`/(api)/services?user_id=${user?.id}`, {
    enabled: !!user?.id,
  });

  const {
    data: fetchedServiceTypes,
    loading: serviceTypesLoading,
    error: serviceTypesError,
    refetch: refetchServiceTypes,
  } = useFetch<ServiceType[]>(`/(api)/service-type`);

  const {
    data: savedLocations,
    loading: savedLocationsLoading,
    refetch: refetchLocations,
  } = useFetch<SavedLocation[]>("/(api)/locations");

  useEffect(() => {
    if (fetchedServiceTypes) {
      setServiceTypes(fetchedServiceTypes);
    }
  }, [fetchedServiceTypes, setServiceTypes]);

  useFocusEffect(
    useCallback(() => {
      void refetchServices();
    }, [refetchServices]),
  );

  // Poll services while focused so an active booking's status and assigned
  // cleaner update live (cleaner actions land server-side).
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => void refetchServices(), 30_000);
      return () => clearInterval(interval);
    }, [refetchServices]),
  );

  // Poll the unread notification count while this screen is focused so the
  // hero badge stays fresh (cleaner status updates land server-side).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const tick = async () => {
        try {
          const result = await fetchAPI.get<ApiResponse<{ count: number }>>(
            `/(api)/notifications/unread`,
          );
          if (active && result.data) {
            setUnreadCount(result.data.count);
          }
        } catch {
          // Best-effort badge; failures just keep the last known count.
        }
      };
      void tick();
      const interval = setInterval(() => void tick(), 30_000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, []),
  );

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
          setUserLocation(DEFAULT_LOCATION);
          return;
        }

        let coords: { latitude: number; longitude: number };

        try {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = current.coords;
        } catch {
          const last = await Location.getLastKnownPositionAsync({
            maxAge: 600000,
          });
          coords = last?.coords ?? { ...DEFAULT_LOCATION };
        }

        // Emulators (and some VPNs) report coordinates outside Kenya, e.g.
        // the Android emulator's default San Francisco position. Trusting
        // those breaks routing, ETA and search proximity, so fall back to
        // Nairobi whenever the fix is out of the Kenya bounding box.
        if (!isWithinKenya(coords.latitude, coords.longitude)) {
          console.log(
            "Location outside Kenya, using default Nairobi location:",
            coords,
          );
          setUserLocation(DEFAULT_LOCATION);
          return;
        }

        const address = await reverseGeocodeWithMapbox(
          coords.latitude,
          coords.longitude,
        );

        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: address,
        });
      } catch (err) {
        console.error("Location error:", err);

        if (err instanceof Error) {
          if (err.message.includes("unavailable")) {
            console.log(
              "Location services are disabled. Using default location.",
            );
          } else if (err.message.includes("timeout")) {
            console.log("Location request timed out. Using default location.");
          }
        }

        setUserLocation(DEFAULT_LOCATION);
      }
    })();
  }, [setUserLocation]);

  const saveBookingSelection = () => {
    bookingStore.setBooking({
      selectedAddons,
      appliedPromoCode: appliedPromo?.promoCode ?? null,
      appliedPromoDiscount: appliedPromo?.discountAmount ?? 0,
      isScheduled,
      scheduledDate: scheduledDate?.toISOString() ?? null,
      specialInstructions: specialNotes.trim() || null,
    });
  };

  // Picking a location only sets the service address; navigation to the
  // cleaner step happens via the explicit Continue button so a customer can
  // review the whole booking before leaving Home.
  const handleServiceLocationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setServiceLocation(location);
    saveBookingSelection();
  };

  const handleContinueToCleaner = () => {
    if (!selectedServiceType) {
      Alert.alert("Service Required", "Please select a service type first");
      return;
    }
    if (!serviceAddress) {
      Alert.alert(
        "Location Required",
        "Set the service location first — search for an area, pick a saved location, or reuse your current address.",
      );
      return;
    }
    saveBookingSelection();
    router.push({
      pathname: "/(root)/find-service",
      params: {
        isScheduled: isScheduled.toString(),
        scheduledDate: scheduledDate?.toISOString(),
      },
    });
  };

  const handleAddonToggle = (addon: SelectedAddon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon],
    );
  };

  const handlePromoApplied = (promoData: PromoDiscount) => {
    setAppliedPromo(promoData);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchServices(),
      refetchServiceTypes(),
      refetchLocations(),
    ]);
    setRefreshing(false);
  };

  const ACTIVE_STATUSES = [
    "requested",
    "matched",
    "confirmed",
    "arrived",
    "in_progress",
  ];

  const activeService =
    recentServices?.find((s) => ACTIVE_STATUSES.includes(s.status)) ?? null;

  const formatScheduledDate = (dateString?: string) => {
    if (!dateString) return "As soon as possible";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-500";
      case "matched":
      case "confirmed":
        return "bg-blue-500";
      case "arrived":
        return "bg-purple-500";
      case "in_progress":
        return "bg-primary-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActiveBookingLine = (service: Service) => {
    const name = service.cleaner
      ? `${service.cleaner.first_name} ${service.cleaner.last_name}`.trim()
      : "your cleaner";
    switch (service.status) {
      case "requested":
        return service.cleaner
          ? `Waiting for ${service.cleaner.first_name} to confirm this job…`
          : "Waiting for a cleaner to accept this job…";
      case "matched":
      case "confirmed":
        return `${name} is on the way`;
      case "arrived":
        return `${name} has arrived`;
      case "in_progress":
        return `${name} is cleaning`;
      default:
        return `${name} is assigned to this job`;
    }
  };

  const renderActiveBookingBanner = () => {
    if (!activeService) return null;
    const cleaner = activeService.cleaner;
    const cancellable = ["requested", "matched", "confirmed"].includes(
      activeService.status,
    );
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/service/${activeService.id}` as Href)}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
        className="rounded-2xl p-4 mb-5 border"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-primary-500 mr-2" />
            <Text
              className="text-sm font-JakartaSemiBold"
              style={{ color: theme.colors.text }}
            >
              Active Booking
            </Text>
          </View>
          <View
            className={`px-2.5 py-1 rounded-full ${getStatusColor(activeService.status)}`}
          >
            <Text className="text-white text-xs font-JakartaMedium capitalize">
              {activeService.status.replaceAll("_", " ")}
            </Text>
          </View>
        </View>

        <Text
          className="text-lg font-JakartaBold mt-2.5"
          style={{ color: theme.colors.text }}
        >
          {activeService.service_type?.name ?? "Cleaning service"}
        </Text>

        <View className="flex-row items-center mt-1.5">
          <Image
            source={icons.calendar}
            className="w-4 h-4"
            tintColor={theme.colors.textSecondary}
          />
          <Text
            className="text-sm ml-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {formatScheduledDate(activeService.scheduled_date)}
          </Text>
          <View className="flex-row items-center ml-4">
            <Image
              source={icons.dollar}
              className="w-4 h-4"
              tintColor={theme.colors.success}
            />
            <Text
              className="text-sm font-JakartaMedium ml-1"
              style={{ color: theme.colors.text }}
            >
              ${Number(activeService.total_price).toFixed(2)}
            </Text>
          </View>
        </View>

        {cleaner && (
          <View className="flex-row items-center mt-1.5">
            <Image
              source={icons.person}
              className="w-4 h-4"
              tintColor={theme.colors.textSecondary}
            />
            <Text
              className="text-sm ml-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {getActiveBookingLine(activeService)}
            </Text>
          </View>
        )}

        <View className="flex-row mt-4 gap-3">
          {cleaner && activeService.status !== "requested" && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Message ${cleaner.first_name} ${cleaner.last_name}`}
              onPress={() =>
                router.push(
                  `/(root)/chat/${activeService.id}?otherName=${encodeURIComponent(
                    `${cleaner.first_name} ${cleaner.last_name}`,
                  )}&otherId=${cleaner.id}` as Href,
                )
              }
              className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg bg-primary-500"
            >
              <BootstrapIcon name="chat-dots" size={18} color="#FFFFFF" />
              <Text className="text-white font-JakartaMedium ml-2">
                Message
              </Text>
            </TouchableOpacity>
          )}
          {cancellable && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancel this booking"
              onPress={() => setCancellingService(activeService)}
              className="flex-1 items-center justify-center py-2.5 rounded-lg border border-red-300"
            >
              <Text className="text-red-500 font-JakartaMedium">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalAddonPrice = selectedAddons.reduce(
    (sum, addon) => sum + (addon.price ?? 0),
    0,
  );
  const totalAddonDuration = selectedAddons.reduce(
    (sum, addon) => sum + (addon.estimated_duration_minutes ?? 0),
    0,
  );
  const basePrice = selectedServiceType?.base_price || 0;
  const hourlyRate = selectedServiceType?.price_per_hour || 0;
  // Match the server formula exactly (see lib/pricing.ts) so the estimate on
  // Home equals what Confirm/Pay later shows and what the customer is charged.
  const estimatedDurationMinutes =
    Math.round(
      Number(selectedServiceType?.estimated_duration_hours || 0) * 60,
    ) + totalAddonDuration;
  const hourlyPrice = hourlyRate * (estimatedDurationMinutes / 60);
  const subtotal = basePrice + hourlyPrice + totalAddonPrice;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const finalPrice = subtotal - discountAmount;

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
      <FlatList
        data={recentServices?.slice(0, 5)}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onPress={(service) => router.push(`/service/${service.id}` as Href)}
            onRatePress={(service) =>
              router.push({
                pathname: "/(root)/rate-service",
                params: {
                  serviceId: service.id,
                  userId: user?.id,
                  cleanerId: service.cleaner?.id,
                },
              })
            }
            onPayPress={(service) =>
              router.push({
                pathname: "/(root)/pay-service",
                params: { serviceId: service.id },
              })
            }
          />
        )}
        keyExtractor={(item) => item.id}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4ADE80"
          />
        }
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading && servicesError ? (
              <View
                className="items-center px-6 py-8 rounded-2xl border"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.danger,
                }}
              >
                <Image
                  source={images.noResult}
                  className="w-28 h-28"
                  alt="Could not load services"
                  resizeMode="contain"
                />
                <Text
                  className="text-base font-JakartaSemiBold text-center"
                  style={{ color: theme.colors.text }}
                >
                  Could not load your recent services
                </Text>
                <Text
                  className="text-sm text-center mt-1 mb-4"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {servicesError}
                </Text>
                <TouchableOpacity
                  onPress={() => refetchServices()}
                  className="bg-primary-500 px-5 py-2.5 rounded-lg"
                >
                  <Text className="text-white font-JakartaMedium">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40 opacity-70"
                  alt="No recent services found"
                  resizeMode="contain"
                />
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  No recent services found
                </Text>
              </>
            ) : (
              <ActivityIndicator size="small" color={theme.colors.textMuted} />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="bg-primary-gradient rounded-3xl p-5 my-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-white/25 border border-white/40 items-center justify-center">
                    <Text className="text-white text-xl font-JakartaExtraBold">
                      {user?.firstName?.charAt(0) || "R"}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1 pr-3">
                    <Text
                      className="text-white text-2xl font-JakartaExtraBold"
                      numberOfLines={1}
                    >
                      Welcome, {user?.firstName || "there"}!
                    </Text>
                    <Text className="text-white/85 text-sm font-JakartaMedium mt-0.5">
                      What can we clean for you today?
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    accessibilityLabel="Help and support"
                    accessibilityRole="button"
                    onPress={() => router.push("/support" as Href)}
                    className="justify-center items-center w-11 h-11 rounded-full bg-white/25 border border-white/30"
                  >
                    <Text className="text-white font-JakartaBold text-lg">
                      ?
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Notifications"
                    accessibilityRole="button"
                    onPress={() => router.push("/notifications" as Href)}
                    className="justify-center items-center w-11 h-11 rounded-full bg-white/25 border border-white/30"
                  >
                    <BootstrapIcon name="bell" size={20} color="#FFFFFF" />
                    {unreadCount > 0 && (
                      <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1 border border-white/60">
                        <Text className="text-white text-[10px] font-JakartaBold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel="Sign out"
                    accessibilityRole="button"
                    onPress={handleSignOut}
                    className="justify-center items-center w-11 h-11 rounded-full bg-white/25 border border-white/30"
                  >
                    <BootstrapIcon
                      name="box-arrow-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {renderActiveBookingBanner()}

            <Text
              className="text-xl font-JakartaBold mt-3 mb-3"
              style={{ color: theme.colors.text }}
            >
              What service do you need?
            </Text>
            {serviceTypesError ? (
              <View
                className="mb-5 p-3 rounded-lg border"
                style={{
                  backgroundColor: theme.colors.dangerSoft,
                  borderColor: theme.colors.danger,
                }}
              >
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.danger }}
                >
                  Failed to load service types. Please try again.
                </Text>
              </View>
            ) : serviceTypesLoading ? (
              <View className="flex-row mb-5 gap-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonLoader
                    key={i}
                    width={112}
                    height={80}
                    borderRadius={8}
                  />
                ))}
              </View>
            ) : (
              <FlatList
                data={serviceTypes}
                renderItem={({ item }) => {
                  const isSelected = selectedServiceType?.id === item.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name} service, from ${item.base_price} dollars`}
                      onPress={() => handleServiceTypeSelect(item)}
                      style={{
                        backgroundColor: isSelected
                          ? theme.colors.primarySoft
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      }}
                      className={`mr-3 px-4 py-4 rounded-2xl border min-w-[140px] ${
                        isSelected ? "shadow-sm shadow-primary-200" : ""
                      }`}
                    >
                      <Text
                        className="text-sm font-JakartaSemiBold"
                        style={{
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.text,
                        }}
                      >
                        {item.name}
                      </Text>
                      <View className="mt-2 flex-row items-center">
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.surfaceMuted,
                          }}
                        >
                          <Text
                            className="text-xs font-JakartaBold"
                            style={{
                              color: isSelected
                                ? "#FFFFFF"
                                : theme.colors.textSecondary,
                            }}
                          >
                            From ${item.base_price}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <View className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
                          <Image
                            source={icons.checkmark}
                            className="w-3 h-3"
                            tintColor="#FFFFFF"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
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
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                  className="flex-row items-center justify-between p-4 rounded-2xl border mb-5"
                >
                  <View className="flex-row items-center">
                    <Text
                      className="text-lg font-JakartaSemiBold"
                      style={{ color: theme.colors.text }}
                    >
                      Add Extra Services
                    </Text>
                    {selectedAddons.length > 0 && (
                      <View
                        className="ml-2 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.colors.primarySoft }}
                      >
                        <Text
                          className="text-xs font-JakartaBold"
                          style={{ color: theme.colors.primary }}
                        >
                          {selectedAddons.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center">
                    {selectedAddons.length === 0 && (
                      <Text
                        className="text-sm mr-1.5 font-JakartaMedium"
                        style={{ color: theme.colors.textMuted }}
                      >
                        Optional
                      </Text>
                    )}
                    <Image
                      source={icons.arrowDown}
                      className={`w-4 h-4 ${showAddons ? "rotate-180" : ""}`}
                      tintColor={theme.colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {showAddons && (
                  <AddonSelector
                    selectedAddons={selectedAddons}
                    onAddonToggle={handleAddonToggle}
                    totalAddonPrice={totalAddonPrice}
                    totalAddonDuration={totalAddonDuration}
                    serviceTypeId={selectedServiceType?.id ?? null}
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

                <View
                  className="p-4 rounded-2xl border mb-5"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text
                    className="text-lg font-JakartaSemiBold mb-1"
                    style={{ color: theme.colors.text }}
                  >
                    Notes for your cleaner
                  </Text>
                  <Text
                    className="text-xs mb-3"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Optional — any special requests or access details.
                  </Text>
                  <TextInput
                    value={specialNotes}
                    onChangeText={setSpecialNotes}
                    maxLength={2000}
                    placeholder="e.g. Focus on the kitchen, use pet-friendly products, gate code 1234"
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    style={{
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                    className="min-h-[88px] rounded-lg border px-4 py-3 text-base font-Jakarta"
                  />
                </View>

                {selectedServiceType && (
                  <View
                    className="p-4 rounded-2xl border mb-5"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <Text
                      className="text-lg font-JakartaSemiBold mb-3"
                      style={{ color: theme.colors.text }}
                    >
                      Price Summary
                    </Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text
                          className=""
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {selectedServiceType.name}
                        </Text>
                        <Text
                          className="font-JakartaMedium"
                          style={{ color: theme.colors.text }}
                        >
                          ${basePrice}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text style={{ color: theme.colors.textSecondary }}>
                          {estimatedDurationMinutes / 60}h cleaning at $
                          {hourlyRate}/hr
                        </Text>
                        <Text
                          className="font-JakartaMedium"
                          style={{ color: theme.colors.text }}
                        >
                          ${hourlyPrice}
                        </Text>
                      </View>
                      {selectedAddons.map((addon) => (
                        <View
                          key={addon.id}
                          className="flex-row justify-between"
                        >
                          <Text style={{ color: theme.colors.textSecondary }}>
                            {addon.name}
                          </Text>
                          <Text
                            className="font-JakartaMedium"
                            style={{ color: theme.colors.text }}
                          >
                            ${addon.price}
                          </Text>
                        </View>
                      ))}
                      {appliedPromo && (
                        <View className="flex-row justify-between">
                          <Text
                            className="font-JakartaMedium"
                            style={{ color: theme.colors.success }}
                          >
                            Promo ({appliedPromo.promoCode})
                          </Text>
                          <Text
                            className="font-JakartaMedium"
                            style={{ color: theme.colors.success }}
                          >
                            -${appliedPromo.discountAmount}
                          </Text>
                        </View>
                      )}
                      <View
                        className="pt-2 mt-2"
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: theme.colors.border,
                        }}
                      >
                        <View className="flex-row justify-between">
                          <Text
                            className="text-lg font-JakartaSemiBold"
                            style={{ color: theme.colors.text }}
                          >
                            Total
                          </Text>
                          <Text
                            className="text-lg font-JakartaBold"
                            style={{ color: theme.colors.primary }}
                          >
                            ${finalPrice}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            <Text
              className="text-xl font-JakartaBold mt-5 mb-3"
              style={{ color: theme.colors.text }}
            >
              When do you need the service?
            </Text>
            <View className="flex-row mb-5">
              <TouchableOpacity
                onPress={() => {
                  setIsScheduled(false);
                  setScheduledDate(null);
                }}
                style={{
                  backgroundColor: !isScheduled
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: !isScheduled
                    ? theme.colors.primary
                    : theme.colors.border,
                }}
                className="mr-3 px-5 py-2.5 rounded-full border"
              >
                <Text
                  className="text-sm font-JakartaSemiBold"
                  style={{
                    color: !isScheduled
                      ? "#FFFFFF"
                      : theme.colors.textSecondary,
                  }}
                >
                  Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsScheduled(true)}
                style={{
                  backgroundColor: isScheduled
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isScheduled
                    ? theme.colors.primary
                    : theme.colors.border,
                }}
                className="px-5 py-2.5 rounded-full border"
              >
                <Text
                  className="text-sm font-JakartaSemiBold"
                  style={{
                    color: isScheduled ? "#FFFFFF" : theme.colors.textSecondary,
                  }}
                >
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {isScheduled && (
              <View className="mb-5">
                <Text
                  className="text-sm font-JakartaMedium mb-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Select Date & Time
                </Text>
                <SchedulePicker
                  selectedDate={scheduledDate}
                  onSelect={setScheduledDate}
                  onToggleSchedule={setIsScheduled}
                />
              </View>
            )}

            <GoogleTextInput
              icon={icons.search}
              containerStyle="shadow-md shadow-neutral-300"
              handlePress={handleServiceLocationPress}
              placeholder="Enter service location"
            />

            {savedLocations && savedLocations.length > 0 && (
              <>
                <Text
                  className="text-lg font-JakartaBold mt-5 mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Saved locations
                </Text>
                <View className="mb-2">
                  {savedLocations.map((loc) => (
                    <TouchableOpacity
                      key={loc.id}
                      onPress={() =>
                        handleServiceLocationPress({
                          latitude: loc.latitude,
                          longitude: loc.longitude,
                          address: loc.address,
                        })
                      }
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }}
                      className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2 border"
                    >
                      <View className="flex-1 mr-3">
                        <Text
                          className="font-JakartaSemiBold text-base"
                          style={{ color: theme.colors.text }}
                        >
                          {loc.name}
                        </Text>
                        <Text
                          className="font-Jakarta text-sm mt-0.5"
                          numberOfLines={1}
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {loc.address}
                        </Text>
                      </View>
                      <Text
                        className="font-JakartaBold text-sm"
                        style={{ color: theme.colors.primary }}
                      >
                        Use
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {savedLocationsLoading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                className="mt-2"
              />
            )}

            <>
              <Text
                className="text-xl font-JakartaBold mt-5 mb-3"
                style={{ color: theme.colors.text }}
              >
                Your current location
              </Text>
              <View className="flex flex-row items-center bg-transparent h-[300px]">
                <Map />
              </View>
            </>

            {serviceAddress ? (
              <View
                className="flex-row items-start rounded-xl px-4 py-3 mt-3 border"
                style={{
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.primary,
                }}
              >
                <Image
                  source={icons.pin}
                  className="w-4 h-4 mt-0.5"
                  tintColor={theme.colors.primary}
                />
                <Text
                  className="text-sm font-JakartaMedium ml-2 flex-1"
                  numberOfLines={2}
                  style={{ color: theme.colors.text }}
                >
                  Service location set: {serviceAddress}
                </Text>
              </View>
            ) : (
              <View
                className="flex-row items-start rounded-xl px-4 py-3 mt-3 border"
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                }}
              >
                <Image
                  source={icons.pin}
                  className="w-4 h-4 mt-0.5"
                  tintColor={theme.colors.textMuted}
                />
                <Text
                  className="text-sm ml-2 flex-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  No service location yet — search above, pick a saved location,
                  or use the search box.
                </Text>
              </View>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Continue to cleaner selection"
              onPress={handleContinueToCleaner}
              className="mt-4 py-4 rounded-full bg-primary-500 items-center justify-center shadow-md shadow-primary-200"
            >
              <Text className="text-white text-lg font-JakartaBold">
                Continue to Cleaner Selection
              </Text>
            </TouchableOpacity>

            <Text
              className="text-xl font-JakartaBold mt-5 mb-3"
              style={{ color: theme.colors.text }}
            >
              Recent Services
            </Text>
          </>
        }
      />

      <CancelBookingModal
        service={cancellingService}
        onClose={() => setCancellingService(null)}
        onCancelled={() => void refetchServices()}
      />
    </SafeAreaView>
  );
};

export default Home;
