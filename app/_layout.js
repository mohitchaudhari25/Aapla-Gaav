import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="onboarding/language" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="complaints/new" options={{ presentation: 'modal', headerShown: true, title: 'New Complaint' }} />
      <Stack.Screen name="complaints/success" options={{ headerShown: true, title: 'Success' }} />
      <Stack.Screen name="complaints/details" options={{ headerShown: true, title: 'Complaint Details' }} />
      <Stack.Screen name="village/index" options={{ headerShown: true, title: 'Village Info' }} />
      <Stack.Screen name="village/funds" options={{ headerShown: true, title: 'Village Funds' }} />
      <Stack.Screen name="projects/index" options={{ headerShown: true, title: 'Projects' }} />
      <Stack.Screen name="projects/details" options={{ headerShown: true, title: 'Project Details' }} />
      <Stack.Screen name="notices/index" options={{ headerShown: true, title: 'Notices' }} />
    </Stack>
  );
}
