import SafeScreen from "@/components/SafeScreen";
import { useVendors } from "@/hooks/useVendors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const VendorsScreen = () => {
  const [search, setSearch] = useState("");
  const { data: vendors = [], isLoading } = useVendors(search.trim() || undefined);

  return (
    <SafeScreen>
      <View className="px-6 pt-6 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Suppliers</Text>
      </View>

      <View className="px-6 pb-4">
        <View className="flex-row items-center bg-surface rounded-2xl px-4">
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            className="flex-1 text-text-primary py-3 px-2"
            placeholder="Search companies"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {vendors.length === 0 ? (
            <Text className="text-text-secondary text-center mt-12">No suppliers found</Text>
          ) : (
            vendors.map((vendor) => (
              <TouchableOpacity
                key={vendor._id}
                className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center"
                activeOpacity={0.8}
                onPress={() => router.push(`/vendor/${vendor.slug}`)}
              >
                <View className="w-14 h-14 rounded-xl bg-background-lighter items-center justify-center overflow-hidden">
                  {vendor.logo ? (
                    <Image source={vendor.logo} style={{ width: 56, height: 56 }} />
                  ) : (
                    <Text className="text-text-primary font-bold text-xl">
                      {vendor.companyName?.[0]}
                    </Text>
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="text-text-primary font-bold flex-1" numberOfLines={1}>
                      {vendor.companyName}
                    </Text>
                    {vendor.verificationStatus === "verified" && (
                      <Ionicons name="shield-checkmark" size={16} color="#FF6A00" />
                    )}
                  </View>
                  <Text className="text-text-secondary text-xs mt-1" numberOfLines={1}>
                    {vendor.businessType?.replace(/_/g, " ")} ·{" "}
                    {[vendor.city, vendor.country].filter(Boolean).join(", ")}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="star" size={12} color="#FFC107" />
                    <Text className="text-text-secondary text-xs ml-1">
                      {vendor.rating?.average?.toFixed(1) ?? "0.0"} · {vendor.totalProducts ?? 0}{" "}
                      products
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeScreen>
  );
};

export default VendorsScreen;
