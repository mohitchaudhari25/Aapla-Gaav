import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'पूर्ण नाव आवश्यक आहे';
    if (!email.trim()) newErrors.email = 'ईमेल आवश्यक आहे';
    if (!password) newErrors.password = 'पासवर्ड आवश्यक आहे';
    if (!confirmPassword) newErrors.confirmPassword = 'पासवर्डची पुष्टी करणे आवश्यक आहे';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'पासवर्ड जुळत नाही';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setErrors({ form: error.message });
      } else if (data.user) {
        if (data.session) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                full_name: name,
                phone_number: null,
                role: 'citizen'
              }
            ]);

          if (profileError) {
            setErrors({ form: `प्रोफाइल तयार करताना त्रुटी: ${profileError.message}` });
            return;
          }
        }
        router.replace('/auth/login');
      }
    } catch (err) {
      setErrors({ form: 'काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <ScreenContainer style={{ backgroundColor: colors.background, paddingHorizontal: 0 }} useSafeArea={false}>
      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="headingLarge" style={styles.title}>नोंदणी करा</AppText>
            <AppText variant="bodyMedium" style={styles.subtitle}>AaplaGaav मध्ये नवीन खाते तयार करा</AppText>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {errors.form ? (
              <AppText variant="bodySmall" style={{ color: 'red', marginBottom: spacing.md, textAlign: 'center' }}>
                {errors.form}
              </AppText>
            ) : null}
            <AppInput 
              label="पूर्ण नाव"
              placeholder="तुमचे नाव टाका"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: null });
                if (errors.form) setErrors({ ...errors, form: null });
              }}
              error={errors.name}
            />

            <AppInput 
              label="ईमेल"
              placeholder="उदा. user@example.com"
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

            <AppInput 
              label="पासवर्ड"
              placeholder="तुमचा पासवर्ड टाका"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: null });
                if (errors.form) setErrors({ ...errors, form: null });
              }}
              error={errors.password}
              secureTextEntry
            />

            <AppInput 
              label="पासवर्डची पुष्टी करा"
              placeholder="पासवर्ड पुन्हा टाका"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                if (errors.form) setErrors({ ...errors, form: null });
              }}
              error={errors.confirmPassword}
              secureTextEntry
            />

            <AppButton 
              title={loading ? "नोंदणी करत आहे..." : "नोंदणी करा"} 
              onPress={handleRegister} 
              style={styles.registerButton} 
              disabled={loading}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <AppText variant="bodyMedium" style={styles.dividerText}>किंवा</AppText>
              <View style={styles.dividerLine} />
            </View>

            <AppButton 
              title="लॉगिन करा" 
              onPress={handleLogin} 
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
  title: {
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
  registerButton: {
    marginTop: spacing.md,
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
