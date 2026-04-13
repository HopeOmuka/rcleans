import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";

import CustomButton from "@/components/CustomButton";
import { fetchAPI } from "@/lib/fetch";

interface PromoCodeInputProps {
  serviceTypeId: string;
  baseAmount: number;
  onPromoApplied: (discountData: {
    discountAmount: number;
    finalAmount: number;
    promoCode: string;
  }) => void;
  onPromoRemoved: () => void;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  serviceTypeId,
  baseAmount,
  onPromoApplied,
  onPromoRemoved,
}) => {
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert("Error", "Please enter a promo code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchAPI("/(api)/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          serviceTypeId,
          orderAmount: baseAmount,
        }),
      });

      if (response.error) {
        Alert.alert("Invalid Code", response.error);
        return;
      }

      setAppliedPromo(response.data);
      onPromoApplied({
        discountAmount: response.data.discountAmount,
        finalAmount: response.data.finalAmount,
        promoCode: promoCode.trim(),
      });

      Alert.alert(
        "Success",
        `Promo code applied! You saved $${response.data.discountAmount}`,
      );
    } catch (error) {
      console.error("Error applying promo code:", error);
      Alert.alert("Error", "Failed to apply promo code");
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
    <View className="p-4 bg-white rounded-lg border border-gray-200 mb-4">
      <Text className="text-lg font-JakartaSemiBold mb-3">Promo Code</Text>

      {!appliedPromo ? (
        <View className="flex-row">
          <TextInput
            className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-base"
            placeholder="Enter promo code"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <CustomButton
            title={loading ? "Applying..." : "Apply"}
            onPress={applyPromoCode}
            className="rounded-l-none rounded-r-lg px-4"
            disabled={loading}
          />
        </View>
      ) : (
        <View className="bg-green-50 border border-green-200 rounded-lg p-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-green-800 font-JakartaSemiBold">
                {appliedPromo.promoCode}
              </Text>
              <Text className="text-green-600 text-sm">
                Save ${appliedPromo.discountAmount}
              </Text>
            </View>
            <TouchableOpacity
              onPress={removePromoCode}
              className="bg-red-500 px-3 py-1 rounded"
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
