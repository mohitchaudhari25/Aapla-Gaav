import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TabLayout() {
  const router = useRouter();

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
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="complaints" 
        options={{ 
          title: 'Complaints',
          tabBarIcon: ({ color }) => <Ionicons name="alert-circle" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
