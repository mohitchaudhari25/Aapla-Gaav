import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import NotificationCard from '../../components/cards/NotificationCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          setErrorMsg('सूचना मिळवण्यात त्रुटी आली.');
        } else if (data) {
          setNotifications(data);
        }
      } else {
        setErrorMsg('कृपया लॉगिन करा.');
      }
    } catch (error) {
      setErrorMsg('काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.is_read) {
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    }

    switch(notification.type) {
      case 'complaint':
        router.push('/(tabs)/complaints');
        break;
      case 'notice':
      case 'gram_sabha':
        router.push('/notices');
        break;
      case 'project':
        router.push('/projects');
        break;
      default:
        break;
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .in('id', unreadIds);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">सूचना</AppText>
          <AppText variant="bodySmall" style={styles.subtitle}>तुमच्या गावातील महत्त्वाच्या अपडेट्स</AppText>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Ionicons name="checkmark-done-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : errorMsg ? (
        <EmptyState title={errorMsg} />
      ) : (!notifications || notifications.length === 0) ? (
        <EmptyState 
          title="सध्या कोणत्याही नवीन सूचना नाहीत." 
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => (
            <NotificationCard 
              key={notification.id}
              type={notification.type}
              title={notification.title}
              date={notification.created_at || notification.date}
              message={notification.message}
              isRead={notification.is_read}
              onPress={() => handleNotificationPress(notification)}
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
  markAllButton: {
    padding: spacing.sm,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  }
});
