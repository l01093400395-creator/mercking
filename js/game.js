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
    leader:{name:name||'단장',cls,lv:1,exp:0,STR:6,AGI:6,INT:6,CHA:6,pts:0,eq:{wpn:null,off:null,arm:null,acc1:null,acc2:null},sex:'m',look:{hair:'shorthair',hc:1}},
    mercs:[],party:[],inv:[],cons:{potion:2,hipotion:0,feather:0},
    camp:{tier:1,built:{},decor:[]},
    towns:{t1:{rep:0},t2:{rep:0},t3:{rep:0},t4:{rep:0},t5:{rep:0},t6:{rep:0},t7:{rep:0},t8:{rep:0},t9:{rep:0}},
    dailies:[],subs:{},stats:{kills:{},elites:{},clears:{},chests:0,trophy:{},runs:0,wins:0},
    recruits:{},run:null,loc:'camp',arena:0,advanced:false,log:[],ending:false,playSec:0};
  S.leader[D.LCLASS[cls].main]+=4;
  // 시작 장비
  const w=genItem(1,0,'wpn',D.LCLASS[cls].wpn[0]);w.name='낡은 '+D.WPN[w.cls].n;S.inv.push(w);equip(S.leader,w.id);
  // 시작 동료: 낙천적인 견습생
  const m=genMerc(2,{grade:0,pot:1,pers:'cheer',job:cls==='sword'?'archer':'warrior',name:'로안'});
  m.free=true;S.mercs.push(m);S.party.push(m.id);
  genDailies();S.mainV2=true;S.formV3=true;S.ores={iron:0,silver:0,obsid:0,flame:0};S.chron=[{day:1,t:'철혈 맹약단 재건 시작. 남은 것은 부러진 깃발과 견습생 하나.'}];
  return S;
}
function save(){if(!S)return;try{S.savedAt=Date.now();localStorage.setItem(SAVE_KEY(G.slot),JSON.stringify(S));localStorage.setItem('mercking-cur',String(G.slot));}catch(e){console.warn(e);}}
function load(n){try{const t=localStorage.getItem(SAVE_KEY(n));if(!t)return null;S=JSON.parse(t);G.slot=n;fixSave();return S;}catch(e){console.warn(e);return null;}}
function peek(n){try{const t=localStorage.getItem(SAVE_KEY(n));return t?JSON.parse(t):null;}catch(e){return null;}}
function wipeSlot(n){try{localStorage.removeItem(SAVE_KEY(n));}catch(e){}}
// 메인 이야기 순서가 바뀐 v2: 옛 저장의 진행 위치를 단계 이름으로 다시 맞춤
const MAIN_V1=['m1_1','m1_2','m1_3','m1_4','m1_5','m1_6','m2_1','m2_2','m2_3','m2_4','m2_5','m2_6','m3_1','m3_2','m3_3','m3_4','m3_5','m3_6','m4_1','m4_2','m4_3','m4_4','m4_5','m4_6','m5_1','m5_2','m5_3'];
function fixSave(){inv2();inv4();S.cq=S.cq||{};if(!S.formV3){S.formation={};S.formV3=true;}if(S.dailyDay==null)S.dailyDay=S.day;S.ores=S.ores||{iron:0,silver:0,obsid:0,flame:0};if(!S.mainV2){const id=MAIN_V1[S.main];const ni=id?D.MAIN.findIndex(m=>m.id===id):D.MAIN.length;if(ni>=0){S.main=ni;S.mainShown=ni;}S.mainV2=true;}S.towns=S.towns||{};for(const k in D.TOWNS)if(!S.towns[k])S.towns[k]={rep:0};
  if(!S.gearV2){S.gearV2=1;for(const it of S.inv){if(it.cls==='shield'){it.slot='off';}
      if(it.slot==='wpn'&&H2.includes(it.cls)&&!it.h2){for(const k of ['atk','mag'])if(it.st[k])it.st[k]=Math.round(it.st[k]*1.3);it.h2=1;}}
    for(const u of [S.leader,...S.mercs]){u.eq.off=u.eq.off||null;for(const a of ['acc1','acc2']){const it=u.eq[a]&&S.inv.find(i=>i.id===u.eq[a]);if(it&&it.cls==='shield'){u.eq[a]=null;const w=u.eq.wpn&&S.inv.find(i=>i.id===u.eq.wpn);if(!u.eq.off&&!(w&&H2.includes(w.cls)))u.eq.off=it.id;}}}}
  S.cons=S.cons||{};S.stats=S.stats||{kills:{},elites:{},clears:{},chests:0,trophy:{}};S.log=S.log||[];
  for(const k of ['kills','elites','clears','trophy'])S.stats[k]=S.stats[k]||{};}

/* ---------------- 능력치 ---------------- */
const SLOTS=['wpn','off','arm','acc1','acc2'];
const H2=['axe','bow','staff'];  // 두손 무기
const SHIELD_OK={warrior:1,guard:1,priest:1,sword:1,guardian:1,berserker:1,warlord:1};
function wpnOk(u,cls){const allow=u===S.leader?D.LCLASS[u.cls].wpn:D.JOBS[u.job].wpn;return allow.includes(cls);}
function shieldOk(u){return !!SHIELD_OK[u===S.leader?u.cls:u.job];}
function gearPenalty(u,s,it){if(s==='wpn'&&!wpnOk(u,it.cls))return .6;if(s==='off'&&!shieldOk(u))return .6;return 1;}
function itemById(id){return S.inv.find(i=>i.id===id);}
function gearStats(u){const st={hp:0,atk:0,mag:0,def:0,spd:0,crit:0,eva:0};
  for(const s of SLOTS){const it=u.eq[s]&&itemById(u.eq[s]);if(!it)continue;const m=1+.08*(it.enh||0),pen=gearPenalty(u,s,it);
    for(const k in it.st)st[k]=(st[k]||0)+it.st[k]*(k==='spd'||k==='crit'||k==='eva'?1:m)*(it.st[k]>0?pen:1);
    if(pen<1&&s==='off')st.spd-=2;}
  const sb=setBonus(u).st;for(const k in sb)st[k]=(st[k]||0)+sb[k];
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
  applyMod(s,D.PERS[m.pers]);if(m.named)applyMod(s,(namedOf(m)||{}).self);
  if(S.camp.built.hall)for(const k of ['hp','atk','mag','def'])s[k]*=1.1;
  if(D.LCLASS[S.leader.cls].passive==='tactics')s.atk*=1.1,s.mag*=1.1;
  return roundStats(s);}
function roundStats(s){for(const k of ['hp','atk','mag','def'])s[k]=Math.round(s[k]);s.spd=Math.round(s.spd*10)/10;s.crit=Math.round(s.crit*10)/10;s.eva=Math.min(40,Math.round(s.eva*10)/10);return s;}
/* ---------- v2.0 성격·시너지·네임드·파견 ---------- */
function applyMod(s,mod,mul){mul=mul||1;if(!mod)return s;if(mod.st)for(const k in mod.st)if(s[k]!=null)s[k]*=1+mod.st[k]*mul;if(mod.add)for(const k in mod.add)s[k]=(s[k]||0)+mod.add[k]*mul;return s;}
function namedOf(m){return m&&m.named?D.NAMED.find(n=>n.id===m.named):null;}
function partyMercs(){return partyUnits().filter(u=>u!==S.leader);}
function synergies(list){list=list||partyMercs();const cj={},cp={};for(const m of list){cj[m.job]=(cj[m.job]||0)+1;cp[m.pers]=(cp[m.pers]||0)+1;}
  return D.SYN.map(sy=>{const n=sy.all?Math.min(...D.JOB_KEYS.map(j=>cj[j]||0)):sy.job?(cj[sy.job]||0):(cp[sy.pers]||0);let tier=0;for(const t of sy.th)if(n>=t)tier++;return {s:sy,n,tier,next:sy.th[tier]};});}
function synText(sy,tier){const t=Math.max(1,tier),e=sy.eff;return sy.d.replace('{n}',sy.th[t-1]).replace(/\{(\w+)\}/g,(_,k)=>e.st&&e.st[k]!=null?Math.round(e.st[k]*100*t):e.add&&e.add[k]!=null?e.add[k]*t:k==='gold'?Math.round((e.gold||0)*100*t):'');}
// 전투에서 아군 전원에게 거는 효과 묶음: 시너지 + 네임드 오라 (+요리·유물은 extraMods)
function battleMods(list){list=list||partyMercs();const mods=[];for(const x of synergies(list))if(x.tier)mods.push({mod:x.s.eff,mul:x.tier,n:x.s.n,ic:x.s.ic,txt:synText(x.s,x.tier)});
  for(const m of list){const nd=namedOf(m);if(nd&&nd.aura)mods.push({mod:nd.aura,mul:1,n:nd.pas,ic:'👑',txt:nd.name+': '+nd.pd});}
  for(const x of extraMods())mods.push(x);return mods;}
function extraMods(){const o=[];if(S.feast){const R=D.RECIPES[S.feast.k];if(R)o.push({mod:R.buf,mul:1,n:R.n,ic:R.e,txt:'연회 버프 (이번 탐험 동안) — '+bufText(R.buf)});}
  for(const x of relicMods())o.push(x);return o;}
function relicMods(){inv4();return S.relicShow.map(id=>D.RELICS.find(r=>r.id===id)).filter(Boolean).map(r=>({mod:r.buf,mul:1,n:r.n,ic:r.e,txt:'집결지 전시 유물 — '+r.d}));}
/* ---------- v2.0 낮·밤 · 동물 교감 · 축제 · 보물 지도 · 유물 · 심연의 탑 ---------- */
function inv4(){S.pets=S.pets||{};S.relics=S.relics||[];S.relicShow=S.relicShow||[];S.mapPieces=S.mapPieces||0;S.festGot=S.festGot||{};}
function isNight(){return !!S.night;}
function setNight(v){S.night=!!v;}
function nightLine(){return pick(D.NIGHT.rumor);}
// 동물: 생선(또는 고기)을 주면 친밀도 +1 (하루 한 번). 친밀도 2 이상이면 먹이 준 다음 날부터 선물을 물어 온다
function pet(key){inv4();return S.pets[key]=S.pets[key]||{aff:0,fed:-9,gift:-9};}
function feedPet(key){const p=pet(key);if(p.fed===S.day)return '오늘은 이미 배불러요';inv2();const f=(S.ingr.fish||0)>0?'fish':(S.ingr.meat||0)>0?'meat':(S.ingr.beast||0)>0?'beast':null;
  if(!f)return '줄 먹이(생선·고기)가 없어요';S.ingr[f]--;p.aff=Math.min(10,p.aff+1);p.fed=S.day;return {food:D.INGR[f].n,aff:p.aff};}
function petGift(key){const p=pet(key);if(p.aff<2||p.fed>=S.day||p.gift>=p.fed)return null;p.gift=S.day;
  const r=Math.random(),a=p.aff;if(r<.45){const g=Math.round(D.priceRef(Math.max(5,avgLv()))*(.04+a*.012));addGold(g);return {gold:g};}
  const k=a>=8&&r<.7?'obsid':a>=4&&r<.8?'silver':'iron';const n=ri(1,1+Math.floor(a/3));S.ores[k]=(S.ores[k]||0)+n;return {ore:k,n};}
// 축제
function festOf(tk,day){const f=D.FESTIVALS[tk];if(!f)return null;const c=cal(day);return c.m===f.m&&c.d>=f.d[0]&&c.d<=f.d[1]?f:null;}
function festSoon(tk){const f=D.FESTIVALS[tk];if(!f)return 0;for(let k=1;k<=5;k++)if(festOf(tk,S.day+k)&&!festOf(tk,S.day))return k;return 0;}
function festGift(tk){inv4();const f=festOf(tk);if(!f)return null;const key=tk+':'+cal().y;if(S.festGot[key])return null;S.festGot[key]=1;
  const g=Math.round(D.priceRef(Math.max(5,avgLv()))*.15);addGold(g);const t=S.towns[tk]=S.towns[tk]||{rep:0};t.rep=(t.rep||0)+20;const extra={};
  const ing={t1:['honey',3],t3:['fish',4],t5:['herb',3],t7:['spice',3],t8:['rice',4],t9:['honey',3]}[tk];if(ing){addIngr(ing[0],ing[1]);extra.ingr=ing;}
  const ore={t2:['silver',4],t6:['obsid',3],t4:['silver',3]}[tk];if(ore){S.ores[ore[0]]=(S.ores[ore[0]]||0)+ore[1];extra.ore=ore;}chron(f.n+' 참가');return Object.assign({gold:g,n:f.n},extra);}
