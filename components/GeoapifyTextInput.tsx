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

const MAPBOX_API_KEY = import.meta.env.EXPO_PUBLIC_MAPBOX_API_KEY;

const MapboxTextInput = ({
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
              <Text className="font-semibold">{item.place_name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default MapboxTextInput;
