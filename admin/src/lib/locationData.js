/**
 * Master Location Hierarchy for AaplaGaav Admin Panel
 * Provides official States, Districts, and Talukas (with full Maharashtra coverage)
 * and dynamically integrates with Supabase villages table.
 */

export const INDIAN_STATES = [
  { id: 'Maharashtra', nameMr: 'महाराष्ट्र', nameEn: 'Maharashtra' },
  { id: 'Gujarat', nameMr: 'गुजरात', nameEn: 'Gujarat' },
  { id: 'Goa', nameMr: 'गोवा', nameEn: 'Goa' },
  { id: 'Karnataka', nameMr: 'कर्नाटक', nameEn: 'Karnataka' },
  { id: 'Madhya Pradesh', nameMr: 'मध्य प्रदेश', nameEn: 'Madhya Pradesh' },
  { id: 'Andhra Pradesh', nameMr: 'आंध्र प्रदेश', nameEn: 'Andhra Pradesh' },
  { id: 'Telangana', nameMr: 'तेलंगणा', nameEn: 'Telangana' },
  { id: 'Rajasthan', nameMr: 'राजस्थान', nameEn: 'Rajasthan' },
  { id: 'Uttar Pradesh', nameMr: 'उत्तर प्रदेश', nameEn: 'Uttar Pradesh' },
  { id: 'Delhi', nameMr: 'दिल्ली', nameEn: 'Delhi' },
];

