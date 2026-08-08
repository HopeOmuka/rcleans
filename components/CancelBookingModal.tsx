import { useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

import LoadingSpinner from "@/components/LoadingSpinner";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";
import { Service } from "@/types/type";

interface CancelBookingModalProps {
  service: Service | null;
  onClose: () => void;
  onCancelled?: () => void;
}

const CancelBookingModal = ({
  service,
  onClose,
  onCancelled,
}: CancelBookingModalProps) => {
  const { theme } = useTheme();
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setCancelReason("");
    setCancelling(false);
  }, [service?.id]);

  const handleClose = () => {
    if (cancelling) return;
    onClose();
  };

  const confirmCancel = async () => {
    if (!service || cancelling) return;
    try {
      setCancelling(true);
      const result = await fetchAPI.post<
        ApiResponse<{
          id: string;
          status: string;
          refund_status: "refunded" | "failed" | "not_applicable";
        }>
      >(`/(api)/service/cancel`, {
        serviceId: service.id,
        reason: cancelReason.trim() || undefined,
      });
      if (result.data) {
        if (result.data.refund_status === "refunded") {
          showToast(
            "Booking cancelled. Your payment has been refunded.",
            "success",
          );
        } else if (result.data.refund_status === "failed") {
          showToast(
            "Booking cancelled. The refund could not be processed automatically. Contact support.",
            "error",
          );
        } else {
          showToast("Booking cancelled. No payment was captured.", "success");
        }
        onClose();
        onCancelled?.();
      } else if (result.error) {
        showToast(result.error, "error");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      showToast(message, "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Modal
      visible={!!service}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View
          className="w-full rounded-2xl p-5"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Text
            className="text-lg font-JakartaBold"
            style={{ color: theme.colors.text }}
          >
            Cancel booking?
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {service?.service_type?.name ?? "This booking"}{" "}
            {service?.status === "matched"
              ? "has an assigned cleaner and"
              : "will be cancelled"}{" "}
            {service?.payment_status === "paid"
              ? "— a refund will be issued."
              : service?.payment_status === "authorized"
                ? "— the held payment will be released."
                : "— no payment was made."}
          </Text>
          <TextInput
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Reason (optional)"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={500}
            style={{
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
            className="mt-4 min-h-[80px] p-3 rounded-lg border"
          />
          <View className="flex-row mt-5 gap-3">
            <TouchableOpacity
              onPress={handleClose}
              disabled={cancelling}
              className="flex-1 items-center justify-center py-3 rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            >
              <Text
                className="font-JakartaMedium"
                style={{ color: theme.colors.textSecondary }}
              >
                Keep booking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmCancel}
              disabled={cancelling}
              className="flex-1 items-center justify-center py-3 rounded-lg bg-red-500"
            >
              {cancelling ? (
                <LoadingSpinner size="sm" color="#ffffff" />
              ) : (
                <Text className="font-JakartaMedium text-white">
                  Confirm cancel
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CancelBookingModal;
