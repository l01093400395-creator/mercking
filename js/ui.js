/* ==========================================================
   용병왕의 길 — 화면 (ui.js)
   그림 불러오기 · 입력 · 소리 · 캐릭터 그리기 · 걷는 맵(집결지/마을) ·
   월드맵 · 던전 지도 · 전투 화면 · 각종 창(DOM)
   ========================================================== */
(function(){
'use strict';
const D=GD;const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
const fmt=G.fmt,pick=G.pick,rnd=G.rnd,ri=G.ri,clamp=G.clamp;
const S=()=>G.S;

/* ================= 그림 불러오기 ================= */
const IMG={};
function want(k,src){IMG[k]=null;return [k,src];}
const LIST=[];
const ACTS={idle:9,walk:8,attack:10,hurt:8,death:13};
for(const a in ACTS){LIST.push(['h_'+a+'_base','assets/ss/human/'+a+'_base.png'],['h_'+a+'_tools','assets/ss/human/'+a+'_tools.png']);
  for(const hs of D.HAIRS)LIST.push(['h_'+a+'_'+hs,'assets/ss/human/'+a+'_'+hs+'.png']);
  for(const m of ['goblin','skeleton']){LIST.push([m+'_'+a,'assets/ss/'+m+'/'+a+'.png']);}
  LIST.push(['goblin_'+a+'_chief','assets/ss/goblin/'+a+'_chief.png'],['skeleton_'+a+'_drown','assets/ss/skeleton/'+a+'_drown.png']);}
for(const k of ['orc','dknight','aorc'])for(const a of ['idle','walk','attack01','hurt','death'])LIST.push([k+'_'+a,'assets/mobs/'+k+'_'+a+'.png']);
for(const k of ['slime','slime2','bat','mole','snake','spider','skull','spirit','cyclope','beast','lizard','octopus','eye','mushroom','flam','reptile','rat','ratblack','boar','hyena','flam_ab','eye_ab','cyclope_ab','spirit_ab'])LIST.push(['n_'+k,'assets/mobs/'+k+'.png']);
const BOSSW={giantslime:62,demoncyclop:50,giantspirit:50,squidred:76,tengured:82,giantfrog:40,giantredsamurai:96};
for(const k in BOSSW)LIST.push(['b_'+k,'assets/mobs/boss_'+k+'.png']);
for(const k of ['chicken','cow','duck','pig','sheep','bird','fire','glint','smoke','windmill','tree1','tree2','mushred','mushblue'])LIST.push(['el_'+k,'assets/ss/el/'+k+'.png']);
for(const k of ['ss16','camp','campfire'])LIST.push(['t_'+k,'assets/tiles/'+k+'.png']);
for(const k of ['Explosion','Ice','RockSpike','Spark','WaterPillar','arrow'])LIST.push(['fx_'+k,'assets/fx/'+k+'.png']);
for(const k of ['expression_chat','expression_alerted','expression_attack','expression_love','expression_stress','expression_working','indicator','sword'])LIST.push(['ui_'+k,'assets/ui/'+k+'.png']);
LIST.push(['raven','assets/icons/raven32.png']);
function loadAll(cb){let n=0;const tot=LIST.length;
  for(const [k,src] of LIST){const im=new Image();im.onload=()=>{IMG[k]=im;if(++n>=tot)cb();};im.onerror=()=>{console.warn('그림 없음',src);if(++n>=tot)cb();};im.src=src;}}

/* ================= 화면 크기 ================= */
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.imageSmoothingEnabled=false;}
window.addEventListener('resize',resize);resize();

/* ================= 소리 ================= */
const SND={on:(()=>{try{return localStorage.getItem('mercking-snd')!=='0';}catch(e){return true;}})(),bgm:null,cur:'',last:{}};
function bgmFor(){if(scene==='title')return 'title';if(scene==='battle')return 'battle';if(scene==='dmap')return 'kingdom';return 'town';}
function bgmTick(){const w=bgmFor();if(!SND.on){if(SND.bgm){SND.bgm.pause();SND.bgm=null;SND.cur='';}return;}
  if(SND.cur===w&&SND.bgm)return;SND.cur=w;if(SND.bgm)SND.bgm.pause();
  const a=new Audio('assets/audio/'+w+'.ogg');a.loop=true;a.volume=w==='battle'?.3:.34;SND.bgm=a;a.play().catch(()=>{SND.cur='';SND.bgm=null;});}
function sfx(n,v,gap){if(!SND.on)return;const t=performance.now();if(t-(SND.last[n]||0)<(gap||70))return;SND.last[n]=t;try{const a=new Audio('assets/audio/'+n+'.wav');a.volume=v||.4;a.play().catch(()=>{});}catch(e){}}
$('sndbtn').onclick=()=>{SND.on=!SND.on;try{localStorage.setItem('mercking-snd',SND.on?'1':'0');}catch(e){}$('sndbtn').classList.toggle('off',!SND.on);$('sndbtn').textContent=SND.on?'🔊':'🔇';SND.cur='';bgmTick();};
$('sndbtn').classList.toggle('off',!SND.on);$('sndbtn').textContent=SND.on?'🔊':'🔇';
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b&&b.id!=='sndbtn')sfx('click',.22,40);});

/* ================= 캐릭터 그리기 ================= */
// 스프라이트 정의 → {kind, ...}
function sprDesc(key,tint){
  if(!key)return null;
  if(key.startsWith('h_')){const L=D.HUMAN_LOOK[key];return {kind:'human',look:{o:L.o,hair:L.hair,hc:L.hc},tool:L.tool,bow:L.bow,staff:L.staff};}
  if(key==='goblin'||key==='skeleton')return {kind:'ss',k:key,tint};
  if(key==='orc'||key==='dknight'||key==='aorc')return {kind:'rpg',k:key};
  if(key.startsWith('n_')){let k=key.slice(2);if(tint==='ab')k+='_ab';return {kind:'ninja',k};}
  if(key.startsWith('b_'))return {kind:'boss',k:key.slice(2)};
  return null;}
function frameOf(anim,t,n,fps,hold){let f=Math.floor(t*fps);if(hold)return Math.min(n-1,f);return f%n;}
// 사람: look={o,hair,hc}, opt={tool,bow,staff,flip,scale,alpha,flash}
function drawHuman(c,look,anim,t,x,y,s,opt){opt=opt||{};anim=ACTS[anim]?anim:'idle';
  const fps={idle:8,walk:11,attack:17,hurt:14,death:13}[anim];const n=ACTS[anim];const f=frameOf(anim,t,n,fps,anim==='death');
  c.save();c.translate(Math.round(x),Math.round(y));if(opt.flip)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;
  const sx=f*96,dw=96*s,dh=64*s,dx=-48*s,dy=-39*s;
  const b=IMG['h_'+anim+'_base'];if(b)c.drawImage(b,sx,(look.o||0)*64,96,64,dx,dy,dw,dh);
  const h=IMG['h_'+anim+'_'+(look.hair||'shorthair')];if(h)c.drawImage(h,sx,(look.hc||0)*64,96,64,dx,dy,dw,dh);
  if(opt.tool&&anim==='attack'){const tl=IMG['h_attack_tools'];if(tl)c.drawImage(tl,sx,0,96,64,dx,dy,dw,dh);}
  if((opt.bow||opt.staff)&&anim!=='death')drawHeld(c,opt.bow?'bow':'staff',s,anim,t,opt.staffColor);
  c.restore();}
// 활·지팡이 (작은 픽셀 그림)
function drawHeld(c,type,s,anim,t,col){const bob=anim==='walk'?Math.round(Math.sin(t*20))*s*.5:0;const px=(x,y,w,h,cl)=>{c.fillStyle=cl;c.fillRect(x*s,y*s+bob,w*s,h*s);};
  if(type==='bow'){const pull=anim==='attack'?Math.min(2,Math.floor(t*8)):0;
    px(5,-14,1,1,'#2a1a10');px(6,-13,1,1,'#2a1a10');px(7,-12,1,6,'#8a5a2b');px(6,-6,1,1,'#2a1a10');px(5,-5,1,1,'#2a1a10');px(6,-12,1,1,'#b07a40');
    px(5-pull,-13,1,8,'#e8e0d0');}
  else{const glow=anim==='attack'?'#fff3a0':(col||'#6ad0ff');px(6,-17,1,12,'#7a4a24');px(5,-19,3,3,glow);px(6,-20,1,1,'#ffffff');px(5,-17,1,1,'#2a1a10');}}
function drawSS(c,k,tint,anim,t,x,y,s,opt){opt=opt||{};const a=ACTS[anim]?anim:'idle';const im=IMG[k+'_'+a+(tint?'_'+tint:'')]||IMG[k+'_'+a];if(!im)return;
  const n=Math.max(1,Math.round(im.width/96));const fps={idle:8,walk:11,attack:15,hurt:14,death:13}[a];const f=frameOf(a,t,n,fps,a==='death');
  c.save();c.translate(Math.round(x),Math.round(y));if(opt.flip)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;
  c.drawImage(im,f*96,0,96,64,-48*s,-39*s,96*s,64*s);c.restore();}
function drawRPG(c,k,anim,t,x,y,s,opt){opt=opt||{};const m={idle:'idle',walk:'walk',attack:'attack01',hurt:'hurt',death:'death'}[anim]||'idle';const im=IMG[k+'_'+m];if(!im)return;
  const n=Math.round(im.width/100);const fps={idle:8,walk:11,attack01:14,hurt:12,death:10}[m];const f=frameOf(m,t,n,fps,m==='death');
  c.save();c.translate(Math.round(x),Math.round(y));if(opt.flip)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;
  c.drawImage(im,f*100,0,100,100,-52*s,-58*s,100*s,100*s);c.restore();}
function drawNinja(c,k,anim,t,x,y,s,opt){opt=opt||{};const im=IMG['n_'+k];if(!im)return;c.save();c.translate(Math.round(x),Math.round(y));if(opt.alpha!=null)c.globalAlpha=opt.alpha;
  if(opt.flip)c.scale(-1,1);
  if(k==='hyena'||k==='boar'){const fw=k==='hyena'?14:17,fh=k==='hyena'?13:16;const f=Math.floor(t*(anim==='walk'?8:3))%2;c.drawImage(im,f*fw,0,fw,fh,-fw/2*s,-fh*s,fw*s,fh*s);}
  else{const f=Math.floor(t*(anim==='walk'||anim==='attack'?8:4))%4;c.drawImage(im,32,f*16,16,16,-8*s,-15*s,16*s,16*s);}
  c.restore();}
function drawBoss(c,k,anim,t,x,y,s,opt){opt=opt||{};const im=IMG['b_'+k];if(!im)return;const fw=BOSSW[k],fh=im.height,n=Math.max(1,Math.floor(im.width/fw));const f=Math.floor(t*7)%n;
  const foot={giantslime:46,demoncyclop:43,giantspirit:47,squidred:71,tengured:58,giantfrog:33,giantredsamurai:44}[k]||fh;
  c.save();c.translate(Math.round(x),Math.round(y));if(opt.alpha!=null)c.globalAlpha=opt.alpha;if(opt.flip)c.scale(-1,1);
  c.drawImage(im,f*fw,0,fw,fh,-fw/2*s,-foot*s,fw*s,fh*s);
  c.restore();}
// 공용: desc(+look) 그리기. faceLeft=왼쪽 보기
function drawAny(c,desc,anim,t,x,y,s,faceLeft,opt){opt=Object.assign({},opt||{});if(opt.flash>0){const f=Math.min(1,opt.flash);opt.flash=0;drawAny(c,desc,anim,t,x,y,s,faceLeft,opt);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=f*.8;drawAny(c,desc,anim,t,x,y,s,faceLeft,opt);c.restore();return;}
  if(desc.kind==='human'){opt.flip=faceLeft;opt.tool=desc.tool;opt.bow=desc.bow;opt.staff=desc.staff;drawHuman(c,desc.look,anim,t,x,y,s,opt);}
  else if(desc.kind==='ss'){opt.flip=faceLeft;drawSS(c,desc.k,desc.tint,anim,t,x,y,s,opt);}
  else if(desc.kind==='rpg'){opt.flip=faceLeft;drawRPG(c,desc.k,anim,t,x,y,s,opt);}
  else if(desc.kind==='ninja'){opt.flip=!faceLeft;if(anim==='death')opt.alpha=Math.max(0,1-t*1.6);drawNinja(c,desc.k,anim,t,x,y,s,opt);}
  else if(desc.kind==='boss'){opt.flip=!faceLeft;if(anim==='death')opt.alpha=Math.max(0,1-t*1.2);drawBoss(c,desc.k,anim,t,x,y,s,opt);}}
function shadow(c,x,y,w){c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(x,y,w,w*.32,0,0,Math.PI*2);c.fill();}
// 단장·용병의 모습
function unitDesc(u){if(u===S().leader||u.cls){const L=S().leader,c=D.LCLASS[L.cls];return {kind:'human',look:{o:c.outfit,hair:L.look.hair,hc:L.look.hc},tool:c.tool,bow:c.atkType==='bow'&&!c.tool,staff:c.atkType==='magic',staffColor:'#ffcf5a'};}
  const j=D.JOBS[u.job];return {kind:'human',look:u.look,tool:j.tool,bow:u.job==='archer',staff:u.job==='mage'||u.job==='priest',staffColor:u.job==='priest'?'#fff7c0':'#6ad0ff'};}
// 아이콘 (Raven 32x32 시트)
function icon(idx,size){size=size||32;const r=Math.floor(idx/16),c=idx%16;const sc=size/32;
  return `<span class="ic32" style="width:${size}px;height:${size}px;background-image:url(assets/icons/raven32.png);background-size:${512*sc}px auto;background-position:-${c*size}px -${r*size}px"></span>`;}
// 캐릭터 초상 (DOM용 작은 캔버스 이미지)
const portraitCache={};
function portrait(desc,size,key){size=size||48;const ck=key&&key+size;if(ck&&portraitCache[ck])return portraitCache[ck];
  const c=document.createElement('canvas');c.width=size;c.height=size;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const s=desc.kind==='boss'?size/60:desc.kind==='rpg'?size/22:size/19;drawAny(x,desc,'idle',0,size/2,size*.86,s,false);
  const url=c.toDataURL();if(ck)portraitCache[ck]=url;return url;}
function bubble(c,x,y,text,s){s=s||1;c.save();c.font=`700 ${Math.round(12*s)}px "Pretendard","Malgun Gothic",sans-serif`;
  const lines=wrapText(c,text,190*s);const lh=15*s,w=Math.max(...lines.map(l=>c.measureText(l).width))+14*s,h=lines.length*lh+10*s;
  const bx=Math.round(x-w/2),by=Math.round(y-h-8*s);
  c.fillStyle='#fffaf0';c.strokeStyle='#3b2a1e';c.lineWidth=2*s;roundRect(c,bx,by,w,h,5*s);c.fill();c.stroke();
  c.beginPath();c.moveTo(x-5*s,by+h-1);c.lineTo(x,by+h+7*s);c.lineTo(x+5*s,by+h-1);c.fill();c.beginPath();c.moveTo(x-5*s,by+h);c.lineTo(x,by+h+7*s);c.lineTo(x+5*s,by+h);c.stroke();
  c.fillStyle='#3b2a1e';c.textBaseline='top';lines.forEach((l,i)=>c.fillText(l,bx+7*s,by+5*s+i*lh));c.restore();}
function wrapText(c,t,max){const out=[];let line='';for(const ch of t){if(c.measureText(line+ch).width>max&&line){out.push(line);line=ch.trim()?ch:'';}else line+=ch;}if(line)out.push(line);return out;}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function outlineText(c,t,x,y,fill,size,stroke){c.font=`900 ${size}px "Pretendard","Malgun Gothic",sans-serif`;c.textAlign='center';c.lineWidth=Math.max(3,size/5);c.strokeStyle=stroke||'#1a0f08';c.strokeText(t,x,y);c.fillStyle=fill;c.fillText(t,x,y);c.textAlign='left';}

/* ================= 장면 관리 ================= */
let scene='title';   // title | walk | dmap | battle
let sceneT=0;
function fadeTo(fn){const f=$('fade');f.style.opacity=1;setTimeout(()=>{fn();f.style.opacity=0;},230);}
function toast(t,cls){const d=document.createElement('div');d.className='box '+(cls||'');d.innerHTML=t;$('toast').appendChild(d);setTimeout(()=>d.remove(),2900);while($('toast').children.length>4)$('toast').firstChild.remove();}

/* ================= 걷는 맵 (집결지 · 마을) ================= */
const T=16;
// 바닥: 0풀 1길 2물 3모래 4광장 5밭 6부두 7깊은물
const PROP={
  well:{im:'t_ss16',r:[592,304,32,32],blk:[2,1]},fountain:{im:'t_ss16',r:[640,304,32,48],blk:[2,1]},anvil:{im:'t_ss16',r:[592,288,32,16],blk:[2,1]},
  statue:{im:'t_ss16',r:[699,288,38,64],blk:[2,1]},rock:{im:'t_ss16',r:[784,336,32,32],blk:[2,1]},rock2:{im:'t_ss16',r:[832,336,32,32],blk:[2,1]},bush:{im:'t_ss16',r:[784,16,32,32],blk:[2,1]},
  grave:{im:'t_ss16',r:[720,240,16,16],blk:[1,1]},crate:{im:'t_camp',r:[64,80,16,16],blk:[1,1]},trough:{im:'t_ss16',r:[592,272,32,16],blk:[2,1]},
  tentN:{im:'t_camp',r:[64,0,48,48],blk:[3,2]},tentW:{im:'t_camp',r:[112,0,48,48],blk:[3,2]},tentT:{im:'t_camp',r:[160,0,48,48],blk:[3,2]},
  barrel:{im:'t_camp',r:[64,80,16,16],blk:[1,1]},barrels:{im:'t_camp',r:[64,96,32,32],blk:[2,1]},logs:{im:'t_camp',r:[0,16,48,32],blk:[3,1]},hay:{im:'t_camp',r:[0,64,48,32],blk:[3,1]},
  table:{im:'t_camp',r:[32,80,48,48],blk:[3,1]},lamp:{im:'t_camp',r:[96,80,16,32],blk:[1,1]},post:{im:'t_camp',r:[112,80,16,32],blk:[1,1]},sack:{im:'t_camp',r:[128,112,32,16],blk:[2,1]},
  pot:{im:'t_camp',r:[144,48,16,16],blk:[1,1]},firering:{im:'t_camp',r:[192,48,32,32],blk:[2,1]}
};
const ROOFB=[9,17,25,33,41]; // 파랑 초록 주황 빨강 보라
let MAP=null,cam={x:0,y:0,z:3,tz:3},player=null,walkT=0;
let hoverObj=null;
function mkMap(key,w,h){return {key,w,h,g:new Uint8Array(w*h),blk:new Uint8Array(w*h),objs:[],npcs:[],labels:[],pathMat:'dirt',bg:null};}
const gi=(m,x,y)=>y*m.w+x;
function fillG(m,x,y,w,h,v){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<m.w&&j<m.h)m.g[gi(m,i,j)]=v;}
function block(m,x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<m.w&&j<m.h)m.blk[gi(m,i,j)]=1;}
function isBlocked(m,x,y){if(x<0||y<0||x>=m.w||y>=m.h)return true;const g=m.g[gi(m,x,y)];return m.blk[gi(m,x,y)]||g===2||g===7;}
// 건물: x=왼쪽, door=문이 있는 줄(y). h=지붕 줄 수 → 건물 높이 h+3
function house(m,o){const y=o.door-(o.h+2);const b=Object.assign({t:'house',y,roof:o.roof??0},o);b.dx=b.x+Math.floor(b.w/2);b.dy=o.door;
  b.bx=b.x*T;b.by=(b.y)*T;b.bw=b.w*T;b.bh=(b.h+3)*T;b.base=(o.door+1)*T;
  block(m,b.x,b.y+1,b.w,b.h+2);m.blk[gi(m,b.dx,b.dy)]=1;m.objs.push(b);
  // 문 앞 길
  fillG(m,b.dx,o.door+1,1,(o.path||1),1);return b;}
function prop(m,k,x,y,extra){const p=PROP[k];const o=Object.assign({t:'prop',k,x,y,base:(y+1)*T},extra||{});block(m,x,y,p.blk[0],p.blk[1]);m.objs.push(o);return o;}
function tree(m,x,y,k){m.objs.push({t:'tree',x,y,k:k||(Math.random()<.5?'tree1':'tree2'),ph:Math.random()*4,base:(y+1)*T});block(m,x,y,1,1);}
function treeBorder(m,gaps){// 가장자리 숲 (출구 자리는 비움)
  const isGap=(x,y)=>gaps.some(g=>Math.abs(g[0]-x)<=g[2]&&Math.abs(g[1]-y)<=g[2]);
  for(let x=0;x<m.w;x+=2){for(const y of [0,m.h-1])if(!isGap(x,y)&&m.g[gi(m,x,y)]===0)tree(m,x+(y?0:1)*0,y);}
  for(let y=2;y<m.h-1;y+=2){for(const x of [0,m.w-1])if(!isGap(x,y)&&m.g[gi(m,x,y)]===0)tree(m,x,y);}
  // 안쪽으로 한 줄 더 (자연스럽게 듬성듬성)
  for(let x=1;x<m.w-1;x+=3){if(Math.random()<.6&&!isGap(x,1)&&m.g[gi(m,x,1)]===0&&!m.blk[gi(m,x,1)])tree(m,x,1);}
}
function fence(m,x,y,len,dir){m.objs.push({t:'fence',x,y,len,dir,base:(y+1)*T-2});if(dir==='h')block(m,x,y,len,1);else block(m,x,y,1,len);}
function road(m,x,y,w,h){fillG(m,x,y,w,h,1);}

