(async()=>{
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const ls={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const J=k=>{try{return JSON.parse(ls.g(k))}catch(e){return null}};
const cid=ls.g('cid')||(()=>{const c=Math.random().toString(36).slice(2)+Date.now().toString(36);ls.s('cid',c);return c})();
const P=location.pathname.replace(/(.)\/+$/,'$1');
const CF=await(await fetch('/config.json')).json(),ST=CF.stations,TM=CF.teams;
const ORG=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?CF.base:location.origin;
const api=async o=>{const r=await fetch('/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({cid},o))});const j=await r.json();if(j.err)throw new Error(j.err);return j};
let S=null,prev=null,off=0,DK=null,BL=null,es=null,hw=ls.g('hpw')||'',cs=J('cs'),ts=J('ts'),me={},UI={d:{i:0,rev:0,n:0},sel:0,skip:[]};
const stOf=(k,r)=>((k+r-2)%10)+1,tmOf=(s,r)=>((s-r+100)%10)+1;
const sc=(sid,t)=>S.scores[sid+'_T'+t];
const tot=t=>Object.keys(S.scores).filter(k=>k.endsWith('_T'+t)).reduce((a,k)=>a+S.scores[k].points,0);
const rank=()=>[...Array(10)].map((_,i)=>({t:i+1,s:tot(i+1)})).sort((a,b)=>b.s-a.s||a.t-b.t);
const left=()=>{const t=S.timer;return t.status==='running'?Math.max(0,Math.ceil((t.endsAt-(Date.now()+off))/1000)):t.rem};
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='show';clearTimeout(toast.h);toast.h=setTimeout(()=>t.className='',2600)};
let ac;const beep=(f=660,d=.18)=>{try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.15;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}};
const wrap=(h,w)=>`<div class="wrap${w?' w':''}">${h}</div>`;
const head=t=>`<div class="top"><img class="lg" src="/assets/logo.jpg" alt=""><div><b>${t||'ԱՐԵՆԱ • 10 ԿԱՅԱՆ'}</b><div class="sm">Շրջան ${S.rot}/10</div></div><div class="chip" data-tm>${fmt(left())}</div></div>`;
const TL={idle:'Պատրաստ',running:'Կը խաղանք',paused:'⏸ Դադար',stopped:'⏰ Աւարտ'};

// ---------- connection ----------
function conn(){if(es)es.close();es=new EventSource('/events?cid='+cid+(P==='/host'&&hw?'&pw='+encodeURIComponent(hw):''));es.onmessage=e=>{S=JSON.parse(e.data);off=S.now-Date.now();hook();render()}}
function hook(){if(prev){const a=prev.timer.status,b=S.timer.status;if(a!=='running'&&b==='running')beep(880,.3);if(S.stopSig!==prev.stopSig){beep(300,.3);setTimeout(()=>beep(300,.4),450)}
 if(prev.rot!==S.rot){UI.d={i:0,rev:0,n:0};UI.dk='';UI.tab=''}if(prev.bi!==S.bi||prev.mode!==S.mode)UI.vote=null}
 prev=S;
 if(P==='/team'&&ts&&!UI.ra){UI.ra=1;api({a:'tauth',t:ts.t,pin:ts.pin}).catch(()=>{ts=null;ls.s('ts','');render()})}
 if(P==='/coord'&&cs&&!DK&&!UI.dl){UI.dl=1;api({a:'decks',s:cs.s,pin:cs.pin}).then(r=>{DK=r.decks;render()}).catch(()=>{cs=null;ls.s('cs','');render()})}
 if(P==='/host'&&hw&&!DK&&!UI.dl){UI.dl=1;api({a:'decks',pw:hw}).then(r=>{DK=r.decks;BL=r.bluff;render()}).catch(()=>{hw='';ls.s('hpw','');render()})}}

// ---------- shared game UIs ----------
function ensure(){const lead=P==='/team',k=ts?+ts.t.slice(1):0,s=lead&&ts?stOf(k,S.rot):0;
 if((P==='/wordle'||s===4)&&me.wr!==S.rot&&!UI.wj){UI.wj=1;api({a:'wjoin',leader:lead}).then(r=>{me.w=r;me.we=''}).catch(e=>{me.w=null;me.we=e.message}).finally(()=>{me.wr=S.rot;UI.wj=0;render()})}
 if((P==='/photo'||s===5)&&me.pr!==S.rot&&!UI.pj){UI.pj=1;api({a:'pjoin',leader:lead}).then(r=>{me.p=r;me.pe=''}).catch(e=>{me.p=null;me.pe=e.message}).finally(()=>{me.pr=S.rot;UI.pj=0;render()})}}
const bk=b=>b?`<button class="back" onclick="F.tab('info')">←</button>`:'';
function wordleUI(b){const m=me.w;const t=`<div class="card"><div class="row2">${bk(b)}<b class="gold">🟩 Հինգ Բանալի • Wordle</b></div>`;
 if(!m)return t+`<p>${me.we?esc(me.we)+'<button class="btn o" onclick="F.retry()">Կրկին փորձել</button>':'⏳ Կը միանանք…'}</p></div>`;
 const run=S.timer.status==='running',over=!m.solved&&m.rows.length>=6;
 return t+`<div class="sm">ԲԱՌ #${m.slot+1}/5 • ${esc(m.hint)}</div>${[...Array(6)].map((_,i)=>{const r=m.rows[i];return`<div class="tl">${[0,1,2,3,4].map(j=>`<i class="${r?r.c[j]:''}">${r?r.g[j]:''}</i>`).join('')}</div>`}).join('')}
 ${m.solved?`<div class="ans">🎉 Կեցցէ՛ս! +${m.pts} միաւոր</div>`:over?`<div class="ans bad">Փորձերը վերջացան՝ ${esc(m.word)}</div>`:run?`<input id="wg" maxlength="5" dir="ltr" autocapitalize="characters" autocomplete="off" placeholder="_ _ _ _ _"><button class="btn" onclick="F.wg()">Փորձել</button>`:`<p>⏳ Սպասէ՛ Վարիչի սկիզբին…</p>`}</div>`}
function photoUI(b){const m=me.p;const t=`<div class="card"><div class="row2">${bk(b)}<b class="gold">🖼️ Կտոր առ Կտոր</b></div>`;
 if(!m)return t+`<p>${me.pe?esc(me.pe)+'<button class="btn o" onclick="F.retry()">Կրկին փորձել</button>':'⏳ Կը միանանք…'}</p></div>`;
 const d=m.dims,c=m.slot%d.cols,r=Math.floor(m.slot/d.cols),run=S.timer.status==='running';
 return t+`<div class="sm">${esc(CF.photo.titles[m.idx])} • ԿՏՈՐ #${m.slot+1}/${m.n}</div><div class="pz" style="aspect-ratio:${m.ratio*d.rows/d.cols};background-image:url(/assets/pz${m.idx}.jpg);background-size:${d.cols*100}% ${d.rows*100}%;background-position:${d.cols>1?c/(d.cols-1)*100:0}% ${d.rows>1?r/(d.rows-1)*100:0}%"><b>${esc(m.char)}</b></div>
 <p class="sm">Շարեցէ՛ք նկարը միասին, ապա տառերը կարդացէ՛ք կարգով՝ ձախէն աջ, վերէն վար։</p>
 ${(m.solved||S.ph.solved)?`<div class="ans">✅ Կոդը ճիշդ է՝ ${S.ph.pts} միաւոր</div>`:run?`<input id="pc" maxlength="24" dir="ltr" autocapitalize="characters" autocomplete="off" placeholder="Ամբողջ կոդը"><button class="btn" onclick="F.pc()">Ստուգել ✓</button>`:`<p>⏳ Սպասէ՛ Վարիչի սկիզբին…</p>`}</div>`}

// ---------- pages ----------
const main=()=>wrap(`<div class="hero"><img src="/assets/logo.jpg" alt=""><h1>ԱՐԵՆԱ</h1><p>10 ԿԱՅԱՆ</p></div><a class="btn big" href="/tv">📺 Հեռուստացոյց (TV)</a><a class="btn big" href="/host">👑 Վարիչ</a><div class="row"><a class="btn o" href="/coord">🎯 Պատասխանատու</a><a class="btn o" href="/team">🚩 Խումբի ղեկավար</a></div>`);

function tv(){const r=S.rot,run=S.timer.status;
 const hd=`<div class="tvh"><img src="/assets/logo.jpg" alt=""><h1>ԱՐԵՆԱ • 10 ԿԱՅԱՆ</h1><div class="chip">Շրջան ${r}/10</div></div>`;
 if(S.mode==='stations'&&r===1&&run==='idle'&&!Object.keys(S.scores).length)
  return`<div class="tv">${hd}<div class="pre2"><div><div class="qr" data-q="${ORG}/team"></div></div><div><h2>🚩 Խումբի ղեկավարներ՝ սկանաւորեցէ՛ք</h2><div class="gold" style="font-size:clamp(16px,2vw,30px)">Մուտք գործեցէ՛ք ձեր խումբի PIN-ով</div><div class="t10">${TM.map((t,i)=>`<div class="${S.tl['T'+(i+1)].n?'lit':''}">${t.mascot}<br>${esc(t.name)}${S.tl['T'+(i+1)].n?' ✓':''}</div>`).join('')}</div></div></div></div>`;
 if(S.mode==='podium'){const R=rank(),w=R[0],l=R[9];setTimeout(confetti,50);
  const col=(x,h,m)=>`<div style="height:${h}vh"><div class="m">${m}</div>${TM[x.t-1].mascot}<div class="n">${esc(TM[x.t-1].name)}</div><div class="n">${x.s}</div></div>`;
  return`<div class="tv">${hd}<div class="big" style="text-align:center;font-size:clamp(28px,5vw,80px);color:var(--hi)">🏆 ՅԱՂԹՈՂ — ${TM[w.t-1].mascot} ${esc(TM[w.t-1].name)}!</div><div class="pod">${col(R[1],30,'🥈')}${col(R[0],42,'🥇')}${col(R[2],24,'🥉')}</div><div class="card" style="font-size:clamp(16px,2.2vw,34px)">🐢 Վերջին՝ ${TM[l.t-1].mascot} ${esc(TM[l.t-1].name)} — ${l.s} • Յաջորդ անգամ աւելի լաւ 😄</div></div>`}
 if(S.mode==='bluff'){const q=S.bq,cl=S.bphase==='closed';
  return`<div class="tv">${hd}<div class="card" style="font-size:clamp(20px,3vw,48px)"><div class="sm">${esc(q.cat)} • Պլաֆ ${S.bi+1}/10</div><div class="big" style="font-size:inherit">${esc(q.before)} <span class="gold">${cl?esc(q.real):'_____'}</span> ${esc(q.after)}</div>
  <div class="gold">${S.bphase==='write'?`✍️ Խաբուսիկ պատասխան գրած՝ ${S.bw.length}/10`:S.bphase==='vote'?`🗳️ Քուէարկած՝ ${S.bv.length}/10`:'✅ Արդիւնք'}</div></div>
  ${S.bphase==='vote'?`<div class="grid two">${S.bopts.map(o=>`<div class="opt" style="font-size:clamp(18px,2.4vw,40px)">${esc(o)}</div>`).join('')}</div>`:''}
  ${cl?`<div class="card" style="font-size:clamp(16px,2vw,32px)">${esc(q.fact)}<br><br>⚡ Ամենաարագ ճիշդերը՝ ${S.bwin.slice(0,3).map((t,i)=>['🥇','🥈','🥉'][i]+' '+TM[+t.slice(1)-1].mascot).join('  ')||'—'}<br>🎭 ${S.bfool.map(f=>`${TM[+f.t.slice(1)-1].mascot} «${esc(f.text)}» → ${f.v}`).join(' • ')}</div>`:''}</div>`}
 const R=rank(),mx=Math.max(1,R[0].s),any=R[0].s>0,rem=left();
 return`<div class="tv">${hd}<div class="tvm"><div class="card"><div class="gold" style="font-size:clamp(18px,2.4vw,36px)">${TL[run]}</div><div class="bigtm${run==='running'&&rem<=60?' red':''}" data-tm>${fmt(rem)}</div><div class="sm" style="font-size:clamp(14px,1.6vw,24px)">Շրջան ${r}/10 • ${S.showClue&&run==='idle'?'🧩 Խումբերը կը փնտռեն յաջորդ կայանը…':'Բոլոր խումբերը իրենց կայաններուն մէջ են'}</div></div>
 <div class="lb">${R.map((x,i)=>`<div class="lr ${any&&i===0?'win':''} ${any&&i===9?'last':''}"><div class="bar" style="width:${x.s/mx*100}%"></div><span>${i===0&&any?'👑':i+1}</span><span>${TM[x.t-1].mascot}</span><span class="nm">${esc(TM[x.t-1].name)}</span><span class="sm">${ST[stOf(x.t,r)-1].icon}</span><span class="pt">${x.s}</span>${any&&i===9?'<span>🐢</span>':''}</div>`).join('')}</div></div></div>`}

function confetti(){const c=$('#cf');if(UI.cf||!c)return;UI.cf=1;const x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const p=[...Array(180)].map(()=>({x:Math.random()*c.width,y:-Math.random()*c.height,v:2+Math.random()*4,s:6+Math.random()*8,h:Math.random()*360}));(function f(){x.clearRect(0,0,c.width,c.height);p.forEach(q=>{q.y+=q.v;q.x+=Math.sin(q.y/30);if(q.y>c.height)q.y=-10;x.fillStyle='hsl('+q.h+',90%,60%)';x.fillRect(q.x,q.y,q.s,q.s*.6)});requestAnimationFrame(f)})()}

function host(){
 if(!hw||!S.host)return wrap(`<div class="top"><img class="lg" src="/assets/logo.jpg" alt=""><b>👑 Վարիչ</b></div><div class="card"><div class="big">Գաղտնաբառ</div><input id="hp" type="password" autocomplete="off"><button class="btn" onclick="F.hl()">Մուտք</button></div>`);
 const H=S.host,run=S.timer.status,bl=S.mode==='bluff';
 const ctl=`<div class="card"><div class="sm">${S.mode==='bluff'?'🎭 ՊԼԱՖ':S.mode==='podium'?'🏆 ՊՈՏԻՈՒՄ':'ԿԱՅԱՆՆԵՐ'} • Շրջան ${S.rot}/10 • ${TL[run]}</div><div class="bigtm" style="font-size:64px" data-tm>${fmt(left())}</div>
 <div class="row"><button class="btn g" onclick="F.h('hstart')">▶ ${run==='paused'?'Շարունակել':'Սկսիլ'}</button><button class="btn o" onclick="F.h('hpause')">⏸ Դադար</button><button class="btn r" onclick="F.h('hstop')">⏹ Կանգնեցնել</button></div>
 <div class="row"><button class="btn" onclick="F.cf('hnext','Յաջորդ շրջանին անցնե՞նք (յաջորդ կայանի ակնարկը կը ցուցուի)։')">⏭ Յաջորդ շրջան (+ակնարկ)</button><button class="btn o" onclick="F.rot()">Շրջան #…</button></div>
 <div class="row"><button class="btn o" onclick="F.cf('hbluff','Սկսի՞նք Պլաֆը — բոլոր հեռաձայնները Պլաֆի էջին կ՚անցնին։',{i:0})">🎭 Սկսիլ Պլաֆը</button><button class="btn o" onclick="F.cf('hpodium','Ցուցադրե՞նք յաղթողը։')">🏆 Պոտիում</button>${S.mode!=='stations'?`<button class="btn o" onclick="F.h('hstations')">↩ Կայաններ</button>`:''}</div></div>`;
 const bp=bl?`<div class="card l"><b class="gold">🎭 Պլաֆ ${S.bi+1}/10 • ${S.bphase}</b><p>${esc(S.bq.before)} <b>___</b> ${esc(S.bq.after)}<br>✅ Իրականը՝ <b>${esc((BL&&BL[S.bi%BL.length].real)||'')}</b></p><div class="sm">Գրած՝ ${S.bw.length}/10 • Քուէարկած՝ ${S.bv.length}/10</div><p class="sm">${H.bwText.map(x=>x.t+'՝ '+esc(x.text)).join(' • ')}</p>
 <div class="row">${S.bphase==='write'?`<button class="btn g" onclick="F.h('hbvote')">🗳️ Բանալ քուէարկութիւնը</button>`:''}${S.bphase==='vote'?`<button class="btn" onclick="F.h('hbclose')">🔒 Փակել եւ միաւորել</button>`:''}<button class="btn o" onclick="F.h('hbluff',{i:${(S.bi+1)%10}})">➡ Յաջորդ հարց</button></div></div>`:'';
 const atS=k=>ST[stOf(k,S.rot)-1];
 const teams=`<div class="card"><b class="gold">🚩 Խումբեր • PIN-եր • մուտքեր</b><div style="overflow-x:auto"><table><tr><th>Խումբ</th><th>Կայան հիմա</th><th>PIN</th><th>Մուտք (առցանց/ընդ.)</th><th>Wordle/Նկար</th><th>Միաւոր</th></tr>${TM.map((t,i)=>{const k=i+1,s=stOf(k,S.rot),l=S.tl['T'+k];return`<tr><td>${t.mascot} ${esc(t.name)}</td><td>${ST[s-1].icon} ${s}</td><td><b>${H.tpins['T'+k]}</b> <button class="btn s o" onclick="F.rg('t','T${k}')">↻</button></td><td>${l.on}/${l.n}</td><td>${s===4?S.w.length+'/5':s===5?S.p.length+'/'+S.photoN:'—'}</td><td><b>${tot(k)}</b></td></tr>`}).join('')}</table></div></div>`;
 const sts=`<div class="card"><b class="gold">🎯 Կայաններու PIN-եր</b><div style="overflow-x:auto"><table><tr><th>Կայան</th><th>PIN</th><th>Խումբ հիմա</th><th>Այս շրջանի միաւոր</th></tr>${ST.map(s=>{const t=tmOf(s.id,S.rot),r=sc('S'+s.id,t);return`<tr><td>${s.icon} ${s.id}. ${esc(s.name)}</td><td><b>${H.spins[s.id]}</b> <button class="btn s o" onclick="F.rg('s',${s.id})">↻</button></td><td>${TM[t-1].mascot} ${esc(TM[t-1].name)}</td><td>${r?r.points:'—'}</td></tr>`}).join('')}</table></div></div>`;
 const grid=`<div class="card"><b class="gold">📊 Միաւորներ (սեղմէ՛ փոխելու համար)</b><div style="overflow-x:auto"><table><tr><th></th>${ST.map(s=>`<th>${s.icon}</th>`).join('')}<th>🎭</th><th>Σ</th></tr>${TM.map((t,i)=>{const k=i+1;return`<tr><td>${t.mascot}</td>${ST.map(s=>`<td class="sc" onclick="F.ed('S${s.id}','T${k}')">${sc('S'+s.id,k)?sc('S'+s.id,k).points:'·'}</td>`).join('')}<td>${[...Array(10)].reduce((a,_,j)=>a+(sc('B'+(j+1),k)?sc('B'+(j+1),k).points:0),0)}</td><td><b>${tot(k)}</b></td></tr>`}).join('')}</table></div></div>`;
 const sol=`<div class="card l"><b class="gold">📖 Հարցեր եւ պատասխաններ</b>${DK?ST.map(s=>`<details><summary>${s.icon} ${s.id}. ${esc(s.name)}</summary><p class="sm">${esc(s.rules)}</p>${(DK[s.id]||[]).map(x=>`<p>• ${esc(x.t)}${x.x?'\n   '+esc(x.x):''}${(x.o||[]).length?'\n   '+x.o.map(esc).join(' | '):''}${x.a?'\n   ✅ '+esc(x.a):''}</p>`).join('')}</details>`).join('')+`<details><summary>🎭 Եզրափակիչ Պլաֆ (10 հարց)</summary>${(BL||[]).map((b,i)=>`<p>${i+1}. ${esc(b.before)} ___ ${esc(b.after)}\n   ✅ ${esc(b.real)} — ${esc(b.fact)}</p>`).join('')}</details>`:'…'}</div>`;
 const links=`<div class="card l"><b class="gold">🔗 Յղումներ</b><p class="sm" style="word-break:break-all">📺 ${ORG}/tv<br>🚩 ${ORG}/team<br>🎯 ${ORG}/coord<br>🟩 ${ORG}/wordle • 🖼️ ${ORG}/photo</p><button class="btn r" onclick="F.cf('hreset','ՄԱՔՐԵ՞Ն ամբողջ խաղը (միաւորներ, շրջաններ)։ PIN-երը կը մնան։')">🗑 Մաքրել ամէն ինչ</button></div>`;
 return wrap(`<div class="top"><img class="lg" src="/assets/logo.jpg" alt=""><div><b>👑 Վարիչ</b></div><button class="back" onclick="F.hx()">⎋</button></div>${ctl}${bp}${teams}${sts}${grid}${sol}${links}`,1)}

function coord(){
 if(!cs)return wrap(`<div class="top"><img class="lg" src="/assets/logo.jpg" alt=""><b>🎯 Պատասխանատու</b></div><div class="card"><div class="big">Ընտրէ՛ կայանդ</div><div class="grid">${ST.map(s=>`<button class="tile ${UI.sel===s.id?'on':''}" onclick="F.cs(${s.id})">${s.icon}<br>${s.id}</button>`).join('')}</div><input id="cp" inputmode="numeric" maxlength="4" placeholder="PIN"><button class="btn" onclick="F.cl()">Մուտք</button></div>`);
 const sid=cs.s,sx=ST[sid-1],t=tmOf(sid,S.rot),T=TM[t-1],saved=sc('S'+sid,t);
 const dk=`cd_${sid}_${S.rot}`;if(UI.dk!==dk){UI.dk=dk;UI.d=J(dk)||{i:0,rev:0,n:0}}
 const cn=sx.cn,calc=n=>cn.table?cn.table[Math.min(n,cn.table.length-1)]:Math.min(100,Math.round(n*cn.mult));
 let body='';
 if(sid===4)body=`<div class="card"><div class="sm">📱 Խումբէն 5 հոգի թող սկանաւորեն</div><div class="qr" data-q="${ORG}/wordle"></div><div class="grid" style="grid-template-columns:repeat(5,1fr)">${[...Array(5)].map((_,i)=>{const p=S.w.find(x=>x.slot===i);return`<div class="tile" style="${p&&p.solved?'border-color:#34d399':''}"><div class="sm">#${i+1} ${DK?esc(DK[4][i].a.split(' — ')[0]):''}</div>${p?esc(p.name)+'<br>'+(p.solved?'✅ '+p.pts:'⏳ '+p.n):'—'}</div>`}).join('')}</div><div class="sm">Լուծուած՝ ${S.w.filter(x=>x.solved).length}/5 • միաւորը ինքնաբերաբար կը հաշուուի (ճիշդ + արագութիւն)</div></div>`;
 else if(sid===5){const idx=(S.rot-1)%5,code=DK?(DK[5][idx].a+DK[5][idx].a).slice(0,S.photoN):'';body=`<div class="card"><div class="sm">📱 Բոլոր անդամները թող սկանաւորեն • Միացած՝ ${S.p.length}/${S.photoN}</div><div class="qr" data-q="${ORG}/photo"></div><div class="row"><input id="pn" type="number" min="2" max="24" value="${S.photoN}"><button class="btn s" onclick="F.pn()">✅ Սահմանել թիւը</button></div><img class="q" src="/assets/pz${idx}.jpg" alt=""><div class="ans">🔑 ${esc(code)}</div><div class="sm">${S.ph.solved?'✅ Լուծուեցաւ՝ '+S.ph.pts+' միաւոր':'Սխալ փորձեր՝ '+S.ph.wrong}</div></div>`}
 else if(DK){const D=DK[sid]||[],it=D[UI.d.i%D.length];body=`<div class="card"><div class="sm">${UI.d.i%D.length+1}/${D.length}</div>${it.im?`<img class="q" src="${it.im}" alt="">`:''}<div class="big pre">${esc(it.t)}</div>${it.x?`<div class="pre sm" style="opacity:1">${esc(it.x)}</div>`:''}${(it.o||[]).map(o=>`<div class="opt">${esc(o)}</div>`).join('')}${it.a?(UI.d.rev?`<div class="ans">✅ ${esc(it.a)}</div>`:`<button class="btn o" onclick="F.rev()">👁️ Ցոյց տալ պատասխանը</button>`):''}<div class="row"><button class="btn o" onclick="F.nav(-1)">◀</button><button class="btn o" onclick="F.nav(1)">▶</button></div></div>
 <div class="card"><div class="sm">${esc(cn.label)}</div><div class="big"><button class="back" onclick="F.n(-1)">−</button> ${UI.d.n}/${cn.max} <button class="back" onclick="F.n(1)">+</button></div><div class="sm">= ${calc(UI.d.n)} միաւոր</div></div>`}
 const auto=(sid===4||sid===5)?'':calc(UI.d.n);
 return wrap(`<div class="top"><img class="lg" src="/assets/logo.jpg" alt=""><div><b>${sx.icon} ${esc(sx.name)}</b><div class="sm">Կայան ${sid} • Շրջան ${S.rot}/10</div></div><div class="chip" data-tm>${fmt(left())}</div><button class="back" onclick="F.co()">⎋</button></div>
 <div class="card" style="border-color:${T.color}"><div class="sm">Հիմա ձեր կայանին քով՝</div><div class="big">${T.mascot} ${esc(T.name)}</div><div class="sm">${TL[S.timer.status]}</div></div>${body}
 <div class="card"><div class="sm">💾 Միաւոր ${esc(T.name)}-ին համար ${saved?'(✅ պահուած՝ '+saved.points+')':''}</div><input id="sc" type="number" min="0" max="100" value="${saved?saved.points:auto}"><button class="btn" onclick="F.sv()">💾 Պահել</button></div>`)}

function team(){
 if(!ts)return wrap(`<div class="hero"><img src="/assets/logo.jpg" alt=""><h1>ԱՐԵՆԱ</h1><p>ԽՈՒՄԲԻ ՂԵԿԱՎԱՐ</p></div><div class="card"><div class="grid two">${TM.map((t,i)=>`<button class="tile ${UI.sel===i+1?'on':''}" onclick="F.ts(${i+1})">${t.mascot} ${esc(t.name)}</button>`).join('')}</div><input id="tp" inputmode="numeric" maxlength="4" placeholder="PIN"><button class="btn" onclick="F.tl()">Մուտք</button></div>`);
 const k=+ts.t.slice(1),T=TM[k-1],st=stOf(k,S.rot),sx=ST[st-1],run=S.timer.status,total=tot(k);
 const top=`<div class="top" style="border-color:${T.color}"><span style="font-size:32px">${T.mascot}</span><div><b>${esc(T.name)}</b><div class="sm">Շրջան ${S.rot}/10 • ${total} միաւոր</div></div><div class="chip" data-tm>${fmt(left())}</div></div>`;
 if(S.mode==='bluff')return wrap(top+bluff(k));
 if(S.mode==='podium'){const R=rank(),p=R.findIndex(x=>x.t===k)+1;return wrap(top+`<div class="card glow"><div class="big">${p===1?'🏆 Յաղթեցի՛ք!':'Ձեր տեղը՝ '+p+'/10'}</div><div class="big gold">${total} միաւոր</div></div>`)}
 if((run==='running'||run==='paused')&&(st===4||st===5)&&UI.tab!=='info')return wrap(top+(st===4?wordleUI(1):photoUI(1)));
 let b;
 if(run==='running'||run==='paused')b=`<div class="card glow"><div class="big">${sx.icon} ${esc(sx.name)}</div><p>${esc(sx.rules)}</p>${(st===4||st===5)?`<button class="btn" onclick="F.tab('')">→ Խաղը</button>`:''}</div>`;
 else if(run==='stopped'){const r=sc('S'+st,k);b=`<div class="card"><div class="big">⏰ Ժամանակը աւարտեցաւ</div><p>${r?'Այս կայանին միաւորը՝ <b class="gold">'+r.points+'</b>':'Միաւորը կը գրանցուի…'}</p><p class="sm">Սպասեցէ՛ք Վարիչին՝ յաջորդ կայանի ակնարկին համար։</p></div>`}
 else b=S.showClue?`<div class="card glow"><div class="sm">🧩 Գտէ՛ք ձեր կայանը՝ ակնարկ</div><div class="big" style="font-size:22px">«${esc(sx.clue)}»</div><p class="sm">Երբ գտաք՝ գացէ՛ք պատասխանատուին քով եւ սպասեցէ՛ք Վարիչի սկիզբին։</p></div>`:`<div class="card"><p>⏳ Սպասեցէ՛ք Վարիչին…</p></div>`;
 return wrap(top+b+`<button class="btn o" onclick="F.lo()">⎋ Ելք</button>`)}

function bluff(k){const q=S.bq,t='T'+k,wrote=S.bw.includes(t),voted=S.bv.includes(t)||(UI.vote&&UI.vote.i===S.bi);
 const h=`<div class="card"><div class="sm">${esc(q.cat)} • 🎭 Պլաֆ ${S.bi+1}/10</div><div class="big" style="font-size:22px">${esc(q.before)} <span class="gold">${S.bphase==='closed'?esc(q.real):'_____'}</span> ${esc(q.after)}</div></div>`;
 if(S.bphase==='write')return h+(wrote?`<div class="card"><div class="ans">✅ Խաբուսիկ պատասխանդ ուղարկուեցաւ</div><div class="sm">Կրնաս փոխել՝ նորէն ուղարկելով • ${S.bw.length}/10</div><input id="bt" maxlength="60" placeholder="Նոր պատասխան"><button class="btn o" onclick="F.bw()">Փոխել</button></div>`:`<div class="card"><p>✍️ Գրէ՛ խաբուսիկ պատասխան մը՝ որ համոզիչ ըլլայ։</p><input id="bt" maxlength="60"><button class="btn" onclick="F.bw()">Ուղարկել</button></div>`);
 if(S.bphase==='vote')return h+`<div class="card">${voted?`<div class="ans">✅ Քուէդ գրանցուեցաւ</div>`:'<p>🗳️ Ո՞րն է ճիշդը։ Որքան արագ՝ այնքան շատ միաւոր։</p>'}${S.bopts.map(o=>`<button class="opt ${UI.vote&&UI.vote.c===o?'me':''}" ${voted?'disabled':''} onclick='F.bv(${JSON.stringify(o).replace(/'/g,'&#39;')})'>${esc(o)}</button>`).join('')}</div>`;
 const r=S.bwin.indexOf(t),f=S.bfool.find(x=>x.t===t);
 return h+`<div class="card ${r>=0?'glow':''}"><div class="ans">✅ ${esc(q.real)}</div><p class="sm">${esc(q.fact)}</p><div class="big">${r>=0?'+'+Math.round(100*(10-r)/10)+' միաւոր 🎉':'Այս անգամ՝ 0'}</div>${f?`<div class="sm">Ձեր խաբուսիկին քուէարկողներ՝ ${f.v}</div>`:''}</div>`}

