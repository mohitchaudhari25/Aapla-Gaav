import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import EmptyState from '../../components/common/EmptyState';
import ComplaintCard from '../../components/cards/ComplaintCard';
import AppButton from '../../components/ui/AppButton';
import AppText from '../../components/ui/AppText';
import { spacing, colors } from '../../constants';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function Complaints() {
  const router = useRouter();
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setComplaints(data || []);
    } catch (err) {
      setError(t('complaints_load_error', 'तक्रारी लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      fetchComplaints();

      const complaintChannel = supabase.channel('citizen-complaints-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
          if (isMounted) fetchComplaints();
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(complaintChannel);
      };
    }, [])
  );

  const renderItem = ({ item, index }) => {
    return (
      <ComplaintCard 
        item={item}
        index={index}
        title={item.title}
        id={item.id}
        category={item.category}
        status={item.status || 'प्राप्त'}
        createdAt={item.created_at}
        description={item.description}
        onPress={() => router.push({ pathname: '/complaints/details', params: { id: item.id } })}
      />
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="headingMedium" style={styles.pageTitle}>{t('complaints_title', 'माझ्या तक्रारी')}</AppText>
        <AppButton 
          title={t('new_complaint_btn', 'नवीन तक्रार नोंदवा')} 
          onPress={() => router.push('/complaints/new')} 
        />
      </View>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AppText style={styles.errorText}>{error}</AppText>
          <AppButton title={t('retry', 'पुन्हा प्रयत्न करा')} onPress={fetchComplaints} style={styles.retryButton} />
        </View>
      ) : complaints.length === 0 ? (
        <EmptyState 
          title={t('no_complaints_title', 'कोणतीही तक्रार नाही')}
          description={t('no_complaints_desc', 'तुम्ही अजून कोणतीही तक्रार नोंदवलेली नाही.')}
          buttonTitle={t('new_complaint_btn', 'नवीन तक्रार नोंदवा')}
          onButtonPress={() => router.push('/complaints/new')}
        />
      ) : (
        <FlatList 
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pageTitle: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
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
  },
  retryButton: {
    marginTop: spacing.md,
  }
});
