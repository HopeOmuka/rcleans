import { useUser } from "@clerk/clerk-expo";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import EmptyState from "@/components/EmptyState";
import Payment from "@/components/Payment";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";
import { Service } from "@/types/type";

const PayService = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const stripe = useStripe();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const result = await fetchAPI<ApiResponse<Service>>(
          `/(api)/service/${serviceId}`,
        );
        if (result.data) {
          setService(result.data);
        } else {
          setError(result.error || "Failed to load service");
        }
      } catch {
        setError("Failed to load service details");
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  if (!service && !loading) {
    return (
      <ServiceLayout title="Pay for Service">
        <EmptyState
          title="Service Not Found"
          description={error || "Could not load this service."}
          icon={icons.pin}
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </ServiceLayout>
    );
  }

  const totalDue = Number(service?.total_price);
  const displayTotal = Number.isFinite(totalDue) ? totalDue.toFixed(2) : "0.00";
  const serviceTypeName = service?.service_type?.name ?? "Service";
  const cleanerName = service?.cleaner
    ? `${service.cleaner.first_name ?? ""} ${service.cleaner.last_name ?? ""}`.trim()
    : "Not assigned";
  const alreadyPaid = service?.payment_status === "paid";

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.rcleans"
      urlScheme="rcleans"
    >
      <ServiceLayout title="Pay for Service">
        {!service ? (
          <View className="items-center mt-10">
            <Text style={{ color: theme.colors.textSecondary }}>
              Loading service...
            </Text>
          </View>
        ) : (
          <View className="p-5">
            <View className="bg-general-600 rounded-3xl p-5 mb-5">
              <View className="flex-row items-center justify-between border-b border-white py-3">
                <Text className="text-lg font-JakartaRegular text-white">
                  Service
                </Text>
                <Text className="text-lg font-JakartaRegular text-primary-500">
                  {serviceTypeName}
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-b border-white py-3">
                <Text className="text-lg font-JakartaRegular text-white">
                  Cleaner
                </Text>
                <Text className="text-lg font-JakartaRegular text-white">
                  {cleanerName}
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-b border-white py-3">
                <Text className="text-lg font-JakartaRegular text-white">
                  Amount Due
                </Text>
                <Text className="text-lg font-JakartaRegular text-primary-500">
                  ${displayTotal}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-lg font-JakartaRegular text-white">
                  Payment Status
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${alreadyPaid ? "bg-green-500" : "bg-yellow-500"}`}
                >
                  <Text className="text-white text-xs font-JakartaMedium capitalize">
                    {service.payment_status}
                  </Text>
                </View>
              </View>
            </View>

            {alreadyPaid ? (
              <Text
                className="text-center font-JakartaMedium my-10"
                style={{ color: theme.colors.success }}
              >
                This service has already been paid for.
              </Text>
            ) : (
              <Payment
                fullName={user?.fullName ?? "Guest"}
                email={user?.emailAddresses?.[0]?.emailAddress ?? ""}
                amount={displayTotal}
                serviceId={service.id}
                estimatedDuration={0}
                stripe={stripe}
              />
            )}
          </View>
        )}
      </ServiceLayout>
    </StripeProvider>
  );
};

export default PayService;
