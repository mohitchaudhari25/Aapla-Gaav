import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';

const DEMO_USER = {
  name: "मोहन पाटील",
  mobile: "9876543210",
  village: "आपलं गाव",
  language: "Marathi"
};

export default function Profile() {
  const router = useRouter();

  const handleEditProfile = () => {
    Alert.alert("प्रोफाइल संपादित करा", "ही सुविधा लवकरच उपलब्ध होईल.");
  };

  const handleAppInfo = () => {
    Alert.alert(
      "अॅपची माहिती", 
      'AaplaGaav\n"आपलं गाव, आपली माहिती, आपली सेवा"\n\nVersion: 1.0.0'
    );
  };

  const handleLogout = () => {
    Alert.alert("लॉगआउट", "तुम्हाला नक्की लॉगआउट करायचे आहे का?", [
      { text: "नाही", style: "cancel" },
      { 
        text: "होय", 
        style: "destructive", 
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        } 
      }
    ]);
  };

  const profileOptions = [
    { id: '1', title: 'प्रोफाइल संपादित करा', icon: 'person-circle-outline', onPress: handleEditProfile },
    { id: '2', title: 'भाषा', icon: 'language-outline', onPress: () => router.push('/onboarding/language') },
    { id: '3', title: 'माझ्या तक्रारी', icon: 'list-outline', onPress: () => router.push('/(tabs)/complaints') },
    { id: '4', title: 'सूचना', icon: 'notifications-outline', onPress: () => router.push('/(tabs)/notifications') },
    { id: '5', title: 'महत्त्वाचे संपर्क', icon: 'call-outline', onPress: () => router.push('/contacts') },
    { id: '6', title: 'अॅपची माहिती', icon: 'information-circle-outline', onPress: handleAppInfo },
  ];

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <AppText variant="headingMedium">प्रोफाइल</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <AppText variant="headingLarge" style={styles.avatarText}>
              {DEMO_USER.name ? DEMO_USER.name.charAt(0) : '?'}
            </AppText>
          </View>
          <AppText variant="headingMedium" style={styles.userName}>
            {DEMO_USER.name || 'माहिती उपलब्ध नाही'}
          </AppText>
          <AppText variant="bodyMedium" style={styles.userInfo}>
            {DEMO_USER.mobile || 'माहिती उपलब्ध नाही'}
          </AppText>
          <View style={styles.villageBadge}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <AppText variant="label" style={styles.villageText}>
              {DEMO_USER.village || 'माहिती उपलब्ध नाही'}
            </AppText>
          </View>
        </View>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option, index) => (
            <TouchableOpacity 
              key={option.id} 
              style={[
                styles.optionRow, 
                index === profileOptions.length - 1 && styles.optionRowLast
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconWrapper}>
                <Ionicons name={option.icon} size={22} color={colors.primary} />
              </View>
              <AppText variant="bodyMedium" style={styles.optionTitle}>{option.title}</AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <AppButton 
          title="लॉगआउट" 
          onPress={handleLogout} 
          variant="outline"
          style={styles.logoutButton}
          textStyle={{ color: colors.error }}
        />

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.primary,
  },
  userName: {
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userInfo: {
    color: colors.secondaryText,
    marginBottom: spacing.sm,
  },
  villageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  villageText: {
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  optionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionTitle: {
    flex: 1,
    color: colors.text,
  },
  logoutButton: {
    borderColor: colors.error,
    marginBottom: spacing.xxl,
  }
});
