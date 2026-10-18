// admin.js
// The Admin page, behind a 4-digit PIN: manage jobs, see applications,
// change the PIN, reset the test data.

import { $, $$, ago, esc, fmtDate } from '../lib/utils.js';
import { getState, replaceState, save } from '../core/store.js';
import { deleteCv } from '../core/files.js';
import { currentUser } from '../services/auth.js';
import { allJobs, deleteJob, isClosed, jobById, openJobs } from '../services/jobs.js';
import { allApplications, statusOf } from '../services/applications.js';
import { createSeedState } from '../data/seed-state.js';
import { confirmInline, showError } from '../ui/forms.js';
import { openJobEdit } from './sheets/job-edit.js';

let unlocked = false; // resets on reload, so the PIN is asked again

function renderPin() {
  const digits = [0, 1, 2, 3]
    .map(
      (i) =>
        `<input type="password" inputmode="numeric" maxlength="1" class="pinD" aria-label="PIN digit ${i + 1}" autocomplete="off">`,
    )
    .join('');
  return `
    <div class="hello"><h1>Admin</h1><p class="muted">Enter the 4-digit PIN to manage jobs and see applications.</p></div>
    <form class="card form" id="pinForm" novalidate>
      <div class="pin">${digits}</div>
      <p class="err" id="pinErr" hidden style="text-align:center">That PIN is not right. Try again.</p>
      <button class="btn primary wide" type="submit">Unlock</button>
    </form>
    <button class="btn ghost" data-go="${currentUser() ? 'profile' : 'login'}">Back</button>`;
}

function renderAdmin() {
  const s = getState();
  const now = Date.now();
  const apps = allApplications();
  const jobRows = allJobs()
    .map(
      (j) =>
        `<div class="adm-row"><div><strong>${esc(j.title)}</strong><span class="small muted">${esc(j.company)} · ${esc(
          j.city,
        )} · closes ${esc(fmtDate(j.closes))}${isClosed(j) ? ' · closed' : ''}</span></div><div class="btns"><button class="btn sm" data-edit="${
          j.id
        }">Edit</button><button class="btn sm danger" data-del="${j.id}">Delete</button></div></div>`,
    )
    .join('');
  const appRows = apps.length
    ? apps
        .map((a) => {
          const j = jobById(a.jobId);
          const st = statusOf(a, now);
          const u = s.users[a.email];
          return `<div class="adm-row"><div><strong>${esc(u ? `${u.name} ${u.surname}` : a.email)}</strong><span class="small muted">${esc(
            j ? j.title : a.jobTitle,
          )} · ${a.method === 'auto' ? 'auto' : 'one-tap'} · ${esc(ago(a.at))}</span></div><span class="state ${st.key}">${esc(
            st.label,
          )}</span></div>`;
        })
        .join('')
    : '<div class="adm-row"><span class="muted">No applications yet.</span></div>';
  return `
    <div class="hello"><h1>Admin</h1><p class="muted">Manage the jobs on this device and see every application.</p></div>
    <div class="stats"><div class="stat"><b class="num">${openJobs().length}</b><span>Open jobs</span></div><div class="stat"><b class="num">${
      apps.length
    }</b><span>Applications</span></div><div class="stat"><b class="num">${Object.keys(s.users).length}</b><span>Accounts</span></div></div>
    <section class="section"><div class="section-h"><h2>Jobs</h2><button class="btn sm primary" id="addJob">Add job</button></div><div class="list">${jobRows}</div></section>
    <section class="section"><h2>Applications</h2><div class="list">${appRows}</div></section>
    <section class="section"><h2>Settings</h2><div class="card form">
      <form class="form" id="pinChange" novalidate><label class="field"><span>New admin PIN (4 digits)</span><input type="password" inputmode="numeric" maxlength="4" id="newPin" autocomplete="off"></label><p class="err" id="newPinErr" hidden></p><button class="btn sm" type="submit">Change PIN</button></form>
      <div id="resetBox"><button class="btn sm danger" id="resetAsk">Reset all test data</button></div>
    </div></section>
    <div class="actions"><button class="btn" id="lockAdmin">Lock admin</button><button class="btn ghost" data-go="${
      currentUser() ? 'jobs' : 'login'
    }">Back to app</button></div>`;
}

export const render = () => (unlocked ? renderAdmin() : renderPin());

export function bind(root, ctx) {
  if (!unlocked) return bindPin(root, ctx);

  $('#addJob', root).addEventListener('click', () => openJobEdit(null, ctx));
  $$('[data-edit]', root).forEach((b) => b.addEventListener('click', () => openJobEdit(b.dataset.edit, ctx)));
  $$('[data-del]', root).forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.del;
      confirmInline(b.closest('.adm-row'), {
        message: `Delete "${jobById(id).title}"? Applications to it stay in the list.`,
        yes: 'Delete',
        onYes: () => {
          deleteJob(id);
          ctx.toast('Job deleted.');
          ctx.refresh();
        },
        onNo: ctx.refresh,
      });
    }),
  );

  $('#pinChange', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = $('#newPin', root).value.trim();
    if (!/^\d{4}$/.test(pin)) return showError($('#newPinErr', root), 'The PIN must be exactly 4 digits.');
    getState().pin = pin;
    save();
    ctx.toast('Admin PIN changed.');
    ctx.refresh();
  });

  $('#resetAsk', root).addEventListener('click', () => {
    confirmInline($('#resetBox', root), {
      message:
        'Reset everything on this device? All accounts except the test account, all applications and all job changes are deleted.',
      yes: 'Reset',
      onYes: () => {
        Object.keys(getState().users).forEach((email) => deleteCv(email));
        replaceState(createSeedState());
        unlocked = false;
        ctx.toast('Test data reset.');
        ctx.go('login');
      },
      onNo: ctx.refresh,
    });
  });

  $('#lockAdmin', root).addEventListener('click', () => {
    unlocked = false;
    ctx.go(currentUser() ? 'profile' : 'login');
  });
}

function bindPin(root, ctx) {
  const form = $('#pinForm', root);
  const digits = $$('.pinD', root);
  digits.forEach((d, i) => {
    d.addEventListener('input', () => {
      d.value = d.value.replace(/\D/g, '').slice(-1);
      if (d.value && digits[i + 1]) digits[i + 1].focus();
      if (digits.every((x) => x.value)) form.requestSubmit();
    });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !d.value && digits[i - 1]) digits[i - 1].focus();
    });
  });
  digits[0].focus();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = digits.map((d) => d.value).join('');
    if (pin === getState().pin) {
      unlocked = true;
      ctx.refresh();
    } else {
      $('#pinErr', root).hidden = false;
      digits.forEach((d) => {
        d.value = '';
      });
      digits[0].focus();
    }
  });
}
