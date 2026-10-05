import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

export default function AppText({ variant = 'bodyMedium', style, children, ...props }) {
  const textStyle = typography[variant] || typography.bodyMedium;
  return (
    <Text style={[styles.defaultText, textStyle, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  defaultText: {
    color: colors.text,
  },
});
