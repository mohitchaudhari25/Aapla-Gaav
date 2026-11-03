import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
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
              .maybeSingle();

            if (profile) {
              setUserProfile(profile);
              if (profile.village_id) {
                const { data: village } = await supabase
                  .from('villages')
                  .select('name')
                  .eq('id', profile.village_id)
                  .maybeSingle();
                if (village) setVillageName(village.name);
              }
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
    const title = t('logout_confirm_title', 'लॉगआउट');
    const msg = t('logout_confirm_msg', 'तुम्हाला नक्की लॉगआउट करायचे आहे का?');
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        performLogout();
      }
    } else {
      Alert.alert(title, msg, [
        { text: t('no', 'नाही'), style: 'cancel' },
        { text: t('yes', 'होय'), style: 'destructive', onPress: performLogout }
      ]);
    }
  };

  // Only keep Edit Profile, Settings, and Help & Info in Profile section
  // My Complaints, Notifications, and Important Contacts are handled by their dedicated tabs/routes
  const profileOptions = [
    { id: '1', title: t('editProfile', 'प्रोफाइल संपादित करा'), icon: 'person-circle-outline', onPress: handleEditProfile },
    { id: '2', title: t('settings', 'सेटिंग्ज'), icon: 'settings-outline', onPress: () => router.push('/profile/settings') },
    { id: '6', title: t('helpAndInfo', 'मदत आणि माहिती'), icon: 'information-circle-outline', onPress: () => router.push('/profile/about') },
  ];

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <AppText variant="headingMedium">{t('profile', 'प्रोफाइल')}</AppText>
        <View style={styles.langPillContainer}>
          <TouchableOpacity
            onPress={() => {
              i18n.changeLanguage('mr');
              AsyncStorage.setItem('user-language', 'mr');
            }}
            style={[styles.langPillBtn, i18n.language === 'mr' && styles.langPillBtnActive]}
            activeOpacity={0.8}
          >
            <AppText style={[styles.langPillText, i18n.language === 'mr' && styles.langPillTextActive]}>
              मराठी
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              i18n.changeLanguage('en');
              AsyncStorage.setItem('user-language', 'en');
            }}
            style={[styles.langPillBtn, i18n.language === 'en' && styles.langPillBtnActive]}
            activeOpacity={0.8}
          >
            <AppText style={[styles.langPillText, i18n.language === 'en' && styles.langPillTextActive]}>
              EN
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* User Info Card */}
        <View style={styles.userCard}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <View style={styles.avatarWrapper}>
                {userProfile?.avatar_url ? (
                  <Image source={{ uri: userProfile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <AppText variant="headingLarge" style={styles.avatarText}>
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                  </AppText>
                )}
              </View>

              {userProfile?.full_name ? (
                <AppText variant="headingMedium" style={styles.userName}>
                  {userProfile.full_name}
                </AppText>
              ) : null}

              {userProfile?.phone_number ? (
                <AppText variant="bodyMedium" style={styles.userInfo}>
                  {userProfile.phone_number}
                </AppText>
              ) : null}

              {userProfile?.email ? (
                <AppText variant="bodySmall" style={[styles.userInfo, { marginTop: -2 }]}>
                  {userProfile.email}
                </AppText>
              ) : null}

              {villageName ? (
                <View style={styles.villageBadge}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <AppText variant="label" style={styles.villageText}>
                    {villageName}
                  </AppText>
                </View>
              ) : null}
            </>
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
          title={loggingOut ? t('logging_out', 'लॉगआउट करत आहे...') : t('logout', 'लॉगआउट')}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  langPillBtnActive: {
    backgroundColor: colors.primary,
  },
  langPillText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  langPillTextActive: {
    color: colors.white,
    fontWeight: '700',
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
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  userInfo: {
    color: colors.secondaryText,
    marginBottom: spacing.xs,
  },
  villageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryPale,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  villageText: {
    color: colors.primaryDark || colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
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
    borderBottomColor: colors.borderLight || colors.border,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionTitle: {
    flex: 1,
    color: colors.text,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: spacing.sm,
    borderColor: colors.error,
  },
});
