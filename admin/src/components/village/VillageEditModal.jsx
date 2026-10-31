import React, { useState } from 'react';
import {
  X,
  Building2,
  Users,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';

export default function VillageEditModal({ isOpen, onClose, village, onSaveSuccess }) {
  if (!isOpen) return null;
  return <VillageEditModalDialog onClose={onClose} village={village} onSaveSuccess={onSaveSuccess} />;
}

function VillageEditModalDialog({ onClose, village, onSaveSuccess }) {
  const { language, t } = useSettings();

  const [formData, setFormData] = useState(() => ({
    name: village?.name || 'शिवाजीनगर',
    gram_panchayat: village?.gram_panchayat || village?.gramPanchayat || 'शिवाजीनगर ग्रामपंचायत',
    taluka: village?.taluka || 'हवेली',
    district: village?.district || 'पुणे',
    state: village?.state || 'महाराष्ट्र',
    population: village?.population || '५,२००',
    families: village?.families || '१,१००',
    houses: village?.houses || village?.totalHouses || '९५०',
    area: village?.area || '१२ चौरस किमी',
    office_name: village?.office_name || village?.officeName || 'ग्रामपंचायत कार्यालय, शिवाजीनगर',
    timings: village?.timings || 'सकाळी १०:०० ते संध्याकाळी ५:००',
    weekly_off: village?.weekly_off || village?.weeklyOff || 'रविवार',
  }));

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedRecord = {
        name: formData.name.trim(),
        gram_panchayat: formData.gram_panchayat.trim(),
        taluka: formData.taluka.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        population: formData.population.trim(),
        families: formData.families.trim(),
        houses: formData.houses.trim(),
        area: formData.area.trim(),
        office_name: formData.office_name.trim(),
        timings: formData.timings.trim(),
        weekly_off: formData.weekly_off.trim(),
        updated_at: new Date().toISOString(),
      };

      const isUuid = village?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(village.id);
      let savedVillage = null;

      if (isUuid) {
        const { data, error } = await supabase
          .from('villages')
          .update(updatedRecord)
          .eq('id', village.id)
          .select()
          .single();

        if (error) throw error;
        savedVillage = data;
      } else {
        // Check if there is an existing village record in DB first
        const { data: existingVillage } = await supabase
          .from('villages')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (existingVillage) {
          const { data, error } = await supabase
            .from('villages')
            .update(updatedRecord)
            .eq('id', existingVillage.id)
            .select()
            .single();

          if (error) throw error;
          savedVillage = data;
        } else {
          // Insert new village into database
          const { data, error } = await supabase
            .from('villages')
            .insert(updatedRecord)
            .select()
            .single();

          if (error) throw error;
          savedVillage = data;
        }
      }

      setSuccessMsg(t('village_saved_success'));
      if (onSaveSuccess && savedVillage) {
        onSaveSuccess(savedVillage);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving village info to database:', err);
      setErrorMsg(err.message || (language === 'en' ? 'Failed to save village information.' : 'गाव माहिती जतन करताना त्रुटी आली.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-pale)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {t('village_form_title')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', margin: '2px 0 0 0' }}>
                {t('village_form_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--color-secondary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Feedback Notifications */}
            {successMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-success-pale)',
                  color: 'var(--color-success-text)',
                  border: '1px solid rgba(56, 142, 60, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-error-pale)',
                  color: 'var(--color-error-text)',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Basic Village Info */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '0.5rem',
                }}
              >
                <MapPin size={16} />
                <span>{t('basic_info_section')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('village_name_label')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. Shivajinagar' : 'उदा. शिवाजीनगर'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('gram_panchayat_label')} *
                  </label>
                  <input
                    type="text"
                    name="gram_panchayat"
                    value={formData.gram_panchayat}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. Shivajinagar Gram Panchayat' : 'उदा. शिवाजीनगर ग्रामपंचायत'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('taluka_label')} *
                  </label>
                  <input
                    type="text"
                    name="taluka"
                    value={formData.taluka}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. Haveli' : 'उदा. हवेली'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('district_label')} *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. Pune' : 'उदा. पुणे'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 1' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('state_label')} *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. Maharashtra' : 'उदा. महाराष्ट्र'}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Demographics & Statistics */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '0.5rem',
                }}
              >
                <Users size={16} />
                <span>{t('demographics_section')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('population_label')} *
                  </label>
                  <input
                    type="text"
                    name="population"
                    value={formData.population}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. 5200' : 'उदा. ५,२००'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('families_label')} *
                  </label>
                  <input
                    type="text"
                    name="families"
                    value={formData.families}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. 1100' : 'उदा. १,१००'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('houses_label')} *
                  </label>
                  <input
                    type="text"
                    name="houses"
                    value={formData.houses}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. 950' : 'उदा. ९५०'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('area_label')} *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    placeholder={language === 'en' ? 'e.g. 12 sq km' : 'उदा. १२ चौरस किमी'}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Gram Panchayat Office Details */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '0.5rem',
                }}
              >
                <Building2 size={16} />
                <span>{t('office_section')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('office_name_label')}
                  </label>
                  <input
                    type="text"
                    name="office_name"
                    value={formData.office_name}
                    onChange={handleChange}
                    placeholder={language === 'en' ? 'e.g. Gram Panchayat Office, Shivajinagar' : 'उदा. ग्रामपंचायत कार्यालय, शिवाजीनगर'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('timings_label')}
                  </label>
                  <input
                    type="text"
                    name="timings"
                    value={formData.timings}
                    onChange={handleChange}
                    placeholder={language === 'en' ? 'e.g. 10:00 AM to 5:00 PM' : 'उदा. सकाळी १०:०० ते संध्याकाळी ५:००'}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('weekly_off_label')}
                  </label>
                  <input
                    type="text"
                    name="weekly_off"
                    value={formData.weekly_off}
                    onChange={handleChange}
                    placeholder={language === 'en' ? 'e.g. Sunday' : 'उदा. रविवार'}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('close')}
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.55rem 1.35rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              <span>{saving ? t('saving') : t('save_village_info')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
