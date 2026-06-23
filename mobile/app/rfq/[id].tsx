import SafeScreen from "@/components/SafeScreen";
import { useRFQQuotes, useAcceptQuote } from "@/hooks/useRFQ";
import { Vendor } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const QuotesScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: quotes = [], isLoading } = useRFQQuotes(id);
  const acceptQuote = useAcceptQuote();

  const accept = (quoteId: string) =>
    Alert.alert("Accept quote", "Award this supplier and reject the others?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () =>
          acceptQuote.mutate(
            { rfqId: id, quoteId },
            { onError: () => Alert.alert("Error", "Could not accept quote") }
          ),
      },
    ]);

  return (
    <SafeScreen>
      <View className="px-6 pt-6 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Quotes</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
          {quotes.length === 0 ? (
            <Text className="text-text-secondary text-center mt-12">
              No quotes yet. Suppliers will respond soon.
            </Text>
          ) : (
            quotes.map((q) => {
              const vendor = typeof q.vendor === "object" ? (q.vendor as Vendor) : null;
              return (
                <View key={q._id} className="bg-surface rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-text-primary font-bold flex-1">
                      {vendor?.companyName || "Supplier"}
                    </Text>
                    {vendor?.verificationStatus === "verified" && (
                      <Ionicons name="shield-checkmark" size={16} color="#FF6A00" />
                    )}
                  </View>

                  <View className="flex-row items-center mt-2">
                    <Text className="text-primary text-2xl font-bold">${q.price.toFixed(2)}</Text>
                    <Text className="text-text-secondary text-sm ml-2">/ unit</Text>
                  </View>

                  <View className="flex-row mt-2">
                    <Text className="text-text-secondary text-xs mr-4">MOQ: {q.moq}</Text>
                    {q.leadTimeDays != null && (
                      <Text className="text-text-secondary text-xs">Lead: {q.leadTimeDays}d</Text>
                    )}
                  </View>

                  {q.message ? (
                    <Text className="text-text-secondary text-sm mt-2">{q.message}</Text>
                  ) : null}

                  {q.status === "accepted" ? (
                    <View className="bg-primary/20 rounded-xl py-2 mt-3 items-center">
                      <Text className="text-primary font-bold">Accepted ✓</Text>
                    </View>
                  ) : q.status === "rejected" ? (
                    <Text className="text-text-secondary text-center mt-3 text-xs">Not selected</Text>
                  ) : (
                    <TouchableOpacity
                      className="bg-primary rounded-xl py-3 mt-3 items-center"
                      onPress={() => accept(q._id)}
                      disabled={acceptQuote.isPending}
                    >
                      <Text className="text-background font-bold">Accept Quote</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeScreen>
  );
};

export default QuotesScreen;
