import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../constants';
import AppText from '../ui/AppText';
import AppInput from '../ui/AppInput';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import {
  getStates,
  getDistrictsForState,
  getTalukasForDistrict,
  getVillagesForTaluka,
} from '../../lib/locationData';

export default function CascadingLocationPicker({

  selectedState = '',
  onStateChange,
  selectedDistrict = '',
  onDistrictChange,
  selectedTaluka = '',
  onTalukaChange,
  selectedVillageId = null,
  selectedVillageName = '',
  onVillageChange,
  isManualVillage = false,
  onManualVillageToggle,
  manualVillageName = '',
  onManualVillageNameChange,
  errors = {},
  disabled = false,
}) {
  const { t, i18n } = useTranslation();
  // Master villages from database
  const [dbVillages, setDbVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Modal selector state
  // pickerType: 'state' | 'district' | 'taluka' | 'village' | null
  const [activePicker, setActivePicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch villages from Supabase
  const loadVillagesFromDB = async () => {
    setLoadingVillages(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('villages')
        .select('id, name, taluka, district, state, gram_panchayat')
        .order('name', { ascending: true });

      if (error) throw error;
      setDbVillages(data || []);
    } catch (err) {
      console.warn('CascadingLocationPicker DB load error:', err);
      setFetchError(err.message || 'गाव माहिती लोड करताना त्रुटी आली.');
    } finally {
      setLoadingVillages(false);
    }
  };

  useEffect(() => {
    loadVillagesFromDB();
  }, []);

  // Compute available options
  const stateOptions = useMemo(() => getStates(dbVillages), [dbVillages]);

  const districtOptions = useMemo(
    () => getDistrictsForState(selectedState, dbVillages),
    [selectedState, dbVillages]
  );

  const talukaOptions = useMemo(
    () => getTalukasForDistrict(selectedState, selectedDistrict, dbVillages),
    [selectedState, selectedDistrict, dbVillages]
  );

  const villageOptions = useMemo(
    () => getVillagesForTaluka(selectedState, selectedDistrict, selectedTaluka, dbVillages),
    [selectedState, selectedDistrict, selectedTaluka, dbVillages]
  );

  // Parent change handlers with strict cascading reset
  const handleSelectState = (stateId) => {
    onStateChange(stateId);
    onDistrictChange('');
    onTalukaChange('');
    onVillageChange(null);
    if (onManualVillageToggle) onManualVillageToggle(false);
    if (onManualVillageNameChange) onManualVillageNameChange('');
    setActivePicker(null);
  };

  const handleSelectDistrict = (districtId) => {
    onDistrictChange(districtId);
    onTalukaChange('');
    onVillageChange(null);
    if (onManualVillageToggle) onManualVillageToggle(false);
    if (onManualVillageNameChange) onManualVillageNameChange('');
    setActivePicker(null);
  };

  const handleSelectTaluka = (talukaId) => {
    onTalukaChange(talukaId);
    onVillageChange(null);
    if (onManualVillageToggle) onManualVillageToggle(false);
    if (onManualVillageNameChange) onManualVillageNameChange('');
    setActivePicker(null);
  };

  const handleSelectVillage = (village) => {
    onVillageChange(village);
    if (onManualVillageToggle) onManualVillageToggle(false);
    if (onManualVillageNameChange) onManualVillageNameChange('');
    setActivePicker(null);
  };

  const handleChooseManualVillage = () => {
    onVillageChange(null);
    if (onManualVillageToggle) onManualVillageToggle(true);
    setActivePicker(null);
  };

  // Prepare items for active modal
  const currentModalData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (activePicker === 'state') {
      return stateOptions
        .filter((item) => !q || item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
        .map((s) => ({ id: s.id, title: s.label, isSelected: selectedState === s.id }));
    }

    if (activePicker === 'district') {
      return districtOptions
        .filter((item) => !q || item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
        .map((d) => ({ id: d.id, title: d.label, isSelected: selectedDistrict === d.id }));
    }

    if (activePicker === 'taluka') {
      return talukaOptions
        .filter((item) => !q || item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
        .map((t) => ({ id: t.id, title: t.label, isSelected: selectedTaluka === t.id }));
    }

    if (activePicker === 'village') {
      const filtered = villageOptions
        .filter((item) => !q || item.name.toLowerCase().includes(q))
        .map((v) => ({
          id: v.id,
          title: v.name,
          subtitle: `${v.taluka || ''}${v.taluka && v.district ? ', ' : ''}${v.district || ''}`,
          raw: v,
          isSelected: !isManualVillage && selectedVillageId === v.id,
        }));

      // Add manual entry option at the bottom
      filtered.push({
        id: '__MANUAL_ENTRY__',
        title: 'गाव सापडले नाही? (Village not found?)',
        subtitle: i18n.language === 'en' ? 'Enter village name manually' : 'तुमच्या गावाचे नाव स्वतः प्रविष्ट करा',
        isSpecial: true,
        isSelected: isManualVillage,
      });

      return filtered;
    }

    return [];
  }, [
    activePicker,
    searchQuery,
    stateOptions,
    districtOptions,
    talukaOptions,
    villageOptions,
    selectedState,
    selectedDistrict,
    selectedTaluka,
    selectedVillageId,
    isManualVillage,
  ]);

  const getPickerTitle = () => {
    switch (activePicker) {
      case 'state':
        return t('select_state');
      case 'district':
        return t('select_district');
      case 'taluka':
        return t('select_taluka');
      case 'village':
        return t('select_village');
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. STATE SELECTOR */}
      <View style={styles.fieldGroup}>
        <AppText variant="label" style={styles.fieldLabel}>
          {t('label_state')}
        </AppText>
        <TouchableOpacity
          style={[styles.selectorBtn, errors.state && styles.selectorBtnError, disabled && styles.selectorDisabled]}
          disabled={disabled}
          onPress={() => {
            setSearchQuery('');
            setActivePicker('state');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="map-outline" size={19} color={colors.primary} />
            <AppText
              variant="bodyMedium"
              style={[styles.selectorText, !selectedState && styles.placeholderText]}
            >
              {selectedState || t('select_state')}
            </AppText>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        {errors.state && <AppText variant="bodySmall" style={styles.errorText}>{errors.state}</AppText>}
      </View>

      {/* 2. DISTRICT SELECTOR */}
      <View style={styles.fieldGroup}>
        <AppText variant="label" style={styles.fieldLabel}>
          {t('label_district')}
        </AppText>
        <TouchableOpacity
          style={[
            styles.selectorBtn,
            errors.district && styles.selectorBtnError,
            (!selectedState || disabled) && styles.selectorDisabled,
          ]}
          disabled={!selectedState || disabled}
          onPress={() => {
            setSearchQuery('');
            setActivePicker('district');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="location-outline" size={19} color={selectedState ? colors.primary : colors.secondaryText} />
            <AppText
              variant="bodyMedium"
              style={[styles.selectorText, !selectedDistrict && styles.placeholderText]}
            >
              {!selectedState
                ? t('select_state_first')
                : selectedDistrict || t('select_district')}
            </AppText>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        {errors.district && <AppText variant="bodySmall" style={styles.errorText}>{errors.district}</AppText>}
      </View>

      {/* 3. TALUKA SELECTOR */}
      <View style={styles.fieldGroup}>
        <AppText variant="label" style={styles.fieldLabel}>
          {t('label_taluka')}
        </AppText>
        <TouchableOpacity
          style={[
            styles.selectorBtn,
            errors.taluka && styles.selectorBtnError,
            (!selectedDistrict || disabled) && styles.selectorDisabled,
          ]}
          disabled={!selectedDistrict || disabled}
          onPress={() => {
            setSearchQuery('');
            setActivePicker('taluka');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="navigate-outline" size={19} color={selectedDistrict ? colors.primary : colors.secondaryText} />
            <AppText
              variant="bodyMedium"
              style={[styles.selectorText, !selectedTaluka && styles.placeholderText]}
            >
              {!selectedDistrict
                ? t('select_district_first')
                : selectedTaluka || t('select_taluka')}
            </AppText>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        {errors.taluka && <AppText variant="bodySmall" style={styles.errorText}>{errors.taluka}</AppText>}
      </View>

      {/* 4. VILLAGE SELECTOR */}
      <View style={styles.fieldGroup}>
        <AppText variant="label" style={styles.fieldLabel}>
          {t('label_village_name')}
        </AppText>
        <TouchableOpacity
          style={[
            styles.selectorBtn,
            errors.village && styles.selectorBtnError,
            (!selectedTaluka || disabled) && styles.selectorDisabled,
          ]}
          disabled={!selectedTaluka || disabled}
          onPress={() => {
            setSearchQuery('');
            setActivePicker('village');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.selectorLeft}>
            <Ionicons name="business-outline" size={19} color={selectedTaluka ? colors.primary : colors.secondaryText} />
            <AppText
              variant="bodyMedium"
              style={[
                styles.selectorText,
                !selectedVillageName && !isManualVillage && styles.placeholderText,
              ]}
            >
              {!selectedTaluka
                ? t('select_taluka_first')
                : isManualVillage
                ? (manualVillageName || t('new_village_status_tag'))
                : selectedVillageName || t('select_village')}
            </AppText>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        {errors.village && <AppText variant="bodySmall" style={styles.errorText}>{errors.village}</AppText>}
      </View>

      {/* 5. MANUAL VILLAGE ENTRY INPUT (Visible when "गाव सापडले नाही?" is chosen) */}
      {isManualVillage && (
        <View style={styles.manualEntryBox}>
          <View style={styles.manualEntryHeader}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <AppText variant="label" style={{ color: colors.primary, fontWeight: '700', flex: 1 }}>
              {t('new_village_request')}
            </AppText>
          </View>

          <AppInput
            label={t('new_village_name_label')}
            placeholder={t('new_village_name_placeholder')}
            value={manualVillageName}
            onChangeText={(text) => {
              if (onManualVillageNameChange) onManualVillageNameChange(text);
            }}
            error={errors.manualVillage}
          />

          <AppText variant="bodySmall" style={styles.manualHintText}>
            {t('manual_village_hint')}
          </AppText>
        </View>
      )}

      {/* SEARCHABLE SELECTION MODAL */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="headingSmall" style={styles.modalTitle}>
                  {getPickerTitle()}
                </AppText>
                <AppText variant="bodySmall" style={{ color: colors.secondaryText, marginTop: 2 }}>
                  {activePicker === 'village'
                    ? (i18n.language === 'en' ? `Villages in ${selectedTaluka || ''} Taluka` : `${selectedTaluka || ''} तालुक्यातील गावे`)
                    : activePicker === 'taluka'
                    ? (i18n.language === 'en' ? `Talukas in ${selectedDistrict || ''} District` : `${selectedDistrict || ''} जिल्ह्यातील तालुके`)
                    : activePicker === 'district'
                    ? (i18n.language === 'en' ? `Districts in ${selectedState || ''} State` : `${selectedState || ''} राज्यातील जिल्हे`)
                    : (i18n.language === 'en' ? 'Available States' : 'उपलब्ध राज्ये')}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setActivePicker(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.secondaryText} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_placeholder_generic')}
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

            {/* Options List */}
            {loadingVillages && activePicker === 'village' ? (
              <View style={styles.modalCenter}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText variant="bodyMedium" style={{ marginTop: spacing.md, color: colors.secondaryText }}>
                  गावांची यादी लोड होत आहे...
                </AppText>
              </View>
            ) : currentModalData.length === 0 ? (
              <View style={styles.modalCenter}>
                <Ionicons name="search-outline" size={44} color={colors.secondaryText} />
                <AppText variant="bodyMedium" style={{ color: colors.secondaryText, marginTop: spacing.sm, textAlign: 'center' }}>
                  {t('no_matching_options')}
                </AppText>
              </View>
            ) : (
              <FlatList
                data={currentModalData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSpecial = item.isSpecial;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        item.isSelected && styles.listItemSelected,
                        isSpecial && styles.specialListItem,
                      ]}
                      onPress={() => {
                        if (isSpecial) {
                          handleChooseManualVillage();
                        } else if (activePicker === 'state') {
                          handleSelectState(item.id);
                        } else if (activePicker === 'district') {
                          handleSelectDistrict(item.id);
                        } else if (activePicker === 'taluka') {
                          handleSelectTaluka(item.id);
                        } else if (activePicker === 'village') {
                          handleSelectVillage(item.raw);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText
                          variant="headingSmall"
                          style={[
                            styles.listItemTitle,
                            isSpecial && { color: colors.primary, fontWeight: '700' },
                            item.isSelected && { color: colors.primary },
                          ]}
                        >
                          {isSpecial ? `➕ ${item.title}` : item.title}
                        </AppText>
                        {item.subtitle ? (
                          <AppText variant="bodySmall" style={styles.listItemSubtitle}>
                            {item.subtitle}
                          </AppText>
                        ) : null}
                      </View>

                      {item.isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      ) : isSpecial ? (
                        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 50,
  },
  selectorBtnError: {
    borderColor: colors.error,
  },
  selectorDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.65,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  selectorText: {
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  placeholderText: {
    color: colors.secondaryText,
    fontWeight: '400',
  },
  errorText: {
    color: colors.error,
    marginTop: 4,
  },
  manualEntryBox: {
    backgroundColor: '#F3F9F4',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  manualEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  manualHintText: {
    color: colors.secondaryText,
    fontSize: 12,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemSelected: {
    backgroundColor: '#E8F5E9',
  },
  specialListItem: {
    backgroundColor: '#F1F8F2',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.4)',
    marginTop: spacing.md,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
});

