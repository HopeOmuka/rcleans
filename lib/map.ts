import { Cleaner, MarkerData } from "@/types/type";

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Cleaner[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((cleaner) => {
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${cleaner.first_name} ${cleaner.last_name}`,
      ...cleaner,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  return {
    latitude: (userLatitude + destinationLatitude) / 2,
    longitude: (userLongitude + destinationLongitude) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3,
    longitudeDelta: (maxLng - minLng) * 1.3,
  };
};

export const calculateCleanerTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  try {
    /**
     * Call destination ONCE
     */
    const destinationRes = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${userLatitude},${userLongitude}|${destinationLatitude},${destinationLongitude}&mode=clean&apiKey=${GEOAPIFY_API_KEY}`,
    );

    const destinationData = await destinationRes.json();

    const timeToDestination =
      destinationData.features?.[0]?.properties?.time ?? 0;

    /**
     * Call each cleaner → user
     */
    const timesPromises = markers.map(async (marker) => {
      const res = await fetch(
        `https://api.geoapify.com/v1/routing?waypoints=${marker.latitude},${marker.longitude}|${userLatitude},${userLongitude}&mode=clean&apiKey=${GEOAPIFY_API_KEY}`,
      );

      const data = await res.json();

      const timeToUser = data.features?.[0]?.properties?.time ?? 0;

      const totalTime = (timeToUser + timeToDestination) / 60;

      const price = (totalTime * 0.5).toFixed(2);

      return {
        ...marker,
        time: totalTime,
        price,
      };
    });

    return await Promise.all(timesPromises);
  } catch (err) {
    console.log("Geoapify error:", err);
  }
};
