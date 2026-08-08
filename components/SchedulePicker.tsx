import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/lib/theme";

interface SchedulePickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date | null) => void;
  onToggleSchedule?: (scheduled: boolean) => void;
  className?: string;
}

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

function dayLabel(date: Date, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

const SchedulePicker = ({
  selectedDate,
  onSelect,
  onToggleSchedule,
  className,
}: SchedulePickerProps) => {
  const { theme } = useTheme();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const days = useMemo(() => {
    const list: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      list.push(d);
    }
    return list;
  }, []);

  const now = new Date();

  const isTimePast = (day: Date, time: string) => {
    const [h, m] = time.split(":").map(Number);
    const slot = new Date(day);
    slot.setHours(h, m, 0, 0);
    return slot.getTime() <= now.getTime();
  };

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index);
    setSelectedTime(null);
    onSelect(null);
    onToggleSchedule?.(true);
  };

  const handleTimeSelect = (time: string) => {
    if (isTimePast(days[selectedDayIndex], time)) return;
    const day = days[selectedDayIndex];
    const [h, m] = time.split(":").map(Number);
    const slot = new Date(day);
    slot.setHours(h, m, 0, 0);
    setSelectedTime(time);
    onSelect(slot);
  };

  const handleNow = () => {
    setSelectedDayIndex(0);
    setSelectedTime(null);
    onSelect(null);
    onToggleSchedule?.(false);
  };

  useEffect(() => {
    if (selectedDate) {
      const index = Math.max(
        0,
        days.findIndex(
          (d) => d.toDateString() === new Date(selectedDate).toDateString(),
        ),
      );
      setSelectedDayIndex(index >= 0 ? index : 0);
      const hh = String(selectedDate.getHours()).padStart(2, "0");
      const mm = String(selectedDate.getMinutes()).padStart(2, "0");
      const nearest =
        TIME_SLOTS.find((t) => t >= `${hh}:${mm}`) ?? TIME_SLOTS[0];
      setSelectedTime(nearest);
    }
  }, [selectedDate, days]);

  return (
    <View className={className}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
      >
        <TouchableOpacity
          onPress={handleNow}
          style={
            !selectedDate
              ? {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary,
                }
              : {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                }
          }
          className="mr-2 px-4 py-2 rounded-lg border"
        >
          <Text
            className="text-sm font-JakartaMedium"
            style={{
              color: !selectedDate
                ? theme.colors.primaryContrast
                : theme.colors.textSecondary,
            }}
          >
            Now
          </Text>
        </TouchableOpacity>
        {days.map((day, index) => {
          const active = selectedDayIndex === index && !!selectedDate;
          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => handleDaySelect(index)}
              style={
                active
                  ? {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.primary,
                    }
                  : {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    }
              }
              className="mr-2 px-4 py-2 rounded-lg border"
            >
              <Text
                className="text-sm font-JakartaMedium"
                style={{
                  color: active
                    ? theme.colors.primaryContrast
                    : theme.colors.textSecondary,
                }}
              >
                {dayLabel(day, index)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedDate && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TIME_SLOTS.map((time) => {
            const past = isTimePast(days[selectedDayIndex], time);
            const active = selectedTime === time;
            let bg = theme.colors.surface;
            let border = theme.colors.border;
            let fg = theme.colors.textSecondary;
            if (active) {
              bg = theme.colors.primary;
              border = theme.colors.primary;
              fg = theme.colors.primaryContrast;
            } else if (past) {
              bg = theme.colors.surfaceMuted;
              border = theme.colors.border;
              fg = theme.colors.textMuted;
            }
            return (
              <TouchableOpacity
                key={time}
                disabled={past}
                onPress={() => handleTimeSelect(time)}
                style={{
                  backgroundColor: bg,
                  borderColor: border,
                }}
                className="mr-2 px-4 py-2 rounded-lg border"
              >
                <Text
                  className="text-sm font-JakartaMedium"
                  style={{ color: fg }}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selectedDate &&
        !TIME_SLOTS.some((t) => !isTimePast(days[selectedDayIndex], t)) && (
          <Text
            className="text-sm mb-2"
            style={{ color: theme.colors.textMuted }}
          >
            No time slots left for this day. Please pick another day.
          </Text>
        )}
    </View>
  );
};

export default SchedulePicker;
