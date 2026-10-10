import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import { spacing, radius } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useThemeContext, useAppTheme } from '../../lib/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { themeMode, changeTheme } = useThemeContext();
  const themeColors = useAppTheme();
  
  const styles = getStyles(themeColors);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <ScreenContainer useSafeArea>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="headingLarge" style={styles.title}>{t('settings')}</AppText>
        
        <View style={styles.section}>
          <AppText variant="headingMedium" style={styles.sectionTitle}>{t('language')}</AppText>
          <View style={styles.row}>
            {['mr', 'hi', 'en'].map((lang) => (
              <TouchableOpacity 
                key={lang} 
                style={[styles.button, i18n.language === lang && styles.buttonActive]}
                onPress={() => changeLanguage(lang)}
              >
                <AppText style={[styles.buttonText, i18n.language === lang && styles.buttonTextActive]}>
                  {lang === 'mr' ? 'मराठी' : lang === 'hi' ? 'हिन्दी' : 'English'}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="headingMedium" style={styles.sectionTitle}>{t('appearance')}</AppText>
          <View style={styles.row}>
            {['light', 'dark', 'system'].map((mode) => (
              <TouchableOpacity 
                key={mode} 
                style={[styles.button, themeMode === mode && styles.buttonActive]}
                onPress={() => changeTheme(mode)}
              >
                <AppText style={[styles.buttonText, themeMode === mode && styles.buttonTextActive]}>
                  {mode === 'light' ? t('lightMode') : mode === 'dark' ? t('darkMode') : t('systemMode')}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  title: { marginBottom: spacing.xl, color: colors.primary },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { marginBottom: spacing.md, color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: { color: colors.text },
  buttonTextActive: { color: colors.white, fontWeight: 'bold' },
});
