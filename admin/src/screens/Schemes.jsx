import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Archive,
  ExternalLink,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Copy,
  Check,
  X
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

const PRESET_SCHEME_IMAGES = [
  { label: 'शिलाई मशीन / महिला (Women)', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80' },
  { label: 'कृषी अवजारे / शेती (Agriculture)', url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80' },
  { label: 'पीएम किसान / निधी (Farmers)', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80' },
  { label: 'जल जीवन / पाणी पुरवठा (Water)', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=600&auto=format&fit=crop&q=80' },
  { label: 'आरोग्य / रुग्णसेवा (Health)', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80' },
  { label: 'शिक्षण / कौशल्य (Education)', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80' },
];

const DEFAULT_SCHEMES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'शासकीय मोफत शिलाई मशीन योजना',
    short_description: 'ग्रामीण महिलांना स्वयंरोजगारासाठी मोफत शिलाई मशीन वाटप व प्रशिक्षण',
    description: 'ग्रामीण भागातील आर्थिकदृष्ट्या दुर्बल व गरजू महिलांना स्वावलंबी बनवण्यासाठी शासनाकडून मोफत शिलाई मशीन वाटप करण्यात येते. सोबतच कौशल्य विकासासाठी मोफत प्रशिक्षण दिले जाते.',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    category: 'महिला सबलीकरण',
    eligibility: 'वय १८ ते ५० वर्षे\nगावातील कायमस्वरूपी रहिवासी\nकुटुंबाचे वार्षिक उत्पन्न ₹१,००,००० पेक्षा कमी',
    documents: 'आधार कार्ड\nउत्पन्नाचा दाखला\nरेशन कार्ड\nपासपोर्ट साईझ फोटो',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    application_url: 'https://mahadbt.maharashtra.gov.in',
    beneficiaries: 'ग्रामीण महिला',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'महाडीबीटी कृषी यांत्रिकीकरण योजना',
    short_description: 'शेती अवजारे, ट्रॅक्टर व ठिबक सिंचनासाठी ५०% ते ८०% थेट शासकीय अनुदान',
    description: 'शेतकऱ्यांना शेतीची आधुनिक अवजारे खरेदीसाठी ५०% ते ८०% थेट अनुदान पुरवले जाते. यामुळे शेतीची उत्पादकता वाढण्यास मदत होते.',
    image_url: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    category: 'कृषी विकास',
    eligibility: 'स्वतःच्या नावावर शेतजमीन असावी\n७/१२ व ८-अ उतारा उपलब्ध असावा\nबँक खाते आधार लिंक असावे',
    documents: '७/१२ उतारा व ८-अ\nआधार कार्ड\nबँक पासबुक झेरॉक्स\nखरेदी कोटेशन',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    application_url: 'https://mahadbt.maharashtra.gov.in',
    beneficiaries: 'सर्व शेतकरी बंधू',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'पीएम किसान सन्मान निधी योजना',
    short_description: 'पात्र शेतकऱ्यांना वार्षिक ₹६,००० थेट बँक खात्यात - ई-केवायसी पडताळणी सुरू',
    description: 'पंतप्रधान किसान सन्मान निधी योजनेअंतर्गत पात्र शेतकरी कुटुंबांना दर ४ महिन्यांनी ₹२,००० याप्रमाणे वर्षाला एकूण ₹६,००० थेट आधार लिंक बँक खात्यात जमा केले जातात.',
    image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    category: 'थेट निधी सहाय्य',
    eligibility: 'नोंदणीकृत शेतकरी कुटुंब\nई-केवायसी पूर्ण केलेले असावे\nसंस्थात्मक शेतजमीन नसावी',
    documents: 'आधार कार्ड\nजमिनीची कागदपत्रे (७/१२)\nबँक खाते तपशील',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    application_url: 'https://pmkisan.gov.in',
    beneficiaries: 'लहान व सीमांत शेतकरी',
    status: 'published',
    created_at: new Date().toISOString()
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'जल जीवन मिशन - हर घर जल योजना',
    short_description: 'गावातील प्रत्येक कुटुंबाला शुद्ध पिण्याच्या पाण्याचे नळ जोडणी काम प्रगतिपथावर',
    description: 'प्रत्येक ग्रामीण कुटुंबाला दरडोई दररोज ५५ लिटर शुद्ध व सुरक्षित पिण्याचे पाणी नळाद्वारे पुरवणे हे या मिशनचे उद्दिष्ट आहे.',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=600&auto=format&fit=crop&q=80',
    category: 'ग्राम विकास',
    eligibility: 'गावातील सर्व रहिवासी कुटुंबे\nग्रामपंचायत हद्दीतील घरे',
    documents: 'रहिवासी पुरावा\nग्रामपंचायत कर पावती\nआधार कार्ड',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    application_url: 'https://jaljeevanmission.gov.in',
    beneficiaries: 'सर्व ग्रामस्थ',
    status: 'published',
    created_at: new Date().toISOString()
  }
];

export default function Schemes() {
  const { villageId, user } = useAuth();
  const { language } = useSettings();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbNotice, setDbNotice] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = () => {
    const sqlText = `-- AAPLAGAAV - CREATE SCHEMES TABLE (Run in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category VARCHAR(100) DEFAULT 'General',
    eligibility TEXT,
    documents TEXT,
    start_date DATE,
    end_date DATE,
    application_url TEXT,
    beneficiaries VARCHAR(255),
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schemes_status ON public.schemes(status);
CREATE INDEX IF NOT EXISTS idx_schemes_created ON public.schemes(created_at DESC);

ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schemes_select_policy" ON public.schemes FOR SELECT USING (true);
CREATE POLICY "schemes_admin_policy" ON public.schemes FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    image_url: '',
    category: 'कृषी विकास',
    eligibility: '',
    documents: '',
    start_date: '',
    end_date: '',
    application_url: '',
    beneficiaries: '',
    status: 'published'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Fetch schemes from Supabase with fallback to local storage
  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('schemes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        // Table not created yet or RLS issue: fallback to localStorage
        console.warn('Schemes table not found in Supabase or query failed:', fetchErr.message);
        setDbNotice(language === 'en' ? 'Note: Run create_schemes_table.sql to create the "schemes" table in Supabase. Schemes are currently saved locally.' : 'नोंद: डेटाबेसमध्ये "schemes" टेबल तयार करण्यासाठी create_schemes_table.sql चालवा. सध्यातरी योजना स्थानिकरित्या जतन केल्या जात आहेत.');
        const saved = localStorage.getItem('aapla_admin_schemes');
        if (saved) {
          setSchemes(JSON.parse(saved));
        } else {
          setSchemes(DEFAULT_SCHEMES);
          localStorage.setItem('aapla_admin_schemes', JSON.stringify(DEFAULT_SCHEMES));
        }
      } else {
        setDbNotice(null);
        if (data && data.length > 0) {
          setSchemes(data);
          localStorage.setItem('aapla_admin_schemes', JSON.stringify(data));
        } else {
          // If table exists but empty, initialize with default schemes
          setSchemes(DEFAULT_SCHEMES);
        }
      }
    } catch (err) {
      console.warn('Error fetching schemes:', err);
      const saved = localStorage.getItem('aapla_admin_schemes');
      setSchemes(saved ? JSON.parse(saved) : DEFAULT_SCHEMES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemes();

    // Subscribe to realtime if supported
    try {
      const channel = supabase
        .channel('admin-schemes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes' }, () => {
          fetchSchemes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {}
  }, [fetchSchemes]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingScheme(null);
    setFormData({
      title: '',
      short_description: '',
      description: '',
      image_url: PRESET_SCHEME_IMAGES[0].url,
      category: 'कृषी विकास',
      eligibility: '',
      documents: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      application_url: '',
      beneficiaries: '',
      status: 'published'
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (scheme) => {
    setEditingScheme(scheme);
    setFormData({
      title: scheme.title || '',
      short_description: scheme.short_description || '',
      description: scheme.description || '',
      image_url: scheme.image_url || PRESET_SCHEME_IMAGES[0].url,
      category: scheme.category || 'कृषी विकास',
      eligibility: scheme.eligibility || '',
      documents: scheme.documents || '',
      start_date: scheme.start_date || '',
      end_date: scheme.end_date || '',
      application_url: scheme.application_url || '',
      beneficiaries: scheme.beneficiaries || '',
      status: scheme.status || 'published'
    });
    setFormError(null);
    setIsFormOpen(true);
    if (selectedScheme) setSelectedScheme(null);
  };

  // Submit Form (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.short_description.trim()) {
      setFormError(language === 'en' ? 'Scheme title and short description are required.' : 'कृपया योजनेचे नाव आणि संक्षिप्त माहिती भरा.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      title: formData.title.trim(),
      short_description: formData.short_description.trim(),
      description: formData.description.trim() || null,
      image_url: formData.image_url.trim() || PRESET_SCHEME_IMAGES[0].url,
      category: formData.category,
      eligibility: formData.eligibility.trim() || null,
      documents: formData.documents.trim() || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      application_url: formData.application_url.trim() || null,
      beneficiaries: formData.beneficiaries.trim() || null,
      status: formData.status,
      village_id: villageId || null,
      updated_at: new Date().toISOString()
    };

    try {
      let savedRecord = null;
      let usedLocal = false;

      // Try Supabase first
      if (editingScheme?.id && !editingScheme.id.startsWith('local-')) {
        const { data, error: updateErr } = await supabase
          .from('schemes')
          .update(payload)
          .eq('id', editingScheme.id)
          .select()
          .single();

        if (!updateErr && data) {
          savedRecord = data;
        } else {
          usedLocal = true;
        }
      } else {
        const { data, error: insertErr } = await supabase
          .from('schemes')
          .insert({ ...payload, created_by: user?.id || null })
          .select()
          .single();

        if (!insertErr && data) {
          savedRecord = data;
        } else {
          usedLocal = true;
        }
      }

      // If Supabase failed or table doesn't exist, update local state & localStorage
      if (usedLocal || !savedRecord) {
        if (editingScheme) {
          savedRecord = { ...editingScheme, ...payload, updated_at: new Date().toISOString() };
          setSchemes(prev => prev.map(s => s.id === editingScheme.id ? savedRecord : s));
        } else {
          savedRecord = {
            id: 'scheme-' + Date.now(),
            ...payload,
            created_at: new Date().toISOString()
          };
          setSchemes(prev => [savedRecord, ...prev]);
        }

        // Persist to localStorage
        const currentLocal = JSON.parse(localStorage.getItem('aapla_admin_schemes') || '[]');
        const updatedLocal = editingScheme
          ? currentLocal.map(s => s.id === editingScheme.id ? savedRecord : s)
          : [savedRecord, ...currentLocal];
        localStorage.setItem('aapla_admin_schemes', JSON.stringify(updatedLocal));
      } else {
        // Real database save succeeded: refresh state
        fetchSchemes();
      }

      setActionSuccessMsg(
        editingScheme
          ? (language === 'en' ? 'Scheme updated successfully!' : 'योजना यशस्वीरित्या अद्ययावत केली!')
          : (language === 'en' ? 'New scheme created successfully!' : 'नवीन योजना यशस्वीरित्या जोडली!')
      );
      setIsFormOpen(false);

      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error saving scheme:', err);
      setFormError(err.message || 'योजना जतन करताना त्रुटी आली.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish / Unpublish Status
  const handleToggleStatus = async (scheme) => {
    const nextStatus = scheme.status === 'published' ? 'draft' : 'published';
    try {
      const { error: statusErr } = await supabase
        .from('schemes')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', scheme.id);

      if (statusErr) {
        // Fallback update locally
        setSchemes(prev => prev.map(s => s.id === scheme.id ? { ...s, status: nextStatus } : s));
        const saved = JSON.parse(localStorage.getItem('aapla_admin_schemes') || '[]');
        const updated = saved.map(s => s.id === scheme.id ? { ...s, status: nextStatus } : s);
        localStorage.setItem('aapla_admin_schemes', JSON.stringify(updated));
      } else {
        fetchSchemes();
      }

      setActionSuccessMsg(
        nextStatus === 'published'
          ? (language === 'en' ? 'Scheme published to Citizen App!' : 'योजना नागरिक अ‍ॅपवर प्रकाशित केली!')
          : (language === 'en' ? 'Scheme unpublished (moved to Draft).' : 'योजना अप्रकाशित केली (मसुदा स्वरूपात हलवली).')
      );
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (e) {
      console.warn('Status toggle error:', e);
    }
  };

  // Delete Scheme with confirmation
  const handleDeleteScheme = async (scheme) => {
    if (!window.confirm(`नक्की "${scheme.title}" ही योजना हटवायची आहे का?\nAre you sure you want to delete this scheme?`)) {
      return;
    }

    try {
      const { error: delErr } = await supabase
        .from('schemes')
        .delete()
        .eq('id', scheme.id);

      if (delErr) {
        // Fallback delete locally
        setSchemes(prev => prev.filter(s => s.id !== scheme.id));
        const saved = JSON.parse(localStorage.getItem('aapla_admin_schemes') || '[]');
        const updated = saved.filter(s => s.id !== scheme.id);
        localStorage.setItem('aapla_admin_schemes', JSON.stringify(updated));
      } else {
        fetchSchemes();
      }

      if (selectedScheme?.id === scheme.id) setSelectedScheme(null);
      setActionSuccessMsg(language === 'en' ? 'Scheme deleted successfully.' : 'योजना यशस्वीरित्या हटवली.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Delete scheme error:', err);
      alert('योजना हटवताना त्रुटी आली.');
    }
  };

  // Filter schemes
  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      // Status filter
      if (activeFilter === 'PUBLISHED' && s.status !== 'published') return false;
      if (activeFilter === 'DRAFT' && s.status !== 'draft') return false;
      if (activeFilter === 'ARCHIVED' && s.status !== 'archived') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (s.title || '').toLowerCase().includes(q);
        const descMatch = (s.short_description || '').toLowerCase().includes(q);
        const catMatch = (s.category || '').toLowerCase().includes(q);
        const benMatch = (s.beneficiaries || '').toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch || benMatch;
      }
      return true;
    });
  }, [schemes, activeFilter, searchQuery]);

  // Status Metrics
  const metrics = useMemo(() => {
    const total = schemes.length;
    const published = schemes.filter(s => s.status === 'published').length;
    const draft = schemes.filter(s => s.status === 'draft').length;
    const archived = schemes.filter(s => s.status === 'archived').length;
    return { total, published, draft, archived };
  }, [schemes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-pale)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
              {language === 'en' ? 'Government Schemes Management' : 'शासकीय योजना व्यवस्थापन'}
            </h1>
          </div>
        </div>

        <div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            {language === 'en' ? 'Add New Scheme' : 'नवीन योजना जोडा'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMsg && (
        <Alert type="success">
          {actionSuccessMsg}
        </Alert>
      )}

      {dbNotice && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#FFF8E1',
            border: '1px solid #FFE082',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: '#795548',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
            <Sparkles size={18} color="#FF8F00" style={{ flexShrink: 0 }} />
            <span>{dbNotice}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopySql}
              style={{
                backgroundColor: '#FF8F00',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedSql ? <Check size={12} /> : <Copy size={12} />}
              {copiedSql ? (language === 'en' ? 'Copied!' : 'कॉपी झाले!') : (language === 'en' ? 'Copy SQL' : 'SQL कॉपी करा')}
            </button>
            <button
              onClick={() => setDbNotice(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#795548',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={language === 'en' ? 'Dismiss' : 'बंद करा'}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
            {language === 'en' ? 'Total Schemes' : 'एकूण योजना'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
            {metrics.total}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #2E7D32' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
            {language === 'en' ? 'Published in Citizen App' : 'नागरिक अ‍ॅपवर प्रकाशित'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2E7D32', marginTop: '4px' }}>
            {metrics.published}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #F57C00' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
            {language === 'en' ? 'Drafts (Hidden)' : 'मसुदा (लपवलेले)'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F57C00', marginTop: '4px' }}>
            {metrics.draft}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #757575' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
            {language === 'en' ? 'Archived' : 'आर्काइव्ह'}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#757575', marginTop: '4px' }}>
            {metrics.archived}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary-text)' }}
          />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search schemes by title, category...' : 'योजनेचे नाव, वर्गवारीनुसार शोधा...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px', width: '100%' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: language === 'en' ? 'All' : 'सर्व' },
            { id: 'PUBLISHED', label: language === 'en' ? 'Published' : 'प्रकाशित' },
            { id: 'DRAFT', label: language === 'en' ? 'Draft' : 'मसुदा' },
            { id: 'ARCHIVED', label: language === 'en' ? 'Archived' : 'आर्काइव्ह' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: activeFilter === filter.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeFilter === filter.id ? '#FFFFFF' : 'var(--color-secondary-text)',
                borderColor: activeFilter === filter.id ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'all 0.15s ease',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Table */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" message="योजना लोड होत आहेत..." />
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <EmptyState
            icon={Award}
            title={language === 'en' ? 'No schemes found' : 'कोणतीही योजना आढळली नाही'}
            description={
              searchQuery
                ? (language === 'en' ? 'No schemes match your search query.' : 'शोध निकषानुसार कोणतीही योजना आढळली नाही.')
                : (language === 'en' ? 'Click "Add New Scheme" to publish schemes to Citizen App.' : 'नागरिक अ‍ॅपवर प्रदर्शित करण्यासाठी "नवीन योजना जोडा" वर क्लिक करा.')
            }
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Scheme & Banner' : 'योजना व बॅनर'}</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Category' : 'वर्गवारी'}</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Beneficiaries' : 'लाभार्थी'}</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Deadline' : 'अंतिम मुदत'}</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Status' : 'स्थिती'}</th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>{language === 'en' ? 'Actions' : 'कृती'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchemes.map((scheme) => (
                  <tr key={scheme.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* Title & Thumbnail */}
                    <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#E0E0E0',
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={scheme.image_url || PRESET_SCHEME_IMAGES[0].url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = PRESET_SCHEME_IMAGES[0].url; }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                            {scheme.title}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)', marginTop: '2px', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {scheme.short_description}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--color-primary-pale)',
                          color: 'var(--color-primary)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}
                      >
                        {scheme.category || 'सर्वसाधारण'}
                      </span>
                    </td>

                    {/* Beneficiaries */}
                    <td style={{ padding: '1rem', verticalAlign: 'middle', fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {scheme.beneficiaries || 'सर्व ग्रामस्थ'}
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '1rem', verticalAlign: 'middle', fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>
                      {scheme.end_date ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} />
                          <span>{new Date(scheme.end_date).toLocaleDateString('en-GB')}</span>
                        </div>
                      ) : (
                        <span>{language === 'en' ? 'Ongoing' : 'निरंतर'}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                      {scheme.status === 'published' ? (
                        <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> {language === 'en' ? 'Published' : 'प्रकाशित'}
                        </span>
                      ) : scheme.status === 'draft' ? (
                        <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {language === 'en' ? 'Draft' : 'मसुदा'}
                        </span>
                      ) : (
                        <span style={{ backgroundColor: '#EEEEEE', color: '#616161', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {language === 'en' ? 'Archived' : 'आर्काइव्ह'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {/* View button */}
                        <button
                          title={language === 'en' ? 'View Details' : 'तपशील पहा'}
                          onClick={() => setSelectedScheme(scheme)}
                          className="btn-icon"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={16} color="var(--color-text)" />
                        </button>

                        {/* Edit button */}
                        <button
                          title={language === 'en' ? 'Edit' : 'संपादित करा'}
                          onClick={() => handleOpenEdit(scheme)}
                          className="btn-icon"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={16} color="var(--color-primary)" />
                        </button>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          title={scheme.status === 'published' ? (language === 'en' ? 'Unpublish to Draft' : 'अप्रकाशित करा') : (language === 'en' ? 'Publish to Citizens' : 'प्रकाशित करा')}
                          onClick={() => handleToggleStatus(scheme)}
                          className="btn-icon"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: scheme.status === 'published' ? '#E8F5E9' : 'var(--color-surface)',
                            cursor: 'pointer'
                          }}
                        >
                          {scheme.status === 'published' ? (
                            <Archive size={16} color="#2E7D32" />
                          ) : (
                            <CheckCircle size={16} color="#E65100" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          title={language === 'en' ? 'Delete' : 'हटवा'}
                          onClick={() => handleDeleteScheme(scheme)}
                          className="btn-icon"
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} color="var(--color-error)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW SCHEME DETAILS MODAL */}
      {selectedScheme && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedScheme(null)}
          title={selectedScheme.title}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Banner Image */}
            <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F0F0F0' }}>
              <img
                src={selectedScheme.image_url || PRESET_SCHEME_IMAGES[0].url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Badges & Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8125rem' }}>
                  {selectedScheme.category}
                </span>
                <span style={{ backgroundColor: '#F5F5F5', color: '#616161', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem' }}>
                  👥 {selectedScheme.beneficiaries || 'सर्व नागरिक'}
                </span>
              </div>

              {selectedScheme.status === 'published' ? (
                <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {language === 'en' ? '✓ Live on Citizen App' : '✓ नागरिक अ‍ॅपवर थेट सुरू'}
                </span>
              ) : (
                <span style={{ backgroundColor: '#FFF3E0', color: '#E65100', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {language === 'en' ? 'Draft (Hidden from Citizens)' : 'मसुदा (नागरिकांना दृश्यमान नाही)'}
                </span>
              )}
            </div>

            {/* Detailed Description */}
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '6px' }}>
                {language === 'en' ? 'Scheme Details:' : 'योजनेचे सविस्तर स्वरूप:'}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary-text)', lineHeight: 1.6, margin: 0 }}>
                {selectedScheme.description || selectedScheme.short_description}
              </p>
            </div>

            {/* Eligibility Criteria */}
            {selectedScheme.eligibility && (
              <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> {language === 'en' ? 'Eligibility Criteria:' : 'पात्रता निकष:'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedScheme.eligibility.split('\n').filter(Boolean).map((line, idx) => (
                    <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--color-text)', display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Documents */}
            {selectedScheme.documents && (
              <div style={{ backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> {language === 'en' ? 'Required Documents:' : 'आवश्यक कागदपत्रे:'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedScheme.documents.split('\n').filter(Boolean).map((line, idx) => (
                    <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--color-text)', display: 'flex', gap: '6px' }}>
                      <span>📄</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application URL & Dates */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-secondary-text)' }}>
                {selectedScheme.end_date ? (
                  <span>अर्ज अंतिम मुदत: <strong>{new Date(selectedScheme.end_date).toLocaleDateString('en-GB')}</strong></span>
                ) : (
                  <span>अर्ज प्रक्रिया: <strong>सध्या सुरू आहे</strong></span>
                )}
              </div>

              {selectedScheme.application_url && (
                <a
                  href={selectedScheme.application_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <span>{language === 'en' ? 'Open Application Link' : 'अधिकृत अर्ज लिंक उघडा'}</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT SCHEME MODAL */}
      {isFormOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsFormOpen(false)}
          title={editingScheme ? (language === 'en' ? 'Edit Scheme' : 'योजना संपादित करा') : (language === 'en' ? 'Add Government Scheme' : 'नवीन शासकीय योजना जोडा')}
          size="lg"
        >
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {formError && (
              <Alert type="error">{formError}</Alert>
            )}

            {/* 1. Scheme Title */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Scheme Title *' : 'योजनेचे नाव *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'e.g. Free Sewing Machine Assistance Scheme' : 'उदा. शासकीय मोफत शिलाई मशीन सहाय्य'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* 2. Short Description */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Short Description (for Citizen Carousel) *' : 'संक्षिप्त माहिती (नागरिक कॅरोसेलसाठी) *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'e.g. Self-employment support and equipment for rural women' : 'उदा. ग्रामीण महिला स्वयंरोजगार माहिती व मोफत वाटप'}
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                {language === 'en' ? 'Displayed on citizen home screen slider (max 120 chars).' : 'नागरिक अ‍ॅपवरील होम स्क्रीन स्लाइडरवर ही माहिती दिसेल (कमाल १२० अक्षरे).'}
              </span>
            </div>

            {/* 3. Category & Target Beneficiaries */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {language === 'en' ? 'Category *' : 'वर्गवारी *'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="कृषी विकास">{language === 'en' ? 'Agriculture' : 'कृषी विकास'}</option>
                  <option value="महिला सबलीकरण">{language === 'en' ? 'Women Empowerment' : 'महिला सबलीकरण'}</option>
                  <option value="थेट निधी सहाय्य">{language === 'en' ? 'Direct Benefit' : 'थेट निधी सहाय्य'}</option>
                  <option value="आरोग्य व पोषण">{language === 'en' ? 'Health & Nutrition' : 'आरोग्य व पोषण'}</option>
                  <option value="शिक्षण व कौशल्य">{language === 'en' ? 'Education & Skill' : 'शिक्षण व कौशल्य'}</option>
                  <option value="ग्राम विकास">{language === 'en' ? 'Village Development' : 'ग्राम विकास'}</option>
                  <option value="इतर">{language === 'en' ? 'General' : 'इतर'}</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {language === 'en' ? 'Target Beneficiaries' : 'लक्ष्य लाभार्थी'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'en' ? 'e.g. Rural women / Small farmers' : 'उदा. ग्रामीण महिला / लहान शेतकरी'}
                  value={formData.beneficiaries}
                  onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* 4. Banner Image with Quick Presets */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Scheme Banner Image URL' : 'बॅनर फोटो (URL)'}
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="form-input"
                style={{ width: '100%', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', alignSelf: 'center' }}>{language === 'en' ? 'Select preset image:' : 'तयार फोटो निवडा:'}</span>
                {PRESET_SCHEME_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: preset.url })}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: '1px solid var(--color-border)',
                      backgroundColor: formData.image_url === preset.url ? 'var(--color-primary-pale)' : 'var(--color-surface)',
                      color: formData.image_url === preset.url ? 'var(--color-primary)' : 'var(--color-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Detailed Description */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Full Description' : 'सविस्तर माहिती'}
              </label>
              <textarea
                rows={3}
                placeholder={language === 'en' ? 'Full scheme description, objectives and citizen benefits...' : 'योजनेची पूर्ण माहिती, उद्दिष्टे व लाभ...'}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* 6. Eligibility Criteria & Documents */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {language === 'en' ? 'Eligibility Criteria (one per line)' : 'पात्रता निकष (एका ओळीत एक)'}
                </label>
                <textarea
                  rows={3}
                  placeholder="उदा. वय १८ ते ५० वर्षे&#10;गावातील रहिवासी&#10;वार्षिक उत्पन्न १ लाखापेक्षा कमी"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {language === 'en' ? 'Required Documents (one per line)' : 'आवश्यक कागदपत्रे (एका ओळीत एक)'}
                </label>
                <textarea
                  rows={3}
                  placeholder="उदा. आधार कार्ड&#10;उत्पन्नाचा दाखला&#10;रेशन कार्ड&#10;बँक पासबुक"
                  value={formData.documents}
                  onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* 7. Dates & Official URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  अर्ज सुरू तारीख
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  अर्ज अंतिम मुदत
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  {language === 'en' ? 'Publication Status *' : 'प्रकाशन स्थिती *'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-select"
                  style={{ width: '100%' }}
                >
                  <option value="published">{language === 'en' ? 'Published (Live on Citizen App)' : 'प्रकाशित करा (नागरिक अ‍ॅपवर थेट)'}</option>
                  <option value="draft">{language === 'en' ? 'Draft (Hidden from Citizens)' : 'मसुदा (अप्रकाशित)'}</option>
                  <option value="archived">{language === 'en' ? 'Archived' : 'आर्काइव्ह'}</option>
                </select>
              </div>
            </div>

            {/* 8. Application URL */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {language === 'en' ? 'Official Application URL' : 'अधिकृत अर्ज संकेतस्थळ लिंक'}
              </label>
              <input
                type="url"
                placeholder="https://mahadbt.maharashtra.gov.in"
                value={formData.application_url}
                onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                {language === 'en' ? 'Cancel' : 'रद्द करा'}
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (language === 'en' ? 'Saving...' : 'जतन करत आहे...') : (editingScheme ? (language === 'en' ? 'Save Changes' : 'बदल जतन करा') : (language === 'en' ? 'Save & Publish Scheme' : 'योजना प्रकाशित करा'))}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

