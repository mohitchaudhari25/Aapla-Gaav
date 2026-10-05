import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

export default function Onboarding() {
  const router = useRouter();

  const handleSkip = () => {
    router.push('/auth/login');
  };

  const handleNext = () => {
    // There are no other onboarding screens in the source, so we proceed to login.
    router.push('/auth/login');
  };

  return (
    <ScreenContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <AppText variant="button" style={styles.skipText}>वगळा</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* Using the closest existing project asset as instructed */}
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <AppText variant="headingLarge" style={styles.title}>गावाची माहिती एका ठिकाणी</AppText>
          <AppText variant="bodyMedium" style={styles.subtitle}>Your village's information at one place</AppText>
          <AppText variant="bodyMedium" style={styles.description}>
            गावाची सर्व माहिती, संपर्क क्रमांक, सुविधा आणि सेवा एका ठिकाणी मिळवा.
          </AppText>
        </View>

        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton title="पुढे →" onPress={handleNext} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-end',
    paddingVertical: spacing.md,
  },
  skipText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  imageContainer: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPale,
    width: 240,
    height: 240,
    borderRadius: radius.round,
  },
  illustration: {
    width: 140,
    height: 140,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingBottom: spacing.xl,
  }
});
