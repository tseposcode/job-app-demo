// cv-reader.js
// Reads the text of a CV and picks out profile details: phone, town and province,
// highest qualification, what and where the person studied, skills, experience,
// and job preferences.
//
// Built for real CVs, not one template: any heading style (EDUCATION, Education,
// Education:), labelled personal details (Cell no: ..., Address: ...), Word tables,
// bullet lists and two-column layouts (pdf-text.js separates the columns first).
//
// Job preferences come from a "Looking for" section when a CV has one. Otherwise
// they are SUGGESTED from what the person studied, their skills and where they live,
// and the sign-up screen says so. The person checks everything before anything is sent.
//
// Word lists (towns, skills, field words) live in data/cv-words.js.

import { FIELDS, PROVINCES, QUALS, TYPES } from '../config.js';
import { CITY_PROVINCE, FIELD_WORDS, PROVINCE_ALIASES, SKILLS } from '../data/cv-words.js';

// ---------- small helpers ----------

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word match that also works for words like "HTML/CSS" or "B.Com".
const wordRe = (w, flags = 'i') => new RegExp(`(^|[^A-Za-z0-9])${escRe(w)}(?![A-Za-z0-9])`, flags);
const has = (text, w, flags) => wordRe(w, flags).test(text);
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'’-])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase());
const words = (s) => s.split(/\s+/).filter(Boolean);
const THIS_YEAR = new Date().getFullYear();
const BULLET = /^[\s•●▪◦·*‣⁃>\-–—]+/;

// "S K I L L S" (letter-spaced headings, common in Canva CVs) -> "SKILLS"
function unspace(line) {
  const parts = line.split(/\s{2,}/);
  if (parts.every((p) => /^(\S\s)+\S$/.test(p))) return parts.map((p) => p.replace(/\s/g, '')).join(' ');
  return line;
}

// ---------- sections ----------

const SECTION_PATTERNS = [
  ['personal', /^(personal (details|information|particulars|data|info)|contact( me| details| information| info)?|details|biographical (details|information)|get in touch)$/],
  ['looking', /^(looking for|job preferences|preferences|what i am looking for|career preferences)$/],
  ['profile', /^(profile|personal profile|professional profile|career profile|summary|professional summary|career summary|about|about me|personal statement|career objectives?|objectives?|career goals?)$/],
  ['education', /^(education|educational background|educational history|education and (training|qualifications)|academic (background|qualifications|history|record|achievements)|qualifications|tertiary (education|qualifications)|secondary (education|school(ing)?)|schooling|studies)$/],
  ['skills', /^(skills|key skills|core skills|technical skills|computer (skills|literacy|proficiency)|it skills|software( skills)?|competencies|core competencies|key competencies|skills and (competencies|abilities|attributes)|abilities|strengths|skills summary|expertise)$/],
  ['experience', /^(experience|work experience|working experience|employment|employment history|employment record|work history|professional experience|career history|relevant experience|internships?|internship experience|vacation work|work exposure)$/],
  ['other', /^(references?|referees|languages?|language proficiency|hobbies|interests|hobbies and interests|achievements|awards|awards and achievements|certifications?|certificates|courses|short courses|training|leadership|leadership (roles|experience)|volunteer(ing)?( work| experience)?|community (work|involvement|service)|extra[- ]?curricular( activities)?|projects?|declaration|additional information)$/],
];
const IGNORE_LINE = /^(curriculum vitae|curriculum vita|resume|résumé|cv)$/i;

const headingKey = (line) => {
  const clean = line
    .toLowerCase()
    .replace(BULLET, '')
    .replace(/[|:\s]+$/, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || words(clean).length > 5) return null;
  const hit = SECTION_PATTERNS.find(([, re]) => re.test(clean));
  return hit ? hit[0] : null;
};

