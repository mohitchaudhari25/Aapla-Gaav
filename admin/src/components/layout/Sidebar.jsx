import React from 'react';
import {
  LayoutDashboard,
  MessageSquareText,
  Bell,
  Building2,
  MapPin,
  Users,
  BarChart3
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function Sidebar({ activeTab, onTabChange, isMobileOpen, onCloseMobile }) {
  const { t } = useSettings();

  // Single-language navigation items driven by active language
  const navItems = [
    {
      id: 'dashboard',
      label: t('nav_dashboard'),
      sublabel: t('nav_dashboard_sub'),
      icon: LayoutDashboard,
    },
    {
      id: 'village-info',
      label: t('nav_village_info'),
      sublabel: t('nav_village_info_sub'),
      icon: MapPin,
    },
    {
      id: 'notices',
      label: t('nav_notices'),
      sublabel: t('nav_notices_sub'),
      icon: Bell,
    },
    {
      id: 'complaints',
      label: t('nav_complaints'),
      sublabel: t('nav_complaints_sub'),
      icon: MessageSquareText,
    },
    {
      id: 'projects',
      label: t('nav_projects'),
      sublabel: t('nav_projects_sub'),
      icon: Building2,
    },
    {
      id: 'citizens',
      label: t('nav_citizens'),
      sublabel: t('nav_citizens_sub'),
      icon: Users,
    },
    {
      id: 'reports',
      label: t('nav_reports'),
      sublabel: t('nav_reports_sub'),
      icon: BarChart3,
    },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block',
          }}
        />
      )}

      <aside
        className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '264px',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Brand Header - Official Gram Panchayat E-Governance Aesthetic */}
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem 1.25rem',
            borderBottom: '1px solid var(--color-border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 2px 6px rgba(30, 126, 52, 0.25)',
              flexShrink: 0,
              letterSpacing: '-0.02em',
            }}
          >
            आ
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              {t('brand_name')}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '0.02em', marginTop: '2px' }}>
              {t('ready_dashboard') || 'ग्रामपंचायत प्रशासन'}
            </div>
          </div>
        </div>

        {/* Navigation Items in Single Language */}
        <nav style={{ padding: '1rem 0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem', overflowY: 'auto' }}>
          <div
            style={{
              padding: '0.375rem 0.75rem 0.5rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {t('nav_main_menu') || 'MAIN MENU'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '0.6875rem 0.875rem',
                  borderRadius: '12px',
                  border: '1.5px solid transparent',
                  outline: 'none',
                  backgroundColor: isActive ? 'var(--color-primary-pale)' : 'transparent',
                  color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon
                  size={20}
                  color={isActive ? 'var(--color-primary)' : 'var(--color-secondary-text)'}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text)',
                      lineHeight: 1.25,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.725rem',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-muted-text)',
                      fontWeight: isActive ? 500 : 400,
                      marginTop: '2px',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--color-border-light)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--color-secondary-text)',
              padding: '0 0.25rem',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'inline-block', boxShadow: '0 0 0 2px rgba(30, 126, 52, 0.2)' }} />
            <span>{t('brand_name')} • {t('e_gov_portal')}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
