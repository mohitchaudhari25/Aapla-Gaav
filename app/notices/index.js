import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import NoticeCard from '../../components/cards/NoticeCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing } from '../../constants';
import { DEMO_NOTICES } from '../../data/notices';

export default function Notices() {
  const router = useRouter();

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">गावातील सूचना</AppText>
          <AppText variant="bodySmall" style={styles.subtitle}>गावातील महत्त्वाच्या सूचना आणि घोषणा</AppText>
        </View>
      </View>

      {(!DEMO_NOTICES || DEMO_NOTICES.length === 0) ? (
        <EmptyState 
          title="सध्या कोणतीही सूचना उपलब्ध नाही." 
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {DEMO_NOTICES.map((notice) => (
            <NoticeCard 
              key={notice.id}
              title={notice.title}
              date={notice.date}
              description={notice.description}
              style={notice.isRead ? styles.readCard : styles.unreadCard}
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
  subtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  unreadCard: {
    borderLeftColor: colors.warning,
  },
  readCard: {
    borderLeftColor: colors.border,
    opacity: 0.8,
  }
});
