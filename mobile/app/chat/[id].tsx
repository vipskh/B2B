import SafeScreen from "@/components/SafeScreen";
import { useMessages, useSendMessage } from "@/hooks/useChat";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChatThreadScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: thread, isLoading } = useMessages(id);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");

  const messages = thread?.messages || [];
  const myRole = thread?.myRole;

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    sendMessage.mutate({ id, text: trimmed });
  };

  return (
    <SafeScreen>
      <View className="px-6 pt-6 pb-3 flex-row items-center border-b border-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-xl font-bold">Conversation</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF6A00" />
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 12 }}>
            {messages.map((m) => {
              const mine = m.senderRole === myRole;
              return (
                <View
                  key={m._id}
                  className={`max-w-[80%] rounded-2xl px-4 py-2 mb-2 ${
                    mine ? "bg-primary self-end" : "bg-surface self-start"
                  }`}
                >
                  <Text className={mine ? "text-background" : "text-text-primary"}>{m.text}</Text>
                </View>
              );
            })}
            {messages.length === 0 && (
              <Text className="text-text-secondary text-center mt-8">Say hello 👋</Text>
            )}
          </ScrollView>
        )}

        <View className="flex-row items-center px-4 py-3 border-t border-surface gap-2">
          <TextInput
            className="flex-1 bg-surface rounded-full text-text-primary px-4 py-3"
            placeholder="Type a message…"
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            className="bg-primary rounded-full w-12 h-12 items-center justify-center"
            onPress={send}
            disabled={sendMessage.isPending}
          >
            <Ionicons name="send" size={20} color="#121212" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

export default ChatThreadScreen;