/* ----- 집결지 지도 ----- */
function buildCamp(){const s=S(),tier=s.camp.tier,B=s.camp.built;const m=mkMap('camp',36,27);m.title='집결지 · '+D.CAMP_TIERS[tier].n;
  m.pathMat=B.plaza?'marble':B.slab?'slab':B.gravel?'gravel':'dirt';
  // 길·광장
  fillG(m,13,10,11,7,4);road(m,1,13,12,1);road(m,24,13,11,1);road(m,18,17,1,10);
  road(m,3,21,31,1);road(m,18,7,1,3);
  // 단장 거처
  if(B.keep){const k=house(m,{x:15,w:7,h:2,door:6,roof:4,act:'tent',name:'석조 본성',sign:D.I(2,1)});k.big=true;}
  else{const o=prop(m,tier>=2?'tentN':'tentW',17,8,{act:'tent',name:'단장 막사'});o.base=10*T;}
  // 야영지 소품 (불탄 거점 터의 흔적)
  prop(m,'crate',15,8);prop(m,'sack',20,9);prop(m,'barrel',21,8);if(tier===1){m.objs.push({t:'banner',x:14,y:9,base:10*T});block(m,14,9,1,1);}
  // 모닥불
  m.objs.push({t:'fire',x:18,y:13,base:14*T+4,act:'fire',name:'모닥불'});block(m,18,13,1,1);
  // 건설 부지 & 건물
  const plots={
    p_bunk:()=>{if(B.bunk){prop(m,'tentN',6,7,{act:'bunk',name:'용병 숙소'});prop(m,'tentN',10,7,{act:'bunk',name:'용병 숙소'});prop(m,'barrel',13,8);}
               else{prop(m,'tentT',8,7,{name:'무너진 텐트',act:'plot',plot:'bunk'});}},
    p_board:()=>{if(B.board)m.objs.push({t:'board',x:22,y:10,base:11*T,act:'board',name:'의뢰 게시판'}),block(m,22,10,2,1);else plot(m,'board',22,9,2,2);},
    p_store:()=>{if(B.store){house(m,{x:26,w:4,h:1,door:9,roof:1,act:'store',name:'보급 상점',sign:D.I(17,8),path:3});prop(m,'crate',31,8);prop(m,'sack',24,8);}else plot(m,'store',26,5,4,5);},
    p_clinic:()=>{if(B.clinic){house(m,{x:3,w:4,h:1,door:19,roof:3,act:'clinic',name:'의무실',sign:D.I(17,4),path:1});}else if(tier>=2)plot(m,'clinic',3,15,4,5);},
    p_tavern:()=>{if(B.tavern){house(m,{x:8,w:5,h:1,door:19,roof:3,act:'tavern',name:'용병 주점',sign:D.I(8,10),path:1});prop(m,'barrels',13,18);}else if(tier>=3)plot(m,'tavern',8,15,5,5);},
    p_forge:()=>{if(B.forge){const f=house(m,{x:24,w:4,h:1,door:19,roof:2,act:'forge',name:'목재 대장간',sign:D.I(7,13),path:1});f.smoke=true;prop(m,'anvil',28,18);}else if(tier>=2)plot(m,'forge',24,15,4,5);},
    p_hall:()=>{if(B.hall){house(m,{x:30,w:5,h:2,door:19,roof:4,act:'hall',name:'영웅의 전당',sign:D.I(2,4),path:1});}else if(tier>=4)plot(m,'hall',30,14,5,6);},
    p_training:()=>{if(B.training){fence(m,22,23,9,'h');fence(m,22,26,9,'h');for(let i=0;i<3;i++){m.objs.push({t:'dummy',x:24+i*3,y:24,base:25*T,act:'training',name:'훈련소'});block(m,24+i*3,24,1,1);}
                   m.labels.push({x:26.5,y:22.6,n:'훈련소',act:'training'});}else if(tier>=3)plot(m,'training',22,23,9,3);},
    p_fountain:()=>{if(B.fountain){fillG(m,10,23,5,3,4);prop(m,'fountain',11,24,{act:'deco',name:'분수 광장'});}else if(tier>=3)plot(m,'fountain',10,23,5,3);}
  };
  for(const k in plots)plots[k]();
  // 장식 자리 (사람이 정한 위치 — 겹치지 않음)
  // 장식 자리 (사람이 정한 위치 — 겹치지 않음). 키 큰 장식은 위쪽이 비어 있는 자리만
  const small=[[14,16],[22,16],[13,11],[23,15],[2,11],[33,11],[2,15],[33,15],[8,12],[28,12],[16,23],[20,23],[15,25],[20,25],[32,25],[1,18],[34,18],[25,11],[11,12],[30,12]];
  const tall=[[5,11],[31,11],[2,19],[33,19],[14,25],[21,25],[25,12],[14,8],[9,11],[27,11],[16,19],[20,17]];
  let si=0,ti=0;const big=[[31,0]];let bi=0;
  for(const d of s.camp.decor){const dd=D.DECOR[d];if(dd.big){const p=big[bi++];if(p){m.objs.push({t:'windmill',x:p[0],y:p[1],base:(p[1]+6)*T,name:'풍차'});block(m,p[0]+1,p[1]+4,4,2);}continue;}
    const isTall=['statue','lantern','banner','well','scarecrow'].includes(dd.spr);let p;
    do{p=isTall?tall[ti++]:small[si++];}while(p&&m.blk[gi(m,p[0],p[1])]);if(!p)continue;decorObj(m,d,p[0],p[1]);}
  // 동물 우리
  if(tier>=2){fence(m,1,23,1,'v');m.animals=[];const pen={x:1,y:23,w:7,h:3};for(let i=0;i<(tier>=3?4:2);i++)m.animals.push(animal(i%2?'chicken':'sheep',pen));if(tier>=3)m.animals.push(animal('cow',pen));}
  for(const [k,x,y] of [['bush',14,18],['rock',21,19],['bush',32,8],['bush',3,8],['bush',34,24],['rock',5,22]])if(!m.blk[gi(m,x,y)]&&!m.blk[gi(m,x+1,y)]&&m.g[gi(m,x,y)]===0&&m.g[gi(m,x+1,y)]===0)prop(m,k,x,y);
  treeBorder(m,[[0,13,1],[35,13,1],[18,26,1]]);
  // 장식용 나무 무리
  for(const [x,y] of [[2,3],[4,2],[33,3],[34,8],[1,8],[33,20],[2,19]])if(!m.blk[gi(m,x,y)]&&m.g[gi(m,x,y)]===0)tree(m,x,y);
  m.spawn={x:18,y:16};m.exits=[{x:18,y:26,to:'world',n:'월드맵'},{x:0,y:13,to:'world',n:'월드맵'},{x:35,y:13,to:'world',n:'월드맵'}];
  return m;}
function plot(m,key,x,y,w,h){const b=D.BUILDS[key];if(!b||b.tier>S().camp.tier)return;m.objs.push({t:'plot',key,x,y,w,h,base:(y+h)*T,act:'plot',plot:key,name:b.n+' 부지'});block(m,x,y+Math.max(0,h-2),w,Math.min(2,h));}
function decorObj(m,d,x,y){const sp=D.DECOR[d].spr;
  if(sp==='flowers'){m.objs.push({t:'flowers',x,y,base:(y+1)*T-8,seed:x*7+y});}
  else if(sp==='fence'){fence(m,x,y,2,'h');}
  else if(sp==='barrel'){prop(m,'barrels',x,y);}
  else if(sp==='crops'){fillG(m,x,y,2,1,5);m.objs.push({t:'crop',x,y,base:(y+1)*T-4,seed:x+y});}
  else if(sp==='lantern'){prop(m,'lamp',x,y);}
  else if(sp==='scarecrow'){m.objs.push({t:'dummy',x,y,base:(y+1)*T,straw:true});block(m,x,y,1,1);}
  else if(sp==='statue'){prop(m,'statue',x,y);}
  else if(sp==='banner'){m.objs.push({t:'banner',x,y,base:(y+1)*T});block(m,x,y,1,1);}
  else if(sp==='well'){prop(m,'well',x,y);}}
function animal(k,pen){return {k,x:(pen.x+1+Math.random()*(pen.w-2))*T,y:(pen.y+.5+Math.random()*(pen.h-1))*T,pen,tx:0,ty:0,t:Math.random()*3,dir:1};}

/* ----- 마을 지도 (지역마다 사람이 설계한 배치) ----- */
function buildTown(tk){const t=D.TOWNS[tk];let m;
  const H=(o)=>house(m,o);
  if(tk==='t1'){m=mkMap(tk,34,24);m.pathMat='dirt';
    road(m,0,12,34,1);road(m,6,19,22,1);road(m,16,13,1,6);
    H({x:3,w:5,h:2,door:11,roof:0,act:'guild',name:'의뢰소',sign:D.I(18,9)});
    H({x:11,w:4,h:1,door:11,roof:1,act:'shop',name:'잡화 상점',sign:D.I(7,3)});
    H({x:18,w:5,h:2,door:11,roof:4,act:'inn',name:'여관 · 치료소',sign:D.I(8,10)});
    H({x:26,w:4,h:1,door:11,roof:2,name:'촌장 댁'});
    H({x:7,w:4,h:1,door:18,roof:3,name:'농가'});H({x:20,w:4,h:1,door:18,roof:1,name:'민가'});
    fillG(m,2,20,7,3,5);for(let i=0;i<3;i++)m.objs.push({t:'crop',x:3+i*2,y:21,base:22*T-4,seed:i});fence(m,1,23,9,'h');
    fillG(m,26,20,6,3,2);prop(m,'well',13,14);prop(m,'barrels',3,14);prop(m,'barrel',15,9);m.objs.push({t:'board',x:9,y:10,base:11*T});block(m,9,10,2,1);
    m.animals=[animal('chicken',{x:24,y:14,w:6,h:3}),animal('chicken',{x:24,y:14,w:6,h:3}),animal('cow',{x:2,y:15,w:5,h:3}),animal('sheep',{x:2,y:15,w:5,h:3})];
    treeBorder(m,[[0,12,1],[33,12,1]]);m.spawn={x:1,y:12};m.exits=[{x:0,y:12,to:'world',n:'월드맵'},{x:33,y:12,to:'world',n:'월드맵'}];}
  else if(tk==='t2'){m=mkMap(tk,40,26);m.pathMat='gravel';
    road(m,0,13,40,1);road(m,4,20,32,1);road(m,20,14,1,6);road(m,33,6,1,7);
    H({x:3,w:5,h:2,door:12,roof:0,act:'guild',name:'광산 길드',sign:D.I(18,9)});
    H({x:10,w:4,h:1,door:12,roof:1,act:'shop',name:'광부 잡화점',sign:D.I(7,3)});
    H({x:16,w:5,h:2,door:12,roof:4,act:'inn',name:'광부 여관',sign:D.I(8,10)});
    const sm=H({x:23,w:5,h:1,door:12,roof:2,act:'smith',name:'대장간',sign:D.I(7,13)});sm.smoke=true;prop(m,'anvil',28,11);
    H({x:6,w:4,h:1,door:19,roof:2,name:'목수 공방'});H({x:12,w:4,h:1,door:19,roof:3,name:'광부 숙소'});H({x:24,w:4,h:1,door:19,roof:1,name:'민가'});H({x:29,w:4,h:1,door:19,roof:2,name:'창고'});
    // 광산 입구
    m.objs.push({t:'mine',x:31,y:2,base:6*T});block(m,30,2,6,4);
    for(const [x,y] of [[36,8],[37,10],[2,16],[35,16],[29,8]])prop(m,(x+y)%2?'rock':'rock2',x,y);
    prop(m,'crate',9,11);prop(m,'crate',2,22);prop(m,'barrels',22,17);
    treeBorder(m,[[0,13,1],[39,13,1],[33,0,3]]);m.spawn={x:1,y:13};m.exits=[{x:0,y:13,to:'world',n:'월드맵'},{x:39,y:13,to:'world',n:'월드맵'}];}
  else if(tk==='t3'){m=mkMap(tk,46,30);m.pathMat='slab';
    fillG(m,0,23,46,2,3);fillG(m,0,25,46,5,2);fillG(m,0,28,46,2,7);
    road(m,0,11,46,1);road(m,0,19,46,1);road(m,12,12,1,7);road(m,33,12,1,7);road(m,22,20,1,3);
    fillG(m,20,22,5,6,6);fillG(m,8,24,2,4,6);fillG(m,36,24,2,4,6);fillG(m,17,14,11,4,4);
    H({x:3,w:6,h:2,door:10,roof:0,act:'guild',name:'항구 의뢰소',sign:D.I(18,9)});
    H({x:11,w:4,h:1,door:10,roof:1,act:'shop',name:'무역 상점',sign:D.I(7,3)});
    H({x:17,w:6,h:2,door:10,roof:4,act:'inn',name:'바다 여관',sign:D.I(8,10)});
    const sm=H({x:26,w:4,h:1,door:10,roof:2,act:'smith',name:'항구 대장간',sign:D.I(7,13)});sm.smoke=true;
    H({x:32,w:5,h:2,door:10,roof:4,act:'relic',name:'유물 상점',sign:D.I(10,6)});
    H({x:39,w:4,h:1,door:10,roof:3,name:'민가'});
    H({x:2,w:4,h:1,door:18,roof:3,name:'선원 숙소'});H({x:7,w:4,h:1,door:18,roof:1,name:'민가'});H({x:36,w:4,h:1,door:18,roof:2,name:'창고'});H({x:41,w:4,h:1,door:18,roof:0,name:'세관'});
    prop(m,'fountain',22,15);for(const x of [17,27])prop(m,'lamp',x,14);prop(m,'crate',19,21);prop(m,'crate',25,21);prop(m,'barrels',29,21);prop(m,'sack',14,21);prop(m,'barrels',3,21);
    m.boats=[{x:15*T,y:26.2*T,ph:0},{x:30*T,y:27*T,ph:1.6},{x:42*T,y:26.5*T,ph:3}];
    treeBorder(m,[[0,11,1],[45,11,1],[0,19,1],[45,19,1],[23,29,30]]);m.spawn={x:1,y:11};m.exits=[{x:0,y:11,to:'world',n:'월드맵'},{x:0,y:19,to:'world',n:'월드맵'}];}
  else{m=mkMap(tk,54,34);m.pathMat='marble';
    road(m,0,16,54,1);road(m,26,3,2,30);fillG(m,19,12,16,9,4);road(m,5,25,44,1);road(m,8,8,38,1);
    H({x:21,w:12,h:3,door:7,roof:4,name:'황궁',big:true,palace:true});
    H({x:6,w:6,h:2,door:15,roof:0,act:'guild',name:'황성 의뢰소',sign:D.I(18,9)});
    H({x:13,w:4,h:1,door:15,roof:1,act:'shop',name:'귀족 상점',sign:D.I(7,3)});
    H({x:36,w:6,h:2,door:15,roof:4,act:'inn',name:'황성 여관',sign:D.I(8,10)});
    const sm=H({x:43,w:5,h:1,door:15,roof:2,act:'smith',name:'왕실 대장간',sign:D.I(7,13)});sm.smoke=true;
    H({x:4,w:7,h:2,door:24,roof:0,act:'hq',name:'메인 길드 본부',sign:D.I(2,10)});
    H({x:13,w:5,h:1,door:24,roof:4,act:'relic',name:'유물 상점',sign:D.I(10,6)});
    H({x:36,w:6,h:2,door:24,roof:3,act:'classhall',name:'전직의 전당',sign:D.I(91,9)});
    H({x:9,w:5,h:1,door:7,roof:3,name:'귀족 저택'});H({x:40,w:5,h:1,door:7,roof:1,name:'귀족 저택'});H({x:2,w:4,h:1,door:7,roof:2,name:'민가'});H({x:47,w:4,h:1,door:7,roof:0,name:'민가'});
    H({x:44,w:5,h:1,door:24,roof:1,name:'민가'});H({x:21,w:4,h:1,door:24,roof:2,name:'민가'});
    // 투기장
    m.objs.push({t:'arena',x:15,y:27,w:24,h:6,base:33*T,act:'arena',name:'왕실 투기장'});block(m,15,27,24,1);block(m,15,32,24,1);block(m,15,27,1,6);block(m,38,27,1,6);
    m.labels.push({x:27,y:28.2,n:'왕실 투기장',act:'arena'});
    prop(m,'fountain',26,17);prop(m,'statue',21,13);prop(m,'statue',32,13);for(const x of [20,34])prop(m,'lamp',x,18);for(const x of [3,50,11,44])prop(m,'lamp',x,15);
    treeBorder(m,[[0,16,1],[53,16,1],[26,33,2]]);m.spawn={x:1,y:16};m.exits=[{x:0,y:16,to:'world',n:'월드맵'},{x:53,y:16,to:'world',n:'월드맵'},{x:27,y:33,to:'world',n:'월드맵'}];}
  m.title=t.n+' · '+t.tag;m.town=tk;return m;}

/* ----- 바닥 그리기 (한 번 그려 두고 재사용) ----- */
const PAL={grass:'#63c74d',grassD:'#55b343',dirt:'#e4a672',dirtD:'#c28569',sand:'#e4d572',water:'#32b8e8',deep:'#0099db',soil:'#9d573f',plank:'#b86f50',plankD:'#8a4f36'};
function paintGround(m){const c=document.createElement('canvas');c.width=m.w*T;c.height=m.h*T;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const ts=IMG.t_ss16;
  const tile=(tx,ty,dx,dy)=>x.drawImage(ts,tx*16,ty*16,16,16,dx,dy,16,16);
  const GR=[[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,2],[3,2],[5,2],[3,3]];
  const mat=m.pathMat;
  const pathCol={dirt:[PAL.dirt,PAL.dirtD],gravel:['#c9a785','#9a7a62'],slab:['#b8b4ac','#8a867e'],marble:['#ece8de','#b8b2a2']}[mat];
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)],dx=i*T,dy=j*T;const h=(i*73856093^j*19349663)>>>0;
    if(g===0){const p=GR[h%GR.length];tile(p[0],p[1],dx,dy);}
    else if(g===1||g===4){x.fillStyle=g===4&&mat==='dirt'?'#d89c68':pathCol[0];x.fillRect(dx,dy,T,T);
      if(mat==='dirt'){if(h%3===0){x.fillStyle=pathCol[1];x.fillRect(dx+(h%11),dy+(h%7)+3,2,1);x.fillRect(dx+(h%5)+6,dy+(h%13),1,1);}}
      else if(mat==='gravel'){x.fillStyle='#8f8a84';for(let k=0;k<5;k++){x.fillRect(dx+((h>>k*3)%14)+1,dy+((h>>(k*3+2))%14)+1,2,1);}}
      else{x.fillStyle=pathCol[1];x.fillRect(dx,dy+T-1,T,1);x.fillRect(dx+((j%2)?T/2:0)-0,dy,1,T);if(mat==='marble'){x.fillStyle='rgba(255,255,255,.4)';x.fillRect(dx+2,dy+2,4,1);}}}
    else if(g===2||g===7){x.fillStyle=g===7?PAL.deep:PAL.water;x.fillRect(dx,dy,T,T);if(h%4===0){x.fillStyle='rgba(255,255,255,.55)';x.fillRect(dx+(h%10)+2,dy+(h%9)+3,3,1);}}
    else if(g===3){tile(...[[5,1],[7,1],[8,1],[9,1]][h%4],dx,dy);}
    else if(g===5){x.fillStyle=PAL.soil;x.fillRect(dx,dy,T,T);x.fillStyle='#7a4230';for(let r=2;r<T;r+=5)x.fillRect(dx,dy+r,T,1);}
    else if(g===6){x.fillStyle=PAL.plank;x.fillRect(dx,dy,T,T);x.fillStyle=PAL.plankD;for(let r=0;r<T;r+=4)x.fillRect(dx,dy+r,T,1);x.fillRect(dx+((j%2)?4:11),dy,1,T);}}
  // 가장자리 (길·물 테두리)
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)],dx=i*T,dy=j*T;const nb=(a,b)=>(a<0||b<0||a>=m.w||b>=m.h)?g:m.g[gi(m,a,b)];
    const isP=v=>v===1||v===4;
    if(isP(g)){x.fillStyle=pathCol[1];if(!isP(nb(i,j-1))&&nb(i,j-1)===0)x.fillRect(dx,dy,T,1);if(!isP(nb(i,j+1))&&nb(i,j+1)===0)x.fillRect(dx,dy+T-1,T,1);
      if(!isP(nb(i-1,j))&&nb(i-1,j)===0)x.fillRect(dx,dy,1,T);if(!isP(nb(i+1,j))&&nb(i+1,j)===0)x.fillRect(dx+T-1,dy,1,T);
      // 둥근 모서리
      x.fillStyle=PAL.grass;const n=nb(i,j-1)===0,s=nb(i,j+1)===0,w=nb(i-1,j)===0,e=nb(i+1,j)===0;
      if(n&&w)x.fillRect(dx,dy,2,2);if(n&&e)x.fillRect(dx+T-2,dy,2,2);if(s&&w)x.fillRect(dx,dy+T-2,2,2);if(s&&e)x.fillRect(dx+T-2,dy+T-2,2,2);}
    if(g===2||g===7){if(nb(i,j-1)!==2&&nb(i,j-1)!==7){x.fillStyle='#e8f6ff';x.fillRect(dx,dy,T,2);}}
    if(g===0&&(nb(i,j-1)===2)){x.fillStyle='#3a8a3a';x.fillRect(dx,dy,T,1);}}
  // 지붕 없는 그림자 (건물 아래)
  for(const o of m.objs)if(o.t==='house'){x.fillStyle='rgba(0,0,0,.16)';x.fillRect(o.bx+3,o.base-3,o.bw,5);}
  m.bg=c;}

/* ----- 길 찾기 (A*) ----- */
function findPath(m,sx,sy,tx,ty){if(isBlocked(m,tx,ty)){let best=null,bd=1e9;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=tx+dx,y=ty+dy;if(!isBlocked(m,x,y)){const d=Math.abs(dx)+Math.abs(dy)+(Math.abs(x-sx)+Math.abs(y-sy))*.01;if(d<bd){bd=d;best=[x,y];}}}if(!best)return null;tx=best[0];ty=best[1];}
  const N=m.w*m.h,gs=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),open=[gi(m,sx,sy)];gs[open[0]]=0;const closed=new Uint8Array(N);
  const hh=k=>Math.abs(k%m.w-tx)+Math.abs((k/m.w|0)-ty);let it=0;
  while(open.length&&it++<6000){let bi=0;for(let k=1;k<open.length;k++)if(gs[open[k]]+hh(open[k])<gs[open[bi]]+hh(open[bi]))bi=k;const cur=open.splice(bi,1)[0];
    if(cur===gi(m,tx,ty)){const p=[];let k=cur;while(k!==-1){p.push([k%m.w,k/m.w|0]);k=from[k];}return p.reverse();}
    closed[cur]=1;const cx=cur%m.w,cy=cur/m.w|0;
    for(const [ddx,ddy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+ddx,ny=cy+ddy;if(isBlocked(m,nx,ny))continue;
      if(ddx&&ddy&&(isBlocked(m,cx+ddx,cy)||isBlocked(m,cx,cy+ddy)))continue;const k=gi(m,nx,ny);if(closed[k])continue;
      const g=m.g[k];const cost=(ddx&&ddy?1.414:1)*(g===1||g===4||g===6?.8:1);const ng=gs[cur]+cost;if(ng<gs[k]){gs[k]=ng;from[k]=cur;if(!open.includes(k))open.push(k);}}}
  return null;}

/* ----- 걷는 장면: 입장 · 주민 ----- */
let userZoom=1;
function enterWalk(loc,spawnAt){const s=S();s.loc=loc;MAP=loc==='camp'?buildCamp():buildTown(loc);paintGround(MAP);
  const sp=spawnAt||MAP.spawn;player={x:(sp.x+.5)*T,y:(sp.y+.5)*T,path:[],t:0,anim:'idle',face:1,desc:unitDesc(s.leader),name:s.leader.name,kind:'player'};
  MAP.npcs=[];if(loc==='camp')populateCamp();else populateTown(loc);
  cam.x=player.x;cam.y=player.y;scene='walk';sceneT=0;showWalkUI();G.save();}
