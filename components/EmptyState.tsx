import React from "react";
import { View, Text, ImageSourcePropType, Image } from "react-native";
import CustomButton from "./CustomButton";
import { useTheme } from "@/lib/theme";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ImageSourcePropType;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "dark" | "light";
}

const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  variant = "dark",
}: EmptyStateProps) => {
  const { theme } = useTheme();
  const isLight = variant === "light";

  return (
    <View
      className={`flex-1 justify-center items-center px-8 ${
        isLight ? "bg-transparent" : "bg-dark-500"
      }`}
    >
      {icon && (
        <Image
          source={icon}
          className="w-20 h-20 mb-6 opacity-40"
          resizeMode="contain"
        />
      )}
      <Text
        className={`text-xl font-JakartaBold text-center mb-2 ${
          isLight ? "" : "text-white"
        }`}
        style={isLight ? { color: theme.colors.text } : undefined}
      >
        {title}
      </Text>
      <Text
        className={`text-sm text-center mb-8 leading-6 ${
          isLight ? "" : "text-secondary-400"
        }`}
        style={isLight ? { color: theme.colors.textSecondary } : undefined}
      >
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
