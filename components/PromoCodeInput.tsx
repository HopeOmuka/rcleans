import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

import CustomButton from "@/components/CustomButton";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useTheme } from "@/lib/theme";
import { PromoDiscount } from "@/types/type";

interface PromoCodeInputProps {
  serviceTypeId: string;
  baseAmount: number;
  onPromoApplied: (discountData: PromoDiscount) => void;
  onPromoRemoved: () => void;
}

interface PromoValidationResult {
  promoCode: { code: string; id: string };
  discountAmount: number;
  finalAmount: number;
  originalAmount: number;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  serviceTypeId,
  baseAmount,
  onPromoApplied,
  onPromoRemoved,
}) => {
  const { theme } = useTheme();
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoDiscount | null>(null);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      showToast("Please enter a promo code", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAPI<ApiResponse<PromoValidationResult>>(
        "/(api)/promo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: promoCode.trim(),
            serviceTypeId,
            orderAmount: baseAmount,
          }),
        },
      );

      if (!response.data) {
        showToast(response.error || "Invalid promo code", "error");
        return;
      }

      const discountData: PromoDiscount = {
        discountAmount: response.data.discountAmount,
        finalAmount: response.data.finalAmount,
        promoCode: response.data.promoCode.code,
      };

      setAppliedPromo(discountData);
      onPromoApplied(discountData);

      showToast(
        `Promo applied! You saved $${response.data.discountAmount}`,
        "success",
      );
    } catch (error) {
      console.error("Error applying promo code:", error);
      showToast("Failed to apply promo code", "error");
    } finally {
      setLoading(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setAppliedPromo(null);
    onPromoRemoved();
  };

  return (
    <View
      className="p-4 rounded-2xl border-2 mb-4"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        className="text-lg font-JakartaSemiBold mb-3"
        style={{ color: theme.colors.text }}
      >
        Promo Code
      </Text>

      {!appliedPromo ? (
        <View className="flex-row items-center">
          <TextInput
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
            }}
            className="flex-1 border-2 rounded-full px-4 py-3 text-base"
            placeholder="Enter promo code"
            placeholderTextColor={theme.colors.textMuted}
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Promo code input"
          />
          <CustomButton
            title={loading ? "Applying..." : "Apply"}
            onPress={applyPromoCode}
            className="ml-3 px-6"
            disabled={loading}
            loading={loading}
            accessibilityLabel={
              loading ? "Applying promo code" : "Apply promo code"
            }
          />
        </View>
      ) : (
        <View
          className="border-2 rounded-xl p-3"
          style={{
            backgroundColor: theme.colors.success + "14",
            borderColor: theme.colors.success + "55",
          }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text
                className="font-JakartaSemiBold"
                style={{ color: theme.colors.success }}
              >
                {appliedPromo.promoCode}
              </Text>
              <Text className="text-sm" style={{ color: theme.colors.success }}>
                Save ${appliedPromo.discountAmount}
              </Text>
            </View>
            <TouchableOpacity
              onPress={removePromoCode}
              className="bg-danger-500 px-3 py-1.5 rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Remove promo code"
            >
              <Text className="text-white text-sm font-JakartaMedium">
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default PromoCodeInput;
