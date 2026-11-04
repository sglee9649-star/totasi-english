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
console.log('410 ok');
