import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useAuthStore, useNotesStore } from "../../store";
import { GOOGLE_CLIENT_ID } from "@/constants/env";
import { updateUserSettingsApi } from "@/services/api";
import { customFetch } from "@/services/customFetch";
import DefaultTranslationModal from "@/components/welcome/DefaultTranslationModal";
import logo from "@/assets/images/icon.png";

WebBrowser.maybeCompleteAuthSession();
const redirectUri = makeRedirectUri({
  scheme: "com.johndiddles.faithpad",
});

interface AuthResponse {
  isNewUser: boolean;
  user: any;
  token: string;
}

export default function WelcomeScreen() {
  const { signIn } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [credentialsLoading, setCredentialsLoading] = useState(false);
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
        const res = await customFetch<{ success: boolean; data: AuthResponse }>(
          `/auth/google`,
          {
            method: "POST",
            data: { idToken },
          },
        );

        const data = res?.data;

        if (data?.isNewUser) {
          setPendingNewUser({ user: data.user, token: data.token });
        } else if (data?.user && data?.token) {
          console.log({ user: data.user });
          signIn(data.user, data.token);
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

  const handleCredentialsSignIn = async () => {
    if (!username.trim()) {
      Alert.alert("Missing Username", "Please enter your username.");
      return;
    }
    if (!password) {
      Alert.alert("Missing Password", "Please enter your password.");
      return;
    }

    setCredentialsLoading(true);
    try {
      const res = await customFetch<{ success: boolean; data: AuthResponse }>(
        `/auth/login`,
        {
          method: "POST",
          data: {
            username: username?.toLowerCase()?.trim(),
            password,
          },
        },
      );

      const data = res?.data;

      if (data?.isNewUser) {
        setPendingNewUser({ user: data.user, token: data.token });
      } else if (data?.user && data?.token) {
        signIn(data.user, data.token);
        useNotesStore.getState().syncWithBackend();
      }
    } catch (error: any) {
      console.error("Credentials sign in error:", error);
      Alert.alert(
        "Sign In Failed",
        error.message || "Invalid username or password. Please try again.",
      );
    } finally {
      setCredentialsLoading(false);
    }
  };

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

      <View className="absolute inset-0 bg-[#0f0e0c]">
        <View className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#e4b022]/10 blur-3xl" />
        <View className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#d4af37]/5 blur-3xl" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="flex-1 justify-between px-6 pb-12 pt-16">
            <View className="items-center mt-2">
              <View className="w-20 h-20 bg-[#e4b022] rounded-3xl items-center justify-center shadow-lg shadow-gold/40 mb-4 overflow-hidden">
                {/* <Ionicons name="book" size={42} color="white" /> */}
                <Image source={logo} className="w-full h-full" />
              </View>
              <AppText
                weight="bold"
                className="text-3xl text-white tracking-wider"
              >
                FAITH
                <AppText className="text-[#e4b022] font-semibold text-3xl">
                  PAD
                </AppText>
              </AppText>
              <AppText
                weight="medium"
                className="text-sm text-gray-400 mt-1 text-center"
              >
                Your sacred space for sermons and study
              </AppText>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-2xl p-5 my-6 backdrop-blur-md">
              <AppText weight="semibold" className="text-white text-lg mb-4">
                Sign In
              </AppText>

              <Input
                label="Username"
                placeholder="username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
                className="bg-white/10 border-white/20"
                labelClassName="text-gray-300 font-medium text-xs"
                inputClassName="text-white"
                containerClassName="mb-3"
              />

              <Input
                label="Password"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
                className="bg-white/10 border-white/20"
                labelClassName="text-gray-300 font-medium text-xs"
                inputClassName="text-white"
                containerClassName="mb-4"
              />

              <Button
                title="Sign In"
                variant="gold"
                size="lg"
                loading={credentialsLoading}
                onPress={handleCredentialsSignIn}
                className="w-full shadow-lg shadow-gold/25"
              />
            </View>

            <View className="gap-y-4">
              <View className="flex-row items-center justify-center my-1">
                <View className="flex-1 h-[1px] bg-white/15" />
                <AppText className="text-gray-400 text-xs px-3 uppercase tracking-wider">
                  or
                </AppText>
                <View className="flex-1 h-[1px] bg-white/15" />
              </View>

              <Button
                title="Sign in with Google"
                variant="secondary"
                size="lg"
                icon={<Ionicons name="logo-google" size={18} color="#e4b022" />}
                loading={googleLoading || !request}
                onPress={() => {
                  setGoogleLoading(true);
                  promptAsync().finally(() => setGoogleLoading(false));
                }}
                className="w-full bg-white/10 border-white/20"
                textClassName="text-white font-medium"
              />

              <View className="items-center px-4 pt-2">
                <AppText
                  variant="serif"
                  weight="light"
                  className="text-xs text-gray-500 text-center italic leading-5"
                >
                  {
                    '"Thy word is a lamp unto my feet, and a light unto my path."'
                  }
                </AppText>
                <AppText
                  weight="medium"
                  className="text-[10px] text-[#e4b022] mt-1 tracking-widest uppercase"
                >
                  Psalm 119:105
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
