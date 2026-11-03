import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, config, spacing } from '../constants';
import AppText from '../components/ui/AppText';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let timer = null;

    const checkSession = async () => {
      let hasSession = false;
      try {
        const { data } = await supabase.auth.getSession();
        hasSession = !!data?.session;
      } catch (e) {
        console.warn('Session check error:', e);
      }

      timer = setTimeout(() => {
        if (!mounted) return;
        if (hasSession) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/language');
        }
      }, 1500);
    };

    checkSession();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AppText variant="headingLarge" style={styles.title}>
          {config.APP_NAME}
        </AppText>
        <AppText variant="bodyMedium" style={styles.tagline}>
          {config.TAGLINE}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.white,
    marginBottom: spacing.md,
  },
  tagline: {
    color: colors.primaryPale,
    textAlign: 'center',
  },
});
