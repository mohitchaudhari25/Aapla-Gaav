import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Bell, 
  Eye, 
  Edit3, 
  Send, 
  CheckCircle, 
  Archive,
  Info 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Notices() {
  const { villageId } = useAuth();
  const { language, t } = useSettings();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Notice for Inspection Modal
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'published',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setNotices(data || []);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError(err.message || t('notices_load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchNotices();

    const channel = supabase
      .channel('admin-notices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => {
        fetchNotices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotices]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      status: 'published',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      status: notice.status || 'published',
    });
    setFormError(null);
    setIsFormOpen(true);
    if (selectedNotice) setSelectedNotice(null);
  };

  // Submit Notice (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError(language === 'en' ? 'Notice title and content are both required.' : 'कृपया सूचना शीर्षक आणि सविस्तर मजकूर दोन्ही भरा.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingNotice) {
        const payload = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          status: formData.status,
          updated_at: new Date().toISOString(),
        };

        const { error: updateErr } = await supabase
          .from('notices')
          .update(payload)
          .eq('id', editingNotice.id);

        if (updateErr) throw updateErr;

        setActionSuccessMsg(
          language === 'en'
            ? `Notice '${formData.title}' updated successfully!`
            : `सूचना '${formData.title}' यशस्वीरित्या अद्यतनित केली!`
        );
      } else {
        const payload = {
          village_id: villageId || null,
          title: formData.title.trim(),
          content: formData.content.trim(),
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertErr } = await supabase
          .from('notices')
          .insert(payload);

        if (insertErr) throw insertErr;

        // Broadcast notification to relevant citizens when notice is published
        if (formData.status === 'published') {
          try {
            let profQuery = supabase.from('profiles').select('id');
            if (villageId) {
              profQuery = profQuery.eq('village_id', villageId);
            }
            const { data: citizens } = await profQuery;
            if (citizens && citizens.length > 0) {
              const notifs = citizens.map((c) => ({
                user_id: c.id,
                title: 'नवीन सूचना (New Circular)',
                message: formData.title.trim(),
                type: 'notice',
                is_read: false,
                created_at: new Date().toISOString(),
              }));
              await supabase.from('notifications').insert(notifs);
            }
          } catch (notifErr) {
            console.warn('Notice broadcast error:', notifErr);
          }
        }

        setActionSuccessMsg(
          language === 'en'
            ? `New notice '${formData.title}' published successfully!`
            : `नवीन सूचना '${formData.title}' यशस्वीरित्या प्रसिद्ध केली!`
        );
      }

      setIsFormOpen(false);
      await fetchNotices();
    } catch (err) {
      console.error('Error saving notice:', err);
      const isRlsError = err.code === '42501' || err.message?.includes('violates row-level security');
      setFormError(
        isRlsError
          ? (language === 'en' ? 'Database security policy (RLS): You do not have direct permission to save notices.' : 'डेटाबेस सुरक्षा धोरण: आपल्या खात्याला सूचना जोडण्यासाठी किंवा बदलण्यासाठी थेट अनुमती नाही.')
          : (err.message || t('notices_save_error'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Change from Inspection Modal
  const handleQuickStatusChange = async (newStatus) => {
    if (!selectedNotice) return;
    try {
      const { error: updateErr } = await supabase
        .from('notices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedNotice.id);

      if (updateErr) throw updateErr;

      setSelectedNotice((prev) => ({ ...prev, status: newStatus }));
      setNotices((prev) =>
        prev.map((n) => (n.id === selectedNotice.id ? { ...n, status: newStatus } : n))
      );
    } catch (err) {
      console.error('Error changing notice status:', err);
    }
  };

  // Filter notices based on status and search query
  const filteredNotices = notices.filter((notice) => {
    if (activeFilter !== 'ALL') {
      const noticeStatus = notice.status || 'published';
      if (noticeStatus !== activeFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = notice.title?.toLowerCase().includes(q);
      const contentMatch = notice.content?.toLowerCase().includes(q);
      const idMatch = notice.id?.toLowerCase().includes(q);
      return titleMatch || contentMatch || idMatch;
    }

    return true;
  });

  const filterTabs = [
    { id: 'ALL', label: t('notices_tab_all'), count: notices.length },
    { id: 'published', label: t('notices_tab_published'), count: notices.filter(n => n.status === 'published' || !n.status).length },
    { id: 'draft', label: t('notices_tab_draft'), count: notices.filter(n => n.status === 'draft').length },
    { id: 'archived', label: t('notices_tab_archived'), count: notices.filter(n => n.status === 'archived').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t('notices_title')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
              {t('notices_sub')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchNotices}
              icon={RefreshCw}
              disabled={loading}
            >
              {t('refresh_btn')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              icon={Plus}
            >
              {t('notices_btn_new')}
            </Button>
          </div>
        </div>

        {/* Search Bar & Status Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              placeholder={t('notices_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {filterTabs.map((tab) => {
              const isSelected = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
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

      {actionSuccessMsg && (
        <Alert type="success" title={language === 'en' ? 'Success' : 'यशस्वी'}>
          {actionSuccessMsg}
        </Alert>
      )}

      {error && (
        <Alert type="error" title={t('data_error_title')}>
          <div>{error}</div>
          <Button variant="outline-primary" size="sm" onClick={fetchNotices} style={{ marginTop: '0.5rem' }}>
            {t('retry_btn')}
          </Button>
        </Alert>
      )}

      {/* Notices Table or Empty State */}
      {loading ? (
        <LoadingSpinner message={t('loading')} />
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={searchQuery ? (language === 'en' ? 'No matching notices found' : 'एकही जुळणारी सूचना आढळली नाही') : t('notices_empty_title')}
          description={
            searchQuery
              ? (language === 'en' ? `No notices found matching "${searchQuery}".` : `'${searchQuery}' साठी एकही सूचना सापडली नाही.`)
              : t('notices_empty_desc')
          }
          actionLabel={t('notices_btn_new')}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('notices_th_title')}</th>
                  <th>{language === 'en' ? 'Content Preview' : 'मजकूर संक्षिप्त'}</th>
                  <th style={{ width: '130px' }}>{t('notices_th_status')}</th>
                  <th style={{ width: '140px' }}>{t('notices_th_date')}</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>{t('notices_th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>
                        {notice.title || (language === 'en' ? 'Untitled' : 'शीर्षक नाही')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)', fontFamily: 'monospace' }}>
                        ID: {notice.id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--color-secondary-text)',
                          maxWidth: '420px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notice.content || (language === 'en' ? 'No content' : 'कोणताही मजकूर दिलेला नाही.')}
                      </div>
                    </td>
                    <td>
                      <Badge status={notice.status || 'published'} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', whiteSpace: 'nowrap' }}>
                      {notice.created_at ? new Date(notice.created_at).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setSelectedNotice(notice)}
                          icon={Eye}
                        >
                          {t('notices_btn_view')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(notice)}
                          icon={Edit3}
                        >
                          {t('notices_btn_edit')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notice Inspection Modal */}
      {selectedNotice && (
        <Modal
          isOpen={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title={`${language === 'en' ? 'Notice Details' : 'सूचना तपशील'}: ${selectedNotice.title}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedNotice.status !== 'published' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickStatusChange('published')}
                    icon={CheckCircle}
                  >
                    {t('publish_btn')}
                  </Button>
                )}
                {selectedNotice.status !== 'archived' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickStatusChange('archived')}
                    icon={Archive}
                  >
                    {t('status_archived')}
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(selectedNotice)}>
                  {t('edit_btn')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedNotice(null)}>
                  {t('close_btn')}
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Metadata Summary */}
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
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Notice ID:' : 'सूचना आयडी:'}</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {selectedNotice.id}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Current Status:' : 'सध्याची स्थिती:'}</span>
                <div>
                  <Badge status={selectedNotice.status || 'published'} />
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Created Date:' : 'तयार दिनांक:'}</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedNotice.created_at ? new Date(selectedNotice.created_at).toLocaleString(language === 'en' ? 'en-IN' : 'mr-IN') : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Last Updated:' : 'शेवटचा बदल:'}</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedNotice.updated_at ? new Date(selectedNotice.updated_at).toLocaleString(language === 'en' ? 'en-IN' : 'mr-IN') : 'N/A'}
                </div>
              </div>
            </div>

            {/* Content Display */}
            <div>
              <label className="form-label">{language === 'en' ? 'Detailed Content:' : 'सूचनेचा सविस्तर मजकूर:'}</label>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedNotice.content}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Notice Modal */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingNotice ? t('notices_modal_edit') : t('notices_modal_create')}
          maxWidth="640px"
        >
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formError && (
              <Alert type="error" title={language === 'en' ? 'Error' : 'त्रुटी'}>
                {formError}
              </Alert>
            )}

            <div
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--color-secondary-text)',
                display: 'flex',
                gap: '8px',
              }}
            >
              <Info size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {language === 'en'
                  ? 'Notices published here will be instantly available to village citizens on the Aapla Gaav Mobile App.'
                  : 'येथे तयार केलेली सूचना थेट आपलं गाव मोबाईल ॲपवर गावातील नागरिकांना उपलब्ध होईल.'}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="notice-title">
                {t('notices_field_title')}
              </label>
              <input
                id="notice-title"
                type="text"
                required
                className="form-input"
                placeholder={t('notices_field_title_placeholder')}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="notice-status">
                {t('notices_field_status')}
              </label>
              <select
                id="notice-status"
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                disabled={isSubmitting}
              >
                <option value="published">{t('status_published')}</option>
                <option value="draft">{t('status_draft')}</option>
                <option value="archived">{t('status_archived')}</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="notice-content">
                {t('notices_field_content')}
              </label>
              <textarea
                id="notice-content"
                required
                rows={5}
                className="form-textarea"
                placeholder={t('notices_field_content_placeholder')}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <Button
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                {t('cancel_btn')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                icon={Send}
              >
                {editingNotice ? t('save_btn') : t('publish_btn')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
