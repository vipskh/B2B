import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { priceRange } from "@/lib/pricing";
import { Product, Vendor } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

const ORANGE = "#FF6A00";

// Shared staggered "bento" product tile used by the home feed and store pages.
export default function BentoProductCard({
  product,
  height = 170,
  showSupplier = true,
}: {
  product: Product;
  height?: number;
  showSupplier?: boolean;
}) {
  const { addToCart, isAddingToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const range = priceRange(product);
  const vendor = typeof product.vendor === "object" ? (product.vendor as Vendor) : null;
  const fav = isInWishlist(product._id);
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const onAdd = () => {
    if (hasVariants) {
      router.push(`/product/${product._id}`); // pick options first
      return;
    }
    addToCart(
      { productId: product._id, quantity: product.moq || 1 },
      {
        onSuccess: () => Alert.alert("Added to cart", `${product.name} ×${product.moq} ${product.unit}`),
        onError: (e: any) => Alert.alert("Error", e?.response?.data?.error || "Failed"),
      }
    );
  };

  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl overflow-hidden"
      activeOpacity={0.85}
      onPress={() => router.push(`/product/${product._id}`)}
    >
      <View>
        <Image source={product.images[0]} style={{ width: "100%", height }} contentFit="cover" />
        <TouchableOpacity
          className="absolute top-2 right-2 bg-black/40 p-2 rounded-full"
          onPress={() => toggleWishlist(product._id)}
        >
          <Ionicons name={fav ? "heart" : "heart-outline"} size={16} color={fav ? "#FF6B6B" : "#fff"} />
        </TouchableOpacity>
        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg">
          <Text className="text-white text-[11px] font-semibold">
            MOQ {product.moq} {product.unit}
          </Text>
        </View>
        {hasVariants && (
          <View className="absolute bottom-2 right-2 px-2 py-1 rounded-lg" style={{ backgroundColor: ORANGE }}>
            <Text className="text-white text-[11px] font-bold">{product.variants!.length} SKUs</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-text-primary font-semibold text-sm" numberOfLines={2}>
          {product.name}
        </Text>
        <View className="flex-row items-end mt-1">
          <Text style={{ color: ORANGE }} className="font-extrabold text-base">
            ${range.min.toFixed(2)}
          </Text>
          {range.isRange && (
            <Text className="text-text-secondary text-xs ml-1 mb-0.5">–${range.max.toFixed(2)}</Text>
          )}
        </View>
        <View className="flex-row items-center justify-between mt-2">
          {showSupplier ? (
            <View className="flex-row items-center flex-1 mr-2">
              {vendor?.verificationStatus === "verified" && (
                <Ionicons name="shield-checkmark" size={11} color={ORANGE} />
              )}
              <Text className="text-text-secondary text-[11px] ml-1" numberOfLines={1}>
                {vendor?.companyName || "Supplier"}
              </Text>
            </View>
          ) : (
            <View className="flex-1" />
          )}
          <TouchableOpacity
            style={{ backgroundColor: ORANGE }}
            className="w-8 h-8 rounded-full items-center justify-center"
            onPress={onAdd}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// helper to split a list into two masonry columns with alternating heights
export function bentoColumns<T>(items: T[]) {
  return {
    left: items.filter((_, i) => i % 2 === 0),
    right: items.filter((_, i) => i % 2 === 1),
  };
}
