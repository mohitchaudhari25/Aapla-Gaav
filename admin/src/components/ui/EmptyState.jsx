import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';
import { useSettings } from '../../context/SettingsContext';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) {
  const { t } = useSettings();
  const displayTitle = title || t('no_data_title');
  const displayDescription = description || t('no_data_desc');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3.5rem 1.5rem',
      textAlign: 'center',
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--color-border)',
      margin: '1rem 0',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary-pale)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)',
        marginBottom: '1rem',
      }}>
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
        {displayTitle}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary-text)', maxWidth: '400px', marginBottom: actionLabel ? '1.5rem' : '0' }}>
        {displayDescription}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline-primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
