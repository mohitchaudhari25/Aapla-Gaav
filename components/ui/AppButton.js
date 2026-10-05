import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants';
import AppText from './AppText';

export default function AppButton({ title, onPress, disabled, style, variant = 'primary' }) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.buttonOutline,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <AppText variant="button" style={[
        styles.text, 
        isOutline && styles.textOutline,
        disabled && styles.textDisabled
      ]}>
        {title}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.border,
  },
  text: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.secondaryText,
  }
});
