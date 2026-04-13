import React from "react";
import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";

import { useFetch } from "@/lib/fetch";
import { icons } from "@/constants";

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
      className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
        isAddonSelected(item)
          ? "bg-primary-500/10 border-primary-500/30"
          : "bg-dark-200 border-gray-800"
      }`}
      onPress={() => onAddonToggle(item)}
      activeOpacity={0.8}
    >
      <View
        className={`w-6 h-6 border-2 rounded-lg mr-3 items-center justify-center ${
          isAddonSelected(item)
            ? "bg-primary-500 border-primary-500"
            : "border-gray-600"
        }`}
      >
        {isAddonSelected(item) && (
          <Image
            source={icons.checkmark}
            className="w-3 h-3"
            tintColor="white"
          />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-white font-JakartaSemiBold">{item.name}</Text>
        <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
        <View className="flex-row justify-between mt-2">
          <Text className="text-primary-500 font-JakartaBold">
            +${item.price}
          </Text>
          <Text className="text-gray-500 text-sm">
            +{item.estimated_duration_minutes} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="p-4">
        <Text className="text-gray-400 text-center">Loading add-ons...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-4">
        <Text className="text-red-400 text-center">Error loading add-ons</Text>
      </View>
    );
  }

  return (
    <View className="p-4">
      <Text className="text-white font-JakartaBold text-lg mb-4">
        Extra Services
      </Text>

      <FlatList
        data={addons}
        renderItem={renderAddon}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text className="text-gray-500 text-center">
            No add-ons available
          </Text>
        )}
      />

      {(selectedAddons.length > 0 || totalAddonPrice > 0) && (
        <View className="mt-4 p-4 bg-dark-300 rounded-xl border border-gray-700">
          <Text className="text-white font-JakartaBold mb-2">
            Add-on Summary
          </Text>
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-400">Additional Price:</Text>
            <Text className="text-primary-500 font-JakartaBold">
              +${totalAddonPrice.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Additional Time:</Text>
            <Text className="text-white font-JakartaMedium">
              +{totalAddonDuration} min
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AddonSelector;
