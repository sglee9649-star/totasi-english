const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'totasi-english-v1';
const FRESH_STATE = () => ({ call: '', cards: {}, days: [], input: 'type', autoplay: true, voice: false, voiceAsked: false });
let S = FRESH_STATE(), ITEMS = [], session = null;
let screen = { name: 'home', render: () => home() }, returnTo = null, curE = null;
const setScreen = (name, render) => { screen = { name, render }; vcUI(); };

function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) S = Object.assign(FRESH_STATE(), v); } catch {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

/* ---------- 토타시 ---------- */
const FACE = {
  idle: ['open', 'smile', 'up'], think: ['side', 'o', 'up'], listen: ['up', 'o', 'up'],
  correct: ['wink', 'tongue', 'up'], great: ['sparkle', 'grin', 'up'], done: ['star', 'grin', 'up'],
  wrong: ['teary', 'wavy', 'down'], overdue: ['angry', 'pout', 'down'], sleepy: ['half', 'yawn', 'down'],
};
const USED = new Set(['body', 'ear_up', 'ear_down', 'eyes_shut']);
Object.values(FACE).forEach(([e, m]) => { USED.add('eyes_' + e); USED.add('mouth_' + m); });
const stack = {};
USED.forEach(n => { const i = new Image(); i.src = `assets/toto/layers/${n}.png`; i.alt = ''; i.draggable = false; stack[n] = i; });
let face = FACE.idle, blink = false;
function draw() {
  const box = $('#totoBody'), [e, m, ears] = face;
  const names = ears === 'up' ? ['ear_up', 'body'] : ['body', 'ear_down'];
  names.push('eyes_' + (blink && e === 'open' ? 'shut' : e), 'mouth_' + m);
  Object.values(stack).forEach(i => i.classList.remove('on'));
  names.forEach((n, z) => { const i = stack[n]; i.style.zIndex = z; i.classList.add('on'); if (!i.parentNode) box.append(i); });
}
function bounce(cls) {
  const b = $('#totoBody'); b.classList.remove('boing', 'sad'); void b.offsetWidth;
  if (cls) { b.classList.add(cls); setTimeout(() => b.classList.remove(cls), 650); }
}
function say(text, name = 'idle', motion) {
  face = FACE[name]; draw();
  const b = $('#bubble'); $('#bubbleText').textContent = text.replaceAll('{호칭}', S.call || '언니');
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  bounce(motion);
}
setInterval(() => { blink = true; draw(); setTimeout(() => { blink = false; draw(); }, 140); }, 4300);
const pick = a => a[Math.floor(Math.random() * a.length)];
const LINES = {
  correct: ['우와, {호칭} 대박! 나도 이거 외울래!', '맞았어! {호칭} 오늘 왜 이렇게 잘해?', '정답! 나 지금 귀 쫑긋했어, 봤어?', '히히, {호칭} 최고! 다음 것도 가자!'],
  wrong: ['괜찮아, 나도 맨날 틀려! 이따 같이 또 하자!', '앗, 아깝다! 10분 뒤에 다시 물어볼게!', '틀려도 돼, {호칭}. 틀린 건 내가 기억해 둘게!'],
  fresh: ['{호칭}, 이거 새로 배운 거야! 같이 읽어 보자!', '이 표현 진짜 많이 쓴대! 나도 처음 봐!'],
  ask: ['{호칭}, 빈칸에 뭐가 들어갈까?', '음… 이거 뭐였더라? {호칭}은 알지?', '우리 전에 본 거다! 기억나?'],
  hint: ['살짝만 알려줄게! 첫 글자 봐 봐!'],
  poke: ['간지러워, {호칭}!', '헤헤, 나 또 쓰다듬어 줘!', '공부하다 말고 나 만지는 거야?'],
};

/* ---------- 집계 ---------- */
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dueCount = now => ITEMS.filter(i => S.cards[i.id] && S.cards[i.id].due <= now).length;
const newCount = () => ITEMS.filter(i => !S.cards[i.id]).length;
function streak(now) {
  const set = new Set(S.days); let t = now, n = 0;
  if (!set.has(dayKey(t))) t = SRS.addDays(t, -1);
  while (set.has(dayKey(t))) { n++; t = SRS.addDays(t, -1); }
  return n;
}
function markToday(now) { const k = dayKey(now); if (!S.days.includes(k)) S.days.push(k); }
function missedDays(now) {
  if (!S.days.length) return 0;
  const last = new Date(S.days[S.days.length - 1] + 'T00:00:00').getTime();
  return Math.round((SRS.startOfDay(now) - last) / 864e5);
}
function setPhase() {
  const h = new Date().getHours();
  document.body.dataset.phase = h < 6 || h >= 21 ? 'night' : h < 10 ? 'morning' : h < 16 ? 'day' : h < 18 ? 'late' : 'dusk';
}

/* ---------- 듣기와 말하기 ---------- */
let speakToken = 0;
function speak(text, opt = {}) {
  try {
    if (!window.speechSynthesis) return;
    const token = ++speakToken, u = new SpeechSynthesisUtterance(text);
    u.lang = opt.lang || 'en-US'; u.rate = opt.rate || .95;
    let finished = false, safety;
    const done = () => { if (finished || token !== speakToken) return; finished = true; clearTimeout(safety); vcResume(); };
    u.onend = done; u.onerror = done;
    vcPause();
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    safety = setTimeout(done, Math.max(3000, text.length * 170 / u.rate));
  } catch { vcResume(); }
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen(onText, onFail) {
  try {
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 5;
    let got = false;
    r.onresult = e => { got = true; onText(Array.from(e.results[0]).map(a => a.transcript)); };
    r.onerror = e => { got = true; onFail(e.error); };
    r.onend = () => { if (!got) onFail('no-speech'); };
    r.start(); return r;
  } catch { onFail('unavailable'); return null; }
}

/* ---------- 화면 ---------- */
const panel = html => { $('#body').innerHTML = html; $('#panel').scrollTop = 0; window.scrollTo(0, 0); };
function welcome() {
  say('안녕! 나 토타시야! 오늘부터 같이 영어 공부하는 거야? 나를 뭐라고 불러 줄 거냐면… 아니, 내가 뭐라고 부르면 돼?', 'great');
  panel(`<h1>토타시가 뭐라고 부를까요?</h1><div class="row"><button class="btn" id="cUn">언니</button><button class="btn" id="cOp">오빠</button></div><p class="note">설정에서 언제든 바꿀 수 있어요.</p>`);
  const pickCall = c => { S.call = c; save(); chooseControl(); };
  $('#cUn').onclick = () => pickCall('언니'); $('#cOp').onclick = () => pickCall('오빠');
}
function chooseControl() {
  say('{호칭}, 공부할 때 손으로 누를 거야? 아니면 말로 시킬 거야? 말로 하면 내가 귀 쫑긋하고 듣고 있을게!', 'listen');
  panel(`<h1>어떻게 조작할까요?</h1>
    <div class="modes"><button class="patch" id="ctlTouch"><b>화면 터치</b><span>누르고 입력해서 공부해요</span></button>
    <button class="patch hot" id="ctlVoice" ${SR ? '' : 'disabled'}><b>음성 조작</b><span>영어 명령어로 앉아서 공부해요</span></button></div>
    ${SR ? '<p class="note">음성 조작을 고르면 마이크 권한을 물어봐요. 설정에서 언제든 바꿀 수 있어요.</p>' : '<p class="err">이 브라우저에서는 음성 조작을 쓸 수 없어요. 안드로이드 Chrome에서 열어 주세요.</p>'}`);
  S.voiceAsked = true; save();
  $('#ctlTouch').onclick = () => home();
  $('#ctlVoice').onclick = () => { setVoice(true); home(); };
}
function homeLine(now) {
  const due = dueCount(now), missed = missedDays(now), h = new Date(now).getHours();
  if (missed >= 2) return ['{호칭}, 왜 이제 왔어? 나 혼자 단어랑 놀았잖아…' + (due ? ` 복습 ${due}개 밀렸어!` : ''), 'overdue'];
  if (h >= 23 || h < 5) return ['{호칭}, 나 졸려… 그래도 5분만 같이 할까?', 'sleepy'];
  if (due) return [`{호칭}! 복습 ${due}개가 기다리고 있어! 잊어버리기 전에 하자!`, 'idle'];
  if (S.days.includes(dayKey(now))) return ['오늘 복습은 다 했어! {호칭} 진짜 멋있다! 더 할 거야?', 'great'];
  return [S.days.length ? '{호칭} 왔다! 오늘은 얼마나 할 거야?' : '{호칭}, 첫날이다! 나 벌써 두근두근해!', 'great'];
}
function home() {
  setScreen('home', home); returnTo = null;
  const now = Date.now(), due = dueCount(now), fresh = newCount(), learned = ITEMS.length - fresh;
  const [line, f] = homeLine(now); say(line, f); setPhase();
  const hot = due > 0 ? 5 : 10;
  const label = m => { const n = SRS.buildSession(ITEMS, S.cards, m, now); const r = n.filter(x => x.kind === 'review').length; return n.length ? `복습 ${r} · 새 표현 ${n.length - r}` : '오늘 할 문제 없음'; };
  panel(`
    <div class="stats">
      <div class="stat"><b>${streak(now)}</b><span>연속 학습일</span></div>
      <div class="stat"><b>${due}</b><span>오늘 복습</span></div>
      <div class="stat"><b>${learned}/${ITEMS.length}</b><span>배운 표현</span></div>
    </div>
    <h2>오늘은 얼마나 할까요?</h2>
    <div class="modes">${SRS.MODES.map((m, i) => `<button class="patch ${m.min === hot ? 'hot' : ''}" data-m="${i}"><b>${m.min}분${m.min === 60 ? ' 빡공' : ''}</b><span>${label(m)}</span></button>`).join('')}</div>
    <button class="btn ${S.voice ? 'ghost' : 'alt'} wide" id="vcToggle">${S.voice ? '음성 조작 끄기' : '음성 조작 켜기'}</button>
    <div class="grow"></div>
    <div class="links"><button class="link" id="goDict">명령어 사전</button><button class="link" id="goSet">설정과 백업</button></div>`);
  $('#vcToggle').onclick = () => { setVoice(!S.voice); home(); };
  $('#goDict').onclick = dictionary;
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => start(SRS.MODES[+b.dataset.m]));
  $('#goSet').onclick = settings;
}
function start(mode) {
  const now = Date.now(), q = SRS.buildSession(ITEMS, S.cards, mode, now);
  if (!q.length) { say('{호칭}, 오늘 할 건 다 끝났어! 내일 또 같이 하자!', 'done', 'boing'); return; }
  session = { mode, q, i: 0, right: 0, wrong: 0, fresh: 0, review: 0, ends: now + mode.min * 6e4, total: q.length };
  next();
}
function header() {
  const s = session, pct = Math.round(s.i / s.q.length * 100);
  return `<div class="top"><span>${s.i + 1} / ${s.q.length}</span><button class="link" id="quit">그만하기</button></div><div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="진행률"><i style="width:${pct}%"></i></div>`;
}
function wireQuit() { $('#quit').onclick = finish; }
function next() {
  const s = session;
  if (s.i >= s.q.length || (Date.now() >= s.ends && s.i > 0)) return finish();
  const e = s.q[s.i];
  if (e.kind === 'new' && !e.shown) intro(e); else quiz(e);
}
function intro(e) {
  curE = e; setScreen('intro', () => intro(e));
  const it = e.item; say(pick(LINES.fresh), 'great');
  panel(`${header()}<span class="tag new">새 표현</span>
    <div class="expr" lang="en">${esc(it.expression)}</div><p class="ko">${esc(it.meaning)}</p>
    <div class="card"><div class="en" lang="en" style="font-size:20px">${esc(it.en)}</div><p class="note">${esc(it.ko)}</p></div>
    <p class="note">토타시: ${esc(it.note.replaceAll('{호칭}', S.call))}</p>
    <div class="grow"></div>
    <div class="row"><button class="btn alt" id="play">듣기</button><button class="btn" id="go">문제 풀기</button></div>`);
  wireQuit(); if (S.autoplay) speak(it.en);
  $('#play').onclick = () => speak(it.en);
  $('#go').onclick = () => { e.shown = true; quiz(e); };
}
function quiz(e) {
  curE = e; setScreen('quiz', () => quiz(e));
  const it = e.item, [a, , c] = SRS.splitBlank(it.en, it.blank);
  say(pick(LINES.ask), 'think');
  const tag = e.retry ? '다시 한 번' : e.kind === 'new' ? '새 표현' : '복습';
  panel(`${header()}<span class="tag ${e.kind === 'new' ? 'new' : ''}">${tag}</span>
    <p class="ko">${esc(it.ko)}</p>
    <div class="en" lang="en">${esc(a)}<span class="gap" id="gap">&nbsp;</span>${esc(c)}</div>
    <div class="switch" role="group" aria-label="답변 방법" ${S.voice ? 'hidden' : ''}>
      <button id="mType" aria-pressed="${S.input !== 'voice'}">타이핑</button>
      <button id="mVoice" aria-pressed="${S.input === 'voice'}">말하기</button>
    </div>
    <div id="ansBox" class="sheet"></div>
    <div class="row"><button class="btn ghost" id="hint">첫 글자 보기</button><button class="btn ghost" id="pass">모르겠어</button></div>`);
  wireQuit();
  $('#mType').onclick = () => { S.input = 'type'; save(); drawAns(e); toggle(); };
  $('#mVoice').onclick = () => { S.input = 'voice'; save(); drawAns(e); toggle(); };
  const toggle = () => { $('#mType').setAttribute('aria-pressed', S.input !== 'voice'); $('#mVoice').setAttribute('aria-pressed', S.input === 'voice'); };
  $('#hint').onclick = () => { $('#gap').textContent = it.blank[0] + '…'; $('#hint').disabled = true; say(pick(LINES.hint), 'listen'); };
  $('#pass').onclick = () => answer(e, 'wrong', '');
  drawAns(e);
  if (S.voice) speak(`${a} blank ${c}`);
}
let recog = null;
function drawAns(e) {
  if (recog) { try { recog.abort(); } catch {} recog = null; }
  const box = $('#ansBox');
  if (S.voice) { box.innerHTML = `<p class="note">빈칸 단어나 문장 전체를 영어로 말해 보세요. 짧은 잡음은 오답으로 치지 않아요.</p>`; return; }
  if (S.input === 'voice') {
    if (!SR) { box.innerHTML = `<p class="err">이 브라우저에서는 말하기를 쓸 수 없어요. 타이핑으로 답해 주세요.</p>`; return; }
    box.innerHTML = `<button class="btn wide mic" id="mic">눌러서 문장 말하기</button><p class="note" id="heard">빈칸 단어가 들어간 문장을 말해 보세요.</p>`;
    $('#mic').onclick = () => {
      const m = $('#mic'); m.classList.add('on'); m.textContent = '듣고 있어요…'; m.disabled = true; say('{호칭}, 말해 봐! 나 귀 쫑긋하고 듣고 있어!', 'listen');
      recog = listen(alts => {
        const hit = alts.find(t => SRS.check(t, e.item.blank, true) === 'exact');
        answer(e, hit ? 'exact' : 'wrong', hit || alts[0]);
      }, err => {
        m.classList.remove('on'); m.textContent = '다시 말하기'; m.disabled = false;
        $('#heard').className = 'err';
        $('#heard').textContent = err === 'not-allowed' || err === 'service-not-allowed' ? '마이크 권한이 필요해요. 권한을 허용하거나 타이핑으로 답해 주세요.' : err === 'network' ? '말하기는 인터넷 연결이 필요할 수 있어요. 타이핑으로 답해도 돼요.' : '잘 안 들렸어요. 다시 말하거나 타이핑으로 답해 주세요.';
      });
    };
    return;
  }
  box.innerHTML = `<form class="answer" id="form" autocomplete="off"><input id="ans" type="text" aria-label="빈칸에 들어갈 단어" placeholder="영어 단어 입력" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" lang="en"><button class="btn">확인</button></form><p class="err" id="ansErr" hidden></p>`;
  $('#ans').oninput = () => { $('#ansErr').hidden = true; };
  $('#form').onsubmit = ev => {
    ev.preventDefault(); const v = $('#ans').value.trim();
    if (!v) { $('#ansErr').hidden = false; $('#ansErr').textContent = '단어를 입력해 주세요. 모르면 "모르겠어"를 눌러도 돼요.'; return; }
    answer(e, SRS.check(v, e.item.blank), v);
  };
  $('#ans').focus({ preventScroll: true });
}
function answer(e, result, given) {
  if (recog) { try { recog.abort(); } catch {} recog = null; }
  const s = session, it = e.item, now = Date.now(), ok = result !== 'wrong';
  if (!e.retry) {
    S.cards[it.id] = SRS.grade(S.cards[it.id], ok, now);
    markToday(now); save();
    if (e.kind === 'new') s.fresh++; else s.review++;
    if (ok) s.right++; else s.wrong++;
    if (!ok) s.q.splice(Math.min(s.i + 4, s.q.length), 0, { item: it, kind: 'review', retry: true });
  }
  say(pick(ok ? LINES.correct : LINES.wrong), ok ? pick(['correct', 'great']) : 'wrong', ok ? 'boing' : 'sad');
  showResult(e, result, given);
}
function showResult(e, result, given) {
  setScreen('result', () => showResult(e, result, given));
  const s = session, it = e.item, ok = result !== 'wrong';
  const [a, b, c] = SRS.splitBlank(it.en, it.blank), card = S.cards[it.id];
  const when = e.retry ? '' : card.days ? `다음 복습은 ${card.days}일 뒤예요.` : '10분 뒤부터 다시 복습할 수 있어요.';
  panel(`${header()}
    <p class="result ${ok ? 'ok' : 'no'}">${ok ? (result === 'typo' ? '정답이에요. 철자만 확인해 주세요.' : '정답이에요!') : '아쉬워요.'}</p>
    ${given && !ok ? `<p class="note">내 답: ${esc(given)}</p>` : ''}
    <div class="en" lang="en">${esc(a)}<mark>${esc(b)}</mark>${esc(c)}</div>
    <p class="ko">${esc(it.ko)}</p>
    <div class="card"><div lang="en" style="color:var(--navy)">${esc(it.expression)}</div><p class="note">${esc(it.meaning)}</p></div>
    ${when ? `<p class="note">${when}</p>` : ''}
    <div class="grow"></div>
    <div class="row"><button class="btn alt" id="play">다시 듣기</button><button class="btn" id="nx">다음</button></div>`);
  wireQuit(); if (S.autoplay) speak(it.en);
  $('#play').onclick = () => speak(it.en);
  $('#nx').onclick = () => { s.i++; next(); }; $('#nx').focus({ preventScroll: true });
}
function finish() {
  const s = session; session = null;
  if (!s || !(s.right + s.wrong)) return home();
  setScreen('done', home);
  const n = s.right + s.wrong;
  say(s.wrong === 0 ? '전부 맞았어! {호칭} 천재야? 나 오늘 자랑하고 다닐래!' : '{호칭}, 오늘도 같이 해 줘서 고마워! 틀린 건 내가 꼭 다시 물어볼게!', 'done', 'boing');
  panel(`<h1>오늘 공부 끝!</h1>
    <div class="stats"><div class="stat"><b>${s.right}/${n}</b><span>맞힌 문제</span></div><div class="stat"><b>${s.review}</b><span>복습</span></div><div class="stat"><b>${s.fresh}</b><span>새 표현</span></div></div>
    <p class="note">연속 학습 ${streak(Date.now())}일째예요.</p><div class="grow"></div>
    <button class="btn wide" id="back">처음으로</button>`);
  $('#back').onclick = home;
}
function settings() {
  setScreen('settings', settings); returnTo = null;
  say('{호칭}, 뭐 바꿀 거야? 내 이름은 안 돼!', 'idle');
  panel(`<h1>설정</h1>
    <div class="sheet"><h2>호칭</h2><div class="row"><button class="btn ${S.call === '언니' ? '' : 'alt'}" id="cUn">언니</button><button class="btn ${S.call === '오빠' ? '' : 'alt'}" id="cOp">오빠</button></div></div>
    <div class="sheet"><h2>정답을 본 뒤 문장 자동 듣기</h2><button class="btn alt" id="auto" aria-pressed="${S.autoplay}">${S.autoplay ? '켜짐' : '꺼짐'}</button></div>
    <div class="sheet"><h2>음성 조작</h2><button class="btn alt" id="vcSet" aria-pressed="${S.voice}" ${SR ? '' : 'disabled'}>${S.voice ? '켜짐' : '꺼짐'}</button><button class="link" id="setDict">명령어 사전 보기</button></div>
    <div class="sheet"><h2>백업</h2><p class="note">학습 기록은 이 기기에 저장돼요. 지우기 전이나 기기를 옮길 때 파일로 보관해 주세요.</p>
      <div class="row"><button class="btn alt" id="exp">백업 파일 저장</button><button class="btn alt" id="imp">백업 불러오기</button></div>
      <input type="file" id="file" accept="application/json,.json" hidden aria-label="백업 파일"><p class="note" id="msg" role="status"></p></div>
    <div class="sheet"><h2>기록 초기화</h2><button class="btn ghost danger" id="wipe">모든 학습 기록 지우기</button></div>
    <button class="btn wide" id="back">돌아가기</button>`);
  const setCall = c => { S.call = c; save(); settings(); };
  $('#cUn').onclick = () => setCall('언니'); $('#cOp').onclick = () => setCall('오빠');
  $('#auto').onclick = () => { S.autoplay = !S.autoplay; save(); settings(); };
  $('#vcSet').onclick = () => { setVoice(!S.voice); settings(); };
  $('#setDict').onclick = dictionary;
  $('#back').onclick = home;
  $('#exp').onclick = async () => {
    const data = JSON.stringify(S), filename = `totasi-english-${dayKey(Date.now())}.json`;
    try {
      const d = window.claude && await window.claude.use('downloads');
      if (d) { await d.save({ filename, data: new Blob([data], { type: 'application/json' }) }); }
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
      $('#msg').textContent = '백업 파일을 저장했어요.';
    } catch { $('#msg').textContent = '저장이 취소되었거나 실패했어요.'; }
  };
  $('#imp').onclick = () => $('#file').click();
  $('#file').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const v = JSON.parse(await f.text());
      if (!v || typeof v.cards !== 'object' || !Array.isArray(v.days)) throw 0;
      S = Object.assign(FRESH_STATE(), v); save(); settings(); $('#msg').textContent = '백업을 불러왔어요.';
    } catch { $('#msg').textContent = '토타시 영어 백업 파일이 아니에요. 파일을 확인해 주세요.'; }
  };
  $('#wipe').onclick = () => {
    const w = $('#wipe');
    if (w.dataset.sure) { const call = S.call; S = FRESH_STATE(); S.call = call; save(); home(); return; }
    w.dataset.sure = '1'; w.textContent = '정말 지울까요? 한 번 더 누르면 지워져요';
  };
}