// Splits the CV into sections by its headings. Text before the first heading is "top".
function splitSections(lines) {
  const sections = { top: [] };
  let current = 'top';
  const add = (key, line) => (sections[key] = sections[key] || []).push(line);
  lines.forEach((line, i) => {
    let key = headingKey(line);
    if (key) {
      current = key;
      sections[key] = sections[key] || [];
      return;
    }
    // "Skills: Excel, Word" - a heading with its content on the same line.
    const inline = line.match(/^([^:|]{3,35}):\s*(.+)$/);
    key = inline && headingKey(inline[1]);
    if (key) {
      current = key;
      add(key, inline[2]);
      return;
    }
    // Any other short ALL-CAPS line after the name area is a heading we don't use.
    if (i > 2 && line.length < 32 && /^[A-Z][A-Z &/'-]+$/.test(line) && words(line).length <= 4) {
      current = 'other';
      return;
    }
    add(current, line);
  });
  return sections;
}

// ---------- labelled lines: "Cell no: 071 000 1234", "Surname<TAB>Mokoena" ----------

const LABEL_RE = /^([A-Za-z][A-Za-z ()'’/.-]{1,32}?)\s*(?::|\t|\s\|\s)\s*(.*)$/;
const LABELS = {
  first: /^(first names?|names?|given names?|full names?|name and surname|names and surname|full name)$/,
  surname: /^(surname|last name|family name)$/,
  phone: /^(cell|cell (no|number|phone)|cellphone( (no|number))?|mobile( (no|number))?|phone( (no|number))?|contact( (no|number|details))?|tel(ephone)?( (no|number))?)$/,
  place: /^(address|residential address|physical address|home address|location|city|town|area|residence|current location|based in|province|suburb)$/,
};
const SENSITIVE = [
  ['ID number', /^(id|id no|id number|identity (no|number)|sa id( (no|number))?|id\/passport( (no|number))?)$/],
  ['race', /^(race|ethnicity|ethnic group|population group)$/],
  ['religion', /^(religion|religious affiliation)$/],
  ['health', /^(health|health status|disabilit(y|ies)|medical condition)$/],
  ['criminal record', /^(criminal record|criminal offen[cs]es?)$/],
];

function readLabels(lines) {
  const out = [];
  lines.forEach((line, i) => {
    const m = line.match(LABEL_RE);
    if (!m) return;
    const label = m[1].toLowerCase().replace(/\((s|es)\)/g, '').replace(/\s+/g, ' ').trim();
    let value = m[2].replace(/^[|\t\s]+|[|\t\s]+$/g, '');
    if (!value && lines[i + 1] && !LABEL_RE.test(lines[i + 1])) value = lines[i + 1];
    out.push({ label, value });
  });
  return out;
}
const labelValue = (labels, re) => (labels.find((l) => re.test(l.label) && l.value) || {}).value || '';

// ---------- name, phone, place ----------

const NOT_NAME = /\b(curriculum|vitae|resume|profile|graduate|engineer|student|intern|analyst|accountant|developer|manager|assistant|candidate|contact|details|south africa)\b/i;

function readName(lines, labels) {
  const first = labelValue(labels, LABELS.first);
  const last = labelValue(labels, LABELS.surname);
  if (first && last) return { name: titleCase(first), surname: titleCase(last) };
  const candidate =
    (first && words(first).length >= 2 && first) ||
    lines.slice(0, 15).find((l) => {
      const w = words(l);
      return (
        w.length >= 2 &&
        w.length <= 4 &&
        !IGNORE_LINE.test(l) &&
        !headingKey(l) &&
        !NOT_NAME.test(l) &&
        w.every((x) => /^[A-ZÀ-Þ][A-Za-zÀ-ÿ'’-]+$/.test(x))
      );
    });
  if (!candidate) return null;
  const parts = words(titleCase(candidate));
  return { surname: parts.pop(), name: parts.join(' ') };
}

function phoneIn(text) {
  const mobile = /(^|[^\d])(?:\+?27[\s-]?(?:\(0\)[\s-]?)?|0)([1-8]\d)[\s-]?(\d{3})[\s-]?(\d{4})(?!\d)/;
  const landline = /\(0(\d{2})\)\s?(\d{3})[\s-]?(\d{4})(?!\d)/;
  const m = text.match(mobile);
  if (m) return `0${m[2]} ${m[3]} ${m[4]}`;
  const l = text.match(landline);
  return l ? `0${l[1]} ${l[2]} ${l[3]}` : '';
}

function readPhone(lines, labels) {
  const labelled = labels.filter((l) => LABELS.phone.test(l.label)).map((l) => phoneIn(l.value)).find(Boolean);
  if (labelled) return labelled;
  const all = lines.map(phoneIn).filter(Boolean);
  return all.find((p) => /^0[6-8]/.test(p)) || all[0] || '';
}

// Town names that are also common first names: only trusted with a province or an address label.
const AMBIGUOUS_TOWNS = new Set(['George', 'Alice', 'Virginia', 'Phoenix', 'Springs', 'Strand', 'Wellington', 'Brits', 'Langa', 'Alexandra', 'Kimberley', 'Parys', 'Delmas', 'Kriel', 'Orkney', 'Taung', 'Stanger', 'Komani']);
const TOWNS = Object.entries(CITY_PROVINCE)
  .flatMap(([province, towns]) => towns.map((town) => [town, province]))
  .sort((a, b) => b[0].length - a[0].length);
const PROVINCE_NAMES = [
  ...PROVINCES.map((p) => [p, p]),
  ...Object.entries(PROVINCE_ALIASES).flatMap(([p, aliases]) => aliases.map((a) => [a, p])),
].sort((a, b) => b[0].length - a[0].length);
const INSTITUTION = /\b(university|universiteit|college|technikon|institute|institution|academy|tvet|campus|school|varsity|damelin|regenesys|milpark|richfield|boston)\b/i;
const INSTITUTION_ACRONYM = /\b(UNISA|Unisa|WITS|Wits|UCT|UKZN|UJ|UP|TUT|CPUT|DUT|NMU|NMMU|UFS|NWU|UWC|UL|UNIVEN|UMP|SPU|MUT|VUT|CUT|WSU|UFH|UNIZULU|SU)\b/;

function placeIn(line, trusted) {
  if (INSTITUTION.test(line) || INSTITUTION_ACRONYM.test(line)) return null;
  let province = '';
  for (const [name, p] of PROVINCE_NAMES) {
    // Short forms like KZN or GP only count in capitals.
    if (has(line, name, name.length <= 3 ? '' : 'i')) {
      province = p;
      break;
    }
  }
  // "15 Example Street, Hatfield, Pretoria": addresses end with the city, so the last town wins.
  let best = null;
  for (const [town, p] of TOWNS) {
    const m = line.match(wordRe(town));
    if (!m || (AMBIGUOUS_TOWNS.has(town) && !province && !trusted)) continue;
    if (!best || m.index > best.at) best = { at: m.index, city: town, province: province || p };
  }
  if (best) return { city: best.city, province: best.province };
  return province ? { city: '', province } : null;
}

function readPlace(sections, labels) {
  for (const l of labels.filter((x) => LABELS.place.test(x.label))) {
    const hit = placeIn(l.value, true);
    if (hit) return hit;
  }
  const near = [...(sections.top || []), ...(sections.personal || []), ...(sections.profile || [])];
  for (const line of near) {
    const hit = placeIn(line, false);
    if (hit) return hit;
  }
  return null;
}

// ---------- education ----------

const LEVELS = [
  ['Honours', /(^|[^a-z])(honours|hons|postgraduate|post-graduate|pgdip|pgce|masters?|master of|mba|msc|mcom|mphil|mtech|phd|doctorate)([^a-z]|$)/],
  ['Degree', /(^|[^a-z])(bachelors?|bachelor of|b\.? ?com|b\.? ?sc|b\.a\.?|ba|b\.? ?ed|b\.? ?eng|b\.? ?tech|llb|b\.? ?admin|b\.? ?acc|bba|b\.? ?pharm|b\.? ?soc\.? ?sc|b\.? ?cur|degree|advanced diploma)([^a-z]|$)/],
  ['Diploma', /(^|[^a-z])(diploma|n\.? ?dip)([^a-z]|$)/],
  ['Matric', /(^|[^a-z])(matric|matriculated|grade 12|national senior certificate|senior certificate|nsc|higher certificate)([^a-z]|$)/],
];
const IN_PROGRESS = /\b(in progress|currently|expected|to be completed|completing|ongoing|present|final[- ]year|current|studying towards|busy with|pursuing|underway|incomplete|not yet completed)\b/i;
const levelOf = (line) => (LEVELS.find(([, re]) => re.test(line.toLowerCase())) || [])[0] || '';
const yearsIn = (line) => (line.match(/\b(19[89]\d|20\d\d)\b/g) || []).map(Number).filter((y) => y <= THIS_YEAR + 1);
const SEP = /\s+[|–—-]\s+|\s*[|\t]\s*|,\s*|\s{2,}|\s*\(\s*|\s*\)\s*/;

function readEducation(lines) {
  let best = null;
  lines.forEach((line, i) => {
    const level = levelOf(line);
    if (!level) return;
    const next = lines[i + 1] && !levelOf(lines[i + 1]) ? lines[i + 1] : '';
    const prev = lines[i - 1] && /^[\d\s–—/\-.a-z]*$/i.test(lines[i - 1]) && !levelOf(lines[i - 1]) ? lines[i - 1] : '';
    if (IN_PROGRESS.test(line) || IN_PROGRESS.test(next) || IN_PROGRESS.test(prev)) return; // not finished yet
    if (!best || QUALS.indexOf(level) > QUALS.indexOf(best.level)) best = { level, i };
  });
  if (!best) return null;

  const line = lines[best.i];
  const nearby = lines.slice(Math.max(0, best.i - 2), best.i + 3);
  const segments = line.split(SEP).map((s) => s.trim()).filter(Boolean);
  const studySeg = segments.find((s) => levelOf(s) && !INSTITUTION.test(s)) || segments.find((s) => levelOf(s)) || '';
  const study = studySeg.replace(/\b(19|20)\d\d\b/g, '').replace(/[\s–—-]+$/, '').trim();

  const schoolOk = (s) => best.level === 'Matric' || !/high school|secondary|primary/i.test(s);
  let institution = '';
  for (const l of [line, ...nearby]) {
    const seg = l.split(SEP).map((s) => s.trim()).find((s) => (INSTITUTION.test(s) || INSTITUTION_ACRONYM.test(s)) && schoolOk(s));
    if (seg) {
      institution = seg.replace(/\b(19|20)\d\d\b/g, '').replace(/[\s–—-]+$/, '').trim();
      break;
    }
  }
  const years = [line, lines[best.i + 1] || '', lines[best.i - 1] || ''].filter((l, k) => k === 0 || !levelOf(l)).flatMap(yearsIn);
  return {
    qual: best.level,
    study: study.length > 2 && study.length < 90 ? study : '',
    institution: institution.length < 90 ? institution : '',
    gradYear: years.length ? String(Math.max(...years)) : '',
  };
}

// ---------- skills and experience ----------

// Soft skills and common words are only taken from a Skills section, never from sentences.
const PROSE_SKIP = new Set(['Word', 'Windows', 'Filing', 'Maintenance planning', 'Teamwork', 'Safety', 'Leadership', 'Communication', 'Scheduling', 'Problem solving', 'Attention to detail', 'Time management', 'Microsoft Office', 'Customer service']);

function canonicalSkill(item) {
  for (const [name, ...aliases] of SKILLS) {
    for (const a of [name, ...aliases]) {
      // Short forms like SQL, SAP or JS only count in capitals.
      if (has(item, a, a.length <= 3 ? '' : 'i')) return name;
    }
  }
  return '';
}

function readSkills(skillLines, prose) {
  const found = [];
  const add = (s) => {
    if (s && !found.some((f) => f.toLowerCase() === s.toLowerCase())) found.push(s);
  };
  // A whole item that is a known skill ("Health and safety") stays whole; otherwise
  // "Recruitment and onboarding" becomes two skills.
  const exactly = (item) => SKILLS.find((names) => names.some((n) => n.toLowerCase() === item.toLowerCase()));
  skillLines
    .map((l) => l.replace(/^[^:]{2,30}:\s*/, '')) // "Computer skills: Excel, Word" -> "Excel, Word"
    .flatMap((l) => l.split(/[,;•●▪◦·|*‣\t]|\s[–-]\s/))
    .map((s) => s.replace(BULLET, '').replace(/[.:]+$/, '').trim())
    .flatMap((s) => (exactly(s) ? [s] : s.split(/\s+and\s+/i)))
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .forEach((item) => {
      const known = canonicalSkill(item);
      if (known) add(known);
      else if (words(item).length <= 4 && !/\d{4}/.test(item)) add(item.charAt(0).toUpperCase() + item.slice(1));
    });
  // Hard skills mentioned in experience or profile text ("built dashboards in Power BI").
  for (const [name, ...aliases] of SKILLS) {
    if (PROSE_SKIP.has(name)) continue;
    if ([name, ...aliases].some((a) => has(prose, a, a.length <= 3 ? '' : 'i'))) add(name);
  }
  return found.slice(0, 15);
}

function readExperience(lines) {
  const text = lines
    .map((l) => l.replace(/\t/g, ' | ').replace(BULLET, (m) => (m.trim() ? '- ' : '')))
    .join('\n')
    .trim();
  return text.length > 600 ? `${text.slice(0, 597)}...` : text;
}

// ---------- job preferences ----------

const labelled = (lines, label) => {
  const line = lines.find((l) => new RegExp(`^${label}\\s*:`, 'i').test(l));
  return line ? line.split(':').slice(1).join(':').trim() : '';
};
const pickFrom = (list, text) => list.filter((item) => text.toLowerCase().includes(item.toLowerCase()));

function prefsFromLookingFor(looking) {
  const all = looking.join(' ');
  return {
    types: pickFrom(TYPES, labelled(looking, 'job types?') || all),
    fields: pickFrom(FIELDS, labelled(looking, 'fields?') || all),
    provinces: pickFrom(PROVINCES, labelled(looking, 'locations?') || all),
    remote: /remote/i.test(labelled(looking, 'locations?') || all),
    minPay: parseInt((labelled(looking, 'minimum pay').match(/\d[\d\s]*/) || ['0'])[0].replace(/\s/g, ''), 10) || 0,
  };
}

// No "Looking for" section: suggest fields from studies (counted three times), skills and experience.
function suggestFields(study, skills, prose) {
  const scores = FIELDS.map((field) => {
    const list = FIELD_WORDS[field] || [];
    const hits = (text) => list.filter((w) => has(text, w)).length;
    return [field, hits(study) * 3 + hits(skills.join(', ')) + hits(prose)];
  })
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!scores.length) return [];
  const top = scores[0][1];
  return scores.filter(([, s]) => s >= Math.max(1, top / 2)).slice(0, 3).map(([f]) => f);
}

function suggestTypes(qual) {
  if (qual === 'Matric') return ['Learnership', 'Internship', 'Entry-level job'];
  if (qual === 'Diploma') return ['Internship', 'Learnership', 'Entry-level job'];
  return ['Graduate programme', 'Internship', 'Entry-level job'];
}

const WILLING = /\b(willing|happy|ready|open|able|prepared|available)\s+to\s+relocat/i;
const UNWILLING = /\b(not|un)\s*(willing|happy|ready|open|able|prepared|available)\s+to\s+relocat/i;

// ---------- the reader ----------

export function parseCv(text) {
  const raw = text
    .split('\n')
    .map((l) => unspace(l.replace(/ /g, ' ').trim()))
    .filter((l) => l && !IGNORE_LINE.test(l.replace(/[|:\t\s]+$/, '')));
  const sections = splitSections(raw);
  const labels = readLabels(raw);
  const out = {};
  const found = [];
  const suggested = [];

  const name = readName(raw, labels);
  if (name) {
    Object.assign(out, name);
    found.push('name');
  }

  const phone = readPhone(raw, labels);
  if (phone) {
    out.phone = phone;
    found.push('phone');
  }

  const place = readPlace(sections, labels);
  if (place) {
    out.province = place.province;
    if (place.city) out.city = place.city;
    found.push('location');
  }

  const eduLines = sections.education && sections.education.length ? sections.education : raw;
  const edu = readEducation(eduLines);
  if (edu) {
    out.qual = edu.qual;
    found.push('qualification');
    if (edu.study) out.study = edu.study;
    if (edu.institution) out.institution = edu.institution;
    if (edu.gradYear) out.gradYear = edu.gradYear;
    if (edu.study || edu.institution) found.push('education');
  }

  const experienceLines = sections.experience || [];
  const prose = [...experienceLines, ...(sections.profile || [])].join('\n');
  const skills = readSkills(sections.skills || [], prose);
  if (skills.length) {
    out.skills = skills;
    found.push(`${skills.length} skills`);
  }

  const experience = readExperience(experienceLines);
  if (experience) {
    out.experience = experience;
    found.push('experience');
  }

  if ((sections.looking || []).length) {
    out.prefs = prefsFromLookingFor(sections.looking);
    found.push('job preferences');
  } else {
    const profileText = (sections.profile || []).join(' ');
    out.prefs = {
      fields: suggestFields(out.study || '', skills, prose),
      types: suggestTypes(out.qual),
      provinces: out.province ? [out.province] : [],
      remote: /\b(remote|work from home|remotely)\b/i.test(profileText),
      minPay: 0,
    };
    const salary = text.match(/(salary expectations?|expected salary|minimum (pay|salary))\D{0,25}R\s?(\d[\d\s,]{2,8})/i);
    if (salary) out.prefs.minPay = parseInt(salary[3].replace(/[\s,]/g, ''), 10) || 0;
    suggested.push('job preferences');
  }

  if (WILLING.test(text) && !UNWILLING.test(text)) {
    out.prefs.relocate = true;
    found.push('willingness to relocate');
  }

  // Details employers don't need at this stage (POPIA: collect only what is needed).
  const sensitive = SENSITIVE.filter(([, re]) => labels.some((l) => re.test(l.label) && l.value)).map(([what]) => what);
  const hasIdNumber = /(^|[^\d])\d{6}\s?\d{4}\s?\d{2}\s?\d(?!\d)/.test(text);
  if (hasIdNumber && !sensitive.includes('ID number')) sensitive.unshift('ID number');

  return { profile: out, found, suggested, hasIdNumber, sensitive };
}
