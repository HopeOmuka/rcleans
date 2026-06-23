import { useUser } from "@clerk/clerk-expo";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { Image, Text, View } from "react-native";

import EmptyState from "@/components/EmptyState";
import Payment from "@/components/Payment";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const PaymentSection = ({
  fullName,
  email,
  amount,
  cleanerId,
  serviceTypeId,
  estimatedDuration,
}: {
  fullName: string;
  email: string;
  amount: string;
  cleanerId?: string;
  serviceTypeId?: string;
  estimatedDuration: number;
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
      stripe={stripe}
    />
  );
};

const BookService = () => {
  const { user } = useUser();
  const { serviceAddress } = useLocationStore();
  const { cleaners, selectedCleaner } = useCleanerStore();
  const { selectedServiceType } = useServiceTypeStore();

  const cleanerDetails = cleaners?.filter(
    (cleaner) => +cleaner.id === selectedCleaner,
  )[0];

  const estimatedPrice = selectedServiceType
    ? selectedServiceType.base_price +
      selectedServiceType.price_per_hour *
        selectedServiceType.estimated_duration_hours
    : 0;

  if (!cleanerDetails || !selectedServiceType) {
    return (
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        merchantIdentifier="merchant.com.rcleans"
        urlScheme="myapp"
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
      urlScheme="myapp"
    >
      <ServiceLayout title="Book Service">
        <>
          <Text className="text-xl font-JakartaSemiBold mb-3">
            Service Information
          </Text>

          <View className="flex flex-col w-full items-center justify-center mt-10">
            <Image
              source={{ uri: cleanerDetails.profile_image_url }}
              className="w-28 h-28 rounded-full"
              accessibilityLabel={`Profile picture of ${cleanerDetails.title}`}
            />

            <View className="flex flex-row items-center justify-center mt-5 space-x-2">
              <Text className="text-lg font-JakartaSemiBold">
                {cleanerDetails.title}
              </Text>

              <View className="flex flex-row items-center space-x-0.5">
                <Image
                  source={icons.star}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-lg font-JakartaRegular">
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
            <View className="flex flex-row items-center justify-start mt-3 border-t border-b border-general-700 w-full py-3">
              <Image source={icons.point} className="w-6 h-6" />
              <Text className="text-lg font-JakartaRegular ml-2">
                {serviceAddress}
              </Text>
            </View>
          </View>

          <View accessibilityLabel="Proceed to payment">
            <PaymentSection
              fullName={userFullName}
              email={userEmail}
              amount={estimatedPrice.toFixed(2)}
              cleanerId={cleanerDetails.id?.toString()}
              serviceTypeId={selectedServiceType.id}
              estimatedDuration={
                selectedServiceType.estimated_duration_hours || 0
              }
            />
          </View>
        </>
      </ServiceLayout>
    </StripeProvider>
  );
};

export default BookService;
