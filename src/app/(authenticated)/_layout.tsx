import React from 'react';
import { Stack } from 'expo-router';

export default function AuthenticatedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="folders" />
      <Stack.Screen name="folder/[id]" />
      <Stack.Screen name="note/[id]" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
