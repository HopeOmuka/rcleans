import { create } from "zustand";

import { CleanerStore, LocationStore, MarkerData } from "@/types/type";

export const useLocationStore = create<LocationStore>((set) => ({
  userLatitude: null,
  userLongitude: null,
  userAddress: null,
  destinationLatitude: null,
  destinationLongitude: null,
  destinationAddress: null,
  setUserLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    set(() => ({
      userLatitude: latitude,
      userLongitude: longitude,
      userAddress: address,
    }));

    // if cleaner is selected and now new location is set, clear the selected cleaner
    const { selectedCleaner, clearSelectedCleaner } =
      useCleanerStore.getState();
    if (selectedCleaner) clearSelectedCleaner();
  },

  setDestinationLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    set(() => ({
      destinationLatitude: latitude,
      destinationLongitude: longitude,
      destinationAddress: address,
    }));

    // if cleaner is selected and now new location is set, clear the selected cleaner
    const { selectedCleaner, clearSelectedCleaner } =
      useCleanerStore.getState();
    if (selectedCleaner) clearSelectedCleaner();
  },
}));

export const useCleanerStore = create<CleanerStore>((set) => ({
  cleaners: [] as MarkerData[],
  selectedCleaner: null,
  setSelectedCleaner: (cleanerId: number) =>
    set(() => ({ selectedCleaner: cleanerId })),
  setCleaners: (cleaners: MarkerData[]) => set(() => ({ cleaners })),
  clearSelectedCleaner: () => set(() => ({ selectedCleaner: null })),
}));
