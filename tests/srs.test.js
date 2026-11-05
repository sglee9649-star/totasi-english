const a=require('assert'),S=require('../srs.js'),items=require('../data/expressions.json');
const now=new Date(2026,10,4,20).getTime();
let c=S.grade(undefined,true,now);a.equal(c.days,1);a.equal(c.due,new Date(2026,10,5).getTime());
c=S.grade(c,true,c.due);a.equal(c.days,3);
let w=S.grade(c,false,now);a.equal(w.due,now+6e5);a.equal(w.lapses,1);a.equal(w.days,0);
a.equal(S.grade(w,true,now).lapses,1);
a.equal(S.check(' Window ','window'),'exact');a.equal(S.check('windw','window'),'typo');a.equal(S.check('go','to'),'wrong');a.equal(S.check('a window','window'),'wrong');
a.equal(S.check('Can I get a window seat?','window',true),'exact');a.equal(S.check('Can I get a seat','window',true),'wrong');
for(const i of items){const p=S.splitBlank(i.en,i.blank);a.ok(p,i.id);a.equal(p.join(''),i.en);a.equal(p[1].toLowerCase(),i.blank.toLowerCase());}
let q=S.buildSession(items,{},S.MODES[0],now);a.equal(q.length,2);a.ok(q.every(x=>x.kind==='new'));a.ok(q.every(x=>x.item.level===1));
const due={};items.forEach(i=>due[i.id]={due:now-1,reps:1,lapses:0});q=S.buildSession(items,due,S.MODES[0],now);a.equal(q.length,12);a.ok(q.every(x=>x.kind==='review'));
const few={[items[0].id]:{due:now-1}};q=S.buildSession(items,few,S.MODES[1],now);a.equal(q.length,6);a.equal(q[0].kind,'review');
console.log('ok');
{const g=(i,e,x)=>S.gradeSentence(i,e,x);
a.ok(g('I am looking for subway station','I\'m looking for the subway station.',"I'm looking for ~").ok);
a.ok(g("Can I get a window seat",'Can I get a window seat?','Can I get ~?').perfect);
a.ok(!g('I want subway station',"I'm looking for the subway station.","I'm looking for ~").ok);
a.ok(!g('',"Oh, that makes sense.",'That makes sense').ok);
a.equal(S.stageOf(undefined),'blank');a.equal(S.stageOf({reps:1}),'arrange');a.equal(S.stageOf({reps:3}),'sentence');
const c1=S.grade(undefined,true,now);a.equal(S.rate(c1,'easy',now).days,3);a.equal(S.rate({days:6},'hard',now).days,3);
for(const i of items){a.ok(g(i.en,i.en,i.expression).ok,i.id);a.ok(g(i.en.toLowerCase().replace(/[,.?]/g,''),i.en,i.expression).perfect,i.id)}
console.log('sentence ok')}
a.equal(items.length,410);a.equal(new Set(items.map(i=>i.id)).size,410);a.equal(new Set(items.map(i=>i.en)).size,410);a.equal(new Set(items.map(i=>i.expression)).size,410);
for(const i of items){const g=S.gradeSentence(i.en,i.en,i.expression);a.ok(g.ok,'self '+i.id);a.ok(S.splitBlank(i.en,i.blank),'blank '+i.id);a.ok(i.ko&&i.meaning&&i.note,'fields '+i.id)}
for(const i of items)a.ok(S.LEVELS.includes(i.opic),'opic '+i.id);
const cnt=l=>items.filter(i=>i.opic===l).length;a.deepEqual(S.LEVELS.map(cnt),[20,20,30,60,67,60,51,62,40]);
{const cur={[items[0].id]:{due:now-1,reps:1,lapses:0}};const q=S.buildSession(items,cur,S.MODES[1],now,'IM2');a.equal(q[0].kind,'review');a.ok(q.filter(x=>x.kind==='new').every(x=>x.item.opic==='IM2'));
 const all={};items.filter(i=>i.opic==='IL').forEach(i=>all[i.id]={due:now+1e9,reps:1});a.equal(S.buildSession(items,all,S.MODES[1],now,'IL').length,0);a.ok(S.levelProgress(items,all,'IL').done);
 a.equal(S.nextLevel('AL'),null);a.equal(S.nextLevel('IL'),'IM1');a.ok(S.canStudyLevel('NL','IL'));a.ok(!S.canStudyLevel('IM1','IL'))}
{const W=require('../data/words.json').map(w=>({id:w.id,opic:w.opic,word:w.word,en:w.en,blank:w.word}));
a.equal(W.length,750);a.equal(new Set(W.map(w=>w.word)).size,750);for(const w of W)a.ok(S.splitBlank(w.en,w.blank),w.id);
a.equal(S.wordStage(undefined),'wordChoice');a.equal(S.wordStage({reps:2}),'wordBlank');a.equal(S.wordStage({reps:3}),'wordRecall');
let q=S.buildSession(items,{},S.MODES[1],now,'IL',W);a.equal(q.length,10);a.ok(q[0].item.word);a.ok(!q[9].item.word);
const dueAll={};W.forEach(w=>dueAll[w.id]={due:now-1,reps:1});q=S.buildSession(items,dueAll,S.MODES[0],now,'IL',W);a.equal(q.length,12);a.ok(q.every(x=>x.kind==='review'));}
{const W=require('../data/words.json').map(w=>({id:w.id,opic:w.opic,blank:w.word}));
const cardsFor=(ex,wd,reps,due)=>{const c={};items.filter(i=>i.opic==='IL').slice(0,ex).forEach(i=>c[i.id]={reps,due});W.filter(i=>i.opic==='IL').slice(0,wd).forEach(i=>c[i.id]={reps,due});return c};
const far=now+1e10;let st=S.promotionStatus(items,W,cardsFor(48,120,2,far),'IL',now);a.ok(st.ready,JSON.stringify(st));
st=S.promotionStatus(items,W,cardsFor(47,120,2,far),'IL',now);a.ok(!st.ready);a.equal(st.checks[0].ok,false);
st=S.promotionStatus(items,W,cardsFor(48,119,2,far),'IL',now);a.equal(st.checks[1].ok,false);
st=S.promotionStatus(items,W,cardsFor(48,120,1,far),'IL',now);a.equal(st.checks[2].ok,false);
const six=cardsFor(48,120,2,far);Object.keys(six).slice(0,6).forEach(k=>six[k].due=now-1);a.equal(S.promotionStatus(items,W,six,'IL',now).checks[3].ok,false);
const e=S.buildExam(items,W,'IL');a.equal(e.length,25);a.equal(new Set(e.map(x=>x.item.id)).size,25);a.equal(e.filter(x=>x.section==='말하기').length,5);a.equal(e.filter(x=>x.section==='단어').length,8);
a.ok(e.every(x=>S.EXAM_SECS[x.stage]));a.equal(S.buildExam(items,W,'IM2').length,25);
const m=(r,sp)=>[...Array(20)].map((_,i)=>({section:'단어',ok:i<r})).concat([...Array(5)].map((_,i)=>({section:'말하기',ok:i<sp})));
a.ok(S.examScore(m(17,3)).passed);a.ok(!S.examScore(m(16,3)).passed);a.ok(!S.examScore(m(20,2)).passed);a.equal(S.examScore(m(17,3)).pct,80)}
{const E=require('../data/examples.json'),ids=new Set(items.map(i=>i.id));
for(const k in E){a.ok(ids.has(k),'key '+k);a.ok(E[k].length>=8,k);a.equal(new Set(E[k]).size,E[k].length,k)}
for(const i of items.filter(i=>['IL','IM1','IM2','IM3','IH'].includes(i.opic)))a.ok(E[i.id],'example '+i.id);
const L=[...Array(8)].map((_,i)=>'s'+i);let rec=[];
for(let n=0;n<40;n++){const r=S.pickExamples(L,rec,3);a.equal(r.picks.length,3);a.equal(new Set(r.picks).size,3);a.ok(r.picks.every(p=>!rec.includes(p)),'recent');rec=r.recent;a.ok(rec.length<=5)}
a.equal(S.pickExamples(['a','b'],[0],3).picks.length,2);a.equal(S.pickExamples(['a','b','c'],[0,1],3).picks.length,3);a.equal(S.pickExamples([...Array(20)].map((_,i)=>i),[],3).recent.length,3)}
{const base=o=>Object.assign({call:'오빠',cards:{},days:[],level:{current:'IL',passed:[],history:[]},exam:{lastAt:0,lastLevel:'',attempts:{}},settingsAt:0,savedAt:100,resetAt:0,autoplay:true,minutes:10,aiLimit:1,aiMonth:'',aiCost:0,voice:false},o);
const A=base({cards:{a:{seen:5,reps:1},b:{seen:9,reps:4}},days:['2026-11-01'],voice:true,settingsAt:5,call:'언니'}),B=base({cards:{a:{seen:7,reps:2},c:{seen:3,reps:1}},days:['2026-11-02','2026-11-01'],settingsAt:9,level:{current:'IM1',passed:['IL'],history:[{from:'IL',to:'IM1',at:50,score:90}]},call:'오빠',aiMonth:'2026-11',aiCost:.2});
const m=S.mergeState(A,B);a.equal(m.cards.a.reps,2);a.equal(m.cards.b.reps,4);a.equal(m.cards.c.reps,1);a.deepEqual(m.days,['2026-11-01','2026-11-02']);a.equal(m.level.current,'IM1');a.equal(m.call,'오빠');a.equal(m.voice,true);a.equal(m.aiCost,.2);
const m2=S.mergeState(m,B);a.deepEqual(JSON.parse(JSON.stringify(m2.cards)),JSON.parse(JSON.stringify(m.cards)));a.deepEqual(m2.level,m.level);a.deepEqual(m2.days,m.days);a.deepEqual(S.mergeState(B,A).cards,m.cards);
const wiped=base({resetAt:1000,savedAt:1000,cards:{},days:[]}),stale=base({savedAt:500,cards:{a:{seen:400,reps:3},n:{seen:1500,reps:1}},level:{current:'IH',passed:['IL'],history:[{from:'IL',to:'IM1',at:90,score:90}]}});
const r=S.mergeState(stale,wiped);a.equal(r.cards.a,undefined);a.ok(r.cards.n);a.equal(r.level.current,'IL');a.equal(r.level.history.length,0);a.equal(r.resetAt,1000);
a.equal(S.mergeState(A,null).cards.a.reps,1)}
{const it={blank:'window',en:"Can I get a window seat?",expression:'Can I get ~?'},J=S.judgeSpoken;
a.equal(J('window',it,'blank'),'ok');a.equal(J('um uh',it,'blank'),'ignore');a.equal(J('door',it,'blank'),'wrong');a.equal(J('ok',it,'blank'),'ignore');
a.equal(J('Can I get a window seat',it,'sentence'),'ok');a.equal(J('um can I get window seat',it,'sentence'),'close');a.equal(J('window',it,'sentence'),'partial');a.equal(J('Can I',it,'sentence'),'partial');a.equal(J('I want to buy a nice door',it,'sentence'),'wrong');a.equal(J('hmm',it,'sentence'),'ignore');
a.equal(S.bestSpoken(['door','window'],it,'blank').verdict,'ok');
const m=S.mergeState({cards:{},days:[],level:{current:'IL'},auto:{on:true},settingsAt:1,savedAt:1},{cards:{},days:[],level:{current:'IL'},auto:{on:false},settingsAt:2,savedAt:1});a.equal(m.auto.on,false)}
console.log('410 ok');
