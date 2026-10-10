import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    let newErrors = {};
    if (!email.trim()) newErrors.email = 'ईमेल आवश्यक आहे';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      // Supabase requires proper URL configuration in the dashboard for redirects
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'aapla-gaav://reset-password-callback',
      });

      if (error) {
        setErrors({ form: error.message });
      } else {
        Alert.alert('यशस्वी', 'पासवर्ड रिसेट करण्यासाठी लिंक तुमच्या ईमेलवर पाठवली आहे.', [
          { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/auth/login') }
        ]);
      }
    } catch (err) {
      setErrors({ form: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={{ backgroundColor: colors.background, paddingHorizontal: 0 }} useSafeArea={false}>
      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.header}>
            <AppText variant="headingLarge" style={styles.loginTitle}>पासवर्ड रिसेट</AppText>
            <AppText variant="bodyMedium" style={styles.subtitle}>तुमचा नोंदणीकृत ईमेल प्रविष्ट करा</AppText>
          </View>

          <View style={styles.formContainer}>
            {errors.form ? (
              <AppText variant="bodySmall" style={{ color: 'red', marginBottom: spacing.md, textAlign: 'center' }}>
                {errors.form}
              </AppText>
            ) : null}
            <AppInput 
              label="ईमेल"
              placeholder="उदा. example@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: null });
                if (errors.form) setErrors({ ...errors, form: null });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppButton 
              title={loading ? "प्रक्रिया करत आहे..." : "रिसेट लिंक पाठवा"} 
              onPress={handleReset} 
              style={styles.loginButton} 
              disabled={loading}
            />

            <AppButton 
              title="मागे जा" 
              onPress={() => router.canGoBack() ? router.back() : router.replace('/auth/login')} 
              variant="outline" 
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  loginTitle: {
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: { color: colors.primaryPale },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  loginButton: { marginBottom: spacing.lg },
});
