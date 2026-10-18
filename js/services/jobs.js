// jobs.js
// Reading and changing the job list. Used by the jobs page, the job detail
// sheet and the admin page.

import { getState, save } from '../core/store.js';
import { uid } from '../lib/utils.js';

export const allJobs = () => getState().jobs;
export const jobById = (id) => getState().jobs.find((j) => j.id === id) || null;
export const isClosed = (job) => new Date(`${job.closes}T23:59:59`).getTime() < Date.now();
export const openJobs = () => allJobs().filter((j) => !isClosed(j));

export function addJob(data) {
  const job = { ...data, id: `c${uid()}`, posted: new Date().toISOString().slice(0, 10) };
  getState().jobs.unshift(job);
  save();
  return job;
}

export function updateJob(id, data) {
  Object.assign(jobById(id), data);
  save();
}

export function deleteJob(id) {
  const s = getState();
  s.jobs = s.jobs.filter((j) => j.id !== id);
  save();
}
