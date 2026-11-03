import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { Ionicons } from '@expo/vector-icons';
import { getTrackingId } from '../../lib/complaintUtils';
import { useTranslation } from 'react-i18next';

export default function ComplaintSuccess() {
  const { id, trackingId } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const displayId = trackingId || getTrackingId({ id });

  return (
    <ScreenContainer useSafeArea style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
        </View>
        
        <AppText variant="headingLarge" style={styles.title}>{t('complaint_success_title')}</AppText>
        <AppText variant="bodyMedium" style={styles.subtitle}>
          {t('complaint_success_desc')}
        </AppText>
        
        <View style={styles.infoCard}>
          <AppText variant="label" style={styles.label}>{t('tracking_id_banner_label')}</AppText>
          <View style={styles.badgeWrapper}>
            <AppText variant="headingLarge" style={styles.idText}>
              #{displayId}
            </AppText>
          </View>
          <View style={styles.statusBadge}>
            <AppText variant="label" style={styles.statusText}>{t('status_submitted_label')}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton 
          title={t('myComplaints')} 
          onPress={() => router.replace('/(tabs)/complaints')} 
          style={styles.buttonSpacing}
        />
        
        {id && (
          <AppButton 
            title={t('complaint_details_title')} 
            onPress={() => router.replace({ pathname: '/complaints/details', params: { id } })}
            variant="outline"
            style={styles.buttonSpacing}
          />
        )}
        
        <AppButton 
          title={t('tab_home')} 
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
    fontSize: 13,
  },
  badgeWrapper: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
  },
  idText: {
    color: colors.primaryDark || colors.primary,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  statusBadge: {
    backgroundColor: colors.infoPale || '#e1f5fe',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    marginTop: spacing.xs,
  },
  statusText: {
    color: colors.info,
    fontWeight: '600',
  },
  actions: {
    paddingBottom: spacing.lg,
  },
  buttonSpacing: {
    marginBottom: spacing.md,
  }
});
