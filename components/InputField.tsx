import { useState } from "react";
import {
  TextInput,
  View,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

import BootstrapIcon from "@/components/BootstrapIcon";
import { useTheme } from "@/lib/theme";

import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  tintColor,
  className,
  ...props
}: InputFieldProps) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="my-2 w-full">
          <Text
            className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}
            accessibilityRole="text"
            style={{ color: theme.colors.text }}
          >
            {label}
          </Text>
          <View
            className={`flex flex-row justify-start items-center relative rounded-2xl border-2 ${containerStyle}`}
            style={{
              backgroundColor: focused
                ? theme.colors.surface
                : theme.colors.surfaceMuted,
              borderColor: focused ? theme.colors.primary : theme.colors.border,
            }}
          >
            {icon && (
              <BootstrapIcon
                name={icon}
                size={20}
                color={
                  tintColor ??
                  (focused ? theme.colors.primary : theme.colors.textMuted)
                }
                style={{ marginLeft: 16 }}
              />
            )}
            <TextInput
              className={`rounded-2xl p-4 font-JakartaSemiBold text-[15px] flex-1 text-left ${inputStyle}`}
              style={{ color: theme.colors.text }}
              secureTextEntry={secureTextEntry}
              accessibilityLabel={label}
              onFocus={(e) => {
                setFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                props.onBlur?.(e);
              }}
              placeholderTextColor={theme.colors.textMuted}
              {...props}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
