import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import CustomButton from "@/components/CustomButton";
import ServiceLayout from "@/components/ServiceLayout";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { showToast } from "@/components/Toast";

const MAX_REVIEW_LENGTH = 500;

const StarButton = ({
  star,
  isSelected,
  onPress,
}: {
  star: number;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="mx-1"
      accessibilityLabel={`Rate ${star} star${star > 1 ? "s" : ""}`}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Image
          source={icons.star}
          className="w-8 h-8"
          style={{ tintColor: isSelected ? "#FBBF24" : "#D1D5DB" }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const RateService = () => {
  const { serviceId, userId, cleanerId } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
    };
  }, []);

  const handleStarPress = useCallback((star: number) => {
    setRating(star);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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

      showToast("Thank you for your feedback!", "success");
      navigationTimeout.current = setTimeout(() => router.back(), 1500);
    } catch {
      showToast("Failed to submit rating. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ServiceLayout title="Rate Your Service">
      <View className="p-5">
        <Text className="text-xl font-JakartaBold mb-5 text-center">
          How was your cleaning service?
        </Text>

        <View className="flex-row justify-center mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarButton
              key={star}
              star={star}
              isSelected={star <= rating}
              onPress={() => handleStarPress(star)}
            />
          ))}
        </View>

        <Text className="text-lg font-JakartaSemiBold mb-3">
          Share your experience (optional)
        </Text>
        <TextInput
          value={review}
          onChangeText={(text) => {
            if (text.length <= MAX_REVIEW_LENGTH) {
              setReview(text);
            }
          }}
          placeholder="Tell us about your experience..."
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-3 mb-1"
          textAlignVertical="top"
        />
        <Text className="text-xs text-gray-400 text-right mb-5">
          {review.length}/{MAX_REVIEW_LENGTH}
        </Text>

        <CustomButton
          title={loading ? "Submitting..." : "Submit Rating"}
          onPress={handleSubmitRating}
          disabled={loading}
          className="mt-5"
          accessibilityLabel="Submit your rating and review"
        />
        {loading && (
          <ActivityIndicator size="small" color="#22C55E" className="mt-3" />
        )}
      </View>
    </ServiceLayout>
  );
};

export default RateService;
