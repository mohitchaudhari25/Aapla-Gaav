import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';

export default function NoticeCard({ title, date, description, style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <AppText variant="headingSmall" style={styles.title}>{title}</AppText>
        <AppText variant="label" style={styles.date}>{date}</AppText>
      </View>
      <AppText variant="bodyMedium" style={styles.description}>{description}</AppText>
    </View>
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
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
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
  },
  date: {
    color: colors.secondaryText,
  },
  description: {
    color: colors.secondaryText,
  }
});
