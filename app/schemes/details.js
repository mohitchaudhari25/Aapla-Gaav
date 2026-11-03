import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, StatusBar, Image, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export default function SchemeDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  // Preset demo data for schemes
  const presetSchemes = {
    '1': {
      title: 'शासकीय मोफत शिलाई मशीन योजना',
      badge: 'योजना',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
      description: 'या योजनेअंतर्गत गावातील आर्थिकदृष्ट्या दुर्बल व गरजू महिलांना मोफत शिलाई मशीन वाटप केले जाते, ज्यामुळे त्यांना घरबसल्या स्वयंरोजगार मिळून त्या स्वावलंबी होऊ शकतील.',
      eligibility: ['वय १८ ते ५० वर्षे', 'गावातील अधिकृत रहिवासी', 'कुटुंबाचे वार्षिक उत्पन्न ₹१,००,००० पेक्षा कमी असावे', 'महिला लाभार्थी'],
      documents: ['आधार कार्ड', 'उत्पन्नाचा दाखला', 'रेशन कार्ड प्रत', '२ पासपोर्ट साईझ फोटो', 'बँक पासबुक झेरॉक्स'],
      applicationUrl: 'https://mahadbt.maharashtra.gov.in',
      targetBeneficiaries: 'ग्रामीण महिला व कारागीर',
    },
    '2': {
      title: 'महाडीबीटी कृषी यांत्रिकीकरण योजना',
      badge: 'कृषी',
      image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
      description: 'शेतकऱ्यांना शेती कामासाठी आधुनिक अवजारे, ट्रॅक्टर, रोटाव्हेटर, पेरणी यंत्र आणि सूक्ष्म सिंचनासाठी ५०% ते ८०% पर्यंत थेट शासकीय अनुदान दिले जाते.',
      eligibility: ['स्वतःच्या नावावर शेतजमीन असावी', '७/१२ व ८-अ उतारा', 'आधार लिंक बँक खाते', 'गावातील शेतकरी'],
      documents: ['आधार कार्ड', '७/१२ व ८-अ उतारा', 'बँक पासबुक झेरॉक्स', 'अवजारे कोटेशन'],
      applicationUrl: 'https://mahadbt.maharashtra.gov.in',
      targetBeneficiaries: 'अल्प व अत्यल्प भूधारक शेतकरी',
    },
    '3': {
      title: 'पीएम किसान सन्मान निधी योजना',
      badge: 'निधी',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
      description: 'पंतप्रधान किसान सन्मान निधी अंतर्गत पात्र शेतकऱ्यांना दरवर्षी ₹६,००० ची आर्थिक मदत थेट बँक खात्यात तीन समान हप्त्यांमध्ये (₹२,००० x ३) जमा केली जाते.',
      eligibility: ['नोंदणीकृत शेतकरी कुटुंब', 'आधार लिंक केलेले बँक खाते', 'ई-केवायसी (e-KYC) पूर्ण केलेले असावे'],
      documents: ['आधार कार्ड', 'जमिनीचा ७/१२ उतारा', 'बँक खाते तपशील'],
      applicationUrl: 'https://pmkisan.gov.in',
      targetBeneficiaries: 'सर्व पात्र शेतकरी',
    },
    '4': {
      title: 'जल जीवन मिशन - हर घर जल योजना',
      badge: 'विकास',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=600&auto=format&fit=crop&q=80',
      description: 'गावातील प्रत्येक कुटुंबाला वैयक्तिक घरगुती नळ जोडणीद्वारे शुद्ध व पुरेसे पिण्याचे पाणी उपलब्ध करून देण्याचा ऐतिहासिक उपक्रम.',
      eligibility: ['गावातील सर्व कायमस्वरूपी रहिवासी कुटुंबे'],
      documents: ['ग्रामपंचायत नळ कनेक्शन अर्ज', 'घरपट्टी पावती'],
      applicationUrl: 'https://jaljeevanmission.gov.in',
      targetBeneficiaries: 'गावातील सर्व कुटुंबे',
    }
  };

  const [scheme, setScheme] = useState(presetSchemes[id] || presetSchemes['1']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchScheme = async () => {
      try {
        setLoading(true);
        // 1. Check Supabase by UUID
        if (id && isUuid(id)) {
          const { data, error } = await supabase
            .from('schemes')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data && isMounted) {
            setScheme({
              title: data.title || data.name || "",
              badge: data.category || 'योजना',
              image: data.image_url,
              description: data.description || data.short_description || '',
              eligibility: data.eligibility ? data.eligibility.split('\n').map(s => s.trim()).filter(Boolean) : [],
              documents: data.documents ? data.documents.split('\n').map(s => s.trim()).filter(Boolean) : [],
              startDate: data.start_date || data.application_start_date || "",
              lastDate: data.end_date || data.application_last_date || "",
              applicationUrl: data.application_url,
              targetBeneficiaries: data.beneficiaries || data.target_beneficiaries || "",
            });
            return;
          }
        }

        // 2. Check localStorage fallback if on web
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          try {
            const local = JSON.parse(localStorage.getItem('aapla_admin_schemes') || '[]');
            const found = local.find(s => s.id === id);
            if (found && isMounted) {
              setScheme({
                title: found.title || found.name || "",
                badge: found.category || 'योजना',
                image: found.image_url,
                description: found.description || found.short_description || '',
                eligibility: found.eligibility ? found.eligibility.split('\n').map(s => s.trim()).filter(Boolean) : [],
                documents: found.documents ? found.documents.split('\n').map(s => s.trim()).filter(Boolean) : [],
                startDate: found.start_date || found.application_start_date || "",
                lastDate: found.end_date || found.application_last_date || "",
                applicationUrl: found.application_url,
                targetBeneficiaries: found.beneficiaries || found.target_beneficiaries || "",
              });
              return;
            }
          } catch (lsErr) {}
        }

        // 3. Fallback to preset
        if (isMounted) {
          setScheme(presetSchemes[id] || presetSchemes['1']);
        }
      } catch (err) {
        if (isMounted) setScheme(presetSchemes[id] || presetSchemes['1']);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchScheme();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleApplyPress = () => {
    if (scheme?.applicationUrl) {
      Linking.openURL(scheme.applicationUrl).catch(() => {
        alert('लिंक उघडताना त्रुटी आली: ' + scheme.applicationUrl);
      });
    } else {
      alert('या योजनेसाठी थेट ऑनलाइन अर्ज लिंक उपलब्ध नाही. अधिक माहितीसाठी ग्रामपंचायत कार्यालयाशी संपर्क साधा.');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} color={colors.text} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
          <AppText variant="headingSmall" style={styles.headerTitle}>{t('scheme_details_title', 'योजनेचा तपशील')}</AppText>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Banner Image */}
            {scheme.image ? (
              <View style={styles.bannerContainer}>
                <Image source={{ uri: scheme.image }} style={styles.bannerImage} resizeMode="cover" />
              </View>
            ) : null}

            <View style={styles.titleContainer}>
              <View style={styles.badge}>
                <AppText variant="label" style={styles.badgeText}>{scheme.badge}</AppText>
              </View>
              <AppText variant="headingMedium" style={styles.title}>{scheme.title}</AppText>
              {scheme.targetBeneficiaries ? (
                <View style={styles.beneficiariesRow}>
                  <Ionicons name="people-outline" size={14} color={colors.secondaryText} />
                  <AppText variant="caption" style={styles.beneficiariesText}>
                    {t('scheme_beneficiaries_label', 'लाभार्थी')}: {scheme.targetBeneficiaries}
                  </AppText>
                </View>
              ) : null}
            </View>

            {/* Dates Card if available */}
            {(scheme.startDate || scheme.lastDate) ? (
              <View style={styles.dateCard}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {scheme.startDate ? (
                    <AppText variant="caption" style={{ color: colors.secondaryText }}>
                      {t('scheme_start_date', 'सुरुवात')}: <AppText variant="caption" style={{ fontWeight: '700', color: colors.text }}>{scheme.startDate}</AppText>
                    </AppText>
                  ) : null}
                  {scheme.lastDate ? (
                    <AppText variant="caption" style={{ color: colors.secondaryText, marginTop: 2 }}>
                      {t('scheme_last_date', 'अंतिम मुदत')}: <AppText variant="caption" style={{ fontWeight: '700', color: colors.error }}>{scheme.lastDate}</AppText>
                    </AppText>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Scheme Details Description */}
            <View style={styles.card}>
              <AppText variant="headingSmall" style={styles.sectionTitle}>{t('scheme_full_info', 'योजनेची सविस्तर माहिती')}</AppText>
              <AppText variant="bodyMedium" style={styles.description}>{scheme.description}</AppText>
            </View>

            {/* Eligibility */}
            {scheme.eligibility && scheme.eligibility.length > 0 ? (
              <View style={styles.card}>
                <AppText variant="headingSmall" style={styles.sectionTitle}>{t('scheme_eligibility', 'पात्रता व अटी')}</AppText>
                {scheme.eligibility.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginTop: 2 }} />
                    <AppText variant="bodyMedium" style={styles.listText}>{item}</AppText>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Required Documents */}
            {scheme.documents && scheme.documents.length > 0 ? (
              <View style={styles.card}>
                <AppText variant="headingSmall" style={styles.sectionTitle}>{t('scheme_documents', 'आवश्यक कागदपत्रे')}</AppText>
                {scheme.documents.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                    <AppText variant="bodyMedium" style={styles.listText}>{item}</AppText>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Action Button */}
            <AppButton 
              title={scheme.applicationUrl ? t('scheme_apply_online', 'अधिकृत संकेतस्थळावर अर्ज करा') : t('scheme_contact_gp', 'ग्रामपंचायतीशी संपर्क साधा')}
              onPress={handleApplyPress}
              style={styles.applyButton}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: '#EAEAEA',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.round,
    marginBottom: 6,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 28,
  },
  beneficiariesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  beneficiariesText: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: '700',
  },
  description: {
    color: colors.secondaryText,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: spacing.sm,
  },
  listText: {
    flex: 1,
    color: colors.text,
    lineHeight: 20,
  },
  applyButton: {
    marginTop: spacing.md,
  },
});
