import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import CascadingLocationPicker from '../../components/common/CascadingLocationPicker';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();

  // Personal info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Cascading Location info
  const [stateName, setStateName] = useState('Maharashtra');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [villageName, setVillageName] = useState('');
  const [isManualVillage, setIsManualVillage] = useState(false);
  const [manualVillageName, setManualVillageName] = useState('');

  // Residential address
  const [houseNumber, setHouseNumber] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [pincode, setPincode] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    let newErrors = {};

    // 1. Validate personal info
    if (!name.trim()) newErrors.name = t('err_name_required');
    if (!phone.trim() || phone.trim().length < 10) {
      newErrors.phone = t('err_phone_required');
    }
    if (!email.trim()) {
      newErrors.email = t('err_email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('err_email_invalid');
    }
    if (!password) {
      newErrors.password = t('err_pass_required');
    } else if (password.length < 6) {
      newErrors.password = t('err_pass_min');
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = t('err_pass_confirm_required');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('err_pass_mismatch');
    }

    // 2. Validate cascading location
    if (!stateName.trim()) {
      newErrors.state = t('err_state_required');
    }
    if (!district.trim()) {
      newErrors.district = t('err_district_required');
    }
    if (!taluka.trim()) {
      newErrors.taluka = t('err_taluka_required');
    }

    if (isManualVillage) {
      if (!manualVillageName.trim()) {
        newErrors.manualVillage = t('err_manual_village_required');
      }
    } else {
      if (!selectedVillageId) {
        newErrors.village = t('err_village_required');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert(t('err_incomplete_form'), t('err_incomplete_form'));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const finalVillageName = isManualVillage ? manualVillageName.trim() : villageName;

      // 1. Supabase Auth Registration
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            phone_number: phone.trim(),
            state: stateName,
            district: district,
            taluka: taluka,
            village_id: isManualVillage ? null : selectedVillageId,
            village_name: finalVillageName,
            pending_village_name: isManualVillage ? manualVillageName.trim() : null,
            is_village_pending: isManualVillage,
            house_number: houseNumber.trim() || null,
            residential_address: residentialAddress.trim() || null,
            pincode: pincode.trim() || null,
          },
        },
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      if (data?.user) {
        // 2. Resilient Profile Insert (iteratively strip any unmigrated columns if needed)
        const profilePayload = {
          id: data.user.id,
          full_name: name.trim(),
          phone_number: phone.trim(),
          role: 'citizen',
          village_id: isManualVillage ? null : selectedVillageId,
          state: stateName,
          district: district,
          taluka: taluka,
          pending_village_name: isManualVillage ? manualVillageName.trim() : null,
          house_number: houseNumber.trim() || null,
          residential_address: residentialAddress.trim() || null,
          pincode: pincode.trim() || null,
        };

        let currentPayload = { ...profilePayload };
        let inserted = false;
        let attempts = 0;

        while (!inserted && attempts < 8) {
          attempts++;
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([currentPayload]);

          if (!profileError) {
            inserted = true;
            break;
          }

          const match = profileError.message && profileError.message.match(/Could not find the '([^']+)' column of 'profiles' in the schema cache/i);
          if (match && match[1]) {
            delete currentPayload[match[1]];
            continue;
          }

          const colMatch = profileError.message && profileError.message.match(/column "([^"]+)" of relation "profiles" does not exist/i);
          if (colMatch && colMatch[1]) {
            delete currentPayload[colMatch[1]];
            continue;
          }

          console.warn('Profile insert warning:', profileError.message);
          break;
        }

        Alert.alert(
          t('registration_successful'),
          isManualVillage
            ? 'आपले खाते तयार झाले आहे. आपण प्रविष्ट केलेले गाव पडताळणीसाठी पाठवले आहे. कृपया लॉगिन करा.'
            : 'आपले खाते यशस्वीरित्या तयार झाले आहे. कृपया लॉगिन करा.',
          [{ text: 'लॉगिन करा (OK)', onPress: () => router.replace('/auth/login') }]
        );
      }
    } catch (err) {
      console.error('Registration exception:', err);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="headingLarge" style={styles.title}>नोंदणी करा</AppText>
            <AppText variant="bodyMedium" style={styles.subtitle}>
              AaplaGaav मध्ये नागरिक खाते तयार करा
            </AppText>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {errors.form ? (
              <View style={styles.errorBanner}>
                <AppText variant="bodySmall" style={styles.errorBannerText}>
                  {errors.form}
                </AppText>
              </View>
            ) : null}

            {/* Section 1: Personal Details */}
            <View style={styles.card}>
              <AppText variant="headingSmall" style={styles.sectionHeading}>
                {t('sec_personal_details')}
              </AppText>

              <AppInput
                label={t('field_full_name')}
                placeholder="उदा. रमेश विठ्ठल पाटील"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                error={errors.name}
              />

              <AppInput
                label={t('field_mobile_number')}
                placeholder="९८७६५४३२१०"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                }}
                keyboardType="phone-pad"
                maxLength={10}
                error={errors.phone}
              />

              <AppInput
                label={t('field_email_address')}
                placeholder="उदा. user@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AppInput
                label={t('field_password')}
                placeholder="किमान ६ अक्षरांचा पासवर्ड टाका"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                error={errors.password}
                secureTextEntry
              />

              <AppInput
                label={t('field_confirm_password')}
                placeholder="पासवर्ड पुन्हा टाका"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                error={errors.confirmPassword}
                secureTextEntry
              />
            </View>

            {/* Section 2: Cascading Village Details */}
            <View style={styles.card}>
              <AppText variant="headingSmall" style={styles.sectionHeading}>
                {t('sec_village_details')}
              </AppText>

              <CascadingLocationPicker
                selectedState={stateName}
                onStateChange={(s) => {
                  setStateName(s);
                  if (errors.state) setErrors((prev) => ({ ...prev, state: null }));
                }}
                selectedDistrict={district}
                onDistrictChange={(d) => {
                  setDistrict(d);
                  if (errors.district) setErrors((prev) => ({ ...prev, district: null }));
                }}
                selectedTaluka={taluka}
                onTalukaChange={(t) => {
                  setTaluka(t);
                  if (errors.taluka) setErrors((prev) => ({ ...prev, taluka: null }));
                }}
                selectedVillageId={selectedVillageId}
                selectedVillageName={villageName}
                onVillageChange={(v) => {
                  if (v) {
                    setSelectedVillageId(v.id);
                    setVillageName(v.name);
                  } else {
                    setSelectedVillageId(null);
                    setVillageName('');
                  }
                  if (errors.village) setErrors((prev) => ({ ...prev, village: null }));
                }}
                isManualVillage={isManualVillage}
                onManualVillageToggle={(flag) => {
                  setIsManualVillage(flag);
                  if (errors.village) setErrors((prev) => ({ ...prev, village: null }));
                  if (errors.manualVillage) setErrors((prev) => ({ ...prev, manualVillage: null }));
                }}
                manualVillageName={manualVillageName}
                onManualVillageNameChange={(val) => {
                  setManualVillageName(val);
                  if (errors.manualVillage) setErrors((prev) => ({ ...prev, manualVillage: null }));
                }}
                errors={errors}
              />
            </View>

            {/* Section 3: Residential Address */}
            <View style={styles.card}>
              <AppText variant="headingSmall" style={styles.sectionHeading}>
                ३. रहिवासी पत्ता (Residential Address - ऐच्छिक)
              </AppText>

              <AppInput
                label="घर क्रमांक (House No.)"
                value={houseNumber}
                onChangeText={setHouseNumber}
                placeholder="उदा. घर क्र. १२/बी"
              />

              <AppInput
                label={t('field_full_address')}
                value={residentialAddress}
                onChangeText={setResidentialAddress}
                placeholder="उदा. मारुती मंदिराजवळ, मुख्य रस्ता"
                multiline
              />

              <AppInput
                label={t('field_pincode')}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
                placeholder="४२५००१"
              />
            </View>

            {/* Actions */}
            <AppButton
              title={loading ? t('btn_registering') : t('btn_register')}
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
              title={t('already_have_account')}
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
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxl * 1.5 : spacing.xxl,
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
    padding: spacing.md,
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.sm,
  },
  sectionHeading: {
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 125, 50, 0.15)',
    paddingBottom: spacing.xs,
  },
  registerButton: {
    marginTop: spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
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
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  errorBannerText: {
    color: colors.error,
    textAlign: 'center',
    fontWeight: '600',
  },
});
