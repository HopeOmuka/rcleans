import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from "react-native-maps";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateCleanerTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useCleanerStore, useLocationStore } from "@/store";
import { Cleaner, MarkerData } from "@/types/type";
import { Platform } from "react-native";

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

const Map = () => {
  const { userLongitude, userLatitude, serviceLatitude, serviceLongitude } =
    useLocationStore();

  const { selectedCleaner, setCleaners } = useCleanerStore();

  const {
    data: cleaners,
    loading,
    error,
  } = useFetch<Cleaner[]>("/(api)/cleaner");

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  /**
   * Generate cleaner markers
   */
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

  /**
   * Calculate cleaner times + price
   */
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

  /**
   * Fetch route line from Mapbox
   */
  useEffect(() => {
    const fetchRoute = async () => {
      if (
        !userLatitude ||
        !userLongitude ||
        !serviceLatitude ||
        !serviceLongitude
      )
        return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLongitude},${userLatitude};${serviceLongitude},${serviceLatitude}?access_token=${MAPBOX_API_KEY}&geometries=geojson&overview=full`,
        );

        const data = await res.json();

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
      }
    };

    fetchRoute();
  }, [userLatitude, userLongitude, serviceLatitude, serviceLongitude]);

  /**
   * Map region
   */
  const region = calculateRegion({
    userLatitude,
    userLongitude,
    serviceLatitude,
    serviceLongitude,
  });

  /**
   * Loading state
   */
  if (loading || (!userLatitude && !userLongitude)) {
    return (
      <View className="flex justify-center items-center w-full h-full">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <View className="flex justify-center items-center w-full h-full">
        <Text>Error: {error}</Text>
      </View>
    );
  }

  /**
   * Render map
   */
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      className="w-full h-full rounded-2xl"
      initialRegion={region}
      showsUserLocation
      showsPointsOfInterest={false}
      userInterfaceStyle="light"
      mapType={Platform.OS === "android" ? "standard" : "mutedStandard"}
    >
      {/* Cleaners */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          image={
            selectedCleaner === +marker.id ? icons.selectedMarker : icons.marker
          }
        />
      ))}

      {/* Destination */}
      {serviceLatitude && serviceLongitude && (
        <>
          <Marker
            coordinate={{
              latitude: serviceLatitude,
              longitude: serviceLongitude,
            }}
            title="Destination"
            image={icons.pin}
          />

          {/* Route line */}
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#0286FF"
          />
        </>
      )}
    </MapView>
  );
};

export default Map;
