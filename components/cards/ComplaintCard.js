import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';

export default function ComplaintCard({ title, id, category, status, date, style, onPress }) {
  const getStatusColor = (s) => {
    switch (s?.trim()) {
      case 'सोडवले': return colors.primary;
      case 'प्रक्रियेत': return colors.warning;
      case 'नाकारले': return colors.error;
      case 'प्राप्त':
      default: return colors.info;
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
          <AppText variant="label" style={styles.statusText}>{status}</AppText>
        </View>
      </View>
      
      <View style={styles.row}>
        <AppText variant="label" style={styles.label}>ID:</AppText>
        <AppText variant="bodySmall">{id}</AppText>
      </View>
      
      <View style={styles.row}>
        <AppText variant="label" style={styles.label}>Category:</AppText>
        <AppText variant="bodySmall">{category}</AppText>
      </View>
      
      <View style={styles.row}>
        <AppText variant="label" style={styles.label}>Date:</AppText>
        <AppText variant="bodySmall">{date}</AppText>
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
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
  },
  statusText: {
    color: colors.white,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    width: 70,
    color: colors.secondaryText,
  }
});
