import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import ProjectCard from '../../components/cards/ProjectCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function Projects() {
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchProjects = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('village_id')
              .eq('id', user.id)
              .single();
              
            let query = supabase.from('projects').select('*');
            if (profile?.village_id) {
              query = query.eq('village_id', profile.village_id);
            }
            const { data, error } = await query;
            if (error) {
              setErrorMsg('विकास कामाची माहिती मिळवण्यात त्रुटी आली.');
            } else if (data) {
              setProjects(data);
            }
          }
        } catch (error) {
          setErrorMsg('काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProjects();
    }, [])
  );

  const totalProjects = projects?.length || 0;
  const ongoingProjects = projects?.filter(p => p.status === 'चालू').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'पूर्ण').length || 0;

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">विकास कामे</AppText>
          <AppText variant="bodySmall" style={styles.subtitle}>गावात सुरू असलेल्या आणि पूर्ण झालेल्या विकास कामांची माहिती</AppText>
        </View>
      </View>

      {totalProjects > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <AppText variant="headingSmall" style={styles.summaryValue}>{totalProjects}</AppText>
            <AppText variant="label" style={styles.summaryLabel}>एकूण कामे</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="headingSmall" style={[styles.summaryValue, { color: colors.info }]}>{ongoingProjects}</AppText>
            <AppText variant="label" style={styles.summaryLabel}>चालू</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant="headingSmall" style={[styles.summaryValue, { color: colors.primary }]}>{completedProjects}</AppText>
            <AppText variant="label" style={styles.summaryLabel}>पूर्ण</AppText>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : errorMsg ? (
        <EmptyState title={errorMsg} />
      ) : totalProjects === 0 ? (
        <EmptyState 
          title="सध्या कोणतीही विकास कामे उपलब्ध नाहीत." 
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {projects.map((project) => (
            <ProjectCard 
              key={project.id}
              name={project.name}
              budget={project.budget}
              spent={project.amount_spent}
              progress={project.progress}
              status={project.status}
              onPress={() => router.push({ pathname: '/projects/details', params: { id: project.id } })}
            />
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    marginLeft: -spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  subtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    color: colors.secondaryText,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  }
});
