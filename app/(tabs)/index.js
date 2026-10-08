import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../../components/ui/AppText';
import NoticeCard from '../../components/cards/NoticeCard';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [fundsData, setFundsData] = useState({ totalIncome: 0, totalSpent: 0, remaining: 0, spendingPercentage: 0 });
  const [loadingFunds, setLoadingFunds] = useState(true);

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
              .select('village_id')
              .eq('id', user.id)
              .single();

            if (profile?.village_id) {
              const { data: noticesData } = await supabase
                .from('notices')
                .select('*')
                .eq('status', 'published')
                .eq('village_id', profile.village_id) // Assuming we only want notices for their village
                .order('created_at', { ascending: false })
                .limit(2);

              if (noticesData) {
                setNotices(noticesData);
              }

              const { data: fundsData } = await supabase
                .from('fund_transactions')
                .select('type, amount')
                .eq('village_id', profile.village_id);

              if (fundsData) {
                const totalIncome = fundsData.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalSpent = fundsData.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
                const remaining = totalIncome - totalSpent;
                const spendingPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;
                setFundsData({ totalIncome, totalSpent, remaining, spendingPercentage });
              }
            }
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
    { id: '1', title: 'तक्रार नोंदवा', icon: 'alert-circle-outline', route: '/complaints/new', color: colors.warning },
    { id: '2', title: 'माझ्या तक्रारी', icon: 'list-outline', route: '/(tabs)/complaints', color: colors.info },
    { id: '3', title: 'माझं गाव', icon: 'business-outline', route: '/village', color: colors.primary },
    { id: '4', title: 'विकास कामे', icon: 'construct-outline', route: '/projects', color: '#8E24AA' },
  ];


  return (
    <View style={styles.container}>
      {/* Custom Header Area */}
      <View style={styles.header}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContent}>
            <View>
              <AppText variant="label" style={styles.greeting}>नमस्कार 👋</AppText>
              <AppText variant="headingMedium" style={styles.userName}>मोहित चौधरी</AppText>
              <AppText variant="label" style={styles.location}>📍 ... ग्रामपंचायत, जळगाव</AppText>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={styles.notificationBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="notifications-outline" size={24} color={colors.white} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Quick Services Section */}
        <View style={styles.section}>
          <AppText variant="headingSmall" style={[styles.sectionTitle, { marginBottom: spacing.md }]}>त्वरित सेवा</AppText>
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
          <View style={styles.sectionHeader}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>📢 गावातील सूचना</AppText>
            <TouchableOpacity onPress={() => router.push('/notices')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText variant="label" style={styles.seeAllText}>सर्व पहा</AppText>
            </TouchableOpacity>
          </View>

          {loadingNotices ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : notices.length === 0 ? (
            <AppText variant="bodyMedium" style={{ color: colors.secondaryText, textAlign: 'center', marginVertical: spacing.md }}>
              सध्या कोणतीही सूचना उपलब्ध नाही.
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
                  description={notice.description}
                />
              );
            })
          )}
        </View>

        {/* Village Funds Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>💰 गावाचा निधी</AppText>
            <TouchableOpacity onPress={() => router.push('/village/funds')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText variant="label" style={styles.seeAllText}>सर्व पहा</AppText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.fundsCard} onPress={() => router.push('/village/funds')} activeOpacity={0.9}>
            {loadingFunds ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <>
                <View style={styles.fundsRow}>
                  <View style={styles.fundItem}>
                    <AppText variant="headingMedium" style={styles.fundValueTotal}>₹{(fundsData.totalIncome / 100000).toFixed(1)} ल</AppText>
                    <AppText variant="label" style={styles.fundLabel}>एकूण निधी</AppText>
                  </View>
                  <View style={styles.fundItem}>
                    <AppText variant="headingMedium" style={styles.fundValueSpent}>₹{(fundsData.totalSpent / 100000).toFixed(1)} ल</AppText>
                    <AppText variant="label" style={styles.fundLabel}>खर्च</AppText>
                  </View>
                  <View style={styles.fundItem}>
                    <AppText variant="headingMedium" style={styles.fundValueRemaining}>₹{(fundsData.remaining / 100000).toFixed(1)} ल</AppText>
                    <AppText variant="label" style={styles.fundLabel}>शिल्लक</AppText>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${fundsData.spendingPercentage}%` }]} />
                  </View>
                  <AppText variant="label" style={styles.progressText}>{fundsData.spendingPercentage.toFixed(0)}% खर्च</AppText>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    // SafeAreaView handles iOS top padding
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
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
  }
});
