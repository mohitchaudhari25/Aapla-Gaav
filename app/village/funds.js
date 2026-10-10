import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { mockFunds } from '../../data/mockData';

const formatCurrency = (amount) => {
  if (amount == null) return '₹०';
  return '₹' + amount.toLocaleString('en-IN');
};

export default function VillageFunds() {
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchFunds = async () => {
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
              
            if (profile?.village_id) {
              const { data, error } = await supabase
                .from('fund_transactions')
                .select('*')
                .eq('village_id', profile.village_id)
                .order('transaction_date', { ascending: false });
                
              if (error) {
                setErrorMsg('निधीची माहिती मिळवण्यात त्रुटी आली.');
              } else if (data) {
                setTransactions([...data, ...mockFunds]);
              }
            } else {
               setTransactions([...mockFunds]);
            }
          }
        } catch (error) {
          setErrorMsg('काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchFunds();
    }, [])
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const remaining = totalIncome - totalSpent;
  const spendingPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0;

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">गावाचा पैसा कुठे खर्च होतो?</AppText>
          <AppText variant="bodySmall" style={styles.subtitle}>गावाच्या विकासासाठी उपलब्ध आणि खर्च झालेल्या निधीची माहिती</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Total Funds Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.mainAmountContainer}>
            <AppText variant="label" style={styles.mainAmountLabel}>एकूण निधी (Income)</AppText>
            <AppText variant="headingLarge" style={styles.mainAmount}>{formatCurrency(totalIncome)}</AppText>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText variant="label" style={styles.progressLabel}>खर्च: {spendingPercentage.toFixed(0)}%</AppText>
              <AppText variant="label" style={styles.progressLabel}>{formatCurrency(totalSpent)} / {formatCurrency(totalIncome)}</AppText>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${spendingPercentage}%` }]} />
            </View>
          </View>

          <View style={styles.splitAmounts}>
            <View style={styles.splitItem}>
              <View style={[styles.dot, { backgroundColor: colors.error }]} />
              <View>
                <AppText variant="label" style={styles.splitLabel}>खर्च झालेला निधी</AppText>
                <AppText variant="headingSmall" style={styles.splitValue}>{formatCurrency(totalSpent)}</AppText>
              </View>
            </View>
            <View style={styles.splitItem}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View>
                <AppText variant="label" style={styles.splitLabel}>शिल्लक निधी</AppText>
                <AppText variant="headingSmall" style={styles.splitValue}>{formatCurrency(remaining)}</AppText>
              </View>
            </View>
          </View>
        </View>

        <AppText variant="headingSmall" style={styles.sectionTitle}>निधी व्यवहार (Transactions)</AppText>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : errorMsg ? (
          <EmptyState title={errorMsg} />
        ) : transactions.length === 0 ? (
          <EmptyState title="सध्या निधीची माहिती उपलब्ध नाही." />
        ) : (
          transactions.map((tx) => (
            <View 
              key={tx.id}
              style={styles.projectCard}
            >
              <View style={styles.projectHeader}>
                <View style={[styles.projectIconWrapper, { backgroundColor: tx.type === 'income' ? colors.success + '20' : colors.error + '20' }]}>
                  <Ionicons name={tx.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={tx.type === 'income' ? colors.success : colors.error} />
                </View>
                <AppText variant="headingSmall" style={styles.projectName}>{tx.description}</AppText>
              </View>
              
              <View style={styles.projectAmounts}>
                <AppText variant="bodyMedium" style={[styles.projectSpent, { color: tx.type === 'income' ? colors.success : colors.error }]}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </AppText>
                <AppText variant="label" style={styles.projectBudget}>
                  {new Date(tx.transaction_date).toLocaleDateString('en-GB')}
                </AppText>
              </View>
            </View>
          ))
        )}

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
  subtitle: {
    color: colors.secondaryText,
    marginTop: 2,
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
  mainAmountContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mainAmountLabel: {
    color: colors.secondaryText,
    marginBottom: spacing.xs,
  },
  mainAmount: {
    color: colors.text,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
    backgroundColor: colors.primary,
    borderRadius: radius.round,
  },
  splitAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  splitLabel: {
    color: colors.secondaryText,
    marginBottom: 2,
  },
  splitValue: {
    color: colors.text,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.md,
  },
  projectCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  projectIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.primaryPale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  projectName: {
    flex: 1,
    color: colors.text,
  },
  projectAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  projectSpent: {
    color: colors.error,
    fontWeight: '600',
  },
  projectBudget: {
    color: colors.secondaryText,
  },
  projectProgressBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    backgroundColor: colors.error,
    borderRadius: radius.round,
  }
});
