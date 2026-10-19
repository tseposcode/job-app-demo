// setup.js
// Sign-up steps 3 to 5: add a CV (own file or a sample), check the details we
// read from it, then choose job preferences and how to apply.
// Where the person is in setup is saved in user.setup, so a reload continues.

import { SAMPLE_CVS } from '../config.js';
import { $, $$, esc } from '../lib/utils.js';
import { save } from '../core/store.js';
import { currentUser } from '../services/auth.js';
import { profileGaps } from '../services/matching.js';
import { applyCvDetails, CV_ACCEPT, checkCvFile, readCv, storeCv } from '../services/cv.js';
import { showError } from '../ui/forms.js';
import { detailsFields, educationFields, prefsFields, readDetails, readEducation, readPrefs } from '../ui/profile-form.js';
import { accountLine, stepHeader } from '../ui/steps.js';

const stepOf = (u) => (u.setup && u.setup.step) || 'cv';

function goStep(u, step, extra = {}) {
  u.setup = { ...(u.setup || {}), ...extra, step };
  save();
}

// "phone, location and 7 skills"
const listText = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

const banner = (kind, title, text) =>
  `<div class="status${kind ? ` ${kind}` : ''}"><span class="dot"></span><div><strong>${esc(title)}</strong><span>${esc(text)}</span></div></div>`;

// ---- Step 3: CV ----

function renderCv(u) {
  const current = u.cv
    ? `<div class="cv"><span class="doc">${esc((u.cv.name.split('.').pop() || 'PDF').toUpperCase().slice(0, 4))}</span><div><strong>${esc(
        u.cv.name,
      )}</strong><span>Already added</span></div></div><button class="btn wide" type="button" id="keepCv">Keep this CV and continue</button>`
    : '';
  return `${stepHeader(3, 'Add your CV', 'Upload your CV and we will fill in your profile from it. You check everything before anything is sent.')}
    <div class="card">
      ${current}
      <button class="btn primary wide" type="button" id="pickCv">${u.cv ? 'Upload a different CV' : 'Upload my CV'}</button>
      <input type="file" id="setupCv" class="sr" accept="${CV_ACCEPT}" tabindex="-1">
      <p class="small muted">PDF or Word (.docx), up to 5 MB. In the test version it stays on this device.</p>
      <p class="err" id="cvErr" hidden></p>
    </div>
    <section class="section"><h2>Or try a sample CV</h2><p class="small muted">Made-up people for testing the app. They are not real.</p>
      <div class="list">${SAMPLE_CVS.map(
        (s, i) =>
          `<button class="pick" type="button" data-sample="${i}"><span class="doc">${s.file.endsWith('.docx') ? 'WORD' : 'PDF'}</span><span class="pick-t"><strong>${esc(
            s.person,
          )}</strong><span>${esc(s.about)}</span></span></button>`,
      ).join('')}</div>
    </section>
    <div id="reading" hidden>${banner('', 'Reading your CV...', 'This takes a few seconds.')}</div>
    ${accountLine(u)}`;
}

async function useFile(root, ctx, file, demo) {
  const err = $('#cvErr', root);
  const problem = checkCvFile(file);
  if (problem) return showError(err, problem);
  showError(err, '');
  $('#reading', root).hidden = false;
  $$('button', root).forEach((b) => (b.disabled = true));
  const u = currentUser();
  try {
    await storeCv(u, file, { demo });
    const result = await readCv(file);
    applyCvDetails(u, result.profile, { replace: true });
    goStep(u, 'details', {
      found: result.found.filter((f) => f !== 'name' && f !== 'job preferences'),
      prefsFrom: result.found.includes('job preferences') ? 'cv' : result.suggested.length ? 'suggested' : '',
      note: result.note,
      sensitive: result.sensitive,
    });
    ctx.refresh();
  } catch {
    $('#reading', root).hidden = true;
    $$('button', root).forEach((b) => (b.disabled = false));
    showError(err, 'Something went wrong saving your CV. Try again.');
  }
}

function bindCv(root, ctx, u) {
  const input = $('#setupCv', root);
  $('#pickCv', root).addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (file) useFile(root, ctx, file, false);
  });
  $('#keepCv', root)?.addEventListener('click', () => {
    goStep(u, 'details');
    ctx.refresh();
  });
  $$('[data-sample]', root).forEach((b) =>
    b.addEventListener('click', async () => {
      const sample = SAMPLE_CVS[+b.dataset.sample];
      try {
        const res = await fetch(sample.file);
        if (!res.ok) throw new Error(res.statusText);
        const blob = await res.blob();
        const file = new File([blob], sample.file.split('/').pop(), { type: blob.type });
        useFile(root, ctx, file, true);
      } catch {
        showError($('#cvErr', root), 'The sample CV could not be loaded. Open the app through a web server (see README).');
      }
    }),
  );
}

