import { Cleaner, MarkerData } from "@/types/type";

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Cleaner[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((cleaner, index) => {
    const lat = Number(cleaner.location_lat);
    const lng = Number(cleaner.location_lng);

    const hasValidLocation =
      !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

    return {
      latitude: hasValidLocation ? lat : userLatitude + index * 0.005 - 0.01,
      longitude: hasValidLocation ? lng : userLongitude + index * 0.005 - 0.01,
      title: `${cleaner.first_name} ${cleaner.last_name}`,
      rating: Number(cleaner.rating) || 0,
      id: cleaner.id,
      first_name: cleaner.first_name,
      last_name: cleaner.last_name,
      profile_image_url: cleaner.profile_image_url || "",
      specialties: cleaner.specialties || [],
      is_available: cleaner.is_available ?? true,
      time: hasValidLocation ? 10 + index * 5 : 15 + index * 5,
    };
  });
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
}) => {
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

export const calculateCleanerTimes = async ({
  markers,
  serviceLatitude,
  serviceLongitude,
}: {
  markers: MarkerData[];
  serviceLatitude: number | null;
  serviceLongitude: number | null;
}) => {
  if (!serviceLatitude || !serviceLongitude) return markers;

  try {
    const timesPromises = markers.map(async (marker, index) => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${marker.longitude},${marker.latitude};${serviceLongitude},${serviceLatitude}?access_token=${MAPBOX_API_KEY}&geometries=geojson&overview=full`,
        );

        const data = await res.json();

        const timeToService = data.routes?.[0]?.duration ?? 0;
        const totalTime = timeToService / 60;

        return {
          ...marker,
          time: totalTime || 15 + index * 5,
          price: (totalTime * 0.5).toFixed(2),
        };
      } catch {
        return {
          ...marker,
          time: 15 + index * 5,
          price: (15 + index * 5) * 0.5,
        };
      }
    });

    return await Promise.all(timesPromises);
  } catch (err) {
    console.log("Mapbox error:", err);
    return markers.map((marker, index) => ({
      ...marker,
      time: 15 + index * 5,
    }));
  }
};

export const reverseGeocodeWithMapbox = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}&limit=1&types=address,poi,place,neighborhood,locality,region,country`,
    );

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    // Fallback if no results
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (err) {
    console.log("Mapbox reverse geocoding error:", err);
    // Fallback to coordinates if geocoding fails
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

export { MAPBOX_API_KEY };
