import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants';

export default function ScreenContainer({ children, style, useSafeArea = true }) {
  const Container = useSafeArea ? SafeAreaView : View;
  
  return (
    <Container style={styles.safeArea}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  }
});
