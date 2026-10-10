import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../../constants';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../lib/ThemeContext';

const LANGUAGES = [
  { id: 'mr', main: 'मराठी', secondary: 'Marathi' },
  { id: 'hi', main: 'हिंदी', secondary: 'Hindi' },
  { id: 'en', main: 'English', secondary: 'English' },
];

export default function Language() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const colors = useAppTheme();
  const styles = getStyles(colors);
  const [selected, setSelected] = useState(i18n.language || 'mr');

  const handleLanguageSelect = (id) => {
    setSelected(id);
    i18n.changeLanguage(id);
    if (selected === id) {
      router.push('/auth/login');
    }
  };

  const handleContinue = () => {
    router.push('/auth/login');
  };

  return (
    <ScreenContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="globe-outline" size={48} color={colors.primary} />
        </View>
        <AppText variant="headingLarge" style={styles.title}>भाषा निवडा</AppText>
        <AppText variant="bodyMedium" style={styles.subtitle}>Select your preferred language</AppText>
      </View>

      <View style={styles.list}>
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.id;
          return (
            <TouchableOpacity
              key={lang.id}
              activeOpacity={0.8}
              onPress={() => handleLanguageSelect(lang.id)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardUnselected
              ]}
            >
              <View style={styles.cardContent}>
                <AppText variant="headingSmall" style={styles.langMain}>{lang.main}</AppText>
                <AppText variant="bodyMedium" style={styles.langSecondary}>{lang.secondary}</AppText>
              </View>
              
              {isSelected ? (
                <View style={styles.badge}>
                  <View style={styles.badgePill}>
                    <AppText variant="label" style={styles.badgeText}>निवडले</AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={24} color={colors.border} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.footer}>
        <AppButton title="पुढे जा (Next)" onPress={handleContinue} />
      </View>
    </ScreenContainer>
  );
}

const getStyles = (colors) => StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  iconContainer: {
    backgroundColor: colors.primaryPale,
    padding: spacing.md,
    borderRadius: radius.round,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.secondaryText,
  },
  list: {
    flex: 1,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardSelected: {
    backgroundColor: colors.primaryPale,
    borderColor: colors.primaryLight,
  },
  cardUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardContent: {
    flex: 1,
  },
  langMain: {
    color: colors.text,
  },
  langSecondary: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.white,
  },
  footer: {
    paddingBottom: spacing.xl,
  }
});