function walker(desc,x,y,o){return Object.assign({x:(x+.5)*T,y:(y+.5)*T,path:[],t:Math.random()*3,anim:'idle',face:Math.random()<.5?1:-1,desc,wait:rnd(.5,4),speed:rnd(34,46),bubble:null},o||{});}
function freeTileNear(x,y,r){for(let k=0;k<40;k++){const tx=x+ri(-r,r),ty=y+ri(-r,r);if(!isBlocked(MAP,tx,ty))return [tx,ty];}return [x,y];}
function populateCamp(){const s=S(),m=MAP,B=s.camp.built;
  const poi={fire:[[15,12],[21,12],[15,14],[21,14],[16,16],[20,16],[17,11],[19,11],[14,13],[22,13]],tent:[[16,11],[20,11]],bunk:B.bunk?[[8,10],[12,10]]:[[9,11]],tavern:B.tavern?[[10,20],[11,20]]:null,train:B.training?[[24,25],[27,25],[30,25]]:null,
    shop:B.store?[[28,11],[27,11]]:null,board:B.board?[[22,12]]:null,clinic:B.clinic?[[5,20],[6,20]]:null};
  m.poi=poi;
  for(const mc of s.mercs){let pos=pick(poi.fire);if(mc.instructor&&poi.train)pos=poi.train[0];else if(mc.status==='inj')pos=(poi.clinic||poi.bunk)[0];
    const [x,y]=freeTileNear(pos[0],pos[1],1);const w=walker(unitDesc(mc),x,y,{kind:'merc',ref:mc,name:mc.name});if(mc.status==='inj'||mc.dis)w.speed*=.6;m.npcs.push(w);}
  const vis=[0,0,5,12,20][s.camp.tier];for(let i=0;i<vis;i++){const look={o:pick([0,1,2,3,6,7,8,9]),hair:pick(D.HAIRS),hc:ri(0,6)};const [x,y]=freeTileNear(18,20,8);
    m.npcs.push(walker({kind:'human',look,tool:false},x,y,{kind:'visitor',name:pick(['행상인','주민','여행자','농부','상인'])}));}}
const TOWN_NPC_SPOTS={t1:[[24,13],[10,13],[14,18]],t2:[[30,14],[14,14],[8,21]],t3:[[16,20],[30,12],[24,16]],t4:[[18,17],[44,17],[34,26]]};
function populateTown(tk){const m=MAP,t=D.TOWNS[tk];const n=[0,6,10,15,22][t.tier];
  const roads=[];for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)];if((g===1||g===4||g===6)&&!m.blk[gi(m,i,j)])roads.push([i,j]);}
  m.roads=roads;
  for(let i=0;i<n;i++){const role=i<Math.max(2,n*.2)?'guard':i<n*.35?'merchant':'folk';
    const look={o:role==='guard'?4:role==='merchant'?pick([7,8]):pick([0,1,2,3,6,7,9]),hair:pick(D.HAIRS),hc:ri(0,6)};const [x,y]=pick(roads);
    m.npcs.push(walker({kind:'human',look,tool:role==='guard'},x,y,{kind:'npc',role,name:role==='guard'?'경비병':role==='merchant'?'상인':'주민',speed:role==='guard'?28:rnd(30,44)}));}
  // 서브 퀘스트 의뢰인 (제자리)
  const spots=TOWN_NPC_SPOTS[tk];let k=0;
  for(const id in D.SUBS){const q=D.SUBS[id];if(q.town!==tk)continue;const sp=spots[k++];if(!sp)break;
    const look={o:pick([0,1,2,3,6,7,8,9]),hair:pick(D.HAIRS),hc:(k*3)%7};const w=walker({kind:'human',look,tool:false},sp[0],sp[1],{kind:'quest',sub:id,name:q.npc,still:true,face:-1});m.npcs.push(w);}}

/* ----- 걷는 장면: 갱신 ----- */
function moveAlong(e,dt){if(!e.path||!e.path.length){e.anim='idle';return false;}
  const [tx,ty]=e.path[0];const gx=(tx+.5)*T,gy=(ty+.5)*T;const dx=gx-e.x,dy=gy-e.y,d=Math.hypot(dx,dy);const sp=(e.speed||70)*dt;
  if(d<=sp){e.x=gx;e.y=gy;e.path.shift();}else{e.x+=dx/d*sp;e.y+=dy/d*sp;}
  if(Math.abs(dx)>.5)e.face=dx>0?1:-1;e.anim='walk';return true;}
const keys=new Set();
function updWalk(dt){const m=MAP;if(!m)return;walkT+=dt;
  // 키보드 이동
  let kx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),ky=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  if((kx||ky)&&!uiBusy()){player.path=[];player.goal=null;const sp=78*dt/Math.hypot(kx,ky);const nx=player.x+kx*sp,ny=player.y+ky*sp;
    if(!isBlocked(m,Math.floor(nx/T),Math.floor(player.y/T)))player.x=nx;if(!isBlocked(m,Math.floor(player.x/T),Math.floor(ny/T)))player.y=ny;
    if(kx)player.face=kx;player.anim='walk';}
  else{player.speed=78;const moving=moveAlong(player,dt);if(!moving&&player.goal){const g=player.goal;player.goal=null;interact(g);}}
  player.t+=dt;
  // 출구
  const ptx=Math.floor(player.x/T),pty=Math.floor(player.y/T);
  for(const ex of m.exits||[])if(ptx===ex.x&&pty===ex.y&&!uiBusy()&&!player.exited){player.exited=true;player.path=[];openPanel('world');}
  if(!(m.exits||[]).some(ex=>ptx===ex.x&&pty===ex.y))player.exited=false;
  // 주민
  for(const e of m.npcs){e.t+=dt;if(e.bubble){e.bubble.t-=dt;if(e.bubble.t<=0)e.bubble=null;}
    if(e.still||e.talking){e.anim='idle';continue;}
    if(moveAlong(e,dt))continue;e.wait-=dt;
    if(e.wait<=0){e.wait=rnd(2.5,7);let tgt;
      if(e.kind==='merc'){const mc=e.ref;let place='fire',pool=m.poi.fire;
        if(mc.instructor&&m.poi.train){place='train';pool=m.poi.train;}
        else if(mc.status==='inj'){place='inj';pool=m.poi.clinic||m.poi.bunk;}
        else{const opts=[['fire',m.poi.fire,4],['bar',m.poi.tavern,2],['train',m.poi.train,2],['shop',m.poi.shop,1],['shop',m.poi.board,1],['fire',m.poi.bunk,1]].filter(o=>o[1]);
          const o=opts[Math.floor(Math.random()*opts.reduce((a,b)=>a+b[2],0))]||opts[0];let r=Math.random()*opts.reduce((a,b)=>a+b[2],0);let pickO=opts[0];for(const op of opts){r-=op[2];if(r<=0){pickO=op;break;}}place=pickO[0];pool=pickO[1];}
        e.place=place;const taken=new Set(m.npcs.filter(x=>x!==e&&x.goalT).map(x=>x.goalT.join()));const freeP=pool.filter(p=>!taken.has(p.join()));tgt=pick(freeP.length?freeP:pool);if(taken.has(tgt.join()))tgt=freeTileNear(tgt[0],tgt[1],2);e.goalT=tgt;
        // 가끔 혼잣말
        if(Math.random()<.35&&!e.bubble&&!m.npcs.some(o=>o!==e&&o.bubble&&Math.hypot(o.x-e.x,o.y-e.y)<120))e.bubble={text:G.mercLine(mc,place),t:4.5,auto:true};}
      else if(e.kind==='visitor'){tgt=pick([[3,13],[8,13],[28,13],[32,13],[18,20],[18,24],[6,21],[12,21],[24,21],[30,21],[26,10],[10,10]]);if(Math.random()<.2&&!m.npcs.some(o=>o!==e&&o.bubble&&Math.hypot(o.x-e.x,o.y-e.y)<120))e.bubble={text:pick(D.CAMP_VISITOR),t:4};}
      else{tgt=pick(m.roads||[[e.x/T|0,e.y/T|0]]);if(e.role==='guard'&&Math.random()<.6){e.wait=rnd(4,9);continue;}}
      const p=findPath(m,Math.floor(e.x/T),Math.floor(e.y/T),tgt[0],tgt[1]);if(p){p.shift();e.path=p.slice(0,40);}}}
  // 동물
  for(const a of m.animals||[]){a.t+=dt;if(!a.tx||Math.hypot(a.tx-a.x,a.ty-a.y)<2){if(Math.random()<dt*.5){a.tx=(a.pen.x+.8+Math.random()*(a.pen.w-1.6))*T;a.ty=(a.pen.y+.6+Math.random()*(a.pen.h-1.2))*T;}}
    else{const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);a.x+=dx/d*12*dt;a.y+=dy/d*12*dt;a.dir=dx>0?1:-1;}}
  // 카메라
  const base=clamp(Math.min(W/(27*T),H/(16*T)),1.8,3.4);cam.tz=base*userZoom;cam.z+=(cam.tz-cam.z)*Math.min(1,dt*8);
  cam.x+=(player.x-cam.x)*Math.min(1,dt*6);cam.y+=(player.y-cam.y)*Math.min(1,dt*6);
  const hw=W/2/cam.z,hh=H/2/cam.z;cam.x=m.w*T<hw*2?m.w*T/2:clamp(cam.x,hw,m.w*T-hw);cam.y=m.h*T<hh*2?m.h*T/2:clamp(cam.y,hh,m.h*T-hh);}

/* ----- 걷는 장면: 그리기 ----- */
const houseCache={};
function houseImg(o){const key=o.w+'_'+o.h+'_'+o.roof+'_'+(o.palace?1:0);if(houseCache[key])return houseCache[key];
  const c=document.createElement('canvas');c.width=o.w*T;c.height=(o.h+3)*T;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const ts=IMG.t_ss16;const base=ROOFB[o.roof];
  const cols=[15];for(let i=0;i<o.w-2;i++)cols.push(16);cols.push(17);const rows=[base];for(let i=0;i<o.h;i++)rows.push(base+3);rows.push(base+4,base+5);
  rows.forEach((r,j)=>cols.forEach((cc,i)=>x.drawImage(ts,cc*16,r*16,16,16,i*T,j*T,16,16)));
  houseCache[key]=c;return c;}
function drawDoor(c,o){const dx=o.dx*T,dy=o.dy*T;c.fillStyle='#3a2416';c.fillRect(dx+3,dy+3,10,13);c.fillStyle='#7a4a2a';c.fillRect(dx+4,dy+4,8,12);c.fillStyle='#5a3420';c.fillRect(dx+7,dy+4,1,12);c.fillStyle='#e8c060';c.fillRect(dx+9,dy+10,1,1);c.fillRect(dx+6,dy+10,1,1);}
function drawSign(c,o){if(o.sign==null)return;const sx=o.dx*T+8,sy=o.dy*T-5;c.fillStyle='#5a3420';c.fillRect(sx-8,sy-8,16,13);c.fillStyle='#c8955a';c.fillRect(sx-7,sy-7,14,11);
  const r=Math.floor(o.sign/16),cl=o.sign%16;c.drawImage(IMG.raven,cl*32,r*32,32,32,sx-6,sy-7,12,12);}
function drawObj(c,o){const t=walkT;
  switch(o.t){
  case 'house':{const im=houseImg(o);c.drawImage(im,o.bx,o.by);if(o.palace){c.fillStyle='#c03a3a';for(const fx of [o.bx+6,o.bx+o.bw-10]){c.fillRect(fx,o.by-14,1,16);c.fillRect(fx+1,o.by-14+Math.round(Math.sin(t*3+fx)),7,5);}}
    if(o.act||o.name!=='창고')drawDoor(c,o);drawSign(c,o);
    if(o.smoke&&IMG.el_smoke){const im2=IMG.el_smoke,fw=im2.width/30;const f=Math.floor(t*12)%30;c.drawImage(im2,f*fw,0,fw,im2.height,o.bx+o.bw-22,o.by-im2.height+10,fw,im2.height);}
    break;}
  case 'prop':{const p=PROP[o.k];const im=IMG[p.im];if(!im)break;const r=p.r;c.drawImage(im,r[0],r[1],r[2],r[3],o.x*T+(p.blk[0]*T-r[2])/2,(o.y+1)*T-r[3]+(o.k.startsWith('tent')?T:0),r[2],r[3]);break;}
  case 'tree':{const im=IMG['el_'+o.k];if(!im)break;const f=Math.floor(t*2+o.ph)%4;c.drawImage(im,f*32,0,32,34,o.x*T-8,o.y*T-20,32,34);break;}
  case 'fire':{const im=IMG.t_campfire;if(im){const f=Math.floor(t*10)%8;c.drawImage(im,f*32,0,32,32,o.x*T-8,o.y*T-14,32,32);}
    c.fillStyle='rgba(255,170,60,'+(.08+.03*Math.sin(t*9))+')';c.beginPath();c.arc(o.x*T+8,o.y*T+6,40,0,Math.PI*2);c.fill();break;}
  case 'windmill':{const im=IMG.el_windmill;if(im){const f=Math.floor(t*6)%9;c.drawImage(im,f*112,0,112,112,o.x*T-8,o.y*T-6,112,112);}break;}
  case 'fence':{c.fillStyle='#8a5a32';const L=o.len*T;if(o.dir==='h'){c.fillRect(o.x*T,o.y*T+6,L,2);c.fillRect(o.x*T,o.y*T+11,L,2);for(let i=0;i<=o.len;i++){c.fillStyle='#6a4024';c.fillRect(o.x*T+i*T-1,o.y*T+3,3,12);}}
    else{c.fillStyle='#6a4024';c.fillRect(o.x*T+7,o.y*T,3,L);}break;}
  case 'flowers':{const cols=['#ff6a8a','#ffd84a','#ffffff','#b07aff','#ff9a3a'];for(let i=0;i<7;i++){const h=(o.seed*31+i*17)%97;c.fillStyle='#3a8a3a';c.fillRect(o.x*T+(h%14)+1,o.y*T+(h*7%10)+5,1,3);c.fillStyle=cols[(o.seed+i)%5];c.fillRect(o.x*T+(h%14),o.y*T+(h*7%10)+3,3,3);}break;}
  case 'crop':{const im=IMG.t_ss16;for(let i=0;i<2;i++){const cl=51+((o.seed+i)%9);c.drawImage(im,cl*16,17*16,16,16,(o.x+i)*T,o.y*T-4,16,16);}break;}
  case 'dummy':{const x=o.x*T+8,y=o.y*T+14;c.fillStyle='#6a4024';c.fillRect(x-1,y-16,3,16);c.fillStyle=o.straw?'#3a6ab0':'#d8b060';c.fillRect(x-6,y-14,13,7);c.fillStyle='#e8c070';c.fillRect(x-3,y-21,7,7);c.fillStyle='#3b2a1e';c.fillRect(x-1,y-19,1,1);c.fillRect(x+2,y-19,1,1);
    if(o.straw){c.fillStyle='#8a5a2a';c.fillRect(x-5,y-23,11,2);c.fillRect(x-3,y-25,7,2);}break;}
  case 'banner':{const x=o.x*T+7,y=o.y*T+15;c.fillStyle='#5a3420';c.fillRect(x,y-26,2,26);c.fillStyle='#a8282a';const w=Math.round(Math.sin(t*3+o.x))*1;c.fillRect(x+2,y-25,10+w,10);c.fillStyle='#e8c060';c.fillRect(x+5,y-22,4,4);break;}
  case 'board':{const x=o.x*T,y=o.y*T;c.fillStyle='#5a3420';c.fillRect(x+3,y-2,2,18);c.fillRect(x+27,y-2,2,18);c.fillStyle='#8a5a32';c.fillRect(x,y-14,32,16);c.fillStyle='#c8955a';c.fillRect(x+2,y-12,28,12);
    c.fillStyle='#fff8e0';c.fillRect(x+4,y-11,7,8);c.fillRect(x+13,y-10,6,9);c.fillRect(x+21,y-11,7,7);c.fillStyle='#a03a2a';c.fillRect(x+7,y-11,1,1);c.fillRect(x+16,y-10,1,1);break;}
  case 'plot':{const x=o.x*T,y=o.y*T,w=o.w*T,h=o.h*T;c.fillStyle='rgba(140,100,60,.28)';c.fillRect(x+2,y+2,w-4,h-4);c.strokeStyle='#d8c090';c.setLineDash([3,3]);c.lineWidth=1;c.strokeRect(x+2.5,y+2.5,w-5,h-5);c.setLineDash([]);
    c.fillStyle='#6a4024';for(const [px,py] of [[x+2,y+1],[x+w-4,y+1],[x+2,y+h-7],[x+w-4,y+h-7]])c.fillRect(px,py,2,6);
    c.fillStyle='#8a5a32';c.fillRect(x+w/2-8,y+h/2-6,16,10);c.fillStyle='#e8d0a0';c.fillRect(x+w/2-7,y+h/2-5,14,8);c.drawImage(IMG.ui_sword||IMG.raven,0,0,14,14,x+w/2-5,y+h/2-5,8,8);break;}
  case 'mine':{const x=o.x*T,y=o.y*T;c.fillStyle='#7a746a';c.beginPath();c.ellipse(x+40,y+50,52,34,0,Math.PI,0);c.fill();c.fillStyle='#8f897e';c.beginPath();c.ellipse(x+40,y+50,44,26,0,Math.PI,0);c.fill();
    c.fillStyle='#1a1410';c.fillRect(x+28,y+30,24,22);c.fillStyle='#6a4024';c.fillRect(x+25,y+27,30,4);c.fillRect(x+25,y+27,4,25);c.fillRect(x+51,y+27,4,25);c.fillStyle='#4a4a4a';c.fillRect(x+30,y+56,2,8);c.fillRect(x+48,y+56,2,8);for(let k=0;k<4;k++)c.fillRect(x+28,y+52+k*4,24,1);break;}
  case 'arena':{const x=o.x*T,y=o.y*T,w=o.w*T,h=o.h*T;c.fillStyle='#e4d08a';c.beginPath();c.ellipse(x+w/2,y+h/2,w/2-6,h/2-6,0,0,Math.PI*2);c.fill();c.strokeStyle='#8a867e';c.lineWidth=6;c.stroke();c.strokeStyle='#b8b4ac';c.lineWidth=2;c.stroke();
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const bx=x+w/2+Math.cos(a)*(w/2-4),by=y+h/2+Math.sin(a)*(h/2-4);c.fillStyle='#5a3420';c.fillRect(bx,by-14,2,14);c.fillStyle=i%2?'#a8282a':'#2a5aa8';c.fillRect(bx+2,by-14,7,5);}break;}
  }}
function drawWalker(c,e){shadow(c,e.x,e.y+1,6);
  let flash=0;drawAny(c,e.desc,e.anim,e.t,e.x,e.y+1,1,e.face<0,{flash});
  if(e.kind==='merc'&&e.ref.status==='inj'){c.fillStyle='#fff';c.fillRect(e.x-4,e.y-15,8,2);c.fillStyle='#d03030';c.fillRect(e.x-1,e.y-16,2,4);}}
