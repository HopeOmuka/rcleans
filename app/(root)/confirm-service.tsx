import { router } from "expo-router";
import { FlatList, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import CleanerCard from "@/components/CleanerCard";
import ServiceLayout from "@/components/ServiceLayout";
import { useCleanerStore } from "@/store";

const ConfirmService = () => {
  const { cleaners, selectedCleaner, setSelectedCleaner } = useCleanerStore();

  return (
    <ServiceLayout title={"Choose a Servicer"} snapPoints={["65%", "85%"]}>
      <FlatList
        data={cleaners}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <CleanerCard
            item={item}
            selected={selectedCleaner!}
            setSelected={() => setSelectedCleaner(item.id!)}
          />
        )}
        ListFooterComponent={() => (
          <View className="mx-5 mt-10">
            <CustomButton
              title="Select Service"
              onPress={() => router.push("/(root)/book-service")}
            />
          </View>
        )}
      />
    </ServiceLayout>
  );
};

export default ConfirmService;
