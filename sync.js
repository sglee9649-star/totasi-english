/* 기기 간 동기화. Firebase는 로그인했거나 로그인할 때만 불러와, 쓰지 않으면 앱에 영향을 주지 않는다. */
const Sync = (function () {
  const ON_KEY = 'totasi-english-sync-on', VENDOR = ['assets/vendor/firebase-app-compat.js', 'assets/vendor/firebase-auth-compat.js', 'assets/vendor/firebase-firestore-compat.js', 'firebase-config.js'];
  const SHARDS = 16;
  let auth = null, db = null, user = null, ready = null, busy = false, again = false, timer = null;
  const st = { lastAt: 0, message: '', error: '' };
  const isOn = () => { try { return localStorage.getItem(ON_KEY) === '1'; } catch { return false; } };
  const setOn = v => { try { v ? localStorage.setItem(ON_KEY, '1') : localStorage.removeItem(ON_KEY); } catch {} };
  const addScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });
  function load() {
    if (!ready) ready = (async () => {
      for (const src of VENDOR) await addScript(src);
      firebase.initializeApp(window.FIREBASE_CONFIG);
      auth = firebase.auth(); db = firebase.firestore();
      auth.onAuthStateChanged(u => { user = u; if (u) { setOn(true); now(); } if (window.onSyncChange) onSyncChange(); });
      try { await auth.getRedirectResult(); } catch (e) { st.error = message(e); }
    })().catch(e => { ready = null; throw e; });
    return ready;
  }
  const message = e => {
    const c = (e && e.code) || '';
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return '로그인을 취소했어요.';
    if (c === 'auth/unauthorized-domain') return '이 주소가 Firebase에 승인되지 않았어요.';
    if (c === 'auth/network-request-failed' || c === 'unavailable') return '인터넷 연결을 확인해 주세요.';
    if (c === 'permission-denied') return '기록에 접근할 권한이 없어요. 다시 로그인해 주세요.';
    if (c === 'resource-exhausted') return '오늘 무료 사용량을 넘었어요. 내일 다시 동기화돼요.';
    return '동기화하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
  };
  async function signIn() {
    st.error = '';
    try { await load(); } catch { st.error = '로그인 기능을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'; throw new Error(st.error); }
    const p = new firebase.auth.GoogleAuthProvider();
    setOn(true);
    try { await auth.signInWithPopup(p); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(e.code)) return auth.signInWithRedirect(p);
      if (!user) setOn(false);
      st.error = message(e); throw e;
    }
  }
  async function signOut() { if (auth) await auth.signOut(); user = null; setOn(false); st.lastAt = 0; st.message = ''; st.error = ''; }
  const shardOf = id => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return String(h % SHARDS); };
  const meta = s => JSON.parse(JSON.stringify({ schema: s.schema, call: s.call, autoplay: s.autoplay, auto: s.auto, minutes: s.minutes, aiLimit: s.aiLimit, aiMonth: s.aiMonth, aiCost: s.aiCost, settingsAt: s.settingsAt, savedAt: s.savedAt, resetAt: s.resetAt, level: s.level, exam: s.exam, days: s.days }));
  const shards = cards => { const out = {}; for (let i = 0; i < SHARDS; i++) out[i] = {}; Object.entries(cards).forEach(([k, v]) => { out[shardOf(k)][k] = v; }); return out; };
  async function now() {
    if (!user || !db) return false;
    if (busy) { again = true; return false; }
    if (navigator.onLine === false) { st.error = '오프라인이에요. 연결되면 다시 동기화할게요.'; if (window.onSyncChange) onSyncChange(); return false; }
    busy = true; st.error = '';
    try {
      const root = db.collection('users').doc(user.uid);
      const [mSnap, cSnap] = await Promise.all([root.collection('state').doc('meta').get(), root.collection('cards').get()]);
      const remote = mSnap.exists ? Object.assign({}, mSnap.data(), { cards: {} }) : null;
      const remoteShards = {};
      cSnap.forEach(d => { remoteShards[d.id] = (d.data().items) || {}; if (remote) Object.assign(remote.cards, remoteShards[d.id]); });
      const before = Object.keys(S.cards).length;
      const merged = SRS.mergeState(S, remote);
      const changedLocal = JSON.stringify(merged.cards) !== JSON.stringify(S.cards) || merged.level.current !== S.level.current || merged.days.length !== S.days.length || merged.call !== S.call;
      Object.assign(S, merged); saveLocal();
      const batch = db.batch(), next = shards(S.cards); let writes = 0;
      for (let i = 0; i < SHARDS; i++) {
        const had = remoteShards[i] || null, cur = next[i];
        if (!had && !Object.keys(cur).length) continue;
        if (had && JSON.stringify(sorted(had)) === JSON.stringify(sorted(cur))) continue;
        batch.set(root.collection('cards').doc(String(i)), { items: JSON.parse(JSON.stringify(cur)) }); writes++;
      }
      const m = meta(S);
      if (!mSnap.exists || JSON.stringify(sorted(meta(Object.assign({}, S, mSnap.data())))) !== JSON.stringify(sorted(m))) { batch.set(root.collection('state').doc('meta'), m); writes++; }
      if (writes) await batch.commit();
      st.lastAt = Date.now();
      st.message = remote ? `기기 ${before}개, 서버 ${Object.keys(remote.cards).length}개를 합쳐 ${Object.keys(S.cards).length}개가 됐어요.` : `기록 ${Object.keys(S.cards).length}개를 저장했어요.`;
      if (changedLocal && window.onSyncMerged) onSyncMerged();
    } catch (e) { st.error = message(e); }
    busy = false;
    if (window.onSyncChange) onSyncChange();
    if (again) { again = false; return now(); }
    return !st.error;
  }
  const sorted = o => { if (Array.isArray(o) || o === null || typeof o !== 'object') return o; const r = {}; Object.keys(o).sort().forEach(k => { r[k] = sorted(o[k]); }); return r; };
  /* 답할 때마다 쓰지 않고 30초 동안 모아서 보낸다. */
  const soon = () => { if (!user) return; clearTimeout(timer); timer = setTimeout(now, 3e4); };
  const flush = () => { if (user && timer) { clearTimeout(timer); timer = null; now(); } };
  return { isOn, load, signIn, signOut, now, soon, flush, state: st, get user() { return user; } };
})();
