import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { ThemeProvider } from '../lib/ThemeContext';
import '../lib/i18n';

// Remove browser focus outline and tap highlight on Web across all buttons, cards, and sections
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'aapla-gaav-web-outline-reset';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      *, *::before, *::after {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      *:focus, *:focus-visible, *:active {
        outline: none !important;
      }
      button, [role="button"], a, input, select, textarea, [tabindex], div, section {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      button:focus, button:focus-visible, button:active,
      [role="button"]:focus, [role="button"]:focus-visible, [role="button"]:active,
      a:focus, a:focus-visible, a:active,
      input:focus, input:focus-visible, input:active,
      select:focus, select:focus-visible, select:active,
      textarea:focus, textarea:focus-visible, textarea:active,
      [tabindex]:focus, [tabindex]:focus-visible, [tabindex]:active,
      div:focus, div:focus-visible, div:active,
      section:focus, section:focus-visible, section:active {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default function RootLayout() {
  return (
    <ThemeProvider>
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
        <Stack.Screen name="profile/about" options={{ headerShown: true, title: 'मदत आणि माहिती' }} />
        <Stack.Screen name="profile/settings" options={{ headerShown: true, title: 'सेटिंग्ज' }} />
      </Stack>
    </ThemeProvider>
  );
}