function renderWalk(){const m=MAP;if(!m||!m.bg)return;const z=cam.z;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#2f5a2a';ctx.fillRect(0,0,W,H);
  ctx.setTransform(DPR*z,0,0,DPR*z,DPR*(W/2-cam.x*z),DPR*(H/2-cam.y*z));ctx.imageSmoothingEnabled=false;
  ctx.drawImage(m.bg,0,0);
  // 물결 반짝임
  if(m.boats)for(const b of m.boats){const by=b.y+Math.sin(walkT*2+b.ph)*1.5;ctx.fillStyle='#8a5a32';ctx.fillRect(b.x-12,by,24,5);ctx.fillStyle='#6a4024';ctx.fillRect(b.x-10,by+5,20,2);ctx.fillStyle='#5a3420';ctx.fillRect(b.x-1,by-20,2,20);ctx.fillStyle='#fff8e8';ctx.fillRect(b.x+1,by-19,9,13);}
  const list=[];for(const o of m.objs)list.push([o.base,0,o]);for(const e of m.npcs)list.push([e.y,1,e]);list.push([player.y,1,player]);
  for(const a of m.animals||[])list.push([a.y,2,a]);
  list.sort((a,b)=>a[0]-b[0]);
  for(const [_,k,o] of list){if(k===0)drawObj(ctx,o);else if(k===1)drawWalker(ctx,o);else{const im=IMG['el_'+o.k];if(im){const fw=im.width/4,f=Math.floor(o.t*5)%4;ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if(o.dir<0)ctx.scale(-1,1);ctx.drawImage(im,f*fw,0,fw,im.height,-fw/2,-im.height+3,fw,im.height);ctx.restore();}}}
  // 목표 표시
  if(player.path.length){const p=player.path[player.path.length-1];ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse((p[0]+.5)*T,(p[1]+.6)*T,5+Math.sin(walkT*8),2.5,0,0,Math.PI*2);ctx.stroke();}
  // 화면 좌표로 이름표·말풍선
  ctx.setTransform(DPR,0,0,DPR,0,0);const sx=wx=>(wx-cam.x)*z+W/2,sy=wy=>(wy-cam.y)*z+H/2;
  const tags=[];
  for(const o of m.objs)if(o.act&&o.name&&(o.t==='house'||o.t==='plot'||o.t==='board'||(o.t==='prop'&&o.act)||o.t==='fire'))tags.push([o.t==='house'?(o.bx+o.bw/2):o.t==='plot'?(o.x+o.w/2)*T:(o.x+(o.t==='board'?1:o.t==='prop'?PROP[o.k].blk[0]/2:.5))*T,o.t==='house'?o.by-2:o.t==='plot'?o.y*T:o.t==='fire'?o.y*T-14:o.y*T-(o.t==='board'?16:30),o.name,o.t==='plot']);
  for(const l of m.labels)tags.push([l.x*T,l.y*T,l.n]);
  ctx.font='800 12px "Pretendard","Malgun Gothic",sans-serif';ctx.textAlign='center';
  for(const [x,y,n,pl] of tags){const X=sx(x),Y=sy(y)-6;if(X<-80||X>W+80||Y<-20||Y>H+40)continue;const tw=ctx.measureText(n).width+12;ctx.fillStyle=pl?'rgba(60,40,20,.75)':'rgba(40,24,12,.82)';roundRect(ctx,X-tw/2,Y-15,tw,18,6);ctx.fill();ctx.fillStyle=pl?'#ffe0a0':'#fff3dc';ctx.fillText(n,X,Y-2);}
  for(const ex of m.exits||[]){const X=sx((ex.x+.5)*T),Y=sy((ex.y+.5)*T);if(X<-40||X>W+40||Y<-40||Y>H+40)continue;ctx.fillStyle='rgba(30,20,10,.75)';roundRect(ctx,X-34,Y-11,68,20,8);ctx.fill();ctx.fillStyle='#ffe28a';ctx.fillText('🗺 '+ex.n,X,Y+4);}
  // 머리 위 표시
  for(const e of m.npcs){const X=sx(e.x),Y=sy(e.y-20);
    if(e.kind==='quest'){const st=S().subs[e.sub];const mark=!st?'!':st.state==='done'?'?':null;if(mark){outlineText(ctx,mark,X,Y-4+Math.sin(walkT*5)*2,mark==='?'?'#7fe07a':'#ffd84a',20);}
      if(z>2.2){ctx.font='700 11px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(e.name,X,sy(e.y+12));ctx.fillText(e.name,X,sy(e.y+12));}}
    if(e.kind==='merc'&&hoverObj===e){ctx.font='700 11px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle=D.GRADES[e.ref.grade].c;ctx.strokeText(e.name,X,sy(e.y+12));ctx.fillText(e.name,X,sy(e.y+12));}}
  ctx.textAlign='left';
  for(const e of m.npcs){if(e.bubble)bubble(ctx,sx(e.x),sy(e.y-18*1)-4,e.bubble.text,clamp(z/3,.85,1.15));
    else if(e.kind==='merc'&&!e.bubble&&IMG.ui_expression_chat&&(hoverObj===e)){ctx.drawImage(IMG.ui_expression_chat,sx(e.x)-9,sy(e.y-20)-20,18,18);}}
  if(player.bubble)bubble(ctx,sx(player.x),sy(player.y-18)-4,player.bubble.text,1);}

/* ----- 걷는 장면: 조작 ----- */
function screenToWorld(px,py){return [(px-W/2)/cam.z+cam.x,(py-H/2)/cam.z+cam.y];}
function hitWalk(px,py){const [wx,wy]=screenToWorld(px,py);const m=MAP;
  let best=null,bd=14;for(const e of m.npcs){const d=Math.hypot(e.x-wx,e.y-8-wy);if(d<bd){bd=d;best=e;}}if(best)return {npc:best};
  for(const o of m.objs){if(!o.act)continue;
    if(o.t==='house'&&wx>=o.bx&&wx<=o.bx+o.bw&&wy>=o.by-12&&wy<=o.base)return {obj:o};
    if(o.t==='plot'&&wx>=o.x*T&&wx<=(o.x+o.w)*T&&wy>=o.y*T&&wy<=(o.y+o.h)*T)return {obj:o};
    if(o.t==='arena'&&wx>=o.x*T&&wx<=(o.x+o.w)*T&&wy>=o.y*T&&wy<=(o.y+o.h)*T)return {obj:o};
    if((o.t==='prop'||o.t==='board'||o.t==='fire'||o.t==='dummy')&&Math.abs(wx-(o.x+(o.t==='prop'?PROP[o.k].blk[0]/2:o.t==='board'?1:.5))*T)<22&&wy>o.y*T-34&&wy<(o.y+1.4)*T)return {obj:o};}
  for(const l of m.labels){if(Math.abs(wx-l.x*T)<40&&Math.abs(wy-l.y*T)<14)return {obj:m.objs.find(o=>o.act===l.act)};}
  return {tile:[Math.floor(wx/T),Math.floor(wy/T)]};}
function walkTap(px,py){if(uiBusy())return;const h=hitWalk(px,py);const m=MAP;const sx=Math.floor(player.x/T),sy=Math.floor(player.y/T);
  if(h.npc){const e=h.npc;const p=findPath(m,sx,sy,Math.floor(e.x/T),Math.floor(e.y/T));player.goal={npc:e};if(p){p.shift();if(p.length)p.pop();player.path=p;}if(!player.path.length){player.goal=null;interact({npc:e});}return;}
  if(h.obj){const o=h.obj;let tx,ty;if(o.t==='house'){tx=o.dx;ty=o.dy+1;}else if(o.t==='plot'){tx=o.x+Math.floor(o.w/2);ty=o.y+o.h;}else if(o.t==='arena'){tx=o.x+o.w/2|0;ty=o.y-1;}else{tx=o.x;ty=o.y+1;}
    const p=findPath(m,sx,sy,tx,ty);player.goal={obj:o};if(p){p.shift();player.path=p;}if(!player.path.length){player.goal=null;interact({obj:o});}return;}
  const [tx,ty]=h.tile;const p=findPath(m,sx,sy,tx,ty);if(p){p.shift();player.path=p;player.goal=null;sfx('step',.15,120);}}
function interact(g){if(g.npc){const e=g.npc;e.face=player.x<e.x?-1:1;player.face=e.x>player.x?1:-1;
    if(e.kind==='merc'){e.bubble={text:G.mercLine(e.ref,e.place),t:5};e.wait=Math.max(e.wait,3);e.path=[];}
    else if(e.kind==='visitor'){e.bubble={text:pick(D.CAMP_VISITOR),t:4};e.path=[];}
    else if(e.kind==='npc'){e.bubble={text:G.townLine(MAP.town,e.role),t:4.5};e.path=[];e.wait=3;}
    else if(e.kind==='quest')subDialog(e);return;}
  const o=g.obj;if(!o)return;openAct(o.act,o);}

/* ================= 전투 화면 ================= */
let BT=null; // {b, LW, LH, bg, port, fl:[], fx:[], shake, onEnd, title, endT}
function startBattle(enemies,title,theme,onEnd,opt){const port=H>W*1.05;const LW=port?480:1280,LH=port?860:720;
  const b=new G.Battle(enemies,opt||{});b.speed=S().flags.bspeed||1;b.auto=!!S().flags.leaderAuto;
  BT={b,LW,LH,port,theme,bg:makeBattleBG(theme,LW,LH,port),fl:[],fx:[],shake:0,onEnd,title,endT:0,t:0};
  layoutBattle(BT);b.offFn=u=>port?{x:0,y:u.side===0?66:-66}:{x:u.side===0?-70:70,y:0};
  if(!b.focus){const e=b.alive(1).find(x=>x.boss)||b.alive(1)[0];b.focus=e;}
  scene='battle';sceneT=0;showBattleUI();bgmTick();}
function layoutBattle(bt){const b=bt.b;for(const side of [0,1])for(const row of ['front','back']){const us=b.units.filter(u=>u.side===side&&u.row===row);const n=us.length;
    us.forEach((u,i)=>{if(bt.port){u.hy=side===0?(row==='front'?590:715):(row==='front'?400:290);u.hx=240+(i-(n-1)/2)*Math.min(us.some(x=>x.boss)?170:112,430/Math.max(1,n));}
      else{u.hx=side===0?(row==='front'?470:300):(row==='front'?810:980);u.hy=480+(i-(n-1)/2)*Math.min(128,390/Math.max(1,n))+(row==='back'?8:0);if(n>2)u.hx+=(i%2?(side?18:-18):0);}
      u.x=u.hx;u.y=u.hy;});}}
function makeBattleBG(th,LW,LH,port){const c=document.createElement('canvas');c.width=LW;c.height=LH;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const TH=D.THEME[th]||D.THEME.forest;
  const gy=port?LH*.24:LH*.36;const [sky,g1,g2]=TH.bg;
  const grd=x.createLinearGradient(0,0,0,gy);grd.addColorStop(0,shade(sky,-.25));grd.addColorStop(1,sky);x.fillStyle=grd;x.fillRect(0,0,LW,gy);
  x.fillStyle=g1;x.fillRect(0,gy,LW,LH-gy);
  // 바닥 무늬 (3배 크기 타일)
  const ts=IMG.t_ss16,S3=48;
  for(let j=0;j*S3<LH-gy+S3;j++)for(let i=0;i*S3<LW+S3;i++){const h=(i*928371^j*1237)>>>0;const dx=i*S3,dy=gy+j*S3;
    if(th==='forest'){const p=[[2,1],[2,1],[2,1],[2,1],[2,2],[3,2],[5,2],[3,3]][h%8];x.drawImage(ts,p[0]*16,p[1]*16,16,16,dx,dy,S3,S3);}
    else if(th==='camp'||th==='waste'||th==='mist'){x.fillStyle=h%5===0?g2:g1;x.fillRect(dx,dy,S3,S3);x.fillStyle=shade(g1,-.12);x.fillRect(dx+(h%40),dy+(h%33),6,3);}
    else if(th==='dock'||th==='sea'){x.fillStyle=(j%2)?g1:g2;x.fillRect(dx,dy,S3,S3);x.fillStyle=shade(g1,-.25);x.fillRect(dx,dy+S3-3,S3,3);x.fillRect(dx+((j%2)?12:36),dy,3,S3);}
    else{x.fillStyle=(i+j)%2?g1:g2;x.fillRect(dx,dy,S3,S3);x.fillStyle=shade(g1,-.18);x.fillRect(dx,dy+S3-2,S3,2);x.fillRect(dx+S3-2,dy,2,S3);}}
  // 벽/원경 장식
  const deco=TH.deco;x.fillStyle=shade(sky,-.35);
  for(let i=0;i<LW;i+=port?90:110){const h=(i*31)%7;
    if(deco==='tree'&&IMG.el_tree1){x.drawImage(IMG.el_tree1,0,0,32,34,i-20,gy-120+h*4,96,102);}
    else if(deco==='tent'&&IMG.t_camp){if(i%220===0)x.drawImage(IMG.t_camp,112,0,48,48,i,gy-120,144,144);else x.drawImage(IMG.t_camp,64,96,32,32,i+20,gy-60,64,64);}
    else if(deco==='rock'){x.fillStyle=shade(sky,.1+h*.02);x.beginPath();x.moveTo(i-30,gy+4);x.lineTo(i+10,gy-60-h*10);x.lineTo(i+60,gy+4);x.fill();}
    else if(deco==='crystal'){x.fillStyle=h%2?'#6ad0ff':'#b07aff';x.globalAlpha=.75;x.beginPath();x.moveTo(i,gy+4);x.lineTo(i+14,gy-50-h*8);x.lineTo(i+28,gy+4);x.fill();x.globalAlpha=1;}
    else if(deco==='pillar'){x.fillStyle=shade(sky,.25);x.fillRect(i+20,gy-140,34,144);x.fillStyle=shade(sky,.4);x.fillRect(i+14,gy-150,46,14);x.fillRect(i+14,gy-6,46,10);}
    else if(deco==='crate'&&IMG.t_ss16){x.drawImage(IMG.t_ss16,560,144,16,32,i+30,gy-90,48,96);}}
  if(th==='sea'){x.fillStyle='#2a7ab8';x.fillRect(0,gy-40,LW,40);}
  if(th==='mist'||th==='abyss'){x.fillStyle=th==='mist'?'rgba(230,240,240,.18)':'rgba(120,60,200,.12)';for(let i=0;i<5;i++)x.fillRect(0,gy+i*90,LW,40);}
  if(th==='volcano'){x.fillStyle='#ff6a2a';for(let i=0;i<12;i++){x.fillRect((i*137)%LW,gy+((i*211)%(LH-gy)),40,3);}}
  if(th==='abyss'){x.fillStyle='#fff';for(let i=0;i<60;i++)x.fillRect((i*197)%LW,(i*89)%gy,2,2);}
  // 가장자리 어둡게
  const v=x.createRadialGradient(LW/2,LH*.6,LH*.3,LW/2,LH*.6,LH*.95);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=v;x.fillRect(0,0,LW,LH);
  return c;}
function shade(hex,p){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>clamp(Math.round(p<0?v*(1+p):v+(255-v)*p),0,255);return '#'+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1);}
function bView(){const k=Math.min(W/BT.LW,H/BT.LH);return {k,ox:(W-BT.LW*k)/2,oy:(H-BT.LH*k)/2};}
function updBattle(dt){const bt=BT;if(!bt)return;const b=bt.b;bt.t+=dt;
  b.update(dt);
  for(const u of b.units){u.at=(u.at||0)+dt*(b.speed||1);if(u.hitT)u.hitT=Math.max(0,u.hitT-dt);
    if(u.hp>0&&(u.anim==='attack'&&u.at>.62||u.anim==='hurt'&&u.at>.35))u.anim=null;}
  // 사건 처리
  while(b.ev.length){const e=b.ev.shift();
    if(e.k==='dmg'){const crit=e.crit;bt.fl.push({x:e.u.x+rnd(-10,10),y:e.u.y-58,t:0,txt:(e.exec?'처형! ':'')+fmt(e.v),c:e.dot?'#c87aff':crit?'#ffd84a':e.u.side===0?'#ff8a7a':'#ffffff',s:crit?34:24});if(crit||e.u.boss)bt.shake=.18;sfx(crit?'slash':'hit',.25,50);}
    else if(e.k==='heal'){bt.fl.push({x:e.u.x,y:e.u.y-58,t:0,txt:'+'+fmt(e.v),c:'#7fe07a',s:22});}
    else if(e.k==='miss'){bt.fl.push({x:e.u.x,y:e.u.y-58,t:0,txt:'빗나감',c:'#c8c8c8',s:18});}
    else if(e.k==='shield'){bt.fl.push({x:e.u.x,y:e.u.y-74,t:0,txt:'막음 '+fmt(e.v),c:'#8fd0ff',s:16});}
    else if(e.k==='skill'){bt.fl.push({x:e.u.x,y:e.u.y-92,t:0,txt:e.name+'!',c:'#ffe28a',s:22,banner:true});sfx(e.u.atkType==='magic'?'fire':'slash',.3);}
    else if(e.k==='shot'){if(e.type==='bow'){bt.fx.push({k:'arrow',x0:e.u.x,y0:e.u.y-26,x1:e.tg.x,y1:e.tg.y-24,t:0,d:.25});sfx('bow',.25,60);}else if(e.type==='magic')bt.fx.push({k:'orb',x0:e.u.x,y0:e.u.y-30,x1:e.tg.x,y1:e.tg.y-24,t:0,d:.25,c:e.u.side?'#c87aff':'#6ad0ff'});else bt.fx.push({k:'slash',x:e.tg.x,y:e.tg.y-24,t:0,d:.25,flip:e.u.side});}
    else if(e.k==='fx'){const f=e.fx;if(['Explosion','Ice','RockSpike','Spark','WaterPillar'].includes(f))bt.fx.push({k:'sheet',im:f,x:e.tg.x,y:e.tg.y-20,t:0,d:.6});
      else if(f==='slash')bt.fx.push({k:'slash',x:e.tg.x,y:e.tg.y-24,t:0,d:.3,flip:e.u.side,big:true});
      else if(f==='arrow')bt.fx.push({k:'arrow',x0:e.u.x,y0:e.u.y-26,x1:e.tg.x,y1:e.tg.y-24,t:0,d:.22});
      else if(f==='heal'){for(const u of b.alive(e.u.side))bt.fx.push({k:'glint',x:u.x,y:u.y-30,t:0,d:.6});}
      else if(f==='buff'){for(const u of e.all?b.alive(e.u.side):[e.u])bt.fx.push({k:'ring',x:u.x,y:u.y,t:0,d:.6});}}
    else if(e.k==='down'){if(e.u.side===0)toastB(e.u.name+' 쓰러짐!');}
    else if(e.k==='await'){showCmd();}
    else if(e.k==='end'){bt.endT=.01;sfx(e.win?'win':'lose',.45);$('bCmd').classList.add('hidden');}}
  for(const f of bt.fl)f.t+=dt;bt.fl=bt.fl.filter(f=>f.t<1.1);
  for(const f of bt.fx)f.t+=dt;bt.fx=bt.fx.filter(f=>f.t<f.d);
  if(bt.shake)bt.shake=Math.max(0,bt.shake-dt);
  if(bt.endT){bt.endT+=dt;if(bt.endT>1.6&&!bt.done){bt.done=true;const cb=bt.onEnd;const res=b;fadeTo(()=>{hideBattleUI();cb&&cb(res);});}}
  updCmdState();}
function toastB(t){if(BT)BT.fl.push({x:BT.LW/2,y:BT.port?150:130,t:0,txt:t,c:'#ffb0a0',s:20,banner:true,fixed:true});}
function renderBattle(){const bt=BT;if(!bt)return;const b=bt.b;const v=bView();
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#120c08';ctx.fillRect(0,0,W,H);
  const sh=bt.shake?rnd(-5,5):0;ctx.setTransform(DPR*v.k,0,0,DPR*v.k,DPR*(v.ox+sh),DPR*(v.oy+sh*.5));ctx.imageSmoothingEnabled=false;
  ctx.drawImage(bt.bg,0,0);
  const us=b.units.slice().sort((a,c)=>a.y-c.y);
  // 차례 표시
  if(b.wait){const u=b.wait;ctx.strokeStyle='#ffd84a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(u.x,u.y+2,30+Math.sin(bt.t*6)*3,10,0,0,Math.PI*2);ctx.stroke();}
  for(const u of us){const dead=u.hp<=0;const desc=u.side===0?unitDesc(u.ref):sprDesc(u.spr,u.tint);if(!desc)continue;
    const sc=(BT.port?3:3.6)*(desc.kind==='boss'?.72:1)*(u.scale||1);
    let anim=dead?'death':u.anim||'idle';const at=dead?(u.at||0):anim==='idle'?bt.t+u.hx*.01:u.at;
    if(dead&&desc.kind!=='human'&&desc.kind!=='ss'&&desc.kind!=='rpg'&&at>1)continue;
    if(!dead)shadow(ctx,u.x,u.y+2,desc.kind==='boss'?40*(u.scale||1):16*(u.scale||1));
    const flash=u.hitT?u.hitT*3:0;
    if(dead&&(desc.kind==='human'||desc.kind==='ss'||desc.kind==='rpg'))ctx.globalAlpha=u.side===1?Math.max(0,1-Math.max(0,at-.9)):1;
    drawAny(ctx,desc,anim,at,u.x,u.y,sc,u.side===1,{flash:dead?0:flash,alpha:dead&&u.side===0?.55:null});ctx.globalAlpha=1;
    if(dead)continue;
    // 상태 표시줄
    const top=u.y-unitH(desc)*sc-14;const bw=desc.kind==='boss'?110:64;
    drawBar(u.x-bw/2,top,bw,7,u.hp/u.maxHp,u.side===0?'#5ad04a':'#e05040');
    if(u.shield>0)drawBar(u.x-bw/2,top-4,bw,3,Math.min(1,u.shield/u.maxHp),'#8fd0ff');
    if(u.sk)drawBar(u.x-bw/2,top+8,bw,4,Math.min(1,(u.sp||0)/100),'#4a9aff');
    if(!u.isL||1)drawBar(u.x-bw/2,top+(u.sk?13:8),bw,3,Math.min(1,u.g/100),'#e8c050');
    ctx.font='800 13px "Pretendard","Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#120a04';const nm=(u.isL?'★ ':'')+u.name+(u.lv&&u.side===1?' Lv'+u.lv:'');ctx.strokeText(nm,u.x,top-4);ctx.fillStyle=u.isL?'#ffe28a':u.boss?'#ff9a7a':u.elite?'#ffc87a':'#fff';ctx.fillText(nm,u.x,top-4);
    const st=[];if(b.has(u,'taunt'))st.push('도발');if(b.has(u,'freeze'))st.push('빙결');if(b.has(u,'slow'))st.push('둔화');if(b.has(u,'bleed'))st.push('출혈');if(b.has(u,'brk'))st.push('방깎');if(b.buffVal(u,'atk')>0)st.push('공↑');if(b.has(u,'haste'))st.push('가속');
    if(st.length){ctx.font='700 11px sans-serif';ctx.fillStyle='#ffd0a0';ctx.strokeText(st.join(' '),u.x,u.y+22);ctx.fillText(st.join(' '),u.x,u.y+22);}
    if(b.focus===u){const iy=top-30+Math.sin(bt.t*6)*3;ctx.fillStyle='#ffd84a';ctx.beginPath();ctx.moveTo(u.x-9,iy);ctx.lineTo(u.x+9,iy);ctx.lineTo(u.x,iy+11);ctx.fill();ctx.strokeStyle='#5a3a10';ctx.lineWidth=2;ctx.stroke();}}
  ctx.textAlign='left';
  // 효과
  for(const f of bt.fx){const p=f.t/f.d;
    if(f.k==='arrow'){const x=f.x0+(f.x1-f.x0)*p,y=f.y0+(f.y1-f.y0)*p-Math.sin(p*Math.PI)*30;const a=Math.atan2(f.y1-f.y0,f.x1-f.x0);ctx.save();ctx.translate(x,y);ctx.rotate(a);if(IMG.fx_arrow)ctx.drawImage(IMG.fx_arrow,0,0,32,32,-24,-24,48,48);ctx.restore();}
    else if(f.k==='orb'){const x=f.x0+(f.x1-f.x0)*p,y=f.y0+(f.y1-f.y0)*p;ctx.fillStyle=f.c;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}
    else if(f.k==='slash'){ctx.strokeStyle='rgba(255,255,255,'+(1-p)+')';ctx.lineWidth=f.big?7:4;ctx.beginPath();const r=f.big?46:32;const s0=f.flip?Math.PI*.2:-Math.PI*.8;ctx.arc(f.x,f.y,r,s0+p*1.2,s0+p*1.2+1.6);ctx.stroke();}
    else if(f.k==='sheet'){const im=IMG['fx_'+f.im];if(im){const n={Explosion:9,Ice:10,RockSpike:12,Spark:9,WaterPillar:6}[f.im];const fw=im.width/n;const fr=Math.min(n-1,Math.floor(p*n));ctx.drawImage(im,fr*fw,0,fw,im.height,f.x-fw*1.5,f.y-im.height*2.3,fw*3,im.height*3);}}
    else if(f.k==='glint'){const im=IMG.el_glint;if(im){const fw=im.width/6;const fr=Math.min(5,Math.floor(p*6));ctx.drawImage(im,fr*fw,0,fw,im.height,f.x-fw*1.5,f.y-im.height*1.5,fw*3,im.height*3);}ctx.fillStyle='rgba(120,255,140,'+(1-p)*.5+')';ctx.beginPath();ctx.arc(f.x,f.y,20+p*20,0,Math.PI*2);ctx.fill();}
    else if(f.k==='ring'){ctx.strokeStyle='rgba(255,220,90,'+(1-p)+')';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(f.x,f.y,18+p*30,6+p*10,0,0,Math.PI*2);ctx.stroke();}}
  for(const f of bt.fl){const y=f.fixed?f.y:f.y-f.t*40;ctx.globalAlpha=Math.min(1,(1.1-f.t)*2.5);outlineText(ctx,f.txt,f.x,y,f.c,f.s);ctx.globalAlpha=1;}
  if(bt.endT){ctx.globalAlpha=Math.min(1,bt.endT*2);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,bt.LW,bt.LH);outlineText(ctx,b.over===1?'승리!':'전멸...',bt.LW/2,bt.LH/2,b.over===1?'#ffe28a':'#ff8a7a',64);ctx.globalAlpha=1;}}
function unitH(d){if(d.kind==='boss')return {giantslime:24,demoncyclop:34,giantspirit:42,squidred:58,tengured:34,giantfrog:27,giantredsamurai:40}[d.k]||36;if(d.kind==='rpg')return 17;if(d.kind==='ninja')return 15;return 18;}
function drawBar(x,y,w,h,p,col){ctx.fillStyle='#1a120c';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle='#4a3324';ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.max(0,w*p),h);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x,y,Math.max(0,w*p),1);}
function battleTap(px,py){const bt=BT;if(!bt||bt.endT)return;const v=bView();const lx=(px-v.ox)/v.k,ly=(py-v.oy)/v.k;let best=null,bd=60;
  for(const u of bt.b.alive(1)){const d=Math.hypot(u.x-lx,(u.y-25)-ly);if(d<bd*(u.scale||1)){bd=d;best=u;}}
  if(best){bt.b.setFocus(best);sfx('click',.2);updCmdState(true);}}
/* 전투 조작 UI */
function showBattleUI(){hideWalkUI();$('hud').classList.add('hidden');$('bhud').classList.remove('hidden');$('bTitle').textContent=BT.title;$('bCmd').classList.add('hidden');
  $('bAuto').innerHTML='단장 오토 <b>'+(BT.b.auto?'ON':'OFF')+'</b>';$('bAuto').classList.toggle('sel',BT.b.auto);$('bSpeed').textContent='속도 ×'+BT.b.speed;
  $('bHint').textContent=BT.b.auto?'용병들이 알아서 싸웁니다. 적을 누르면 집중 공격 대상을 정합니다.':'단장 차례가 되면 시간이 멈춥니다. 적을 눌러 목표를 정하세요.';}
function hideBattleUI(){$('bhud').classList.add('hidden');$('bCmd').classList.add('hidden');$('hud').classList.remove('hidden');}
$('bAuto').onclick=()=>{if(!BT)return;BT.b.auto=!BT.b.auto;S().flags.leaderAuto=BT.b.auto;if(BT.b.auto&&BT.b.wait){const u=BT.b.wait;BT.b.wait=null;BT.b.start(u,BT.b.leaderAI(u));$('bCmd').classList.add('hidden');}showBattleUI();};
$('bSpeed').onclick=()=>{if(!BT)return;BT.b.speed=BT.b.speed>=3?1:BT.b.speed+1;S().flags.bspeed=BT.b.speed;$('bSpeed').textContent='속도 ×'+BT.b.speed;};
function showCmd(){const b=BT.b,u=b.wait;if(!u)return;const c=D.LCLASS[S().leader.cls];let h='<button data-c="atk">⚔ 공격<small>기본 공격</small></button>';
  for(const k of c.skills){const s=D.SKILLS[k];const lock=s.lv&&S().leader.lv<s.lv;h+=`<button data-c="${k}" title="${s.d}">${s.n}<small>${lock?'Lv'+s.lv+' 해금':''}<span class="cd"></span></small></button>`;}
  $('bCmd').innerHTML=h;$('bCmd').classList.remove('hidden');$('bCmd').classList.add('pop');setTimeout(()=>$('bCmd').classList.remove('pop'),250);
  $('bCmd').querySelectorAll('button').forEach(bn=>bn.onclick=()=>{const k=bn.dataset.c;const ok=b.command(k==='atk'?{target:b.focus}:{skill:k,target:b.focus});if(ok)$('bCmd').classList.add('hidden');});
  $('bHint').textContent='단장 차례! 적을 눌러 목표('+(b.focus?b.focus.name:'자동')+')를 바꾸고 명령하세요.';updCmdState(true);}
let cmdT=0;function updCmdState(force){cmdT+=1;if(!force&&cmdT%6)return;const b=BT&&BT.b;if(!b||!b.wait)return;const u=b.wait;const av=b.availSkills(u);
  $('bCmd').querySelectorAll('button').forEach(bn=>{const k=bn.dataset.c;if(k==='atk')return;const ok=av.includes(k);bn.disabled=!ok;const cd=bn.querySelector('.cd');if(cd)cd.textContent=u.cds[k]>0?' '+Math.ceil(u.cds[k])+'초':'';});
  $('bHint').textContent='단장 차례! 목표: '+(b.focus&&b.focus.hp>0?b.focus.name:'자동')+' — 적을 눌러 바꿀 수 있어요.';}

/* ================= 던전 탐험 (지도 · 방 · 결과) ================= */
const NODE_IC={battle:'⚔',elite:'💀',trap:'⚠',chest:'🎁',camp:'🔥',shop:'🛒',boss:'👑'};
const NODE_N={battle:'전투',elite:'정예',trap:'함정',chest:'보물',camp:'모닥불',shop:'떠돌이 상인',boss:'보스'};
function departDungeon(dk){const err=G.startRun(dk);if(err){toast(err);return;}closePanel();sfx('levelup',.25);
  const d=D.DUNG[dk];fadeTo(()=>{hideWalkUI();showDmap();say([['나레이션',`[${d.n}] 입구에 도착했다. 길이 여러 갈래로 나뉘어 있다.`]]);});}
function showDmap(){scene='dmap';const r=S().run;const d=D.DUNG[r.dk];$('dmap').classList.remove('hidden');const th=D.THEME[d.theme].bg;$('dmap').style.background=`radial-gradient(ellipse at 50% 30%,${shade(th[1],-.35)}ee,${shade(th[0],-.6)}f4)`;$('dmName').innerHTML=`${d.n} <small class="sub">Lv.${d.lv[0]}~${d.lv[1]} · ${D.THEME[d.theme].n}</small>`;
  hudRefresh();renderDmap();bgmTick();}
function hideDmap(){$('dmap').classList.add('hidden');}
function renderDmap(){const r=S().run;const map=r.map;const L=map.layers.length;const port=H>W;
  const gap=port?92:100,pad=60;const inner=$('dmInner');const width=Math.min(W-30,560),height=pad*2+(L-1)*gap;
  inner.style.width=width+'px';inner.style.height=height+'px';
  const can=new Set(G.reachable());let h='';const pos={};
  map.layers.forEach((row,l)=>row.forEach((n,i)=>{const x=width*((i+1)/(row.length+1))+((l*37+i*13)%17-8);const y=height-pad-l*gap;pos[n.id]=[x,y];}));
  let svg='';for(const row of map.layers)for(const n of row)for(const id of n.links){const [x1,y1]=pos[n.id],[x2,y2]=pos[id];const on=n.done||n.id===r.cur;svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${on?'#ffd166':'#a08060'}" stroke-width="${on?4:3}" stroke-dasharray="${on?'':'6 6'}" opacity="${on?1:.6}"/>`;}
  $('dmSvg').innerHTML=svg;$('dmSvg').setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(const row of map.layers)for(const n of row){const [x,y]=pos[n.id];const c=can.has(n.id);const cls=['node',n.t==='boss'?'boss':'',n.done?'done':'',n.id===r.cur?'cur':'',c?'can':''].join(' ');
    h+=`<button class="${cls}" style="left:${x}px;top:${y}px" data-id="${n.id}" ${c?'':'disabled'}>${NODE_IC[n.t]}<span class="nl">${NODE_N[n.t]}</span></button>`;}
  inner.querySelectorAll('.node').forEach(e=>e.remove());inner.insertAdjacentHTML('beforeend',h);
  inner.querySelectorAll('.node').forEach(b=>b.onclick=()=>{if(!b.disabled)enterNode(b.dataset.id);});
  // 스크롤: 현재 위치로
  const cur=r.cur?pos[r.cur]:[0,height];setTimeout(()=>{$('dmScroll').scrollTop=Math.max(0,cur[1]-$('dmScroll').clientHeight*.6);},30);
  // 전리품·파티
  const lt=r.loot;const tro=Object.values(lt.tro).reduce((a,b)=>a+b,0);
  $('dmLoot').innerHTML=`💰 ${fmt(lt.gold)} G · 전리품 ${tro}개 · 장비 ${lt.items.length}개 · 처치 ${Object.values(r.kills).reduce((a,b)=>a+b,0)}`;
  $('dmParty').innerHTML=G.partyUnits().map(u=>{const st=G.statsOf(u);const hp=Math.max(0,u.hp??st.hp);return `<div class="pm ${hp<=0?'dim':''}"><b>${u===S().leader?'★ ':''}${u.name}</b> <small>Lv${u.lv}</small><div class="bar"><i style="width:${hp/st.hp*100}%;background:${hp<=0?'#666':hp/st.hp<.35?'#e05040':'#5ad04a'}"></i></div><small>${hp<=0?'쓰러짐':fmt(hp)+'/'+fmt(st.hp)}</small></div>`;}).join('');
  const pc=(S().cons.potion||0)+(S().cons.hipotion||0)+(S().cons.feather||0);$('dmPot').textContent='🧪 물약 '+pc;}
$('dmRet').onclick=()=>confirmBox('귀환하시겠습니까?<br><span class="sub">지금까지 얻은 전리품은 모두 가지고 돌아갑니다. 하루가 지나고 급여가 나갑니다.</span>',()=>finishRun('retreat'));
$('dmPot').onclick=()=>{const s=S();let h='<div class="col">';for(const k of ['potion','hipotion','feather']){const c=D.CONSUM[k];h+=`<div class="itemrow">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} ×${s.cons[k]||0}</div><div class="st">${c.d}</div></div><button data-k="${k}" ${s.cons[k]>0?'':'disabled'}>사용</button></div>`;}
  openPanelRaw('물약 사용',h+'</div>');$('pBody').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{const e=G.useConsumable(b.dataset.k);if(e)toast(e);else{sfx('levelup',.25);toast(D.CONSUM[b.dataset.k].n+' 사용!');}closePanel();renderDmap();});};
function enterNode(id){const r=S().run;const n=G.enterNode(id);const d=D.DUNG[r.dk];
  if(n.t==='battle'||n.t==='elite'||n.t==='boss'){const en=G.genEnemies(r.dk,n);
    const doBattle=()=>fadeTo(()=>{hideDmap();startBattle(en,`${d.n} · ${NODE_N[n.t]}`,d.theme,b=>afterFight(b,n));});
    if(n.t==='boss')say(bossLines(d,en),doBattle);else doBattle();return;}
  const ev=G.nodeEvent(n);n.done=true;let h='',title=NODE_N[n.t];
  if(n.t==='chest'){sfx('coin',.35);h=`<p>낡은 상자를 열었다! <b class="gold">💰 ${fmt(ev.gold)} G</b></p>`+(ev.item?`<p>장비를 발견했다: ${itemLine(ev.item)}</p>`:'<p class="sub">장비는 없었다.</p>');}
  else if(n.t==='trap'){if(ev.detected){h=`<p>단장의 눈썰미(지력)로 함정을 먼저 발견해 해체했다! <b class="gold">+${fmt(ev.gold)} G</b></p>`;}else{sfx('hit',.35);h='<p class="bad">함정이 발동했다! 모두 최대 HP의 12% 피해를 입었다.</p><p class="sub">지력이 높을수록 함정을 미리 발견합니다.</p>';}}
  else if(n.t==='camp'){h='<p>따뜻한 모닥불을 발견했다. 무엇을 할까?</p><div class="row"><button class="go" id="cRest">🔥 휴식 — HP 35% 회복 · 쓰러진 동료 25%로 일으킴</button><button id="cTrain">⚔ 훈련 — 파티 경험치 획득</button></div>';}
  else if(n.t==='shop'){h='<p>떠돌이 상인이 짐을 풀었다. "물건 좀 보고 가쇼."</p><div class="col">';
    const pm=1.2;for(const k of ['potion','hipotion','feather']){const c=D.CONSUM[k];const pr=Math.round(D.priceRef(d.lv[1])*c.price*pm/10)*10;h+=`<div class="itemrow">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n}</div><div class="st">${c.d}</div></div><span class="price">${fmt(pr)} G</span><button data-buyc="${k}" data-p="${pr}">사기</button></div>`;}
    ev.items.forEach((it,i)=>{h+=`<div class="itemrow">${itemLine(it)}<span class="price">${fmt(it.price)} G</span><button data-buyi="${i}">사기</button></div>`;});h+='</div>';}
  h+=`<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="warn" id="nRet">⟲ 귀환하기</button><button class="go" id="nGo">전진하기 ▶</button></div>`;
  openPanelRaw(NODE_IC[n.t]+' '+title,h,true);
  const done=()=>{closePanel();renderDmap();};
  $('nGo').onclick=done;$('nRet').onclick=()=>{closePanel();finishRun('retreat');};
  if($('cRest')){$('cRest').onclick=()=>{G.campRest('rest');sfx('levelup',.3);toast('푹 쉬었다. HP가 회복되었다.');$('cRest').disabled=$('cTrain').disabled=true;renderDmap();};
    $('cTrain').onclick=()=>{const x=G.campRest('train');toast('훈련으로 경험치 +'+x);$('cRest').disabled=$('cTrain').disabled=true;renderDmap();};}
  $('pBody').querySelectorAll('[data-buyc]').forEach(b=>b.onclick=()=>{const p=+b.dataset.p;if(S().gold<p)return toast('금화가 부족합니다');G.addGold(-p);S().cons[b.dataset.buyc]=(S().cons[b.dataset.buyc]||0)+1;sfx('coin',.3);toast(D.CONSUM[b.dataset.buyc].n+' 구입');hudRefresh();renderDmap();});
  $('pBody').querySelectorAll('[data-buyi]').forEach(b=>b.onclick=()=>{const it=ev.items[+b.dataset.buyi];if(S().gold<it.price)return toast('금화가 부족합니다');G.addGold(-it.price);G.addItem(it);b.disabled=true;sfx('coin',.3);toast(it.name+' 구입');hudRefresh();});
  renderDmap();}
function bossLines(d,en){const b=en[0];const L={b_slime:'부글부글... 거대한 슬라임이 길을 막고 있다!',b_wolf:'아우우우— 잿빛 갈기가 이빨을 드러낸다.',b_bark:'"감히 바르크 님의 야영지에 발을 들여?"',b_toad:'개굴... 독기를 내뿜는 거대한 두꺼비다!',b_gchief:'"그룩! 인간! 짓밟는다!"',b_cyclops:'수정이 박힌 외눈이 번뜩인다.',
  b_smug:'"렉스 님의 장사를 방해하다니. 바다에 처넣어 주마."',b_kraken:'난파선 아래에서 거대한 촉수가 솟구친다!',b_wraith:'"...이 신전의... 비밀은... 넘겨주지 않는다..."',b_ratking:'찍찍! 하수로의 왕이 부하들을 부른다.',b_warlordorc:'"추방자에게 법은 없다! 고르마가 법이다!"',b_fallen:'"황실의 개들이여... 기사의 맹세는 이미 썩었다."',
  b_ancient:'유적 깊은 곳에서 거대한 눈이 떠졌다.',b_mistwyrm:'안개 속에서 비룡의 울음소리가 울린다.',b_dragon:'"작은 것들이 감히 이그니스의 둥지에!"',b_abyss:'"발테르의 계약은 이행되었다. 이제 이 대륙은 심연의 것이다."'}[d.boss]||'강한 적이 나타났다!';
  const out=[[b.name,L]];if(d.boss2)out.unshift(['배신자 발테르','"철혈 맹약단의 생존자... 네 아비처럼 여기서 끝내 주마!"']);return out;}
function afterFight(b,node){const r=S().run;const out=G.afterBattle(b,node);
  if(!out.win){finishRun('wipe');return;}
  node.done=true;
  if(node.t==='boss'){finishRun('clear');return;}
  let h=`<p><b class="gold">💰 +${fmt(out.gold)} G</b> · 경험치 +${fmt(out.exp)} · 명성 +${out.fame}</p>`;
  if(out.tro.length)h+=`<p class="sub">전리품: ${summarizeTro(out.tro)}</p>`;
  if(out.items.length)h+='<p>장비 획득: '+out.items.map(itemLine).join('')+'</p>';
  if(out.lvups.length){h+=`<p class="good">⬆ 레벨 업: ${out.lvups.join(', ')}</p>`;sfx('levelup',.4);}
  const fallen=b.units.filter(u=>u.side===0&&u.hp<=0&&!u.isL);if(fallen.length)h+=`<p class="bad">쓰러진 동료: ${fallen.map(u=>u.name+' (누적 '+u.ref.falls+'회)').join(', ')}</p>`;
  if(b.units.some(u=>u.isL&&u.hp<=0))h+='<p class="bad">단장이 쓰러졌다! 모닥불이나 부활의 깃털로 일으킬 수 있다.</p>';
  if(S().leader.pts>0)h+=`<p class="good">능력치 포인트 ${S().leader.pts}점이 남아 있습니다 (용병단 → 단장).</p>`;
  h+=`<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="warn" id="nRet">⟲ 귀환하기</button><button class="go" id="nGo">전진하기 ▶</button></div>`;
  showDmap();openPanelRaw(node.t==='elite'?'💀 정예 격파!':'⚔ 승리!',h,true);
  $('nGo').onclick=()=>{closePanel();renderDmap();};$('nRet').onclick=()=>{closePanel();finishRun('retreat');};}
function summarizeTro(list){const c={};for(const t of list)c[t]=(c[t]||0)+1;return Object.entries(c).map(([t,n])=>D.TROPHY[t].n+'×'+n).join(', ');}
function itemLine(it){const R=D.RARITY[it.rar];return `<span class="itemrow" style="display:inline-flex;margin:2px">${icon(it.ic,24)}<span><span class="nm" style="color:${shade(R.c,-.35)}">${it.name}${it.enh?' +'+it.enh:''}</span> <small>${R.n} · Lv${it.lv}</small><br><span class="st">${statStr(it)}</span></span></span>`;}
const STN={hp:'HP',atk:'공격',mag:'마력',def:'방어',spd:'속도',crit:'치명',eva:'회피'};
function statStr(it){const m=1+.08*(it.enh||0);return Object.entries(it.st).map(([k,v])=>STN[k]+' '+(v>0?'+':'')+(k==='spd'||k==='crit'||k==='eva'?v:Math.round(v*m))).join(' · ');}
function finishRun(how){const r=S().run;const dk=r.dk;const res=G.endRun(how);hideDmap();scene='dmap';hideBattleUI();
  const d=D.DUNG[dk];let h='';
  if(how==='wipe')h+='<p class="bad"><b>전멸했다...</b> 가까스로 동료들을 끌고 돌아왔다. 이번 탐험 전리품의 50%를 잃었다.</p>';
  else if(how==='clear')h+=`<p class="good"><b>${d.n} 공략 완료!</b></p>`;else h+='<p>무사히 귀환했다.</p>';
  h+='<div class="card" style="margin:6px 0"><h4>정산</h4>';
  h+=`<div>💰 탐험 수익 <b>+${fmt(res.gold)} G</b></div>`;
  if(res.tro.length)h+=`<div>📦 전리품 판매 <b>+${fmt(res.troGold)} G</b> <small class="sub">(${res.tro.map(t=>D.TROPHY[t[0]].n+'×'+t[1]).join(', ')})</small></div>`;
  if(res.upkeep!=null)h+=`<div>💸 용병단 급여 <b class="bad">-${fmt(res.upkeep-(res.unpaid||0))} G</b>${res.unpaid?` <small class="bad">(${fmt(res.unpaid)} G 체불!)</small>`:''}</div>`;
  if(res.tax)h+=`<div>🏛 자치 세금 <b class="good">+${fmt(res.tax)} G</b></div>`;
  const net=res.gold+res.troGold-(res.upkeep||0)+(res.tax||0);h+=`<div style="margin-top:4px;border-top:1px dashed #a07850;padding-top:4px">순수익 <b class="${net>=0?'good':'bad'}">${net>=0?'+':''}${fmt(net)} G</b> · 명성 +${fmt(res.fame)}</div></div>`;
  if(res.items.length)h+='<p>가져온 장비: '+res.items.map(itemLine).join('')+'</p>';
  if(res.inj.length)h+=`<p class="bad">🩹 중상: ${res.inj.join(', ')} — 여관(치료소)이나 의무실에서 치료하거나 며칠 쉬어야 합니다.</p>`;
  for(const [n,f,st] of res.status)if(st)h+=`<p class="${st==='영구 장애'?'bad':''}">• ${n}: 누적 쓰러짐 ${f}회 → <b>${st}</b>${st==='영구 장애'?' (전 능력치 -25%, 치료 불가) — 용병단 창에서 계약을 정리하세요.':st==='후유증'?' (속도 -15%)':''}</p>`;
  if(res.dailyDone&&res.dailyDone.length||res.daily&&res.daily.length){const ds=[...(res.daily||[]),...(res.dailyDone||[])];h+=`<p class="good">📜 일일 퀘스트 완료: ${ds.map(q=>q.n+' (+'+fmt(q.gold)+' G)').join(', ')}</p>`;}
  if(res.subs.length)h+=`<p class="good">❗ 의뢰 달성: ${res.subs.map(k=>D.SUBS[k].n).join(', ')} — 의뢰인에게 보고하세요.</p>`;
  if(res.main)h+=`<p class="good">★ 메인 퀘스트 「${res.main.n}」 완료!</p>`;
  h+=`<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="go" id="rOk">확인</button></div>`;
  sfx(how==='wipe'?'lose':'coin',.4);
  const back=S().loc;openPanelRaw(how==='wipe'?'귀환 — 전멸':'탐험 결과 · '+(S().day-1)+'일차',h,true);
  $('rOk').onclick=()=>{closePanel();fadeTo(()=>{enterWalk(back==='camp'?'camp':back,null);});};}

/* ================= 월드맵 ================= */
const WPOS={camp:[.2,.62],t1:[.36,.4],t2:[.55,.2],t3:[.78,.55],t4:[.56,.72],abyss:[.86,.18]};
let worldImg=null;
function worldArt(){if(worldImg)return worldImg;const w=640,h=400;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  x.fillStyle='#32b8e8';x.fillRect(0,0,w,h);x.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<70;i++)x.fillRect((i*97)%w,(i*53)%h,4,1);
  // 땅 (풀 타일)
  const land=[[40,130],[120,60],[260,40],[420,30],[560,60],[610,150],[600,280],[520,360],[360,380],[200,360],[70,320],[30,220]];
  x.beginPath();land.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fillStyle='#e4d572';x.fill();x.save();x.clip();
  for(let j=0;j<h;j+=16)for(let i=0;i<w;i+=16){const p=[[1,1],[2,2],[3,2],[5,2],[2,3]][(i*7+j*3)%5];x.drawImage(IMG.t_ss16,p[0]*16,p[1]*16,16,16,i,j,16,16);}
  x.restore();x.lineWidth=6;x.strokeStyle='#e4d572';x.stroke();
  // 산·숲
  for(let i=0;i<26;i++){const px=60+(i*137)%520,py=70+(i*89)%280;if(IMG.el_tree2)x.drawImage(IMG.el_tree2,0,0,32,34,px,py,24,26);}
  x.fillStyle='#8f897e';for(const [a,b] of [[300,90],[330,80],[360,95],[470,110]]){x.beginPath();x.moveTo(a-22,b+16);x.lineTo(a,b-18);x.lineTo(a+22,b+16);x.fill();}
  // 길
  x.strokeStyle='#c28569';x.lineWidth=5;x.setLineDash([8,6]);x.beginPath();const P=k=>[WPOS[k][0]*w,WPOS[k][1]*h];
  for(const [a,b] of [['camp','t1'],['t1','t2'],['t1','t4'],['t4','t3'],['t2','t3'],['t3','abyss']]){x.moveTo(...P(a));x.lineTo(...P(b));}x.stroke();x.setLineDash([]);
  // 심연
  const [ax,ay]=P('abyss');const g=x.createRadialGradient(ax,ay,4,ax,ay,40);g.addColorStop(0,'#1a0a2a');g.addColorStop(1,'rgba(80,30,120,0)');x.fillStyle=g;x.beginPath();x.arc(ax,ay,40,0,Math.PI*2);x.fill();
  worldImg=c.toDataURL();return worldImg;}
