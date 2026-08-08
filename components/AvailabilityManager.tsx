import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";

import { fetchAPI, ApiResponse } from "@/lib/fetch";
import { AvailabilitySlot } from "@/types/type";

interface AvailabilityManagerProps {
  cleanerId: string;
  onDataChange?: (slots: AvailabilitySlot[]) => void;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  cleanerId,
  onDataChange,
}) => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAPI<ApiResponse<AvailabilitySlot[]>>(
        `/(api)/cleaner/availability?cleanerId=${cleanerId}`,
      );
      if (response.data) {
        setAvailability(response.data);
        onDataChange?.(response.data);
      } else {
        setError(response.error || "Failed to load availability");
      }
    } catch (err) {
      console.error("Error loading availability:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load availability",
      );
    } finally {
      setLoading(false);
    }
  }, [cleanerId, onDataChange]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const getAvailabilityForDay = (dayIndex: number) => {
    return availability.find((slot) => slot.day_of_week === dayIndex);
  };

  const toggleDayAvailability = (dayIndex: number) => {
    const existingSlot = getAvailabilityForDay(dayIndex);

    if (existingSlot) {
      // Remove availability for this day
      const next = availability.filter((slot) => slot.day_of_week !== dayIndex);
      setAvailability(next);
      onDataChange?.(next);
    } else {
      // Add default availability for this day
      const newSlot: AvailabilitySlot = {
        id: `temp-${dayIndex}`,
        day_of_week: dayIndex,
        start_time: "09:00",
        end_time: "17:00",
        is_available: true,
      };
      const next = [...availability, newSlot];
      setAvailability(next);
      onDataChange?.(next);
    }
  };

  const updateTime = (dayIndex: number, isStartTime: boolean, time: string) => {
    const next = availability.map((slot) =>
      slot.day_of_week === dayIndex
        ? {
            ...slot,
            [isStartTime ? "start_time" : "end_time"]: time,
          }
        : slot,
    );
    setAvailability(next);
    onDataChange?.(next);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-400 text-sm mt-3">
          Loading availability...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-8 py-16">
        <View className="bg-dark-200 rounded-2xl border border-red-500/40 p-6 items-center w-full">
          <Text className="text-white text-lg font-JakartaBold text-center mb-1">
            Could not load availability
          </Text>
          <Text className="text-gray-400 text-sm text-center mb-5">
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => void loadAvailability()}
            className="bg-primary-500 px-6 py-2.5 rounded-lg"
          >
            <Text className="text-white font-JakartaMedium">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-JakartaBold mb-6 text-white">
        Set Your Availability
      </Text>

      {DAYS_OF_WEEK.map((day, index) => {
        const slot = getAvailabilityForDay(index);
        const isAvailable = !!slot;

        return (
          <View
            key={index}
            className="mb-4 p-4 bg-dark-200 rounded-lg border border-gray-700"
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-JakartaSemiBold text-white">
                {day}
              </Text>
              <TouchableOpacity
                onPress={() => toggleDayAvailability(index)}
                className={`px-3 py-1 rounded-full ${
                  isAvailable ? "bg-green-500/20" : "bg-dark-300"
                }`}
              >
                <Text
                  className={`text-sm font-JakartaMedium ${
                    isAvailable ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {isAvailable ? "Available" : "Unavailable"}
                </Text>
              </TouchableOpacity>
            </View>

            {isAvailable && (
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-JakartaMedium mr-2 text-gray-400">
                    From:
                  </Text>
                  <TextInput
                    className="flex-1 p-2 bg-dark-300 rounded border border-gray-700 text-center text-white"
                    value={slot.start_time}
                    onChangeText={(text) => updateTime(index, true, text)}
                    placeholder="HH:MM"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-JakartaMedium mr-2 text-gray-400">
                    To:
                  </Text>
                  <TextInput
                    className="flex-1 p-2 bg-dark-300 rounded border border-gray-700 text-center text-white"
                    value={slot.end_time}
                    onChangeText={(text) => updateTime(index, false, text)}
                    placeholder="HH:MM"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

export default AvailabilityManager;
