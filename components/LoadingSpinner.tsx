import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

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
  color = "#4ADE80",
  text,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const content = (
    <View className="flex items-center justify-center">
      <ActivityIndicator size={sizeMap[size]} color={color} />
      {text && (
        <Text className="text-secondary-400 font-JakartaMedium mt-3 text-sm">
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 bg-dark-500 justify-center items-center">
        {content}
      </View>
    );
  }

  return content;
};

export default LoadingSpinner;
