import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../../constants';
import AppText from '../../components/ui/AppText';
import NoticeCard from '../../components/cards/NoticeCard';
import { supabase } from '../../lib/supabase';
import { mockNotices, mockFunds, mockVillage } from '../../data/mockData';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../lib/ThemeContext';

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useAppTheme();
  
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [fundsData, setFundsData] = useState({ totalIncome: 0, totalSpent: 0, remaining: 0, spendingPercentage: 0 });
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [userName, setUserName] = useState('');
  const [villageName, setVillageName] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchNoticesAndFunds = async () => {
        try {
          setLoadingNotices(true);
          setLoadingFunds(true);

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('village_id, full_name')
              .eq('id', user.id)
              .single();

            if (profile) {
              setUserName(profile.full_name || '');
              if (profile.village_id) {
                const { data: village } = await supabase
                  .from('villages')
                  .select('name')
                  .eq('id', profile.village_id)
                  .single();
                  
                if (village) setVillageName(village.name);
              }
            }

            if (profile?.village_id) {
              const { data: noticesData } = await supabase
                .from('notices')
                .select('*')
                .eq('status', 'published')
                .eq('village_id', profile.village_id)
                .order('created_at', { ascending: false })
                .limit(2);

              if (noticesData && noticesData.length > 0) {
                setNotices(noticesData);
              } else {
                setNotices([]);
              }

              const { data: fundsRows } = await supabase
                .from('fund_transactions')
                .select('transaction_type, amount')
                .eq('village_id', profile.village_id);

              const txList = fundsRows || [];
              const totalIncome = txList.filter(t => (t.transaction_type || t.type) === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalSpent = txList.filter(t => (t.transaction_type || t.type) === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const remaining = totalIncome - totalSpent;
              const spendingPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;
              setFundsData({ totalIncome, totalSpent, remaining, spendingPercentage, hasData: txList.length > 0, isDemo: false });
            } else {
              // Guest or unassigned village mode: show clean sample preview without claiming false database state
              setNotices(mockNotices.slice(0, 2));
              const txList = mockFunds;
              const totalIncome = txList.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalSpent = txList.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const remaining = totalIncome - totalSpent;
              const spendingPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;
              setFundsData({ totalIncome, totalSpent, remaining, spendingPercentage, hasData: true, isDemo: true });
            }
          } else {
            // Guest mode
            setNotices(mockNotices.slice(0, 2));
            const txList = mockFunds;
            const totalIncome = txList.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const totalSpent = txList.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const remaining = totalIncome - totalSpent;
            const spendingPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;
            setFundsData({ totalIncome, totalSpent, remaining, spendingPercentage, hasData: true, isDemo: true });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingNotices(false);
          setLoadingFunds(false);
        }
      };

      fetchNoticesAndFunds();
    }, [])
  );

  // Quick Services data
  const quickServices = [
    { id: '3', title: t('home_quick_my_village'), icon: 'business-outline', route: '/village', color: colors.primary },
    { id: '1', title: t('home_quick_report'), icon: 'alert-circle-outline', route: '/complaints/new', color: colors.warning },
    { id: '4', title: t('home_quick_projects'), icon: 'construct-outline', route: '/projects', color: '#8E24AA' },
  ];

  const { width } = Dimensions.get('window');
  
  const schemeNews = [
    { id: '1', title: 'शासकीय शिलाई मशीन सहाय्य', subtitle: 'ग्रामीण महिला स्वयंरोजगार माहिती', badge: t('home_scheme_badge') },
    { id: '2', title: 'महाडीबीटी कृषी योजना', subtitle: 'अवजारे व ठिबक सिंचन अनुदान', badge: t('home_agri_badge') },
    { id: '3', title: 'पीएम किसान सन्मान निधी', subtitle: 'पात्रता व ई-केवायसी पडताळणी', badge: t('home_fund_badge') },
    { id: '4', title: 'ग्रामसभा व विकास आराखडा', subtitle: 'ग्रामपंचायत ठराव व माहिती', badge: t('home_news_badge') },
  ];

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Custom Header Area */}
          <View style={styles.profileHeader}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <AppText variant="label" style={styles.greeting}>{t('home_greeting')}</AppText>
              <AppText variant="headingMedium" style={styles.userName}>{userName || t('home_citizen')}</AppText>
              <AppText variant="label" style={styles.location}>
                📍 {villageName ? `${villageName} ${t('home_village_panchayat')}` : t('home_village_no_data')}
              </AppText>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={styles.notificationBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="notifications-outline" size={24} color={colors.white} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>

          {/* Government Schemes & Citizen News Carousel */}
          <View style={styles.carouselContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width * 0.85 + spacing.md} decelerationRate="fast" contentContainerStyle={styles.carouselScroll}>
              {schemeNews.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.schemeCard} 
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/schemes/details', params: { id: item.id } })}
                >
                  <View style={styles.schemeHeader}>
                    <View style={styles.schemeBadge}>
                      <AppText variant="label" style={styles.schemeBadgeText}>{item.badge}</AppText>
                    </View>
                  </View>
                  <AppText variant="headingSmall" style={styles.schemeTitle}>{item.title}</AppText>
                  <AppText variant="bodyMedium" style={styles.schemeSubtitle}>{item.subtitle}</AppText>
                  <View style={styles.schemeAction}>
                    <AppText variant="label" style={styles.schemeActionText}>{t('home_more_info')}</AppText>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        {/* Quick Services Section */}
        <View style={[styles.section, { paddingTop: spacing.md }]}>
          <AppText variant="headingSmall" style={[styles.sectionTitle, { marginBottom: spacing.md, paddingHorizontal: spacing.lg }]}>{t('home_quick_services')}</AppText>
          <View style={styles.quickServicesGrid}>
            {quickServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => router.push(service.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon} size={28} color={service.color} />
                </View>
                <AppText variant="label" style={styles.serviceTitle}>{service.title}</AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Village Notices Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>{t('home_village_notices')}</AppText>
            <TouchableOpacity onPress={() => router.push('/notices')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText variant="label" style={styles.seeAllText}>{t('home_see_all')}</AppText>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: spacing.lg }}>

          {loadingNotices ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : notices.length === 0 ? (
            <AppText variant="bodyMedium" style={{ color: colors.secondaryText, textAlign: 'center', marginVertical: spacing.md }}>
              {t('home_no_notices')}
            </AppText>
          ) : (
            notices.map((notice) => {
              const formattedDate = notice.created_at
                ? new Date(notice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : notice.date;

              return (
                <NoticeCard
                  key={notice.id}
                  title={notice.title}
                  date={formattedDate}
                  description={notice.content || notice.description}
                />
              );
            })
          )}
          </View>
        </View>

        {/* Important Contacts Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>{t('home_important_contacts')}</AppText>
            <TouchableOpacity onPress={() => router.push('/contacts')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText variant="label" style={styles.seeAllText}>{t('home_see_all')}</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactsScroll}>
            {[
              { id: '1', name: t('home_sarpanch'), phone: '98765-43210', iconName: 'person', iconColor: colors.primary },
              { id: '2', name: t('home_ambulance'), phone: '108', iconName: 'medkit', iconColor: colors.error },
              { id: '3', name: t('home_police'), phone: '100', iconName: 'shield-checkmark', iconColor: colors.info }
            ].map((contact) => (
              <TouchableOpacity key={contact.id} style={styles.contactCard} activeOpacity={0.7} onPress={() => router.push('/contacts')}>
                <View style={[styles.contactIconWrapper, { backgroundColor: contact.iconColor + '18' }]}>
                  <Ionicons name={contact.iconName} size={22} color={contact.iconColor} />
                </View>
                <AppText variant="label" style={styles.contactName}>{contact.name}</AppText>
                <AppText variant="bodySmall" style={styles.contactPhone}>{contact.phone}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Village Funds Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>{t('home_village_funds')}</AppText>
            <TouchableOpacity onPress={() => router.push('/village/funds')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText variant="label" style={styles.seeAllText}>{t('home_see_all')}</AppText>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: spacing.lg }}>
            <TouchableOpacity style={styles.fundsCard} onPress={() => router.push('/village/funds')} activeOpacity={0.9}>
            {loadingFunds ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <>
                <View style={styles.fundsRow}>
                  <View style={styles.fundItem}>
                    <AppText variant="headingMedium" style={styles.fundValueTotal}>₹{(fundsData.totalIncome / 100000).toFixed(1)} {t('home_lakh')}</AppText>
                    <AppText variant="label" style={styles.fundLabel}>{t('home_total_funds')}</AppText>
                  </View>
                  <View style={styles.fundItem}>
                    <AppText variant="headingMedium" style={styles.fundValueSpent}>₹{(fundsData.totalSpent / 100000).toFixed(1)} {t('home_lakh')}</AppText>
                    <AppText variant="label" style={styles.fundLabel}>{t('home_expense')}</AppText>
                  </View>
                  <View style={styles.fundItem}>
                    <AppText variant="headingMedium" style={styles.fundValueRemaining}>₹{(fundsData.remaining / 100000).toFixed(1)} {t('home_lakh')}</AppText>
                    <AppText variant="label" style={styles.fundLabel}>{t('home_balance')}</AppText>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${fundsData.spendingPercentage}%` }]} />
                  </View>
                  <AppText variant="label" style={styles.progressText}>{fundsData.spendingPercentage.toFixed(0)}{t('home_percent_spent')}</AppText>
                </View>
              </>
            )}
          </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 2,
    paddingTop: 0,
  },
  carouselContainer: {
    marginBottom: spacing.lg,
  },
  carouselScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  schemeCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    justifyContent: 'space-between',
    minHeight: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  schemeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  schemeBadgeText: {
    fontWeight: 'bold',
    color: colors.text,
  },
  schemeTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  schemeSubtitle: {
    color: colors.text,
    opacity: 0.8,
    marginBottom: spacing.md,
  },
  schemeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  schemeActionText: {
    color: colors.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  profileHeader: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    color: colors.primaryPale,
  },
  userName: {
    color: colors.white,
    marginVertical: 2,
  },
  location: {
    color: colors.primaryPale,
    opacity: 0.9,
  },
  notificationBtn: {
    padding: spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    backgroundColor: colors.warning,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '600',
  },
  quickServicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
    flexShrink: 1,
  },
  fundsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  fundItem: {
    alignItems: 'center',
    flex: 1,
  },
  fundValueTotal: {
    color: colors.text,
  },
  fundValueSpent: {
    color: colors.error,
  },
  fundValueRemaining: {
    color: colors.primary,
  },
  fundLabel: {
    color: colors.secondaryText,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
  },
  progressText: {
    color: colors.secondaryText,
    fontWeight: '600',
  },
  contactsScroll: {
    paddingRight: spacing.lg,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    width: 125,
    marginRight: spacing.md,
  },
  contactIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactName: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactPhone: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 12,
  }
});
