import { Stack } from "expo-router";

const PublicRoutesLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth" />
    </Stack>
  );
};

export default PublicRoutesLayout;
