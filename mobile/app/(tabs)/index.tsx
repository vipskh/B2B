import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";
import { useVendors } from "@/hooks/useVendors";
import BentoProductCard from "@/components/BentoProductCard";
import FilterModal from "@/components/FilterModal";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";

// 1688-leaning accent (inline so no Metro restart needed for a config change)
const ORANGE = "#FF6A00";
const RED = "#E1251B";

const CATEGORIES = [
  { name: "All", icon: "grid" },
  { name: "Electronics", icon: "hardware-chip" },
  { name: "Fashion", icon: "shirt" },
  { name: "Sports", icon: "basketball" },
  { name: "Books", icon: "book" },
  { name: "Home", icon: "home" },
] as const;

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
  { key: "rating", label: "Top rated" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

export default function ShopScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [price, setPrice] = useState<{ minPrice?: number; maxPrice?: number }>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // category, sort & price are applied server-side; free-text is filtered client-side
  const { data: products, isLoading, isError } = useProducts({
    category: selectedCategory === "All" ? undefined : selectedCategory,
    sort,
    minPrice: price.minPrice,
    maxPrice: price.maxPrice,
  });
  const { data: vendors = [] } = useVendors();

  const hasPriceFilter = price.minPrice != null || price.maxPrice != null;

  const filtered = useMemo(() => {
    let f = products || [];
    if (searchQuery.trim())
      f = f.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return f;
  }, [products, searchQuery]);

  // split into two columns for a staggered (masonry) bento grid
  const left = filtered.filter((_, i) => i % 2 === 0);
  const right = filtered.filter((_, i) => i % 2 === 1);

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR */}
        <View className="px-5 pt-6 flex-row items-center justify-between">
          <View>
            <Text className="text-text-secondary text-xs">Wholesale · direct from suppliers</Text>
            <Text className="text-text-primary text-2xl font-bold">Marketplace</Text>
          </View>
          <TouchableOpacity
            className="bg-surface w-11 h-11 rounded-2xl items-center justify-center"
            onPress={() => router.push("/chat")}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View className="px-5 mt-4">
          <View className="bg-surface flex-row items-center pl-4 pr-1.5 py-1.5 rounded-2xl">
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              placeholder="Search products & suppliers"
              placeholderTextColor="#888"
              className="flex-1 ml-2 text-text-primary py-2"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={{ backgroundColor: ORANGE }} className="px-4 py-2.5 rounded-xl">
              <Text className="text-white font-bold">Search</Text>
            </View>
          </View>
        </View>

        {/* SORT / FILTER BAR */}
        <View className="px-5 mt-3 flex-row items-center">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            {SORTS.map((s) => {
              const sel = sort === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setSort(s.key)}
                  className="mr-2 px-3 py-2 rounded-full"
                  style={{ backgroundColor: sel ? ORANGE : "#282828" }}
                >
                  <Text style={{ color: sel ? "#fff" : "#B3B3B3" }} className="text-xs font-semibold">
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setFilterOpen(true)}
            className="ml-2 flex-row items-center px-3 py-2 rounded-full bg-surface"
          >
            <Ionicons name="options-outline" size={16} color={hasPriceFilter ? ORANGE : "#B3B3B3"} />
            <Text
              style={{ color: hasPriceFilter ? ORANGE : "#B3B3B3" }}
              className="text-xs font-semibold ml-1"
            >
              Filter
            </Text>
          </TouchableOpacity>
        </View>

        {/* BENTO: HERO + ACTIONS */}
        <View className="px-5 mt-4">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/vendors")}
            style={{ backgroundColor: ORANGE }}
            className="rounded-3xl p-5 overflow-hidden"
          >
            <View
              style={{
                position: "absolute",
                right: -28,
                top: -28,
                width: 130,
                height: 130,
                borderRadius: 65,
                backgroundColor: RED,
                opacity: 0.5,
              }}
            />
            <Text className="text-white/90 font-semibold">1688-style wholesale</Text>
            <Text className="text-white text-2xl font-extrabold mt-1 leading-7">
              Thousands of verified{"\n"}suppliers · low MOQ
            </Text>
            <View className="flex-row items-center mt-4 bg-white/20 self-start px-4 py-2 rounded-full">
              <Text className="text-white font-bold mr-1">Browse suppliers</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="flex-1 bg-surface rounded-3xl p-4"
              activeOpacity={0.85}
              onPress={() => router.push("/rfq/create")}
            >
              <View
                style={{ backgroundColor: RED + "22" }}
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
              >
                <Ionicons name="document-text" size={20} color={RED} />
              </View>
              <Text className="text-text-primary font-bold">Request Quote</Text>
              <Text className="text-text-secondary text-xs mt-0.5">Post an RFQ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface rounded-3xl p-4"
              activeOpacity={0.85}
              onPress={() => router.push("/vendors")}
            >
              <View
                style={{ backgroundColor: ORANGE + "22" }}
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
              >
                <Ionicons name="business" size={20} color={ORANGE} />
              </View>
              <Text className="text-text-primary font-bold">Suppliers</Text>
              <Text className="text-text-secondary text-xs mt-0.5">{vendors.length} verified</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIES */}
        <View className="mt-6">
          <Text className="text-text-primary text-lg font-bold px-5 mb-3">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((c) => {
              const sel = selectedCategory === c.name;
              return (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => setSelectedCategory(c.name)}
                  className="mr-3 items-center"
                >
                  <View
                    style={sel ? { backgroundColor: ORANGE } : undefined}
                    className={`w-16 h-16 rounded-2xl items-center justify-center ${sel ? "" : "bg-surface"}`}
                  >
                    <Ionicons name={c.icon as any} size={26} color={sel ? "#fff" : "#bbb"} />
                  </View>
                  <Text
                    className="text-xs mt-1"
                    style={{ color: sel ? ORANGE : "#B3B3B3", fontWeight: sel ? "700" : "400" }}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* VERIFIED SUPPLIERS */}
        {vendors.length > 0 && (
          <View className="mt-6">
            <View className="px-5 flex-row items-center justify-between mb-3">
              <Text className="text-text-primary text-lg font-bold">Verified Suppliers</Text>
              <TouchableOpacity onPress={() => router.push("/vendors")}>
                <Text style={{ color: ORANGE }} className="font-semibold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {vendors.map((v) => (
                <TouchableOpacity
                  key={v._id}
                  className="bg-surface rounded-2xl p-3 mr-3 w-40"
                  activeOpacity={0.85}
                  onPress={() => router.push(`/vendor/${v.slug}`)}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-background-lighter items-center justify-center overflow-hidden">
                      {v.logo ? (
                        <Image source={v.logo} style={{ width: 40, height: 40 }} />
                      ) : (
                        <Text className="text-text-primary font-bold">{v.companyName[0]}</Text>
                      )}
                    </View>
                    {v.verificationStatus === "verified" && (
                      <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color={ORANGE}
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </View>
                  <Text className="text-text-primary font-semibold text-sm mt-2" numberOfLines={2}>
                    {v.companyName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="star" size={12} color="#FFC107" />
                    <Text className="text-text-secondary text-xs ml-1">
                      {v.rating?.average?.toFixed(1) ?? "0.0"} · {v.totalProducts ?? 0} items
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* PRODUCTS — staggered bento */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-text-primary text-lg font-bold">
              {selectedCategory === "All" ? "Wholesale picks" : selectedCategory}
            </Text>
            <Text className="text-text-secondary text-sm">{filtered.length} items</Text>
          </View>

          {isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : isError ? (
            <View className="py-16 items-center">
              <Ionicons name="alert-circle-outline" size={40} color={RED} />
              <Text className="text-text-secondary mt-3">Failed to load products</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="py-16 items-center">
              <Ionicons name="search-outline" size={40} color="#666" />
              <Text className="text-text-secondary mt-3">No products found</Text>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <View className="flex-1 gap-3">
                {left.map((p, i) => (
                  <BentoProductCard key={p._id} product={p} height={i % 2 === 0 ? 190 : 150} />
                ))}
              </View>
              <View className="flex-1 gap-3">
                {right.map((p, i) => (
                  <BentoProductCard key={p._id} product={p} height={i % 2 === 0 ? 150 : 190} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <FilterModal
        visible={filterOpen}
        initialMin={price.minPrice}
        initialMax={price.maxPrice}
        onClose={() => setFilterOpen(false)}
        onApply={(r) => {
          setPrice(r);
          setFilterOpen(false);
        }}
      />
    </SafeScreen>
  );
}

