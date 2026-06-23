import React, { useEffect, useRef } from "react";
import { Animated, ViewStyle, StyleSheet } from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonLoader = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) => {
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
  }, []);

  const animatedStyle = StyleSheet.create({
    skeleton: {
      width: width as any,
      height: height as any,
      borderRadius,
      backgroundColor: "#334155",
      opacity,
    },
  });

  return <Animated.View style={[animatedStyle.skeleton, style]} />;
};

export default SkeletonLoader;