function worldPanel(){const s=S();let h=`<div style="position:relative;width:100%;aspect-ratio:16/10;background:url(${worldArt()}) center/cover;image-rendering:pixelated;border-radius:6px;overflow:hidden">`;
  const locs=[['camp','⛺','집결지'],['t1','🌾',D.TOWNS.t1.n],['t2','⛏',D.TOWNS.t2.n],['t3','⚓',D.TOWNS.t3.n],['t4','🏰',D.TOWNS.t4.n]];
  if(G.dungOpen('d_abyss'))locs.push(['abyss','🌀','심연의 왕좌']);
  for(const [k,ic,n] of locs){const open=k==='abyss'||G.townOpen(k);const here=s.loc===k;
    h+=`<button class="wloc ${here?'sel':''}" data-k="${k}" ${open?'':'disabled'} style="position:absolute;left:${WPOS[k][0]*100}%;top:${WPOS[k][1]*100}%;transform:translate(-50%,-50%);padding:3px 7px;font-size:12px;white-space:nowrap">${ic} ${n}${open?'':' 🔒'}</button>`;}
  h+='</div><div id="wInfo" style="margin-top:8px"></div>';
  openPanelRaw('🗺 월드맵',h);
  const sel=k=>{$('pBody').querySelectorAll('.wloc').forEach(b=>b.classList.toggle('sel',b.dataset.k===k));$('wInfo').innerHTML=locInfo(k);bindLocInfo(k);};
  $('pBody').querySelectorAll('.wloc').forEach(b=>b.onclick=()=>sel(b.dataset.k));sel(s.loc==='run'?'camp':s.loc);}