// ---- Step 4: details ----

function renderDetails(u) {
  const st = u.setup || {};
  const notes = [];
  if ((st.found || []).length) {
    notes.push(banner('', 'We read your CV.', `We filled in your ${listText(st.found)}. Check them and fix anything that is wrong.`));
  } else if (st.note) {
    notes.push(banner('warn', 'Fill in your details', st.note));
  }
  if ((st.sensitive || []).length) {
    const what = listText(st.sensitive.map((s) => (s === 'ID number' ? 'your ID number' : `${s} details`)));
    notes.push(
      banner('warn', `Your CV shows ${what}.`, 'Employers do not need this to consider you, and we do not save it. Think about removing it from your CV before you apply.'),
    );
  }
  return `${stepHeader(4, 'Check your details', 'Employers see these with your CV.')}
    ${notes.join('')}
    <form class="card form" id="dForm" novalidate>
      <h2>Personal details</h2>${detailsFields(u)}
      <h2>Education and skills</h2>${educationFields(u)}
      <p class="err" id="dErr" hidden></p>
      <div class="actions"><button class="btn" type="button" id="back">Back</button><button class="btn primary" type="submit">Next</button></div>
    </form>`;
}

function bindDetails(root, ctx, u) {
  $('#back', root).addEventListener('click', () => {
    goStep(u, 'cv');
    ctx.refresh();
  });
  $('#dForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const parts = [readDetails(root), readEducation(root)];
    const failed = parts.find((p) => p.error);
    if (failed) return showError($('#dErr', root), failed.error);
    if (!parts[1].data.qual) return showError($('#dErr', root), 'Choose your highest qualification.');
    parts.forEach((p) => Object.assign(u, p.data));
    goStep(u, 'prefs');
    ctx.refresh();
    window.scrollTo(0, 0);
  });
}

// ---- Step 5: preferences ----

function renderPrefs(u) {
  const st = u.setup || {};
  const mode = st.mode || 'auto';
  const from = {
    cv: banner('', 'Filled in from your CV.', 'Check that these are still what you want.'),
    suggested: banner('', 'Suggested from your CV.', 'We picked these from what you studied, your skills and where you live. Change anything that is not right.'),
  };
  return `${stepHeader(5, 'What jobs do you want?', 'We only apply to jobs that fit these. You can change them any time.')}
    ${from[st.prefsFrom] || ''}
    <form class="card form" id="prefForm" novalidate>
      ${prefsFields(u.prefs)}
      <div class="field"><span>How should Job Auto apply?</span>
        <div class="seg" role="group" aria-label="Apply mode"><button type="button" data-mode="auto" aria-pressed="${mode === 'auto'}">Automatic</button><button type="button" data-mode="one" aria-pressed="${
          mode === 'one'
        }">One-tap</button></div>
        <p class="small muted" id="modeHelp"></p>
      </div>
      <p class="err" id="prefErr" hidden></p>
      <div class="actions"><button class="btn" type="button" id="back">Back</button><button class="btn primary" type="submit">Next: choose a plan</button></div>
    </form>`;
}

const MODE_HELP = {
  auto: 'Automatic: your CV goes to every job that matches you at 75% or more. You can withdraw any application.',
  one: 'One-tap: we show you your matches and you tap to apply to each one.',
};

function bindPrefs(root, ctx, u) {
  let mode = (u.setup && u.setup.mode) || 'auto';
  const showMode = () => {
    $$('[data-mode]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('#modeHelp', root).textContent = MODE_HELP[mode];
  };
  showMode();
  $$('[data-mode]', root).forEach((b) =>
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      showMode();
    }),
  );
  $('#back', root).addEventListener('click', () => {
    goStep(u, 'details', { mode });
    ctx.refresh();
  });
  $('#prefForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    Object.assign(u, readPrefs(root).data);
    u.auto.mode = mode;
    const gaps = profileGaps(u);
    if (gaps.length) return showError($('#prefErr', root), `Still needed: ${gaps.join(', ')}.`);
    u.onboarded = true;
    delete u.setup;
    save();
    ctx.go('subscribe');
  });
}

// ---- Page ----

const STEPS = {
  cv: [renderCv, bindCv],
  details: [renderDetails, bindDetails],
  prefs: [renderPrefs, bindPrefs],
};

export function render() {
  const u = currentUser();
  return STEPS[stepOf(u)][0](u);
}

export function bind(root, ctx) {
  const u = currentUser();
  STEPS[stepOf(u)][1](root, ctx, u);
}
