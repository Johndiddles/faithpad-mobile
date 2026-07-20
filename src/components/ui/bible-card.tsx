import React, { useState } from 'react';
import { View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { AppText } from './app-text';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export interface BibleCardProps {
  reference: string;
  verseText?: string;
  translation?: string;
  isInitiallyCollapsed?: boolean;
  className?: string;
}

export function BibleCard({
  reference,
  verseText = 'Abide in Me, and I in you...',
  translation = 'ESV',
  isInitiallyCollapsed = true,
  className,
}: BibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  return (
    <View
      className={cn(
        "border border-border rounded-xl bg-secondary/30 dark:bg-secondary/10 overflow-hidden mb-3",
        className
      )}
    >
      <Pressable
        onPress={toggleCollapse}
        className="flex-row items-center justify-between px-4 py-3 bg-[#e4b022]/10 dark:bg-[#d4af37]/10"
      >
        <View className="flex-row items-center">
          <Ionicons
            name="book-outline"
            size={18}
            className="text-[#e4b022] dark:text-[#d4af37] mr-2"
            color={Platform.OS === 'ios' ? '#e4b022' : '#d4af37'}
          />
          <AppText weight="semibold" className="text-[#e4b022] dark:text-[#d4af37]">
            {reference}
          </AppText>
          <View className="ml-2 px-1.5 py-0.5 rounded bg-[#e4b022]/20 dark:bg-[#d4af37]/20">
            <AppText weight="bold" className="text-[10px] text-[#e4b022] dark:text-[#d4af37]">
              {translation}
            </AppText>
          </View>
        </View>
        <Ionicons
          name={isCollapsed ? "chevron-down-outline" : "chevron-up-outline"}
          size={18}
          className="text-muted-foreground"
          color="hsl(var(--muted-foreground))"
        />
      </Pressable>

      {!isCollapsed && (
        <View className="px-4 py-3.5 border-t border-border">
          <AppText
            variant="serif"
            className="text-base leading-7 text-foreground italic"
          >
            {"\""}{verseText}{"\""}
          </AppText>
        </View>
      )}
    </View>
  );
}

export interface BibleComparisonProps {
  reference: string;
  comparisons: { translation: string; text: string }[];
  className?: string;
}

export function BibleComparison({
  reference,
  comparisons,
  className,
}: BibleComparisonProps) {
  return (
    <View className={cn("border border-border rounded-xl bg-card overflow-hidden mb-3", className)}>
      <View className="flex-row items-center px-4 py-3 bg-[#e4b022]/10 dark:bg-[#d4af37]/10 border-b border-border">
        <Ionicons
          name="layers-outline"
          size={18}
          className="text-[#e4b022] dark:text-[#d4af37] mr-2"
          color={Platform.OS === 'ios' ? '#e4b022' : '#d4af37'}
        />
        <AppText weight="semibold" className="text-[#e4b022] dark:text-[#d4af37]">
          {reference} Comparison
        </AppText>
      </View>
      
      <View className="p-3 flex-col md:flex-row gap-3">
        {comparisons.map((comp, idx) => (
          <View
            key={idx}
            className="flex-1 p-3 rounded-lg bg-secondary/30 dark:bg-secondary/15 border border-border/60"
          >
            <View className="flex-row justify-between items-center mb-1.5">
              <View className="px-2 py-0.5 rounded bg-[#e4b022] dark:bg-[#d4af37]">
                <AppText weight="bold" className="text-[10px] text-white dark:text-black">
                  {comp.translation}
                </AppText>
              </View>
            </View>
            <AppText
              variant="serif"
              className="text-sm leading-6 text-foreground italic"
            >
              {"\""}{comp.text}{"\""}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
