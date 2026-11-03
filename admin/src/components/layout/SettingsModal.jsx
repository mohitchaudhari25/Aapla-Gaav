import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Globe, 
  Check, 
  Shield, 
  CheckCircle2, 
  Info, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  MapPin, 
  Camera, 
  Save,
  Building2,
  Sparkles
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { 
  getStates, 
  getDistrictsForState, 
  getTalukasForDistrict, 
  getVillagesForTaluka 
} from '../../lib/locationData';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const PRESET_ADMIN_AVATARS = [
  { id: 'av1', label: 'Default', url: '/profile.jpg' },
  { id: 'av2', label: 'Male Admin 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  { id: 'av3', label: 'Female Admin 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
  { id: 'av4', label: 'Male Admin 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80' },
  { id: 'av5', label: 'Female Admin 2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80' },
  { id: 'av6', label: 'Formal Officer', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80' },
];

export default function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useSettings();
  if (!isSettingsOpen) return null;
  return <SettingsModalContent onClose={closeSettings} />;
}

function SettingsModalContent({ onClose }) {
  const { 
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    t, 
    settingsActiveTab, 
    setSettingsActiveTab 
  } = useSettings();

  const { 
    user, 
    role, 
    adminProfile, 
    updateAdminProfile, 
    backendVerified 
  } = useAuth();

  // Tab State: 'profile' | 'appearance'
  const activeTab = settingsActiveTab || 'profile';

  // Appearance & Language State
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedLang, setSelectedLang] = useState(language);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState(adminProfile?.full_name || user?.user_metadata?.full_name || 'Mohit Chaudhari');
  const [phoneNumber, setPhoneNumber] = useState(adminProfile?.phone_number || user?.user_metadata?.phone_number || '');
  const [designation, setDesignation] = useState(adminProfile?.designation || user?.user_metadata?.designation || 'प्रशासक');
  const [avatarUrl, setAvatarUrl] = useState(adminProfile?.avatar_url || user?.user_metadata?.avatar_url || '/profile.jpg');
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Location State
  const [selectedState, setSelectedState] = useState(adminProfile?.state || 'Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState(adminProfile?.district || 'लातूर');
  const [selectedTaluka, setSelectedTaluka] = useState(adminProfile?.taluka || 'अहमदपूर');
  const [selectedVillageId, setSelectedVillageId] = useState(adminProfile?.village_id || '');
  const [villageName, setVillageName] = useState(adminProfile?.village_name || 'अहमदपूर');
  const [isManualVillage, setIsManualVillage] = useState(false);

  // DB Villages for dynamic cascading
  const [dbVillages, setDbVillages] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState(null);

  // Sync profile when adminProfile changes
  useEffect(() => {
    if (adminProfile) {
      if (adminProfile.full_name) setFullName(adminProfile.full_name);
      if (adminProfile.phone_number) setPhoneNumber(adminProfile.phone_number);
      if (adminProfile.designation) setDesignation(adminProfile.designation);
      if (adminProfile.avatar_url) setAvatarUrl(adminProfile.avatar_url);
      if (adminProfile.state) setSelectedState(adminProfile.state);
      if (adminProfile.district) setSelectedDistrict(adminProfile.district);
      if (adminProfile.taluka) setSelectedTaluka(adminProfile.taluka);
      if (adminProfile.village_id) setSelectedVillageId(adminProfile.village_id);
      if (adminProfile.village_name) setVillageName(adminProfile.village_name);
    }
  }, [adminProfile]);

  // Load villages from database
  useEffect(() => {
    async function fetchVillages() {
      try {
        const { data, error } = await supabase
          .from('villages')
          .select('id, name, taluka, district, state')
          .order('name', { ascending: true });
        if (!error && data) {
          setDbVillages(data);
        }
      } catch (e) {
        console.warn('SettingsModal village fetch notice:', e);
      }
    }
    fetchVillages();
  }, []);

  // Compute location options
  const stateOptions = getStates(dbVillages, language);
  const districtOptions = getDistrictsForState(selectedState, dbVillages, language);
  const talukaOptions = getTalukasForDistrict(selectedState, selectedDistrict, dbVillages, language);
  const villageOptions = getVillagesForTaluka(selectedState, selectedDistrict, selectedTaluka, dbVillages);

  // Handle Location changes
  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedDistrict('');
    setSelectedTaluka('');
    setSelectedVillageId('');
    setVillageName('');
    setIsManualVillage(false);
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setSelectedTaluka('');
    setSelectedVillageId('');
    setVillageName('');
    setIsManualVillage(false);
  };

  const handleTalukaChange = (e) => {
    setSelectedTaluka(e.target.value);
    setSelectedVillageId('');
    setVillageName('');
    setIsManualVillage(false);
  };

  const handleVillageChange = (e) => {
    const val = e.target.value;
    if (val === '__MANUAL__') {
      setIsManualVillage(true);
      setSelectedVillageId('');
    } else {
      setIsManualVillage(false);
      setSelectedVillageId(val);
      const matched = dbVillages.find((v) => v.id === val);
      if (matched) {
        setVillageName(matched.name);
      }
    }
  };

  // Apply System (Theme / Language) Changes
  const handleApplySystemSettings = () => {
    setTheme(selectedTheme);
    setLanguage(selectedLang);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2000);
  };

  // Save Admin Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!fullName.trim()) {
      setProfileErrorMsg(language === 'en' ? 'Full name is required.' : 'पूर्ण नाव भरणे आवश्यक आहे.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const finalVillageName = isManualVillage 
        ? villageName.trim() 
        : dbVillages.find(v => v.id === selectedVillageId)?.name || villageName.trim() || selectedTaluka;

      await updateAdminProfile({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        designation: designation.trim(),
        avatar_url: avatarUrl,
        village_id: selectedVillageId || null,
        village_name: finalVillageName,
        state: selectedState,
        district: selectedDistrict,
        taluka: selectedTaluka,
      });

      setProfileSuccessMsg(t('profile_saved_toast'));
      setTimeout(() => {
        setProfileSuccessMsg(null);
      }, 3500);
    } catch (err) {
      setProfileErrorMsg(err.message || t('profile_save_err'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const displayRole = role === 'super_admin' ? t('role_super_administrator') : t('role_administrator');
  const displayEmail = user?.email || adminProfile?.email || 'admin@aaplagaav.in';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
          maxWidth: '620px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {activeTab === 'profile' ? t('my_profile') : t('settings')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', margin: '2px 0 0 0' }}>
              {activeTab === 'profile' ? t('profile_edit_desc') : t('settings_desc')}
            </p>
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ============================================================== */}
          {/* TAB 1: ADMIN PROFILE EDITING                                  */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Hero Card with Avatar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                  flexWrap: 'wrap',
                }}
              >
                {/* Avatar with Camera badge */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: 'var(--color-surface)',
                      border: '2.5px solid var(--color-primary)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      onError={(e) => {
                        e.currentTarget.src = '/profile.jpg';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingAvatar(!isChangingAvatar)}
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      border: '2px solid var(--color-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                    title={t('profile_change_avatar')}
                  >
                    <Camera size={12} />
                  </button>
                </div>

                {/* Profile Identity Details */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                      {fullName || 'Mohit Chaudhari'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-primary-pale)',
                        color: 'var(--color-primary)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {displayRole}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-secondary-text)',
                        border: '1px solid var(--color-border)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {designation}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                    {displayEmail}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.725rem' }}>
                    <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      <Shield size={12} />
                      {backendVerified ? t('verified_session') : t('active_session')}
                    </span>
                    {villageName && (
                      <span style={{ color: 'var(--color-secondary-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={12} />
                        {villageName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Selector Dropdown / Row */}
              {isChangingAvatar && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: '10px',
                    border: '1px dashed var(--color-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {t('profile_avatar_select')}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {PRESET_ADMIN_AVATARS.map((av) => (
                      <div
                        key={av.id}
                        onClick={() => {
                          setAvatarUrl(av.url);
                          setIsChangingAvatar(false);
                        }}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: avatarUrl === av.url ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
                          cursor: 'pointer',
                          boxShadow: avatarUrl === av.url ? '0 0 0 2px var(--color-primary-pale)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                        title={av.label}
                      >
                        <img src={av.url} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <input
                      type="url"
                      className="form-input"
                      placeholder={t('profile_avatar_custom_url')}
                      value={customAvatarInput}
                      onChange={(e) => setCustomAvatarInput(e.target.value)}
                      style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAvatarInput.trim()) {
                          setAvatarUrl(customAvatarInput.trim());
                          setCustomAvatarInput('');
                          setIsChangingAvatar(false);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {language === 'en' ? 'Use URL' : 'URL वापरा'}
                    </button>
                  </div>
                </div>
              )}

              {/* Success / Error Alerts */}
              {profileSuccessMsg && (
                <Alert type="success" title={language === 'en' ? 'Success' : 'यशस्वी'}>
                  {profileSuccessMsg}
                </Alert>
              )}
              {profileErrorMsg && (
                <Alert type="error" title={language === 'en' ? 'Error' : 'त्रुटी'}>
                  {profileErrorMsg}
                </Alert>
              )}

              {/* Editable Profile Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Full Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="profile-fullname">
                      {t('profile_fullname')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="profile-fullname"
                        type="text"
                        required
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="profile-desig">
                      {t('profile_designation')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <select
                        id="profile-desig"
                        className="form-select"
                        style={{ paddingLeft: '36px' }}
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      >
                        <option value="ग्रामसेवक">{t('reg_desig_gramsevak')}</option>
                        <option value="सरपंच">{t('reg_desig_sarpanch')}</option>
                        <option value="उपसरपंच">{t('reg_desig_upsarpanch')}</option>
                        <option value="ग्रामविकास अधिकारी (VDO)">{t('reg_desig_vdo')}</option>
                        <option value="ग्रामपंचायत प्रशासक">{t('reg_desig_admin')}</option>
                        <option value="संगणक परिचालक">{t('reg_desig_deo')}</option>
                        <option value="इतर प्रशासकीय अधिकारी">{t('reg_desig_other')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Email (Read Only) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="profile-email">
                      {t('profile_email')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="profile-email"
                        type="email"
                        disabled
                        className="form-input"
                        style={{ paddingLeft: '36px', backgroundColor: 'var(--color-background)', cursor: 'not-allowed' }}
                        value={displayEmail}
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="profile-phone">
                      {t('profile_phone')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="profile-phone"
                        type="tel"
                        maxLength={10}
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        placeholder="९८२३XXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>
                </div>

                {/* Village Jurisdiction Section */}
                <div style={{ marginTop: '0.25rem' }}>
                  <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t('profile_official_jurisdiction')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* State */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="profile-state">
                        {t('reg_state_label')}
                      </label>
                      <select
                        id="profile-state"
                        className="form-select"
                        value={selectedState}
                        onChange={handleStateChange}
                      >
                        {stateOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* District */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="profile-district">
                        {t('reg_district_label')}
                      </label>
                      <select
                        id="profile-district"
                        className="form-select"
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                      >
                        <option value="">{t('reg_select_district')}</option>
                        {districtOptions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                    {/* Taluka */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="profile-taluka">
                        {t('reg_taluka_label')}
                      </label>
                      <select
                        id="profile-taluka"
                        className="form-select"
                        value={selectedTaluka}
                        onChange={handleTalukaChange}
                      >
                        <option value="">{t('reg_select_taluka')}</option>
                        {talukaOptions.map((tk) => (
                          <option key={tk.id} value={tk.id}>
                            {tk.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Village */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="profile-village">
                        {t('reg_village_label')}
                      </label>
                      {!isManualVillage ? (
                        <select
                          id="profile-village"
                          className="form-select"
                          value={selectedVillageId}
                          onChange={handleVillageChange}
                        >
                          <option value="">{villageName ? villageName : t('reg_select_village')}</option>
                          {villageOptions.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                          <option value="__MANUAL__">{language === 'en' ? '+ Enter Village Name' : '+ गावाचे नाव प्रविष्ट करा'}</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={villageName}
                            onChange={(e) => setVillageName(e.target.value)}
                            placeholder={language === 'en' ? 'Village Name' : 'गावाचे नाव'}
                          />
                          <button
                            type="button"
                            onClick={() => setIsManualVillage(false)}
                            style={{
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            {language === 'en' ? 'List' : 'यादी'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingProfile}
                    icon={Save}
                  >
                    {t('profile_save_btn')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: APPEARANCE MODE & SYSTEM LANGUAGE                      */}
          {/* ============================================================== */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Section: Mode (Appearance Theme) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                  }}
                >
                  <Sun size={17} color="var(--color-primary)" />
                  <span>{t('section_mode')}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Light Mode Card */}
                  <div
                    onClick={() => setSelectedTheme('light')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${selectedTheme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: selectedTheme === 'light' ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <Sun size={18} color="#D97706" />
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedTheme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: selectedTheme === 'light' ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedTheme === 'light' && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t('mode_light')}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-secondary-text)', marginTop: '4px', lineHeight: 1.3 }}>
                      {t('mode_light_desc')}
                    </div>
                  </div>

                  {/* Dark Mode Card */}
                  <div
                    onClick={() => setSelectedTheme('dark')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${selectedTheme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: selectedTheme === 'dark' ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#1E293B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <Moon size={18} color="#818CF8" />
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedTheme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: selectedTheme === 'dark' ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedTheme === 'dark' && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t('mode_dark')}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-secondary-text)', marginTop: '4px', lineHeight: 1.3 }}>
                      {t('mode_dark_desc')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Language */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                  }}
                >
                  <Globe size={17} color="var(--color-primary)" />
                  <span>{t('section_language')}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Marathi Language Card */}
                  <div
                    onClick={() => setSelectedLang('mr')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${selectedLang === 'mr' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: selectedLang === 'mr' ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>🇮🇳</span>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedLang === 'mr' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: selectedLang === 'mr' ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedLang === 'mr' && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      मराठी
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-secondary-text)', marginTop: '4px', lineHeight: 1.3 }}>
                      {t('lang_marathi_desc')}
                    </div>
                  </div>

                  {/* English Language Card */}
                  <div
                    onClick={() => setSelectedLang('en')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: `2px solid ${selectedLang === 'en' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: selectedLang === 'en' ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>🌐</span>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${selectedLang === 'en' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: selectedLang === 'en' ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedLang === 'en' && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      English
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--color-secondary-text)', marginTop: '4px', lineHeight: 1.3 }}>
                      {t('lang_english_desc')}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--color-secondary-text)',
                  }}
                >
                  <Info size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>{t('only_one_lang_note')}</span>
                </div>
              </div>

              {/* Apply System Changes Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <Button
                  variant="primary"
                  onClick={handleApplySystemSettings}
                  icon={Check}
                >
                  {t('save_changes')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {showSavedToast ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              {t('preferences_saved')}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>
              AaplaGaav Smart Village Portal
            </span>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
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
        </div>
      </div>
    </div>
  );
}
