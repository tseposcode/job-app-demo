// toast.js
// The short message that pops up at the bottom ("Profile saved.").

import { $ } from '../lib/utils.js';

let timer;

export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}
