// seed-jobs.js
// The 20 made-up sample jobs every device starts with. The admin page can add more.
// Fields: id, title, company, type, field, city, province, mode, qual, pay (rand per month),
// posted and closes (YYYY-MM-DD), skills, desc, apply ({ method, to | url }), source.

// How each sample job takes applications (see APPLY_METHODS in config.js). The rest are in-app.
const BY_EMAIL = ['j01', 'j02', 'j04', 'j06', 'j09', 'j10', 'j12', 'j17', 'j19'];
const ON_SITE = ['j05', 'j08', 'j14', 'j18'];
const domain = (company) => `${company.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}.example`;

function applyFor(id, company) {
  if (BY_EMAIL.includes(id)) return { method: 'email', to: `careers@${domain(company)}` };
  if (ON_SITE.includes(id)) return { method: 'site', url: `https://${domain(company)}/careers` };
  return { method: 'in_app' };
}

function job(id, title, company, type, field, city, province, mode, qual, pay, posted, closes, skills, desc) {
  const apply = applyFor(id, company);
  return { id, title, company, type, field, city, province, mode, qual, pay, posted, closes, skills, desc, apply, source: 'Sample jobs' };
}

export const SEED_JOBS = [
  job('j01','Supply Chain Graduate Programme','Kopano Logistics','Graduate programme','Supply chain','Johannesburg','Gauteng','Hybrid','Degree',14000,'2026-10-14','2026-11-30',['Excel','Procurement','SAP','Communication'],'A 12-month rotation through planning, procurement and warehousing.\n\nYou will work with real stock data, support supplier reviews and present one improvement project at the end of the year.'),
  job('j02','Data Analyst Intern','Mzansi Analytics','Internship','Data and analytics','Cape Town','Western Cape','Remote','Degree',9500,'2026-10-13','2026-11-20',['Excel','Power BI','SQL','Python'],'Build dashboards for retail clients and clean messy sales data.\n\nFully remote, with a weekly check-in with your mentor.'),
  job('j03','IT Support Learnership','Bluegum Tech','Learnership','IT and software','Pretoria','Gauteng','On-site','Matric',5000,'2026-10-15','2026-11-15',['Troubleshooting','Customer service','Windows'],'A 12-month NQF 5 learnership. Help staff with laptops, accounts and printers while you study towards your qualification.'),
  job('j04','Junior Accountant','Ubuntu Ledger Partners','Entry-level job','Finance and accounting','Durban','KwaZulu-Natal','On-site','Degree',16500,'2026-10-10','2026-11-10',['Excel','Pastel','Reconciliations'],'Prepare monthly reconciliations and support the year-end audit for small business clients.'),
  job('j05','Marketing Intern','Jacaranda Media','Internship','Marketing','Johannesburg','Gauteng','Hybrid','Diploma',7000,'2026-10-12','2026-11-12',['Social media','Canva','Copywriting'],'Plan and post content for three brand accounts and report on what worked each month.'),
  job('j06','HR Graduate Trainee','Baobab Mining Services','Graduate programme','Human resources','Rustenburg','North West','On-site','Degree',12000,'2026-10-09','2026-11-25',['Communication','Excel','Recruitment'],'Support recruitment, onboarding and training records at a busy mine site.'),
  job('j07','Procurement Learnership','Highveld Foods','Learnership','Supply chain','Midrand','Gauteng','On-site','Matric',6000,'2026-10-15','2026-12-01',['Excel','Procurement','Communication'],'Learn how a food manufacturer buys ingredients and packaging, from quotes to purchase orders.'),
  job('j08','Junior Software Developer','Karoo Code','Entry-level job','IT and software','Remote','Gauteng','Remote','Diploma',18000,'2026-10-11','2026-11-18',['JavaScript','HTML','Git'],'Build features for small business web apps in a team of five. Fully remote.'),
  job('j09','Finance Graduate Programme','Sable Financial','Graduate programme','Finance and accounting','Sandton','Gauteng','Hybrid','Degree',15000,'2026-10-08','2026-11-28',['Excel','Financial analysis','Communication'],'Rotate through budgeting, reporting and treasury over 18 months.'),
  job('j10','Mechanical Engineering Graduate','Vaalrand Engineering','Graduate programme','Engineering','Vanderbijlpark','Gauteng','On-site','Degree',17000,'2026-10-07','2026-12-05',['AutoCAD','Maintenance planning','Problem solving'],'Work with plant engineers on maintenance planning and small design changes.'),
  job('j11','Admin Intern','Protea Property Group','Internship','Admin and customer service','Bloemfontein','Free State','On-site','Diploma',6500,'2026-10-14','2026-11-14',['Excel','Filing','Customer service'],'Keep lease files up to date, answer tenant queries and help with monthly reports.'),
  job('j12','Logistics Coordinator','Coastline Freight','Entry-level job','Supply chain','Gqeberha','Eastern Cape','On-site','Diploma',11000,'2026-10-12','2026-11-22',['Excel','Scheduling','Communication'],'Book trucks, track deliveries and keep customers updated on their shipments.'),
  job('j13','Data Science Learnership','Ndlovu Insights','Learnership','Data and analytics','Johannesburg','Gauteng','Hybrid','Matric',5500,'2026-10-16','2026-12-10',['Excel','Python','Statistics'],'A 12-month learnership in data science, with three days a week in the office.'),
  job('j14','Customer Success Associate','Imbali Telecoms','Entry-level job','Admin and customer service','Cape Town','Western Cape','Hybrid','Matric',8500,'2026-10-10','2026-11-09',['Customer service','Communication'],'Help new business customers set up their accounts and solve their first problems.'),
  job('j15','Civil Engineering Intern','Limpopo Roadworks','Internship','Engineering','Polokwane','Limpopo','On-site','Degree',8000,'2026-10-09','2026-11-30',['AutoCAD','Site inspection'],'Join site inspections on rural road projects and help prepare progress reports.'),
  job('j16','Social Media Learnership','Shosholoza Creative','Learnership','Marketing','Durban','KwaZulu-Natal','Remote','Matric',4500,'2026-10-13','2026-11-13',['Social media','Canva'],'Create short videos and posts for small local brands while you complete a digital marketing qualification.'),
  job('j17','Graduate Business Analyst','Mopane Consulting','Graduate programme','Data and analytics','Pretoria','Gauteng','Hybrid','Degree',16000,'2026-10-15','2026-12-01',['Excel','Power BI','Process mapping','Communication'],'Map how client teams work today, find the slow steps and help design better processes.'),
  job('j18','Mining Operations Graduate','Witwatersrand Minerals','Graduate programme','Engineering','Carletonville','Gauteng','On-site','Degree',15500,'2026-10-11','2026-12-03',['Problem solving','Excel','Safety'],'A two-year programme across underground and surface operations.'),
  job('j19','Payroll Intern','Amandla Payroll Services','Internship','Finance and accounting','Mbombela','Mpumalanga','On-site','Diploma',7500,'2026-10-08','2026-11-08',['Excel','Payroll','Attention to detail'],'Help run monthly payroll for 40 small business clients.'),
  job('j20','Warehouse Supervisor Trainee','Kopano Logistics','Entry-level job','Supply chain','Kempton Park','Gauteng','On-site','Diploma',10000,'2026-10-16','2026-11-30',['Excel','Stock control','Leadership'],'Lead a small picking team on the night shift after a three-month training period.'),
];
