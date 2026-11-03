import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../../constants';
import AppText from '../../components/ui/AppText';
import NoticeCard from '../../components/cards/NoticeCard';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../lib/ThemeContext';

export default function Home() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useAppTheme();
  
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [fundsData, setFundsData] = useState({ totalIncome: 0, totalSpent: 0, remaining: 0, spendingPercentage: 0 });
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [userName, setUserName] = useState('');
  const [villageName, setVillageName] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let activeVillageId = null;

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
              .maybeSingle();

            if (profile) {
              if (isMounted) setUserName(profile.full_name || '');
              activeVillageId = profile.village_id;
            }

            // If profile has no village assigned yet, resolve the primary village from database
            if (!activeVillageId) {
              const { data: vList } = await supabase.from('villages').select('id, name').limit(1);
              if (vList && vList.length > 0) {
                activeVillageId = vList[0].id;
                if (isMounted) setVillageName(vList[0].name);
                // Auto-associate profile with primary village if unassigned
                await supabase.from('profiles').update({ village_id: activeVillageId }).eq('id', user.id);
              }
            } else {
              const { data: village } = await supabase
                .from('villages')
                .select('name')
                .eq('id', activeVillageId)
                .maybeSingle();
                
              if (village && isMounted) setVillageName(village.name);
            }

            if (activeVillageId) {
              const { data: noticesData } = await supabase
                .from('notices')
                .select('*')
                .eq('status', 'published')
                .or(`village_id.eq.${activeVillageId},village_id.is.null`)
                .order('created_at', { ascending: false })
                .limit(2);

              if (isMounted) {
                setNotices(noticesData || []);
              }

              const { data: fundsRows } = await supabase
                .from('fund_transactions')
                .select('transaction_type, amount')
                .eq('village_id', activeVillageId);

              const txList = fundsRows || [];
              const totalIncome = txList.filter(t => (t.transaction_type || t.type) === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalSpent = txList.filter(t => (t.transaction_type || t.type) === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const remaining = totalIncome - totalSpent;
              const spendingPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;
              if (isMounted) {
                setFundsData({ totalIncome, totalSpent, remaining, spendingPercentage, hasData: txList.length > 0, isDemo: false });
              }
            } else {
              if (isMounted) {
                setNotices([]);
                setFundsData({ totalIncome: 0, totalSpent: 0, remaining: 0, spendingPercentage: 0, hasData: false, isDemo: false });
              }
            }
          } else {
            // Guest mode
            if (isMounted) {
              setNotices([]);
              setFundsData({ totalIncome: 0, totalSpent: 0, remaining: 0, spendingPercentage: 0, hasData: false, isDemo: false });
            }
          }
            // Fetch published Government Schemes dynamically
            try {
              const { data: dbSchemes, error: schemeErr } = await supabase
                .from('schemes')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

              if (!schemeErr && dbSchemes && dbSchemes.length > 0) {
                const formatted = dbSchemes.map((s) => ({
                  id: s.id,
                  title: s.title || s.name || "",
                  subtitle: s.short_description || s.description || '',
                  badge: s.category || t('home_scheme_badge') || 'योजना',
                  image: s.image_url || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
                }));
                if (isMounted) setSchemeNews(formatted);
              } else if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
                const local = JSON.parse(localStorage.getItem('aapla_admin_schemes') || '[]');
                const published = local.filter(s => s.status === 'published');
                if (published.length > 0) {
                  const formatted = published.map((s) => ({
                    id: s.id,
                    title: s.title || s.name || "",
                    subtitle: s.short_description || s.description || '',
                    badge: s.category || t('home_scheme_badge') || 'योजना',
                    image: s.image_url || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
                  }));
                  if (isMounted) setSchemeNews(formatted);
                }
              }
            } catch (schemeErr) {
              console.warn('Error fetching schemes for carousel:', schemeErr);
            }
        } catch (err) {
          console.warn('Error loading home data:', err);
        } finally {
          if (isMounted) {
            setLoadingNotices(false);
            setLoadingFunds(false);
          }
        }
      };

      fetchNoticesAndFunds();

      // Realtime subscription for notices and fund transactions
      const homeChannel = supabase.channel('home-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => {
          fetchNoticesAndFunds();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fund_transactions' }, () => {
          fetchNoticesAndFunds();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'villages' }, () => {
          fetchNoticesAndFunds();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes' }, () => {
          fetchNoticesAndFunds();
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(homeChannel);
      };
    }, [])
  );

  // Quick Services data
  const quickServices = [
    { id: '3', title: t('home_quick_my_village'), icon: 'business-outline', route: '/village', color: colors.primary },
    { id: '1', title: t('home_quick_report'), icon: 'alert-circle-outline', route: '/complaints/new', color: colors.warning },
    { id: '4', title: t('home_quick_projects'), icon: 'construct-outline', route: '/projects', color: '#8E24AA' },
  ];

    const { width } = Dimensions.get('window');
  const CARD_WIDTH = Math.min(width * 0.85, 360);
  const CARD_INTERVAL = CARD_WIDTH + spacing.md;

  const carouselRef = React.useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const DEFAULT_SCHEMES = [
    {
      id: '1',
      title: 'शासकीय मोफत शिलाई मशीन योजना',
      subtitle: 'ग्रामीण महिलांना स्वयंरोजगारासाठी मोफत शिलाई मशीन वाटप व प्रशिक्षण',
      badge: t('home_scheme_badge') || 'योजना',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      title: 'महाडीबीटी कृषी यांत्रिकीकरण योजना',
      subtitle: 'शेती अवजारे, ट्रॅक्टर व ठिबक सिंचनासाठी ५०% ते ८०% थेट शासकीय अनुदान',
      badge: t('home_agri_badge') || 'कृषी',
      image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      title: 'पीएम किसान सन्मान निधी',
      subtitle: 'पात्र शेतकऱ्यांना वार्षिक ₹६,००० थेट बँक खात्यात - ई-केवायसी पडताळणी सुरू',
      badge: t('home_fund_badge') || 'निधी',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: '4',
      title: 'जल जीवन मिशन - हर घर जल योजना',
      subtitle: 'गावातील प्रत्येक कुटुंबाला शुद्ध पिण्याच्या पाण्याचे नळ जोडणी काम प्रगतिपथावर',
      badge: t('home_news_badge') || 'विकास',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const [schemeNews, setSchemeNews] = useState(DEFAULT_SCHEMES);

  // Auto-sliding horizontal timer for schemes carousel
  React.useEffect(() => {
    if (!schemeNews || schemeNews.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % schemeNews.length;
        if (carouselRef.current) {
          carouselRef.current.scrollTo({
            x: next * CARD_INTERVAL,
            animated: true,
          });
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [CARD_INTERVAL, schemeNews.length]);

  const handleScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_INTERVAL);
    if (index >= 0 && index < schemeNews.length) {
      setActiveSlide(index);
    }
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Custom Header Area */}
          <View style={styles.profileHeader}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <AppText variant="label" style={styles.greeting}>{t('home_greeting')}</AppText>
              <AppText variant="headingMedium" style={styles.userName}>{userName || t('home_citizen')}</AppText>
              <AppText variant="label" style={styles.location}>
                📍 {villageName ? `${villageName} ${t('home_village_panchayat')}` : t('home_village_no_data')}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Language Switcher Pill */}
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

              <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={styles.notificationBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="notifications-outline" size={24} color={colors.white} />
                <View style={styles.badge} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Government Schemes & Citizen News Carousel */}
          <View style={styles.carouselContainer}>
            <View style={styles.carouselHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="megaphone" size={18} color={colors.primary} />
                <AppText variant="headingSmall" style={styles.carouselSectionTitle}>
                  {t('schemes_section_title', 'शासकीय योजना व बातम्या')}
                </AppText>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <AppText variant="label" style={styles.liveText}>{t('schemes_live', 'थेट')}</AppText>
              </View>
            </View>

            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_INTERVAL}
              decelerationRate="fast"
              onMomentumScrollEnd={handleScrollEnd}
              contentContainerStyle={styles.carouselScroll}
            >
              {schemeNews.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.schemeCard, { width: CARD_WIDTH }]}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/schemes/details', params: { id: item.id } })}
                >
                  <View style={styles.schemeImageContainer}>
                    <Image source={{ uri: item.image }} style={styles.schemeImage} resizeMode="cover" />
                    <View style={styles.schemeBadgeOverlay}>
                      <AppText variant="label" style={styles.schemeBadgeText}>{item.badge}</AppText>
                    </View>
                  </View>

                  <View style={styles.schemeCardBody}>
                    <AppText variant="headingSmall" numberOfLines={1} style={styles.schemeTitle}>
                      {item.title}
                    </AppText>
                    <AppText variant="bodySmall" numberOfLines={2} style={styles.schemeSubtitle}>
                      {item.subtitle}
                    </AppText>

                    <View style={styles.schemeAction}>
                      <AppText variant="label" style={styles.schemeActionText}>
                        {t('schemes_view_details', t('home_more_info', 'तपशील पहा'))}
                      </AppText>
                      <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pagination Indicator Dots */}
            <View style={styles.paginationDots}>
              {schemeNews.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeSlide === idx ? styles.activeDot : null,
                    { backgroundColor: activeSlide === idx ? colors.primary : (colors.border || '#D0D7DE') }
                  ]}
                />
              ))}
            </View>
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
  carouselHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  carouselSectionTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  liveText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  carouselScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  schemeCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  schemeImageContainer: {
    width: '100%',
    height: 125,
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  schemeImage: {
    width: '100%',
    height: '100%',
  },
  schemeBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  schemeBadgeText: {
    fontWeight: '700',
    fontSize: 11,
    color: colors.primary,
  },
  schemeCardBody: {
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  schemeTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  schemeSubtitle: {
    color: colors.secondaryText || '#666666',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  schemeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  schemeActionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    height: 6,
    borderRadius: 3,
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
  langPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radius.round,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  langPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  langPillBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  langPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
