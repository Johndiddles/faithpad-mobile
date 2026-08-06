import { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useAuthStore } from "../store";
import { queryClient } from "@/lib/queryClient";

import "../global.css";


// Prevent splash screen from auto-hiding before authentication is evaluated
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Monitor Zustand storage hydration
  useEffect(() => {
    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setIsHydrated(true);
      } else {
        const unsub = useAuthStore.persist.onFinishHydration(() => {
          setIsHydrated(true);
        });
        return unsub;
      }
    };
    const cleanup = checkHydration();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const routeSegments = segments as string[];
    const inAuthGroup = routeSegments[0] === "(authenticated)";
    const inPublicGroup = routeSegments[0] === "(public)";

    if (!token && inAuthGroup) {
      router.replace("/welcome");
      SplashScreen.hideAsync().catch(() => {});
    } else if (
      token &&
      (inPublicGroup ||
        routeSegments.length === 0 ||
        routeSegments[0] === "index")
    ) {
      router.replace("/folders");
      SplashScreen.hideAsync().catch(() => {});
    } else {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [token, segments, isHydrated, router]);

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#e4b022" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(authenticated)" />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}

export default function AppLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
