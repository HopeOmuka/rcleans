import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, Dimensions, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

const colorMap: Record<ToastType, string> = {
  success: "#22C55E",
  error: "#EF4444",
  info: "#3B82F6",
};

const screenWidth = Dimensions.get("window").width;

let showToastFn: ((message: string, type?: ToastType) => void) | null = null;

export const showToast = (message: string, type: ToastType = "info") => {
  showToastFn?.(message, type);
};

const ToastManager = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const translateY = useRef(new Animated.Value(-120)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    showToastFn = (msg: string, toastType: ToastType = "info") => {
      setMessage(msg);
      setType(toastType);
      setVisible(true);

      translateY.setValue(-120);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 120,
      }).start();

      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 3000);
    };

    return () => {
      showToastFn = null;
    };
  }, [translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: colorMap[type],
          transform: [{ translateY }],
          width: screenWidth - 32,
        },
      ]}
    >
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ToastManager;
