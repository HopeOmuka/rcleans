import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import Map from "@/components/Map";
import { useTheme } from "@/lib/theme";

const ServiceLayout = ({
  title,
  snapPoints,
  children,
}: {
  title: string;
  snapPoints?: string[];
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const isChooseServicer = title === "Choose a Servicer";

  return (
    <GestureHandlerRootView className="flex-1">
      <View
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <View className="flex-1 bg-accent-500">
          <View
            className="flex flex-row absolute z-10 items-center justify-start px-5"
            style={{
              top:
                Platform.OS === "ios"
                  ? 60
                  : (StatusBar.currentHeight ?? 40) + 20,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center shadow-md shadow-black/20"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <BootstrapIcon
                  name="chevron-left"
                  size={24}
                  color={theme.colors.text}
                />
              </View>
            </TouchableOpacity>
            <Text
              className="text-xl font-JakartaSemiBold ml-5 text-white"
              style={{
                textShadowColor: "rgba(0,0,0,0.25)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {title || "Go Back"}
            </Text>
          </View>

          <Map />
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints || ["40%", "85%"]}
          index={0}
          bottomInset={insets.bottom}
          handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
          backgroundStyle={{ backgroundColor: theme.colors.surface }}
        >
          {isChooseServicer ? (
            <BottomSheetView
              style={{
                flex: 1,
                padding: 20,
              }}
            >
              {children}
            </BottomSheetView>
          ) : (
            <BottomSheetScrollView
              style={{
                flex: 1,
                padding: 20,
              }}
            >
              {children}
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default ServiceLayout;
