import SafeScreen from "@/components/SafeScreen";
import { useVendor, useVendorProducts } from "@/hooks/useVendors";
import { useStartConversation } from "@/hooks/useChat";
import BentoProductCard from "@/components/BentoProductCard";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const VendorStoreScreen = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: vendor, isLoading } = useVendor(slug);
  const { data: products = [] } = useVendorProducts(vendor?._id);
  const startConversation = useStartConversation();

  if (isLoading || !vendor) {
    return (
      <SafeScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      </SafeScreen>
    );
  }

  const contact = () =>
    startConversation.mutate(
      { vendorId: vendor._id, text: `Hi ${vendor.companyName}, I'd like to inquire about your products.` },
      {
        onSuccess: (conv) => router.push(`/chat/${conv._id}`),
        onError: () => Alert.alert("Error", "Could not start chat"),
      }
    );

  return (
    <SafeScreen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* banner */}
        <View className="relative h-40 bg-surface">
          {vendor.banner ? (
            <Image source={vendor.banner} style={{ width: "100%", height: 160 }} contentFit="cover" />
          ) : null}
          <TouchableOpacity
            className="absolute top-12 left-6 bg-black/50 w-11 h-11 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* header */}
        <View className="px-6 -mt-8">
          <View className="flex-row items-end">
            <View className="w-20 h-20 rounded-2xl bg-background-lighter border-2 border-background items-center justify-center overflow-hidden">
              {vendor.logo ? (
                <Image source={vendor.logo} style={{ width: 80, height: 80 }} />
              ) : (
                <Text className="text-text-primary font-bold text-3xl">{vendor.companyName?.[0]}</Text>
              )}
            </View>
          </View>

          <View className="flex-row items-center mt-3">
            <Text className="text-text-primary text-2xl font-bold flex-1">{vendor.companyName}</Text>
            {vendor.verificationStatus === "verified" && (
              <View className="flex-row items-center bg-primary/20 px-2 py-1 rounded-full">
                <Ionicons name="shield-checkmark" size={14} color="#FF6A00" />
                <Text className="text-primary text-xs font-bold ml-1">Verified</Text>
              </View>
            )}
          </View>

          <Text className="text-text-secondary text-sm mt-1">
            {vendor.businessType?.replace(/_/g, " ")} ·{" "}
            {[vendor.city, vendor.country].filter(Boolean).join(", ")}
            {vendor.yearEstablished ? ` · Est. ${vendor.yearEstablished}` : ""}
          </Text>

          {/* stats — bento tiles */}
          <View className="flex-row gap-2 mt-4">
            <Stat label="Rating" value={vendor.rating?.average?.toFixed(1) ?? "0.0"} />
            <Stat label="Products" value={String(vendor.totalProducts ?? products.length)} />
            <Stat label="Response" value={`${vendor.responseRate ?? 0}%`} />
          </View>

          {vendor.badges && vendor.badges.length > 0 && (
            <View className="flex-row flex-wrap mt-3">
              {vendor.badges.map((b) => (
                <View key={b} className="bg-primary/20 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text className="text-primary text-xs font-bold">{b.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          )}

          {vendor.description ? (
            <Text className="text-text-secondary text-sm leading-6 mt-3">{vendor.description}</Text>
          ) : null}

          <TouchableOpacity
            className="bg-primary rounded-2xl py-3 mt-4 flex-row items-center justify-center"
            activeOpacity={0.85}
            onPress={contact}
            disabled={startConversation.isPending}
          >
            {startConversation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">Contact Supplier</Text>
              </>
            )}
          </TouchableOpacity>

          {/* products — bento */}
          <Text className="text-text-primary text-lg font-bold mt-6 mb-3">
            Products ({products.length})
          </Text>
          {products.length === 0 ? (
            <Text className="text-text-secondary text-center w-full mt-4">No products yet</Text>
          ) : (
            <View className="flex-row gap-3">
              <View className="flex-1 gap-3">
                {products
                  .filter((_, i) => i % 2 === 0)
                  .map((p, i) => (
                    <BentoProductCard
                      key={p._id}
                      product={p}
                      height={i % 2 === 0 ? 180 : 140}
                      showSupplier={false}
                    />
                  ))}
              </View>
              <View className="flex-1 gap-3">
                {products
                  .filter((_, i) => i % 2 === 1)
                  .map((p, i) => (
                    <BentoProductCard
                      key={p._id}
                      product={p}
                      height={i % 2 === 0 ? 140 : 180}
                      showSupplier={false}
                    />
                  ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center bg-surface rounded-2xl py-4">
      <Text className="text-text-primary font-bold text-lg">{value}</Text>
      <Text className="text-text-secondary text-xs mt-0.5">{label}</Text>
    </View>
  );
}

export default VendorStoreScreen;
