import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Phone, 
  Eye, 
  X, 
  FileText, 
  ShieldAlert,
  ShieldCheck 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Citizens() {
  const { language, t } = useSettings();
  const [citizens, setCitizens] = useState([]);
  const [villagesMap, setVillagesMap] = useState({});
  const [villagesList, setVillagesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rlsBlocked, setRlsBlocked] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('ALL');

  // Selected Citizen for Details Modal
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [citizenComplaints, setCitizenComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  const fetchCitizensData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRlsBlocked(false);

    try {
      // 1. Fetch villages for name resolution
      const { data: vData } = await supabase
        .from('villages')
        .select('id, name');

      const vMap = {};
      if (vData) {
        setVillagesList(vData);
        vData.forEach((v) => {
          vMap[v.id] = v.name;
        });
      }
      setVillagesMap(vMap);

      // 2. Fetch citizen profiles (safe fields only)
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, village_id, created_at, role')
        .order('created_at', { ascending: false });

      if (pErr) {
        console.warn('RLS or Query constraint on profiles:', pErr);
        if (pErr.code === '42501' || pErr.message?.includes('permission denied') || pErr.message?.includes('violates row-level security')) {
          setRlsBlocked(true);
        } else {
          setError(pErr.message || t('citizens_load_error'));
        }
        setCitizens([]);
      } else if (profiles) {
        // Filter to citizen accounts (exclude other admin profiles or current user)
        const citizenRows = profiles.filter((p) => {
          const r = String(p.role || '').toLowerCase();
          return r !== 'admin' && r !== 'super_admin' && r !== 'administrator';
        });
        setCitizens(citizenRows);
      }
    } catch (err) {
      console.error('Error fetching citizens data:', err);
      setError(err.message || t('citizens_load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCitizensData();
  }, [fetchCitizensData]);

  // Open details modal and fetch any complaints registered by this user
  const handleOpenDetails = async (citizen) => {
    setSelectedCitizen(citizen);
    setLoadingComplaints(true);
    setCitizenComplaints([]);

    try {
      const { data: complaints, error: cErr } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', citizen.id)
        .order('created_at', { ascending: false });

      if (!cErr && complaints) {
        setCitizenComplaints(complaints);
      }
    } catch (err) {
      console.warn('Error loading citizen complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedCitizen(null);
    setCitizenComplaints([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Filter citizens based on search query and village
  const filteredCitizens = citizens.filter((c) => {
    // Village Filter
    if (selectedVillageFilter !== 'ALL' && c.village_id !== selectedVillageFilter) {
      return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = (c.full_name || '').toLowerCase().includes(query);
      const matchPhone = (c.phone_number || '').toLowerCase().includes(query);
      const matchId = (c.id || '').toLowerCase().includes(query);
      return matchName || matchPhone || matchId;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-pale)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                  {t('citizens_title')}
                </h1>
                {!loading && !rlsBlocked && (
                  <Badge variant="success" label={`${t('total')}: ${citizens.length}`} />
                )}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                {t('citizens_sub')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchCitizensData}
            disabled={loading}
          >
            {t('refresh_btn')}
          </Button>
        </div>
      </div>

      {/* RLS Permission Warning Banner if RLS blocks bulk citizen query */}
      {rlsBlocked && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--color-warning)',
            backgroundColor: 'var(--color-surface)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldAlert size={24} color="var(--color-warning-text)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning-text)', margin: 0 }}>
                {language === 'en' ? 'Administrative Security Policy Active' : 'प्रशासकीय सुरक्षा धोरण सक्रिय'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginTop: '4px', lineHeight: 1.5 }}>
                {t('citizens_rls_notice')}
              </p>
              <div style={{ marginTop: '8px', fontSize: '0.8125rem', color: 'var(--color-secondary-text)', lineHeight: 1.4 }}>
                🔒 <strong>{language === 'en' ? 'Privacy Policy:' : 'गोपनीयता धोरण:'}</strong> {language === 'en'
                  ? 'Security constraints protect citizen personal details at database level. Contact the primary administrator for role permissions.'
                  : 'नागरिकांच्या वैयक्तिक डेटाचे संरक्षण करण्यासाठी डेटाबेस स्तरावर सुरक्षा निर्बंध कार्यरत आहेत. प्रशासकीय परवानग्या अद्ययावत करण्यासाठी मुख्य डेटाबेस प्रशासकाशी संपर्क साधा.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert type="error" title={t('data_error_title')}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '260px', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              color="var(--color-muted-text)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder={t('citizens_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Village Filter */}
          {villagesList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} color="var(--color-secondary-text)" />
              <select
                value={selectedVillageFilter}
                onChange={(e) => setSelectedVillageFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="ALL">{t('filter_all_villages')}</option>
                {villagesList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedVillageFilter !== 'ALL') && (
          <Button
            variant="secondary"
            size="sm"
            icon={X}
            onClick={() => {
              setSearchQuery('');
              setSelectedVillageFilter('ALL');
            }}
          >
            {t('clear_filter_btn')}
          </Button>
        )}
      </div>

      {/* Main Content State Handling */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" message={t('loading')} />
        </div>
      ) : citizens.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={Users}
          title={t('citizens_empty_title')}
          description={
            rlsBlocked
              ? (language === 'en' ? 'Citizen profiles are protected under database RLS security policies.' : 'डेटाबेस RLS धोरणामुळे नागरिकांची यादी सुरक्षित ठेवण्यात आली आहे.')
              : t('citizens_empty_desc')
          }
          actionLabel={t('refresh_btn')}
          onAction={fetchCitizensData}
        />
      ) : filteredCitizens.length === 0 ? (
        /* Filter Empty State */
        <EmptyState
          icon={Search}
          title={language === 'en' ? 'No citizens found matching search' : 'शोध परिणामांमध्ये नागरिक आढळले नाहीत'}
          description={language === 'en' ? 'No citizen records match your search or village selection.' : 'आपण दिलेल्या शोध शब्दाशी किंवा निवडलेल्या गावाशी जुळणारे कोणतेही नागरिक आढळले नाहीत.'}
          actionLabel={t('clear_filter_btn')}
          onAction={() => {
            setSearchQuery('');
            setSelectedVillageFilter('ALL');
          }}
        />
      ) : (
        /* Citizens Table */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>{t('citizens_th_name')}</th>
                  <th style={{ width: '20%' }}>{t('citizens_th_mobile')}</th>
                  <th style={{ width: '20%' }}>{t('citizens_th_village')}</th>
                  <th style={{ width: '15%' }}>{t('citizens_th_registered')}</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>{t('citizens_th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitizens.map((c) => {
                  const villageLabel = villagesMap[c.village_id] || (c.village_id ? (language === 'en' ? 'Registered Village' : 'नोंदणीकृत गाव') : (language === 'en' ? 'General' : 'सर्वसाधारण'));
                  const firstChar = c.full_name ? c.full_name.trim().charAt(0) : (language === 'en' ? 'C' : 'ना');

                  return (
                    <tr key={c.id}>
                      {/* Name with Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-pale)',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9375rem',
                              flexShrink: 0,
                            }}
                          >
                            {firstChar}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                              {c.full_name || (language === 'en' ? 'Anonymous Citizen' : 'अनामित नागरिक')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>
                              {language === 'en' ? 'Role:' : 'भूमिका:'} <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{language === 'en' ? 'Citizen' : 'नागरिक'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                          <Phone size={14} color="var(--color-muted-text)" />
                          <span>{c.phone_number || (language === 'en' ? 'Not available' : 'उपलब्ध नाही')}</span>
                        </div>
                      </td>

                      {/* Village */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                          <MapPin size={14} color="var(--color-primary)" />
                          <span>{villageLabel}</span>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>
                          {formatDate(c.created_at)}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetails(c)}
                        >
                          {t('citizens_btn_view')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Citizen Details Modal */}
      {selectedCitizen && (
        <Modal
          isOpen={!!selectedCitizen}
          onClose={handleCloseDetails}
          title={t('citizens_modal_title')}
          maxWidth="600px"
          footer={
            <Button variant="secondary" onClick={handleCloseDetails}>
              {t('close_btn')}
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Citizen Identity Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '1rem',
                backgroundColor: 'var(--color-primary-pale)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                {selectedCitizen.full_name ? selectedCitizen.full_name.trim().charAt(0) : (language === 'en' ? 'C' : 'ना')}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  {selectedCitizen.full_name || (language === 'en' ? 'Anonymous Citizen' : 'अनामित नागरिक')}
                </h3>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <Badge variant="success" label={language === 'en' ? 'Verified Citizen' : 'सत्यापित नागरिक'} />
                </div>
              </div>
            </div>

            {/* Profile Fields Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                  {t('citizens_modal_phone')}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '2px' }}>
                  {selectedCitizen.phone_number || (language === 'en' ? 'Not available' : 'उपलब्ध नाही')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                  {t('citizens_modal_village')}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '2px' }}>
                  {villagesMap[selectedCitizen.village_id] || selectedCitizen.village_id || (language === 'en' ? 'Not specified' : 'माहिती उपलब्ध नाही')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                  {t('citizens_modal_date')}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '2px' }}>
                  {formatDate(selectedCitizen.created_at)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                  {language === 'en' ? 'System Reference ID' : 'प्रणाली संदर्भ आयडी'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '2px', wordBreak: 'break-all' }}>
                  <code>{selectedCitizen.id}</code>
                </div>
              </div>
            </div>

            {/* Associated Complaints by this citizen */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <FileText size={16} color="var(--color-primary)" />
                  {t('citizens_modal_complaints_title')}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                  {t('total')}: {citizenComplaints.length}
                </span>
              </div>

              {loadingComplaints ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <LoadingSpinner size="sm" message={t('loading')} />
                </div>
              ) : citizenComplaints.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', color: 'var(--color-secondary-text)', fontSize: '0.8125rem' }}>
                  {t('citizens_modal_no_complaints')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {citizenComplaints.map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        padding: '0.625rem 0.875rem',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {comp.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)' }}>
                          {formatDate(comp.created_at)} {comp.category && `• ${comp.category}`}
                        </div>
                      </div>
                      <Badge status={comp.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy Compliance Footer Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem',
                backgroundColor: 'var(--color-primary-pale)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--color-primary-dark)',
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>{language === 'en' ? 'Privacy Guarantee:' : 'गोपनीयता हमी:'}</strong> {language === 'en'
                  ? 'Password, authentication tokens, and sensitive credentials are protected and never displayed.'
                  : 'पासवर्ड, ऑथेंटिकेशन टोकन्स व संवेदनशील सुरक्षा माहिती सुरक्षित ठेवण्यात आली आहे आणि येथे प्रदर्शित केली जात नाही.'}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
