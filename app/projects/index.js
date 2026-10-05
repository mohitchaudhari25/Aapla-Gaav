import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import ProjectCard from '../../components/cards/ProjectCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, radius } from '../../constants';
import { DEMO_PROJECTS } from '../../data/projects';

export default function Projects() {
  const router = useRouter();

  const totalProjects = DEMO_PROJECTS?.length || 0;
  const ongoingProjects = DEMO_PROJECTS?.filter(p => p.status === 'चालू').length || 0;
  const completedProjects = DEMO_PROJECTS?.filter(p => p.status === 'पूर्ण').length || 0;

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

      {totalProjects === 0 ? (
        <EmptyState 
          title="सध्या कोणतीही विकास कामे उपलब्ध नाहीत." 
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {DEMO_PROJECTS.map((project) => (
            <ProjectCard 
              key={project.id}
              name={project.name}
              budget={project.budget}
              spent={project.spent}
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
