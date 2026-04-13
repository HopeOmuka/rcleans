import { Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { formatDate, formatTime } from "@/lib/utils";
import { Service } from "@/types/type";

const ServiceCard = ({
  service,
  onRatePress,
}: {
  service: Service;
  onRatePress?: (service: Service) => void;
}) => {
  return (
    <View className="flex flex-row items-center justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 mb-3">
      <View className="flex flex-col items-start justify-center p-3">
        <View className="flex flex-row items-center justify-between">
          <Image
            source={{
              uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${service.location_lng},${service.location_lat},14,0/600x400?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_KEY}`,
            }}
            className="w-[80px] h-[90px] rounded-lg"
          />

          <View className="flex flex-col mx-5 gap-y-5 flex-1">
            <View className="flex flex-row items-center gap-x-2">
              <Image source={icons.point} className="w-5 h-5" />
              <Text className="text-md font-JakartaMedium" numberOfLines={1}>
                {service.service_type.name}
              </Text>
            </View>

            <View className="flex flex-row items-center gap-x-2">
              <Image source={icons.map} className="w-5 h-5" />
              <Text className="text-md font-JakartaMedium" numberOfLines={1}>
                {service.location_address}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex flex-col w-full mt-5 bg-general-500 rounded-lg p-3 items-start justify-center">
          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text className="text-md font-JakartaMedium text-gray-500">
              Date & Time
            </Text>
            <Text className="text-md font-JakartaBold" numberOfLines={1}>
              {formatDate(service.created_at)}
            </Text>
          </View>

          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text className="text-md font-JakartaMedium text-gray-500">
              Cleaner
            </Text>
            <Text className="text-md font-JakartaBold">
              {service.cleaner.first_name} {service.cleaner.last_name}
            </Text>
          </View>

          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text className="text-md font-JakartaMedium text-gray-500">
              Status
            </Text>
            <Text
              className={`text-md capitalize font-JakartaBold ${
                service.status === "completed"
                  ? "text-green-500"
                  : service.status === "in_progress"
                    ? "text-blue-500"
                    : service.status === "arrived"
                      ? "text-yellow-500"
                      : "text-gray-500"
              }`}
            >
              {service.status}
            </Text>
          </View>

          <View className="flex flex-row items-center w-full justify-between">
            <Text className="text-md font-JakartaMedium text-gray-500">
              Payment Status
            </Text>
            <Text
              className={`text-md capitalize font-JakartaBold ${service.payment_status === "paid" ? "text-green-500" : "text-red-500"}`}
            >
              {service.payment_status}
            </Text>
          </View>

          {service.status === "completed" && !service.rating && (
            <View className="flex flex-row items-center w-full justify-between mt-3 pt-3 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => onRatePress?.(service)}
                className="flex flex-row items-center bg-primary-500 px-4 py-2 rounded-lg"
              >
                <Image source={icons.star} className="w-4 h-4 mr-2" />
                <Text className="text-white font-JakartaMedium">
                  Rate Service
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ServiceCard;