// 보물 지도: 조각 4개 → 어느 마을의 ✕ 표시
function addMapPiece(){inv4();if(S.tmap)return false;S.mapPieces++;if(S.mapPieces>=4){S.mapPieces=0;const ok=Object.keys(D.TOWNS).filter(k=>townOpen(k));S.tmap={tk:pick(ok.length?ok:['t1']),x:null,y:null};chron('보물 지도 완성');}return true;}
function digTreasure(){inv4();if(!S.tmap)return null;const own=new Set(S.relics);const left=D.RELICS.filter(r=>!own.has(r.id));const rl=left.length?pick(left):null;
  if(rl){S.relics.push(rl.id);if(S.relicShow.length<3)S.relicShow.push(rl.id);}const g=Math.round(D.priceRef(Math.max(8,avgLv()))*rnd(.4,.8));addGold(g);S.tmap=null;chron('보물 발굴'+(rl?': '+rl.n:''));return {relic:rl,gold:g};}
function toggleRelic(id){inv4();if(S.relicShow.includes(id)){S.relicShow=S.relicShow.filter(x=>x!==id);return null;}if(S.relicShow.length>=3)return '전시대는 3칸이에요';S.relicShow.push(id);return null;}
// 심연의 탑: 엔딩 후 무한 웨이브. 여기서 쓰러져도 부상·쓰러짐 횟수에 넣지 않는다
function towerOpen(){return !!S.ending;}
function towerStart(){if(!towerOpen())return '엔딩 뒤에 열려요';const pu=partyUnits();for(const u of pu)u.hp=statsOf(u).hp;S.tower={wave:1,gold:0,fame:0,items:[]};return null;}
function towerEnemies(){const w=S.tower.wave,boss=w%D.TOWER.bossEvery===0;const dk=D.TOWER.pool[(w-1)%D.TOWER.pool.length],d=D.DUNG[dk];
  const en=genEnemies(dk,{t:boss?'boss':w%3===0?'elite':'battle',l:d.floors-1});const k=1+w*.07,ka=1+w*.035;
  for(const e of en){e.st.hp=Math.round(e.st.hp*k*(boss?1:1.2));e.st.atk=Math.round(e.st.atk*ka);e.st.mag=Math.round(e.st.mag*ka);e.st.def=Math.round(e.st.def*(1+w*.02));e.lv=Math.max(e.lv,50+w);}
  return en;}
function towerAfter(b){const T=S.tower;for(const bu of b.units)if(bu.side===0)bu.ref.hp=bu.hb&&bu.maxHp?Math.round(bu.hp*bu.hb/bu.maxHp):bu.hp;   // 쓰러짐(falls) 기록 안 함
  const win=b.over===1,w=T.wave,out={win,wave:w};if(win){const g=Math.round(D.TIER[5].inc*.12*(1+w*.12)*econMul());const f=Math.round(40+w*12);T.gold+=g;T.fame+=f;out.gold=g;out.fame=f;
    if(w%D.TOWER.bossEvery===0){const it=genItem(50,rollRarity(30+w),pick(['wpn','arm','acc']));T.items.push(it);out.item=it;}
    for(const u of partyUnits())if(u.hp>0)u.hp=Math.min(statsOf(u).hp,u.hp+statsOf(u).hp*.25);T.wave++;}
  return out;}
function towerEnd(){const T=S.tower;if(!T)return null;const res={wave:T.wave-1,gold:T.gold,fame:T.fame,items:T.items};addGold(T.gold);addFame(T.fame);for(const it of T.items)addItem(it);
  S.towerBest=Math.max(S.towerBest||0,res.wave);S.tower=null;for(const u of [S.leader,...S.mercs])u.hp=null;save();return res;}
function bufText(b){const N={hp:'체력',atk:'공격',mag:'마력',def:'방어',spd:'속도',crit:'치명',eva:'회피',cdr:'재사용 단축'};const a=[];
  if(b.st)for(const k in b.st)a.push(N[k]+' +'+Math.round(b.st[k]*100)+'%');if(b.add)for(const k in b.add)a.push(N[k]+' +'+(k==='cdr'?Math.round(b.add[k]*100)+'%':b.add[k]));if(b.gold)a.push('금화 +'+Math.round(b.gold*100)+'%');return a.join(' · ');}
/* ---------- v2.0 채집·요리·연회·도면 제작·라이벌 ---------- */
function inv2(){S.ingr=S.ingr||{};S.recipes=S.recipes||{bread:1,stew:1};S.bps=S.bps||{};S.gather=S.gather||{};S.dishes=S.dishes||{};S.talked=S.talked||{};
  S.rival=S.rival||{fame:0,log:[]};}
function addIngr(k,n){inv2();S.ingr[k]=(S.ingr[k]||0)+n;}
function gatherReady(key){inv2();return !(S.gather[key]>S.day);}
// 밭·숲 채집: 한 번 캐면 3~5일 뒤 다시 자란다
function harvest(key,k,n){inv2();if(!gatherReady(key))return null;S.gather[key]=S.day+ri(3,5);addIngr(k,n);return {k,n,back:S.gather[key]-S.day};}
function pots(){return Math.max(1,Math.ceil(partyMercs().length/5));}     // 출정 인원 5명당 냄비 1개
function canCook(k){inv2();const R=D.RECIPES[k];if(!R||!S.recipes[k])return false;for(const i in R.need)if((S.ingr[i]||0)<R.need[i])return false;return true;}
function cook(k){if(!canCook(k))return '재료가 부족해요';const R=D.RECIPES[k];for(const i in R.need)S.ingr[i]-=R.need[i];S.dishes[k]=(S.dishes[k]||0)+1;return null;}
function feast(k){inv2();const R=D.RECIPES[k],n=pots();if((S.dishes[k]||0)<n)return `냄비가 ${n}개 필요해요 (출정 ${partyMercs().length+1}명)`;
  S.dishes[k]-=n;S.feast={k,day:S.day};chron('연회: '+R.n);return null;}
function recipePrice(k){return Math.round(600+[0,0,1,2,3,3,4,4,4,4][Math.min(9,(D.TOWNS[(D.RECIPES[k].towns||['t1'])[0]]||{tier:1}).tier)]*700);}
function bpPrice(k){const b=D.BLUEPRINTS[k];return Math.round(D.priceRef(Math.max(10,avgLv()))*[1,2,3,5,8][b.rar]);}
function learnRecipe(k){inv2();if(S.recipes[k])return false;S.recipes[k]=1;return true;}
function learnBp(k){inv2();if(S.bps[k])return false;S.bps[k]=1;return true;}
function learnAny(k){return D.RECIPES[k]?learnRecipe(k):learnBp(k);}
function hiddenName(k){return D.RECIPES[k]?'요리법 「'+D.RECIPES[k].n+'」':'도면 「'+D.BLUEPRINTS[k].n+'」';}
// 마을 첫 대화: 그 마을의 숨은 요리법/도면 하나
function firstTalk(tk){inv2();if(!D.HIDDEN[tk]||S.talked[tk])return null;S.talked[tk]=1;const k=D.HIDDEN[tk].find(x=>!(S.recipes[x]||S.bps[x]));if(!k)return null;learnAny(k);return k;}
// 서랍·책장 탐색: 가끔 낡은 쪽지에서 숨은 요리법/도면
function searchSecret(){inv2();if(Math.random()>.18)return null;const all=[...new Set(Object.values(D.HIDDEN).flat())].filter(x=>!(S.recipes[x]||S.bps[x]));if(!all.length)return null;const k=pick(all);learnAny(k);return k;}
function craftCost(k){const b=D.BLUEPRINTS[k],lv=Math.max(5,Math.round(S.leader.lv));return {gold:Math.round(D.priceRef(lv)*[.4,.6,1,1.6,2.4][b.rar]),ore:b.ore,lv};}
function craft(k){inv2();const b=D.BLUEPRINTS[k];if(!b||!S.bps[k])return '도면이 없어요';const c=craftCost(k);if(S.gold<c.gold)return '금화가 부족해요';
  for(const o in c.ore)if((S.ores[o]||0)<c.ore[o])return D.ORES[o].n+'이(가) 부족해요';if(invFull())return '가방이 가득 찼어요';
  addGold(-c.gold);for(const o in c.ore)S.ores[o]-=c.ore[o];
  const it=genItem(c.lv,b.rar,b.slot==='acc1'?'acc':b.slot,b.cls);it.name=b.n;it.bp=k;
  for(const st in b.bonus){const v=b.bonus[st];if(it.st[st])it.st[st]=st==='spd'||st==='crit'||st==='eva'?Math.round(it.st[st]*(1+v)*10)/10:Math.round(it.st[st]*(1+v));
    else it.st[st]=st==='hp'?Math.round((12+c.lv*5)*v*2):st==='spd'||st==='crit'||st==='eva'?Math.round(v*40):Math.round((3+c.lv*1.2)*v*2);}
  it.val=Math.round(it.val*1.3);S.inv.push(it);chron('제작: '+b.n);return it;}
// 라이벌: 맹약단의 뒤를 바짝 쫓는다
function rivalTick(){inv2();const R=S.rival;R.fame=Math.max(0,Math.round(R.fame+(S.fame*.93-R.fame)*.12+ri(0,30)));}
function rivalRank(){const f=S.rival?S.rival.fame:0;let r='F';for(const k of D.RANKS){const P=D.PROMO[k];if(P&&P.fame&&r===k&&f>=P.fame)r=P.next;}return r;}
function rivalNote(t){inv2();S.rival.log.unshift({day:S.day,t});S.rival.log=S.rival.log.slice(0,8);}
function goldMul(){const pm=partyMercs();let g=0;for(const m of pm){g+=(D.PERS[m.pers]||{}).gold||0;const nd=namedOf(m);if(nd&&nd.gold)g+=nd.gold;}g=Math.min(.3,g);
  for(const x of battleMods(pm))if(x.mod.gold)g+=x.mod.gold*x.mul;return 1+g;}
function statsOf(u){return u===S.leader?leaderStats():mercStats(u);}
function power(u){const s=statsOf(u);return Math.round(s.hp*.25+s.atk*2+s.mag*2+s.def*2+s.spd*2);}
const expNeed=lv=>Math.round(30*Math.pow(lv,1.5)*(1+Math.max(0,lv-28)*.14)*(1+Math.max(0,lv-40)*.12));
function gainExp(u,x){if(u.lv>=50)return 0;u.exp+=Math.round(x);let ups=0;
  while(u.lv<50&&u.exp>=expNeed(u.lv)){u.exp-=expNeed(u.lv);u.lv++;ups++;if(u===S.leader)u.pts+=3;}
  return ups;}