function locInfo(k){const s=S();let h='';
  if(k==='camp'){h+=`<div class="card"><h4>⛺ 집결지 — ${D.CAMP_TIERS[s.camp.tier].n}</h4><div class="sub">용병들이 쉬는 내 거점. 건물을 짓고 꾸며서 성채 마을로 키웁니다.</div><div class="row" style="margin-top:6px"><button class="go" data-go="camp">집결지로 이동</button></div></div>`;
    const ds=['d_ruin','d_mist','d_nest'];h+=dungList(ds,'거점 직통 던전');}
  else if(k==='abyss'){h+=dungList(['d_abyss'],'최종 던전');}
  else{const t=D.TOWNS[k];const open=G.townOpen(k);
    h+=`<div class="card"><h4>${t.n} <small class="sub">${t.tag} · ${D.TIER[t.tier].n}</small></h4><div class="sub">${t.desc}</div>`;
    if(!open)h+=`<div class="bad" style="margin-top:4px">🔒 ${t.req}등급이 되어야 갈 수 있습니다.</div>`;
    else h+=`<div class="sub" style="margin-top:3px">대우: ${['무시','보통','존중','전설'][G.attitude(k)]} ${t.goodRank&&G.rankIdx(s.rank)<G.rankIdx(t.goodRank)?'· '+t.goodRank+'등급이 되면 대우가 달라집니다':''}</div><div class="row" style="margin-top:6px"><button class="go" data-go="${k}">마을로 이동</button></div>`;
    h+='</div>';if(open)h+=dungList(t.dung,'지역 던전');}
  return h;}
function dungList(ds,title){const s=S();let h=`<div class="sub" style="margin:8px 0 4px;font-weight:800">${title}</div><div class="col">`;
  for(const dk of ds){const d=D.DUNG[dk];const open=G.dungOpen(dk);let why='';
    if(!open){if(d.campTier)why=`집결지 ${d.campTier}단계 [${D.CAMP_TIERS[d.campTier].n}] 필요`;else if(d.unlock){const m=D.MAIN.find(x=>x.id===d.unlock);why=`메인 퀘스트 「${m.n}」 단계에서 열림`;}else why=d.rank+'등급 필요';}
    const cl=(s.stats.clears||{})[dk]||0;
    h+=`<div class="itemrow" style="cursor:default"><div style="flex:1"><div class="nm">${d.n} <small class="sub">Lv.${d.lv[0]}~${d.lv[1]} · ${D.THEME[d.theme].n}${cl?' · 공략 '+cl+'회':''}</small></div><div class="st">${open?'보스: '+(D.BOSS[d.boss].n)+' · 예상 수익 약 '+fmt(D.TIER[d.tier].inc*d.dm)+' G':'🔒 '+why}</div></div>${open?`<button class="go" data-dk="${dk}">출정</button>`:''}</div>`;}
  return h+'</div>';}
function bindLocInfo(k){$('wInfo').querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const to=b.dataset.go;closePanel();fadeTo(()=>enterWalk(to));});
  $('wInfo').querySelectorAll('[data-dk]').forEach(b=>b.onclick=()=>departCheck(b.dataset.dk));}
function departCheck(dk){const s=S();const d=D.DUNG[dk];const pu=G.partyUnits();const inj=s.mercs.filter(m=>s.party.includes(m.id)&&m.status==='inj');
  let h=`<p><b>${d.n}</b> (Lv.${d.lv[0]}~${d.lv[1]})로 출정합니다.</p><div class="col">`;
  for(const u of pu){const st=G.statsOf(u);h+=`<div class="itemrow" style="cursor:default"><img class="spr" src="${portrait(unitDesc(u),40)}" width="40" height="40"><div style="flex:1"><b>${u===s.leader?'★ '+u.name+' (단장)':u.name}</b> <small>Lv${u.lv} ${u===s.leader?D.LCLASS[u.cls].n:D.JOBS[u.job].n}</small><div class="st">HP ${fmt(st.hp)} · 공격 ${st.atk} · 마력 ${st.mag} · 방어 ${st.def}</div></div></div>`;}
  h+='</div>';if(pu.length<3)h+='<p class="bad">⚠ 인원이 적습니다. 여관에서 용병을 고용하는 것을 추천합니다.</p>';
  if(inj.length)h+=`<p class="bad">🩹 중상인 ${inj.map(m=>m.name).join(', ')}은(는) 출정하지 못합니다.</p>`;
  const avg=pu.reduce((a,u)=>a+u.lv,0)/pu.length;if(avg<d.lv[0]-1)h+=`<p class="bad">⚠ 파티 평균 레벨(${avg.toFixed(1)})이 낮습니다. 위험할 수 있어요.</p>`;
  h+=`<p class="sub">돌아오면 하루가 지나고 용병단 급여 약 ${fmt(G.upkeep())} G가 나갑니다. 물약: 회복 ${s.cons.potion||0} · 상급 ${s.cons.hipotion||0} · 깃털 ${s.cons.feather||0}</p>`;
  h+=`<div class="row" style="justify-content:flex-end"><button id="dPar">👥 파티 편성</button><button class="go" id="dGo">⚔ 출정!</button></div>`;
  openPanelRaw('출정 준비',h);$('dGo').onclick=()=>departDungeon(dk);$('dPar').onclick=()=>openPanel('party');}

/* ================= 대화창 ================= */
let dlgQ=[],dlgCb=null;
function say(lines,cb){if(!lines||!lines.length){cb&&cb();return;}dlgQ=dlgQ.concat(lines.map(l=>l.slice()));if(cb){const prev=dlgCb;dlgCb=prev?()=>{prev();cb();}:cb;}if($('dlg').classList.contains('hidden'))nextLine();}
function nextLine(){const l=dlgQ.shift();if(!l){$('dlg').classList.add('hidden');const cb=dlgCb;dlgCb=null;cb&&cb();return;}
  const [name,text]=l;$('dName').textContent=name==='나레이션'?'':name;$('dText').innerHTML=text;$('dlg').classList.remove('hidden');
  const f=$('dFace');const desc=faceFor(name);if(desc){f.style.display='';f.style.backgroundImage=`url(${portrait(desc,84,'f_'+name)})`;f.style.backgroundSize='84px 84px';}else f.style.display='none';
  $('dText').style.fontStyle=name==='나레이션'?'italic':'';}
$('dlg').onclick=()=>{sfx('click',.15);nextLine();};
function hash(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
function faceFor(name){if(name==='나레이션')return null;if(name===S()?.leader?.name)return unitDesc(S().leader);
  for(const k in D.BOSS)if(D.BOSS[k].n===name){return sprDesc(D.BOSS[k].spr,D.BOSS[k].tint);}
  if(name.includes('가렛'))return {kind:'human',look:{o:4,hair:'shorthair',hc:4},tool:true};
  if(name.includes('발테르'))return sprDesc('h_valter');
  if(name.includes('황제'))return {kind:'human',look:{o:8,hair:'longhair',hc:3}};
  const h=hash(name);return {kind:'human',look:{o:[0,1,2,3,6,7,8,9][h%8],hair:D.HAIRS[h%6],hc:(h>>3)%7}};}

/* ================= 패널 공용 ================= */
let panelOnClose=null;
function openPanelRaw(title,html,modal){$('pTitle').innerHTML=title;$('pBody').innerHTML=html;$('panel').classList.remove('hidden');$('panel').dataset.modal=modal?'1':'';$('pClose').style.display=modal?'none':'';$('pBody').scrollTop=0;}
function closePanel(){$('panel').classList.add('hidden');const cb=panelOnClose;panelOnClose=null;hudRefresh();if(cb)cb();if(scene==='walk')setTimeout(mainTick,60);}
$('pClose').onclick=closePanel;$('panel').onclick=e=>{if(e.target===$('panel')&&!$('panel').dataset.modal)closePanel();};
function uiBusy(){return !$('panel').classList.contains('hidden')||!$('dlg').classList.contains('hidden');}
function confirmBox(msg,yes){openPanelRaw('확인',`<p>${msg}</p><div class="row" style="justify-content:flex-end"><button id="cNo">아니오</button><button class="go" id="cYes">예</button></div>`,true);$('cNo').onclick=()=>closePanel();$('cYes').onclick=()=>{closePanel();yes();};}
function tabs(list,cur,fn){return '<div class="tabs">'+list.map(([k,n])=>`<button data-tab="${k}" class="${k===cur?'sel':''}">${n}</button>`).join('')+'</div>';}
function bindTabs(fn){$('pBody').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>fn(b.dataset.tab));}
function openPanel(k,arg){if(k==='world')return worldPanel();if(k==='party')return partyPanel(arg);if(k==='bag')return bagPanel(arg);if(k==='quest')return questPanel();if(k==='menu')return menuPanel();}
document.querySelectorAll('#hud [data-p]').forEach(b=>b.onclick=()=>{if(scene==='battle')return;if(scene==='dmap'&&b.dataset.p==='world')return toast('던전 안에서는 지도를 열 수 없습니다');openPanel(b.dataset.p);});
$('goal').onclick=()=>openPanel('quest');

/* ================= 상단 정보 · 목표 · 가이드 ================= */
function hudRefresh(){const s=S();if(!s)return;const r=s.rank;$('hRank').textContent=r;$('hRank').style.color=shade(D.RANK_COLOR[r],-.35);
  $('hFame').textContent=fmt(s.fame);const p=D.PROMO[r];$('hFameN').textContent=p&&p.fame?'/ '+fmt(p.fame):'';
  $('hGold').textContent=fmt(s.gold);$('hDay').textContent=s.day;
  $('hLoc').textContent=s.run?D.DUNG[s.run.dk]?.n||'전투':s.loc==='camp'?'집결지':D.TOWNS[s.loc]?.n||'';
  const m=G.curMain();$('goalTxt').textContent=m?`[${m.ch}장] ${m.goal}`:s.ending?'용병왕 등극! 자유롭게 대륙을 누비세요.':'';
  guideRefresh();}
function guideRefresh(){const g=$('guide');const s=S();if(!g.dataset.init){g.dataset.init=1;if(W<700)g.classList.add('fold');}if(!s||scene!=='walk'||s.loc!=='camp'){g.classList.add('hidden');return;}g.classList.remove('hidden');
  const nx=G.campNext();let h=`<div class="ghead"><span>🏕 현재 거처: ${s.camp.tier}단계 ${D.CAMP_TIERS[s.camp.tier].n}</span><span>${g.classList.contains('fold')?'▼':'▲'}</span></div><div class="gbody">`;
  if(!nx){h+='<div class="good">최고 단계에 도달했습니다! 영웅의 전당과 대리석 광장으로 성채를 완성하세요.</div>';
    for(const k of ['keep','hall','plaza'])h+=`<div class="gl"><span>• ${D.BUILDS[k].n}</span><span class="${s.camp.built[k]?'ok':'no'}">${s.camp.built[k]?'완료':fmt(D.BUILDS[k].cost)+' G'}</span></div>`;}
  else{h+=`<div>➔ 다음 목표: <b>${nx.tier}단계 ${nx.name}</b></div>`;
    h+=`<div class="gl"><span>• 용병단 등급 ${nx.rank} 이상</span><span class="${nx.rankOk?'ok':'no'}">${nx.rankOk?'완료':'현재 '+s.rank}</span></div>`;
    for(const [k,ok] of nx.build)h+=`<div class="gl"><span>• 건설: [${D.BUILDS[k].n.replace(/ \(.*\)/,'')}]</span><span class="${ok?'ok':'no'}">${ok?'완료':fmt(D.BUILDS[k].cost)+' G'}</span></div>`;
    h+=`<div class="gl"><span>• 꾸미기 점수</span><span class="${nx.decor>=nx.decorNeed?'ok':'no'}">${nx.decor} / ${nx.decorNeed} pt</span></div>`;
    h+=`<div class="gl"><span>• 승급 비용</span><span class="${s.gold>=nx.cost?'ok':'no'}">${fmt(nx.cost)} G</span></div>`;
    h+=`<div class="grew">✨ 승급 보상: ${nx.reward}</div>`;
    h+=`<button class="gbtn ${nx.ok?'go glow':''}" id="gUp" ${nx.ok?'':'disabled'}>${nx.ok?'거처 승급하기!':'조건을 채우면 승급할 수 있어요'}</button><button class="gbtn" id="gBuild">🔨 건설 · 꾸미기</button>`;}
  h+='</div>';g.innerHTML=h;
  g.querySelector('.ghead').onclick=()=>{g.classList.toggle('fold');guideRefresh();};
  if($('gUp'))$('gUp').onclick=()=>{const e=G.campUpgrade();if(e)return toast(e);sfx('levelup',.5);toast(`🎉 집결지가 [${D.CAMP_TIERS[S().camp.tier].n}](으)로 승급했습니다!`,'');enterWalk('camp');};
  if($('gBuild'))$('gBuild').onclick=()=>buildPanel();}
function showWalkUI(){['hud','goal'].forEach(i=>$(i).classList.remove('hidden'));hudRefresh();setTimeout(mainTick,250);}
function hideWalkUI(){$('goal').classList.add('hidden');$('guide').classList.add('hidden');}
// 메인 퀘스트 대사 표시
function mainTick(){const s=S();if(!s||scene!=='walk'||uiBusy())return;
  const done=G.mainDone.slice();G.clearMainDone();const lines=[];
  for(const m of done){if(m.done)lines.push(...m.done);}
  if(s.mainShown<s.main||done.length){const m=G.curMain();if(m&&s.mainShown<s.main){if(m.type!=='talk'&&m.talk)lines.push(...m.talk);}s.mainShown=s.main;
    if(m)lines.push(['나레이션',`<b>새 목표</b> — [${m.ch}장 ${m.n}] ${m.goal}`]);}
  if(lines.length)say(lines,()=>{hudRefresh();if(s.ending&&!s.endShown){s.endShown=true;endingScreen();}});
  else if(s.ending&&!s.endShown){s.endShown=true;endingScreen();}}
function endingScreen(){const s=S();say([['나레이션','몰락한 용병단의 낡은 텐트 한 동에서 시작한 여정.'],['나레이션',`${s.day}일 동안 ${s.stats.runs}번의 탐험을 거쳐, 철혈 맹약단은 대륙 최강의 용병단이 되었다.`],
  ['나레이션',`집결지는 [${D.CAMP_TIERS[s.camp.tier].n}]이(가) 되었고, 사람들은 그대를 <b>용병왕</b>이라 부른다.`],['나레이션','— 용병왕의 길 · 끝 —<br><span class="sub">이후에도 계속 플레이할 수 있습니다. 용의 둥지와 남은 의뢰에 도전해 보세요!</span>']]);}

/* ================= 장소별 행동 ================= */
function openAct(act,o){const s=S(),tk=MAP.town;
  if(act==='plot')return buildPanel(o.plot);
  if(act==='tent')return tentPanel();
  if(act==='fire'){const ms=s.mercs.filter(m=>m.status==='ok');const m=ms.length?pick(ms):null;
    if(m){const e=MAP.npcs.find(n=>n.ref===m);if(e){e.bubble={text:G.mercLine(m,'fire'),t:5};}}
    return say([['나레이션','모닥불이 타닥타닥 타오른다. 동료들이 둘러앉아 쉬고 있다.']].concat(m?[[m.name,G.mercLine(m,'fire')]]:[]));}
  if(act==='board')return dailyPanel('집결지 의뢰 게시판');
  if(act==='store')return shopPanel('camp');
  if(act==='clinic')return innPanel('camp','heal');
  if(act==='forge')return smithPanel('camp');
  if(act==='tavern')return innPanel('camp','hire');
  if(act==='training')return trainingPanel();
  if(act==='bunk')return partyPanel('mercs');
  if(act==='hall')return say([['나레이션','영웅의 전당. 철혈 맹약단의 옛 영웅들과 지금의 동료들 이름이 새겨져 있다. (파티 능력치 +10%)']]);
  if(act==='guild')return guildPanel(tk);
  if(act==='shop')return shopPanel(tk);
  if(act==='inn')return innPanel(tk,'hire');
  if(act==='smith'){if(G.attitude(tk)<2&&tk!=='t4'){return say([['대장장이','풋내기한테 내 망치를 맡길 순 없지. '+(D.TOWNS[tk].goodRank)+'등급은 되고 와.']]);}return smithPanel(tk);}
  if(act==='relic'){if(G.rankIdx(s.rank)<G.rankIdx('C'))return say([['유물 상인','C등급 이상 용병단에게만 유물을 보여 드립니다.']]);return shopPanel(tk,true);}
  if(act==='hq')return hqPanel();
  if(act==='arena')return arenaPanel();
  if(act==='classhall')return classPanel();}

/* ----- 의뢰소 ----- */
function guildPanel(tk,tab){const s=S();const t=D.TOWNS[tk];
  const tm=G.talkMain(tk+':guild');if(tm){say(tm.talk,()=>guildPanel(tk));hudRefresh();return;}
  tab=tab||'dung';let h=tabs([['dung','던전'],['daily','일일 퀘스트'],['exam','승급 심사']],tab);
  const att=G.attitude(tk);const greet=G.townLine(tk,'folk');
  if(tab==='dung'){h+=`<p class="sub">"${att===0?'풋내기에게 줄 일감은 많지 않아. 할 수 있는 것부터 해.':att>=3?'전설의 단장님! 무엇이든 맡겨 주십시오.':'오늘은 어떤 일을 맡겠나?'}"</p>`;h+=dungList(t.dung,t.n+' 주변 던전');}
  else if(tab==='daily'){h+=dailyHtml();}
  else{const ex=G.examReady();const p=D.PROMO[s.rank];
    h+=`<div class="card"><h4>현재 등급 <span style="color:${shade(D.RANK_COLOR[s.rank],-.3)}">${s.rank}</span> · 명성 ${fmt(s.fame)}</h4>`;
    if(!p||!p.next)h+='<div>최고 등급입니다.</div>';
    else{h+=`<div>다음 등급 <b>${p.next}</b> 조건: 명성 ${fmt(p.fame)} + 승급 심사 통과</div>`;
      if(!ex)h+='<div class="sub">메인 스토리를 진행하면 심사 자격이 주어집니다.</div>';
      else if(ex.town!==tk)h+=`<div class="sub">심사는 ${D.TOWNS[ex.town].n} 의뢰소에서 받을 수 있습니다.</div>`;
      else{const e=D.EXAMS[ex.exam];h+=`<div style="margin-top:6px"><b>${e.n}</b> — ${e.d} (Lv.${e.lv})</div>`;
        h+=ex.ok?`<button class="go" id="exGo" style="margin-top:6px">⚔ 승급 심사 시작</button>`:`<div class="bad">명성이 ${fmt(ex.fame-s.fame)} 부족합니다. 던전과 의뢰로 명성을 쌓으세요.</div>`;}}
    h+='</div>';}
  openPanelRaw(`📜 ${t.n} 의뢰소`,h);bindTabs(k=>guildPanel(tk,k));bindLocInfo2();
  if($('exGo'))$('exGo').onclick=()=>{closePanel();const ex=G.examReady();special(ex.exam,b=>{if(b.over===1){G.passExam(ex.exam);sfx('levelup',.5);toast(`🎖 ${S().rank}등급 승급!`);}else toast('심사에 떨어졌습니다. 더 강해져서 다시 도전하세요.');});};}
function bindLocInfo2(){$('pBody').querySelectorAll('[data-dk]').forEach(b=>b.onclick=()=>departCheck(b.dataset.dk));}
function dailyHtml(){const s=S();let h=`<p class="sub">하루(던전 1회 탐험)마다 새로 바뀝니다. 완료하면 귀환할 때 자동으로 보상을 받습니다.</p><div class="col">`;
  for(const q of s.dailies)h+=`<div class="itemrow" style="cursor:default"><div style="flex:1"><div class="nm">${q.done?'✅':'▫'} ${q.n}</div><div class="st">${q.goal} (${q.prog}/${q.count})</div></div><span class="price gold">${fmt(q.gold)} G · 명성 ${q.fame}</span></div>`;
  return h+'</div>';}
function dailyPanel(title){openPanelRaw('📌 '+title,dailyHtml());}
// 특수 전투 (승급 심사·투기장·전직 시험)
function special(ek,cb,opt){G.startSpecial(ek);const e=D.EXAMS[ek];const en=G.examEnemies(ek);
  const run=()=>fadeTo(()=>{hideWalkUI();startBattle(en,e.n,ek.startsWith('arena')?'camp':ek==='exam_b'?'abyss':'fort',b=>{G.afterBattle(b,null);const res=G.endRun('special');cb&&cb(b);fadeTo(()=>enterWalk(S().loc==='run'?'camp':S().loc));},{full:true});});
  const bl=en.find(x=>x.boss);if(bl&&!opt)say([[bl.name,{exam_f:'"F등급 풋내기들인가. 실력을 보여 봐라!"',exam_e:'"광산에선 실력이 전부다. 덤벼라!"',exam_d:'"항구를 지킬 자격이 있는지 보겠다."',exam_c:'"황실의 개들이 왔군. 기사의 검을 받아라!"',exam_b:'"심연의 문은 열렸다. 돌아갈 곳은 없다!"',classtest:'"새로운 길을 원하나? 증명해 보아라."',arena3:'"투기장의 왕좌는 내 것이다!"'}[ek]||'"덤벼라!"']],run);else run();}

/* ----- 상점 ----- */
function shopStock(tk,relic){const s=S();s.shops=s.shops||{};const key=tk+(relic?'_r':'');let st=s.shops[key];
  if(!st||st.day!==s.day){const t=D.TOWNS[tk];const lr=t?t.shopLv:[1,10];const lv=clamp(Math.round(Math.max(lr[0],Math.min(lr[1],G.S.leader.lv+1))),1,50);const items=[];
    const cls=['sword','bow','staff','axe','mace','dagger'];
    if(relic){for(let i=0;i<5;i++)items.push(G.genItem(lv+2,G.ri(2,3),pick(['wpn','arm','acc'])));}
    else{for(const c of cls.slice(0,4))items.push(G.genItem(lv,Math.random()<.25?1:0,'wpn',c));for(const a of ['heavy','light','robe'])items.push(G.genItem(lv,Math.random()<.25?1:0,'arm',a));for(let i=0;i<2;i++)items.push(G.genItem(lv,Math.random()<.3?1:0,'acc'));}
    st=s.shops[key]={day:s.day,items};}
  return st.items;}
