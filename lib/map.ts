import { Cleaner, MarkerData } from "@/types/type";
import { fetchAPI } from "@/lib/fetch";

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

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
      latitude: 37.78825,
      longitude: -122.4324,
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

interface DirectionsResponse {
  routes?: Array<{ duration: number }>;
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
      const data = await fetchAPI(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${marker.longitude},${marker.latitude};${serviceLongitude},${serviceLatitude}?access_token=${MAPBOX_API_KEY}&geometries=geojson&overview=full`,
      );
      const directions = data as DirectionsResponse;
      const timeToService = directions.routes?.[0]?.duration ?? 0;
      const totalTime = timeToService / 60;
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (err) {
    console.log("Mapbox error:", err);
  }
};

interface GeocodingFeature {
  place_name: string;
}

interface GeocodingResponse {
  features?: GeocodingFeature[];
}

export const reverseGeocodeWithMapbox = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  if (!MAPBOX_API_KEY) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  try {
    const data = await fetchAPI(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}&limit=1&types=address,poi,place,neighborhood,locality,region,country`,
    );
    const geo = data as GeocodingResponse;
    if (geo.features && geo.features.length > 0) {
      return geo.features[0].place_name;
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (err) {
    console.log("Mapbox reverse geocoding error:", err);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};
