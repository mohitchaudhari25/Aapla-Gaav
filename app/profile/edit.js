import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userId, setUserId] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', user.id)
            .single();
            
          if (profile) {
            setFullName(profile.full_name || '');
            setPhoneNumber(profile.phone_number || '');
          }
        } else {
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('त्रुटी', 'माहिती मिळवता आली नाही.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('अपूर्ण माहिती', 'कृपया तुमचे पूर्ण नाव टाका.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('अपूर्ण माहिती', 'कृपया तुमचा मोबाईल क्रमांक टाका.');
      return;
    }
    if (phoneNumber.trim().length < 10) {
      Alert.alert('अवैध माहिती', 'कृपया योग्य मोबाईल क्रमांक टाका.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("तुमची माहिती जतन करता आली नाही. कृपया पुन्हा लॉगिन करून पहा.");
      }
      
      if (Platform.OS === 'web') {
        window.alert('प्रोफाइल यशस्वीरित्या अद्ययावत केले.');
        router.canGoBack() ? router.back() : router.replace('/');
      } else {
        Alert.alert('यशस्वी', 'प्रोफाइल यशस्वीरित्या अद्ययावत केले.', [
          { text: 'ओके', onPress: () => router.canGoBack() ? router.back() : router.replace('/') }
        ]);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'प्रोफाइल अद्ययावत करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
      } else {
        Alert.alert('त्रुटी', error.message || 'प्रोफाइल अद्ययावत करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={colors.text} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} />
        <AppText variant="headingSmall" style={styles.headerTitle}>प्रोफाइल संपादित करा</AppText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : (
            <View style={styles.formCard}>
              <AppInput
                label="पूर्ण नाव"
                placeholder="तुमचे पूर्ण नाव टाका"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <AppInput
                label="मोबाईल क्रमांक"
                placeholder="तुमचा मोबाईल क्रमांक टाका"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <View style={styles.actionButtons}>
                <AppButton
                  title="रद्द करा"
                  variant="outline"
                  onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                  style={styles.cancelBtn}
                  disabled={saving}
                />
                <AppButton
                  title={saving ? "सेव्ह करत आहे..." : "सेव्ह करा"}
                  onPress={handleSave}
                  style={styles.saveBtn}
                  disabled={saving}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1,
  }
});
