import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';

export default function InfoCard({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title && <AppText variant="headingSmall" style={styles.title}>{title}</AppText>}
      <View style={styles.content}>
        {children}
      </View>
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
  },
  title: {
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  content: {
    // any default layout for children
  }
});
