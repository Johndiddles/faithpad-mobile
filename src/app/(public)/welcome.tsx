import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useAuthStore, useNotesStore } from "../../store";

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const { signIn } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const handleBackendSignIn = useCallback(
    async (idToken: string) => {
      setGoogleLoading(true);
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5770/api/v1";
        const res = await fetch(`${apiUrl}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message || "Failed to authenticate with backend server",
          );
        }

        const { token, user } = await res.json();
        signIn(user, token);
        useNotesStore.getState().syncWithBackend();
      } catch (error: any) {
        console.error("Backend sign in error:", error);
        Alert.alert(
          "Sign In Failed",
          error.message || "Could not complete sign in with our servers.",
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    [signIn],
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        setTimeout(() => {
          handleBackendSignIn(id_token);
        }, 0);
      } else {
        Alert.alert(
          "Authentication Error",
          "No ID Token returned from Google.",
        );
      }
    } else if (response?.type === "error") {
      Alert.alert(
        "Authentication Error",
        response.error?.message || "Google Sign-In failed",
      );
    }
  }, [response, handleBackendSignIn]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Decorative Gradient Background Concept */}
      <View className="absolute inset-0 bg-[#0f0e0c]">
        {/* Soft gold glowing radial spots */}
        <View className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#e4b022]/10 blur-3xl" />
        <View className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#d4af37]/5 blur-3xl" />
      </View>

      <View className="flex-1 justify-between px-6 pb-12 pt-20">
        {/* App Logo & Header Section */}
        <View className="items-center mt-6">
          <View className="w-20 h-20 bg-[#e4b022] rounded-3xl items-center justify-center shadow-lg shadow-gold/40 mb-6">
            <Ionicons name="book" size={42} color="white" />
          </View>
          <AppText weight="bold" className="text-4xl text-white tracking-wider">
            FAITH
            <AppText className="text-[#e4b022] font-semibold text-4xl">
              PAD
            </AppText>
          </AppText>
          <AppText
            weight="medium"
            className="text-base text-gray-400 mt-2 text-center"
          >
            Your sacred space for sermons and study
          </AppText>
        </View>

        {/* Feature Highlights Card (Glassmorphism concept) */}
        <View className="bg-white/5 border border-white/10 rounded-2xl p-6 my-8 backdrop-blur-md">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-[#e4b022]/20 items-center justify-center mr-3">
              <Ionicons name="create-outline" size={18} color="#e4b022" />
            </View>
            <View className="flex-1">
              <AppText weight="semibold" className="text-white text-base">
                Sermon Journaling
              </AppText>
              <AppText className="text-gray-400 text-sm">
                Write structured outlines, notes, and lessons cleanly.
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-[#e4b022]/20 items-center justify-center mr-3">
              <Ionicons name="color-filter-outline" size={18} color="#e4b022" />
            </View>
            <View className="flex-1">
              <AppText weight="semibold" className="text-white text-base">
                YouVersion Bible Integration
              </AppText>
              <AppText className="text-gray-400 text-sm">
                Convert text coordinates directly into rich collapsible verse
                cards.
              </AppText>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#e4b022]/20 items-center justify-center mr-3">
              <Ionicons name="people-outline" size={18} color="#e4b022" />
            </View>
            <View className="flex-1">
              <AppText weight="semibold" className="text-white text-base">
                Study Collaborations
              </AppText>
              <AppText className="text-gray-400 text-sm">
                Share study materials with view and edit permission
                configurations.
              </AppText>
            </View>
          </View>
        </View>

        {/* Action Button & Scripture Footer */}
        <View className="gap-y-6">
          <Button
            title="Sign in with Google"
            variant="gold"
            size="lg"
            loading={googleLoading || !request}
            onPress={() => {
              setGoogleLoading(true);
              promptAsync().finally(() => setGoogleLoading(false));
            }}
            className="w-full shadow-lg shadow-gold/25"
          />

          <View className="items-center px-4">
            <AppText
              variant="serif"
              weight="light"
              className="text-xs text-gray-500 text-center italic leading-5"
            >
              {'"Thy word is a lamp unto my feet, and a light unto my path."'}
            </AppText>
            <AppText
              weight="medium"
              className="text-[10px] text-[#e4b022] mt-1.5 tracking-widest uppercase"
            >
              Psalm 119:105
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
