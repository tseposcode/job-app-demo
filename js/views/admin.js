// admin.js
// The Admin page, behind a 4-digit PIN: manage jobs, see applications,
// change the PIN, reset the test data.

import { $, $$, ago, esc, fmtDate, fmtDay, money } from '../lib/utils.js';
import { getState, replaceState, save } from '../core/store.js';
import { deleteCv } from '../core/files.js';
import { currentUser } from '../services/auth.js';
import { allJobs, deleteJob, isClosed, jobById, openJobs } from '../services/jobs.js';
import { allApplications, statusOf } from '../services/applications.js';
import { hasActiveSubscription, planById } from '../services/subscription.js';
import { allPayments, businessNumbers } from '../services/business.js';
import { refundPayment, runBillingForAll } from '../services/billing.js';
import { methodLabel } from '../services/payments.js';
import { allTickets, closeTicket } from '../services/support.js';
import { jumpDays, jumpTo, now as clockNow, offsetDays, resetClock } from '../core/clock.js';
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
  const users = Object.values(s.users);
  const subscribers = users.filter((u) => hasActiveSubscription(u)).length;
  // Who agreed to what and when: the consent record POPIA expects us to keep.
  const accountRows = users
    .map((u) => {
      const c = u.consent;
      const consent = c ? `consent ${fmtDay(c.at)} (v${esc(c.version)})${c.marketing ? ', marketing yes' : ''}` : 'no consent yet';
      const plan = hasActiveSubscription(u) ? `${u.subscription.status === 'active' ? 'paying' : 'cancelled'}` : 'no plan';
      return `<div class="adm-row"><div><strong>${esc(`${u.name} ${u.surname}`)}</strong><span class="small muted">${consent} · ${plan}${
        u.onboarded ? '' : ' · setup not finished'
      }</span></div></div>`;
    })
    .join('');
  const b = businessNumbers();
  const planMix = Object.entries(b.plans)
    .map(([id, n]) => `${(planById(id) || { name: id }).name} ${n}`)
    .join(' · ');
  const payRows = allPayments()
    .slice(0, 30)
    .map(
      (p) => `<div class="adm-row"><div><strong class="num">${money(p.amount)} · ${esc(p.name)}</strong><span class="small muted">${fmtDay(p.at)} · ${esc(
        methodLabel(p.method) || 'Payment',
      )} · ${esc(p.ref)}${p.kind === 'renewal' ? ' · renewal' : ''}</span></div>${
        p.refundedAt
          ? '<span class="state rejected">Refunded</span>'
          : `<button class="btn sm" data-refund="${esc(p.ref)}" data-email="${esc(p.email)}">Refund</button>`
      }</div>`,
    )
    .join('');
  const tickets = allTickets();
  const ticketRows = tickets.length
    ? tickets
        .map(
          (t) => `<div class="adm-row"><div><strong>${esc(t.topic)} · ${esc(t.name)}</strong><span class="small muted">${esc(t.email)} · ${esc(
            ago(t.at),
          )} · ${esc(t.id)}</span><span class="small">${esc(t.message)}</span></div>${
            t.status === 'open' ? `<button class="btn sm" data-close-ticket="${esc(t.id)}">Done</button>` : '<span class="muted small">Done</span>'
          }</div>`,
        )
        .join('')
    : '<div class="adm-row"><span class="muted">No messages yet.</span></div>';
  const nextDue = Object.values(s.users)
    .map((u) => u.subscription)
    .filter((x) => x && ['active', 'past_due'].includes(x.status))
    .map((x) => (x.status === 'past_due' ? x.nextRetry : x.renewsAt))
    .sort((a, b2) => a - b2)[0];
  return `
    <div class="hello"><h1>Admin</h1><p class="muted">Manage the jobs on this device and see every application.</p></div>
    <section class="section"><h2>Business</h2>
      <div class="stats"><div class="stat"><b class="num">${b.subscribers}</b><span>Paying subscribers</span></div><div class="stat"><b class="num">${money(
        b.mrr,
      )}</b><span>Monthly recurring income</span></div><div class="stat"><b class="num">${money(b.thisMonth)}</b><span>Income this month</span></div><div class="stat"><b class="num">${money(
        b.total,
      )}</b><span>Income to date</span></div></div>
      <p class="small muted">${planMix || 'No active plans.'} · ${b.pastDue} payment failed · ${b.cancelled} cancelled · ${b.ended} ended${
        b.refunded ? ` · ${money(b.refunded)} refunded` : ''
      }. Test payments: no money moved.</p>
    </section>
    <section class="section"><h2>Test clock</h2><div class="card">
      <span>The app thinks today is <strong>${fmtDay(clockNow())}</strong>${offsetDays() ? ` (${offsetDays()} days ahead)` : ' (real date)'}. Move it forward to see renewals, failed payments and reminders happen.</span>
      <div class="list-actions"><button class="btn sm" data-jump="1">+1 day</button><button class="btn sm" data-jump="7">+1 week</button><button class="btn sm" data-jump="30">+30 days</button>${
        nextDue ? `<button class="btn sm primary" id="jumpDue">To next payment (${fmtDay(nextDue)})</button>` : ''
      }${offsetDays() ? '<button class="btn sm" id="clockReset">Back to today</button>' : ''}</div>
    </div></section>
    <section class="section"><h2>Payments</h2><div class="list">${payRows || '<div class="adm-row"><span class="muted">No payments yet.</span></div>'}</div></section>
    <section class="section"><h2>Messages from Help</h2><div class="list">${ticketRows}</div></section>
    <div class="stats"><div class="stat"><b class="num">${openJobs().length}</b><span>Open jobs</span></div><div class="stat"><b class="num">${
      apps.length
    }</b><span>Applications</span></div><div class="stat"><b class="num">${users.length}</b><span>Accounts</span></div><div class="stat"><b class="num">${subscribers}</b><span>Subscribers</span></div></div>
    <section class="section"><div class="section-h"><h2>Jobs</h2><button class="btn sm primary" id="addJob">Add job</button></div><div class="list">${jobRows}</div></section>
    <section class="section"><h2>Applications</h2><div class="list">${appRows}</div></section>
    <section class="section"><h2>Accounts</h2><div class="list">${accountRows}</div></section>
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

  const afterJump = () => {
    const r = runBillingForAll();
    ctx.toast(`Today is now ${fmtDay(clockNow())}. Renewed ${r.renewed}, failed ${r.failed}, ended ${r.ended}.`);
    ctx.refresh();
  };
  $$('[data-jump]', root).forEach((b) =>
    b.addEventListener('click', () => {
      jumpDays(+b.dataset.jump);
      afterJump();
    }),
  );
  $('#jumpDue', root)?.addEventListener('click', () => {
    const due = Object.values(getState().users)
      .map((u) => u.subscription)
      .filter((x) => x && ['active', 'past_due'].includes(x.status))
      .map((x) => (x.status === 'past_due' ? x.nextRetry : x.renewsAt))
      .sort((a, b) => a - b)[0];
    jumpTo(due + 60 * 1000);
    afterJump();
  });
  $('#clockReset', root)?.addEventListener('click', () => {
    resetClock();
    ctx.toast('The test clock is back to today.');
    ctx.refresh();
  });
  $$('[data-refund]', root).forEach((b) =>
    b.addEventListener('click', () => {
      confirmInline(b.closest('.adm-row'), {
        message: `Refund ${b.dataset.refund}? If it paid for the current period, that plan ends now.`,
        yes: 'Refund',
        onYes: () => {
          refundPayment(b.dataset.email, b.dataset.refund);
          ctx.toast('Refunded. The customer was emailed.');
          ctx.refresh();
        },
        onNo: ctx.refresh,
      });
    }),
  );
  $$('[data-close-ticket]', root).forEach((b) =>
    b.addEventListener('click', () => {
      closeTicket(b.dataset.closeTicket);
      ctx.refresh();
    }),
  );

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
