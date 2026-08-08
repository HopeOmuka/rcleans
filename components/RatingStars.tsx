import { View } from "react-native";

import BootstrapIcon from "@/components/BootstrapIcon";
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
        <BootstrapIcon
          key={star}
          name="star"
          size={size}
          color={
            star <= Math.round(rating) ? "#FBBF24" : theme.colors.textMuted
          }
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
};

export default RatingStars;
