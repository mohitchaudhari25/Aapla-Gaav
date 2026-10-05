import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import { colors, spacing, radius } from '../../constants';
import { DEMO_VILLAGE } from '../../data/village';

export default function Village() {
  const router = useRouter();

  const services = [
    { id: '1', title: 'गावातील सूचना', icon: 'megaphone-outline', route: '/notices', color: colors.warning },
    { id: '2', title: 'विकास कामे', icon: 'construct-outline', route: '/projects', color: '#8E24AA' },
    { id: '3', title: 'गावाचा निधी', icon: 'wallet-outline', route: '/village/funds', color: colors.primary },
    { id: '4', title: 'महत्त्वाचे संपर्क', icon: 'call-outline', route: '/contacts', color: colors.info },
  ];

  const renderInfoRow = (label, value) => (
    <View style={styles.infoRow}>
      <AppText variant="label" style={styles.infoLabel}>{label}</AppText>
      <AppText variant="bodyMedium" style={styles.infoValue}>{value || 'माहिती उपलब्ध नाही'}</AppText>
    </View>
  );

  const renderStatCard = (label, value, icon) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <AppText variant="headingMedium" style={styles.statValue}>{value || '-'}</AppText>
      <AppText variant="label" style={styles.statLabel}>{label}</AppText>
    </View>
  );

  return (
    <ScreenContainer useSafeArea>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <AppText variant="headingMedium">माझं गाव</AppText>
            <AppText variant="bodySmall" style={styles.subtitle}>आपल्या गावाची महत्त्वाची माहिती</AppText>
          </View>
        </View>

        {/* Basic Village Info */}
        <View style={styles.card}>
          {renderInfoRow('गावाचे नाव', DEMO_VILLAGE.name)}
          <View style={styles.divider} />
          {renderInfoRow('ग्रामपंचायत', DEMO_VILLAGE.gramPanchayat)}
          <View style={styles.divider} />
          {renderInfoRow('तालुका', DEMO_VILLAGE.taluka)}
          <View style={styles.divider} />
          {renderInfoRow('जिल्हा', DEMO_VILLAGE.district)}
          <View style={styles.divider} />
          {renderInfoRow('राज्य', DEMO_VILLAGE.state)}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          {renderStatCard('लोकसंख्या', DEMO_VILLAGE.statistics?.population, 'people-outline')}
          {renderStatCard('कुटुंबे', DEMO_VILLAGE.statistics?.families, 'home-outline')}
          {renderStatCard('क्षेत्रफळ', DEMO_VILLAGE.statistics?.area, 'map-outline')}
        </View>

        {/* Quick Services */}
        <AppText variant="headingSmall" style={styles.sectionTitle}>महत्त्वाच्या सेवा</AppText>
        <View style={styles.servicesGrid}>
          {services.map(service => (
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

        {/* Gram Panchayat Info */}
        <AppText variant="headingSmall" style={styles.sectionTitle}>ग्रामपंचायत माहिती</AppText>
        <View style={[styles.card, styles.lastCard]}>
          <View style={styles.panchayatHeader}>
            <View style={styles.panchayatIconWrapper}>
              <Ionicons name="business-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.panchayatHeaderText}>
              <AppText variant="headingSmall">{DEMO_VILLAGE.panchayatInfo?.officeName || 'माहिती उपलब्ध नाही'}</AppText>
            </View>
          </View>
          <View style={styles.divider} />
          {renderInfoRow('कार्यालयीन वेळ', DEMO_VILLAGE.panchayatInfo?.timings)}
          <View style={styles.divider} />
          {renderInfoRow('सुट्टीचा दिवस', DEMO_VILLAGE.panchayatInfo?.weeklyOff)}
        </View>
        
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    marginLeft: -spacing.sm,
  },
  subtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    color: colors.secondaryText,
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.secondaryText,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
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
  panchayatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  panchayatIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  panchayatHeaderText: {
    flex: 1,
  },
  lastCard: {
    marginBottom: 0,
  }
});