function shopPanel(tk,relic,tab){const s=S();tab=tab||(tk==='camp'?'pot':relic?'gear':'pot');const pm=tk==='camp'?.9:G.priceMul(tk)*(relic?1.4:1);const lvRef=Math.max(3,G.S.leader.lv);
  let h=tk==='camp'?'':tabs([['pot','물약'],['gear','장비'],['sell','팔기']].filter(x=>!(relic&&x[0]==='pot')),tab);
  if(tk!=='camp'){const a=G.attitude(tk);h+=`<p class="sub">"${G.townLine(tk,'merchant')}" ${a===0?'<span class="bad">(무시 대우: 가격 +'+Math.round((pm/(1-0)-1)*100)+'%)</span>':a>=2?'<span class="good">(우대 할인 적용)</span>':''}</p>`;}
  if(tab==='pot'){h+='<div class="col">';for(const k of ['potion','hipotion','feather']){const c=D.CONSUM[k];const pr=Math.round(D.priceRef(lvRef)*c.price*pm/10)*10;
      h+=`<div class="itemrow" style="cursor:default">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} <small>보유 ${s.cons[k]||0}</small></div><div class="st">${c.d}</div></div><span class="price">${fmt(pr)} G</span><button data-bc="${k}" data-p="${pr}">사기</button></div>`;}h+='</div>';}
  else if(tab==='gear'){const items=shopStock(tk,relic);h+='<div class="col">';items.forEach((it,i)=>{if(it.sold)return;const pr=Math.round(it.val*pm/10)*10;h+=`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1"></span><span class="price">${fmt(pr)} G</span><button data-bi="${i}" data-p="${pr}">사기</button></div>`;});h+='</div><p class="sub">장비 목록은 매일 바뀝니다.</p>';}
  else{h+=sellHtml();}
  openPanelRaw((relic?'💎 유물 상점':tk==='camp'?'🧪 보급 상점':'🛒 상점'),h);bindTabs(k=>shopPanel(tk,relic,k));
  $('pBody').querySelectorAll('[data-bc]').forEach(b=>b.onclick=()=>{const p=+b.dataset.p;if(s.gold<p)return toast('금화가 부족합니다');G.addGold(-p);s.cons[b.dataset.bc]=(s.cons[b.dataset.bc]||0)+1;sfx('coin',.3);shopPanel(tk,relic,tab);});
  $('pBody').querySelectorAll('[data-bi]').forEach(b=>b.onclick=()=>{const items=shopStock(tk,relic);const it=items[+b.dataset.bi];const p=+b.dataset.p;if(s.gold<p)return toast('금화가 부족합니다');if(G.invFull())return toast('가방이 가득 찼습니다');G.addGold(-p);const c=Object.assign({},it,{id:'i'+Date.now()+'_'+Math.random().toString(36).slice(2,6)});it.sold=true;G.addItem(c);sfx('coin',.3);toast(it.name+' 구입! 가방에서 장착하세요.');shopPanel(tk,relic,tab);});
  bindSell(()=>shopPanel(tk,relic,'sell'));}
function sellHtml(){const s=S();const free=s.inv.filter(i=>!G.ownerOf(i.id));if(!free.length)return '<p class="sub">팔 수 있는 장비가 없습니다. (장착 중인 장비는 팔 수 없어요)</p>';
  return '<div class="col">'+free.map(it=>`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1"></span><span class="price">${fmt(Math.round(it.val*.25*(1+.15*(it.enh||0))))} G</span><button data-sell="${it.id}">팔기</button></div>`).join('')+'</div>';}
function bindSell(re){$('pBody').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const v=G.sellItem(b.dataset.sell);if(v){sfx('coin',.3);toast('+'+fmt(v)+' G');}re();});}

/* ----- 여관 (고용 · 치료) ----- */
function innPanel(tk,tab){const s=S();tab=tab||'hire';let h=tabs([['hire','용병 고용'],['heal','치료'],['rest','하루 쉬기']],tab);
  if(tab==='hire'){const list=G.recruitList(tk);h+=`<p class="sub">보유 ${s.mercs.length} / ${G.maxRoster()}명 · 후보는 매일 바뀝니다. 잠재력은 함께 지내 봐야 알 수 있습니다.</p><div class="col">`;
    for(const m of list){const st=G.mercStats(m);const gr=D.GRADES[m.grade];
      h+=`<div class="itemrow" style="cursor:default;align-items:flex-start"><img class="spr" src="${portrait(unitDesc(m),48)}" width="48" height="48"><div style="flex:1"><div class="nm"><span style="color:${shade(gr.c,-.4)}">[${gr.n}]</span> ${m.name} <small>Lv${m.lv} ${D.JOBS[m.job].n}</small></div>
      <div class="st">성격: ${D.PERS[m.pers].n} · 잠재력 ??? · ${D.JOBS[m.job].desc}</div><div class="st">HP ${fmt(st.hp)} · 공격 ${st.atk} · 마력 ${st.mag} · 방어 ${st.def} · 속도 ${st.spd}</div><div class="st">급여 ${fmt(G.wage(m))} G/회</div></div>
      <div class="col" style="align-items:flex-end"><span class="price">${fmt(G.hireCost(m))} G</span><button class="go" data-hire="${m.id}">고용</button></div></div>`;}
    h+='</div>';}
  else if(tab==='heal'){const inj=s.mercs.filter(m=>m.status==='inj');h+=`<p class="sub">중상인 용병은 출정할 수 없습니다. 치료하거나 하루하루 쉬면 회복합니다.${s.camp.built.clinic?' (의무실: 치료비 50% 할인)':''}</p>`;
    if(!inj.length)h+='<p>치료가 필요한 용병이 없습니다.</p>';
    for(const m of inj)h+=`<div class="itemrow" style="cursor:default"><img class="spr" src="${portrait(unitDesc(m),40)}" width="40" height="40"><div style="flex:1"><div class="nm">${m.name}</div><div class="st">중상 · 자연 회복까지 ${m.injDays}일 · 누적 쓰러짐 ${m.falls}회</div></div><span class="price">${fmt(G.healCost(m))} G</span><button data-heal="${m.id}">치료</button></div>`;}
  else{h+=`<p>던전에 가지 않고 하루를 보냅니다.</p><ul class="sub"><li>중상 회복이 하루 진행됩니다</li><li>일일 퀘스트가 새로 바뀝니다</li><li>용병단 급여 ${fmt(G.upkeep())} G가 나갑니다${G.campTax()?' (자치 세금 +'+fmt(G.campTax())+' G)':''}</li></ul><button class="go" id="restGo">🌙 하루 쉬기</button>`;}
  openPanelRaw(tk==='camp'?(tab==='heal'?'🏥 의무실':'🍺 용병 주점'):'🛏 여관 · 치료소',h);bindTabs(k=>innPanel(tk,k));
  $('pBody').querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const e=G.hire(tk,b.dataset.hire);if(e)return toast(e);const m=S().mercs[S().mercs.length-1];m.lvHire=m.lv;sfx('coin',.35);
    say([[m.name,{brave:'좋아, 싸울 곳만 있다면 어디든 간다!',cold:'계약 조건을 확인했습니다. 잘 부탁드립니다.',cheer:'와아, 잘 부탁해요 단장님!',greedy:'돈만 제때 주면 불만 없어.',coward:'저, 저도 열심히 할게요... 앞에는 안 서도 되죠?',loyal:'오늘부터 이 검은 단장님의 것입니다.'}[m.pers]]]);G.checkMain();innPanel(tk,'hire');});
  $('pBody').querySelectorAll('[data-heal]').forEach(b=>b.onclick=()=>{const e=G.treat(b.dataset.heal);if(e)return toast(e);sfx('levelup',.3);toast('치료 완료!');innPanel(tk,'heal');});
  if($('restGo'))$('restGo').onclick=()=>{const r=G.restDay();closePanel();toast(`🌙 하루가 지났습니다. 급여 -${fmt(r.upkeep-(r.unpaid||0))} G`);hudRefresh();if(scene==='walk')enterWalk(S().loc,{x:Math.floor(player.x/T),y:Math.floor(player.y/T)});};}

/* ----- 대장간 (강화) ----- */
function smithPanel(tk){const s=S();const its=s.inv.slice().sort((a,b)=>(G.ownerOf(b.id)?1:0)-(G.ownerOf(a.id)?1:0));
  let h=`<p class="sub">장비를 강화하면 능력치가 단계마다 8%씩 오릅니다. (최대 +5, 실패하면 금화만 잃습니다)</p><div class="col">`;
  for(const it of its){const o=G.ownerOf(it.id);const e=it.enh||0;h+=`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1;font-size:11px" class="sub">${o?'장착: '+o.name:''}</span>${e>=5?'<b>최대</b>':`<span class="price">${fmt(G.enhCost(it))} G<br><small>성공 ${[100,90,75,60,45][e]}%</small></span><button data-enh="${it.id}">+${e+1} 강화</button>`}</div>`;}
  openPanelRaw(tk==='camp'?'🔨 목재 대장간':'⚒ 대장간',h+'</div>');
  $('pBody').querySelectorAll('[data-enh]').forEach(b=>b.onclick=()=>{const r=G.enhance(b.dataset.enh);if(r==='ok'){sfx('levelup',.35);toast('✨ 강화 성공!');}else if(r==='fail'){sfx('lose',.3);toast('강화 실패...');}else toast(r);smithPanel(tk);});}

/* ----- 메인 길드 · 투기장 · 전직 ----- */
function hqPanel(){const s=S();if(G.rankIdx(s.rank)<G.rankIdx('B')){const tm=null;return say([['길드 경비','메인 길드는 B등급 이상만 출입할 수 있다. 돌아가라.']]);}
  const tm=G.talkMain('t4:hq');if(tm){say(tm.talk,()=>{});hudRefresh();return;}
  let h=`<p>"용병왕을 꿈꾸는 자들이 모이는 곳이다." — 길드 마스터 아이언</p>`;const ex=G.examReady();
  if(ex&&ex.exam==='exam_b')h+=ex.ok?`<button class="go" id="hqEx">⚔ 심연 전초 돌파 (B→A)</button>`:`<p class="bad">명성 ${fmt(ex.fame)}이 필요합니다. (현재 ${fmt(s.fame)})</p>`;
  h+=dungList(['d_fort','d_waste','d_sewer'],'황실 의뢰 던전')+dailyHtml();
  openPanelRaw('🏛 메인 길드 본부',h);bindLocInfo2();if($('hqEx'))$('hqEx').onclick=()=>{closePanel();special('exam_b',b=>{if(b.over===1){G.passExam('exam_b');sfx('levelup',.5);toast('🎖 A등급 승급!');}});};}
function arenaPanel(){const s=S();const mi=D.MAIN.findIndex(m=>m.id==='m4_5');
  if(s.main<mi)return say([['투기장 관리인','왕실 투기장은 황실이 인정한 용병단만 출전할 수 있소. (메인 퀘스트 4장 진행 필요)']]);
  const first=s.main===mi;const inc=D.TIER[4].inc;
  let h=`<p>왕실 투기장 3연전. 세 번을 연달아 이기면 우승입니다. ${first?'<b class="good">우승하면 황제를 알현할 수 있습니다!</b>':'(우승 상금 '+fmt(Math.round(inc*.8))+' G)'}</p><p class="sub">전투마다 파티 HP는 가득 찬 상태로 시작합니다.</p><button class="go" id="arGo">⚔ 출전</button>`;
  openPanelRaw('🏟 왕실 투기장',h);
  $('arGo').onclick=()=>{closePanel();const seq=['arena1','arena2','arena3'];let i=0;
    const next=()=>special(seq[i],b=>{if(b.over!==1){toast('투기장에서 패배했습니다...');return;}i++;if(i<seq.length){setTimeout(()=>{toast(`${i}승! 다음 경기`);next();},2200);}
      else{s.arena=(s.arena||0)+1;if(first){G.advanceMain();G.checkMain();const it=G.genUnique('u_champion');G.addItem(it);toast('🏆 우승! '+it.name+' 획득');}else{G.addGold(Math.round(inc*.8));G.addFame(40*D.TIER[4].fameMul/10);toast('🏆 우승! 상금 '+fmt(Math.round(inc*.8))+' G');}sfx('levelup',.5);}},i>0);
    next();};}
function classPanel(){const s=S();const L=s.leader;const c=D.LCLASS[L.cls];
  if(c.base){return openPanelRaw('🎓 전직의 전당',`<p>이미 <b>${c.n}</b>(으)로 전직했습니다.</p><p class="sub">${c.desc}<br>패시브: ${D.PASSIVE[c.passive]}</p>`);}
  if(G.rankIdx(s.rank)<G.rankIdx('C'))return say([['전직 교관','전직 시험은 C등급 이상만 응시할 수 있네.']]);
  let h=`<p>현재 직업: <b>${c.n}</b>. 전직 시험을 통과하면 두 갈래 중 하나를 고를 수 있습니다.</p><div class="grid2">`;
  for(const k of c.adv){const a=D.LCLASS[k];const sk=D.SKILLS[a.skills[2]];h+=`<div class="card"><h4>${a.n}</h4><div class="sub">${a.desc}</div><div style="font-size:12px;margin-top:4px">새 스킬: <b>${sk.n}</b> — ${sk.d}<br>패시브: ${D.PASSIVE[a.passive]}</div></div>`;}
  h+=`</div><button class="go" id="clGo" style="margin-top:8px">⚔ 전직 시험 응시 (Lv.${D.EXAMS.classtest.lv})</button>`;
  openPanelRaw('🎓 전직의 전당',h);$('clGo').onclick=()=>{closePanel();special('classtest',b=>{if(b.over!==1)return toast('전직 시험에 실패했습니다.');
    setTimeout(()=>{let h2='<p class="good">시험 통과! 나아갈 길을 고르세요. (되돌릴 수 없습니다)</p><div class="grid2">';for(const k of c.adv){const a=D.LCLASS[k];h2+=`<button class="card" data-cl="${k}" style="text-align:left"><b>${a.n}</b><br><small>${a.desc}</small></button>`;}
      openPanelRaw('🎓 전직',h2+'</div>',true);$('pBody').querySelectorAll('[data-cl]').forEach(bb=>bb.onclick=()=>{G.advance(bb.dataset.cl);closePanel();sfx('levelup',.5);toast(`🎉 ${D.LCLASS[bb.dataset.cl].n}(으)로 전직!`);if(player)player.desc=unitDesc(S().leader);});},2400);});};}

/* ----- 서브 퀘스트 의뢰인 ----- */
function subDialog(e){const s=S();const id=e.sub,q=D.SUBS[id];const st=s.subs[id];
  if(!st){say([[q.npc,q.talk],['나레이션',`의뢰 「${q.n}」: ${q.goal}`]],()=>{confirmBox(`의뢰 「${q.n}」을(를) 받겠습니까?<br><span class="sub">${q.goal}</span>`,()=>{G.acceptSub(id);toast('의뢰 수락: '+q.n);hudRefresh();});});return;}
  if(st.state==='done'){const got=G.claimSub(id);sfx('levelup',.4);say([[q.npc,'정말 고마워요! 약속한 보상이에요.'],['나레이션','보상: '+got.join(', ')]]);hudRefresh();return;}
  if(st.state==='claimed'){say([[q.npc,'덕분에 큰 도움이 됐어요. 철혈 맹약단, 응원할게요!']]);return;}
  say([[q.npc,`${q.goal} — 지금 ${st.prog}/${q.count}예요. 잘 부탁해요!`]]);}

/* ----- 집결지: 막사 · 건설 · 꾸미기 · 훈련소 ----- */
function tentPanel(){const s=S();let h=`<div class="grid3">
  <button data-a="party">👥 용병단 관리</button><button data-a="build">🔨 건설 · 꾸미기</button><button data-a="rest">🌙 하루 쉬기</button><button data-a="save">💾 저장</button><button data-a="world">🗺 월드맵 · 출정</button><button data-a="quest">📜 퀘스트</button></div>`;
  h+=dungList(['d_ruin','d_mist','d_nest'],'거점 직통 던전');
  openPanelRaw(s.camp.built.keep?'🏰 석조 본성':'⛺ 단장 막사',h);bindLocInfo2();
  $('pBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='party')openPanel('party');else if(a==='build')buildPanel();else if(a==='rest')innPanel('camp','rest');else if(a==='save'){G.save();toast('💾 저장했습니다');}else if(a==='world')openPanel('world');else if(a==='quest')openPanel('quest');});}
function buildPanel(focus,tab){const s=S();tab=tab||'build';let h=tabs([['build','건설'],['decor','꾸미기'],['tier','거처 승급']],tab);
  if(tab==='build'){h+='<div class="col">';const ks=Object.keys(D.BUILDS).filter(k=>D.BUILDS[k].tier<=s.camp.tier);
    for(const k of ks){const b=D.BUILDS[k];const done=s.camp.built[k];h+=`<div class="itemrow ${focus===k?'glow':''}" style="cursor:default">${icon(b.ic)}<div style="flex:1"><div class="nm">${b.n} <small class="sub">${b.tier}단계</small></div><div class="st">${b.d}</div></div>${done?'<b class="good">완료</b>':`<span class="price">${fmt(b.cost)} G</span><button class="go" data-b="${k}" ${s.gold>=b.cost?'':'disabled'}>건설</button>`}</div>`;}
    const nt=Object.keys(D.BUILDS).filter(k=>D.BUILDS[k].tier===s.camp.tier+1);if(nt.length)h+=`<p class="sub">다음 단계에서 지을 수 있는 건물: ${nt.map(k=>D.BUILDS[k].n).join(', ')}</p>`;h+='</div>';}
  else if(tab==='decor'){h+=`<p class="sub">꾸미기 점수 ${G.decorPts()} pt · 장식은 정해진 자리에 보기 좋게 놓입니다.</p><div class="col">`;
    for(const k in D.DECOR){const d=D.DECOR[k];const p=G.decorPrice(k);const n=s.camp.decor.filter(x=>x===k).length;
      h+=`<div class="itemrow" style="cursor:default">${icon(d.ic)}<div style="flex:1"><div class="nm">${d.n} <small>+${d.pt} pt · 보유 ${n}</small></div>${p?'':`<div class="st">${d.tier}단계부터</div>`}</div>${p?`<span class="price">${fmt(p)} G</span><button data-d="${k}" ${s.gold>=p?'':'disabled'}>설치</button>`:''}</div>`;}h+='</div>';}
  else{const nx=G.campNext();if(!nx)h+='<p class="good">최고 단계입니다!</p>';else{h+=`<div class="card"><h4>${nx.tier}단계 ${nx.name}</h4><div>등급 ${nx.rank} 이상: ${nx.rankOk?'✅':'❌'}</div>${nx.build.map(([k,ok])=>`<div>건설 [${D.BUILDS[k].n}]: ${ok?'✅':'❌'}</div>`).join('')}<div>꾸미기 ${nx.decor}/${nx.decorNeed} pt ${nx.decor>=nx.decorNeed?'✅':'❌'}</div><div>비용 ${fmt(nx.cost)} G ${s.gold>=nx.cost?'✅':'❌'}</div><div class="grew sub" style="margin-top:4px">✨ ${nx.reward}</div><button class="go" id="tUp" ${nx.ok?'':'disabled'} style="margin-top:6px">거처 승급</button></div>`;}}
  openPanelRaw('🔨 집결지 건설',h);bindTabs(k=>buildPanel(focus,k));
  $('pBody').querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const e=G.build(b.dataset.b);if(e)return toast(e);sfx('levelup',.4);toast('🔨 '+D.BUILDS[b.dataset.b].n+' 완공!');rebuildCamp();buildPanel(null,'build');});
  $('pBody').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const e=G.buyDecor(b.dataset.d);if(e)return toast(e);sfx('coin',.35);toast('🌼 '+D.DECOR[b.dataset.d].n+' 설치!');rebuildCamp();buildPanel(null,'decor');});
  if($('tUp'))$('tUp').onclick=()=>{const e=G.campUpgrade();if(e)return toast(e);sfx('levelup',.5);closePanel();toast(`🎉 집결지가 [${D.CAMP_TIERS[S().camp.tier].n}](으)로 승급!`);enterWalk('camp');};}
