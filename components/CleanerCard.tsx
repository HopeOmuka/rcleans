import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { CleanerCardProps } from "@/types/type";

const CleanerCard = ({ item, selected, setSelected }: CleanerCardProps) => {
  const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim();
  const rating =
    typeof item.rating === "number" ? item.rating.toFixed(1) : "0.0";

  return (
    <TouchableOpacity
      onPress={setSelected}
      activeOpacity={0.8}
      className={`
        flex flex-row items-center justify-between 
        py-3 px-3 rounded-xl w-full
        ${
          selected === item.id
            ? "bg-dark-200 border-2 border-primary-500"
            : "bg-dark-300 border border-gray-700"
        }
        card-hover
      `}
    >
      <View className="relative">
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            className="w-16 h-16 rounded-2xl"
          />
        ) : (
          <View className="w-16 h-16 rounded-2xl bg-primary-500/20 items-center justify-center border border-primary-500/30">
            <Text className="text-primary-500 text-xl font-JakartaBold">
              {fullName?.charAt(0) || "?"}
            </Text>
          </View>
        )}
        <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-dark-200" />
      </View>

      <View className="flex-1 flex flex-col items-start justify-center mx-3">
        <View className="flex flex-row items-center justify-start mb-1">
          <Text className="text-white font-JakartaSemiBold text-base">
            {fullName}
          </Text>
        </View>

        <View className="flex flex-row items-center justify-start flex-wrap gap-2 mt-1">
          <View className="flex flex-row items-center bg-yellow-500/20 px-2 py-1 rounded-lg">
            <Image
              source={icons.star}
              className="w-3 h-3"
              tintColor="#FACC15"
            />
            <Text className="text-yellow-400 text-xs font-JakartaMedium ml-1">
              {rating}
            </Text>
          </View>

          {item.completed_jobs && (
            <View className="bg-dark-100 px-2 py-1 rounded-lg">
              <Text className="text-gray-400 text-xs">
                {item.completed_jobs} jobs
              </Text>
            </View>
          )}
        </View>

        {item.time && (
          <View className="flex flex-row items-center mt-2">
            <Image
              source={icons.target}
              className="w-3 h-3"
              tintColor="#4ADE80"
            />
            <Text className="text-primary-500 text-xs font-JakartaMedium ml-1">
              Arrives in {item.time} min
            </Text>
          </View>
        )}
      </View>

      <View
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          selected === item.id
            ? "border-primary-500 bg-primary-500"
            : "border-gray-600"
        }`}
      >
        {selected === item.id && (
          <Image
            source={icons.checkmark}
            className="w-3 h-3"
            tintColor="white"
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CleanerCard;
