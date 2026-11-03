import React from 'react';
import {
  LayoutDashboard,
  MessageSquareText,
  Bell,
  Building2,
  MapPin,
  Users,
  BarChart3,
  Award
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function Sidebar({ activeTab, onTabChange, isMobileOpen, onCloseMobile }) {
  const { language, t } = useSettings();

  // Exactly 7 main menu items in this exact order:
  // 1. Dashboard
  // 2. Village Information
  // 3. Notice Management
  // 4. Complaint Management
  // 5. Development Projects
  // 6. Citizen Directory
  // 7. Reports & Analysis
  const navItems = [
    {
      id: 'dashboard',
      label: language === 'en' ? 'Dashboard' : t('nav_dashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'village-info',
      label: language === 'en' ? 'Village Information' : t('nav_village_info'),
      icon: MapPin,
    },
    {
      id: 'notices',
      label: language === 'en' ? 'Notice Management' : t('nav_notices'),
      icon: Bell,
    },
    {
      id: 'complaints',
      label: language === 'en' ? 'Complaint Management' : t('nav_complaints'),
      icon: MessageSquareText,
    },
    {
      id: 'projects',
      label: language === 'en' ? 'Development Projects' : t('nav_projects'),
      icon: Building2,
    },
    {
      id: 'citizens',
      label: language === 'en' ? 'Citizen Directory' : t('nav_citizens'),
      icon: Users,
    },
    {
      id: 'reports',
      label: language === 'en' ? 'Reports & Analysis' : t('nav_reports'),
      icon: BarChart3,
    },
    {
      id: 'schemes',
      label: language === 'en' ? 'Government Schemes' : 'योजना व्यवस्थापन',
      icon: Award,
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
        {/* Brand Header */}
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
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #15803D 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            आ
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: 'var(--color-primary-dark)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {language === 'en' ? 'AaplaGaav' : 'आपलं गाव'}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--color-secondary-text)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                marginTop: '2px',
              }}
            >
              {language === 'en' ? 'Admin Portal' : 'ग्रामपंचायत प्रशासन'}
            </div>
          </div>
        </div>

        {/* Navigation Items - Clean without explanatory text */}
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
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text)',
                    lineHeight: 1.25,
                  }}
                >
                  {item.label}
                </span>
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
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-pale)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
              {language === 'en' ? 'Live System Online' : 'प्रणाली सक्रिय आहे'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
