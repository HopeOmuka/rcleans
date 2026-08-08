import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Href } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CancelBookingModal from "@/components/CancelBookingModal";
import BootstrapIcon from "@/components/BootstrapIcon";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import RatingStars from "@/components/RatingStars";
import RescheduleModal from "@/components/RescheduleModal";

import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  useBookingStore,
  useCleanerStore,
  useLocationStore,
  useServiceTypeStore,
} from "@/store";
import { ServiceDetail } from "@/types/type";

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-500",
  matched: "bg-blue-500",
  confirmed: "bg-blue-500",
  arrived: "bg-purple-500",
  in_progress: "bg-primary-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-green-500",
  pending: "bg-yellow-500",
  authorized: "bg-blue-500",
  refunded: "bg-gray-500",
  failed: "bg-red-500",
};

const TIMELINE_STEPS: {
  status: string;
  label: string;
  timeKey: string | null;
}[] = [
  { status: "requested", label: "Booking requested", timeKey: "created_at" },
  { status: "matched", label: "Cleaner matched", timeKey: "matched_at" },
  { status: "arrived", label: "Cleaner arrived", timeKey: null },
  { status: "in_progress", label: "Service started", timeKey: "started_at" },
  { status: "completed", label: "Service completed", timeKey: "completed_at" },
];

const CANCELLABLE_STATUSES = ["requested", "matched", "confirmed"];

