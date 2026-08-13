import type {
  IntentConfiguration,
  useStripe,
} from "@stripe/stripe-react-native";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import BootstrapIcon from "@/components/BootstrapIcon";
import CustomButton from "@/components/CustomButton";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";
import { useBookingStore, useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";

type ConfirmHandlerParams = Parameters<IntentConfiguration["confirmHandler"]>;

interface CreateServiceResponse {
  id: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  customerId: string;
}

interface PaymentResult {
  success: boolean;
}

const Payment = ({
  fullName,
  email,
  amount,
  cleanerId,
  serviceTypeId,
  estimatedDuration,
  serviceId,
  paymentMode = "now",
  addons,
  promoCode,
  scheduledDate,
  stripe,
}: PaymentProps & {
  stripe: ReturnType<typeof useStripe>;
  serviceId?: string;
  paymentMode?: "now" | "later";
}) => {
  const { theme } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = stripe;
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { serviceAddress, serviceLatitude, serviceLongitude } =
    useLocationStore();
  const { specialInstructions, recurrence } = useBookingStore();

  const isPayLaterBooking = paymentMode === "later" && !serviceId;
  const isPayingExisting = Boolean(serviceId);

  // Amounts are recomputed server-side; the client never sends prices.
  const createService = async (paymentIntentId?: string) => {
    const result = await fetchAPI<ApiResponse<CreateServiceResponse>>(
      "/(api)/service/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_type_id: serviceTypeId,
          location_address: serviceAddress,
          location_lat: serviceLatitude,
          location_lng: serviceLongitude,
          estimated_duration: estimatedDuration,
          cleaner_id: cleanerId,
          addons: addons && addons.length > 0 ? addons : undefined,
          promo_code: promoCode || undefined,
          scheduled_date: scheduledDate || null,
          payment_mode: paymentIntentId ? "now" : "later",
          payment_intent_id: paymentIntentId,
          special_instructions: specialInstructions || undefined,
          recurrence: recurrence || "none",
        }),
      },
    );

    if (!result.data) {
      throw new Error(result.error || "Failed to create service");
    }
    return result.data;
  };

  const handlePayLaterBooking = async () => {
    setLoading(true);
    try {
      await createService();
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to place booking";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    try {
      const { error: initError } = await initializePaymentSheet();
      if (initError) {
        Alert.alert("Payment error", initError.message);
        return;
      }

      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== "Canceled") {
          Alert.alert(`Error code: ${error.code}`, error.message);
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong processing your payment.";
      Alert.alert("Payment error", message);
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "RCleans",
      intentConfiguration: {
        mode: {
          amount: Math.round(Number(amount) * 100),
          currencyCode: "usd",
        },
        confirmHandler: async (
          paymentMethod: ConfirmHandlerParams[0],
          _shouldSavePaymentMethod: ConfirmHandlerParams[1],
          intentCreationCallback: ConfirmHandlerParams[2],
        ) => {
          try {
            // 1. Server creates the intent with a server-computed amount.
            const intentRes = await fetchAPI<
              ApiResponse<PaymentIntentResponse>
            >("/(api)/(stripe)/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: fullName || email.split("@")[0],
                email: email,
                serviceId,
                serviceTypeId,
                estimatedDuration,
                addons: addons && addons.length > 0 ? addons : undefined,
                promoCode: promoCode || undefined,
              }),
            });

            const { clientSecret, paymentIntentId, customerId } =
              intentRes.data || {};
            if (!clientSecret || !paymentIntentId || !customerId) {
              Alert.alert("Error", "Failed to create payment intent.");
              return;
            }

            // 2. Confirm the payment server-side.
            const payRes = await fetchAPI<ApiResponse<PaymentResult>>(
              "/(api)/(stripe)/pay",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  payment_method_id: paymentMethod.id,
                  payment_intent_id: paymentIntentId,
                  customer_id: customerId,
                }),
              },
            );

            if (!payRes.data?.success) {
              Alert.alert(
                "Payment failed",
                payRes.error || "Payment could not be completed.",
              );
              return;
            }

            // 3. New booking: create the service. The server verifies the
            //    PaymentIntent before marking it paid. The create endpoint
            //    is idempotent by payment_intent_id, so retrying after a
            //    partial failure returns the already-created service.
            if (!serviceId) {
              try {
                await createService(paymentIntentId);
              } catch {
                try {
                  await createService(paymentIntentId);
                } catch {
                  intentCreationCallback({ clientSecret });
                  throw new Error(
                    `Your payment was successful but your booking could not be placed. Please contact support with reference ${paymentIntentId}.`,
                  );
                }
              }
            }

            intentCreationCallback({ clientSecret });
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Payment failed.";
            Alert.alert("Payment error", message);
          }
        },
      },
      returnURL: "rcleans://book-service",
    });

    return { error };
  };

  return (
    <>
      <CustomButton
        title={
          isPayLaterBooking
            ? loading
              ? "Booking..."
              : "Book Now, Pay Later"
            : isPayingExisting
              ? loading
                ? "Processing..."
                : `Pay $${amount}`
              : loading
                ? "Processing..."
                : `Pay $${amount} & Book`
        }
        className="my-10"
        onPress={isPayLaterBooking ? handlePayLaterBooking : openPaymentSheet}
        disabled={loading}
      />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View
          className="flex flex-col items-center justify-center p-7 rounded-2xl"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <BootstrapIcon
            name="check-circle-fill"
            size={112}
            color={theme.colors.success}
            style={{ marginTop: 20 }}
          />

          <Text
            className="text-2xl text-center font-JakartaBold mt-5"
            style={{ color: theme.colors.text }}
          >
            {isPayingExisting
              ? "Payment successful"
              : "Booking placed successfully"}
          </Text>

          <Text
            className="text-md font-JakartaRegular text-center mt-3"
            style={{ color: theme.colors.textSecondary }}
          >
            {isPayingExisting
              ? `You have paid $${amount} for this service.`
              : isPayLaterBooking
                ? "Your booking is confirmed. You can pay after the service is completed."
                : "Thank you for your booking. Your reservation has been successfully placed."}
          </Text>

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              useBookingStore.getState().resetBooking();
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default Payment;
