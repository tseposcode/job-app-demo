// profile.js
// The Profile page: photo, CV, auto-apply settings, details and preferences.
// setupProfileUploads() wires the hidden photo and CV file pickers once at start.

import { $, $$, ago, esc, initials, money } from '../lib/utils.js';
import { ICON } from '../lib/icons.js';
import { save } from '../core/store.js';
import { deleteCv, getCv, putCv } from '../core/files.js';
import { currentUser, logout } from '../services/auth.js';
import { completeness } from '../services/matching.js';
import { confirmInline } from '../ui/forms.js';
import { openProfileEdit } from './sheets/profile-edit.js';

const MAX_CV_BYTES = 5 * 1024 * 1024;

const row = (label, value) =>
  `<div class="row"><dt>${esc(label)}</dt><dd>${value ? esc(value) : '<span class="muted">Not added</span>'}</dd></div>`;

function cvBlock(u) {
  if (!u.cv) {
    return '<div class="cv"><span class="doc">CV</span><div><strong>No CV yet</strong><span>PDF or Word, up to 5 MB. It stays on this device.</span></div></div><div class="cv-actions"><button class="btn sm primary" id="cvReplace">Upload CV</button></div>';
  }
  const ext = (u.cv.name.split('.').pop() || 'PDF').toUpperCase().slice(0, 4);
  const kb = Math.max(1, Math.round(u.cv.size / 1024));
  return `<div class="cv"><span class="doc">${esc(ext)}</span><div><strong>${esc(u.cv.name)}</strong><span class="num">${kb} KB · uploaded ${esc(
    ago(u.cv.at),
  )}${u.cv.sample ? ' · sample' : ''}</span></div></div>
    <div class="cv-actions"><button class="btn sm" id="cvReplace">Replace</button>${
      u.cv.sample ? '' : '<button class="btn sm" id="cvView">View</button>'
    }<button class="btn sm danger" id="cvRemove">Remove</button></div>`;
}

export function render() {
  const u = currentUser();
  const p = u.prefs || {};
  const pct = completeness(u);
  const where = [...(p.provinces || [])].join(', ') + (p.remote ? `${(p.provinces || []).length ? ' + ' : ''}remote` : '');
  return `
    <div class="who-card">
      <button type="button" class="avatar" id="avatarBtn" aria-label="Change profile photo">${
        u.photo ? `<img src="${u.photo}" alt="">` : `<span>${esc(initials(u))}</span>`
      }<span class="cam" aria-hidden="true">${ICON.cam}</span></button>
      <h1>${esc(`${u.name || ''} ${u.surname || ''}`)}</h1>
      <p class="role">${esc(u.study || 'Add what you studied')}${u.city ? ` · ${esc(u.city)}` : ''}</p>
    </div>
    <div class="card"><div class="section-h"><strong>Profile ${pct}% complete</strong><button class="btn sm" id="editProfile">Edit profile</button></div><div class="meter"><i style="width:${pct}%"></i></div></div>
    <section class="section"><h2>CV</h2><div class="list">${cvBlock(u)}</div></section>
    <section class="section"><h2>Auto-apply</h2><div class="list">
      <div class="setting"><div><strong>How to apply</strong><span>${
        u.auto.mode === 'auto' ? 'Applies to matches by itself' : 'You review each match and tap to apply'
      }</span></div>
        <div class="seg" role="group" aria-label="Apply mode"><button data-mode="auto" aria-pressed="${u.auto.mode === 'auto'}">Automatic</button><button data-mode="one" aria-pressed="${
          u.auto.mode === 'one'
        }">One-tap</button></div></div>
      <div class="setting"><div><strong>Minimum match</strong><span>Only jobs at or above this score count as matches</span></div></div>
      <div class="range-row"><input type="range" id="minMatch" min="50" max="95" step="5" value="${u.auto.min}" aria-label="Minimum match"><output id="minOut" class="num">${u.auto.min}%</output></div>
      <div class="setting"><div><strong>Pause applying</strong><span>Stops all auto-apply until you resume</span></div><button class="switch" id="pauseSw" role="switch" aria-checked="${!!u
        .auto.paused}" aria-label="Pause applying"></button></div>
    </div></section>
    <section class="section"><h2>Personal details</h2><dl class="list">
      ${row('Name', u.name)}${row('Surname', u.surname)}${row('Email', u.email)}${row('Phone', u.phone)}${row(
        'Location',
        [u.city, u.province].filter(Boolean).join(', '),
      )}
    </dl></section>
    <section class="section"><h2>Education and skills</h2><dl class="list">
      ${row('Qualification', u.qual)}${row('Studied', u.study)}${row('Institution', u.institution)}${row('Graduated', u.gradYear)}
      <div class="row"><dt>Skills</dt><dd>${
        (u.skills || []).length
          ? `<span class="skills">${u.skills.map((s) => `<span class="skill">${esc(s)}</span>`).join('')}</span>`
          : '<span class="muted">Not added</span>'
      }</dd></div>
      ${row('Experience', u.experience)}
    </dl></section>
    <section class="section"><h2>Job preferences</h2><dl class="list">
      ${row('Fields', (p.fields || []).join(', '))}${row('Job types', (p.types || []).join(', '))}${row('Provinces', where)}${row(
        'Minimum pay',
        p.minPay ? `${money(p.minPay)} per month` : '',
      )}
    </dl></section>
    <div class="actions"><button class="btn" id="logout">Log out</button><button class="btn ghost" data-go="admin">Admin</button></div>`;
}

