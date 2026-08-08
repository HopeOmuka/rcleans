import React from "react";
import { View, Text } from "react-native";
import CustomButton from "./CustomButton";
import BootstrapIcon from "@/components/BootstrapIcon";
import type { BootstrapIconName } from "@/lib/bootstrap-icons";
import { useTheme } from "@/lib/theme";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: BootstrapIconName;
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
        <BootstrapIcon
          name={icon}
          size={80}
          color={isLight ? theme.colors.textMuted : "#6B7280"}
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
