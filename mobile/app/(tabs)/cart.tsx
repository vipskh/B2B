import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddressess";
import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { Address, CartItem, Vendor } from "@/types";
import { resolveUnitPrice } from "@/lib/pricing";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OrderSummary from "@/components/OrderSummary";
import AddressSelectionModal from "@/components/AddressSelectionModal";

import * as Sentry from "@sentry/react-native";

const CartScreen = () => {
  const api = useApi();
  const {
    cart,
    cartItemCount,
    cartTotal,
    clearCart,
    isError,
    isLoading,
    isRemoving,
    isUpdating,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { addresses } = useAddresses();

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const cartItems = cart?.items || [];

  // group cart items by vendor (1688-style multi-supplier cart)
  const vendorGroups = Object.values(
    cartItems.reduce<Record<string, { vendor: Vendor | null; items: CartItem[] }>>((acc, item) => {
      const v = item.product.vendor;
      const key = typeof v === "object" && v ? v._id : typeof v === "string" ? v : "unknown";
      if (!acc[key]) acc[key] = { vendor: typeof v === "object" ? (v as Vendor) : null, items: [] };
      acc[key].items.push(item);
      return acc;
    }, {})
  );

  const subtotal = cartTotal;
  const shipping = 10.0 * Math.max(1, vendorGroups.length); // $10 shipping per vendor
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    Alert.alert("Remove Item", `Remove ${productName} from cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromCart(itemId),
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // check if user has addresses
    if (!addresses || addresses.length === 0) {
      Alert.alert(
        "No Address",
        "Please add a shipping address in your profile before checking out.",
        [{ text: "OK" }]
      );
      return;
    }

    // show address selection modal
    setAddressModalVisible(true);
  };

  const handleProceedWithPayment = async (selectedAddress: Address) => {
    setAddressModalVisible(false);
    try {
      setPaymentLoading(true);
      // payments are deferred — place the order directly; the server validates
      // wholesale pricing/MOQ and splits the cart into one order per supplier
      await api.post("/orders/checkout", {
        shippingAddress: {
          fullName: selectedAddress.fullName,
          streetAddress: selectedAddress.streetAddress,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: selectedAddress.phoneNumber,
        },
      });
      Alert.alert("Order placed", "Your order has been placed and split per supplier.", [
        { text: "OK" },
      ]);
      clearCart();
    } catch (error: any) {
      Sentry.captureException(error);
      Alert.alert("Error", error?.response?.data?.error || "Failed to place order");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (cartItems.length === 0) return <EmptyUI />;

  return (
    <SafeScreen>
      <Text className="px-6 pb-5 text-text-primary text-3xl font-bold tracking-tight">Cart</Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        <View className="px-6 gap-4">
          {vendorGroups.map((group) => {
            const groupSubtotal = group.items.reduce((s, item) => {
              const u = item.variant
                ? item.variant.price
                : resolveUnitPrice(item.product, item.quantity);
              return s + u * item.quantity;
            }, 0);
            return (
            <View
              key={group.vendor?._id || "unknown"}
              className="border border-surface rounded-3xl p-3 gap-2"
            >
              {/* vendor header */}
              <View className="flex-row items-center px-1 pt-1">
                <View
                  style={{ backgroundColor: "#FF6A0022" }}
                  className="w-7 h-7 rounded-lg items-center justify-center"
                >
                  <Ionicons name="business" size={14} color="#FF6A00" />
                </View>
                <Text className="text-text-primary font-bold ml-2 flex-1" numberOfLines={1}>
                  {group.vendor?.companyName || "Supplier"}
                </Text>
                {group.vendor?.verificationStatus === "verified" && (
                  <Ionicons name="shield-checkmark" size={14} color="#FF6A00" />
                )}
              </View>

              {group.items.map((item) => {
                const unitPrice = item.variant
                  ? item.variant.price
                  : resolveUnitPrice(item.product, item.quantity);
                return (
                  <View key={item._id} className="bg-surface rounded-3xl overflow-hidden ">
                    <View className="p-4 flex-row">
                      {/* product image */}
                      <View className="relative">
                        <Image
                          source={item.product.images[0]}
                          className="bg-background-lighter"
                          contentFit="cover"
                          style={{ width: 112, height: 112, borderRadius: 16 }}
                        />
                        <View className="absolute top-2 right-2 bg-primary rounded-full px-2 py-0.5">
                          <Text className="text-white text-xs font-bold">×{item.quantity}</Text>
                        </View>
                      </View>

                      <View className="flex-1 ml-4 justify-between">
                        <View>
                          <Text
                            className="text-text-primary font-bold text-lg leading-tight"
                            numberOfLines={2}
                          >
                            {item.product.name}
                          </Text>
                          {item.variant && (
                            <View className="bg-background-lighter self-start px-2 py-0.5 rounded-md mt-1">
                              <Text className="text-text-secondary text-xs">
                                {Object.values(item.variant.options).join(" / ")}
                              </Text>
                            </View>
                          )}
                          <View className="flex-row items-center mt-2">
                            <Text className="text-primary font-bold text-2xl">
                              ${(unitPrice * item.quantity).toFixed(2)}
                            </Text>
                            <Text className="text-text-secondary text-sm ml-2">
                              ${unitPrice.toFixed(2)} / {item.product.unit}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center mt-3">
                          <TouchableOpacity
                            className="bg-background-lighter rounded-full w-9 h-9 items-center justify-center"
                            activeOpacity={0.7}
                            onPress={() => handleQuantityChange(item._id, item.quantity, -1)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Ionicons name="remove" size={18} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>

                          <View className="mx-4 min-w-[32px] items-center">
                            <Text className="text-text-primary font-bold text-lg">
                              {item.quantity}
                            </Text>
                          </View>

                          <TouchableOpacity
                            className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                            activeOpacity={0.7}
                            onPress={() => handleQuantityChange(item._id, item.quantity, 1)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Ionicons name="add" size={18} color="#fff" />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            className="ml-auto bg-red-500/10 rounded-full w-9 h-9 items-center justify-center"
                            activeOpacity={0.7}
                            onPress={() => handleRemoveItem(item._id, item.product.name)}
                            disabled={isRemoving}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* per-vendor subtotal */}
              <View className="flex-row items-center justify-between px-2 pt-1">
                <Text className="text-text-secondary text-xs">Subtotal · +$10 shipping</Text>
                <Text className="text-text-primary font-bold">
                  ${(groupSubtotal + 10).toFixed(2)}
                </Text>
              </View>
            </View>
            );
          })}
        </View>

        <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t
       border-surface pt-4 pb-32 px-6"
      >
        {/* Quick Stats */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="cart" size={20} color="#FF6A00" />
            <Text className="text-text-secondary ml-2">
              {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-text-primary font-bold text-xl">${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          className="bg-primary rounded-2xl overflow-hidden"
          activeOpacity={0.9}
          onPress={handleCheckout}
          disabled={paymentLoading}
        >
          <View className="py-5 flex-row items-center justify-center">
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Checkout</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={handleProceedWithPayment}
        isProcessing={paymentLoading}
      />
    </SafeScreen>
  );
};

export default CartScreen;

function LoadingUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#FF6A00" />
      <Text className="text-text-secondary mt-4">Loading cart...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Failed to load cart</Text>
      <Text className="text-text-secondary text-center mt-2">
        Please check your connection and try again
      </Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-5">
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Cart</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="cart-outline" size={80} color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Your cart is empty</Text>
        <Text className="text-text-secondary text-center mt-2">
          Add some products to get started
        </Text>
      </View>
    </View>
  );
}
