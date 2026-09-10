import { Platform } from "react-native";

export const GOOGLE_CLIENT_ID: string =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? "",
    android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? "",
  }) ?? "";
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? "";
export const WEBSITE_URL: string =
  process.env.EXPO_PUBLIC_WEBSITE_URL ?? "https://faithpad.app";
export const PRIVACY_POLICY_URL: string = `${WEBSITE_URL}/privacy`;
