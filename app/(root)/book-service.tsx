import { useUser } from "@clerk/clerk-expo";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Image, Text, View } from "react-native";

import Payment from "@/components/Payment";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import {
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";

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
              source={{ uri: cleanerDetails?.profile_image_url }}
              className="w-28 h-28 rounded-full"
            />

            <View className="flex flex-row items-center justify-center mt-5 space-x-2">
              <Text className="text-lg font-JakartaSemiBold">
                {cleanerDetails?.title}
              </Text>

              <View className="flex flex-row items-center space-x-0.5">
                <Image
                  source={icons.star}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-lg font-JakartaRegular">
                  {cleanerDetails?.rating}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-3xl bg-general-600 mt-5">
            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Service</Text>
              <Text className="text-lg font-JakartaRegular text-[#0CC25F]">
                {selectedServiceType?.name}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Service Price</Text>
              <Text className="text-lg font-JakartaRegular text-[#0CC25F]">
                ${estimatedPrice.toFixed(2)}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Arrival Time</Text>
              <Text className="text-lg font-JakartaRegular">
                {formatTime(cleanerDetails?.time!)}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-between w-full py-3">
              <Text className="text-lg font-JakartaRegular">Experience</Text>
              <Text className="text-lg font-JakartaRegular">
                {cleanerDetails?.years_experience} years
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

          <Payment
            fullName={user?.fullName!}
            email={user?.emailAddresses[0].emailAddress!}
            amount={estimatedPrice.toFixed(2)}
            cleanerId={cleanerDetails?.id}
            serviceTypeId={selectedServiceType?.id}
            estimatedDuration={
              selectedServiceType?.estimated_duration_hours || 0
            }
          />
        </>
      </ServiceLayout>
    </StripeProvider>
  );
};

export default BookService;
