import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import NoticeCard from '../../components/cards/NoticeCard';
import EmptyState from '../../components/common/EmptyState';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing } from '../../constants';
import { supabase } from '../../lib/supabase';
import { mockNotices } from '../../data/mockData';

export default function Notices() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('notices')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setNotices([...(data || []), ...mockNotices]);
    } catch (err) {
      console.error(err);
      setError('सूचना लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AppText style={styles.errorText}>{error}</AppText>
          <AppButton title="पुन्हा प्रयत्न करा" onPress={fetchNotices} />
        </View>
      ) : (!notices || notices.length === 0) ? (
        <EmptyState 
          title="सध्या कोणतीही सूचना उपलब्ध नाही." 
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {notices.map((notice) => {
            const formattedDate = notice.created_at 
              ? new Date(notice.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
              : notice.date;
              
            return (
              <NoticeCard 
                key={notice.id}
                title={notice.title}
                date={formattedDate}
                description={notice.description}
                style={notice.isRead ? styles.readCard : styles.unreadCard}
              />
            );
          })}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  }
});
