import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

import CustomButton from "@/components/CustomButton";
import { images, onboarding } from "@/constants";
import { useTheme } from "@/lib/theme";

const Home = () => {
  const { theme } = useTheme();
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === onboarding.length - 1;

  return (
    <SafeAreaView
      className="flex h-full items-center justify-between"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View className="w-full flex flex-row items-center justify-between px-5 pt-3">
        <View className="flex flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-primary-gradient items-center justify-center overflow-hidden">
            <Image
              source={images.logo}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text
            className="text-xl font-JakartaExtraBold ml-2"
            style={{ color: theme.colors.text }}
          >
            RCleans
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            router.replace("/(auth)/sign-up");
          }}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
        >
          <Text
            className="text-md font-JakartaSemiBold"
            style={{ color: theme.colors.textSecondary }}
          >
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <Swiper
        ref={swiperRef}
        loop={false}
        dot={
          <View
            className="w-[32px] h-[4px] mx-1 rounded-full"
            style={{ backgroundColor: theme.colors.border }}
          />
        }
        activeDot={
          <View
            className="w-[32px] h-[4px] mx-1 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
        }
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View key={item.id} className="flex items-center justify-center p-5">
            <Image
              source={item.image}
              className="w-full h-[300px]"
              resizeMode="contain"
            />
            <View className="flex flex-row items-center justify-center w-full mt-10">
              <Text
                className="text-3xl font-JakartaExtraBold mx-10 text-center leading-tight"
                style={{ color: theme.colors.text }}
              >
                {item.title}
              </Text>
            </View>
            <Text
              className="text-md font-JakartaMedium text-center mx-10 mt-3 leading-relaxed"
              style={{ color: theme.colors.textSecondary }}
            >
              {item.description}
            </Text>
          </View>
        ))}
      </Swiper>

      <View className="w-11/12 mb-5 mt-10">
        <CustomButton
          title={isLastSlide ? "Get Started" : "Next"}
          onPress={() =>
            isLastSlide
              ? router.replace("/(auth)/sign-up")
              : swiperRef.current?.scrollBy(1)
          }
        />
        {!isLastSlide && (
          <Text
            className="text-center text-sm mt-4 font-JakartaMedium"
            style={{ color: theme.colors.textMuted }}
          >
            Swipe to explore
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Home;
