import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import type { Feature, LineString } from "geojson";
import type MapboxGLModule from "@rnmapbox/maps";
import type * as MapboxGLTypes from "@rnmapbox/maps";

import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import {
  calculateCleanerTimes,
  calculateRegion,
  DirectionsResponse,
  generateMarkersFromData,
  haversineKm,
} from "@/lib/map";
import { useCleanerStore, useLocationStore } from "@/store";
import { Cleaner, MarkerData } from "@/types/type";

type MapboxGLModuleType = typeof MapboxGLModule;

let MapboxGL: MapboxGLModuleType | null = null;

try {
  // Lazy require so screens that render without the native module (e.g.
  // Expo Go) still work instead of crashing at import time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@rnmapbox/maps");
  MapboxGL = (mod?.default ?? mod) as MapboxGLModuleType;
  const accessToken = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;
  if (accessToken) {
    MapboxGL.setAccessToken(accessToken);
  }
} catch {
  MapboxGL = null;
}

const Map = () => {
  const { theme } = useTheme();
  const { userLongitude, userLatitude, serviceLatitude, serviceLongitude } =
    useLocationStore();

  const { selectedCleaner, setCleaners, setCleanersLoading, setCleanersError } =
    useCleanerStore();
  const cameraRef = useRef<MapboxGLTypes.Camera>(null);

  const {
    data: cleaners,
    loading,
    error,
    refetch,
  } = useFetch<Cleaner[]>("/(api)/cleaner");

  useEffect(() => {
    setCleanersLoading(loading);
  }, [loading, setCleanersLoading]);

  useEffect(() => {
    setCleanersError(error);
  }, [error, setCleanersError]);

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);

  useEffect(() => {
    if (!Array.isArray(cleaners)) return;
    if (!userLatitude || !userLongitude) return;

    const newMarkers = generateMarkersFromData({
      data: cleaners,
      userLatitude,
      userLongitude,
    });

    setMarkers(newMarkers);
  }, [cleaners, userLatitude, userLongitude]);

  useEffect(() => {
    if (markers.length === 0 || !serviceLatitude || !serviceLongitude) return;

    calculateCleanerTimes({
      markers,
      serviceLatitude,
      serviceLongitude,
    }).then((cleanersWithTimes) => {
      if (cleanersWithTimes) {
        setCleaners(cleanersWithTimes);
      }
    });
  }, [markers, serviceLatitude, serviceLongitude, setCleaners]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (
        !userLatitude ||
        !userLongitude ||
        !serviceLatitude ||
        !serviceLongitude
      )
        return;

      if (
        haversineKm(
          userLatitude,
          userLongitude,
          serviceLatitude,
          serviceLongitude,
        ) > 500
      ) {
        setRouteCoords([]);
        setRouteError(false);
        return;
      }

      setRouteLoading(true);
      setRouteError(false);

      try {
        const data = await fetchAPI<DirectionsResponse>(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLongitude},${userLatitude};${serviceLongitude},${serviceLatitude}?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_KEY}&geometries=geojson&overview=full`,
        );

        const coords =
          data.routes?.[0]?.geometry?.coordinates?.map((coord) => ({
            latitude: coord[1],
            longitude: coord[0],
          })) ?? [];

        setRouteCoords(coords);
      } catch (err) {
        console.log("Route error:", err);
        setRouteError(true);
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [userLatitude, userLongitude, serviceLatitude, serviceLongitude]);

  const region = useMemo(
    () =>
      calculateRegion({
        userLatitude,
        userLongitude,
        serviceLatitude,
        serviceLongitude,
      }),
    [userLatitude, userLongitude, serviceLatitude, serviceLongitude],
  );

  const routeGeoJSON = useMemo((): Feature<LineString> | null => {
    if (routeCoords.length === 0) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: routeCoords.map((c) => [c.longitude, c.latitude]),
      },
    };
  }, [routeCoords]);

  const onMarkerPress = useCallback((marker: MarkerData) => {
    useCleanerStore.setState({ selectedCleaner: marker.id });
    cameraRef.current?.flyTo([marker.longitude, marker.latitude], 600);
  }, []);

  if (loading || (!userLatitude && !userLongitude)) {
    return (
      <View className="flex justify-center items-center w-full h-full">
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="flex justify-center items-center w-full h-full px-6"
        style={{ backgroundColor: theme.colors.surfaceMuted }}
      >
        <View
          className="rounded-2xl p-6 items-center shadow-sm"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Image
            source={icons.map}
            className="w-12 h-12 mb-3 opacity-50"
            tintColor={theme.colors.textMuted}
          />
          <Text
            className="text-lg font-JakartaBold mb-1"
            style={{ color: theme.colors.text }}
          >
            Unable to load map
          </Text>
          <Text
            className="text-sm text-center mb-4"
            style={{ color: theme.colors.textSecondary }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-accent-500 px-5 py-2.5 rounded-lg"
          >
            <Text className="text-white font-JakartaMedium">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!MapboxGL) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.colors.surfaceMuted }}
      >
        <View
          className="rounded-2xl p-6 items-center shadow-sm"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Image
            source={icons.map}
            className="w-12 h-12 mb-3 opacity-50"
            tintColor={theme.colors.textMuted}
          />
          <Text
            className="text-lg font-JakartaBold mb-1"
            style={{ color: theme.colors.text }}
          >
            Map unavailable
          </Text>
          <Text
            className="text-sm text-center mb-4"
            style={{ color: theme.colors.textSecondary }}
          >
            The map requires a development build. Run `npx expo run:android` to
            enable it.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapboxGL.MapView
        style={{ flex: 1 }}
        styleURL={
          theme.scheme === "dark"
            ? MapboxGL.StyleURL.Dark
            : MapboxGL.StyleURL.Street
        }
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [region.longitude, region.latitude],
            zoomLevel: 12,
          }}
        />

        {markers.map((marker) => (
          <MapboxGL.PointAnnotation
            key={String(marker.id)}
            id={String(marker.id)}
            coordinate={[marker.longitude, marker.latitude]}
            onSelected={() => onMarkerPress(marker)}
          >
            <Image
              source={
                selectedCleaner === marker.id
                  ? icons.selectedMarker
                  : icons.marker
              }
              className="w-8 h-8"
              resizeMode="contain"
            />
          </MapboxGL.PointAnnotation>
        ))}

        {serviceLatitude && serviceLongitude && (
          <MapboxGL.PointAnnotation
            id="destination"
            coordinate={[serviceLongitude, serviceLatitude]}
          >
            <Image
              source={icons.pin}
              className="w-8 h-8"
              resizeMode="contain"
            />
          </MapboxGL.PointAnnotation>
        )}

        {routeGeoJSON && (
          <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: "#3B82F6",
                lineWidth: 4,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {routeLoading && (
        <View
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex-row items-center shadow-sm"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <ActivityIndicator size="small" color="#3B82F6" className="mr-2" />
          <Text
            className="text-sm font-JakartaMedium"
            style={{ color: theme.colors.text }}
          >
            Fetching route...
          </Text>
        </View>
      )}

      {routeError && !routeLoading && (
        <View
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full"
          style={{
            backgroundColor: theme.colors.dangerSoft,
            borderColor: theme.colors.danger,
            borderWidth: 1,
          }}
        >
          <Text
            className="text-sm font-JakartaMedium"
            style={{ color: theme.colors.danger }}
          >
            Failed to load route
          </Text>
        </View>
      )}
    </View>
  );
};

export default Map;
