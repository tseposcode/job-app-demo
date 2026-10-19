// cover-note.js
// The short cover note sent with each application, written from the person's
// profile and the job. Plain rules, no AI: the same profile and job always give
// the same note. Employers see it above the CV (views/sheets/employer-view.js).

const list = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const lower = (s) => String(s || '').toLowerCase();

export function coverNote(user, job) {
  const skills = (user.skills || []).filter((s) => (job.skills || []).some((js) => lower(js) === lower(s)));
  const other = (user.skills || []).filter((s) => !skills.includes(s)).slice(0, 2);
  const study = user.study ? `${user.study}${user.institution ? ` at ${user.institution}` : ''}${user.gradYear ? ` (${user.gradYear})` : ''}` : '';
  const where =
    job.mode === 'Remote'
      ? 'I am set up to work remotely.'
      : (user.city && lower(user.city) === lower(job.city)) || (user.province && user.province === job.province)
        ? `I am based in ${user.city || user.province}, so I can start at your ${job.city} office.`
        : user.prefs && user.prefs.relocate
          ? `I am willing to relocate to ${job.city}.`
          : '';
  const lines = [
    `Dear ${job.company} hiring team,`,
    `I would like to apply for the ${job.title} position.${study ? ` I completed ${study}.` : user.qual ? ` My highest qualification is ${lower(user.qual)}.` : ''}`,
    skills.length
      ? `I bring ${list(skills)}, which your listing asks for${other.length ? `, as well as ${list(other)}` : ''}.`
      : other.length
        ? `My skills include ${list(other)}.`
        : '',
    user.experience ? `Experience: ${user.experience}` : '',
    where,
    'My CV is attached. I would welcome the chance to talk about how I can contribute.',
    `Kind regards,\n${user.name} ${user.surname}${user.phone ? `\n${user.phone}` : ''}\n${user.email}`,
  ];
  return lines.filter(Boolean).join('\n\n');
}
