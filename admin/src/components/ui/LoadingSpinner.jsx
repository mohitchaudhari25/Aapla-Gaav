import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export default function LoadingSpinner({ size = 'md', message }) {
  const { t } = useSettings();
  const displayMessage = message !== undefined ? message : t('loading');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      gap: '1rem',
      color: 'var(--color-secondary-text)',
    }}>
      <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
      {displayMessage && <div style={{ fontSize: '0.875rem' }}>{displayMessage}</div>}
    </div>
  );
}
