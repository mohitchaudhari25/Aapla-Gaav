
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  RefreshCw, 
  ArrowRight, 
  MapPin,
  Bell,
  Building2,
  BarChart3,
  Wallet,
  Receipt
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';

export default function Dashboard({ 
  onNavigateToComplaints, 
  onNavigateToNotices, 
  onNavigateToProjects,
  onNavigateToVillage,
  onNavigateToCitizens,
  onNavigateToReports
}) {
  const { villageId } = useAuth();
  const { language, t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    received: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [noticesStats, setNoticesStats] = useState({ total: 0, published: 0 });
  const [projectsStats, setProjectsStats] = useState({ total: 0, ongoing: 0 });
  const [fundsStats, setFundsStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [villageData, setVillageData] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Village Profile
      if (villageId) {
        const { data: vData } = await supabase
          .from('villages')
          .select('*')
          .eq('id', villageId)
          .single();
        if (vData) setVillageData(vData);
      } else {
        // Fallback default village query
        const { data: vList } = await supabase.from('villages').select('*').limit(1);
        if (vList && vList.length > 0) setVillageData(vList[0]);
      }

      // 3. Fetch complaints data for metrics and recent list
      const { data: complaints, error: complaintsErr } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (complaintsErr) {
        throw complaintsErr;
      }

      if (complaints) {
        const counts = {
          total: complaints.length,
          received: complaints.filter(c => c.status === 'प्राप्त' || !c.status).length,
          inProgress: complaints.filter(c => c.status === 'प्रक्रियेत').length,
          resolved: complaints.filter(c => c.status === 'सोडवले').length,
          rejected: complaints.filter(c => c.status === 'नाकारले').length,
        };
        setStats(counts);
        setRecentComplaints(complaints.slice(0, 5));
      }

      // 4. Fetch notices count
      const { data: noticesData } = await supabase
        .from('notices')
        .select('id, status');
      if (noticesData) {
        setNoticesStats({
          total: noticesData.length,
          published: noticesData.filter(n => n.status === 'published' || !n.status).length,
        });
      }

      // 5. Fetch projects count
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, status');
      if (projectsData) {
        setProjectsStats({
          total: projectsData.length,
          ongoing: projectsData.filter(p => p.status === 'चालू').length,
        });
      }

      // 6. Fetch fund transactions summary
      const { data: fundsData } = await supabase
        .from('fund_transactions')
        .select('amount, transaction_type');
      if (fundsData) {
        const inc = fundsData.filter(f => (f.transaction_type || f.type) === 'income').reduce((s, f) => s + (Number(f.amount) || 0), 0);
        const exp = fundsData.filter(f => (f.transaction_type || f.type) === 'expense').reduce((s, f) => s + (Number(f.amount) || 0), 0);
        setFundsStats({ totalIncome: inc, totalExpense: exp, balance: inc - exp });
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'डॅशबोर्ड डेटा लोड करताना त्रुटी आली. (Failed to load dashboard data)');
    } finally {
      setLoading(false);
    }
  }, [villageId]);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fund_transactions' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'villages' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner size="lg" message="ग्रामपंचायत डॅशबोर्ड डेटा लोड होत आहे..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner / Gram Panchayat Governance Header */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '5px solid var(--color-primary)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 1.75rem',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--color-primary-pale)',
                color: 'var(--color-primary-dark)',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.625rem',
                border: '1px solid rgba(30, 126, 52, 0.2)',
              }}
            >
              <MapPin size={13} color="var(--color-primary)" />
              <span>{villageData?.name || 'शिवाजीनगर'} {t('gram_panchayat')}</span>
              {villageData?.taluka && <span>• {t('taluka_prefix')} {villageData.taluka}</span>}
              {villageData?.district && <span>• {t('district_prefix')} {villageData.district}</span>}
            </div>
            <h2
              style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1.25,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {t('welcome_banner_title')}
            </h2>
            <p
              style={{
                color: 'var(--color-secondary-text)',
                fontSize: '0.84375rem',
                marginTop: '4px',
                maxWidth: '680px',
                lineHeight: 1.45,
              }}
            >
              {t('welcome_banner_desc')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {onNavigateToReports && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToReports}
                icon={BarChart3}
              >
                {t('view_reports_btn')}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={fetchDashboardData}
              icon={RefreshCw}
            >
              {t('refresh_btn')}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" title={t('data_error_title')}>
          <div>{error}</div>
          <Button variant="outline-primary" size="sm" onClick={fetchDashboardData} style={{ marginTop: '0.5rem' }}>
            {t('retry_btn')}
          </Button>
        </Alert>
      )}

      {/* Metrics Grid - Fully Responsive & Interactive Clickable Cards */}
      <div className="metrics-grid">
        {/* Total Complaints */}
        <div
          className="card metric-card"
          onClick={() => onNavigateToComplaints?.('ALL')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToComplaints?.('ALL');
            }
          }}
          title={language === 'en' ? 'Click to view all complaints' : 'सर्व तक्रारी पाहण्यासाठी क्लिक करा'}
          style={{
            borderLeft: '4px solid var(--color-primary)',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)', lineHeight: 1.3 }}>
                {t('dash_total_complaints')}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-pale)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(30, 126, 52, 0.15)',
                  flexShrink: 0,
                }}
              >
                <Inbox size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {stats.total}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '0.625rem', lineHeight: 1.35 }}>
            <span style={{ wordBreak: 'break-word' }}>{language === 'en' ? 'Total registered citizen grievances' : 'नोंदवलेल्या एकूण नागरिक तक्रारी'}</span>
            <ArrowRight size={13} style={{ flexShrink: 0, opacity: 0.65, marginLeft: '6px' }} />
          </div>
        </div>

        {/* Received / New */}
        <div
          className="card metric-card"
          onClick={() => onNavigateToComplaints?.('प्राप्त')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToComplaints?.('प्राप्त');
            }
          }}
          title={language === 'en' ? 'Click to view received complaints' : 'नवीन / प्राप्त तक्रारी पाहण्यासाठी क्लिक करा'}
          style={{
            borderLeft: '4px solid var(--color-info)',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)', lineHeight: 1.3 }}>
                {t('dash_received_complaints')}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-info-pale)',
                  color: 'var(--color-info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(2, 132, 199, 0.15)',
                  flexShrink: 0,
                }}
              >
                <Clock size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', fontWeight: 800, color: 'var(--color-info)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {stats.received}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '0.625rem', lineHeight: 1.35 }}>
            <span style={{ wordBreak: 'break-word' }}>{stats.total > 0 ? `${Math.round((stats.received / stats.total) * 100)}% • ` : ''}{language === 'en' ? 'Pending for action' : 'कारवाईसाठी प्रलंबित'}</span>
            <ArrowRight size={13} style={{ flexShrink: 0, opacity: 0.65, marginLeft: '6px' }} />
          </div>
        </div>

        {/* In Progress */}
        <div
          className="card metric-card"
          onClick={() => onNavigateToComplaints?.('प्रक्रियेत')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToComplaints?.('प्रक्रियेत');
            }
          }}
          title={language === 'en' ? 'Click to view in-progress complaints' : 'प्रक्रियेतील तक्रारी पाहण्यासाठी क्लिक करा'}
          style={{
            borderLeft: '4px solid var(--color-warning)',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)', lineHeight: 1.3 }}>
                {t('dash_in_progress_complaints')}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-warning-pale)',
                  color: 'var(--color-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(217, 119, 6, 0.15)',
                  flexShrink: 0,
                }}
              >
                <AlertOctagon size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', fontWeight: 800, color: 'var(--color-warning-text)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {stats.inProgress}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '0.625rem', lineHeight: 1.35 }}>
            <span style={{ wordBreak: 'break-word' }}>{stats.total > 0 ? `${Math.round((stats.inProgress / stats.total) * 100)}% • ` : ''}{language === 'en' ? 'Under investigation or work' : 'सध्या चौकशी किंवा कामात'}</span>
            <ArrowRight size={13} style={{ flexShrink: 0, opacity: 0.65, marginLeft: '6px' }} />
          </div>
        </div>

        {/* Resolved */}
        <div
          className="card metric-card"
          onClick={() => onNavigateToComplaints?.('सोडवले')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToComplaints?.('सोडवले');
            }
          }}
          title={language === 'en' ? 'Click to view resolved complaints' : 'निवारण झालेल्या तक्रारी पाहण्यासाठी क्लिक करा'}
          style={{
            borderLeft: '4px solid var(--color-success)',
            padding: '1.125rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)', lineHeight: 1.3 }}>
                {t('dash_resolved_complaints')}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-success-pale)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(22, 163, 74, 0.15)',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)', fontWeight: 800, color: 'var(--color-success)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {stats.resolved}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '0.625rem', lineHeight: 1.35 }}>
            <span style={{ wordBreak: 'break-word' }}>{stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}% • ` : ''}{language === 'en' ? 'Resolution completed' : 'निवारण पूर्ण'}</span>
            <ArrowRight size={13} style={{ flexShrink: 0, opacity: 0.65, marginLeft: '6px' }} />
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Complaints & Module Overviews */}
      <div className="dashboard-two-col">
        {/* Recent Complaints Table Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--color-border-light)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {t('dash_recent_complaints')}
                </h3>
                {recentComplaints.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-primary-pale)',
                      color: 'var(--color-primary-dark)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {recentComplaints.length}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', margin: '2px 0 0 0' }}>
                {t('dash_recent_complaints_desc')}
              </p>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onNavigateToComplaints}
              icon={ArrowRight}
            >
              {t('view_all')}
            </Button>
          </div>

          {recentComplaints.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
              <Inbox size={32} color="var(--color-muted-text)" style={{ margin: '0 auto 8px auto', display: 'block', opacity: 0.6 }} />
              <div>{language === 'en' ? 'No complaints registered yet.' : 'सध्या कोणतीही तक्रार नोंदवलेली नाही.'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '2px' }}>
                {language === 'en' ? 'New complaints will appear here when filed.' : 'नवीन तक्रारी दाखल झाल्यावर येथे दिसतील.'}
              </div>
            </div>
          ) : (
            <div className="table-container" style={{ border: '1px solid var(--color-border-light)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('dash_th_title')}</th>
                    <th>{t('dash_th_status')}</th>
                    <th>{t('dash_th_date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((comp) => (
                    <tr
                      key={comp.id}
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                      onClick={onNavigateToComplaints}
                    >
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
                          {comp.title || (language === 'en' ? 'Untitled' : 'शीर्षक नाही')}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted-text)', fontWeight: 400, marginTop: '2px' }}>
                          ID: {comp.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td>
                        <Badge status={comp.status || 'प्राप्त'} />
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', whiteSpace: 'nowrap' }}>
                        {comp.created_at ? new Date(comp.created_at).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Village Summary & Module Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Village Notices Summary Card */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={17} color="var(--color-warning-text)" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {t('dash_notices_card_title')}
                </h3>
              </div>
              <Badge variant="warning">{noticesStats.published} {language === 'en' ? 'Active' : 'सक्रिय'}</Badge>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginBottom: '0.875rem', lineHeight: 1.4 }}>
              {language === 'en'
                ? `Total of ${noticesStats.total} notices in database (Published: ${noticesStats.published}).`
                : `डेटाबेसमध्ये एकूण ${noticesStats.total} सूचना (प्रकाशित: ${noticesStats.published}) नोंदवलेल्या आहेत.`}
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onNavigateToNotices}
              icon={ArrowRight}
              style={{ width: '100%' }}
            >
              {t('dash_manage_notices_btn')}
            </Button>
          </div>

          {/* Development Projects Summary Card */}
          <div className="card" style={{ borderLeft: '4px solid var(--color-primary)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={17} color="var(--color-primary)" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {t('dash_projects_card_title')}
                </h3>
              </div>
              <Badge variant="info">{projectsStats.ongoing} {language === 'en' ? 'Ongoing' : 'चालू'}</Badge>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginBottom: '0.875rem', lineHeight: 1.4 }}>
              {language === 'en'
                ? `Total of ${projectsStats.total} development projects in database (Ongoing: ${projectsStats.ongoing}).`
                : `डेटाबेसमध्ये एकूण ${projectsStats.total} विकास कामे (सध्या चालू: ${projectsStats.ongoing}) नोंदवलेली आहेत.`}
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onNavigateToProjects}
              icon={ArrowRight}
              style={{ width: '100%' }}
            >
              {t('dash_manage_projects_btn')}
            </Button>
          </div>

          {/* Gram Panchayat Village Info Summary */}
          <div className="card" style={{ backgroundColor: 'var(--color-surface)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {language === 'en' ? 'Village & Administration Info' : 'गाव व प्रशासकीय माहिती'}
              </h3>
              {onNavigateToVillage && (
                <button
                  onClick={onNavigateToVillage}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  {language === 'en' ? 'View Details' : 'तपशील पहा'} <ArrowRight size={12} />
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>{language === 'en' ? 'Village:' : 'गाव:'}</strong> {villageData?.name || (language === 'en' ? 'Village Info' : 'गाव माहिती')}</div>
              <div><strong>{language === 'en' ? 'District / State:' : 'जिल्हा / राज्य:'}</strong> {villageData?.district || (language === 'en' ? 'Pune' : 'पुणे')}, {villageData?.state || (language === 'en' ? 'Maharashtra' : 'महाराष्ट्र')}</div>
              {onNavigateToCitizens && (
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--color-border-light)' }}>
                  <button
                    onClick={onNavigateToCitizens}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <ArrowRight size={12} /> {t('dash_manage_citizen_btn')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
