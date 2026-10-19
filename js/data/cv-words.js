// cv-words.js
// Word lists the CV reader uses to understand real CVs.
// To teach it a new town, skill or field word, add it here. No code changes needed.

// Towns, cities and townships → province. Longer names are checked first.
export const CITY_PROVINCE = {
  Gauteng: [
    'Johannesburg', 'Joburg', 'Jozi', 'Pretoria', 'Tshwane', 'Soweto', 'Sandton', 'Midrand', 'Centurion', 'Randburg',
    'Roodepoort', 'Kempton Park', 'Benoni', 'Boksburg', 'Germiston', 'Alberton', 'Edenvale', 'Springs', 'Brakpan',
    'Krugersdorp', 'Randfontein', 'Westonaria', 'Carletonville', 'Fochville', 'Vereeniging', 'Vanderbijlpark',
    'Meyerton', 'Tembisa', 'Alexandra', 'Mamelodi', 'Soshanguve', 'Atteridgeville', 'Katlehong', 'Thokoza',
    'Vosloorus', 'Diepsloot', 'Mabopane', 'Ga-Rankuwa', 'Hammanskraal', 'Cullinan', 'Bronkhorstspruit',
    'Fourways', 'Rosebank', 'Braamfontein', 'Hatfield', 'Sebokeng', 'Evaton', 'Orange Farm', 'Lenasia', 'Ekurhuleni',
  ],
  'Western Cape': [
    'Cape Town', 'Stellenbosch', 'Paarl', 'Worcester', 'George', 'Mossel Bay', 'Knysna', 'Bellville', 'Durbanville',
    'Somerset West', 'Khayelitsha', 'Mitchells Plain', "Mitchell's Plain", 'Gugulethu', 'Langa', 'Philippi',
    'Strand', 'Wellington', 'Oudtshoorn', 'Hermanus', 'Malmesbury', 'Vredenburg', 'Saldanha',
  ],
  'KwaZulu-Natal': [
    'Durban', 'eThekwini', 'Pietermaritzburg', 'Umlazi', 'KwaMashu', 'Chatsworth', 'Pinetown', 'Phoenix', 'Westville',
    'Amanzimtoti', 'Ballito', 'Umhlanga', 'Richards Bay', 'Empangeni', 'Newcastle', 'Ladysmith', 'Port Shepstone',
    'Estcourt', 'Vryheid', 'Ulundi', 'Kokstad', 'Stanger', 'KwaDukuza', 'Inanda', 'Verulam', 'Tongaat',
  ],
  'Eastern Cape': [
    'Gqeberha', 'Port Elizabeth', 'East London', 'Mthatha', 'Makhanda', 'Grahamstown', 'Uitenhage', 'Kariega',
    'Mdantsane', 'Queenstown', 'Komani', 'King Williams Town', "King William's Town", 'Qonce', 'Butterworth',
    'Graaff-Reinet', 'Jeffreys Bay', 'Alice', 'Motherwell',
  ],
  'Free State': [
    'Bloemfontein', 'Mangaung', 'Welkom', 'Bethlehem', 'Kroonstad', 'Sasolburg', 'Phuthaditjhaba', 'Botshabelo',
    'Parys', 'Harrismith', 'Virginia', 'Odendaalsrus',
  ],
  Limpopo: [
    'Polokwane', 'Pietersburg', 'Thohoyandou', 'Tzaneen', 'Mokopane', 'Lephalale', 'Musina', 'Giyani', 'Louis Trichardt',
    'Makhado', 'Bela-Bela', 'Phalaborwa', 'Modimolle', 'Burgersfort', 'Seshego', 'Mankweng',
  ],
  Mpumalanga: [
    'Mbombela', 'Nelspruit', 'eMalahleni', 'Witbank', 'Middelburg', 'Secunda', 'Ermelo', 'Standerton', 'Barberton',
    'White River', 'Hazyview', 'Bushbuckridge', 'KwaMhlanga', 'Delmas', 'Piet Retief', 'Mkhondo', 'Kriel',
  ],
  'North West': [
    'Mahikeng', 'Mafikeng', 'Rustenburg', 'Potchefstroom', 'Klerksdorp', 'Brits', 'Lichtenburg', 'Vryburg',
    'Zeerust', 'Mogwase', 'Hartbeespoort', 'Orkney', 'Stilfontein', 'Taung',
  ],
  'Northern Cape': ['Kimberley', 'Upington', 'Springbok', 'Kuruman', 'De Aar', 'Kathu', 'Postmasburg', 'Colesberg'],
};

