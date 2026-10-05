import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, config, spacing } from '../constants';
import AppText from '../components/ui/AppText';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const timer = setTimeout(() => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/language');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    };
    
    checkSession();
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
  }
});
