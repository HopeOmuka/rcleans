import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

import { InputFieldProps } from "@/types/type";
import { icons } from "@/constants";

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  ...props
}: InputFieldProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-3 w-full">
          <Text
            className={`text-sm font-JakartaMedium mb-2 ${labelStyle || "text-gray-400"}`}
          >
            {label}
          </Text>
          <View
            className={`
              flex flex-row justify-start items-center relative 
              bg-dark-100 rounded-2xl border border-gray-800 
              focus:border-primary-500
              ${containerStyle}
            `}
          >
            {icon && (
              <Image
                source={icon}
                className={`w-5 h-5 ml-4 ${iconStyle}`}
                tintColor="#666"
              />
            )}
            <TextInput
              className={`
                rounded-2xl p-4 font-JakartaMedium text-[15px] flex-1 
                text-white placeholder-gray-500
                ${inputStyle}
              `}
              placeholderTextColor="#666"
              secureTextEntry={secureTextEntry}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
