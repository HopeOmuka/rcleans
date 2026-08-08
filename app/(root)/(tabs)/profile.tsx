import { useAuth, useUser } from "@clerk/clerk-expo";
import * as Application from "expo-application";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import BootstrapIcon from "@/components/BootstrapIcon";
import InputField from "@/components/InputField";
import MapboxTextInput from "@/components/MapboxTextInput";
import { showToast } from "@/components/Toast";
import { icons } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { persistThemePreference, ThemePreference, useTheme } from "@/lib/theme";
import { useLocationStore, useBookingStore } from "@/store";
import { LocationInput, SavedLocation } from "@/types/type";

type LocationKind = "home" | "work" | "other";
type SupportSubject = "help_center" | "contact_support";

interface LocationModalState {
  visible: boolean;
  kind: LocationKind;
  name: string;
}

interface SupportModalState {
  visible: boolean;
  subject: SupportSubject;
}

const Profile = () => {
  const { theme, preference, setTheme } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { setServiceLocation } = useLocationStore();

  const {
    data: savedLocations,
    loading: locationsLoading,
    mutate,
  } = useFetch<SavedLocation[]>("/(api)/locations");

  const { data: adminStatus } = useFetch<{ is_admin: boolean }>(
    "/(api)/admin/me",
  );

  const [locationModal, setLocationModal] = useState<LocationModalState>({
    visible: false,
    kind: "other",
    name: "",
  });
  const [supportModal, setSupportModal] = useState<SupportModalState>({
    visible: false,
    subject: "help_center",
  });
  const [pickedLocation, setPickedLocation] = useState<LocationInput | null>(
    null,
  );
  const [savingLocation, setSavingLocation] = useState(false);
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleThemePreferenceChange = (name: ThemePreference | "system") => {
    setTheme(name, { transition: "circularReveal", duration: 450 });
    persistThemePreference(name);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          useBookingStore.getState().resetBooking();
          await signOut();
          router.replace("/(root)/(tabs)/home");
        },
      },
    ]);
  };

  const locationFor = (kind: LocationKind): SavedLocation | null =>
    savedLocations?.find((location) => location.location_type === kind) ?? null;

  const favorites = savedLocations?.filter(
    (location) => location.location_type === "other",
  );

  const openLocationModal = (kind: LocationKind) => {
    setPickedLocation(null);
    setLocationModal({
      visible: true,
      kind,
      name: kind === "home" ? "Home" : kind === "work" ? "Work" : "",
    });
  };

  const closeLocationModal = () => {
    setLocationModal({ visible: false, kind: "other", name: "" });
    setPickedLocation(null);
  };

  const handleSaveLocation = async () => {
    const name =
      locationModal.name.trim() ||
      (locationModal.kind === "home"
        ? "Home"
        : locationModal.kind === "work"
          ? "Work"
          : "Favorite");

    if (!pickedLocation) {
      Alert.alert("Location Required", "Search and select an address first.");
      return;
    }

    setSavingLocation(true);
    try {
      const response = await fetchAPI<ApiResponse<SavedLocation>>(
        "/(api)/locations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            address: pickedLocation.address,
            latitude: pickedLocation.latitude,
            longitude: pickedLocation.longitude,
            locationType: locationModal.kind,
          }),
        },
      );

      const saved = response.data;
      if (!saved) {
        Alert.alert("Error", response.error || "Failed to save location");
        return;
      }

      mutate((prev) => {
        const next =
          prev?.filter(
            (location) =>
              !(
                location.location_type === locationModal.kind &&
                location.name === saved.name
              ),
          ) ?? [];
        return [...next, saved];
      });
      showToast("Location saved", "success");
      closeLocationModal();
    } catch {
      Alert.alert("Error", "Failed to save location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert("Remove Location", `Remove "${location.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setDeletingId(location.id);
          try {
            await fetchAPI<ApiResponse<{ success: boolean }>>(
              "/(api)/locations",
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: location.id }),
              },
            );
            mutate(
              (prev) => prev?.filter((item) => item.id !== location.id) ?? [],
            );
            showToast("Location removed", "success");
          } catch {
            Alert.alert("Error", "Failed to remove location");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleLocationRowPress = (kind: LocationKind) => {
    const location = locationFor(kind);
    if (location) {
      setServiceLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
      });
      showToast(`${location.name} set as service location`);
      router.push("/(root)/(tabs)/home");
      return;
    }
    openLocationModal(kind);
  };

  const handleFavoritesPress = () => {
    const favorite = favorites?.[0];
    if (!favorite) {
      openLocationModal("other");
      return;
    }
    Alert.alert("Favorite Location", favorite.address, [
      { text: "Change", onPress: () => openLocationModal("other") },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => handleDeleteLocation(favorite),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      Alert.alert("Message Required", "Please write a message first.");
      return;
    }

    setSendingSupport(true);
    try {
      const response = await fetchAPI<ApiResponse<{ success: boolean }>>(
        "/(api)/support",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: supportModal.subject,
            message: supportMessage.trim(),
          }),
        },
      );

      if (!response.data) {
        Alert.alert("Error", response.error || "Failed to send message");
        return;
      }

      showToast(
        "Message sent. We'll get back to you within 24 hours.",
        "success",
      );
      setSupportModal({ visible: false, subject: "help_center" });
      setSupportMessage("");
    } catch {
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSendingSupport(false);
    }
  };

  const renderLocationRow = (kind: LocationKind) => {
    const location = locationFor(kind);
    const label =
      kind === "home" ? "Home" : kind === "work" ? "Work" : "Favorites";

    return (
      <TouchableOpacity
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={() =>
          kind === "other"
            ? handleFavoritesPress()
            : handleLocationRowPress(kind)
        }
        className="flex-row items-center justify-between py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
      >
        <View className="flex-row items-center flex-1">
          <Image
            source={
              kind === "home"
                ? icons.home
                : kind === "work"
                  ? icons.point
                  : icons.star
            }
            className="w-5 h-5 mr-3"
            tintColor={theme.colors.textSecondary}
          />
          <View className="flex-1">
            <Text
              className="text-base font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              {label}
            </Text>
            {locationsLoading ? (
              <Text
                className="text-sm"
                style={{ color: theme.colors.textMuted }}
              >
                Loading...
              </Text>
            ) : kind === "other" ? (
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {favorites && favorites.length > 0
                  ? `${favorites.length} saved`
                  : "Add address"}
              </Text>
            ) : location ? (
              <Text
                numberOfLines={1}
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                {location.address}
              </Text>
            ) : (
              <Text
                className="text-sm"
                style={{ color: theme.colors.textSecondary }}
              >
                Add address
              </Text>
            )}
          </View>
        </View>
        {kind !== "other" && location && (
          <TouchableOpacity
            accessibilityLabel={`Remove ${label} location`}
            onPress={() => handleDeleteLocation(location)}
            disabled={deletingId === location.id}
            className="ml-3"
          >
            <Text className="text-sm" style={{ color: theme.colors.danger }}>
              {deletingId === location.id ? "Removing..." : "Remove"}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.background }}>
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text
          className="text-2xl font-JakartaBold my-5"
          style={{ color: theme.colors.text }}
        >
          My profile
        </Text>

        <View className="flex items-center justify-center my-5">
          <Image
            source={{
              uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
            }}
            style={{ borderColor: theme.colors.surface }}
            className="rounded-full h-[110px] w-[110px] border-[3px] shadow-sm shadow-neutral-300"
            accessibilityLabel="Profile picture"
          />
        </View>

        <View
          className="flex flex-col items-start justify-center rounded-lg shadow-sm shadow-neutral-300 px-5 py-3"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <View className="flex flex-col items-start justify-start w-full">
            <InputField
              label="First name"
              placeholder={user?.firstName || "—"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Last name"
              placeholder={user?.lastName || "—"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Email"
              placeholder={user?.primaryEmailAddress?.emailAddress || "—"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />

            <InputField
              label="Phone"
              placeholder={user?.primaryPhoneNumber?.phoneNumber || "—"}
              containerStyle="w-full"
              inputStyle="p-3.5"
              editable={false}
            />
          </View>
        </View>

        <Text
          className="text-xl font-JakartaBold mt-8 mb-3"
          style={{ color: theme.colors.text }}
        >
          Saved Locations
        </Text>
        <View
          className="rounded-lg shadow-sm shadow-neutral-300 p-5"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {renderLocationRow("home")}
          {renderLocationRow("work")}
          {renderLocationRow("other")}
        </View>

        <Text
          className="text-xl font-JakartaBold mt-8 mb-3"
          style={{ color: theme.colors.text }}
        >
          Appearance
        </Text>
        <View
          className="rounded-lg p-5"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Text
            className="text-base font-JakartaMedium"
            style={{ color: theme.colors.text }}
          >
            Theme
          </Text>
          <View className="flex-row mt-3 gap-2">
            {(
              [
                { key: "light", label: "Light" },
                { key: "dark", label: "Dark" },
                { key: "system", label: "System" },
              ] as const
            ).map((option) => {
              const active = preference === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityState={{ selected: active }}
                  onPress={() =>
                    handleThemePreferenceChange(
                      option.key as ThemePreference | "system",
                    )
                  }
                  style={{
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.surfaceMuted,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  }}
                  className="flex-1 py-2.5 rounded-full items-center border flex-row justify-center gap-2"
                >
                  <BootstrapIcon
                    name={
                      option.key === "light"
                        ? "sun"
                        : option.key === "dark"
                          ? "moon"
                          : "display"
                    }
                    size={16}
                    color={active ? "#FFFFFF" : theme.colors.textSecondary}
                  />
                  <Text
                    className="text-sm font-JakartaSemiBold"
                    style={{
                      color: active ? "#FFFFFF" : theme.colors.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text
          className="text-xl font-JakartaBold mt-8 mb-3"
          style={{ color: theme.colors.text }}
        >
          Support
        </Text>
        <View
          className="rounded-lg shadow-sm shadow-neutral-300 p-5"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <TouchableOpacity
            accessibilityLabel="Help Center"
            accessibilityRole="button"
            onPress={() =>
              setSupportModal({ visible: true, subject: "help_center" })
            }
            className="flex-row items-center justify-between py-3"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text
              className="text-base font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              Help Center
            </Text>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4 rotate-90"
              tintColor={theme.colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="My support tickets"
            accessibilityRole="button"
            onPress={() => router.push("/support" as Href)}
            className="flex-row items-center justify-between py-3"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <Text
              className="text-base font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              My Tickets
            </Text>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4 rotate-90"
              tintColor={theme.colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Contact Support"
            accessibilityRole="button"
            onPress={() =>
              setSupportModal({
                visible: true,
                subject: "contact_support",
              })
            }
            className="flex-row items-center justify-between py-3"
          >
            <Text
              className="text-base font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              Contact Support
            </Text>
            <Image
              source={icons.arrowUp}
              className="w-4 h-4 rotate-90"
              tintColor={theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {adminStatus?.is_admin && (
          <>
            <Text
              className="text-xl font-JakartaBold mt-8 mb-3"
              style={{ color: theme.colors.text }}
            >
              Admin
            </Text>
            <View
              className="rounded-lg shadow-sm shadow-neutral-300 p-5"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <TouchableOpacity
                accessibilityLabel="Admin Dashboard"
                accessibilityRole="button"
                onPress={() => router.push("/(admin)/dashboard" as Href)}
                className="flex-row items-center justify-between py-3"
              >
                <Text
                  className="text-base font-JakartaMedium"
                  style={{ color: theme.colors.text }}
                >
                  Admin Dashboard
                </Text>
                <Image
                  source={icons.arrowUp}
                  className="w-4 h-4 rotate-90"
                  tintColor={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center rounded-lg py-3.5 mt-8 border"
          style={{
            backgroundColor: theme.colors.dangerSoft,
            borderColor: theme.colors.danger,
          }}
        >
          <Image
            source={icons.out}
            className="w-5 h-5 mr-2"
            tintColor={theme.colors.danger}
          />
          <Text
            className="font-JakartaMedium"
            style={{ color: theme.colors.danger }}
          >
            Log Out
          </Text>
        </TouchableOpacity>

        <Text
          className="text-center text-xs mt-4 mb-2"
          style={{ color: theme.colors.textMuted }}
        >
          Version {Application.nativeApplicationVersion ?? "1.0.0"}
        </Text>
      </ScrollView>

      <ReactNativeModal
        isVisible={locationModal.visible}
        onBackdropPress={closeLocationModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="rounded-2xl p-6"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Text
              className="text-xl font-JakartaBold mb-4"
              style={{ color: theme.colors.text }}
            >
              Save{" "}
              {locationModal.kind === "home"
                ? "Home"
                : locationModal.kind === "work"
                  ? "Work"
                  : "Favorite"}{" "}
              location
            </Text>

            {locationModal.kind === "other" && (
              <InputField
                label="Name"
                placeholder="e.g. Gym, Friend's house"
                value={locationModal.name}
                onChangeText={(text) =>
                  setLocationModal({ ...locationModal, name: text })
                }
                containerStyle="bg-neutral-100"
              />
            )}

            <Text
              className="text-lg font-JakartaSemiBold mb-3"
              style={{ color: theme.colors.text }}
            >
              Address
            </Text>
            <MapboxTextInput
              icon={icons.search}
              initialLocation={pickedLocation?.address}
              containerStyle="bg-neutral-100"
              handlePress={(location) => setPickedLocation(location)}
              placeholder="Search address"
            />

            <CustomButton
              title={savingLocation ? "Saving..." : "Save Location"}
              onPress={handleSaveLocation}
              disabled={savingLocation}
              className="mt-5"
            />
            <CustomButton
              title="Cancel"
              bgVariant="outline"
              textVariant="primary"
              onPress={closeLocationModal}
              className="mt-2"
            />
          </View>
        </KeyboardAvoidingView>
      </ReactNativeModal>

      <ReactNativeModal
        isVisible={supportModal.visible}
        onBackdropPress={() =>
          setSupportModal({ visible: false, subject: "help_center" })
        }
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="rounded-2xl p-6"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Text
              className="text-xl font-JakartaBold mb-1"
              style={{ color: theme.colors.text }}
            >
              {supportModal.subject === "help_center"
                ? "Help Center"
                : "Contact Support"}
            </Text>
            <Text
              className="text-sm mb-4"
              style={{ color: theme.colors.textSecondary }}
            >
              Describe your issue and we&apos;ll get back to you within 24
              hours.
            </Text>

            <TextInput
              className="rounded-lg p-3 min-h-[120px] text-base border"
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surfaceMuted,
                color: theme.colors.text,
              }}
              placeholder="How can we help?"
              placeholderTextColor={theme.colors.textMuted}
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              textAlignVertical="top"
            />

            <CustomButton
              title={sendingSupport ? "Sending..." : "Send Message"}
              onPress={handleSendSupport}
              disabled={sendingSupport}
              className="mt-5"
            />
            <CustomButton
              title="Cancel"
              bgVariant="outline"
              textVariant="primary"
              onPress={() =>
                setSupportModal({ visible: false, subject: "help_center" })
              }
              className="mt-2"
            />
          </View>
        </KeyboardAvoidingView>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Profile;