// ---------- handlers ----------
const F=window.F={
 tab:x=>{UI.tab=x;render()},retry:()=>{me.wr=0;me.pr=0;render()},
 wg:async()=>{try{me.w=await api({a:'wguess',g:$('#wg').value});if(me.w.solved)beep(990,.3)}catch(e){toast(e.message)}UI.skip=['wg'];render()},
 pc:async()=>{try{me.p=await api({a:'pcode',code:$('#pc').value});beep(990,.3)}catch(e){toast(e.message);beep(250,.3)}UI.skip=['pc'];render()},
 ts:i=>{UI.sel=i;render()},
 tl:async()=>{if(!UI.sel)return toast('Ընտրէ՛ խումբդ');const pin=$('#tp').value.trim();try{await api({a:'tauth',t:'T'+UI.sel,pin});ts={t:'T'+UI.sel,pin};ls.s('ts',JSON.stringify(ts));render()}catch(e){toast(e.message)}},
 lo:()=>{ts=null;ls.s('ts','');UI.ra=0;render()},
 bw:async()=>{try{await api({a:'bwrite',t:ts.t,pin:ts.pin,text:$('#bt').value});toast('✅')}catch(e){toast(e.message)}},
 bv:async c=>{try{await api({a:'bvote',t:ts.t,pin:ts.pin,choice:c});UI.vote={i:S.bi,c};render()}catch(e){toast(e.message)}},
 cs:i=>{UI.sel=i;render()},
 cl:async()=>{if(!UI.sel)return toast('Ընտրէ՛ կայանդ');const pin=$('#cp').value.trim();try{await api({a:'cauth',s:UI.sel,pin});cs={s:UI.sel,pin};ls.s('cs',JSON.stringify(cs));UI.dl=0;hook();render()}catch(e){toast(e.message)}},
 co:()=>{cs=null;DK=null;UI.dl=0;ls.s('cs','');render()},
 rev:()=>{UI.d.rev=1;sd();render()},nav:d=>{const n=(DK[cs.s]||[]).length;UI.d.i=(UI.d.i+d+n)%n;UI.d.rev=0;sd();render()},
 n:d=>{const m=ST[cs.s-1].cn.max;UI.d.n=Math.max(0,Math.min(m,UI.d.n+d));UI.skip=['sc'];sd();render()},
 sv:async()=>{try{await api({a:'cscore',s:cs.s,pin:cs.pin,pts:$('#sc').value});toast('✅ Պահուեցաւ');beep(880,.15)}catch(e){toast(e.message)}},
 pn:async()=>{try{await api({a:'cphotoN',pin:cs.pin,n:$('#pn').value});toast('✅')}catch(e){toast(e.message)}},
 hl:async()=>{const p=$('#hp').value;try{await api({a:'hauth',pw:p});hw=p;ls.s('hpw',p);UI.dl=0;DK=null;conn()}catch(e){toast(e.message)}},
 hx:()=>{hw='';ls.s('hpw','');DK=null;UI.dl=0;conn()},
 h:async(a,x)=>{try{await api(Object.assign({a,pw:hw},x||{}))}catch(e){toast(e.message)}},
 cf:(a,m,x)=>{if(confirm(m))F.h(a,x)},
 rot:()=>{const n=prompt('Շրջան (1–10)',S.rot);if(n)F.h('hrot',{n})},
 rg:(kind,id)=>{if(confirm('Նոր PIN՞'))F.h('hregen',{kind,id})},
 ed:(sid,t)=>{const c=sc(sid,t.slice(1)),v=prompt(sid+' • '+t+' — միաւոր (0–500)',c?c.points:'');if(v!==null&&v!=='')F.h('hscore',{sid,t,pts:v})}
};
const sd=()=>ls.s(UI.dk,JSON.stringify(UI.d));

