import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Platform, TouchableOpacity, View } from "react-native";
import { useAuthStore, useNotesStore } from "../../store";
import { GOOGLE_CLIENT_ID, PRIVACY_POLICY_URL } from "@/constants/env";
import { updateUserSettingsApi } from "@/services/api";
import { customFetch } from "@/services/customFetch";
import DefaultTranslationModal from "@/components/welcome/DefaultTranslationModal";
import logo from "@/assets/images/icon.png";

WebBrowser.maybeCompleteAuthSession();
const redirectUri = makeRedirectUri({
  scheme: "com.johndiddles.faithpad",
});

interface AuthGoogleResponse {
  isNewUser: boolean;
  user: any;
  token: string;
}

export default function WelcomeScreen() {
  const { signIn } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingNewUser, setPendingNewUser] = useState<{
    user: any;
    token: string;
  } | null>(null);
  const [savingTranslation, setSavingTranslation] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      iosClientId: GOOGLE_CLIENT_ID,
      webClientId: GOOGLE_CLIENT_ID,
      androidClientId: GOOGLE_CLIENT_ID,
      redirectUri: Platform.OS === "android" ? redirectUri : undefined,
    },
    {
      scheme: "com.johndiddles.faithpad",
    },
  );

  const handleBackendSignIn = useCallback(
    async (idToken: string) => {
      setGoogleLoading(true);
      try {
        const res = await customFetch<{ data: AuthGoogleResponse }>(
          `/auth/google`,
          {
            method: "POST",
            data: { idToken },
          },
        );

        const data = res.data as AuthGoogleResponse;

        if (data?.isNewUser) {
          setPendingNewUser({ user: data.user, token: data.token });
        } else {
          console.log({ user: data?.user });
          signIn(data?.user, data?.token);
          useNotesStore.getState().syncWithBackend();
        }
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

  const handleConfirmTranslation = async (translation: string) => {
    if (!pendingNewUser) return;
    setSavingTranslation(true);
    try {
      const updatedUser = {
        ...pendingNewUser.user,
        globalDefaultTranslation: translation,
      };

      signIn(updatedUser, pendingNewUser.token);

      await updateUserSettingsApi(
        translation,
        updatedUser.aiDetectionEnabled ?? false,
      ).catch((err) =>
        console.error("Failed to update user translation setting:", err),
      );

      useNotesStore.getState().syncWithBackend();
      setPendingNewUser(null);
    } catch (err: any) {
      console.error("Error finalizing setup:", err);
      Alert.alert("Error", "Could not save your default translation.");
    } finally {
      setSavingTranslation(false);
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: "#0f0e0c",
        controlsColor: "#e4b022",
      });
    } catch (error) {
      console.error("Failed to open privacy policy:", error);
    }
  };

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
          <View className="w-20 h-20 bg-[#e4b022] rounded-3xl items-center justify-center shadow-lg shadow-gold/40 mb-4 overflow-hidden">
            {/* <Ionicons name="book" size={42} color="white" /> */}
            <Image source={logo} className="w-full h-full" />
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

            <TouchableOpacity
              onPress={handleOpenPrivacyPolicy}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              className="mt-3"
            >
              <AppText className="text-xs text-gray-400 underline">
                Privacy Policy
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {pendingNewUser !== null && (
        <DefaultTranslationModal
          isOpen={pendingNewUser !== null}
          onConfirm={(value) => handleConfirmTranslation(value)}
          savingTranslation={savingTranslation}
        />
      )}
    </View>
  );
}