/* ---------------- 경제 ---------------- */
function chaDisc(){return Math.min(.35,S.leader.CHA*.008);}       // 급여·고용 할인
function shopDisc(){return Math.min(.3,S.leader.CHA*.006);}
function wageLv(m){return Math.min(m.lv,[10,20,34,46,50,50,50][Math.min(6,rankIdx(S.rank))]);}
function wage(m){let w=D.wageOf(wageLv(m),m.grade)*((D.PERS[m.pers]||{}).wage||1)*(m.named?1.5:1);if(m.wageCut)w*=.6;if(m.free)w*=.6;return Math.max(10,Math.round(w*(1-chaDisc())/5)*5);}
function upkeep(){let t=0;for(const m of S.mercs){t+=S.party.includes(m.id)||m.instructor?wage(m):Math.round(wage(m)*.5);}return t;}
function hireCost(m){return Math.round(D.wageOf(wageLv(m),m.grade)*4*(m.named?3:1)*(1-chaDisc())/10)*10;}
function healCost(m){let c=D.wageOf(wageLv(m),m.grade)*2.2;if(S.camp.built.clinic)c*=.5;return Math.round(c/10)*10;}
function attitude(tk){const t=D.TOWNS[tk];if(!t)return 2;const r=rankIdx(S.rank),rep=(S.towns[tk]&&S.towns[tk].rep)||0;if(r>=5||rep>=600)return 3;
  let a;if(tk==='t1')a=r>=1?2:1;else{const g=rankIdx(t.goodRank);a=r>=g?2:(r>=g-1&&rep>=40)?1:0;}
  if(rep>=80)a=Math.max(a,1);if(rep>=260)a=Math.max(a,2);return a;}
function priceMul(tk){const a=attitude(tk);let m=[1.15,1,.92,.82][a];if(festOf(tk))m*=.85;if(a===0)m-=Math.min(.12,S.leader.CHA*.004);return m*(1-shopDisc());}
function addGold(n){S.gold=Math.max(0,Math.round(S.gold+n));}
function addFame(n){n=Math.round(n*(1+S.leader.CHA*.01));S.fame+=n;return n;}
function maxRoster(){return partyMax()+2+(S.camp.built.bunk?2:0)+(S.camp.built.tavern?2:0);}
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
    eq:{wpn:null,off:null,arm:null,acc1:null,acc2:null},falls:0,status:'ok',injDays:0,seq:false,dis:false};
  if(sex==='f'&&!o.hair)m.look.hair=pick(['longhair','curlyhair','bowlhair','mophair']);
  return m;}
function recruitList(tk){const key=tk;let r=S.recruits[key];
  if(!r||r.day!==S.day){const t=tk==='camp'?Math.max(2,curTier()):D.TOWNS[tk].tier,lr=D.TIER[t].lv;
    const avg=Math.round(avgLv());const n=3+(tk==='camp'&&S.camp.built.tavern?1:0);
    const gw=[[70,25,5,0],[55,30,13,2],[42,34,19,5],[30,35,25,10]][Math.min(4,Math.max(1,t))-1].slice();
    if(tk==='camp'&&S.camp.built.tavern){gw[0]-=15;gw[2]+=10;gw[3]+=5;}
    const list=[];for(let i=0;i<n;i++){const lv=clamp(avg-ri(0,3),lr[0],lr[1]);
      list.push(genMerc(lv,{grade:wpick([0,1,2,3],gw),pot:wpick([0,1,2],[60,30,10])}));}
    const nd=rollNamed(tk==='camp'?.012:.02);if(nd)list.push(genNamed(nd,Math.max(lr[0],avg)));
    let snatch=null;if(rankIdx(S.rank)>=1&&tk!=='camp'){const top=list.find(m=>m.grade===3&&!m.named);if(top&&Math.random()<.35){list.splice(list.indexOf(top),1);snatch=top.name;rivalNote(D.TOWNS[tk].n+' 여관에서 영웅급 '+top.name+' 영입');}}
    r=S.recruits[key]={day:S.day,list,snatch};}
  return r.list;}
function avgLv(){const a=[S.leader.lv,...S.mercs.map(m=>m.lv)];return a.reduce((x,y)=>x+y,0)/a.length;}
function hire(tk,id){const list=recruitList(tk);const m=list.find(x=>x.id===id);if(!m)return '없는 용병';
  if(S.mercs.length>=maxRoster())return '용병 보유 한도('+maxRoster()+'명)가 찼습니다';
  const c=hireCost(m);if(S.gold<c)return '금화가 부족합니다';
  addGold(-c);list.splice(list.indexOf(m),1);
  // 시작 장비
  const j=D.JOBS[m.job];const w=genItem(m.lv,0,'wpn',j.wpn[0]);S.inv.push(w);equip(m,w.id);
  S.mercs.push(m);if(S.party.length<partyMax()&&m.status==='ok')S.party.push(m.id);if(m.named)chron&&chron('네임드 용병 '+m.name+' 합류');
  return null;}
function fire(id){const m=S.mercs.find(x=>x.id===id);if(!m)return;
  for(const s of SLOTS)m.eq[s]=null;S.mercs.splice(S.mercs.indexOf(m),1);S.party=S.party.filter(x=>x!==id);}
function mercById(id){return S.mercs.find(m=>m.id===id);}
function namedOwned(id){return S.mercs.some(m=>m.named===id);}
// 네임드: 등급 조건을 넘은 것 중 아직 데려오지 않은 한 명을 아주 낮은 확률로
function rollNamed(p){if(Math.random()>=p)return null;const ok=D.NAMED.filter(n=>rankIdx(S.rank)>=n.minRank&&!namedOwned(n.id));return ok.length?pick(ok):null;}
function genNamed(nd,lv){const m=genMerc(Math.round(lv),{job:nd.job,sex:nd.sex,pers:nd.pers,grade:3,pot:2,name:nd.name,hair:nd.look.hair,hc:nd.look.hc,sk:nd.look.sk});m.named=nd.id;return m;}
/* 파견: 대기 용병(출정 파티 밖, 정상)을 보내면 며칠 뒤 경험치·금화·광석 */
function idleMercs(){return S.mercs.filter(m=>!S.party.includes(m.id)&&m.status==='ok'&&!m.instructor&&!m.away);}
function dispatchOf(id){return D.DISPATCH.find(x=>x.id===id);}
function sendDispatch(id,ids){const x=dispatchOf(id);S.disp=S.disp||[];if(!x)return '없는 임무입니다';if(S.disp.some(d=>d.id===id))return '이미 진행 중인 임무입니다';
  const ms=ids.map(mercById).filter(Boolean);if(ms.length!==x.n2)return x.n2+'명을 골라 주세요';if(ms.some(m=>!idleMercs().includes(m)))return '대기 중인 용병만 보낼 수 있어요';
  const av=ms.reduce((a,m)=>a+m.lv,0)/ms.length;if(av<x.lv)return '평균 레벨 '+x.lv+' 이상이 필요해요';
  for(const m of ms)m.away=id;S.disp.push({id,ids:ms.map(m=>m.id),end:S.day+x.days,lv:av});return null;}
function settleDispatch(){const out=[];if(!S.disp)return out;S.disp=S.disp.filter(d=>{if(S.day<d.end)return true;const x=dispatchOf(d.id);const ms=d.ids.map(mercById).filter(Boolean);
    const r={n:x.n,ic:x.ic,gold:0,ore:{},ups:[]};const inc=D.TIER[curTier()].inc;r.gold=Math.round(inc*x.gold*rnd(.9,1.15)*Math.max(1,econMul()*.6)*goldMulOf(ms)/10)*10;addGold(r.gold);
    for(const m of ms){m.away=null;const ups=gainExp(m,expNeed(m.lv)*x.exp*.3);if(ups)r.ups.push(m.name+' Lv.'+m.lv);}
    if(x.ore)for(const k in x.ore){const n=ri(x.ore[k][0],x.ore[k][1]);if(n){S.ores[k]=(S.ores[k]||0)+n;r.ore[k]=n;}}
    out.push(r);return false;});return out;}
function goldMulOf(ms){let g=0;for(const m of ms){g+=(D.PERS[m.pers]||{}).gold||0;const nd=namedOf(m);if(nd&&nd.gold)g+=nd.gold;}return 1+Math.min(.3,g);}
function canFight(m){return m.status==='ok'&&!m.instructor&&!m.away;}
// 출전 인원: 등급이 오를수록 늘어난다 (F·E 3 · D 4 · C 5 · B 이상 6명 + 단장)
function partyMax(){return [3,5,8,12,16,20,20][Math.min(6,rankIdx(S.rank))];}
// 경제 배율: 출전 인원이 늘수록 전투·상자 금화도 커진다 (20인 체제 유지비를 감당하도록)
function econMul(){return Math.max(1,(partyMax()+1)/5);}
function partyUnits(){return [S.leader,...S.party.map(mercById).filter(m=>m&&canFight(m)).slice(0,partyMax())];}

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
    if(H2.includes(cls)){for(const k of ['atk','mag'])if(it.st[k])it.st[k]=Math.round(it.st[k]*1.3);it.h2=1;}
    const V=D.WVAR[cls],vi=ri(0,V.ic.length-1),ic=V.ic[vi];it.ic=(D.WB(Math.min(4,rar+(ti>=4?1:0)))+ic[0])*16+ic[1];it.name=(ti===0&&vi===0?W.names[0]:D.WMAT[ti]+' '+V.nm[vi]);}
  else if(slot==='arm'){cls=cls||pick(Object.keys(D.ARMS));const A=D.ARMS[cls];it.cls=cls;
    it.st.def=Math.round((3+lv*1.0)*m*A.m.def);it.st.hp=Math.round((12+lv*5)*m*A.m.hp);
    if(A.m.eva)it.st.eva=A.m.eva>0?A.m.eva+rar:A.m.eva;if(A.m.mag)it.st.mag=Math.round((2+lv*.8)*m);
    gvar(it,cls,ti);}
  else{if(slot==='off')cls='shield';cls=cls||pick(Object.keys(D.ACCS));const A=D.ACCS[cls];it.cls=cls;it.slot=cls==='shield'?'off':'acc';
    const f={atk:(2+lv*.6)*m,crit:2+lv*.08+rar,def:(2+lv*.5)*m,hp:(10+lv*4)*m,mag:(2+lv*.7)*m,spd:1+lv*.04+rar*.3,eva:1+lv*.1+rar*.5};
    if(cls==='shield'){f.def*=1.4;f.hp*=1.3;}
    for(const k of A.st)it.st[k]=k==='spd'||k==='crit'||k==='eva'?Math.round(f[k]*10)/10:Math.round(f[k]);
    gvar(it,cls,ti);}
  addAffix(it,lv,rar,m);
  it.val=Math.round(D.priceRef(lv)*[.3,.5,.9,1.6,3][rar]);
  return it;}
function gvar(it,cls,ti){const V=D.GVAR[cls];if(!V)return;const pool=V.ic[Math.min(4,ti)],c=pick(pool);it.ic=c[0]*16+c[1];it.name=V.mat[ti]+' '+pick(V.nm);}
// 옵션: 희귀(2) 이상 앞말, 영웅(3) 이상 뒷말. 고급(1)은 40%로 앞말
function affVal(k,lv,m){const f={atk:(2+lv*.6)*m,crit:2+lv*.08,def:(2+lv*.5)*m,hp:(10+lv*4)*m,mag:(2+lv*.7)*m,spd:1+lv*.04,eva:1+lv*.1}[k]*.55;return k==='spd'||k==='crit'||k==='eva'?Math.round(f*10)/10:Math.max(1,Math.round(f));}
function addAffix(it,lv,rar,m){const add=(A)=>{const a=pick(A);it.st[a.k]=Math.round(((it.st[a.k]||0)+affVal(a.k,lv,m))*10)/10;return a.n;};
  let pre='',suf='';if(rar>=2||(rar===1&&Math.random()<.4))pre=add(D.AFFIX_PRE);if(rar>=3)suf=add(D.AFFIX_SUF);
  it.name=(suf?suf+' ':'')+(pre?pre+' ':'')+it.name;}
function genSetPiece(key,lv,slot){const Z=D.SETS[key],P=Z.p[slot];const it=genItem(lv,3,slot==='acc'&&P.cls==='shield'?'off':slot,P.cls);it.ic=P.ic;it.name=P.n;it.set=key;it.rar=3;return it;}
function setBonus(u){const cnt={},lv={};for(const s of SLOTS){const it=u.eq[s]&&itemById(u.eq[s]);if(it&&it.set){cnt[it.set]=(cnt[it.set]||0)+1;lv[it.set]=Math.max(lv[it.set]||0,it.lv);}}
  const st={};for(const k in cnt){const Z=D.SETS[k],f=1+lv[k]*.06;if(cnt[k]>=2)for(const q in Z.b2)st[q]=(st[q]||0)+Z.b2[q]*f;if(cnt[k]>=3)for(const q in Z.b3)st[q]=(st[q]||0)+Z.b3[q]*f;}return {st,cnt};}
