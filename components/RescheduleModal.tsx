import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import LoadingSpinner from "@/components/LoadingSpinner";
import SchedulePicker from "@/components/SchedulePicker";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";
import { formatDateTime } from "@/lib/utils";

interface RescheduleModalProps {
  visible: boolean;
  serviceId: string;
  admin?: boolean;
  currentDate?: string | null;
  onClose: () => void;
  onRescheduled?: () => void;
}

const RescheduleModal = ({
  visible,
  serviceId,
  admin,
  currentDate,
  onClose,
  onRescheduled,
}: RescheduleModalProps) => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const next = currentDate ? new Date(currentDate) : null;
    setSelectedDate(next && !isNaN(next.getTime()) ? next : null);
    setSaving(false);
  }, [visible, currentDate]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const confirmReschedule = async () => {
    if (!selectedDate || saving) return;
    try {
      setSaving(true);
      const scheduledDate = selectedDate.toISOString();
      const result = admin
        ? await fetchAPI.post<ApiResponse<{ id: string; status: string }>>(
            `/(api)/admin/bookings/${serviceId}`,
            { action: "reschedule", scheduledDate },
          )
        : await fetchAPI.post<ApiResponse<{ id: string; status: string }>>(
            `/(api)/service/reschedule`,
            { serviceId, scheduledDate },
          );
      if (result.data) {
        showToast(
          `Booking rescheduled to ${formatDateTime(scheduledDate)}`,
          "success",
        );
        onClose();
        onRescheduled?.();
      } else if (result.error) {
        showToast(result.error, "error");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
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
            Reschedule booking
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {currentDate
              ? `Current: ${formatDateTime(currentDate)}`
              : "This service has no scheduled slot set yet."}
          </Text>
          <Text
            className="text-sm mt-3 mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            Pick a new date and time.
          </Text>
          <SchedulePicker
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
          <View className="flex-row mt-5 gap-3">
            <TouchableOpacity
              onPress={handleClose}
              disabled={saving}
              className="flex-1 items-center justify-center py-3 rounded-lg border"
              style={{ borderColor: theme.colors.border }}
            >
              <Text
                className="font-JakartaMedium"
                style={{ color: theme.colors.textSecondary }}
              >
                Keep
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmReschedule}
              disabled={saving || !selectedDate}
              style={{
                backgroundColor: selectedDate
                  ? theme.colors.primary
                  : theme.colors.textMuted,
              }}
              className="flex-1 items-center justify-center py-3 rounded-lg"
            >
              {saving ? (
                <LoadingSpinner size="sm" color="#ffffff" />
              ) : (
                <Text className="font-JakartaMedium text-white">
                  Reschedule
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RescheduleModal;
