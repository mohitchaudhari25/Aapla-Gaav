import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants';
import AppText from '../ui/AppText';
import AppButton from '../ui/AppButton';

export default function EmptyState({ title, description, buttonTitle, onButtonPress, style }) {
  return (
    <View style={[styles.container, style]}>
      <AppText variant="headingMedium" style={styles.title}>{title}</AppText>
      {description && (
        <AppText variant="bodyMedium" style={styles.description}>
          {description}
        </AppText>
      )}
      {buttonTitle && onButtonPress && (
        <AppButton 
          title={buttonTitle} 
          onPress={onButtonPress} 
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  description: {
    textAlign: 'center',
    color: colors.secondaryText,
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 150,
  }
});
