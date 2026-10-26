import React, { useState } from 'react';
import { Shield, Lock, Mail, Activity, Info, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

export default function Login() {
  const { login, isLoading, authError, backendOnline, checkHealth } = useAuth();
  const { language, setLanguage, t } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError(t('login_error_empty'));
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message || t('login_failed'));
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
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* Top Language Toggle Switcher */}
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
          maxWidth: '440px',
        }}
      >
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
              marginBottom: '1rem',
            }}
          >
            आ
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {t('login_title')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
            {t('login_subtitle')}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '4px' }}>
            {t('login_desc')}
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t('login_card_title')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '4px' }}>
              {t('login_card_desc')}
            </p>
          </div>

          {(localError || authError) && (
            <Alert type="error" title={t('login_failed')}>
              {localError || authError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
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
                  type="password"
                  required
                  placeholder={t('login_password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  disabled={isLoading}
                />
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
              <div>
                {t('login_security_desc')}
              </div>
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
