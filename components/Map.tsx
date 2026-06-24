import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";

import { icons } from "@/constants";
import { fetchAPI, useFetch } from "@/lib/fetch";
import {
  calculateCleanerTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useCleanerStore, useLocationStore } from "@/store";
import { Cleaner, MarkerData } from "@/types/type";

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API_KEY!);

const Map = () => {
  const { userLongitude, userLatitude, serviceLatitude, serviceLongitude } =
    useLocationStore();

  const { selectedCleaner, setCleaners } = useCleanerStore();
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const {
    data: cleaners,
    loading,
    error,
    refetch,
  } = useFetch<Cleaner[]>("/(api)/cleaner");

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
      setCleaners(cleanersWithTimes as MarkerData[]);
    });
  }, [markers, serviceLatitude, serviceLongitude]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (
        !userLatitude ||
        !userLongitude ||
        !serviceLatitude ||
        !serviceLongitude
      )
        return;

      setRouteLoading(true);
      setRouteError(false);

      try {
        const data = await fetchAPI(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLongitude},${userLatitude};${serviceLongitude},${serviceLatitude}?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API_KEY}&geometries=geojson&overview=full`,
        );

        const coords =
          data.routes?.[0]?.geometry?.coordinates?.map(
            ([lng, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            }),
          ) ?? [];

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

  const routeGeoJSON = useMemo(() => {
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

  const onMarkerPress = useCallback(
    (marker: MarkerData) => {
      useCleanerStore.setState({ selectedCleaner: +marker.id });
      cameraRef.current?.flyTo([marker.longitude, marker.latitude], 600);
    },
    [],
  );

  if (loading || (!userLatitude && !userLongitude)) {
    return (
      <View className="flex justify-center items-center w-full h-full">
        <ActivityIndicator size="small" color="black" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex justify-center items-center w-full h-full bg-gray-100 px-6">
        <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
          <Image
            source={icons.map}
            className="w-12 h-12 mb-3 opacity-50"
            tintColor="#9CA3AF"
          />
          <Text className="text-lg font-JakartaBold text-gray-800 mb-1">
            Unable to load map
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-4">
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

  return (
    <View className="flex-1">
      <MapboxGL.MapView
        style={{ flex: 1 }}
        styleURL={MapboxGL.StyleURL.Streets}
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
                selectedCleaner === +marker.id
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
        <View className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full flex-row items-center shadow-sm">
          <ActivityIndicator size="small" color="#3B82F6" className="mr-2" />
          <Text className="text-sm font-JakartaMedium text-gray-700">
            Fetching route...
          </Text>
        </View>
      )}

      {routeError && !routeLoading && (
        <View className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 px-4 py-2 rounded-full">
          <Text className="text-sm font-JakartaMedium text-red-600">
            Failed to load route
          </Text>
        </View>
      )}
    </View>
  );
};

export default Map;
