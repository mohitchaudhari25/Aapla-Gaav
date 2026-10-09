export const mockVillage = {
  id: 'demo-village-1',
  name: 'शिवाजीनगर',
  gram_panchayat: 'शिवाजीनगर ग्रामपंचायत',
  taluka: 'हवेली',
  district: 'पुणे',
  state: 'महाराष्ट्र',
  population: '५,२००',
  families: '१,१००',
  area: '१२ चौरस किमी',
  office_name: 'ग्रामपंचायत कार्यालय, शिवाजीनगर',
  timings: 'सकाळी १०:०० ते संध्याकाळी ५:००',
  weekly_off: 'रविवार',
};

export const mockComplaints = [
  {
    id: 'demo-comp-1',
    title: 'पाणी पुरवठा बंद',
    description: '[प्रकार: पाणी] [ठिकाण: मुख्य चौक] गेल्या दोन दिवसांपासून पाणी नाही.',
    status: 'प्राप्त',
    category: 'पाणी',
    created_at: '2026-10-01T10:00:00Z',
    isDemo: true,
  },
  {
    id: 'demo-comp-2',
    title: 'रस्त्यावर खड्डे',
    description: '[प्रकार: रस्ता] [ठिकाण: शाळेजवळ] पावसाळ्यामुळे रस्त्यावर मोठे खड्डे पडले आहेत.',
    status: 'प्रक्रियेत',
    category: 'रस्ता',
    created_at: '2026-09-25T10:00:00Z',
    isDemo: true,
  },
  {
    id: 'demo-comp-3',
    title: 'स्ट्रीट लाईट बंद',
    description: '[प्रकार: स्ट्रीट लाईट] [ठिकाण: हनुमान मंदिराजवळ] रात्रीच्या वेळी अंधार असतो.',
    status: 'सोडवले',
    category: 'स्ट्रीट लाईट',
    created_at: '2026-09-15T10:00:00Z',
    isDemo: true,
  }
];

export const mockComplaintUpdates = {
  'demo-comp-2': [
    { id: 'demo-up-1', status: 'प्रक्रियेत', description: 'कंत्राटदाराला सूचना दिली आहे.', created_at: '2026-09-26T10:00:00Z' }
  ],
  'demo-comp-3': [
    { id: 'demo-up-2', status: 'प्रक्रियेत', description: 'इलेक्ट्रिशियन बोलावला आहे.', created_at: '2026-09-16T10:00:00Z' },
    { id: 'demo-up-3', status: 'सोडवले', description: 'नवीन लाईट बसवली आहे.', created_at: '2026-09-18T14:00:00Z' }
  ]
};

export const mockProjects = [
  { id: 'demo-proj-1', name: 'नवीन रस्ता बांधणी', budget: 1000000, amount_spent: 500000, progress: 50, status: 'चालू' },
  { id: 'demo-proj-2', name: 'पाण्याची टाकी', budget: 1500000, amount_spent: 1500000, progress: 100, status: 'पूर्ण' },
  { id: 'demo-proj-3', name: 'स्मशानभूमी सुशोभीकरण', budget: 500000, amount_spent: 100000, progress: 20, status: 'चालू' }
];

export const mockNotices = [
  { id: 'demo-not-1', title: 'ग्रामसभा बैठक', description: 'येत्या रविवारी सकाळी १० वाजता ग्रामसभेचे आयोजन करण्यात आले आहे.', date: '2026-10-15' },
  { id: 'demo-not-2', title: 'पाणी कपात', description: 'पाईपलाईन दुरुस्तीमुळे उद्या पाणी पुरवठा बंद राहील.', date: '2026-10-10' },
  { id: 'demo-not-3', title: 'लसीकरण शिबिर', description: 'प्राथमिक आरोग्य केंद्रात मोफत लसीकरण शिबिर.', date: '2026-10-20' },
  { id: 'demo-not-4', title: 'स्वच्छता मोहीम', description: 'गावात स्वच्छता मोहीम राबवण्यात येणार आहे.', date: '2026-10-12' }
];

export const mockFunds = [
  { id: 'demo-fund-1', description: 'राज्य सरकार अनुदान', amount: 500000, type: 'income', transaction_date: '2026-09-01T10:00:00Z' },
  { id: 'demo-fund-2', description: 'रस्ता दुरुस्ती खर्च', amount: 200000, type: 'expense', transaction_date: '2026-09-10T10:00:00Z' },
  { id: 'demo-fund-3', description: 'पाणीपट्टी जमा', amount: 50000, type: 'income', transaction_date: '2026-09-15T10:00:00Z' },
  { id: 'demo-fund-4', description: 'शाळा दुरुस्ती', amount: 150000, type: 'expense', transaction_date: '2026-09-20T10:00:00Z' },
  { id: 'demo-fund-5', description: 'घरपट्टी जमा', amount: 75000, type: 'income', transaction_date: '2026-09-25T10:00:00Z' }
];

export const mockNotifications = [
  { id: 'demo-noti-1', title: 'नवीन योजना', message: 'राज्य सरकारची नवीन शेतकरी योजना लागू झाली आहे.', type: 'info', created_at: '2026-10-01T10:00:00Z', is_read: false },
  { id: 'demo-noti-2', title: 'दक्षता इशारा', message: 'हवामान खात्याचा अतिवृष्टीचा इशारा.', type: 'warning', created_at: '2026-10-05T10:00:00Z', is_read: false },
  { id: 'demo-noti-3', title: 'अभिनंदन', message: 'गावाला स्वच्छतेसाठी प्रथम क्रमांक मिळाला.', type: 'success', created_at: '2026-10-08T10:00:00Z', is_read: true },
  { id: 'demo-noti-4', title: 'स्मरणपत्र', message: 'घरपट्टी भरण्याची शेवटची तारीख जवळ आली आहे.', type: 'info', created_at: '2026-10-09T10:00:00Z', is_read: false }
];

export const mockContacts = [
  { id: 'demo-cont-1', name: 'रमेश पाटील', designation: 'सरपंच', phone: '9876543210' },
  { id: 'demo-cont-2', name: 'सुनीता देशमुख', designation: 'उपसरपंच', phone: '9876543211' },
  { id: 'demo-cont-3', name: 'विनायक जोशी', designation: 'ग्रामसेवक', phone: '9876543212' },
  { id: 'demo-cont-4', name: 'प्राथमिक आरोग्य केंद्र', designation: 'आरोग्य', phone: '020-1234567' },
  { id: 'demo-cont-5', name: 'पोलीस पाटील', designation: 'सुरक्षा', phone: '9876543213' }
];
