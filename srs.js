/* 복습 일정과 채점. 화면과 분리해 테스트할 수 있게 둔다. */
(function (root) {
  const DAY = 864e5, TEN_MIN = 6e5;
  const STEPS = [1, 3, 7, 16, 35, 80, 180];
  const MODES = [
    { min: 5, limit: 12, fresh: 2 },
    { min: 10, limit: 24, fresh: 5 },
    { min: 20, limit: 48, fresh: 10 },
    { min: 30, limit: 72, fresh: 15 },
    { min: 60, limit: 144, fresh: 25 },
  ];
  const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addDays = (t, n) => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() + n); return d.getTime(); };

  function grade(card, correct, now) {
    const c = Object.assign({ reps: 0, lapses: 0 }, card);
    c.seen = now;
    if (!correct) {
      c.lapses += 1; c.reps = Math.max(0, c.reps - 2); c.due = now + TEN_MIN; c.days = 0;
      return c;
    }
    c.reps += 1;
    const step = STEPS[Math.min(c.reps - 1, STEPS.length - 1)];
    c.days = Math.max(1, Math.round(step * Math.max(0.6, 1 - 0.1 * c.lapses)));
    c.due = addDays(now, c.days);
    return c;
  }
  function buildSession(items, cards, mode, now) {
    const due = items.filter(i => cards[i.id] && cards[i.id].due <= now).sort((a, b) => cards[a.id].due - cards[b.id].due);
    const fresh = items.filter(i => !cards[i.id]).slice().sort((a, b) => a.level - b.level || a.id.slice(-2).localeCompare(b.id.slice(-2)));
    const review = due.slice(0, mode.limit);
    const nFresh = Math.min(mode.fresh, fresh.length, mode.limit - review.length);
    return [...review.map(item => ({ item, kind: 'review' })), ...fresh.slice(0, nFresh).map(item => ({ item, kind: 'new' }))];
  }
  const clean = s => String(s || '').toLowerCase().replace(/[’]/g, "'").replace(/[^a-z' ]+/g, ' ').trim();
  function dist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  /* exact: 정확, typo: 긴 단어의 한 글자 오타, wrong: 오답 */
  function check(input, answer, spoken) {
    const a = clean(answer), words = clean(input).split(/\s+/).filter(Boolean);
    if (spoken) return words.includes(a) ? 'exact' : 'wrong';
    if (words.length !== 1) return 'wrong';
    if (words[0] === a) return 'exact';
    return a.length >= 5 && dist(words[0], a) === 1 ? 'typo' : 'wrong';
  }
  function splitBlank(en, blank) {
    const m = new RegExp("(^|[^A-Za-z'])(" + blank + ")(?![A-Za-z'])", 'i').exec(en);
    if (!m) return null;
    const at = m.index + m[1].length;
    return [en.slice(0, at), en.slice(at, at + m[2].length), en.slice(at + m[2].length)];
  }
  const api = { MODES, grade, buildSession, check, splitBlank, startOfDay, addDays };
  if (typeof module !== 'undefined') module.exports = api; else root.SRS = api;
})(this);
