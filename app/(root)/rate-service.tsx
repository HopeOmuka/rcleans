import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import CustomButton from "@/components/CustomButton";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

const RateService = () => {
  const { serviceId, userId, cleanerId } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    setLoading(true);
    try {
      await fetchAPI(`/(api)/service/rate/${serviceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          review,
          userId,
          cleanerId,
        }),
      });

      Alert.alert("Success", "Thank you for your feedback!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => setRating(star)}
        className="mx-1"
      >
        <Image
          source={icons.star}
          className={`w-8 h-8 ${star <= rating ? "tint-yellow-400" : "tint-gray-300"}`}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <ServiceLayout title="Rate Your Service">
      <View className="p-5">
        <Text className="text-xl font-JakartaBold mb-5 text-center">
          How was your cleaning service?
        </Text>

        <View className="flex-row justify-center mb-8">{renderStars()}</View>

        <Text className="text-lg font-JakartaSemiBold mb-3">
          Share your experience (optional)
        </Text>
        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder="Tell us about your experience..."
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-3 mb-5"
          textAlignVertical="top"
        />

        <CustomButton
          title="Submit Rating"
          onPress={handleSubmitRating}
          disabled={loading}
          className="mt-5"
        />
      </View>
    </ServiceLayout>
  );
};

export default RateService;
