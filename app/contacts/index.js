import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/common/ScreenContainer';
import AppText from '../../components/ui/AppText';
import ContactCard from '../../components/cards/ContactCard';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing } from '../../constants';
import { DEMO_CONTACTS } from '../../data/contacts';
import { supabase } from '../../lib/supabase';
import { mockContacts } from '../../data/mockData';

export default function Contacts() {
  const router = useRouter();

  const emergencyContacts = DEMO_CONTACTS?.filter(c => c.type === 'emergency') || [];
  const [villageContacts, setVillageContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      let channel = null;

      const fetchContacts = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          let targetVillageId = null;

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('village_id')
              .eq('id', user.id)
              .maybeSingle();

            targetVillageId = profile?.village_id;
          }

          if (!targetVillageId) {
            const { data: defaultVillage } = await supabase
              .from('villages')
              .select('id')
              .limit(1)
              .maybeSingle();

            if (defaultVillage) {
              targetVillageId = defaultVillage.id;
            }
          }

          const loadContacts = async () => {
            let query = supabase.from('contacts').select('*');
            if (targetVillageId) {
              query = query.eq('village_id', targetVillageId);
            }

            const { data, error } = await query;

            if (error) {
              console.error('Contacts fetch error:', error);
              if (isMounted) setErrorMsg('संपर्क माहिती मिळवण्यात त्रुटी आली.');
            } else if (data && isMounted) {
              if (data.length > 0) {
                setVillageContacts(data);
              } else if (!user) {
                setVillageContacts(mockContacts);
              } else {
                setVillageContacts([]);
              }
            }
          };

          await loadContacts();

          // Realtime listener for contacts changes
          channel = supabase
            .channel('contacts-channel')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'contacts',
              },
              () => {
                loadContacts();
              }
            )
            .subscribe();
        } catch (error) {
          if (isMounted) setErrorMsg('काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.');
          console.error(error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchContacts();

      return () => {
        isMounted = false;
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }, [])
  );

  return (
    <ScreenContainer useSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="headingMedium">महत्त्वाचे संपर्क</AppText>
          <AppText variant="bodySmall" style={styles.subtitle}>गावातील महत्त्वाचे संपर्क आणि आपत्कालीन क्रमांक</AppText>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : errorMsg ? (
        <EmptyState title={errorMsg} />
      ) : (emergencyContacts.length === 0 && villageContacts.length === 0) ? (
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
                  role={contact.role || contact.designation}
                  phone={contact.phone}
                  email={contact.email}
                  type={contact.type || 'village'}
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