// 스킬서: 사기·배우기·지우기
function leaderSkills(){const c=D.LCLASS[S.leader.cls];return c.skills.concat((S.leader.bsk||[]).filter(k=>D.SKILLS[k]));}
function bookPrice(k){return Math.round(D.priceRef(Math.max(5,S.leader.lv))*D.BOOKS[k].p/10)*10;}
function buyBook(k,price){if(S.gold<price)return '금화가 부족합니다';addGold(-price);S.books=S.books||{};S.books[k]=(S.books[k]||0)+1;save();return null;}
function learnBook(k,mid){const B=D.BOOKS[k];S.books=S.books||{};if(!(S.books[k]>0))return '스킬서가 없습니다';
  if(B.who==='L'){const L=S.leader;L.learned=L.learned||[];if(L.learned.includes(k))return '이미 배운 스킬입니다';L.learned.push(k);L.bsk=L.bsk||[];if(L.bsk.length<2)L.bsk.push(k);}
  else{const m=mercById(mid);if(!m)return '용병을 골라 주세요';if(!B.who.includes(m.job))return D.JOBS[m.job].n+'은(는) 배울 수 없는 스킬입니다';m.sk2=k;}
  S.books[k]--;save();return null;}
function equipBook(k){const L=S.leader;L.bsk=L.bsk||[];if(L.bsk.includes(k)){L.bsk=L.bsk.filter(x=>x!==k);return null;}if(L.bsk.length>=2)return '추가 스킬 칸은 2개입니다. 하나를 먼저 빼세요';L.bsk.push(k);return null;}
function forgetSkill(k,mid){if(mid){const m=mercById(mid);if(m)m.sk2=null;}else{const L=S.leader;L.learned=(L.learned||[]).filter(x=>x!==k);L.bsk=(L.bsk||[]).filter(x=>x!==k);}save();}
function genUnique(key){const U=D.UNIQUE[key];const it={id:nid('i'),lv:U.lv,rar:4,slot:U.cls==='shield'?'off':U.slot==='acc'?'acc':U.slot,cls:U.cls,enh:0,st:Object.assign({},U.st),ic:U.ic,name:U.n,uniq:key,desc:U.d};
  it.val=Math.round(D.priceRef(U.lv)*3);return it;}
function rollRarity(bonus){const r=Math.random()*100-(bonus||0);return r<1.2?4:r<6?3:r<20?2:r<48?1:0;}
function canEquip(u,it){if(it.slot==='off'){const w=u.eq.wpn&&itemById(u.eq.wpn);return !(w&&H2.includes(w.cls));}return true;}
function equipWhy(u,it){if(it.slot==='off'){const w=u.eq.wpn&&itemById(u.eq.wpn);if(w&&H2.includes(w.cls))return '두손 무기를 들고 있어 방패를 낄 수 없습니다';}return null;}
function gearWarn(u,it){if(it.slot==='wpn'&&!wpnOk(u,it.cls))return '직업에 맞지 않는 무기 — 능력치 60%만 적용';if(it.slot==='off'&&!shieldOk(u))return '방패 숙련이 없는 직업 — 능력치 60%, 속도 -2';return null;}
function ownerOf(itemId){if(Object.values(S.leader.eq).includes(itemId))return S.leader;return S.mercs.find(m=>Object.values(m.eq).includes(itemId));}
function equip(u,itemId,slotHint){const it=itemById(itemId);if(!it||!canEquip(u,it))return false;
  const prev=ownerOf(itemId);if(prev)for(const s of SLOTS)if(prev.eq[s]===itemId)prev.eq[s]=null;
  let s=it.slot;if(s==='acc')s=slotHint||(!u.eq.acc1?'acc1':!u.eq.acc2?'acc2':'acc1');
  u.eq[s]=itemId;if(s==='wpn'&&H2.includes(it.cls))u.eq.off=null;return true;}
function unequip(u,slot){u.eq[slot]=null;}
function sellItem(id){const it=itemById(id);if(!it||ownerOf(id))return 0;const v=Math.round(it.val*.25*(1+.15*(it.enh||0)));S.inv.splice(S.inv.indexOf(it),1);addGold(v);return v;}
// 강화: +10까지. 단계별 성공률과 광석(철→은→흑요석→화염 결정)
const ENH_RATE=[1,.95,.9,.8,.7,.6,.5,.4,.32,.25],ENH_ORE=[['iron',1],['iron',2],['iron',3],['silver',2],['silver',3],['silver',4],['obsid',2],['obsid',3],['flame',2],['flame',3]];
function enhCost(it){let c=it.val*.18*(1+(it.enh||0)*.6);if(S.camp.built.forge&&S.loc==='camp')c*=.85;return Math.round(c/10)*10;}
function enhNeed(it){const e=it.enh||0;return e>=10?null:{gold:enhCost(it),ore:ENH_ORE[e][0],n:ENH_ORE[e][1],rate:ENH_RATE[e]};}
function enhance(id){const it=itemById(id);if(!it||(it.enh||0)>=10)return '더 이상 강화할 수 없습니다';const q=enhNeed(it);if(S.gold<q.gold)return '금화가 부족합니다';
  S.ores=S.ores||{};if((S.ores[q.ore]||0)<q.n)return D.ORES[q.ore].n+'이(가) 부족합니다 ('+(S.ores[q.ore]||0)+'/'+q.n+')';
  addGold(-q.gold);S.ores[q.ore]-=q.n;const ok=Math.random()<q.rate;if(ok){it.enh=(it.enh||0)+1;if(it.enh>=8)chron(`장비 +${it.enh} 강화 성공`);}return ok?'ok':'fail';}
function addOre(k,n){S.ores=S.ores||{};S.ores[k]=(S.ores[k]||0)+n;}
// 자동 장착: 직업에 맞는 미장착 장비 중 가장 좋은 것(가치×강화)으로 바꾼다. 출전 파티 → 대기 용병 순
function itemScore(it){return (it.val||0)*(1+.08*(it.enh||0));}
function autoEquip(units){units=units||[S.leader,...S.party.map(mercById).filter(Boolean),...S.mercs.filter(m=>!S.party.includes(m.id))];let n=0;
  for(const u of units){if(!u)continue;for(const sl of SLOTS){const want=sl.startsWith('acc')?'acc':sl;if(sl==='off'&&!shieldOk(u))continue;
      const cur=u.eq[sl]&&itemById(u.eq[sl]);const cands=S.inv.filter(i=>i.slot===want&&!ownerOf(i.id)&&canEquip(u,i)&&(want!=='wpn'||wpnOk(u,i.cls)));if(!cands.length)continue;
      const best=cands.sort((a,b)=>itemScore(b)-itemScore(a))[0];if(!cur||itemScore(best)>itemScore(cur)*1.001||(want==='wpn'&&!wpnOk(u,cur.cls))){if(equip(u,best.id,sl.startsWith('acc')?sl:null)!==false)n++;}}}
  return n;}
function invFull(){return S.inv.filter(i=>!ownerOf(i.id)).length>=40;}
function addItem(it){if(invFull()){addGold(Math.round(it.val*.25));return false;}S.inv.push(it);return true;}

/* ---------------- 던전 지도 (분기형 노드) ---------------- */
function dungOpen(dk){const d=D.DUNG[dk];if(!d)return false;
  if(d.campTier)return S.camp.tier>=d.campTier;
  if(d.town!=='abyss'&&!townOpen(d.town))return false;
  if(d.rank&&rankIdx(S.rank)<rankIdx(d.rank))return false;
  if(d.unlock&&D.SUBS[d.unlock]){const q=D.SUBS[d.unlock];const prev=Object.keys(D.SUBS).find(k=>D.SUBS[k].town===q.town&&D.SUBS[k]===D.SUBS[q.req]);const need=q.req||d.unlock;if(!(S.subs[need]&&S.subs[need].state==='claimed'))return false;}
  else if(d.unlock){const i=D.MAIN.findIndex(m=>m.id===d.unlock);if(S.main<i)return false;}
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
  // 새 장식 (깃발·선반·무기대·흉상·해골) — 방 종류에 맞게
  const busy=(x,y)=>props.some(p=>p.x===x&&p.y===y)||torches.some(t=>t.x===x&&t.y===y);
  for(const r of rooms){if(OUTDOOR[d.theme])break;
    for(let x=r.x+2;x<r.x+r.w-1;x+=3)if(!cells[at(x,r.y-1)]&&!busy(x,r.y-1)&&R()<.55)props.push({x,y:r.y-1,k:rp(['banr','banb','banr2']),wall:1});
    const extra=r.t==='shop'?['shelf1','shelf2','shelf3','sacks']:r.t==='chest'?['rack1','rack2','rack3','barrel2']:r.t==='boss'?['dskull','bust1','bust3','skull2']:r.t==='camp'?['sacks','barrel3','shelf1']:r.t==='elite'?['rack3','bust2','skull']:['bust1','barrel2','rack1','skull','bust2'];
    const k=r.t==='battle'?(R()<.5?1:0):2;
    for(let i=0;i<k;i++){const x=rr(r.x+1,r.x+r.w-2),y=r.y;if(busy(x,y)||Math.abs(x-r.cx)<=1)continue;
      const nearCorr=[[0,-1],[1,0],[-1,0]].some(([a,b])=>{const X=x+a,Y=y+b;return cells[at(X,Y)]&&!(X>=r.x&&X<r.x+r.w&&Y>=r.y&&Y<r.y+r.h);});if(nearCorr)continue;
      props.push({x,y,k:rp(extra),solid:true,big:1});}}
  const sr=room(start);
  return {dk,seed,w:W,h:H,cells,rooms,traps,props,torches,start:{x:sr.cx,y:sr.cy},theme:d.theme,outdoor:!!OUTDOOR[d.theme]};}
function roomById(id){const r=S.run;return r&&r.dg?r.dg.rooms.find(x=>x.id===id):null;}

/* ---------------- 적 생성 ---------------- */
function monStats(def,lv,kind){const s=def.s,f=1.08+.012*lv;
  const st={hp:100*(1+.115*(lv-1))*s[0]*f,atk:23*(.76+.024*Math.min(lv,10))*(1+.2*(lv-1))*s[1]*f,mag:23*(.76+.024*Math.min(lv,10))*(1+.2*(lv-1))*s[2]*f,def:7*(1+.12*(lv-1))*s[3]*f,spd:(27+lv*.22)*s[4],crit:5,eva:4};
  if(kind==='elite'){st.hp*=1.8;st.atk*=1.18;st.mag*=1.18;st.def*=1.1;}
  for(const k of ['hp','atk','mag','def'])st[k]=Math.round(st[k]);return st;}
function makeEnemy(key,lv,kind){const def=D.BOSS[key]||D.MON[key];const st=monStats(def,lv,kind);
  return {key,name:(kind==='elite'?'정예 ':'')+def.n,lv,st,spr:def.spr,tint:def.tint,scale:(def.scale||1)*(kind==='elite'?1.18:1),role:def.role,sk:def.sk,tro:def.tro,boss:!!D.BOSS[key],elite:kind==='elite'};}
