import { Stack } from "expo-router";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import "../src/utils/axiosConfig";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}
