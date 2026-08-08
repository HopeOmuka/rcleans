import { Image, View } from "react-native";

import { icons } from "@/constants";

const RatingStars = ({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) => (
  <View
    className="flex-row items-center"
    accessibilityLabel={`${rating} star rating`}
  >
    {[1, 2, 3, 4, 5].map((star) => (
      <Image
        key={star}
        source={icons.star}
        style={{
          width: size,
          height: size,
          marginRight: 2,
          tintColor: star <= Math.round(rating) ? "#FBBF24" : "#D1D5DB",
        }}
      />
    ))}
  </View>
);

export default RatingStars;
