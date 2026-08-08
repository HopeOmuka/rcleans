import { useUser } from "@clerk/clerk-expo";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, View } from "react-native";

import EmptyState from "@/components/EmptyState";
import Payment from "@/components/Payment";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { useTheme } from "@/lib/theme";
import { formatTime } from "@/lib/utils";
import {
  useBookingStore,
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";
import type { SelectedAddon } from "@/types/type";

const PaymentSection = ({
  fullName,
  email,
  amount,
  cleanerId,
  serviceTypeId,
  estimatedDuration,
  paymentMode,
  addons,
  promoCode,
  scheduledDate,
}: {
  fullName: string;
  email: string;
  amount: string;
  cleanerId?: string;
  serviceTypeId?: string;
  estimatedDuration: number;
  paymentMode: "now" | "later";
  addons?: SelectedAddon[];
  promoCode?: string | null;
  scheduledDate?: string | null;
}) => {
  const stripe = useStripe();

  return (
    <Payment
      fullName={fullName}
      email={email}
      amount={amount}
      cleanerId={cleanerId}
      serviceTypeId={serviceTypeId}
      estimatedDuration={estimatedDuration}
      paymentMode={paymentMode}
      addons={addons}
      promoCode={promoCode}
      scheduledDate={scheduledDate}
      stripe={stripe}
    />
  );
};

const BookService = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { paymentMode: paymentModeParam } = useLocalSearchParams<{
    paymentMode?: "now" | "later";
  }>();
  const paymentMode = paymentModeParam === "later" ? "later" : "now";
  const { serviceAddress } = useLocationStore();
  const { cleaners, selectedCleaner } = useCleanerStore();
  const { selectedServiceType } = useServiceTypeStore();
  const {
    selectedAddons,
    appliedPromoCode,
    appliedPromoDiscount,
    scheduledDate,
  } = useBookingStore();

  const cleanerDetails = cleaners?.filter(
    (cleaner) => cleaner.id === selectedCleaner,
  )[0];

  const estimatedDurationMinutes =
    Math.round(
      Number(selectedServiceType?.estimated_duration_hours || 0) * 60,
    ) +
    selectedAddons.reduce(
      (sum, addon) => sum + (addon.estimated_duration_minutes || 0),
      0,
    );

  const estimatedPrice =
    (selectedServiceType
      ? Number(selectedServiceType.base_price) +
        Number(selectedServiceType.price_per_hour) *
          (estimatedDurationMinutes / 60)
      : 0) + selectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);

  const estimatedDiscount = Math.max(0, Number(appliedPromoDiscount) || 0);
  const estimatedTotal = Math.max(0, estimatedPrice - estimatedDiscount);

  if (!cleanerDetails || !selectedServiceType) {
    return (
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        merchantIdentifier="merchant.com.rcleans"
        urlScheme="rcleans"
      >
        <ServiceLayout title="Book Service">
          <EmptyState
            title="Missing Information"
            description="Could not load cleaner or service details. Please go back and try again."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </ServiceLayout>
      </StripeProvider>
    );
  }

  const userFullName = user?.fullName ?? "Guest";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.rcleans"
      urlScheme="rcleans"
    >
      <ServiceLayout title="Book Service">
        <>
          <Text
            className="text-xl font-JakartaSemiBold mb-3"
            style={{ color: theme.colors.text }}
          >
            Service Information
          </Text>

          <View className="flex flex-col w-full items-center justify-center mt-10">
            <Image
              source={{ uri: cleanerDetails.profile_image_url }}
              className="w-28 h-28 rounded-full"
              accessibilityLabel={`Profile picture of ${cleanerDetails.title}`}
            />

            <View className="flex flex-row items-center justify-center mt-5 space-x-2">
              <Text
                className="text-lg font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                {cleanerDetails.title}
              </Text>

              <View className="flex flex-row items-center space-x-0.5">
                <Image
                  source={icons.star}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text
                  className="text-lg font-JakartaRegular"
                  style={{ color: theme.colors.text }}
                >
                  {cleanerDetails.rating}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-3xl bg-general-600 mt-5">
            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Service</Text>
              <Text className="text-lg font-JakartaRegular text-primary-500">
                {selectedServiceType.name}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Service Price</Text>
              <Text className="text-lg font-JakartaRegular text-primary-500">
                ${estimatedPrice.toFixed(2)}
              </Text>
            </View>

            {estimatedDiscount > 0 ? (
              <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
                <Text className="text-lg font-JakartaRegular text-green-400">
                  Promo ({appliedPromoCode})
                </Text>
                <Text className="text-lg font-JakartaRegular text-green-400">
                  {"-"}${estimatedDiscount.toFixed(2)}
                </Text>
              </View>
            ) : null}

            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Total Due</Text>
              <Text className="text-lg font-JakartaRegular text-primary-500">
                ${estimatedTotal.toFixed(2)}
              </Text>
            </View>

            {scheduledDate ? (
              <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
                <Text className="text-lg font-JakartaRegular">Scheduled</Text>
                <Text className="text-lg font-JakartaRegular">
                  {new Date(scheduledDate).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ) : null}

            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Arrival Time</Text>
              <Text className="text-lg font-JakartaRegular">
                {formatTime(cleanerDetails?.time ?? 0)}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-between w-full py-3">
              <Text className="text-lg font-JakartaRegular">Experience</Text>
              <Text className="text-lg font-JakartaRegular">
                {cleanerDetails.years_experience} years
              </Text>
            </View>
          </View>

          <View className="flex flex-col w-full items-start justify-center mt-5">
            <View
              className="flex flex-row items-center justify-start mt-3 border-t border-b w-full py-3"
              style={{ borderColor: theme.colors.border }}
            >
              <Image
                source={icons.point}
                className="w-6 h-6"
                tintColor={theme.colors.text}
              />
              <Text
                className="text-lg font-JakartaRegular ml-2"
                style={{ color: theme.colors.text }}
              >
                {serviceAddress}
              </Text>
            </View>
          </View>

          <View accessibilityLabel="Proceed to payment">
            <PaymentSection
              fullName={userFullName}
              email={userEmail}
              amount={estimatedTotal.toFixed(2)}
              cleanerId={cleanerDetails.id?.toString()}
              serviceTypeId={selectedServiceType.id}
              estimatedDuration={estimatedDurationMinutes}
              paymentMode={paymentMode}
              addons={selectedAddons}
              promoCode={appliedPromoCode}
              scheduledDate={scheduledDate}
            />
          </View>
        </>
      </ServiceLayout>
    </StripeProvider>
  );
};

export default BookService;