export const MAHARASHTRA_DISTRICTS = [
  {
    id: 'Jalgaon',
    nameMr: 'जळगाव',
    nameEn: 'Jalgaon',
    talukas: [
      { id: 'Jalgaon', nameMr: 'जळगाव', nameEn: 'Jalgaon' },
      { id: 'Bhusawal', nameMr: 'भुसावळ', nameEn: 'Bhusawal' },
      { id: 'Jamner', nameMr: 'जामनेर', nameEn: 'Jamner' },
      { id: 'Pachora', nameMr: 'पाचोरा', nameEn: 'Pachora' },
      { id: 'Dharangaon', nameMr: 'धरणगाव', nameEn: 'Dharangaon' },
      { id: 'Erandol', nameMr: 'एरंडोल', nameEn: 'Erandol' },
      { id: 'Yaval', nameMr: 'यावल', nameEn: 'Yaval' },
      { id: 'Raver', nameMr: 'रावेर', nameEn: 'Raver' },
      { id: 'Chopda', nameMr: 'चोपडा', nameEn: 'Chopda' },
      { id: 'Parola', nameMr: 'पारोळा', nameEn: 'Parola' },
      { id: 'Amalner', nameMr: 'अमळनेर', nameEn: 'Amalner' },
      { id: 'Chalisgaon', nameMr: 'चाळीसगाव', nameEn: 'Chalisgaon' },
      { id: 'Bodwad', nameMr: 'बोधवड', nameEn: 'Bodwad' },
      { id: 'Muktainagar', nameMr: 'मुक्ताईनगर', nameEn: 'Muktainagar' },
      { id: 'Bhadgaon', nameMr: 'भडगाव', nameEn: 'Bhadgaon' },
    ],
  },
  {
    id: 'Pune',
    nameMr: 'पुणे',
    nameEn: 'Pune',
    talukas: [
      { id: 'Haveli', nameMr: 'हवेली', nameEn: 'Haveli' },
      { id: 'Pune City', nameMr: 'पुणे शहर', nameEn: 'Pune City' },
      { id: 'Baramati', nameMr: 'बारामती', nameEn: 'Baramati' },
      { id: 'Shirur', nameMr: 'शिरूर', nameEn: 'Shirur' },
      { id: 'Daund', nameMr: 'दौंड', nameEn: 'Daund' },
      { id: 'Indapur', nameMr: 'इंदापूर', nameEn: 'Indapur' },
      { id: 'Bhor', nameMr: 'भोर', nameEn: 'Bhor' },
      { id: 'Velhe', nameMr: 'वेल्हे', nameEn: 'Velhe' },
      { id: 'Purandar', nameMr: 'पुरंदर', nameEn: 'Purandar' },
      { id: 'Maval', nameMr: 'मावळ', nameEn: 'Maval' },
      { id: 'Mulshi', nameMr: 'मुळशी', nameEn: 'Mulshi' },
      { id: 'Khed', nameMr: 'खेड', nameEn: 'Khed' },
      { id: 'Ambegaon', nameMr: 'आंबेगाव', nameEn: 'Ambegaon' },
      { id: 'Junnar', nameMr: 'जुन्नर', nameEn: 'Junnar' },
    ],
  },
  {
    id: 'Nashik',
    nameMr: 'नाशिक',
    nameEn: 'Nashik',
    talukas: [
      { id: 'Nashik', nameMr: 'नाशिक', nameEn: 'Nashik' },
      { id: 'Niphad', nameMr: 'निफाड', nameEn: 'Niphad' },
      { id: 'Sinnar', nameMr: 'सिन्नर', nameEn: 'Sinnar' },
      { id: 'Dindori', nameMr: 'दिंडोरी', nameEn: 'Dindori' },
      { id: 'Igatpuri', nameMr: 'इगतपुरी', nameEn: 'Igatpuri' },
      { id: 'Trimbakeshwar', nameMr: 'त्र्यंबकेश्वर', nameEn: 'Trimbakeshwar' },
      { id: 'Kalwan', nameMr: 'कळवण', nameEn: 'Kalwan' },
      { id: 'Baglan', nameMr: 'बागलाण', nameEn: 'Baglan' },
      { id: 'Malegaon', nameMr: 'मालेगाव', nameEn: 'Malegaon' },
      { id: 'Chandwad', nameMr: 'चांदवड', nameEn: 'Chandwad' },
      { id: 'Deola', nameMr: 'देवळा', nameEn: 'Deola' },
      { id: 'Nandgaon', nameMr: 'नांदगाव', nameEn: 'Nandgaon' },
      { id: 'Yeola', nameMr: 'येवला', nameEn: 'Yeola' },
      { id: 'Surgana', nameMr: 'सुरगाणा', nameEn: 'Surgana' },
      { id: 'Peint', nameMr: 'पेठ', nameEn: 'Peint' },
    ],
  },
  {
    id: 'Chhatrapati Sambhajinagar',
    nameMr: 'छत्रपती संभाजीनगर',
    nameEn: 'Chhatrapati Sambhajinagar',
    talukas: [
      { id: 'Chhatrapati Sambhajinagar', nameMr: 'छत्रपती संभाजीनगर', nameEn: 'Chhatrapati Sambhajinagar' },
      { id: 'Paithan', nameMr: 'पैठण', nameEn: 'Paithan' },
      { id: 'Vaijapur', nameMr: 'वैजापूर', nameEn: 'Vaijapur' },
      { id: 'Gangapur', nameMr: 'गंगापूर', nameEn: 'Gangapur' },
      { id: 'Khuldabad', nameMr: 'खुलताबाद', nameEn: 'Khuldabad' },
      { id: 'Sillod', nameMr: 'सिल्लोड', nameEn: 'Sillod' },
      { id: 'Kannad', nameMr: 'कन्नड', nameEn: 'Kannad' },
      { id: 'Phulambri', nameMr: 'फुलंब्री', nameEn: 'Phulambri' },
      { id: 'Soegaon', nameMr: 'सोयगाव', nameEn: 'Soegaon' },
    ],
  },
  {
    id: 'Ahilyanagar',
    nameMr: 'अहिल्यानगर',
    nameEn: 'Ahilyanagar',
    talukas: [
      { id: 'Nagar', nameMr: 'नगर', nameEn: 'Nagar' },
      { id: 'Rahuri', nameMr: 'राहुरी', nameEn: 'Rahuri' },
      { id: 'Shrirampur', nameMr: 'श्रीरामपूर', nameEn: 'Shrirampur' },
      { id: 'Nevasa', nameMr: 'नेवासा', nameEn: 'Nevasa' },
      { id: 'Shevgaon', nameMr: 'शेवगाव', nameEn: 'Shevgaon' },
      { id: 'Pathardi', nameMr: 'पाथर्डी', nameEn: 'Pathardi' },
      { id: 'Jamkhed', nameMr: 'जामखेड', nameEn: 'Jamkhed' },
      { id: 'Karjat', nameMr: 'कर्जत', nameEn: 'Karjat' },
      { id: 'Shrigonda', nameMr: 'श्रीगोंदा', nameEn: 'Shrigonda' },
      { id: 'Parner', nameMr: 'पारनेर', nameEn: 'Parner' },
      { id: 'Sangamner', nameMr: 'संगमनेर', nameEn: 'Sangamner' },
      { id: 'Akole', nameMr: 'अकोले', nameEn: 'Akole' },
      { id: 'Kopargaon', nameMr: 'कोपरगाव', nameEn: 'Kopargaon' },
      { id: 'Rahata', nameMr: 'राहाता', nameEn: 'Rahata' },
    ],
  },
  {
    id: 'Kolhapur',
    nameMr: 'कोल्हापूर',
    nameEn: 'Kolhapur',
    talukas: [
      { id: 'Karvir', nameMr: 'करवीर', nameEn: 'Karvir' },
      { id: 'Panhala', nameMr: 'पन्हाळा', nameEn: 'Panhala' },
      { id: 'Shahuwadi', nameMr: 'शाहूवाडी', nameEn: 'Shahuwadi' },
      { id: 'Kagal', nameMr: 'कागल', nameEn: 'Kagal' },
      { id: 'Hatkanangale', nameMr: 'हातकणंगले', nameEn: 'Hatkanangale' },
      { id: 'Shirol', nameMr: 'शिरोळ', nameEn: 'Shirol' },
      { id: 'Radhanagari', nameMr: 'राधानगरी', nameEn: 'Radhanagari' },
      { id: 'Gaganbawda', nameMr: 'गगनबावडा', nameEn: 'Gaganbawda' },
      { id: 'Bhudargad', nameMr: 'भुदरगड', nameEn: 'Bhudargad' },
      { id: 'Gadhinglaj', nameMr: 'गडहिंग्लज', nameEn: 'Gadhinglaj' },
      { id: 'Ajra', nameMr: 'आजरा', nameEn: 'Ajra' },
      { id: 'Chandgad', nameMr: 'चंदगड', nameEn: 'Chandgad' },
    ],
  },
  {
    id: 'Satara',
    nameMr: 'सातारा',
    nameEn: 'Satara',
    talukas: [
      { id: 'Satara', nameMr: 'सातारा', nameEn: 'Satara' },
      { id: 'Wai', nameMr: 'वाई', nameEn: 'Wai' },
      { id: 'Mahabaleshwar', nameMr: 'महाबळेश्वर', nameEn: 'Mahabaleshwar' },
      { id: 'Koregaon', nameMr: 'कोरेगाव', nameEn: 'Koregaon' },
      { id: 'Karad', nameMr: 'कराड', nameEn: 'Karad' },
      { id: 'Patan', nameMr: 'पाटण', nameEn: 'Patan' },
      { id: 'Phaltan', nameMr: 'फलटण', nameEn: 'Phaltan' },
      { id: 'Khatav', nameMr: 'खटाव', nameEn: 'Khatav' },
      { id: 'Man', nameMr: 'माण', nameEn: 'Man' },
      { id: 'Jaoli', nameMr: 'जावळी', nameEn: 'Jaoli' },
      { id: 'Khandala', nameMr: 'खंडाळा', nameEn: 'Khandala' },
    ],
  },
  {
    id: 'Sangli',
    nameMr: 'सांगली',
    nameEn: 'Sangli',
    talukas: [
      { id: 'Miraj', nameMr: 'मिरज', nameEn: 'Miraj' },
      { id: 'Tasgaon', nameMr: 'तासगाव', nameEn: 'Tasgaon' },
      { id: 'Walwa', nameMr: 'वाळवा', nameEn: 'Walwa' },
      { id: 'Shirala', nameMr: 'शिराळा', nameEn: 'Shirala' },
      { id: 'Khanapur', nameMr: 'खानापूर', nameEn: 'Khanapur' },
      { id: 'Atpadi', nameMr: 'आटपाडी', nameEn: 'Atpadi' },
      { id: 'Jath', nameMr: 'जत', nameEn: 'Jath' },
      { id: 'Kavathe Mahankal', nameMr: 'कवठे महांकाळ', nameEn: 'Kavathe Mahankal' },
      { id: 'Palus', nameMr: 'पलूस', nameEn: 'Palus' },
      { id: 'Kadegaon', nameMr: 'कडेगाव', nameEn: 'Kadegaon' },
    ],
  },
  {
    id: 'Solapur',
    nameMr: 'सोलापूर',
    nameEn: 'Solapur',
    talukas: [
      { id: 'Solapur North', nameMr: 'उत्तर सोलापूर', nameEn: 'North Solapur' },
      { id: 'Solapur South', nameMr: 'दक्षिण सोलापूर', nameEn: 'South Solapur' },
      { id: 'Barshi', nameMr: 'बार्शी', nameEn: 'Barshi' },
      { id: 'Pandharpur', nameMr: 'पंढरपूर', nameEn: 'Pandharpur' },
      { id: 'Akkalkot', nameMr: 'अक्कलकोट', nameEn: 'Akkalkot' },
      { id: 'Mohol', nameMr: 'मोहोळ', nameEn: 'Mohol' },
      { id: 'Madha', nameMr: 'माढा', nameEn: 'Madha' },
      { id: 'Karmala', nameMr: 'करमाळा', nameEn: 'Karmala' },
      { id: 'Sangole', nameMr: 'सांगोला', nameEn: 'Sangole' },
      { id: 'Malshiras', nameMr: 'माळशिरस', nameEn: 'Malshiras' },
      { id: 'Mangalwedha', nameMr: 'मंगळवेढा', nameEn: 'Mangalwedha' },
    ],
  },
  {
    id: 'Thane',
    nameMr: 'ठाणे',
    nameEn: 'Thane',
    talukas: [
      { id: 'Thane', nameMr: 'ठाणे', nameEn: 'Thane' },
      { id: 'Kalyan', nameMr: 'कल्याण', nameEn: 'Kalyan' },
      { id: 'Bhiwandi', nameMr: 'भिवंडी', nameEn: 'Bhiwandi' },
      { id: 'Ulhasnagar', nameMr: 'उल्हासनगर', nameEn: 'Ulhasnagar' },
      { id: 'Ambarnath', nameMr: 'अंबरनाथ', nameEn: 'Ambarnath' },
      { id: 'Murbad', nameMr: 'मुरबाड', nameEn: 'Murbad' },
      { id: 'Shahapur', nameMr: 'शहापूर', nameEn: 'Shahapur' },
    ],
  },
  {
    id: 'Dhule',
    nameMr: 'धुळे',
    nameEn: 'Dhule',
    talukas: [
      { id: 'Dhule', nameMr: 'धुळे', nameEn: 'Dhule' },
      { id: 'Sakri', nameMr: 'साक्री', nameEn: 'Sakri' },
      { id: 'Shirpur', nameMr: 'शिरपूर', nameEn: 'Shirpur' },
      { id: 'Sindkheda', nameMr: 'शिंदखेडा', nameEn: 'Sindkheda' },
    ],
  },
  {
    id: 'Nandurbar',
    nameMr: 'नंदुरबार',
    nameEn: 'Nandurbar',
    talukas: [
      { id: 'Nandurbar', nameMr: 'नंदुरबार', nameEn: 'Nandurbar' },
      { id: 'Navapur', nameMr: 'नवापूर', nameEn: 'Navapur' },
      { id: 'Shahada', nameMr: 'शहादा', nameEn: 'Shahada' },
      { id: 'Taloda', nameMr: 'तळोदा', nameEn: 'Taloda' },
      { id: 'Akkalkuwa', nameMr: 'अक्कलकुवा', nameEn: 'Akkalkuwa' },
      { id: 'Akrani', nameMr: 'धडगाव', nameEn: 'Dhadgaon' },
    ],
  },
  {
    id: 'Nagpur',
    nameMr: 'नागपूर',
    nameEn: 'Nagpur',
    talukas: [
      { id: 'Nagpur Urban', nameMr: 'नागपूर शहर', nameEn: 'Nagpur Urban' },
      { id: 'Nagpur Rural', nameMr: 'नागपूर ग्रामीण', nameEn: 'Nagpur Rural' },
      { id: 'Kamptee', nameMr: 'कामठी', nameEn: 'Kamptee' },
      { id: 'Hingna', nameMr: 'हिंगणा', nameEn: 'Hingna' },
      { id: 'Katol', nameMr: 'काटोल', nameEn: 'Katol' },
      { id: 'Narkhed', nameMr: 'नरखेड', nameEn: 'Narkhed' },
      { id: 'Savner', nameMr: 'सावनेर', nameEn: 'Savner' },
      { id: 'Ramtek', nameMr: 'रामटेक', nameEn: 'Ramtek' },
      { id: 'Umred', nameMr: 'उमरेड', nameEn: 'Umred' },
    ],
  },
  {
    id: 'Amravati',
    nameMr: 'अमरावती',
    nameEn: 'Amravati',
    talukas: [
      { id: 'Amravati', nameMr: 'अमरावती', nameEn: 'Amravati' },
      { id: 'Achalpur', nameMr: 'अचलपूर', nameEn: 'Achalpur' },
      { id: 'Chandurbazar', nameMr: 'चांदूरबाजार', nameEn: 'Chandurbazar' },
      { id: 'Warud', nameMr: 'वरुड', nameEn: 'Warud' },
      { id: 'Morshi', nameMr: 'मोर्शी', nameEn: 'Morshi' },
      { id: 'Daryapur', nameMr: 'दर्यापूर', nameEn: 'Daryapur' },
      { id: 'Chikhaldara', nameMr: 'चिखलदरा', nameEn: 'Chikhaldara' },
    ],
  },
  {
    id: 'Nanded',
    nameMr: 'नांदेड',
    nameEn: 'Nanded',
    talukas: [
      { id: 'Nanded', nameMr: 'नांदेड', nameEn: 'Nanded' },
      { id: 'Loha', nameMr: 'लोहा', nameEn: 'Loha' },
      { id: 'Kandhar', nameMr: 'कंधार', nameEn: 'Kandhar' },
      { id: 'Mukhed', nameMr: 'मुखेड', nameEn: 'Mukhed' },
      { id: 'Degloor', nameMr: 'देगलूर', nameEn: 'Degloor' },
      { id: 'Hadgaon', nameMr: 'हदगाव', nameEn: 'Hadgaon' },
      { id: 'Kinwat', nameMr: 'किनवट', nameEn: 'Kinwat' },
      { id: 'Bhokar', nameMr: 'भोकर', nameEn: 'Bhokar' },
    ],
  },
  {
    id: 'Latur',
    nameMr: 'लातूर',
    nameEn: 'Latur',
    talukas: [
      { id: 'Latur', nameMr: 'लातूर', nameEn: 'Latur' },
      { id: 'Ausa', nameMr: 'औसा', nameEn: 'Ausa' },
      { id: 'Udgir', nameMr: 'उदगीर', nameEn: 'Udgir' },
      { id: 'Ahmedpur', nameMr: 'अहमदपूर', nameEn: 'Ahmedpur' },
      { id: 'Nilanga', nameMr: 'निलंगा', nameEn: 'Nilanga' },
      { id: 'Chakur', nameMr: 'चाकूर', nameEn: 'Chakur' },
      { id: 'Renapur', nameMr: 'रेणापूर', nameEn: 'Renapur' },
    ],
  },
];

