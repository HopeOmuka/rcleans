import { create } from "zustand";

import {
  CleanerStore,
  LocationStore,
  MarkerData,
  ServiceTypeStore,
} from "@/types/type";

export const useLocationStore = create<LocationStore>((set) => ({
  userLatitude: null,
  userLongitude: null,
  userAddress: null,
  serviceLatitude: null,
  serviceLongitude: null,
  serviceAddress: null,
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

  setServiceLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    set(() => ({
      serviceLatitude: latitude,
      serviceLongitude: longitude,
      serviceAddress: address,
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
  setSelectedCleaner: (cleanerId: string) =>
    set(() => ({ selectedCleaner: cleanerId })),
  setCleaners: (cleaners: MarkerData[]) => set(() => ({ cleaners })),
  clearSelectedCleaner: () => set(() => ({ selectedCleaner: null })),
}));

export const useServiceTypeStore = create<ServiceTypeStore>((set) => ({
  serviceTypes: [],
  selectedServiceType: null,
  setServiceTypes: (serviceTypes) => set(() => ({ serviceTypes })),
  setSelectedServiceType: (selectedServiceType) =>
    set(() => ({ selectedServiceType })),
}));
