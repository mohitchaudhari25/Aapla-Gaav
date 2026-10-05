import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { colors, spacing, radius } from '../../constants';
import { DEMO_COMPLAINTS } from '../../data/complaints';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  'पाणी', 'रस्ता', 'वीज', 'स्वच्छता', 'स्ट्रीट लाईट', 'इतर'
];

export default function NewComplaint() {
  const router = useRouter();
  
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  
  const [errors, setErrors] = useState({});

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

  const handleSubmit = () => {
    if (validate()) {
      const newId = `AG-2026-00${DEMO_COMPLAINTS.length + 1}`;
      
      const newComplaint = {
        id: newId,
        category: category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'प्राप्त'
      };
      
      DEMO_COMPLAINTS.unshift(newComplaint); // Add to the top of the list
      
      router.replace({ pathname: '/complaints/success', params: { id: newId } });
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View>
              <AppText variant="headingMedium">नवीन तक्रार</AppText>
              <AppText variant="bodySmall" style={styles.subtitle}>गावातील समस्या किंवा तक्रार येथे नोंदवा.</AppText>
            </View>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="label" style={styles.label}>तक्रारीचा प्रकार</AppText>
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
            label="तक्रारीचे शीर्षक"
            placeholder="उदा. पाणी पुरवठा बंद आहे"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors(prev => ({ ...prev, title: null }));
            }}
            error={errors.title}
          />

          <AppInput
            label="तक्रारीचे वर्णन"
            placeholder="तुमच्या समस्येबद्दल थोडक्यात माहिती द्या"
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
            label="ठिकाण (पर्यायी)"
            placeholder="उदा. मुख्य चौक, शाळेजवळ"
            value={location}
            onChangeText={setLocation}
          />

          <AppButton 
            title="तक्रार नोंदवा" 
            onPress={handleSubmit} 
            style={styles.submitButton}
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
