import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import CascadingLocationPicker from '../../components/common/CascadingLocationPicker';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

// Preset avatar options for citizens
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
];

export default function EditProfile() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  // Profile Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Cascading Location & Geographic Details
  const [stateName, setStateName] = useState('Maharashtra');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [villageName, setVillageName] = useState('');
  const [isManualVillage, setIsManualVillage] = useState(false);
  const [manualVillageName, setManualVillageName] = useState('');
  const [locationErrors, setLocationErrors] = useState({});

  // Residential Address Details
  const [houseNumber, setHouseNumber] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          router.replace('/auth/login');
          return;
        }

        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setFullName(profile.full_name || '');
          setPhoneNumber(profile.phone_number || '');
          setEmail(profile.email || user.email || '');
          setAvatarUrl(profile.avatar_url || '');
          setSelectedVillageId(profile.village_id || null);
          setHouseNumber(profile.house_number || '');
          setResidentialAddress(profile.residential_address || '');
          setPincode(profile.pincode || '');

          if (profile.village_id) {
            const { data: vData } = await supabase
              .from('villages')
              .select('*')
              .eq('id', profile.village_id)
              .maybeSingle();

            if (vData) {
              setVillageName(vData.name || '');
              setTaluka(vData.taluka || '');
              setDistrict(vData.district || '');
              setStateName(vData.state || 'Maharashtra');
              setIsManualVillage(false);
              setManualVillageName('');
            }
          } else {
            // Check for pending manual village request
            const pendingName = profile.pending_village_name || user.user_metadata?.pending_village_name || user.user_metadata?.village_name || '';
            const uState = profile.state || user.user_metadata?.state || 'Maharashtra';
            const uDistrict = profile.district || user.user_metadata?.district || '';
            const uTaluka = profile.taluka || user.user_metadata?.taluka || '';

            setStateName(uState);
            setDistrict(uDistrict);
            setTaluka(uTaluka);

            if (pendingName) {
              setIsManualVillage(true);
              setManualVillageName(pendingName);
              setVillageName(pendingName);
            }
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSave = async () => {
    const locErrors = {};

    if (!fullName.trim()) {
      Alert.alert('अपूर्ण माहिती', 'कृपया तुमचे पूर्ण नाव प्रविष्ट करा.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      Alert.alert('अवैध माहिती', 'कृपया १० अंकी योग्य मोबाईल क्रमांक प्रविष्ट करा.');
      return;
    }

    // Validate cascading location
    if (!stateName.trim()) {
      locErrors.state = t('err_state_required');
    }
    if (!district.trim()) {
      locErrors.district = t('err_district_required');
    }
    if (!taluka.trim()) {
      locErrors.taluka = t('err_taluka_required');
    }

    if (isManualVillage) {
      if (!manualVillageName.trim()) {
        locErrors.manualVillage = t('err_manual_village_required');
      }
    } else {
      if (!selectedVillageId) {
        locErrors.village = t('err_village_required');
      }
    }

    if (Object.keys(locErrors).length > 0) {
      setLocationErrors(locErrors);
      Alert.alert(t('err_incomplete_form'), t('err_incomplete_form'));
      return;
    }

    setLocationErrors({});
    setSaving(true);

    try {
      const finalVillageName = isManualVillage ? manualVillageName.trim() : villageName;

      const updatePayload = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        email: email.trim() || null,
        avatar_url: avatarUrl || null,
        village_id: isManualVillage ? null : selectedVillageId,
        state: stateName,
        district: district,
        taluka: taluka,
        pending_village_name: isManualVillage ? manualVillageName.trim() : null,
        house_number: houseNumber.trim() || null,
        residential_address: residentialAddress.trim() || null,
        pincode: pincode.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Also persist in auth user metadata for complete synchronization
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            phone_number: phoneNumber.trim(),
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
        });
      } catch (authMetaErr) {
        console.warn('Auth metadata update error:', authMetaErr);
      }

      // Resilient update: if columns are missing from schema cache, strip and retry
      let currentPayload = { ...updatePayload };
      let success = false;
      let attempts = 0;

      while (!success && attempts < 8) {
        attempts++;
        const { error } = await supabase
          .from('profiles')
          .update(currentPayload)
          .eq('id', userId);

        if (!error) {
          success = true;
          break;
        }

        const match = error.message && error.message.match(/Could not find the '([^']+)' column of 'profiles' in the schema cache/i);
        if (match && match[1]) {
          delete currentPayload[match[1]];
          continue;
        }

        const colMatch = error.message && error.message.match(/column "([^"]+)" of relation "profiles" does not exist/i);
        if (colMatch && colMatch[1]) {
          delete currentPayload[colMatch[1]];
          continue;
        }

        throw error;
      }

      const successMsg = isManualVillage
        ? 'प्रोफाइल अद्ययावत केले! आपण प्रविष्ट केलेले गाव प्रशासकीय पडताळणीसाठी पाठवले आहे.'
        : 'प्रोफाइल यशस्वीरित्या अद्ययावत केले!';

      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
      } else {
        Alert.alert(t('profile_updated'), successMsg, [
          { text: 'ओके (OK)', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile') }
        ]);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err.message || 'प्रोफाइल अद्ययावत करताना समस्या आली.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('त्रुटी', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer style={{ backgroundColor: colors.background }}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="bodyMedium" style={{ marginTop: spacing.md, color: colors.secondaryText }}>
            माहिती लोड होत आहे...
          </AppText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <AppText variant="headingMedium">प्रोफाइल संपादन</AppText>
            <AppText variant="label" style={styles.headerSubtitle}>Edit Profile Details</AppText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Section 1: Profile Photo Section */}
          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionHeading}>{t('sec_profile_photo')}</AppText>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={44} color={colors.white} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.avatarEditBadge}
                  onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.avatarInfo}>
                <AppText variant="label" style={{ fontWeight: '700', color: colors.text }}>
                  प्रोफाइल फोटो निवडा
                </AppText>
                <AppText variant="bodySmall" style={{ color: colors.secondaryText }}>
                  खाली दिलेल्या फोटोंमधून एक निवडा किंवा कॅमेरा वापरा
                </AppText>
                <TouchableOpacity
                  style={styles.avatarToggleBtn}
                  onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                >
                  <AppText variant="label" style={{ color: colors.primary, fontWeight: '700' }}>
                    {showAvatarPicker ? 'पर्याय लपवा ▲' : 'फोटो बदला ▼'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preset Avatar Selection Grid */}
            {showAvatarPicker && (
              <View style={styles.presetGridContainer}>
                <AppText variant="label" style={styles.presetGridLabel}>
                  {t('select_avatar')}:
                </AppText>
                <View style={styles.presetGrid}>
                  {PRESET_AVATARS.map((url, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setAvatarUrl(url);
                        setShowAvatarPicker(false);
                      }}
                      style={[
                        styles.presetAvatarBtn,
                        avatarUrl === url && styles.presetAvatarBtnSelected,
                      ]}
                    >
                      <Image source={{ uri: url }} style={styles.presetAvatarImg} />
                    </TouchableOpacity>
                  ))}
                  {avatarUrl ? (
                    <TouchableOpacity
                      onPress={() => {
                        setAvatarUrl('');
                        setShowAvatarPicker(false);
                      }}
                      style={[styles.presetAvatarBtn, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.errorPale || '#fee' }]}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
          </View>

          {/* Section 2: Personal Information */}
          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionHeading}>{t('sec_personal_details')}</AppText>

            <AppInput
              label={t('field_full_name')}
              value={fullName}
              onChangeText={setFullName}
              placeholder="उदा. रमेश विठ्ठल पाटील"
            />

            <AppInput
              label={t('field_mobile_number')}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="९८७६५४३२१०"
            />

            <AppInput
              label={t('field_email_address')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="example@mail.com"
            />
          </View>

          {/* Section 3: Cascading Location Selection */}
          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionHeading}>
              {t('sec_village_details')}
            </AppText>

            <CascadingLocationPicker
              selectedState={stateName}
              onStateChange={(s) => {
                setStateName(s);
                if (locationErrors.state) setLocationErrors((prev) => ({ ...prev, state: null }));
              }}
              selectedDistrict={district}
              onDistrictChange={(d) => {
                setDistrict(d);
                if (locationErrors.district) setLocationErrors((prev) => ({ ...prev, district: null }));
              }}
              selectedTaluka={taluka}
              onTalukaChange={(t) => {
                setTaluka(t);
                if (locationErrors.taluka) setLocationErrors((prev) => ({ ...prev, taluka: null }));
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
                if (locationErrors.village) setLocationErrors((prev) => ({ ...prev, village: null }));
              }}
              isManualVillage={isManualVillage}
              onManualVillageToggle={(flag) => {
                setIsManualVillage(flag);
                if (locationErrors.village) setLocationErrors((prev) => ({ ...prev, village: null }));
                if (locationErrors.manualVillage) setLocationErrors((prev) => ({ ...prev, manualVillage: null }));
              }}
              manualVillageName={manualVillageName}
              onManualVillageNameChange={(val) => {
                setManualVillageName(val);
                if (locationErrors.manualVillage) setLocationErrors((prev) => ({ ...prev, manualVillage: null }));
              }}
              errors={locationErrors}
            />
          </View>

          {/* Section 4: Citizen Residential Address */}
          <View style={styles.card}>
            <AppText variant="headingSmall" style={styles.sectionHeading}>{t('sec_residential_address')}</AppText>

            <AppInput
              label={t('field_house_no')}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="उदा. घर क्र. १२/अ किंवा गल्ली नं. २"
            />

            <AppInput
              label={t('field_full_address')}
              value={residentialAddress}
              onChangeText={setResidentialAddress}
              placeholder="उदा. मारुती मंदिराजवळ, वरड"
              multiline
              numberOfLines={2}
            />

            <AppInput
              label={t('field_pincode')}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="४२५१०१"
            />
          </View>

          {/* Save Button */}
          <AppButton
            title={saving ? t('btn_saving_changes') : t('btn_save_changes')}
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerSubtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xxl * 3,
    gap: spacing.lg,
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
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarInfo: {
    flex: 1,
    gap: 4,
  },
  avatarToggleBtn: {
    marginTop: 4,
  },
  presetGridContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  presetGridLabel: {
    color: colors.secondaryText,
    marginBottom: spacing.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetAvatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  presetAvatarBtnSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  saveButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
