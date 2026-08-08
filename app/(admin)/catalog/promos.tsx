import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { showToast } from "@/components/Toast";
import { icons } from "@/constants";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";
import { formatDate } from "@/lib/utils";

interface PromoRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number;
  usage_count: number;
  max_uses_per_user: number;
  valid_until: string | null;
  is_active: boolean;
}

interface FormState {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: string;
  minimum_order_amount: string;
  valid_until: string;
  max_uses_per_user: string;
}

const EMPTY_FORM: FormState = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  minimum_order_amount: "",
  valid_until: "",
  max_uses_per_user: "1",
};

const Promos = () => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const {
    data: items,
    loading,
    error,
    refetch,
  } = useFetch<PromoRow[]>("/(api)/admin/promos");

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggle = async (item: PromoRow) => {
    setProcessingId(item.id);
    try {
      await fetchAPI<ApiResponse<PromoRow>>(`/(api)/admin/promos/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: item.is_active ? "deactivate" : "activate",
        }),
      });
      showToast(
        item.is_active ? "Promo code deactivated" : "Promo code activated",
        "success",
      );
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreate = async () => {
    const discount_value = Number(form.discount_value);
    if (!form.code.trim() || isNaN(discount_value) || discount_value <= 0) {
      showToast("Please provide a code and valid discount value", "error");
      return;
    }
    if (form.discount_type === "percentage" && discount_value > 100) {
      showToast("Percentage cannot exceed 100", "error");
      return;
    }
    setSaving(true);
    try {
      await fetchAPI<ApiResponse<PromoRow>>("/(api)/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          discount_type: form.discount_type,
          discount_value,
          minimum_order_amount: Number(form.minimum_order_amount) || 0,
          max_uses_per_user: Number(form.max_uses_per_user) || 1,
          valid_until: form.valid_until
            ? new Date(form.valid_until).toISOString()
            : null,
        }),
      });
      showToast("Promo code created", "success");
      setModalVisible(false);
      setForm(EMPTY_FORM);
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Create failed", "error");
    } finally {
      setSaving(false);
    }
  };

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
          <Image
            source={icons.backArrow}
            className="w-5 h-5"
            tintColor={theme.colors.text}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-lg font-JakartaSemiBold"
          style={{ color: theme.colors.text }}
        >
          Promo Codes
        </Text>
        <TouchableOpacity
          onPress={() => {
            setForm(EMPTY_FORM);
            setModalVisible(true);
          }}
          className="px-4 py-2 rounded-lg bg-primary-500"
          accessibilityRole="button"
          accessibilityLabel="Add promo code"
        >
          <Text className="text-white text-sm font-JakartaSemiBold">Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !items ? (
          <ActivityIndicator size="large" color="#4ADE80" className="mt-10" />
        ) : error && !items ? (
          <View className="items-center mt-10 px-6">
            <Text
              className="text-center"
              style={{ color: theme.colors.danger }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => void refetch()}
              className="mt-4 bg-primary-500 px-5 py-2.5 rounded-lg"
            >
              <Text className="text-white font-JakartaMedium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items?.map((item) => {
            const busy = processingId === item.id;
            const expired =
              !!item.valid_until &&
              new Date(item.valid_until).getTime() < Date.now();
            return (
              <View
                key={item.id}
                className="rounded-2xl border p-4 mb-3"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-JakartaBold uppercase"
                    style={{ color: theme.colors.text }}
                  >
                    {item.code}
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: item.is_active
                        ? theme.colors.primarySoft
                        : theme.colors.surfaceMuted,
                    }}
                  >
                    <Text
                      className="text-xs font-JakartaSemiBold"
                      style={{
                        color: item.is_active
                          ? theme.colors.success
                          : theme.colors.textSecondary,
                      }}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
                {item.description ? (
                  <Text
                    className="text-sm mt-1"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View className="flex-row items-center flex-wrap mt-2">
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {item.discount_type === "percentage"
                      ? `${item.discount_value}% off`
                      : `$${item.discount_value.toFixed(2)} off`}
                  </Text>
                  {item.minimum_order_amount > 0 && (
                    <Text
                      className="text-sm ml-3"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Min ${item.minimum_order_amount.toFixed(2)}
                    </Text>
                  )}
                  <Text
                    className="text-sm ml-3"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Used {item.usage_count}x
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <View>
                    {item.valid_until ? (
                      <Text
                        className="text-xs"
                        style={{ color: theme.colors.textMuted }}
                      >
                        Valid until {formatDate(item.valid_until)}
                        {expired ? " (expired)" : ""}
                      </Text>
                    ) : (
                      <Text
                        className="text-xs"
                        style={{ color: theme.colors.textMuted }}
                      >
                        No expiry
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => void toggle(item)}
                    disabled={busy}
                    className={`px-4 py-1.5 rounded-lg ${item.is_active ? "" : "bg-primary-500"}`}
                    style={
                      item.is_active
                        ? { backgroundColor: theme.colors.surfaceMuted }
                        : undefined
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${item.is_active ? "Deactivate" : "Activate"} ${item.code}`}
                  >
                    <Text
                      className={`text-xs font-JakartaSemiBold ${item.is_active ? "" : "text-white"}`}
                      style={
                        item.is_active
                          ? { color: theme.colors.text }
                          : undefined
                      }
                    >
                      {busy
                        ? "Updating..."
                        : item.is_active
                          ? "Deactivate"
                          : "Activate"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <ReactNativeModal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            className="rounded-2xl p-6"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Text
              className="text-xl font-JakartaBold mb-4"
              style={{ color: theme.colors.text }}
            >
              Add Promo Code
            </Text>
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base uppercase"
              placeholder="Code (e.g. SAVE20)"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="characters"
              value={form.code}
              onChangeText={(t) => setForm({ ...form, code: t })}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base"
              placeholder="Description"
              placeholderTextColor={theme.colors.textMuted}
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <View className="flex-row mb-2">
              <TouchableOpacity
                onPress={() =>
                  setForm({ ...form, discount_type: "percentage" })
                }
                className={`flex-1 py-2.5 rounded-lg mr-1 ${form.discount_type === "percentage" ? "bg-primary-500" : ""}`}
                style={
                  form.discount_type === "percentage"
                    ? undefined
                    : { backgroundColor: theme.colors.surfaceMuted }
                }
                accessibilityRole="button"
                accessibilityLabel="Percentage discount"
              >
                <Text
                  className={`text-center text-sm font-JakartaSemiBold ${form.discount_type === "percentage" ? "text-white" : ""}`}
                  style={
                    form.discount_type === "percentage"
                      ? undefined
                      : { color: theme.colors.textSecondary }
                  }
                >
                  Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setForm({ ...form, discount_type: "fixed_amount" })
                }
                className={`flex-1 py-2.5 rounded-lg ml-1 ${form.discount_type === "fixed_amount" ? "bg-primary-500" : ""}`}
                style={
                  form.discount_type === "fixed_amount"
                    ? undefined
                    : { backgroundColor: theme.colors.surfaceMuted }
                }
                accessibilityRole="button"
                accessibilityLabel="Fixed amount discount"
              >
                <Text
                  className={`text-center text-sm font-JakartaSemiBold ${form.discount_type === "fixed_amount" ? "text-white" : ""}`}
                  style={
                    form.discount_type === "fixed_amount"
                      ? undefined
                      : { color: theme.colors.textSecondary }
                  }
                >
                  Fixed $$$
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base"
              placeholder={
                form.discount_type === "percentage"
                  ? "Discount value (e.g. 10)"
                  : "Discount value (e.g. 15.00)"
              }
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={form.discount_value}
              onChangeText={(t) => setForm({ ...form, discount_value: t })}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base"
              placeholder="Minimum order amount"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={form.minimum_order_amount}
              onChangeText={(t) =>
                setForm({ ...form, minimum_order_amount: t })
              }
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base"
              placeholder="Max uses per user (default 1)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={form.max_uses_per_user}
              onChangeText={(t) => setForm({ ...form, max_uses_per_user: t })}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <TextInput
              className="border rounded-lg p-3 mb-4 text-base"
              placeholder="Valid until (ISO date, leave empty for none)"
              placeholderTextColor={theme.colors.textMuted}
              value={form.valid_until}
              onChangeText={(t) => setForm({ ...form, valid_until: t })}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <CustomButton
              title={saving ? "Saving..." : "Create Promo"}
              onPress={handleCreate}
              disabled={saving}
            />
            <CustomButton
              title="Cancel"
              bgVariant="outline"
              textVariant="primary"
              onPress={() => setModalVisible(false)}
              className="mt-2"
            />
          </View>
        </KeyboardAvoidingView>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Promos;
