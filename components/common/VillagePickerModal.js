import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function VillagePickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedVillageId,
}) {
  const { t, i18n } = useTranslation();
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVillages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('villages')
        .select('*')
        .order('name', { ascending: true });

      if (fetchErr) throw fetchErr;

      setVillages(data || []);
    } catch (err) {
      console.warn('Error fetching villages list:', err);
      setError(err.message || 'गावांची यादी लोड करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVillages();
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredVillages = useMemo(() => {
    if (!searchQuery.trim()) return villages;
    const q = searchQuery.toLowerCase().trim();
    return villages.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const taluka = (v.taluka || '').toLowerCase();
      const district = (v.district || '').toLowerCase();
      const gp = (v.gram_panchayat || '').toLowerCase();
      return name.includes(q) || taluka.includes(q) || district.includes(q) || gp.includes(q);
    });
  }, [villages, searchQuery]);

  const handleSelectVillage = (village) => {
    onSelect(village);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSmall" style={styles.headerTitle}>
                आपले गाव निवडा
              </AppText>
              <AppText variant="bodySmall" style={styles.headerSubtitle}>
                Select Your Village
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color={colors.secondaryText} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="गावाचे नाव, तालुका किंवा जिल्हा शोधा..."
              placeholderTextColor={colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content Area */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText variant="bodyMedium" style={{ marginTop: spacing.md, color: colors.secondaryText }}>
                गावांची यादी लोड होत आहे...
              </AppText>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
              <AppText variant="bodyMedium" style={styles.errorText}>
                {error}
              </AppText>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchVillages} activeOpacity={0.8}>
                <Ionicons name="refresh" size={18} color={colors.white} />
                <AppText variant="label" style={{ color: colors.white, fontWeight: '700' }}>
                  {t('retry')}
                </AppText>
              </TouchableOpacity>
            </View>
          ) : filteredVillages.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="business-outline" size={44} color={colors.secondaryText} />
              <AppText variant="bodyMedium" style={styles.emptyText}>
                {villages.length === 0
                  ? (i18n.language === 'en' ? 'No villages available. Please contact administrator.' : 'कोणतेही गाव उपलब्ध नाही. कृपया प्रशासकाशी संपर्क साधा.')
                  : (i18n.language === 'en' ? 'No matching villages found.' : 'या नावाने कोणतेही गाव आढळले नाही.')}
              </AppText>
            </View>
          ) : (
            <FlatList
              data={filteredVillages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selectedVillageId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.villageItem, isSelected && styles.villageItemSelected]}
                    onPress={() => handleSelectVillage(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.villageItemLeft}>
                      <View style={[styles.villageIcon, isSelected && styles.villageIconSelected]}>
                        <Ionicons
                          name="business"
                          size={18}
                          color={isSelected ? colors.white : colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="headingSmall" style={styles.villageName}>
                          {item.name}
                        </AppText>
                        <AppText variant="bodySmall" style={styles.villageSub}>
                          {item.taluka ? `${item.taluka} तालुका, ` : ''}
                          {item.district ? `${item.district} जिल्हा, ` : ''}
                          {item.state || 'महाराष्ट्र'}
                        </AppText>
                      </View>
                    </View>

                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.border} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    minHeight: '55%',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  villageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  villageItemSelected: {
    backgroundColor: colors.primaryPale || '#E8F5E9',
    borderColor: colors.primary,
  },
  villageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  villageIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  villageIconSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  villageName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  villageSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 220,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});

