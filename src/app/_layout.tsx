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
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "@rn-primitives/portal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { useAuthStore, useThemeStore } from "../store";
import { queryClient } from "@/lib/queryClient";

import "../global.css";

// Prevent splash screen from auto-hiding before authentication is evaluated
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const { themePreference } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();
  const { token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync theme preference with NativeWind whenever preference changes
  useEffect(() => {
    setColorScheme(themePreference);
  }, [themePreference, setColorScheme]);

  // Monitor Zustand storage hydration
  useEffect(() => {
    const checkHydration = () => {
      const authHydrated = useAuthStore.persist.hasHydrated();
      const themeHydrated = useThemeStore.persist.hasHydrated();
      if (authHydrated && themeHydrated) {
        setIsHydrated(true);
      } else {
        const unsubAuth = useAuthStore.persist.onFinishHydration(() => {
          if (useThemeStore.persist.hasHydrated()) {
            setIsHydrated(true);
          }
        });
        const unsubTheme = useThemeStore.persist.onFinishHydration(() => {
          if (useAuthStore.persist.hasHydrated()) {
            setIsHydrated(true);
          }
        });
        return () => {
          unsubAuth();
          unsubTheme();
        };
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

  const isDark = colorScheme === "dark";

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#e4b022" />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
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
