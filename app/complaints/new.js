import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { supabase } from '../../lib/supabase';
import { generateUnique10DigitTrackingId } from '../../lib/complaintUtils';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  'पाणी', 'रस्ता', 'वीज', 'स्वच्छता', 'स्ट्रीट लाईट', 'इतर'
];

export default function NewComplaint() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!category) {
      newErrors.category = 'कृपया तक्रारीचा प्रकार निवडा.';
      valid = false;
    }
    if (!title.trim()) {
      newErrors.title = 'कृपया तक्रारीचे शीर्षक लिहा.';
      valid = false;
    }
    if (!description.trim()) {
      newErrors.description = 'कृपया तक्रारीचे वर्णन लिहा.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (validate()) {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert("Error", "You must be logged in.");
          setLoading(false);
          return;
        }

        // Ensure user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile not found, create a basic one
          const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                full_name: user.user_metadata?.full_name || 'Citizen',
                role: 'citizen'
              }
            ]);
            
          if (insertProfileError) {
            console.error('Failed to create profile:', insertProfileError);
            Alert.alert("Error", "प्रोफाइल तयार करताना त्रुटी आली.");
            setLoading(false);
            return;
          }
        }

        // Generate persistent unique 10-digit tracking ID
        const trackingId = generateUnique10DigitTrackingId();
        const finalDescription = `[ट्रॅकिंग आयडी: ${trackingId}] [प्रकार: ${category}] ${location ? '[ठिकाण: ' + location.trim() + ']\n' : ''}${description.trim()}`;

        const insertRecord = {
          user_id: user.id,
          title: title.trim(),
          description: finalDescription,
          status: 'प्राप्त'
        };

        const { data, error } = await supabase
          .from('complaints')
          .insert([insertRecord])
          .select();

        if (error) throw error;
        
        const newId = data[0]?.id;
        router.replace({ pathname: '/complaints/success', params: { id: newId, trackingId } });
      } catch (error) {
        Alert.alert("Error", "तक्रार नोंदवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScreenContainer useSafeArea>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View>
              <AppText variant="headingMedium">{t('new_complaint_title')}</AppText>
              <AppText variant="bodySmall" style={styles.subtitle}>{t('new_complaint_subtitle')}</AppText>
            </View>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="label" style={styles.label}>{t('complaint_category_field')}</AppText>
            <View style={styles.chipContainer}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.chip, category === cat && styles.chipSelected]}
                  onPress={() => {
                    setCategory(cat);
                    setErrors(prev => ({ ...prev, category: null }));
                  }}
                  activeOpacity={0.7}
                >
                  <AppText 
                    variant="bodyMedium" 
                    style={[styles.chipText, category === cat && styles.chipTextSelected]}
                  >
                    {cat}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && <AppText variant="label" style={styles.errorText}>{errors.category}</AppText>}
          </View>

          <AppInput
            label={t('complaint_title_field')}
            placeholder={t('complaint_title_placeholder')}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors(prev => ({ ...prev, title: null }));
            }}
            error={errors.title}
          />

          <AppInput
            label={t('complaint_desc_field')}
            placeholder={t('complaint_desc_placeholder')}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrors(prev => ({ ...prev, description: null }));
            }}
            error={errors.description}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            textAlignVertical="top"
          />

          <AppInput
            label={t('complaint_location_field')}
            placeholder={t('complaint_location_placeholder')}
            value={location}
            onChangeText={setLocation}
          />

          <AppButton 
            title={loading ? t('btn_submitting_complaint') : t('btn_submit_complaint')} 
            onPress={handleSubmit} 
            style={styles.submitButton}
            disabled={loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
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
  subtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.text,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.white,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    marginTop: spacing.lg,
  }
});
