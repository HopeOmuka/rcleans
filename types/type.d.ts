import { TextInputProps, TouchableOpacityProps } from "react-native";

declare interface Cleaner {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  rating: number;
  specialties: string[]; // e.g., ['home', 'office', 'deep']
  location_lat: number;
  location_lng: number;
  is_available: boolean;
  completed_jobs: number;
  years_experience: number;
}

declare interface ServiceType {
  id: string;
  name: string; // 'Home Cleaning', 'Office Cleaning', 'Deep Cleaning', etc.
  description: string;
  base_price: number;
  price_per_hour: number;
  estimated_duration_hours: number;
}

declare interface MarkerData {
  latitude: number;
  longitude: number;
  id: string;
  title?: string;
  profile_image_url: string;
  rating: number;
  first_name: string;
  last_name: string;
  specialties: string[];
  time?: number; // estimated arrival time in minutes
  price?: string;
  is_available: boolean;
}

declare interface MapProps {
  serviceLocation?: {
    latitude: number;
    longitude: number;
  };
  onCleanerTimesCalculated?: (cleanersWithTimes: MarkerData[]) => void;
  selectedCleaner?: number | null;
  onMapReady?: () => void;
}

declare interface Service {
  id: string;
  user_id: string;
  cleaner_id?: number;
  service_type_id: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  scheduled_date?: string; // ISO date string for future booking
  estimated_duration: number; // in hours
  actual_duration?: number; // in hours
  status:
    | "requested"
    | "matched"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";
  total_price: number;
  discount_amount?: number;
  promo_code_id?: string;
  payment_status: "pending" | "paid" | "refunded";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  rating?: number;
  review?: string;
  cleaner?: Cleaner;
  service_type: ServiceType;
}

declare interface User {
  id: string;
  name: string;
  email: string;
  clerk_id: string;
  phone?: string;
  created_at: string;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface GoogleInputProps {
  icon?: string;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  handlePress: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
}

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  cleanerId: number;
  serviceTypeId: string;
  estimatedDuration: number;
}

declare interface LocationStore {
  userLatitude: number | null;
  userLongitude: number | null;
  userAddress: string | null;
  serviceLatitude: number | null;
  serviceLongitude: number | null;
  serviceAddress: string | null;
  setUserLocation: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  setServiceLocation: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
}

declare interface GoogleInputProps {
  icon?: string;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  handlePress: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
}

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  cleanerId: number;
  serviceTime: number;
}

declare interface LocationStore {
  userLatitude: number | null;
  userLongitude: number | null;
  userAddress: string | null;
  serviceLatitude: number | null;
  serviceLongitude: number | null;
  serviceAddress: string | null;
  setUserLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  setServiceLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface CleanerStore {
  cleaners: MarkerData[];
  selectedCleaner: string | null;
  setSelectedCleaner: (cleanerId: string) => void;
  setCleaners: (cleaners: MarkerData[]) => void;
  clearSelectedCleaner: () => void;
}

declare interface ServiceTypeStore {
  serviceTypes: ServiceType[];
  selectedServiceType: ServiceType | null;
  setServiceTypes: (serviceTypes: ServiceType[]) => void;
  setSelectedServiceType: (serviceType: ServiceType | null) => void;
}

declare interface CleanerCardProps {
  item: MarkerData;
  selected: string;
  setSelected: () => void;
}