export const normalizeLocation = (str) => (str || '').trim().toLowerCase();

/**
 * Returns available States with single-language labels
 */
export const getStates = (dbVillages = [], lang = 'mr') => {
  const stateMap = new Map();

  INDIAN_STATES.forEach((s) => {
    const label = lang === 'en' ? s.nameEn : s.nameMr;
    stateMap.set(normalizeLocation(s.id), { id: s.id, label, nameMr: s.nameMr, nameEn: s.nameEn });
  });

  dbVillages.forEach((v) => {
    if (v.state && !stateMap.has(normalizeLocation(v.state))) {
      stateMap.set(normalizeLocation(v.state), { id: v.state, label: v.state, nameMr: v.state, nameEn: v.state });
    }
  });

  return Array.from(stateMap.values());
};

/**
 * Returns Districts for selected State with single-language labels
 */
export const getDistrictsForState = (selectedState, dbVillages = [], lang = 'mr') => {
  if (!selectedState) return [];

  const districtMap = new Map();
  const isMaharashtra = normalizeLocation(selectedState) === 'maharashtra' || selectedState === 'महाराष्ट्र';

  if (isMaharashtra) {
    MAHARASHTRA_DISTRICTS.forEach((d) => {
      const label = lang === 'en' ? d.nameEn : d.nameMr;
      districtMap.set(normalizeLocation(d.id), {
        id: d.id,
        label,
        nameMr: d.nameMr,
        nameEn: d.nameEn,
        talukas: d.talukas,
      });
    });
  }

  dbVillages.forEach((v) => {
    if (v.state && normalizeLocation(v.state) === normalizeLocation(selectedState) && v.district) {
      const key = normalizeLocation(v.district);
      if (!districtMap.has(key)) {
        districtMap.set(key, {
          id: v.district,
          label: v.district,
          talukas: [],
        });
      }
    }
  });

  return Array.from(districtMap.values());
};

