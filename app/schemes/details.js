import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

export default function SchemeDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock demo data for schemes
  const schemeDetails = {
    '1': { title: 'शिलाई मशीन योजना', badge: 'योजना', description: 'या योजनेअंतर्गत गावातील गरजू महिलांना मोफत शिलाई मशीन वाटप केले जाते, ज्यामुळे त्यांना रोजगार मिळून स्वावलंबी होता येईल.', eligibility: ['वय १८ ते ५० वर्षे', 'गावातील रहिवासी', 'वार्षिक उत्पन्न १ लाखापेक्षा कमी'], documents: ['आधार कार्ड', 'उत्पन्नाचा दाखला', 'रेशन कार्ड', 'पासपोर्ट साईझ फोटो'] },
    '2': { title: 'शेतकरी योजना', badge: 'कृषी', description: 'शेतकऱ्यांना शेतीसाठी आवश्यक उपकरणे आणि बी-बियाणे खरेदी करण्यासाठी आर्थिक मदत पुरवली जाते.', eligibility: ['स्वतःची शेतजमीन असावी', '७/१२ उतारा', 'गावातील शेतकरी'], documents: ['आधार कार्ड', '७/१२ उतारा', 'बँक पासबुक', '८ अ उतारा'] },
    '3': { title: 'पीएम किसान निधी', badge: 'निधी', description: 'पंतप्रधान किसान सन्मान निधी अंतर्गत पात्र शेतकऱ्यांना दरवर्षी ₹६००० ची आर्थिक मदत दिली जाते.', eligibility: ['नोंदणीकृत शेतकरी', 'आधार लिंक केलेले बँक खाते'], documents: ['आधार कार्ड', 'बँक खाते तपशील', 'जमिनीचे कागदपत्र'] },
    '4': { title: 'नवीन घोषणा', badge: 'बातमी', description: 'गावातील सर्व विकास कामे आणि नवीन सरकारी निर्णयांबद्दल अद्ययावत माहिती.', eligibility: ['सर्व ग्रामस्थ'], documents: ['काहीही आवश्यक नाही'] }
  };

  const scheme = schemeDetails[id] || schemeDetails['1'];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
          <AppText variant="headingSmall" style={styles.headerTitle}>योजनेची माहिती</AppText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleContainer}>
            <View style={styles.badge}>
              <AppText variant="label" style={styles.badgeText}>{scheme.badge}</AppText>
            </View>
            <AppText variant="headingMedium" style={styles.title}>{scheme.title}</AppText>
          </View>

          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>योजनेची माहिती</AppText>
            <AppText variant="bodyMedium" style={styles.description}>{scheme.description}</AppText>
          </View>

          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>पात्रता</AppText>
            {scheme.eligibility.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText variant="bodyMedium" style={styles.listText}>{item}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>आवश्यक कागदपत्रे</AppText>
            {scheme.documents.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                <AppText variant="bodyMedium" style={styles.listText}>{item}</AppText>
              </View>
            ))}
          </View>

          <AppButton 
            title="अर्ज कसा करावा?"
            onPress={() => alert('ही फक्त डेमो योजना आहे. अर्ज करण्यासाठी ग्रामपंचायत कार्यालयाशी संपर्क साधा.')}
            style={styles.applyButton}
          />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleContainer: {
    marginBottom: spacing.lg,
  },
  badge: {
    backgroundColor: colors.primaryPale,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.round,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.secondaryText,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: spacing.sm,
  },
  listText: {
    color: colors.text,
    flex: 1,
  },
  applyButton: {
    marginTop: spacing.md,
  }
});
