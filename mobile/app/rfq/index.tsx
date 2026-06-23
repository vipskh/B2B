import SafeScreen from "@/components/SafeScreen";
import { useMyRFQs } from "@/hooks/useRFQ";
import { capitalizeFirstLetter, formatDate } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

const statusColor = (s: string) =>
  s === "awarded" ? "#FF6A00" : s === "closed" ? "#EF4444" : "#F59E0B";

const MyRFQsScreen = () => {
  const { data: rfqs = [], isLoading } = useMyRFQs();

  return (
    <SafeScreen>
      <View className="px-6 pt-6 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-text-primary text-3xl font-bold tracking-tight">My RFQs</Text>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
          onPress={() => router.push("/rfq/create")}
        >
          <Ionicons name="add" size={24} color="#121212" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
          {rfqs.length === 0 ? (
            <View className="items-center mt-16">
              <Ionicons name="document-text-outline" size={64} color="#666" />
              <Text className="text-text-primary font-semibold text-lg mt-4">No requests yet</Text>
              <Text className="text-text-secondary text-center mt-1">
                Post a sourcing request and let suppliers quote you.
              </Text>
              <TouchableOpacity
                className="bg-primary rounded-2xl px-6 py-3 mt-5"
                onPress={() => router.push("/rfq/create")}
              >
                <Text className="text-background font-bold">New Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            rfqs.map((rfq) => (
              <TouchableOpacity
                key={rfq._id}
                className="bg-surface rounded-2xl p-4 mb-3"
                activeOpacity={0.8}
                onPress={() => router.push(`/rfq/${rfq._id}`)}
              >
                <View className="flex-row items-start justify-between">
                  <Text className="text-text-primary font-bold flex-1 mr-2" numberOfLines={1}>
                    {rfq.title}
                  </Text>
                  <Text className="text-xs font-bold" style={{ color: statusColor(rfq.status) }}>
                    {capitalizeFirstLetter(rfq.status)}
                  </Text>
                </View>
                <Text className="text-text-secondary text-sm mt-1" numberOfLines={2}>
                  {rfq.description}
                </Text>
                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-text-secondary text-xs">
                    {rfq.quantity} {rfq.unit} · {formatDate(rfq.createdAt)}
                  </Text>
                  <View className="flex-row items-center bg-primary/20 px-2 py-1 rounded-full">
                    <Ionicons name="pricetags" size={12} color="#FF6A00" />
                    <Text className="text-primary text-xs font-bold ml-1">
                      {rfq.quotesCount} quotes
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

export default MyRFQsScreen;
