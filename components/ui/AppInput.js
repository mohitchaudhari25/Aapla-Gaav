import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { colors, spacing, radius, typography } from '../../constants';
import AppText from './AppText';

export default function AppInput({ label, error, style, ...props }) {
  return (
    <View style={[styles.container, style]}>
      {label && <AppText variant="label" style={styles.label}>{label}</AppText>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.secondaryText}
        {...props}
      />
      {error && <AppText variant="label" style={styles.errorText}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...typography.bodyMedium,
    color: colors.text,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
  }
});
