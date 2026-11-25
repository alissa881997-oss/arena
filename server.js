'use strict';
// ԱՐԵՆԱ • 10 ԿԱՅԱՆ — server (no dependencies). Run: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const PORT=+process.env.PORT||3000,HPW=process.env.HOST_PASSWORD||'arena2026';
const DF=process.env.DATA_FILE||path.join(__dirname,'data.json');
const C=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf8'));
const fresh=()=>({mode:'stations',rot:1,timer:{status:'idle',dur:600,rem:600,endsAt:0},stopSig:0,showClue:true,photoN:10,bi:0,bphase:'write',bopts:[],scores:{},wordle:[],photo:[],ph:null,bw:[],bv:[],logins:{}});
let S=fresh(),PIN={t:{},s:{}};
try{const d=JSON.parse(fs.readFileSync(DF,'utf8'));S=Object.assign(fresh(),d.S);PIN=d.PIN||PIN}catch(e){}
const used=new Set();
const pin4=()=>{let p;do p=String(1000+Math.floor(Math.random()*9000));while(used.has(p));used.add(p);return p};
Object.values(PIN.t).concat(Object.values(PIN.s)).forEach(p=>used.add(p));
for(let i=1;i<=10;i++){PIN.t['T'+i]=PIN.t['T'+i]||pin4();PIN.s[i]=PIN.s[i]||pin4()}
let sv=0;const save=()=>{clearTimeout(sv);sv=setTimeout(()=>fs.writeFile(DF,JSON.stringify({S,PIN}),()=>{}),300)};

const A=(c,m)=>{if(!c)throw new Error(m)};
const tmOf=(s,r)=>((s-r+100)%10)+1; // team at station s in round r (team k visits k, k+1, ... 10, 1 ...)
const left=()=>{const t=S.timer;return t.status==='running'?Math.max(0,Math.ceil((t.endsAt-Date.now())/1000)):t.rem};
const hostOk=pw=>A(String(pw||'').trim()===HPW,'Սխալ Վարիչի գաղտնաբառ։');
const coordOk=(s,p)=>A(PIN.s[+s]&&String(p||'').trim()===PIN.s[+s],'Սխալ կայանի PIN — հարցուր Վարիչին։');
const teamOk=(t,p)=>A(PIN.t[t]&&String(p||'').trim()===PIN.t[t],'Սխալ խումբի PIN — հարցուր Վարիչին։');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Math.round(+n||0)));
const setScore=(sid,t,pts,note)=>{S.scores[sid+'_'+t]={points:clamp(pts,0,500),note:note||'',at:Date.now()}};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const PH=()=>{if(!S.ph||S.ph.rot!==S.rot)S.ph={rot:S.rot,wrong:0,solved:false,pts:0};return S.ph};
const dimsOf=n=>{let b={cols:2,rows:1},bs=9999;for(let r=1;r<=Math.ceil(Math.sqrt(n));r++){const c=Math.ceil(n/r),s=Math.abs(C.photo.ratio*r/c-1.35)+(c*r-n)/n*.45;if(s<bs){bs=s;b={cols:c,rows:r}}}return b};
const pidx=()=>(S.rot-1)%5;
const pcode=n=>{const c=C.photo.codes[pidx()];return (c+c).slice(0,n)};
const wcolors=(w,g)=>{const r=Array(5).fill('x'),u=[...w];for(let i=0;i<5;i++)if(g[i]===w[i]){r[i]='c';u[i]=null}for(let i=0;i<5;i++)if(r[i]!=='c'){const j=u.indexOf(g[i]);if(j>-1){r[i]='p';u[j]=null}}return r.join('')};
const online=new Map();

// ---------- player-side helpers ----------
const wMe=cid=>S.wordle.find(x=>x.rot===S.rot&&x.cid===cid);
const wOut=m=>({slot:m.slot,hint:C.wordle[m.slot].hint,rows:m.rows,solved:m.solved,pts:m.pts,word:(!m.solved&&m.rows.length>=6)?C.wordle[m.slot].word:undefined});
const pMe=cid=>S.photo.find(x=>x.rot===S.rot&&x.cid===cid);
const pOut=m=>({slot:m.slot,char:pcode(S.photoN)[m.slot],idx:pidx(),n:S.photoN,dims:dimsOf(S.photoN),ratio:C.photo.ratio,solved:PH().solved,pts:PH().pts});
const freeSlot=(list,max,lead)=>{const u=new Set(list.filter(x=>x.rot===S.rot).map(x=>x.slot));if(lead&&!u.has(0))return 0;for(let i=0;i<max;i++)if(!u.has(i))return i;return -1};

