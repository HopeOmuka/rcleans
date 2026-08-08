import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

import { useTheme } from "@/lib/theme";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "small" as const,
  md: "large" as const,
  lg: "large" as const,
};

const LoadingSpinner = ({
  size = "md",
  color,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const { theme } = useTheme();
  const spinnerColor = color ?? theme.colors.primary;

  const content = (
    <View className="flex items-center justify-center">
      <ActivityIndicator size={sizeMap[size]} color={spinnerColor} />
      {text && (
        <Text
          className="font-JakartaMedium mt-3 text-sm"
          style={{ color: theme.colors.textSecondary }}
        >
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        {content}
      </View>
    );
  }

  return content;
};

export default LoadingSpinner;
