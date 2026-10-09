import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import EmptyState from '../../components/common/EmptyState';
import ComplaintCard from '../../components/cards/ComplaintCard';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { mockComplaints, mockComplaintUpdates } from '../../data/mockData';
import { Ionicons } from '@expo/vector-icons';

const TIMELINE_STAGES = [
  { id: 'received', label: 'तक्रार प्राप्त', triggers: ['प्राप्त', 'प्रक्रियेत', 'सोडवले'] },
  { id: 'investigation', label: 'तपासणी सुरू', triggers: ['प्रक्रियेत', 'सोडवले'] },
  { id: 'inProgress', label: 'प्रक्रियेत', triggers: ['प्रक्रियेत', 'सोडवले'] },
  { id: 'resolved', label: 'सोडवले', triggers: ['सोडवले'] },
];

export default function ComplaintDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [complaint, setComplaint] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        if (id && typeof id === 'string' && id.startsWith('demo-')) {
          const demoComplaint = mockComplaints.find(c => c.id === id);
          if (demoComplaint) {
            setComplaint(demoComplaint);
            setUpdates(mockComplaintUpdates[id] || []);
            setLoading(false);
            return;
          }
        }
        
        const { data: complaintData, error: complaintError } = await supabase
          .from('complaints')
          .select('*')
          .eq('id', id)
          .single();

        if (complaintError) throw complaintError;
        setComplaint(complaintData);

        const { data: updatesData, error: updatesError } = await supabase
          .from('complaint_updates')
          .select('*')
          .eq('complaint_id', id)
          .order('created_at', { ascending: true });

        if (updatesError) throw updatesError;
        setUpdates(updatesData || []);
      } catch (err) {
        console.error(err);
        setError('माहिती लोड करताना त्रुटी आली.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
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
          onButtonPress={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  const currentStatus = complaint.status?.trim() || 'प्राप्त';
  const activeStageIndex = TIMELINE_STAGES.map(s => s.triggers.includes(currentStatus)).lastIndexOf(true);
  const formattedDate = complaint.created_at 
    ? new Date(complaint.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
    : (complaint.date || '');

  return (
    <ScreenContainer useSafeArea>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <AppText variant="headingMedium">तक्रार तपशील</AppText>
        </View>

        <ComplaintCard 
          title={complaint.title}
          id={complaint.id}
          category={complaint.category}
          status={complaint.status}
          date={formattedDate}
          style={styles.cardOverrides}
        />

        <View style={styles.section}>
          <AppText variant="headingSmall" style={styles.sectionTitle}>तक्रारीची माहिती</AppText>
          <View style={styles.infoBox}>
            <AppText variant="bodyMedium" style={styles.descriptionText}>
              {complaint.description || "माहिती उपलब्ध नाही."}
            </AppText>
          </View>
        </View>

        {updates.length > 0 && (
          <View style={styles.section}>
            <AppText variant="headingSmall" style={styles.sectionTitle}>अपडेट इतिहास</AppText>
            {updates.map((update) => (
              <View key={update.id} style={[styles.infoBox, { marginBottom: spacing.sm }]}>
                {update.status && (
                  <AppText variant="bodyMedium" style={{ fontWeight: 'bold', color: colors.primary, marginBottom: 2 }}>
                    {update.status}
                  </AppText>
                )}
                {update.description && (
                  <AppText variant="bodyMedium" style={styles.descriptionText}>
                    {update.description}
                  </AppText>
                )}
                <AppText variant="bodySmall" style={{ color: colors.secondaryText, marginTop: 4 }}>
                  {new Date(update.created_at).toLocaleString('en-GB')}
                </AppText>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="headingSmall" style={styles.sectionTitle}>तक्रार सद्यस्थिती</AppText>
          
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
                    {stage.label}
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
    height: 30, // Connects to the next node
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
    height: 54, // Matches node + line height roughly to keep rows aligned
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
