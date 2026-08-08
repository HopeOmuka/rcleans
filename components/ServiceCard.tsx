import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BootstrapIcon from "@/components/BootstrapIcon";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/utils";
import { Service } from "@/types/type";

const ServiceCard = ({
  service,
  onPress,
  onRatePress,
  onPayPress,
  onCancelPress,
}: {
  service: Service;
  onPress?: (service: Service) => void;
  onRatePress?: (service: Service) => void;
  onPayPress?: (service: Service) => void;
  onCancelPress?: (service: Service) => void;
}) => {
  const { theme } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasStaticMapCoords =
    typeof service.location_lat === "number" &&
    typeof service.location_lng === "number";
  const serviceTypeName = service.service_type?.name ?? "Service";
  const cleanerName = service.cleaner
    ? `${service.cleaner.first_name ?? ""} ${service.cleaner.last_name ?? ""}`.trim()
    : "Not assigned";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(service)}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
      className="flex flex-row items-center justify-center rounded-2xl border shadow-sm shadow-secondary-200 mb-3"
    >
      <View className="flex flex-col items-start justify-center p-3">
        <View className="flex flex-row items-center justify-between">
          <View
            className="w-[80px] h-[90px] rounded-lg items-center justify-center overflow-hidden"
            style={{ backgroundColor: theme.colors.surfaceMuted }}
          >
            {!imageLoaded && !imageError && hasStaticMapCoords && (
              <ActivityIndicator size="small" color="#9CA3AF" />
            )}
            {imageError || !hasStaticMapCoords ? (
              <View className="items-center justify-center">
                <BootstrapIcon
                  name="map"
                  size={24}
                  color={theme.colors.textMuted}
                />
              </View>
            ) : (
              <Image
                source={{
                  uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${service.location_lng},${service.location_lat},14,0/600x400?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_KEY}`,
                }}
                className="w-[80px] h-[90px] rounded-lg"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </View>

          <View className="flex flex-col mx-5 gap-y-5 flex-1">
            <View className="flex flex-row items-center gap-x-2">
              <BootstrapIcon
                name="geo-alt"
                size={20}
                color={theme.colors.text}
              />
              <Text
                className="text-md font-JakartaMedium"
                numberOfLines={1}
                style={{ color: theme.colors.text }}
              >
                {serviceTypeName}
              </Text>
            </View>

            <View className="flex flex-row items-center gap-x-2">
              <BootstrapIcon
                name="map"
                size={20}
                color={theme.colors.textMuted}
              />
              <Text
                className="text-md font-JakartaMedium"
                numberOfLines={1}
                style={{ color: theme.colors.textSecondary }}
              >
                {service.location_address}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="flex flex-col w-full mt-5 rounded-2xl p-3 items-start justify-center"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
        >
          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text
              className="text-md font-JakartaMedium"
              style={{ color: theme.colors.textSecondary }}
            >
              Date & Time
            </Text>
            <Text
              className="text-md font-JakartaBold"
              numberOfLines={1}
              style={{ color: theme.colors.text }}
            >
              {service.scheduled_date
                ? formatDate(service.scheduled_date)
                : service.created_at
                  ? formatDate(service.created_at)
                  : "—"}
            </Text>
          </View>

          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text
              className="text-md font-JakartaMedium"
              style={{ color: theme.colors.textSecondary }}
            >
              Cleaner
            </Text>
            <Text
              className="text-md font-JakartaBold"
              style={{ color: theme.colors.text }}
            >
              {cleanerName}
            </Text>
          </View>

          <View className="flex flex-row items-center w-full justify-between mb-5">
            <Text
              className="text-md font-JakartaMedium"
              style={{ color: theme.colors.textSecondary }}
            >
              Status
            </Text>
            <Text
              className="text-md capitalize font-JakartaBold"
              style={{
                color:
                  service.status === "completed"
                    ? theme.colors.success
                    : service.status === "in_progress"
                      ? theme.colors.accent
                      : service.status === "arrived"
                        ? theme.colors.warning
                        : theme.colors.textSecondary,
              }}
              numberOfLines={1}
            >
              {service.status.replaceAll("_", " ")}
            </Text>
          </View>

          <View className="flex flex-row items-center w-full justify-between">
            <Text
              className="text-md font-JakartaMedium"
              style={{ color: theme.colors.textSecondary }}
            >
              Payment Status
            </Text>
            <Text
              className="text-[13px] capitalize font-JakartaBold"
              style={{
                color:
                  service.payment_status === "paid"
                    ? theme.colors.success
                    : service.payment_status === "authorized"
                      ? theme.colors.accent
                      : theme.colors.warning,
              }}
              numberOfLines={1}
            >
              {service.payment_status === "authorized"
                ? "funds held — awaiting cleaner"
                : service.payment_status}
            </Text>
          </View>

          {service.status === "completed" && !service.rating && (
            <View
              className="flex flex-row items-center w-full justify-between mt-3 pt-3"
              style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}
            >
              <TouchableOpacity
                onPress={() => onRatePress?.(service)}
                className="flex flex-row items-center bg-primary-500 px-5 py-2.5 rounded-full shadow-sm shadow-primary-200"
              >
                <BootstrapIcon name="star" size={16} color="#FFFFFF" />
                <Text className="text-white font-JakartaMedium">
                  Rate Service
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {service.status === "completed" &&
            service.payment_status !== "paid" && (
              <View
                className="flex flex-row items-center w-full justify-between mt-3 pt-3"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <TouchableOpacity
                  onPress={() => onPayPress?.(service)}
                  className="flex flex-row items-center bg-accent-500 px-5 py-2.5 rounded-full shadow-sm shadow-accent-200"
                >
                  <Text className="text-white font-JakartaMedium">
                    Pay ${Number(service.total_price).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {(service.status === "requested" ||
            service.status === "matched" ||
            service.status === "confirmed") && (
            <View
              className="flex flex-row items-center w-full justify-between mt-3 pt-3"
              style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}
            >
              <TouchableOpacity
                onPress={() => onCancelPress?.(service)}
                className="flex flex-row items-center bg-red-500 px-5 py-2.5 rounded-full shadow-sm shadow-danger-200"
              >
                <Text className="text-white font-JakartaMedium">
                  Cancel Booking
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ServiceCard;
