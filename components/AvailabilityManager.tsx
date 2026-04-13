import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface AvailabilityManagerProps {
  cleanerId: string;
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
}) => {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    try {
      const response = await fetchAPI(
        `/(api)/cleaner/availability?cleanerId=${cleanerId}`,
      );
      if (response.data) {
        setAvailability(response.data);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      Alert.alert("Error", "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [cleanerId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const getAvailabilityForDay = (dayIndex: number) => {
    return availability.find((slot) => slot.day_of_week === dayIndex);
  };

  const toggleDayAvailability = (dayIndex: number) => {
    const existingSlot = getAvailabilityForDay(dayIndex);
    if (existingSlot) {
      setAvailability(
        availability.filter((slot) => slot.day_of_week !== dayIndex),
      );
    } else {
      const newSlot: AvailabilitySlot = {
        id: `temp-${dayIndex}`,
        day_of_week: dayIndex,
        start_time: "09:00",
        end_time: "17:00",
        is_available: true,
      };
      setAvailability([...availability, newSlot]);
    }
  };

  const updateTime = (dayIndex: number, isStartTime: boolean, time: string) => {
    setAvailability(
      availability.map((slot) =>
        slot.day_of_week === dayIndex
          ? { ...slot, [isStartTime ? "start_time" : "end_time"]: time }
          : slot,
      ),
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      for (const slot of availability) {
        await fetchAPI("/(api)/cleaner/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cleanerId,
            dayOfWeek: slot.day_of_week,
            startTime: slot.start_time,
            endTime: slot.end_time,
            isAvailable: slot.is_available,
          }),
        });
      }
      Alert.alert("Success", "Availability updated successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      Alert.alert("Error", "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-dark-500">
        <Text className="text-gray-400">Loading availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-dark-500">
      <Text className="text-white text-2xl font-JakartaBold mb-6">
        Set Your Availability
      </Text>

      {DAYS_OF_WEEK.map((day, index) => {
        const slot = getAvailabilityForDay(index);
        const isAvailable = !!slot;

        return (
          <View
            key={index}
            className="mb-4 p-4 bg-dark-200 rounded-2xl border border-gray-800"
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-JakartaSemiBold text-lg">
                {day}
              </Text>
              <TouchableOpacity
                onPress={() => toggleDayAvailability(index)}
                className={`px-4 py-2 rounded-xl ${
                  isAvailable
                    ? "bg-primary-500/20 border border-primary-500/30"
                    : "bg-dark-300 border border-gray-700"
                }`}
              >
                <Text
                  className={`text-sm font-JakartaMedium ${
                    isAvailable ? "text-primary-500" : "text-gray-400"
                  }`}
                >
                  {isAvailable ? "Available" : "Unavailable"}
                </Text>
              </TouchableOpacity>
            </View>

            {isAvailable && (
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm mb-2">From</Text>
                  <TextInput
                    className="bg-dark-100 p-3 rounded-xl border border-gray-700 text-white text-center"
                    value={slot.start_time}
                    onChangeText={(text) => updateTime(index, true, text)}
                    placeholder="09:00"
                    placeholderTextColor="#666"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm mb-2">To</Text>
                  <TextInput
                    className="bg-dark-100 p-3 rounded-xl border border-gray-700 text-white text-center"
                    value={slot.end_time}
                    onChangeText={(text) => updateTime(index, false, text)}
                    placeholder="17:00"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}

      <CustomButton
        title={saving ? "Saving..." : "Save Availability"}
        onPress={saveAvailability}
        className="mt-6 mb-10"
        disabled={saving}
      />
    </ScrollView>
  );
};

export default AvailabilityManager;
