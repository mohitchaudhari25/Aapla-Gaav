import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import { colors, spacing, radius } from '../../constants';

export default function AboutHelp() {
  return (
    <ScreenContainer useSafeArea>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="headingLarge">AaplaGaav</AppText>
          <AppText variant="bodyMedium">Version 1.0.0</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="headingMedium" style={styles.sectionTitle}>अॅपबद्दल माहिती</AppText>
          <AppText variant="bodyMedium">
            "आपलं गाव, आपली माहिती, आपली सेवा"
          </AppText>
          <AppText variant="bodyMedium" style={{ marginTop: 8 }}>
            हे अॅप ग्रामस्थांना गावातील विकासकामे, योजना, आणि समस्यांची माहिती एकाच ठिकाणी मिळवून देण्याच्या उद्देशाने बनवले आहे.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="headingMedium" style={styles.sectionTitle}>मदत आणि वारंवार विचारले जाणारे प्रश्न</AppText>
          <AppText variant="bodyLarge" style={styles.question}>तक्रार कशी नोंदवावी?</AppText>
          <AppText variant="bodyMedium" style={styles.answer}>
            'माझ्या तक्रारी' या विभागात जाऊन तुम्ही नवीन तक्रार नोंदवू शकता.
          </AppText>

          <AppText variant="bodyLarge" style={styles.question}>पासवर्ड कसा बदलावा?</AppText>
          <AppText variant="bodyMedium" style={styles.answer}>
            लॉगिन स्क्रीनवर 'पासवर्ड विसरलात?' वर क्लिक करा आणि ईमेल द्वारे नवीन पासवर्ड सेट करा.
          </AppText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.primary,
  },
  question: {
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  answer: {
    marginTop: spacing.xs,
    color: colors.secondaryText,
  }
});