const BAL={ex:.35,eh:.14,bh:.15,slam:.7,si:8};
function genEnemies(dk,node){const d=D.DUNG[dk];const F=d.floors;const prog=node.l/(F-1);const BL=BAL,pq=Math.max(0,partyMax()-4),ex=Math.round(pq*BL.ex);
  const lv=Math.round(d.lv[0]+(d.lv[1]-d.lv[0])*prog);const out=[];
  if(node.t==='boss'){out.push(makeEnemy(d.boss,d.lv[1]+1,'boss'));if(d.boss2)out.push(makeEnemy(d.boss2,d.lv[1]+1,'boss'));
    const n=(d.boss2?1:d.tier===1?1:2)+ex;for(let i=0;i<n;i++)out.push(makeEnemy(pick(d.pool),d.lv[1]));
    // 보스는 출전 인원만큼 단단해진다 (20명이 때려도 버티도록)
    for(const e of out)if(e.boss){const k=1+pq*BL.bh;e.st.hp=Math.round(e.st.hp*k);e.pq=pq;e.st.def=Math.round(e.st.def*(1+pq*.02));}}
  else if(node.t==='elite'){const el=makeEnemy(pick(d.elite),lv+1,'elite');el.st.hp=Math.round(el.st.hp*(1+pq*BL.eh));out.push(el);const n=ri(1,2)+ex;for(let i=0;i<n;i++)out.push(makeEnemy(pick(d.pool),lv));}
  else{const n=(node.l<=1?ri(2,3):ri(3,4)+(d.tier>=3&&Math.random()<.3?1:0))+ex;for(let i=0;i<Math.min(16,n);i++)out.push(makeEnemy(pick(d.pool),lv+(Math.random()<.25?1:0)));}
  out.extra=Math.min(out.length-1,ex);return out;}
function examEnemies(ek){const e=D.EXAMS[ek];const out=[];if(e.boss)out.push(makeEnemy(e.boss,e.lv+1,'boss'));for(const a of e.adds)out.push(makeEnemy(a,e.lv));return out;}

