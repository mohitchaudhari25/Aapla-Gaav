-- ============================================================================
-- AAPLAGAAV - GOVERNMENT SCHEMES MODULE SCHEMA MIGRATION
-- Table: public.schemes
-- Description: Stores government schemes, eligibility, required documents,
--              application URLs, and publishing status for Citizen App & Admin Panel.
-- ============================================================================

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

-- Index for fast status and created_at filtering
CREATE INDEX IF NOT EXISTS idx_schemes_status ON public.schemes(status);
CREATE INDEX IF NOT EXISTS idx_schemes_created_at ON public.schemes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Citizens and guests can read only published schemes
CREATE POLICY "Public read published schemes"
ON public.schemes
FOR SELECT
USING (status = 'published');

-- Policy 2: Authenticated Administrators have full access to view all schemes (including drafts)
CREATE POLICY "Admins full read access to schemes"
ON public.schemes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
);

-- Policy 3: Authenticated Administrators can create, update, and delete schemes
CREATE POLICY "Admins manage schemes"
ON public.schemes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
);

-- Seed initial popular government schemes
INSERT INTO public.schemes (
    id, title, short_description, description, image_url, category,
    eligibility, documents, start_date, end_date, application_url, beneficiaries, status
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'शासकीय मोफत शिलाई मशीन योजना',
    'ग्रामीण महिलांना स्वयंरोजगारासाठी मोफत शिलाई मशीन वाटप व प्रशिक्षण',
    'ग्रामीण भागातील आर्थिकदृष्ट्या दुर्बल व गरजू महिलांना स्वावलंबी बनवण्यासाठी शासनाकडून मोफत शिलाई मशीन वाटप करण्यात येते. सोबतच कौशल्य विकासासाठी मोफत प्रशिक्षण दिले जाते.',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    'महिला सबलीकरण',
    'वय १८ ते ५० वर्षे\nगावातील कायमस्वरूपी रहिवासी\nकुटुंबाचे वार्षिक उत्पन्न ₹१,००,००० पेक्षा कमी',
    'आधार कार्ड\nउत्पन्नाचा दाखला\nरेशन कार्ड\nपासपोर्ट साईझ फोटो',
    '2026-01-01',
    '2026-12-31',
    'https://mahadbt.maharashtra.gov.in',
    'ग्रामीण महिला',
    'published'
),
(
    '22222222-2222-2222-2222-222222222222',
    'महाडीबीटी कृषी यांत्रिकीकरण योजना',
    'शेती अवजारे, ट्रॅक्टर व ठिबक सिंचनासाठी ५०% ते ८०% थेट शासकीय अनुदान',
    'शेतकऱ्यांना शेतीची आधुनिक अवजारे खरेदीसाठी ५०% ते ८०% थेट अनुदान पुरवले जाते. यामुळे शेतीची उत्पादकता वाढण्यास मदत होते.',
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80',
    'कृषी विकास',
    'स्वतःच्या नावावर शेतजमीन असावी\n७/१२ व ८-अ उतारा उपलब्ध असावा\nबँक खाते आधार लिंक असावे',
    '७/१२ उतारा व ८-अ\nआधार कार्ड\nबँक पासबुक झेरॉक्स\nखरेदी कोटेशन',
    '2026-01-01',
    '2026-12-31',
    'https://mahadbt.maharashtra.gov.in',
    'सर्व शेतकरी बंधू',
    'published'
),
(
    '33333333-3333-3333-3333-333333333333',
    'पीएम किसान सन्मान निधी योजना',
    'पात्र शेतकऱ्यांना वार्षिक ₹६,००० थेट बँक खात्यात - ई-केवायसी पडताळणी सुरू',
    'पंतप्रधान किसान सन्मान निधी योजनेअंतर्गत पात्र शेतकरी कुटुंबांना दर ४ महिन्यांनी ₹२,००० याप्रमाणे वर्षाला एकूण ₹६,००० थेट आधार लिंक बँक खात्यात जमा केले जातात.',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    'थेट निधी सहाय्य',
    'नोंदणीकृत शेतकरी कुटुंब\nई-केवायसी पूर्ण केलेले असावे\nसंस्थात्मक शेतजमीन नसावी',
    'आधार कार्ड\nजमिनीची कागदपत्रे (७/१२)\nबँक खाते तपशील',
    '2026-01-01',
    '2026-12-31',
    'https://pmkisan.gov.in',
    'लहान व सीमांत शेतकरी',
    'published'
),
(
    '44444444-4444-4444-4444-444444444444',
    'जल जीवन मिशन - हर घर जल योजना',
    'गावातील प्रत्येक कुटुंबाला शुद्ध पिण्याच्या पाण्याचे नळ जोडणी काम प्रगतिपथावर',
    'प्रत्येक ग्रामीण कुटुंबाला दरडोई दररोज ५५ लिटर शुद्ध व सुरक्षित पिण्याचे पाणी नळाद्वारे पुरवणे हे या मिशनचे उद्दिष्ट आहे.',
    'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=600&auto=format&fit=crop&q=80',
    'ग्राम विकास',
    'गावातील सर्व रहिवासी कुटुंबे\nग्रामपंचायत हद्दीतील घरे',
    'रहिवासी पुरावा\nग्रामपंचायत कर पावती\nआधार कार्ड',
    '2026-01-01',
    '2026-12-31',
    'https://jaljeevanmission.gov.in',
    'सर्व ग्रामस्थ',
    'published'
)
ON CONFLICT (id) DO NOTHING;