function act(b){
 switch(b.a){
 case 'hauth':hostOk(b.pw);return{ok:1};
 case 'cauth':coordOk(b.s,b.pin);return{ok:1};
 case 'tauth':teamOk(b.t,b.pin);(S.logins[b.t]=S.logins[b.t]||{})[b.cid]=Date.now();return{ok:1};
 case 'decks':if(b.pw){hostOk(b.pw);return{decks:C.decks,bluff:C.bluff}}coordOk(b.s,b.pin);return{decks:C.decks};
 // ----- host -----
 case 'hstart':{hostOk(b.pw);const t=S.timer,sec=(t.status==='paused'&&t.rem>0)?t.rem:t.dur;S.mode='stations';S.timer={status:'running',dur:t.dur,rem:sec,endsAt:Date.now()+sec*1000};S.showClue=false;return{ok:1}}
 case 'hpause':{hostOk(b.pw);const r=left();S.timer.status='paused';S.timer.rem=r;S.timer.endsAt=0;return{ok:1}}
 case 'hstop':{hostOk(b.pw);S.timer.status='stopped';S.timer.rem=0;S.timer.endsAt=0;S.stopSig++;return{ok:1}}
 case 'hnext':{hostOk(b.pw);S.mode='stations';S.rot=Math.min(10,S.rot+1);S.timer={status:'idle',dur:600,rem:600,endsAt:0};S.showClue=true;return{ok:1}}
 case 'hrot':{hostOk(b.pw);S.mode='stations';S.rot=clamp(b.n,1,10);S.timer={status:'idle',dur:600,rem:600,endsAt:0};S.showClue=true;return{ok:1}}
 case 'hstations':hostOk(b.pw);S.mode='stations';return{ok:1};
 case 'hpodium':hostOk(b.pw);S.mode='podium';return{ok:1};
 case 'hbluff':hostOk(b.pw);S.mode='bluff';S.bi=clamp(b.i,0,9);S.bphase='write';S.bopts=[];S.timer={status:'idle',dur:600,rem:600,endsAt:0};return{ok:1};
 case 'hbvote':{hostOk(b.pw);const q=C.bluff[S.bi%C.bluff.length],o=[q.real];const add=t=>{t=String(t).trim();if(t&&!o.some(x=>x.toLowerCase()===t.toLowerCase()))o.push(t)};S.bw.filter(x=>x.i===S.bi).forEach(x=>add(x.text));for(const z of q.bots){if(o.length>=6)break;add(z)}S.bopts=shuffle(o);S.bphase='vote';return{ok:1}}
 case 'hbclose':{hostOk(b.pw);const q=C.bluff[S.bi%C.bluff.length];S.bv.filter(x=>x.i===S.bi&&x.ok).sort((a,c)=>a.at-c.at).forEach((w,k)=>setScore('B'+(S.bi+1),w.t,Math.round(100*(10-k)/10),'Bluff'));S.bphase='closed';return{ok:1}}
 case 'hscore':hostOk(b.pw);A(/^(S([1-9]|10)|B([1-9]|10))$/.test(b.sid)&&/^T([1-9]|10)$/.test(b.t),'Սխալ');setScore(b.sid,b.t,b.pts,'Host');return{ok:1};
 case 'hregen':{hostOk(b.pw);if(b.kind==='t'&&PIN.t[b.id])PIN.t[b.id]=pin4();else if(b.kind==='s'&&PIN.s[b.id])PIN.s[b.id]=pin4();return{ok:1}}
 case 'hreset':hostOk(b.pw);S=fresh();return{ok:1};
 // ----- coordinator -----
 case 'cscore':{coordOk(b.s,b.pin);setScore('S'+(+b.s),'T'+tmOf(+b.s,S.rot),b.pts,'Coord');return{ok:1}}
 case 'cphotoN':{coordOk(5,b.pin);S.photoN=clamp(b.n,2,24);S.photo=S.photo.filter(x=>x.rot!==S.rot);return{ok:1}}
 // ----- wordle -----
 case 'wjoin':{let m=wMe(b.cid);if(!m){const s=freeSlot(S.wordle,5,b.leader);A(s>=0,'Այս շրջանի բոլոր 5 բառերը արդէն վերցուած են։');m={rot:S.rot,slot:s,cid:b.cid,name:String(b.name||'Խաղացող '+(s+1)).slice(0,24),rows:[],solved:false,pts:0};S.wordle.push(m)}return wOut(m)}
 case 'wguess':{const m=wMe(b.cid);A(m,'Նախ միացիր։');A(S.timer.status==='running','Սպասէ՛ Վարիչի սկիզբին։');const g=String(b.g||'').toUpperCase();A(/^[A-Z]{5}$/.test(g),'5 տառ գրէ՛։');A(!m.solved&&m.rows.length<6,'Աւարտած է։');const w=C.wordle[m.slot].word;m.rows.push({g,c:wcolors(w,g)});if(g===w){m.solved=true;m.pts=10+Math.round(10*left()/S.timer.dur);const t='T'+tmOf(4,S.rot);setScore('S4',t,S.wordle.filter(x=>x.rot===S.rot).reduce((a,x)=>a+x.pts,0),'Wordle')}return wOut(m)}
 // ----- photo -----
 case 'pjoin':{let m=pMe(b.cid);if(!m){const s=freeSlot(S.photo,S.photoN,b.leader);A(s>=0,'Խումբը լեցուած է — թիւը արդէն լրացաւ։');m={rot:S.rot,slot:s,cid:b.cid,name:String(b.name||'Խաղացող '+(s+1)).slice(0,24)};S.photo.push(m)}return pOut(m)}
 case 'pcode':{const m=pMe(b.cid);A(m,'Նախ միացիր։');A(S.timer.status==='running','Սպասէ՛ Վարիչի սկիզբին։');const p=PH();if(p.solved)return pOut(m);if(String(b.code||'').trim().toUpperCase()!==pcode(S.photoN)){p.wrong++;throw new Error('❌ Կոդը սխալ է')}p.solved=true;p.pts=Math.max(30,60+Math.round(40*left()/S.timer.dur)-5*p.wrong);setScore('S5','T'+tmOf(5,S.rot),p.pts,'Photo');return pOut(m)}
 // ----- bluff -----
 case 'bwrite':{teamOk(b.t,b.pin);A(S.mode==='bluff'&&S.bphase==='write','Պլաֆ գրելու փուլը փակուած է։');const x=String(b.text||'').trim().slice(0,60);A(x,'Գրէ՛ խաբուսիկ պատասխան մը։');const e=S.bw.find(y=>y.i===S.bi&&y.t===b.t);if(e)e.text=x;else S.bw.push({i:S.bi,t:b.t,text:x});return{ok:1}}
 case 'bvote':{teamOk(b.t,b.pin);A(S.mode==='bluff'&&S.bphase==='vote','Քուէարկութեան փուլը փակուած է։');if(S.bv.some(y=>y.i===S.bi&&y.t===b.t))return{ok:1};A(S.bopts.includes(b.choice),'Սխալ ընտրութիւն։');const real=C.bluff[S.bi%C.bluff.length].real;S.bv.push({i:S.bi,t:b.t,c:b.choice,ok:b.choice.toLowerCase()===real.toLowerCase(),at:Date.now()});return{ok:1}}
 }
 throw new Error('?');
}