/* ---------------- 전투 엔진 ---------------- */
// 순서: 행동 게이지가 찬 유닛이 하나씩 행동(연출 중에는 시간 정지) → 읽기 쉬운 하이브리드 오토배틀
class Battle{
  constructor(enemies,opt){opt=opt||{};this.opt=opt;this.t=0;this.units=[];this.ev=[];this.over=0;this.focus=null;
    this.auto=!!S.flags.leaderAuto;this.wait=null;this.speed=S.flags.bspeed||1;this.kills=[];this.log=[];
    const pu=opt.allies||partyUnits();let fi=0,bi=0;const BM=this.mods=battleMods(pu.filter(u=>u!==S.leader&&u.job));
    for(const u of pu){const isL=u===S.leader;const st=Object.assign({},statsOf(u)),hb=st.hp;for(const x of BM)applyMod(st,x.mod,x.mul);roundStats(st);const row=isL?D.LCLASS[u.cls].row:D.JOBS[u.job].row;
      const hp0=opt.full||u.hp==null?st.hp:Math.min(st.hp,Math.round(u.hp*st.hp/hb));if(hp0<=0)continue;
      this.units.push({side:0,ref:u,isL,name:u.name,st,lv:u.lv,maxHp:st.hp,hp:hp0,hb,row,slot:row==='front'?fi++:bi++,g:Math.random()*40,sp:isL?0:20,
        sk:isL?null:(u.sk2||D.JOBS[u.job].skill),cds:{},buffs:[],shield:0,look:u.look,job:isL?null:u.job,cls:isL?u.cls:null,atkType:isL?D.LCLASS[u.cls].atkType:D.JOBS[u.job].atkType,heal:!isL&&D.JOBS[u.job].heal,downedOnce:false,key:isL?'L':u.id,coward:!isL&&u.pers==='coward',undying:!isL&&!!(namedOf(u)||{}).undying,named:!isL&&u.named||null});}
    // 진형: 3줄(전열·중열·후열) × cols칸. 출전 인원이 많을수록 칸이 늘어난다. 저장된 자리 "줄:칸" 우선
    {const al=this.units.filter(x=>x.side===0);const C=this.cols=Math.max(3,Math.ceil(al.length/3));const F=S.formation||{},used=new Set();
      const ord=r=>{const o=[];const mid=(C-1)/2;const cs=[...Array(C).keys()].sort((a,b)=>Math.abs(a-mid)-Math.abs(b-mid));for(const c of cs)o.push(r*C+c);return o;};
      for(const u of al){const v=F[u.key];if(typeof v==='string'){const [r,c]=v.split(':').map(Number);const k=r*C+c;if(r>=0&&r<3&&c>=0&&c<C&&!used.has(k)){u.cell=k;used.add(k);}}}
      for(const u of al){if(u.cell!=null)continue;const pref=u.row==='front'?[...ord(0),...ord(1),...ord(2)]:[...ord(2),...ord(1),...ord(0)];const c=pref.find(k=>!used.has(k));u.cell=c;used.add(c);}
      for(const u of al)u.row=Math.floor(u.cell/C)===0?'front':'back';}
    this.obst=opt.obst||[];this.extraEn=enemies.extra||0;
    this.prep=!opt.sim&&!opt.watch&&!S.flags.quickStart;
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
  // 실시간 전투: 모든 유닛이 자기 행동 게이지(속도)대로 동시에 움직인다
  update(dt){if(this.over||this.prep)return;dt*=this.speed;this.t+=dt;
    for(const u of this.units){if(u.hp<=0)continue;u.buffs=u.buffs.filter(b=>(b.t-=dt)>0);
      for(const k in u.cds)u.cds[k]=Math.max(0,u.cds[k]-dt);
      const bl=u.buffs.find(b=>b.k==='bleed');if(bl){u.bleedAcc=(u.bleedAcc||0)+dt;if(u.bleedAcc>=1){u.bleedAcc=0;this.hurt(null,u,Math.max(1,Math.round(u.maxHp*bl.v)),{dot:true});}}}
    for(const u of this.units){if(u.hp<=0||this.over)continue;
      if(u.act){u.act.t+=dt;this.stepAct(u.act);continue;}
      if(u.eng){const e=u.eng;if(e.hp<=0)u.eng=null;
        else if(!(e.eng===u&&u.side===1)){const [tx,ty]=this.engPos(u,e);const k=Math.min(1,dt*5);u.x+=(tx-u.x)*k;u.y+=(ty-u.y)*k;}}
      else if(Math.abs(u.x-u.hx)+Math.abs(u.y-u.hy)>2){const k=Math.min(1,dt*3);u.x+=(u.hx-u.x)*k;u.y+=(u.hy-u.y)*k;}
      if(!this.bx){const hs=this.units;this.bx=[Math.min(...hs.map(q=>q.hx))-40,Math.max(...hs.map(q=>q.hx))+40,Math.min(...hs.map(q=>q.hy))-(hs.length>12?12:50),Math.max(...hs.map(q=>q.hy))+(hs.length>12?24:50)];}
      u.x=Math.max(this.bx[0],Math.min(this.bx[1],u.x));u.y=Math.max(this.bx[2],Math.min(this.bx[3],u.y));
      if(u.boss&&u.side===1&&this.alive(0).length>=6){u.aoeT=(u.aoeT||0)+dt;if(u.aoeT>=Math.max(4,BAL.si-(u.pq||0)*.25)){u.aoeT=0;this.bossSlam(u);}}
      if(this.has(u,'freeze'))continue;
      const r=u.st.spd*1.9*(this.has(u,'slow')?.5:1)*(this.has(u,'haste')?2:1);u.g+=r*dt;
      if(u.isL&&u.queued&&u.g>=35){u.g=100;}   // 스킬 예약 시 조금만 차도 바로 시전
      if(u.g>=100){u.g=0;this.begin(u);}}
    // 겹침 방지: 가까운 유닛끼리 살짝 밀어냄 (실시간 난전이 한 덩어리로 뭉치지 않게)
    const al=this.units.filter(q=>q.hp>0);for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){const p=al[i],q=al[j];const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||.01,min=p.side===q.side?46:36;
      if(d<min){const f=(min-d)/2*Math.min(1,dt*10),nx=dx/d,ny=(dy/d)||(i%2?.6:-.6);const pa=p.act&&p.act.t<.25,qa=q.act&&q.act.t<.25;if(!pa){p.x-=nx*f;p.y-=ny*f;}if(!qa){q.x+=nx*f;q.y+=ny*f;}}}
    for(const q of al)for(const o of this.obst){const dx=q.x-o.x,dy=q.y-o.y,d=Math.hypot(dx,dy)||.01,mn=o.r+16;if(d<mn){const f=(mn-d);q.x+=dx/d*f;q.y+=dy/d*f;}}
    this.checkEnd();}
  begin(u){let cmd;
    if(u.isL&&u.queued){const k=u.queued;u.queued=null;cmd=this.availSkills(u).includes(k)?{skill:k,target:this.focus&&this.focus.hp>0?this.focus:null}:null;}
    if(!cmd)cmd=u.isL?(this.auto||this.opt.sim?this.leaderAI(u):{target:this.pickTarget(u)}):this.ai(u);
    if(cmd.skill&&!cmd.target&&D.SKILLS[cmd.skill].t==='one')cmd.target=this.pickTarget(u,true);
    if(!cmd.target&&!cmd.skill&&!cmd.heal)return;
    this.start(u,cmd);}
  leaderAI(u){const es=this.alive(1);const sk=this.availSkills(u);
    for(const k of sk){const s=D.SKILLS[k];if(s.t==='all'&&es.length>=2)return {skill:k};if(s.t==='allies')return {skill:k};}
    for(const k of sk){const s=D.SKILLS[k];if(s.t==='one')return {skill:k,target:this.pickTarget(u,true)};}
    return {target:this.pickTarget(u)};}
  availSkills(u){if(!u.isL)return [];return leaderSkills().filter(k=>!(u.cds[k]>0)&&(!D.SKILLS[k].lv||S.leader.lv>=D.SKILLS[k].lv));}
  ai(u){const es=this.alive(1-u.side),fr=this.alive(u.side);
    if(u.sk&&u.sp>=100){return {skill:u.sk,target:this.pickTarget(u)};}
    if(u.heal){const low=fr.filter(x=>x.hp/x.maxHp<.6).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(low)return {heal:low};}
    return {target:this.pickTarget(u)};}
  pickTarget(u,strong){let es=this.alive(1-u.side);if(!es.length)return null;if(u.side===1){const nc=es.filter(x=>!x.coward);if(nc.length)es=nc;}
    if(u.side===0&&this.focus&&this.focus.hp>0&&(u.isL||Math.random()<.35))return this.focus;
    const crowd=t=>this.units.filter(o=>o!==u&&o.side===u.side&&o.hp>0&&((o.act&&o.act.tg===t)||o.eng===t)).length;
    const taunt=es.filter(x=>this.has(x,'taunt'));if(taunt.length&&u.side===1)return pick(taunt);
    if(u.atkType==='slash'||u.role==='melee'){const fr=es.filter(x=>x.row==='front');const pool=fr.length?fr:es;
      if(u.eng&&u.eng.hp>0&&pool.includes(u.eng)&&crowd(u.eng)<2)return u.eng;   // 붙어 있는 상대와 계속 싸움
      const sc=t=>Math.abs(t.y-u.y)/40+crowd(t)*1.3+Math.random()*.4;return pool.reduce((a,b)=>sc(a)<=sc(b)?a:b);}
    if(strong){const b=es.find(x=>x.boss);if(b)return b;}
    if(Math.random()<.3)return es.reduce((a,b)=>a.hp<b.hp?a:b);
    return pick(es);}
  leader(){return this.units.find(x=>x.isL&&x.hp>0);}
  // 단장 스킬 버튼: 쓸 수 있으면 다음 행동에 바로 시전 (예약)
  cast(k){const u=this.leader();if(!u||!this.availSkills(u).includes(k))return false;u.queued=k;if(!u.act)u.g=Math.max(u.g,99.9);return true;}
  moveCell(u,c){if(!this.prep||u.side!==0)return;const o=this.units.find(x=>x.side===0&&x.cell===c);if(o)o.cell=u.cell;u.cell=c;for(const x of this.units)if(x.side===0)x.row=Math.floor(x.cell/this.cols)===0?'front':'back';}
  begin_(){this.prep=false;S.formation=S.formation||{};for(const u of this.units)if(u.side===0)S.formation[u.key]=Math.floor(u.cell/this.cols)+':'+(u.cell%this.cols);save();}
  setFocus(e){if(e&&e.side===1&&e.hp>0){this.focus=e;this.ev.push({k:'focus',u:e});}}
  start(u,cmd){const sk=cmd.skill?D.SKILLS[cmd.skill]:null;
    const melee=!sk?(u.atkType==='slash'):(sk.t==='one'||sk.t==='front2')&&u.atkType==='slash';
    const tg=cmd.target||(cmd.heal)||null;
    if(u.oy==null)u.oy=(Math.random()-.5)*36;
    u.act={u,cmd,sk,t:0,melee:melee&&tg&&tg!==u,tg,hit:false,dur:melee?.62:.6,oy:u.oy,sx:u.x,sy:u.y};if(!(melee&&tg&&tg!==u))u.eng=null;
    if(sk){this.ev.push({k:'skill',u,name:sk.n});if(u.isL)u.cds[cmd.skill]=sk.cd*(1-(u.st.cdr||0));else u.sp=0;}
    u.anim='attack';u.at=0;}
  // 근접 공격 위치: 같은 적에게 붙은 아군끼리 옆으로 나란히 선다
  engPos(u,e){const o=this.offFn?this.offFn(u):{x:(u.side===0?-62:62),y:0};
    const att=this.units.filter(q=>q.side===u.side&&q.hp>0&&(q===u||q.eng===e||(q.act&&q.act.melee&&q.act.tg===e))).sort((p,q)=>this.units.indexOf(p)-this.units.indexOf(q));
    const n=att.length,i=Math.max(0,att.indexOf(u)),lat=(i-(n-1)/2)*42;
    return o.x===0?[e.x+lat,e.y+o.y]:[e.x+o.x,e.y+lat];}
  stepAct(a){const u=a.u;
    if(a.melee&&a.tg){const [tx,ty]=this.engPos(u,a.tg);
      const far=Math.hypot(tx-a.sx,ty-a.sy)>20,mv=far?.22:0,p=mv?Math.min(1,a.t/mv):1;
      if(a.t<mv){u.x=a.sx+(tx-a.sx)*p;u.y=a.sy+(ty-a.sy)*p;u.anim='walk';}
      else{u.x=tx;u.y=ty;if(u.anim!=='attack'&&u.anim!=='hurt'){u.anim='attack';u.at=0;}}
      if(!a.hit&&a.t>=mv+.18){a.hit=true;this.resolve(a);}
      if(a.t>=a.dur+mv){u.eng=a.tg.hp>0?a.tg:null;if(u.anim==='walk')u.anim=null;u.act=null;}return;}
    else{if(!a.hit&&a.t>=.3){a.hit=true;this.resolve(a);}}
    if(a.t>=a.dur){if(u.anim==='walk')u.anim=null;u.act=null;}}
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
    if(this.obst.length&&(u.atkType==='bow'||u.atkType==='magic'||st==='mag')&&this.covered(u,tg)){dmg*=.6;this.ev.push({k:'cover',u:tg});}
    dmg=Math.max(1,Math.round(dmg));this.hurt(u,tg,dmg,{crit,type:st});
    if(o.bleed&&tg.hp>0)tg.buffs.push({k:'bleed',v:o.bleed,t:o.dur||6});
    if(u.isL&&D.LCLASS[u.cls].passive==='bloodthirst')this.healU(u,u,Math.round(dmg*.15),true);}
  // 보스 광역기: 아군이 많을수록 자주 맞는다. 가장 붐비는 곳을 중심으로 반경 안 모두에게 피해
  bossSlam(u){const al=this.alive(0);if(!al.length)return;let best=al[0],bc=0;for(const a of al){const c=al.filter(b=>Math.hypot(a.x-b.x,a.y-b.y)<170).length;if(c>bc){bc=c;best=a;}}
    const R=160+(u.pq||0)*4,st=Math.max(u.st.atk,u.st.mag);this.ev.push({k:'fx',fx:'blast',tg:best,u,all:false});this.ev.push({k:'slam',u,x:best.x,y:best.y,r:R});
    for(const a of al)if(Math.hypot(a.x-best.x,a.y-best.y)<R){const def=this.eff(a,'def'),K=30+5*(u.lv||1);const dmg=Math.max(1,Math.round(st*BAL.slam*K/(K+def)*rnd(.9,1.1)));this.hurt(u,a,dmg,{type:'atk'});}}
  // 엄폐: 공격자와 대상 사이 선분 가까이에 장애물이 있으면 원거리·마법 피해 감소
  covered(u,tg){for(const o of this.obst){const ax=u.x,ay=u.y,bx=tg.x,by=tg.y,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1;let t=((o.x-ax)*dx+(o.y-ay)*dy)/L;if(t<.15||t>.92)continue;const px=ax+dx*t,py=ay+dy*t;if(Math.hypot(o.x-px,o.y-py)<o.r+6)return true;}return false;}
  hurt(u,tg,dmg,o){
    // 수호 기사: 아군 피해 일부 대신 받기
    if(tg.side===0&&!tg.isL){const g=this.units.find(x=>x.isL&&x.hp>0&&D.LCLASS[x.cls].passive==='bulwark');if(g&&g!==tg){const p=Math.round(dmg*.2);dmg-=p;g.hp=Math.max(1,g.hp-p);}}
    if(tg.shield>0){const a=Math.min(tg.shield,dmg);tg.shield-=a;dmg-=a;if(a)this.ev.push({k:'shield',u:tg,v:a});}
    const real=Math.min(tg.hp,dmg);tg.mT=(tg.mT||0)+real;if(u)u.mD=(u.mD||0)+real;
    tg.hp=Math.max(0,tg.hp-dmg);this.ev.push({k:'dmg',u:tg,v:dmg,crit:o.crit,dot:o.dot,exec:o.exec,type:o.type});tg.hitT=.25;tg.anim='hurt';tg.at=0;
    if(!tg.isL&&tg.sk)tg.sp=Math.min(100,(tg.sp||0)+8);
    if(tg.hp<=0&&tg.undying&&!tg.revived){tg.revived=true;tg.hp=Math.round(tg.maxHp*.4);this.ev.push({k:'heal',u:tg,v:tg.hp});this.ev.push({k:'txt',u:tg,txt:'불굴!'});}
    if(tg.hp<=0){tg.act=null;tg.anim='death';tg.at=0;tg.buffs=[];this.ev.push({k:'down',u:tg});if(tg.side===1)this.kills.push(tg.ref);if(this.focus===tg)this.focus=null;}}
  healU(u,tg,amt,quiet){if(tg.hp<=0)return;const h=Math.min(tg.maxHp-tg.hp,amt);tg.hp+=h;if(u)u.mH=(u.mH||0)+h;if(!quiet||h>5)this.ev.push({k:'heal',u:tg,v:h});}
  checkEnd(){if(this.over)return;if(!this.alive(1).length)this.over=1;else if(!this.alive(0).length)this.over=2;
    if(this.over){for(const u of this.units)if(u.act&&u.hp>0){u.act=null;u.x=u.hx;u.y=u.hy;}this.ev.push({k:'end',win:this.over===1});}}
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
  for(const bu of b.units)if(bu.side===0){bu.ref.hp=bu.hb&&bu.maxHp?Math.round(bu.hp*bu.hb/bu.maxHp):bu.hp;
    // 쓰러짐 기록: 진 싸움은 항상, 이긴 싸움은 30%만 (대규모 전투에서 '잠깐 기절'까지 모두 상처로 남지 않게)
    if(bu.hp<=0&&!bu.isL&&!r.fallen.includes(bu.ref.id)&&(b.over!==1||Math.random()<.3)){r.fallen.push(bu.ref.id);bu.ref.falls++;applyFallStatus(bu.ref);} }
  const out={win,gold:0,exp:0,tro:[],items:[],fame:0,lvups:[]};
  // 처치 보상 (전멸이어도 쓰러뜨린 적 몫은 계산)
  const d=r.dk?D.DUNG[r.dk]:null,inc=d?D.TIER[d.tier].inc*d.dm:0;
  let xp=0;for(const e of b.kills){xp+=(1.6*Math.pow(e.lv,1.5)+3)*.7;
    r.kills[e.key]=(r.kills[e.key]||0)+1;
    if(e.tro&&Math.random()<.6){const t=e.tro;r.loot.tro[t]=(r.loot.tro[t]||0)+1;out.tro.push(t);}}
  if(win){const kind=node?node.t:'special';
    if(d){out.gold=Math.round(inc*(kind==='boss'?.25:kind==='elite'?.16:.075)*rnd(.85,1.15)*econMul()*goldMul());
      out.fame=Math.round((kind==='boss'?18:kind==='elite'?6:1.9)*D.TIER[d.tier].fameMul);
      const dropP=kind==='boss'?1:kind==='elite'?.4:.12;
      if(Math.random()<dropP){const lv=b.units.find(u=>u.side===1).lv||d.lv[1];const it=genItem(lv,rollRarity(kind==='boss'?18:kind==='elite'?8:0),pick(['wpn','arm','acc']));r.loot.items.push(it);out.items.push(it);}
      if(kind==='boss'){r.bossDown=true;const tw=d.town||'t4';const sk=Object.keys(D.SETS).find(k=>D.SETS[k].town===tw);if(sk&&Math.random()<.22){const sp=genSetPiece(sk,d.lv[1]+1,pick(['wpn','arm','acc']));r.loot.items.push(sp);out.items.push(sp);}const it2=Math.random()<.5?genItem(d.lv[1]+1,rollRarity(10),pick(['wpn','arm','acc'])):null;if(it2){r.loot.items.push(it2);out.items.push(it2);}}
      if(kind==='elite')r.elites++;
      if(kind==='boss'&&Math.random()<.15&&addMapPiece())out.mapPiece=true;
      if(Math.random()<(kind==='boss'?1:kind==='elite'?.5:.18)){const n=kind==='boss'?2:1;addIngr('beast',n);out.ingr=(out.ingr||0)+n;}}
    r.loot.gold+=out.gold;r.fame+=out.fame;}
  // 경험치: 출전 인원 때문에 늘어난 적 몫은 나눠서 (레벨 속도는 인원과 상관없이 비슷하게)
  {const ne=b.units.filter(u=>u.side===1).length;if(b.extraEn&&ne)xp*=(ne-b.extraEn)/ne;}
  // 경험치: 살아남은 인원 100%, 쓰러진 인원 50%
  out.exp=Math.round(xp);r.loot.exp+=out.exp;
  for(const bu of b.units)if(bu.side===0){const ups=gainExp(bu.ref,xp*(bu.hp>0?1:.5)*(bu.ref.lv>maxEnemyLv(b)+8?.15:bu.ref.lv>maxEnemyLv(b)+4?.45:1));if(ups){bu.ref.hp=Math.min(statsOf(bu.ref).hp,(bu.ref.hp||0)+(bu.hp>0?statsOf(bu.ref).hp*.15:0));out.lvups.push(bu.ref.name+' Lv.'+bu.ref.lv);}}
  // 훈련소: 대기 용병도 50%
  if(S.camp.built.training){for(const m of S.mercs)if(!S.party.includes(m.id)&&m.status==='ok')gainExp(m,xp*.5*(S.mercs.some(x=>x.instructor)?1.3:1));}
  return out;}
function maxEnemyLv(b){return Math.max(...b.units.filter(u=>u.side===1).map(u=>u.lv||1));}
function applyFallStatus(m){if(m.falls>=5&&!m.dis){m.dis=true;m.seq=true;S.log.push(m.name+' — 영구 장애 (전 능력치 -25%)');return 'dis';}
  if(m.falls>=3&&!m.seq){m.seq=true;S.log.push(m.name+' — 후유증 (속도 -15%)');return 'seq';}return null;}
