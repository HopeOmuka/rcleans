import React from "react";
import { View, Text, ImageSourcePropType, Image } from "react-native";
import CustomButton from "./CustomButton";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ImageSourcePropType;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <View className="flex-1 bg-dark-500 justify-center items-center px-8">
      {icon && (
        <Image
          source={icon}
          className="w-20 h-20 mb-6 opacity-40"
          resizeMode="contain"
        />
      )}
      <Text className="text-xl font-JakartaBold text-white text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-secondary-400 text-center mb-8 leading-6">
        {description}
      </Text>
      {actionLabel && onAction && (
        <CustomButton
          title={actionLabel}
          onPress={onAction}
          bgVariant="primary"
        />
      )}
    </View>
  );
};

export default EmptyState;
