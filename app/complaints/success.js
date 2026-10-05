import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { Ionicons } from '@expo/vector-icons';

export default function ComplaintSuccess() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <ScreenContainer useSafeArea style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
        </View>
        
        <AppText variant="headingLarge" style={styles.title}>तक्रार यशस्वीरित्या नोंदवली!</AppText>
        <AppText variant="bodyMedium" style={styles.subtitle}>
          तुमची तक्रार ग्रामपंचायतीकडे नोंदवण्यात आली आहे.
        </AppText>
        
        <View style={styles.infoCard}>
          <AppText variant="label" style={styles.label}>तक्रार क्रमांक</AppText>
          <AppText variant="headingMedium" style={styles.idText}>
            {id || 'तक्रार क्रमांक उपलब्ध नाही'}
          </AppText>
          <View style={styles.statusBadge}>
            <AppText variant="label" style={styles.statusText}>स्थिती: प्राप्त</AppText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton 
          title="माझ्या तक्रारी पहा" 
          onPress={() => router.replace('/(tabs)/complaints')} 
          style={styles.buttonSpacing}
        />
        
        {id && (
          <AppButton 
            title="तक्रारीचा तपशील पहा" 
            onPress={() => router.replace({ pathname: '/complaints/details', params: { id } })}
            variant="outline"
            style={styles.buttonSpacing}
          />
        )}
        
        <AppButton 
          title="मुख्यपृष्ठावर जा" 
          onPress={() => router.replace('/(tabs)')} 
          variant="outline"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    color: colors.secondaryText,
    marginBottom: spacing.xs,
  },
  idText: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  statusBadge: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
  },
  statusText: {
    color: colors.white,
  },
  actions: {
    paddingBottom: spacing.xl,
  },
  buttonSpacing: {
    marginBottom: spacing.md,
  }
});
