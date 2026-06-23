import SafeScreen from "@/components/SafeScreen";
import { useConversations } from "@/hooks/useChat";
import { Conversation, Vendor, User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

function partyName(c: Conversation) {
  if (c.myRole === "vendor") {
    return typeof c.buyer === "object" ? (c.buyer as User).name : "Buyer";
  }
  return typeof c.vendor === "object" ? (c.vendor as Vendor).companyName : "Supplier";
}

const ConversationsScreen = () => {
  const { data: conversations = [], isLoading } = useConversations();

  return (
    <SafeScreen>
      <View className="px-6 pt-6 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Messages</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
          {conversations.length === 0 ? (
            <View className="items-center mt-16 px-6">
              <Ionicons name="chatbubbles-outline" size={64} color="#666" />
              <Text className="text-text-primary font-semibold text-lg mt-4">No messages yet</Text>
              <Text className="text-text-secondary text-center mt-1">
                Contact a supplier from a product or store page.
              </Text>
            </View>
          ) : (
            conversations.map((c) => {
              const unread = c.myRole === "vendor" ? c.vendorUnread : c.buyerUnread;
              return (
                <TouchableOpacity
                  key={c._id}
                  className="px-6 py-4 flex-row items-center border-b border-surface"
                  activeOpacity={0.7}
                  onPress={() => router.push(`/chat/${c._id}`)}
                >
                  <View className="w-12 h-12 rounded-full bg-surface items-center justify-center">
                    <Ionicons name="business" size={22} color="#888" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-text-primary font-bold" numberOfLines={1}>
                      {partyName(c)}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-0.5" numberOfLines={1}>
                      {c.lastMessage || "—"}
                    </Text>
                  </View>
                  {unread > 0 && (
                    <View className="bg-primary rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5">
                      <Text className="text-background text-xs font-bold">{unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeScreen>
  );
};

export default ConversationsScreen;
