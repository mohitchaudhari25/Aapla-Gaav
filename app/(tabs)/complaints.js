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
import { mockComplaints } from '../../data/mockData';

export default function Complaints() {
  const router = useRouter();
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
      setComplaints([...(data || []), ...mockComplaints]);
    } catch (err) {
      setError('तक्रारी लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  const renderItem = ({ item }) => {
    const formattedDate = item.created_at 
      ? new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
      : new Date().toLocaleDateString('en-GB');

    return (
      <ComplaintCard 
        title={item.title}
        id={item.id}
        category={item.category}
        status={item.status || 'प्राप्त'}
        date={formattedDate}
        onPress={() => router.push({ pathname: '/complaints/details', params: { id: item.id } })}
      />
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText variant="headingMedium" style={styles.pageTitle}>माझ्या तक्रारी</AppText>
        <AppButton 
          title="नवीन तक्रार नोंदवा" 
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
          <AppButton title="पुन्हा प्रयत्न करा" onPress={fetchComplaints} style={styles.retryButton} />
        </View>
      ) : complaints.length === 0 ? (
        <EmptyState 
          title="कोणतीही तक्रार नाही"
          description="तुम्ही अजून कोणतीही तक्रार नोंदवलेली नाही."
          buttonTitle="नवीन तक्रार नोंदवा"
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