// Other ways people write province names.
export const PROVINCE_ALIASES = {
  Gauteng: ['GP', 'Gauteng Province'],
  'Western Cape': ['WC', 'W Cape', 'W. Cape'],
  'KwaZulu-Natal': ['KZN', 'Kwazulu Natal', 'Kwa-Zulu Natal', 'Kwa Zulu Natal', 'KwaZulu Natal', 'Natal'],
  'Eastern Cape': ['EC', 'E Cape', 'E. Cape'],
  'Free State': ['FS', 'Freestate'],
  Limpopo: ['LP', 'Limpopo Province'],
  Mpumalanga: ['MP'],
  'North West': ['NW', 'North-West', 'Northwest'],
  'Northern Cape': ['NC', 'N Cape', 'N. Cape'],
};

// Skills, with the other ways CVs write them. The first name is what is stored,
// and it matches the skill names used on jobs.
export const SKILLS = [
  ['Excel', 'MS Excel', 'Microsoft Excel', 'Excel (advanced)', 'Advanced Excel', 'spreadsheets'],
  ['Power BI', 'PowerBI', 'Power-BI'],
  ['SQL', 'MySQL', 'PostgreSQL', 'SQL Server', 'T-SQL'],
  ['Python'],
  ['JavaScript', 'Javascript', 'JS'],
  ['HTML', 'HTML5', 'HTML/CSS'],
  ['Git', 'GitHub', 'Git/GitHub'],
  ['Statistics', 'Statistical analysis'],
  ['Pastel', 'Sage Pastel', 'Pastel Partner'],
  ['SAP', 'SAP ERP', 'SAP basics'],
  ['AutoCAD', 'Auto CAD'],
  ['Canva'],
  ['Payroll', 'VIP Payroll', 'payroll administration'],
  ['Reconciliations', 'bank reconciliations', 'reconciliation', 'recons'],
  ['Financial analysis', 'financial analysis', 'financial reporting'],
  ['Procurement', 'purchasing', 'buying'],
  ['Stock control', 'stock taking', 'stocktaking', 'inventory management', 'inventory control', 'stock counts'],
  ['Scheduling', 'planning and scheduling'],
  ['Process mapping', 'process improvement'],
  ['Social media', 'social media marketing', 'social media management'],
  ['Copywriting', 'content writing', 'copy writing'],
  ['Customer service', 'client service', 'customer care'],
  ['Communication', 'communication skills', 'verbal and written communication'],
  ['Leadership', 'team leadership', 'leading teams'],
  ['Problem solving', 'problem-solving'],
  ['Attention to detail', 'detail-oriented', 'detail oriented'],
  ['Filing', 'records management', 'document control'],
  ['Recruitment', 'recruiting', 'talent acquisition'],
  ['Troubleshooting', 'technical support', 'IT support'],
  ['Windows', 'Windows 10', 'Windows 11'],
  ['Safety', 'health and safety', 'SHEQ', 'OHS'],
  ['Site inspection', 'site inspections'],
  ['Maintenance planning', 'maintenance'],
  ['Teamwork', 'team player', 'working in a team'],
  ['Time management'],
  ['Data analysis', 'data analytics', 'analysing data'],
  ['Microsoft Office', 'MS Office', 'Office 365', 'Microsoft 365'],
  ['Word', 'MS Word', 'Microsoft Word'],
  ['PowerPoint', 'MS PowerPoint', 'Microsoft PowerPoint'],
];

// Words that point to each job field. Words in what someone studied count most.
export const FIELD_WORDS = {
  'Supply chain': ['supply chain', 'logistics', 'procurement', 'purchasing', 'warehouse', 'inventory', 'stock control', 'transport', 'distribution', 'freight', 'operations management'],
  'Data and analytics': ['data', 'analytics', 'analyst', 'power bi', 'statistics', 'statistical', 'sql', 'tableau', 'business intelligence', 'dashboard', 'mathematical sciences'],
  'IT and software': ['computer science', 'information technology', 'informatics', 'information systems', 'software', 'developer', 'programming', 'python', 'javascript', 'network', 'it support', 'web development'],
  'Finance and accounting': ['accounting', 'accountant', 'finance', 'financial', 'audit', 'tax', 'bookkeeping', 'pastel', 'reconciliation', 'payroll', 'economics', 'actuarial', 'creditors', 'debtors'],
  Engineering: ['engineering', 'engineer', 'mechanical', 'electrical', 'civil', 'chemical', 'mining', 'metallurgy', 'autocad', 'mechatronics', 'industrial engineering'],
  Marketing: ['marketing', 'social media', 'brand', 'advertising', 'digital marketing', 'public relations', 'copywriting', 'content creation', 'canva'],
  'Human resources': ['human resource', 'human resources', 'hr', 'recruitment', 'labour relations', 'industrial psychology', 'talent', 'onboarding', 'people management'],
  'Admin and customer service': ['admin', 'administration', 'administrative', 'receptionist', 'customer service', 'call centre', 'call center', 'office', 'clerk', 'data capturing', 'filing'],
};
