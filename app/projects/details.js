import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { mockProjects } from '../../data/mockData';

const formatCurrency = (amount) => {
  if (amount == null) return '₹०';
  return '₹' + amount.toLocaleString('en-IN');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'चालू':
      return colors.info;
    case 'पूर्ण':
      return colors.primary;
    case 'नियोजित':
      return colors.warning;
    default:
      return colors.text;
  }
};

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        if (id && typeof id === 'string' && id.startsWith('demo-')) {
          const demoProject = mockProjects.find(p => p.id === id);
          if (demoProject) {
            setProject(demoProject);
            setLoading(false);
            return;
          }
        }
        
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          setErrorMsg('विकास कामाची माहिती मिळवण्यात त्रुटी आली.');
        } else if (data) {
          setProject(data);
        }
      } catch (err) {
        setErrorMsg('काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchProject();
    }
  }, [id]);

  if (loading) {
    return (
      <ScreenContainer useSafeArea>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </ScreenContainer>
    );
  }

  if (errorMsg) {
    return (
      <ScreenContainer useSafeArea>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <EmptyState 
          title={errorMsg} 
          buttonTitle="विकास कामांकडे परत जा"
          onButtonPress={() => router.push('/projects')}
        />
      </ScreenContainer>
    );
  }

  if (!project) {
    return (
      <ScreenContainer useSafeArea>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <EmptyState 
          title="विकास कामाची माहिती सापडली नाही." 
          buttonTitle="विकास कामांकडे परत जा"
          onButtonPress={() => router.push('/projects')}
        />
      </ScreenContainer>
    );
  }

  const remaining = (project.budget || 0) - (project.amount_spent || 0);
  const statusColor = getStatusColor(project.status);

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">विकास कामाचा तपशील</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Project Summary */}
        <View style={styles.summaryCard}>
          <AppText variant="headingMedium" style={styles.projectName}>{project.name}</AppText>
          {project.description ? (
            <AppText variant="bodyMedium" style={{ color: colors.secondaryText, marginBottom: spacing.md }}>
              {project.description}
            </AppText>
          ) : null}
          
          <View style={styles.statusRow}>
            <AppText variant="bodyMedium" style={styles.statusLabel}>स्थिती:</AppText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <AppText variant="label" style={[styles.statusText, { color: statusColor }]}>
                {project.status}
              </AppText>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <AppText variant="bodyMedium" style={styles.progressLabel}>प्रगती:</AppText>
              <AppText variant="headingSmall" style={{ color: statusColor }}>{project.progress}%</AppText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(Math.max(project.progress, 0), 100)}%`, backgroundColor: statusColor }]} />
            </View>
          </View>
        </View>

        {/* Financial Information */}
        <AppText variant="headingSmall" style={styles.sectionTitle}>आर्थिक माहिती</AppText>
        <View style={styles.financialCard}>
          <View style={styles.financeRow}>
            <AppText variant="bodyMedium" style={styles.financeLabel}>एकूण अंदाजित खर्च:</AppText>
            <AppText variant="headingSmall" style={styles.financeValue}>{formatCurrency(project.budget)}</AppText>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.financeRow}>
            <AppText variant="bodyMedium" style={styles.financeLabel}>आतापर्यंत खर्च:</AppText>
            <AppText variant="headingSmall" style={[styles.financeValue, { color: colors.error }]}>{formatCurrency(project.amount_spent)}</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.financeRow}>
            <AppText variant="bodyMedium" style={styles.financeLabel}>शिल्लक:</AppText>
            <AppText variant="headingSmall" style={[styles.financeValue, { color: colors.primary }]}>{formatCurrency(remaining)}</AppText>
          </View>
        </View>

        {/* Basic Information */}
        <AppText variant="headingSmall" style={styles.sectionTitle}>इतर माहिती</AppText>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <AppText variant="label" style={styles.infoLabel}>सुरुवात दिनांक</AppText>
            <AppText variant="bodyMedium" style={styles.infoValue}>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : 'माहिती उपलब्ध नाही'}</AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <AppText variant="label" style={styles.infoLabel}>अपेक्षित पूर्णत्व</AppText>
            <AppText variant="bodyMedium" style={styles.infoValue}>{project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB') : 'माहिती उपलब्ध नाही'}</AppText>
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  headerTextContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  projectName: {
    color: colors.primary,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusLabel: {
    color: colors.secondaryText,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusText: {
    fontWeight: '600',
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    color: colors.secondaryText,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.round,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  financialCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  financeLabel: {
    color: colors.secondaryText,
  },
  financeValue: {
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
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
  }
});
