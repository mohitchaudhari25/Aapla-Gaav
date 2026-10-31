import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Building2,
  Bell,
  MessageSquareText,
  Users,
  RefreshCw,
  Calendar,
  Clock,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Hash,
  Globe,
  Edit3,
  Home,
  Smartphone,
  Phone,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import VillageEditModal from '../components/village/VillageEditModal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';

export default function VillageInfo({ onNavigateToProjects, onNavigateToNotices, onNavigateToComplaints }) {
  const { villageId } = useAuth();
  const { language, t } = useSettings();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Village master data
  const [villagesList, setVillagesList] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState(null);

  // Contacts directory state
  const [contactsList, setContactsList] = useState([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', designation: '', phone: '', type: 'village' });
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactError, setContactError] = useState(null);

  // Funds ledger state
  const [fundsList, setFundsList] = useState([]);
  const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
  const [fundForm, setFundForm] = useState({
    description: '',
    amount: '',
    transaction_type: 'expense',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [isSavingFund, setIsSavingFund] = useState(false);
  const [fundError, setFundError] = useState(null);

  // Aggregated summaries for the village
  const [projectStats, setProjectStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    totalBudget: 0,
    totalSpent: 0,
    recentProjects: []
  });

  const [noticeStats, setNoticeStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    recentNotices: []
  });

  const [complaintStats, setComplaintStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    error: null,
  });

  const [citizenStats, setCitizenStats] = useState({
    count: 0,
    isRestricted: false,
  });

  // Fetch all village records and select appropriate one
  const fetchVillageData = useCallback(async (overrideVillageId) => {
    setLoading(true);
    setError(null);
    const errors = [];

    try {
      // 1. Fetch villages from database
      let fetchedVillages = [];
      let activeVillage = null;

      if (villageId) {
        try {
          const { data: vSingle, error: singleErr } = await supabase
            .from('villages')
            .select('*')
            .eq('id', villageId)
            .maybeSingle();

          if (!singleErr && vSingle) {
            fetchedVillages = [vSingle];
            activeVillage = vSingle;
          }
        } catch (e) {
          console.warn('Error fetching single village by ID:', e);
        }
      }

      // If not found yet, query all villages
      try {
        const { data: allVillages, error: allErr } = await supabase
          .from('villages')
          .select('*');

        if (!allErr && allVillages && allVillages.length > 0) {
          fetchedVillages = allVillages;
          if (!activeVillage) {
            activeVillage = (villageId ? allVillages.find(v => v.id === villageId) : null) || allVillages[0];
          }
        }
      } catch (e) {
        console.warn('Error fetching all villages:', e);
      }

      // Check localStorage for customized village information
      try {
        const saved = localStorage.getItem('aapla_custom_village_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (activeVillage) {
            activeVillage = { ...activeVillage, ...parsed };
          } else {
            activeVillage = parsed;
            fetchedVillages = [parsed];
          }
        }
      } catch (storageErr) {
        console.warn('LocalStorage load error:', storageErr);
      }

      if (!activeVillage) {
        activeVillage = {
          id: 'demo-village-1',
          name: language === 'en' ? 'Shivajinagar' : 'शिवाजीनगर',
          gram_panchayat: language === 'en' ? 'Shivajinagar Gram Panchayat' : 'शिवाजीनगर ग्रामपंचायत',
          taluka: language === 'en' ? 'Haveli' : 'हवेली',
          district: language === 'en' ? 'Pune' : 'पुणे',
          state: language === 'en' ? 'Maharashtra' : 'महाराष्ट्र',
          population: language === 'en' ? '5,200' : '५,२००',
          families: language === 'en' ? '1,100' : '१,१००',
          houses: language === 'en' ? '950' : '९५०',
          area: language === 'en' ? '12 sq km' : '१२ चौरस किमी',
          office_name: language === 'en' ? 'Gram Panchayat Office, Shivajinagar' : 'ग्रामपंचायत कार्यालय, शिवाजीनगर',
          timings: language === 'en' ? '10:00 AM to 5:00 PM' : 'सकाळी १०:०० ते संध्याकाळी ५:००',
          weekly_off: language === 'en' ? 'Sunday' : 'रविवार',
        };
        fetchedVillages = [activeVillage];
      }

      setVillagesList(fetchedVillages);

      const targetVillageId = overrideVillageId || activeVillage?.id;
      if (targetVillageId && activeVillage?.id !== targetVillageId) {
        const matched = fetchedVillages.find(v => v.id === targetVillageId);
        if (matched) activeVillage = matched;
      }
      setSelectedVillage(activeVillage);

      // 2. Fetch Projects Summary for this village
      let projQuery = supabase.from('projects').select('id, name, status, budget, amount_spent, progress, created_at');
      if (targetVillageId) {
        projQuery = projQuery.eq('village_id', targetVillageId);
      }
      const { data: projectsData, error: projErr } = await projQuery.order('created_at', { ascending: false });

      if (projErr) {
        console.warn('Projects summary fetch error:', projErr);
        errors.push(projErr.message);
      } else if (projectsData) {
        const total = projectsData.length;
        const ongoing = projectsData.filter(p => p.status === 'चालू' || p.status === 'ongoing').length;
        const completed = projectsData.filter(p => p.status === 'पूर्ण' || p.status === 'completed').length;
        const totalBudget = projectsData.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
        const totalSpent = projectsData.reduce((sum, p) => sum + (Number(p.amount_spent) || 0), 0);

        setProjectStats({
          total,
          ongoing,
          completed,
          totalBudget,
          totalSpent,
          recentProjects: projectsData.slice(0, 3)
        });
      }

      // 3. Fetch Notices Summary for this village
      let noticeQuery = supabase.from('notices').select('id, title, status, created_at');
      if (targetVillageId) {
        noticeQuery = noticeQuery.eq('village_id', targetVillageId);
      }
      const { data: noticesData, error: noticeErr } = await noticeQuery.order('created_at', { ascending: false });

      if (noticeErr) {
        console.warn('Notices summary fetch error:', noticeErr);
        errors.push(noticeErr.message);
      } else if (noticesData) {
        const total = noticesData.length;
        const published = noticesData.filter(n => n.status === 'published' || n.status === 'प्रकाशित' || !n.status).length;
        const draft = noticesData.filter(n => n.status === 'draft' || n.status === 'मसुदा').length;

        setNoticeStats({
          total,
          published,
          draft,
          recentNotices: noticesData.slice(0, 3)
        });
      }

      // 4. Fetch Citizen Profiles count and IDs for this village
      let citizenUserIds = [];
      try {
        let profileQuery = supabase.from('profiles').select('id, village_id');
        if (targetVillageId) {
          profileQuery = profileQuery.eq('village_id', targetVillageId);
        }
        const { data: profilesData, error: profileErr } = await profileQuery;

        if (profileErr) {
          setCitizenStats({ count: 0, isRestricted: true });
        } else if (profilesData) {
          setCitizenStats({ count: profilesData.length, isRestricted: false });
          citizenUserIds = profilesData.map(p => p.id).filter(Boolean);
        }
      } catch (pErr) {
        console.warn('Citizen profile error (likely RLS):', pErr);
        setCitizenStats({ count: 0, isRestricted: true });
      }

      // 5. Fetch Complaints Summary
      try {
        if (citizenUserIds.length > 0) {
          const { data: complaintsData, error: compErr } = await supabase
            .from('complaints')
            .select('id, status')
            .in('user_id', citizenUserIds);

          if (compErr) {
            console.warn('Complaints query by user_ids error:', compErr);
            setComplaintStats({ total: 0, resolved: 0, pending: 0, error: compErr.message });
          } else if (complaintsData) {
            const total = complaintsData.length;
            const resolved = complaintsData.filter(c => c.status === 'सोडवले' || c.status === 'resolved').length;
            const pending = complaintsData.filter(c => c.status !== 'सोडवले' && c.status !== 'resolved').length;
            setComplaintStats({ total, resolved, pending, error: null });
          }
        } else {
          // If no mapped user IDs, fetch general accessible complaints
          const { data: complaintsData, error: compErr } = await supabase
            .from('complaints')
            .select('id, status')
            .limit(100);

          if (compErr) {
            setComplaintStats({ total: 0, resolved: 0, pending: 0, error: compErr.message });
          } else if (complaintsData) {
            const total = complaintsData.length;
            const resolved = complaintsData.filter(c => c.status === 'सोडवले' || c.status === 'resolved').length;
            const pending = complaintsData.filter(c => c.status !== 'सोडवले' && c.status !== 'resolved').length;
            setComplaintStats({ total, resolved, pending, error: null });
          }
        }
      } catch (cErr) {
        console.warn('Complaints general fetch error:', cErr);
        setComplaintStats({ total: 0, resolved: 0, pending: 0, error: cErr.message });
      }

      // 6. Fetch Contacts Directory
      if (targetVillageId && targetVillageId !== 'demo-village-1') {
        const { data: contactsData, error: contactsErr } = await supabase
          .from('contacts')
          .select('*')
          .eq('village_id', targetVillageId)
          .order('created_at', { ascending: false });

        if (contactsErr) {
          console.warn('Contacts fetch error:', contactsErr);
        } else if (contactsData) {
          setContactsList(contactsData);
        }
      } else {
        setContactsList([]);
      }

      // 7. Fetch Fund Transactions Ledger
      if (targetVillageId && targetVillageId !== 'demo-village-1') {
        const { data: fundsData, error: fundsErr } = await supabase
          .from('fund_transactions')
          .select('*')
          .eq('village_id', targetVillageId)
          .order('transaction_date', { ascending: false });

        if (fundsErr) {
          console.warn('Funds fetch error:', fundsErr);
        } else if (fundsData) {
          setFundsList(fundsData);
        }
      } else {
        setFundsList([]);
      }

      if (errors.length > 0) {
        setError(errors.join(' | '));
      }

    } catch (err) {
      console.error('VillageInfo fetch error:', err);
      setError(err.message || t('village_load_error'));
    } finally {
      setLoading(false);
    }
  }, [villageId, language, t]);

  useEffect(() => {
    fetchVillageData();

    const channel = supabase
      .channel('admin-village-info-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'villages' }, () => fetchVillageData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => fetchVillageData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fund_transactions' }, () => fetchVillageData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchVillageData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => fetchVillageData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVillageData]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!selectedVillage?.id || selectedVillage.id === 'demo-village-1') {
      alert(language === 'en' ? 'Please save village information first to create a database record.' : 'कृपया प्रथम गाव माहिती सेव्ह करा.');
      return;
    }
    if (!contactForm.name.trim() || !contactForm.designation.trim() || !contactForm.phone.trim()) {
      setContactError(language === 'en' ? 'All fields are required.' : 'सर्व फील्ड आवश्यक आहेत.');
      return;
    }
    setIsSavingContact(true);
    setContactError(null);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          village_id: selectedVillage.id,
          name: contactForm.name.trim(),
          designation: contactForm.designation.trim(),
          phone: contactForm.phone.trim(),
          type: contactForm.type || 'village'
        })
        .select()
        .single();

      if (error) throw error;
      setContactsList((prev) => [data, ...prev]);
      setIsContactModalOpen(false);
      setContactForm({ name: '', designation: '', phone: '', type: 'village' });

      // Broadcast notification to relevant village citizens
      try {
        const { data: citizens } = await supabase
          .from('profiles')
          .select('id')
          .eq('village_id', selectedVillage.id);

        if (citizens && citizens.length > 0) {
          const notifs = citizens.map((c) => ({
            user_id: c.id,
            title: 'नवीन संपर्क जोडला (New Village Contact)',
            message: `गावाच्या निर्देशिकेत नवीन संपर्क: ${contactForm.name.trim()} (${contactForm.designation.trim()})`,
            type: 'info',
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          await supabase.from('notifications').insert(notifs);
        }
      } catch (notifErr) {
        console.warn('Contact notification broadcast error:', notifErr);
      }
    } catch (err) {
      console.error('Add contact error:', err);
      setContactError(err.message || 'संपर्क जोडताना त्रुटी आली.');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this contact?' : 'हा संपर्क नक्की हटवायचा आहे का?')) return;
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);
      if (error) throw error;
      setContactsList((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Delete contact error:', err);
      alert(err.message || 'संपर्क हटवताना त्रुटी आली.');
    }
  };

  const handleAddFundTransaction = async (e) => {
    e.preventDefault();
    if (!selectedVillage?.id || selectedVillage.id === 'demo-village-1') {
      alert(language === 'en' ? 'Please save village information first to create a database record.' : 'कृपया प्रथम गाव माहिती सेव्ह करा.');
      return;
    }
    const amt = parseFloat(fundForm.amount);
    if (!fundForm.description.trim() || isNaN(amt) || amt <= 0) {
      setFundError(language === 'en' ? 'Please enter a valid description and positive amount.' : 'कृपया वैध वर्णन आणि रक्कम प्रविष्ट करा.');
      return;
    }
    setIsSavingFund(true);
    setFundError(null);
    try {
      const { data, error } = await supabase
        .from('fund_transactions')
        .insert({
          village_id: selectedVillage.id,
          description: fundForm.description.trim(),
          amount: amt,
          transaction_type: fundForm.transaction_type,
          transaction_date: fundForm.transaction_date ? new Date(fundForm.transaction_date).toISOString() : new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setFundsList((prev) => [data, ...prev]);
      setIsFundsModalOpen(false);
      setFundForm({
        description: '',
        amount: '',
        transaction_type: 'expense',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Add fund transaction error:', err);
      setFundError(err.message || 'निधी व्यवहार नोंदवताना त्रुटी आली.');
    } finally {
      setIsSavingFund(false);
    }
  };

  const handleDeleteFundTransaction = async (txId) => {
    if (!window.confirm(language === 'en' ? 'Are you sure you want to delete this transaction?' : 'हा निधी व्यवहार नक्की हटवायचा आहे का?')) return;
    try {
      const { error } = await supabase.from('fund_transactions').delete().eq('id', txId);
      if (error) throw error;
      setFundsList((prev) => prev.filter((f) => f.id !== txId));
    } catch (err) {
      console.error('Delete fund transaction error:', err);
      alert(err.message || 'व्यवहार हटवताना त्रुटी आली.');
    }
  };

  // Handle village selector change
  const handleSelectVillageChange = (e) => {
    const selectedId = e.target.value;
    const v = villagesList.find(item => item.id === selectedId);
    if (v) {
      setSelectedVillage(v);
      fetchVillageData(v.id);
    }
  };

  const handleSaveVillageSuccess = (updatedVillage) => {
    setSelectedVillage(updatedVillage);
    setVillagesList((prev) => {
      const idx = prev.findIndex((v) => v.id === updatedVillage.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedVillage;
        return copy;
      }
      return [...prev, updatedVillage];
    });

    // Broadcast village info update notification to citizens
    if (updatedVillage?.id) {
      (async () => {
        try {
          const { data: citizens } = await supabase
            .from('profiles')
            .select('id')
            .eq('village_id', updatedVillage.id);

          if (citizens && citizens.length > 0) {
            const notifs = citizens.map((c) => ({
              user_id: c.id,
              title: 'गाव माहिती अपडेट (Village Info Updated)',
              message: `${updatedVillage.name || 'गाव'} माहिती अद्यतनित करण्यात आली आहे.`,
              type: 'info',
              is_read: false,
              created_at: new Date().toISOString(),
            }));
            await supabase.from('notifications').insert(notifs);
          }
        } catch (vNotifErr) {
          console.warn('Village info notification broadcast error:', vNotifErr);
        }
      })();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('info_not_available');
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(language === 'en' ? 'en-IN' : 'mr-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat(language === 'en' ? 'en-IN' : 'mr-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Bar */}
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
              <MapPin size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                {t('nav_village_info')}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                {t('nav_village_info_sub')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            icon={Edit3}
            onClick={() => setIsEditModalOpen(true)}
          >
            {t('fill_village_info_btn')}
          </Button>

          {villagesList.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="village-selector" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                {t('village')}:
              </label>
              <select
                id="village-selector"
                value={selectedVillage?.id || ''}
                onChange={handleSelectVillageChange}
                className="form-select"
                style={{ width: 'auto', minWidth: '160px', padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
              >
                {villagesList.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => fetchVillageData()}
            disabled={loading}
          >
            {t('refresh_btn')}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert type="error" title={t('error')}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" message={t('loading')} />
        </div>
      ) : (
        /* Village Information Content */
        <>
          {!selectedVillage && (
            <div
              className="card"
              style={{
                backgroundColor: '#FFFDF0',
                borderLeft: '4px solid var(--color-warning)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <MapPin size={22} color="var(--color-warning-text)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-warning-text)' }}>
                  {t('village_master_status')}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                  {t('village_master_desc')}
                </div>
              </div>
            </div>
          )}

          {/* Main Village Profile Banner Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F5FBF5 100%)',
              border: '1px solid rgba(46, 125, 50, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 125, 50, 0.05)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  {selectedVillage?.name ? selectedVillage.name.charAt(0) : 'G'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                      {selectedVillage?.name || t('nav_village_info')}
                    </h2>
                    <Badge variant="success" label={t('active_gp_badge')} />
                  </div>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--color-secondary-text)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={15} color="var(--color-primary)" />
                    {selectedVillage?.district ? (
                      <span><strong>{selectedVillage.district}</strong> {t('location_district_label')}, <strong>{selectedVillage.state || 'Maharashtra'}</strong> {t('location_state_label')}</span>
                    ) : (
                      <span><strong>Maharashtra</strong></span>
                    )}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-muted-text)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Hash size={14} /> ID: <code style={{ backgroundColor: '#EEEEEE', padding: '1px 6px', borderRadius: '4px' }}>{selectedVillage?.id}</code>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {t('registered_on')} <strong>{formatDate(selectedVillage?.created_at)}</strong>
                    </span>
                    {selectedVillage?.updated_at && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {t('last_updated_on')} <strong>{formatDate(selectedVillage?.updated_at)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified Badge & Edit Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    padding: '0.5rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--color-primary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={16} />
                  {t('official_jurisdiction')}
                </div>

                <Button
                  variant="outline-primary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  {t('edit_village_info')}
                </Button>
              </div>
            </div>
          </div>

          {/* Citizen App Display Section matching Citizen Panel Screenshot */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={20} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                    {t('citizen_app_preview')}
                  </h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                  {t('citizen_app_preview_sub')}
                </p>
              </div>

              <Button
                variant="outline-primary"
                size="sm"
                icon={Edit3}
                onClick={() => setIsEditModalOpen(true)}
              >
                {t('edit_village_info')}
              </Button>
            </div>

            {/* 1. Basic Village Info Table Card */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
              }}
            >
              {[
                { label: t('village_name_label'), value: selectedVillage?.name || '-' },
                { label: t('gram_panchayat_label'), value: selectedVillage?.gram_panchayat || selectedVillage?.gramPanchayat || '-' },
                { label: t('taluka_label'), value: selectedVillage?.taluka || '-' },
                { label: t('district_label'), value: selectedVillage?.district || '-' },
                { label: t('state_label'), value: selectedVillage?.state || '-' },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-secondary-text)', fontWeight: 500 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--color-text)', fontWeight: 600 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 2. Four Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* Population */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(46, 125, 50, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Users size={22} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {selectedVillage?.population || '-'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                  {t('population_label')}
                </div>
              </div>

              {/* Families */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(46, 125, 50, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Users size={22} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {selectedVillage?.families || '-'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                  {t('families_label')}
                </div>
              </div>

              {/* Houses */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(46, 125, 50, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Home size={22} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {selectedVillage?.houses || selectedVillage?.totalHouses || '-'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                  {t('houses_label')}
                </div>
              </div>

              {/* Area */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(46, 125, 50, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <MapPin size={22} color="var(--color-primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {selectedVillage?.area || '-'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                  {t('area_label')}
                </div>
              </div>
            </div>

            {/* 3. Gram Panchayat Office Info */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {selectedVillage?.office_name || selectedVillage?.officeName || t('info_not_available')}
                </span>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--color-border-light)',
                  paddingTop: '0.625rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary-text)' }}>
                  <Clock size={15} color="var(--color-primary)" />
                  <span><strong>{t('timings_label')}:</strong> {selectedVillage?.timings || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary-text)' }}>
                  <Calendar size={15} color="var(--color-primary)" />
                  <span><strong>{t('weekly_off_label')}:</strong> {selectedVillage?.weekly_off || selectedVillage?.weeklyOff || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Summary Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* 1. Projects Summary Card */}
            <div
              className="card"
              style={{
                cursor: onNavigateToProjects ? 'pointer' : 'default',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onClick={onNavigateToProjects}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(142, 36, 170, 0.1)',
                  color: '#8E24AA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Building2 size={22} />
                </div>
                {onNavigateToProjects && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    {t('manage_btn')} <ArrowRight size={13} />
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                {t('village_projects_summary_title')}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {projectStats.total}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '6px' }}>
                <span>{t('status_ongoing')}: <strong style={{ color: '#F57C00' }}>{projectStats.ongoing}</strong></span>
                <span>{t('status_completed')}: <strong style={{ color: '#2E7D32' }}>{projectStats.completed}</strong></span>
                <span>{t('reports_total_budget')}: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(projectStats.totalBudget)}</strong></span>
              </div>
            </div>

            {/* 2. Notices Summary Card */}
            <div
              className="card"
              style={{
                cursor: onNavigateToNotices ? 'pointer' : 'default',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onClick={onNavigateToNotices}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-warning-pale)',
                  color: 'var(--color-warning-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Bell size={22} />
                </div>
                {onNavigateToNotices && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    {t('manage_btn')} <ArrowRight size={13} />
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                {t('village_notices_summary_title')}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {noticeStats.total}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '6px' }}>
                <span>{t('status_published')}: <strong style={{ color: '#2E7D32' }}>{noticeStats.published}</strong></span>
                <span>{t('status_draft')}: <strong style={{ color: '#F57C00' }}>{noticeStats.draft}</strong></span>
              </div>
            </div>

            {/* 3. Complaints Summary Card */}
            <div
              className="card"
              style={{
                cursor: onNavigateToComplaints ? 'pointer' : 'default',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onClick={onNavigateToComplaints}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(2, 136, 209, 0.1)',
                  color: '#0288D1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MessageSquareText size={22} />
                </div>
                {onNavigateToComplaints && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    {t('view_complaints_btn')} <ArrowRight size={13} />
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                {t('village_complaints_summary_title')}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {complaintStats.error ? '—' : complaintStats.total}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '6px' }}>
                {complaintStats.error ? (
                  <span style={{ color: 'var(--color-error)' }}>{complaintStats.error}</span>
                ) : (
                  <>
                    <span>{t('reports_pending')}: <strong style={{ color: '#E65100' }}>{complaintStats.pending}</strong></span>
                    <span>{t('status_resolved')}: <strong style={{ color: '#2E7D32' }}>{complaintStats.resolved}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* 4. Citizens Registered Summary Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-primary-pale)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Users size={22} />
                </div>
                <Badge variant={citizenStats.isRestricted ? 'warning' : 'success'} label={citizenStats.isRestricted ? t('rls_protected_badge') : t('registered_badge')} />
              </div>

              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
                {t('village_citizens_summary_title')}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                {citizenStats.isRestricted ? t('rls_protected_badge') : citizenStats.count}
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '6px' }}>
                {citizenStats.isRestricted
                  ? t('rls_protected_note')
                  : `${t('active_citizens_count_note')} ${citizenStats.count}`}
              </div>
            </div>
          </div>

          {/* Detailed Dual-Column Sections: Development Projects & Notices Previews */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
            {/* Active Development Projects Preview */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {t('active_projects_title')}
                  </h3>
                </div>
                {onNavigateToProjects && (
                  <Button variant="outline-primary" size="sm" onClick={onNavigateToProjects}>
                    {t('view_all')}
                  </Button>
                )}
              </div>

              {projectStats.recentProjects.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                  {t('no_projects_village')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {projectStats.recentProjects.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-light)',
                        backgroundColor: '#FAFAFA',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {p.name}
                        </span>
                        <Badge status={p.status} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Wallet size={12} /> {t('projects_th_budget')}: <strong>{formatCurrency(p.budget)}</strong>
                        </span>
                        <span>{t('projects_th_progress')}: <strong>{p.progress || 0}%</strong></span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#E0E0E0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, p.progress || 0))}%`,
                            height: '100%',
                            backgroundColor: p.status === 'पूर्ण' || p.status === 'completed' ? '#2E7D32' : 'var(--color-primary)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Notices Preview */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {t('recent_notices_title')}
                  </h3>
                </div>
                {onNavigateToNotices && (
                  <Button variant="outline-primary" size="sm" onClick={onNavigateToNotices}>
                    {t('view_all')}
                  </Button>
                )}
              </div>

              {noticeStats.recentNotices.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                  {t('no_notices_village')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {noticeStats.recentNotices.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-light)',
                        backgroundColor: '#FAFAFA',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {n.title}
                        </span>
                        <Badge status={n.status || 'published'} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {t('date')}: {formatDate(n.created_at)}
                        </span>
                        {n.category && <span>{t('category')}: {n.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contacts Directory & Fund Transactions Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
            
            {/* 1. Gram Panchayat Contacts Management */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {language === 'en' ? 'Village Contacts Directory' : 'ग्रामपंचायत संपर्क निर्देशिका'}
                  </h3>
                  <Badge variant="primary" label={`${contactsList.length}`} />
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    setContactError(null);
                    setContactForm({ name: '', designation: '', phone: '', type: 'village' });
                    setIsContactModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> {language === 'en' ? 'Add Contact' : 'नवीन संपर्क'}
                </Button>
              </div>

              {contactsList.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                  {language === 'en' ? 'No contacts added yet for this village.' : 'या गावासाठी अद्याप संपर्क जोडलेले नाहीत.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '360px', overflowY: 'auto' }}>
                  {contactsList.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-light)',
                        backgroundColor: '#FAFAFA',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                          {c.designation} • <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{c.phone}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: c.type === 'emergency' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                          color: c.type === 'emergency' ? '#D32F2F' : '#2E7D32',
                          fontWeight: 600
                        }}>
                          {c.type === 'emergency' ? (language === 'en' ? 'Emergency' : 'आपत्कालीन') : (language === 'en' ? 'Official' : 'कार्यालयीन')}
                        </span>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-secondary-text)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Delete contact"
                        >
                          <Trash2 size={15} color="#D32F2F" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Fund Transactions Ledger Management */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {language === 'en' ? 'Fund Transactions Ledger' : 'गाव निधी जमा-खर्च लेजर'}
                  </h3>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    setFundError(null);
                    setFundForm({
                      description: '',
                      amount: '',
                      transaction_type: 'expense',
                      transaction_date: new Date().toISOString().split('T')[0]
                    });
                    setIsFundsModalOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> {language === 'en' ? 'Log Transaction' : 'व्यवहार नोंदवा'}
                </Button>
              </div>

              {/* Fund Summary Badges */}
              {(() => {
                const totalInc = fundsList.filter(f => (f.transaction_type || f.type) === 'income').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
                const totalExp = fundsList.filter(f => (f.transaction_type || f.type) === 'expense').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
                const bal = totalInc - totalExp;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' }}>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(46, 125, 50, 0.08)', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#2E7D32', fontWeight: 600 }}>{language === 'en' ? 'Income' : 'एकूण जमा'}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2E7D32' }}>{formatCurrency(totalInc)}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(211, 47, 47, 0.08)', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#D32F2F', fontWeight: 600 }}>{language === 'en' ? 'Expense' : 'एकूण खर्च'}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#D32F2F' }}>{formatCurrency(totalExp)}</div>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(2, 136, 209, 0.08)', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#0288D1', fontWeight: 600 }}>{language === 'en' ? 'Balance' : 'शिल्लक निधी'}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0288D1' }}>{formatCurrency(bal)}</div>
                    </div>
                  </div>
                );
              })()}

              {fundsList.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-secondary-text)', fontSize: '0.875rem' }}>
                  {language === 'en' ? 'No financial transactions logged yet.' : 'कोणतेही निधी व्यवहार अद्याप नोंदवलेले नाहीत.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '310px', overflowY: 'auto' }}>
                  {fundsList.map((f) => {
                    const isInc = (f.transaction_type || f.type) === 'income';
                    return (
                      <div
                        key={f.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-light)',
                          backgroundColor: '#FAFAFA',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ flex: 1, marginRight: '10px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {f.description}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', marginTop: '2px' }}>
                            {formatDate(f.transaction_date)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: isInc ? '#2E7D32' : '#D32F2F'
                          }}>
                            {isInc ? '+' : '-'}{formatCurrency(f.amount)}
                          </span>
                          <button
                            onClick={() => handleDeleteFundTransaction(f.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-secondary-text)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete transaction"
                          >
                            <Trash2 size={15} color="#D32F2F" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* Modal: Add New Contact */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={language === 'en' ? 'Add Village Contact' : 'नवीन संपर्क जोडा'}
        maxWidth="460px"
      >
        <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {contactError && <Alert variant="error" message={contactError} />}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
              {language === 'en' ? 'Full Name' : 'पूर्ण नाव'} *
            </label>
            <input
              type="text"
              required
              value={contactForm.name}
              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Ramesh Patil"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
              {language === 'en' ? 'Designation / Role' : 'पद / हुद्दा'} *
            </label>
            <input
              type="text"
              required
              value={contactForm.designation}
              onChange={(e) => setContactForm(prev => ({ ...prev, designation: e.target.value }))}
              placeholder="e.g. सरपंच / Sarpanch"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
              {language === 'en' ? 'Mobile / Phone Number' : 'मोबाईल क्रमांक'} *
            </label>
            <input
              type="tel"
              required
              value={contactForm.phone}
              onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. 9876543210"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
              {language === 'en' ? 'Contact Type' : 'संपर्क प्रकार'}
            </label>
            <select
              value={contactForm.type}
              onChange={(e) => setContactForm(prev => ({ ...prev, type: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem'
              }}
            >
              <option value="village">{language === 'en' ? 'Village / Panchayat' : 'ग्रामपंचायत अधिकारी'}</option>
              <option value="emergency">{language === 'en' ? 'Emergency' : 'आपत्कालीन'}</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsContactModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSavingContact}>
              {isSavingContact ? <LoadingSpinner size="sm" /> : (language === 'en' ? 'Save Contact' : 'जतन करा')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Fund Transaction */}
      <Modal
        isOpen={isFundsModalOpen}
        onClose={() => setIsFundsModalOpen(false)}
        title={language === 'en' ? 'Log Fund Transaction' : 'निधी व्यवहार नोंदवा'}
        maxWidth="480px"
      >
        <form onSubmit={handleAddFundTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fundError && <Alert variant="error" message={fundError} />}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
              {language === 'en' ? 'Transaction Type' : 'व्यवहार प्रकार'} *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setFundForm(prev => ({ ...prev, transaction_type: 'expense' }))}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: fundForm.transaction_type === 'expense' ? '2px solid #D32F2F' : '1px solid var(--color-border)',
                  backgroundColor: fundForm.transaction_type === 'expense' ? 'rgba(211, 47, 47, 0.08)' : 'transparent',
                  color: fundForm.transaction_type === 'expense' ? '#D32F2F' : 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {language === 'en' ? 'Expense (-)' : 'खर्च (-)'}
              </button>
              <button
                type="button"
                onClick={() => setFundForm(prev => ({ ...prev, transaction_type: 'income' }))}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: fundForm.transaction_type === 'income' ? '2px solid #2E7D32' : '1px solid var(--color-border)',
                  backgroundColor: fundForm.transaction_type === 'income' ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                  color: fundForm.transaction_type === 'income' ? '#2E7D32' : 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {language === 'en' ? 'Income (+)' : 'जमा (+)'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
              {language === 'en' ? 'Description / Purpose' : 'व्यवहाराचे वर्णन / तपशील'} *
            </label>
            <input
              type="text"
              required
              value={fundForm.description}
              onChange={(e) => setFundForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. रस्ता दुरुस्ती साहित्य खरेदी / राज्य शासन अनुदान"
              style={{
                width: '100%',
                padding: '0.625rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
                {language === 'en' ? 'Amount (₹)' : 'रक्कम (₹)'} *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={fundForm.amount}
                onChange={(e) => setFundForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="e.g. 50000"
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
                {language === 'en' ? 'Date' : 'दिनांक'} *
              </label>
              <input
                type="date"
                required
                value={fundForm.transaction_date}
                onChange={(e) => setFundForm(prev => ({ ...prev, transaction_date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsFundsModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSavingFund}>
              {isSavingFund ? <LoadingSpinner size="sm" /> : (language === 'en' ? 'Record Transaction' : 'नोंदवा')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Village Edit Modal for Citizen Panel Data */}
      <VillageEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        village={selectedVillage}
        onSaveSuccess={handleSaveVillageSuccess}
      />
    </div>
  );
}
