import React, { useState } from "react";
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
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, useNotesStore } from "../../store";
import { Dropdown } from "@/components/ui/dropdown";
import { useBibleVersionsQuery } from "../../services/youversion";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be under 30 characters"),
});

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateProfile, updateSettings, signOut } = useAuthStore();
  const { resetData } = useNotesStore();

  const [savingProfile, setSavingProfile] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      displayName: user?.displayName || "",
    },
    resolver: async (data) => {
      try {
        const values = profileSchema.parse(data);
        return { values, errors: {} };
      } catch (err: any) {
        const errors: any = {};
        if (err instanceof z.ZodError) {
          err.issues.forEach((e: any) => {
            errors[e.path.join(".")] = { message: e.message };
          });
        }
        return { values: {}, errors };
      }
    },
  });

  const handleSaveProfile = (data: any) => {
    setSavingProfile(true);
    setTimeout(() => {
      updateProfile(data.displayName, user?.avatarUrl || null);
      setSavingProfile(false);
      Alert.alert("Success", "Profile updated successfully.");
    }, 600);
  };

  const handleUpdateTranslation = (
    translation: string,
  ) => {
    updateSettings(translation, user?.aiDetectionEnabled !== false);
  };

  const handleToggleAi = (val: boolean) => {
    if (user) {
      updateSettings(user.globalDefaultTranslation, val);
    }
  };

  const handleResetApp = () => {
    if (Platform.OS === "web") {
      if (
        confirm(
          "Are you sure you want to reset all mock notes and folders back to default?",
        )
      ) {
        resetData();
      }
    } else {
      Alert.alert(
        "Reset App Data",
        "Are you sure you want to reset all folders, notes, and sharing permissions back to default mock records?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: () => {
              resetData();
              Alert.alert(
                "Reset Complete",
                "Local mock database has been reset.",
              );
            },
          },
        ],
      );
    }
  };

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
    : [
        { label: "ESV", value: "ESV" },
        { label: "NIV", value: "NIV" },
        { label: "NLT", value: "NLT" },
        { label: "AMP", value: "AMP" },
        { label: "KJV", value: "KJV" },
      ];

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      {/* Navigation Header */}
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
        <View className="w-12" /> {/* Spacer */}
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* User Profile Info */}
        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          User Account
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-6">
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="e.g. John Diddles"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.displayName?.message}
                containerClassName="mb-3"
              />
            )}
          />

          <View className="mb-4">
            <AppText
              weight="medium"
              className="text-sm text-foreground/80 mb-1"
            >
              Registered Email
            </AppText>
            <View className="border border-border rounded-xl px-4 py-3 bg-secondary/30">
              <AppText className="text-base text-muted-foreground font-sans">
                {user?.email}
              </AppText>
            </View>
          </View>

          <Button
            title="Save Profile Updates"
            variant="gold"
            loading={savingProfile}
            onPress={handleSubmit(handleSaveProfile)}
            className="py-3"
          />
        </View>

        {/* Bible Settings */}
        <AppText
          weight="semibold"
          className="text-xs text-muted-foreground uppercase tracking-widest mb-3"
        >
          Theological Tools
        </AppText>
        <View className="bg-secondary/15 rounded-2xl border border-border p-4 mb-6 gap-y-4">
          {/* Default Translation Selection */}
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
            />
          </View>

          {/* AI Smart Scripture Detection Toggle */}
          <View className="flex-row items-center justify-between border-t border-border/60 pt-4">
            <View className="flex-1 pr-6">
              <AppText weight="semibold" className="text-sm text-foreground/90">
                AI Smart Detection
              </AppText>
              <AppText className="text-xs text-muted-foreground mt-0.5">
                Automatically convert references (e.g. Jn 3:16) to cards while
                typing.
              </AppText>
            </View>
            <Switch
              value={user?.aiDetectionEnabled !== false}
              onValueChange={handleToggleAi}
              trackColor={{ false: "hsl(var(--border))", true: "#e4b022" }}
              thumbColor={Platform.OS === "ios" ? undefined : "#fff"}
            />
          </View>
        </View>

        {/* Database Sync Actions */}
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

          <Button
            title="Reset Mock Note Records"
            variant="secondary"
            onPress={handleResetApp}
            className="w-full py-3 border-dashed border-muted-foreground/30"
          />

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
