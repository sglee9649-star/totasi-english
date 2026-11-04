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
