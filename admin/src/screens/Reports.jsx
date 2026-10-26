import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  Bell,
  MessageSquareText,
  Wallet,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';

// Helper to extract category from complaint description tag e.g. [प्रकार: पाणी]
const parseCategory = (desc, fallback = 'इतर') => {
  if (!desc) return fallback;
  const match = desc.match(/\[प्रकार:\s*([^\]]+)\]/);
  return match ? match[1] : fallback;
};

export default function Reports() {
  const { villageId } = useAuth();
  const { language, t } = useSettings();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw fetched data
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [villages, setVillages] = useState([]);

  // Active view tab & filters
  const [activeReportTab, setActiveReportTab] = useState('overview'); // 'overview' | 'complaints' | 'projects' | 'notices'
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL'); // 'ALL' | '7D' | '30D' | '90D'
  const [selectedVillageFilter, setSelectedVillageFilter] = useState(villageId || 'ALL');

  // Fetch all accessible records
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const fetchErrors = [];

    try {
      // 1. Fetch Villages (for filter mapping)
      const { data: vData, error: vErr } = await supabase.from('villages').select('id, name, district');
      if (vErr) {
        console.error('Villages fetch error:', vErr);
        fetchErrors.push(vErr.message);
      }
      setVillages(vData || []);

      // 2. Fetch Profiles for mapping citizen user_id -> village_id (schema relationship)
      const userVillageMap = {};
      const { data: profData, error: profErr } = await supabase.from('profiles').select('id, village_id');
      if (profErr) {
        console.warn('Profiles mapping note/RLS:', profErr.message);
      } else if (profData) {
        profData.forEach((p) => {
          if (p.id && p.village_id) {
            userVillageMap[p.id] = p.village_id;
          }
        });
      }

      // 3. Fetch Complaints (only supported stored columns; category parsed from description tags)
      const { data: cData, error: cErr } = await supabase
        .from('complaints')
        .select('id, title, description, status, created_at, user_id')
        .order('created_at', { ascending: false });

      if (cErr) {
        console.error('Complaints query error:', cErr);
        fetchErrors.push(cErr.message);
        setComplaints([]);
      } else if (cData) {
        const mapped = cData.map((c) => ({
          ...c,
          category: parseCategory(c.description, t('other')),
          village_id: userVillageMap[c.user_id] || null,
        }));
        setComplaints(mapped);
      }

      // 4. Fetch Notices (only supported stored columns)
      const { data: nData, error: nErr } = await supabase
        .from('notices')
        .select('id, title, content, status, village_id, created_at')
        .order('created_at', { ascending: false });

      if (nErr) {
        console.error('Notices query error:', nErr);
        fetchErrors.push(nErr.message);
        setNotices([]);
      } else {
        setNotices(nData || []);
      }

      // 5. Fetch Projects (only supported stored columns)
      const { data: pData, error: pErr } = await supabase
        .from('projects')
        .select('id, name, status, budget, amount_spent, progress, village_id, created_at')
        .order('created_at', { ascending: false });

      if (pErr) {
        console.error('Projects query error:', pErr);
        fetchErrors.push(pErr.message);
        setProjects([]);
      } else {
        setProjects(pData || []);
      }

      if (fetchErrors.length > 0) {
        setError(fetchErrors.join(' | '));
      } else {
        setError(null);
      }

    } catch (err) {
      console.error('Reports data fetch error:', err);
      setError(err.message || t('reports_load_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Date and Village filter helper
  const filterByDateAndVillage = useCallback((items) => {
    const now = new Date();
    return items.filter((item) => {
      // Village filter
      if (selectedVillageFilter !== 'ALL') {
        if (!item.village_id || item.village_id !== selectedVillageFilter) {
          return false;
        }
      }

      // Date filter
      if (dateRangeFilter === 'ALL' || !item.created_at) return true;
      const itemDate = new Date(item.created_at);
      const diffMs = now - itemDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (dateRangeFilter === '7D') return diffDays <= 7;
      if (dateRangeFilter === '30D') return diffDays <= 30;
      if (dateRangeFilter === '90D') return diffDays <= 90;
      return true;
    });
  }, [dateRangeFilter, selectedVillageFilter]);

  // Filtered Datasets
  const filteredComplaints = useMemo(() => filterByDateAndVillage(complaints), [complaints, filterByDateAndVillage]);
  const filteredNotices = useMemo(() => filterByDateAndVillage(notices), [notices, filterByDateAndVillage]);
  const filteredProjects = useMemo(() => filterByDateAndVillage(projects), [projects, filterByDateAndVillage]);

  // Calculated Complaint Metrics
  const complaintMetrics = useMemo(() => {
    const total = filteredComplaints.length;
    const received = filteredComplaints.filter(c => c.status === 'प्राप्त' || c.status === 'received' || !c.status).length;
    const inProgress = filteredComplaints.filter(c => c.status === 'प्रक्रियेत' || c.status === 'in_progress').length;
    const resolved = filteredComplaints.filter(c => c.status === 'सोडवले' || c.status === 'resolved').length;
    const rejected = filteredComplaints.filter(c => c.status === 'नाकारले' || c.status === 'rejected').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Category breakdown
    const categoryCounts = {};
    filteredComplaints.forEach((c) => {
      const cat = c.category || t('other');
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      total,
      received,
      inProgress,
      resolved,
      rejected,
      resolutionRate,
      categories: Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
    };
  }, [filteredComplaints, t]);

  // Calculated Notice Metrics (only supported stored columns)
  const noticeMetrics = useMemo(() => {
    const total = filteredNotices.length;
    const published = filteredNotices.filter(n => n.status === 'published' || n.status === 'प्रकाशित' || !n.status).length;
    const draft = filteredNotices.filter(n => n.status === 'draft' || n.status === 'मसुदा').length;
    const archived = filteredNotices.filter(n => n.status === 'archived' || n.status === 'संग्रहित').length;

    return {
      total,
      published,
      draft,
      archived,
    };
  }, [filteredNotices]);

  // Calculated Project Metrics
  const projectMetrics = useMemo(() => {
    const total = filteredProjects.length;
    const ongoing = filteredProjects.filter(p => p.status === 'चालू' || p.status === 'ongoing').length;
    const completed = filteredProjects.filter(p => p.status === 'पूर्ण' || p.status === 'completed').length;
    const planned = filteredProjects.filter(p => p.status === 'नियोजित' || p.status === 'planned').length;
    const onHold = filteredProjects.filter(p => p.status === 'स्थगित' || p.status === 'on_hold').length;

    const totalBudget = filteredProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalSpent = filteredProjects.reduce((sum, p) => sum + (Number(p.amount_spent) || 0), 0);
    const remainingBalance = Math.max(0, totalBudget - totalSpent);
    const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const avgProgress = total > 0
      ? Math.round(filteredProjects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0) / total)
      : 0;

    return {
      total,
      ongoing,
      completed,
      planned,
      onHold,
      totalBudget,
      totalSpent,
      remainingBalance,
      budgetUtilization,
      avgProgress
    };
  }, [filteredProjects]);

  // Currency formatting helper
  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat(language === 'en' ? 'en-IN' : 'mr-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Safe client-side CSV Export helper
  const handleExportCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = '';
    const dateLocale = language === 'en' ? 'en-IN' : 'mr-IN';

    if (type === 'complaints') {
      filename = `complaints_report_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        t('csv_complaint_id'),
        t('csv_complaint_title'),
        t('csv_complaint_category'),
        t('csv_complaint_status'),
        t('csv_complaint_date')
      ];
      rows = filteredComplaints.map(c => [
        `"${c.id}"`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.category || t('other')}"`,
        `"${c.status || t('status_received')}"`,
        `"${c.created_at ? new Date(c.created_at).toLocaleDateString(dateLocale) : ''}"`
      ]);
    } else if (type === 'projects') {
      filename = `projects_report_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        t('csv_project_id'),
        t('csv_project_name'),
        t('csv_project_status'),
        t('csv_project_budget'),
        t('csv_project_spent'),
        t('csv_project_balance'),
        t('csv_project_progress'),
        t('csv_project_date')
      ];
      rows = filteredProjects.map(p => {
        const b = Number(p.budget) || 0;
        const s = Number(p.amount_spent) || 0;
        return [
          `"${p.id}"`,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${p.status || t('status_planned')}"`,
          b,
          s,
          Math.max(0, b - s),
          `${p.progress || 0}%`,
          `"${p.created_at ? new Date(p.created_at).toLocaleDateString(dateLocale) : ''}"`
        ];
      });
    } else if (type === 'notices') {
      filename = `notices_report_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        t('csv_notice_id'),
        t('csv_notice_title'),
        t('csv_notice_status'),
        t('csv_notice_date')
      ];
      rows = filteredNotices.map(n => [
        `"${n.id}"`,
        `"${(n.title || '').replace(/"/g, '""')}"`,
        `"${n.status || t('status_published')}"`,
        `"${n.created_at ? new Date(n.created_at).toLocaleDateString(dateLocale) : ''}"`
      ]);
    }

    if (rows.length === 0) {
      alert(t('reports_no_csv_data'));
      return;
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-pale)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {t('reports_title')}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                {t('reports_sub')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchReportData}
            disabled={loading}
          >
            {t('refresh_btn')}
          </Button>

          {/* Export Action */}
          <Button
            variant="primary"
            icon={Download}
            onClick={() => {
              if (activeReportTab === 'projects') handleExportCSV('projects');
              else if (activeReportTab === 'notices') handleExportCSV('notices');
              else handleExportCSV('complaints');
            }}
          >
            {t('export_csv_btn')}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert type="error" title={t('error')}>
          {error}
        </Alert>
      )}

      {/* Filter Toolbar & Tab Selector */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: t('reports_tab_overview'), icon: PieChart },
            { id: 'complaints', label: t('reports_tab_complaints'), icon: MessageSquareText },
            { id: 'projects', label: t('reports_tab_projects'), icon: Building2 },
            { id: 'notices', label: t('reports_tab_notices'), icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReportTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1px solid transparent' : '1px solid var(--color-border-light)',
                  backgroundColor: isActive ? 'var(--color-primary-pale)' : '#FFFFFF',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters: Date & Village */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Date Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--color-secondary-text)" />
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '130px', padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
            >
              <option value="ALL">{t('filter_all_time')}</option>
              <option value="7D">{t('filter_7_days')}</option>
              <option value="30D">{t('filter_30_days')}</option>
              <option value="90D">{t('filter_90_days')}</option>
            </select>
          </div>

          {/* Village Filter */}
          {villages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="var(--color-secondary-text)" />
              <select
                value={selectedVillageFilter}
                onChange={(e) => setSelectedVillageFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '140px', padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
              >
                <option value="ALL">{t('filter_all_villages')}</option>
                {villages.map(v => (
                  <option key={v.id} value={v.id}>{v.name || v.id}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" message={t('reports_compiling')} />
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeReportTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Primary KPI Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
                {/* 1. Total Complaints */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                      {t('reports_kpi_complaints')}
                    </span>
                    <MessageSquareText size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                    {complaintMetrics.total}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px' }}>
                    <span>{t('reports_res_rate')}: <strong style={{ color: '#2E7D32' }}>{complaintMetrics.resolutionRate}%</strong></span>
                    <span>{t('reports_pending')}: <strong style={{ color: '#E65100' }}>{complaintMetrics.received + complaintMetrics.inProgress}</strong></span>
                  </div>
                </div>

                {/* 2. Total Budget & Projects */}
                <div className="card" style={{ borderLeft: '4px solid #8E24AA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                      {t('reports_kpi_budget')}
                    </span>
                    <Wallet size={18} color="#8E24AA" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                    {formatCurrency(projectMetrics.totalBudget)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px' }}>
                    <span>{t('reports_spent')}: <strong style={{ color: '#8E24AA' }}>{formatCurrency(projectMetrics.totalSpent)}</strong></span>
                    <span>{t('reports_projects_count_label')}: <strong>{projectMetrics.total}</strong></span>
                  </div>
                </div>

                {/* 3. Budget Utilization */}
                <div className="card" style={{ borderLeft: '4px solid #0288D1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                      {t('reports_kpi_utilization')}
                    </span>
                    <TrendingUp size={18} color="#0288D1" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                    {projectMetrics.budgetUtilization}%
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px' }}>
                    <span>{t('reports_balance')}: <strong>{formatCurrency(projectMetrics.remainingBalance)}</strong></span>
                    <span>{t('reports_avg_progress')}: <strong>{projectMetrics.avgProgress}%</strong></span>
                  </div>
                </div>

                {/* 4. Total Notices */}
                <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                      {t('reports_kpi_notices')}
                    </span>
                    <Bell size={18} color="var(--color-warning-text)" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                    {noticeMetrics.total}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px' }}>
                    <span>{t('status_published')}: <strong style={{ color: '#2E7D32' }}>{noticeMetrics.published}</strong></span>
                    <span>{t('status_draft')}: <strong style={{ color: '#F57C00' }}>{noticeMetrics.draft}</strong></span>
                  </div>
                </div>
              </div>

              {/* Dual Visual Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {/* Complaints Status Distribution */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquareText size={18} color="var(--color-primary)" />
                      {t('reports_complaint_status_title')}
                    </h3>
                    <Badge variant="info">{complaintMetrics.total} {t('records_count')}</Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: t('status_resolved'), count: complaintMetrics.resolved, color: '#2E7D32' },
                      { label: t('status_in_progress'), count: complaintMetrics.inProgress, color: '#F57C00' },
                      { label: t('status_received'), count: complaintMetrics.received, color: '#0288D1' },
                      { label: t('status_rejected'), count: complaintMetrics.rejected, color: '#D32F2F' },
                    ].map(st => {
                      const pct = complaintMetrics.total > 0 ? Math.round((st.count / complaintMetrics.total) * 100) : 0;
                      return (
                        <div key={st.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{st.label}</span>
                            <span style={{ color: 'var(--color-secondary-text)' }}>{st.count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#EEEEEE', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: st.color, borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Projects Status & Progress Distribution */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} color="#8E24AA" />
                      {t('reports_project_status_title')}
                    </h3>
                    <Badge variant="info">{projectMetrics.total} {t('projects_count')}</Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: t('status_ongoing'), count: projectMetrics.ongoing, color: '#F57C00' },
                      { label: t('status_completed'), count: projectMetrics.completed, color: '#2E7D32' },
                      { label: t('status_planned'), count: projectMetrics.planned, color: '#0288D1' },
                      { label: t('status_on_hold'), count: projectMetrics.onHold, color: '#757575' },
                    ].map(st => {
                      const pct = projectMetrics.total > 0 ? Math.round((st.count / projectMetrics.total) * 100) : 0;
                      return (
                        <div key={st.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{st.label}</span>
                            <span style={{ color: 'var(--color-secondary-text)' }}>{st.count} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#EEEEEE', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: st.color, borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: COMPLAINT REPORTS */}
          {/* ========================================================================= */}
          {activeReportTab === 'complaints' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Complaints Summary Banner */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t('reports_complaint_analytics_title')}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                      {t('reports_complaint_analytics_sub')}
                    </p>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    icon={FileSpreadsheet}
                    onClick={() => handleExportCSV('complaints')}
                  >
                    {t('reports_download_complaints_csv')}
                  </Button>
                </div>

                {/* Status Badges Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>{t('total')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{complaintMetrics.total}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-pale)', border: '1px solid rgba(56, 142, 60, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', fontWeight: 600 }}>{t('status_resolved')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success-text)', marginTop: '4px' }}>{complaintMetrics.resolved}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-pale)', border: '1px solid rgba(249, 168, 37, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-warning-text)', fontWeight: 600 }}>{t('status_in_progress')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning-text)', marginTop: '4px' }}>{complaintMetrics.inProgress}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-info-pale)', border: '1px solid rgba(2, 136, 209, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-info-text)', fontWeight: 600 }}>{t('status_received')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-info-text)', marginTop: '4px' }}>{complaintMetrics.received}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-error-pale)', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-error-text)', fontWeight: 600 }}>{t('status_rejected')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error-text)', marginTop: '4px' }}>{complaintMetrics.rejected}</div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    {t('reports_category_breakdown_title')}
                  </h3>
                </div>
                {complaintMetrics.categories.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                    {t('reports_no_complaints_period')}
                  </div>
                ) : (
                  <div className="table-container" style={{ border: 'none' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('reports_th_category')}</th>
                          <th style={{ textAlign: 'center' }}>{t('reports_th_count')}</th>
                          <th style={{ width: '40%' }}>{t('reports_th_share')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {complaintMetrics.categories.map(cat => (
                          <tr key={cat.name}>
                            <td style={{ fontWeight: 600 }}>{cat.name}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{cat.count}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '8px', backgroundColor: '#EEEEEE', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${cat.percentage}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary-text)', minWidth: '35px' }}>
                                  {cat.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DEVELOPMENT PROJECTS REPORTS */}
          {/* ========================================================================= */}
          {activeReportTab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Projects Financial & Progress Summary */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t('reports_project_analytics_title')}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                      {t('reports_project_analytics_sub')}
                    </p>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    icon={FileSpreadsheet}
                    onClick={() => handleExportCSV('projects')}
                  >
                    {t('reports_download_projects_csv')}
                  </Button>
                </div>

                {/* Financial Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>{t('reports_sanctioned_budget')}</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                      {formatCurrency(projectMetrics.totalBudget)}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(142, 36, 170, 0.08)', border: '1px solid rgba(142, 36, 170, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#8E24AA', fontWeight: 600 }}>{t('reports_amount_spent')}</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#8E24AA', marginTop: '4px' }}>
                      {formatCurrency(projectMetrics.totalSpent)}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-pale)', border: '1px solid rgba(56, 142, 60, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', fontWeight: 600 }}>{t('reports_remaining_balance')}</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-success-text)', marginTop: '4px' }}>
                      {formatCurrency(projectMetrics.remainingBalance)}
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-info-pale)', border: '1px solid rgba(2, 136, 209, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-info-text)', fontWeight: 600 }}>{t('reports_avg_physical_progress')}</div>
                    <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-info-text)', marginTop: '4px' }}>
                      {projectMetrics.avgProgress}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Breakdown Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    {t('reports_active_projects_title')}
                  </h3>
                </div>

                {filteredProjects.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                    {t('reports_no_projects_period')}
                  </div>
                ) : (
                  <div className="table-container" style={{ border: 'none' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('projects_th_name')}</th>
                          <th>{t('projects_th_status')}</th>
                          <th style={{ textAlign: 'right' }}>{t('projects_th_budget')}</th>
                          <th style={{ textAlign: 'right' }}>{t('projects_th_spent')}</th>
                          <th style={{ textAlign: 'right' }}>{t('reports_balance')}</th>
                          <th style={{ width: '20%' }}>{t('projects_th_progress')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map(p => {
                          const b = Number(p.budget) || 0;
                          const s = Number(p.amount_spent) || 0;
                          const bal = Math.max(0, b - s);
                          return (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 600 }}>{p.name}</td>
                              <td><Badge status={p.status || 'नियोजित'} /></td>
                              <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(b)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#8E24AA' }}>{formatCurrency(s)}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#2E7D32' }}>{formatCurrency(bal)}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, height: '8px', backgroundColor: '#EEEEEE', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%`, height: '100%', backgroundColor: p.status === 'पूर्ण' || p.status === 'completed' ? '#2E7D32' : 'var(--color-primary)', borderRadius: '4px' }} />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '35px' }}>{p.progress || 0}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: NOTICE REPORTS */}
          {/* ========================================================================= */}
          {activeReportTab === 'notices' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {t('reports_notice_analytics_title')}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                      {t('reports_notice_analytics_sub')}
                    </p>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    icon={FileSpreadsheet}
                    onClick={() => handleExportCSV('notices')}
                  >
                    {t('reports_download_notices_csv')}
                  </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>{t('total')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{noticeMetrics.total}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-pale)', border: '1px solid rgba(56, 142, 60, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', fontWeight: 600 }}>{t('status_published')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success-text)', marginTop: '4px' }}>{noticeMetrics.published}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-pale)', border: '1px solid rgba(249, 168, 37, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-warning-text)', fontWeight: 600 }}>{t('status_draft')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning-text)', marginTop: '4px' }}>{noticeMetrics.draft}</div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#EEEEEE', border: '1px solid #E0E0E0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#616161', fontWeight: 600 }}>{t('status_archived')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#424242', marginTop: '4px' }}>{noticeMetrics.archived}</div>
                  </div>
                </div>
              </div>

              {/* Notice List Summary Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    {t('reports_notice_list_title')}
                  </h3>
                </div>

                {filteredNotices.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                    {t('reports_no_notices_period')}
                  </div>
                ) : (
                  <div className="table-container" style={{ border: 'none' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t('reports_th_notice_title')}</th>
                          <th>{t('status')}</th>
                          <th>{t('reports_th_published_date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNotices.map(n => (
                          <tr key={n.id}>
                            <td style={{ fontWeight: 600 }}>{n.title}</td>
                            <td><Badge status={n.status || 'published'} /></td>
                            <td style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>
                              {n.created_at ? new Date(n.created_at).toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN') : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
