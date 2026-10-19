// job-source.js
// Where the job list comes from. Pages and auto-apply read jobs from the store;
// only this file knows the source, so real job feeds plug in here.
//
// LIVE: our server reads job feeds (job board APIs and company careers pages we
// have permission to use), turns each listing into the job shape in
// data/seed-jobs.js (including `apply` and `source`), removes duplicates, and
// this file fetches the result. Jobs the admin adds by hand are always kept.

import { JOB_SOURCE } from '../config.js';
import { getState, save } from '../core/store.js';
import { SEED_JOBS } from '../data/seed-jobs.js';

const SOURCES = {
  sample: { name: 'Sample jobs', live: false, fetch: async () => structuredClone(SEED_JOBS) },
};

const source = () => SOURCES[JOB_SOURCE] || SOURCES.sample;
export const sourceName = () => source().name;
export const isLiveSource = () => source().live;

// Add jobs the device doesn't have yet, and fill in how to apply on jobs saved by older
// versions. Jobs edited or added by the admin are left as they are.
export async function syncJobs() {
  const incoming = await source().fetch();
  const s = getState();
  let added = 0;
  for (const job of incoming) {
    const have = s.jobs.find((j) => j.id === job.id);
    if (!have) {
      s.jobs.push(job);
      added++;
    } else if (!have.apply) {
      have.apply = job.apply;
      have.source = job.source;
    }
  }
  s.jobsSyncedAt = Date.now();
  save();
  return added;
}
