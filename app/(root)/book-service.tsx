import { useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import {
  Image,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Platform } from "react-native";

import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { fetchAPI } from "@/lib/fetch";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

const PaymentSection = ({
  user,
  cleanerDetails,
  selectedServiceType,
  estimatedPrice,
}: any) => {
  const [loading, setLoading] = useState(false);
  const { userId } = useUser();
  const { serviceAddress, serviceLatitude, serviceLongitude } =
    useLocationStore();

  let initPaymentSheet: any = () => {};
  let presentPaymentSheet: any = () => ({ error: null });

  if (Platform.OS !== "web") {
    try {
      const stripe = require("@stripe/stripe-react-native");
      const stripeHook = stripe.useStripe();
      initPaymentSheet = stripeHook.initPaymentSheet;
      presentPaymentSheet = stripeHook.presentPaymentSheet;
    } catch (e) {
      // Stripe not available
    }
  }

  const handlePayment = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Info", "Payment only available on mobile app");
      return;
    }

    setLoading(true);
    try {
      const amount = estimatedPrice.toFixed(2);

      await initPaymentSheet({
        merchantDisplayName: "RCleans",
        intentConfiguration: {
          mode: { amount: parseInt(amount) * 100, currencyCode: "usd" },
          confirmHandler: async (pm: any, _: any, cb: any) => {
            try {
              const { paymentIntent, customer } = await fetchAPI(
                "/(api)/(stripe)/create",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name:
                      user?.fullName ||
                      user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
                      "Customer",
                    email: user?.emailAddresses?.[0]?.emailAddress || "",
                    amount,
                    paymentMethodId: pm.id,
                  }),
                },
              );

              if (paymentIntent?.client_secret) {
                const { result } = await fetchAPI("/(api)/(stripe)/pay", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    payment_method_id: pm.id,
                    payment_intent_id: paymentIntent.id,
                    customer_id: customer,
                    client_secret: paymentIntent.client_secret,
                  }),
                });

                if (result?.client_secret) {
                  await fetchAPI("/(api)/service/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      service_type_id: selectedServiceType?.id,
                      location_address: serviceAddress,
                      location_lat: serviceLatitude,
                      location_lng: serviceLongitude,
                      estimated_duration:
                        selectedServiceType?.estimated_duration_hours,
                      total_price: parseFloat(amount),
                      status: "matched",
                      payment_status: "paid",
                      cleaner_id: cleanerDetails?.id,
                      user_id: userId,
                    }),
                  });
                  cb({ clientSecret: result.client_secret });
                }
              }
            } catch (e: any) {
              console.log("Payment confirm error:", e);
              Alert.alert("Error", "Failed to confirm payment");
            }
          },
        },
        returnURL: "rcleans://book-service",
      });

      const { error } = await presentPaymentSheet();
      if (error) {
        Alert.alert("Error", error.message || "Payment failed");
      }
    } catch (e: any) {
      console.log("Payment error:", e);
      Alert.alert("Error", "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text className="text-white text-lg font-JakartaSemiBold mb-3">
        Payment
      </Text>
      <View className="bg-dark-200 p-4 rounded-lg border border-gray-700 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-400">Service</Text>
          <Text className="text-white font-JakartaSemiBold">
            {selectedServiceType?.name}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-400">Duration</Text>
          <Text className="text-white">
            {selectedServiceType?.estimated_duration_hours} hours
          </Text>
        </View>
        <View className="flex-row justify-between border-t border-gray-700 pt-2 mt-2">
          <Text className="text-white font-JakartaBold">Total</Text>
          <Text className="text-primary-500 text-xl font-JakartaBold">
            ${estimatedPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handlePayment}
        disabled={loading}
        style={{ opacity: loading ? 0.5 : 1 }}
        className="bg-primary-500 w-full py-4 rounded-xl flex items-center justify-center"
      >
        <Text className="text-white text-lg font-JakartaSemiBold">
          {loading ? "Processing..." : "Pay Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const BookService = () => {
  const { user } = useUser();
  const { serviceAddress } = useLocationStore();
  const { cleaners, selectedCleaner } = useCleanerStore();
  const { selectedServiceType } = useServiceTypeStore();

  const cleanerDetails = cleaners?.find((c: any) => c.id === selectedCleaner);
  const estimatedPrice = selectedServiceType
    ? Number(selectedServiceType.base_price) +
      Number(selectedServiceType.price_per_hour) *
        Number(selectedServiceType.estimated_duration_hours)
    : 0;

  return (
    <ServiceLayout title="Book Cleaning">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 5 }}
      >
        <Text className="text-white text-xl font-JakartaSemiBold mb-4">
          Your Booking
        </Text>

        <View className="items-center mb-5">
          {cleanerDetails?.profile_image_url ? (
            <Image
              source={{ uri: cleanerDetails.profile_image_url }}
              className="w-24 h-24 rounded-2xl"
            />
          ) : (
            <View className="w-24 h-24 rounded-2xl bg-primary-500/20 items-center justify-center border border-primary-500/30">
              <Text className="text-primary-500 text-2xl font-JakartaBold">
                {cleanerDetails?.first_name?.charAt(0) || "?"}
              </Text>
            </View>
          )}
          <View className="flex-row items-center mt-2">
            <Text className="text-white text-lg font-JakartaSemiBold">
              {cleanerDetails?.first_name} {cleanerDetails?.last_name}
            </Text>
            <Image
              source={icons.star}
              className="w-4 h-4 ml-2"
              tintColor="#FACC15"
            />
            <Text className="text-gray-400 text-sm ml-1">
              {cleanerDetails?.rating}
            </Text>
          </View>
        </View>

        <View className="bg-dark-200 rounded-2xl border border-gray-700 p-4 mb-4">
          <View className="flex-row justify-between py-2 border-b border-gray-700">
            <Text className="text-gray-400">Service</Text>
            <Text className="text-primary-500 font-JakartaSemiBold">
              {selectedServiceType?.name}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-700">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-primary-500 font-JakartaBold">
              ${estimatedPrice.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-700">
            <Text className="text-gray-400">Arrives</Text>
            <Text className="text-white">
              {formatTime(cleanerDetails?.time!)}
            </Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-400">Experience</Text>
            <Text className="text-white">
              {cleanerDetails?.years_experience || 1} years
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-center py-3 border-t border-b border-gray-700">
            <Image source={icons.point} className="w-5 h-5" tintColor="#666" />
            <Text className="text-gray-400 ml-2 flex-1">{serviceAddress}</Text>
          </View>
        </View>

        <PaymentSection
          user={user}
          cleanerDetails={cleanerDetails}
          selectedServiceType={selectedServiceType}
          estimatedPrice={estimatedPrice}
        />
      </ScrollView>
    </ServiceLayout>
  );
};

export default BookService;