// ---------- state views ----------
function pub(){const cl=S.bphase==='closed',q=C.bluff[S.bi%C.bluff.length];
 const tl={};for(let i=1;i<=10;i++){const L=S.logins['T'+i]||{};tl['T'+i]={n:Object.keys(L).length,on:Object.keys(L).filter(c=>online.get(c)).length}}
 return{now:Date.now(),mode:S.mode,rot:S.rot,timer:S.timer,stopSig:S.stopSig,showClue:S.showClue,photoN:S.photoN,bi:S.bi,bphase:S.bphase,bopts:S.bopts,scores:S.scores,tl,
  w:S.wordle.filter(x=>x.rot===S.rot).map(x=>({slot:x.slot,name:x.name,solved:x.solved,n:x.rows.length,pts:x.pts})),
  p:S.photo.filter(x=>x.rot===S.rot).map(x=>({slot:x.slot,name:x.name})),ph:{solved:PH().solved,pts:PH().pts,wrong:PH().wrong},
  bw:S.bw.filter(x=>x.i===S.bi).map(x=>x.t),bv:S.bv.filter(x=>x.i===S.bi).map(x=>x.t),
  bq:{cat:q.cat,before:q.before,after:q.after,real:cl?q.real:null,fact:cl?q.fact:null},
  bfool:cl?S.bw.filter(x=>x.i===S.bi).map(x=>({t:x.t,text:x.text,v:S.bv.filter(y=>y.i===S.bi&&y.c===x.text).length})):null,
  bwin:cl?S.bv.filter(x=>x.i===S.bi&&x.ok).sort((a,c)=>a.at-c.at).map(x=>x.t):null}}
