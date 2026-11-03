import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Briefcase, 
  MapPin, 
  Activity, 
  Info, 
  Globe, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { 
  getStates, 
  getDistrictsForState, 
  getTalukasForDistrict, 
  getVillagesForTaluka 
} from '../lib/locationData';
import { supabase } from '../lib/supabase';

export default function Login() {
  const { login, registerAdmin, isLoading, authError, backendOnline, checkHealth } = useAuth();
  const { language, setLanguage, t } = useSettings();

  // Active Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDesignation, setRegDesignation] = useState('ग्रामसेवक');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Cascading Location State
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [manualVillageName, setManualVillageName] = useState('');
  const [isManualVillage, setIsManualVillage] = useState(false);

  // DB Villages for dynamic options
  const [dbVillages, setDbVillages] = useState([]);
  const [regErrors, setRegErrors] = useState({});
  const [regSuccessMsg, setRegSuccessMsg] = useState(null);

  // Fetch villages from Supabase to augment location picker
  useEffect(() => {
    async function loadVillages() {
      try {
        const { data, error } = await supabase
          .from('villages')
          .select('id, name, taluka, district, state')
          .order('name', { ascending: true });
        if (!error && data) {
          setDbVillages(data);
        }
      } catch (e) {
        console.warn('Villages fetch notice:', e);
      }
    }
    loadVillages();
  }, []);

  // Compute location dropdown options with language awareness
  const stateOptions = getStates(dbVillages, language);
  const districtOptions = getDistrictsForState(selectedState, dbVillages, language);
  const talukaOptions = getTalukasForDistrict(selectedState, selectedDistrict, dbVillages, language);
  const villageOptions = getVillagesForTaluka(selectedState, selectedDistrict, selectedTaluka, dbVillages);

  // Handle Cascading Changes
  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedDistrict('');
    setSelectedTaluka('');
    setSelectedVillageId('');
    setManualVillageName('');
    setIsManualVillage(false);
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setSelectedTaluka('');
    setSelectedVillageId('');
    setManualVillageName('');
    setIsManualVillage(false);
  };

  const handleTalukaChange = (e) => {
    setSelectedTaluka(e.target.value);
    setSelectedVillageId('');
    setManualVillageName('');
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
        setManualVillageName(matched.name);
      }
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError(t('login_error_empty'));
      return;
    }

    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setLoginError(err.message || t('login_failed'));
    }
  };

  // Submit Admin Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegErrors({});
    setRegSuccessMsg(null);

    const errs = {};
    if (!regFullName.trim()) {
      errs.fullName = t('reg_error_required');
    }
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errs.email = language === 'en' ? 'Please enter a valid email address.' : 'कृपया वैध ईमेल पत्ता टाका.';
    }
    if (!regPhone.trim() || regPhone.trim().replace(/\D/g, '').length < 10) {
      errs.phone = t('reg_error_phone_len');
    }
    if (!regPassword || regPassword.length < 6) {
      errs.password = t('reg_error_pass_min');
    }
    if (regPassword !== regConfirmPassword) {
      errs.confirmPassword = t('reg_error_pass_match');
    }
    if (!selectedDistrict) {
      errs.district = t('reg_error_required');
    }
    if (!selectedTaluka) {
      errs.taluka = t('reg_error_required');
    }
    if (!selectedVillageId && !manualVillageName.trim()) {
      errs.village = t('reg_error_required');
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    try {
      const finalVillageName = isManualVillage
        ? manualVillageName.trim()
        : dbVillages.find((v) => v.id === selectedVillageId)?.name || manualVillageName.trim() || selectedTaluka;

      const res = await registerAdmin({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        designation: regDesignation,
        state: selectedState,
        district: selectedDistrict,
        taluka: selectedTaluka,
        villageId: selectedVillageId || null,
        villageName: finalVillageName,
        avatarUrl: '/profile.jpg',
      });

      if (res.session) {
        // Automatically logged in!
        setRegSuccessMsg(t('reg_success_desc'));
      } else {
        // Confirmation required or ready to login
        setRegSuccessMsg(t('reg_success_desc'));
        setLoginEmail(regEmail);
        setTimeout(() => {
          setActiveTab('login');
        }, 1500);
      }
    } catch (err) {
      setRegErrors({ form: err.message || t('login_failed') });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1rem',
        position: 'relative',
      }}
    >
      {/* Top Header Controls: Single-Language Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--color-surface)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xs)',
          zIndex: 10,
        }}
      >
        <Globe size={14} color="var(--color-secondary-text)" style={{ marginLeft: '4px' }} />
        <button
          type="button"
          onClick={() => setLanguage('mr')}
          style={{
            padding: '3px 9px',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            backgroundColor: language === 'mr' ? 'var(--color-primary)' : 'transparent',
            color: language === 'mr' ? '#FFFFFF' : 'var(--color-secondary-text)',
            fontSize: '0.75rem',
            fontWeight: language === 'mr' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          मराठी
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          style={{
            padding: '3px 9px',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            backgroundColor: language === 'en' ? 'var(--color-primary)' : 'transparent',
            color: language === 'en' ? '#FFFFFF' : 'var(--color-secondary-text)',
            fontSize: '0.75rem',
            fontWeight: language === 'en' ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          English
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: activeTab === 'register' ? '560px' : '440px',
          transition: 'max-width 0.25s ease',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              boxShadow: '0 8px 16px rgba(46, 125, 50, 0.25)',
              marginBottom: '0.75rem',
            }}
          >
            आ
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: 0 }}>
            {t('login_title')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px', marginBottom: 0 }}>
            {t('login_subtitle')}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '4px' }}>
            {t('login_desc')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
          {/* Tab Switcher: Sign In vs Register */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--color-background)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              marginBottom: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'login' ? 'var(--color-surface)' : 'transparent',
                color: activeTab === 'login' ? 'var(--color-primary)' : 'var(--color-secondary-text)',
                fontWeight: activeTab === 'login' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'login' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Shield size={16} />
              <span>{t('login_tab_signin')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegErrors({});
              }}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'register' ? 'var(--color-surface)' : 'transparent',
                color: activeTab === 'register' ? 'var(--color-primary)' : 'var(--color-secondary-text)',
                fontWeight: activeTab === 'register' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'register' ? 'var(--shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <User size={16} />
              <span>{t('login_tab_register')}</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: LOGIN FORM                                             */}
          {/* ============================================================== */}
          {activeTab === 'login' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {t('login_card_title')}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '4px' }}>
                  {t('login_card_desc')}
                </p>
              </div>

              {(loginError || authError) && (
                <Alert type="error" title={t('login_failed')}>
                  {loginError || authError}
                </Alert>
              )}

              {regSuccessMsg && (
                <Alert type="success" title={t('reg_success_title')}>
                  {regSuccessMsg}
                </Alert>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="admin-email">
                    {t('login_email_label')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      color="var(--color-secondary-text)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="admin-email"
                      type="email"
                      required
                      placeholder={t('login_email_placeholder')}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '38px' }}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="admin-password">
                    {t('login_password_label')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      color="var(--color-secondary-text)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      id="admin-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder={t('login_password_placeholder')}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '38px', paddingRight: '38px' }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-secondary-text)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  style={{ width: '100%', marginTop: '0.5rem', height: '42px', fontSize: '0.9375rem' }}
                  icon={Shield}
                >
                  {t('login_btn')}
                </Button>
              </form>

              {/* Toggle to Registration */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>
                  {t('reg_no_account_prompt')}{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegErrors({});
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    marginLeft: '4px',
                  }}
                >
                  {t('login_tab_register')}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: REGISTER FORM                                          */}
          {/* ============================================================== */}
          {activeTab === 'register' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {t('reg_title')}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '4px' }}>
                  {t('reg_subtitle')}
                </p>
              </div>

              {regErrors.form && (
                <Alert type="error" title={t('login_failed')}>
                  {regErrors.form}
                </Alert>
              )}

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. Personal & Admin Info */}
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                    {t('reg_personal_info')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {/* Full Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-name">
                      {t('reg_fullname_label')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        placeholder={t('reg_fullname_placeholder')}
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        disabled={isLoading}
                      />
                    </div>
                    {regErrors.fullName && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.fullName}</span>}
                  </div>

                  {/* Designation */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-designation">
                      {t('reg_designation_label')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <select
                        id="reg-designation"
                        className="form-select"
                        style={{ paddingLeft: '36px' }}
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        disabled={isLoading}
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {/* Email */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-email">
                      {t('reg_email_label')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        placeholder={t('reg_email_placeholder')}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        disabled={isLoading}
                      />
                    </div>
                    {regErrors.email && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.email}</span>}
                  </div>

                  {/* Phone */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-phone">
                      {t('reg_phone_label')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        maxLength={10}
                        placeholder={t('reg_phone_placeholder')}
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        disabled={isLoading}
                      />
                    </div>
                    {regErrors.phone && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.phone}</span>}
                  </div>
                </div>

                {/* 2. Cascading Village Jurisdiction */}
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                    {t('reg_location_info')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {/* State */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-state">
                      {t('reg_state_label')} *
                    </label>
                    <select
                      id="reg-state"
                      className="form-select"
                      value={selectedState}
                      onChange={handleStateChange}
                      disabled={isLoading}
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
                    <label className="form-label" htmlFor="reg-district">
                      {t('reg_district_label')} *
                    </label>
                    <select
                      id="reg-district"
                      className="form-select"
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                      disabled={isLoading || !selectedState}
                    >
                      <option value="">{t('reg_select_district')}</option>
                      {districtOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    {regErrors.district && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.district}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {/* Taluka */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-taluka">
                      {t('reg_taluka_label')} *
                    </label>
                    <select
                      id="reg-taluka"
                      className="form-select"
                      value={selectedTaluka}
                      onChange={handleTalukaChange}
                      disabled={isLoading || !selectedDistrict}
                    >
                      <option value="">{t('reg_select_taluka')}</option>
                      {talukaOptions.map((tk) => (
                        <option key={tk.id} value={tk.id}>
                          {tk.label}
                        </option>
                      ))}
                    </select>
                    {regErrors.taluka && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.taluka}</span>}
                  </div>

                  {/* Village Selection or Custom Village */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-village">
                      {t('reg_village_label')} *
                    </label>
                    {!isManualVillage ? (
                      <select
                        id="reg-village"
                        className="form-select"
                        value={selectedVillageId}
                        onChange={handleVillageChange}
                        disabled={isLoading || !selectedTaluka}
                      >
                        <option value="">{t('reg_select_village')}</option>
                        {villageOptions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                        <option value="__MANUAL__">{language === 'en' ? '+ Enter Village Name Manually' : '+ इतर नवीन गाव प्रविष्ट करा'}</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={language === 'en' ? 'Enter Gram Panchayat name' : 'गावाचे / ग्रामपंचायतीचे नाव टाका'}
                          value={manualVillageName}
                          onChange={(e) => setManualVillageName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setIsManualVillage(false)}
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {language === 'en' ? 'From List' : 'यादीतून निवडा'}
                        </button>
                      </div>
                    )}
                    {regErrors.village && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.village}</span>}
                  </div>
                </div>

                {/* 3. Passwords */}
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                    {t('reg_security_info')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {/* Password */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-pass">
                      {t('reg_password_label')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="reg-pass"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder={t('reg_password_placeholder')}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '36px', paddingRight: '36px' }}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-secondary-text)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {regErrors.password && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.password}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="reg-confirm-pass">
                      {t('reg_confirm_password_label')} *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="var(--color-secondary-text)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="reg-confirm-pass"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder={t('reg_confirm_password_placeholder')}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="form-input"
                        style={{ paddingLeft: '36px' }}
                        disabled={isLoading}
                      />
                    </div>
                    {regErrors.confirmPassword && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{regErrors.confirmPassword}</span>}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  style={{ width: '100%', marginTop: '0.75rem', height: '42px', fontSize: '0.9375rem' }}
                  icon={CheckCircle2}
                >
                  {t('reg_submit_btn')}
                </Button>
              </form>

              {/* Toggle to Sign In */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>
                  {t('reg_already_have_account')}{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    marginLeft: '4px',
                  }}
                >
                  {t('login_tab_signin')}
                </button>
              </div>
            </div>
          )}

          {/* Backend Enforcement Information Notice */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.875rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              gap: '10px',
              fontSize: '0.75rem',
              color: 'var(--color-secondary-text)',
            }}
          >
            <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--color-text)' }}>{t('login_security_title')}</strong>
              <div>{t('login_security_desc')}</div>
            </div>
          </div>
        </div>

        {/* Footer Backend Status Indicator */}
        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--color-secondary-text)',
          }}
        >
          <Activity size={14} color={backendOnline ? 'var(--color-success)' : 'var(--color-error)'} />
          <span>
            {t('login_backend_status')}{' '}
            <strong style={{ color: backendOnline ? 'var(--color-success)' : 'var(--color-error)' }}>
              {backendOnline ? t('login_backend_connected') : t('login_backend_offline')}
            </strong>
          </span>
          <button
            onClick={checkHealth}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.75rem',
            }}
          >
            {t('login_check_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
