import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AppEntry() {
  useEffect(() => router.replace("/welcome"), []);
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#e4b022" />
    </View>
  );
}
