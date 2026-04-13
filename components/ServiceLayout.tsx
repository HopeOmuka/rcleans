import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { icons } from "@/constants";

const ServiceLayout = ({
  title,
  snapPoints,
  children,
}: {
  title: string;
  snapPoints?: string[];
  children: React.ReactNode;
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 bg-dark-500">
        <View className="flex flex-col h-screen">
          <View className="flex flex-row absolute z-10 top-16 items-center justify-start px-5">
            <TouchableOpacity onPress={() => router.back()}>
              <View className="w-10 h-10 bg-dark-300 rounded-full items-center justify-center border border-gray-700">
                <Image
                  source={icons.backArrow}
                  resizeMode="contain"
                  tintColor="white"
                  className="w-6 h-6"
                />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-JakartaSemiBold ml-5 text-white">
              {title || "Go Back"}
            </Text>
          </View>
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints || ["40%", "90%"]}
          index={0}
          backgroundStyle={{ backgroundColor: "#1F1F1F" }}
          handleIndicatorStyle={{ backgroundColor: "#666" }}
        >
          {title === "Choose a Servicer" ? (
            <BottomSheetView
              style={{
                flex: 1,
                padding: 20,
                paddingBottom: 100,
              }}
            >
              {children}
            </BottomSheetView>
          ) : (
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              style={{
                flex: 1,
                paddingHorizontal: 20,
                paddingTop: 20,
              }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 150,
                paddingHorizontal: 20,
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
