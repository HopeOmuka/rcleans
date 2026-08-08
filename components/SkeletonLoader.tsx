import React, { useEffect, useRef } from "react";
import { Animated, DimensionValue, ViewStyle, StyleSheet } from "react-native";

import { useTheme } from "@/lib/theme";

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonLoader = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const animatedStyle = StyleSheet.create({
    skeleton: {
      width,
      height,
      borderRadius,
      backgroundColor: theme.colors.surfaceMuted,
      opacity,
    },
  });

  return <Animated.View style={[animatedStyle.skeleton, style]} />;
};

export default SkeletonLoader;
