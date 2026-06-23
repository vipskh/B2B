import { Stack } from "expo-router";
import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";
import { DevUserProvider } from "@/lib/devUser";

Sentry.init({
  dsn: "https://fb6731b90610cc08333e6c16ffac5724@o4509813037137920.ingest.de.sentry.io/4510451611205712",
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

const queryClient = new QueryClient();

// NOTE: auth is temporarily off (Appwrite/dev mode). Clerk + Stripe removed; the
// app impersonates a seeded user via DevUserProvider and checks out directly.
export default Sentry.wrap(function RootLayout() {
  return (
    <DevUserProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </DevUserProvider>
  );
});
