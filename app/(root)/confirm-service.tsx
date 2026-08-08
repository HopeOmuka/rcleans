import { router } from "expo-router";
import { useState } from "react";
import { View, Image, Text, TouchableOpacity } from "react-native";

import CustomButton from "@/components/CustomButton";
import EmptyState from "@/components/EmptyState";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { useTheme } from "@/lib/theme";
import {
  useBookingStore,
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const ConfirmService = () => {
  const { theme } = useTheme();
  const { cleaners, selectedCleaner } = useCleanerStore();
  const { serviceAddress } = useLocationStore();
  const { selectedServiceType } = useServiceTypeStore();
  const {
    selectedAddons,
    appliedPromoCode,
    appliedPromoDiscount,
    scheduledDate,
    specialInstructions,
  } = useBookingStore();
  const [paymentMode, setPaymentMode] = useState<"now" | "later">("now");

  const selectedCleanerData = cleaners.find((c) => c.id === selectedCleaner);

  if (!selectedCleanerData || !selectedServiceType) {
    return (
      <ServiceLayout title="Confirm Service">
        <EmptyState
          title="No Service Selected"
          description="Please go back and select a service type and cleaner to continue."
          icon={icons.pin}
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </ServiceLayout>
    );
  }

  const estimatedDurationMinutes =
    Math.round(Number(selectedServiceType.estimated_duration_hours || 0) * 60) +
    selectedAddons.reduce(
      (sum, a) => sum + (a.estimated_duration_minutes || 0),
      0,
    );

  const estimatedPrice =
    Number(selectedServiceType.base_price) +
    Number(selectedServiceType.price_per_hour) *
      (estimatedDurationMinutes / 60) +
    selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);

  const estimatedDiscount = Math.max(0, Number(appliedPromoDiscount) || 0);
  const estimatedTotal = Math.max(0, estimatedPrice - estimatedDiscount);

  return (
    <ServiceLayout title="Confirm Service" snapPoints={["65%", "85%"]}>
      <View className="p-5">
        <Text
          className="text-xl font-JakartaBold mb-5"
          style={{ color: theme.colors.text }}
        >
          Service Details
        </Text>

        <View
          className="p-4 rounded-lg mb-5 border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-lg font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            {selectedServiceType.name}
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {selectedServiceType.description}
          </Text>
          <Text className="text-sm mt-2" style={{ color: theme.colors.text }}>
            Location: {serviceAddress}
          </Text>
          <Text className="text-sm" style={{ color: theme.colors.text }}>
            Duration: {Math.round((estimatedDurationMinutes / 60) * 10) / 10}{" "}
            hours
          </Text>
          {scheduledDate ? (
            <Text className="text-sm mt-1" style={{ color: theme.colors.text }}>
              Scheduled:{" "}
              {new Date(scheduledDate).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ) : (
            <Text className="text-sm mt-1" style={{ color: theme.colors.text }}>
              Scheduled: As soon as possible
            </Text>
          )}
          {selectedAddons.length > 0 && (
            <View className="mt-2">
              <Text
                className="text-sm font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                Extra services:
              </Text>
              {selectedAddons.map((addon) => (
                <Text
                  key={addon.id}
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  • {addon.name} (+${addon.price})
                </Text>
              ))}
            </View>
          )}
          {appliedPromoCode && (
            <Text
              className="text-sm mt-2"
              style={{ color: theme.colors.success }}
            >
              Promo applied: {appliedPromoCode} ({"-"}$
              {estimatedDiscount.toFixed(2)})
            </Text>
          )}
          {specialInstructions ? (
            <View
              className="mt-2 pt-2 border-t"
              style={{ borderColor: theme.colors.border }}
            >
              <Text
                className="text-sm font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                Notes for the cleaner
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {specialInstructions}
              </Text>
            </View>
          ) : null}
          <Text
            className="text-lg font-JakartaBold mt-2"
            style={{ color: theme.colors.text }}
          >
            Estimated total: ${estimatedTotal.toFixed(2)}
            {estimatedDiscount > 0 ? (
              <Text
                className="text-base"
                style={{ color: theme.colors.success }}
              >
                {"  "}after promo
              </Text>
            ) : null}
          </Text>
        </View>

        <Text
          className="text-xl font-JakartaBold mb-5"
          style={{ color: theme.colors.text }}
        >
          Your Cleaner
        </Text>

        <View
          className="p-4 rounded-lg flex-row items-center"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Image
            source={{ uri: selectedCleanerData.profile_image_url }}
            className="w-16 h-16 rounded-full mr-4"
            accessibilityLabel={`Profile picture of ${selectedCleanerData.title}`}
          />
          <View className="flex-1">
            <Text
              className="text-lg font-JakartaSemiBold"
              style={{ color: theme.colors.text }}
            >
              {selectedCleanerData.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Image source={icons.star} className="w-4 h-4 mr-1" />
              <Text className="text-sm" style={{ color: theme.colors.text }}>
                {selectedCleanerData.rating}
              </Text>
            </View>
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Arrives in: {selectedCleanerData.time} min
            </Text>
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              Specialties: {selectedCleanerData.specialties?.join(", ")}
            </Text>
          </View>
        </View>

        <Text
          className="text-xl font-JakartaBold mb-3"
          style={{ color: theme.colors.text }}
        >
          Payment
        </Text>

        <View className="flex-row mb-5">
          <TouchableOpacity
            onPress={() => setPaymentMode("now")}
            style={
              paymentMode === "now"
                ? {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primarySoft,
                  }
                : { borderColor: theme.colors.border }
            }
            className="mr-3 px-4 py-2 rounded-lg border"
          >
            <Text
              className="text-sm font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              Pay Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPaymentMode("later")}
            style={
              paymentMode === "later"
                ? {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primarySoft,
                  }
                : { borderColor: theme.colors.border }
            }
            className="px-4 py-2 rounded-lg border"
          >
            <Text
              className="text-sm font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              Pay After Service
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          className="text-xs -mt-4 mb-5"
          style={{ color: theme.colors.textMuted }}
        >
          {paymentMode === "later"
            ? 'You will be billed after your service is completed. A "Pay" reminder stays in My Services until you pay.'
            : "Billed securely when you book. You can choose to pay after the service instead."}
        </Text>

        <View className="mt-10">
          <CustomButton
            title="Book Service"
            onPress={() =>
              router.push({
                pathname: "/(root)/book-service",
                params: { paymentMode },
              })
            }
            accessibilityLabel="Confirm and proceed to book this service"
          />
          <CustomButton
            title="Back"
            onPress={() => router.back()}
            bgVariant="outline"
            className="mt-3"
            accessibilityLabel="Go back to the previous screen"
          />
        </View>
      </View>
    </ServiceLayout>
  );
};

export default ConfirmService;
