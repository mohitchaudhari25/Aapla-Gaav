import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import ContactCard from '../../components/cards/ContactCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing } from '../../constants';
import { DEMO_CONTACTS } from '../../data/contacts';

export default function Contacts() {
  const router = useRouter();

  const emergencyContacts = DEMO_CONTACTS?.filter(c => c.type === 'emergency') || [];
  const villageContacts = DEMO_CONTACTS?.filter(c => c.type === 'village') || [];

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">महत्त्वाचे संपर्क</AppText>
          <AppText variant="bodySmall" style={styles.subtitle}>गावातील महत्त्वाचे संपर्क आणि आपत्कालीन क्रमांक</AppText>
        </View>
      </View>

      {(!DEMO_CONTACTS || DEMO_CONTACTS.length === 0) ? (
        <EmptyState title="सध्या कोणतीही संपर्क माहिती उपलब्ध नाही." />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {emergencyContacts.length > 0 && (
            <View style={styles.section}>
              <AppText variant="headingSmall" style={styles.sectionTitle}>आपत्कालीन संपर्क</AppText>
              {emergencyContacts.map((contact) => (
                <ContactCard 
                  key={contact.id}
                  name={contact.name}
                  role={contact.role}
                  phone={contact.phone}
                  type={contact.type}
                />
              ))}
            </View>
          )}

          {villageContacts.length > 0 && (
            <View style={styles.section}>
              <AppText variant="headingSmall" style={styles.sectionTitle}>गावातील महत्त्वाचे संपर्क</AppText>
              {villageContacts.map((contact) => (
                <ContactCard 
                  key={contact.id}
                  name={contact.name}
                  role={contact.role}
                  phone={contact.phone}
                  type={contact.type}
                />
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  headerTextContainer: {
    flex: 1,
  },
  subtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    marginBottom: spacing.md,
  }
});
