import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';

const formatCurrency = (amount) => {
  if (amount == null) return '₹०';
  return '₹' + amount.toLocaleString('en-IN');
};

export default function ProjectCard({ name, budget, spent, progress, status, onPress, style }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'चालू':
        return colors.info;
      case 'पूर्ण':
        return colors.primary;
      case 'नियोजित':
        return colors.warning;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <AppText variant="headingSmall" style={styles.title}>{name}</AppText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
          <AppText variant="label" style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status}
          </AppText>
        </View>
      </View>
      
      <View style={styles.finances}>
        <View style={styles.financeItem}>
          <AppText variant="label" style={styles.label}>मंजूर निधी</AppText>
          <AppText variant="bodyMedium" style={styles.value}>{formatCurrency(budget)}</AppText>
        </View>
        <View style={styles.financeItem}>
          <AppText variant="label" style={styles.label}>खर्च</AppText>
          <AppText variant="bodyMedium" style={styles.value}>{formatCurrency(spent)}</AppText>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <AppText variant="label" style={styles.label}>प्रगती</AppText>
          <AppText variant="label" style={styles.value}>{progress}%</AppText>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: getStatusColor(status) }]} />
        </View>
      </View>
    </TouchableOpacity>
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
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    fontWeight: '600',
  },
  finances: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  financeItem: {
    flex: 1,
  },
  label: {
    color: colors.secondaryText,
    marginBottom: 2,
  },
  value: {
    color: colors.text,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.round,
  }
});
