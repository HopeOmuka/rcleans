// MapboxTextInput.tsx

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

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

const MapboxTextInput = ({
  icon,
  initialLocation,
  containerStyle,
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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          text,
        )}.json?access_token=${MAPBOX_API_KEY}&limit=5&types=address,poi,place`,
      );

      const data = await res.json();
      setPlaces(data.features || []);
    } catch (error) {
      console.log("Mapbox error:", error);
    }
  };

  const selectPlace = (item: any) => {
    const [lng, lat] = item.center;
    const address = item.place_name;

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
      <View className="flex flex-row items-center rounded-2xl px-4 bg-dark-200 border border-gray-700">
        <Image
          source={icon || icons.search}
          className="w-5 h-5 mr-3"
          tintColor="#666"
        />

        <TextInput
          value={query}
          placeholder={initialLocation || "Search location"}
          placeholderTextColor="#666"
          className="flex-1 py-4 font-JakartaMedium text-white"
          onChangeText={searchPlaces}
        />
      </View>

      {/* Results */}
      {places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item, index) => index.toString()}
          className="bg-dark-200 rounded-2xl mt-2 border border-gray-700"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => selectPlace(item)}
              className="p-4 border-b border-gray-800"
            >
              <Text className="text-white font-JakartaMedium">
                {item.place_name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default MapboxTextInput;
