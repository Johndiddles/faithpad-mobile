import React, { forwardRef, useState } from "react";
import {
  TextInput,
  View,
  Pressable,
  TextInputProps,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { AppText } from "./app-text";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  secureTextEntry?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      className,
      containerClassName,
      labelClassName,
      inputClassName,
      secureTextEntry,
      placeholderTextColor = "hsl(var(--muted-foreground))",
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
      <View className={cn("w-full mb-4", containerClassName)}>
        {label && (
          <AppText
            weight="medium"
            className={cn("text-sm text-foreground/80 mb-1.5", labelClassName)}
          >
            {label}
          </AppText>
        )}

        <View
          className={cn(
            "flex-row items-center border rounded-xl px-3.5 bg-card",
            "py-3.5",
            isFocused
              ? "border-[#e4b022] dark:border-[#d4af37]"
              : "border-border",
            error ? "border-destructive" : "",
            className,
          )}
        >
          <TextInput
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isSecure}
            placeholderTextColor={placeholderTextColor}
            className={cn(
              "flex-1 text-base text-foreground p-0 m-0",
              inputClassName,
              // Platform.OS === "ios" && secureTextEntry ? "-mt-1 mb-1" : "",
            )}
            style={{
              textAlignVertical: props.multiline ? "top" : "center",
              marginTop: Platform.OS === "ios" && secureTextEntry ? 0 : -4,
              marginBottom: Platform.OS === "ios" && secureTextEntry ? 0 : 4,
            }}
            {...props}
          />

          {secureTextEntry && (
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="ml-2 active:opacity-60"
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="hsl(var(--muted-foreground))"
              />
            </Pressable>
          )}
        </View>

        {error && (
          <AppText
            variant="sans"
            className="text-xs text-destructive mt-1 ml-1"
          >
            {error}
          </AppText>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