const ServiceDetails = () => {
  const { theme } = useTheme();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingService, setCancellingService] =
    useState<ServiceDetail | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const { setServiceLocation } = useLocationStore();
  const { setSelectedServiceType } = useServiceTypeStore();

  const {
    data: service,
    loading,
    error,
    refetch,
  } = useFetch<ServiceDetail>(`/(api)/service/${serviceId}`, {
    enabled: !!serviceId,
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  // Poll while focused so cleaner status changes land live.
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => void refetch(), 30_000);
      return () => clearInterval(interval);
    }, [refetch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderTimeline = (svc: ServiceDetail) => {
    const currentIndex = TIMELINE_STEPS.findIndex(
      (step) => step.status === svc.status,
    );
    const completed = svc.status === "completed";

    return (
      <View
        className="rounded-2xl p-4 border mb-4"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          className="text-base font-JakartaSemiBold mb-4"
          style={{ color: theme.colors.text }}
        >
          Progress
        </Text>
        {TIMELINE_STEPS.map((step, i) => {
          const done = completed || i < currentIndex;
          const current = !completed && i === currentIndex;
          return (
            <View key={step.status} className="flex-row">
              <View className="items-center w-6">
                <View
                  style={
                    done
                      ? { backgroundColor: theme.colors.success }
                      : current
                        ? {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primarySoft,
                            borderWidth: 2,
                          }
                        : { backgroundColor: theme.colors.textMuted }
                  }
                  className="w-4 h-4 rounded-full"
                />
                {i < TIMELINE_STEPS.length - 1 && (
                  <View
                    style={{
                      backgroundColor: done
                        ? theme.colors.success
                        : theme.colors.textMuted,
                    }}
                    className="w-0.5 flex-1"
                  />
                )}
              </View>
              <View className="ml-3 pb-6 flex-1">
                <Text
                  className="text-sm font-JakartaMedium"
                  style={{
                    color:
                      done || current
                        ? theme.colors.text
                        : theme.colors.textMuted,
                  }}
                >
                  {step.label}
                </Text>
                {step.timeKey && svc[step.timeKey as keyof ServiceDetail] && (
                  <Text
                    className="text-xs mt-0.5"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {formatDateTime(
                      svc[step.timeKey as keyof ServiceDetail] as string,
                    )}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPriceBreakdown = (svc: ServiceDetail) => (
    <View
      className="rounded-2xl p-4 border mb-4"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text
          className="text-base font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Payment
        </Text>
        <View
          className={`px-2.5 py-1 rounded-full ${PAYMENT_COLORS[svc.payment_status] ?? "bg-gray-500"}`}
        >
          <Text className="text-white text-xs font-JakartaMedium capitalize">
            {svc.payment_status}
          </Text>
        </View>
      </View>
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {svc.service_type?.name}
          </Text>
          <Text
            className="text-sm font-JakartaMedium"
            style={{ color: theme.colors.text }}
          >
            ${Number(svc.service_type?.base_price ?? 0).toFixed(2)}
          </Text>
        </View>
        {svc.addons.map((addon) => (
          <View key={addon.id} className="flex-row justify-between">
            <Text
              className="text-sm"
              style={{ color: theme.colors.textSecondary }}
            >
              {addon.name}
              {addon.quantity > 1 ? ` ×${addon.quantity}` : ""}
            </Text>
            <Text
              className="text-sm font-JakartaMedium"
              style={{ color: theme.colors.text }}
            >
              ${Number(addon.price * addon.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        {svc.promo_code && (
          <View className="flex-row justify-between">
            <Text className="text-sm" style={{ color: theme.colors.success }}>
              Promo ({svc.promo_code})
            </Text>
            <Text
              className="text-sm font-JakartaMedium"
              style={{ color: theme.colors.success }}
            >
              -${Number(svc.discount_amount ?? 0).toFixed(2)}
            </Text>
          </View>
        )}
        <View
          className="pt-2 mt-1"
          style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}
        >
          <View className="flex-row justify-between items-center">
            <Text
              className="text-base font-JakartaSemiBold"
              style={{ color: theme.colors.text }}
            >
              Total
            </Text>
            <Text
              className="text-base font-JakartaBold"
              style={{ color: theme.colors.primaryBright }}
            >
              ${Number(svc.total_price).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
      {svc.status === "completed" && svc.payment_status !== "paid" && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Pay for this service"
          onPress={() =>
            router.push(`/pay-service?serviceId=${svc.id}` as Href)
          }
          className="mt-4 items-center justify-center py-3 rounded-lg bg-accent-500"
        >
          <Text className="text-white font-JakartaMedium">
            Pay ${Number(svc.total_price).toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCleanerCard = (svc: ServiceDetail) => {
    const cleaner = svc.cleaner;
    if (!cleaner) return null;
    return (
      <View
        className="rounded-2xl p-4 border mb-4"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          className="text-base font-JakartaSemiBold mb-3"
          style={{ color: theme.colors.text }}
        >
          Your Cleaner
        </Text>
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-primary-gradient items-center justify-center overflow-hidden">
            {cleaner.profile_image_url ? (
              <Image
                source={{ uri: cleaner.profile_image_url }}
                className="w-full h-full"
              />
            ) : (
              <Text className="text-white text-xl font-JakartaExtraBold">
                {cleaner.first_name?.charAt(0) ?? "C"}
              </Text>
            )}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`View ${cleaner.first_name} ${cleaner.last_name}'s profile and reviews`}
            onPress={() => router.push(`/(root)/cleaner/${cleaner.id}` as Href)}
            className="ml-3 flex-1"
          >
            <Text
              className="text-base font-JakartaSemiBold"
              style={{ color: theme.colors.text }}
            >
              {cleaner.first_name} {cleaner.last_name}
            </Text>
            <View className="flex-row items-center mt-1">
              <BootstrapIcon name="star-fill" size={14} color="#FBBF24" />
              <Text
                className="text-sm ml-1"
                style={{ color: theme.colors.textSecondary }}
              >
                {Number(cleaner.rating).toFixed(1)}
              </Text>
              <Text
                className="text-xs ml-3"
                style={{ color: theme.colors.textMuted }}
              >
                {cleaner.completed_jobs} jobs completed
                {cleaner.total_ratings
                  ? ` · ${cleaner.total_ratings} ratings`
                  : ""}
              </Text>
            </View>
            {cleaner.specialties?.length > 0 && (
              <Text
                className="text-xs mt-1"
                style={{ color: theme.colors.textMuted }}
              >
                {cleaner.specialties.join(", ")}
              </Text>
            )}
            <View className="flex-row items-center mt-1">
              <Text
                className="text-xs font-JakartaMedium"
                style={{ color: theme.colors.primary }}
              >
                View profile &amp; reviews
              </Text>
              <BootstrapIcon
                name="chevron-right"
                size={12}
                color={theme.colors.primary}
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Message ${cleaner.first_name} ${cleaner.last_name}`}
          onPress={() =>
            router.push(
              `/(root)/chat/${svc.id}?otherName=${encodeURIComponent(
                `${cleaner.first_name} ${cleaner.last_name}`,
              )}&otherId=${cleaner.id}` as Href,
            )
          }
          className="mt-4 flex-row items-center justify-center py-2.5 rounded-lg bg-primary-500"
        >
          <BootstrapIcon name="chat-dots" size={18} color="#FFFFFF" />
          <Text className="text-white font-JakartaMedium ml-2">Message</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderActions = (svc: ServiceDetail) => (
    <View className="mb-4">
      {svc.status === "completed" && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Book the same service again"
          onPress={() => {
            useBookingStore.getState().resetBooking();
            useCleanerStore.getState().clearSelectedCleaner();
            setSelectedServiceType(svc.service_type);
            setServiceLocation({
              latitude: svc.location_lat,
              longitude: svc.location_lng,
              address: svc.location_address,
            });
            router.push("/(root)/find-service" as Href);
          }}
          className="items-center justify-center py-3 rounded-lg border mb-3"
          style={{ borderColor: theme.colors.primary }}
        >
          <Text
            className="font-JakartaMedium"
            style={{ color: theme.colors.primary }}
          >
            Book Again
          </Text>
        </TouchableOpacity>
      )}
      {svc.status === "completed" && !svc.rating && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Rate this service"
          onPress={() =>
            router.push(
              `/rate-service?serviceId=${svc.id}&userId=${svc.user_id}&cleanerId=${svc.cleaner_id}` as Href,
            )
          }
          className="items-center justify-center py-3 rounded-lg bg-primary-500 mb-3"
        >
          <Text className="text-white font-JakartaMedium">Rate Service</Text>
        </TouchableOpacity>
      )}
      {CANCELLABLE_STATUSES.includes(svc.status) && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Reschedule this booking"
          onPress={() => setRescheduling(true)}
          className="items-center justify-center py-3 rounded-lg border mb-3"
          style={{ borderColor: theme.colors.primary }}
        >
          <Text
            className="font-JakartaMedium"
            style={{ color: theme.colors.primary }}
          >
            Reschedule
          </Text>
        </TouchableOpacity>
      )}
      {CANCELLABLE_STATUSES.includes(svc.status) && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cancel this booking"
          onPress={() => setCancellingService(svc)}
          className="items-center justify-center py-3 rounded-lg bg-red-500"
        >
          <Text className="text-white font-JakartaMedium">Cancel Booking</Text>
        </TouchableOpacity>
      )}
      {svc.status === "cancelled" && (
        <View
          className="p-3 rounded-lg"
          style={{
            backgroundColor: theme.colors.dangerSoft,
            borderColor: theme.colors.danger,
            borderWidth: 1,
          }}
        >
          <Text
            className="text-sm text-center font-JakartaMedium"
            style={{ color: theme.colors.danger }}
          >
            This booking was cancelled
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && !service) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <LoadingSpinner text="Loading booking details..." />
      </SafeAreaView>
    );
  }

  if (error && !service) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <EmptyState
          title="Something went wrong"
          description={error}
          icon="exclamation-triangle"
          variant="light"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  if (!service) return null;

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
          className="flex-1 text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Booking Details
        </Text>
        <View
          className={`px-3 py-1 rounded-full ${STATUS_COLORS[service.status] ?? "bg-gray-500"}`}
        >
          <Text className="text-white text-xs font-JakartaMedium capitalize">
            {service.status.replaceAll("_", " ")}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View
          className="rounded-2xl p-4 border mb-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            className="text-lg font-JakartaBold"
            style={{ color: theme.colors.text }}
          >
            {service.service_type?.name ?? "Cleaning service"}
          </Text>
          {service.service_type?.description && (
            <Text
              className="text-sm mt-1"
              style={{ color: theme.colors.textSecondary }}
            >
              {service.service_type.description}
            </Text>
          )}
          <View className="flex-row items-center mt-3">
            <BootstrapIcon
              name="calendar"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              className="text-sm ml-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {service.scheduled_date
                ? formatDate(service.scheduled_date)
                : "As soon as possible"}
            </Text>
          </View>
          <View className="flex-row items-center mt-1.5">
            <BootstrapIcon
              name="geo-alt"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              className="text-sm ml-2 flex-1"
              style={{ color: theme.colors.textSecondary }}
            >
              {service.location_address}
            </Text>
          </View>
          <View className="flex-row items-center mt-1.5">
            <BootstrapIcon
              name="clock"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              className="text-sm ml-2"
              style={{ color: theme.colors.textSecondary }}
            >
              {service.estimated_duration} hour
              {Number(service.estimated_duration) === 1 ? "" : "s"} estimated
            </Text>
          </View>
          {service.special_instructions && (
            <View
              className="mt-3 p-3 rounded-lg"
              style={{ backgroundColor: theme.colors.surfaceMuted }}
            >
              <Text
                className="text-xs font-JakartaMedium uppercase"
                style={{ color: theme.colors.textMuted }}
              >
                Instructions
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: theme.colors.text }}
              >
                {service.special_instructions}
              </Text>
            </View>
          )}
        </View>

        {service.status === "cancelled" ? (
          <View
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: theme.colors.dangerSoft,
              borderColor: theme.colors.danger,
              borderWidth: 1,
            }}
          >
            <Text
              className="text-sm text-center font-JakartaMedium"
              style={{ color: theme.colors.danger }}
            >
              This booking was cancelled
            </Text>
          </View>
        ) : (
          renderTimeline(service)
        )}

        {renderCleanerCard(service)}
        {service.rating ? (
          <View
            className="rounded-2xl p-4 border mb-4"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              className="text-base font-JakartaSemiBold mb-3"
              style={{ color: theme.colors.text }}
            >
              Your Review
            </Text>
            <RatingStars rating={service.rating} size={16} />
            {service.review && (
              <Text
                className="text-sm mt-3 leading-5"
                style={{ color: theme.colors.textSecondary }}
              >
                {service.review}
              </Text>
            )}
            {!service.review && (
              <Text
                className="text-sm mt-2"
                style={{ color: theme.colors.textMuted }}
              >
                You rated this service {service.rating} star
                {service.rating === 1 ? "" : "s"}.
              </Text>
            )}
          </View>
        ) : null}
        {renderPriceBreakdown(service)}
        {renderActions(service)}
      </ScrollView>

      <CancelBookingModal
        service={cancellingService}
        onClose={() => setCancellingService(null)}
        onCancelled={() => void refetch()}
      />
      <RescheduleModal
        visible={rescheduling}
        serviceId={service.id}
        currentDate={service.scheduled_date}
        onClose={() => setRescheduling(false)}
        onRescheduled={() => void refetch()}
      />
    </SafeAreaView>
  );
};

export default ServiceDetails;
