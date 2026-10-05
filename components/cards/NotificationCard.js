import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';

const typeIcons = {
  complaint: { name: 'alert-circle-outline', color: colors.warning },
  notice: { name: 'megaphone-outline', color: colors.info },
  project: { name: 'construct-outline', color: '#8E24AA' },
  gram_sabha: { name: 'people-outline', color: colors.primary },
};

export default function NotificationCard({ type, title, message, date, isRead, onPress, style }) {
  const iconInfo = typeIcons[type] || { name: 'notifications-outline', color: colors.primary };

  return (
    <TouchableOpacity 
      style={[styles.card, !isRead && styles.unreadCard, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: iconInfo.color + '20' }]}>
          <Ionicons name={iconInfo.name} size={24} color={iconInfo.color} />
        </View>
        {!isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant={!isRead ? "headingSmall" : "bodyMedium"} style={[styles.title, !isRead && styles.unreadTitle]}>
            {title}
          </AppText>
          <AppText variant="label" style={styles.date}>{date}</AppText>
        </View>
        <AppText variant="bodySmall" style={styles.message} numberOfLines={2}>
          {message}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  unreadCard: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryPale,
    opacity: 1,
  },
  iconContainer: {
    marginRight: spacing.md,
    position: 'relative',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
    color: colors.text,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  date: {
    color: colors.secondaryText,
  },
  message: {
    color: colors.secondaryText,
    lineHeight: 20,
  }
});