function rebuildCamp(){if(scene==='walk'&&S().loc==='camp'){const px=Math.floor(player.x/T),py=Math.floor(player.y/T);enterWalk('camp',{x:px,y:py});if(isBlocked(MAP,px,py)){const [x,y]=freeTileNear(px,py,3);player.x=(x+.5)*T;player.y=(y+.5)*T;}}hudRefresh();}
function trainingPanel(){const s=S();let h='<p class="sub">교관은 전투에 나가지 않고 훈련소를 지킵니다. 대기 용병의 경험치 획득이 30% 늘어납니다. (영구 장애 용병에게 좋은 자리)</p><div class="col">';
  for(const m of s.mercs)h+=`<div class="itemrow" style="cursor:default"><img class="spr" src="${portrait(unitDesc(m),40)}" width="40" height="40"><div style="flex:1"><div class="nm">${m.name} <small>Lv${m.lv} ${D.JOBS[m.job].n}</small></div><div class="st">${m.instructor?'🎖 교관':m.dis?'영구 장애':m.seq?'후유증':'정상'}</div></div><button data-ins="${m.id}">${m.instructor?'교관 해제':'교관 임명'}</button></div>`;
  openPanelRaw('🎯 훈련소',h+'</div>');$('pBody').querySelectorAll('[data-ins]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.ins);m.instructor=!m.instructor;if(m.instructor){S().party=S().party.filter(x=>x!==m.id);say([[m.name,G.mercLine(m)]]);}trainingPanel();});}

/* ================= 용병단 · 장비 · 퀘스트 · 메뉴 ================= */
function statBlock(st){return `<div class="stat"><span>HP <b>${fmt(st.hp)}</b></span><span>공격 <b>${st.atk}</b></span><span>마력 <b>${st.mag}</b></span><span>방어 <b>${st.def}</b></span><span>속도 <b>${st.spd}</b></span><span>치명 <b>${st.crit}%</b></span><span>회피 <b>${st.eva}%</b></span>${st.cdr?`<span>쿨감 <b>${Math.round(st.cdr*100)}%</b></span>`:''}</div>`;}
function partyPanel(tab){const s=S();tab=tab||'leader';let h=tabs([['leader','단장'],['mercs',`용병 (${s.mercs.length}/${G.maxRoster()})`]],tab);
  if(tab==='leader'){const L=s.leader,c=D.LCLASS[L.cls],st=G.leaderStats();
    h+=`<div class="row" style="align-items:flex-start"><img class="spr" src="${portrait(unitDesc(L),72)}" width="72" height="72"><div style="flex:1"><h3 style="margin:0">${L.name} <small>Lv${L.lv} ${c.n}</small></h3>
      <div class="bar" style="margin:3px 0"><i style="width:${L.exp/G.expNeed(L.lv)*100}%;background:#5fb3ff"></i></div><small class="sub">경험치 ${fmt(L.exp)}/${fmt(G.expNeed(L.lv))}</small>${statBlock(st)}</div></div>`;
    h+=`<div class="card" style="margin-top:6px"><h4>능력치 ${L.pts?`<span class="good">(남은 포인트 ${L.pts})</span>`:''}</h4><div class="col">`;
    const ex={STR:'물리 공격력·최대 HP',AGI:'행동 속도·치명타·회피',INT:'마법·스킬 위력, 쿨타임 감소, 함정·보물 발견',CHA:'급여·고용비 할인, 상점 우대, 명성 증가, 수도의 무시 완화'};const nm={STR:'힘',AGI:'민첩',INT:'지력',CHA:'매력'};
    for(const k of ['STR','AGI','INT','CHA'])h+=`<div class="row"><b style="width:44px">${nm[k]}</b><b style="width:30px">${L[k]}</b><span class="sub" style="flex:1">${ex[k]}</span>${L.pts?`<button data-pt="${k}">+1</button>`:''}</div>`;
    h+='</div></div>';
    h+=`<div class="card"><h4>스킬</h4>${c.skills.map(k=>{const sk=D.SKILLS[k];return `<div style="font-size:12.5px">${icon(sk.ic,20)} <b>${sk.n}</b> ${sk.lv&&L.lv<sk.lv?`<span class="bad">(Lv${sk.lv} 해금)</span>`:''} — ${sk.d} <small class="sub">재사용 ${sk.cd}초</small></div>`;}).join('')}${c.passive?`<div style="font-size:12.5px">패시브: ${D.PASSIVE[c.passive]}</div>`:''}${!c.base?'<div class="sub" style="font-size:12px">C등급이 되면 황성의 전직의 전당에서 상위 직업으로 전직할 수 있습니다.</div>':''}</div>`;
    h+=equipHtml(L);}
  else{h+=`<p class="sub">출정 파티는 단장 + 용병 최대 4명. 체크한 용병이 함께 출정합니다. 다음 탐험 급여 합계 약 ${fmt(G.upkeep())} G (대기 용병은 절반)</p><div class="col">`;
    for(const m of s.mercs){const st=G.mercStats(m),gr=D.GRADES[m.grade],inP=s.party.includes(m.id);const potKnown=m.lv>=(m.lvHire||m.lv)+3||m.id.startsWith('m')&&m.free;
      const status=m.instructor?'🎖 교관':m.status==='inj'?`<span class="bad">🩹 중상 (${m.injDays}일)</span>`:m.dis?'<span class="bad">영구 장애</span>':m.seq?'<span class="bad">후유증</span>':m.falls?'흉터':'<span class="good">정상</span>';
      h+=`<div class="card"><div class="row" style="align-items:flex-start"><img class="spr" src="${portrait(unitDesc(m),56)}" width="56" height="56"><div style="flex:1;min-width:200px">
        <div class="nm" style="font-weight:900"><span style="color:${shade(gr.c,-.4)}">[${gr.n}]</span> ${m.name} <small>Lv${m.lv} ${D.JOBS[m.job].n} · ${D.PERS[m.pers].n}</small></div>
        <div class="st" style="font-size:12px">잠재력 ${potKnown?`<b style="color:${shade(D.POTENTIAL[m.pot].c,-.4)}">${D.POTENTIAL[m.pot].n}</b>`:'???'} · 상태 ${status} · 누적 쓰러짐 ${m.falls}/5 · 급여 ${fmt(G.wage(m))} G${m.wageCut?' (삭감 계약)':''}</div>
        <div class="bar" style="margin:3px 0;height:5px"><i style="width:${m.exp/G.expNeed(m.lv)*100}%;background:#5fb3ff"></i></div>${statBlock(st)}
        <div class="sub" style="font-size:12px;margin-top:3px">"${G.mercLine(m)}"</div></div></div>
        <div class="row" style="margin-top:5px;justify-content:flex-end"><label style="font-size:13px;font-weight:800;margin-right:auto"><input type="checkbox" data-p="${m.id}" ${inP?'checked':''} ${G.canFight(m)?'':'disabled'}> 출정 파티</label>
        <button data-eq="${m.id}">장비</button>${S().camp.built.training?`<button data-ins2="${m.id}">${m.instructor?'교관 해제':'교관 임명'}</button>`:''}${m.dis&&!m.wageCut?`<button data-cut="${m.id}">급여 삭감 재계약</button>`:''}<button class="warn" data-fire="${m.id}">해고</button></div></div>`;}
    if(!s.mercs.length)h+='<p>아직 용병이 없습니다. 마을 여관에서 고용하세요.</p>';h+='</div>';}
  openPanelRaw('👥 철혈 맹약단',h);bindTabs(k=>partyPanel(k));
  $('pBody').querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{const L=S().leader;if(L.pts<=0)return;L.pts--;L[b.dataset.pt]++;sfx('click',.2);partyPanel('leader');});
  $('pBody').querySelectorAll('[data-p]').forEach(b=>b.onchange=()=>{const id=b.dataset.p;if(b.checked){if(s.party.length>=4){b.checked=false;return toast('출정 파티는 용병 4명까지입니다');}s.party.push(id);}else s.party=s.party.filter(x=>x!==id);G.checkMain();});
  $('pBody').querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>equipPanel(G.mercById(b.dataset.eq)));
  $('pBody').querySelectorAll('[data-ins2]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.ins2);m.instructor=!m.instructor;if(m.instructor)S().party=S().party.filter(x=>x!==m.id);partyPanel('mercs');});
  $('pBody').querySelectorAll('[data-cut]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.cut);m.wageCut=true;say([[m.name,m.pers==='greedy'?'몸이 이 꼴이 됐는데 급여까지 깎을 셈이야? ...하, 알았어. 먹고는 살아야지.':m.pers==='loyal'?'단장님의 뜻이라면 따르겠습니다.':'...알겠습니다. 받아들이죠.']]);partyPanel('mercs');});
  $('pBody').querySelectorAll('[data-fire]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.fire);confirmBox(`${m.name}을(를) 해고하겠습니까? 장착 장비는 가방으로 돌아옵니다.`,()=>{say([[m.name,{brave:'흥, 다른 데서 더 센 놈들이랑 싸우지 뭐.',cold:'계약 종료, 확인했습니다.',cheer:'아쉽지만... 다들 잘 지내요!',greedy:'퇴직금은 없나? 쳇.',coward:'저, 저... 알겠어요...',loyal:'...언제든 부르시면 달려오겠습니다.'}[m.pers]]]);G.fire(m.id);partyPanel('mercs');if(scene==='walk'&&S().loc==='camp')rebuildCamp();});});
  bindEquip(s.leader,()=>partyPanel('leader'));}
function equipHtml(u){let h=`<div class="card"><h4>장비</h4><div class="slotbox">`;const nm={wpn:'무기',arm:'방어구',acc1:'장신구 1',acc2:'장신구 2'};
  for(const sl of G.SLOTS){const it=u.eq[sl]&&G.itemById(u.eq[sl]);h+=`<div class="slot" data-slot="${sl}" data-u="${u===S().leader?'L':u.id}">${it?icon(it.ic,28):'<span class="ic32" style="width:28px;height:28px;opacity:.3;background:#a08060;border-radius:4px"></span>'}<div><b>${nm[sl]}</b><br>${it?`<span style="color:${shade(D.RARITY[it.rar].c,-.4)}">${it.name}${it.enh?' +'+it.enh:''}</span><br><small>${statStr(it)}</small>`:'<small class="sub">비어 있음</small>'}</div></div>`;}
  return h+'</div><div class="sub" style="font-size:12px;margin-top:4px">칸을 누르면 바꿀 장비를 고를 수 있습니다.</div></div>';}
function bindEquip(u,re){$('pBody').querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const uu=b.dataset.u==='L'?S().leader:G.mercById(b.dataset.u);pickItem(uu,b.dataset.slot,re);});}
function equipPanel(m){const st=G.mercStats(m);openPanelRaw('🎒 '+m.name+' 장비',`<div class="row"><img class="spr" src="${portrait(unitDesc(m),56)}" width="56" height="56"><div>${D.JOBS[m.job].n} · 사용 무기: ${D.JOBS[m.job].wpn.map(w=>D.WPN[w].n).join(', ')}${statBlock(st)}</div></div>`+equipHtml(m)+'<button id="eBack">◀ 용병 목록</button>');
  bindEquip(m,()=>equipPanel(m));$('eBack').onclick=()=>partyPanel('mercs');}
function pickItem(u,slot,back){const s=S();const want=slot.startsWith('acc')?'acc':slot;const cur=u.eq[slot]&&G.itemById(u.eq[slot]);
  const list=s.inv.filter(i=>i.slot===want&&G.canEquip(u,i)&&i.id!==u.eq[slot]).sort((a,b)=>b.lv-a.lv||b.rar-a.rar);
  let h=`<p>${u.name}의 ${({wpn:'무기',arm:'방어구',acc1:'장신구 1',acc2:'장신구 2'})[slot]} — 현재: ${cur?itemLine(cur):'없음'}</p>${cur?'<button id="uneq">장비 해제</button>':''}<div class="col" style="margin-top:6px">`;
  for(const it of list){const o=G.ownerOf(it.id);h+=`<div class="itemrow" data-pick="${it.id}">${itemLine(it)}<span style="flex:1"></span><small class="sub">${o?'장착: '+o.name:''}</small><button>장착</button></div>`;}
  if(!list.length)h+='<p class="sub">장착할 수 있는 장비가 없습니다. 상점이나 던전에서 구하세요.'+(want==='wpn'?' (직업마다 쓸 수 있는 무기가 다릅니다)':'')+'</p>';
  openPanelRaw('장비 고르기',h+'</div><button id="pkBack">◀ 돌아가기</button>');
  $('pBody').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{G.equip(u,b.dataset.pick,slot.startsWith('acc')?slot:null);sfx('click',.25);back();});
  if($('uneq'))$('uneq').onclick=()=>{G.unequip(u,slot);back();};$('pkBack').onclick=back;}
function bagPanel(tab){const s=S();tab=tab||'gear';let h=tabs([['gear',`장비 (${s.inv.filter(i=>!G.ownerOf(i.id)).length}/40)`],['use','소모품']],tab);
  if(tab==='gear'){const its=s.inv.slice().sort((a,b)=>b.lv-a.lv||b.rar-a.rar);h+='<div class="col">';
    for(const it of its){const o=G.ownerOf(it.id);h+=`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1"></span><small class="sub">${o?'장착: '+o.name:''}</small>${!o?`<button data-sell="${it.id}">팔기 ${fmt(Math.round(it.val*.25*(1+.15*(it.enh||0))))}G</button>`:''}</div>`;}
    h+='</div><p class="sub">장착은 용병단 창에서 각 인물의 장비 칸을 눌러 합니다.</p>';}
  else{h+='<div class="col">';for(const k in D.CONSUM){const c=D.CONSUM[k];const n=s.cons[k]||0;if(!n&&c.stat)continue;h+=`<div class="itemrow" style="cursor:default">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} ×${n}</div><div class="st">${c.d}</div></div>${c.stat&&n?`<button data-use="${k}">사용</button>`:''}</div>`;}h+='</div>';}
  openPanelRaw('🎒 가방',h);bindTabs(k=>bagPanel(k));bindSell(()=>bagPanel('gear'));
  $('pBody').querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{G.useConsumable(b.dataset.use);sfx('levelup',.4);toast(D.CONSUM[b.dataset.use].d+'!');bagPanel('use');});}
function questPanel(){const s=S();const m=G.curMain();let h='<div class="card"><h4>★ 메인 — 《부러진 깃발의 후계자》</h4>';
  if(m)h+=`<div><b>${m.ch}장 · ${m.n}</b></div><div>${m.goal}</div>`;else h+='<div class="good">용병왕 등극! 메인 스토리를 모두 마쳤습니다.</div>';
  const ex=G.examReady();if(ex)h+=`<div class="sub">명성 ${fmt(s.fame)} / ${fmt(ex.fame)} ${ex.ok?'✅ 심사 가능 — '+D.TOWNS[ex.town].n+' 의뢰소':''}</div>`;
  h+=`<div class="sub" style="margin-top:4px">진행: ${D.MAIN.slice(0,s.main).map(x=>x.n).slice(-4).join(' → ')}</div></div>`;
  h+='<div class="card"><h4>❗ 지역 의뢰</h4>';let any=false;
  for(const id in s.subs){const q=D.SUBS[id],st=s.subs[id];if(st.state==='claimed')continue;any=true;h+=`<div style="font-size:13px">• <b>${q.n}</b> (${D.TOWNS[q.town].n} · ${q.npc}) — ${q.goal} <b>${st.state==='done'?'<span class="good">완료! 의뢰인에게 보고</span>':st.prog+'/'+q.count}</b></div>`;}
  if(!any)h+='<div class="sub">진행 중인 의뢰가 없습니다. 마을에서 머리 위에 「!」가 있는 사람에게 말을 걸어 보세요.</div>';h+='</div>';
  h+='<div class="card"><h4>📌 일일 퀘스트</h4>'+dailyHtml()+'</div>';
  openPanelRaw('📜 퀘스트',h);}
function menuPanel(){let h=`<div class="grid3"><button id="mSave">💾 저장 (슬롯 ${G.slot})</button><button id="mTitle">🏠 타이틀로</button><button id="mHelp">❓ 도움말</button></div>
  <div class="card" style="margin-top:8px"><h4>플레이 정보</h4><div class="sub">${S().day}일차 · 탐험 ${S().stats.runs}회 · 플레이 ${Math.floor(S().playSec/60)}분 · 자동 저장: 탐험·이동할 때마다</div></div>`;
  openPanelRaw('⚙ 메뉴',h);$('mSave').onclick=()=>{G.save();toast('💾 저장했습니다');};$('mTitle').onclick=()=>{G.save();closePanel();showTitle();};$('mHelp').onclick=helpPanel;}
function helpPanel(){openPanelRaw('❓ 도움말',`<div class="col" style="font-size:13.5px;line-height:1.6">
  <div class="card"><h4>기본 흐름</h4>집결지 건설 → 마을 의뢰·평판 → 로그라이크 던전 → 명성을 쌓고 승급 심사 → 다음 지역. 던전 1회 = 하루, 돌아오면 용병 급여가 나갑니다.</div>
  <div class="card"><h4>이동</h4>PC: 클릭하거나 WASD·방향키. 폰: 화면을 탭. 건물이나 사람을 누르면 그쪽으로 걸어가 말을 겁니다. 휠·두 손가락으로 확대/축소.</div>
  <div class="card"><h4>전투</h4>용병 4명은 자동으로 싸웁니다. 단장은 기본이 수동: 단장 차례가 되면 시간이 멈추고 명령 버튼이 뜹니다. 적을 누르면 집중 공격 목표가 됩니다. 오른쪽 위 [단장 오토]로 자동 전환.</div>
  <div class="card"><h4>부상</h4>전투에서 쓰러진 용병은 누적 횟수가 쌓입니다. 1~2회 흉터 → 3~4회 후유증(속도 -15%) → 5회 영구 장애(전 능력치 -25%). 탐험이 끝날 때까지 쓰러져 있으면 중상이 되어 치료가 필요합니다.</div>
  <div class="card"><h4>던전</h4>방을 하나씩 골라 나아갑니다. ⚔전투 💀정예 ⚠함정 🎁보물 🔥모닥불 🛒상인 👑보스. 언제든 귀환하면 전리품을 다 가져오지만, 전멸하면 절반을 잃습니다.</div></div>`);}

/* ================= 타이틀 ================= */
let titleT=0,titleBG=null,titleCrew=null;
function showTitle(){scene='title';['hud','goal','guide','bhud','dmap','dlg','panel'].forEach(i=>$(i).classList.add('hidden'));$('title').classList.remove('hidden');renderSlots();bgmTick();}
function renderSlots(){let h='';for(let n=1;n<=3;n++){const p=G.peek(n);
  h+=p?`<div class="tslot box" data-n="${n}"><div><b>슬롯 ${n} · ${p.name}</b> <span style="color:${shade(D.RANK_COLOR[p.rank],-.3)};font-weight:900">${p.rank}등급</span><br><small class="sub">${p.day}일차 · ${D.LCLASS[p.leader.cls].n} Lv${p.leader.lv} · ${D.CAMP_TIERS[p.camp.tier].n} · ${Math.floor((p.playSec||0)/60)}분</small></div><button class="del warn" data-del="${n}">삭제</button></div>`
     :`<div class="tslot box" data-new="${n}"><div><b>슬롯 ${n}</b> — 비어 있음</div><b>새 게임 ▶</b></div>`;}
  $('tSlots').innerHTML=h;
  $('tSlots').querySelectorAll('[data-n]').forEach(e=>e.onclick=ev=>{if(ev.target.closest('[data-del]'))return;G.load(+e.dataset.n);startGame(false);});
  $('tSlots').querySelectorAll('[data-del]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();if(b.dataset.ok){G.wipeSlot(+b.dataset.del);renderSlots();}else{b.dataset.ok=1;b.textContent='정말?';}});
  $('tSlots').querySelectorAll('[data-new]').forEach(e=>e.onclick=()=>newGameForm(+e.dataset.new));}
function newGameForm(n){let h=`<div class="box" style="padding:12px"><div style="font-weight:900;margin-bottom:6px">단장의 이름</div><input id="ngName" maxlength="8" value="레온" style="width:100%;font:inherit;font-size:16px;padding:6px;border:2px solid #a07850;border-radius:4px;background:#fffaf0">
  <div style="font-weight:900;margin:10px 0 6px">시작 직업</div><div class="col">`;
  for(const k of ['sword','bow','mage']){const c=D.LCLASS[k];h+=`<button class="ngc ${k==='sword'?'sel':''}" data-c="${k}" style="text-align:left"><b>${c.n}</b> <small>— ${c.desc}</small><br><small class="sub">전직: ${c.adv.map(a=>D.LCLASS[a].n).join(' / ')}</small></button>`;}
  h+=`</div><div class="row" style="justify-content:space-between;margin-top:10px"><button id="ngBack">◀ 뒤로</button><button class="go" id="ngGo">시작하기 ▶</button></div></div>`;
  $('tSlots').innerHTML=h;let cls='sword';$('tSlots').querySelectorAll('.ngc').forEach(b=>b.onclick=()=>{cls=b.dataset.c;$('tSlots').querySelectorAll('.ngc').forEach(x=>x.classList.toggle('sel',x===b));});
  $('ngBack').onclick=renderSlots;$('ngGo').onclick=()=>{G.slot=n;G.newGame(($('ngName').value||'레온').trim().slice(0,8),cls);G.S.slot=n;startGame(true);};}
function startGame(isNew){$('title').classList.add('hidden');const s=S();s.mainShown=isNew?-1:s.mainShown;if(s.run&&(s.run.special||!s.run.map||!D.DUNG[s.run.dk])){s.run=null;if(s.loc==='run')s.loc='camp';for(const u of [s.leader,...s.mercs])u.hp=null;}
  if(s.run){// 던전 도중 저장 → 이어서
    hudRefresh();$('hud').classList.remove('hidden');showDmap();return;}
  fadeTo(()=>{enterWalk(s.loc&&s.loc!=='run'?s.loc:'camp');
    if(isNew){s.mainShown=0;say([['나레이션','대륙을 호령하던 전설의 용병단, 철혈 맹약단.'],['나레이션','황실의 배신으로 모든 것을 잃은 지 10년. 불타 버린 거점 터에 마지막 생존자가 돌아왔다.'],
      [s.leader.name,'...아버지의 깃발을, 다시 세운다.'],['로안','단장님! 저 혼자라도 따라갈게요. 일단 들꽃 마을 의뢰소에 등록부터 해요!'],
      ['나레이션','<b>목표</b> — 집결지 아래쪽 길로 나가 월드맵에서 [들꽃 마을]로 이동하세요. 의뢰소에 용병단을 등록해야 합니다.']],()=>{s.mainShown=s.main;hudRefresh();});}});}
function renderTitle(dt){titleT+=dt;if(!titleBG)titleBG=makeBattleBG('forest',1280,720,false);const k=Math.max(W/1280,H/720);
  ctx.setTransform(DPR*k,0,0,DPR*k,DPR*(W-1280*k)/2,DPR*(H-720*k)/2);ctx.imageSmoothingEnabled=false;ctx.drawImage(titleBG,0,0);
  if(!titleCrew)titleCrew=[[{kind:'human',look:{o:0,hair:'shorthair',hc:2},tool:true},520,520],[{kind:'human',look:{o:2,hair:'longhair',hc:3},bow:true},620,560],[{kind:'human',look:{o:1,hair:'curlyhair',hc:5},staff:true},760,560],[{kind:'human',look:{o:4,hair:'spikeyhair',hc:4},tool:true},840,520],[{kind:'human',look:{o:6,hair:'bowlhair',hc:1},staff:true,staffColor:'#fff7c0'},440,570]];
  const im=IMG.t_campfire;if(im){const f=Math.floor(titleT*10)%8;ctx.drawImage(im,f*32,0,32,32,640-48,540-60,96,96);}
  ctx.fillStyle='rgba(255,170,60,.12)';ctx.beginPath();ctx.arc(640,520,170+Math.sin(titleT*7)*5,0,Math.PI*2);ctx.fill();
  for(const [d,x,y] of titleCrew){shadow(ctx,x,y+2,16);drawAny(ctx,d,'idle',titleT+x*.01,x,y,3,x>640);}}

/* ================= 입력 ================= */
const ptrs=new Map();let pinch0=0,zoom0=1,downP=null;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);if(ptrs.size===1)downP=[e.clientX,e.clientY,performance.now()];
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]);zoom0=userZoom;downP=null;}});
cv.addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,[e.clientX,e.clientY]);
  if(ptrs.size===2&&pinch0){const [a,b]=[...ptrs.values()];userZoom=clamp(zoom0*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch0,.6,1.9);}
  if(scene==='walk'&&e.pointerType==='mouse'&&MAP&&!uiBusy()){const h=hitWalk(e.clientX,e.clientY);if(h.npc&&h.npc!==hoverObj&&h.npc.kind==='merc'&&!h.npc.bubble)h.npc.bubble={text:G.mercLine(h.npc.ref,h.npc.place),t:3.5};hoverObj=h.npc||null;cv.style.cursor=h.npc||h.obj?'pointer':'default';}});
const endPtr=e=>{const was=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;
  if(was&&downP&&ptrs.size===0){const d=Math.hypot(e.clientX-downP[0],e.clientY-downP[1]);if(d<12){if(scene==='walk')walkTap(e.clientX,e.clientY);else if(scene==='battle')battleTap(e.clientX,e.clientY);}}if(!ptrs.size)downP=null;};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);downP=null;});
cv.addEventListener('wheel',e=>{e.preventDefault();userZoom=clamp(userZoom*(e.deltaY>0?.9:1.1),.6,1.9);},{passive:false});
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();keys.add(k);
  if(k==='escape'){if(!$('dlg').classList.contains('hidden'))nextLine();else if(!$('panel').classList.contains('hidden')&&!$('panel').dataset.modal)closePanel();}
  if((k===' '||k==='enter')&&!$('dlg').classList.contains('hidden')){e.preventDefault();nextLine();}
  if(scene==='battle'&&BT&&BT.b.wait&&/^[1-4]$/.test(k)){const bs=$('bCmd').querySelectorAll('button');const b=bs[+k-1];if(b&&!b.disabled)b.click();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());

/* ================= 메인 루프 ================= */
let last=performance.now(),bgmAcc=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;bgmAcc+=dt;if(bgmAcc>.5){bgmAcc=0;bgmTick();}
  if(S()&&scene!=='title')S().playSec=(S().playSec||0)+dt;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(scene==='title')renderTitle(dt);
  else if(scene==='walk'){updWalk(dt);renderWalk();}
  else if(scene==='battle'){updBattle(dt);renderBattle();}
  else if(scene==='dmap'){ctx.fillStyle='#1b120b';ctx.fillRect(0,0,W,H);}
  requestAnimationFrame(frame);}
window.__dbg=()=>({openAct,guildPanel,innPanel,shopPanel,buildPanel,partyPanel,worldPanel,enterNode,hitWalk,walkTap,scene,S:S(),BT,MAP,player,G,D,openPanel,enterWalk,startBattle,departDungeon,finishRun,closePanel,say,special});
loadAll(()=>{showTitle();requestAnimationFrame(frame);});
setInterval(()=>{if(S()&&scene==='walk')G.save();},30000);
window.addEventListener('beforeunload',()=>{if(S())G.save();});
})();