const hostX=()=>({tpins:PIN.t,spins:PIN.s,bwText:S.bw.filter(x=>x.i===S.bi)});
const lan=()=>process.env.PUBLIC_URL||('http://'+([].concat(...Object.values(os.networkInterfaces())).filter(i=>i.family==='IPv4'&&!i.internal).map(i=>i.address)[0]||'localhost')+':'+PORT);
const cfg=()=>({base:lan(),teams:C.teams,stations:C.stations,photo:{titles:C.photo.titles,ratio:C.photo.ratio},bluffN:C.bluff.length});

// ---------- http ----------
const cl=new Set();let bt=0;
const push=()=>{save();if(bt)return;bt=setTimeout(()=>{bt=0;const p=pub();cl.forEach(c=>c.res.write('data:'+JSON.stringify(c.host?Object.assign({},p,{host:hostX()}):p)+'\n\n'))},80)};
setInterval(()=>{if(S.timer.status==='running'&&Date.now()>=S.timer.endsAt){S.timer.status='stopped';S.timer.rem=0;S.timer.endsAt=0;S.stopSig++;push()}},500);
setInterval(()=>cl.forEach(c=>c.res.write(': ping\n\n')),20000);
const MT={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const PUB=path.join(__dirname,'public'),PAGES=['/','/tv','/host','/coord','/team','/wordle','/photo'];
http.createServer((q,r)=>{
 const u=new URL(q.url,'http://x'),p=u.pathname.replace(/(.)\/+$/,'$1');
 if(p==='/events'){const cid=u.searchParams.get('cid')||'',host=u.searchParams.get('pw')===HPW;r.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache',connection:'keep-alive'});const c={res:r,host,cid};cl.add(c);if(cid)online.set(cid,(online.get(cid)||0)+1);r.write('data:'+JSON.stringify(host?Object.assign({},pub(),{host:hostX()}):pub())+'\n\n');push();q.on('close',()=>{cl.delete(c);if(cid){const n=(online.get(cid)||1)-1;n?online.set(cid,n):online.delete(cid)}push()});return}
 if(p==='/config.json'){r.writeHead(200,{'content-type':MT['.json']});return r.end(JSON.stringify(cfg()))}
 if(q.method==='POST'&&p==='/api'){let d='';q.on('data',x=>{d+=x;if(d.length>1e5)q.destroy()});q.on('end',()=>{let o;try{o=act(JSON.parse(d||'{}'))}catch(e){o={err:e.message}}r.writeHead(200,{'content-type':MT['.json']});r.end(JSON.stringify(o));if(!o.err)push()});return}
 const f=PAGES.includes(p)?path.join(PUB,'app.html'):path.join(PUB,path.normalize(p));
 if(!f.startsWith(PUB)){r.writeHead(403);return r.end()}
 fs.readFile(f,(e,buf)=>{if(e){r.writeHead(404);return r.end('404')}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream','cache-control':'no-cache'});r.end(buf)});
}).listen(PORT,()=>{
 const ips=[].concat(...Object.values(os.networkInterfaces())).filter(i=>i.family==='IPv4'&&!i.internal).map(i=>i.address);
 console.log('\n  ԱՐԵՆԱ • 10 ԿԱՅԱՆ\n  Host password: '+HPW+'\n  Open on this computer: http://localhost:'+PORT);
 ips.forEach(ip=>console.log('  Phones (same Wi-Fi):  http://'+ip+':'+PORT));console.log('');
});
