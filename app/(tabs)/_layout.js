import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: colors.primary,
      headerShown: false
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: t('tab_home', 'मुख्यपृष्ठ'),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="complaints" 
        options={{ 
          title: t('tab_complaints', 'तक्रारी'),
          tabBarIcon: ({ color }) => <Ionicons name="alert-circle" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: t('tab_notifications', 'सूचना'),
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: t('tab_profile', 'प्रोफाइल'),
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
