// config.js
// Fixed settings and the lists the app chooses from. Change a list here and
// every dropdown, filter and checkbox that uses it updates.

export const FIELDS = [
  'Supply chain',
  'Data and analytics',
  'IT and software',
  'Finance and accounting',
  'Engineering',
  'Marketing',
  'Human resources',
  'Admin and customer service',
];
export const TYPES = ['Internship', 'Learnership', 'Graduate programme', 'Entry-level job'];
// Order matters: a later qualification counts as higher than an earlier one.
export const QUALS = ['Matric', 'Diploma', 'Degree', 'Honours'];
export const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];
export const MODES = ['On-site', 'Hybrid', 'Remote'];

// Demo-only test account and admin PIN. Never put real passwords here.
export const TEST_EMAIL = 'thabang@test.com';
export const TEST_PASS = 'jameson';
export const DEFAULT_PIN = '2468';

// Where the app keeps its data in the browser. Bump the version to start fresh.
export const STORAGE_KEY = 'jobauto:v1';

// Time units in milliseconds.
export const MIN = 60 * 1000;
export const DAY = 24 * 60 * MIN;

// How often the screen refreshes so employer "replies" appear.
export const TICK_MS = 15 * 1000;

// Subscription plans. PLACEHOLDER prices for the demo: confirm with the business before launch.
export const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 79, months: 1, note: 'Cancel any time' },
  { id: 'quarter', name: '3 months', price: 199, months: 3, note: 'Save R38', best: true },
];

// Privacy notice version. Change it when the notice changes and everyone is asked to agree again.
export const PRIVACY_VERSION = '1.0';
// PLACEHOLDER: the real Information Officer contact goes here before launch.
export const PRIVACY_CONTACT = 'privacy@jobauto.example';

// Made-up CVs in samples/cvs/ that a tester can use instead of uploading their own.
export const SAMPLE_CVS = [
  { file: 'samples/cvs/Lerato_Mokoena_CV.pdf', person: 'Lerato Mokoena', about: 'Computer Science graduate, Gauteng' },
  { file: 'samples/cvs/Sipho_Ndlovu_CV.pdf', person: 'Sipho Ndlovu', about: 'Logistics diploma, KwaZulu-Natal' },
  { file: 'samples/cvs/Aisha_Petersen_CV.pdf', person: 'Aisha Petersen', about: 'BCom Accounting graduate, Western Cape' },
];

// Sign-up has this many steps: account, privacy, CV, details, preferences, plan.
export const SIGNUP_STEPS = 6;