function nodeEvent(node){const r=S.run,d=D.DUNG[r.dk],inc=D.TIER[d.tier].inc*d.dm,L=S.leader;
  if(node.t==='chest'){const g=Math.round(inc*.12*(1+L.INT*.01)*rnd(.8,1.2)*econMul()*goldMul());r.loot.gold+=g;r.chests++;let it=null;
    if(Math.random()<.3+L.INT*.006){it=genItem(d.lv[1],rollRarity(6+L.INT*.2),pick(['wpn','arm','acc']));r.loot.items.push(it);}
    const mp=Math.random()<.08&&addMapPiece();return {gold:g,item:it,mapPiece:mp};}
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
  if(r.dk){const c=S.stats.clears[r.dk]||0;if(c>=4)res.fame=Math.round(res.fame*(c>=8?.55:.75));}
  if(how==='clear'&&r.dk){const d=D.DUNG[r.dk];const bonus=Math.round(8*D.TIER[d.tier].fameMul);res.fame+=bonus;if(!S.stats.clears[r.dk])chron(`${d.n} 첫 정복 — ${D.BOSS[d.boss].n} 처치`);S.stats.clears[r.dk]=(S.stats.clears[r.dk]||0)+1;}
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
  if(S.feast&&!r.special){res.feastEnd=D.RECIPES[S.feast.k].n;S.feast=null;}
  if(!r.special)S.night=true;
  for(const u of [S.leader,...S.mercs])u.hp=null;
  S.run=null;S.loc=r.dk?(D.DUNG[r.dk].town==='abyss'?'t4':D.DUNG[r.dk].town):S.loc;if(S.loc==='run')S.loc='camp';
  save();return res;}
function nextDay(){const out={upkeep:upkeep(),tax:campTax()};const pay=Math.min(S.gold,out.upkeep);out.unpaid=out.upkeep-pay;addGold(-pay+out.tax);
  S.day++;for(const m of S.mercs){if(m.status==='inj'){m.injDays-=m.pers==='cheer'?2:1;if(m.injDays<=0){m.status='ok';m.injDays=0;}}}
  out.disp=settleDispatch();rivalTick();out.dailyDone=claimDailies();if(S.day-(S.dailyDay||0)>=5||!S.dailies.length)genDailies();return out;}
function restDay(){const res=nextDay();S.night=false;save();return res;}
function treat(id){const m=mercById(id);if(!m||m.status!=='inj')return '치료할 필요가 없습니다';const c=healCost(m);if(S.gold<c)return '금화가 부족합니다';addGold(-c);m.status='ok';m.injDays=0;return null;}

/* ---------------- 퀘스트 ---------------- */
function curMain(){return D.MAIN[S.main]||null;}
function genDailies(){S.dailyDay=S.day;const t=curTier();const open=Object.keys(D.DUNG).filter(k=>dungOpen(k)&&D.DUNG[k].tier>=Math.max(1,t-1)&&D.DUNG[k].town!=='abyss');
  if(!open.length)open.push('d_forest');const n=4+(S.camp.built.board?1:0);S.dailies=[];const used={};
  for(let i=0;i<n;i++){let tp=pick(D.DAILY);let tries=0;while(used[tp.type]&&tries++<6)tp=pick(D.DAILY);used[tp.type]=1;
    const dk=pick(open),c=Math.round(ri(tp.count[0],tp.count[1])*2.2);const tier=D.DUNG[dk].tier;
    S.dailies.push({type:tp.type,dk,count:c,prog:0,done:false,claimed:false,n:tp.n,goal:tp.goal(D.DUNG[dk].n,c),
      gold:Math.round(D.TIER[tier].inc*.28*rnd(.85,1.2)/10)*10,fame:Math.round(50*D.TIER[tier].fameMul)});}}
function claimDailies(){const out=[];for(const q of S.dailies)if(q.done&&!q.claimed){q.claimed=true;addGold(q.gold);addFame(q.fame);out.push(q);}return out;}
function progressQuests(r,how,res){const kills=Object.values(r.kills).reduce((a,b)=>a+b,0);
  for(const q of S.dailies){if(q.done)continue;
    if(q.type==='kill'&&r.dk===q.dk)q.prog+=kills;
    if(q.type==='elite'&&r.dk===q.dk)q.prog+=r.elites;
    if(q.type==='chest')q.prog+=r.chests;
    if(q.type==='clear'&&r.dk===q.dk&&r.bossDown)q.prog+=1;
    if(q.type==='floor')q.prog+=r.rooms;
    if(q.prog>=q.count){q.prog=q.count;q.done=true;}}
  res.daily=claimDailies();cqProgress(r,kills);
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
  if(q.type==='decor')s.prog=decorPts();if(q.type==='camp')s.prog=S.camp.tier;if(q.type==='hire')s.prog=S.mercs.length;if(s.prog>=q.count){s.prog=q.count;s.state='done';}}}
function acceptSub(k){if(!S.subs[k])S.subs[k]={state:'active',prog:0};subCheck();}
function claimSub(k){const s=S.subs[k],q=D.SUBS[k];if(!s||s.state!=='done')return null;s.state='claimed';chron(`${D.TOWNS[q.town].n} 의뢰 「${q.n}」 해결 (${q.npc})`);const rw=q.reward,got=[];
  if(rw.gold){addGold(rw.gold);got.push(fmt(rw.gold)+' G');}
  if(rw.item){S.cons[rw.item]=(S.cons[rw.item]||0)+1;got.push(D.CONSUM[rw.item].n);}
  if(rw.uniq){const it=genUnique(rw.uniq);addItem(it);got.push(it.name);}
  if(rw.decor){S.camp.decor.push(rw.decor);got.push('장식: '+D.DECOR[rw.decor].n);}
  addFame(60*D.TIER[D.TOWNS[q.town].tier].fameMul);S.towns[q.town].rep+=15;return got;}
let mainDone=[];  // 방금 끝난 메인 단계 (ui가 대사 표시)
function advanceMain(){const m=curMain();if(!m)return;mainDone.push(m);S.main++;{const tw=(m.at||'').split(':')[0]||(m.d&&D.DUNG[m.d]&&D.DUNG[m.d].town);const tr=D.TOWNS[tw]?D.TOWNS[tw].tier:Math.max(1,rankIdx(S.rank));addFame(30*D.TIER[Math.min(4,tr)].fameMul);}
  if(m.id==='m2_5'){const g=genMerc(Math.max(18,Math.round(avgLv())),{grade:3,pot:2,pers:'loyal',job:'guard',name:'가렛',sex:'m',hair:'shorthair',hc:4});
    if(S.mercs.length>=maxRoster())S.flags.garretWait=true;S.mercs.push(g);const w=genItem(g.lv,2,'wpn','sword');S.inv.push(w);equip(g,w.id);const a=genItem(g.lv,2,'arm','heavy');S.inv.push(a);equip(g,a.id);
    if(S.party.length<partyMax())S.party.push(g.id);}
  if(m.id==='m5_6'){const a=genMerc(Math.max(46,Math.round(avgLv())),{grade:3,pot:2,pers:'loyal',job:'warrior',name:'아르칸',sex:'m',hair:'shorthair',hc:6});S.mercs.push(a);const w=genItem(a.lv,4,'wpn','sword');w.name='다시 벼린 맹약의 검';S.inv.push(w);equip(a,w.id);const ar=genItem(a.lv,3,'arm','heavy');S.inv.push(ar);equip(a,ar.id);if(S.party.length<4)S.party.push(a.id);chron('전대 단장 아르칸이 깨어나 맹약단에 합류');}
  if(m.id==='m4_8')chron('아버지의 편지 — 맹약단이 무너진 진짜 이유를 알게 되다');if(m.id==='m4_11')chron('피라미드 벽화 — 발테르와 심연 교단의 관계가 드러나다');if(m.id==='m3_8')chron('세계수의 맹약 — 맹약단은 봉인의 수호자였다');
  if(m.id==='m5_3'){S.rank='S';S.ending=true;}
  if(!S.dailies||!S.dailies.length)genDailies();}
function checkMain(){let m=curMain();let guard=0;
  while(m&&guard++<5){let ok=false;
    if(m.type==='hire')ok=partyUnits().length>=m.count;
    if(m.type==='camp')ok=S.camp.tier>=m.tier;
    if(!ok)break;advanceMain();m=curMain();}
  subCheck();}
function examReady(){const m=curMain();if(!m||m.type!=='exam')return null;const p=D.PROMO[S.rank];return {exam:m.exam,fame:p.fame,ok:S.fame>=p.fame,town:D.EXAMS[m.exam].town};}
function passExam(ek){const m=curMain();if(m&&m.type==='exam'&&m.exam===ek){const p=D.PROMO[S.rank];S.rank=p.next;chron(`${S.rank}등급 승급!`);S.flags.celebrate=S.rank;for(const k in D.TOWNS)if(D.TOWNS[k].req===S.rank&&!['t1','t2','t3','t4'].includes(k))chron(`새 지역 「${D.TOWNS[k].n}」 가는 길이 열렸다`);advanceMain();checkMain();return true;}return false;}
function talkMain(place){const m=curMain();if(m&&m.type==='talk'&&m.at===place){advanceMain();checkMain();return m;}return null;}


/* ---------------- 대륙 의뢰 ---------------- */
function contOf(tk){return D.TOWNS[tk]&&D.TOWNS[tk].east?'east':'west';}
function cqCur(c){S.cq=S.cq||{};const st=S.cq[c]||(S.cq[c]={i:0,state:null,prog:0});const q=D.CQ[c].steps[st.i];return q?{q,st}:null;}
function cqOk(q){return rankIdx(S.rank)>=rankIdx(q.rank||'F');}
function cqAccept(c){const x=cqCur(c);if(!x||x.st.state)return;x.st.state='active';x.st.prog=0;}
function cqClaim(c){const x=cqCur(c);if(!x)return null;const {q,st}=x;if(!(st.state==='done'||(q.type==='deliver'&&st.state==='active')))return null;
  const rw=q.reward||{},got=[];if(rw.gold){addGold(rw.gold);got.push(fmt(rw.gold)+' G');}if(rw.item){S.cons[rw.item]=(S.cons[rw.item]||0)+1;got.push(D.CONSUM[rw.item].n);}if(rw.decor){S.camp.decor.push(rw.decor);got.push('장식: '+D.DECOR[rw.decor].n);}
  const tw=q.type==='deliver'?q.to:q.town;addFame(45*D.TIER[Math.min(4,D.TOWNS[tw].tier||1)].fameMul);
  for(const k in D.TOWNS)if(contOf(k)===c&&S.towns[k])S.towns[k].rep=(S.towns[k].rep||0)+(st.i===D.CQ[c].steps.length-1?120:25);got.push((c==='west'?'서방':'동방')+' 모든 마을 호감 ↑');
  chron(`대륙 의뢰 「${D.CQ[c].n}」 — ${q.n} 완료`);st.i++;st.state=null;st.prog=0;S.cqDone=S.cqDone||{};S.cqDone[c]=st.i;return got;}
function cqProgress(r,kills){for(const c in D.CQ){const x=cqCur(c);if(!x||x.st.state!=='active')continue;const {q,st}=x;
  if(q.type==='kill'&&r.dk===q.d)st.prog+=kills;if(q.type==='elite'&&r.dk===q.d)st.prog+=r.elites||0;if(q.type==='clear'&&r.dk===q.d&&r.bossDown)st.prog+=1;if(q.type==='trophy')st.prog+=(r.loot.tro[q.tro]||0);
  if(st.prog>=q.count){st.prog=q.count;st.state='done';}}}
/* ---------------- 집결지 ---------------- */
function buildable(){const out=[];for(const k in D.BUILDS){const b=D.BUILDS[k];if(b.tier<=S.camp.tier&&!S.camp.built[k])out.push(k);}return out;}
function build(k){const b=D.BUILDS[k];if(!b||S.camp.built[k])return '이미 지었습니다';if(b.tier>S.camp.tier)return '집결지 단계가 부족합니다';
  if(S.gold<b.cost)return '금화가 부족합니다';addGold(-b.cost);S.camp.built[k]=true;checkMain();save();return null;}
