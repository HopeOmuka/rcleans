import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BootstrapIcon from "@/components/BootstrapIcon";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate, formatDateTime } from "@/lib/utils";
import RescheduleModal from "@/components/RescheduleModal";

interface BookingAddon {
  name: string;
  price: number;
  quantity: number;
}

interface AdminBookingDetail {
  id: string;
  status: string;
  total_price: number;
  discount_amount: number | null;
  payment_status: string;
  created_at: string;
  scheduled_date: string | null;
  matched_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  stripe_payment_intent_id: string | null;
  location_address: string;
  special_instructions: string | null;
  estimated_duration: number;
  actual_duration: number | null;
  service_type_name: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  cleaner_first_name: string | null;
  cleaner_last_name: string | null;
  cleaner_email: string | null;
  cleaner_phone: string | null;
  cleaner_image: string | null;
  addons: BookingAddon[];
  promo_code: {
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  requested: { pill: "bg-amber-100", label: "text-amber-700" },
  matched: { pill: "bg-blue-100", label: "text-blue-700" },
  confirmed: { pill: "bg-blue-100", label: "text-blue-700" },
  arrived: { pill: "bg-indigo-100", label: "text-indigo-700" },
  in_progress: { pill: "bg-cyan-100", label: "text-cyan-700" },
  completed: { pill: "bg-green-100", label: "text-green-700" },
  cancelled: { pill: "bg-red-100", label: "text-red-700" },
  refunded: { pill: "bg-red-100", label: "text-red-700" },
};

const CANCELLABLE = ["requested", "matched", "confirmed"];

const TIMELINE = [
  {
    key: "requested",
    label: "Requested",
    at: (b: AdminBookingDetail) => b.created_at,
  },
  {
    key: "matched",
    label: "Matched",
    at: (b: AdminBookingDetail) => b.matched_at,
  },
  {
    key: "arrived",
    label: "Arrived",
    at: (b: AdminBookingDetail) => b.started_at ?? b.matched_at,
  },
  {
    key: "completed",
    label: "Completed",
    at: (b: AdminBookingDetail) => b.completed_at,
  },
];

const BookingDetail = () => {
  const { theme } = useTheme();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const {
    data: booking,
    loading,
    error,
    refetch,
  } = useFetch<AdminBookingDetail>(`/(api)/admin/bookings/${bookingId}`, {
    enabled: Boolean(bookingId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetchAPI.post<
        ApiResponse<{ status: string; refund_status: string }>
      >(`/(api)/admin/bookings/${bookingId}`, {
        action: "cancel",
        reason: "Cancelled by admin",
      });
      if (res.data) {
        showToast(
          `Booking cancelled${
            res.data.refund_status === "refunded" ? " · payment refunded" : ""
          }`,
          "success",
        );
        setConfirmCancel(false);
        void refetch();
      } else {
        showToast(res.error ?? "Could not cancel booking", "error");
      }
    } catch {
      showToast("Could not cancel booking", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !booking) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color="#4ADE80" />
      </SafeAreaView>
    );
  }

  if ((error || !booking) && !loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text className="text-center" style={{ color: theme.colors.danger }}>
          {error ?? "Booking not found"}
        </Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          className="mt-4 bg-primary-500 px-5 py-2.5 rounded-lg"
        >
          <Text className="text-white font-JakartaMedium">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const style = STATUS_STYLES[booking!.status] ?? STATUS_STYLES.requested;
  const paid = booking!.payment_status === "paid";
  const cancellable = CANCELLABLE.includes(booking!.status);
  const steps = TIMELINE.map((t) => ({ ...t, at: t.at(booking!) }));

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View
        className="flex-row items-center px-4 py-3 border-b"
        style={{
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: theme.colors.surfaceMuted }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BootstrapIcon
            name="chevron-left"
            size={20}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text
          className="text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Booking detail
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className="text-lg font-JakartaSemiBold"
              style={{ color: theme.colors.text }}
            >
              {booking!.service_type_name}
            </Text>
            <View className={`px-3 py-1 rounded-full ${style.pill}`}>
              <Text className={`text-xs font-JakartaSemiBold ${style.label}`}>
                {booking!.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Text
            className="text-xs mt-1"
            style={{ color: theme.colors.textMuted }}
          >
            {booking!.id}
          </Text>
          <View className="flex-row items-center justify-between mt-3">
            <View>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                Booked {formatDateTime(booking!.created_at)}
              </Text>
              {booking!.scheduled_date ? (
                <Text
                  className="text-xs"
                  style={{ color: theme.colors.textMuted }}
                >
                  Scheduled {formatDate(booking!.scheduled_date)}
                </Text>
              ) : null}
            </View>
            <View className="items-end">
              <Text
                className="text-xl font-JakartaBold"
                style={{ color: theme.colors.text }}
              >
                ${Number(booking!.total_price).toFixed(2)}
              </Text>
              <Text
                className={`text-xs font-JakartaSemiBold ${paid ? "text-green-600" : "text-amber-600"}`}
              >
                {booking!.payment_status.replace("_", " ")}
              </Text>
            </View>
          </View>
          <Text
            className="text-sm mt-3"
            style={{ color: theme.colors.textSecondary }}
          >
            {booking!.location_address}
          </Text>
          {booking!.special_instructions ? (
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              Note: {booking!.special_instructions}
            </Text>
          ) : null}
        </View>

        <View
          className="rounded-2xl border p-4 mt-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-sm font-JakartaSemiBold mb-3"
            style={{ color: theme.colors.text }}
          >
            Customer
          </Text>
          <Text
            className="text-base font-JakartaSemiBold"
            style={{ color: theme.colors.text }}
          >
            {booking!.user_name}
          </Text>
          <Text
            className="text-sm mt-0.5"
            style={{ color: theme.colors.textSecondary }}
          >
            {booking!.user_email}
          </Text>
          {booking!.user_phone ? (
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              {booking!.user_phone}
            </Text>
          ) : null}
        </View>

        {booking!.cleaner_first_name ? (
          <View
            className="rounded-2xl border p-4 mt-4"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-sm font-JakartaSemiBold mb-3"
              style={{ color: theme.colors.text }}
            >
              Cleaner
            </Text>
            <View className="flex-row items-center">
              {booking!.cleaner_image ? (
                <Image
                  source={{ uri: booking!.cleaner_image }}
                  className="w-10 h-10 rounded-full"
                  style={{ backgroundColor: theme.colors.surfaceMuted }}
                />
              ) : null}
              <View className="ml-3">
                <Text
                  className="text-base font-JakartaSemiBold"
                  style={{ color: theme.colors.text }}
                >
                  {booking!.cleaner_first_name} {booking!.cleaner_last_name}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {booking!.cleaner_email}
                </Text>
                {booking!.cleaner_phone ? (
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {booking!.cleaner_phone}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        <View
          className="rounded-2xl border p-4 mt-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-sm font-JakartaSemiBold mb-3"
            style={{ color: theme.colors.text }}
          >
            Price breakdown
          </Text>
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {booking!.service_type_name} · ~{booking!.estimated_duration}h
          </Text>
          {booking!.addons.map((a) => (
            <Text
              key={a.name}
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              + {a.name} × {a.quantity} (${Number(a.price).toFixed(2)})
            </Text>
          ))}
          {booking!.promo_code ? (
            <Text className="text-sm text-green-600 mt-1">
              Promo {booking!.promo_code.code} applied
            </Text>
          ) : null}
          <View
            className="mt-3 pt-2 flex-row justify-between"
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <Text
              className="text-base font-JakartaBold"
              style={{ color: theme.colors.text }}
            >
              Total
            </Text>
            <Text
              className="text-base font-JakartaBold"
              style={{ color: theme.colors.text }}
            >
              ${Number(booking!.total_price).toFixed(2)}
            </Text>
          </View>
          {booking!.stripe_payment_intent_id ? (
            <Text
              className="text-[10px] mt-2"
              style={{ color: theme.colors.textMuted }}
            >
              Payment intent: {booking!.stripe_payment_intent_id}
            </Text>
          ) : null}
        </View>

        <View
          className="rounded-2xl border p-4 mt-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-sm font-JakartaSemiBold mb-3"
            style={{ color: theme.colors.text }}
          >
            Timeline
          </Text>
          {steps.map((step, idx) => {
            const reached = Boolean(step.at);
            return (
              <View key={step.key} className="flex-row items-start">
                <View className="items-center mr-3">
                  <View
                    className={`w-4 h-4 rounded-full ${
                      reached ? "bg-primary-500" : ""
                    }`}
                    style={
                      reached
                        ? undefined
                        : { backgroundColor: theme.colors.border }
                    }
                  />
                  {idx < steps.length - 1 ? (
                    <View
                      className={`w-0.5 flex-1 min-h-6 ${
                        reached ? "bg-primary-300" : ""
                      }`}
                      style={
                        reached
                          ? undefined
                          : { backgroundColor: theme.colors.border }
                      }
                    />
                  ) : null}
                </View>
                <View className="pb-4">
                  <Text
                    className="text-sm font-JakartaSemiBold"
                    style={{
                      color: reached
                        ? theme.colors.text
                        : theme.colors.textMuted,
                    }}
                  >
                    {step.label}
                  </Text>
                  {step.at ? (
                    <Text
                      className="text-xs"
                      style={{ color: theme.colors.textMuted }}
                    >
                      {formatDateTime(step.at)}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
          {booking!.cancelled_at ? (
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
              <View>
                <Text
                  className="text-sm font-JakartaSemiBold"
                  style={{ color: theme.colors.danger }}
                >
                  Cancelled
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: theme.colors.textMuted }}
                >
                  {formatDateTime(booking!.cancelled_at)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {cancellable ? (
          <>
            <TouchableOpacity
              onPress={() => setRescheduling(true)}
              accessibilityRole="button"
              accessibilityLabel="Reschedule this booking"
              className="mt-5 py-3.5 rounded-xl items-center border border-primary-300"
            >
              <Text
                className="font-JakartaSemiBold"
                style={{ color: theme.colors.primary }}
              >
                Reschedule booking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmCancel(true)}
              disabled={cancelling}
              accessibilityRole="button"
              accessibilityLabel="Cancel this booking"
              className={`mt-3 py-3.5 rounded-xl items-center ${
                cancelling ? "bg-red-300" : "bg-red-500"
              }`}
            >
              <Text className="text-white font-JakartaSemiBold">
                {cancelling ? "Cancelling..." : "Cancel booking"}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <RescheduleModal
          visible={rescheduling}
          serviceId={booking!.id}
          admin
          currentDate={booking!.scheduled_date}
          onClose={() => setRescheduling(false)}
          onRescheduled={() => void refetch()}
        />

        {confirmCancel ? (
          <View className="absolute inset-0 bg-black/40 items-center justify-center px-8">
            <View
              className="rounded-2xl p-5 w-full max-w-sm"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <Text
                className="text-lg font-JakartaSemiBold"
                style={{ color: theme.colors.text }}
              >
                Cancel this booking?
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {paid
                  ? "Payment will be refunded if captured."
                  : "The customer and assigned cleaner will be notified."}
              </Text>
              <View className="flex-row mt-5">
                <TouchableOpacity
                  onPress={() => setConfirmCancel(false)}
                  className="flex-1 py-3 rounded-xl items-center mr-2"
                  style={{ backgroundColor: theme.colors.surfaceMuted }}
                >
                  <Text
                    className="font-JakartaSemiBold"
                    style={{ color: theme.colors.text }}
                  >
                    Keep
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleCancel()}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-red-500 items-center"
                >
                  <Text className="font-JakartaSemiBold text-white">
                    {cancelling ? "..." : "Cancel"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetail;
