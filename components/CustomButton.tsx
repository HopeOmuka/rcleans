import { ActivityIndicator, TouchableOpacity, Text } from "react-native";

import { useTheme } from "@/lib/theme";
import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-general-500";
    case "danger":
      return "bg-danger-500";
    case "success":
      return "bg-success-500";
    case "outline":
      return "bg-transparent border border-secondary-300";
    default:
      return "bg-primary-500";
  }
};

const getSpinnerColor = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "primary":
      return "#052E16";
    case "outline":
      return "#334155";
    default:
      return "#FFFFFF";
  }
};

const getShadowStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "outline":
      return "";
    default:
      return "shadow-md shadow-primary-900/20";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const { theme } = useTheme();
  const isDisabled = disabled || props.loading;

  const textColor =
    textVariant === "primary"
      ? theme.colors.primaryContrast
      : textVariant === "danger" || textVariant === "success"
        ? "#FFFFFF"
        : bgVariant === "primary"
          ? theme.colors.primaryContrast
          : bgVariant === "outline"
            ? theme.colors.textSecondary
            : "#FFFFFF";

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: props.loading }}
      className={`w-full rounded-full px-5 py-3.5 flex flex-row justify-center items-center gap-2 ${getBgVariantStyle(bgVariant)} ${getShadowStyle(bgVariant)} ${isDisabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {IconLeft && <IconLeft />}
      {props.loading ? (
        <ActivityIndicator size="small" color={getSpinnerColor(bgVariant)} />
      ) : (
        <Text
          className={`text-lg font-JakartaBold`}
          style={{ color: textColor }}
        >
          {title}
        </Text>
      )}
      {IconRight && <IconRight />}
    </TouchableOpacity>
  );
};

export default CustomButton;
