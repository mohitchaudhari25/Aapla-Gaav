import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    let newErrors = {};
    if (!mobile.trim()) newErrors.mobile = t('error_mobile_required');
    if (!password) newErrors.password = t('error_password_required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      const email = mobile.includes('@') ? mobile : `${mobile}@aapla-gaav.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setErrors({ form: error.message });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setErrors({ form: t('error_unexpected') });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    router.push('/auth/reset-password');
  };

  return (
    <ScreenContainer style={{ backgroundColor: colors.background, paddingHorizontal: 0 }} useSafeArea={false}>
      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="headingLarge" style={styles.welcomeText}>{t('login_welcome')}</AppText>
            <AppText variant="headingLarge" style={styles.loginTitle}>{t('login_title')}</AppText>
            <AppText variant="bodyMedium" style={styles.subtitle}>{t('login_subtitle')}</AppText>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {errors.form ? (
              <AppText variant="bodySmall" style={{ color: 'red', marginBottom: spacing.md, textAlign: 'center' }}>
                {errors.form}
              </AppText>
            ) : null}
            <AppInput 
              label={t('login_mobile_email')}
              placeholder={t('login_mobile_placeholder')}
              value={mobile}
              onChangeText={(text) => {
                setMobile(text);
                if (errors.mobile) setErrors({ ...errors, mobile: null });
                if (errors.form) setErrors({ ...errors, form: null });
              }}
              error={errors.mobile}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppInput 
              label={t('login_password')}
              placeholder={t('login_password_placeholder')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
                if (errors.form) setErrors({ ...errors, form: null });
              }}
              error={errors.password}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText variant="bodyMedium" style={styles.forgotPasswordText}>{t('login_forgot_password')}</AppText>
            </TouchableOpacity>

            <AppButton 
              title={loading ? t('login_button_loading') : t('login_button')} 
              onPress={handleLogin} 
              style={styles.loginButton} 
              disabled={loading}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <AppText variant="bodyMedium" style={styles.dividerText}>{t('login_or')}</AppText>
              <View style={styles.dividerLine} />
            </View>

            <AppButton 
              title={t('login_register')} 
              onPress={handleRegister} 
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
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  welcomeText: {
    color: colors.primaryPale,
    marginBottom: spacing.xs,
  },
  loginTitle: {
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.primaryPale,
  },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.secondaryText,
    paddingHorizontal: spacing.md,
  },
});
