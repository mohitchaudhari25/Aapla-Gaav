import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  MessageSquare, 
  Eye,
  Send,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const CATEGORY_MAP = {
  'पाणी': { mr: 'पाणी', en: 'Water' },
  'रस्ता': { mr: 'रस्ता', en: 'Roads' },
  'स्वच्छता': { mr: 'स्वच्छता', en: 'Cleanliness' },
  'आरोग्य': { mr: 'आरोग्य', en: 'Health' },
  'दिवाबत्ती': { mr: 'दिवाबत्ती', en: 'Streetlights' },
  'विद्युत/दिवाबत्ती': { mr: 'विद्युत/दिवाबत्ती', en: 'Streetlights' },
  'गटार': { mr: 'गटार', en: 'Drainage' },
  'सामान्य': { mr: 'सामान्य', en: 'General' },
  'इतर': { mr: 'इतर', en: 'Other' },
};

export default function Complaints({ initialStatusFilter = 'ALL' }) {
  const { language, t } = useSettings();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeStatusFilter, setActiveStatusFilter] = useState(initialStatusFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Update filter when initialStatusFilter changes from navigation
  useEffect(() => {
    if (initialStatusFilter) {
      setActiveStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Selected complaint for modal details & update
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintUpdates, setComplaintUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [newStatus, setNewStatus] = useState('प्राप्त');
  const [updateRemark, setUpdateRemark] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState(null);
  const [updateErrorMsg, setUpdateErrorMsg] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err.message || t('complaints_load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Open inspection modal & fetch complaint updates history
  const handleOpenDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status || 'प्राप्त');
    setUpdateRemark('');
    setUpdateSuccessMsg(null);
    setUpdateErrorMsg(null);
    setLoadingUpdates(true);

    try {
      const { data, error: updateErr } = await supabase
        .from('complaint_updates')
        .select('*')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true });

      if (updateErr) {
        console.warn('Could not fetch complaint updates:', updateErr);
      }
      setComplaintUpdates(data || []);
    } catch (err) {
      console.error('Error loading updates history:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  // Handle status update submission
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdatingStatus(true);
    setUpdateSuccessMsg(null);
    setUpdateErrorMsg(null);

    try {
      // 1. Update the complaint record status in database
      const { error: updateErr } = await supabase
        .from('complaints')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedComplaint.id);

      if (updateErr) throw updateErr;

      // 2. Insert record into complaint_updates audit trail if remarks provided
      if (updateRemark.trim()) {
        const { error: logErr } = await supabase
          .from('complaint_updates')
          .insert({
            complaint_id: selectedComplaint.id,
            new_status: newStatus,
            update_text: updateRemark.trim(),
            created_at: new Date().toISOString(),
          });

        if (logErr) {
          console.warn('Could not log complaint update message:', logErr);
        }
      }

      setUpdateSuccessMsg(t('complaints_update_success'));

      // 3. Update local state
      setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
      setComplaints((prev) =>
        prev.map((c) => (c.id === selectedComplaint.id ? { ...c, status: newStatus } : c))
      );
      setUpdateRemark('');

      // Refresh updates timeline
      const { data: newUpdates } = await supabase
        .from('complaint_updates')
        .select('*')
        .eq('complaint_id', selectedComplaint.id)
        .order('created_at', { ascending: true });
      if (newUpdates) setComplaintUpdates(newUpdates);

    } catch (err) {
      console.error('Error updating status:', err);
      setUpdateErrorMsg(err.message || t('complaints_update_error'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Helper to extract category from description tag e.g. [प्रकार: पाणी]
  const parseCategory = (desc) => {
    if (!desc) return language === 'en' ? 'Other' : 'इतर';
    const match = desc.match(/\[प्रकार:\s*([^\]]+)\]/);
    const raw = match ? match[1].trim() : 'सामान्य';
    const mapped = CATEGORY_MAP[raw];
    if (mapped) return mapped[language] || mapped.mr;
    return raw;
  };

  // Filter complaints based on status and search query
  const filteredComplaints = complaints.filter((comp) => {
    // Status Filter
    if (activeStatusFilter !== 'ALL') {
      if (comp.status !== activeStatusFilter) return false;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = comp.title?.toLowerCase().includes(q);
      const descMatch = comp.description?.toLowerCase().includes(q);
      const idMatch = comp.id?.toLowerCase().includes(q);
      return titleMatch || descMatch || idMatch;
    }

    return true;
  });

  const statusTabs = [
    { id: 'ALL', label: t('complaints_tab_all'), count: complaints.length },
    { id: 'प्राप्त', label: t('complaints_tab_received'), count: complaints.filter(c => c.status === 'प्राप्त' || !c.status).length },
    { id: 'प्रक्रियेत', label: t('complaints_tab_in_progress'), count: complaints.filter(c => c.status === 'प्रक्रियेत').length },
    { id: 'सोडवले', label: t('complaints_tab_resolved'), count: complaints.filter(c => c.status === 'सोडवले').length },
    { id: 'नाकारले', label: t('complaints_tab_rejected'), count: complaints.filter(c => c.status === 'नाकारले').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t('complaints_title')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
              {t('complaints_sub')}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchComplaints}
            icon={RefreshCw}
            disabled={loading}
          >
            {t('refresh_btn')}
          </Button>
        </div>

        {/* Search Bar & Status Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search
              size={18}
              color="var(--color-secondary-text)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder={t('complaints_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {statusTabs.map((tab) => {
              const isSelected = activeStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveStatusFilter(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.4rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: isSelected ? 'transparent' : 'var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-light)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-secondary-text)',
                      fontWeight: 600,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" title={t('data_error_title')}>
          <div>{error}</div>
          <Button variant="outline-primary" size="sm" onClick={fetchComplaints} style={{ marginTop: '0.5rem' }}>
            {t('retry_btn')}
          </Button>
        </Alert>
      )}

      {/* Complaints Table / List */}
      {loading ? (
        <LoadingSpinner message={t('loading')} />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={searchQuery ? (language === 'en' ? 'No matching complaints found' : 'एकही जुळणारी तक्रार सापडली नाही') : t('complaints_empty_title')}
          description={
            searchQuery
              ? (language === 'en' ? `No complaints found matching "${searchQuery}".` : `'${searchQuery}' साठी एकही तक्रार आढळली नाही.`)
              : t('complaints_empty_desc')
          }
          actionLabel={searchQuery ? t('clear_filter_btn') : t('refresh_btn')}
          onAction={searchQuery ? () => setSearchQuery('') : fetchComplaints}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>{language === 'en' ? 'Complaint ID' : 'तक्रार आयडी'}</th>
                  <th>{t('complaints_th_title')}</th>
                  <th style={{ width: '130px' }}>{t('complaints_th_category')}</th>
                  <th style={{ width: '130px' }}>{t('complaints_th_status')}</th>
                  <th style={{ width: '140px' }}>{t('complaints_th_date')}</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>{t('complaints_th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((comp) => {
                  const category = parseCategory(comp.description);
                  return (
                    <tr key={comp.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--color-background)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: 'var(--color-secondary-text)',
                            border: '1px solid var(--color-border)',
                          }}
                          title={comp.id}
                        >
                          {comp.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>
                          {comp.title || (language === 'en' ? 'Untitled' : 'शीर्षक उपलब्ध नाही')}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-secondary-text)',
                            maxWidth: '380px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {comp.description || (language === 'en' ? 'No description' : 'वर्णन उपलब्ध नाही')}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-primary-pale)',
                            color: 'var(--color-primary)',
                            fontWeight: 500,
                          }}
                        >
                          {category}
                        </span>
                      </td>
                      <td>
                        <Badge status={comp.status || 'प्राप्त'} />
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', whiteSpace: 'nowrap' }}>
                        {comp.created_at ? new Date(comp.created_at).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenDetails(comp)}
                          icon={Eye}
                        >
                          {t('complaints_btn_view')}
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

      {/* Complaint Inspection & Status Update Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`${t('complaints_modal_title')}: ${selectedComplaint.title}`}
          maxWidth="680px"
          footer={
            <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>
              {t('close_btn')}
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {updateSuccessMsg && (
              <Alert type="success" title={language === 'en' ? 'Success' : 'यशस्वी'}>
                {updateSuccessMsg}
              </Alert>
            )}

            {updateErrorMsg && (
              <Alert type="error" title={language === 'en' ? 'Error' : 'त्रुटी'}>
                {updateErrorMsg}
              </Alert>
            )}

            {/* Complaint Summary Grid */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid var(--color-border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{t('complaints_modal_id')}</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {selectedComplaint.id}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Current Status:' : 'सध्याची स्थिती:'}</span>
                <div>
                  <Badge status={selectedComplaint.status || 'प्राप्त'} />
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{t('complaints_modal_date')}</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleString(language === 'en' ? 'en-IN' : 'mr-IN') : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Citizen User ID:' : 'नागरिक User ID:'}</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {selectedComplaint.user_id ? selectedComplaint.user_id.substring(0, 16) + '...' : (language === 'en' ? 'Anonymous' : 'अज्ञात')}
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div>
              <label className="form-label">{t('complaints_modal_desc')}:</label>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedComplaint.description || (language === 'en' ? 'No description provided.' : 'कोणतेही वर्णन दिलेले नाही.')}
              </div>
            </div>

            {/* Timeline / Updates History */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                <History size={16} color="var(--color-primary)" />
                <label className="form-label" style={{ marginBottom: 0 }}>
                  {t('complaints_modal_history_title')}:
                </label>
              </div>

              {loadingUpdates ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{t('loading')}</div>
              ) : complaintUpdates.length === 0 ? (
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-border)',
                    fontSize: '0.75rem',
                    color: 'var(--color-secondary-text)',
                  }}
                >
                  {t('complaints_modal_history_empty')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {complaintUpdates.map((up) => (
                    <div
                      key={up.id}
                      style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border-light)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <Badge status={up.new_status || up.status} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)' }}>
                          {up.created_at ? new Date(up.created_at).toLocaleString(language === 'en' ? 'en-IN' : 'mr-IN') : ''}
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-text)' }}>{up.update_text || up.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Form: Update Status */}
            <form
              onSubmit={handleUpdateStatus}
              style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                {t('complaints_modal_update_title')}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" htmlFor="new-status-select" style={{ fontSize: '0.8125rem' }}>
                    {t('complaints_modal_select_status')}
                  </label>
                  <select
                    id="new-status-select"
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={isUpdatingStatus}
                  >
                    <option value="प्राप्त">{t('status_received')}</option>
                    <option value="प्रक्रियेत">{t('status_in_progress')}</option>
                    <option value="सोडवले">{t('status_resolved')}</option>
                    <option value="नाकारले">{t('status_rejected')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                <label className="form-label" htmlFor="update-remark-input" style={{ fontSize: '0.8125rem' }}>
                  {t('complaints_modal_notes')}
                </label>
                <textarea
                  id="update-remark-input"
                  className="form-textarea"
                  rows={2}
                  placeholder={t('complaints_modal_notes_placeholder')}
                  value={updateRemark}
                  onChange={(e) => setUpdateRemark(e.target.value)}
                  disabled={isUpdatingStatus}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingStatus}
                  icon={Send}
                >
                  {isUpdatingStatus ? t('saving_btn') : (language === 'en' ? 'Save Status Update' : 'स्थिती अद्यतनित करा')}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
