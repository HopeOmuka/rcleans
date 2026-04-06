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
      // Remove availability for this day
      setAvailability(
        availability.filter((slot) => slot.day_of_week !== dayIndex),
      );
    } else {
      // Add default availability for this day
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
          ? {
              ...slot,
              [isStartTime ? "start_time" : "end_time"]: time,
            }
          : slot,
      ),
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      // Save each availability slot
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
      <View className="flex-1 justify-center items-center">
        <Text>Loading availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-2xl font-JakartaBold mb-6">
        Set Your Availability
      </Text>

      {DAYS_OF_WEEK.map((day, index) => {
        const slot = getAvailabilityForDay(index);
        const isAvailable = !!slot;

        return (
          <View
            key={index}
            className="mb-4 p-4 bg-white rounded-lg border border-gray-200"
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-JakartaSemiBold">{day}</Text>
              <TouchableOpacity
                onPress={() => toggleDayAvailability(index)}
                className={`px-3 py-1 rounded-full ${
                  isAvailable ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-JakartaMedium ${
                    isAvailable ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {isAvailable ? "Available" : "Unavailable"}
                </Text>
              </TouchableOpacity>
            </View>

            {isAvailable && (
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-JakartaMedium mr-2">From:</Text>
                  <TextInput
                    className="flex-1 p-2 bg-gray-50 rounded border text-center"
                    value={slot.start_time}
                    onChangeText={(text) => updateTime(index, true, text)}
                    placeholder="HH:MM"
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-JakartaMedium mr-2">To:</Text>
                  <TextInput
                    className="flex-1 p-2 bg-gray-50 rounded border text-center"
                    value={slot.end_time}
                    onChangeText={(text) => updateTime(index, false, text)}
                    placeholder="HH:MM"
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
        className="mt-6"
        disabled={saving}
      />
    </ScrollView>
  );
};

export default AvailabilityManager;
