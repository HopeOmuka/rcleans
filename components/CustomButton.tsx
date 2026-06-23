import { ActivityIndicator, TouchableOpacity, Text } from "react-native";

import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-gray-500";
    case "danger":
      return "bg-red-500";
    case "success":
      return "bg-green-500";
    case "outline":
      return "bg-transparent border-secondary-300 border-[0.5px]";
    default:
      return "bg-accent-500";
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"]) => {
  switch (variant) {
    case "primary":
      return "text-black";
    case "secondary":
      return "text-gray-100";
    case "danger":
      return "text-red-100";
    case "success":
      return "text-green-100";
    default:
      return "text-white";
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
  const isDisabled = disabled || props.loading;
  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      className={`w-full rounded-full p-3 flex flex-row justify-center items-center shadow-md shadow-neutral-400/70 ${getBgVariantStyle(bgVariant)} ${isDisabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {IconLeft && <IconLeft />}
      {props.loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text
          className={`text-lg font-JakartaBold ${getTextVariantStyle(textVariant)}`}
        >
          {title}
        </Text>
      )}
      {IconRight && <IconRight />}
    </TouchableOpacity>
  );
};

export default CustomButton;
