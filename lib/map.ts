import { Cleaner, MarkerData, MapboxGeocodingResponse } from "@/types/type";
import { fetchAPI } from "@/lib/fetch";

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

export const NAIROBI_CBD = {
  latitude: -1.2921,
  longitude: 36.8219,
};

export const DEFAULT_LOCATION = {
  ...NAIROBI_CBD,
  address: "Nairobi, Kenya",
};

// Kenya bounding box (matches the bbox used for Mapbox search)
export const KENYA_BOUNDS = {
  minLatitude: -4.899,
  maxLatitude: 5.506,
  minLongitude: 33.909,
  maxLongitude: 41.905,
};

// Max straight-line distance (km) allowed for driving directions. Beyond
// this the map shows no route instead of hammering the Directions API with
// "Route exceeds maximum distance limitation" errors.
const MAX_ROUTE_DISTANCE_KM = 500;

export const isWithinKenya = (
  latitude: number,
  longitude: number,
): boolean =>
  latitude >= KENYA_BOUNDS.minLatitude &&
  latitude <= KENYA_BOUNDS.maxLatitude &&
  longitude >= KENYA_BOUNDS.minLongitude &&
  longitude <= KENYA_BOUNDS.maxLongitude;

export const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Cleaner[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((cleaner) => ({
    latitude:
      cleaner.location_lat || userLatitude + (Math.random() - 0.5) * 0.01,
    longitude:
      cleaner.location_lng || userLongitude + (Math.random() - 0.5) * 0.01,
    title: `${cleaner.first_name} ${cleaner.last_name}`,
    ...cleaner,
  }));
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  serviceLatitude,
  serviceLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  serviceLatitude?: number | null;
  serviceLongitude?: number | null;
}): Region => {
  if (!userLatitude || !userLongitude) {
    return {
      ...NAIROBI_CBD,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!serviceLatitude || !serviceLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, serviceLatitude);
  const maxLat = Math.max(userLatitude, serviceLatitude);
  const minLng = Math.min(userLongitude, serviceLongitude);
  const maxLng = Math.max(userLongitude, serviceLongitude);

  return {
    latitude: (userLatitude + serviceLatitude) / 2,
    longitude: (userLongitude + serviceLongitude) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3,
    longitudeDelta: (maxLng - minLng) * 1.3,
  };
};

export interface DirectionsResponse {
  routes?: {
    duration: number;
    geometry?: {
      coordinates: number[][];
    };
  }[];
}

export const calculateCleanerTimes = async ({
  markers,
  serviceLatitude,
  serviceLongitude,
}: {
  markers: MarkerData[];
  serviceLatitude: number | null;
  serviceLongitude: number | null;
}): Promise<MarkerData[] | undefined> => {
  if (!serviceLatitude || !serviceLongitude || !MAPBOX_API_KEY) return;

  try {
    const timesPromises = markers.map(async (marker) => {
      if (
        haversineKm(
          marker.latitude,
          marker.longitude,
          serviceLatitude,
          serviceLongitude,
        ) > MAX_ROUTE_DISTANCE_KM
      ) {
        return { ...marker, time: 0, price: "0.00" };
      }

      const data = await fetchAPI<DirectionsResponse>(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${marker.longitude},${marker.latitude};${serviceLongitude},${serviceLatitude}?access_token=${MAPBOX_API_KEY}&geometries=geojson&overview=full`,
      );
      const timeToService = data.routes?.[0]?.duration ?? 0;
      const totalTime = timeToService / 60;
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (err) {
    console.log("Mapbox error:", err);
  }
};

export const reverseGeocodeWithMapbox = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  if (!MAPBOX_API_KEY) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  try {
    const geo = await fetchAPI<MapboxGeocodingResponse>(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}&limit=1&types=address,poi,place,neighborhood,locality,region,country`,
    );
    if (geo.features && geo.features.length > 0) {
      return geo.features[0].place_name;
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (err) {
    console.log("Mapbox reverse geocoding error:", err);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};
