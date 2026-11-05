/* 복습 일정과 채점. 화면과 분리해 테스트할 수 있게 둔다. */
(function (root) {
  const DAY = 864e5, TEN_MIN = 6e5;
  const STEPS = [1, 3, 7, 16, 35, 80, 180];
  const MODES = [
    { min: 5, limit: 12, fresh: 2, freshWords: 3 },
    { min: 10, limit: 24, fresh: 5, freshWords: 5 },
    { min: 20, limit: 48, fresh: 8, freshWords: 10 },
    { min: 30, limit: 72, fresh: 12, freshWords: 15 },
    { min: 60, limit: 144, fresh: 20, freshWords: 30 },
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
  function buildSession(items, cards, mode, now, level, words) {
    const wordList = words || [], pool = items.concat(wordList);
    const due = pool.filter(i => cards[i.id] && cards[i.id].due <= now).sort((a, b) => cards[a.id].due - cards[b.id].due);
    const inLevel = i => !cards[i.id] && (!level || i.opic === level);
    const order = (a, b) => (a.level || 0) - (b.level || 0) || a.id.slice(-2).localeCompare(b.id.slice(-2));
    const fresh = items.filter(inLevel).slice().sort(order), freshW = wordList.filter(inLevel);
    const review = due.slice(0, mode.limit);
    const room = mode.limit - review.length;
    const nWords = Math.min(mode.freshWords || 0, freshW.length, room);
    const nFresh = Math.min(mode.fresh, fresh.length, room - nWords);
    return [...review.map(item => ({ item, kind: 'review' })), ...freshW.slice(0, nWords).map(item => ({ item, kind: 'new' })), ...fresh.slice(0, nFresh).map(item => ({ item, kind: 'new' }))];
  }
  const PROMOTION = { expr: .8, word: .8, settled: .6, maxDue: 5, retryMs: 12 * 36e5, passRate: .8, minSpeak: 3 };
  function promotionStatus(items, words, cards, level, now) {
    const ex = items.filter(i => i.opic === level), wd = words.filter(i => i.opic === level), all = ex.concat(wd);
    const lEx = ex.filter(i => cards[i.id]).length, lWd = wd.filter(i => cards[i.id]).length;
    const learned = all.filter(i => cards[i.id]), settled = learned.filter(i => (cards[i.id].reps || 0) >= 2).length;
    const due = items.concat(words).filter(i => cards[i.id] && cards[i.id].due <= now).length;
    const need = (t, r) => Math.ceil(t * r - 1e-9);
    const checks = [
      { id: 'expr', label: '표현 배우기', value: lEx, target: need(ex.length, PROMOTION.expr), ok: lEx >= need(ex.length, PROMOTION.expr) },
      { id: 'word', label: '단어 배우기', value: lWd, target: need(wd.length, PROMOTION.word), ok: lWd >= need(wd.length, PROMOTION.word) },
      { id: 'settled', label: '복습 두 번 이상 맞히기', value: settled, target: need(learned.length, PROMOTION.settled), ok: learned.length > 0 && settled >= need(learned.length, PROMOTION.settled) },
      { id: 'due', label: `밀린 복습 ${PROMOTION.maxDue}개 이하`, value: due, target: PROMOTION.maxDue, ok: due <= PROMOTION.maxDue },
    ];
    return { ready: checks.every(c => c.ok), checks };
  }
  const EXAM_SECS = { wordChoice: 20, choose: 20, blank: 30, wordBlank: 30, arrange: 45, sentence: 40 };
  function buildExam(items, words, level, rnd) {
    const r = rnd || Math.random, shuf = l => l.map(v => [r(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    const ex = shuf(items.filter(i => i.opic === level)), wd = shuf(words.filter(i => i.opic === level));
    const hasW = wd.length >= 8, out = [], take = (pool, n, stage, section) => { for (let k = 0; k < n; k++) { const item = pool.shift(); if (item) out.push({ item, kind: 'exam', stage, section, exam: true }); } };
    if (hasW) { take(wd, 3, 'wordChoice', '단어'); take(wd, 5, 'wordBlank', '단어'); }
    else { take(ex, 3, 'choose', '표현'); take(ex, 5, 'blank', '표현'); }
    take(ex, 3, 'choose', '표현'); take(ex, 4, 'blank', '표현'); take(ex, 5, 'arrange', '어순'); take(ex, 5, 'sentence', '말하기');
    return out;
  }
  function examScore(marks) {
    const right = marks.filter(m => m.ok).length, speak = marks.filter(m => m.section === '말하기'), sp = speak.filter(m => m.ok).length;
    const pct = marks.length ? Math.round(right / marks.length * 100) : 0;
    return { right, total: marks.length, pct, speakRight: sp, passed: marks.length > 0 && right / marks.length >= PROMOTION.passRate && sp >= PROMOTION.minSpeak };
  }
  /* 최근 본 예시를 피해 무작위로 고른다. 예시가 적어도 항상 고를 수 있게 제외 수를 조절한다. */
  function pickExamples(list, recent, count, rnd) {
    const r = rnd || Math.random, n = Math.min(count, list.length), keep = Math.max(0, Math.min(9, list.length - n));
    const seen = (recent || []).filter(i => i >= 0 && i < list.length).slice(-keep), block = keep ? seen : [];
    const open = list.map((_, i) => i).filter(i => !block.includes(i));
    const picks = open.map(i => [r(), i]).sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
    return { picks, recent: block.concat(picks).slice(-Math.max(keep, n)) };
  }
  /* 두 기기의 기록을 합친다. 같은 입력을 다시 합쳐도 결과가 같고, 학습 기록이 사라지는 쪽으로 합치지 않는다. */
  function mergeState(local, remote) {
    if (!remote) return Object.assign({}, local);
    const L = local, R = remote, resetAt = Math.max(L.resetAt || 0, R.resetAt || 0);
    const valid = x => (x.savedAt || 0) >= resetAt;
    const cards = {};
    [L, R].forEach(x => Object.entries(x.cards || {}).forEach(([k, c]) => {
      if ((c.seen || 0) < resetAt) return;
      if (!cards[k] || (c.seen || 0) > (cards[k].seen || 0)) cards[k] = c;
    }));
    const pad = n => String(n).padStart(2, '0'), rd = new Date(resetAt), from = resetAt ? `${rd.getFullYear()}-${pad(rd.getMonth() + 1)}-${pad(rd.getDate())}` : '';
    const days = [...new Set([...(L.days || []), ...(R.days || [])])].filter(d => d >= from).sort();
    const sides = [L, R].filter(valid), lvOf = x => LEVELS.indexOf(x.level && x.level.current);
    const top = sides.reduce((a, b) => (lvOf(b) > lvOf(a) ? b : a), sides[0] || L);
    const hist = new Map();
    sides.forEach(x => ((x.level && x.level.history) || []).forEach(h => { if (h.at >= resetAt) hist.set(h.at + h.to, h); }));
    const level = { current: (sides.length ? top : { level: { current: 'IL' } }).level.current, passed: [...new Set(sides.flatMap(x => (x.level && x.level.passed) || []))], history: [...hist.values()].sort((a, b) => a.at - b.at) };
    const examLatest = sides.map(x => x.exam || {}).reduce((a, b) => ((b.lastAt || 0) > (a.lastAt || 0) ? b : a), {});
    const attempts = {};
    sides.forEach(x => Object.entries((x.exam && x.exam.attempts) || {}).forEach(([k, v]) => { attempts[k] = Math.max(attempts[k] || 0, v); }));
    const exam = Object.assign({ lastAt: 0, lastLevel: '' }, examLatest, { attempts });
    const pref = (R.settingsAt || 0) > (L.settingsAt || 0) ? R : L;
    const mL = L.aiMonth || '', mR = R.aiMonth || '', aiMonth = mL > mR ? mL : mR, aiCost = mL === mR ? Math.max(L.aiCost || 0, R.aiCost || 0) : (mL > mR ? L.aiCost : R.aiCost) || 0;
    return Object.assign({}, L, { cards, days, level, exam, resetAt, aiMonth, aiCost, call: pref.call || L.call, autoplay: pref.autoplay, auto: pref.auto || L.auto, minutes: pref.minutes, aiLimit: pref.aiLimit, settingsAt: Math.max(L.settingsAt || 0, R.settingsAt || 0), savedAt: Math.max(L.savedAt || 0, R.savedAt || 0) });
  }
  const FILLER = new Set(['um', 'uh', 'er', 'erm', 'ah', 'hmm', 'mm', 'uhm', 'oh', 'well', 'like']);
  /* 음성 답을 판단한다. ok, close는 정답, partial은 문장이 덜 끝남, ignore는 잡음이나 머뭇거림, wrong은 오답 후보. */
  function judgeSpoken(text, item, stage) {
    const words = clean(text).split(/\s+/).filter(w => w && !FILLER.has(w));
    if (!words.length) return 'ignore';
    if (['blank', 'wordBlank', 'wordRecall'].includes(stage)) {
      if (words.includes(clean(item.blank))) return 'ok';
      return words.length === 1 && words[0].length < 3 ? 'ignore' : 'wrong';
    }
    const r = gradeSentence(words.join(' '), item.en, item.expression);
    if (r.ok) return r.perfect ? 'ok' : 'close';
    return words.length < Math.ceil(chipsOf(item.en).length * .5) ? 'partial' : 'wrong';
  }
  const SPOKEN_RANK = { ok: 4, close: 3, partial: 2, wrong: 1, ignore: 0 };
  function bestSpoken(alts, item, stage) {
    return alts.map(text => ({ text, verdict: judgeSpoken(text, item, stage) })).sort((a, b) => SPOKEN_RANK[b.verdict] - SPOKEN_RANK[a.verdict])[0];
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
  const wordStage = card => { const r = card ? card.reps || 0 : 0; return r <= 0 ? 'wordChoice' : r <= 2 ? 'wordBlank' : 'wordRecall'; };
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
  const api = { judgeSpoken, bestSpoken, mergeState, pickExamples, PROMOTION, promotionStatus, EXAM_SECS, buildExam, examScore, wordStage, LEVELS, LEVEL_DESC, levelProgress, nextLevel, canStudyLevel, MODES, grade, buildSession, check, splitBlank, startOfDay, addDays, stageOf, rate, gradeSentence, bestSentence, chipsOf };
  if (typeof module !== 'undefined') module.exports = api; else root.SRS = api;
})(this);
