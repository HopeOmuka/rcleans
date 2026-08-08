import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import BootstrapIcon from "@/components/BootstrapIcon";
import { useTheme } from "@/lib/theme";
import { formatTime } from "@/lib/utils";
import { CleanerCardProps } from "@/types/type";

const CleanerCard = ({
  item,
  selected,
  setSelected,
  onViewProfile,
}: CleanerCardProps) => {
  const { theme } = useTheme();
  const isSelected = selected === item.id;
  const hasAvatar = Boolean(item.profile_image_url);

  return (
    <TouchableOpacity
      onPress={setSelected}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.title}, rated ${item.rating} stars`}
      accessibilityState={{ selected: isSelected }}
      style={{
        backgroundColor: isSelected
          ? theme.colors.primarySoft
          : theme.colors.surface,
        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
      }}
      className={`flex flex-row items-center py-4 px-4 rounded-2xl border ${
        isSelected ? "shadow-sm shadow-primary-200" : ""
      }`}
    >
      {hasAvatar ? (
        <Image
          source={{ uri: item.profile_image_url }}
          className="w-14 h-14 rounded-full"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
          accessibilityLabel={`Profile picture of ${item.title}`}
        />
      ) : (
        <View
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: theme.colors.primarySoft }}
        >
          <Text
            className="text-xl font-JakartaBold"
            style={{ color: theme.colors.primary }}
          >
            {item.first_name?.charAt(0) || item.title?.charAt(0) || "?"}
          </Text>
        </View>
      )}

      <View className="flex-1 flex flex-col items-start justify-center mx-3">
        <View className="flex flex-row items-center mb-1">
          <Text
            className="text-lg font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            {item.title}
          </Text>
          <View
            className="flex flex-row items-center ml-2 rounded-full px-2 py-0.5"
            style={{ backgroundColor: theme.colors.surfaceMuted }}
          >
            <BootstrapIcon name="star" size={12} color={theme.colors.warning} />
            <Text
              className="text-xs font-JakartaMedium ml-0.5"
              style={{ color: theme.colors.textSecondary }}
            >
              {item.rating}
              {item.total_ratings ? ` (${item.total_ratings})` : ""}
            </Text>
          </View>
        </View>

        <View className="flex flex-row items-center flex-wrap">
          <View
            className="flex flex-row items-center rounded-full px-2 py-0.5"
            style={{ backgroundColor: theme.colors.primarySoft }}
          >
            <BootstrapIcon
              name="currency-dollar"
              size={12}
              color={theme.colors.primary}
            />
            <Text
              className="text-xs font-JakartaBold ml-0.5"
              style={{ color: theme.colors.primary }}
            >
              {item.price}
            </Text>
          </View>

          {typeof item.time === "number" && (
            <Text
              className="text-sm font-JakartaRegular ml-2"
              style={{ color: theme.colors.textSecondary }}
            >
              ~{formatTime(item.time)} away
            </Text>
          )}
        </View>

        {item.specialties?.length > 0 && (
          <Text
            className="text-sm font-JakartaRegular mt-1"
            numberOfLines={1}
            style={{ color: theme.colors.textSecondary }}
          >
            {item.specialties.join(", ")}
          </Text>
        )}

        {onViewProfile && (
          <TouchableOpacity
            onPress={onViewProfile}
            accessibilityRole="button"
            accessibilityLabel={`View ${item.title}'s profile and reviews`}
            className="mt-1 flex flex-row items-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              className="text-xs font-JakartaSemiBold underline"
              style={{ color: theme.colors.primary }}
            >
              View profile &amp; reviews
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        className={`w-7 h-7 rounded-full items-center justify-center ${
          isSelected ? "bg-primary-500" : "border-2"
        }`}
        style={!isSelected ? { borderColor: theme.colors.border } : undefined}
      >
        {isSelected && (
          <BootstrapIcon name="check-lg" size={16} color="#FFFFFF" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CleanerCard;
