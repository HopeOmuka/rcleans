import {
  ImageSourcePropType,
  TextInputProps,
  TouchableOpacityProps,
} from "react-native";

declare interface Cleaner {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  rating: number;
  total_ratings?: number;
  specialties: string[]; // e.g., ['home', 'office', 'deep']
  location_lat: number;
  location_lng: number;
  is_available: boolean;
  completed_jobs: number;
  years_experience: number;
}

declare interface CleanerReview {
  id: string;
  rating: number;
  review_text: string | null;
  review_title: string | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  service_type_name: string;
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
  title: string;
  profile_image_url: string;
  rating: number;
  first_name: string;
  last_name: string;
  specialties: string[];
  years_experience?: number;
  time?: number; // estimated arrival time in minutes
  price?: string;
  is_available: boolean;
  total_ratings?: number;
}

declare interface Service {
  id: string;
  user_id: string;
  cleaner_id?: string;
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
    | "confirmed"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";
  total_price: number;
  discount_amount?: number;
  promo_code_id?: string;
  payment_status: "pending" | "authorized" | "paid" | "refunded" | "failed";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  special_instructions?: string;
  rating?: number;
  review?: string;
  cleaner?: Cleaner;
  service_type: ServiceType;
}

declare interface ServiceAddonSelection {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

declare interface ServiceDetail extends Service {
  matched_at: string | null;
  addons: ServiceAddonSelection[];
  promo_code: string | null;
}

declare interface CleanerJobDetail {
  id: string;
  status: string;
  total_price: number;
  payment_status: string;
  scheduled_date: string | null;
  estimated_duration: number;
  actual_duration: number | null;
  location_address: string;
  location_lat: number;
  location_lng: number;
  special_instructions: string | null;
  created_at: string;
  matched_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  discount_amount: number;
  promo_code_id: string | null;
  service_type_name: string;
  service_type_description: string | null;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_avatar: string | null;
  addons: ServiceAddonSelection[];
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
  IconLeft?: React.ComponentType;
  IconRight?: React.ComponentType;
  className?: string;
  loading?: boolean;
}

declare interface GoogleInputProps {
  icon?: string;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  placeholder?: string;
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
  icon?: ImageSourcePropType;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  tintColor?: string;
  className?: string;
}

declare interface SelectedAddon {
  id: string;
  name?: string;
  price?: number;
  estimated_duration_minutes?: number;
  quantity?: number;
}

declare interface PromoDiscount {
  discountAmount: number;
  finalAmount: number;
  promoCode: string;
}

declare interface SavedLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location_type: "home" | "work" | "other";
  is_default: boolean;
}

declare interface MapboxPlace {
  id?: string;
  place_name: string;
  center: [number, number];
}

declare interface MapboxGeocodingResponse {
  features?: MapboxPlace[];
}

declare interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

declare interface CleanerSession {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image_url: string;
  rating: number;
  is_available: boolean;
  completed_jobs: number;
  specialties: string[];
}

declare interface LocationInput {
  latitude: number;
  longitude: number;
  address: string;
}

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  cleanerId?: string;
  serviceTypeId?: string;
  estimatedDuration: number;
  serviceId?: string;
  paymentMode?: "now" | "later";
  addons?: SelectedAddon[];
  promoCode?: string | null;
  scheduledDate?: string | null;
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

declare interface CleanerStore {
  cleaners: MarkerData[];
  selectedCleaner: string | null;
  cleanersLoading: boolean;
  cleanersError: string | null;
  setSelectedCleaner: (cleanerId: string | null) => void;
  setCleaners: (cleaners: MarkerData[]) => void;
  clearSelectedCleaner: () => void;
  setCleanersLoading: (loading: boolean) => void;
  setCleanersError: (error: string | null) => void;
}

declare interface ServiceTypeStore {
  serviceTypes: ServiceType[];
  selectedServiceType: ServiceType | null;
  setServiceTypes: (serviceTypes: ServiceType[]) => void;
  setSelectedServiceType: (serviceType: ServiceType | null) => void;
}

declare interface BookingStore {
  selectedAddons: SelectedAddon[];
  appliedPromoCode: string | null;
  appliedPromoDiscount: number;
  isScheduled: boolean;
  scheduledDate: string | null;
  specialInstructions: string | null;
  setBooking: (partial: Partial<{
    selectedAddons: SelectedAddon[];
    appliedPromoCode: string | null;
    appliedPromoDiscount: number;
    isScheduled: boolean;
    scheduledDate: string | null;
    specialInstructions: string | null;
  }>) => void;
  resetBooking: () => void;
}

declare interface CleanerCardProps {
  item: MarkerData;
  selected: string;
  setSelected: () => void;
  accessibilityLabel?: string;
  onViewProfile?: () => void;
}

declare interface ChatMessage {
  id: string;
  service_id: string;
  sender_id: string;
  sender_type: "user" | "cleaner";
  recipient_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

declare interface ChatConversation {
  service_id: string;
  status: Service["status"];
  scheduled_date: string | null;
  service_type_name: string;
  other_id: string;
  other_name: string;
  other_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

declare interface ChatThreadProps {
  serviceId: string;
  otherName: string;
  recipientId: string;
  role: "user" | "cleaner";
  theme?: "light" | "dark";
}

declare interface NotificationItem {
  id: string;
  user_id: string | null;
  cleaner_id: string | null;
  service_id: string | null;
  type: string;
  title: string;
  message: string;
  data: unknown;
  is_read: boolean;
  created_at: string;
}
