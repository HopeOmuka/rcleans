import { create } from "zustand";
import type {
  LocationStore,
  CleanerStore,
  ServiceTypeStore,
} from "@/types/type";

export const useLocationStore = create<LocationStore>((set) => ({
  userLatitude: null,
  userLongitude: null,
  userAddress: null,
  serviceLatitude: null,
  serviceLongitude: null,
  serviceAddress: null,

  setUserLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      userLatitude: latitude,
      userLongitude: longitude,
      userAddress: address,
    })),

  setServiceLocation: ({ latitude, longitude, address }) =>
    set(() => ({
      serviceLatitude: latitude,
      serviceLongitude: longitude,
      serviceAddress: address,
    })),
}));

export const useCleanerStore = create<CleanerStore>((set) => ({
  cleaners: [],
  selectedCleaner: null,
  setSelectedCleaner: (cleanerId) => set(() => ({ selectedCleaner: cleanerId })),
  setCleaners: (cleaners) =>
    set(() => ({
      cleaners,
    })),
  clearSelectedCleaner: () =>
    set(() => ({
      selectedCleaner: null,
    })),
}));

export const useServiceTypeStore = create<ServiceTypeStore>((set) => ({
  serviceTypes: [],
  selectedServiceType: null,
  setServiceTypes: (serviceTypes) =>
    set(() => ({
      serviceTypes,
    })),
  setSelectedServiceType: (serviceType) =>
    set(() => ({
      selectedServiceType: serviceType,
    })),
}));
