import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";

import CustomButton from "@/components/CustomButton";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatTime } from "@/lib/utils";
import { SelectedAddon } from "@/types/type";

interface ServiceAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_duration_minutes: number;
}

interface AddonSelectorProps {
  selectedAddons: SelectedAddon[];
  onAddonToggle: (addon: SelectedAddon) => void;
  totalAddonPrice: number;
  totalAddonDuration: number;
  serviceTypeId?: string | null;
}

const AddonSelector: React.FC<AddonSelectorProps> = ({
  selectedAddons,
  onAddonToggle,
  totalAddonPrice,
  totalAddonDuration,
  serviceTypeId,
}) => {
  const { theme } = useTheme();
  const {
    data: addons,
    loading,
    error,
    refetch,
  } = useFetch<ServiceAddon[]>(
    serviceTypeId
      ? `/(api)/service-addon?service_type_id=${encodeURIComponent(serviceTypeId)}`
      : "/(api)/service-addon",
  );

  const isAddonSelected = (addon: ServiceAddon) => {
    return selectedAddons.some((selected) => selected.id === addon.id);
  };

  const renderAddon = ({ item }: { item: ServiceAddon }) => {
    const selected = isAddonSelected(item);
    return (
      <TouchableOpacity
        style={
          selected
            ? {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.primary,
              }
            : {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
        }
        className="flex-row items-center p-4 rounded-xl border-2 mb-2.5"
        onPress={() => onAddonToggle(item)}
        accessibilityLabel={`Toggle addon ${item.name}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
      >
        <View
          style={
            selected
              ? {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                }
              : { borderColor: theme.colors.textMuted }
          }
          className="w-6 h-6 border-2 rounded-md mr-3 items-center justify-center"
        >
          {selected && <Text className="text-white text-sm font-bold">✓</Text>}
        </View>
        <View className="flex-1">
          <Text
            className="text-lg font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            {item.name}
          </Text>
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {item.description}
          </Text>
          <View className="flex-row justify-between mt-2">
            <Text
              className="text-base font-JakartaBold"
              style={{ color: theme.colors.primaryBright }}
            >
              ${item.price}
            </Text>
            <Text className="text-sm" style={{ color: theme.colors.textMuted }}>
              +{formatTime(item.estimated_duration_minutes)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !addons) {
    return (
      <View className="p-4">
        <Text
          className="text-xl font-JakartaBold mb-4"
          style={{ color: theme.colors.text }}
        >
          Additional Services
        </Text>
        {[1, 2, 3].map((key) => (
          <View
            key={key}
            className="p-4 rounded-xl border-2 mb-2.5"
            style={{ borderColor: theme.colors.border }}
          >
            <SkeletonLoader width="50%" height={18} />
            <SkeletonLoader
              width="80%"
              height={12}
              borderRadius={6}
              style={{ marginTop: 8 }}
            />
            <SkeletonLoader
              width="35%"
              height={14}
              borderRadius={7}
              style={{ marginTop: 12 }}
            />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-4">
        <Text
          className="text-xl font-JakartaBold mb-4"
          style={{ color: theme.colors.text }}
        >
          Additional Services
        </Text>
        <View
          className="p-6 rounded-xl items-center"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
        >
          <Text
            className="text-base text-center mb-4"
            style={{ color: theme.colors.textSecondary }}
          >
            Couldn&apos;t load add-ons. Check your connection and try again.
          </Text>
          <CustomButton
            title="Retry"
            onPress={() => refetch()}
            className="w-40"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="p-4">
      <Text
        className="text-xl font-JakartaBold mb-4"
        style={{ color: theme.colors.text }}
      >
        Additional Services
      </Text>

      <FlatList
        data={addons}
        renderItem={renderAddon}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <Text
            className="text-center"
            style={{ color: theme.colors.textMuted }}
          >
            No extra services are available for this service type.
          </Text>
        )}
      />

      {(selectedAddons.length > 0 || totalAddonPrice > 0) && (
        <View
          className="mt-4 p-4 border-2 rounded-xl"
          style={{
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.primary,
          }}
        >
          <Text
            className="text-lg font-JakartaBold mb-2"
            style={{ color: theme.colors.text }}
          >
            Add-on Summary
          </Text>
          <View className="flex-row justify-between">
            <Text
              className="text-base"
              style={{ color: theme.colors.textSecondary }}
            >
              Additional Price:
            </Text>
            <Text
              className="text-base font-JakartaBold"
              style={{ color: theme.colors.text }}
            >
              ${totalAddonPrice}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text
              className="text-base"
              style={{ color: theme.colors.textSecondary }}
            >
              Additional Time:
            </Text>
            <Text
              className="text-base font-JakartaBold"
              style={{ color: theme.colors.text }}
            >
              {formatTime(totalAddonDuration)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AddonSelector;
