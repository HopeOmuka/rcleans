import { Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { Service } from "@/types/type";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ServiceCard = ({
  service,
  onRatePress,
}: {
  service: Service;
  onRatePress?: (service: Service) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "in_progress":
        return "text-accent-500";
      case "arrived":
        return "text-yellow-400";
      case "matched":
        return "text-primary-500";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "arrived":
        return "Arrived";
      case "matched":
        return "Assigned";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <View className="bg-dark-200 rounded-2xl border border-gray-800 overflow-hidden mb-4 card-hover">
      <View className="p-4">
        <View className="flex flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white font-JakartaSemiBold text-lg">
              {service.service_type?.name || "Cleaning Service"}
            </Text>
            <View className="flex flex-row items-center mt-1">
              <Image
                source={icons.point}
                className="w-4 h-4"
                tintColor="#666"
              />
              <Text className="text-gray-400 text-sm ml-1" numberOfLines={1}>
                {service.location_address}
              </Text>
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full bg-dark-300 border border-gray-700`}
          >
            <Text
              className={`text-xs font-JakartaMedium ${getStatusColor(service.status)}`}
            >
              {getStatusLabel(service.status)}
            </Text>
          </View>
        </View>

        <View className="bg-dark-300 rounded-xl p-3 mt-3">
          <View className="flex flex-row items-center justify-between mb-2">
            <Text className="text-gray-500 text-sm">Date</Text>
            <Text className="text-white text-sm font-JakartaMedium">
              {formatDate(service.created_at)}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between mb-2">
            <Text className="text-gray-500 text-sm">Cleaner</Text>
            <Text className="text-white text-sm font-JakartaMedium">
              {service.cleaner
                ? `${service.cleaner.first_name} ${service.cleaner.last_name}`
                : "Not assigned"}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between mb-2">
            <Text className="text-gray-500 text-sm">Price</Text>
            <Text className="text-primary-500 font-JakartaBold">
              ${service.total_price?.toFixed(2) || "0.00"}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between">
            <Text className="text-gray-500 text-sm">Payment</Text>
            <Text
              className={`text-sm font-JakartaMedium ${service.payment_status === "paid" ? "text-green-400" : "text-red-400"}`}
            >
              {service.payment_status || "Pending"}
            </Text>
          </View>
        </View>

        {service.status === "completed" && !service.rating && (
          <TouchableOpacity
            onPress={() => onRatePress?.(service)}
            className="flex flex-row items-center justify-center mt-3 bg-primary-500/20 border border-primary-500/30 px-4 py-3 rounded-xl"
          >
            <Image
              source={icons.star}
              className="w-4 h-4 mr-2"
              tintColor="#4ADE80"
            />
            <Text className="text-primary-500 font-JakartaMedium">
              Rate Service
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ServiceCard;
