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
  const LEVELS = ['NL', 'NM', 'NH', 'IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];
  const LEVEL_DESC = { NL: '단어로 말해요', NM: '외운 문장으로 말해요', NH: '짧은 문장으로 말해요', IL: '쉬운 문장으로 답해요', IM1: '일상 대화를 시작해요', IM2: '대화를 이어 가요', IM3: '경험을 설명해요', IH: '의견과 이유를 말해요', AL: '복잡한 상황을 풀어 가요' };
  function levelProgress(items, cards, level) {
    const all = items.filter(i => i.opic === level), learned = all.filter(i => cards[i.id]).length;
    return { total: all.length, learned, pct: all.length ? Math.round(learned / all.length * 100) : 0, done: all.length > 0 && learned === all.length };
  }
  const nextLevel = level => LEVELS[LEVELS.indexOf(level) + 1] || null;
  const canStudyLevel = (level, current) => LEVELS.indexOf(level) <= LEVELS.indexOf(current);
  function buildSession(items, cards, mode, now, level) {
    const due = items.filter(i => cards[i.id] && cards[i.id].due <= now).sort((a, b) => cards[a.id].due - cards[b.id].due);
    const fresh = items.filter(i => !cards[i.id] && (!level || i.opic === level)).slice().sort((a, b) => a.level - b.level || a.id.slice(-2).localeCompare(b.id.slice(-2)));
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
  /* 복습 단계: 빈칸 → 문장 배열 → 통문장 말하기 */
  const stageOf = card => { const r = card ? card.reps || 0 : 0; return r <= 0 ? 'blank' : r <= 2 ? 'arrange' : 'sentence'; };
  function rate(card, how, now) {
    const c = Object.assign({}, card); if (!c.days) return c;
    c.days = how === 'easy' ? Math.round(c.days * 1.5) + 1 : how === 'hard' ? Math.max(1, Math.round(c.days * .5)) : c.days;
    c.due = addDays(now, c.days); return c;
  }
  const CONTRACT = { "i'm": 'i am', "i'd": 'i would', "i'll": 'i will', "i've": 'i have', "it's": 'it is', "what's": 'what is', "that's": 'that is', "there's": 'there is', "let's": 'let us', "don't": 'do not', "can't": 'can not', cannot: 'can not', "doesn't": 'does not', "you're": 'you are', "we're": 'we are' };
  const SOFT = new Set(['a', 'an', 'the', 'oh', 'hmm', 'um', 'uh', 'sorry', 'wait', 'please', 'so', 'well', 'okay', 'ok', 'some', 'my', 'this', 'that']);
  const toks = s => clean(s).split(/\s+/).filter(Boolean).flatMap(w => (CONTRACT[w] || w).split(' '));
  const near = (a, b) => a === b || (a.length >= 5 && dist(a, b) === 1);
  const keyWords = expr => toks(String(expr).replace(/~\s*ing|~|\.\.\./g, ' ')).filter(w => !SOFT.has(w));
  /* 핵심 표현이 들어 있고 내용 단어의 70% 이상이 있으면 정답. 관사 같은 작은 단어는 넘어간다. */
  function gradeSentence(input, en, expression) {
    const got = toks(input), want = toks(en), has = w => got.some(g => near(g, w));
    const content = want.filter(w => !SOFT.has(w)), keys = keyWords(expression);
    const missing = content.filter(w => !has(w)), keyOk = keys.every(has);
    const cover = content.length ? (content.length - missing.length) / content.length : 1;
    return { ok: keyOk && cover >= .7 && got.length > 0, perfect: !missing.length && want.every(has), missing, has };
  }
  function bestSentence(alts, en, expression) {
    const all = alts.map(text => ({ text, r: gradeSentence(text, en, expression) }));
    return all.sort((a, b) => (b.r.ok - a.r.ok) || (a.r.missing.length - b.r.missing.length))[0];
  }
  const chipsOf = en => en.replace(/[.,?!]/g, '').split(/\s+/).map((w, i) => i === 0 ? w.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase()) : w);
  const api = { LEVELS, LEVEL_DESC, levelProgress, nextLevel, canStudyLevel, MODES, grade, buildSession, check, splitBlank, startOfDay, addDays, stageOf, rate, gradeSentence, bestSentence, chipsOf };
  if (typeof module !== 'undefined') module.exports = api; else root.SRS = api;
})(this);
