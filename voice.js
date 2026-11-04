/* 음성 명령 사전과 해석. 화면과 분리해 테스트할 수 있게 둔다. */
(function (root) {
  const ALL = ['home', 'intro', 'quiz', 'result', 'done', 'settings', 'dict', 'make', 'makeres', 'menu', 'records'];
  const TABS = ['home', 'done', 'settings', 'dict', 'menu', 'records'];
  const STUDY = ['intro', 'quiz', 'result'];
  const COMMANDS = [
    { group: '학습 진행', action: 'next', label: '다음으로 넘어가기, 문제 풀기', on: ['intro', 'result', 'done', 'makeres'], say: ['next', 'next one', 'next question', 'next please', 'continue', 'go on', 'move on', 'keep going', 'go ahead', "let's go", 'quiz me', 'test me', 'start quiz', 'start the quiz', "i'm ready", 'ready'] },
    { group: '학습 진행', action: 'easy', label: '쉬웠어요, 복습 늦추기', on: ['result'], say: ['easy', 'that was easy', 'too easy', 'so easy', 'very easy'] },
    { group: '학습 진행', action: 'hard', label: '어려웠어요, 복습 앞당기기', on: ['result'], say: ['hard', 'difficult', 'that was hard', 'too hard', 'so hard', 'very hard'] },
    { group: '학습 진행', action: 'hint', label: '첫 글자 힌트 보기', on: ['quiz'], say: ['hint', 'give me a hint', 'one hint', 'clue', 'give me a clue', 'first letter', 'help me', 'what is the first letter'] },
    { group: '학습 진행', action: 'pass', label: '모르겠어요, 정답 보기', on: ['quiz'], say: ["i don't know", 'i do not know', 'i dont know', 'dunno', 'no idea', 'pass', 'skip', 'skip it', 'skip this', 'give up', 'i give up', 'show me the answer', 'show the answer', 'show answer', 'tell me the answer', "what's the answer"] },
    { group: '학습 진행', action: 'quit', label: '오늘 공부 끝내기', on: STUDY, say: ['stop', 'finish', 'quit', 'end', "i'm done", 'i am done', "that's all", "that's enough", 'stop studying', 'finish studying', 'end session', 'take a break', "let's stop", "let's finish"] },
    { group: '듣기', action: 'listen', label: '문장 다시 듣기', on: STUDY, say: ['listen', 'play', 'play it', 'play again', 'say it', 'say it again', 'say that again', 'repeat', 'repeat that', 'repeat please', 'again', 'one more time', 'read it', 'read it again', 'pardon', 'sorry what', 'what did you say'] },
    { group: '듣기', action: 'slow', label: '천천히 듣기', on: STUDY, say: ['slowly', 'slower', 'slow', 'slow down', 'say it slowly', 'speak slowly', 'read it slowly', 'more slowly'] },
    { group: '듣기', action: 'meaning', label: '한국어 뜻 듣기', on: STUDY, say: ['meaning', 'the meaning', "what's the meaning", 'what does it mean', 'what does that mean', 'translate', 'translation', 'korean', 'in korean', 'say it in korean'] },
    { group: '학습 시작', action: 'start', label: '추천 시간으로 시작', on: ['home'], say: ['start', 'begin', 'study', 'start studying', "let's start", "let's study", "let's begin", 'start now'] },
    { group: '학습 시작', action: 'm0', label: '5분 공부', on: ['home'], say: ['five minutes', '5 minutes', 'five', '5', 'five minute', '5 minute', 'quick study'] },
    { group: '학습 시작', action: 'm1', label: '10분 공부', on: ['home'], say: ['ten minutes', '10 minutes', 'ten', '10', 'ten minute', '10 minute'] },
    { group: '학습 시작', action: 'm2', label: '20분 공부', on: ['home'], say: ['twenty minutes', '20 minutes', 'twenty', '20', 'twenty minute', '20 minute'] },
    { group: '학습 시작', action: 'm3', label: '30분 공부', on: ['home'], say: ['thirty minutes', '30 minutes', 'thirty', '30', 'half an hour', 'thirty minute', '30 minute'] },
    { group: '학습 시작', action: 'm4', label: '60분 빡공', on: ['home'], say: ['sixty minutes', '60 minutes', 'sixty', '60', 'one hour', 'an hour', '1 hour', 'hard mode', 'boost mode'] },
    { group: '학습 시작', action: 'speed', label: '순발력 연습', on: ['home', 'menu'], say: ['speed practice', 'speed drill', 'speed mode', 'speed training', 'quick practice'] },
    { group: '학습 시작', action: 'make', label: '내 문장 만들기', on: ['home', 'menu'], say: ['my sentence', 'make a sentence', 'write a sentence', 'sentence practice', 'ai practice'] },
    { group: '화면 이동', action: 'back', label: '뒤로 가기', on: ALL, say: ['go back', 'back', 'previous', 'return', 'go to the previous screen', 'close', 'close it'] },
    { group: '화면 이동', action: 'homeGo', label: '처음 화면으로', on: ALL, say: ['home', 'go home', 'home screen', 'main menu', 'main screen', 'go to home', 'go to the home screen'] },
    { group: '화면 이동', action: 'menu', label: '학습 메뉴 열기', on: TABS, say: ['study menu', 'learning menu', 'menu', 'open menu', 'show menu', 'modes', 'study modes'] },
    { group: '화면 이동', action: 'records', label: '기록 보기', on: TABS, say: ['records', 'my records', 'history', 'show records', 'statistics', 'stats', 'my progress'] },
    { group: '화면 이동', action: 'settings', label: '설정 열기', on: TABS, say: ['settings', 'open settings', 'options', 'show settings'] },
    { group: '화면 이동', action: 'dict', label: '명령어 사전 열기', on: ALL, say: ['commands', 'command list', 'show commands', 'help', 'what can i say', 'dictionary', 'command dictionary', 'open dictionary'] },
    { group: '화면 이동', action: 'down', label: '아래로 스크롤', on: ALL, say: ['scroll down', 'down', 'page down', 'go down'] },
    { group: '화면 이동', action: 'up', label: '위로 스크롤', on: ALL, say: ['scroll up', 'up', 'page up', 'go up'] },
    { group: '토타시', action: 'status', label: '진행 상황 듣기', on: ALL, say: ['progress', 'how many left', 'how much left', 'how am i doing', 'status', 'how many reviews'] },
    { group: '토타시', action: 'pet', label: '토타시와 인사하기', on: ALL, say: ['hello', 'hi', 'hi totasi', 'hello totasi', 'good girl', 'good job', 'thank you', 'thanks', 'i love you', 'good morning', 'good night'] },
    { group: '음성 조작', action: 'voiceOff', label: '음성 조작 끄기', on: ALL, say: ['stop listening', 'voice off', 'mic off', 'microphone off', 'turn off the mic', 'turn off the microphone', 'turn off voice control'] },
  ];
  const HINTS = {
    home: ['start', 'ten minutes', 'commands'], intro: ['next', 'listen', 'slowly'], quiz: ['hint', "I don't know", 'listen'],
    result: ['next', 'easy', 'hard'], make: ['go back'], makeres: ['next'], done: ['home'], settings: ['home', 'commands'], menu: ['speed practice', 'my sentence'], records: ['home', 'study menu'], dict: ['go back', 'scroll down'],
  };
  const norm = s => String(s || '').toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const LOOKUP = new Map();
  COMMANDS.forEach(c => c.say.forEach(p => LOOKUP.set(norm(p), c)));
  const LEAD = /^(hey|okay|ok|please|totasi|toto|um|uh|so|and|well) /, TRAIL = / (please|now|thanks|thank you|totasi)$/;
  function findCommand(text) {
    let t = norm(text);
    if (LOOKUP.has(t)) return LOOKUP.get(t);
    for (let i = 0; i < 4; i++) {
      const n = t.replace(LEAD, '').replace(TRAIL, '');
      if (n === t) break;
      t = n;
      if (LOOKUP.has(t)) return LOOKUP.get(t);
    }
    return null;
  }
  const wordsOf = s => norm(s).split(' ').filter(Boolean);
  /* 짧은 잡음을 오답 처리하지 않도록, 빈칸 단어가 없으면 세 단어 이상일 때만 답으로 본다. */
  function interpret(alts, screen, blank, stage) {
    const list = (alts || []).filter(Boolean), b = blank && blank.toLowerCase(), sent = screen === 'quiz' && stage && stage !== 'blank';
    if (screen === 'quiz' && !sent && b && list.some(a => norm(a) === b)) return { type: 'answer', ok: true, text: b };
    for (const a of list) {
      const c = findCommand(a);
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
  const api = { COMMANDS, HINTS, findCommand, interpret };
  if (typeof module !== 'undefined') module.exports = api; else root.VOICE = api;
})(this);