/* ---------- 명령어 사전 ---------- */
function dictionary() {
  if (screen.name !== 'dict') returnTo = screen.render;
  setScreen('dict', dictionary);
  say('{호칭}, 이 말들을 영어로 해 주면 내가 다 알아들어! 눌러 보면 발음도 들려줄게!', 'great');
  const groups = [...new Set(VOICE.COMMANDS.map(c => c.group))];
  const shown = p => p.replace(/^i'm\b/, "I'm").replace(/^i /, 'I ').replace(/ i /g, ' I ');
  panel(`<h1>명령어 사전</h1>
    <p class="note">음성 조작을 켜면 아래 영어 표현을 그대로 말하면 돼요. 앞뒤에 please나 okay를 붙여도 알아들어요. 표현을 누르면 발음을 들을 수 있어요.</p>
    ${groups.map(g => `<div class="sheet"><h2>${g}</h2>${VOICE.COMMANDS.filter(c => c.group === g).map(c => `<div class="cmd"><b>${c.label}</b><div class="chips" lang="en">${c.say.map(p => `<button class="chip" data-p="${esc(p)}">${esc(shown(p))}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}
    <button class="btn wide" id="back">돌아가기</button>`);
  $('#body').querySelectorAll('[data-p]').forEach(b => b.onclick = () => speak(b.dataset.p));
  $('#back').onclick = () => vcDo('back');
}

/* ---------- 음성 조작 ---------- */
const VC = { running: false, paused: false, rest: false, rec: null, timer: null, last: 0, fails: 0, heard: '', note: '', wake: null };
const REST_AFTER = 5 * 6e4;
function vcUI() {
  const el = $('#vc'); if (!el) return;
  el.hidden = !S.voice; if (!S.voice) return;
  el.className = VC.rest ? 'rest' : VC.paused ? 'talk' : 'on';
  const state = VC.rest ? (VC.note || '쉬는 중이에요. 다시 들으려면 눌러 주세요.') : VC.paused ? '토타시가 읽는 중…' : '듣고 있어요';
  const hint = (VOICE.HINTS[screen.name] || []).map(h => `"${h}"`).join(' · ');
  el.innerHTML = `<i class="dot"></i><div class="txt">${esc(state)}<small>${VC.heard && !VC.rest ? `들은 말: ${esc(VC.heard)}` : VC.rest ? '' : esc(hint)}</small></div><button id="vcBtn">${VC.rest ? '다시 듣기' : '명령어'}</button>`;
  $('#vcBtn').onclick = () => { if (VC.rest) vcWakeUp(); else if (screen.name !== 'dict') dictionary(); };
}
function vcWakeUp() { VC.rest = false; VC.note = ''; VC.fails = 0; VC.last = Date.now(); vcHold(); vcStart(); vcUI(); }
function vcStop() { clearTimeout(VC.timer); if (VC.rec) { const r = VC.rec; VC.rec = null; VC.running = false; try { r.abort(); } catch {} } }
function vcRest(note) { VC.rest = true; VC.note = note || ''; vcStop(); vcRelease(); vcUI(); }
function vcPause() { if (!S.voice) return; VC.paused = true; vcStop(); vcUI(); }
function vcResume() { if (!VC.paused) return; VC.paused = false; vcUI(); clearTimeout(VC.timer); VC.timer = setTimeout(vcStart, 300); }
async function vcHold() { try { if (navigator.wakeLock && !VC.wake && !document.hidden) { VC.wake = await navigator.wakeLock.request('screen'); VC.wake.addEventListener('release', () => { VC.wake = null; }); } } catch {} }
function vcRelease() { try { VC.wake && VC.wake.release(); } catch {} VC.wake = null; }
function vcStart() {
  if (!S.voice || !SR || VC.running || VC.paused || VC.rest || document.hidden) return;
  if (Date.now() - VC.last > REST_AFTER) return vcRest('한동안 말이 없어서 쉬는 중이에요. 다시 들으려면 눌러 주세요.');
  try {
    const r = new SR(); r.lang = 'en-US'; r.continuous = false; r.interimResults = false; r.maxAlternatives = 5;
    r.onresult = e => { VC.last = Date.now(); VC.fails = 0; vcHeard(Array.from(e.results[e.results.length - 1]).map(x => x.transcript)); };
    r.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') return vcRest('마이크 권한을 허용한 뒤 눌러 주세요.');
      if (e.error === 'network' || e.error === 'audio-capture') { if (++VC.fails >= 3) vcRest(e.error === 'network' ? '음성 인식에 인터넷이 필요해요. 연결한 뒤 눌러 주세요.' : '마이크를 찾지 못했어요. 확인한 뒤 눌러 주세요.'); }
    };
    r.onend = () => { if (VC.rec !== r) return; VC.rec = null; VC.running = false; if (VC.rest || VC.paused || !S.voice) return; clearTimeout(VC.timer); VC.timer = setTimeout(vcStart, VC.fails ? 1000 * 2 ** VC.fails : 250); };
    VC.rec = r; VC.running = true; r.start();
  } catch { VC.running = false; VC.rec = null; clearTimeout(VC.timer); VC.timer = setTimeout(vcStart, 1000); }
}
function setVoice(on) {
  if (on && !SR) return;
  S.voice = on; if (on) S.input = 'voice'; save();
  if (on) { VC.heard = ''; vcWakeUp(); } else { VC.paused = false; VC.rest = false; vcStop(); vcRelease(); vcUI(); }
}
function vcHeard(alts) {
  const r = VOICE.interpret(alts, screen.name, screen.name === 'quiz' && curE ? curE.item.blank : '');
  VC.heard = r.text || ''; vcUI();
  if (r.type === 'cmd') return vcDo(r.action);
  if (r.type === 'answer') return answer(curE, r.ok ? 'exact' : 'wrong', r.text);
  if (r.type === 'unavailable') return say('{호칭}, 그건 이 화면에서는 못 해! "commands"라고 하면 사전 보여 줄게!', 'think');
}
function vcDo(action) {
  const click = id => { const b = $(id); if (b && !b.disabled) b.click(); };
  const sentence = () => curE && curE.item.en;
  const line = () => { if (screen.name === 'quiz') { const [a, , c] = SRS.splitBlank(curE.item.en, curE.item.blank); return `${a} blank ${c}`; } return sentence(); };
  const scroll = d => { const p = $('#panel'), by = innerHeight * .7 * d; if (p.scrollHeight > p.clientHeight) p.scrollBy({ top: by }); else window.scrollBy({ top: by }); };
  const acts = {
    next() { click(screen.name === 'intro' ? '#go' : screen.name === 'result' ? '#nx' : '#back'); },
    hint() { click('#hint'); }, pass() { click('#pass'); }, quit() { finish(); },
    listen() { speak(line()); }, slow() { speak(line(), { rate: .65 }); },
    meaning() { speak(curE.item.ko, { lang: 'ko-KR', rate: 1 }); },
    start() { const q = document.querySelector('.patch.hot'); if (q) q.click(); },
    m0() { start(SRS.MODES[0]); }, m1() { start(SRS.MODES[1]); }, m2() { start(SRS.MODES[2]); }, m3() { start(SRS.MODES[3]); }, m4() { start(SRS.MODES[4]); },
    back() {
      if (screen.name === 'dict') { const f = returnTo || home; returnTo = null; return f(); }
      if (screen.name === 'settings' || screen.name === 'done') return home();
      if (screen.name === 'quiz' && curE.kind === 'new' && !curE.retry) return intro(curE);
      if (screen.name === 'home') return;
      say('{호칭}, 공부 중에는 뒤로 못 가! 그만하려면 "stop"이라고 해 줘!', 'think');
    },
    homeGo() { session = null; home(); },
    settings() { settings(); }, dict() { dictionary(); },
    down() { scroll(1); }, up() { scroll(-1); },
    status() {
      const t = session ? `${session.q.length}문제 중 ${session.i + 1}번째 문제예요. ${session.right}개 맞혔어요.` : `오늘 복습 ${dueCount(Date.now())}개, 배운 표현 ${ITEMS.length - newCount()}개예요.`;
      say(t, 'idle'); speak(t, { lang: 'ko-KR', rate: 1 });
    },
    pet() { say(pick(['{호칭}, 안녕! 나 여기 있어!', '헤헤, {호칭} 목소리 좋다!', '나도 {호칭} 좋아!']), 'great', 'boing'); },
    voiceOff() { setVoice(false); say('알았어, {호칭}! 이제 손으로 눌러 줘!', 'idle'); screen.render(); },
  };
  if (acts[action]) acts[action]();
}
document.addEventListener('visibilitychange', () => {
  if (!S.voice) return;
  if (document.hidden) vcStop(); else if (!VC.rest) { VC.last = Date.now(); vcHold(); vcStart(); }
});

/* ---------- 시작 ---------- */
$('#toto').onclick = () => { if (!session || $('#nx')) { say(pick(LINES.poke), 'great', 'boing'); } else bounce('boing'); };
(async function boot() {
  load(); setPhase(); draw();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
  try {
    ITEMS = await (await fetch('data/expressions.json')).json();
  } catch { say('{호칭}, 표현 파일을 못 찾았어… 인터넷에 연결한 뒤 다시 열어 줘!', 'wrong'); panel('<p class="err">학습 데이터를 불러오지 못했어요. 인터넷에 연결한 뒤 앱을 다시 열어 주세요.</p>'); return; }
  if (!S.call) welcome(); else { if (S.voice && SR) { VC.last = Date.now(); vcHold(); } home(); vcStart(); }
  if ('serviceWorker' in navigator) { const had = !!navigator.serviceWorker.controller; navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !session) location.reload(); }); try { await navigator.serviceWorker.register('sw.js'); } catch {} }
})();
