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
    <View className="p-4 bg-dark-200 rounded-2xl border border-gray-800 mb-4">
      <Text className="text-white font-JakartaSemiBold mb-3">Promo Code</Text>

      {!appliedPromo ? (
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-dark-100 border border-gray-700 rounded-xl px-4 py-3 text-base text-white placeholder-gray-500"
            placeholder="Enter promo code"
            placeholderTextColor="#666"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={applyPromoCode}
            disabled={loading}
            className="bg-primary-500 px-4 py-3 rounded-xl justify-center"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <Text className="text-white font-JakartaSemiBold">
              {loading ? "..." : "Apply"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-3">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-primary-500 font-JakartaSemiBold">
                {appliedPromo.promoCode}
              </Text>
              <Text className="text-green-400 text-sm">
                Save ${appliedPromo.discountAmount}
              </Text>
            </View>
            <TouchableOpacity
              onPress={removePromoCode}
              className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/30"
            >
              <Text className="text-red-400 text-sm font-JakartaMedium">
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
