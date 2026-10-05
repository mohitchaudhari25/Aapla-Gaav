import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import NotificationCard from '../../components/cards/NotificationCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing } from '../../constants';
import { DEMO_NOTIFICATIONS } from '../../data/notifications';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const handleNotificationPress = (notification) => {
    // Mark as read locally
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    ));

    // Navigate to respective screens based on type
    switch(notification.type) {
      case 'complaint':
        // If we had an exact ID mapping, we could pass it. Routing to the tab for now, or if a general route exists.
        // As per instructions, "Complaint Details" can be routed if route exists. But we don't have the specific ID mapping here.
        // Let's assume it routes to My Complaints for simplicity, or details with a demo ID.
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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

      {(!notifications || notifications.length === 0) ? (
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
              date={notification.date}
              message={notification.message}
              isRead={notification.isRead}
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
