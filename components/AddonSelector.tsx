import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";

import { useFetch } from "@/lib/fetch";

interface ServiceAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_duration_minutes: number;
}

interface AddonSelectorProps {
  selectedAddons: ServiceAddon[];
  onAddonToggle: (addon: ServiceAddon) => void;
  totalAddonPrice: number;
  totalAddonDuration: number;
}

const AddonSelector: React.FC<AddonSelectorProps> = ({
  selectedAddons,
  onAddonToggle,
  totalAddonPrice,
  totalAddonDuration,
}) => {
  const {
    data: addons,
    loading,
    error,
  } = useFetch<ServiceAddon[]>("/(api)/service-addon");

  const isAddonSelected = (addon: ServiceAddon) => {
    return selectedAddons.some((selected) => selected.id === addon.id);
  };

  const renderAddon = ({ item }: { item: ServiceAddon }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white rounded-lg border border-gray-200 mb-2"
      onPress={() => onAddonToggle(item)}
    >
      <TouchableOpacity
        className={`w-6 h-6 border-2 rounded mr-3 items-center justify-center ${
          isAddonSelected(item)
            ? "bg-primary-500 border-primary-500"
            : "border-gray-300"
        }`}
        onPress={() => onAddonToggle(item)}
      >
        {isAddonSelected(item) && (
          <Text className="text-white text-sm font-bold">✓</Text>
        )}
      </TouchableOpacity>
      <View className="flex-1">
        <Text className="text-lg font-JakartaSemiBold">{item.name}</Text>
        <Text className="text-sm text-gray-600">{item.description}</Text>
        <View className="flex-row justify-between mt-2">
          <Text className="text-base font-JakartaBold text-primary-500">
            ${item.price}
          </Text>
          <Text className="text-sm text-gray-500">
            +{item.estimated_duration_minutes} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="p-4">
        <Text className="text-center">Loading add-ons...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-4">
        <Text className="text-center text-red-500">Error loading add-ons</Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      <Text className="text-xl font-JakartaBold mb-4">Additional Services</Text>

      <FlatList
        data={addons}
        renderItem={renderAddon}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text className="text-center text-gray-500">
            No add-ons available
          </Text>
        )}
      />

      {(selectedAddons.length > 0 || totalAddonPrice > 0) && (
        <View className="mt-4 p-4 bg-gray-50 rounded-lg">
          <Text className="text-lg font-JakartaBold mb-2">Add-on Summary</Text>
          <View className="flex-row justify-between">
            <Text className="text-base">Additional Price:</Text>
            <Text className="text-base font-JakartaBold">
              ${totalAddonPrice}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-base">Additional Time:</Text>
            <Text className="text-base font-JakartaBold">
              {totalAddonDuration} min
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AddonSelector;