function campNext(){const t=D.CAMP_TIERS[S.camp.tier+1];if(!t)return null;const n=t.need;
  const st={tier:S.camp.tier+1,name:t.n,reward:t.reward,rank:n.rank,rankOk:rankIdx(S.rank)>=rankIdx(n.rank),build:n.build.map(k=>[k,!!S.camp.built[k]]),decor:decorPts(),decorNeed:n.decor,cost:n.cost};
  st.ok=st.rankOk&&st.build.every(b=>b[1])&&st.decor>=n.decor&&S.gold>=n.cost;return st;}
function campUpgrade(){const st=campNext();if(!st||!st.ok)return '조건이 부족합니다';addGold(-st.cost);S.camp.tier++;chron(`집결지 ${S.camp.tier}단계 「${D.CAMP_TIERS[S.camp.tier].n}」 완성`);checkMain();save();return null;}
function decorPrice(k){return D.DECOR[k].price[S.camp.tier-1];}
function buyDecor(k){const p=decorPrice(k);if(!p)return '아직 살 수 없습니다';if(D.DECOR[k].big&&S.camp.decor.includes(k))return '풍차는 하나만 세울 수 있습니다';if(S.gold<p)return '금화가 부족합니다';if(S.camp.decor.length>=36)return '장식 자리가 가득 찼습니다';addGold(-p);S.camp.decor.push(k);subCheck();save();return null;}

/* ---------------- 대사 ---------------- */
function mercLine(m,place){const L=D.LINES[m.pers];let pool;
  if(m.instructor)pool=L.ins;else if(m.status==='inj')pool=L.inj;else if(m.dis)pool=L.dis;else if(m.seq)pool=L.seq;
  else{pool=L.ok.slice();if(place&&L[place])pool=pool.concat(L[place],L[place]);if(Math.random()<.3)pool=pool.concat(D.JOB_LINES[m.job]);if(D.GRADE_LINES[m.grade]&&Math.random()<.2)pool=pool.concat(D.GRADE_LINES[m.grade]);
    if(m.falls>=1&&m.falls<3&&Math.random()<.25)pool=['이 흉터 말이야? 지난번 던전에서 생긴 거야. 별거 아냐.'];}
  return pick(pool);}
function townLine(tk,role,mf){const T=D.TOWN_TALK[tk];if(!T)return '...';const a=attitude(tk);const r=Math.random();
  if(role==='folk'&&D.FESTIVALS[tk]){const F=D.FESTIVALS[tk];if(festOf(tk)&&r<.35)return '🎉 '+F.talk;if(festSoon(tk)&&r<.4)return pick(F.hint);}
  if(S.night&&role==='folk'&&r>.75)return pick(D.NIGHT.rumor);
  const pl=progressLines(tk);if(pl.length&&r<.2)return pick(pl);
  const c=contOf(tk);
  if(role==='folk'&&D.NOBLE_TALK[tk]&&(mf==='nobleman'||mf==='noblewoman'||mf==='queen')&&r<.8){const N=D.NOBLE_TALK[tk];return pick(N[Math.min(a,N.length-1)]);}
  if(role==='folk'){if(mf&&D.TYPE_TALK[mf]&&r<.32)return pick(D.TYPE_TALK[mf]);
    const pool=[];const L=T.folk||[];pool.push(...(L[Math.min(a,L.length-1)]||[]));const M=D.FOLK_MORE[tk];if(M)pool.push(...M[Math.min(a,M.length-1)]);
    const C=D.CONT_TALK[c];const cl=Math.min(3,Math.max(a,((S.cqDone||{})[c]||0)>=D.CQ[c].steps.length?3:a));if(C&&r<.75)pool.push(...C[cl]);
    return pick(pool.length?pool:['...']);}
  const L=T[role]||T.folk;const pool=[...(L[Math.min(a,L.length-1)]||[])];
  if(a>=2){const X=(role==='guard'?D.GUARD_MORE:D.MERCH_MORE)[tk];if(X)pool.push(...X);}
  return pick(pool.length?pool:['...']);}
// 진행 상황에 따라 바뀌는 소문 — 성장을 체감하게
function progressLines(tk){const L=[],cl=S.stats.clears||{},nm=S.leader.name;const bossTalk={d_forest:'숲길의 거대 슬라임이 사라졌대!',d_wolf:'늑대 소굴 우두머리가 쓰러졌다지?',d_camp:'야영지 산적 두목을 누가 잡았대.',d_mine:'제1갱도가 다시 열렸어!',d_goblin:'고블린 대장이 쫓겨났대!',d_crystal:'수정 동굴 깊은 곳까지 다녀온 용병단이 있대.',d_dock:'부두 창고 밀수꾼들이 싹 잡혔어.',d_wreck:'블랙솔트 해적선이 결국 무너졌대!',d_temple:'수몰된 신전의 괴물이 잠들었대.',d_sewer:'하수도 괴물 소리가 이제 안 들려.',d_waste:'황무지 추방자들이 잠잠해졌대.',d_fort:'타락한 기사단 요새가 함락됐대!',d_ruin:'고대 유적에서 살아 돌아온 사람들이 있대!',d_mist:'안개 협곡을 건넌 용병단이 있대.',d_nest:'용의 둥지... 진짜 용을 쓰러뜨렸대!!'};
  for(const k in cl)if(cl[k]&&bossTalk[k]&&D.DUNG[k]&&(D.DUNG[k].town===tk||D.DUNG[k].tier>=4))L.push(bossTalk[k]+' '+nm+' 단장 얘기 들었어?');
  const n=S.mercs.length;if(n>=8)L.push(`철혈 맹약단 용병이 ${n}명이나 된대.`);if(n>=15)L.push('맹약단 행진하는 거 봤어? 줄이 끝이 없더라!');
  if(S.camp.tier>=3)L.push('맹약단 집결지가 거의 마을만 해졌대.');if(S.camp.tier>=4)L.push('맹약단 본성 봤어? 돌로 쌓은 성이래!');
  if(S.advanced)L.push(`${nm} 단장이 전직했대. 기운이 달라졌어.`);if((S.arena||0)>0)L.push('투기장에서 맹약단이 이겼대!');
  {const c=contOf(tk),n=(S.cqDone||{})[c]||0,st=D.CQ[c].steps;if(n>0){const q=st[n-1];L.push(`맹약단이 「${q.n}」 일을 해결했대. ${D.CQ[c].n} 소동이 좀 가라앉겠지?`);}if(n>=st.length)L.push(c==='west'?'서방의 균열이 닫혔대! 다 맹약단 덕분이야.':'동방의 봉인이 다시 섰다 하오. 맹약단 덕이오.');}
  const ri=rankIdx(S.rank);if(ri>=2)L.push(`맹약단이 벌써 ${S.rank}등급이래. 처음엔 F였는데!`);if(S.day>=30)L.push(`맹약단이 다시 일어선 지 벌써 ${S.day}일째래.`);
  return L;}


/* ---------------- 달력 · 연대기 · 칭호 ---------------- */
// 1년 = 4달 × 30일
const MONTHS=['새싹달','햇살달','수확달','서리달'];
function cal(day){day=day||S.day;const d=day-1;return {y:Math.floor(d/120)+1,m:Math.floor((d%120)/30),d:d%30+1,mn:MONTHS[Math.floor((d%120)/30)]};}
function calStr(day,short){const c=cal(day);return short?`${c.mn} ${c.d}일`:`${c.y}년차 ${c.mn} ${c.d}일`;}
// 비밀 경매장: 명성 C등급 이상, 매달 20~22일. 짝수 달 = 항구 뒷골목, 홀수 달 = 황성 지하
function auctionOpen(){const c=cal();return rankIdx(S.rank)>=rankIdx('C')&&c.d>=20&&c.d<=22;}
function auctionTown(){return cal().m%2===0?'t3':'t4';}
function chron(t){S.chron=S.chron||[];S.chron.push({day:S.day,t});if(S.chron.length>200)S.chron.shift();}
const TITLES=[
  {k:'rookie',n:'풋내기 단장',ok:()=>true},
  {k:'wolf',n:'늑대 사냥꾼',ok:()=>(S.stats.clears.d_wolf||0)>0},
  {k:'miner',n:'광산의 은인',ok:()=>(S.stats.clears.d_mine||0)>0},
  {k:'pirate',n:'해적 소탕자',ok:()=>(S.stats.clears.d_wreck||0)>0},
  {k:'knight',n:'타락 기사의 심판자',ok:()=>(S.stats.clears.d_fort||0)>0},
  {k:'dragon',n:'용을 쓰러뜨린 자',ok:()=>(S.stats.clears.d_nest||0)>0},
  {k:'champ',n:'투기장의 왕',ok:()=>(S.arena||0)>0},
  {k:'helper',n:'마을의 해결사',ok:()=>Object.values(S.subs).filter(x=>x.state==='claimed').length>=8},
  {k:'army',n:'대군단의 주인',ok:()=>S.mercs.length>=15},
  {k:'castle',n:'성주',ok:()=>S.camp.tier>=4},
  {k:'gambler',n:'행운의 도박사',ok:()=>((S.casino||{}).wins||0)>=10},
  {k:'angler',n:'항구의 낚시꾼',ok:()=>((S.fish||{}).total||0)>=15},
  {k:'legend',n:'전설의 용병',ok:()=>rankIdx(S.rank)>=5}];
function titles(){return TITLES.filter(t=>t.ok());}
function title(){const own=titles();const sel=own.find(t=>t.k===S.title);return (sel||own[own.length-1]).n;}
/* ---------------- 단장 전직 ---------------- */
function advance(cls){const c=D.LCLASS[cls];if(!c||c.base!==S.leader.cls)return false;S.leader.cls=cls;S.advanced=true;chron(`단장 전직 — ${c.n}`);return true;}

return {BAL,get S(){return S;},set S(v){S=v;},slot:1,D,rnd,ri,pick,clamp,fmt,rankIdx,newGame,save,load,peek,wipeSlot,SLOTS,H2,wpnOk,shieldOk,equipWhy,gearWarn,itemById,statsOf,leaderStats,mercStats,power,expNeed,gainExp,
  wage,upkeep,hireCost,healCost,attitude,priceMul,addGold,addFame,maxRoster,curTier,townOpen,decorPts,campTax,genMerc,recruitList,hire,fire,mercById,canFight,partyUnits,
  inv4,isNight,setNight,nightLine,pet,feedPet,petGift,festOf,festSoon,festGift,addMapPiece,digTreasure,toggleRelic,towerOpen,towerStart,towerEnemies,towerAfter,towerEnd,relicMods,
  inv2,addIngr,gatherReady,harvest,pots,canCook,cook,feast,recipePrice,bpPrice,learnRecipe,learnBp,hiddenName,firstTalk,searchSecret,craftCost,craft,rivalRank,rivalNote,bufText,extraMods,
  avgLv,applyMod,namedOf,synergies,synText,battleMods,goldMul,partyMercs,rollNamed,genNamed,namedOwned,idleMercs,sendDispatch,dispatchOf,settleDispatch,
  cal,calStr,auctionOpen,auctionTown,chron,titles,title,TITLES,genItem,genUnique,genSetPiece,setBonus,leaderSkills,bookPrice,buyBook,learnBook,equipBook,forgetSkill,rollRarity,canEquip,ownerOf,equip,unequip,sellItem,enhCost,enhNeed,enhance,addOre,addItem,invFull,dungOpen,genDungeon,roomById,visitRoom,trapDetect,trapHit,trapDisarm,genEnemies,examEnemies,makeEnemy,Battle,simulate,
  startRun,startSpecial,afterBattle,nodeEvent,campRest,useConsumable,endRun,restDay,treat,curMain,genDailies,acceptSub,claimSub,subCheck,checkMain,partyMax,econMul,autoEquip,contOf,cqCur,cqOk,cqAccept,cqClaim,examReady,passExam,talkMain,
  get mainDone(){return mainDone;},clearMainDone(){mainDone=[];},advanceMain,buildable,build,campNext,campUpgrade,decorPrice,buyDecor,mercLine,townLine,advance,applyFallStatus,partyAliveUnits};
})();
