import { router, useLocalSearchParams } from "expo-router";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import EmptyState from "@/components/EmptyState";
import BootstrapIcon from "@/components/BootstrapIcon";
import LoadingSpinner from "@/components/LoadingSpinner";
import RatingStars from "@/components/RatingStars";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/utils";
import { Cleaner, CleanerReview } from "@/types/type";

interface CleanerProfileResponse {
  cleaner: Cleaner;
  reviews: CleanerReview[];
}

const CleanerProfile = () => {
  const { theme } = useTheme();
  const { cleanerId } = useLocalSearchParams<{ cleanerId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const { data, loading, error, refetch } = useFetch<CleanerProfileResponse>(
    `/(api)/cleaner/${cleanerId}/reviews`,
    {
      enabled: !!cleanerId,
    },
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        <LoadingSpinner text="Loading cleaner profile..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
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

  if (!data) return null;

  const { cleaner, reviews } = data;

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
          Cleaner Profile
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
          className="rounded-2xl p-4 border mb-4"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-primary-gradient items-center justify-center overflow-hidden">
              {cleaner.profile_image_url ? (
                <Image
                  source={{ uri: cleaner.profile_image_url }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-white text-2xl font-JakartaExtraBold">
                  {cleaner.first_name?.charAt(0) ?? "C"}
                </Text>
              )}
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text
                  className="text-lg font-JakartaSemiBold"
                  style={{ color: theme.colors.text }}
                >
                  {cleaner.first_name} {cleaner.last_name}
                </Text>
                {cleaner.is_available && (
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: theme.colors.primarySoft }}
                  >
                    <Text
                      className="text-xs font-JakartaSemiBold"
                      style={{ color: theme.colors.success }}
                    >
                      Available
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-1">
                <RatingStars rating={cleaner.rating} size={14} />
                <Text
                  className="text-sm ml-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {Number(cleaner.rating).toFixed(1)}
                </Text>
                <Text
                  className="text-xs ml-2"
                  style={{ color: theme.colors.textMuted }}
                >
                  ({cleaner.total_ratings}{" "}
                  {cleaner.total_ratings === 1 ? "review" : "reviews"})
                </Text>
              </View>
              <Text
                className="text-xs mt-1"
                style={{ color: theme.colors.textMuted }}
              >
                {cleaner.completed_jobs} jobs completed •{" "}
                {cleaner.years_experience ?? 0} years experience
              </Text>
            </View>
          </View>
          {cleaner.specialties?.length > 0 && (
            <View className="flex-row flex-wrap mt-3">
              {cleaner.specialties.map((specialty) => (
                <View
                  key={specialty}
                  className="px-2.5 py-1 rounded-full mr-2 mb-2"
                  style={{ backgroundColor: theme.colors.primarySoft }}
                >
                  <Text
                    className="text-xs font-JakartaMedium capitalize"
                    style={{ color: theme.colors.primary }}
                  >
                    {specialty}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-lg font-JakartaBold"
            style={{ color: theme.colors.text }}
          >
            Reviews
          </Text>
          <Text
            className="text-sm"
            style={{ color: theme.colors.textSecondary }}
          >
            {reviews.length}
          </Text>
        </View>

        {reviews.length === 0 ? (
          <View
            className="rounded-2xl p-6 border items-center"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <BootstrapIcon
              name="star"
              size={80}
              color={theme.colors.textMuted}
            />
            <Text
              className="text-sm text-center"
              style={{ color: theme.colors.textSecondary }}
            >
              No reviews yet. This cleaner hasn&apos;t been rated.
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View
              key={review.id}
              className="rounded-2xl p-4 border mb-3"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
                  style={{ backgroundColor: theme.colors.surfaceMuted }}
                >
                  {review.user_avatar ? (
                    <Image
                      source={{ uri: review.user_avatar }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Text
                      className="font-JakartaBold"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {review.user_name?.charAt(0) ?? "U"}
                    </Text>
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="text-sm font-JakartaSemiBold"
                    style={{ color: theme.colors.text }}
                  >
                    {review.user_name}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {review.service_type_name} • {formatDate(review.created_at)}
                  </Text>
                </View>
                <RatingStars rating={review.rating} size={12} />
              </View>
              {review.review_title && (
                <Text
                  className="text-sm font-JakartaSemiBold mt-3"
                  style={{ color: theme.colors.text }}
                >
                  {review.review_title}
                </Text>
              )}
              {review.review_text && (
                <Text
                  className="text-sm mt-1 leading-5"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {review.review_text}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CleanerProfile;
