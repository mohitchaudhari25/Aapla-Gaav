import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/language" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="complaints/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="complaints/success" />
          <Stack.Screen name="complaints/details" />
          <Stack.Screen name="village/index" />
          <Stack.Screen name="village/funds" />
          <Stack.Screen name="contacts/index" />
          <Stack.Screen name="projects/index" />
          <Stack.Screen name="projects/details" />
          <Stack.Screen name="notices/index" />
          <Stack.Screen name="profile/about" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="profile/settings" />
          <Stack.Screen name="schemes/details" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
