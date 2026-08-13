import { create } from "zustand";
import type {
  LocationStore,
  CleanerStore,
  ServiceTypeStore,
  BookingStore,
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
  cleanersLoading: false,
  cleanersError: null,
  setSelectedCleaner: (cleanerId) => set(() => ({ selectedCleaner: cleanerId })),
  setCleaners: (cleaners) =>
    set(() => ({
      cleaners,
    })),
  clearSelectedCleaner: () =>
    set(() => ({
      selectedCleaner: null,
    })),
  setCleanersLoading: (cleanersLoading) => set(() => ({ cleanersLoading })),
  setCleanersError: (cleanersError) => set(() => ({ cleanersError })),
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

export const useBookingStore = create<BookingStore>((set) => ({
  selectedAddons: [],
  appliedPromoCode: null,
  appliedPromoDiscount: 0,
  isScheduled: false,
  scheduledDate: null,
  recurrence: "none",
  specialInstructions: null,
  setBooking: (partial) => set((state) => ({ ...state, ...partial })),
  resetBooking: () =>
    set(() => ({
      selectedAddons: [],
      appliedPromoCode: null,
      appliedPromoDiscount: 0,
      isScheduled: false,
      scheduledDate: null,
      recurrence: "none",
      specialInstructions: null,
    })),
}));
