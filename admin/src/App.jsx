import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import AdminLayout from './components/layout/AdminLayout';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Complaints from './screens/Complaints';
import Notices from './screens/Notices';
import Projects from './screens/Projects';
import VillageInfo from './screens/VillageInfo';
import Citizens from './screens/Citizens';
import Reports from './screens/Reports';
import LoadingSpinner from './components/ui/LoadingSpinner';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState(['dashboard']);
  const [complaintsFilter, setComplaintsFilter] = useState('ALL');

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      setHistory((prev) => (prev[prev.length - 1] === newTab ? prev : [...prev, newTab]));
      setActiveTab(newTab);
    }
  };

  const handleNavigateToComplaints = (filter = 'ALL') => {
    setComplaintsFilter(typeof filter === 'string' ? filter : 'ALL');
    handleTabChange('complaints');
  };

  const handleBack = () => {
    if (history.length > 1) {
      const nextHistory = [...history];
      nextHistory.pop(); // Remove current screen
      const prevTab = nextHistory[nextHistory.length - 1] || 'dashboard';
      setHistory(nextHistory);
      setActiveTab(prevTab);
    } else {
      setActiveTab('dashboard');
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <LoadingSpinner size="lg" message={t('app_loading')} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange} onBack={handleBack}>
      {activeTab === 'dashboard' ? (
        <Dashboard 
          onNavigateToVillage={() => handleTabChange('village-info')}
          onNavigateToNotices={() => handleTabChange('notices')}
          onNavigateToComplaints={handleNavigateToComplaints}
          onNavigateToProjects={() => handleTabChange('projects')}
          onNavigateToCitizens={() => handleTabChange('citizens')}
          onNavigateToReports={() => handleTabChange('reports')}
        />
      ) : activeTab === 'village-info' ? (
        <VillageInfo
          onNavigateToNotices={() => handleTabChange('notices')}
          onNavigateToComplaints={handleNavigateToComplaints}
          onNavigateToProjects={() => handleTabChange('projects')}
        />
      ) : activeTab === 'notices' ? (
        <Notices />
      ) : activeTab === 'complaints' ? (
        <Complaints initialStatusFilter={complaintsFilter} />
      ) : activeTab === 'projects' ? (
        <Projects />
      ) : activeTab === 'citizens' ? (
        <Citizens />
      ) : (
        <Reports />
      )}
    </AdminLayout>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      const lang = typeof localStorage !== 'undefined' ? localStorage.getItem('aaplagaav_lang') || 'mr' : 'mr';
      const isEn = lang === 'en';

      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '3rem auto', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E0E0E0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#D32F2F', marginBottom: '0.5rem' }}>
            {isEn ? 'Application Error' : 'काहीतरी त्रुटी आली'}
          </h2>
          <p style={{ color: '#616161', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {this.state.error?.message || (isEn ? 'An unexpected error occurred.' : 'अपेक्षित त्रुटी आली.')}
          </p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.25rem', backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            {isEn ? 'Reload Page' : 'पृष्ठ पुन्हा लोड करा'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
