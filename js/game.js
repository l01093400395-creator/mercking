/* ==========================================================
   용병왕의 길 — 게임 로직 (game.js)
   상태·저장 / 능력치 / 경제 / 용병 / 아이템 / 로그라이크 던전 / 전투 엔진 / 퀘스트
   화면 그리기는 ui.js 가 맡는다.
   ========================================================== */
window.G=(function(){
'use strict';
const D=window.GD;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wpick=(arr,w)=>{let s=w.reduce((a,b)=>a+b,0),r=Math.random()*s;for(let i=0;i<arr.length;i++){r-=w[i];if(r<=0)return arr[i];}return arr[arr.length-1];};
const fmt=n=>{n=Math.round(n);return n.toLocaleString('ko-KR');};
const rankIdx=r=>D.RANKS.indexOf(r);
let uid=1;const nid=p=>p+(Date.now()%100000)+'_'+(uid++);

/* ---------------- 상태 ---------------- */
let S=null;
const SAVE_KEY=n=>'mercking-slot'+n;
function newGame(name,cls){
  S={ver:1,slot:G.slot,name:name||'단장',day:1,gold:600,fame:0,rank:'F',main:0,mainShown:-1,flags:{},
    leader:{name:name||'단장',cls,lv:1,exp:0,STR:6,AGI:6,INT:6,CHA:6,pts:0,eq:{wpn:null,arm:null,acc1:null,acc2:null},sex:'m',look:{hair:'shorthair',hc:1}},
    mercs:[],party:[],inv:[],cons:{potion:2,hipotion:0,feather:0},
    camp:{tier:1,built:{},decor:[]},
    towns:{t1:{rep:0},t2:{rep:0},t3:{rep:0},t4:{rep:0}},
    dailies:[],subs:{},stats:{kills:{},elites:{},clears:{},chests:0,trophy:{},runs:0,wins:0},
    recruits:{},run:null,loc:'camp',arena:0,advanced:false,log:[],ending:false,playSec:0};
  S.leader[D.LCLASS[cls].main]+=4;
  // 시작 장비
  const w=genItem(1,0,'wpn',D.LCLASS[cls].wpn[0]);w.name='낡은 '+D.WPN[w.cls].n;S.inv.push(w);equip(S.leader,w.id);
  // 시작 동료: 낙천적인 견습생
  const m=genMerc(2,{grade:0,pot:1,pers:'cheer',job:cls==='sword'?'archer':'warrior',name:'로안'});
  m.free=true;S.mercs.push(m);S.party.push(m.id);
  genDailies();
  return S;
}
function save(){if(!S)return;try{S.savedAt=Date.now();localStorage.setItem(SAVE_KEY(G.slot),JSON.stringify(S));localStorage.setItem('mercking-cur',String(G.slot));}catch(e){console.warn(e);}}
function load(n){try{const t=localStorage.getItem(SAVE_KEY(n));if(!t)return null;S=JSON.parse(t);G.slot=n;fixSave();return S;}catch(e){console.warn(e);return null;}}
function peek(n){try{const t=localStorage.getItem(SAVE_KEY(n));return t?JSON.parse(t):null;}catch(e){return null;}}
function wipeSlot(n){try{localStorage.removeItem(SAVE_KEY(n));}catch(e){}}
function fixSave(){S.cons=S.cons||{};S.stats=S.stats||{kills:{},elites:{},clears:{},chests:0,trophy:{}};S.log=S.log||[];
  for(const k of ['kills','elites','clears','trophy'])S.stats[k]=S.stats[k]||{};}

/* ---------------- 능력치 ---------------- */
const SLOTS=['wpn','arm','acc1','acc2'];
function itemById(id){return S.inv.find(i=>i.id===id);}
function gearStats(u){const st={hp:0,atk:0,mag:0,def:0,spd:0,crit:0,eva:0};
  for(const s of SLOTS){const it=u.eq[s]&&itemById(u.eq[s]);if(!it)continue;const m=1+.08*(it.enh||0);
    for(const k in it.st)st[k]=(st[k]||0)+it.st[k]*(k==='spd'||k==='crit'||k==='eva'?1:m);}
  return st;}
function leaderStats(L){L=L||S.leader;const c=D.LCLASS[L.cls],lv=L.lv;
  let s={hp:90+14*lv+L.STR*7,atk:6+L.STR*2.2+lv*1.2,mag:6+L.INT*2.3+lv*1.2,def:6+lv*1.3+L.STR*.4,spd:28+L.AGI*.7,crit:5+L.AGI*.4,eva:3+L.AGI*.3,cdr:Math.min(.4,L.INT*.006)};
  if(c.base){s.hp*=1.1;s.atk*=1.08;s.mag*=1.08;}
  const g=gearStats(L);for(const k in g)s[k]+=g[k];
  if(c.passive==='bulwark')s.def*=1.25;
  if(c.passive==='shadow'){s.crit+=15;s.eva+=8;}
  if(c.passive==='element')s.mag*=1.2;
  if(S.camp.built.hall)for(const k of ['hp','atk','mag','def'])s[k]*=1.1;
  return roundStats(s);}
function mercStats(m){const j=D.JOBS[m.job],gr=D.GRADES[m.grade],po=D.POTENTIAL[m.pot],lv=m.lv;
  let s={};for(const k of ['hp','atk','mag','def','spd'])s[k]=(j.b[k]+(j.g[k]||0)*(lv-1)*po.m)*gr.m;
  s.crit=j.b.crit+lv*.08;s.eva=j.b.eva+lv*.05;s.cdr=0;
  if(m.seq)s.spd*=.85;
  if(m.dis)for(const k of ['hp','atk','mag','def','spd'])s[k]*=.75;
  const g=gearStats(m);for(const k in g)s[k]+=g[k];
  if(S.camp.built.hall)for(const k of ['hp','atk','mag','def'])s[k]*=1.1;
  if(D.LCLASS[S.leader.cls].passive==='tactics')s.atk*=1.1,s.mag*=1.1;
  return roundStats(s);}
function roundStats(s){for(const k of ['hp','atk','mag','def'])s[k]=Math.round(s[k]);s.spd=Math.round(s.spd*10)/10;s.crit=Math.round(s.crit*10)/10;s.eva=Math.min(40,Math.round(s.eva*10)/10);return s;}
function statsOf(u){return u===S.leader?leaderStats():mercStats(u);}
function power(u){const s=statsOf(u);return Math.round(s.hp*.25+s.atk*2+s.mag*2+s.def*2+s.spd*2);}
const expNeed=lv=>Math.round(30*Math.pow(lv,1.5));
function gainExp(u,x){if(u.lv>=50)return 0;u.exp+=Math.round(x);let ups=0;
  while(u.lv<50&&u.exp>=expNeed(u.lv)){u.exp-=expNeed(u.lv);u.lv++;ups++;if(u===S.leader)u.pts+=3;}
  return ups;}

/* ---------------- 경제 ---------------- */
function chaDisc(){return Math.min(.35,S.leader.CHA*.008);}       // 급여·고용 할인
function shopDisc(){return Math.min(.3,S.leader.CHA*.006);}
function wage(m){let w=D.wageOf(m.lv,m.grade);if(m.wageCut)w*=.6;if(m.free)w*=.6;return Math.max(10,Math.round(w*(1-chaDisc())/5)*5);}
function upkeep(){let t=0;for(const m of S.mercs){t+=S.party.includes(m.id)||m.instructor?wage(m):Math.round(wage(m)*.5);}return t;}
function hireCost(m){return Math.round(D.wageOf(m.lv,m.grade)*4*(1-chaDisc())/10)*10;}
function healCost(m){let c=D.wageOf(m.lv,m.grade)*2.2;if(S.camp.built.clinic)c*=.5;return Math.round(c/10)*10;}
function attitude(tk){const t=D.TOWNS[tk];if(!t)return 2;const r=rankIdx(S.rank);if(r>=5)return 3;
  if(tk==='t1')return r>=1?2:1;const g=rankIdx(t.goodRank);if(r>=g)return 2;if(r>=g-1&&(S.towns[tk].rep||0)>=40)return 1;return 0;}
function priceMul(tk){const a=attitude(tk);let m=[1.15,1,.92,.82][a];if(a===0)m-=Math.min(.12,S.leader.CHA*.004);return m*(1-shopDisc());}
function addGold(n){S.gold=Math.max(0,Math.round(S.gold+n));}
function addFame(n){n=Math.round(n*(1+S.leader.CHA*.01));S.fame+=n;return n;}
function maxRoster(){return 4+(S.camp.built.bunk?2:0)+(S.camp.built.tavern?2:0);}
function curTier(){let t=1;for(const k of ['t2','t3','t4'])if(townOpen(k))t=D.TOWNS[k].tier;return t;}
function townOpen(tk){if(tk==='camp'||tk==='t1')return true;const t=D.TOWNS[tk];return rankIdx(S.rank)>=rankIdx(t.req);}
function decorPts(){let p=0;for(const d of S.camp.decor)p+=D.DECOR[d].pt;for(const b in S.camp.built)p+=D.BUILDS[b].decor||0;return p;}
function campTax(){return S.camp.tier>=4?15000:S.camp.tier>=3?3000:0;}

/* ---------------- 용병 ---------------- */
function genMerc(lv,o){o=o||{};const sex=o.sex||(Math.random()<.4?'f':'m');
  const job=o.job||pick(D.JOB_KEYS);
  const m={id:nid('m'),name:o.name||(pick(sex==='f'?D.NAMES_F:D.NAMES_M)+pick(D.SURN)),sex,job,
    grade:o.grade??0,pot:o.pot??0,pers:o.pers||pick(D.PERS_KEYS),lv,exp:0,
    look:{o:D.JOBS[job].outfit,hair:o.hair||pick(D.HAIRS),hc:o.hc??ri(0,6),sk:o.sk??pick([0,0,0,1,1,2,3,4])},
    eq:{wpn:null,arm:null,acc1:null,acc2:null},falls:0,status:'ok',injDays:0,seq:false,dis:false};
  if(sex==='f'&&!o.hair)m.look.hair=pick(['longhair','curlyhair','bowlhair','mophair']);
  return m;}
function recruitList(tk){const key=tk;let r=S.recruits[key];
  if(!r||r.day!==S.day){const t=tk==='camp'?Math.max(2,curTier()):D.TOWNS[tk].tier,lr=D.TIER[t].lv;
    const avg=Math.round(avgLv());const n=3+(tk==='camp'&&S.camp.built.tavern?1:0);
    const gw=[[70,25,5,0],[55,30,13,2],[42,34,19,5],[30,35,25,10]][t-1].slice();
    if(tk==='camp'&&S.camp.built.tavern){gw[0]-=15;gw[2]+=10;gw[3]+=5;}
    const list=[];for(let i=0;i<n;i++){const lv=clamp(avg-ri(0,3),lr[0],lr[1]);
      list.push(genMerc(lv,{grade:wpick([0,1,2,3],gw),pot:wpick([0,1,2],[60,30,10])}));}
    r=S.recruits[key]={day:S.day,list};}
  return r.list;}
function avgLv(){const a=[S.leader.lv,...S.mercs.map(m=>m.lv)];return a.reduce((x,y)=>x+y,0)/a.length;}
function hire(tk,id){const list=recruitList(tk);const m=list.find(x=>x.id===id);if(!m)return '없는 용병';
  if(S.mercs.length>=maxRoster())return '용병 보유 한도('+maxRoster()+'명)가 찼습니다';
  const c=hireCost(m);if(S.gold<c)return '금화가 부족합니다';
  addGold(-c);list.splice(list.indexOf(m),1);
  // 시작 장비
  const j=D.JOBS[m.job];const w=genItem(m.lv,0,'wpn',j.wpn[0]);S.inv.push(w);equip(m,w.id);
  S.mercs.push(m);if(S.party.length<4&&m.status==='ok')S.party.push(m.id);
  return null;}
function fire(id){const m=S.mercs.find(x=>x.id===id);if(!m)return;
  for(const s of SLOTS)m.eq[s]=null;S.mercs.splice(S.mercs.indexOf(m),1);S.party=S.party.filter(x=>x!==id);}
function mercById(id){return S.mercs.find(m=>m.id===id);}
function canFight(m){return m.status==='ok'&&!m.instructor;}
function partyUnits(){return [S.leader,...S.party.map(mercById).filter(m=>m&&canFight(m))];}

/* ---------------- 아이템 ---------------- */
function tierIdx(lv){return Math.min(5,Math.floor((lv-1)/9));}
function genItem(lv,rar,slot,cls){lv=Math.max(1,Math.round(lv));const R=D.RARITY[rar],m=R.m,ti=tierIdx(lv);
  const it={id:nid('i'),lv,rar,slot,enh:0,st:{}};
  if(slot==='wpn'){cls=cls||pick(Object.keys(D.WPN));const W=D.WPN[cls];it.cls=cls;
    const base=(5+lv*1.7)*m;
    if(cls==='staff'){it.st.mag=Math.round(base*1.05);it.st.atk=Math.round(base*.2);}
    else if(cls==='bow'){it.st.atk=Math.round(base*.95);it.st.crit=3+rar;}
    else if(cls==='dagger'){it.st.atk=Math.round(base*.85);it.st.crit=6+rar*1.5;it.st.spd=1+Math.round(lv/15);}
    else if(cls==='axe'){it.st.atk=Math.round(base*1.12);}
    else if(cls==='mace'){it.st.atk=Math.round(base*.95);it.st.def=Math.round((1+lv*.35)*m);}
    else it.st.atk=Math.round(base);
    const ic=W.ic[Math.min(4,ti)];it.ic=(D.WB(Math.min(4,rar+ (ti>=4?1:0)))+ic[0])*16+ic[1];it.name=W.names[ti];}
  else if(slot==='arm'){cls=cls||pick(Object.keys(D.ARMS));const A=D.ARMS[cls];it.cls=cls;
    it.st.def=Math.round((3+lv*1.0)*m*A.m.def);it.st.hp=Math.round((12+lv*5)*m*A.m.hp);
    if(A.m.eva)it.st.eva=A.m.eva>0?A.m.eva+rar:A.m.eva;if(A.m.mag)it.st.mag=Math.round((2+lv*.8)*m);
    it.ic=A.ic[Math.min(4,ti)];it.name=A.names[ti];}
  else{cls=cls||pick(Object.keys(D.ACCS));const A=D.ACCS[cls];it.cls=cls;it.slot='acc';
    const f={atk:(2+lv*.6)*m,crit:2+lv*.08+rar,def:(2+lv*.5)*m,hp:(10+lv*4)*m,mag:(2+lv*.7)*m,spd:1+lv*.04+rar*.3,eva:1+lv*.1+rar*.5};
    for(const k of A.st)it.st[k]=k==='spd'||k==='crit'||k==='eva'?Math.round(f[k]*10)/10:Math.round(f[k]);
    it.ic=A.ic[Math.min(4,ti)];it.name=A.names[ti];}
  it.val=Math.round(D.priceRef(lv)*[.3,.5,.9,1.6,3][rar]);
  return it;}
function genUnique(key){const U=D.UNIQUE[key];const it={id:nid('i'),lv:U.lv,rar:4,slot:U.slot==='acc'?'acc':U.slot,cls:U.cls,enh:0,st:Object.assign({},U.st),ic:U.ic,name:U.n,uniq:key,desc:U.d};
  it.val=Math.round(D.priceRef(U.lv)*3);return it;}
function rollRarity(bonus){const r=Math.random()*100-(bonus||0);return r<1.2?4:r<6?3:r<20?2:r<48?1:0;}
function canEquip(u,it){if(it.slot!=='wpn')return true;const allow=u===S.leader?D.LCLASS[u.cls].wpn:D.JOBS[u.job].wpn;return allow.includes(it.cls);}
function ownerOf(itemId){if(Object.values(S.leader.eq).includes(itemId))return S.leader;return S.mercs.find(m=>Object.values(m.eq).includes(itemId));}
function equip(u,itemId,slotHint){const it=itemById(itemId);if(!it||!canEquip(u,it))return false;
  const prev=ownerOf(itemId);if(prev)for(const s of SLOTS)if(prev.eq[s]===itemId)prev.eq[s]=null;
  let s=it.slot;if(s==='acc')s=slotHint||(!u.eq.acc1?'acc1':!u.eq.acc2?'acc2':'acc1');
  u.eq[s]=itemId;return true;}
function unequip(u,slot){u.eq[slot]=null;}
function sellItem(id){const it=itemById(id);if(!it||ownerOf(id))return 0;const v=Math.round(it.val*.25*(1+.15*(it.enh||0)));S.inv.splice(S.inv.indexOf(it),1);addGold(v);return v;}
function enhCost(it){let c=it.val*.3*((it.enh||0)+1);if(S.camp.built.forge&&S.loc==='camp')c*=.85;return Math.round(c/10)*10;}
function enhance(id){const it=itemById(id);if(!it||(it.enh||0)>=5)return '더 이상 강화할 수 없습니다';const c=enhCost(it);if(S.gold<c)return '금화가 부족합니다';
  addGold(-c);const ok=Math.random()<[1,.9,.75,.6,.45][it.enh||0];if(ok)it.enh=(it.enh||0)+1;return ok?'ok':'fail';}
function invFull(){return S.inv.filter(i=>!ownerOf(i.id)).length>=40;}
function addItem(it){if(invFull()){addGold(Math.round(it.val*.25));return false;}S.inv.push(it);return true;}

/* ---------------- 던전 지도 (분기형 노드) ---------------- */
function dungOpen(dk){const d=D.DUNG[dk];if(!d)return false;
  if(d.campTier)return S.camp.tier>=d.campTier;
  if(d.town!=='abyss'&&!townOpen(d.town))return false;
  if(d.rank&&rankIdx(S.rank)<rankIdx(d.rank))return false;
  if(d.unlock){const i=D.MAIN.findIndex(m=>m.id===d.unlock);if(S.main<i)return false;}
  return true;}
/* ---------------- 던전 (방·미로) 생성 — 같은 seed면 같은 지도 ---------------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const OUTDOOR={forest:1,camp:1,waste:1,mist:1};
function genDungeon(dk,seed){const d=D.DUNG[dk],F=d.floors,R=mulberry(seed);const rr=(a,b)=>a+Math.floor(R()*(b-a+1));const rp=a=>a[Math.floor(R()*a.length)];
  const cols=F<=5?3:4,rows=F<=6?3:4,CW=12,CH=10,W=cols*CW+2,H=rows*CH+2;const target=Math.min(cols*rows,F+4);
  // 1) 칸 단위 미로 (무작위 깊이 우선)
  const N=cols*rows,adj=Array.from({length:N},()=>new Set());const seen=new Uint8Array(N);const st=[rr(0,N-1)];seen[st[0]]=1;
  while(st.length){const c=st[st.length-1];const cx=c%cols,cy=c/cols|0;const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>[cx+x,cy+y]).filter(([x,y])=>x>=0&&y>=0&&x<cols&&y<rows).map(([x,y])=>y*cols+x).filter(n=>!seen[n]);
    if(!nb.length){st.pop();continue;}const n=rp(nb);adj[c].add(n);adj[n].add(c);seen[n]=1;st.push(n);}
  // 고리 몇 개 (미로가 너무 일자가 되지 않게)
  for(let i=0;i<Math.floor(N/4);i++){const c=rr(0,N-1),cx=c%cols,cy=c/cols|0;const o=rp([[1,0],[0,1]]);const x=cx+o[0],y=cy+o[1];if(x<cols&&y<rows)adj[c].add(y*cols+x),adj[y*cols+x].add(c);}
  const alive=new Set([...Array(N).keys()]);
  const bfs=(s)=>{const dist=new Array(N).fill(-1);dist[s]=0;const q=[s];while(q.length){const c=q.shift();for(const n of adj[c])if(alive.has(n)&&dist[n]<0){dist[n]=dist[c]+1;q.push(n);}}return dist;};
  // 출발: 모서리 칸, 보스: 가장 먼 칸
  let start=rp([0,cols-1,N-cols,N-1]);let dist=bfs(start);let boss=dist.indexOf(Math.max(...dist));
  // 칸 수 줄이기 (막다른 칸부터)
  let guard=0;while(alive.size>target&&guard++<50){const leaves=[...alive].filter(c=>c!==start&&c!==boss&&[...adj[c]].filter(n=>alive.has(n)).length===1);if(!leaves.length)break;alive.delete(rp(leaves));}
  dist=bfs(start);boss=[...alive].reduce((a,b)=>dist[b]>dist[a]?b:a,start);const maxD=dist[boss]||1;
  // 2) 타일
  const cells=new Uint8Array(W*H);const at=(x,y)=>y*W+x;
  const rooms=[];for(const c of alive){const cx=c%cols,cy=c/cols|0;const big=c===boss||c===start;
    const rw=big?CW-3:rr(5,CW-3),rh=big?CH-3:rr(4,CH-3);const rx=1+cx*CW+rr(1,CW-rw-1),ry=1+cy*CH+rr(2,CH-rh-1);
    for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)cells[at(x,y)]=1;
    rooms.push({id:c,x:rx,y:ry,w:rw,h:rh,cx:rx+(rw>>1),cy:ry+(rh>>1),dist:dist[c],nb:[...adj[c]].filter(n=>alive.has(n))});}
  const room=id=>rooms.find(r=>r.id===id);const corr=[];
  const wide=OUTDOOR[d.theme]?2:1;
  const done=new Set();for(const r of rooms)for(const n of r.nb){const k=Math.min(r.id,n)+'_'+Math.max(r.id,n);if(done.has(k))continue;done.add(k);const o=room(n);
    let x=r.cx,y=r.cy;const hv=R()<.5;const carve=(x,y)=>{for(let i=0;i<wide;i++)for(let j=0;j<wide;j++){const X=x+i,Y=y+j;if(X>0&&Y>1&&X<W-1&&Y<H-1){if(!cells[at(X,Y)])corr.push([X,Y]);cells[at(X,Y)]=1;}}};
    if(hv){while(x!==o.cx){carve(x,y);x+=Math.sign(o.cx-x);}while(y!==o.cy){carve(x,y);y+=Math.sign(o.cy-y);}}
    else{while(y!==o.cy){carve(x,y);y+=Math.sign(o.cy-y);}while(x!==o.cx){carve(x,y);x+=Math.sign(o.cx-x);}}carve(x,y);}
  // 3) 방 종류
  for(const r of rooms){r.p=r.dist/maxD;r.l=Math.round(r.p*(F-1));r.t='battle';}
  room(start).t='start';room(boss).t='boss';room(boss).l=F-1;
  const pathTo=(()=>{const prev={};const q=[start];const v=new Set([start]);while(q.length){const c=q.shift();for(const n of room(c).nb)if(!v.has(n)){v.add(n);prev[n]=c;q.push(n);}}const p=[];let c=boss;while(c!==undefined&&c!==start){p.unshift(c);c=prev[c];}return p;})();
  const setT=(id,t)=>{const r=room(id);if(r&&r.t==='battle')r.t=t;};
  if(pathTo.length>=2)setT(pathTo[pathTo.length-2],'camp');
  const mid=rooms.filter(r=>r.t==='battle'&&r.p>.3&&r.p<.62).sort((a,b)=>Math.abs(a.p-.45)-Math.abs(b.p-.45))[0];if(mid)mid.t='camp';
  const dead=rooms.filter(r=>r.t==='battle'&&r.nb.length===1);let ci=0;for(const r of dead){if(ci<2){r.t='chest';ci++;}else if(F>=6&&!rooms.some(x=>x.t==='shop'))r.t='shop';}
  if(F>=6&&!rooms.some(x=>x.t==='shop')){const c=rooms.filter(r=>r.t==='battle'&&r.p>.2&&r.p<.8);if(c.length>3)rp(c).t='shop';}
  if(!rooms.some(x=>x.t==='chest')){const c=rooms.filter(r=>r.t==='battle'&&r.p>.15);if(c.length>2)rp(c).t='chest';}
  for(const r of rooms)if(r.t==='battle'&&r.p>.3&&R()<.28)r.t='elite';
  // 4) 함정·장식
  const traps=[];const cand=corr.filter(([x,y])=>!rooms.some(r=>x>=r.x-1&&x<=r.x+r.w&&y>=r.y-1&&y<=r.y+r.h));
  for(let i=0;i<2+Math.floor(F/3)&&cand.length;i++){const k=Math.floor(R()*cand.length);traps.push({x:cand[k][0],y:cand[k][1],id:i});cand.splice(k,1);}
  const props=[];const torches=[];
  for(const r of rooms){// 윗벽 횃불
    for(let x=r.x+1;x<r.x+r.w-1;x+=3)if(!cells[at(x,r.y-1)]&&R()<.8)torches.push({x,y:r.y-1});
    const n=Math.floor(r.w*r.h/14);for(let i=0;i<n;i++){const edge=R()<.7;let x,y;
      if(edge){const s=rr(0,3);x=s<2?rr(r.x,r.x+r.w-1):s===2?r.x:r.x+r.w-1;y=s===0?r.y:s===1?r.y+r.h-1:rr(r.y,r.y+r.h-1);}else{x=rr(r.x+1,r.x+r.w-2);y=rr(r.y+1,r.y+r.h-2);}
      if(Math.abs(x-r.cx)<=1&&Math.abs(y-r.cy)<=1)continue;if(props.some(p=>p.x===x&&p.y===y))continue;
      // 통로 입구는 비우기
      const nearCorr=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const X=x+a,Y=y+b;return cells[at(X,Y)]&&!(X>=r.x&&X<r.x+r.w&&Y>=r.y&&Y<r.y+r.h);});if(nearCorr)continue;
      props.push({x,y,k:rp(edge?['barrel','box','bones','skull','web','candle','rock','barrel']:['bones','skull','rubble','candle']),solid:edge});}}
  const sr=room(start);
  return {dk,seed,w:W,h:H,cells,rooms,traps,props,torches,start:{x:sr.cx,y:sr.cy},theme:d.theme,outdoor:!!OUTDOOR[d.theme]};}
function roomById(id){const r=S.run;return r&&r.dg?r.dg.rooms.find(x=>x.id===id):null;}

/* ---------------- 적 생성 ---------------- */
function monStats(def,lv,kind){const s=def.s,f=1+.012*lv;
  const st={hp:100*(1+.115*(lv-1))*s[0]*f,atk:23*(.76+.024*Math.min(lv,10))*(1+.2*(lv-1))*s[1]*f,mag:23*(.76+.024*Math.min(lv,10))*(1+.2*(lv-1))*s[2]*f,def:7*(1+.12*(lv-1))*s[3]*f,spd:(27+lv*.22)*s[4],crit:5,eva:4};
  if(kind==='elite'){st.hp*=1.8;st.atk*=1.18;st.mag*=1.18;st.def*=1.1;}
  for(const k of ['hp','atk','mag','def'])st[k]=Math.round(st[k]);return st;}
function makeEnemy(key,lv,kind){const def=D.BOSS[key]||D.MON[key];const st=monStats(def,lv,kind);
  return {key,name:(kind==='elite'?'정예 ':'')+def.n,lv,st,spr:def.spr,tint:def.tint,scale:(def.scale||1)*(kind==='elite'?1.18:1),role:def.role,sk:def.sk,tro:def.tro,boss:!!D.BOSS[key],elite:kind==='elite'};}
function genEnemies(dk,node){const d=D.DUNG[dk];const F=d.floors;const prog=node.l/(F-1);
  const lv=Math.round(d.lv[0]+(d.lv[1]-d.lv[0])*prog);const out=[];
  if(node.t==='boss'){out.push(makeEnemy(d.boss,d.lv[1]+1,'boss'));if(d.boss2)out.push(makeEnemy(d.boss2,d.lv[1]+1,'boss'));
    const n=d.boss2?1:d.tier===1?1:2;for(let i=0;i<n;i++)out.push(makeEnemy(pick(d.pool),d.lv[1]));}
  else if(node.t==='elite'){out.push(makeEnemy(pick(d.elite),lv+1,'elite'));const n=ri(1,2);for(let i=0;i<n;i++)out.push(makeEnemy(pick(d.pool),lv));}
  else{const n=node.l<=1?ri(2,3):ri(3,4)+(d.tier>=3&&Math.random()<.3?1:0);for(let i=0;i<Math.min(5,n);i++)out.push(makeEnemy(pick(d.pool),lv+(Math.random()<.25?1:0)));}
  return out;}
function examEnemies(ek){const e=D.EXAMS[ek];const out=[];if(e.boss)out.push(makeEnemy(e.boss,e.lv+1,'boss'));for(const a of e.adds)out.push(makeEnemy(a,e.lv));return out;}

/* ---------------- 전투 엔진 ---------------- */
// 순서: 행동 게이지가 찬 유닛이 하나씩 행동(연출 중에는 시간 정지) → 읽기 쉬운 하이브리드 오토배틀
class Battle{
  constructor(enemies,opt){opt=opt||{};this.opt=opt;this.t=0;this.units=[];this.ev=[];this.act=null;this.over=0;this.focus=null;
    this.auto=!!S.flags.leaderAuto;this.wait=null;this.speed=S.flags.bspeed||1;this.kills=[];this.log=[];
    const pu=partyUnits();let fi=0,bi=0;
    for(const u of pu){const isL=u===S.leader;const st=statsOf(u);const row=isL?D.LCLASS[u.cls].row:D.JOBS[u.job].row;
      const hp0=opt.full||u.hp==null?st.hp:Math.min(st.hp,u.hp);if(hp0<=0)continue;
      this.units.push({side:0,ref:u,isL,name:u.name,st,lv:u.lv,maxHp:st.hp,hp:hp0,row,slot:row==='front'?fi++:bi++,g:Math.random()*40,sp:isL?0:20,
        sk:isL?null:D.JOBS[u.job].skill,cds:{},buffs:[],shield:0,look:u.look,job:isL?null:u.job,cls:isL?u.cls:null,atkType:isL?D.LCLASS[u.cls].atkType:D.JOBS[u.job].atkType,heal:!isL&&D.JOBS[u.job].heal,downedOnce:false});}
    let ef=0,eb=0;
    for(const e of enemies){const row=e.role==='melee'?'front':'back';
      this.units.push({side:1,ref:e,name:e.name,st:e.st,maxHp:e.st.hp,hp:e.st.hp,row,slot:row==='front'?ef++:eb++,g:Math.random()*30,sp:e.boss?30:0,sk:e.sk,cds:{},buffs:[],shield:0,
        spr:e.spr,tint:e.tint,scale:e.scale,boss:e.boss,elite:e.elite,lv:e.lv,role:e.role,atkType:e.role==='melee'?'slash':e.role==='ranged'?'bow':'magic',heal:e.role==='healer'});}
    this.layout();}
  layout(){for(const side of [0,1]){for(const row of ['front','back']){const us=this.units.filter(u=>u.side===side&&u.row===row);
      us.forEach((u,i)=>{const n=us.length;u.hx=side===0?(row==='front'?560:360):(row==='front'?1040:1240);u.hy=470+(i-(n-1)/2)*(n>3?92:118)+(row==='back'?14:0);
        if(side===0&&row==='back')u.hx-=(i%2)*22;if(side===1&&row==='back')u.hx+=(i%2)*22;u.x=u.hx;u.y=u.hy;});}}}
  alive(side){return this.units.filter(u=>u.side===side&&u.hp>0);}
  buffVal(u,k){let v=0;for(const b of u.buffs)if(b.k===k)v+=b.v;return v;}
  has(u,k){return u.buffs.some(b=>b.k===k);}
  eff(u,k){let v=u.st[k];if(k==='atk'||k==='mag'){v*=1+this.buffVal(u,'atk');
      if(u.isL&&D.LCLASS[u.cls].passive==='bloodthirst')v*=1+.8*(1-u.hp/u.maxHp);}
    if(k==='def'){v*=1+this.buffVal(u,'def');v*=1-Math.min(.6,this.buffVal(u,'brk'));}
    return v;}
  update(dt){if(this.over)return;dt*=this.speed;this.t+=dt;
    if(this.wait)return;                       // 단장 명령 대기 (시간 정지)
    if(this.act){this.act.t+=dt;this.stepAct();return;}
    // 버프·상태 시간
    for(const u of this.units){if(u.hp<=0)continue;u.buffs=u.buffs.filter(b=>(b.t-=dt)>0);
      for(const k in u.cds)u.cds[k]=Math.max(0,u.cds[k]-dt);
      const bl=u.buffs.find(b=>b.k==='bleed');if(bl){u.bleedAcc=(u.bleedAcc||0)+dt;if(u.bleedAcc>=1){u.bleedAcc=0;this.hurt(null,u,Math.max(1,Math.round(u.maxHp*bl.v)),{dot:true});}}}
    // 게이지
    let ready=null;for(const u of this.units){if(u.hp<=0)continue;if(this.has(u,'freeze'))continue;
      let r=u.st.spd*1.25*(this.has(u,'slow')?.5:1)*(this.has(u,'haste')?2:1);u.g+=r*dt;if(u.g>=100&&(!ready||u.g>ready.g))ready=u;}
    if(ready){ready.g=0;this.begin(ready);}
    this.checkEnd();}
  begin(u){if(u.isL&&!this.auto&&!this.opt.sim){this.wait=u;this.ev.push({k:'await'});return;}
    const cmd=u.isL?this.leaderAI(u):this.ai(u);this.start(u,cmd);}
  leaderAI(u){const es=this.alive(1);const sk=this.availSkills(u);
    for(const k of sk){const s=D.SKILLS[k];if(s.t==='all'&&es.length>=2)return {skill:k};if(s.t==='allies')return {skill:k};}
    for(const k of sk){const s=D.SKILLS[k];if(s.t==='one')return {skill:k,target:this.pickTarget(u,true)};}
    return {target:this.pickTarget(u)};}
  availSkills(u){if(!u.isL)return [];const c=D.LCLASS[u.cls];return c.skills.filter(k=>!(u.cds[k]>0)&&(!D.SKILLS[k].lv||S.leader.lv>=D.SKILLS[k].lv));}
  ai(u){const es=this.alive(1-u.side),fr=this.alive(u.side);
    if(u.sk&&u.sp>=100){return {skill:u.sk,target:this.pickTarget(u)};}
    if(u.heal){const low=fr.filter(x=>x.hp/x.maxHp<.6).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(low)return {heal:low};}
    return {target:this.pickTarget(u)};}
  pickTarget(u,strong){const es=this.alive(1-u.side);if(!es.length)return null;
    if(u.side===0&&this.focus&&this.focus.hp>0)return this.focus;
    const taunt=es.filter(x=>this.has(x,'taunt'));if(taunt.length&&u.side===1)return pick(taunt);
    if(u.atkType==='slash'||u.role==='melee'){const fr=es.filter(x=>x.row==='front');const pool=fr.length?fr:es;
      return pool.reduce((a,b)=>Math.abs(a.hy-u.hy)<=Math.abs(b.hy-u.hy)?a:b);}
    if(strong){const b=es.find(x=>x.boss);if(b)return b;}
    if(Math.random()<.4)return es.reduce((a,b)=>a.hp<b.hp?a:b);
    return pick(es);}
  // 단장 수동 명령
  command(cmd){const u=this.wait;if(!u)return false;if(cmd.skill){if(!this.availSkills(u).includes(cmd.skill))return false;}
    if(!cmd.target&&!(cmd.skill&&D.SKILLS[cmd.skill].t!=='one'))cmd.target=this.pickTarget(u,true);
    this.wait=null;this.start(u,cmd);return true;}
  setFocus(e){if(e&&e.side===1&&e.hp>0){this.focus=e;this.ev.push({k:'focus',u:e});}}
  start(u,cmd){const sk=cmd.skill?D.SKILLS[cmd.skill]:null;
    const melee=!sk?(u.atkType==='slash'):(sk.t==='one'||sk.t==='front2')&&u.atkType==='slash';
    const tg=cmd.target||(cmd.heal)||null;
    this.act={u,cmd,sk,t:0,melee:melee&&tg&&tg!==u,tg,hit:false,dur:melee?.95:.8};
    if(sk){this.ev.push({k:'skill',u,name:sk.n});if(u.isL)u.cds[cmd.skill]=sk.cd*(1-(u.st.cdr||0));else u.sp=0;}
    u.anim='attack';u.at=0;}
  stepAct(){const a=this.act,u=a.u;
    if(a.melee&&a.tg){const p=Math.min(1,a.t/.28),back=Math.max(0,(a.t-.7)/.25);
      const o=this.offFn?this.offFn(u):{x:(u.side===0?-62:62),y:0};const tx=a.tg.x+o.x,ty=a.tg.y+o.y;
      if(a.t<.28){u.x=u.hx+(tx-u.hx)*p;u.y=u.hy+(ty-u.hy)*p;u.anim='walk';}
      else if(a.t<.7){u.x=tx;u.y=ty;if(u.anim!=='attack'){u.anim='attack';u.at=0;}}
      else{u.x=tx+(u.hx-tx)*Math.min(1,back);u.y=ty+(u.hy-ty)*Math.min(1,back);u.anim='walk';}
      if(!a.hit&&a.t>=.48){a.hit=true;this.resolve(a);}}
    else{if(!a.hit&&a.t>=.38){a.hit=true;this.resolve(a);}}
    if(a.t>=a.dur){u.x=u.hx;u.y=u.hy;u.anim=null;this.act=null;this.checkEnd();}}
  resolve(a){const u=a.u,sk=a.sk,cmd=a.cmd;const es=this.alive(1-u.side),fr=this.alive(u.side);
    if(cmd.heal){const amt=Math.round(this.eff(u,'mag')*1.0);this.healU(u,cmd.heal,amt);u.sp=Math.min(100,u.sp+22);return;}
    if(!sk){if(!a.tg||a.tg.hp<=0)a.tg=this.pickTarget(u);if(a.tg){this.ev.push({k:'shot',u,tg:a.tg,type:u.atkType});this.strike(u,a.tg,1,u.atkType==='magic'?'mag':'atk',{});}
      if(!u.isL)u.sp=Math.min(100,u.sp+(this.has(u,'haste')?44:22));return;}
    const st=sk.st||'atk';
    if(sk.t==='one'){let tg=a.tg&&a.tg.hp>0?a.tg:this.pickTarget(u,true);if(!tg)return;
      for(let h=0;h<(sk.hits||1);h++){if(tg.hp<=0)break;
        if(sk.exec&&tg.hp/tg.maxHp<=sk.exec&&!tg.boss){this.hurt(u,tg,tg.hp,{crit:true,exec:true});break;}
        if(sk.exec&&tg.hp/tg.maxHp<=sk.exec&&tg.boss){this.strike(u,tg,sk.mul*1.6,st,{crit:sk.crit});continue;}
        this.strike(u,tg,sk.mul,st,{crit:sk.crit,bleed:sk.bleed,dur:sk.dur});}
      if(sk.slow&&tg.hp>0){tg.g*=1-sk.slow;tg.buffs.push({k:'slow',v:1,t:sk.dur});}
      if(sk.freeze&&tg.hp>0)tg.buffs.push({k:'freeze',v:1,t:sk.freeze});
      this.ev.push({k:'fx',fx:sk.fx,tg,u});}
    else if(sk.t==='all'||sk.t==='front2'||sk.t==='rand3'){let tgs=es;
      if(sk.t==='front2'){const f=es.filter(x=>x.row==='front');tgs=(f.length?f:es).slice().sort((p,q)=>Math.abs(p.hy-u.hy)-Math.abs(q.hy-u.hy)).slice(0,2);}
      if(sk.t==='rand3'){tgs=[];for(let i=0;i<3;i++)if(es.length)tgs.push(pick(es));}
      for(const tg of tgs){if(tg.hp<=0)continue;this.strike(u,tg,sk.mul,st,{bleed:sk.bleed,dur:sk.dur});
        if(sk.armorBreak)tg.buffs.push({k:'brk',v:sk.armorBreak,t:sk.dur});if(sk.interrupt){tg.g=0;if(tg.sp)tg.sp=Math.max(0,tg.sp-40);}
        this.ev.push({k:'fx',fx:sk.fx,tg,u});}}
    else if(sk.t==='healall'){for(const f of fr)this.healU(u,f,Math.round(this.eff(u,'mag')*sk.mul));this.ev.push({k:'fx',fx:'heal',tg:u,u,all:true});}
    else if(sk.t==='allies'||sk.t==='self'){const tgs=sk.t==='self'?[u]:fr;
      for(const f of tgs){if(sk.buff)for(const k in sk.buff)f.buffs.push({k,v:sk.buff[k],t:sk.dur});
        if(sk.haste)f.buffs.push({k:'haste',v:1,t:sk.dur});if(sk.shield)f.shield+=Math.round(f.maxHp*sk.shield);}
      if(sk.taunt)u.buffs.push({k:'taunt',v:1,t:sk.taunt});
      this.ev.push({k:'fx',fx:'buff',tg:u,u,all:sk.t==='allies'});}}
  strike(u,tg,mul,st,o){o=o||{};let raw=this.eff(u,st)*mul;
    if(st==='atk'&&Math.random()*100<tg.st.eva&&!o.sure){this.ev.push({k:'miss',u:tg});return;}
    let def=this.eff(tg,'def');if(u.isL&&D.LCLASS[u.cls].passive==='eagle')def*=.8;
    const K=30+5*(u.lv||1);let dmg=raw*K/(K+def)*rnd(.9,1.1);let crit=Math.random()*100<u.st.crit+(o.crit?o.crit*100:0);if(crit)dmg*=1.6;
    dmg=Math.max(1,Math.round(dmg));this.hurt(u,tg,dmg,{crit,type:st});
    if(o.bleed&&tg.hp>0)tg.buffs.push({k:'bleed',v:o.bleed,t:o.dur||6});
    if(u.isL&&D.LCLASS[u.cls].passive==='bloodthirst')this.healU(u,u,Math.round(dmg*.15),true);}
  hurt(u,tg,dmg,o){
    // 수호 기사: 아군 피해 일부 대신 받기
    if(tg.side===0&&!tg.isL){const g=this.units.find(x=>x.isL&&x.hp>0&&D.LCLASS[x.cls].passive==='bulwark');if(g&&g!==tg){const p=Math.round(dmg*.2);dmg-=p;g.hp=Math.max(1,g.hp-p);}}
    if(tg.shield>0){const a=Math.min(tg.shield,dmg);tg.shield-=a;dmg-=a;if(a)this.ev.push({k:'shield',u:tg,v:a});}
    tg.hp=Math.max(0,tg.hp-dmg);this.ev.push({k:'dmg',u:tg,v:dmg,crit:o.crit,dot:o.dot,exec:o.exec,type:o.type});tg.hitT=.25;tg.anim='hurt';tg.at=0;
    if(!tg.isL&&tg.sk)tg.sp=Math.min(100,(tg.sp||0)+8);
    if(tg.hp<=0){tg.anim='death';tg.at=0;tg.buffs=[];this.ev.push({k:'down',u:tg});if(tg.side===1)this.kills.push(tg.ref);if(this.focus===tg)this.focus=null;}}
  healU(u,tg,amt,quiet){if(tg.hp<=0)return;const h=Math.min(tg.maxHp-tg.hp,amt);tg.hp+=h;if(!quiet||h>5)this.ev.push({k:'heal',u:tg,v:h});}
  checkEnd(){if(this.over)return;if(!this.alive(1).length)this.over=1;else if(!this.alive(0).length)this.over=2;
    if(this.over){this.wait=null;this.ev.push({k:'end',win:this.over===1});}}
}
// 균형 확인용 자동 전투 (UI 없이)
function simulate(enemies,opt){const b=new Battle(enemies,Object.assign({sim:true},opt||{}));b.auto=true;let n=0;while(!b.over&&n<20000){b.update(.05);n++;}return b;}

/* ---------------- 던전 탐험 (런) ---------------- */
function startRun(dk){const pu=partyUnits();if(pu.length<1)return '출정할 수 있는 인원이 없습니다';
  for(const u of pu)u.hp=statsOf(u).hp;
  S.run={dk,seed:Math.floor(Math.random()*1e9),cleared:{},used:{},trapSt:{},visited:{},pos:null,loot:{gold:0,tro:{},items:[],exp:0},kills:{},elites:0,chests:0,rooms:0,fame:0,fallen:[],log:[],bossDown:false,special:null};
  S.loc='run';save();return null;}
function startSpecial(ek){const pu=partyUnits();for(const u of pu)u.hp=statsOf(u).hp;
  S.run={dk:null,special:ek,map:null,cur:null,loot:{gold:0,tro:{},items:[],exp:0},kills:{},elites:0,chests:0,rooms:0,fame:0,fallen:[],log:[]};return null;}
function visitRoom(id){const r=S.run;if(!r.visited[id]){r.visited[id]=1;r.rooms++;}}
function trapDetect(){return Math.random()<clamp(.35+S.leader.INT*.012,0,.9);}
function trapHit(){const hurt=[];for(const u of partyAliveUnits()){const dmg=Math.round(statsOf(u).hp*.12);u.hp=Math.max(1,u.hp-dmg);hurt.push([u.name,dmg]);}return hurt;}
function trapDisarm(){const r=S.run,d=D.DUNG[r.dk];const g=Math.round(D.TIER[d.tier].inc*d.dm*.05);r.loot.gold+=g;return g;}
function partyAliveUnits(){return partyUnits().filter(u=>u.hp>0);}
// 전투가 끝난 뒤 정산
function afterBattle(b,node){const r=S.run;const win=b.over===1;
  for(const bu of b.units)if(bu.side===0){bu.ref.hp=bu.hp;
    if(bu.hp<=0&&!bu.isL&&!r.fallen.includes(bu.ref.id)){r.fallen.push(bu.ref.id);bu.ref.falls++;applyFallStatus(bu.ref);} }
  const out={win,gold:0,exp:0,tro:[],items:[],fame:0,lvups:[]};
  // 처치 보상 (전멸이어도 쓰러뜨린 적 몫은 계산)
  const d=r.dk?D.DUNG[r.dk]:null,inc=d?D.TIER[d.tier].inc*d.dm:0;
  let xp=0;for(const e of b.kills){xp+=1.6*Math.pow(e.lv,1.5)+3;
    r.kills[e.key]=(r.kills[e.key]||0)+1;
    if(e.tro&&Math.random()<.6){const t=e.tro;r.loot.tro[t]=(r.loot.tro[t]||0)+1;out.tro.push(t);}}
  if(win){const kind=node?node.t:'special';
    if(d){out.gold=Math.round(inc*(kind==='boss'?.25:kind==='elite'?.16:.09)*rnd(.85,1.15));
      out.fame=Math.round((kind==='boss'?18:kind==='elite'?7:3)*D.TIER[d.tier].fameMul);
      const dropP=kind==='boss'?1:kind==='elite'?.4:.12;
      if(Math.random()<dropP){const lv=b.units.find(u=>u.side===1).lv||d.lv[1];const it=genItem(lv,rollRarity(kind==='boss'?18:kind==='elite'?8:0),pick(['wpn','arm','acc']));r.loot.items.push(it);out.items.push(it);}
      if(kind==='boss'){r.bossDown=true;const it2=Math.random()<.5?genItem(d.lv[1]+1,rollRarity(10),pick(['wpn','arm','acc'])):null;if(it2){r.loot.items.push(it2);out.items.push(it2);}}
      if(kind==='elite')r.elites++;}
    r.loot.gold+=out.gold;r.fame+=out.fame;}
  // 경험치: 살아남은 인원 100%, 쓰러진 인원 50%
  out.exp=Math.round(xp);r.loot.exp+=out.exp;
  for(const bu of b.units)if(bu.side===0){const ups=gainExp(bu.ref,xp*(bu.hp>0?1:.5)*(bu.ref.lv>maxEnemyLv(b)+6?.4:1));if(ups){bu.ref.hp=Math.min(statsOf(bu.ref).hp,(bu.ref.hp||0)+(bu.hp>0?statsOf(bu.ref).hp*.15:0));out.lvups.push(bu.ref.name+' Lv.'+bu.ref.lv);}}
  // 훈련소: 대기 용병도 50%
  if(S.camp.built.training){for(const m of S.mercs)if(!S.party.includes(m.id)&&m.status==='ok')gainExp(m,xp*.5*(S.mercs.some(x=>x.instructor)?1.3:1));}
  return out;}
function maxEnemyLv(b){return Math.max(...b.units.filter(u=>u.side===1).map(u=>u.lv||1));}
function applyFallStatus(m){if(m.falls>=5&&!m.dis){m.dis=true;m.seq=true;S.log.push(m.name+' — 영구 장애 (전 능력치 -25%)');return 'dis';}
  if(m.falls>=3&&!m.seq){m.seq=true;S.log.push(m.name+' — 후유증 (속도 -15%)');return 'seq';}return null;}
function nodeEvent(node){const r=S.run,d=D.DUNG[r.dk],inc=D.TIER[d.tier].inc*d.dm,L=S.leader;
  if(node.t==='chest'){const g=Math.round(inc*.12*(1+L.INT*.01)*rnd(.8,1.2));r.loot.gold+=g;r.chests++;let it=null;
    if(Math.random()<.3+L.INT*.006){it=genItem(d.lv[1],rollRarity(6+L.INT*.2),pick(['wpn','arm','acc']));r.loot.items.push(it);}
    return {gold:g,item:it};}
  if(node.t==='trap'){const p=clamp(.35+L.INT*.012,0,.9);r.rooms++;
    if(Math.random()<p){const g=Math.round(inc*.05);r.loot.gold+=g;return {detected:true,gold:g};}
    const hurt=[];for(const u of partyAliveUnits()){const dmg=Math.round(statsOf(u).hp*.12);u.hp=Math.max(1,u.hp-dmg);hurt.push([u.name,dmg]);}
    return {detected:false,hurt};}
  if(node.t==='shop'){const lv=d.lv[1];const items=[genItem(lv,rollRarity(5),pick(['wpn','arm'])),genItem(lv,rollRarity(5),'acc')];
    for(const it of items)it.price=Math.round(it.val*1.15);return {items};}
  return {};}
function campRest(kind){const pu=partyUnits();if(kind==='rest'){for(const u of pu){const mh=statsOf(u).hp;u.hp=u.hp>0?Math.min(mh,u.hp+mh*.35):Math.round(mh*.25);}}
  else{const x=Math.round(1.6*Math.pow(D.DUNG[S.run.dk].lv[0],1.5)*3+20);for(const u of pu)gainExp(u,x);return x;}}
function useConsumable(k,target){const c=D.CONSUM[k];if(!(S.cons[k]>0))return '가진 것이 없습니다';
  if(c.heal){for(const u of partyUnits())if(u.hp>0)u.hp=Math.min(statsOf(u).hp,u.hp+statsOf(u).hp*c.heal);}
  else if(c.revive){const u=partyUnits().find(x=>x.hp<=0&&(!target||x.id===target||x===target));if(!u)return '쓰러진 동료가 없습니다';u.hp=Math.round(statsOf(u).hp*c.revive);}
  else if(c.stat){S.leader[c.stat]+=2;}
  S.cons[k]--;return null;}
// 런 종료: retreat(귀환) / clear(보스 처치 후 귀환) / wipe(전멸)
function endRun(how){const r=S.run;if(!r)return null;const res={how,gold:0,troGold:0,tro:[],items:[],fame:r.fame,upkeep:0,tax:0,inj:[],status:[],daily:[],subs:[],main:null,exp:r.loot.exp};
  const keep=how==='wipe'?.5:1;
  res.gold=Math.round(r.loot.gold*keep);
  for(const t in r.loot.tro){const n=Math.round(r.loot.tro[t]*keep);if(!n)continue;const g=r.dk?Math.round(D.TIER[D.DUNG[r.dk].tier].inc*D.DUNG[r.dk].dm*D.TROPHY[t].v*.7*n):0;res.troGold+=g;res.tro.push([t,n,g]);S.stats.trophy[t]=(S.stats.trophy[t]||0)+n;}
  const items=how==='wipe'?r.loot.items.filter((_,i)=>i%2===0):r.loot.items;for(const it of items){addItem(it);res.items.push(it);}
  if(how==='wipe')res.fame=Math.round(r.fame*.5);
  if(how==='clear'&&r.dk){const d=D.DUNG[r.dk];const bonus=Math.round(8*D.TIER[d.tier].fameMul);res.fame+=bonus;S.stats.clears[r.dk]=(S.stats.clears[r.dk]||0)+1;}
  addGold(res.gold+res.troGold);res.fame=addFame(res.fame);
  if(r.dk){const tk=D.DUNG[r.dk].town;if(S.towns[tk])S.towns[tk].rep=(S.towns[tk].rep||0)+(how==='clear'?10:4);}
  for(const k in r.kills){S.stats.kills[k]=(S.stats.kills[k]||0)+r.kills[k];}
  if(r.dk){S.stats.dk=S.stats.dk||{};const sd=S.stats.dk[r.dk]=S.stats.dk[r.dk]||{kills:0,elites:0};sd.kills+=Object.values(r.kills).reduce((a,b)=>a+b,0);sd.elites+=r.elites;}
  S.stats.chests+=r.chests;S.stats.runs++;
  // 부상: 끝까지 쓰러져 있던 용병 → 중상
  for(const m of S.mercs){if(S.party.includes(m.id)&&m.hp!=null&&m.hp<=0){m.status='inj';m.injDays=S.camp.built.clinic?1:2;res.inj.push(m.name);}}
  for(const id of r.fallen){const m=mercById(id);if(m)res.status.push([m.name,m.falls,m.dis?'영구 장애':m.seq?'후유증':m.falls>=1?'경미한 흉터':'']);}
  // 퀘스트 진행
  progressQuests(r,how,res);
  // 하루 경과 (급여·세금·회복·일일 퀘스트 갱신)
  if(!r.special)Object.assign(res,nextDay());
  for(const u of [S.leader,...S.mercs])u.hp=null;
  S.run=null;S.loc=r.dk?(D.DUNG[r.dk].town==='abyss'?'t4':D.DUNG[r.dk].town):S.loc;if(S.loc==='run')S.loc='camp';
  save();return res;}
function nextDay(){const out={upkeep:upkeep(),tax:campTax()};const pay=Math.min(S.gold,out.upkeep);out.unpaid=out.upkeep-pay;addGold(-pay+out.tax);
  S.day++;for(const m of S.mercs){if(m.status==='inj'){m.injDays--;if(m.injDays<=0){m.status='ok';m.injDays=0;}}}
  out.dailyDone=claimDailies();genDailies();return out;}
function restDay(){const res=nextDay();save();return res;}
function treat(id){const m=mercById(id);if(!m||m.status!=='inj')return '치료할 필요가 없습니다';const c=healCost(m);if(S.gold<c)return '금화가 부족합니다';addGold(-c);m.status='ok';m.injDays=0;return null;}

/* ---------------- 퀘스트 ---------------- */
function curMain(){return D.MAIN[S.main]||null;}
function genDailies(){const t=curTier();const open=Object.keys(D.DUNG).filter(k=>dungOpen(k)&&D.DUNG[k].tier>=Math.max(1,t-1)&&D.DUNG[k].town!=='abyss');
  if(!open.length)open.push('d_forest');const n=3+(S.camp.built.board?1:0);S.dailies=[];const used={};
  for(let i=0;i<n;i++){let tp=pick(D.DAILY);let tries=0;while(used[tp.type]&&tries++<6)tp=pick(D.DAILY);used[tp.type]=1;
    const dk=pick(open),c=ri(tp.count[0],tp.count[1]);const tier=D.DUNG[dk].tier;
    S.dailies.push({type:tp.type,dk,count:c,prog:0,done:false,claimed:false,n:tp.n,goal:tp.goal(D.DUNG[dk].n,c),
      gold:Math.round(D.TIER[tier].inc*.16*rnd(.85,1.2)/10)*10,fame:Math.round(10*D.TIER[tier].fameMul)});}}
function claimDailies(){const out=[];for(const q of S.dailies)if(q.done&&!q.claimed){q.claimed=true;addGold(q.gold);addFame(q.fame);out.push(q);}return out;}
function progressQuests(r,how,res){const kills=Object.values(r.kills).reduce((a,b)=>a+b,0);
  for(const q of S.dailies){if(q.done)continue;
    if(q.type==='kill'&&r.dk===q.dk)q.prog+=kills;
    if(q.type==='elite'&&r.dk===q.dk)q.prog+=r.elites;
    if(q.type==='chest')q.prog+=r.chests;
    if(q.type==='clear'&&r.dk===q.dk&&r.bossDown)q.prog+=1;
    if(q.type==='floor')q.prog+=r.rooms;
    if(q.prog>=q.count){q.prog=q.count;q.done=true;}}
  res.daily=claimDailies();
  for(const k in S.subs){const s=S.subs[k],q=D.SUBS[k];if(s.state!=='active')continue;
    if(q.type==='kill'&&r.dk===q.d)s.prog+=kills;
    if(q.type==='elite'&&r.dk===q.d)s.prog+=r.elites;
    if(q.type==='chest')s.prog+=r.chests;
    if(q.type==='clear'&&r.dk===q.d&&r.bossDown)s.prog+=1;
    if(q.type==='trophy')s.prog+=(r.loot.tro[q.tro]||0);
    if(s.prog>=q.count){s.prog=q.count;s.state='done';res.subs.push(k);}}
  // 메인
  const m=curMain();if(m&&m.type==='clear'&&r.dk===m.d&&r.bossDown&&how!=='wipe'){res.main=m;advanceMain();}
  checkMain();}
function subCheck(){for(const k in S.subs){const s=S.subs[k],q=D.SUBS[k];if(s.state!=='active')continue;
  if(q.type==='decor')s.prog=decorPts();if(q.type==='camp')s.prog=S.camp.tier;if(s.prog>=q.count){s.prog=q.count;s.state='done';}}}
function acceptSub(k){if(!S.subs[k])S.subs[k]={state:'active',prog:0};subCheck();}
function claimSub(k){const s=S.subs[k],q=D.SUBS[k];if(!s||s.state!=='done')return null;s.state='claimed';const rw=q.reward,got=[];
  if(rw.gold){addGold(rw.gold);got.push(fmt(rw.gold)+' G');}
  if(rw.item){S.cons[rw.item]=(S.cons[rw.item]||0)+1;got.push(D.CONSUM[rw.item].n);}
  if(rw.uniq){const it=genUnique(rw.uniq);addItem(it);got.push(it.name);}
  if(rw.decor){S.camp.decor.push(rw.decor);got.push('장식: '+D.DECOR[rw.decor].n);}
  addFame(15*D.TIER[D.TOWNS[q.town].tier].fameMul);S.towns[q.town].rep+=15;return got;}
let mainDone=[];  // 방금 끝난 메인 단계 (ui가 대사 표시)
function advanceMain(){const m=curMain();if(!m)return;mainDone.push(m);S.main++;
  if(m.id==='m2_5'){const g=genMerc(Math.max(18,Math.round(avgLv())),{grade:3,pot:2,pers:'loyal',job:'guard',name:'가렛',sex:'m',hair:'shorthair',hc:4});
    if(S.mercs.length>=maxRoster())S.flags.garretWait=true;S.mercs.push(g);const w=genItem(g.lv,2,'wpn','sword');S.inv.push(w);equip(g,w.id);const a=genItem(g.lv,2,'arm','heavy');S.inv.push(a);equip(g,a.id);
    if(S.party.length<4)S.party.push(g.id);}
  if(m.id==='m5_3'){S.rank='S';S.ending=true;}
  genDailies();}
function checkMain(){let m=curMain();let guard=0;
  while(m&&guard++<5){let ok=false;
    if(m.type==='hire')ok=partyUnits().length>=m.count;
    if(m.type==='camp')ok=S.camp.tier>=m.tier;
    if(!ok)break;advanceMain();m=curMain();}
  subCheck();}
function examReady(){const m=curMain();if(!m||m.type!=='exam')return null;const p=D.PROMO[S.rank];return {exam:m.exam,fame:p.fame,ok:S.fame>=p.fame,town:D.EXAMS[m.exam].town};}
function passExam(ek){const m=curMain();if(m&&m.type==='exam'&&m.exam===ek){const p=D.PROMO[S.rank];S.rank=p.next;advanceMain();checkMain();return true;}return false;}
function talkMain(place){const m=curMain();if(m&&m.type==='talk'&&m.at===place){advanceMain();checkMain();return m;}return null;}

/* ---------------- 집결지 ---------------- */
function buildable(){const out=[];for(const k in D.BUILDS){const b=D.BUILDS[k];if(b.tier<=S.camp.tier&&!S.camp.built[k])out.push(k);}return out;}
function build(k){const b=D.BUILDS[k];if(!b||S.camp.built[k])return '이미 지었습니다';if(b.tier>S.camp.tier)return '집결지 단계가 부족합니다';
  if(S.gold<b.cost)return '금화가 부족합니다';addGold(-b.cost);S.camp.built[k]=true;checkMain();save();return null;}
function campNext(){const t=D.CAMP_TIERS[S.camp.tier+1];if(!t)return null;const n=t.need;
  const st={tier:S.camp.tier+1,name:t.n,reward:t.reward,rank:n.rank,rankOk:rankIdx(S.rank)>=rankIdx(n.rank),build:n.build.map(k=>[k,!!S.camp.built[k]]),decor:decorPts(),decorNeed:n.decor,cost:n.cost};
  st.ok=st.rankOk&&st.build.every(b=>b[1])&&st.decor>=n.decor&&S.gold>=n.cost;return st;}
function campUpgrade(){const st=campNext();if(!st||!st.ok)return '조건이 부족합니다';addGold(-st.cost);S.camp.tier++;checkMain();save();return null;}
function decorPrice(k){return D.DECOR[k].price[S.camp.tier-1];}
function buyDecor(k){const p=decorPrice(k);if(!p)return '아직 살 수 없습니다';if(D.DECOR[k].big&&S.camp.decor.includes(k))return '풍차는 하나만 세울 수 있습니다';if(S.gold<p)return '금화가 부족합니다';if(S.camp.decor.length>=36)return '장식 자리가 가득 찼습니다';addGold(-p);S.camp.decor.push(k);subCheck();save();return null;}

/* ---------------- 대사 ---------------- */
function mercLine(m,place){const L=D.LINES[m.pers];let pool;
  if(m.instructor)pool=L.ins;else if(m.status==='inj')pool=L.inj;else if(m.dis)pool=L.dis;else if(m.seq)pool=L.seq;
  else{pool=L.ok.slice();if(place&&L[place])pool=pool.concat(L[place],L[place]);if(Math.random()<.3)pool=pool.concat(D.JOB_LINES[m.job]);if(D.GRADE_LINES[m.grade]&&Math.random()<.2)pool=pool.concat(D.GRADE_LINES[m.grade]);
    if(m.falls>=1&&m.falls<3&&Math.random()<.25)pool=['이 흉터 말이야? 지난번 던전에서 생긴 거야. 별거 아냐.'];}
  return pick(pool);}
function townLine(tk,role){const T=D.TOWN_TALK[tk];if(!T)return '...';const a=attitude(tk);return pick(T[role][a]);}

/* ---------------- 단장 전직 ---------------- */
function advance(cls){const c=D.LCLASS[cls];if(!c||c.base!==S.leader.cls)return false;S.leader.cls=cls;S.advanced=true;return true;}

return {get S(){return S;},set S(v){S=v;},slot:1,D,rnd,ri,pick,clamp,fmt,rankIdx,newGame,save,load,peek,wipeSlot,SLOTS,itemById,statsOf,leaderStats,mercStats,power,expNeed,gainExp,
  wage,upkeep,hireCost,healCost,attitude,priceMul,addGold,addFame,maxRoster,curTier,townOpen,decorPts,campTax,genMerc,recruitList,hire,fire,mercById,canFight,partyUnits,
  genItem,genUnique,rollRarity,canEquip,ownerOf,equip,unequip,sellItem,enhCost,enhance,addItem,invFull,dungOpen,genDungeon,roomById,visitRoom,trapDetect,trapHit,trapDisarm,genEnemies,examEnemies,makeEnemy,Battle,simulate,
  startRun,startSpecial,afterBattle,nodeEvent,campRest,useConsumable,endRun,restDay,treat,curMain,genDailies,acceptSub,claimSub,subCheck,checkMain,examReady,passExam,talkMain,
  get mainDone(){return mainDone;},clearMainDone(){mainDone=[];},advanceMain,buildable,build,campNext,campUpgrade,decorPrice,buyDecor,mercLine,townLine,advance,applyFallStatus,partyAliveUnits};
})();
