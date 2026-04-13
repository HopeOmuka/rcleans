import { View, Text } from "react-native";

const Payment = ({ amount, estimatedDuration }: any) => {
  return (
    <View>
      <Text className="text-white text-lg font-JakartaSemiBold mb-3">
        Payment
      </Text>
      <View className="bg-dark-200 p-4 rounded-lg border border-gray-700 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-400">Service</Text>
          <Text className="text-white font-JakartaSemiBold">Cleaning</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-400">Duration</Text>
          <Text className="text-white">{estimatedDuration} hours</Text>
        </View>
        <View className="flex-row justify-between border-t border-gray-700 pt-2 mt-2">
          <Text className="text-white font-JakartaBold">Total</Text>
          <Text className="text-primary-500 text-xl font-JakartaBold">
            ${amount}
          </Text>
        </View>
      </View>
      <View className="bg-dark-200 p-4 rounded-lg border border-gray-700">
        <Text className="text-gray-400 text-center">Use mobile app to pay</Text>
      </View>
    </View>
  );
};

export default Payment;
