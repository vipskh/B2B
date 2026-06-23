import { Redirect, Stack } from "expo-router";
import { useDevUser } from "@/lib/devUser";

export default function AuthRoutesLayout() {
  const { userId, loaded } = useDevUser();

  if (!loaded) return null; // for a better ux

  // already picked a user → go to the app
  if (userId) return <Redirect href={"/(tabs)"} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
