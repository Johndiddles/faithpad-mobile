import React from 'react';
import { Pressable, ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/utils';
import { AppText } from './app-text';

export interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'gold' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  textClassName,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Base layout styles
  const baseStyle = "flex-row items-center justify-center rounded-xl active:opacity-80 transition-opacity";

  // Variant mappings
  const variantStyles = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground border border-border",
    gold: "bg-[#e4b022] dark:bg-[#d4af37] text-white dark:text-black",
    destructive: "bg-destructive text-destructive-foreground",
    ghost: "bg-transparent text-foreground",
  };

  // Size mappings
  const sizeStyles = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg font-semibold",
  };

  // Text colors corresponding to variants
  const textColors = {
    primary: "text-primary-foreground",
    secondary: "text-foreground",
    gold: "text-white dark:text-black font-semibold",
    destructive: "text-white",
    ghost: "text-[#e4b022] dark:text-[#d4af37] font-medium",
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={cn(
        baseStyle,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'gold' ? (variantStyles.gold.includes('dark:text-black') ? '#000' : '#fff') : '#fff'}
          className="mr-2"
        />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      
      <AppText
        weight={size === 'lg' || variant === 'gold' ? 'semibold' : 'medium'}
        className={cn(
          textColors[variant],
          textClassName
        )}
      >
        {title}
      </AppText>
    </Pressable>
  );
}