/**
 * Returns Talukas for selected State and District with single-language labels
 */
export const getTalukasForDistrict = (selectedState, selectedDistrict, dbVillages = [], lang = 'mr') => {
  if (!selectedDistrict) return [];

  const talukaMap = new Map();
  const isMaharashtra = normalizeLocation(selectedState) === 'maharashtra' || selectedState === 'महाराष्ट्र';

  if (isMaharashtra) {
    const matchedDist = MAHARASHTRA_DISTRICTS.find(
      (d) => normalizeLocation(d.id) === normalizeLocation(selectedDistrict) ||
             normalizeLocation(d.nameMr) === normalizeLocation(selectedDistrict)
    );
    if (matchedDist && matchedDist.talukas) {
      matchedDist.talukas.forEach((t) => {
        const label = lang === 'en' ? t.nameEn : t.nameMr;
        talukaMap.set(normalizeLocation(t.id), {
          id: t.id,
          label,
          nameMr: t.nameMr,
          nameEn: t.nameEn,
        });
      });
    }
  }

  dbVillages.forEach((v) => {
    const matchesState = !selectedState || normalizeLocation(v.state) === normalizeLocation(selectedState);
    const matchesDistrict = normalizeLocation(v.district) === normalizeLocation(selectedDistrict);
    if (matchesState && matchesDistrict && v.taluka) {
      const key = normalizeLocation(v.taluka);
      if (!talukaMap.has(key)) {
        talukaMap.set(key, {
          id: v.taluka,
          label: v.taluka,
        });
      }
    }
  });

  return Array.from(talukaMap.values());
};

/**
 * Returns Villages from DB matching state, district and taluka
 */
export const getVillagesForTaluka = (selectedState, selectedDistrict, selectedTaluka, dbVillages = []) => {
  if (!selectedTaluka) return [];

  const normTaluka = normalizeLocation(selectedTaluka);
  const normDistrict = normalizeLocation(selectedDistrict);
  const normState = normalizeLocation(selectedState);

  return dbVillages.filter((v) => {
    const matchesTaluka = normalizeLocation(v.taluka) === normTaluka;
    const matchesDistrict = !selectedDistrict || normalizeLocation(v.district) === normDistrict;
    const matchesState = !selectedState || normalizeLocation(v.state) === normState;
    return matchesTaluka && matchesDistrict && matchesState;
  });
};

