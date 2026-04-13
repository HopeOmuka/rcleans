import React from "react";
import { View, Text } from "react-native";

interface MapProps {
  userLatitude?: number | null;
  userLongitude?: number | null;
  serviceLatitude?: number | null;
  serviceLongitude?: number | null;
  userAddress?: string;
  serviceAddress?: string;
  cleanerMarkers?: any[];
}

const MapPlaceholder = ({ userAddress, cleanerMarkers }: MapProps) => (
  <View className="w-full h-48 bg-dark-200 rounded-2xl items-center justify-center border border-gray-700">
    <Text className="text-primary-500 text-4xl mb-2">🗺️</Text>
    <Text className="text-white font-JakartaSemiBold">Map View</Text>
    <Text className="text-gray-400 text-sm mt-1">
      {cleanerMarkers?.length || 0} cleaners nearby
    </Text>
    {userAddress && (
      <Text
        className="text-gray-500 text-xs mt-2 text-center px-4"
        numberOfLines={2}
      >
        {userAddress}
      </Text>
    )}
  </View>
);

const Map = (props: MapProps) => {
  return <MapPlaceholder {...props} />;
};

export default Map;
