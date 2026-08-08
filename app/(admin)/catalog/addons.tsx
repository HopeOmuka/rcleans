import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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

import BootstrapIcon from "@/components/BootstrapIcon";
import CustomButton from "@/components/CustomButton";
import { showToast } from "@/components/Toast";
import { ApiResponse, fetchAPI } from "@/lib/fetch";
import { useFetch } from "@/lib/fetch-hook";
import { useTheme } from "@/lib/theme";

interface AddonRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_duration_minutes: number;
  service_type_ids: string[];
  is_active: boolean;
}

interface ServiceTypeOption {
  id: string;
  name: string;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  estimated_duration_minutes: string;
  service_type_ids: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  estimated_duration_minutes: "",
  service_type_ids: [],
};

const Addons = () => {
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
  } = useFetch<AddonRow[]>("/(api)/admin/addons");
  const { data: serviceTypes } = useFetch<ServiceTypeOption[]>(
    "/(api)/admin/service-types",
  );

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

  const toggle = async (item: AddonRow) => {
    setProcessingId(item.id);
    try {
      await fetchAPI<ApiResponse<AddonRow>>(`/(api)/admin/addons/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: item.is_active ? "deactivate" : "activate",
        }),
      });
      showToast(
        item.is_active ? "Addon deactivated" : "Addon activated",
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
    const price = Number(form.price);
    const duration = Number(form.estimated_duration_minutes);
    if (!form.name.trim() || isNaN(price) || price < 0) {
      showToast("Please fill a valid name and price", "error");
      return;
    }
    setSaving(true);
    try {
      await fetchAPI<ApiResponse<AddonRow>>("/(api)/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price,
          estimated_duration_minutes: isNaN(duration) ? 0 : duration,
          service_type_ids: form.service_type_ids,
        }),
      });
      showToast("Addon created", "success");
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
          Addons
        </Text>
        <TouchableOpacity
          onPress={() => {
            setForm(EMPTY_FORM);
            setModalVisible(true);
          }}
          className="px-4 py-2 rounded-lg bg-primary-500"
          accessibilityRole="button"
          accessibilityLabel="Add addon"
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
                    className="text-base font-JakartaSemiBold"
                    style={{ color: theme.colors.text }}
                  >
                    {item.name}
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
                    numberOfLines={2}
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View className="flex-row items-center mt-2">
                  <Text
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    ${item.price.toFixed(2)}
                  </Text>
                  {item.estimated_duration_minutes > 0 && (
                    <Text
                      className="text-sm ml-3"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      +{item.estimated_duration_minutes} min
                    </Text>
                  )}
                </View>
                {item.service_type_ids.length > 0 ? (
                  <View className="flex-row flex-wrap items-center mt-1.5">
                    <Text
                      className="text-xs mr-1.5"
                      style={{ color: theme.colors.textMuted }}
                    >
                      Available:
                    </Text>
                    {item.service_type_ids.map((id) => {
                      const type = serviceTypes?.find((s) => s.id === id);
                      return type ? (
                        <View
                          key={id}
                          className="rounded-full px-2 py-0.5 mr-1.5 mb-1"
                          style={{ backgroundColor: theme.colors.primarySoft }}
                        >
                          <Text
                            className="text-[11px] font-JakartaMedium"
                            style={{ color: theme.colors.primary }}
                          >
                            {type.name}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                ) : (
                  <Text
                    className="text-xs mt-1.5"
                    style={{ color: theme.colors.textMuted }}
                  >
                    Available for all services
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => void toggle(item)}
                  disabled={busy}
                  className={`mt-3 rounded-lg py-2 items-center ${item.is_active ? "" : "bg-primary-500"}`}
                  style={
                    item.is_active
                      ? { backgroundColor: theme.colors.surfaceMuted }
                      : undefined
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${item.is_active ? "Deactivate" : "Activate"} ${item.name}`}
                >
                  <Text
                    className={`text-sm font-JakartaSemiBold ${item.is_active ? "" : "text-white"}`}
                    style={
                      item.is_active ? { color: theme.colors.text } : undefined
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
              Add Addon
            </Text>
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base"
              placeholder="Name (e.g. Carpet Shampoo)"
              placeholderTextColor={theme.colors.textMuted}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
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
            <TextInput
              className="border rounded-lg p-3 mb-2 text-base"
              placeholder="Price"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={form.price}
              onChangeText={(t) => setForm({ ...form, price: t })}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
            <TextInput
              className="border rounded-lg p-3 mb-4 text-base"
              placeholder="Estimated duration (minutes)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={form.estimated_duration_minutes}
              onChangeText={(t) =>
                setForm({ ...form, estimated_duration_minutes: t })
              }
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />

            <Text
              className="text-base font-JakartaSemiBold mb-2"
              style={{ color: theme.colors.text }}
            >
              Available for which services?
            </Text>
            <Text
              className="text-xs mb-2"
              style={{ color: theme.colors.textSecondary }}
            >
              Leave all unselected to offer this add-on with every service.
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {(serviceTypes ?? []).map((type) => {
                const active = form.service_type_ids.includes(type.id);
                return (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        service_type_ids: prev.service_type_ids.includes(
                          type.id,
                        )
                          ? prev.service_type_ids.filter((id) => id !== type.id)
                          : [...prev.service_type_ids, type.id],
                      }))
                    }
                    className={`mr-2 mb-2 px-3 py-1.5 rounded-full border`}
                    style={
                      active
                        ? {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.primarySoft,
                          }
                        : {
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.surface,
                          }
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${active ? "Remove" : "Add"} ${type.name}`}
                  >
                    <Text
                      className={`text-sm font-JakartaMedium ${active ? "" : ""}`}
                      style={{
                        color: active
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                      }}
                    >
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <CustomButton
              title={saving ? "Saving..." : "Create Addon"}
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

export default Addons;
