import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';
import { useTranslation } from 'react-i18next';
import { getTrackingId, getTwoDigitId, parseComplaintCategory, formatComplaintDateTime } from '../../lib/complaintUtils';

export default function ComplaintCard({ title, id, category, status, date, createdAt, description, item, index, style, onPress }) {
  const { t, i18n } = useTranslation();
  const getStatusColor = (s) => {
    switch (s?.trim()) {
      case 'सोडवले': return colors.primary;
      case 'प्रक्रियेत': return colors.warning;
      case 'नाकारले': return colors.error;
      case 'प्राप्त':
      default: return colors.info;
    }
  };

  const compItem = item || { id, title, category, status, created_at: createdAt, description };
  const trackingId = getTrackingId(compItem);
  const twoDigitId = getTwoDigitId(compItem, index);
  const resolvedCategory = category || parseComplaintCategory(description || compItem.description, 'सामान्य');
  
  // Format Date and Time + Relative
  const dateInfo = formatComplaintDateTime(createdAt || compItem.created_at || date, i18n.language);

    const getStatusLabel = (s) => {
    switch (s?.trim()) {
      case 'सोडवले':
      case 'resolved': return t('status_resolved', 'सोडवले');
      case 'प्रक्रियेत':
      case 'in_progress': return t('status_in_progress', 'प्रक्रियेत');
      case 'नाकारले':
      case 'rejected': return t('status_rejected', 'नाकारले');
      case 'प्राप्त':
      case 'received':
      default: return t('status_received', 'प्राप्त');
    }
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <AppText variant="headingSmall" style={styles.title}>{title}</AppText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <AppText variant="label" style={styles.statusText}>{getStatusLabel(status)}</AppText>
        </View>
      </View>
      
      <View style={styles.row}>
        <AppText variant="label" style={styles.label}>{t('complaint_tracking_id_label', 'तक्रार आयडी')}:</AppText>
        <View style={styles.idBadge}>
          <AppText variant="bodySmall" style={styles.idText}>#{twoDigitId}</AppText>
        </View>
        <AppText variant="caption" style={{ color: colors.secondaryText, marginLeft: 8 }}>
          (#{trackingId})
        </AppText>
      </View>
      
      <View style={styles.row}>
        <AppText variant="label" style={styles.label}>{t('complaint_category_label', 'प्रकार')}:</AppText>
        <AppText variant="bodySmall" style={styles.valueText}>{resolvedCategory}</AppText>
      </View>
      
      <View style={styles.row}>
        <AppText variant="label" style={styles.label}>{t('complaint_datetime_label', 'दिनांक व वेळ')}:</AppText>
        <AppText variant="bodySmall" style={styles.valueText}>{dateInfo.display || date}</AppText>
      </View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    width: 130,
    color: colors.secondaryText,
    fontSize: 12,
  },
  idBadge: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idText: {
    color: colors.primaryDark || colors.primary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  valueText: {
    color: colors.text,
    fontSize: 12,
    flex: 1,
  },
});
