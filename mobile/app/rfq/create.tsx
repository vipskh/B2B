import SafeScreen from "@/components/SafeScreen";
import { useCreateRFQ } from "@/hooks/useRFQ";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CreateRFQScreen = () => {
  const params = useLocalSearchParams<{ title?: string; category?: string; unit?: string }>();
  const createRFQ = useCreateRFQ();

  const [form, setForm] = useState({
    title: params.title || "",
    description: "",
    category: params.category || "",
    quantity: "",
    unit: params.unit || "piece",
    targetPrice: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const submit = () => {
    if (!form.title || !form.description || !form.quantity) {
      Alert.alert("Missing info", "Title, description and quantity are required");
      return;
    }
    createRFQ.mutate(
      {
        title: form.title,
        description: form.description,
        category: form.category || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
      },
      {
        onSuccess: () => {
          Alert.alert("Request posted", "Suppliers can now send you quotes.");
          router.replace("/rfq");
        },
        onError: () => Alert.alert("Error", "Could not post request"),
      }
    );
  };

  return (
    <SafeScreen>
      <View className="px-6 pt-6 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Request for Quotation</Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 60 }}>
        <Field label="What are you sourcing?">
          <TextInput
            className="bg-surface rounded-xl text-text-primary px-4 py-3"
            placeholder="e.g. Wireless earbuds"
            placeholderTextColor="#888"
            value={form.title}
            onChangeText={set("title")}
          />
        </Field>

        <Field label="Details / specifications">
          <TextInput
            className="bg-surface rounded-xl text-text-primary px-4 py-3 h-24"
            placeholder="Materials, colors, packaging, customization…"
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
            value={form.description}
            onChangeText={set("description")}
          />
        </Field>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Quantity">
              <TextInput
                className="bg-surface rounded-xl text-text-primary px-4 py-3"
                placeholder="1000"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={form.quantity}
                onChangeText={set("quantity")}
              />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Unit">
              <TextInput
                className="bg-surface rounded-xl text-text-primary px-4 py-3"
                placeholder="piece"
                placeholderTextColor="#888"
                value={form.unit}
                onChangeText={set("unit")}
              />
            </Field>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Category (optional)">
              <TextInput
                className="bg-surface rounded-xl text-text-primary px-4 py-3"
                placeholder="Electronics"
                placeholderTextColor="#888"
                value={form.category}
                onChangeText={set("category")}
              />
            </Field>
          </View>
          <View className="flex-1">
            <Field label="Target price (optional)">
              <TextInput
                className="bg-surface rounded-xl text-text-primary px-4 py-3"
                placeholder="$ / unit"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={form.targetPrice}
                onChangeText={set("targetPrice")}
              />
            </Field>
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 mt-4 items-center"
          activeOpacity={0.85}
          onPress={submit}
          disabled={createRFQ.isPending}
        >
          {createRFQ.isPending ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Text className="text-background font-bold text-lg">Post Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-sm mb-2">{label}</Text>
      {children}
    </View>
  );
}

export default CreateRFQScreen;
