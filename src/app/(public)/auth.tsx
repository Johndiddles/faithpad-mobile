import React, { useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/app-text';
import { useAuthStore } from '../../store';
import { cn } from '@/lib/utils';

// Zod schemas
const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Custom lightweight Zod resolver for react-hook-form
const customResolver = (schema: z.ZodSchema) => async (data: any) => {
  try {
    const values = schema.parse(data);
    return { values, errors: {} };
  } catch (error: any) {
    const errors: any = {};
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = { message: err.message, type: err.code };
      });
    }
    return { values: {}, errors };
  }
};

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    control: signinControl,
    handleSubmit: handleSigninSubmit,
    formState: { errors: signinErrors },
    reset: resetSigninForm,
  } = useForm<z.infer<typeof signInSchema>>({
    defaultValues: { email: '', password: '' },
    resolver: customResolver(signInSchema) as any,
  });

  const {
    control: signupControl,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm,
  } = useForm<z.infer<typeof signUpSchema>>({
    defaultValues: { displayName: '', email: '', password: '' },
    resolver: customResolver(signUpSchema) as any,
  });

  const toggleTab = () => {
    setActiveTab((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    resetSigninForm();
    resetSignupForm();
  };

  const onSignIn = async (data: z.infer<typeof signInSchema>) => {
    setSubmitLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitLoading(false);
      signIn({
        email: data.email,
        displayName: data.email.split('@')[0], // Extract username as display name
      });
      // Redirect happens automatically in root layout
    }, 1000);
  };

  const onSignUp = async (data: z.infer<typeof signUpSchema>) => {
    setSubmitLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitLoading(false);
      signUp({
        email: data.email,
        displayName: data.displayName,
      });
      // Redirect happens automatically in root layout
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // Simulate Google Sign-In secure web-browser/popup flow
    setTimeout(() => {
      setGoogleLoading(false);
      signIn({
        id: 'google_user_101',
        email: 'blessing.diddles@gmail.com',
        displayName: 'Blessing Diddles',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      });
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          {/* Header */}
          <View className="mt-8 items-center">
            <Pressable
              onPress={() => router.back()}
              className="absolute left-0 p-2 active:opacity-60"
            >
              <Ionicons name="arrow-back-outline" size={24} className="text-foreground" color="hsl(var(--foreground))" />
            </Pressable>
            
            <AppText weight="bold" className="text-2xl mt-4">
              Welcome to Faith Pad
            </AppText>
            <AppText className="text-sm text-muted-foreground mt-1">
              Sign in to secure and sync your notes
            </AppText>
          </View>

          {/* Elegant Custom Tab Selector */}
          <View className="flex-row bg-secondary/50 rounded-xl p-1.5 mt-8 border border-border">
            <Pressable
              onPress={() => activeTab !== 'signin' && toggleTab()}
              className={cn(
                "flex-1 items-center py-2.5 rounded-lg",
                activeTab === 'signin' ? "bg-card shadow-sm border border-border/20" : ""
              )}
            >
              <AppText
                weight={activeTab === 'signin' ? 'semibold' : 'medium'}
                className={activeTab === 'signin' ? "text-foreground" : "text-muted-foreground"}
              >
                Sign In
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => activeTab !== 'signup' && toggleTab()}
              className={cn(
                "flex-1 items-center py-2.5 rounded-lg",
                activeTab === 'signup' ? "bg-card shadow-sm border border-border/20" : ""
              )}
            >
              <AppText
                weight={activeTab === 'signup' ? 'semibold' : 'medium'}
                className={activeTab === 'signup' ? "text-foreground" : "text-muted-foreground"}
              >
                Create Account
              </AppText>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View className="mt-8 flex-1 justify-between">
            <View>
              {activeTab === 'signin' ? (
                <View>
                  <Controller
                    control={signinControl}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Email Address"
                        placeholder="e.g. john@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={signinErrors.email?.message}
                      />
                    )}
                  />

                  <Controller
                    control={signinControl}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Password"
                        placeholder="Enter password"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={signinErrors.password?.message}
                      />
                    )}
                  />

                  <Button
                    title="Sign In"
                    variant="primary"
                    loading={submitLoading}
                    onPress={handleSigninSubmit(onSignIn as any)}
                    className="w-full mt-4"
                  />
                </View>
              ) : (
                <View>
                  <Controller
                    control={signupControl}
                    name="displayName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Display Name"
                        placeholder="e.g. John Diddles"
                        autoCapitalize="words"
                        autoCorrect={false}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={signupErrors.displayName?.message}
                      />
                    )}
                  />

                  <Controller
                    control={signupControl}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Email Address"
                        placeholder="e.g. john@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={signupErrors.email?.message}
                      />
                    )}
                  />

                  <Controller
                    control={signupControl}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Password"
                        placeholder="At least 6 characters"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={signupErrors.password?.message}
                      />
                    )}
                  />

                  <Button
                    title="Create Account"
                    variant="primary"
                    loading={submitLoading}
                    onPress={handleSignupSubmit(onSignUp as any)}
                    className="w-full mt-4"
                  />
                </View>
              )}
            </View>

            {/* OAuth Dividers & Social Logins */}
            <View className="mb-10 mt-12">
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-border" />
                <AppText className="text-xs text-muted-foreground mx-4">OR CONTINUE WITH</AppText>
                <View className="flex-1 h-px bg-border" />
              </View>

              <Pressable
                onPress={googleLoading ? undefined : handleGoogleSignIn}
                className="flex-row items-center justify-center border border-border bg-card rounded-xl py-3.5 active:bg-secondary/40"
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#e4b022" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#EA4335" className="mr-2.5" />
                    <AppText weight="semibold" className="text-foreground ml-2">
                      Continue with Google
                    </AppText>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
