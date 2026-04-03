// GeoapifyTextInput.tsx

import React, { useState } from "react";
import {
  View,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
} from "react-native";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

const GeoapifyTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<any[]>([]);

  const searchPlaces = async (text: string) => {
    setQuery(text);

    if (text.length < 3) {
      setPlaces([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&apiKey=${GEOAPIFY_API_KEY}`,
      );

      const data = await res.json();
      setPlaces(data.features);
    } catch (error) {
      console.log("Geoapify error:", error);
    }
  };

  const selectPlace = (item: any) => {
    const lat = item.geometry.coordinates[1];
    const lng = item.geometry.coordinates[0];
    const address = item.properties.formatted;

    setQuery(address);
    setPlaces([]);

    handlePress({
      latitude: lat,
      longitude: lng,
      address,
    });
  };

  return (
    <View className={`z-50 ${containerStyle}`}>
      {/* Input */}
      <View
        className="flex flex-row items-center rounded-xl px-4"
        style={{
          backgroundColor: textInputBackgroundColor || "white",
        }}
      >
        <Image source={icon || icons.search} className="w-5 h-5 mr-2" />

        <TextInput
          value={query}
          placeholder={initialLocation || "Search location"}
          placeholderTextColor="gray"
          className="flex-1 py-3 font-semibold"
          onChangeText={searchPlaces}
        />
      </View>

      {/* Results */}
      {places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item, index) => index.toString()}
          className="bg-white rounded-xl mt-2 shadow"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => selectPlace(item)}
              className="p-3 border-b border-gray-100"
            >
              <Text className="font-semibold">{item.properties.formatted}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default GeoapifyTextInput;
