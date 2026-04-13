import { TouchableOpacity, Text, View } from "react-native";

import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-dark-200 border border-gray-600";
    case "danger":
      return "bg-red-600";
    case "success":
      return "bg-green-600";
    case "outline":
      return "bg-transparent border-2 border-primary-500";
    default:
      return "bg-primary-500";
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"]) => {
  switch (variant) {
    case "primary":
      return "text-black";
    case "secondary":
      return "text-gray-300";
    case "danger":
      return "text-white";
    case "success":
      return "text-white";
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
  className = "",
  disabled = false,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
      className={`
        w-full rounded-xl py-4 px-6
        flex flex-row justify-center items-center 
        ${getBgVariantStyle(bgVariant)} 
        ${className}
      `}
      activeOpacity={0.7}
      {...props}
    >
      {IconLeft && <View className="mr-2">{IconLeft()}</View>}
      <Text
        className={`text-lg font-JakartaSemiBold ${getTextVariantStyle(textVariant)}`}
      >
        {title}
      </Text>
      {IconRight && <View className="ml-2">{IconRight()}</View>}
    </TouchableOpacity>
  );
};

export default CustomButton;
