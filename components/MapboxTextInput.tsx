import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";

import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { NAIROBI_CBD, isWithinKenya } from "@/lib/map";
import { useTheme } from "@/lib/theme";
import { useLocationStore } from "@/store";
import {
  GoogleInputProps,
  MapboxGeocodingResponse,
  MapboxPlace,
} from "@/types/type";

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
const DEBOUNCE_MS = 300;
const KENYA_BBOX = "33.909,-4.899,41.905,5.506";

const MapboxTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  handlePress,
}: GoogleInputProps) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<MapboxPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef("");
  const { userLatitude, userLongitude } = useLocationStore();

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const fetchPlaces = useCallback(
    async (text: string) => {
      if (text.length < 3) {
        setPlaces([]);
        setSearching(false);
        return;
      }

      const hasValidLocation =
        typeof userLatitude === "number" &&
        typeof userLongitude === "number" &&
        isWithinKenya(userLatitude, userLongitude);
      const lat = hasValidLocation ? userLatitude : NAIROBI_CBD.latitude;
      const lng = hasValidLocation ? userLongitude : NAIROBI_CBD.longitude;

      try {
        const data = await fetchAPI<MapboxGeocodingResponse>(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            text,
          )}.json?access_token=${MAPBOX_API_KEY}&limit=5&types=address,poi,place&country=ke&bbox=${KENYA_BBOX}&proximity=${lng},${lat}`,
        );
        // Ignore stale responses that arrive after the query changed.
        if (latestQueryRef.current !== text) return;
        setPlaces(data.features || []);
        setSearchError(false);
      } catch (error) {
        console.log("Mapbox error:", error);
        if (latestQueryRef.current !== text) return;
        setPlaces([]);
        setSearchError(true);
      } finally {
        if (latestQueryRef.current === text) {
          setSearching(false);
        }
      }
    },
    [userLatitude, userLongitude],
  );

  const searchPlaces = useCallback(
    (text: string) => {
      setQuery(text);
      latestQueryRef.current = text;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (text.length < 3) {
        setPlaces([]);
        setSearching(false);
        setSearchError(false);
        return;
      }

      setSearching(true);
      setSearchError(false);

      debounceRef.current = setTimeout(() => {
        fetchPlaces(text);
      }, DEBOUNCE_MS);
    },
    [fetchPlaces],
  );

  const selectPlace = (item: MapboxPlace) => {
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
      <View
        className="flex flex-row items-center rounded-xl px-4"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          shadowColor: theme.colors.textMuted,
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Image
          source={icon || icons.search}
          className="w-5 h-5 mr-2"
          tintColor={theme.colors.textMuted}
        />

        <TextInput
          value={query}
          placeholder={initialLocation || "Search location"}
          placeholderTextColor={theme.colors.textMuted}
          style={{ color: theme.colors.text }}
          className="flex-1 py-3 font-semibold"
          onChangeText={searchPlaces}
        />

        {searching && (
          <ActivityIndicator
            size="small"
            color={theme.colors.textMuted}
            className="ml-2"
          />
        )}
      </View>

      {places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item, index) => index.toString()}
          className="mt-2 shadow"
          style={{ maxHeight: 250, backgroundColor: theme.colors.surface }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => selectPlace(item)}
              className="p-3"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text
                className="font-semibold"
                style={{ color: theme.colors.text }}
              >
                {item.place_name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {places.length === 0 && !searching && query.trim().length >= 3 && (
        <View
          className="rounded-xl mt-2 px-4 py-3"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {searchError
              ? "Could not search locations right now. Try again."
              : "No locations found. Try a different address."}
          </Text>
        </View>
      )}
    </View>
  );
};

export default MapboxTextInput;
