import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import EmptyState from '../../components/common/EmptyState';
import ComplaintCard from '../../components/cards/ComplaintCard';
import AppText from '../../components/ui/AppText';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { mockComplaints, mockComplaintUpdates } from '../../data/mockData';
import { cleanComplaintDescription, formatComplaintDateTime, getTrackingId } from '../../lib/complaintUtils';
import { useTranslation } from 'react-i18next';

const TIMELINE_STAGES = [
  { id: 'received', label: 'तक्रार प्राप्त', triggers: ['प्राप्त', 'प्रक्रियेत', 'सोडवले'] },
  { id: 'investigation', label: 'तपासणी सुरू', triggers: ['प्रक्रियेत', 'सोडवले'] },
  { id: 'inProgress', label: 'प्रक्रियेत', triggers: ['प्रक्रियेत', 'सोडवले'] },
  { id: 'resolved', label: 'सोडवले', triggers: ['सोडवले'] },
];

export default function ComplaintDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [complaint, setComplaint] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        if (id && typeof id === 'string' && id.startsWith('demo-')) {
          const demoComplaint = mockComplaints.find(c => c.id === id);
          if (demoComplaint) {
            if (isMounted) {
              setComplaint(demoComplaint);
              setUpdates(mockComplaintUpdates[id] || []);
              setLoading(false);
            }
            return;
          }
        }
        
        const { data: complaintData, error: complaintError } = await supabase
          .from('complaints')
          .select('*')
          .eq('id', id)
          .single();

        if (complaintError) throw complaintError;
        if (isMounted) setComplaint(complaintData);

        const { data: updatesData, error: updatesError } = await supabase
          .from('complaint_updates')
          .select('*')
          .eq('complaint_id', id)
          .order('created_at', { ascending: true });

        if (updatesError) {
          console.warn('Complaint updates fetch warning:', updatesError);
        }
        if (isMounted) setUpdates(updatesData || []);
      } catch (err) {
        console.error('Error fetching complaint details:', err);
        if (isMounted) setError('माहिती लोड करताना त्रुटी आली.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchDetails();

      // Realtime subscription for complaint status and update timeline
      const detailsChannel = supabase.channel(`complaint-${id}-channel`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'complaints', 
          filter: `id=eq.${id}` 
        }, (payload) => {
          if (payload.new && isMounted) {
            setComplaint(prev => ({ ...prev, ...payload.new }));
          }
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'complaint_updates', 
          filter: `complaint_id=eq.${id}` 
        }, () => {
          fetchDetails();
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(detailsChannel);
      };
    }
  }, [id]);

  if (loading) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (error || !complaint) {
    return (
      <ScreenContainer>
        <EmptyState 
          title="तक्रार सापडली नाही."
          description={error || "कृपया परत जा आणि पुन्हा प्रयत्न करा."}
          buttonTitle="माझ्या तक्रारींकडे परत जा"
          onButtonPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        />
      </ScreenContainer>
    );
  }

  const currentStatus = complaint.status?.trim() || 'प्राप्त';
  const activeStageIndex = TIMELINE_STAGES.map(s => s.triggers.includes(currentStatus)).lastIndexOf(true);
  const cleanDesc = cleanComplaintDescription(complaint.description);
  const trackingId = getTrackingId(complaint);

  return (
    <ScreenContainer useSafeArea>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <AppText variant="headingMedium">{t('complaint_details_title')}</AppText>
        </View>

        <ComplaintCard 
          item={complaint}
          title={complaint.title}
          id={complaint.id}
          category={complaint.category}
          status={complaint.status}
          createdAt={complaint.created_at}
          description={complaint.description}
          style={styles.cardOverrides}
        />

        <View style={styles.section}>
          <AppText variant="headingSmall" style={styles.sectionTitle}>{t('complaint_info_section')}</AppText>
          <View style={styles.infoBox}>
            <AppText variant="bodyMedium" style={styles.descriptionText}>
              {cleanDesc || complaint.description || "माहिती उपलब्ध नाही."}
            </AppText>
          </View>
        </View>

        {updates.length > 0 && (
          <View style={styles.section}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>{t('update_history_title')}</AppText>
            {updates.map((update) => {
              const updateDt = formatComplaintDateTime(update.created_at);
              return (
                <View key={update.id} style={[styles.infoBox, { marginBottom: spacing.sm }]}>
                  {(update.new_status || update.status) && (
                    <AppText variant="bodyMedium" style={{ fontWeight: 'bold', color: colors.primary, marginBottom: 2 }}>
                      {update.new_status || update.status}
                    </AppText>
                  )}
                  {(update.update_text || update.description) && (
                    <AppText variant="bodyMedium" style={styles.descriptionText}>
                      {update.update_text || update.description}
                    </AppText>
                  )}
                  <AppText variant="bodySmall" style={{ color: colors.secondaryText, marginTop: 4 }}>
                    {updateDt.display}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="headingSmall" style={styles.sectionTitle}>{t('status_timeline_title')}</AppText>
          
          <View style={styles.timelineContainer}>
            {TIMELINE_STAGES.map((stage, index) => {
              const isCompleted = index < activeStageIndex;
              const isActive = index === activeStageIndex;
              const isPending = index > activeStageIndex;

              return (
                <View key={stage.id} style={styles.timelineRow}>
                  <View style={styles.timelineNodeContainer}>
                    <View style={[
                      styles.node,
                      isCompleted && styles.nodeCompleted,
                      isActive && styles.nodeActive,
                      isPending && styles.nodePending
                    ]}>
                      {isCompleted && <Ionicons name="checkmark" size={14} color={colors.white} />}
                    </View>
                    {index < TIMELINE_STAGES.length - 1 && (
                      <View style={[
                        styles.line,
                        isCompleted ? styles.lineCompleted : styles.linePending
                      ]} />
                    )}
                  </View>
                  <AppText 
                    variant="bodyMedium" 
                    style={[
                      styles.timelineLabel,
                      (isCompleted || isActive) ? styles.labelActive : styles.labelPending,
                      isActive && styles.labelCurrent
                    ]}
                  >
                    {stage.id === 'received' ? t('timeline_received') : stage.id === 'investigation' ? t('timeline_investigation') : stage.id === 'inProgress' ? t('timeline_in_progress') : t('timeline_resolved')}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>

        {currentStatus === 'सोडवले' && (
          <View style={styles.resolvedBox}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{marginRight: spacing.sm}} />
            <AppText variant="bodyLarge" style={styles.resolvedText}>तक्रार सोडवली आहे</AppText>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    marginLeft: -spacing.sm,
  },
  cardOverrides: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    color: colors.text,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionText: {
    color: colors.secondaryText,
    lineHeight: 22,
  },
  timelineContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineNodeContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 24,
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: colors.surface,
  },
  nodeCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  nodeActive: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
  },
  nodePending: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  line: {
    width: 2,
    height: 30,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  linePending: {
    backgroundColor: colors.border,
  },
  timelineLabel: {
    paddingTop: 2,
    height: 54,
  },
  labelActive: {
    color: colors.text,
  },
  labelCurrent: {
    fontWeight: 'bold',
    color: colors.warning,
  },
  labelPending: {
    color: colors.secondaryText,
  },
  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPale,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  resolvedText: {
    color: colors.primary,
    fontWeight: 'bold',
  }
});
