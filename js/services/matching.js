// matching.js
// Scores how well a job fits a person's profile (0 to 100) and explains why.
// Change the scoring weights here. Nothing in this file touches the screen.
//
// Weights: field 30, job type 15, qualification 20, location 15, pay 10, skills 10.

import { QUALS } from '../config.js';
import { money } from '../lib/utils.js';

const qualLevel = (q) => QUALS.indexOf(q);

export function match(user, job) {
  const p = user.prefs || {};
  const reasons = [];
  let score = 0;

  const fieldOk = (p.fields || []).includes(job.field);
  if (fieldOk) score += 30;
  reasons.push({
    ok: fieldOk,
    text: fieldOk ? `In a field you want: ${job.field}` : `${job.field} is not one of your fields`,
  });

  const typeOk = (p.types || []).includes(job.type);
  if (typeOk) score += 15;
  reasons.push({
    ok: typeOk,
    text: typeOk ? `${job.type} is a type you want` : `${job.type} is not a type you picked`,
  });

  const qualOk = qualLevel(user.qual) >= qualLevel(job.qual);
  if (qualOk) score += 20;
  reasons.push({
    ok: qualOk,
    text: qualOk
      ? `You meet the ${job.qual.toLowerCase()} requirement`
      : `Needs at least a ${job.qual.toLowerCase()}`,
  });

  const inProvince = (p.provinces || []).includes(job.province);
  const locOk = job.mode === 'Remote' ? !!p.remote || inProvince : inProvince;
  if (locOk) score += 15;
  let locText;
  if (job.mode === 'Remote') {
    locText = locOk ? 'Remote, and you are open to remote work' : 'Remote, but you have not chosen remote work';
  } else {
    locText = locOk ? `${job.province} is a province you picked` : `${job.province} is outside your provinces`;
  }
  reasons.push({ ok: locOk, text: locText });

  const payOk = !p.minPay || job.pay >= p.minPay;
  score += payOk ? 10 : Math.max(0, Math.round((10 * job.pay) / p.minPay) - 5);
  reasons.push({
    ok: payOk,
    text: payOk
      ? `${money(job.pay)} meets your minimum of ${money(p.minPay || 0)}`
      : `${money(job.pay)} is below your minimum of ${money(p.minPay)}`,
  });

  const mine = (user.skills || []).map((s) => s.toLowerCase());
  const have = job.skills.filter((s) => mine.includes(s.toLowerCase()));
  score += Math.round((10 * have.length) / Math.max(1, job.skills.length));
  reasons.push({
    ok: have.length > 0,
    text: have.length
      ? `You have ${have.length} of ${job.skills.length} listed skills`
      : 'None of the listed skills are on your profile',
  });

  return { score: Math.max(0, Math.min(100, score)), qualOk, locOk, reasons, have };
}

// A "strong match" is what auto-apply and one-tap "Apply to all" use.
export const isStrongMatch = (m, minScore) => m.qualOk && m.locOk && m.score >= minScore;

// What is still missing before the person can apply. Empty list = ready.
export function profileGaps(u) {
  const gaps = [];
  if (!u.name || !u.surname) gaps.push('your name');
  if (!u.qual) gaps.push('your highest qualification');
  if (!u.prefs || !(u.prefs.fields || []).length) gaps.push('the fields you want');
  if (!u.prefs || !(u.prefs.types || []).length) gaps.push('the job types you want');
  if (!u.prefs || (!(u.prefs.provinces || []).length && !u.prefs.remote)) gaps.push('where you want to work');
  if (!u.cv) gaps.push('your CV');
  return gaps;
}

export function completeness(u) {
  const parts = [
    u.name && u.surname,
    u.phone,
    u.city && u.province,
    u.qual,
    u.study,
    (u.skills || []).length,
    u.experience,
    u.prefs && (u.prefs.fields || []).length,
    u.prefs && (u.prefs.types || []).length,
    u.cv,
  ];
  return Math.round((100 * parts.filter(Boolean).length) / parts.length);
}
