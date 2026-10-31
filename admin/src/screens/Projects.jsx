import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Building2, 
  Eye, 
  Edit3, 
  Send,
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

const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

export default function Projects() {
  const { villageId } = useAuth();
  const { language, t } = useSettings();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Project for Inspection Modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'चालू',
    budget: '',
    amount_spent: '',
    progress: 0,
    start_date: '',
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message || t('projects_load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('admin-projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProjects]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'चालू',
      budget: '',
      amount_spent: '',
      progress: 0,
      start_date: '',
      end_date: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      status: project.status || 'चालू',
      budget: project.budget != null ? project.budget : '',
      amount_spent: project.amount_spent != null ? project.amount_spent : '',
      progress: project.progress != null ? project.progress : 0,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    });
    setFormError(null);
    setIsFormOpen(true);
    if (selectedProject) setSelectedProject(null);
  };

  // Submit Project (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(language === 'en' ? 'Project name is required.' : 'कृपया विकास कामाचे नाव प्रविष्ट करा.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        budget: formData.budget !== '' ? Number(formData.budget) : null,
        amount_spent: formData.amount_spent !== '' ? Number(formData.amount_spent) : null,
        progress: formData.progress !== '' ? Number(formData.progress) : 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        updated_at: new Date().toISOString(),
      };

      if (editingProject) {
        const { error: updateErr } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', editingProject.id);

        if (updateErr) throw updateErr;

        setActionSuccessMsg(
          language === 'en'
            ? `Project '${formData.name}' updated successfully!`
            : `विकास काम '${formData.name}' यशस्वीरित्या अद्यतनित केले!`
        );
      } else {
        payload.village_id = villageId || null;
        payload.created_at = new Date().toISOString();

        const { error: insertErr } = await supabase
          .from('projects')
          .insert(payload);

        if (insertErr) throw insertErr;

        // Broadcast notification to relevant citizens when new project is added
        try {
          let profQuery = supabase.from('profiles').select('id');
          if (villageId) {
            profQuery = profQuery.eq('village_id', villageId);
          }
          const { data: citizens } = await profQuery;
          if (citizens && citizens.length > 0) {
            const notifs = citizens.map((c) => ({
              user_id: c.id,
              title: 'नवीन विकास काम (New Development Work)',
              message: `गावात नवीन विकास काम सुरू: "${formData.name.trim()}"`,
              type: 'project',
              is_read: false,
              created_at: new Date().toISOString(),
            }));
            await supabase.from('notifications').insert(notifs);
          }
        } catch (notifErr) {
          console.warn('Project broadcast error:', notifErr);
        }

        setActionSuccessMsg(
          language === 'en'
            ? `New project '${formData.name}' added successfully!`
            : `नवीन विकास काम '${formData.name}' यशस्वीरित्या जोडले!`
        );
      }

      setIsFormOpen(false);
      await fetchProjects();
    } catch (err) {
      console.error('Error saving project:', err);
      const isRlsError = err.code === '42501' || err.message?.includes('violates row-level security');
      setFormError(
        isRlsError
          ? (language === 'en' ? 'Database security policy (RLS): You do not have direct permission to save projects.' : 'डेटाबेस सुरक्षा धोरण: आपल्या खात्याला विकास कामे जोडण्यासाठी किंवा संपादित करण्यासाठी थेट अनुमती नाही.')
          : (err.message || t('projects_save_error'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter projects based on status and search query
  const filteredProjects = projects.filter((project) => {
    if (activeFilter !== 'ALL') {
      if (project.status !== activeFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = project.name?.toLowerCase().includes(q);
      const descMatch = project.description?.toLowerCase().includes(q);
      const idMatch = project.id?.toLowerCase().includes(q);
      return nameMatch || descMatch || idMatch;
    }

    return true;
  });

  const filterTabs = [
    { id: 'ALL', label: t('projects_tab_all'), count: projects.length },
    { id: 'चालू', label: t('projects_tab_ongoing'), count: projects.filter(p => p.status === 'चालू').length },
    { id: 'पूर्ण', label: t('projects_tab_completed'), count: projects.filter(p => p.status === 'पूर्ण').length },
    { id: 'नियोजित', label: t('projects_tab_planned'), count: projects.filter(p => p.status === 'नियोजित').length },
  ];

  // Financial aggregates
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (Number(p.amount_spent) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t('projects_title')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
              {t('projects_sub')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchProjects}
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
              {t('projects_btn_new')}
            </Button>
          </div>
        </div>

        {/* Summary Metric Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{t('projects_metric_total')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{projects.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{t('projects_metric_budget')}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(totalBudget)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{t('projects_metric_spent')}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-error)' }}>{formatCurrency(totalSpent)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Balance Funds' : 'शिल्लक निधी'}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-info)' }}>{formatCurrency(totalBudget - totalSpent)}</div>
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
              placeholder={t('projects_search_placeholder')}
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
          <Button variant="outline-primary" size="sm" onClick={fetchProjects} style={{ marginTop: '0.5rem' }}>
            {t('retry_btn')}
          </Button>
        </Alert>
      )}

      {/* Projects List or Empty State */}
      {loading ? (
        <LoadingSpinner message={t('loading')} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? (language === 'en' ? 'No matching projects found' : 'एकही जुळणारे विकास काम आढळले नाही') : t('projects_empty_title')}
          description={
            searchQuery
              ? (language === 'en' ? `No projects found matching "${searchQuery}".` : `'${searchQuery}' साठी एकही विकास काम सापडले नाही.`)
              : t('projects_empty_desc')
          }
          actionLabel={t('projects_btn_new')}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('projects_th_name')}</th>
                  <th style={{ width: '130px' }}>{t('projects_th_status')}</th>
                  <th style={{ width: '160px' }}>{t('projects_th_progress')}</th>
                  <th style={{ width: '150px' }}>{t('projects_th_budget')}</th>
                  <th style={{ width: '140px' }}>{t('projects_th_spent')}</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>{t('projects_th_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>
                        {project.name || (language === 'en' ? 'Untitled Project' : 'नाव उपलब्ध नाही')}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-secondary-text)',
                          maxWidth: '340px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {project.description || (language === 'en' ? 'No description.' : 'वर्णन उपलब्ध नाही.')}
                      </div>
                    </td>
                    <td>
                      <Badge status={project.status || 'चालू'} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: 'var(--color-border)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(Math.max(project.progress || 0, 0), 100)}%`,
                              height: '100%',
                              backgroundColor: project.status === 'पूर्ण' ? 'var(--color-primary)' : 'var(--color-info)',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', minWidth: '32px' }}>
                          {project.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {formatCurrency(project.budget)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}>
                      {formatCurrency(project.amount_spent)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                          icon={Eye}
                        >
                          {language === 'en' ? 'View' : 'पहा'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(project)}
                          icon={Edit3}
                        >
                          {t('edit_btn')}
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

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={`${language === 'en' ? 'Development Project Details' : 'विकास काम तपशील'}: ${selectedProject.name}`}
          maxWidth="680px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="outline-primary" size="sm" onClick={() => handleOpenEdit(selectedProject)}>
                {t('edit_btn')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedProject(null)}>
                {t('close_btn')}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Summary Grid */}
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
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Project ID:' : 'प्रकल्प आयडी:'}</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {selectedProject.id}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Current Status:' : 'सध्याची स्थिती:'}</span>
                <div>
                  <Badge status={selectedProject.status || 'चालू'} />
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Start Date:' : 'सुरुवात दिनांक:'}</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN') : (language === 'en' ? 'Not set' : 'उपलब्ध नाही')}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Expected Completion:' : 'अपेक्षित पूर्णत्व:'}</span>
                <div style={{ fontWeight: 600 }}>
                  {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN') : (language === 'en' ? 'Not set' : 'उपलब्ध नाही')}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="form-label">{language === 'en' ? 'Detailed Description:' : 'कामाचे सविस्तर वर्णन:'}</label>
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                }}
              >
                {selectedProject.description || (language === 'en' ? 'No description provided.' : 'कोणतेही वर्णन दिलेले नाही.')}
              </div>
            </div>

            {/* Financial Details Card */}
            <div>
              <label className="form-label">{language === 'en' ? 'Financial Breakdown:' : 'आर्थिक माहिती व निधी हिशोब:'}</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{t('projects_th_budget')}</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
                    {formatCurrency(selectedProject.budget)}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{t('projects_th_spent')}</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>
                    {formatCurrency(selectedProject.amount_spent)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Remaining Funds' : 'शिल्लक निधी'}</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-info)', marginTop: '4px' }}>
                    {formatCurrency((selectedProject.budget || 0) - (selectedProject.amount_spent || 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>{language === 'en' ? 'Project Progress:' : 'कामाची प्रगती:'}</label>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selectedProject.progress || 0}% {language === 'en' ? 'Completed' : 'पूर्ण'}</span>
              </div>
              <div style={{ height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(Math.max(selectedProject.progress || 0, 0), 100)}%`,
                    height: '100%',
                    backgroundColor: selectedProject.status === 'पूर्ण' ? 'var(--color-primary)' : 'var(--color-info)',
                    borderRadius: '999px',
                  }}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Project Modal Form */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingProject ? t('projects_modal_edit') : t('projects_modal_create')}
          maxWidth="680px"
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
                  ? 'Information recorded here will be directly visible to village citizens on the Aapla Gaav Mobile App.'
                  : 'येथे नोंदवलेली विकास कामांची माहिती थेट आपलं गाव मोबाईल ॲपवर गावातील नागरिकांना पाहण्यासाठी उपलब्ध होईल.'}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="project-name">
                {t('projects_field_name')}
              </label>
              <input
                id="project-name"
                type="text"
                required
                className="form-input"
                placeholder={t('projects_field_name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="project-description">
                {t('projects_field_desc')}
              </label>
              <textarea
                id="project-description"
                rows={3}
                className="form-textarea"
                placeholder={t('projects_field_desc_placeholder')}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="project-status">
                  {t('projects_field_status')}
                </label>
                <select
                  id="project-status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  disabled={isSubmitting}
                >
                  <option value="चालू">{t('status_ongoing')}</option>
                  <option value="पूर्ण">{t('status_completed')}</option>
                  <option value="नियोजित">{t('status_planned')}</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="project-progress">
                  {t('projects_field_progress')}
                </label>
                <input
                  id="project-progress"
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  placeholder="0"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="project-budget">
                  {t('projects_field_budget')}
                </label>
                <input
                  id="project-budget"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="उदा. 1000000"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="project-spent">
                  {t('projects_field_spent')}
                </label>
                <input
                  id="project-spent"
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="उदा. 450000"
                  value={formData.amount_spent}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount_spent: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="project-start-date">
                  {t('projects_field_start_date')}
                </label>
                <input
                  id="project-start-date"
                  type="date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="project-end-date">
                  {t('projects_field_end_date')}
                </label>
                <input
                  id="project-end-date"
                  type="date"
                  className="form-input"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
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
                {editingProject ? t('save_btn') : t('projects_btn_new')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
