const a=require('assert'),V=require('../voice.js'),items=require('../data/expressions.json');
const I=V.interpret;
a.equal(I(['Next'],'result','').action,'next');
a.equal(I(['okay next please'],'result','').action,'next');
a.equal(I(['Hey Totasi, say it again.'],'result','').action,'listen');
a.equal(I(["I don't know"],'quiz','window').action,'pass');
a.equal(I(['next'],'quiz','window').type,'unavailable');
a.equal(I(['window'],'quiz','window').ok,true);
a.equal(I(['Can I get a window seat'],'quiz','window').ok,true);
a.equal(I(['Can I get an aisle seat'],'quiz','window').ok,false);
a.equal(I(['um yeah'],'quiz','window').type,'unknown');
a.equal(I(['again'],'quiz','again').type,'answer');   // 정답 단어가 명령어와 같으면 답 우선
a.equal(I(['back'],'quiz','back').type,'answer');
a.equal(I(['go back'],'quiz','back').action,'back');
a.equal(I(['again'],'quiz','window').action,'listen');
a.equal(I(['xx','10 minutes'],'home','').action,'m1');
a.equal(I(['ten minutes'],'home','').action,'m1');
a.equal(V.findCommand('sdfsdf'),null);
const seen=new Map();V.COMMANDS.forEach(c=>c.say.forEach(p=>{a.ok(!seen.has(p),'dup '+p);seen.set(p,c.action)}));
console.log('ok',V.COMMANDS.length,'actions',seen.size,'phrases');
// 빈칸 단어와 겹치는 명령어 표시
console.log(items.filter(i=>seen.has(i.blank)).map(i=>i.id+':'+i.blank).join(' '));
a.equal(I(['Can I get a window seat'],'quiz','window','sentence').type,'sentence');
a.equal(I(['um'],'quiz','window','sentence').type,'unknown');
a.equal(I(['easy'],'result','').action,'easy');
for(const i of items)a.ok(!V.findCommand(i.en),'sentence collides '+i.id);
console.log('stage ok');
