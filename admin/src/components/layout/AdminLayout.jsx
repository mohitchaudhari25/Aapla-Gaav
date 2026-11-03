import React, { useState } from 'react';
import { ArrowLeft, Home, ChevronRight, LayoutDashboard } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import SettingsModal from './SettingsModal';
import { useSettings } from '../../context/SettingsContext';

export default function AdminLayout({ activeTab, onTabChange, onBack, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useSettings();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onTabChange('dashboard');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t('page_dashboard');
      case 'village-info': return t('page_village_info');
      case 'notices': return t('page_notices');
      case 'complaints': return t('page_complaints');
      case 'projects': return t('page_projects');
      case 'citizens': return t('page_citizens');
      case 'reports': return t('page_reports');
      default: return t('page_dashboard');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
        transition: 'background-color 0.2s ease, color 0.2s ease',
        overflowX: 'hidden',
      }}
    >
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Header onOpenMobile={() => setMobileMenuOpen(true)} />

        <main style={{ flex: 1, padding: '1.5rem clamp(1rem, 3vw, 2rem)', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {/* Universal Back Navigation Bar - Visible on every non-dashboard page */}
          {activeTab !== 'dashboard' && (
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.625rem 1rem',
                marginBottom: '1.25rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                {/* Prominent Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  id="page-back-button"
                  title={t('back_btn')}
                  aria-label={t('back_btn')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.45rem 0.875rem',
                    backgroundColor: 'var(--color-primary-pale)',
                    color: 'var(--color-primary-dark)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-pale)';
                    e.currentTarget.style.color = 'var(--color-primary-dark)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>{t('back_btn')}</span>
                </button>

                {/* Clickable Breadcrumb Hierarchy */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onTabChange('dashboard')}
                    title={t('back_to_dashboard')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px 4px',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    <Home size={14} />
                    <span>{t('page_dashboard') || 'डॅशबोर्ड'}</span>
                  </button>
                  <ChevronRight size={13} color="var(--color-muted-text)" />
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                    {getPageTitle()}
                  </span>
                </div>
              </div>

              {/* Direct Return to Main Dashboard shortcut */}
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                title={t('main_dashboard_btn')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.875rem',
                  backgroundColor: 'transparent',
                  color: 'var(--color-secondary-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                  e.currentTarget.style.borderColor = 'var(--color-secondary-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-secondary-text)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <LayoutDashboard size={14} />
                <span>{t('main_dashboard_btn')}</span>
              </button>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Profile & System Settings Modal */}
      <SettingsModal />
    </div>
  );
}
