/* 음성 명령 사전과 해석. 평소에는 한국어로 듣고, 답을 말하는 화면에서만 영어로 듣는다. */
(function (root) {
  const ALL = ['home', 'intro', 'quiz', 'result', 'done', 'settings', 'dict', 'make', 'makeres', 'menu', 'records', 'levels'];
  const TABS = ['home', 'done', 'settings', 'dict', 'menu', 'records', 'levels'];
  const STUDY = ['intro', 'quiz', 'result'];
  const langOf = (screen, stage) => (screen === 'quiz' && stage !== 'wordChoice') || screen === 'make' ? 'en' : 'ko';
  const COMMANDS = [
    { group: '학습 진행', action: 'next', label: '다음으로, 문제 풀기', on: ['intro', 'result', 'done', 'makeres'], ko: ['다음', '다음 문제', '다음으로', '넘어가', '넘어가자', '계속', '계속하기', '넥스트', '오케이', '보통', '문제 풀기', '문제 풀자', '풀기'], en: [] },
    { group: '학습 진행', action: 'easy', label: '쉬웠어요', on: ['result'], ko: ['쉬워', '쉬워요', '쉬웠어', '쉬웠어요', '쉬움'], en: [] },
    { group: '학습 진행', action: 'hard', label: '어려웠어요', on: ['result'], ko: ['어려워', '어려워요', '어려웠어', '어려웠어요', '어려움'], en: [] },
    { group: '학습 진행', action: 'hint', label: '힌트 보기', on: ['quiz'], ko: [], en: ['hint', 'give me a hint', 'clue', 'first letter', 'first word', 'help me'] },
    { group: '학습 진행', action: 'pass', label: '모르겠어요', on: ['quiz'], ko: [], en: ["i don't know", 'i do not know', 'i dont know', 'dunno', 'no idea', 'pass', 'skip', 'skip it', 'give up', 'i give up', 'show me the answer', 'show the answer'] },
    { group: '학습 진행', action: 'c0', label: '1번 고르기', on: ['quiz'], ko: ['1번', '일번', '첫 번째'], en: ['one', 'number one', 'first one', 'the first one'] },
    { group: '학습 진행', action: 'c1', label: '2번 고르기', on: ['quiz'], ko: ['2번', '이번', '두 번째'], en: ['two', 'number two', 'second one', 'the second one'] },
    { group: '학습 진행', action: 'c2', label: '3번 고르기', on: ['quiz'], ko: ['3번', '삼번', '세 번째'], en: ['three', 'number three', 'third one', 'the third one'] },
    { group: '학습 진행', action: 'c3', label: '4번 고르기', on: ['quiz'], ko: ['4번', '사번', '네 번째'], en: ['four', 'number four', 'fourth one', 'the fourth one'] },
    { group: '학습 진행', action: 'quit', label: '오늘 공부 끝내기', on: STUDY, ko: ['그만', '그만하기', '그만할래', '끝내기', '끝낼래', '공부 끝', '오늘 끝', '종료', '나가기'], en: ['stop', 'finish', 'quit', "i'm done", 'stop studying'] },
    { group: '듣기', action: 'listen', label: '다시 듣기', on: STUDY, ko: ['듣기', '들려줘', '다시', '다시 들려줘', '다시 듣기', '한 번 더', '읽어줘', '다시 읽어줘', '재생'], en: ['listen', 'say it again', 'repeat', 'one more time', 'read it', 'read it again', 'pardon'] },
    { group: '듣기', action: 'slow', label: '천천히 듣기', on: STUDY, ko: ['천천히', '천천히 들려줘', '느리게', '천천히 읽어줘'], en: ['slowly', 'slower', 'say it slowly', 'slow down'] },
    { group: '듣기', action: 'meaning', label: '한국어 뜻 듣기', on: STUDY, ko: ['뜻', '뜻이 뭐야', '무슨 뜻', '한국어로', '해석', '번역'], en: ['meaning', "what's the meaning", 'translate', 'translation', 'in korean'] },
    { group: '학습 시작', action: 'start', label: '선택한 시간으로 시작', on: ['home'], ko: ['시작', '시작하기', '공부 시작', '학습 시작', '공부하자', '오늘의 학습'], en: [] },
    { group: '학습 시작', action: 'm0', label: '5분 공부', on: ['home'], ko: ['5분', '오분', '5분 공부'], en: [] },
    { group: '학습 시작', action: 'm1', label: '10분 공부', on: ['home'], ko: ['10분', '십분', '10분 공부'], en: [] },
    { group: '학습 시작', action: 'm2', label: '20분 공부', on: ['home'], ko: ['20분', '이십분', '20분 공부'], en: [] },
    { group: '학습 시작', action: 'm3', label: '30분 공부', on: ['home'], ko: ['30분', '삼십분', '30분 공부'], en: [] },
    { group: '학습 시작', action: 'm4', label: '60분 빡공', on: ['home'], ko: ['60분', '육십분', '한 시간', '빡공', '빡공 모드'], en: [] },
    { group: '학습 시작', action: 'speed', label: '순발력 연습', on: ['home', 'menu'], ko: ['순발력', '순발력 연습', '스피드'], en: [] },
    { group: '학습 시작', action: 'words', label: '단어 학습', on: ['home', 'menu'], ko: ['단어', '단어 학습', '단어 공부'], en: [] },
    { group: '학습 시작', action: 'dictation', label: '듣고 받아쓰기', on: ['menu'], ko: ['받아쓰기', '듣고 받아쓰기'], en: [] },
    { group: '학습 시작', action: 'shadow', label: '따라 말하기', on: ['menu'], ko: ['따라 말하기', '따라 하기', '쉐도잉'], en: [] },
    { group: '학습 시작', action: 'choose', label: '표현 고르기', on: ['menu'], ko: ['표현 고르기', '고르기'], en: [] },
    { group: '학습 시작', action: 'make', label: '내 문장 만들기', on: ['home', 'menu'], ko: ['내 문장', '내 문장 만들기', '문장 만들기'], en: [] },
    { group: '화면 이동', action: 'back', label: '뒤로 가기', on: ALL, ko: ['뒤로', '뒤로 가기', '뒤로 가', '이전', '이전 화면', '돌아가기', '돌아가'], en: ['go back', 'back'] },
    { group: '화면 이동', action: 'homeGo', label: '홈으로', on: ALL, ko: ['홈', '홈으로', '홈 화면', '처음으로', '처음 화면', '메인'], en: ['go home'] },
    { group: '화면 이동', action: 'menu', label: '학습 탭', on: TABS, ko: ['학습 메뉴', '학습 탭', '학습 화면', '메뉴'], en: [] },
    { group: '화면 이동', action: 'levels', label: '레벨 보기', on: TABS, ko: ['레벨', '내 레벨', '레벨 보기', '레벨 경로'], en: [] },
    { group: '화면 이동', action: 'records', label: '기록 탭', on: TABS, ko: ['기록', '기록 보기', '내 기록', '통계'], en: [] },
    { group: '화면 이동', action: 'settings', label: '설정 탭', on: TABS, ko: ['설정', '설정 열기'], en: [] },
    { group: '화면 이동', action: 'dict', label: '명령어 사전', on: ALL, ko: ['명령어', '명령어 사전', '사전', '도움말', '뭐라고 말해'], en: ['commands', 'help'] },
    { group: '화면 이동', action: 'down', label: '아래로 스크롤', on: ALL, ko: ['아래로', '내려', '내려줘', '스크롤 내려'], en: [] },
    { group: '화면 이동', action: 'up', label: '위로 스크롤', on: ALL, ko: ['위로', '올려', '올려줘', '스크롤 올려'], en: [] },
    { group: '토타시', action: 'status', label: '진행 상황 듣기', on: ALL, ko: ['진행 상황', '몇 개 남았어', '얼마나 남았어', '몇 문제 남았어'], en: [] },
    { group: '토타시', action: 'pet', label: '토타시와 인사하기', on: ALL, ko: ['안녕', '토타시야', '잘했어', '고마워', '사랑해', '귀여워'], en: [] },
    { group: '음성 조작', action: 'voiceOff', label: '음성 조작 끄기', on: ALL, ko: ['음성 끄기', '음성 조작 끄기', '마이크 끄기', '그만 들어'], en: ['stop listening', 'voice off', 'mic off'] },
  ];
  const HINTS = {
    home: ['시작', '10분', '명령어'], intro: ['다음', '다시', '천천히'], quiz: ['hint', "I don't know", 'listen'], result: ['다음', '쉬워', '어려워'],
    make: ['go back'], makeres: ['다음'], done: ['홈'], settings: ['홈', '명령어'], dict: ['뒤로', '내려'], menu: ['받아쓰기', '따라 말하기', '고르기'], records: ['홈', '레벨'], levels: ['뒤로', '시작'],
  };
  const normEn = s => String(s || '').toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normKo = s => String(s || '').replace(/[^가-힣0-9a-zA-Z]+/g, '').toLowerCase();
  const EN = new Map(), KO = new Map();
  COMMANDS.forEach(c => { c.en.forEach(p => EN.set(normEn(p), c)); c.ko.forEach(p => KO.set(normKo(p), c)); });
  const LEAD = /^(hey|okay|ok|please|totasi|toto|um|uh|so|and|well) /, TRAIL = / (please|now|thanks|thank you|totasi)$/;
  function findEn(text) {
    let t = normEn(text);
    if (EN.has(t)) return EN.get(t);
    for (let i = 0; i < 4; i++) { const n = t.replace(LEAD, '').replace(TRAIL, ''); if (n === t) break; t = n; if (EN.has(t)) return EN.get(t); }
    return null;
  }
  /* 한국어는 말끝이 다양하니, 짧은 말 안에 명령어가 들어 있으면 이 화면에서 쓸 수 있는 가장 긴 명령으로 본다. */
  function findKo(text, screen) {
    let t = normKo(text);
    if (t.length > 4 && t.startsWith('토타시야')) t = t.slice(4);
    if (KO.has(t)) return { c: KO.get(t), exact: true };
    if (t.length > 16) return null;
    let best = null, len = 0, other = null;
    KO.forEach((c, p) => { if (p.length >= 2 && t.includes(p)) { if (!c.on.includes(screen)) { other = other || c; return; } if (p.length > len) { best = c; len = p.length; } } });
    return best ? { c: best } : other ? { c: other } : null;
  }
  const wordsOf = s => normEn(s).split(' ').filter(Boolean);
  function interpret(alts, screen, blank, stage) {
    const list = (alts || []).filter(Boolean);
    if (langOf(screen, stage) === 'ko') {
      for (const a of list) {
        const f = findKo(a, screen);
        if (f) return f.c.on.includes(screen) ? { type: 'cmd', action: f.c.action, text: a } : { type: 'unavailable', action: f.c.action, text: a };
      }
      return { type: 'unknown', text: list[0] || '' };
    }
    const b = blank && blank.toLowerCase(), sent = screen === 'quiz' && stage && !['blank', 'wordBlank', 'wordRecall'].includes(stage);
    if (screen === 'quiz' && !sent && b && list.some(a => normEn(a) === b)) return { type: 'answer', ok: true, text: b };
    for (const a of list) {
      const c = findEn(a);
      if (c) return c.on.includes(screen) ? { type: 'cmd', action: c.action, text: a } : { type: 'unavailable', action: c.action, text: a };
    }
    if (sent && wordsOf(list[0]).length >= 2) return { type: 'sentence', alts: list, text: list[0] };
    if (screen === 'make' && wordsOf(list[0]).length >= 2) return { type: 'free', text: list[0] };
    if (screen === 'quiz' && !sent && b) {
      const hit = list.find(a => wordsOf(a).includes(b));
      if (hit) return { type: 'answer', ok: true, text: hit };
      if (wordsOf(list[0]).length >= 3) return { type: 'answer', ok: false, text: list[0] };
    }
    return { type: 'unknown', text: list[0] || '' };
  }
  const api = { COMMANDS, HINTS, langOf, findEn, findKo, interpret };
  if (typeof module !== 'undefined') module.exports = api; else root.VOICE = api;
})(this);
