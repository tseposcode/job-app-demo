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

// The company behind Job Auto, shown at the bottom of the Profile page.
export const COMPANY = 'Gentle-TT (Pty) Ltd';

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

// Subscription plans, shown as tiles in this order. The first one is the monthly
// price that savings are worked out against. "Best value" goes to the plan with
// the lowest price per month (see services/subscription.js).
export const PLANS = [
  { id: 'monthly', name: 'Monthly', price: 59, months: 1 },
  { id: 'quarter', name: '3 months', price: 149, months: 3 },
  { id: 'yearly', name: 'Yearly', price: 499, months: 12 },
];

// Privacy notice version. Change it when the notice changes and everyone is asked to agree again.
export const PRIVACY_VERSION = '1.2'; // 1.1: names Gentle-TT (Pty) Ltd; 1.2: payment and billing information
// PLACEHOLDER: the real Information Officer contact goes here before launch.
export const PRIVACY_CONTACT = 'privacy@jobauto.example';

// Made-up CVs in samples/cvs/ that a tester can use instead of uploading their own.
// The last three are in real-world styles (no "Looking for" section, a sidebar layout, a Word file).
export const SAMPLE_CVS = [
  { file: 'samples/cvs/Lerato_Mokoena_CV.pdf', person: 'Lerato Mokoena', about: 'Computer Science graduate, Gauteng' },
  { file: 'samples/cvs/Sipho_Ndlovu_CV.pdf', person: 'Sipho Ndlovu', about: 'Logistics diploma, KwaZulu-Natal' },
  { file: 'samples/cvs/Aisha_Petersen_CV.pdf', person: 'Aisha Petersen', about: 'BCom Accounting graduate, Western Cape' },
  { file: 'samples/cvs/Nomsa_Dlamini_CV.pdf', person: 'Nomsa Dlamini', about: 'HR graduate, Pretoria. Classic CV layout' },
  { file: 'samples/cvs/Kabelo_Mahlangu_CV.pdf', person: 'Kabelo Mahlangu', about: 'Civil engineering, Polokwane. Two-column CV' },
  { file: 'samples/cvs/Zanele_Khumalo_CV.docx', person: 'Zanele Khumalo', about: 'Marketing diploma, Umlazi. Word CV' },
];

// Sign-up has this many steps: account, privacy, CV, details, preferences, plan.
export const SIGNUP_STEPS = 6;
