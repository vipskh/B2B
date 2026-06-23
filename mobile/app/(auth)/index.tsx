import { useApi } from "@/lib/api";
import { useDevUser } from "@/lib/devUser";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface DevUser {
  _id: string;
  name: string;
  email: string;
  role: "buyer" | "vendor" | "admin";
  vendor?: string | null;
}

const roleIcon: Record<string, any> = {
  admin: "shield-checkmark",
  vendor: "storefront",
  buyer: "person",
};

// Auth is temporarily off — pick a seeded user to act as.
const AuthScreen = () => {
  const api = useApi();
  const { setUser } = useDevUser();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["devUsers"],
    queryFn: async () => {
      const res = await api.get<{ users: DevUser[] }>("/dev/users");
      return res.data.users;
    },
  });

  const pick = async (id: string) => {
    await setUser(id);
    router.replace("/(tabs)");
  };

  const users = data || [];

  return (
    <View className="flex-1 bg-white px-6 pt-20">
      <Text className="text-3xl font-bold text-black">Choose a user</Text>
      <Text className="text-gray-500 mt-1 mb-6">Dev mode — authentication is off</Text>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6A00" />
        </View>
      )}
      {isError && (
        <Text className="text-red-500">
          Couldn&apos;t reach the API. Is the backend running and seeded?
        </Text>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {users.map((u) => (
          <TouchableOpacity
            key={u._id}
            className="flex-row items-center border border-gray-200 rounded-2xl px-4 py-4 mb-3"
            activeOpacity={0.7}
            onPress={() => pick(u._id)}
          >
            <View className="size-11 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons name={roleIcon[u.role] || "person"} size={20} color="#FF6A00" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-black">{u.name}</Text>
              <Text className="text-gray-500 text-xs">{u.email}</Text>
            </View>
            <Text className="text-xs font-bold uppercase text-gray-400">{u.role}</Text>
          </TouchableOpacity>
        ))}
        {!isLoading && users.length === 0 && !isError && (
          <Text className="text-gray-400 text-center mt-8">
            No users found — run the backend seed.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default AuthScreen;
