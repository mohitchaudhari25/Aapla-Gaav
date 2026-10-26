import React, { useState } from 'react';
import { X, Sun, Moon, Globe, Check, Shield, CheckCircle2, Info } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

export default function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useSettings();
  if (!isSettingsOpen) return null;
  return <SettingsModalContent onClose={closeSettings} />;
}

function SettingsModalContent({ onClose }) {
  const { theme, setTheme, language, setLanguage, t } = useSettings();
  const { user, role, backendVerified } = useAuth();

  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedLang, setSelectedLang] = useState(language);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleApply = () => {
    setTheme(selectedTheme);
    setLanguage(selectedLang);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 500);
  };

  const displayName = user?.user_metadata?.full_name || user?.name || 'Hizrian';
  const displayRole = role === 'super_admin' ? t('role_super_administrator') : t('role_administrator');
  const displayEmail = user?.email || 'admin@aaplagaav.in';

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
          maxWidth: '540px',
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
              {t('settings_title')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', margin: '2px 0 0 0' }}>
              {t('settings_desc')}
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
          {/* User Profile Overview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '1rem',
              backgroundColor: 'var(--color-background)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-primary)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/profile.jpg"
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {displayName}
                </span>
                <span
                  style={{
                    fontSize: '0.675rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--color-primary-pale)',
                    color: 'var(--color-primary)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                  }}
                >
                  {displayRole}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                {displayEmail}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  fontWeight: 500,
                }}
              >
                <Shield size={12} />
                <span>{backendVerified ? t('verified_session') : t('active_session')}</span>
              </div>
            </div>
          </div>

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

          {/* Section: Language (Take ONLY one language when chosen) */}
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

            {/* Explanatory note confirming single language behavior */}
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
          {showSavedToast && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginRight: 'auto',
              }}
            >
              <CheckCircle2 size={16} />
              {t('preferences_saved')}
            </span>
          )}

          <button
            onClick={onClose}
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
            onClick={handleApply}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Check size={16} />
            <span>{t('save_changes')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
