import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import useWishlist from "@/hooks/useWishlist";
import { useStartConversation } from "@/hooks/useChat";
import { resolveUnitPrice } from "@/lib/pricing";
import { Vendor } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const ORANGE = "#FF6A00";

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isError, isLoading } = useProduct(id);
  const { addToCart, isAddingToCart } = useCart();
  const startConversation = useStartConversation();
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product?.moq) setQuantity(product.moq);
  }, [product?.moq]);

  // resolve the SKU variant matching the chosen options (hook stays top-level)
  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return (
      product.variants.find((v) =>
        Object.entries(v.options).every(([k, val]) => selectedOptions[k] === val)
      ) || null
    );
  }, [product, selectedOptions]);

  if (isLoading) return <LoadingUI />;
  if (isError || !product) return <ErrorUI />;

  const moq = product.moq || 1;
  const unit = product.unit || "piece";
  const vendor = typeof product.vendor === "object" ? (product.vendor as Vendor) : null;

  const hasVariants = (product.variants?.length ?? 0) > 0;
  const allChosen = !hasVariants || (product.variantOptions || []).every((o) => selectedOptions[o.name]);

  const minVariant = hasVariants ? Math.min(...product.variants!.map((v) => v.price)) : product.price;
  const unitPrice = hasVariants
    ? selectedVariant
      ? selectedVariant.price
      : minVariant
    : resolveUnitPrice(product, quantity);

  const maxQty = hasVariants ? selectedVariant?.stock ?? Infinity : product.stock;
  const inStock = hasVariants ? (selectedVariant ? selectedVariant.stock > 0 : true) : product.stock > 0;

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      Alert.alert("Select options", "Please choose all product options");
      return;
    }
    if (quantity < moq) {
      Alert.alert("Minimum order", `MOQ is ${moq} ${unit}(s)`);
      return;
    }
    addToCart(
      {
        productId: product._id,
        quantity,
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              options: selectedVariant.options,
              price: selectedVariant.price,
              image: selectedVariant.image,
            }
          : null,
      },
      {
        onSuccess: () => Alert.alert("Added to cart", `${product.name} ×${quantity}`),
        onError: (error: any) =>
          Alert.alert("Error", error?.response?.data?.error || "Failed to add to cart"),
      }
    );
  };

  const handleContactSupplier = () => {
    if (!vendor) return;
    startConversation.mutate(
      { vendorId: vendor._id, productId: product._id, text: `Hi, I'm interested in "${product.name}".` },
      {
        onSuccess: (conv) => router.push(`/chat/${conv._id}`),
        onError: () => Alert.alert("Error", "Could not start chat"),
      }
    );
  };

  const handleRequestQuote = () =>
    router.push({ pathname: "/rfq/create", params: { title: product.name, category: product.category, unit } });

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-20 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="bg-black/50 w-12 h-12 rounded-full items-center justify-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isInWishlist(product._id) ? "bg-primary" : "bg-black/50"
          }`}
          onPress={() => toggleWishlist(product._id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isInWishlist(product._id) ? "heart" : "heart-outline"}
              size={24}
              color={isInWishlist(product._id) ? "#fff" : "#FFFFFF"}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* IMAGE GALLERY */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setSelectedImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {product.images.map((image: string, index: number) => (
              <View key={index} style={{ width }}>
                <Image source={image} style={{ width, height: 400 }} contentFit="cover" />
              </View>
            ))}
          </ScrollView>
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {product.images.map((_: any, index: number) => (
              <View
                key={index}
                className={`h-2 rounded-full ${index === selectedImageIndex ? "bg-primary w-6" : "bg-white/50 w-2"}`}
              />
            ))}
          </View>
        </View>

        <View className="p-6">
          <View className="flex-row items-center mb-3">
            <View className="bg-primary/20 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-bold">{product.category}</Text>
            </View>
          </View>

          <Text className="text-text-primary text-3xl font-bold mb-3">{product.name}</Text>

          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-surface px-3 py-2 rounded-full">
              <Ionicons name="star" size={16} color="#FFC107" />
              <Text className="text-text-primary font-bold ml-1 mr-2">
                {product.averageRating.toFixed(1)}
              </Text>
              <Text className="text-text-secondary text-sm">({product.totalReviews} reviews)</Text>
            </View>
            {inStock ? (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-500 font-semibold text-sm">
                  {hasVariants ? (selectedVariant ? `${selectedVariant.stock} in stock` : "In stock") : `${product.stock} in stock`}
                </Text>
              </View>
            ) : (
              <View className="ml-3 flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                <Text className="text-red-500 font-semibold text-sm">Out of Stock</Text>
              </View>
            )}
          </View>

          {/* PRICE + MOQ */}
          <View className="flex-row items-end mb-2">
            {hasVariants && !selectedVariant && (
              <Text className="text-text-secondary text-base mb-1 mr-1">from</Text>
            )}
            <Text style={{ color: ORANGE }} className="text-4xl font-bold">
              ${unitPrice.toFixed(2)}
            </Text>
            <Text className="text-text-secondary text-base mb-1 ml-1">/ {unit}</Text>
          </View>
          <Text className="text-text-secondary text-sm mb-5">
            Min. order: {moq} {unit}
            {moq > 1 ? "s" : ""}
          </Text>

          {/* VARIANT SELECTORS (bento) */}
          {hasVariants &&
            (product.variantOptions || []).map((opt) => (
              <View key={opt.name} className="mb-4">
                <Text className="text-text-primary font-bold mb-2">{opt.name}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {opt.values.map((val) => {
                    const sel = selectedOptions[opt.name] === val;
                    return (
                      <TouchableOpacity
                        key={val}
                        onPress={() => setSelectedOptions({ ...selectedOptions, [opt.name]: val })}
                        className="px-5 py-2.5 rounded-2xl border"
                        style={{
                          borderColor: sel ? ORANGE : "#3E3E3E",
                          backgroundColor: sel ? ORANGE + "22" : "transparent",
                        }}
                      >
                        <Text style={{ color: sel ? ORANGE : "#fff" }} className="font-semibold">
                          {val}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

          {/* WHOLESALE PRICE TIERS (flat products only) */}
          {!hasVariants && product.priceTiers?.length > 0 && (
            <View className="bg-surface rounded-2xl p-4 mb-6">
              <Text className="text-text-primary font-bold mb-3">Wholesale Price Breaks</Text>
              <View className="flex-row">
                {product.priceTiers.map((tier, i) => {
                  const active = quantity >= tier.minQty;
                  return (
                    <View
                      key={i}
                      className="flex-1 items-center py-2 rounded-xl mx-1"
                      style={{ backgroundColor: active ? ORANGE + "22" : "transparent" }}
                    >
                      <Text className="text-text-secondary text-xs">≥{tier.minQty}</Text>
                      <Text className="font-bold mt-1" style={{ color: active ? ORANGE : "#fff" }}>
                        ${tier.price.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* SUPPLIER CARD */}
          {vendor && (
            <TouchableOpacity
              className="bg-surface rounded-2xl p-4 mb-6 flex-row items-center"
              onPress={() => router.push(`/vendor/${vendor.slug}`)}
            >
              <View className="w-12 h-12 rounded-xl bg-background-lighter items-center justify-center overflow-hidden">
                {vendor.logo ? (
                  <Image source={vendor.logo} style={{ width: 48, height: 48 }} />
                ) : (
                  <Text className="text-text-primary font-bold text-lg">{vendor.companyName?.[0]}</Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-text-primary font-bold" numberOfLines={1}>
                    {vendor.companyName}
                  </Text>
                  {vendor.verificationStatus === "verified" && (
                    <Ionicons name="shield-checkmark" size={14} color={ORANGE} style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text className="text-text-secondary text-xs mt-0.5">
                  {[vendor.city, vendor.country].filter(Boolean).join(", ") || "Supplier"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* QUANTITY */}
          <View className="mb-6">
            <Text className="text-text-primary text-lg font-bold mb-3">Quantity</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="bg-surface rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity(Math.max(moq, quantity - 1))}
                disabled={!inStock}
              >
                <Ionicons name="remove" size={24} color={inStock ? "#FFFFFF" : "#666"} />
              </TouchableOpacity>
              <Text className="text-text-primary text-xl font-bold mx-6">{quantity}</Text>
              <TouchableOpacity
                className="bg-primary rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity(Math.min(maxQty, quantity + 1))}
                disabled={!inStock || quantity >= maxQty}
              >
                <Ionicons name="add" size={24} color={!inStock || quantity >= maxQty ? "#666" : "#fff"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTACT / RFQ */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              className="flex-1 bg-surface rounded-2xl py-4 flex-row items-center justify-center"
              onPress={handleContactSupplier}
              disabled={!vendor || startConversation.isPending}
            >
              {startConversation.isPending ? (
                <ActivityIndicator size="small" color={ORANGE} />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={ORANGE} />
                  <Text className="text-primary font-bold ml-2">Contact</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface rounded-2xl py-4 flex-row items-center justify-center"
              onPress={handleRequestQuote}
            >
              <Ionicons name="document-text-outline" size={20} color={ORANGE} />
              <Text className="text-primary font-bold ml-2">Request Quote</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            <Text className="text-text-primary text-lg font-bold mb-3">Description</Text>
            <Text className="text-text-secondary text-base leading-6">{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View className="absolute bottom-0 left-0 right-0 bg-background/95 border-t border-surface px-6 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-text-secondary text-sm mb-1">
              Total ({quantity} {unit})
            </Text>
            <Text style={{ color: ORANGE }} className="text-2xl font-bold">
              ${(unitPrice * quantity).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            className={`rounded-2xl px-8 py-4 flex-row items-center ${!inStock ? "bg-surface" : "bg-primary"}`}
            onPress={handleAddToCart}
            disabled={!inStock || isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cart" size={24} color={!inStock ? "#666" : "#fff"} />
                <Text
                  className={`font-bold text-lg ml-2 ${!inStock ? "text-text-secondary" : "text-white"}`}
                >
                  {!inStock ? "Out of Stock" : hasVariants && !allChosen ? "Select options" : "Add to Cart"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
};

export default ProductDetailScreen;

function ErrorUI() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Product not found</Text>
        <TouchableOpacity className="bg-primary rounded-2xl px-6 py-3 mt-6" onPress={() => router.back()}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

function LoadingUI() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={ORANGE} />
        <Text className="text-text-secondary mt-4">Loading product...</Text>
      </View>
    </SafeScreen>
  );
}
