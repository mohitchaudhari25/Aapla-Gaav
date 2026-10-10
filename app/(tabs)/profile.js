import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../lib/ThemeContext';

export default function Profile() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppTheme();
  
  const [userProfile, setUserProfile] = useState(null);
  const [villageName, setVillageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [complaintStats, setComplaintStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 });

  const styles = getStyles(colors);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profile) {
              setUserProfile(profile);
              if (profile.village_id) {
                const { data: village } = await supabase
                  .from('villages')
                  .select('name')
                  .eq('id', profile.village_id)
                  .single();
                if (village) setVillageName(village.name);
              }
            }

            // Fetch complaints
            const { data: complaints } = await supabase
              .from('complaints')
              .select('status')
              .eq('user_id', user.id);

            if (complaints) {
              const stats = { total: complaints.length, new: 0, inProgress: 0, resolved: 0 };
              complaints.forEach(c => {
                if (c.status === 'नवीन' || c.status === 'new' || c.status === 'submitted') stats.new++;
                else if (c.status === 'प्रगतीपथावर' || c.status === 'in_progress') stats.inProgress++;
                else if (c.status === 'सोडवली' || c.status === 'resolved') stats.resolved++;
              });
              setComplaintStats(stats);
            }
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, [])
  );

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth/login');
    } catch (error) {
      console.error(error);
      Alert.alert("त्रुटी", "लॉगआउट करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("तुम्हाला नक्की लॉगआउट करायचे आहे का?")) {
        performLogout();
      }
    } else {
      Alert.alert("लॉगआउट", "तुम्हाला नक्की लॉगआउट करायचे आहे का?", [
        { text: "नाही", style: "cancel" },
        { text: "होय", style: "destructive", onPress: performLogout }
      ]);
    }
  };

  const profileOptions = [
    { id: '1', title: t('editProfile', 'प्रोफाइल संपादित करा'), icon: 'person-circle-outline', onPress: handleEditProfile },
    { id: '2', title: t('settings', 'सेटिंग्ज (Settings)'), icon: 'settings-outline', onPress: () => router.push('/profile/settings') },
    { id: '3', title: t('myComplaints', 'माझ्या तक्रारी'), icon: 'list-outline', onPress: () => router.push('/(tabs)/complaints') },
    { id: '4', title: t('notifications', 'सूचना'), icon: 'notifications-outline', onPress: () => router.push('/(tabs)/notifications') },
    { id: '5', title: t('importantContacts', 'महत्त्वाचे संपर्क'), icon: 'call-outline', onPress: () => router.push('/contacts') },
    { id: '6', title: t('helpAndInfo', 'मदत आणि माहिती'), icon: 'information-circle-outline', onPress: () => router.push('/profile/about') },
  ];

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <AppText variant="headingMedium">प्रोफाइल</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* User Info Card */}
        <View style={styles.userCard}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <View style={styles.avatarWrapper}>
                <AppText variant="headingLarge" style={styles.avatarText}>
                  {userProfile?.full_name ? userProfile.full_name.charAt(0) : '?'}
                </AppText>
              </View>
              <AppText variant="headingMedium" style={styles.userName}>
                {userProfile?.full_name || 'माहिती उपलब्ध नाही'}
              </AppText>
              <AppText variant="bodyMedium" style={styles.userInfo}>
                {userProfile?.phone_number || 'माहिती उपलब्ध नाही'}
              </AppText>
              <View style={styles.villageBadge}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <AppText variant="label" style={styles.villageText}>
                  {villageName || 'माहिती उपलब्ध नाही'}
                </AppText>
              </View>
            </>
          )}
        </View>

        {/* Complaints Summary Card */}
        <View style={styles.complaintSummaryCard}>
          <AppText variant="headingSmall" style={styles.summaryTitle}>माझ्या तक्रारी (My Complaints)</AppText>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <AppText variant="headingMedium" style={{ color: colors.primary }}>{complaintStats.total}</AppText>
                <AppText variant="label">एकूण (Total)</AppText>
              </View>
              <View style={styles.summaryItem}>
                <AppText variant="headingMedium" style={{ color: colors.warning }}>{complaintStats.new}</AppText>
                <AppText variant="label">नवीन (New)</AppText>
              </View>
              <View style={styles.summaryItem}>
                <AppText variant="headingMedium" style={{ color: colors.info }}>{complaintStats.inProgress}</AppText>
                <AppText variant="label">प्रगतीपथावर</AppText>
              </View>
              <View style={styles.summaryItem}>
                <AppText variant="headingMedium" style={{ color: colors.success }}>{complaintStats.resolved}</AppText>
                <AppText variant="label">सोडवली</AppText>
              </View>
            </View>
          )}
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
          title={loggingOut ? "लॉगआउट करत आहे..." : "लॉगआउट"}
          onPress={handleLogout}
          variant="outline"
          disabled={loggingOut}
          style={styles.logoutButton}
        />

      </ScrollView>
    </ScreenContainer>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
  complaintSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
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