// ---------- render ----------
function view(){if(P==='/')return main();if(!S)return wrap('<div class="card">⏳ Կը միանանք…</div>');
 return P==='/tv'?tv():P==='/host'?host():P==='/coord'?coord():P==='/team'?team():P==='/wordle'?wrap(head()+wordleUI(0)):P==='/photo'?wrap(head()+photoUI(0)):main()}
function render(){const a=document.activeElement,id=a&&a.id,pos=a&&a.selectionStart,keep={};
 document.querySelectorAll('#app input').forEach(e=>{if(e.id)keep[e.id]=e.value});UI.skip.forEach(i=>delete keep[i]);UI.skip=[];
 $('#app').innerHTML=view();
 for(const k in keep){const e=document.getElementById(k);if(e)e.value=keep[k]}
 if(id){const e=document.getElementById(id);if(e){e.focus();try{e.setSelectionRange(pos,pos)}catch(x){}}}
 document.querySelectorAll('[data-q]').forEach(e=>{const q=qrcode(0,'M');q.addData(e.dataset.q);q.make();e.innerHTML=q.createSvgTag({cellSize:6,margin:0,scalable:true})});
 if(S&&P!=='/')ensure()}
setInterval(()=>{if(!S)return;const l=left(),run=S.timer.status==='running';document.querySelectorAll('[data-tm]').forEach(e=>{e.textContent=fmt(l);e.classList.toggle('red',run&&l<=60)})},250);
render();if(P!=='/')conn();
})();