export function bind(root, ctx) {
  const u = currentUser();
  $('#editProfile', root).addEventListener('click', () => openProfileEdit(ctx));
  $('#avatarBtn', root).addEventListener('click', () => $('#photoInput').click());
  $('#cvReplace', root).addEventListener('click', () => $('#cvInput').click());

  $('#cvView', root)?.addEventListener('click', async () => {
    const file = await getCv(u.email);
    if (!file) return ctx.toast('The CV file is not on this device any more. Upload it again.');
    const url = URL.createObjectURL(file);
    const a = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });

  $('#cvRemove', root)?.addEventListener('click', (e) => {
    confirmInline(e.currentTarget.parentNode, {
      message: 'Remove your CV? Auto-apply stops until you upload one again.',
      yes: 'Remove',
      no: 'Keep it',
      onYes: () => {
        deleteCv(u.email);
        u.cv = null;
        save();
        ctx.toast('CV removed.');
        ctx.refresh();
      },
      onNo: ctx.refresh,
    });
  });

  $$('[data-mode]', root).forEach((b) =>
    b.addEventListener('click', () => {
      u.auto.mode = b.dataset.mode;
      save();
      ctx.toast(u.auto.mode === 'auto' ? 'Automatic apply is on.' : 'One-tap apply is on.');
      ctx.autoApply({ silent: true });
      ctx.refresh();
    }),
  );

  const slider = $('#minMatch', root);
  slider.addEventListener('input', () => {
    $('#minOut', root).textContent = `${slider.value}%`;
  });
  slider.addEventListener('change', () => {
    u.auto.min = parseInt(slider.value, 10);
    save();
    ctx.autoApply();
    ctx.refresh();
  });

  $('#pauseSw', root).addEventListener('click', () => {
    u.auto.paused = !u.auto.paused;
    save();
    ctx.toast(u.auto.paused ? 'Applying paused.' : 'Applying resumed.');
    ctx.autoApply();
    ctx.refresh();
  });

  $('#logout', root).addEventListener('click', () => {
    logout();
    ctx.go('login');
  });
}

// The file pickers live outside the page (in index.html), so wire them once.
export function setupProfileUploads(ctx) {
  $('#photoInput').addEventListener('change', (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    const u = currentUser();
    input.value = '';
    if (!file || !u) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Square-crop and shrink so it fits in browser storage.
        const size = 240;
        const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
        const side = Math.min(img.width, img.height);
        canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        u.photo = canvas.toDataURL('image/jpeg', 0.82);
        save();
        ctx.refresh();
      };
      img.onerror = () => ctx.toast('That photo could not be opened. Try a JPG or PNG.');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  $('#cvInput').addEventListener('change', async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    const u = currentUser();
    input.value = '';
    if (!file || !u) return;
    if (!/\.(pdf|docx?)$/i.test(file.name)) return ctx.toast('Upload a PDF or Word document.');
    if (file.size > MAX_CV_BYTES) return ctx.toast('That file is over 5 MB. Upload a smaller CV.');
    await putCv(u.email, file);
    u.cv = { name: file.name, size: file.size, at: Date.now(), sample: false };
    save();
    ctx.toast('CV uploaded.');
    ctx.autoApply();
    ctx.refresh();
  });
}
