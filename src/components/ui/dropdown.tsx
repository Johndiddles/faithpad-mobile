import React, { useState, useMemo } from "react";
import {
  View,
  Pressable,
  TextInput,
  Modal,
  Platform,
  useColorScheme,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { AppText } from "./app-text";
import { SafeAreaView } from "react-native-safe-area-context";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  layout?: "list" | "grid";
  numColumns?: number;
}

export function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select option",
  searchable = false,
  searchPlaceholder = "Search...",
  error,
  className,
  containerClassName,
  layout = "list",
  numColumns = 5,
}: DropdownProps) {
  const colorScheme = useColorScheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery, searchable]);

  return (
    <View className={cn("w-full mb-4", containerClassName)}>
      {label && (
        <AppText weight="medium" className="text-sm text-foreground/80 mb-1.5">
          {label}
        </AppText>
      )}

      <Pressable
        onPress={() => setIsOpen(true)}
        className={cn(
          "flex-row items-center justify-between border rounded-xl px-3.5 py-3.5 bg-card",
          isOpen ? "border-[#e4b022] dark:border-[#d4af37]" : "border-border",
          error ? "border-destructive" : "",
          className,
        )}
      >
        <AppText
          className={cn(
            "text-base flex-1",
            selectedOption ? "text-foreground" : "text-muted-foreground",
          )}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </AppText>
        <Ionicons
          name="chevron-down"
          size={18}
          className="ml-2"
          color={colorScheme === "dark" ? "#e4b022" : "#666666"}
        />
      </Pressable>

      {error && (
        <AppText variant="sans" className="text-xs text-destructive mt-1 ml-1">
          {error}
        </AppText>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsOpen(false);
          setSearchQuery("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <View className="flex-1 bg-black/60 justify-end">
            <Pressable
              className="flex-1"
              onPress={() => {
                setIsOpen(false);
                setSearchQuery("");
              }}
            />
            <View className="bg-card rounded-t-3xl border-t border-border h-[500px] max-h-[85%]">
              <SafeAreaView className="flex-1" edges={["bottom"]}>
                <View className="flex-1 py-4 px-5">
                  <View className="flex-row justify-between items-center mb-4">
                    <AppText weight="bold" className="text-lg">
                      {label || "Select Option"}
                    </AppText>
                    <Pressable
                      onPress={() => {
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className="p-1 active:opacity-60"
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colorScheme === "dark" ? "#eeeeee" : "#333333"}
                      />
                    </Pressable>
                  </View>

                  {searchable && (
                    <View className="flex-row items-center border border-border rounded-xl px-3.5 py-2.5 bg-secondary/15 mb-4">
                      <Ionicons
                        name="search-outline"
                        size={18}
                        className="text-muted-foreground mr-2"
                        color="hsl(var(--muted-foreground))"
                      />
                      <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={searchPlaceholder}
                        placeholderTextColor="hsl(var(--muted-foreground))"
                        className="flex-1 text-base text-foreground p-0 m-0"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {searchQuery.length > 0 && (
                        <Pressable
                          onPress={() => setSearchQuery("")}
                          className="p-1 active:opacity-60"
                        >
                          <Ionicons
                            name="close-circle"
                            size={16}
                            className="text-muted-foreground"
                            color="hsl(var(--muted-foreground))"
                          />
                        </Pressable>
                      )}
                    </View>
                  )}

                  <View className="flex-1">
                    <FlatList<DropdownOption>
                      key={layout === "grid" ? `grid-${numColumns}` : "list-1"}
                      data={filteredOptions}
                      numColumns={layout === "grid" ? numColumns : 1}
                      keyExtractor={(item) => item.value}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      columnWrapperStyle={
                        layout === "grid" ? { flexDirection: "row" } : undefined
                      }
                      ItemSeparatorComponent={() =>
                        layout === "grid" ? null : <View className="h-1.5" />
                      }
                      renderItem={({ item }) => {
                        const isSelected = item.value === value;
                        if (layout === "grid") {
                          return (
                            <View
                              style={{ width: `${100 / numColumns}%` }}
                              className="p-1"
                            >
                              <Pressable
                                onPress={() => {
                                  onSelect(item.value);
                                  setIsOpen(false);
                                  setSearchQuery("");
                                }}
                                className={cn(
                                  "h-12 items-center justify-center rounded-xl border",
                                  isSelected
                                    ? "bg-[#e4b022] dark:bg-[#d4af37] border-[#e4b022] dark:border-[#d4af37]"
                                    : "bg-secondary/30 border-border/50 active:bg-secondary/70",
                                )}
                              >
                                <AppText
                                  weight={isSelected ? "bold" : "semibold"}
                                  className={cn(
                                    "text-base text-center",
                                    isSelected
                                      ? "text-black dark:text-black"
                                      : "text-foreground",
                                  )}
                                >
                                  {item.label}
                                </AppText>
                              </Pressable>
                            </View>
                          );
                        }
                        return (
                          <Pressable
                            onPress={() => {
                              onSelect(item.value);
                              setIsOpen(false);
                              setSearchQuery("");
                            }}
                            className={cn(
                              "flex-row items-center justify-between py-3.5 px-2 rounded-xl",
                              isSelected
                                ? "bg-[#e4b022]/10 dark:bg-[#d4af37]/10"
                                : "active:bg-secondary/40",
                            )}
                          >
                            <AppText
                              weight={isSelected ? "semibold" : "normal"}
                              className={cn(
                                "text-base",
                                isSelected
                                  ? "text-[#e4b022] dark:text-[#d4af37]"
                                  : "text-foreground",
                              )}
                            >
                              {item.label}
                            </AppText>
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={18}
                                className="text-[#e4b022] dark:text-[#d4af37]"
                                color={
                                  Platform.OS === "ios" ? "#e4b022" : "#d4af37"
                                }
                              />
                            )}
                          </Pressable>
                        );
                      }}
                      contentContainerStyle={{ paddingBottom: 20 }}
                      ListEmptyComponent={
                        <View className="py-8 items-center justify-center">
                          <AppText className="text-muted-foreground text-sm">
                            No results found
                          </AppText>
                        </View>
                      }
                    />
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
