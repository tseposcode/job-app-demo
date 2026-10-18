// cv-reader.js
// Reads a CV's text and picks out profile details: name, phone, location,
// education, skills, experience and what jobs the person is looking for.
// It returns only what it is fairly sure of; the person always checks the result.
//
// Works best with CVs that use headings like EDUCATION, SKILLS, EXPERIENCE and
// lines like "Fields: ..." (see samples/cvs). Other CVs give partial results.

import { FIELDS, PROVINCES, QUALS, TYPES } from '../config.js';

const HEADINGS = {
  education: /^(education|qualifications?|academic)/i,
  skills: /^(skills|key skills|competencies|technical skills)/i,
  experience: /^(experience|work experience|employment|work history)/i,
  looking: /^(looking for|career objective|job preferences|objective)/i,
  profile: /^(profile|summary|about me|personal statement)/i,
};

const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const isHeading = (line) => line.length < 40 && line === line.toUpperCase() && /[A-Z]/.test(line);

function splitSections(lines) {
  const sections = { top: [] };
  let current = 'top';
  for (const line of lines) {
    if (isHeading(line)) {
      const key = Object.keys(HEADINGS).find((k) => HEADINGS[k].test(line.trim()));
      current = key || `other:${line}`;
      sections[current] = sections[current] || [];
      continue;
    }
    (sections[current] = sections[current] || []).push(line);
  }
  return sections;
}

// "Fields: A, B" -> the items of a list that appear in the text.
const pickFrom = (list, text) => list.filter((item) => text.toLowerCase().includes(item.toLowerCase()));
const labelled = (lines, label) => {
  const line = lines.find((l) => new RegExp(`^${label}\\s*:`, 'i').test(l));
  return line ? line.split(':').slice(1).join(':').trim() : '';
};

function qualificationFrom(text) {
  const t = text.toLowerCase();
  const stated = QUALS.find((q) => new RegExp(`highest qualification\\s*:\\s*${q}`, 'i').test(text));
  if (stated) return stated;
  if (/honours|\bhons\b|bachelor of .* honours/.test(t)) return 'Honours';
  if (/\b(bsc|bcom|ba|bed|beng|llb|bachelor|degree)\b/.test(t)) return 'Degree';
  if (/diploma/.test(t)) return 'Diploma';
  if (/matric|national senior certificate|\bnsc\b|grade 12/.test(t)) return 'Matric';
  return '';
}

export function parseCv(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const sections = splitSections(lines);
  const top = sections.top || [];
  const out = {};
  const found = [];

  // Name: the first short line made only of letters.
  const nameLine = top.find((l) => /^[A-Za-z' -]{3,40}$/.test(l) && l.split(/\s+/).length >= 2 && l.split(/\s+/).length <= 4);
  if (nameLine) {
    const parts = titleCase(nameLine).split(/\s+/);
    out.surname = parts.pop();
    out.name = parts.join(' ');
    found.push('name');
  }

  const phone = text.match(/(?:\+27|0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{4}/);
  if (phone) {
    out.phone = phone[0].replace(/\s+/g, ' ');
    found.push('phone');
  }

  // Location: "City, Province" anywhere near the top.
  for (const line of top) {
    const province = PROVINCES.find((p) => line.includes(p));
    if (province) {
      out.province = province;
      const before = line.split(province)[0].replace(/[,|]\s*$/, '').split('|').pop().trim();
      if (before) out.city = before.replace(/,$/, '').trim();
      found.push('location');
      break;
    }
  }

  const education = sections.education || [];
  const qual = qualificationFrom(education.join('\n') || text);
  if (qual) {
    out.qual = qual;
    found.push('qualification');
  }
  const mainCourse = education.find((l) => !/^highest qualification/i.test(l) && !/senior certificate|matric/i.test(l)) || '';
  if (mainCourse) {
    const [course, institution] = mainCourse.split(',').map((s) => s.trim());
    if (course) out.study = course;
    if (institution && !/^\d{4}$/.test(institution)) out.institution = institution;
    const year = mainCourse.match(/\b(19|20)\d{2}\b/);
    if (year) out.gradYear = year[0];
    found.push('education');
  }

  const skills = (sections.skills || [])
    .join(',')
    .split(/[,•·;]/)
    .map((s) => s.replace(/^[-–]\s*/, '').trim())
    .filter((s) => s && s.length < 40);
  if (skills.length) {
    out.skills = [...new Set(skills)];
    found.push(`${out.skills.length} skills`);
  }

  const experience = (sections.experience || []).map((l) => l.replace(/^[-–]\s*/, '- ')).join('\n');
  if (experience) {
    out.experience = experience.length > 400 ? `${experience.slice(0, 397)}...` : experience;
    found.push('experience');
  }

  // What they want: "Job types:", "Fields:", "Locations:", "Minimum pay:".
  const looking = sections.looking || [];
  if (looking.length) {
    const prefs = {
      types: pickFrom(TYPES, labelled(looking, 'job types?') || looking.join(' ')),
      fields: pickFrom(FIELDS, labelled(looking, 'fields?') || looking.join(' ')),
      provinces: pickFrom(PROVINCES, labelled(looking, 'locations?') || looking.join(' ')),
      remote: /remote/i.test(labelled(looking, 'locations?') || looking.join(' ')),
      minPay: parseInt((labelled(looking, 'minimum pay').match(/\d[\d\s]*/) || ['0'])[0].replace(/\s/g, ''), 10) || 0,
    };
    out.prefs = prefs;
    found.push('job preferences');
  }

  const willing = /\b(willing|happy|ready|open|able) to relocate/i;
  const unwilling = /\b(not|un)\s*(willing|happy|ready|open|able) to relocate/i;
  if (willing.test(text) && !unwilling.test(text)) {
    out.prefs = { ...(out.prefs || {}), relocate: true };
    found.push('that you can relocate');
  }

  // A South African ID number is 13 digits. Employers don't need it at this stage.
  const hasIdNumber = /\b\d{6}\s?\d{4}\s?\d{2}\s?\d\b/.test(text);

  return { profile: out, found, hasIdNumber };
}
