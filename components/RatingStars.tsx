import { Image, View } from "react-native";

import { icons } from "@/constants";
import { useTheme } from "@/lib/theme";

const RatingStars = ({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) => {
  const { theme } = useTheme();
  return (
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
            tintColor:
              star <= Math.round(rating) ? "#FBBF24" : theme.colors.textMuted,
          }}
        />
      ))}
    </View>
  );
};

export default RatingStars;
