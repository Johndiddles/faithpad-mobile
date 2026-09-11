import {
  View,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { useAuthStore, useThemeStore, ThemePreference } from "../../store";
import { Dropdown } from "@/components/ui/dropdown";
import { useBibleVersionsQuery } from "@/queries/useBibleVersions";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { WEBSITE_URL, PRIVACY_POLICY_URL } from "@/constants/env";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateSettings, signOut } = useAuthStore();
  const { themePreference, setThemePreference } = useThemeStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleOpenUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: isDark ? "#0f0e0c" : "#ffffff",
        controlsColor: isDark ? "#d4af37" : "#e4b022",
      });
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  const handleUpdateTranslation = (translation: string) => {
    updateSettings(translation, user?.aiDetectionEnabled !== false);
  };

  const handleToggleAi = (val: boolean) => {
    if (user) {
      updateSettings(user.globalDefaultTranslation, val);
    }
  };

  // const handleResetApp = () => {
  //   if (Platform.OS === "web") {
  //     if (
  //       confirm(
  //         "Are you sure you want to reset all mock notes and folders back to default?",
  //       )
  //     ) {
  //       resetData();
  //     }
  //   } else {
  //     Alert.alert(
  //       "Reset App Data",
  //       "Are you sure you want to reset all folders, notes, and sharing permissions back to default mock records?",
  //       [
  //         { text: "Cancel", style: "cancel" },
  //         {
  //           text: "Reset",
  //           style: "destructive",
  //           onPress: () => {
  //             resetData();
  //             Alert.alert(
  //               "Reset Complete",
  //               "Local mock database has been reset.",
  //             );
  //           },
  //         },
  //       ],
  //     );
  //   }
  // };

  const handleLogOut = () => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to log out?")) {
        signOut();
      }
    } else {
      Alert.alert(
        "Log Out",
        "Are you sure you want to sign out of Faith Pad?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log Out",
            style: "destructive",
            onPress: () => signOut(),
          },
        ],
      );
    }
  };

  const { data: versionsData } = useBibleVersionsQuery();
  const versionOptions = versionsData
    ? versionsData.map((v) => ({
        label: `${v.abbreviation} - ${v.name}`,
        value: v.abbreviation,
      }))
    : [];

  const themeOptions: {
    value: ThemePreference;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      value: "system",
      label: "Device",
      icon: "phone-portrait-outline",
    },
    {
      value: "light",
      label: "Light",
      icon: "sunny-outline",
    },
    {
      value: "dark",
      label: "Dark",
      icon: "moon-outline",
    },
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border/10">
        <Pressable
          onPress={() => router.back()}
          className="p-2 active:opacity-60"
        >
          <AppText
            weight="medium"
            className="text-base text-[#e4b022] dark:text-[#d4af37]"
          >
            Close
          </AppText>
        </Pressable>
        <AppText weight="semibold" className="text-lg text-foreground">
          Settings
        </AppText>
        <View className="w-12" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          User Account
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-6">
          <View className="mb-4">
            <AppText
              weight="medium"
              className="text-sm text-foreground/80 mb-1"
            >
              Full Name
            </AppText>
            <View className="border border-border rounded-xl px-4 py-3 bg-secondary/30">
              <AppText className="text-base text-muted-foreground">
                {user?.displayName}
              </AppText>
            </View>
          </View>

          <View className="mb-4">
            <AppText
              weight="medium"
              className="text-sm text-foreground/80 mb-1"
            >
              Registered Email
            </AppText>
            <View className="border border-border rounded-xl px-4 py-3 bg-secondary/30">
              <AppText className="text-base text-muted-foreground">
                {user?.email}
              </AppText>
            </View>
          </View>

          {/* <Button
            title="Save Profile Updates"
            variant="gold"
            loading={savingProfile}
            onPress={handleSubmit(handleSaveProfile)}
            className="py-3"
          /> */}
        </View>

        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          Appearance
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-6">
          <AppText
            weight="semibold"
            className="text-sm text-foreground/90 mb-1"
          >
            Theme Mode
          </AppText>
          <AppText className="text-xs text-muted-foreground mb-3.5">
            Choose how Faith Pad appears on your device.
          </AppText>

          <View className="flex-row gap-2.5">
            {themeOptions.map((opt) => {
              const isSelected = themePreference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setThemePreference(opt.value)}
                  className={`flex-1 items-center justify-center py-3.5 px-2 rounded-xl border ${
                    isSelected
                      ? "bg-[#e4b022]/15 border-[#e4b022] dark:bg-[#d4af37]/20 dark:border-[#d4af37]"
                      : "bg-secondary/30 border-border"
                  }`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={
                      isSelected
                        ? isDark
                          ? "#d4af37"
                          : "#e4b022"
                        : isDark
                          ? "#9ca3af"
                          : "#6b7280"
                    }
                  />
                  <AppText
                    weight={isSelected ? "bold" : "medium"}
                    className={`text-xs mt-2 text-center ${
                      isSelected
                        ? "text-[#e4b022] dark:text-[#d4af37]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          Theological Tools
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-6 gap-y-4">
          <View>
            <AppText
              weight="semibold"
              className="text-sm text-foreground/90 mb-2"
            >
              Default Bible Translation
            </AppText>
            <Dropdown
              value={user?.globalDefaultTranslation || "ESV"}
              options={versionOptions}
              onSelect={handleUpdateTranslation}
              placeholder="Select Default Version"
              searchable
              searchPlaceholder="Search translations..."
            />
          </View>

          <View className="flex-row items-center justify-between border-t border-border/60 pt-4 opacity-60">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center flex-wrap gap-1.5">
                <AppText weight="semibold" className="text-sm text-foreground/90">
                  AI Smart Detection
                </AppText>
                <View className="bg-[#e4b022]/15 dark:bg-[#d4af37]/20 px-2 py-0.5 rounded-full border border-[#e4b022]/30 dark:border-[#d4af37]/30">
                  <AppText className="text-[10px] text-[#e4b022] dark:text-[#d4af37] font-bold uppercase tracking-wider">
                    Coming Soon
                  </AppText>
                </View>
              </View>
              <AppText className="text-xs text-muted-foreground mt-0.5">
                Automatically convert references (e.g. Jn 3:16) to cards while
                typing.
              </AppText>
            </View>
            <Switch
              value={false}
              disabled={true}
              onValueChange={handleToggleAi}
              trackColor={{ false: "hsl(var(--border))", true: "#e4b022" }}
              thumbColor={Platform.OS === "ios" ? undefined : "#fff"}
            />
          </View>
        </View>

        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          About & Links
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-6">
          <Pressable
            onPress={() => handleOpenUrl(WEBSITE_URL)}
            className="flex-row items-center justify-between py-2.5 border-b border-border/40 active:opacity-60"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#e4b022]/15 dark:bg-[#d4af37]/20 items-center justify-center mr-3">
                <Ionicons
                  name="globe-outline"
                  size={18}
                  color={isDark ? "#d4af37" : "#e4b022"}
                />
              </View>
              <AppText weight="medium" className="text-sm text-foreground">
                Faith Pad Website
              </AppText>
            </View>
            <View className="flex-row items-center">
              <AppText className="text-xs text-muted-foreground mr-1.5">
                faithpad.app
              </AppText>
              <Ionicons
                name="open-outline"
                size={14}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleOpenUrl(PRIVACY_POLICY_URL)}
            className="flex-row items-center justify-between py-2.5 active:opacity-60"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#e4b022]/15 dark:bg-[#d4af37]/20 items-center justify-center mr-3">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={isDark ? "#d4af37" : "#e4b022"}
                />
              </View>
              <AppText weight="medium" className="text-sm text-foreground">
                Privacy Policy
              </AppText>
            </View>
            <Ionicons
              name="open-outline"
              size={14}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
          </Pressable>
        </View>

        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          System Actions
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-10 gap-y-3">
          <View className="flex-row items-center justify-between py-2 border-b border-border/40">
            <AppText weight="medium" className="text-sm">
              Cloud Status
            </AppText>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              <AppText weight="bold" className="text-xs text-emerald-500">
                CONNECTED
              </AppText>
            </View>
          </View>

          {/* <Button
            title="Reset Mock Note Records"
            variant="secondary"
            onPress={handleResetApp}
            className="w-full py-3 border-dashed border-muted-foreground/30"
          /> */}

          <Button
            title="Log Out Account"
            variant="destructive"
            onPress={handleLogOut}
            className="w-full py-3.5 mt-2"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
