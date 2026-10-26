import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Mail,
  Bell,
  ChevronDown,
  User,
  Activity,
  RefreshCw,
  LogOut,
  AlertCircle,
  Clock,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function Header({ onOpenMobile }) {
  const { user, role, backendOnline, checkHealth, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, openSettings } = useSettings();

  const [isChecking, setIsChecking] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const headerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
        setIsMailOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefreshHealth = async (e) => {
    e?.stopPropagation?.();
    setIsChecking(true);
    await checkHealth();
    setTimeout(() => setIsChecking(false), 500);
  };

  const displayName = user?.user_metadata?.full_name || user?.name || 'Hizrian';
  const displayRole = role === 'super_admin' ? t('role_super_administrator') : t('role_administrator');
  const displayEmail = user?.email || 'admin@aaplagaav.in';

  // Notifications in single language
  const notifications = [
    {
      id: 1,
      title: t('notif_1_title'),
      desc: t('notif_1_desc'),
      time: t('notif_1_time'),
      unread: true,
    },
    {
      id: 2,
      title: t('notif_2_title'),
      desc: t('notif_2_desc'),
      time: t('notif_2_time'),
      unread: true,
    },
    {
      id: 3,
      title: t('notif_3_title'),
      desc: t('notif_3_desc'),
      time: t('notif_3_time'),
      unread: true,
    },
  ];

  // Messages in single language
  const messages = [
    {
      id: 1,
      sender: t('msg_1_sender'),
      subject: t('msg_1_subject'),
      time: t('msg_1_time'),
    },
    {
      id: 2,
      sender: t('msg_2_sender'),
      subject: t('msg_2_subject'),
      time: t('msg_2_time'),
    },
  ];

  return (
    <header
      ref={headerRef}
      style={{
        height: '64px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 35,
        boxShadow: 'var(--shadow-xs)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Left Area: Mobile Menu + Back Button + Search Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onOpenMobile}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            padding: '7px',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-surface)',
          }}
          className="mobile-menu-btn"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Search Pill Input */}
        <div
          className="header-search-container"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? '#1E293B' : 'var(--color-background)',
            borderRadius: 'var(--radius-full)',
            padding: '0.45rem 1rem 0.45rem 1.125rem',
            width: isSearchFocused ? '280px' : '220px',
            transition: 'all 0.2s ease',
            border: isSearchFocused ? '1px solid var(--color-secondary-text)' : '1px solid var(--color-border)',
            boxShadow: 'none',
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={t('search_placeholder')}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8125rem',
              color: 'var(--color-text)',
              width: '100%',
              paddingRight: '0.5rem',
            }}
          />
          <Search size={15} color="var(--color-muted-text)" style={{ flexShrink: 0 }} />
        </div>
      </div>

      {/* Right Area: Messages, Notifications, Profile Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        {/* Messages / Mail Icon */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsMailOpen(!isMailOpen);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            style={{
              background: isMailOpen ? 'var(--color-surface-hover)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary-text)',
              transition: 'all 0.15s ease',
            }}
            title={t('messages')}
            aria-label={t('messages')}
          >
            <Mail size={17} />
          </button>

          {/* Mail Dropdown */}
          {isMailOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: '-40px',
                width: '300px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.875rem 1rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {t('messages')}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--color-info-pale)',
                    color: 'var(--color-info-text)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                  }}
                >
                  {messages.length} {t('new_badge')}
                </span>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--color-border-light)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        {m.sender}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)' }}>{m.time}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{m.subject}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'var(--color-background)',
                  textAlign: 'center',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}>
                  {t('view_all_messages')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell with Circular Red Badge '3' */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsMailOpen(false);
              setIsProfileOpen(false);
            }}
            style={{
              background: isNotifOpen ? 'var(--color-surface-hover)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary-text)',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
            title={t('notifications')}
            aria-label={t('notifications')}
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '18px',
                height: '18px',
                backgroundColor: 'var(--color-error)',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--color-surface)',
                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.4)',
                lineHeight: 1,
              }}
            >
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: '-30px',
                width: '320px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.875rem 1rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {t('notifications')}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      backgroundColor: 'var(--color-error-pale)',
                      color: 'var(--color-error-text)',
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      fontWeight: 700,
                    }}
                  >
                    3 {t('new_badge')}
                  </span>
                </div>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.7rem',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  onClick={() => setIsNotifOpen(false)}
                >
                  {t('mark_all_read')}
                </button>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--color-border-light)',
                      display: 'flex',
                      gap: '10px',
                      cursor: 'pointer',
                      backgroundColor: n.unread ? 'var(--color-surface-hover)' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = n.unread ? 'var(--color-surface-hover)' : 'transparent')
                    }
                  >
                    <div style={{ marginTop: '2px' }}>
                      <AlertCircle size={16} color="var(--color-warning)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                          marginBottom: '2px',
                        }}
                      >
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', lineHeight: 1.35 }}>
                        {n.desc}
                      </div>
                      <div
                        style={{
                          fontSize: '0.675rem',
                          color: 'var(--color-muted-text)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={11} /> {n.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '0.625rem',
                  backgroundColor: 'var(--color-background)',
                  textAlign: 'center',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsNotifOpen(false)}
                >
                  {t('goto_complaints')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsMailOpen(false);
              setIsNotifOpen(false);
            }}
            style={{
              background: isProfileOpen ? 'var(--color-surface-hover)' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '3px 10px 3px 4px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-xs)',
            }}
            aria-label="User profile menu"
          >
            {/* Circular Profile Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--color-primary)',
                flexShrink: 0,
              }}
            >
              {!avatarError ? (
                <img
                  src="/profile.jpg"
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Display Name */}
            <span
              style={{
                fontSize: '0.84375rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>

            {/* Down Caret */}
            <ChevronDown
              size={13}
              color="var(--color-secondary-text)"
              style={{
                transition: 'transform 0.2s ease',
                transform: isProfileOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          </button>

          {/* Rich Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '280px',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              {/* Profile Card Header */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-background)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--color-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}
                >
                  {!avatarError ? (
                    <img
                      src="/profile.jpg"
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={22} color="var(--color-primary)" />
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      lineHeight: 1.2,
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-secondary-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '2px',
                    }}
                  >
                    {displayEmail}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-primary-pale)',
                      color: 'var(--color-primary)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {displayRole}
                  </div>
                </div>
              </div>

              {/* Quick Mode & Language Switcher Strip directly in Profile Dropdown */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-surface)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                {/* Theme Mode Toggle Button */}
                <button
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={14} color="#FBBF24" />
                      <span>{t('mode_light')}</span>
                    </>
                  ) : (
                    <>
                      <Moon size={14} color="#6366F1" />
                      <span>{t('mode_dark')}</span>
                    </>
                  )}
                </button>

                {/* Single Language Selector Pills (Marathi / English) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-background)',
                    padding: '2px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <button
                    onClick={() => setLanguage('mr')}
                    style={{
                      padding: '3px 8px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: language === 'mr' ? 'var(--color-primary)' : 'transparent',
                      color: language === 'mr' ? '#FFFFFF' : 'var(--color-secondary-text)',
                      fontSize: '0.7rem',
                      fontWeight: language === 'mr' ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    मराठी
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    style={{
                      padding: '3px 8px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: language === 'en' ? 'var(--color-primary)' : 'transparent',
                      color: language === 'en' ? '#FFFFFF' : 'var(--color-secondary-text)',
                      fontSize: '0.7rem',
                      fontWeight: language === 'en' ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Backend API Connection Status Strip */}
              <div
                style={{
                  padding: '0.625rem 1rem',
                  backgroundColor: 'var(--color-surface)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity
                    size={13}
                    color={backendOnline ? '#16A34A' : '#DC2626'}
                    className={backendOnline ? 'animate-pulse' : ''}
                  />
                  <span style={{ color: 'var(--color-secondary-text)', fontWeight: 500 }}>
                    {t('backend_api')}:
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: backendOnline ? '#16A34A' : '#DC2626',
                    }}
                  >
                    {backendOnline ? t('online') : t('offline')}
                  </span>
                </div>
                <button
                  onClick={handleRefreshHealth}
                  disabled={isChecking}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-secondary-text)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={t('check_connection')}
                >
                  <RefreshCw size={12} className={isChecking ? 'spinner' : ''} />
                </button>
              </div>

              {/* Action Links */}
              <div style={{ padding: '0.5rem 0' }}>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    openSettings();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    background: 'none',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <User size={15} color="var(--color-secondary-text)" />
                  <span>{t('my_profile')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    openSettings();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: 'none',
                    background: 'none',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Settings size={15} color="var(--color-secondary-text)" />
                  <span>{t('settings')}</span>
                </button>
              </div>

              {/* Sign Out Button */}
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                }}
              >
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: '1px solid var(--color-error-pale)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-error-pale)',
                    color: 'var(--color-error-text)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <LogOut size={15} />
                  <span>{t('sign_out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
