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
for(const k of ['bear','kappagreen','kappared','lanterngreen','lanternred','mollusc','mouse','snake3','eye2','cyclope2'])LIST.push(['n_'+k,'assets/mobs/'+k+'.png']);
for(const k of ['mushroom2','larva','butterfly','owl','spirit2','axolot','racoon','panda','bamboo','flam2','lizard2','reptile2','skullblue','beast2','dragon'])LIST.push(['n_'+k,'assets/mobs/'+k+'.png']);
for(const k of ['slime','slime2','bat','mole','snake','spider','skull','spirit','cyclope','beast','lizard','octopus','eye','mushroom','flam','reptile','rat','ratblack','boar','hyena','flam_ab','eye_ab','cyclope_ab','spirit_ab'])LIST.push(['n_'+k,'assets/mobs/'+k+'.png']);
const BOSSW={bluesamurai:48,tengub:68,frog2:40,giantbamboo:62,giantflam:50,demoncyclop2:50,giantracoon:60,giantslime:62,demoncyclop:50,giantspirit:50,squidred:76,tengured:82,giantfrog:40,giantredsamurai:96};
for(const k in BOSSW)LIST.push(['b_'+k,'assets/mobs/boss_'+k+'.png']);
for(const k of ['chicken','cow','duck','pig','sheep','bird','fire','glint','smoke','windmill','tree1','tree2','mushred','mushblue'])LIST.push(['el_'+k,'assets/ss/el/'+k+'.png']);
for(const k of ['ss16','camp','campfire'])LIST.push(['t_'+k,'assets/tiles/'+k+'.png']);
for(const k of ['Explosion','Ice','RockSpike','Spark','WaterPillar','arrow'])LIST.push(['fx_'+k,'assets/fx/'+k+'.png']);
for(const k of ['expression_chat','expression_alerted','expression_attack','expression_love','expression_stress','expression_working','indicator','sword','selectbox_tl','selectbox_tr','selectbox_bl','selectbox_br','label_left','label_middle','label_right','hammer'])LIST.push(['ui_'+k,'assets/ui/'+k+'.png']);
LIST.push(['raven','assets/icons/raven32.png']);
for(const k of ['warrior_blue','warrior_yellow','archer_blue'])LIST.push(['ts_'+k,'assets/ts/'+k+'.png']);
for(const k of ['nobleman','noblewoman','oldman','oldwoman','peasant','princess','queen','villagerman','villagerwoman','worker'])LIST.push(['mf_'+k,'assets/mf/'+k+'.png']);
for(const k of ['Desert','Field','Floor','House','Nature','Water','Element'])LIST.push(['nj_'+k.toLowerCase(),'assets/nj/Tileset'+k+'.png']);
for(const k of ['boy','cavegirl','child','egggirl','eskimo','hunter','inspector','knight','knightgold','lionboy','mangreen','master','monk','monk2','ninjablue','ninjaeskimo','ninjagray','ninjared','noble','oldman','oldman2','oldwoman','princess','samurai','samuraiblue','shaman','villager','villager2','villager3','woman'])LIST.push(['njc_'+k,'assets/nj/ch/'+k+'.png']);
LIST.push(['nj_ifloor','assets/nj/TilesetInteriorFloor.png']);for(const k of ['ripple','flower','mill','flag'])LIST.push(['nj_'+k,'assets/nj/'+k+'.png']);LIST.push(['nj_boat','assets/nj/veh/boat.png'],['nj_sail','assets/nj/veh/Sail.png'],['nj_net','assets/nj/veh/FishNet.png']);LIST.push(['nj_vil','assets/nj/TilesetVillageAbandoned.png']);for(const [k,f] of [['nj_fdet','TilesetFloorDetail'],['nj_floorb','TilesetFloorB'],['nj_relief','TilesetRelief'],['nj_reliefd','TilesetReliefDetail']])LIST.push([k,'assets/nj/'+f+'.png']);
LIST.push(['t_int','assets/tiles/interior.png'],['t_furn','assets/tiles/furniture.png']);
LIST.push(['t_bridges','assets/tiles/bridges.png'],['el_mf_bunny','assets/ss/el/mf_bunny.png'],['el_mf_deer','assets/ss/el/mf_deer.png'],['el_coracle','assets/ss/el/coracle.png'],['t_goldmine','assets/tiles/goldmine.png'],['dg_dtiles','assets/dg/dtiles.png'],['el_crate_base','assets/ss/el/crate_base.png'],['el_crate_top','assets/ss/el/crate_top.png'],['dg_props','assets/dg/props.png'],['w_tiles','assets/world/tileset.png'],['w_mount','assets/world/mountains.png'],['w_water','assets/world/water.png']);
for(const k of ['gable','blue2','red','mansion','flat'])for(let r=0;r<5;r++)LIST.push(['bld_'+k+'_'+r,'assets/bld/'+k+'_'+r+'.png']);
for(const k of ['ruin','fort','temple','crystal','cave','sewer','dock','volcano','abyss'])LIST.push(['dg_'+k,'assets/dg/tiles_'+k+'.png']);
for(const k of ['torch','sidetorch','candle','chest','minichest','peaks','flame','flag','coin','box'])LIST.push(['dg_'+k,'assets/dg/'+k+'.png']);
for(const k of ['skeleton1','skeleton2','vampire'])for(const a of ['idle','movement','attack','hurt','death'])LIST.push(['e_'+k+'_'+a,'assets/mobs/e_'+k+'_'+a+'.png']);
for(const k of ['demon','blood'])for(const a of ['idle','walk','attack01','hurt','death'])LIST.push([k+'_'+a,'assets/mobs/'+k+'_'+a+'.png']);
function loadAll(cb){let n=0;const tot=LIST.length;
  for(const [k,src] of LIST){const im=new Image();im.onload=()=>{IMG[k]=im;if(++n>=tot)cb();};im.onerror=()=>{console.warn('그림 없음',src);if(++n>=tot)cb();};im.src=src;}}

/* ================= 화면 크기 ================= */
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.imageSmoothingEnabled=false;}
window.addEventListener('resize',resize);resize();

/* ================= 소리 ================= */
const SND={on:(()=>{try{return localStorage.getItem('mercking-snd')!=='0';}catch(e){return true;}})(),bgm:null,cur:'',last:{}};
function bgmFor(){if(scene==='title')return 'title';if(scene==='battle')return 'battle';if(scene==='dmap'||scene==='dg')return 'kingdom';return 'town';}
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
  if(key==='orc'||key==='dknight'||key==='aorc'||key==='demon'||key==='blood')return {kind:'rpg',k:key};
  if(key.startsWith('e_'))return {kind:'e32',k:key};
  if(key.startsWith('n_')){let k=key.slice(2);if(tint==='ab')k+='_ab';return {kind:'ninja',k};}
  if(key.startsWith('b_'))return {kind:'boss',k:key.slice(2)};
  return null;}
function frameOf(anim,t,n,fps,hold){let f=Math.floor(t*fps);if(hold)return Math.min(n-1,f);return f%n;}
function freshLine(m,arr){const used=new Set(((m&&m.npcs)||[]).map(o=>o.bubble&&o.bubble.text));const c=arr.filter(x=>!used.has(x));return pick(c.length?c:arr);}
// 피부색·얼굴 바꾼 몸 그림 (옷 한 줄씩 만들어 둠)
const SKINS=[[232,173,125,200,127,91],[250,214,182,226,172,136],[204,140,96,170,106,70],[156,100,66,124,76,50],[110,70,48,84,52,36]];
const SKIN_N=['기본','밝은 피부','구릿빛','갈색','짙은 갈색'];
const FACES=[{n:'기본'},{n:'차분한 얼굴',nb:1},{n:'가는 눈',nb:1,thin:1},{n:'푸른 눈',eye:[70,120,230]},{n:'초록 눈',eye:[60,170,90]},{n:'붉은 눈',eye:[210,50,60],nb:1}];
const bodyCache={};
function bodySheet(anim,o,sk,fc){if(!sk&&!fc&&!o)return null;const key=anim+o+'_'+sk+'_'+fc;if(bodyCache[key])return bodyCache[key];
  const src=IMG['h_'+anim+'_base'];if(!src)return null;const c=document.createElement('canvas');c.width=src.width;c.height=64;const x=c.getContext('2d');x.drawImage(src,0,o*64,src.width,64,0,0,src.width,64);
  const d=x.getImageData(0,0,c.width,64),p=d.data,W=c.width;const S0=SKINS[0],S1=SKINS[sk]||S0,F=FACES[fc]||FACES[0];
  const at=(i,j)=>(j*W+i)*4;const near=(k,r,g,b)=>Math.abs(p[k]-r)<=3&&Math.abs(p[k+1]-g)<=3&&Math.abs(p[k+2]-b)<=3&&p[k+3]>0;
  const isSk=(i,j)=>{if(i<0||j<0||i>=W||j>=64)return false;const k=at(i,j);return near(k,S0[0],S0[1],S0[2])||near(k,S0[3],S0[4],S0[5]);};
  const isEye=(i,j)=>{const k=at(i,j);return p[k+3]>0&&p[k]+p[k+1]+p[k+2]<120&&isSk(i-1,j)&&isSk(i+1,j);};
  const eyes=[],blush=[];
  for(let j=1;j<63;j++)for(let i=1;i<W-1;i++){const k=at(i,j);if(!p[k+3])continue;
    if(p[k]+p[k+1]+p[k+2]<120&&isSk(i-1,j)&&isSk(i+1,j))eyes.push([i,j]);
    else if(!isSk(i,j)&&p[k]+p[k+1]+p[k+2]>=120&&(isSk(i,j-1)||isEye(i,j-1))&&(isSk(i-1,j)||isSk(i+1,j)))blush.push([i,j]);}
  const eyeSet=new Set(eyes.map(e=>e.join()));
  // 먼저 피부색 바꾸기
  for(let k=0;k<p.length;k+=4){if(!p[k+3])continue;if(near(k,S0[0],S0[1],S0[2])){p[k]=S1[0];p[k+1]=S1[1];p[k+2]=S1[2];}else if(near(k,S0[3],S0[4],S0[5])){p[k]=S1[3];p[k+1]=S1[4];p[k+2]=S1[5];}}
  for(const [i,j] of blush){const k=at(i,j);if(F.nb){p[k]=S1[0];p[k+1]=S1[1];p[k+2]=S1[2];}else{p[k]=Math.min(255,S1[0]*.55+250*.45);p[k+1]=S1[1]*.55+105*.45;p[k+2]=S1[2]*.55+115*.45;}}
  for(const [i,j] of eyes){const k=at(i,j);
    if(F.thin&&eyeSet.has(i+','+(j+1))){p[k]=S1[0];p[k+1]=S1[1];p[k+2]=S1[2];continue;}
    if(F.eye&&eyeSet.has(i+','+(j+1))){p[k]=F.eye[0];p[k+1]=F.eye[1];p[k+2]=F.eye[2];}}
  x.putImageData(d,0,0);bodyCache[key]=c;return c;}
// 사람: look={o,hair,hc,sk,fc}, opt={tool,bow,staff,flip,scale,alpha,flash}
function drawHuman(c,look,anim,t,x,y,s,opt){opt=opt||{};anim=ACTS[anim]?anim:'idle';
  const fps={idle:8,walk:11,attack:17,hurt:14,death:13}[anim];const n=ACTS[anim];const f=frameOf(anim,t,n,fps,anim==='death');
  c.save();c.translate(Math.round(x),Math.round(y));if(opt.flip)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;
  const sx=f*96,dw=96*s,dh=64*s,dx=-48*s,dy=-39*s;
  const v=bodySheet(anim,look.o||0,look.sk||0,look.fc||0);if(v)c.drawImage(v,sx,0,96,64,dx,dy,dw,dh);
  else{const b=IMG['h_'+anim+'_base'];if(b)c.drawImage(b,sx,(look.o||0)*64,96,64,dx,dy,dw,dh);}
  const h=look.hair==='bald'?null:IMG['h_'+anim+'_'+(look.hair||'shorthair')];if(h)c.drawImage(h,sx,(look.hc||0)*64,96,64,dx,dy,dw,dh);
  const melee=opt.tool&&anim==='attack';
  if(melee){const tl=IMG['h_attack_tools'];if(tl)c.drawImage(tl,sx,0,96,64,dx,dy,dw,dh);}
  if(anim!=='death'&&IMG.raven){const bob=anim==='walk'?Math.round(Math.sin(t*20))*.5:0;
    if(opt.shIc!=null){const r=Math.floor(opt.shIc/16),cl=opt.shIc%16;c.drawImage(IMG.raven,cl*32,r*32,32,32,-9*s,(-10+bob)*s,9*s,9*s);}
    if(opt.wIc!=null&&!melee){const r=Math.floor(opt.wIc/16),cl=opt.wIc%16;const big=opt.wCls==='staff'||opt.wCls==='bow'||opt.wCls==='axe';const z=big?13:11;
      c.save();c.translate(4*s,(-2+bob)*s);if(anim==='attack')c.rotate(-.5);c.drawImage(IMG.raven,cl*32,r*32,32,32,-2*s,-(z-2)*s,z*s,z*s);c.restore();}
    else if((opt.bow||opt.staff)&&opt.wIc==null)drawHeld(c,opt.bow?'bow':'staff',s,anim,t,opt.staffColor);}
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
function drawE32(c,k,anim,t,x,y,s,opt){opt=opt||{};const a={idle:'idle',walk:'movement',attack:'attack',hurt:'hurt',death:'death'}[anim]||'idle';const im=IMG[k+'_'+a]||IMG[k+'_idle'];if(!im)return;
  const n=Math.max(1,Math.round(im.width/32));const f=frameOf(a,t,n,a==='attack'?14:a==='death'?12:9,a==='death');
  c.save();c.translate(Math.round(x),Math.round(y));if(opt.flip)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;c.drawImage(im,f*32,0,32,32,-16*s,-30*s,32*s,32*s);c.restore();}
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
  if(desc.kind==='human'){opt.flip=faceLeft;opt.tool=desc.tool;opt.bow=desc.bow;opt.staff=desc.staff;opt.staffColor=desc.staffColor;opt.wIc=desc.wIc;opt.wCls=desc.wCls;opt.shIc=desc.shIc;drawHuman(c,desc.look,anim,t,x,y,s,opt);}
  else if(desc.kind==='ss'){opt.flip=faceLeft;drawSS(c,desc.k,desc.tint,anim,t,x,y,s,opt);}
  else if(desc.kind==='tsu'){const im=IMG['ts_'+desc.k];if(!im)return;const row={idle:0,walk:1,attack:2}[anim]??0;const n=desc.k.startsWith('archer')&&row===2?8:6;const f=Math.floor(t*(row===2?10:8))%n;
    c.save();c.translate(Math.round(x),Math.round(y));if(faceLeft)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;c.drawImage(im,f*48,row*48,48,48,-24*s,-34*s,48*s,48*s);c.restore();}
  else if(desc.kind==='nj'){const im=IMG['njc_'+desc.k];if(!im)return;const col=desc.dir!=null?desc.dir:(faceLeft?2:3);let row=0;if(anim==='walk')row=Math.floor(t*8)%4;else if(anim==='attack')row=4;else row=Math.floor(t*2)%2?0:0;
    c.save();c.translate(Math.round(x),Math.round(y));if(opt.alpha!=null)c.globalAlpha=opt.alpha;c.drawImage(im,col*16,row*16,16,16,-8*s*1.15,-17*s*1.15,16*s*1.15,16*s*1.15);c.restore();}
  else if(desc.kind==='mf'){const im=IMG['mf_'+desc.k];if(!im)return;let row=anim==='walk'?1:0,n=anim==='walk'?6:4,fps=anim==='walk'?9:4;if(anim==='attack'){row=desc.k==='worker'?4:3;n=desc.k==='worker'?5:3;fps=7;}const f=Math.floor(t*fps)%n;
    c.save();c.translate(Math.round(x),Math.round(y));if(faceLeft)c.scale(-1,1);if(opt.alpha!=null)c.globalAlpha=opt.alpha;c.drawImage(im,f*32,row*32,32,32,-16*s,-30*s,32*s,32*s);c.restore();}
  else if(desc.kind==='rpg'){opt.flip=faceLeft;drawRPG(c,desc.k,anim,t,x,y,s,opt);}
  else if(desc.kind==='e32'){opt.flip=faceLeft;drawE32(c,desc.k,anim,t,x,y,s,opt);}
  else if(desc.kind==='ninja'){opt.flip=!faceLeft;if(anim==='death')opt.alpha=Math.max(0,1-t*1.6);drawNinja(c,desc.k,anim,t,x,y,s,opt);}
  else if(desc.kind==='boss'){opt.flip=!faceLeft;if(anim==='death')opt.alpha=Math.max(0,1-t*1.2);drawBoss(c,desc.k,anim,t,x,y,s,opt);}}
function shadow(c,x,y,w){c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(x,y,w,w*.32,0,0,Math.PI*2);c.fill();}
// 단장·용병의 모습
function gearLook(u,base){const g=k=>u.eq&&u.eq[k]&&G.itemById(u.eq[k]);const w=g('wpn'),sh=g('off'),ar=g('arm');const o={};
  if(w){o.wIc=w.ic;o.wCls=w.cls;}if(sh)o.shIc=sh.ic;
  const look=Object.assign({},base);if(ar&&ar.cls==='heavy')look.o=ar.rar>=4?8:4;o.look=look;return o;}
function unitDesc(u){if(u===S().leader||u.cls){const L=S().leader,c=D.LCLASS[L.cls];const gl=gearLook(L,{o:L.look.o??c.outfit,hair:L.look.hair,hc:L.look.hc,sk:L.look.sk||0,fc:L.look.fc||0});
    return Object.assign({kind:'human',tool:c.tool,bow:c.atkType==='bow'&&!c.tool,staff:c.atkType==='magic',staffColor:'#ffcf5a'},gl);}
  const j=D.JOBS[u.job];const VET={warrior:5,guard:4,archer:2,mage:3,priest:1};const lk=u.lv>=20&&u.look?Object.assign({},u.look,{o:u.lv>=35?8:VET[u.job]??u.look.o}):u.look;const gl=gearLook(u,lk);return Object.assign({kind:'human',tool:j.tool,bow:u.job==='archer',staff:u.job==='mage'||u.job==='priest',staffColor:u.job==='priest'?'#fff7c0':'#6ad0ff'},gl);}
// 아이콘 (Raven 32x32 시트)
function icon(idx,size){size=size||32;const r=Math.floor(idx/16),c=idx%16;const sc=size/32;
  return `<span class="ic32" style="width:${size}px;height:${size}px;background-image:url(assets/icons/raven32.png);background-size:${512*sc}px auto;background-position:-${c*size}px -${r*size}px"></span>`;}
// 캐릭터 초상 (DOM용 작은 캔버스 이미지)
const portraitCache={};
function portrait(desc,size,key){size=size||48;const ck=key&&key+size;if(ck&&portraitCache[ck])return portraitCache[ck];
  const c=document.createElement('canvas');c.width=size;c.height=size;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const s=desc.kind==='boss'?size/60:desc.kind==='rpg'?size/22:size/19;drawAny(x,desc,'idle',0,size/2,size*.86,s,false);
  const url=c.toDataURL();if(ck)portraitCache[ck]=url;return url;}
function bubble(c,x,y,text,s){text=CN(text);s=s||1;c.save();c.font=`700 ${Math.round(12*s)}px Galmuri11,"Malgun Gothic",sans-serif`;
  const lines=wrapText(c,text,190*s);const lh=15*s,w=Math.max(...lines.map(l=>c.measureText(l).width))+14*s,h=lines.length*lh+10*s;
  const bx=Math.round(x-w/2),by=Math.round(y-h-8*s);
  c.fillStyle='#fffaf0';c.strokeStyle='#3b2a1e';c.lineWidth=2*s;roundRect(c,bx,by,w,h,5*s);c.fill();c.stroke();
  c.beginPath();c.moveTo(x-5*s,by+h-1);c.lineTo(x,by+h+7*s);c.lineTo(x+5*s,by+h-1);c.fill();c.beginPath();c.moveTo(x-5*s,by+h);c.lineTo(x,by+h+7*s);c.lineTo(x+5*s,by+h);c.stroke();
  c.fillStyle='#3b2a1e';c.textBaseline='top';lines.forEach((l,i)=>c.fillText(l,bx+7*s,by+5*s+i*lh));c.restore();}
function wrapText(c,t,max){const out=[];let line='';for(const ch of t){if(c.measureText(line+ch).width>max&&line){out.push(line);line=ch.trim()?ch:'';}else line+=ch;}if(line)out.push(line);return out;}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function outlineText(c,t,x,y,fill,size,stroke){c.font=`900 ${size}px Galmuri11,"Malgun Gothic",sans-serif`;c.textAlign='center';c.lineWidth=Math.max(3,size/5);c.strokeStyle=stroke||'#1a0f08';c.strokeText(t,x,y);c.fillStyle=fill;c.fillText(t,x,y);c.textAlign='left';}

/* ================= 장면 관리 ================= */
let scene='title';   // title | walk | dmap | battle
let sceneT=0;
function fadeTo(fn){const f=$('fade');f.style.opacity=1;setTimeout(()=>{fn();f.style.opacity=0;},230);}
function CN(t){const c=S&&S()&&S().company;return c&&typeof t==='string'?t.split('철혈 맹약단').join(c):t;}
function toast(t,cls){t=CN(t);const d=document.createElement('div');d.className='box '+(cls||'');d.innerHTML=t;$('toast').appendChild(d);setTimeout(()=>d.remove(),2900);while($('toast').children.length>4)$('toast').firstChild.remove();}

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
function isBlocked(m,x,y){if(x<0||y<0||x>=m.w||y>=m.h)return true;const g=m.g[gi(m,x,y)];return m.blk[gi(m,x,y)]||g===2||g===7||g===9||g===12||g===22;}
// 건물: x=왼쪽, door=문이 있는 줄(y). h=지붕 줄 수 → 건물 높이 h+3
const SPRB={gable:{w:48,h:43,d:24,cx:10,cy:8},blue2:{w:48,h:58,d:24,cx:9,cy:23},red:{w:52,h:45,d:26,cx:18,cy:3},mansion:{w:130,h:135,d:81,cx:116,cy:30,rows:6},flat:{w:43,h:48,d:24,cx:16,cy:4}};
function sprHouse(m,o){const S=SPRB[o.spr];const b=Object.assign({t:'house',roof:o.roof??0},o);b.dx=o.x+Math.floor(o.w/2);b.dy=o.door;
  b.bx=b.dx*T+8-S.d;b.by=(o.door+1)*T-S.h;b.bw=S.w;b.bh=S.h;b.base=(o.door+1)*T;b.y=Math.floor(b.by/T);
  b.parts=[{k:'main',x:0,y:0}];b.chimney=0;b.sprSmoke=[b.bx+S.cx,b.by+S.cy];
  const x0=Math.floor((b.bx+2)/T),x1=Math.floor((b.bx+S.w-3)/T);block(m,x0,o.door-(S.rows||2),x1-x0+1,(S.rows||2)+1);
  m.objs.push(b);if(o.path!==0)fillG(m,b.dx,o.door+1,1,(o.path||1),1);return b;}
const ACTSPR={guild:'blue2',inn:'blue2',hq:'blue2',classhall:'blue2',shop:'gable',relic:'flat',smith:'red',forge:'red',store:'gable',clinic:'flat',tavern:'red',hall:'blue2'};
// 닌자 어드벤처 건물(통째 그림): r=[sx,sy,w,h] (그림 시트 좌표, px), door = 문 앞 칸 행
function njHouse(m,o){const [sx,sy,w,h]=o.r;const cols=Math.round(w/16),rows=Math.ceil(h/16);const b=Object.assign({t:'house',nj:true,im:o.im||'nj_house'},o);
  b.y=o.door-rows+1;b.w=cols;b.h=rows;b.dx=o.x+(o.doorOff??(cols>>1));b.dy=o.door;b.bx=o.x*T;b.by=(o.door+1)*T-h;b.bw=w;b.bh=h;b.base=(o.door+1)*T;
  block(m,o.x,Math.max(0,o.door-rows+2),cols,rows-1);block(m,o.x,o.door,cols,1);m.blk[gi(m,b.dx,o.door)]=0;m.objs.push(b);
  if(o.act||o.name)road(m,b.dx,o.door+1,1,1);return b;}

// 소품 흩뿌리기: 빈 땅(길·물·건물·소품과 겹치지 않음)에만 배치
function njOcc(m){const o=new Uint8Array(m.w*m.h);const mark=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<m.w&&j<m.h)o[j*m.w+i]=1;};
  for(const b of m.objs){if(b.t==='house')mark(b.x-1,b.y-1,b.w+2,b.dy-b.y+3);else if(b.t==='furn'&&b.r){const c=Math.ceil(b.r[2]/16),r=Math.ceil(b.r[3]/16),by=Math.round(b.base/T);mark(b.x,by-r,c,r);}else if(b.x!=null)mark(b.x-1,(b.y||0)-1,3,3);}
  for(const e of m.exits||[])mark(e.x-2,e.y-2,5,5);for(const q of m.plats||[])mark(q.x-1,q.y-1,q.w+2,q.h+q.f+2);for(const l of m.labels||[])mark(Math.floor(l.x)-1,Math.floor(l.y),3,2);return o;}
function njScatter(m,items,count,seed,area,opt){opt=opt||{};let r=seed*9301+49297;const rnd=()=>{r=(r*9301+49297)%233280;return r/233280;};const occ=njOcc(m);const [ax,ay,aw,ah]=area||[1,1,m.w-2,m.h-2];let n=0;
  const ex=(opt.spots||[]);
  for(let t=0;t<count*40&&n<count;t++){const it=items[Math.floor(rnd()*items.length)];const c=Math.ceil(it.r[2]/16),rw=Math.ceil(it.r[3]/16);const x=ax+Math.floor(rnd()*(aw-c)),y=ay+Math.floor(rnd()*(ah-rw))+rw-1;
    let ok=true;for(let j=y-rw+1-1;j<=y+1&&ok;j++)for(let i=x-1;i<=x+c&&ok;i++){if(i<0||j<0||i>=m.w||j>=m.h){ok=false;break;}const g=m.g[gi(m,i,j)];if(occ[j*m.w+i]||m.blk[gi(m,i,j)]||(g!==0&&!(opt.onRoadEdge&&j<y-rw+1)))ok=false;}
    if(!ok)continue;if(ex.some(([sx,sy])=>Math.abs(sx-x-c/2)<c/2+2&&Math.abs(sy-y)<3))continue;
    njo(m,it.im,it.r,x,y-(it.bh||1)+1,it.solid===false?0:c,it.bh||1);for(let j=y-rw+1;j<=y;j++)for(let i=x;i<x+c;i++)occ[j*m.w+i]=1;n++;}return n;}
// 닌자 어드벤처 소품: 시트 영역 r을 칸(x,y) 아래쪽에 맞춰 그림
function njo(m,im,r,x,y,bw,bh){const o={t:'furn',k:'nj',x,y,base:(y+(bh||1))*T,im,r,ox:(Math.round(r[2]/16)*16-r[2])/2};m.objs.push(o);if(bw)block(m,x,y+(bh||1)-1-((bh||1)-1),bw,bh||1);return o;}
const VA={hut:[176,0,48,48],hut2:[176,48,48,48],orange:[64,0,64,48],tall:[192,96,64,80],thatch:[256,80,64,86],treehouse:[224,0,48,80],bigtree:[0,96,64,48],smalltree:[64,96,32,34],stone:[32,48,16,48],rock:[48,64,16,32],pot:[64,64,16,16],pot2:[80,64,16,16],log:[96,96,16,32],stump:[96,128,16,16],ferns:[64,80,32,16]};
const NJ={hay:[144,128,16,16],pumpkin:[144,144,16,16],cabbage:[160,144,16,16],rail:[192,112,16,16],crate:[304,224,32,16],dome:[0,0,48,48],tower:[48,0,48,80],bigA:[96,0,64,48],bigB:[160,0,96,64],bigC:[256,0,64,64],palm:[160,64,64,48],palm2:[160,112,64,48],palm3:[160,160,64,32],lion2:[0,144,32,48],teal:[96,112,32,32],pool:[272,112,48,48],lionS:[0,96,32,48],stall1:[32,160,32,32],stall2:[64,160,32,32],pot:[96,176,16,16],pot2:[112,176,16,16],well:[0,48,32,32],
  hRed:[0,0,64,48],hTan:[64,0,64,48],hOrange:[128,0,64,48],pagoda:[192,0,64,48],shop:[256,0,48,48],hGreen:[304,0,64,48],hRound:[368,0,48,48],hWood:[416,0,48,48],hBig:[464,0,64,64],torii:[0,80,48,32],igloo:[0,176,48,48],igloo2:[48,176,48,48],igloo3:[96,176,48,48],longhouse:[400,112,64,112],longhouse2:[416,224,64,96],statueA:[0,240,48,48],banner:[352,320,16,32],banner2:[384,320,16,32],banner3:[416,320,16,32],snowpine:[128,0,32,32],whitetree:[160,0,32,32],snowclump:[64,80,64,48],whiteclump:[128,80,64,48],cherry:[0,288,48,48],whitebig:[96,288,48,48],pinktree:[224,0,32,32],snowrock:[32,192,32,32],greyrock:[256,80,64,48],bush:[0,160,16,16],arch:[464,320,64,48],tGreen:[0,0,32,32],tPine:[32,0,32,32],tDead:[64,0,32,32],tOak:[96,0,32,32],tSnowRound:[192,0,32,32],tLime:[256,0,32,32],tLime2:[288,0,32,32],bigGreen:[48,288,48,48],bigAutumn:[144,288,48,48],stump:[0,128,32,32],stump2:[32,128,32,32],rockB:[240,160,32,32],rockB2:[240,192,32,32],rockBig:[272,160,64,48],rockTall:[336,160,32,48],rockSm:[272,208,48,16],rockG:[240,224,32,32],rockG2:[240,256,32,32],rockGBig:[272,224,64,48],rockGTall:[336,224,32,48],rockGSm:[272,272,48,16],snowBall:[64,192,16,16],snowBall2:[80,192,16,16],snowRockD:[0,192,32,32],tuft:[16,160,16,16],tuft2:[48,160,16,16],sunflower:[0,176,16,16],flowerR:[48,176,16,16],fern:[64,176,16,16],dSkull:[256,176,16,16],dRibs:[272,176,16,16],dFrag:[288,176,16,16],dBone:[304,176,16,16],dSprout:[224,160,16,16],dSprout2:[224,176,16,16],dVine:[128,160,32,32],dDry:[128,144,16,16]};
function house(m,o){if(!o.spr&&!o.composed){o.spr=ACTSPR[o.act]||['gable','blue2','red','flat'][(o.x*7+o.door*3)%4];}
  if(o.spr)return sprHouse(m,o);
  const y=o.door-(o.h+2);const b=Object.assign({t:'house',y,roof:o.roof??0},o);b.dx=b.x+Math.floor(b.w/2);b.dy=o.door;
  // 여러 덩어리 (본채 + 날개 + 첨탑)를 조합한 집
  const parts=[{k:'main',x:b.x*T,y:y*T,w:b.w*T,h:(b.h+3)*T}];
  block(m,b.x,y+1,b.w,b.h+2);
  if(b.wing){const ww=b.wing.w,wh=Math.max(1,b.h-1),wy=o.door-(wh+2),wx=b.wing.s==='l'?b.x-ww+1:b.x+b.w-1;b.wing.wh=wh;parts.unshift({k:'wing',x:wx*T,y:wy*T,w:ww*T,h:(wh+3)*T,ww,wh,roof:b.wing.roof??b.roof});block(m,wx,wy+1,ww,wh+2);}
  for(const sd of (b.spire||'').split('')){const sx=sd==='l'?b.x*T-48:(b.x+b.w)*T-4;parts.unshift({k:'spire',x:sx,y:(o.door+1)*T-66,w:52,h:66,roof:b.spireRoof??b.roof});block(m,sd==='l'?b.x-3:b.x+b.w,o.door-2,3,3);}
  const minX=Math.min(...parts.map(p=>p.x)),maxX=Math.max(...parts.map(p=>p.x+p.w)),minY=Math.min(...parts.map(p=>p.y));
  b.parts=parts.map(p=>Object.assign({},p,{x:p.x-minX,y:p.y-minY}));b.bx=minX;b.by=minY;b.bw=maxX-minX;b.bh=(o.door+1)*T-minY;b.base=(o.door+1)*T;
  m.blk[gi(m,b.dx,b.dy)]=1;m.objs.push(b);
  // 문 앞 길
  if(o.path!==0)fillG(m,b.dx,o.door+1,1,(o.path||1),1);return b;}
function prop(m,k,x,y,extra){const p=PROP[k];const o=Object.assign({t:'prop',k,x,y,base:(y+1)*T},extra||{});block(m,x,y,p.blk[0],p.blk[1]);m.objs.push(o);return o;}
function tree(m,x,y,k){m.objs.push({t:'tree',x,y,k:k||(Math.random()<.5?'tree1':'tree2'),ph:Math.random()*4,base:(y+1)*T});block(m,x,y,1,1);}
function treeBorder(m,gaps){// 가장자리 숲 (출구 자리는 비움)
  const isGap=(x,y)=>gaps.some(g=>Math.abs(g[0]-x)<=g[2]&&Math.abs(g[1]-y)<=g[2]);
  for(let x=0;x<m.w;x+=2){for(const y of [0,m.h-1])if(!isGap(x,y)&&m.g[gi(m,x,y)]===0&&!(y&&(m.blk[gi(m,x,y-1)]||m.blk[gi(m,Math.min(m.w-1,x+1),y-1)]||m.g[gi(m,x,y-1)]===3)))tree(m,x,y);}
  for(let y=2;y<m.h-1;y+=2){for(const x of [0,m.w-1])if(!isGap(x,y)&&m.g[gi(m,x,y)]===0)tree(m,x,y);}
  // 안쪽으로 한 줄 더 (자연스럽게 듬성듬성)
  for(let x=1;x<m.w-1;x+=3){if(Math.random()<.6&&!isGap(x,1)&&m.g[gi(m,x,1)]===0&&!m.blk[gi(m,x,1)])tree(m,x,1);}
}
function fence(m,x,y,len,dir){m.fset=m.fset||new Set();for(let i=0;i<len;i++){const X=dir==='h'?x+i:x,Y=dir==='h'?y:y+i;const k=gi(m,X,Y);if(m.fset.has(k))continue;m.fset.add(k);m.objs.push({t:'fencet',x:X,y:Y,base:(Y+1)*T-3});block(m,X,Y,1,1);}}
function road(m,x,y,w,h){fillG(m,x,y,w,h,1);}
// 둥근 연못: 사각형을 채운 뒤 모서리를 깎는다 (큰 연못은 두 칸씩)
function pond(m,x,y,w,h,deep){fillG(m,x,y,w,h,2);const cut=(i,j)=>{if(m.g[gi(m,i,j)]===2)m.g[gi(m,i,j)]=0;};const k=Math.min(w,h)>=6?2:1;
  for(let a=0;a<k;a++)for(let b=0;b<k-a;b++){cut(x+a,y+b);cut(x+w-1-a,y+b);cut(x+a,y+h-1-b);cut(x+w-1-a,y+h-1-b);}
  if(deep&&w>4&&h>4)fillG(m,x+2,y+2,w-4,h-4,7);}
// 돌담 (Sunnyside 돌벽 타일 자동 연결), gx = 위쪽 가운데 문
function stoneRing(m,x,y,w,h,gx){m.wset=m.wset||new Set();const put=(X,Y,gate)=>{const k=gi(m,X,Y);m.wset.add(k);m.objs.push({t:'swall',x:X,y:Y,gate,base:(Y+1)*T-2});block(m,X,Y,1,1);};
  const G=[].concat(gx);for(let i=x;i<x+w;i++){if(G.includes(i)){m.g[gi(m,i,y)]=1;m.g[gi(m,i,y+h-1)]=1;continue;}put(i,y);put(i,y+h-1);}for(let j=y+1;j<y+h-1;j++){put(x,j);put(x+w-1,j);}}
// ── 지형: 언덕(평지 위 고지대) · 강 · 다리 ──
// 언덕: 테두리(12)·절벽면(9)은 못 지나감, 계단(10)으로만 오르내림. 위쪽 면(8)은 걸을 수 있음
function hill(m,x,y,w,h,stairs,style){style=style||'wood';const sw=style==='stone'?3:2;for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const edge=i===x||i===x+w-1||j===y;m.g[gi(m,i,j)]=edge?12:8;}
  for(let i=x;i<x+w;i++){m.g[gi(m,i,y+h)]=9;m.g[gi(m,i,y+h+1)]=9;}
  m.stairs=m.stairs||[];for(const sx of stairs||[]){for(let k=0;k<sw;k++){m.g[gi(m,sx+k,y+h-1)]=8;m.g[gi(m,sx+k,y+h)]=10;m.g[gi(m,sx+k,y+h+1)]=10;}m.stairs.push({x:sx,y:y+h,w:sw,style});}
  m.hills=(m.hills||[]).concat([{x,y,w,h}]);}
function riverV(m,x,w,y0,y1,straight){for(let j=y0;j<y1;j++){const wob=straight?0:Math.round(Math.sin(j*.35)*1);for(let i=0;i<w;i++)m.g[gi(m,x+i+wob,j)]=2;}}
function riverH(m,y,h,x0,x1,bend){for(let i=x0;i<x1;i++){const wob=bend==null?Math.round(Math.sin(i*.16)*1):(i>=bend?1:0);for(let j=0;j<h;j++)m.g[gi(m,i,y+j+wob)]=2;}}
// 다리: 물이 있는 구간만 다리 바닥(11), 양쪽 1칸은 길로 이어줌. 다리 근처 강은 곧게 정리.
function bridge(m,x,y,len,dir,style){style=style||'wood';const H=dir==='h';const W=v=>v===2||v===7;
  const at=(k,q)=>H?[k,y+q]:[x+q,k];const s0=(H?x:y)-3,s1=(H?x:y)+len+3;let a=1e9,b=-1;
  for(let k=s0;k<=s1;k++)for(let q=0;q<2;q++){const [X,Y]=at(k,q);if(X<0||Y<0||X>=m.w||Y>=m.h)continue;if(W(m.g[gi(m,X,Y)])){a=Math.min(a,k);b=Math.max(b,k);}}
  if(b<0)return;if(style==='arch'){const c=(a+b)>>1;a=c-3;b=c+3;}
  for(let q=-2;q<4;q++)for(let k=a-2;k<=b+2;k++){const [X,Y]=at(k,q);if(X<0||Y<0||X>=m.w||Y>=m.h)continue;const id=gi(m,X,Y);
    if(k>=a&&k<=b)m.g[id]=(q===0||q===1)?11:2;else if(W(m.g[id]))m.g[id]=0;}
  const ext=style==='arch'?2:1;for(let q=0;q<2;q++)for(const k of [a-1,b+1,a-ext,b+ext]){const [X,Y]=at(k,q);const id=gi(m,X,Y);if(m.g[id]!==4)m.g[id]=1;m.blk[id]=0;}
  (m.bridges=m.bridges||[]).push({dir,a:a-ext,b:b+ext,lane:H?y:x,style});}
// 울타리 상자(문 1칸 비움). gate: 't' 위 / 'b' 아래, 문 칸은 길로 깔아 출입구와 이어짐
function fenceBox(m,x,y,w,h,gate,gx){gx=gx??x+Math.floor(w/2);const gy=gate==='t'?y:y+h-1;
  for(const yy of [y,y+h-1]){if(yy===gy){fence(m,x,yy,gx-x,'h');fence(m,gx+1,yy,x+w-gx-1,'h');}else fence(m,x,yy,w,'h');}
  fence(m,x,y+1,h-2,'v');fence(m,x+w-1,y+1,h-2,'v');m.g[gi(m,gx,gy)]=1;return [gx,gy];}
// 울타리 우리 (동물이 안에서만 움직임)
function pen(m,x,y,w,h,kinds,gate){const [gx,gy]=fenceBox(m,x,y,w,h,gate||'t');prop(m,'sack',x+1,y+h-2);
  m.animals=m.animals||[];const P={x:x+1,y:y+1,w:w-2,h:h-2};for(const k of kinds)m.animals.push(animal(k,P));m.pens=(m.pens||[]).concat([P]);return [gx,gy];}
// 밭: 갈아 놓은 흙 + 작물 줄 + 가운데 고랑길 + 울타리(문은 길 쪽)
function farm(m,x,y,w,h,gate){const gx=x+Math.floor(w/2);fenceBox(m,x,y,w,h,gate||'t',gx);
  fillG(m,x+1,y+1,w-2,h-2,5);fillG(m,gx,y+1,1,h-2,1);
  for(let j=y+1;j<y+h-1;j++){for(let i=x+1;i+1<gx;i+=2){m.objs.push({t:'crop',x:i,y:j,base:(j+1)*T-4,seed:i*3+j});block(m,i,j,2,1);}
    for(let i=gx+1;i+1<x+w-1;i+=2){m.objs.push({t:'crop',x:i,y:j,base:(j+1)*T-4,seed:i*3+j});block(m,i,j,2,1);}}
  return [gx,gate==='b'?y+h-1:y];}
// 길 가장자리를 들쭉날쭉하게 (일자 도로 방지)
function organicRoads(m,amt){const add=[];const h=(i,j)=>((i*374761393+j*668265263+m.w*97)^(m.h*7919))>>>0;
  for(let j=2;j<m.h-2;j++)for(let i=2;i<m.w-2;i++){if(m.g[gi(m,i,j)]!==0||m.blk[gi(m,i,j)])continue;
    const r=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>m.g[gi(m,i+a,j+b)]===1).length;if(!r)continue;
    const n=h(i,j);const band=Math.sin(i*.55+j*.3)+Math.sin(i*.21-j*.47);if(band>(amt||.9)&&n%3!==0)add.push(gi(m,i,j));else if(r>=2&&n%2===0)add.push(gi(m,i,j));}
  for(const k of add)m.g[k]=1;}

/* ----- 집결지 지도 ----- */
// ===== 집결지: 건물별 크기(타일) + 자유 배치 (위치 = 아래쪽 가운데) =====
const CAMP_SIZE={1:[36,27],2:[36,27],3:[42,31],4:[48,35]};
const CB={
  hq:{n:'단장 막사',fixed:1,size:B=>B.keep?[9,7]:[7,3],def:[18,8]},
  fire:{n:'모닥불',fixed:1,size:()=>[1,1],def:[18,13]},
  pen:{n:'가축 우리',fixed:1,size:()=>[8,4],def:[5,25],need:t=>t>=2},
  bunk:{size:()=>[7,2],def:[9,8]},board:{size:()=>[2,1],def:[23,10]},store:{size:()=>[4,3],def:[28,9]},
  clinic:{size:()=>[4,3],def:[5,19]},tavern:{size:()=>[5,3],def:[10,19]},forge:{size:()=>[5,3],def:[26,19]},
  hall:{size:()=>[5,3],def:[32,19]},training:{size:()=>[9,4],def:[26,25]},fountain:{size:()=>[5,3],def:[12,25]}};
const isDec=k=>typeof k==='string'&&k.startsWith('d:');
const DECW=d=>['fence','crops','barrel'].includes(D.DECOR[d].spr)?2:1;
function campPos(k){const s=S();if(isDec(k)){const i=+k.slice(2);const p=(s.camp.dpos||[])[i];if(p)return p;const a=(MAP&&MAP.decorAt||[]).find(o=>o.i===i);return a?[a.x+Math.floor(a.w/2),a.y]:[18,16];}
  s.camp.pos=s.camp.pos||{};const p=s.camp.pos[k];return p?p:CB[k].def;}
function campRect(k,pos){const s=S(),B=s.camp.built;if(isDec(k)){const w=DECW(s.camp.decor[+k.slice(2)]);const [cx,by]=pos||campPos(k);return {x:cx-Math.floor(w/2),y:by,w,h:1};}const [w,h]=CB[k].size(B);const [cx,by]=pos||campPos(k);return {x:cx-Math.floor(w/2),y:by-h+1,w,h};}
function campHas(k){const s=S(),B=s.camp.built;if(CB[k].fixed)return !CB[k].need||CB[k].need(s.camp.tier);return !!B[k];}
function defaultCampRoads(w,h){const r=[];const add=(x,y,ww,hh,v)=>{for(let j=y;j<y+hh;j++)for(let i=x;i<x+ww;i++)if(i>=0&&j>=0&&i<w&&j<h)r.push([i,j,v||1]);};
  add(13,10,11,7,4);add(0,13,13,1);add(24,13,w-24,1);add(18,17,1,h-17);add(3,21,w-6,1);add(18,7,1,3);return r;}
function drawCampBuilding(m,k,R){const s=S(),B=s.camp.built,tier=s.camp.tier;const x=R.x,y=R.y;
  if(k==='hq'){if(B.keep){const o=house(m,{x,w:9,h:2,door:y+6,roof:4,act:'tent',name:'석조 본성',spr:'mansion',path:0});o.big=true;}
    else{const o=prop(m,tier>=2?'tentN':'tentW',x+2,y+1,{act:'tent',name:'단장 막사'});o.base=(y+3)*T;prop(m,'crate',x,y+2);prop(m,'sack',x+5,y+2);prop(m,'barrel',x+6,y+1);if(tier===1){m.objs.push({t:'banner',x:x+1,y:y+1,base:(y+2)*T});block(m,x+1,y+1,1,1);}}}
  else if(k==='fire'){m.objs.push({t:'fire',x,y,base:(y+1)*T+4,act:'fire',name:'모닥불'});block(m,x,y,1,1);}
  else if(k==='pen'){const ks=['chicken','sheep'];if(tier>=3)ks.push('chicken','sheep','cow');pen(m,x,y,8,4,ks);}
  else if(k==='bunk'){prop(m,'tentN',x,y,{act:'bunk',name:'용병 숙소'});prop(m,'tentN',x+4,y,{act:'bunk',name:'용병 숙소'});}
  else if(k==='board'){m.objs.push({t:'board',x,y,base:(y+1)*T,act:'board',name:'의뢰 게시판'});block(m,x,y,2,1);}
  else if(k==='store')house(m,{x,w:4,h:1,door:y+2,roof:1,act:'store',name:'보급 상점',sign:D.I(17,8),path:0});
  else if(k==='clinic')house(m,{x,w:4,h:1,door:y+2,roof:3,act:'clinic',name:'의무실',sign:D.I(17,4),path:0});
  else if(k==='tavern')house(m,{x,w:5,h:1,door:y+2,roof:3,act:'tavern',name:'용병 주점',sign:D.I(8,10),path:0});
  else if(k==='forge'){const f=house(m,{x,w:4,h:1,door:y+2,roof:2,act:'forge',name:'목재 대장간',sign:D.I(7,13),path:0});f.smoke=true;prop(m,'anvil',x+3,y+2);}
  else if(k==='hall')house(m,{x,w:5,h:1,door:y+2,roof:4,act:'hall',name:'영웅의 전당',sign:D.I(2,4),path:0});
  else if(k==='training'){fence(m,x,y,9,'h');fence(m,x,y+3,9,'h');for(let i=0;i<3;i++){m.objs.push({t:'dummy',x:x+1+i*3,y:y+2,base:(y+3)*T-2,act:'training',name:'훈련소'});block(m,x+1+i*3,y+2,1,1);}m.labels.push({x:x+4.5,y:y-.4,n:'훈련소',act:'training'});}
  else if(k==='fountain'){fillG(m,x,y,5,3,4);prop(m,'fountain',x+1,y+1,{act:'deco',name:'분수 광장'});}}
function buildCamp(opt){opt=opt||{};const s=S(),tier=s.camp.tier,B=s.camp.built;const [W,Hh]=CAMP_SIZE[tier]||CAMP_SIZE[4];const m=mkMap('camp',W,Hh);m.title='집결지 · '+D.CAMP_TIERS[tier].n;
  m.pathMat=B.plaza?'marble':B.slab?'slab':B.gravel?'gravel':'dirt';
  if(!s.camp.roads)s.camp.roads=defaultCampRoads(36,27);
  // 땅이 넓어지면 바깥 길을 이어 줌
  if((s.camp.roadW||36)<W){for(let i=s.camp.roadW||36;i<W;i++)s.camp.roads.push([i,13,1]);s.camp.roadW=W;}
  for(const [x,y,v] of s.camp.roads)if(x>=0&&y>=0&&x<W&&y<Hh)m.g[gi(m,x,y)]=v;
  m.camp={};
  for(const k in CB){if(!campHas(k)||k===opt.skip)continue;const R=campRect(k);m.camp[k]=R;drawCampBuilding(m,k,R);}
  // 장식 (자리 목록에서 비어 있는 풀밭만)
  const small=[[14,16],[22,16],[13,11],[23,15],[2,11],[33,11],[2,15],[33,15],[8,12],[28,12],[16,23],[20,23],[15,25],[20,25],[32,25],[1,18],[34,18],[25,11],[11,12],[30,12],[37,16],[39,22],[40,12],[6,14],[29,15]];
  const tall=[[5,11],[31,11],[2,19],[33,19],[14,25],[21,25],[25,12],[14,8],[9,11],[27,11],[16,19],[20,17],[38,18],[40,26]];
  let si=0,ti=0,bi=0;const big=[[W-5,0]];
  m.decorAt=[];s.camp.dpos=s.camp.dpos||[];
  for(let di=0;di<s.camp.decor.length;di++){const d=s.camp.decor[di];const dd=D.DECOR[d];
    if(!dd.big&&s.camp.dpos[di]){const w=DECW(d),[cx,by]=s.camp.dpos[di];const x0=cx-Math.floor(w/2);let ok=x0>0&&by>0&&x0+w<W&&by<Hh-1;for(let i=0;ok&&i<w;i++)if(m.blk[gi(m,x0+i,by)])ok=false;
      if(ok){decorObj(m,d,x0,by);m.decorAt.push({i:di,x:x0,y:by,w});continue;}}
    if(dd.big){const p=big[bi++];if(p){m.objs.push({t:'windmill',x:p[0],y:p[1],base:(p[1]+6)*T,name:'풍차'});block(m,p[0]+1,p[1]+4,4,2);m.camp.windmill={x:p[0]+1,y:p[1]+4,w:4,h:2};}continue;}
    const isTall=['statue','lantern','banner','well','scarecrow'].includes(dd.spr);let p;
    do{p=isTall?tall[ti++]:small[si++];}while(p&&(p[0]>=W-1||p[1]>=Hh-1||m.blk[gi(m,p[0],p[1])]||m.g[gi(m,p[0],p[1])]!==0||(isTall&&m.blk[gi(m,p[0],p[1]-1)])));if(!p)continue;decorObj(m,d,p[0],p[1]);m.decorAt.push({i:di,x:p[0],y:p[1],w:DECW(d)});}
  for(const [k,x,y] of [['bush',14,18],['rock',21,19],['bush',32,8],['bush',3,8],['bush',34,24],['rock',5,22],['bush',38,9],['rock',44,20]])if(x<W-2&&y<Hh-2&&!m.blk[gi(m,x,y)]&&!m.blk[gi(m,x+1,y)]&&m.g[gi(m,x,y)]===0&&m.g[gi(m,x+1,y)]===0)prop(m,k,x,y);
  treeBorder(m,[[0,13,1],[W-1,13,1],[18,Hh-1,1]]);
  for(const [x,y] of [[2,3],[4,2],[33,3],[34,8],[1,8],[33,20],[2,19],[40,4],[44,10],[42,28]])if(x<W-1&&y<Hh-1&&!m.blk[gi(m,x,y)]&&m.g[gi(m,x,y)]===0)tree(m,x,y);
  let sp=[18,16];for(let r=0;r<8&&isBlocked(m,sp[0],sp[1]);r++){sp=[18+ri(-r,r),16+ri(-r,r)];}
  m.spawn={x:sp[0],y:sp[1]};m.exits=[{x:18,y:Hh-1,to:'world',n:'월드맵'},{x:0,y:13,to:'world',n:'월드맵'},{x:W-1,y:13,to:'world',n:'월드맵'}];
  return m;}
// 배치 가능?: 지도 안 + 다른 건물·풍차와 안 겹침 + 출구 근처 아님
function campCanPlace(k,pos){const s=S();const [W,Hh]=CAMP_SIZE[s.camp.tier]||CAMP_SIZE[4];const R=campRect(k,pos);
  if(R.x<1||R.y<1||R.x+R.w>W-1||R.y+R.h>Hh-1)return false;
  const ov=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
  for(const o in CB){if(o===k||!campHas(o))continue;if(ov(R,campRect(o)))return false;}
  if(MAP&&MAP.camp&&MAP.camp.windmill&&ov(R,MAP.camp.windmill))return false;
  if(isDec(k)){for(const a of MAP.decorAt||[]){if('d:'+a.i===k)continue;if(ov(R,{x:a.x,y:a.y,w:a.w,h:1}))return false;}for(let i=R.x;i<R.x+R.w;i++){const g=MAP.g[gi(MAP,i,R.y)];if(g===2||g===7)return false;}}
  for(const e of [[0,13],[W-1,13],[18,Hh-1]])if(e[0]>=R.x-1&&e[0]<=R.x+R.w&&e[1]>=R.y-1&&e[1]<=R.y+R.h)return false;
  return true;}
/* ----- 집결지 배치 편집: 건설 / 이동 / 철거 / 길 ----- */
let ED=null;
function edOn(){return ED&&scene==='walk'&&MAP&&MAP.key==='camp';}
function edStart(mode,key){if(S().loc!=='camp'){toast('집결지에서만 할 수 있어요');return;}closePanel();player.path=[];player.goal=null;
  ED={mode,key:key||null,pos:null,last:null};if(mode==='place'){const p=CB[key].def;ED.pos=[p[0],p[1]];if(!campCanPlace(key,ED.pos)){const px=Math.floor(player.x/T),py=Math.floor(player.y/T);
    outer:for(let r=1;r<14;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const q=[px+i,py+j];if(campCanPlace(key,q)){ED.pos=q;break outer;}}}}
  edBar();}
function edEnd(){ED=null;$('edBar').classList.add('hidden');document.body.classList.remove('editing');rebuildCamp();}
function edBar(){const b=$('edBar');b.classList.remove('hidden');document.body.classList.add('editing');const M=ED.mode;let h='';
  const nm=ED.key?(isDec(ED.key)?D.DECOR[S().camp.decor[+ED.key.slice(2)]].n:(CB[ED.key].n||D.BUILDS[ED.key].n)):'';
  if((M==='place'||M==='move')&&ED.key){const ok=campCanPlace(ED.key,ED.pos);h=`<span class="edT">${M==='place'?'🔨 건설':'↔ 이동'}: <b>${nm}</b> — 땅을 눌러 자리를 정하세요 ${ok?'<b class="good">놓을 수 있음</b>':'<b class="bad">겹침</b>'}</span><button class="go" id="edOk" ${ok?'':'disabled'}>✔ ${M==='place'?'여기에 짓기':'여기로 옮기기'}</button><button id="edNo">✖ 취소</button>`;}
  else{const tip={move:'옮길 건물이나 장식을 누르세요',demolish:'철거할 건물·장식을 누르세요 (비용의 절반 환불)',road:'길을 깔 땅을 누르거나 끌어 칠하세요',unroad:'없앨 길을 누르거나 끌어 지우세요'}[M]||'';
    h=`<span class="edT">${tip}</span>`+[['move','↔ 이동'],['demolish','🗑 철거'],['road','🛤 길 깔기'],['unroad','🌱 길 없애기']].map(([k,n])=>`<button data-ed="${k}" class="${M===k?'sel':''}">${n}</button>`).join('')+`<button data-ed="build">🔨 건설</button><button class="go" id="edDone">✔ 완료</button>`;}
  b.innerHTML=h;
  b.querySelectorAll('[data-ed]').forEach(x=>x.onclick=()=>{const k=x.dataset.ed;if(k==='build'){ED=null;b.classList.add('hidden');buildPanel(null,'build');return;}ED={mode:k,key:null,pos:null,cx:ED&&ED.cx,cy:ED&&ED.cy};edBar();});
  if($('edDone'))$('edDone').onclick=edEnd;if($('edNo'))$('edNo').onclick=()=>{ED={mode:ED.mode==='place'?'move':ED.mode,key:null,pos:null,cx:ED.cx,cy:ED.cy};edBar();};
  if($('edOk'))$('edOk').onclick=()=>{const k=ED.key,s=S();if(!campCanPlace(k,ED.pos))return;
    if(ED.mode==='place'){const e=G.build(k);if(e){toast(e);return;}sfx('levelup',.4);toast('🔨 '+D.BUILDS[k].n+' 완공!');}else sfx('click',.4);
    if(isDec(k)){s.camp.dpos=s.camp.dpos||[];s.camp.dpos[+k.slice(2)]=ED.pos.slice();}else{s.camp.pos=s.camp.pos||{};s.camp.pos[k]=ED.pos.slice();}G.save();const mode=ED.mode==='place'?'move':ED.mode;const cx=ED.cx,cy=ED.cy;rebuildCamp();ED={mode,key:null,pos:null,cx,cy};edBar();};}
function edTile(px,py){const [wx,wy]=screenToWorld(px,py);return [Math.floor(wx/T),Math.floor(wy/T)];}
function edBuildingAt(x,y){for(const a of MAP.decorAt||[])if(y===a.y&&x>=a.x&&x<a.x+a.w)return 'd:'+a.i;for(const k in MAP.camp||{}){if(k==='windmill')continue;const R=MAP.camp[k];if(x>=R.x&&x<R.x+R.w&&y>=R.y-2&&y<R.y+R.h)return k;}return null;}
function edTap(px,py,drag){const [x,y]=edTile(px,py);const M=ED.mode,s=S();
  if(M==='road'||M==='unroad'){const key=x+','+y;if(drag&&ED.last===key)return;ED.last=key;if(x<1||y<1||x>=MAP.w-1||y>=MAP.h-1)return;
    s.camp.roads=s.camp.roads.filter(r=>!(r[0]===x&&r[1]===y));if(M==='road')s.camp.roads.push([x,y,1]);
    MAP.g[gi(MAP,x,y)]=M==='road'?1:0;MAP.bg=null;paintGround(MAP);if(!drag)sfx('step',.3);return;}
  if(drag)return;
  if((M==='place'||M==='move')&&ED.key){const R=campRect(ED.key,[0,0]);ED.pos=isDec(ED.key)?[x,y]:[x,y+Math.floor(R.h/2)];edBar();return;}
  const k=edBuildingAt(x,y);if(!k){toast('건물이나 장식을 눌러 주세요');return;}
  if(M==='move'){ED.key=k;ED.pos=campPos(k).slice();edBar();sfx('click',.3);}
  else if(M==='demolish'&&isDec(k)){const i=+k.slice(2),d=s.camp.decor[i];const ref=Math.round((G.decorPrice(d)||0)*.5);
    confirmBox(`장식 [${D.DECOR[d].n}]을(를) 치울까요? ${fmt(ref)} G를 돌려받습니다. (꾸미기 점수도 줄어요)`,()=>{s.camp.decor.splice(i,1);(s.camp.dpos||[]).splice(i,1);G.addGold(ref);G.save();sfx('hit',.4);rebuildCamp();edBar();});}
  else if(M==='demolish'){if(CB[k].fixed){toast(CB[k].n+'은(는) 철거할 수 없어요 (이동만 가능)');return;}const b=D.BUILDS[k];
    confirmBox(`[${b.n}]을(를) 철거할까요? ${fmt(Math.round(b.cost*.5))} G를 돌려받습니다.`,()=>{s.camp.built[k]=false;G.addGold(Math.round(b.cost*.5));if(s.camp.pos)delete s.camp.pos[k];G.save();sfx('hit',.4);rebuildCamp();edBar();});}}
function drawEdit(c){if(!edOn())return;const m=MAP;c.save();c.strokeStyle='rgba(255,255,255,.13)';c.lineWidth=1;
  for(let i=1;i<m.w;i++){c.beginPath();c.moveTo(i*T,0);c.lineTo(i*T,m.h*T);c.stroke();}for(let j=1;j<m.h;j++){c.beginPath();c.moveTo(0,j*T);c.lineTo(m.w*T,j*T);c.stroke();}
  const corners=(x,y,w,h,col)=>{const L=[['selectbox_tl',x-3,y-3],['selectbox_tr',x+w-5,y-3],['selectbox_bl',x-3,y+h-6],['selectbox_br',x+w-5,y+h-6]];for(const [k,a,b] of L){const im=IMG['ui_'+k];if(im)c.drawImage(im,a,b);}};
  if((ED.mode==='move'||ED.mode==='demolish')&&!ED.key)for(const k in m.camp){if(k==='windmill')continue;const R=m.camp[k];if(ED.mode==='demolish'&&CB[k].fixed)continue;c.fillStyle=ED.mode==='demolish'?'rgba(255,80,60,.18)':'rgba(255,230,120,.16)';c.fillRect(R.x*T,R.y*T,R.w*T,R.h*T);corners(R.x*T,R.y*T,R.w*T,R.h*T);}
  if((ED.mode==='move'||ED.mode==='demolish')&&!ED.key)for(const a of m.decorAt||[]){c.fillStyle='rgba(120,200,255,.2)';c.fillRect(a.x*T,a.y*T,a.w*T,T);corners(a.x*T,a.y*T,a.w*T,T);}
  if(ED.key&&ED.pos){const R=campRect(ED.key,ED.pos);const ok=campCanPlace(ED.key,ED.pos);c.fillStyle=ok?'rgba(90,220,90,.35)':'rgba(240,70,60,.4)';c.fillRect(R.x*T,R.y*T,R.w*T,R.h*T);
    c.strokeStyle=ok?'#7fff7f':'#ff6a5a';c.lineWidth=2;c.strokeRect(R.x*T+1,R.y*T+1,R.w*T-2,R.h*T-2);corners(R.x*T,R.y*T,R.w*T,R.h*T);
    const lx=(R.x+R.w/2)*T,ly=R.y*T-10;const lm=IMG.ui_label_middle,ll=IMG.ui_label_left,lr=IMG.ui_label_right,hm=IMG.ui_hammer;
    if(lm&&ll&&lr){const tw=64;c.drawImage(ll,lx-tw/2-4,ly-13);c.drawImage(lm,0,0,16,13,lx-tw/2,ly-13,tw,13);c.drawImage(lr,lx+tw/2,ly-13);if(hm)c.drawImage(hm,lx-tw/2-10,ly-14);
      c.font='bold 8px Galmuri9,Galmuri11,sans-serif';c.textAlign='center';c.fillStyle='#3a2a1a';c.fillText(ED.mode==='place'?'BUILD 건설':'MOVE 이동',lx+3,ly-4);}}
  if(ED.mode==='road'||ED.mode==='unroad'){c.fillStyle=ED.mode==='road'?'rgba(230,180,110,.25)':'rgba(120,220,120,.2)';for(const [x,y] of S().camp.roads)if(ED.mode==='unroad')c.fillRect(x*T,y*T,T,T);}
  c.restore();}
function plot(m,key,x,y,w,h){const b=D.BUILDS[key];if(!b||b.tier>S().camp.tier)return;m.objs.push({t:'plot',key,x,y,w,h,base:(y+h)*T,act:'plot',plot:key,name:b.n+' 부지'});block(m,x,y+Math.max(0,h-2),w,Math.min(2,h));}
function decorObj(m,d,x,y){const sp=D.DECOR[d].spr;
  if(sp==='flowers'){m.objs.push({t:'flowers',x,y,base:(y+1)*T-8,seed:x*7+y});}
  else if(sp==='fence'){fence(m,x,y,2,'h');}
  else if(sp==='barrel'){prop(m,'barrels',x,y);}
  else if(sp==='crops'){fillG(m,x,y,2,1,5);m.objs.push({t:'crop',x,y,base:(y+1)*T-4,seed:x+y});}
  else if(sp==='lantern'){prop(m,'lamp',x,y);}
  else if(sp==='scarecrow'){m.objs.push({t:'dummy',x,y,base:(y+1)*T});block(m,x,y,1,1);}
  else if(sp==='statue'){prop(m,'statue',x,y);}
  else if(sp==='banner'){m.objs.push({t:'banner',x,y,base:(y+1)*T});block(m,x,y,1,1);}
  else if(sp==='well'){prop(m,'well',x,y);}}
function animal(k,pen){return {k,x:(pen.x+1+Math.random()*(pen.w-2))*T,y:(pen.y+.5+Math.random()*(pen.h-1))*T,pen,tx:0,ty:0,t:Math.random()*3,dir:1};}

/* ----- 마을 지도 (지역마다 사람이 설계한 배치) ----- */
function stall(m,x,y,col){m.objs.push({t:'stall',x,y,col,base:(y+1)*T});block(m,x,y,2,1);}
function bench(m,x,y){m.objs.push({t:'bench',x,y,base:(y+1)*T-4});block(m,x,y,3,1);}
function bed(m,x,y,w,seed){m.objs.push({t:'bed',x,y,w,seed,base:(y+1)*T-10});block(m,x,y,w,1);}
function sign(m,x,y){m.objs.push({t:'sign',x,y,base:(y+1)*T});block(m,x,y,1,1);}
function buildTown(tk){const t=D.TOWNS[tk];let m;
  const H=(o)=>house(m,o);
  if(tk==='t1'){m=mkMap(tk,34,28);m.pathMat='dirt';
    road(m,0,12,34,1);road(m,6,18,22,1);road(m,16,13,1,5);
    H({x:3,w:5,h:2,door:11,roof:0,act:'guild',name:'의뢰소',sign:D.I(18,9),boxes:1});
    H({x:12,w:4,h:1,door:11,roof:1,act:'shop',name:'잡화 상점',sign:D.I(7,3),boxes:1});
    H({x:18,w:5,h:2,door:11,roof:4,act:'inn',name:'여관 · 치료소',sign:D.I(8,10),boxes:1});
    H({x:27,w:4,h:1,door:11,roof:2,name:'촌장 댁',boxes:1});
    H({x:7,w:4,h:1,door:17,roof:3,name:'농가'});H({x:26,w:4,h:1,door:17,roof:1,name:'민가'});
    road(m,4,7,26,1);road(m,17,8,1,4);road(m,24,8,1,4);
    H({x:5,w:3,h:1,door:6,roof:3,name:'민가'});H({x:9,w:3,h:1,door:6,roof:0,name:'민가'});H({x:21,w:3,h:1,door:6,roof:1,name:'민가'});H({x:26,w:3,h:1,door:6,roof:2,name:'방앗간'});
    {const [fx]=farm(m,2,20,11,6,'t');road(m,fx,19,1,1);const [px]=pen(m,18,20,9,6,['chicken','chicken','cow','sheep','sheep','pig'],'t');road(m,px,19,1,1);}
    pond(m,27,21,6,4);prop(m,'well',13,14);m.objs.push({t:'board',x:10,y:10,base:11*T});block(m,10,10,2,1);
    stall(m,9,14,'#d04a3a');bench(m,18,14);sign(m,15,13);prop(m,'lamp',5,13);prop(m,'lamp',23,13);prop(m,'barrel',25,10);bed(m,23,14,3,1);
    for(const [x,y] of [[31,14],[32,16],[1,15],[14,23],[30,18]])tree(m,x,y);
    treeBorder(m,[[0,12,1],[33,12,1]]);m.spawn={x:1,y:12};m.exits=[{x:0,y:12,to:'world',n:'월드맵'},{x:33,y:12,to:'world',n:'월드맵'}];}
  else if(tk==='t2'){m=mkMap(tk,48,32);m.pathMat='gravel';
    m.objs.push({t:'cliff',x:0,y:0,w:48,base:4*T});block(m,0,0,48,5);
    road(m,0,15,48,1);road(m,0,27,48,1);road(m,12,16,1,11);road(m,38,13,1,2);road(m,14,6,1,9);road(m,3,6,22,1);
    // 광산 단지 언덕 (계단으로만 오르내림)
    hill(m,30,5,16,6,[38]);road(m,39,13,1,2);
    m.objs.push({t:'mine',x:36,y:4,base:7*T,act:'mine',name:'광산 입구'});block(m,35,6,5,1);m.labels.push({x:38,y:4.2,n:'⛏ 광산 입구',act:'mine'});
    m.extras=[[33,7,'worker',-1,'attack','광부'],[34,9,'worker',-1,'attack','광부'],[43,8,'worker',1,'attack','광부'],[13,8,'worker',-1,'idle','광부']];
    for(let y=8;y<11;y++)m.objs.push({t:'rail',x:42,y,base:(y+1)*T-14});m.objs.push({t:'cart',x:42,y:9,base:10*T});block(m,42,8,1,3);
    for(const [x,y] of [[31,7],[32,9],[44,7]])prop(m,'rock',x,y);prop(m,'crate',40,9);prop(m,'barrels',33,8);prop(m,'lamp',37,9);prop(m,'lamp',39,9);
    // 강 + 다리
    road(m,11,16,2,11);road(m,35,16,2,11);riverH(m,21,2,0,48,24);bridge(m,11,20,4,'v');bridge(m,35,20,4,'v');
    // 대장장이 거리 (용광로·모루·물통 작업장)
    const sm=H({x:2,w:4,h:1,door:14,roof:2,act:'smith',name:'대장간',sign:D.I(7,13)});sm.smoke=true;
    for(const [x,y] of [[2,7],[7,7],[2,9],[7,9]]){m.objs.push({t:'furnace',x,y,base:(y+2)*T});block(m,x,y+1,2,1);prop(m,'anvil',x+2,y+1);}
    m.objs.push({t:'trough',x:11,y:8,base:9*T});block(m,11,8,2,1);prop(m,'barrel',11,10);prop(m,'barrels',16,8);prop(m,'crate',19,8);prop(m,'sack',22,8);m.labels.push({x:8,y:7.3,n:'대장장이 거리'});
    // 큰길 북쪽
    H({x:15,w:4,h:2,door:14,roof:0,act:'guild',name:'광산 길드',sign:D.I(18,9)});H({x:20,w:4,h:1,door:14,roof:1,act:'shop',name:'광부 잡화점',sign:D.I(7,3)});
    H({x:25,w:4,h:2,door:14,roof:4,act:'inn',name:'광부 여관',sign:D.I(8,10)});H({x:30,w:4,h:1,door:18,roof:3,name:'광석 감정소'});H({x:43,w:4,h:1,door:18,roof:1,name:'창고'});
    // 큰길 남쪽 · 강 남쪽 주택
    for(const [x,r] of [[1,3],[5,1],[16,2],[20,0],[24,3],[38,2]])H({x,w:4,h:1,door:19,roof:r,name:'광부 숙소',path:0});
    for(const [x,r] of [[1,0],[5,2],[15,1],[19,4],[23,2],[27,0],[39,3],[43,1]])H({x,w:4,h:1,door:26,roof:r,name:'민가'});
    road(m,0,20,48,0);for(const x of [3,7,18,22,26,30,41,45])road(m,x,16,1,1),road(m,x,17,1,0);
    stall(m,31,13,'#3a7ad0');stall(m,33,13,'#d08a2a');prop(m,'lamp',3,16);prop(m,'lamp',44,16);prop(m,'lamp',33,28);
    treeBorder(m,[[0,15,1],[47,15,1]]);m.spawn={x:1,y:15};m.exits=[{x:0,y:15,to:'world',n:'월드맵'},{x:47,y:15,to:'world',n:'월드맵'}];}
  else if(tk==='t3'){m=mkMap(tk,46,30);m.pathMat='slab';
    fillG(m,0,23,46,2,3);fillG(m,0,25,46,5,2);fillG(m,0,28,46,2,7);
    road(m,0,11,46,1);road(m,0,19,46,1);road(m,12,12,1,7);road(m,33,12,1,7);road(m,22,20,1,3);
    fillG(m,20,22,5,6,6);m.objs.push({t:'spot',x:22,y:27,act:'fish',base:0});m.labels.push({x:22.5,y:27.6,n:'🎣 낚시터',act:'fish'});fillG(m,4,24,2,4,6);fillG(m,36,24,2,4,6);fillG(m,17,14,11,4,4);
    H({x:3,w:6,h:2,door:10,roof:0,act:'guild',name:'항구 의뢰소',sign:D.I(18,9),boxes:1});
    H({x:11,w:4,h:1,door:10,roof:1,act:'shop',name:'무역 상점',sign:D.I(7,3),awning:'#2a8ab8',boxes:1});
    H({x:17,w:6,h:2,door:10,roof:4,act:'inn',name:'바다 여관',sign:D.I(8,10),chimney:1,boxes:1});
    const sm=H({x:26,w:4,h:1,door:10,roof:2,act:'smith',name:'항구 대장간',sign:D.I(7,13)});sm.smoke=true;
    H({x:32,w:5,h:2,door:10,roof:4,act:'relic',name:'유물 상점',sign:D.I(10,6),spire:'r',spireRoof:0});
    H({x:41,w:4,h:1,door:10,roof:3,act:'casino',name:'행운의 도박장',chimney:1,boxes:1});
    H({x:2,w:4,h:1,door:18,roof:3,name:'선원 숙소',chimney:1});H({x:13,w:4,h:1,door:18,roof:1,name:'민가',boxes:1});H({x:36,w:4,h:1,door:18,roof:2,name:'창고'});H({x:41,w:4,h:1,door:18,roof:0,name:'세관',boxes:1});
    prop(m,'fountain',22,15);for(const x of [17,27])prop(m,'lamp',x,14);prop(m,'crate',19,21);prop(m,'crate',25,21);prop(m,'barrels',29,21);prop(m,'sack',14,21);prop(m,'barrels',3,21);
    stall(m,15,13,'#2a8ab8');stall(m,29,13,'#d04a3a');bench(m,19,17);bench(m,24,17);bed(m,30,16,2,5);
    road(m,13,5,30,1);road(m,12,5,1,6);road(m,33,6,1,5);road(m,23,6,1,5);
    // 바다가 보이는 언덕 (계단으로만) + 개울과 다리
    hill(m,1,1,11,4,[9]);road(m,9,7,2,4);H({x:3,w:4,h:1,door:4,roof:2,name:'등대지기 집',path:0});prop(m,'statue',8,3);m.objs.push({t:'flowers',x:2,y:4,base:5*T-8,seed:9});m.objs.push({t:'flowers',x:7,y:4,base:5*T-8,seed:4});
    riverV(m,8,2,12,25,true);bridge(m,6,18,6,'h');
    H({x:15,w:4,h:1,door:4,roof:3,name:'민가'});H({x:19,w:4,h:1,door:4,roof:1,name:'그물 공방'});
    H({x:26,w:4,h:1,door:4,roof:4,name:'민가'});H({x:29,w:4,h:1,door:4,roof:2,name:'민가'});H({x:36,w:4,h:1,door:4,roof:0,name:'선장 댁'});H({x:40,w:4,h:1,door:4,roof:3,name:'민가'});
    bench(m,38,8);bed(m,26,7,3,3);bed(m,5,7,3,6);prop(m,'barrels',17,7);
    m.boats=[{x:10.5*T,y:26.6*T,ph:0},{x:30*T,y:27.4*T,ph:1.6,sail:1},{x:41.5*T,y:26.8*T,ph:3}];
    treeBorder(m,[[0,11,1],[45,11,1],[0,19,1],[45,19,1]]);m.spawn={x:1,y:11};m.exits=[{x:0,y:11,to:'world',n:'월드맵'},{x:0,y:19,to:'world',n:'월드맵'}];}
  else if(tk==='t5'){m=mkMap(tk,44,34);m.nj='forest';m.pathMat='dirt';
    // 이끼 낀 숲 마을 (닌자 어드벤처 '버려진 마을' 타일 + 흙길)
    road(m,0,17,44,2);road(m,20,4,2,30);road(m,4,10,16,1);road(m,22,10,14,1);road(m,2,24,17,1);road(m,22,22,6,1);
    const VH=(o)=>njHouse(m,Object.assign({im:'nj_vil'},o));
    // 큰길 북쪽 상점가
    VH({x:9,r:VA.hut,door:16,act:'relic',name:'정령 유물점'});VH({x:13,r:VA.orange,door:16,act:'smith',name:'엘프 활 공방'});
    VH({x:23,r:VA.tall,door:16,act:'guild',name:'숲의 의뢰소'});VH({x:28,r:VA.hut2,door:16,act:'shop',name:'요정 가루 상점'});
    njHouse(m,{x:36,r:NJ.longhouse,door:16,act:'inn',name:'잎사귀 여관',im:'nj_house'});
    // 북서: 숲지기 마을 (나무 위 집)
    njo(m,'nj_vil',VA.thatch,2,9,4,2);m.labels.push({x:4,y:3.4,n:'🍃 장로의 거처'});VH({x:16,r:VA.hut,door:9,name:'숲지기의 집'});njo(m,'nj_vil',VA.treehouse,8,8,3,1);m.labels.push({x:9.5,y:3.3,n:'🌿 나무 위 집'});
    // 북동: 세계수 제단 (큰 나무 + 선돌)
    njo(m,'nj_nature',NJ.bigGreen,31,7,3,1);njo(m,'nj_vil',VA.bigtree,27,7,4,1);njo(m,'nj_vil',VA.bigtree,34,7,4,1);
    for(const [x,y] of [[29,9],[35,9],[28,4],[37,4]])njo(m,'nj_vil',VA.stone,x,y,1,1);m.labels.push({x:32.5,y:3.4,n:'🌳 세계수 제단'});
    // 큰길 남쪽: 민가 + 호수
    VH({x:2,r:VA.orange,door:23,name:'민가'});VH({x:7,r:VA.hut2,door:23,name:'민가'});VH({x:11,r:VA.hut,door:23,name:'민가'});VH({x:15,r:VA.hut2,door:23,name:'민가'});
    VH({x:3,r:VA.hut2,door:30,name:'민가'});VH({x:8,r:VA.orange,door:30,name:'방앗간'});road(m,4,31,1,1);road(m,9,31,1,1);road(m,4,25,1,6);road(m,9,25,1,6);
    pond(m,25,24,15,8,true);fillG(m,31,22,2,5,6);
    m.objs.push({t:'spot',x:31,y:26,act:'fish',base:0});m.labels.push({x:32,y:26.6,n:'🎣 호수 낚시터',act:'fish'});
    m.objs.push({t:'board',x:26,y:20,base:21*T});block(m,26,20,2,1);
    for(const [x,y,k] of [[17,20,'pot'],[23,20,'pot2'],[33,20,'pot'],[12,20,'rock']])njo(m,'nj_vil',VA[k],x,y,1,1);
    for(const [x,y] of [[13,26],[17,28]])njo(m,'nj_vil',VA.stump,x,y,1,1);
    const BT=[{im:'nj_vil',r:VA.bigtree},{im:'nj_vil',r:VA.smalltree},{im:'nj_nature',r:NJ.tGreen},{im:'nj_nature',r:NJ.tOak},{im:'nj_nature',r:NJ.bigGreen}];
    for(const A of [[1,1,18,3],[23,1,20,2],[1,26,1,7],[11,27,9,6],[22,30,3,4],[40,20,3,13],[40,11,3,5],[17,4,2,5]])njScatter(m,BT,12,A[0]*5+A[1],A);
    const SM=[{im:'nj_vil',r:VA.stump,solid:true},{im:'nj_vil',r:VA.rock},{im:'nj_vil',r:VA.ferns,solid:false},{im:'nj_nature',r:NJ.bush},{im:'nj_nature',r:NJ.fern,solid:false},{im:'nj_nature',r:NJ.flowerR,solid:false},{im:'nj_nature',r:NJ.sunflower,solid:false},{im:'nj_nature',r:NJ.tuft,solid:false}];
    njScatter(m,SM,30,5,[1,1,42,32],{spots:TOWN_NPC_SPOTS.t5});
    m.spawn={x:1,y:17};for(let y=0;y<34;y++){block(m,0,y,1,1);block(m,43,y,1,1);}for(let x=0;x<44;x++){block(m,x,0,1,1);block(m,x,33,1,1);}
    for(const [ex,ey] of [[0,17],[0,18],[43,17],[43,18],[20,33],[21,33]])m.blk[gi(m,ex,ey)]=0;
    m.exits=[{x:0,y:17,to:'world',n:'월드맵'},{x:43,y:17,to:'world',n:'월드맵'},{x:20,y:33,to:'world',n:'월드맵'}];}
  else if(tk==='t6'){m=mkMap(tk,46,34);m.pathMat='gravel';m.ash=true;m.lava=true;
    m.objs.push({t:'cliff',x:0,y:0,w:46,base:3*T});block(m,0,0,46,3);
    road(m,0,16,46,2);road(m,10,4,2,30);road(m,22,4,2,12);
    riverV(m,30,7,3,34,true);bridge(m,28,16,11,'h','arch');
    // 서쪽 대장간 거리
    H({x:2,w:5,h:2,door:15,roof:0,act:'guild',name:'불칼 의뢰소',sign:D.I(18,9),boxes:1});
    H({x:13,w:4,h:1,door:15,roof:0,act:'shop',name:'잿빛 잡화점',sign:D.I(7,3),boxes:1});
    H({x:17,w:4,h:1,door:15,roof:2,act:'relic',name:'흑요석 유물점',sign:D.I(10,4),boxes:1});
    H({x:24,w:5,h:2,door:15,roof:0,act:'inn',name:'용광로 여관',sign:D.I(8,10),boxes:1});
    H({x:2,w:6,h:2,door:9,roof:3,act:'smith',name:'불칼 대장장이 길드',sign:D.I(91,9),boxes:1});
    for(const [x,y] of [[13,6],[17,6],[24,6],[13,9],[17,9]]){m.objs.push({t:'furnace',x,y,base:(y+2)*T});block(m,x,y+1,2,1);m.objs.push({t:'prop',k:'anvil',x:x+2,y:y+1,base:(y+2)*T});block(m,x+2,y+1,2,1);}
    m.objs.push({t:'trough',x:20,y:12,base:13*T});block(m,20,12,2,1);m.labels.push({x:17,y:5.4,n:'🔥 화로 거리'});
    m.objs.push({t:'mine',x:24,y:1,base:4*T,act:'mine',name:'화산 광산 입구'});block(m,23,3,5,1);road(m,24,4,4,1);m.labels.push({x:26,y:5.2,n:'⛏ 화산 광산',act:'mine'});
    // 남쪽: 민가·창고
    for(const [x,r] of [[2,4],[6,1],[13,3],[17,2],[24,0]])H({x,w:4,h:1,door:23,roof:r,name:'대장장이 집'});road(m,2,24,26,1);
    for(const [x,y] of [[3,27],[8,28],[14,27],[19,28],[24,27]]){m.objs.push({t:'furnace',x,y,base:(y+2)*T});block(m,x,y+1,2,1);}
    prop(m,'barrel',8,25);prop(m,'barrel',20,25);prop(m,'barrel',27,21);
    // 동쪽: 용암 강 건너 요새 언덕
    hill(m,38,4,7,8,[40],'stone');road(m,40,14,3,2);
    m.objs.push({t:'statue2',x:40,y:6,base:8*T,name:'불칼 영웅상'});block(m,40,6,2,2);m.objs.push({t:'banner',x:39,y:9,base:10*T});block(m,39,9,1,1);m.objs.push({t:'banner',x:43,y:9,base:10*T});block(m,43,9,1,1);
    m.labels.push({x:41,y:4.4,n:'🏯 요새 망루'});
    H({x:39,w:5,h:1,door:23,roof:0,name:'요새 사령부'});road(m,39,18,1,5);
    for(const [x,y] of [[38,27],[42,29],[44,25]])prop(m,x%2?'rock':'rock2',x,y);
    for(const [x,y] of [[1,19],[29,24],[44,19],[1,31],[28,30]])tree(m,x,y,'tree2');
    treeBorder(m,[[0,16,2],[45,16,2],[10,33,2]]);m.spawn={x:1,y:16};
    m.exits=[{x:0,y:16,to:'world',n:'월드맵'},{x:45,y:16,to:'world',n:'월드맵'},{x:10,y:33,to:'world',n:'월드맵'}];}
  else if(tk==='t7'){m=mkMap(tk,46,34);m.nj='desert';m.pathMat='slab';
    road(m,0,16,46,2);road(m,22,3,2,31);fillG(m,15,18,16,4,4);road(m,2,11,42,1);road(m,2,26,20,1);road(m,2,26,1,7);road(m,2,32,20,1);
    const NH=(o)=>njHouse(m,Object.assign({im:'nj_desert'},o));
    NH({x:2,r:NJ.bigA,door:15,act:'guild',name:'상단 의뢰소'});NH({x:8,r:NJ.dome,door:15,act:'shop',name:'향신료 시장'});NH({x:12,r:NJ.dome,door:15,act:'smith',name:'시미터 대장간'});
    NH({x:25,r:NJ.bigC,door:15,act:'inn',name:'낙타 여관'});NH({x:30,r:NJ.dome,door:15,act:'relic',name:'사막 유물점'});NH({x:34,r:NJ.bigA,door:15,act:'casino',name:'사막의 별 도박장'});
    // 북쪽: 술탄 별궁과 망루, 흙벽 민가
    NH({x:16,r:NJ.bigB,door:8,name:'술탄의 별궁'});road(m,19,9,1,2);NH({x:12,r:NJ.tower,door:9,name:'망루'});NH({x:25,r:NJ.tower,door:9,name:'망루'});
    NH({x:3,r:NJ.dome,door:9,name:'민가'});NH({x:7,r:NJ.bigA,door:7,name:'민가'});road(m,9,8,1,3);
    NH({x:30,r:NJ.dome,door:9,name:'민가'});NH({x:35,r:NJ.bigC,door:9,name:'민가'});NH({x:40,r:NJ.dome,door:6,name:'민가'});road(m,41,7,1,4);
    // 남서 민가 골목
    NH({x:3,r:NJ.dome,door:24,name:'민가'});NH({x:8,r:NJ.bigA,door:24,name:'민가'});NH({x:14,r:NJ.dome,door:24,name:'민가'});
    NH({x:5,r:NJ.dome,door:31,name:'민가'});NH({x:10,r:NJ.dome,door:31,name:'민가'});NH({x:14,r:NJ.bigA,door:31,name:'민가'});
    // 오아시스 호수 (물가는 자동으로 모래 테두리)
    fillG(m,26,25,13,6,2);fillG(m,28,24,8,1,2);fillG(m,25,27,1,3,2);fillG(m,39,26,1,3,2);fillG(m,28,31,9,1,2);fillG(m,29,27,7,3,7);
    m.objs.push({t:'spot',x:31,y:24,act:'fish',base:0});m.labels.push({x:32,y:22.6,n:'🎣 오아시스 낚시터',act:'fish'});
    for(const [x,y] of [[24,30],[40,30],[37,22],[24,23]])njo(m,'nj_desert',NJ.palm,x,y,4,1);
    for(const [x,y] of [[18,12],[1,13],[42,13],[42,20],[1,20],[30,12]])njo(m,'nj_desert',NJ.palm3,x,y,4,1);
    for(const [x,k] of [[16,'stall1'],[19,'stall2'],[25,'stall1'],[28,'stall2']])njo(m,'nj_desert',NJ[k],x,19,2,1);m.labels.push({x:22,y:18.2,n:'🐪 바자르 광장'});
    njo(m,'nj_desert',NJ.lionS,16,22,2,1);njo(m,'nj_desert',NJ.well,26,22,2,1);
    for(const [x,y] of [[8,19],[33,20],[36,21],[13,21]])njo(m,'nj_desert',NJ.pot,x,y,1,1);
    const DI=['rockB','rockB2','rockBig','rockTall','rockSm','rockSm','dSkull','dRibs','dBone','dFrag','dDry','dVine','dSprout','dSprout2'].map(k=>({im:/^d/.test(k)?'nj_desert':'nj_nature',r:NJ[k],solid:!/^d(Skull|Ribs|Bone|Frag|Sprout)/.test(k)}));
    plateau(m,1,1,6,3,2,'desert');plateau(m,41,22,4,3,2,'desert');plateau(m,38,1,6,2,1,'desert');
    njScatter(m,DI,20,7,[1,1,44,32],{spots:TOWN_NPC_SPOTS.t7});
    m.spawn={x:1,y:16};for(let y=0;y<34;y++){block(m,0,y,1,1);block(m,45,y,1,1);}for(let x=0;x<46;x++){block(m,x,0,1,1);block(m,x,33,1,1);}m.blk[gi(m,0,16)]=0;m.blk[gi(m,0,17)]=0;m.blk[gi(m,45,16)]=0;m.blk[gi(m,45,17)]=0;
    m.exits=[{x:0,y:16,to:'world',n:'항구로 (배)'},{x:45,y:16,to:'world',n:'동방 대륙 지도'}];}
  else if(tk==='t9'){m=mkMap(tk,44,32);m.nj='rural';m.pathMat='dirt';
    // 단풍골: 주황 흙 마당 + 밝은 흙길, 초가지붕 시골 마을
    road(m,0,15,44,2);road(m,21,3,2,28);road(m,2,23,19,1);road(m,2,29,19,1);road(m,2,23,1,7);road(m,23,9,17,1);
    const NH=(o)=>njHouse(m,Object.assign({im:'nj_house'},o));
    NH({x:3,r:NJ.hRed,door:13,act:'guild',name:'단풍골 의뢰소'});NH({x:8,r:NJ.shop,door:13,act:'shop',name:'시골 잡화점'});NH({x:12,r:NJ.hWood,door:13,act:'smith',name:'대장간'});
    NH({x:25,r:NJ.hBig,door:13,act:'inn',name:'단풍 주막'});NH({x:31,r:NJ.hOrange,door:13,name:'촌장 댁'});NH({x:37,r:NJ.hTan,door:13,name:'민가'});
    NH({x:25,r:NJ.hTan,door:7,name:'민가'});NH({x:31,r:NJ.hOrange,door:7,name:'민가'});NH({x:36,r:NJ.hRound,door:7,name:'곳간'});
    NH({x:4,r:NJ.hOrange,door:21,name:'민가'});NH({x:10,r:NJ.hTan,door:21,name:'민가'});NH({x:15,r:NJ.hOrange,door:21,name:'방앗간'});
    NH({x:4,r:NJ.hTan,door:27,name:'민가'});NH({x:10,r:NJ.hOrange,door:27,name:'민가'});NH({x:15,r:NJ.hTan,door:27,name:'민가'});
    // 북서 호박밭 + 울타리
    fillG(m,3,4,9,4,5);for(let i=0;i<9;i++)for(let j=0;j<4;j++)if((i+j)%2===0)njo(m,'nj_nature',(i+j)%4?NJ.pumpkin:NJ.cabbage,3+i,4+j,0,0);
    for(let i=2;i<13;i++){if(i===7)continue;njo(m,'nj_house',NJ.rail,i,8,1,1);}m.labels.push({x:7.5,y:2.6,n:'🎃 호박밭'});
    // 남동 연못 (낚시)
    pond(m,27,20,12,8,true);fillG(m,29,19,8,1,2);
    m.objs.push({t:'spot',x:31,y:18,act:'fish',base:0});m.labels.push({x:32,y:17.4,n:'🎣 단풍 연못',act:'fish'});
    for(const [x,y] of [[24,26],[40,22]])njo(m,'nj_nature',NJ.bigAutumn,x,y,3,1);
    for(const [x,y] of [[18,10],[2,18],[17,18]])njo(m,'nj_nature',NJ.stump,x,y,2,1);for(const [x,y] of [[13,6],[14,6],[13,5]])njo(m,'nj_nature',NJ.hay,x,y,1,1);
    for(const [x,y] of [[7,18],[13,18],[19,25]])njo(m,'nj_house',NJ.crate,x,y,2,1);
    const RT=[{im:'nj_nature',r:NJ.bigAutumn},{im:'nj_nature',r:NJ.tLime},{im:'nj_nature',r:NJ.tLime2},{im:'nj_nature',r:NJ.tOak},{im:'nj_nature',r:NJ.bigGreen}];
    for(const A of [[13,1,7,8],[24,1,19,2],[1,30,42,1],[38,27,5,4],[24,28,14,3],[1,9,2,5]])njScatter(m,RT,8,A[0]*5+A[1],A);
    const SM=[{im:'nj_nature',r:NJ.bush},{im:'nj_nature',r:NJ.fern,solid:false},{im:'nj_nature',r:NJ.tuft,solid:false},{im:'nj_nature',r:NJ.stump2},{im:'nj_nature',r:NJ.flowerR,solid:false}];
    njScatter(m,SM,22,9,[1,1,42,30],{spots:TOWN_NPC_SPOTS.t9});
    m.spawn={x:1,y:15};for(let y=0;y<32;y++){block(m,0,y,1,1);block(m,43,y,1,1);}for(let x=0;x<44;x++){block(m,x,0,1,1);block(m,x,31,1,1);}
    for(const [ex,ey] of [[0,15],[0,16],[43,15],[43,16]])m.blk[gi(m,ex,ey)]=0;
    m.exits=[{x:0,y:15,to:'world',n:'동방 대륙 지도'},{x:43,y:15,to:'world',n:'동방 대륙 지도'}];}
  else if(tk==='t8'){m=mkMap(tk,46,34);m.nj='snow';m.pathMat='slab';
    road(m,0,18,46,2);road(m,22,4,2,30);road(m,2,13,20,1);road(m,24,12,20,1);road(m,2,26,42,1);
    const NH=(o)=>njHouse(m,Object.assign({im:'nj_house'},o));
    NH({x:21,r:NJ.pagoda,door:7,name:'산사 본당'});njo(m,'nj_house',NJ.torii,21,11,0,0);m.labels.push({x:22.5,y:10.3,n:'⛩ 산사 입구'});
    NH({x:2,r:NJ.hRed,door:17,act:'guild',name:'무사 의뢰소'});NH({x:7,r:NJ.shop,door:17,act:'shop',name:'산사 잡화점'});NH({x:11,r:NJ.hWood,door:17,act:'smith',name:'카타나 대장간'});
    NH({x:26,r:NJ.hBig,door:17,act:'inn',name:'온천 여관'});NH({x:31,r:NJ.hGreen,door:17,act:'relic',name:'부적 유물점'});NH({x:36,r:NJ.hRound,door:17,name:'도장'});
    // 북동 얼음집 마을
    NH({x:30,r:NJ.igloo,door:8,name:'얼음집'});road(m,31,9,1,3);NH({x:34,r:NJ.igloo2,door:10,name:'얼음집'});NH({x:38,r:NJ.igloo3,door:7,name:'얼음집'});road(m,39,8,1,4);NH({x:41,r:NJ.igloo,door:11,name:'얼음집'});
    NH({x:15,r:NJ.hRound,door:12,name:'민가'});
    // 북서 얼어붙은 호수 (얼음 구멍 낚시)
    fillG(m,3,4,10,6,2);fillG(m,4,3,7,1,2);fillG(m,2,5,1,3,2);fillG(m,13,6,1,3,2);fillG(m,5,10,6,1,2);
    m.objs.push({t:'spot',x:8,y:10,act:'fish',base:0});m.labels.push({x:9,y:11.2,n:'🎣 얼음 구멍 낚시',act:'fish'});
    // 남쪽 민가
    for(const [x,k,d] of [[3,'hTan',24],[9,'hOrange',25],[15,'hRound',24],[26,'hTan',25],[32,'hOrange',24],[38,'hRed',25]])NH({x,r:NJ[k],door:d,name:'민가'});
    for(const [x,y] of [[9,20],[18,15],[28,14],[25,21]])njo(m,'nj_house',NJ.banner,x,y,1,1);
    for(const [x,y] of [[16,22],[34,21]])njo(m,'nj_nature',NJ.cherry,x,y,3,1);
    const SI=['snowpine','snowpine','snowpine','whitetree','whitetree','snowclump','whiteclump','tSnowRound','snowrock','snowRockD','snowBall','snowBall2','rockGSm','rockG','cherry'].map(k=>({im:k==='cherry'||k[0]==='s'||k[0]==='t'||k[0]==='w'||k[0]==='r'?'nj_nature':'nj_nature',r:NJ[k],solid:!/snowBall/.test(k)}));
    plateau(m,40,27,5,3,2,'snow');plateau(m,1,28,5,2,2,'snow');
    const PI=['snowpine','whitetree','tSnowRound'].map(k=>({im:'nj_nature',r:NJ[k]}));for(const A of [[1,1,44,3],[1,29,44,4],[1,20,6,12],[39,20,6,12]])njScatter(m,PI,14,A[0]*3+A[1],A);
    njScatter(m,SI,24,11,[1,1,44,32],{spots:TOWN_NPC_SPOTS.t8});
    m.spawn={x:1,y:18};for(let y=0;y<34;y++){block(m,0,y,1,1);block(m,45,y,1,1);}for(let x=0;x<46;x++){block(m,x,0,1,1);block(m,x,33,1,1);}m.blk[gi(m,0,18)]=0;m.blk[gi(m,0,19)]=0;m.blk[gi(m,45,18)]=0;m.blk[gi(m,45,19)]=0;
    m.exits=[{x:0,y:18,to:'world',n:'동방 대륙 지도'},{x:45,y:18,to:'world',n:'동방 대륙 지도'}];}
  else{m=mkMap(tk,68,44);m.pathMat='marble';
    // 강 + 다리 (서쪽 시가지 / 동쪽 병영)
    road(m,0,18,68,2);road(m,0,27,43,1);road(m,2,35,42,1);road(m,1,12,18,1);road(m,1,7,17,1);road(m,16,8,1,4);road(m,42,3,1,15);road(m,27,25,2,19);
    riverV(m,44,7,0,44,true);bridge(m,42,18,9,'h','arch');bridge(m,42,32,9,'h','arch');road(m,51,32,1,3);road(m,40,32,3,2);road(m,40,28,1,4);
    // 황궁 언덕 (계단으로만)
    hill(m,18,2,20,9,[27],'stone');m.extras=[[32,10,'queen',-1,'idle','황후 마리엔'],[33,10,'noblewoman',-1,'idle','시녀']];fillG(m,19,13,19,5,4);fillG(m,19,20,19,5,4);
    H({x:24,w:8,h:3,door:9,roof:4,name:'황궁',big:true,spr:'mansion',path:0});
    for(const x of [20,35])prop(m,'statue',x,5);for(const x of [21,34])prop(m,'lamp',x,8);m.objs.push({t:'flowers',x:23,y:8,base:9*T-8,seed:3});m.objs.push({t:'flowers',x:32,y:8,base:9*T-8,seed:5});
    m.soldiers=[[26,13,'warrior_blue',1],[29,13,'warrior_blue',-1],[43,17,'warrior_yellow',1],[53,17,'warrior_yellow',-1],[41,28,'warrior_yellow',1]];
    // 광장
    prop(m,'fountain',27,21);prop(m,'statue',21,15);prop(m,'statue',35,15);for(const x of [20,36])prop(m,'lamp',x,22);
    stall(m,22,22,'#8a3ab8');stall(m,32,22,'#d04a3a');bench(m,23,15);bench(m,30,15);bed(m,19,24,3,1);bed(m,35,24,3,4);
    // 시가지 집들
    H({x:1,w:4,h:2,door:17,roof:0,act:'guild',name:'황성 의뢰소',sign:D.I(18,9)});H({x:6,w:4,h:1,door:17,roof:1,act:'shop',name:'귀족 상점',sign:D.I(7,3)});
    H({x:11,w:4,h:2,door:17,roof:4,act:'inn',name:'황성 여관',sign:D.I(8,10)});const sm=H({x:38,w:4,h:1,door:17,roof:2,act:'smith',name:'왕실 대장간',sign:D.I(7,13)});sm.smoke=true;prop(m,'anvil',41,17);
    for(const [x,r] of [[1,2],[6,3],[11,0]])H({x,w:4,h:1,door:11,roof:r,name:'귀족 저택'});
    for(const [x,r] of [[1,1],[6,4],[11,2]])H({x,w:4,h:1,door:6,roof:r,name:'민가'});
    H({x:38,w:4,h:1,door:6,roof:3,name:'귀족 저택'});H({x:38,w:4,h:1,door:11,roof:1,name:'귀족 저택'});
    for(const [x,r] of [[1,3],[5,0],[9,2],[13,4],[21,3],[31,0],[35,2],[39,4]])H({x,w:4,h:1,door:26,roof:r,name:'민가'});H({x:17,w:4,h:1,door:26,roof:1,act:'casino',name:'황금 주사위 도박장'});
    H({x:2,w:4,h:2,door:34,roof:0,act:'hq',name:'메인 길드 본부',sign:D.I(2,10)});H({x:8,w:4,h:1,door:34,roof:4,act:'relic',name:'유물 상점',sign:D.I(10,6)});
    H({x:14,w:4,h:2,door:34,roof:3,act:'classhall',name:'전직의 전당',sign:D.I(91,9)});for(const [x,r] of [[19,1],[30,2],[34,0]])H({x,w:4,h:1,door:34,roof:r,name:'민가'});
    // 투기장
    fillG(m,6,38,20,3,3);stoneRing(m,5,37,22,5,[15,16]);road(m,15,36,2,1);
    for(const [x,y] of [[7,39],[24,39]])prop(m,'barrel',x,y);m.objs.push({t:'statue2',x:10,y:38,base:40*T,act:'arena',name:'왕실 투기장'});block(m,10,38,2,2);m.objs.push({t:'statue2',x:20,y:38,base:40*T,act:'arena',name:'왕실 투기장'});block(m,20,38,2,2);
    m.labels.push({x:16,y:38.4,n:'왕실 투기장',act:'arena'});
    // 동쪽: 근위대 병영 + 훈련장
    H({x:52,w:4,h:2,door:17,roof:3,name:'근위대 병영'});H({x:57,w:4,h:2,door:17,roof:0,name:'근위대 병영'});H({x:62,w:4,h:1,door:17,roof:4,name:'무기고'});
    fenceBox(m,52,21,15,8,'t',59);fillG(m,53,22,13,6,3);road(m,59,20,1,1);
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)m.soldiers.push([54+c*2,23+r*2,'warrior_blue',1,true]);
    m.soldiers.push([61,25,'warrior_yellow',-1]);for(const y of [23,25,27])m.soldiers.push([62,y,'archer_blue',1,true]);for(const y of [23,25,27]){m.objs.push({t:'dummy',x:65,y,base:(y+1)*T});block(m,65,y,1,1);}
    m.labels.push({x:59,y:21.4,n:'근위대 훈련장'});
    for(const [x,r] of [[53,2],[58,0],[63,1]])H({x,w:4,h:1,door:34,roof:r,name:'민가'});road(m,51,35,16,1);road(m,51,28,1,7);
    treeBorder(m,[[0,18,1],[67,18,1],[27,43,2]]);m.spawn={x:1,y:18};m.exits=[{x:0,y:18,to:'world',n:'월드맵'},{x:67,y:18,to:'world',n:'월드맵'},{x:27,y:43,to:'world',n:'월드맵'}];}
  organicRoads(m,{t1:.7,t2:.9,t3:1.2,t4:1.4}[tk]);dress(m,{t1:.9,t2:.7,t3:.6,t4:.5}[tk]);
  m.title=t.n+' · '+t.tag;m.town=tk;return m;}
// 마을 꾸미기: 집마다 작은 마당 + 빈 풀밭에 나무 무리·덤불·바위·꽃
function dress(m,dens){let sd=m.w*131+m.h*7;const R=()=>{sd=(sd*1103515245+12345)&0x7fffffff;return sd/0x7fffffff;};
  const free=(x,y)=>x>1&&y>1&&x<m.w-2&&y<m.h-2&&m.g[gi(m,x,y)]===0&&!m.blk[gi(m,x,y)];
  const near=(x,y,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const a=x+i,b=y+j;if(a<0||b<0||a>=m.w||b>=m.h)continue;const g=m.g[gi(m,a,b)];if(g!==0||m.blk[gi(m,a,b)])return true;}return false;};
  const exitNear=(x,y)=>(m.exits||[]).some(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<4);
  // 집 옆 꽃밭·통
  for(const o of m.objs.slice()){if(o.t!=='house'||!o.spr||o.spr==='mansion')continue;const y=o.door;
    const sides=[[o.dx+2,1],[o.dx-3,-1]];const [sx]=sides[(o.dx+y)%2];
    if(free(sx,y)&&free(sx+1,y)&&!exitNear(sx,y)){if(R()<.6)bed(m,sx,y,2,o.dx);else{prop(m,R()<.5?'barrel':'sack',sx,y);}}
    const [ox]=sides[(o.dx+y+1)%2];if(free(ox,y)&&R()<.5)prop(m,R()<.5?'crate':'barrel',ox+(ox<o.dx?1:0),y);}
  // 들판 동물 (토끼·사슴) — 빈 풀밭 넓은 곳에서 돌아다님
  {m.animals=m.animals||[];const n=Math.round(3*dens);for(let k=0;k<n;k++){for(let tr=0;tr<30;tr++){const x=2+Math.floor(R()*(m.w-6)),y=2+Math.floor(R()*(m.h-6));let ok=true;for(let j=0;j<3&&ok;j++)for(let i=0;i<4;i++)if(!free(x+i,y+j)){ok=false;break;}
      if(ok){m.animals.push(animal(R()<.6?'mf_bunny':'mf_deer',{x:x-1,y:y-1,w:6,h:5}));break;}}}}
  // 낮은 주파수 잡음으로 나무 무리
  const nz=(x,y)=>{const f=(a,b)=>{const h=((a*374761393+b*668265263)^(sd&0xffff))>>>0;return ((h^(h>>>13))*1274126177>>>0)/4294967296;};
    const gx=x/5,gy=y/5,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0;const l=(a,b,t)=>a+(b-a)*t*t*(3-2*t);
    return l(l(f(x0,y0),f(x0+1,y0),fx),l(f(x0,y0+1),f(x0+1,y0+1),fx),fy);};
  for(let y=2;y<m.h-2;y++)for(let x=2;x<m.w-2;x++){if(!free(x,y)||near(x,y,1)||exitNear(x,y))continue;const v=nz(x,y),r=R();
    if(v>.56&&r<.6*dens&&!near(x,y,2)){tree(m,x,y);}
    else if(r<.035*dens&&free(x+1,y)&&!near(x+1,y,1))prop(m,R()<.6?'bush':'rock',x,y);
    else if(r<.07*dens)m.objs.push({t:'flowers',x,y,base:(y+1)*T-8,seed:x*7+y});}}

/* ----- 바닥 그리기 (한 번 그려 두고 재사용) ----- */
const PAL={grass:'#63c74d',grassD:'#55b343',dirt:'#e4a672',dirtD:'#c28569',sand:'#e4d572',water:'#32b8e8',deep:'#0099db',soil:'#9d573f',plank:'#b86f50',plankD:'#8a4f36'};

/* ----- 건물 내부 ----- */
// 가구: [그림, 잘라낼 영역, 칸 x, 칸 y, 막는 폭, 막는 높이]  (Farm RPG 실내 · Pixel Crawler 가구)
const FURN={bed:['t_int',[87,8,18,34]],bed2:['t_int',[80,52,32,24]],fire:['t_int',[115,8,26,40]],door:['t_int',[144,19,16,23]],curtain:['t_int',[16,47,48,17]],window:['t_int',[1,48,14,16]],
  rug:['t_int',[0,82,48,30]],table:['t_int',[68,120,24,23]],drawer:['t_int',[96,120,16,18]],drawer2:['t_int',[112,120,16,18]],drawer3:['t_int',[128,120,16,18]],chair:['t_int',[2,125,11,18]],chair2:['t_int',[51,125,10,18]],
  plant:['t_int',[34,0,11,16]],flower:['t_int',[4,1,8,15]],paint:['t_int',[18,1,12,15]],clock:['t_int',[1,18,13,13]],paint2:['t_int',[18,18,13,13]],
  counter:['t_furn',[0,18,48,30]],desk:['t_furn',[48,24,32,24]],display:['t_furn',[32,52,48,28]],shelf:['t_furn',[3,48,26,48]],bunk:['t_furn',[0,146,40,57]],bench:['t_furn',[83,432,58,14]],barrels:['t_furn',[720,73,48,23]],crates:['t_furn',[736,105,32,23]],cabinet:['t_furn',[80,388,64,24]],tallcab:['t_furn',[145,384,30,32]],pot:['t_furn',[769,80,14,16]]};
// 동방(닌자) 실내에서는 닌자 어드벤처 소품으로 바꿔 그림
const NJF={shelf:['nj_house',[256,304,48,32]],counter:['nj_house',[256,256,48,32]],display:['nj_house',[304,256,48,32]],plant:['nj_house',[256,208,16,16]],flower:['nj_house',[272,208,16,16]],pot:['nj_house',[288,208,16,16]],
  window:['nj_house',[352,320,16,32]],curtain:['nj_house',[384,320,16,32]],paint:['nj_house',[416,320,16,32]],paint2:['nj_house',[400,320,16,32]],clock:['nj_house',[368,320,16,32]],barrels:['nj_house',[256,224,48,16]],crates:['nj_house',[304,224,32,16]],cabinet:['nj_house',[256,304,48,32]],tallcab:['nj_house',[288,208,16,16]]};
function furn(m,k,x,y,bw,bh,o){if(m.njin&&k==='rug')return null;const F=(m.njin&&NJF[k])||FURN[k];const ob=Object.assign({t:'furn',k,x,y,base:(y+(bh||1))*T,im:F[0],r:F[1]},o||{});m.objs.push(ob);if(bw)block(m,x,y,bw,bh||1);return ob;}
const ROOM={palace:[18,12,'stone'],minecave:[18,12,'stone'],guild:[14,10,'stone'],inn:[16,11,'wood'],smith:[12,9,'stone'],shop:[12,9,'wood'],relic:[12,9,'wood'],casino:[16,11,'wood'],hq:[14,10,'stone'],classhall:[14,10,'stone'],home:[10,8,'wood']};
const OWNER={guild:['접수원','villagerwoman'],inn:['여관 주인','villagerman'],smith:['대장장이','worker'],shop:['상점 주인','villagerman'],relic:['유물 상인','noblewoman'],casino:['딜러','nobleman'],hq:['길드 마스터','oldman'],classhall:['전직 교관','oldman']};
function buildInterior(o,tk){const act=o.act||(o.name==='황궁'?'palace':'home');const R=ROOM[act]||ROOM.home;const [W,H,fl]=R;const m=mkMap('in',W,H);m.inside={o,tk};m.njin=D.TOWNS[tk]&&D.TOWNS[tk].nj;m.town=tk;m.title=(o.name||'민가')+' · 실내';m.pathMat='wood';m.floor=fl;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const wall=j<2||i===0||i===W-1||j===H-1;m.g[gi(m,i,j)]=wall?22:20;}
  const cx=W>>1;m.g[gi(m,cx,H-1)]=20;m.spawn={x:cx,y:H-2};m.exits=[{x:cx,y:H-1,to:'back',n:'밖으로'}];
  // 벽 장식
  furn(m,'window',2,0,0,2,{oy:-6});furn(m,'window',W-3,0,0,2,{oy:-6});if(W>11){furn(m,'curtain',cx-2,0,0,2,{oy:-14});}
  const own=OWNER[act];let ownPos=null;if(act==='minecave'){m.cave=true;m.objs=[];}
  if(act==='guild'||act==='hq'){furn(m,'counter',cx-1,4,3,1);ownPos=[cx,2];furn(m,'shelf',1,2,2,2);furn(m,'shelf',W-3,2,2,2);m.objs.push({t:'board',x:W-6,y:2,base:4*T,act:'guildboard',name:'의뢰 게시판'});block(m,W-6,2,2,2);
    furn(m,'bench',2,6,4,1);furn(m,'bench',W-6,6,4,1);furn(m,'plant',1,H-2,1,1);furn(m,'flower',W-2,H-2,1,1);furn(m,'clock',3,0,0,2,{oy:-4});}
  else if(act==='inn'){furn(m,'counter',1,4,3,1);ownPos=[2,3];furn(m,'barrels',4,2,3,1);furn(m,'fire',W-4,1,2,2,{oy:4});furn(m,'rug',cx-1,5,0,2);
    for(const [x,y] of [[3,6],[8,7],[12,5]]){furn(m,'table',x,y,2,1);furn(m,'chair',x-1,y,1,1);furn(m,'chair2',x+2,y,1,1);}furn(m,'plant',1,H-2,1,1);furn(m,'paint',cx,0,0,2,{oy:-2});}
  else if(act==='smith'){m.objs.push({t:'furnace',x:2,y:2,base:4*T});block(m,2,3,2,1);m.objs.push({t:'prop',k:'anvil',x:5,y:4,base:5*T});block(m,5,4,2,1);ownPos=[5,3];
    m.objs.push({t:'trough',x:W-4,y:3,base:4*T});block(m,W-4,3,2,1);furn(m,'barrels',W-4,5,3,1);furn(m,'crates',1,H-3,2,1);furn(m,'tallcab',W-3,2,0,0);}
  else if(act==='shop'||act==='relic'){furn(m,'display',cx-1,m.njin?4:3,3,1);ownPos=[cx,2];furn(m,'shelf',1,2,2,2);furn(m,'shelf',W-3,2,2,2);furn(m,'cabinet',1,H-3,4,1);furn(m,'crates',W-4,H-3,2,1);furn(m,'pot',W-2,5,1,1);furn(m,'plant',1,5,1,1);}
  else if(act==='casino'){furn(m,'rug',cx-1,5,0,2);furn(m,'counter',cx-1,4,3,1);ownPos=[cx,2];m.labels.push({x:4,y:4.6,n:'🎲 홀짝',act:'casino'},{x:W-4,y:4.6,n:'🎯 주사위 대결',act:'dice'},{x:W-2,y:H-3.6,n:'🩸 지하 투기장',act:'pit'});m.objs.push({t:'furn',k:'table',x:3,y:5,base:6*T,im:'t_int',r:FURN.table[1],act:'casino',name:'홀짝 테이블'});block(m,3,5,2,1);
    m.objs.push({t:'furn',k:'table',x:W-5,y:5,base:6*T,im:'t_int',r:FURN.table[1],act:'dice',name:'주사위 대결'});block(m,W-5,5,2,1);
    furn(m,'barrels',1,2,3,1);furn(m,'tallcab',W-3,2,0,0);furn(m,'paint2',cx-4,0,0,2,{oy:-2});furn(m,'clock',cx+3,0,0,2,{oy:-4});
    // 지하 투기장 계단
    m.objs.push({t:'stairsdown',x:W-3,y:H-3,base:(H-2)*T,act:'pit',name:'지하 투기장'});block(m,W-3,H-3,2,1);}
  else if(act==='minecave'){m.title=tk==='t6'?'불칼 화산 광산 · 흑요석 광맥':'회색바위 광산 · 바깥 광맥';m.volc=tk==='t6';
    const ores=[[2,3],[6,2],[11,3],[14,2],[3,7],[14,7],[9,6]];for(const [x,y] of ores){m.objs.push({t:'prop',k:x%2?'rock':'rock2',x,y,base:(y+2)*T,act:'ore'});block(m,x,y+1,2,1);}
    m.labels.push({x:cx,y:2.2,n:'⛏ 광맥을 눌러 캐기',act:'ore'});
    for(let y=4;y<9;y++)m.objs.push({t:'rail',x:W-2,y,base:(y+1)*T-14});m.objs.push({t:'cart',x:W-2,y:5,base:6*T});block(m,W-2,4,1,5);
    m.objs.push({t:'stairsdown',x:1,y:H-3,base:(H-2)*T,act:'deep',name:'깊은 갱도'});block(m,1,H-3,2,1);m.labels.push({x:2,y:H-3.6,n:'⬇ 깊은 갱도 (던전)',act:'deep'});
    m.extras2=[[5,4,'worker',1],[12,5,'worker',-1],[8,9,'worker',1]];}
  else if(act==='palace'){m.title='황궁 · 알현실';furn(m,'rug',cx-1,3,0,0);furn(m,'rug',cx-1,6,0,0);for(const x of [2,W-4]){m.objs.push({t:'statue2',x,y:2,base:4*T});block(m,x,2,2,2);m.objs.push({t:'banner',x:x,y:6,base:7*T});block(m,x,6,1,1);}
    furn(m,'shelf',5,2,2,2);furn(m,'shelf',W-7,2,2,2);m.extras2=[[cx,2,'queen',1],[cx-2,3,'noblewoman',1],[cx+2,3,'nobleman',-1]];m.palace=true;}
  else if(act==='classhall'){ownPos=[cx,3];m.objs.push({t:'statue2',x:2,y:2,base:4*T});block(m,2,2,2,2);m.objs.push({t:'statue2',x:W-4,y:2,base:4*T});block(m,W-4,2,2,2);furn(m,'rug',cx-1,5,0,2);furn(m,'shelf',cx-4,2,2,2);furn(m,'shelf',cx+2,2,2,2);}
  else{furn(m,'bed',1,2,2,2);furn(m,'drawer',3,2,1,1);furn(m,'fire',W-4,1,2,2,{oy:4});furn(m,'table',4,5,2,1);furn(m,'chair',3,5,1,1);furn(m,'chair2',6,5,1,1);furn(m,'rug',3,4,0,0);furn(m,'flower',W-2,H-2,1,1);furn(m,'paint',5,0,0,2,{oy:-2});}
  m.objs.forEach(ob=>{if(ob.t==='furn'&&ob.k==='rug')ob.base=0;});
  m.ownerPos=ownPos;return m;}
function enterInterior(o){const tk=MAP.town;const back=o.t==='mine'?{x:o.x+2,y:o.y+3}:{x:o.dx,y:o.dy+1};MAP=buildInterior(o,tk);MAP.back=back;paintGround(MAP);
  const sp=MAP.spawn;player.x=(sp.x+.5)*T;player.y=(sp.y+.5)*T;player.path=[];player.goal=null;player.exited=true;MAP.npcs=[];
  const act=o.act||'home';const own=OWNER[act];
  if(own&&MAP.ownerPos){const [x,y]=MAP.ownerPos;MAP.npcs.push(walker({kind:'mf',k:own[1]},x,y,{kind:'owner',act,name:own[0],still:true,face:1}));}
  // 손님·가족
  for(const [x,y,k,f] of MAP.extras2||[])MAP.npcs.push(walker({kind:'mf',k},x,y,{kind:'npc',role:'folk',mf:k,name:MAP.palace?(k==='queen'?'황후 마리엔':'귀족'):'광부',still:true,face:f,drill:!MAP.palace}));
  if(MAP.palace)for(const [x,y] of [[(MAP.w>>1)-3,8],[(MAP.w>>1)+3,8]])MAP.npcs.push(walker({kind:'tsu',k:'warrior_blue'},x,y,{kind:'npc',role:'guard',name:'황실 근위병',still:true,face:1}));
  const pool=D.TOWN_FOLK[tk]||['villagerman'];const nGuest=act==='minecave'?0:act==='home'?2:act==='inn'||act==='casino'?4:act==='guild'?3:1;
  for(let i=0;i<nGuest;i++){const [x,y]=freeTileNear(MAP.w>>1,MAP.h-4,3);const k=pick(pool);MAP.npcs.push(walker({kind:'mf',k},x,y,{kind:'npc',role:'folk',mf:k,name:act==='home'?'집주인':'손님',still:Math.random()<.5,face:Math.random()<.5?1:-1}));}
  if(act==='inn'){const ms=G.recruitList?null:null;}
  MAP.roads=[];for(let j=2;j<MAP.h-1;j++)for(let i=1;i<MAP.w-1;i++)if(!isBlocked(MAP,i,j))MAP.roads.push([i,j]);
  cam.x=player.x;cam.y=player.y;sfx('step',.3);hudRefresh();}
function leaveInterior(){const b=MAP.back,tk=MAP.inside.tk;fadeTo(()=>{enterWalk(tk,b);});}
// 다리·계단 스프라이트 (마을 추가요소 다리 팩)
function drawCrossings(m,x){const bi=IMG.t_bridges;if(!bi)return;
  for(const b of m.bridges||[]){
    if(b.style==='arch'){const X=b.a*T+8,Y=b.lane*T-8;x.drawImage(bi,480,112,16,78,X,Y,16,78);x.drawImage(bi,640,112,15,78,X+147,Y,15,78);x.drawImage(bi,498,112,139,78,X+12,Y,139,78);continue;}
    if(b.dir==='h'){const X0=b.a*T,X1=(b.b+1)*T,Y=b.lane*T-1;x.fillStyle='rgba(0,40,70,.25)';x.fillRect(X0+8,Y+34,X1-X0-16,4);
      x.drawImage(bi,272,356,16,36,X0,Y,16,36);for(let px=X0+16;px<X1-16;px+=32){const w=Math.min(32,X1-16-px);x.drawImage(bi,294,356,w,36,px,Y,w,36);}x.drawImage(bi,400,356,16,36,X1-16,Y,16,36);}
    else{const X=b.lane*T+2,Y0=b.a*T,Y1=(b.b+1)*T;x.fillStyle='rgba(0,40,70,.25)';x.fillRect(X+28,Y0+10,4,Y1-Y0-16);
      x.drawImage(bi,225,324,29,12,X,Y0,29,12);for(let py=Y0+12;py<Y1-12;py+=32){const h=Math.min(32,Y1-12-py);x.drawImage(bi,225,341,29,h,X,py,29,h);}x.drawImage(bi,225,450,29,12,X,Y1-12,29,12);}}
  for(const s of m.stairs||[]){const top=s.y*T;
    if(s.style==='stone'){const X=s.x*T+(s.w*T-43)/2;x.fillStyle='rgba(0,0,0,.22)';x.fillRect(X+2,top+30,41,5);for(let k=0;k<3;k++)x.drawImage(bi,426,3,43,13,X,top-6+k*13,43,13);}
    else{const X=s.x*T+(s.w*T-29)/2;x.fillStyle='rgba(0,0,0,.22)';x.fillRect(X+2,top+30,27,4);x.drawImage(bi,225,324,29,12,X,top-8,29,12);x.drawImage(bi,225,341,29,24,X,top+4,29,24);x.drawImage(bi,225,450,29,8,X,top+28,29,8);}}}

// ── 닌자 어드벤처 오토타일 (지형/길/물) ──
const NJG=new Set([0,1,4,2,7,8,12]);
function njAT(n,s,e,w,ne,nw,se,sw){
  if(n&&s&&e&&w){if(!se)return[5,1];if(!sw)return[6,1];if(!ne)return[5,2];if(!nw)return[6,2];return null;}
  if(s&&e&&w)return[1,0];if(n&&e&&w)return[1,2];if(n&&s&&e)return[0,1];if(n&&s&&w)return[2,1];
  if(s&&e)return[0,0];if(s&&w)return[2,0];if(n&&e)return[0,2];if(n&&w)return[2,2];
  if(n&&s)return[3,1];if(e&&w)return[1,3];if(s)return[3,0];if(n)return[3,2];if(e)return[0,3];if(w)return[2,3];return[3,3];}
// 테마: base=바닥 평면, dec=장식(바닥위), road=길 블록(inv면 길이 평면, 땅이 패치), water=물 블록
const NJTH={
  // 모래: 한 가지 밝은 모래 위에 자갈·뼈·잔가지를 드문드문 (길은 자갈이 조금 더 많은 정도)
  desert:{base:[[1,1]],road:null,water:[0,0],dec:[['nj_fdet',9,0],['nj_fdet',9,0],['nj_fdet',3,0],['nj_floor',0,4],['nj_floor',1,4],['nj_fdet',15,0],['nj_fdet',3,0]],decRate:11,roadDec:[['nj_fdet',9,0],['nj_fdet',3,0],['nj_fdet',9,0]],roadRate:5},
  rural:{base:[[0,5]],dec:[['nj_floor',1,5],['nj_floor',2,5],['nj_floor',3,5],['nj_floor',4,5]],decRate:9,road:[0,0],roadFill:[[1,1]],water:[0,0]},
  // 눈: 흰 눈밭 + 회색 테두리로 다져진 눈길, 가끔 눈풀·눈더미
  snow:{base:[[1,15]],road:null,softRoad:'rgba(120,150,190,',roadDec:[['nj_fdet',10,0]],roadRate:9,water:[13,0],dec:[['nj_fdet',0,3],['nj_fdet',1,3],['nj_fdet',2,3],['nj_fdet',3,3],['nj_fdet',10,0],['nj_fdet',4,3],['nj_fdet',6,3],['nj_fdet',10,0]],decRate:19},
  forest:{base:[[0,12]],dec:[['nj_floor',1,12],['nj_floor',2,12],['nj_floor',3,12],['nj_fdet',0,2],['nj_fdet',1,2],['nj_fdet',3,2],['nj_fdet',5,2],['nj_fdet',6,2],['nj_floor',4,12]],decRate:8,road:[0,7],roadFill:[[1,8]],water:[0,6]}};
// 고원(바위 언덕) — 닌자 Relief 시트. kind: desert|snow. 위면 w×h + 절벽면 f칸, 전부 막힘
function plateau(m,x,y,w,h,f,kind){(m.plats=m.plats||[]).push({x,y,w,h,f,kind});block(m,x,y,w,h+f);}
function paintPlats(m,x){const R=IMG.nj_relief;if(!R||!m.plats)return;for(const p of m.plats){const oy=p.kind==='snow'?0:5;
  const put=(c,r,i,j)=>x.drawImage(R,c*16,(oy+r)*16,16,16,(p.x+i)*T,(p.y+j)*T,16,16);
  for(let j=0;j<p.h+p.f;j++)for(let i=0;i<p.w;i++){const col=i===0?0:(i===p.w-1?2:1);
    if(j<p.h){const row=j===0?0:(j===p.h-1?2:1);put(1+col,row,i,j);}
    else{const row=j===p.h+p.f-1?2:1;put(4+col,row,i,j);}}}}
function paintNJ(m,x){m.waterFull=new Set();const th=NJTH[m.nj]||NJTH.rural,FL=IMG.nj_floor,WA=IMG.nj_water;
  const G=(i,j)=>(i<0||j<0||i>=m.w||j>=m.h)?-1:m.g[gi(m,i,j)];
  const isR=v=>v===1||v===4,isW=v=>v===2||v===7||v===6||v===11||v===13;
  const put=(im,bx,by,t,dx,dy)=>x.drawImage(im,(bx+t[0])*16,(by+t[1])*16,16,16,dx,dy,16,16);
  const decal=(L,rate,h,dx,dy)=>{if(!L||!rate)return;if((h>>>8)%rate)return;const d=L[(h>>>4)%L.length];const im=IMG[d[0]];if(im)x.drawImage(im,d[1]*16,d[2]*16,16,16,dx,dy,16,16);};
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=G(i,j);if(!NJG.has(g))continue;const dx=i*T,dy=j*T,h=(i*73856093^j*19349663)>>>0;
    const nb=(f,a,b)=>{const v=G(a,b);return v===-1?true:f(v);};
    const at=f=>njAT(nb(f,i,j-1),nb(f,i,j+1),nb(f,i+1,j),nb(f,i-1,j),nb(f,i+1,j-1),nb(f,i-1,j-1),nb(f,i+1,j+1),nb(f,i-1,j+1));
    const baseT=(dec)=>{const b=th.base[h%th.base.length];x.drawImage(FL,b[0]*16,b[1]*16,16,16,dx,dy,16,16);if(dec!==false)decal(th.dec,th.decRate||9,h,dx,dy);};
    if(isW(g)&&g!==6&&g!==11&&g!==13){const t=at(isW);if(!t)m.waterFull.add(i+','+j);if(!t)put(WA,th.water[0],th.water[1],[1,1],dx,dy);else{baseT(false);put(WA,th.water[0],th.water[1],t,dx,dy);}continue;}
    if(isR(g)){if(!th.road){baseT(false);if(th.softRoad){const S=(a,b)=>{const v=G(a,b);return v!==-1&&!isR(v);};x.fillStyle=th.softRoad+'.16)';x.fillRect(dx,dy,T,T);
        x.fillStyle=th.softRoad+'.10)';if(S(i,j-1))x.fillRect(dx,dy,T,2);if(S(i,j+1))x.fillRect(dx,dy+T-2,T,2);if(S(i-1,j))x.fillRect(dx,dy,2,T);if(S(i+1,j))x.fillRect(dx+T-2,dy,2,T);
        if((h>>>6)%5===0){x.fillStyle=th.softRoad+'.35)';const fx=dx+(h%9)+2,fy=dy+((h>>>3)%9)+2;x.fillRect(fx,fy,2,3);x.fillRect(fx+4,fy+2,2,3);}}
        decal(th.roadDec,th.roadRate,h,dx,dy);}
      else{const t=at(isR);if(!t){const f=th.roadFill[h%th.roadFill.length];x.drawImage(FL,f[0]*16,f[1]*16,16,16,dx,dy,16,16);}else{baseT(false);put(FL,th.road[0],th.road[1],t,dx,dy);}}continue;}
    baseT();}
  paintPlats(m,x);}
// 서방 물: 거리 기반 깊이를 부드럽게 보간 + 물결 무늬 + 물가 거품/젖은 모래
function paintWaterW(m,x){if(m.lava)return;const G=(i,j)=>(i<0||j<0||i>=m.w||j>=m.h)?2:m.g[gi(m,i,j)];const isW=v=>v===2||v===7||v===6||v===11||v===13;
  const D=new Float32Array(m.w*m.h).fill(9);const q=[];for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){if(!isW(G(i,j))){D[j*m.w+i]=0;q.push(i,j);}}
  for(let k=0;k<q.length;k+=2){const i=q[k],j=q[k+1],d=D[j*m.w+i];if(d>=6)continue;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=i+a,v=j+b;if(u<0||v<0||u>=m.w||v>=m.h)continue;if(D[v*m.w+u]>d+1){D[v*m.w+u]=d+1;q.push(u,v);}}}
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++)if(G(i,j)===7)D[j*m.w+i]=Math.max(D[j*m.w+i],5);
  const Dc=(i,j)=>{i=Math.max(0,Math.min(m.w-1,i));j=Math.max(0,Math.min(m.h-1,j));return Math.min(5,D[j*m.w+i]);};
  const C=['#9be6f2','#6fd2ec','#4dbde3','#3aa6d8','#2e90ca','#2a7fbb'];
  const BY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=G(i,j);if(g!==2&&g!==7&&g!==11&&g!==13)continue;const dx=i*T,dy=j*T,h=(i*73856093^j*19349663)>>>0;
    for(let py=0;py<8;py++)for(let px=0;px<8;px++){const fx=(px+.5)/8-.5,fy=(py+.5)/8-.5;const ix=fx<0?-1:1,iy=fy<0?-1:1,ax=Math.abs(fx),ay=Math.abs(fy);
      const v=Dc(i,j)*(1-ax)*(1-ay)+Dc(i+ix,j)*ax*(1-ay)+Dc(i,j+iy)*(1-ax)*ay+Dc(i+ix,j+iy)*ax*ay;
      const wx=dx+px*2,wy=dy+py*2;const n=Math.sin(wx*.11+wy*.07)*.25+Math.sin(wx*.031-wy*.05)*.3;
      const t=v+.25+n+(BY[(py&3)*4+(px&3)]/16-.5)*.35;const ci=Math.max(2,Math.min(5,Math.round(t)));x.fillStyle=C[ci];x.fillRect(wx,wy,2,2);}
    // 물결 무늬 (잔잔한 호 모양)
    if(h%4===0){const rx=dx+(h%7)+2,ry=dy+((h>>4)%9)+3;x.fillStyle='rgba(255,255,255,.30)';x.fillRect(rx+1,ry,4,1);x.fillRect(rx,ry+1,1,1);x.fillRect(rx+5,ry+1,1,1);}
    if(h%6===3){x.fillStyle='rgba(20,70,130,.16)';const rx=dx+((h>>3)%8)+2,ry=dy+((h>>6)%10)+3;x.fillRect(rx,ry,5,1);x.fillRect(rx+1,ry+1,3,1);}
    // 물가 거품 (불규칙한 흰 띠 + 옅은 안쪽 띠)
    const L=(a,b)=>!isW(G(a,b));
    const foam=(side)=>{for(let k=0;k<T;k++){const w=1+(((h>>>(k%11))+k*3)%4===0?1:0);x.fillStyle='rgba(255,255,255,.9)';
        if(side==='n')x.fillRect(dx+k,dy,1,w);else if(side==='s')x.fillRect(dx+k,dy+T-w,1,w);else if(side==='w')x.fillRect(dx,dy+k,w,1);else x.fillRect(dx+T-w,dy+k,w,1);
        x.fillStyle='rgba(255,255,255,.28)';if(k%3!==1)continue;if(side==='n')x.fillRect(dx+k,dy+w+1,2,1);else if(side==='s')x.fillRect(dx+k,dy+T-w-2,2,1);else if(side==='w')x.fillRect(dx+w+1,dy+k,1,2);else x.fillRect(dx+T-w-2,dy+k,1,2);}};
    if(L(i,j-1))foam('n');if(L(i,j+1))foam('s');if(L(i-1,j))foam('w');if(L(i+1,j))foam('e');}
  // 물가 쪽 젖은 땅 그림자
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=G(i,j);if(isW(g))continue;const dx=i*T,dy=j*T;const W2=v=>v===2||v===7;
    x.fillStyle='rgba(40,50,30,.20)';if(W2(G(i,j+1)))x.fillRect(dx,dy+T-2,T,2);if(W2(G(i+1,j)))x.fillRect(dx+T-2,dy,2,T);if(W2(G(i-1,j)))x.fillRect(dx,dy,2,T);if(W2(G(i,j-1)))x.fillRect(dx,dy,T,1);}}
function paintGround(m){const c=document.createElement('canvas');c.width=m.w*T;c.height=m.h*T;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const ts=IMG.t_ss16;
  const tile=(tx,ty,dx,dy)=>x.drawImage(ts,tx*16,ty*16,16,16,dx,dy,16,16);
  const GR=[[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,1],[2,2],[3,2],[5,2],[3,3]];
  const mat=m.pathMat;
  const pathCol={dirt:[PAL.dirt,PAL.dirtD],gravel:['#c9a785','#9a7a62'],slab:['#b8b4ac','#8a867e'],marble:['#ece8de','#b8b2a2']}[mat];
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)],dx=i*T,dy=j*T;const h=(i*73856093^j*19349663)>>>0;
    if(m.nj&&NJG.has(g))continue;
    if(g===0){const p=GR[h%GR.length];tile(p[0],p[1],dx,dy);const hh=h>>>7;
      if(hh%19===0){const cl=['#ff6a8a','#ffd84a','#ffffff','#b07aff'][hh%4];x.fillStyle='#3a8a3a';x.fillRect(dx+6,dy+8,1,3);x.fillStyle=cl;x.fillRect(dx+5,dy+6,3,2);x.fillRect(dx+6,dy+5,1,4);}
      else if(hh%23===0){x.fillStyle='#4a9a3a';x.fillRect(dx+4,dy+9,1,3);x.fillRect(dx+6,dy+8,1,4);x.fillRect(dx+8,dy+9,1,3);}
      else if(hh%37===0){x.fillStyle='#a8a69e';x.fillRect(dx+9,dy+10,3,2);x.fillStyle='#d8d6ce';x.fillRect(dx+9,dy+10,2,1);}}
    else if(g===1||g===4){x.fillStyle=g===4&&mat==='dirt'?'#d89c68':pathCol[0];x.fillRect(dx,dy,T,T);
      if(mat==='dirt'){if(h%3===0){x.fillStyle=pathCol[1];x.fillRect(dx+(h%11),dy+(h%7)+3,2,1);x.fillRect(dx+(h%5)+6,dy+(h%13),1,1);}}
      else if(mat==='gravel'){x.fillStyle='#8f8a84';for(let k=0;k<5;k++){x.fillRect(dx+((h>>k*3)%14)+1,dy+((h>>(k*3+2))%14)+1,2,1);}}
      else{x.fillStyle=pathCol[1];x.fillRect(dx,dy+T-1,T,1);x.fillRect(dx+((j%2)?T/2:0)-0,dy,1,T);if(mat==='marble'){x.fillStyle='rgba(255,255,255,.4)';x.fillRect(dx+2,dy+2,4,1);}}}
    else if(g===2||g===7){x.fillStyle=g===7?'#2a8fd0':'#3fbbe6';x.fillRect(dx,dy,T,T);x.fillStyle=g===7?'#2582c0':'#36aedb';if((i+j)%2===0)x.fillRect(dx,dy+8,T,8);
      if(h%3===0){x.fillStyle='rgba(255,255,255,.35)';x.fillRect(dx+(h%9)+2,dy+(h%7)+4,4,1);}}
    else if(g===3){tile(...[[5,1],[7,1],[8,1],[9,1]][h%4],dx,dy);}
    else if(g===5){x.fillStyle=PAL.soil;x.fillRect(dx,dy,T,T);x.fillStyle='#7a4230';for(let r=2;r<T;r+=5)x.fillRect(dx,dy+r,T,1);}
    else if(g===8||g===12){const p=GR[h%GR.length];tile(p[0],p[1],dx,dy);}
    else if(g===9||g===10){const up=m.g[gi(m,i,j-1)];const top=up===8||up===12||(up===10&&g===9);x.drawImage(ts,176+((i%2)*0),64+((j%2)*16),16,16,dx,dy,16,16);
      x.fillStyle='rgba(60,30,20,.25)';x.fillRect(dx,dy+T-2,T,2);
      if(top){x.fillStyle='#3e8a3a';x.fillRect(dx,dy,T,3);x.fillStyle='#8a3a28';x.fillRect(dx,dy+3,T,1);for(let k=0;k<4;k++){x.fillStyle='#3e8a3a';x.fillRect(dx+((h>>k)%14),dy+3,2,2);}}
      }
    else if(g===11||g===13){x.fillStyle='#3fbbe6';x.fillRect(dx,dy,T,T);x.fillStyle='#36aedb';if((i+j)%2===0)x.fillRect(dx,dy+8,T,8);}
    else if(g===20&&m.njin){x.drawImage(IMG.nj_ifloor,m.njin==='snow'?16:208,m.njin==='snow'?208:16,16,16,dx,dy,16,16);}
    else if(g===22&&m.njin&&j<2&&i>0&&i<m.w-1){x.drawImage(IMG.nj_ifloor,m.njin==='snow'?16:208,m.njin==='snow'?208:16,16,16,dx,dy,16,16);x.fillStyle=j===0?'rgba(70,35,20,.6)':'rgba(70,35,20,.42)';x.fillRect(dx,dy,T,T);if(j===1){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(dx,dy+T-3,T,3);}}
    else if(g===20){const st=m.floor==='stone';tile(1,st?15:9,dx,dy);if(!st&&(j%2)){x.fillStyle='rgba(0,0,0,.04)';x.fillRect(dx,dy,T,T);}}
    else if(g===22&&m.cave){x.drawImage(ts,176,64+((j%2)*16),16,16,dx,dy,16,16);if(j===1&&i>0&&i<m.w-1){x.fillStyle='rgba(0,0,0,.3)';x.fillRect(dx,dy+T-3,T,3);}else if(j>=2){x.fillStyle='rgba(20,10,5,.45)';x.fillRect(dx,dy,T,T);}}
    else if(g===22){if(j<2&&i>0&&i<m.w-1){x.drawImage(ts,16,144,16,16,dx,dy,16,16);x.fillStyle=j===0?'rgba(70,35,20,.55)':'rgba(70,35,20,.38)';x.fillRect(dx,dy,T,T);if(j===1){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(dx,dy+T-3,T,3);}}
      else{x.fillStyle='#3a2416';x.fillRect(dx,dy,T,T);x.fillStyle='#7a4a2a';if(i===0)x.fillRect(dx+T-4,dy,4,T);else if(i===m.w-1)x.fillRect(dx,dy,4,T);else x.fillRect(dx,dy,T,4);}}
    else if(g===6){const bi=IMG.t_bridges;if(bi){x.drawImage(bi,230,350+(j%5)*16,16,16,dx,dy,16,16);}else{x.fillStyle=PAL.plank;x.fillRect(dx,dy,T,T);}}}
  // 가장자리 (길·물 테두리)
  for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)],dx=i*T,dy=j*T;const nb=(a,b)=>(a<0||b<0||a>=m.w||b>=m.h)?g:m.g[gi(m,a,b)];if(m.nj&&NJG.has(g))continue;
    const isP=v=>v===1||v===4;
    if(isP(g)){x.fillStyle=pathCol[1];if(!isP(nb(i,j-1))&&nb(i,j-1)===0)x.fillRect(dx,dy,T,1);if(!isP(nb(i,j+1))&&nb(i,j+1)===0)x.fillRect(dx,dy+T-1,T,1);
      if(!isP(nb(i-1,j))&&nb(i-1,j)===0)x.fillRect(dx,dy,1,T);if(!isP(nb(i+1,j))&&nb(i+1,j)===0)x.fillRect(dx+T-1,dy,1,T);
      // 둥근 모서리
      if(mat==='dirt'){const hh=(i*2654435761^j*40503)>>>0;x.fillStyle='#4f9a3a';
        if(nb(i,j-1)===0)for(let k=0;k<3;k++){const px=dx+((hh>>(k*4))%14)+1;x.fillRect(px,dy,1,2+((hh>>k)%2));x.fillRect(px+1,dy,1,1);}
        if(nb(i,j+1)===0)for(let k=0;k<3;k++){const px=dx+((hh>>(k*4+2))%14)+1;x.fillRect(px,dy+T-2-((hh>>k)%2),1,2+((hh>>k)%2));}
        if(nb(i-1,j)===0){x.fillRect(dx,dy+(hh%12)+2,2,1);x.fillRect(dx,dy+((hh>>5)%12)+2,1,1);}
        if(nb(i+1,j)===0){x.fillRect(dx+T-2,dy+((hh>>3)%12)+2,2,1);}
        if(hh%5===0){x.fillStyle='#b58a66';x.fillRect(dx+(hh%10)+3,dy+((hh>>4)%9)+4,3,2);x.fillStyle='#e8c8a0';x.fillRect(dx+(hh%10)+3,dy+((hh>>4)%9)+4,2,1);}}
      x.fillStyle=PAL.grass;const n=nb(i,j-1)===0,s=nb(i,j+1)===0,w=nb(i-1,j)===0,e=nb(i+1,j)===0;
      if(n&&w)x.fillRect(dx,dy,2,2);if(n&&e)x.fillRect(dx+T-2,dy,2,2);if(s&&w)x.fillRect(dx,dy+T-2,2,2);if(s&&e)x.fillRect(dx+T-2,dy+T-2,2,2);}
    if(g===12||g===8){const out=v=>!(v===8||v===12||v===10);x.fillStyle='#2f6e34';if(out(nb(i-1,j)))x.fillRect(dx,dy,2,T);if(out(nb(i+1,j)))x.fillRect(dx+T-2,dy,2,T);if(out(nb(i,j-1)))x.fillRect(dx,dy,T,2);
      x.fillStyle='rgba(255,255,255,.08)';x.fillRect(dx,dy,T,T);}
    if(g===0&&(nb(i,j-1)===9||nb(i,j-1)===10)){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(dx,dy,T,4);}
    if(g===6){const bi=IMG.t_bridges;if(bi){if(nb(i-1,j)!==6)x.drawImage(bi,226,342,6,16,dx-2,dy,6,16);if(nb(i+1,j)!==6)x.drawImage(bi,247,342,6,16,dx+T-4,dy,6,16);}}
    if(g===2||g===7){const wt=v=>v===2||v===7||v===6||v===11||v===13;
      if(!wt(nb(i,j-1))){x.fillStyle='#8a6a48';x.fillRect(dx,dy,T,3);x.fillStyle='#24849f';x.fillRect(dx,dy+3,T,3);x.fillStyle='rgba(255,255,255,.75)';x.fillRect(dx,dy+6,T,1);}
      if(!wt(nb(i-1,j))){x.fillStyle='#b8e8f8';x.fillRect(dx,dy,1,T);x.fillStyle='rgba(30,110,150,.5)';x.fillRect(dx+1,dy,2,T);}
      if(!wt(nb(i+1,j))){x.fillStyle='#b8e8f8';x.fillRect(dx+T-1,dy,1,T);}
      if(!wt(nb(i,j+1))&&j<m.h-1){x.fillStyle='#e8f8ff';x.fillRect(dx,dy+T-2,T,2);}}
    if(g===0&&(nb(i,j-1)===2||nb(i,j-1)===7)){x.fillStyle='#4aa83a';x.fillRect(dx,dy,T,2);}}
  if(m.nj)paintNJ(m,x);else paintWaterW(m,x);
  if(m.volc){x.fillStyle='rgba(255,70,20,.16)';x.fillRect(0,0,c.width,c.height);for(let k=0;k<26;k++){const ex=(k*97)%c.width,ey=(k*61)%c.height;x.fillStyle='rgba(255,140,40,.55)';x.fillRect(ex,ey,2,2);}}
  if(false)for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)];if(g===2||g===7){const dx=i*T,dy=j*T;x.fillStyle=(i+j)%2?'#bfe6f2':'#cdeef8';x.fillRect(dx,dy,T,T);x.fillStyle='rgba(255,255,255,.7)';if((i*7+j*3)%5===0)x.fillRect(dx+3,dy+5,7,1);x.fillStyle='#8cc8dc';if((i*3+j*5)%7===0)x.fillRect(dx+8,dy+10,4,1);}}
  if(m.ash||m.lava)for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)],dx=i*T,dy=j*T,h=(i*73856093^j*19349663)>>>0;
    if(m.ash&&(g===0||g===8||g===12)){x.fillStyle='rgba(72,38,28,.52)';x.fillRect(dx,dy,T,T);if(h%29===0){x.fillStyle='#ff7a2a';x.fillRect(dx+(h%12)+2,dy+(h%9)+3,2,1);}}
    if(m.lava&&(g===2||g===7||g===11)){x.fillStyle=(i+j)%2?'#e8541c':'#f06a22';x.fillRect(dx,dy,T,T);x.fillStyle='#ffb03a';x.fillRect(dx+(h%10),dy+(h%13),5,2);x.fillStyle='#b8320e';x.fillRect(dx+(h%7)+5,dy+((h>>4)%12)+2,4,1);}}
  drawCrossings(m,x);
  m.waterT=[];for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)];if((g===2||g===7)&&((i*7+j*13)%(m.nj?5:4)===0))m.waterT.push([i,j,(i*31+j*17)%10]);}if(m.lava)m.waterT=[];
  // 지붕 없는 그림자 (건물 아래)
  for(const o of m.objs)if(o.t==='house'){x.fillStyle='rgba(0,0,0,.16)';x.fillRect(o.bx+3,o.base-3,o.bw-2,5);}
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
function enterWalk(loc,spawnAt){if(ED&&loc!=='camp'){ED=null;$('edBar').classList.add('hidden');document.body.classList.remove('editing');}const s=S();s.loc=loc;MAP=loc==='camp'?buildCamp():buildTown(loc);paintGround(MAP);
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
const TOWN_NPC_SPOTS={t9:[[6,17],[16,17],[28,17],[38,17]],t7:[[6,18],[19,18],[28,18],[38,18]],t8:[[5,20],[15,20],[29,20],[38,20]],t5:[[25,19],[8,19],[33,21],[17,15]],t6:[[8,18],[20,18],[26,19],[41,17]],t1:[[24,13],[10,13],[14,18],[6,13],[20,18]],t2:[[30,15],[10,15],[8,27],[42,13],[22,27]],t3:[[16,20],[30,12],[24,16],[11,8],[40,19]],t4:[[10,19],[24,16],[34,27],[30,16],[20,27]]};
const TOWN_GLORY={t9:{flags:[[2,13],[41,13]],statue:[18,19]},t7:{flags:[[2,14],[43,14]],statue:[20,22]},t8:{flags:[[2,16],[43,16]],statue:[31,21]},t5:{flags:[[2,15],[42,15]],statue:[18,21]},t6:{flags:[[2,14],[44,14]],statue:[34,20]},t1:{flags:[[2,11],[31,11]],statue:[16,15]},t2:{flags:[[2,14],[45,14]],statue:[12,11]},t3:{flags:[[2,10],[44,10]],statue:[25,15]},t4:{flags:[[2,17],[65,17]],statue:[24,20]}};
function populateTown(tk){const m=MAP,t=D.TOWNS[tk];const n=[0,6,10,15,22][t.tier];
  const roads=[];for(let j=0;j<m.h;j++)for(let i=0;i<m.w;i++){const g=m.g[gi(m,i,j)];if((g===1||g===4||g===6||g===11||g===13)&&!m.blk[gi(m,i,j)])roads.push([i,j]);}
  m.roads=roads;
  const MFN={oldman:'노인',oldwoman:'할머니',villagerman:'주민',villagerwoman:'주민',peasant:'농부',worker:'광부',nobleman:'귀족',noblewoman:'귀부인',princess:'아가씨',queen:'귀부인'};
  for(let i=0;i<n;i++){const role=i<Math.max(2,n*.2)?'guard':i<n*.35?'merchant':'folk';
    const look={o:role==='guard'?4:role==='merchant'?pick([7,8]):pick([0,1,2,3,6,7,9]),hair:pick(D.HAIRS),hc:ri(0,6)};const [x,y]=pick(roads);
    let desc=role==='guard'&&tk==='t4'?{kind:'tsu',k:pick(['warrior_blue','warrior_yellow'])}:{kind:'human',look,tool:role==='guard'};let nm=role==='guard'?(tk==='t4'?'황실 근위병':'경비병'):role==='merchant'?'상인':'주민',mf=null;
    if(role==='folk'&&Math.random()<.7){mf=pick(D.TOWN_FOLK[tk]);desc={kind:'mf',k:mf};nm=(tk==='t2'&&mf==='worker')?'광부':MFN[mf];}
    if(D.TOWNS[tk]&&D.TOWNS[tk].nj){mf=null;const nj=D.TOWNS[tk].nj;if(role==='guard')desc={kind:'nj',k:nj==='snow'?pick(['samurai','samuraiblue','ninjaeskimo']):pick(['knight','ninjagray','hunter'])};else if(role==='merchant')desc={kind:'nj',k:nj==='snow'?pick(['eskimo','master']):pick(['noble','inspector'])};else desc={kind:'nj',k:pick(D.TOWN_FOLK[tk])};nm=role==='guard'?(nj==='snow'?'산사 무사':'사막 경비병'):role==='merchant'?'상인':'주민';}
    m.npcs.push(walker(desc,x,y,{kind:'npc',role,mf,name:nm,speed:role==='guard'?28:rnd(30,44)}));}
  for(const [x,y,k,face,anim,nm] of m.extras||[])m.npcs.push(walker({kind:'mf',k},x,y,{kind:'npc',role:'folk',mf:k,name:nm,still:true,face,drill:anim==='attack'}));
  // 성장 표시: 평판이 오르면 용병단 깃발, 전설이 되면 단장 동상
  const att=G.attitude?G.attitude(tk):0;const GS=TOWN_GLORY[tk];
  if(GS&&att>=2){for(const [x,y] of GS.flags){m.objs.push({t:'banner',x,y,base:(y+1)*T});block(m,x,y,1,1);}}
  if(GS&&(att>=3||Object.keys(D.SUBS).filter(k=>D.SUBS[k].town===tk).every(k=>S().subs[k]&&S().subs[k].state==='claimed'))){const [x,y]=GS.statue;m.objs.push({t:'statue2',x,y,base:(y+2)*T,name:S().leader.name+' 단장 동상'});block(m,x,y,2,2);m.labels.push({x:x+1,y:y-.6,n:'🏆 '+S().leader.name+' 단장 동상'});m.glory=true;}
  for(const [x,y,k,face,drill] of m.soldiers||[])m.npcs.push(walker({kind:'tsu',k},x,y,{kind:'npc',role:'guard',name:'황실 근위병',still:true,face,drill:!!drill}));
  // 비밀 경매장 중개인 (히든: 매달 20~22일, C등급 이상)
  if(G.auctionOpen()&&G.auctionTown()===tk){const AP={t3:[39,21],t4:[43,41]}[tk];const [x,y]=freeTileNear(AP[0],AP[1],2);m.npcs.push(walker({kind:'human',look:{o:5,hair:'longhair',hc:6},tool:false},x,y,{kind:'owner',act:'auction',name:'🕯 두건 쓴 중개인',still:true,face:-1}));}
  // 승급 축하: 주민들이 모여 환호
  if(S().flags.celebrate){const rk=S().flags.celebrate;S().flags.celebrate=null;const px=m.spawn.x,py=m.spawn.y;m.confetti=[];
    for(let i=0;i<8;i++){const [x,y]=freeTileNear(px+2,py,3);const k=pick(D.TOWN_FOLK[tk]);const w=walker({kind:'mf',k},x,y,{kind:'npc',role:'folk',mf:k,name:'주민',still:true,face:x>px?-1:1});w.delayB={text:pick([`${rk}등급 축하해요!`,'맹약단 만세!','단장님 최고!','축하합니다!!','우와아아!']),at:walkT+.4+i*.7};m.npcs.push(w);}
    for(let i=0;i<120;i++)m.confetti.push({x:(px+rnd(-8,10))*T,y:(py-6-Math.random()*8)*T,vy:rnd(40,90),r:Math.random()*6,ph:Math.random()*6,c:pick(['#ff5a6a','#ffd84a','#5ad0ff','#8aff6a','#ffffff']),end:(py+6)*T});
    setTimeout(()=>{sfx('levelup',.5);toast(`🎉 ${D.TOWNS[tk].n} 사람들이 ${rk}등급 승급을 축하합니다!`);const nt=Object.keys(D.TOWNS).filter(k=>D.TOWNS[k].req===rk&&!['t1','t2','t3','t4'].includes(k));if(nt.length)setTimeout(()=>toast('🗺 새 지역이 열렸다: '+nt.map(k=>D.TOWNS[k].n).join(', ')),2500);},600);}
  // 서브 퀘스트 의뢰인 (제자리)
  const spots=TOWN_NPC_SPOTS[tk];let k=0;
  for(const id in D.SUBS){const q=D.SUBS[id];if(q.town!==tk)continue;const sp=spots[k++];if(!sp)break;
    const look={o:pick([0,1,2,3,6,7,8,9]),hair:pick(D.HAIRS),hc:(k*3)%7};const w=walker(q.spr&&q.spr.startsWith('nj:')?{kind:'nj',k:q.spr.slice(3)}:q.spr?{kind:'mf',k:q.spr}:{kind:'human',look,tool:false},sp[0],sp[1],{kind:'quest',sub:id,name:q.npc,still:true,face:-1});m.npcs.push(w);}
  // 대륙 의뢰 인물 (의뢰인 / 전달 받는 사람) — 마을 입구 근처
  const sprK=sp=>sp&&sp.startsWith('nj:')?{kind:'nj',k:sp.slice(3)}:{kind:'mf',k:sp||'villagerman'};
  const cqSpot=()=>{const bx=m.spawn.x+3,by=m.spawn.y;for(let r=0;r<7;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=bx+dx,y=by-2+dy;if(x<1||y<1||x>=m.w-1||y>=m.h-1)continue;if(m.blk[gi(m,x,y)]||[2,7,9,12].includes(m.g[gi(m,x,y)]))continue;if(m.npcs.some(n=>Math.abs(n.x-(x+.5)*T)<20&&Math.abs(n.y-(y+.5)*T)<20))continue;return [x,y];}return [m.spawn.x+2,m.spawn.y];};
  for(const c in D.CQ){const x=G.cqCur(c);if(!x)continue;const {q,st}=x;
    if(q.type==='deliver'&&st.state==='active'&&q.to===tk){const [px,py]=cqSpot();m.npcs.push(walker(sprK(q.toSpr),px,py,{kind:'cq',cq:c,recv:true,name:q.toNpc,still:true,face:-1}));}
    else if(q.town===tk&&!(q.type==='deliver'&&st.state==='active')){const [px,py]=cqSpot();m.npcs.push(walker(sprK(q.spr),px,py,{kind:'cq',cq:c,name:q.npc,still:true,face:-1}));}}}

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
  for(const ex of m.exits||[])if(ptx===ex.x&&pty===ex.y&&!uiBusy()&&!player.exited){player.exited=true;player.path=[];if(ex.to==='back')leaveInterior();else openPanel('world');}
  if(!(m.exits||[]).some(ex=>ptx===ex.x&&pty===ex.y))player.exited=false;
  // 주민
  const glad=m.town&&G.attitude(m.town)>=2;
  for(const e of m.npcs){e.t+=dt;if(e.bubble){e.bubble.t-=dt;if(e.bubble.t<=0)e.bubble=null;}if(e.delayB&&walkT>=e.delayB.at&&!e.bubble){e.bubble={text:e.delayB.text,t:2.2};e.delayB=null;}
    if(glad&&e.kind==='npc'&&!e.greeted&&!e.bubble&&Math.abs(e.x-player.x)<34&&Math.abs(e.y-player.y)<26&&!m.npcs.some(o=>o!==e&&o.bubble&&Math.hypot(o.x-e.x,o.y-e.y)<90)){e.greeted=true;const nm=S().leader.name;
      e.bubble={text:pick(e.role==='guard'?[`${nm} 단장님, 충성!`,'맹약단 단장님이시다!','단장님, 오늘도 무사하시길!']:[`${nm} 단장님이다!`,'어머, 맹약단 단장님!','단장님! 안녕하세요!','우와, 진짜 단장님이야!',`${nm} 단장님, 고마워요!`]),t:3};e.face=player.x<e.x?-1:1;}
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
      else if(e.kind==='visitor'){tgt=pick([[3,13],[8,13],[28,13],[32,13],[18,20],[18,24],[6,21],[12,21],[24,21],[30,21],[26,10],[10,10]]);if(Math.random()<.2&&!m.npcs.some(o=>o!==e&&o.bubble&&Math.hypot(o.x-e.x,o.y-e.y)<120))e.bubble={text:freshLine(MAP,D.CAMP_VISITOR),t:4};}
      else{tgt=pick(m.roads||[[e.x/T|0,e.y/T|0]]);if(e.role==='guard'&&Math.random()<.6){e.wait=rnd(4,9);continue;}}
      const p=findPath(m,Math.floor(e.x/T),Math.floor(e.y/T),tgt[0],tgt[1]);if(p){p.shift();e.path=p.slice(0,40);}}}
  // 동물
  for(const a of m.animals||[]){a.t+=dt;if(!a.tx||Math.hypot(a.tx-a.x,a.ty-a.y)<2){if(Math.random()<dt*.5){a.tx=(a.pen.x+.8+Math.random()*(a.pen.w-1.6))*T;a.ty=(a.pen.y+.6+Math.random()*(a.pen.h-1.2))*T;}}
    else{const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);a.x+=dx/d*12*dt;a.y+=dy/d*12*dt;a.dir=dx>0?1:-1;}}
  // 카메라
  const base=clamp(Math.min(W/(27*T),H/(16*T)),1.8,3.4);cam.tz=base*userZoom;cam.z+=(cam.tz-cam.z)*Math.min(1,dt*8);
  if(edOn()){ED.cx=ED.cx??player.x;ED.cy=ED.cy??player.y;cam.x+=(ED.cx-cam.x)*Math.min(1,dt*10);cam.y+=(ED.cy-cam.y)*Math.min(1,dt*10);}else{cam.x+=(player.x-cam.x)*Math.min(1,dt*6);cam.y+=(player.y-cam.y)*Math.min(1,dt*6);}
  const hw=W/2/cam.z,hh=H/2/cam.z;cam.x=m.w*T<hw*2?m.w*T/2:clamp(cam.x,hw,m.w*T-hw);cam.y=m.h*T<hh*2?m.h*T/2:clamp(cam.y,hh,m.h*T-hh);}

/* ----- 걷는 장면: 그리기 ----- */
const houseCache={};
function cottageInto(x,ox,oy,w,h,roof){const ts=IMG.t_ss16;const base=ROOFB[roof];const cols=[15];for(let i=0;i<w-2;i++)cols.push(16);cols.push(17);const rows=[base];for(let i=0;i<h;i++)rows.push(base+3);rows.push(base+4,base+5);
  rows.forEach((r,j)=>cols.forEach((cc,i)=>x.drawImage(ts,cc*16,r*16,16,16,ox+i*T,oy+j*T,16,16)));}
function flowerBoxes(x,ox,oy,w,skip,seed){const cols=['#ff6a8a','#ffd84a','#ffffff','#b07aff','#ff9a3a'];for(let i=1;i<w-1;i++){if(i===skip)continue;const bx=ox+i*T+3,by=oy+12;
  x.fillStyle='#3a2416';x.fillRect(bx-1,by-1,12,5);x.fillStyle='#8a5a32';x.fillRect(bx,by,10,3);x.fillStyle='#3a8a3a';x.fillRect(bx+1,by-2,8,2);
  for(let k=0;k<4;k++){x.fillStyle=cols[(seed+i+k)%5];x.fillRect(bx+1+k*2+(k%2),by-3-(k%2),2,2);}}}
function houseImg(o){if(o.spr)return IMG['bld_'+o.spr+'_'+o.roof];const key=JSON.stringify([o.w,o.h,o.roof,o.parts.map(p=>[p.k,p.x,p.y,p.w,p.h,p.roof]),o.chimney,o.boxes,o.awning,o.dx-o.x]);if(houseCache[key])return houseCache[key];
  const c=document.createElement('canvas');c.width=o.bw;c.height=o.bh;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const ts=IMG.t_ss16;
  for(const p of o.parts){if(p.k==='spire'){const dy=p.roof*128;x.drawImage(ts,520,160+dy,52,66,p.x,p.y,52,66);}
    else if(p.k==='wing'){cottageInto(x,p.x,p.y,p.ww,p.wh,p.roof);if(o.boxes)flowerBoxes(x,p.x,p.y+(p.wh+2)*T,p.ww,-1,3);}
    else{cottageInto(x,p.x,p.y,o.w,o.h,o.roof);const winY=p.y+(o.h+2)*T;
      if(o.awning){const ay=winY-T+4;const aw=(o.w-2)*T;for(let i=0;i<aw;i+=4){x.fillStyle=(i/4)%2?'#fff4e0':o.awning;x.fillRect(p.x+T+i,ay,4,8);}x.fillStyle='#2a1a10';x.fillRect(p.x+T,ay-1,aw,1);
        for(let i=0;i<aw;i+=8){x.fillStyle=o.awning;x.beginPath();x.arc(p.x+T+i+4,ay+8,4,0,Math.PI);x.fill();}}
      if(o.boxes)flowerBoxes(x,p.x,winY,o.w,o.dx-o.x,o.w);
      if(o.chimney){const cx=p.x+(o.w-2)*T+2,cy=p.y+2;x.fillStyle='#2a1a10';x.fillRect(cx-1,cy-1,9,14);x.fillStyle='#8f8a84';x.fillRect(cx,cy,7,12);x.fillStyle='#6d6b66';for(let k=0;k<12;k+=3)x.fillRect(cx+(k%2?0:3),cy+k,3,1);x.fillStyle='#b8b4ac';x.fillRect(cx-1,cy-2,9,2);}}}
  houseCache[key]=c;return c;}
function drawDoor(c,o){const dx=o.dx*T,dy=o.dy*T;c.fillStyle='#3a2416';c.fillRect(dx+3,dy+3,10,13);c.fillStyle='#7a4a2a';c.fillRect(dx+4,dy+4,8,12);c.fillStyle='#5a3420';c.fillRect(dx+7,dy+4,1,12);c.fillStyle='#e8c060';c.fillRect(dx+9,dy+10,1,1);c.fillRect(dx+6,dy+10,1,1);}
function drawSign(c,o){if(o.sign==null)return;const sx=o.dx*T+8,sy=o.dy*T-5;c.fillStyle='#5a3420';c.fillRect(sx-8,sy-8,16,13);c.fillStyle='#c8955a';c.fillRect(sx-7,sy-7,14,11);
  const r=Math.floor(o.sign/16),cl=o.sign%16;c.drawImage(IMG.raven,cl*32,r*32,32,32,sx-6,sy-7,12,12);}
function drawObj(c,o){const t=walkT;
  switch(o.t){
  case 'house':{if(o.nj){const im=IMG[o.im];if(im){const r=o.r;c.drawImage(im,r[0],r[1],r[2],r[3],o.bx,o.by,r[2],r[3]);}break;}const im=houseImg(o);c.drawImage(im,o.bx,o.by);if(o.palace){c.fillStyle='#c03a3a';for(const fx of [o.bx+6,o.bx+o.bw-10]){c.fillRect(fx,o.by-14,1,16);c.fillRect(fx+1,o.by-14+Math.round(Math.sin(t*3+fx)),7,5);}}
    if(!o.spr&&(o.act||o.name!=='창고'))drawDoor(c,o);drawSign(c,o);
    if(o.spr&&IMG.el_smoke&&(o.smoke||o.spr!=='mansion')){const im2=IMG.el_smoke,fw=im2.width/30;const f=Math.floor(t*12+o.x*3)%30;c.drawImage(im2,f*fw,0,fw,im2.height,o.sprSmoke[0]-fw/2,o.sprSmoke[1]-im2.height+2,fw,im2.height);}
    else if((o.smoke||o.chimney)&&IMG.el_smoke){const main=o.parts.find(p=>p.k==='main');const im2=IMG.el_smoke,fw=im2.width/30;const f=Math.floor(t*12+o.x*3)%30;const sx=o.chimney?o.bx+main.x+(o.w-2)*T+5-fw/2:o.bx+o.bw-22,sy=o.chimney?o.by+main.y-im2.height+2:o.by-im2.height+10;c.drawImage(im2,f*fw,0,fw,im2.height,sx,sy,fw,im2.height);}
    break;}
  case 'prop':{if(o.k==='barrels'){for(const [ox,oy] of [[0,-3],[9,0]])c.drawImage(IMG.t_camp,64,80,16,16,o.x*T+ox+2,o.y*T+oy,16,16);break;}const p=PROP[o.k];const im=IMG[p.im];if(!im)break;const r=p.r;c.drawImage(im,r[0],r[1],r[2],r[3],o.x*T+(p.blk[0]*T-r[2])/2,(o.y+1)*T-r[3]+(o.k.startsWith('tent')?T:0),r[2],r[3]);break;}
  case 'tree':{const im=IMG['el_'+o.k];if(!im)break;if(MAP&&MAP.ash){c.save();c.filter='saturate(.25) brightness(.62) sepia(.35)';}c.drawImage(im,0,0,32,34,o.x*T-8,o.y*T-20,32,34);if(MAP&&MAP.ash)c.restore();break;}
  case 'fire':{const im=IMG.t_campfire;if(im){const f=Math.floor(t*10)%8;c.drawImage(im,f*32,0,32,32,o.x*T-8,o.y*T-14,32,32);}
    c.fillStyle='rgba(255,170,60,'+(.08+.03*Math.sin(t*9))+')';c.beginPath();c.arc(o.x*T+8,o.y*T+6,40,0,Math.PI*2);c.fill();break;}
  case 'windmill':{const im=IMG.el_windmill;if(im){const f=Math.floor(t*6)%9;c.drawImage(im,f*112,0,112,112,o.x*T-8,o.y*T-6,112,112);}break;}
  case 'swall':{const im=IMG.t_ss16,F=MAP&&MAP.wset;if(!F)break;const X=o.x*T,Y=o.y*T,has=(a,b)=>F.has(gi(MAP,o.x+a,o.y+b));
    if(o.gate){c.drawImage(im,736,32,16,16,X,Y,16,16);break;}const h=has(-1,0)||has(1,0),v=has(0,-1)||has(0,1);
    if(h&&!v)c.drawImage(im,704+16*((o.x*7)%4),16,16,16,X,Y,16,16);else if(v&&!h)c.drawImage(im,704,48,16,16,X,Y,16,16);else c.drawImage(im,720,48,16,16,X,Y,16,16);break;}
  case 'statue2':{c.drawImage(IMG.t_ss16,704,288,32,64,o.x*T,o.y*T-34,32,64);break;}
  case 'fencet':{const im=IMG.t_ss16,F=MAP&&MAP.fset;if(!im||!F)break;const X=o.x*T,Y=o.y*T,has=(a,b)=>F.has(gi(MAP,o.x+a,o.y+b));const bx=576,by=0;
    if(has(-1,0))c.drawImage(im,bx+3*16,by+2*16,8,16,X,Y,8,16);if(has(1,0))c.drawImage(im,bx+3*16+8,by+2*16,8,16,X+8,Y,8,16);
    if(has(0,-1))c.drawImage(im,bx+4*16,by+3*16,16,8,X,Y,16,8);if(has(0,1))c.drawImage(im,bx+4*16,by+3*16+8,16,8,X,Y+8,16,8);
    c.drawImage(im,bx+5*16,by+3*16,16,16,X,Y,16,16);break;}
  case 'fence':{c.fillStyle='#8a5a32';const L=o.len*T;if(o.dir==='h'){c.fillRect(o.x*T,o.y*T+6,L,2);c.fillRect(o.x*T,o.y*T+11,L,2);for(let i=0;i<=o.len;i++){c.fillStyle='#6a4024';c.fillRect(o.x*T+i*T-1,o.y*T+3,3,12);}}
    else{c.fillStyle='#8a5a32';c.fillRect(o.x*T+6,o.y*T,2,L);c.fillRect(o.x*T+9,o.y*T,2,L);c.fillStyle='#6a4024';for(let i=0;i<o.len;i++)c.fillRect(o.x*T+5,o.y*T+i*T+2,7,4);}break;}
  case 'flowers':{const im=IMG.t_ss16;const F=[[496,16],[528,16],[496,32],[528,32],[496,48],[528,48],[512,16],[544,48]];const h=o.seed*2654435761>>>0;
    for(let i=0;i<2;i++){const f=F[(h>>>(i*5))%F.length];c.drawImage(im,f[0],f[1],16,16,o.x*T+(i?5:-3),o.y*T+(i?-2:3),16,16);}break;}
  case 'crop':{const im=IMG.t_ss16;for(let i=0;i<2;i++){const cl=51+((o.seed+i)%9);c.drawImage(im,cl*16,16*16,16,32,(o.x+i)*T,o.y*T-18,16,32);}break;}
  case 'dummy':{const im=IMG.t_camp;c.drawImage(im,0,48,16,32,o.x*T,o.y*T-16,16,32);break;}
  case 'banner':{const im=IMG.t_camp;c.drawImage(im,112,80,16,32,o.x*T,o.y*T-16,16,32);break;}
  case 'board':{const x=o.x*T,y=o.y*T;c.fillStyle='#5a3420';c.fillRect(x+3,y-2,2,18);c.fillRect(x+27,y-2,2,18);c.fillStyle='#8a5a32';c.fillRect(x,y-14,32,16);c.fillStyle='#c8955a';c.fillRect(x+2,y-12,28,12);
    c.fillStyle='#fff8e0';c.fillRect(x+4,y-11,7,8);c.fillRect(x+13,y-10,6,9);c.fillRect(x+21,y-11,7,7);c.fillStyle='#a03a2a';c.fillRect(x+7,y-11,1,1);c.fillRect(x+16,y-10,1,1);break;}
  case 'plot':{const x=o.x*T,y=o.y*T,w=o.w*T,h=o.h*T;c.fillStyle='rgba(140,100,60,.28)';c.fillRect(x+2,y+2,w-4,h-4);c.strokeStyle='#d8c090';c.setLineDash([3,3]);c.lineWidth=1;c.strokeRect(x+2.5,y+2.5,w-5,h-5);c.setLineDash([]);
    c.fillStyle='#6a4024';for(const [px,py] of [[x+2,y+1],[x+w-4,y+1],[x+2,y+h-7],[x+w-4,y+h-7]])c.fillRect(px,py,2,6);
    c.fillStyle='#8a5a32';c.fillRect(x+w/2-8,y+h/2-6,16,10);c.fillStyle='#e8d0a0';c.fillRect(x+w/2-7,y+h/2-5,14,8);c.drawImage(IMG.ui_sword||IMG.raven,0,0,14,14,x+w/2-5,y+h/2-5,8,8);break;}
  case 'furn':{const im=IMG[o.im];if(im){const r=o.r;c.drawImage(im,r[0],r[1],r[2],r[3],Math.round(o.x*T+(o.ox||0)),Math.round((o.base||(o.y+1)*T)-r[3]+(o.oy||0)),r[2],r[3]);}break;}
  case 'stairsdown':{const X=o.x*T,Y=o.y*T;c.fillStyle='#1a1008';c.fillRect(X,Y,32,16);const bi=IMG.t_bridges;if(bi)for(let k=0;k<3;k++)c.drawImage(bi,225,341+k*4,29,4,X+1,Y+2+k*5,29,4);break;}
  case 'stall':{const cb=IMG.el_crate_base,ct=IMG.el_crate_top,im=IMG.t_ss16;const P=[816,832,848,880,896,912,928,944,960,976];
    for(let i=0;i<2;i++){const X=o.x*T+i*16,Y=o.y*T;if(cb)c.drawImage(cb,X,Y);for(let k=0;k<2;k++){const px=P[(o.x*3+i*5+k*7)%P.length];c.drawImage(im,px,160,16,16,X+(k?4:-1),Y-5+(k?1:0),12,12);}if(ct)c.drawImage(ct,X,Y+2);}break;}
  case 'bench':{c.drawImage(IMG.t_camp,0,112,48,16,o.x*T,o.y*T,48,16);break;}
  case 'bed':{const im=IMG.t_ss16;const B=[[432,32],[448,32],[464,32],[480,32]];const F=[[496,16],[528,16],[496,32],[528,32],[496,48],[528,48]];
    for(let i=0;i<o.w;i++){const h=((o.x+i)*73856093^o.y*19349663)>>>0;const b=B[h%4],f=F[(h>>>4)%6];c.drawImage(im,b[0],b[1],16,16,(o.x+i)*T,o.y*T,16,16);c.drawImage(im,f[0],f[1],16,16,(o.x+i)*T+3,o.y*T-4,16,16);}break;}
  case 'sign':{c.drawImage(IMG.t_ss16,624,256,16,16,o.x*T,o.y*T,16,16);break;}
  case 'mine':{const im=IMG.t_goldmine;if(im)c.drawImage(im,0,0,192,128,(o.x+1.5)*T-48,(o.y+3)*T-61,96,64);break;}
  case 'cliff':{const im=IMG.w_mount;if(!im)break;const R=[[9,15,81,68],[105,15,81,69]];for(let i=-1;i*60<o.w*T;i++){const r=R[(i+5)%2];c.drawImage(im,r[0],r[1],r[2],r[3],i*60-10,-6+((i%3)*6),r[2],r[3]);}break;}
  case 'furnace':{const im=IMG.t_ss16;c.drawImage(im,624,272,32,32,o.x*T,o.y*T,32,32);const fi=IMG.el_fire;if(fi){const n=Math.max(1,Math.round(fi.width/fi.height)),fw=fi.width/n,f=Math.floor(walkT*8)%n;c.drawImage(fi,f*fw,0,fw,fi.height,o.x*T+10,o.y*T+20,fw,fi.height);c.globalAlpha=1;}break;}
  case 'trough':{c.drawImage(IMG.t_ss16,596,272,32,16,o.x*T,o.y*T,32,16);break;}
  case 'rail':{c.drawImage(IMG.t_ss16,768,128,16,16,o.x*T,o.y*T,16,16);break;}
  case 'cart':{c.drawImage(IMG.t_ss16,704,104,16,18,o.x*T,o.y*T-4,16,18);break;}
  case 'arena':{const x=o.x*T,y=o.y*T,w=o.w*T,h=o.h*T;c.fillStyle='#e4d08a';c.beginPath();c.ellipse(x+w/2,y+h/2,w/2-6,h/2-6,0,0,Math.PI*2);c.fill();c.strokeStyle='#8a867e';c.lineWidth=6;c.stroke();c.strokeStyle='#b8b4ac';c.lineWidth=2;c.stroke();
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const bx=x+w/2+Math.cos(a)*(w/2-4),by=y+h/2+Math.sin(a)*(h/2-4);c.fillStyle='#5a3420';c.fillRect(bx,by-14,2,14);c.fillStyle=i%2?'#a8282a':'#2a5aa8';c.fillRect(bx+2,by-14,7,5);}break;}
  }}
function drawWalker(c,e){shadow(c,e.x,e.y+1,6);
  let flash=0;if(e.drill){drawAny(c,e.desc,'attack',walkT*.9,e.x,e.y+1,1,e.face<0,{flash});return;}drawAny(c,e.desc,e.anim,e.t,e.x,e.y+1,1,e.face<0,{flash});
  if(e.kind==='merc'&&e.ref.status==='inj'){c.fillStyle='#fff';c.fillRect(e.x-4,e.y-15,8,2);c.fillStyle='#d03030';c.fillRect(e.x-1,e.y-16,2,4);}}
function renderWalk(){const m=MAP;if(!m||!m.bg)return;const z=cam.z;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=m.inside?'#140c08':'#2f5a2a';ctx.fillRect(0,0,W,H);
  ctx.setTransform(DPR*z,0,0,DPR*z,DPR*(W/2-cam.x*z),DPR*(H/2-cam.y*z));ctx.imageSmoothingEnabled=false;
  ctx.drawImage(m.bg,0,0);
  // 물결 반짝임
  if(m.waterT){const RP=IMG.nj_ripple;for(const [i,j,ph] of m.waterT){const t=walkT*0.9+ph*0.7,cyc=t%4;if(m.nj){if(cyc>=2||!RP||m.nj==='snow'||!m.waterFull||!m.waterFull.has(i+','+j))continue;ctx.drawImage(RP,Math.floor(cyc*2)*16,0,16,16,i*T,j*T,16,16);continue;}const a=Math.sin(walkT*1.3+ph);if(a<.1)continue;const ox=Math.round(Math.sin(walkT*.6+ph)*3);ctx.fillStyle=`rgba(255,255,255,${Math.min(.75,(a-.1)*.8)})`;ctx.fillRect(i*T+4+ox,j*T+8,5,1);ctx.fillRect(i*T+3+ox,j*T+9,1,1);ctx.fillRect(i*T+9+ox,j*T+9,1,1);if(a>.8){ctx.fillRect(i*T+11-ox,j*T+4,2,1);}}}
  if(m.boats&&IMG.nj_boat)for(const b of m.boats){const bob=Math.round(Math.sin(walkT*1.8+b.ph)*1.2),bx=Math.round(b.x-40),by=Math.round(b.y-16)+bob;
    ctx.fillStyle='rgba(20,60,110,.28)';ctx.fillRect(bx+4,by+30,70,3);ctx.drawImage(IMG.nj_boat,bx,by);
    if(b.sail&&IMG.nj_sail){const sw=Math.round(Math.sin(walkT*1.2+b.ph)*1);ctx.drawImage(IMG.nj_sail,bx+30+sw,by-30);}
    if(!b.sail&&IMG.nj_net)ctx.drawImage(IMG.nj_net,bx+40,by+4,22,17);
    const k=Math.floor(walkT*2+b.ph)%3;ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(bx+2-k,by+28,4,1);ctx.fillRect(bx+72+k,by+24,4,1);}
  else if(m.boats&&IMG.el_coracle)for(const b of m.boats){const f=Math.floor(walkT*4+b.ph)%4;ctx.drawImage(IMG.el_coracle,f*48,0,48,37,Math.round(b.x-24),Math.round(b.y-22),48,37);}
  const list=[];for(const o of m.objs)list.push([o.base,0,o]);for(const e of m.npcs)list.push([e.y,1,e]);list.push([player.y,1,player]);
  for(const a of m.animals||[])list.push([a.y,2,a]);
  list.sort((a,b)=>a[0]-b[0]);
  for(const [_,k,o] of list){if(k===0)drawObj(ctx,o);else if(k===1)drawWalker(ctx,o);else if(o.k.startsWith('mf_')){const im=IMG['el_'+o.k];if(im){const mv=o.tx&&Math.hypot(o.tx-o.x,o.ty-o.y)>=2;const f=Math.floor(o.t*(mv?8:4))%4;ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if(o.dir<0)ctx.scale(-1,1);ctx.drawImage(im,f*32,mv?32:0,32,32,-16,-26,32,32);ctx.restore();}}else{const im=IMG['el_'+o.k];if(im){const fw=im.width/4,f=Math.floor(o.t*5)%4;ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if(o.dir<0)ctx.scale(-1,1);ctx.drawImage(im,f*fw,0,fw,im.height,-fw/2,-im.height+3,fw,im.height);ctx.restore();}}}
  // 목표 표시
  if(player.path.length){const p=player.path[player.path.length-1];ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse((p[0]+.5)*T,(p[1]+.6)*T,5+Math.sin(walkT*8),2.5,0,0,Math.PI*2);ctx.stroke();}
  drawEdit(ctx);
  // 화면 좌표로 이름표·말풍선
  ctx.setTransform(DPR,0,0,DPR,0,0);const sx=wx=>(wx-cam.x)*z+W/2,sy=wy=>(wy-cam.y)*z+H/2;
  const tags=[];
  for(const o of m.objs)if(o.act&&o.name&&(o.t==='house'||o.t==='plot'||o.t==='board'||(o.t==='prop'&&o.act)||o.t==='fire'))tags.push([o.t==='house'?(o.bx+o.bw/2):o.t==='plot'?(o.x+o.w/2)*T:(o.x+(o.t==='board'?1:o.t==='prop'?PROP[o.k].blk[0]/2:.5))*T,o.t==='house'?o.by+(o.spr&&o.spr!=='mansion'?8:-2):o.t==='plot'?o.y*T:o.t==='fire'?o.y*T-14:o.y*T-(o.t==='board'?16:30),o.name,o.t==='plot']);
  for(const l of m.labels)tags.push([l.x*T,l.y*T,l.n]);
  ctx.font='800 12px Galmuri11,"Malgun Gothic",sans-serif';ctx.textAlign='center';
  ctx.font='800 12px Galmuri11,"Malgun Gothic",sans-serif';
  const placed=[];for(const tg of tags.sort((a,b)=>b[1]-a[1])){const w=ctx.measureText(tg[2]).width+12;let Y=sy(tg[1]);const X=sx(tg[0]);
    for(let k=0;k<6;k++){const hit=placed.find(p=>Math.abs(p.X-X)<(p.w+w)/2+2&&Math.abs(p.Y-Y)<19);if(!hit)break;Y=hit.Y-20;}placed.push({X,Y,w});tg[4]=X;tg[5]=Y;}
  for(const [x,y,n,pl,X,Y0] of tags){const Y=Y0-6;if(X<-80||X>W+80||Y<-20||Y>H+40)continue;const tw=ctx.measureText(n).width+12;ctx.fillStyle=pl?'rgba(60,40,20,.75)':'rgba(40,24,12,.82)';roundRect(ctx,X-tw/2,Y-15,tw,18,6);ctx.fill();ctx.fillStyle=pl?'#ffe0a0':'#fff3dc';ctx.fillText(n,X,Y-2);}
  for(const ex of m.exits||[]){const X=sx((ex.x+.5)*T),Y=sy((ex.y+.5)*T);if(X<-40||X>W+40||Y<-40||Y>H+40)continue;ctx.fillStyle='rgba(30,20,10,.75)';roundRect(ctx,X-34,Y-11,68,20,8);ctx.fill();ctx.fillStyle='#ffe28a';ctx.fillText((ex.to==='back'?'🚪 ':'🗺 ')+ex.n,X,Y+4);}
  if(m.confetti&&m.confetti.length){for(const p of m.confetti){p.y+=p.vy*.016;p.x+=Math.sin(walkT*3+p.ph)*.6;p.r+=.1;const X=sx(p.x),Y=sy(p.y);ctx.save();ctx.translate(X,Y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-3,-1.5,6,3);ctx.restore();}m.confetti=m.confetti.filter(p=>p.y<p.end);}
  // 머리 위 표시
  for(const e of m.npcs){const X=sx(e.x),Y=sy(e.y-20);
    if(e.kind==='cq'){const x=G.cqCur(e.cq);if(x){const mk=e.recv?'?':!x.st.state&&G.cqOk(x.q)?'!':x.st.state==='done'?'?':null;if(mk)outlineText(ctx,mk,X,Y-4+Math.sin(walkT*5)*2,'#7ec8ff',20);}}
    if(e.kind==='quest'){const st=S().subs[e.sub];const q0=D.SUBS[e.sub];const rq=q0.req&&!(S().subs[q0.req]&&S().subs[q0.req].state==='claimed');const mark=!st?(rq?null:'!'):st.state==='done'?'?':null;if(mark){outlineText(ctx,mark,X,Y-4+Math.sin(walkT*5)*2,mark==='?'?'#7fe07a':'#ffd84a',20);}
      if(z>2.2){ctx.font='11px Galmuri11,sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(e.name,X,sy(e.y+12));ctx.fillText(e.name,X,sy(e.y+12));}}
    if(e.kind==='owner'){outlineText(ctx,'💬',X,Y-6+Math.sin(walkT*4)*2,'#fff',14);ctx.font='11px Galmuri11,sans-serif';ctx.fillStyle='#ffe9b0';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(e.name,X,sy(e.y+12));ctx.fillText(e.name,X,sy(e.y+12));}
    if(e.kind==='merc'&&hoverObj===e){ctx.font='11px Galmuri11,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle=D.GRADES[e.ref.grade].c;ctx.strokeText(e.name,X,sy(e.y+12));ctx.fillText(e.name,X,sy(e.y+12));}}
  ctx.textAlign='left';
  for(const e of m.npcs){if(e.bubble)bubble(ctx,sx(e.x),sy(e.y-18*1)-4,e.bubble.text,clamp(z/3,.85,1.15));
    else if(e.kind==='merc'&&!e.bubble&&IMG.ui_expression_chat&&(hoverObj===e)){ctx.drawImage(IMG.ui_expression_chat,sx(e.x)-9,sy(e.y-20)-20,18,18);}}
  if(player.bubble)bubble(ctx,sx(player.x),sy(player.y-18)-4,player.bubble.text,1);}

/* ----- 걷는 장면: 조작 ----- */
function screenToWorld(px,py){return [(px-W/2)/cam.z+cam.x,(py-H/2)/cam.z+cam.y];}
function hitWalk(px,py){const [wx,wy]=screenToWorld(px,py);const m=MAP;
  let best=null,bd=14;for(const e of m.npcs){const d=Math.hypot(e.x-wx,e.y-8-wy);if(d<bd){bd=d;best=e;}}if(best)return {npc:best};
  for(const o of m.objs){if(!o.act&&!(o.t==='house'&&m.town&&o.name))continue;
    if((o.t==='furn'||o.t==='stairsdown')&&wx>=o.x*T-4&&wx<=o.x*T+36&&wy>=o.y*T-20&&wy<=o.y*T+20)return {obj:o};
    if(o.t==='house'&&wx>=o.bx&&wx<=o.bx+o.bw&&wy>=o.by-12&&wy<=o.base)return {obj:o};
    if(o.t==='plot'&&wx>=o.x*T&&wx<=(o.x+o.w)*T&&wy>=o.y*T&&wy<=(o.y+o.h)*T)return {obj:o};
    if(o.t==='mine'&&wx>=o.x*T&&wx<=(o.x+6)*T&&wy>=o.y*T-16&&wy<=(o.y+3)*T)return {obj:o};
    if(o.t==='arena'&&wx>=o.x*T&&wx<=(o.x+o.w)*T&&wy>=o.y*T&&wy<=(o.y+o.h)*T)return {obj:o};
    if((o.t==='prop'||o.t==='board'||o.t==='fire'||o.t==='dummy')&&Math.abs(wx-(o.x+(o.t==='prop'?PROP[o.k].blk[0]/2:o.t==='board'?1:.5))*T)<22&&wy>o.y*T-34&&wy<(o.y+1.4)*T)return {obj:o};}
  for(const l of m.labels){if(Math.abs(wx-l.x*T)<40&&Math.abs(wy-l.y*T)<14)return {obj:m.objs.find(o=>o.act===l.act)};}
  return {tile:[Math.floor(wx/T),Math.floor(wy/T)]};}
function walkTap(px,py){if(uiBusy())return;if(edOn()){edTap(px,py);return;}const h=hitWalk(px,py);const m=MAP;const sx=Math.floor(player.x/T),sy=Math.floor(player.y/T);
  if(h.npc){const e=h.npc;const p=findPath(m,sx,sy,Math.floor(e.x/T),Math.floor(e.y/T));player.goal={npc:e};if(p){p.shift();if(p.length)p.pop();player.path=p;}if(!player.path.length){player.goal=null;interact({npc:e});}return;}
  if(h.obj){const o=h.obj;let tx,ty;if(o.t==='house'){tx=o.dx;ty=o.dy+1;}else if(o.t==='plot'){tx=o.x+Math.floor(o.w/2);ty=o.y+o.h;}else if(o.t==='arena'){tx=o.x+o.w/2|0;ty=o.y-1;}else if(o.t==='mine'){tx=o.x+2;ty=o.y+3;}else{tx=o.x;ty=o.y+1;}
    const p=findPath(m,sx,sy,tx,ty);player.goal={obj:o};if(p){p.shift();player.path=p;}if(!player.path.length){player.goal=null;interact({obj:o});}return;}
  const [tx,ty]=h.tile;const p=findPath(m,sx,sy,tx,ty);if(p){p.shift();player.path=p;player.goal=null;sfx('step',.15,120);}}
function interact(g){if(g.npc){const e=g.npc;e.face=player.x<e.x?-1:1;player.face=e.x>player.x?1:-1;
    if(e.kind==='merc'){e.bubble={text:G.mercLine(e.ref,e.place),t:5};e.wait=Math.max(e.wait,3);e.path=[];}
    else if(e.kind==='visitor'){e.bubble={text:freshLine(MAP,D.CAMP_VISITOR),t:4};e.path=[];}
    else if(e.kind==='npc'){e.bubble={text:G.townLine(MAP.town,e.role,e.mf),t:4.5};e.path=[];e.wait=3;}
    else if(e.kind==='quest')subDialog(e);
    else if(e.kind==='cq')cqDialog(e);
    else if(e.kind==='owner')openAct(e.act,{act:e.act});return;}
  const o=g.obj;if(!o)return;if(o.t==='house'&&MAP.town&&!MAP.inside&&MAP.key!=='camp'){fadeTo(()=>enterInterior(o));return;}openAct(o.act,o);}

/* ================= 전투 화면 ================= */
let BT=null; // {b, LW, LH, bg, port, fl:[], fx:[], shake, onEnd, title, endT}
function startBattle(enemies,title,theme,onEnd,opt){const port=H>W*1.05;const LW=port?480:1280,LH=port?860:720;
  const b=new G.Battle(enemies,opt||{});b.speed=S().flags.bspeed||1;b.auto=!!S().flags.leaderAuto;
  BT={b,LW,LH,port,theme,bg:makeBattleBG(theme,LW,LH,port),fl:[],fx:[],shake:0,onEnd,title,endT:0,t:0};
  layoutBattle(BT);b.offFn=u=>port?{x:0,y:u.side===0?66:-66}:{x:u.side===0?-70:70,y:0};
  if(!b.focus){const e=b.alive(1).find(x=>x.boss)||b.alive(1)[0];b.focus=e;}
  scene='battle';sceneT=0;showBattleUI();bgmTick();}
function cellPos(bt,c){const back=c>=3,l=c%3-1;return bt.port?{x:240+l*140,y:back?715:590}:{x:back?300:470,y:480+l*128+(back?8:0)};}
function layoutBattle(bt){const b=bt.b;for(const u of b.units)if(u.side===0&&u.cell!=null){const p=cellPos(bt,u.cell);u.hx=u.x=p.x;u.hy=u.y=p.y;}
  for(const side of [1])for(const row of ['front','back']){const us=b.units.filter(u=>u.side===side&&u.row===row);const n=us.length;
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
  if(b.prep){for(let i=0;i<6;i++){const p=cellPos(bt,i);const sel=bt.pick&&bt.pick.cell===i;ctx.fillStyle=sel?'rgba(255,216,74,.35)':i<3?'rgba(255,140,90,.18)':'rgba(120,180,255,.18)';ctx.strokeStyle=sel?'#ffd84a':'rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+2,44,16,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.font='800 14px Galmuri11,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';const f0=cellPos(bt,2),b0=cellPos(bt,5);outlineText(ctx,'전열',bt.port?f0.x+60:f0.x,bt.port?f0.y+40:f0.y+48,'#ffb08a',16);outlineText(ctx,'후열',bt.port?b0.x+60:b0.x,bt.port?b0.y+40:b0.y+48,'#9ac8ff',16);}
  {const u=b.leader();if(u&&u.queued){ctx.strokeStyle='#ffd84a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(u.x,u.y+2,30+Math.sin(bt.t*6)*3,10,0,0,Math.PI*2);ctx.stroke();}}
  for(const u of us){const dead=u.hp<=0;const desc=u.side===0?unitDesc(u.ref):sprDesc(u.spr,u.tint);if(!desc)continue;
    const sc=(BT.port?3:3.6)*(desc.kind==='boss'?.72:1)*(u.scale||1);
    let anim=dead?'death':u.anim||'idle';const at=dead?(u.at||0):anim==='idle'?bt.t+u.hx*.01:u.at;
    if(dead&&!['human','ss','rpg','e32'].includes(desc.kind)&&at>1)continue;
    if(!dead)shadow(ctx,u.x,u.y+2,desc.kind==='boss'?40*(u.scale||1):16*(u.scale||1));
    const flash=u.hitT?u.hitT*3:0;
    if(dead&&['human','ss','rpg','e32'].includes(desc.kind))ctx.globalAlpha=u.side===1?Math.max(0,1-Math.max(0,at-.9)):1;
    drawAny(ctx,desc,anim,at,u.x,u.y,sc,u.side===1,{flash:dead?0:flash,alpha:dead&&u.side===0?.55:null});ctx.globalAlpha=1;
    if(dead)continue;
    // 상태 표시줄
    const top=u.y-unitH(desc)*sc-14;const bw=desc.kind==='boss'?110:64;
    drawBar(u.x-bw/2,top,bw,7,u.hp/u.maxHp,u.side===0?'#5ad04a':'#e05040');
    if(u.shield>0)drawBar(u.x-bw/2,top-4,bw,3,Math.min(1,u.shield/u.maxHp),'#8fd0ff');
    if(u.sk)drawBar(u.x-bw/2,top+8,bw,4,Math.min(1,(u.sp||0)/100),'#4a9aff');
    if(!u.isL||1)drawBar(u.x-bw/2,top+(u.sk?13:8),bw,3,Math.min(1,u.g/100),'#e8c050');
    ctx.font='800 13px Galmuri11,"Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#120a04';const nm=(u.isL?'★ ':'')+u.name+(u.lv&&u.side===1?' Lv'+u.lv:'');ctx.strokeText(nm,u.x,top-4);ctx.fillStyle=u.isL?'#ffe28a':u.boss?'#ff9a7a':u.elite?'#ffc87a':'#fff';ctx.fillText(nm,u.x,top-4);
    const st=[];if(b.has(u,'taunt'))st.push('도발');if(b.has(u,'freeze'))st.push('빙결');if(b.has(u,'slow'))st.push('둔화');if(b.has(u,'bleed'))st.push('출혈');if(b.has(u,'brk'))st.push('방깎');if(b.buffVal(u,'atk')>0)st.push('공↑');if(b.has(u,'haste'))st.push('가속');
    if(st.length){ctx.font='11px Galmuri11,sans-serif';ctx.fillStyle='#ffd0a0';ctx.strokeText(st.join(' '),u.x,u.y+22);ctx.fillText(st.join(' '),u.x,u.y+22);}
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
  if(bt.endT){ctx.globalAlpha=Math.min(1,bt.endT*2);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(0,0,bt.LW,bt.LH);outlineText(ctx,b.opt&&b.opt.watch?(b.over===1?'붉은 코너 승리!':'푸른 코너 승리!'):b.over===1?'승리!':'전멸...',bt.LW/2,bt.LH/2,b.over===1?'#ffe28a':'#ff8a7a',b.opt&&b.opt.watch?48:64);ctx.globalAlpha=1;}}
function unitH(d){if(d.kind==='boss')return {giantslime:24,demoncyclop:34,giantspirit:42,squidred:58,tengured:34,giantfrog:27,giantredsamurai:40}[d.k]||36;if(d.kind==='rpg')return 17;if(d.kind==='e32')return 17;if(d.kind==='ninja')return 15;return 18;}
function drawBar(x,y,w,h,p,col){ctx.fillStyle='#1a120c';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle='#4a3324';ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.max(0,w*p),h);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x,y,Math.max(0,w*p),1);}
function battleTap(px,py){const bt=BT;if(!bt||bt.endT)return;const v=bView();const lx=(px-v.ox)/v.k,ly=(py-v.oy)/v.k;let best=null,bd=60;
  if(bt.b.prep){let c=-1,cd=70;for(let i=0;i<6;i++){const p=cellPos(bt,i);const d=Math.hypot(p.x-lx,p.y-20-ly);if(d<cd){cd=d;c=i;}}
    if(c<0)return;const at=bt.b.units.find(u=>u.side===0&&u.cell===c);
    if(bt.pick!=null&&bt.pick!==at){bt.b.moveCell(bt.pick,c);bt.pick=null;layoutBattle(bt);sfx('click',.3);}
    else{bt.pick=at&&bt.pick!==at?at:null;sfx('click',.2);}prepHint();return;}
  for(const u of bt.b.alive(1)){const d=Math.hypot(u.x-lx,(u.y-25)-ly);if(d<bd*(u.scale||1)){bd=d;best=u;}}
  if(best){bt.b.setFocus(best);sfx('click',.2);updCmdState(true);}}
/* 전투 조작 UI */
function showBattleUI(){hideWalkUI();$('hud').classList.add('hidden');$('bhud').classList.remove('hidden');$('bTitle').textContent=BT.title;
  $('bAuto').innerHTML='단장 스킬 오토 <b>'+(BT.b.auto?'ON':'OFF')+'</b>';$('bAuto').classList.toggle('sel',BT.b.auto);$('bSpeed').textContent='속도 ×'+BT.b.speed;
  if(BT.b.prep){$('bCmd').innerHTML='<button id="bGo" class="go" style="min-width:160px">⚔ 전투 시작</button><label style="font-size:12px;color:#fff;display:flex;align-items:center;gap:4px"><input type="checkbox" id="bQuick">다음부터 바로 시작</label>';$('bCmd').classList.remove('hidden');
    $('bGo').onclick=()=>{if(!BT)return;if($('bQuick').checked)S().flags.quickStart=true;BT.pick=null;layoutBattle(BT);BT.b.begin_();sfx('slash',.3);showBattleUI();};prepHint();return;}
  if(BT.b.opt&&BT.b.opt.watch){$('bCmd').innerHTML='';$('bCmd').classList.add('hidden');$('bAuto').classList.add('hidden');$('bHint').textContent='🎲 관전 중 — 붉은 코너(왼쪽) vs 푸른 코너(오른쪽)';return;}$('bAuto').classList.remove('hidden');
  showCmd();
  $('bHint').textContent=BT.b.auto?'모두 실시간으로 자동 전투 중. 스킬 버튼을 누르면 단장이 바로 씁니다. 적을 누르면 집중 공격.':'실시간 전투! 기본 공격은 자동, 스킬은 버튼(1~4)으로 쓰세요. 적을 누르면 집중 공격.';}
function prepHint(){$('bHint').textContent=BT.pick?`${BT.pick.name} 선택됨 — 옮길 칸(또는 바꿀 동료)을 누르세요.`:'전투 준비: 아군을 눌러 고른 뒤 다른 칸을 누르면 자리를 옮깁니다. 전열은 근접 공격을 받아요. 배치는 저장됩니다.';}
function hideBattleUI(){$('bhud').classList.add('hidden');$('bCmd').classList.add('hidden');$('hud').classList.remove('hidden');}
$('bAuto').onclick=()=>{if(!BT)return;BT.b.auto=!BT.b.auto;S().flags.leaderAuto=BT.b.auto;showBattleUI();};
$('bSpeed').onclick=()=>{if(!BT)return;BT.b.speed=BT.b.speed>=3?1:BT.b.speed+1;S().flags.bspeed=BT.b.speed;$('bSpeed').textContent='속도 ×'+BT.b.speed;};
function showCmd(){const b=BT.b;let h='';
  for(const k of G.leaderSkills()){const s=D.SKILLS[k];const lock=s.lv&&S().leader.lv<s.lv;h+=`<button data-c="${k}" title="${s.d}">${s.n}<small>${lock?'Lv'+s.lv+' 해금':''}<span class="cd"></span></small></button>`;}
  $('bCmd').innerHTML=h;$('bCmd').classList.remove('hidden');
  $('bCmd').querySelectorAll('button').forEach(bn=>bn.onclick=()=>{if(b.cast(bn.dataset.c)){bn.classList.add('pop');setTimeout(()=>bn.classList.remove('pop'),250);sfx('click',.25);}});
  updCmdState(true);}
let cmdT=0;function updCmdState(force){cmdT+=1;if(!force&&cmdT%6)return;const b=BT&&BT.b;if(!b||b.prep)return;const u=b.leader();
  if(!u||b.over){$('bCmd').classList.add('hidden');return;}const av=b.availSkills(u);
  $('bCmd').querySelectorAll('button').forEach(bn=>{const k=bn.dataset.c;const ok=av.includes(k);bn.disabled=!ok;bn.classList.toggle('sel',u.queued===k);const cd=bn.querySelector('.cd');if(cd)cd.textContent=u.cds[k]>0?' '+Math.ceil(u.cds[k])+'초':u.queued===k?' 준비':'';});}

/* ================= 던전 탐험 (걸어 다니는 방·미로) ================= */
let DG=null; // {dg, mobs, ...} 현재 던전 지도
const INDOOR_TS={ruin:'ruin',fort:'fort',temple:'temple',crystal:'crystal',cave:'cave',sewer:'sewer',dock:'dock',sea:'dock',volcano:'volcano',abyss:'abyss'};
function departDungeon(dk){const err=G.startRun(dk);if(err){toast(err);return;}closePanel();sfx('levelup',.25);
  const d=D.DUNG[dk];fadeTo(()=>{enterDungeon();say([['나레이션',`[${d.n}]에 들어섰다. 안쪽 어딘가에 ${D.BOSS[d.boss].n}이(가) 있다.`],['나레이션','<b>도움말</b> — 화면을 눌러 이동합니다. 적에게 닿으면 전투, 🔥모닥불에 말을 걸면 쉬거나 귀환할 수 있어요. 입구의 계단으로도 돌아갈 수 있습니다.']]);});}
function enterDungeon(){const r=S().run;const d=D.DUNG[r.dk];const dg=G.genDungeon(r.dk,r.seed);
  const m=mkMap('dg',dg.w,dg.h);m.kind='dg';m.dg=dg;m.title=d.n;m.theme=dg.theme;m.outdoor=dg.outdoor;m.ts=IMG['dg_'+(INDOOR_TS[dg.theme]||'ruin')];
  for(let i=0;i<dg.w*dg.h;i++)m.g[i]=dg.cells[i]?4:7;
  m.explored=new Uint8Array(dg.w*dg.h);m.lit=[];
  const at=(x,y)=>y*dg.w+x;
  // 장식
  for(const p of dg.props){m.objs.push({t:'dprop',k:p.k,x:p.x,y:p.y,big:p.big,wall:p.wall,base:p.wall?(p.y+1)*T-15:(p.y+1)*T-(p.solid?0:12),flat:!p.solid});if(p.solid)block(m,p.x,p.y,1,1);}
  if(!m.outdoor)for(const tc of dg.torches){m.objs.push({t:'dtorch',x:tc.x,y:tc.y,base:(tc.y+1)*T-15,ph:Math.random()*4});m.lit.push([tc.x*T+8,tc.y*T+14,62]);}
  else{// 바깥 던전: 벽 칸 가장자리에 나무·바위
    for(let y=0;y<dg.h;y++)for(let x=0;x<dg.w;x++){if(dg.cells[at(x,y)])continue;const near=[[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1]].some(([a,b])=>{const X=x+a,Y=y+b;return X>=0&&Y>=0&&X<dg.w&&Y<dg.h&&dg.cells[at(X,Y)];});
      if(near&&((x*7+y*13)%3!==0||y===0||!dg.cells[at(x,y+1)]))m.objs.push(dg.theme==='waste'?{t:'prop',k:'rock',x,y,base:(y+1)*T}:{t:'tree',x,y,k:(x+y)%3?'tree1':'tree2',ph:(x*3+y)%4,base:(y+1)*T});}}
  // 방
  m.mobs=[];m.rooms=dg.rooms;
  for(const rm of dg.rooms){const cx=rm.cx,cy=rm.cy;
    if(rm.t==='start'){m.objs.push({t:'dexit',x:rm.x+1,y:rm.y,base:(rm.y+1)*T,act:'dexit',name:'입구 (귀환)'});block(m,rm.x+1,rm.y,1,1);}
    if(rm.t==='camp'){m.objs.push({t:'fire',x:cx,y:cy,base:(cy+1)*T,act:'dfire',name:'모닥불',room:rm.id});block(m,cx,cy,1,1);m.lit.push([cx*T+8,cy*T+6,96]);}
    if(rm.t==='chest'){m.objs.push({t:'dchest',x:cx,y:cy,base:(cy+1)*T,act:'dchest',name:'보물 상자',room:rm.id,open:!!r.used[rm.id]});block(m,cx,cy,1,1);}
    if(rm.t==='shop'){const look={o:7,hair:'longhair',hc:4};m.npcs.push(walker({kind:'human',look,tool:false},cx,cy,{kind:'merchant',name:'떠돌이 상인',still:true,room:rm.id}));m.lit.push([cx*T+8,cy*T,70]);}
    if((rm.t==='battle'||rm.t==='elite'||rm.t==='boss')&&!r.cleared[rm.id]){const en=G.genEnemies(r.dk,{t:rm.t,l:rm.l});const lead=en[0];
      const mob={kind:'mob',room:rm,en,desc:sprDesc(lead.spr,lead.tint),name:lead.name+(en.length>1?' 외 '+(en.length-1):''),x:(cx+.5)*T,y:(cy+.5)*T,hx:(cx+.5)*T,hy:(cy+.5)*T,t:Math.random()*3,face:-1,anim:'idle',wait:rnd(1,3),path:[],speed:22,
        sc:rm.t==='boss'?(lead.spr.startsWith('b_')?.7:1.25)*(lead.scale||1):rm.t==='elite'?1.3:1,boss:rm.t==='boss',elite:rm.t==='elite'};m.mobs.push(mob);
      if(rm.t==='boss')m.objs.push({t:'dflag',x:rm.x+1,y:rm.y-1,base:rm.y*T},{t:'dflag',x:rm.x+rm.w-2,y:rm.y-1,base:rm.y*T});}}
  // 함정
  m.traps=dg.traps.map(tp=>Object.assign({},tp,{st:r.trapSt[tp.id]||0,checked:!!r.trapSt[tp.id]}));for(const tp of m.traps)if(tp.st===1)m.blk[at(tp.x,tp.y)]=1;
  paintDungeon(m);MAP=m;DG=m;
  const sp=r.pos||dg.start;player={x:(sp.x+.5)*T,y:(sp.y+.5)*T,path:[],t:0,anim:'idle',face:1,desc:unitDesc(S().leader),name:S().leader.name,kind:'player',trail:[]};
  m.followers=G.partyUnits().filter(u=>u!==S().leader).map((u,i)=>({u,desc:unitDesc(u),x:player.x-(i+1)*10,y:player.y,t:Math.random(),anim:'idle',face:1}));
  for(const id in r.visited){const rm=dg.rooms.find(x=>String(x.id)===String(id));if(rm)revealRoom(m,rm);}
  cam.x=player.x;cam.y=player.y;scene='dg';sceneT=0;showDmap();revealAround(m);G.save();}
function revealRoom(m,rm){for(let y=rm.y-1;y<=rm.y+rm.h;y++)for(let x=rm.x-1;x<=rm.x+rm.w;x++)if(x>=0&&y>=0&&x<m.w&&y<m.h)m.explored[y*m.w+x]=1;}
function revealAround(m){const px=Math.floor(player.x/T),py=Math.floor(player.y/T),R=m.outdoor?6:4;
  for(let y=py-R;y<=py+R;y++)for(let x=px-R;x<=px+R;x++)if(x>=0&&y>=0&&x<m.w&&y<m.h&&(x-px)**2+(y-py)**2<=R*R+1)m.explored[y*m.w+x]=1;
  const rm=m.rooms.find(r=>px>=r.x&&px<r.x+r.w&&py>=r.y&&py<r.y+r.h);if(rm){revealRoom(m,rm);if(!S().run.visited[rm.id]){G.visitRoom(rm.id);if(rm.t==='camp')toast('🔥 모닥불이 있다. 말을 걸면 쉬거나 귀환할 수 있다.');}}return rm;}
// 바닥·벽 그리기
function paintDungeon(m){const c=document.createElement('canvas');c.width=m.w*T;c.height=m.h*T;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const ts=m.ts,ss=IMG.t_ss16;const dg=m.dg;const fl=(X,Y)=>X>=0&&Y>=0&&X<m.w&&Y<m.h&&dg.cells[Y*m.w+X];
  const tile=(im,tx,ty,dx,dy)=>x.drawImage(im,tx*16,ty*16,16,16,dx,dy,16,16);
  const th=m.theme;
  if(m.outdoor){const wallC={forest:'#24461f',camp:'#2c4a24',waste:'#6a5a42',mist:'#3a4a44'}[th];x.fillStyle=wallC;x.fillRect(0,0,c.width,c.height);
    for(let Y=0;Y<m.h;Y++)for(let X=0;X<m.w;X++){if(!fl(X,Y))continue;const h=(X*73856093^Y*19349663)>>>0;const dx=X*T,dy=Y*T;
      if(th==='forest'||th==='mist'){const p=[[2,1],[2,1],[2,1],[2,2],[3,2],[5,2],[3,3]][h%7];tile(ss,p[0],p[1],dx,dy);}
      else if(th==='camp'){x.fillStyle=h%5?'#d89c68':'#cf9460';x.fillRect(dx,dy,T,T);if(h%4===0){x.fillStyle='#b8805a';x.fillRect(dx+(h%11),dy+(h%9)+3,2,1);}}
      else{tile(ss,...[[5,1],[7,1],[8,1],[9,1]][h%4],dx,dy);}}
    if(th==='mist'){x.fillStyle='rgba(200,215,215,.22)';x.fillRect(0,0,c.width,c.height);}
    // 풀숲 가장자리 그림자
    for(let Y=0;Y<m.h;Y++)for(let X=0;X<m.w;X++)if(fl(X,Y)&&!fl(X,Y-1)){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(X*T,Y*T,T,4);}
    m.bg=c;return;}
  const FL=[[6,0],[7,0],[8,0],[9,0],[6,1],[7,1],[8,1],[9,1],[6,2],[7,2],[8,2],[9,2],[0,6],[1,6],[2,6],[3,6],[0,7],[1,7]];
  for(let Y=0;Y<m.h;Y++)for(let X=0;X<m.w;X++){const dx=X*T,dy=Y*T;const h=(X*73856093^Y*19349663)>>>0;
    if(fl(X,Y)){const p=FL[h%FL.length];tile(ts,p[0],p[1],dx,dy);if(!fl(X,Y-1)){x.fillStyle='rgba(0,0,0,.32)';x.fillRect(dx,dy,T,5);x.fillStyle='rgba(0,0,0,.15)';x.fillRect(dx,dy+5,T,3);}continue;}
    tile(ts,8,7,dx,dy);// 어둠
    if(fl(X,Y+1)){tile(ts,1+(X%4),0,dx,dy);continue;}// 벽 앞면
    if(fl(X+1,Y))x.drawImage(ts,9,16,7,16,dx+9,dy,7,16);
    if(fl(X-1,Y))x.drawImage(ts,5*16,16,7,16,dx,dy,7,16);
    if(fl(X,Y-1))x.drawImage(ts,16,4*16,16,8,dx,dy,16,8);}
  // 테마 장식 (수정·물길·용암)
  for(const rm of dg.rooms){const h=rm.id*97;if(th==='crystal'&&rm.t!=='boss'){for(let i=0;i<3;i++){const X=rm.x+(h*(i+3))%rm.w,Y=rm.y+((h>>2)*(i+1))%rm.h;x.fillStyle=i%2?'#6ad0ff':'#b07aff';x.globalAlpha=.75;x.beginPath();x.moveTo(X*T+4,Y*T+14);x.lineTo(X*T+8,Y*T+2);x.lineTo(X*T+12,Y*T+14);x.fill();x.globalAlpha=1;}}
    if(th==='sewer'&&rm.w>6){const Y=rm.y+(rm.h>>1)+1;x.fillStyle='rgba(60,120,90,.7)';x.fillRect(rm.x*T,Y*T+4,rm.w*T,8);}
    if(th==='volcano'){x.fillStyle='rgba(255,110,40,.55)';for(let i=0;i<4;i++)x.fillRect((rm.x+(h*(i+2))%rm.w)*T,(rm.y+((h>>3)*(i+1))%rm.h)*T+7,10,2);}}
  m.bg=c;}
// 갱신
function updDungeon(dt){const m=MAP;if(!m||m.kind!=='dg')return;walkT+=dt;const r=S().run;if(!r)return;
  let kx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),ky=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  const busy=uiBusy();
  if((kx||ky)&&!busy){player.path=[];player.goal=null;const sp=80*dt/Math.hypot(kx,ky);const nx=player.x+kx*sp,ny=player.y+ky*sp;
    if(!isBlocked(m,Math.floor((nx+(kx>0?4:-4))/T),Math.floor(player.y/T)))player.x=nx;if(!isBlocked(m,Math.floor(player.x/T),Math.floor((ny+(ky>0?4:-4))/T)))player.y=ny;
    if(kx)player.face=kx;player.anim='walk';}
  else if(!busy){player.speed=80;const mv=moveAlong(player,dt);if(!mv&&player.goal){const g=player.goal;player.goal=null;dgInteract(g);}}
  else player.anim='idle';
  player.t+=dt;
  // 따라오는 동료
  const tr=player.trail;if(!tr.length||Math.hypot(tr[0][0]-player.x,tr[0][1]-player.y)>3)tr.unshift([player.x,player.y,player.face]);if(tr.length>120)tr.length=120;
  m.followers.forEach((f,i)=>{const p=tr[Math.min(tr.length-1,(i+1)*5)]||[player.x,player.y,1];const dx=p[0]-f.x,dy=p[1]-f.y,d=Math.hypot(dx,dy);f.t+=dt;
    if(d>1.5){f.x+=dx*Math.min(1,dt*9);f.y+=dy*Math.min(1,dt*9);f.anim='walk';if(Math.abs(dx)>.3)f.face=dx>0?1:-1;}else f.anim='idle';});
  const px=Math.floor(player.x/T),py=Math.floor(player.y/T);
  if(!busy){const rm=revealAround(m);r.pos={x:px,y:py};
    // 함정
    for(const tp of m.traps){const dd=Math.max(Math.abs(tp.x-px),Math.abs(tp.y-py));
      if(!tp.checked&&dd<=3){tp.checked=true;if(G.trapDetect()){tp.st=1;r.trapSt[tp.id]=1;m.blk[tp.y*m.w+tp.x]=1;toast('⚠ 단장이 함정을 발견했다! (누르면 해체)');player.path=player.path.filter(p=>!(p[0]===tp.x&&p[1]===tp.y));}}
      if(tp.st===0&&tp.x===px&&tp.y===py){tp.st=2;tp.fx=0;r.trapSt[tp.id]=2;G.trapHit();sfx('hit',.4);toast('💥 함정이 발동했다! 파티가 피해를 입었다.');renderDparty();}}
    // 몬스터
    for(const mb of m.mobs){mb.t+=dt;if(!mb.path.length){mb.wait-=dt;if(mb.wait<=0&&!mb.boss){mb.wait=rnd(1.5,4);const rm2=mb.room;const tx=ri(rm2.x+1,rm2.x+rm2.w-2),ty=ri(rm2.y+1,rm2.y+rm2.h-2);if(Math.abs(tx*T-mb.hx)<T*2.5&&Math.abs(ty*T-mb.hy)<T*2)mb.path=[[tx,ty]];}mb.anim='idle';}else moveAlong(mb,dt);
      if(Math.hypot(mb.x-player.x,mb.y-player.y)<(mb.boss?20:13)){encounter(mb);break;}}}
  if(m.followers)for(const f of m.followers){}
  const base=clamp(Math.min(W/(22*T),H/(14*T)),2,3.8);cam.tz=base*userZoom;cam.z+=(cam.tz-cam.z)*Math.min(1,dt*8);
  cam.x+=(player.x-cam.x)*Math.min(1,dt*6);cam.y+=(player.y-cam.y)*Math.min(1,dt*6);}
// 그리기
const DPROP={bones:[8,6],skull:[7,7],web:[4,6],rock:[9,4],rubble:[9,5]};
const DPROP2={barrel2:[0,0,29,41],barrel3:[31,0,29,41],bust1:[62,0,21,27],bust2:[85,0,19,27],bust3:[106,0,21,26],banr:[129,0,23,30],banb:[154,0,23,30],banr2:[179,0,23,30],skull:[229,0,26,27],skull2:[257,0,27,25],rack1:[286,0,24,33],rack2:[312,0,32,33],rack3:[346,0,32,37],shelf1:[380,0,45,43],shelf2:[427,0,45,44],shelf3:[474,0,45,45],dskull:[521,0,34,43],sacks:[698,0,24,31]};
function drawDObj(c,o){const t=walkT;const ts=MAP.ts;
  if(o.t==='dprop'){if(MAP.outdoor){const k={barrel:'bush',box:'rock',web:null,candle:null,rock:'rock',rubble:null,bones:'bones',skull:'skull'}[o.k];
      if(k==='bush'||k==='rock'){const p=PROP[k];c.drawImage(IMG[p.im],p.r[0],p.r[1],p.r[2],p.r[3],o.x*T-8,o.y*T-16,32,32);return;}
      if(k==='bones'||k==='skull'){const s=DPROP[k];c.drawImage(IMG.dg_ruin,s[0]*16,s[1]*16,16,16,o.x*T,o.y*T,16,16);return;}
      if(o.k==='candle'||o.k==='web'){const im=IMG.el_mushred;if(im)c.drawImage(im,0,0,im.width/4,im.height,o.x*T,o.y*T,im.width/4,im.height);}return;}
    if((o.big||o.wall)&&DPROP2[o.k]&&IMG.dg_props){const r=DPROP2[o.k];const w=Math.round(r[2]*.55),h=Math.round(r[3]*.55);
      if(o.wall)c.drawImage(IMG.dg_props,r[0],r[1],r[2],r[3],o.x*T+8-w/2,o.y*T+1,w,h);else c.drawImage(IMG.dg_props,r[0],r[1],r[2],r[3],o.x*T+8-w/2,(o.y+1)*T-h,w,h);return;}
    if(o.k==='barrel'){c.drawImage(IMG.t_camp,64,80,16,16,o.x*T,o.y*T,16,16);return;}
    if(o.k==='box'){c.drawImage(IMG.dg_box,0,0,16,16,o.x*T,o.y*T,16,16);return;}
    if(o.k==='candle'){const im=IMG.dg_candle;const f=Math.floor(t*8)%4;c.drawImage(im,f*16,0,16,16,o.x*T,o.y*T-2,16,16);return;}
    const s=DPROP[o.k];if(s)c.drawImage(ts,s[0]*16,s[1]*16,16,16,o.x*T,o.y*T,16,16);return;}
  if(o.t==='dtorch'){const im=IMG.dg_torch;const f=Math.floor(t*8+o.ph)%4;c.drawImage(im,f*16,0,16,16,o.x*T,o.y*T+2,16,16);return;}
  if(o.t==='dexit'){c.drawImage(ts,9*16,3*16,16,16,o.x*T,o.y*T,16,16);c.fillStyle='rgba(255,230,140,'+(.25+.15*Math.sin(t*4))+')';c.fillRect(o.x*T+2,o.y*T+2,12,12);return;}
  if(o.t==='dchest'){const im=IMG.dg_chest;const f=o.open?7:Math.floor(t*3)%4;c.drawImage(im,f*16,0,16,16,o.x*T,o.y*T,16,16);return;}
  if(o.t==='dflag'){const im=IMG.dg_flag;const f=Math.floor(t*6)%4;c.drawImage(im,f*16,0,16,16,o.x*T,o.y*T+4,16,16);return;}
  drawObj(c,o);}
function renderDungeon(){const m=MAP;if(!m||!m.bg)return;const z=cam.z;const r=S().run;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=m.outdoor?'#1c2a18':'#0e0a0c';ctx.fillRect(0,0,W,H);
  const hw=W/2/z,hh=H/2/z;
  ctx.setTransform(DPR*z,0,0,DPR*z,DPR*(W/2-cam.x*z),DPR*(H/2-cam.y*z));ctx.imageSmoothingEnabled=false;ctx.drawImage(m.bg,0,0);
  // 함정
  for(const tp of m.traps){if(tp.st===0)continue;const im=IMG.dg_peaks;let f=tp.st===1?0:3;if(tp.fx!=null&&tp.fx<.5){tp.fx+=1/60;f=Math.min(3,Math.floor(tp.fx*10));}
    ctx.drawImage(im,f*16,0,16,16,tp.x*T,tp.y*T,16,16);if(tp.st===1){ctx.strokeStyle='rgba(255,200,60,'+(.5+.3*Math.sin(walkT*5))+')';ctx.strokeRect(tp.x*T+.5,tp.y*T+.5,15,15);}}
  const list=[];for(const o of m.objs)list.push([o.base,0,o]);for(const e of m.npcs)list.push([e.y,1,e]);for(const mb of m.mobs)list.push([mb.y,2,mb]);for(const f of m.followers||[])list.push([f.y,3,f]);list.push([player.y,1,player]);
  list.sort((a,b)=>a[0]-b[0]);
  for(const [_,k,o] of list){if(k===0)drawDObj(ctx,o);else if(k===1)drawWalker(ctx,o);
    else if(k===3){shadow(ctx,o.x,o.y+1,5);drawAny(ctx,o.desc,o.anim,o.t,o.x,o.y+1,1,o.face<0);}
    else{const sc=o.sc;shadow(ctx,o.x,o.y+1,7*sc);if(o.boss||o.elite){ctx.fillStyle=o.boss?'rgba(200,40,40,.25)':'rgba(255,140,40,.2)';ctx.beginPath();ctx.ellipse(o.x,o.y+1,12*sc,5*sc,0,0,Math.PI*2);ctx.fill();}
      const s2=o.desc.kind==='boss'?sc*.55:o.desc.kind==='rpg'?sc*.95:sc;drawAny(ctx,o.desc,o.anim,o.t,o.x,o.y+1,s2,o.face<0);}}
  // 안개 (안 가 본 곳)
  const x0=Math.max(0,Math.floor((cam.x-hw)/T)),x1=Math.min(m.w-1,Math.ceil((cam.x+hw)/T)),y0=Math.max(0,Math.floor((cam.y-hh)/T)),y1=Math.min(m.h-1,Math.ceil((cam.y+hh)/T));
  ctx.fillStyle=m.outdoor?'#16220f':'#07050a';for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(!m.explored[y*m.w+x])ctx.fillRect(x*T-.5,y*T-.5,T+1,T+1);
  // 빛
  const dark={forest:.18,camp:.12,waste:.05,mist:.3,cave:.72,crystal:.6,sewer:.7,abyss:.75,volcano:.5}[m.theme]??.62;
  if(dark>.08){const lc=lightCanvas();const lx=lc.getContext('2d');lx.setTransform(1,0,0,1,0,0);lx.clearRect(0,0,lc.width,lc.height);lx.fillStyle=`rgba(0,0,0,${dark})`;lx.fillRect(0,0,lc.width,lc.height);
    lx.globalCompositeOperation='destination-out';const sx=wx=>(wx-cam.x)*z+W/2,sy=wy=>(wy-cam.y)*z+H/2;
    const lights=[[player.x,player.y-6,m.outdoor?150:105],...m.lit];
    for(const [wx,wy,rad] of lights){const X=sx(wx),Y=sy(wy),R=rad*z*(1+.03*Math.sin(walkT*7+wx));if(X<-R||X>W+R||Y<-R||Y>H+R)continue;const g=lx.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.55,'rgba(0,0,0,.75)');g.addColorStop(1,'rgba(0,0,0,0)');lx.fillStyle=g;lx.fillRect(X-R,Y-R,R*2,R*2);}
    lx.globalCompositeOperation='source-over';ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(lc,0,0,W*DPR,H*DPR);}
  // 이름표
  ctx.setTransform(DPR,0,0,DPR,0,0);const sx=wx=>(wx-cam.x)*z+W/2,sy=wy=>(wy-cam.y)*z+H/2;ctx.font='12px Galmuri11,"Malgun Gothic",sans-serif';ctx.textAlign='center';
  for(const o of m.objs)if(o.name&&m.explored[o.y*m.w+o.x]){const X=sx((o.x+.5)*T),Y=sy(o.y*T)-8;const tw=ctx.measureText(o.name).width+12;ctx.fillStyle='rgba(20,12,8,.8)';roundRect(ctx,X-tw/2,Y-14,tw,17,5);ctx.fill();ctx.fillStyle=o.act==='dfire'?'#ffd38a':'#fff3dc';ctx.fillText(o.name,X,Y-1);}
  for(const e of m.npcs){if(!m.explored[Math.floor(e.y/T)*m.w+Math.floor(e.x/T)])continue;const X=sx(e.x),Y=sy(e.y-22);ctx.fillStyle='rgba(20,12,8,.8)';const tw=ctx.measureText(e.name).width+12;roundRect(ctx,X-tw/2,Y-14,tw,17,5);ctx.fill();ctx.fillStyle='#ffe28a';ctx.fillText(e.name,X,Y-1);}
  for(const mb of m.mobs){if(!m.explored[Math.floor(mb.y/T)*m.w+Math.floor(mb.x/T)])continue;const X=sx(mb.x),Y=sy(mb.y-(mb.boss?40:mb.elite?26:20));const n=(mb.boss?'👑 ':mb.elite?'💀 ':'')+mb.name;const tw=ctx.measureText(n).width+12;
    ctx.fillStyle=mb.boss?'rgba(110,20,20,.85)':'rgba(60,16,16,.75)';roundRect(ctx,X-tw/2,Y-14,tw,17,5);ctx.fill();ctx.fillStyle=mb.boss?'#ffb0a0':'#ffd8c8';ctx.fillText(n,X,Y-1);}
  ctx.textAlign='left';
  if(player.path.length){}
  drawMinimap();}
let _lc=null;function lightCanvas(){if(!_lc)_lc=document.createElement('canvas');if(_lc.width!==Math.round(W)||_lc.height!==Math.round(H)){_lc.width=Math.round(W);_lc.height=Math.round(H);}return _lc;}
function drawMinimap(){const m=MAP;const s=Math.max(2,Math.min(4,Math.floor(Math.min(W*.24/m.w,H*.22/m.h))));const mw=m.w*s,mh=m.h*s;const X0=W-mw-10,Y0=W<700?118:96;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='rgba(15,10,6,.72)';roundRect(ctx,X0-5,Y0-5,mw+10,mh+10,6);ctx.fill();ctx.strokeStyle='#c8955a';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='rgba(220,200,170,.55)';for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.explored[y*m.w+x]&&m.dg.cells[y*m.w+x])ctx.fillRect(X0+x*s,Y0+y*s,s,s);
  const ic={camp:'#ff9a3a',chest:'#ffd84a',shop:'#7fd06a',boss:'#ff4a4a',start:'#8fd0ff'};
  for(const rm of m.rooms){if(!m.explored[rm.cy*m.w+rm.cx])continue;let col=ic[rm.t];if((rm.t==='battle'||rm.t==='elite')&&!S().run.cleared[rm.id])col='#e06050';if(rm.t==='chest'&&S().run.used[rm.id])col=null;if(col){ctx.fillStyle=col;ctx.fillRect(X0+rm.cx*s-1,Y0+rm.cy*s-1,s+2,s+2);}}
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(X0+player.x/T*s,Y0+player.y/T*s,s*.9+1,0,Math.PI*2);ctx.fill();}
// 조작
function dgTap(px,py){if(uiBusy())return;const m=MAP;const [wx,wy]=screenToWorld(px,py);const sx=Math.floor(player.x/T),sy=Math.floor(player.y/T);
  let best=null,bd=18;for(const e of m.npcs){const d=Math.hypot(e.x-wx,e.y-8-wy);if(d<bd){bd=d;best={npc:e};}}
  for(const mb of m.mobs){const d=Math.hypot(mb.x-wx,mb.y-8-wy);if(d<bd*(mb.boss?2:1)){bd=d;best={mob:mb};}}
  if(!best)for(const o of m.objs)if(o.act&&Math.abs(wx-(o.x+.5)*T)<14&&Math.abs(wy-(o.y+.4)*T)<16)best={obj:o};
  if(!best)for(const tp of m.traps)if(tp.st===1&&Math.floor(wx/T)===tp.x&&Math.floor(wy/T)===tp.y)best={trap:tp};
  if(best){let tx,ty;if(best.npc){tx=Math.floor(best.npc.x/T);ty=Math.floor(best.npc.y/T)+1;}else if(best.mob){tx=Math.floor(best.mob.x/T);ty=Math.floor(best.mob.y/T);}else if(best.trap){tx=best.trap.x;ty=best.trap.y;}else{tx=best.obj.x;ty=best.obj.y+1;}
    const p=findPath(m,sx,sy,tx,ty);player.goal=best;if(p){p.shift();if(best.trap&&p.length)p.pop();player.path=p;}if(!player.path.length){player.goal=null;dgInteract(best);}return;}
  const tx=Math.floor(wx/T),ty=Math.floor(wy/T);const p=findPath(m,sx,sy,tx,ty);if(p){p.shift();player.path=p;player.goal=null;}}
function dgInteract(g){const r=S().run;
  if(g.npc&&g.npc.kind==='merchant')return dgShop(g.npc.room);
  if(g.trap){const v=G.trapDisarm();g.trap.st=2;r.trapSt[g.trap.id]=2;MAP.blk[g.trap.y*MAP.w+g.trap.x]=0;sfx('coin',.3);toast('🔧 함정 해체! +'+fmt(v)+' G');renderDparty();return;}
  const o=g.obj;if(!o)return;
  if(o.act==='dexit')return confirmBox('입구로 나가 귀환하시겠습니까?<br><span class="sub">지금까지 얻은 전리품을 모두 가지고 돌아갑니다. 하루가 지나고 급여가 나갑니다.</span>',()=>finishRun('retreat'));
  if(o.act==='dchest'){if(o.open||r.used[o.room])return toast('빈 상자다.');o.open=true;r.used[o.room]=1;const ev=G.nodeEvent({t:'chest'});sfx('coin',.4);
    let h=`<p>상자를 열었다! <b class="gold">💰 ${fmt(ev.gold)} G</b></p>`+(ev.item?`<p>장비 발견: ${itemLine(ev.item)}</p>`:'');openPanelRaw('🎁 보물 상자',h+'<div class="row" style="justify-content:flex-end"><button class="go" id="okC">확인</button></div>',true);$('okC').onclick=()=>{closePanel();renderDparty();};return;}
  if(o.act==='dfire')return dgFire(o);}
function dgFire(o){const r=S().run;const used=r.used['f'+o.room];
  const ms=G.partyUnits().filter(u=>u!==S().leader&&u.hp>0);const talker=ms.length?pick(ms):null;
  let h=`<p>타닥타닥 모닥불이 타오른다.${talker?` <b>${talker.name}</b>: "${G.mercLine(talker,'fire')}"`:''}</p>`;
  if(!used)h+=`<div class="col"><button class="go" id="fRest">🔥 쉬기 — HP 35% 회복, 쓰러진 동료를 25%로 일으킴</button><button id="fTrain">⚔ 훈련하기 — 파티 경험치 획득</button></div>`;else h+='<p class="sub">이미 이 모닥불에서 쉬었다.</p>';
  h+=`<div class="row" style="justify-content:space-between;margin-top:10px"><button class="warn" id="fRet">⟲ 여기서 귀환하기</button><button id="fGo">계속 탐험 ▶</button></div>`;
  openPanelRaw('🔥 모닥불',h,true);
  if($('fRest'))$('fRest').onclick=()=>{G.campRest('rest');r.used['f'+o.room]=1;sfx('levelup',.3);toast('푹 쉬었다. HP가 회복되었다.');closePanel();renderDparty();};
  if($('fTrain'))$('fTrain').onclick=()=>{const x=G.campRest('train');r.used['f'+o.room]=1;toast('훈련으로 경험치 +'+x);closePanel();renderDparty();};
  $('fGo').onclick=()=>closePanel();$('fRet').onclick=()=>{closePanel();finishRun('retreat');};}
function dgShop(roomId){const r=S().run;const d=D.DUNG[r.dk];MAP.shopItems=MAP.shopItems||{};const ev=MAP.shopItems[roomId]||(MAP.shopItems[roomId]=G.nodeEvent({t:'shop'}));
  let h='<p>"물건 좀 보고 가쇼. 던전 안이라 좀 비싸."</p><div class="col">';const pm=1.2;
  for(const k of ['potion','hipotion','feather']){const c=D.CONSUM[k];const pr=Math.round(D.priceRef(d.lv[1])*c.price*pm/10)*10;h+=`<div class="itemrow">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} <small>보유 ${S().cons[k]||0}</small></div><div class="st">${c.d}</div></div><span class="price">${fmt(pr)} G</span><button data-buyc="${k}" data-p="${pr}">사기</button></div>`;}
  ev.items.forEach((it,i)=>{if(it.sold)return;h+=`<div class="itemrow">${itemLine(it)}<span style="flex:1"></span><span class="price">${fmt(it.price)} G</span><button data-buyi="${i}">사기</button></div>`;});
  openPanelRaw('🛒 떠돌이 상인',h+'</div>');
  $('pBody').querySelectorAll('[data-buyc]').forEach(b=>b.onclick=()=>{const p=+b.dataset.p;if(S().gold<p)return toast('금화가 부족합니다');G.addGold(-p);S().cons[b.dataset.buyc]=(S().cons[b.dataset.buyc]||0)+1;sfx('coin',.3);hudRefresh();renderDparty();dgShop(roomId);});
  $('pBody').querySelectorAll('[data-buyi]').forEach(b=>b.onclick=()=>{const it=ev.items[+b.dataset.buyi];if(S().gold<it.price)return toast('금화가 부족합니다');G.addGold(-it.price);G.addItem(it);it.sold=true;sfx('coin',.3);hudRefresh();dgShop(roomId);});}
function encounter(mb){const r=S().run;const d=D.DUNG[r.dk];player.path=[];player.goal=null;keys.clear();const rm=mb.room;
  const go=()=>fadeTo(()=>{hideDmap();startBattle(mb.en,`${d.n} · ${rm.t==='boss'?'보스':rm.t==='elite'?'정예':'전투'}`,d.theme,b=>afterFight(b,rm,mb));});
  if(rm.t==='boss')say(bossLines(d,mb.en),go);else{sfx('slash',.3);go();}}
function afterFight(b,rm,mb){const r=S().run;const out=G.afterBattle(b,rm);
  if(!out.win){finishRun('wipe');return;}
  r.cleared[rm.id]=1;
  if(rm.t==='boss'){finishRun('clear');return;}
  MAP.mobs=MAP.mobs.filter(x=>x!==mb);scene='dg';showDmap();
  // 동료 위치 다시
  for(const f of MAP.followers)f.x=player.x,f.y=player.y;MAP.followers=G.partyUnits().filter(u=>u!==S().leader).map((u,i)=>({u,desc:unitDesc(u),x:player.x,y:player.y,t:0,anim:'idle',face:1}));
  toast(`⚔ 승리! 💰 +${fmt(out.gold)} G · 경험치 +${fmt(out.exp)} · 명성 +${out.fame}`);
  if(out.items.length)toast('🎁 장비 획득: '+out.items.map(i=>i.name).join(', '));
  if(out.lvups.length){toast('⬆ 레벨 업: '+out.lvups.join(', '));sfx('levelup',.4);}
  const fallen=b.units.filter(u=>u.side===0&&u.hp<=0&&!u.isL);if(fallen.length)toast('💫 쓰러진 동료: '+fallen.map(u=>u.name+' (누적 '+u.ref.falls+'회)').join(', '),'');
  if(S().leader.pts>0)toast(`능력치 포인트 ${S().leader.pts}점 — 용병단 → 단장`);
  G.save();}
function showDmap(){const r=S().run;const d=D.DUNG[r.dk];$('dmap').classList.remove('hidden');$('goal').classList.add('hidden');$('guide').classList.add('hidden');$('hud').classList.remove('hidden');$('dmName').innerHTML=`${d.n} <small class="sub">Lv.${d.lv[0]}~${d.lv[1]} · ${D.THEME[d.theme].n}</small>`;hudRefresh();renderDparty();bgmTick();}
function hideDmap(){$('dmap').classList.add('hidden');}
function renderDparty(){const r=S().run;if(!r)return;const lt=r.loot;const tro=Object.values(lt.tro).reduce((a,b)=>a+b,0);
  $('dmLoot').innerHTML=`💰 ${fmt(lt.gold)} G · 전리품 ${tro} · 장비 ${lt.items.length} · 처치 ${Object.values(r.kills).reduce((a,b)=>a+b,0)}`;
  $('dmParty').innerHTML=G.partyUnits().map(u=>{const st=G.statsOf(u);const hp=Math.max(0,u.hp??st.hp);return `<div class="pm ${hp<=0?'dim':''}"><img class="spr" src="${portrait(unitDesc(u),28,'pm_'+(u.id||'L')+(u.cls||u.job))}" width="28" height="28"><div><b>${u===S().leader?'★ ':''}${u.name}</b> <small>Lv${u.lv}</small><div class="bar"><i style="width:${hp/st.hp*100}%;background:${hp<=0?'#666':hp/st.hp<.35?'#e05040':'#5ad04a'}"></i></div><small>${hp<=0?'쓰러짐':fmt(hp)+'/'+fmt(st.hp)}</small></div></div>`;}).join('');
  const pc=(S().cons.potion||0)+(S().cons.hipotion||0)+(S().cons.feather||0);$('dmPot').textContent='🧪 물약 '+pc;}
$('dmPot').onclick=()=>{const s=S();let h='<div class="col">';for(const k of ['potion','hipotion','feather']){const c=D.CONSUM[k];h+=`<div class="itemrow">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} ×${s.cons[k]||0}</div><div class="st">${c.d}</div></div><button data-k="${k}" ${s.cons[k]>0?'':'disabled'}>사용</button></div>`;}
  openPanelRaw('물약 사용',h+'</div>');$('pBody').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{const e=G.useConsumable(b.dataset.k);if(e)toast(e);else{sfx('levelup',.25);toast(D.CONSUM[b.dataset.k].n+' 사용!');}closePanel();renderDparty();});};
function bossLines(d,en){const b=en[0];const L={b_slime:'부글부글... 거대한 슬라임이 길을 막고 있다!',b_wolf:'아우우우— 잿빛 갈기가 이빨을 드러낸다.',b_bark:'"감히 바르크 님의 야영지에 발을 들여?"',b_toad:'개굴... 독기를 내뿜는 거대한 두꺼비다!',b_gchief:'"그룩! 인간! 짓밟는다!"',b_cyclops:'수정이 박힌 외눈이 번뜩인다.',
  b_smug:'"렉스 님의 장사를 방해하다니. 바다에 처넣어 주마."',b_kraken:'난파선 아래에서 거대한 촉수가 솟구친다!',b_wraith:'"...이 신전의... 비밀은... 넘겨주지 않는다..."',b_ratking:'찍찍! 하수로의 왕이 부하들을 부른다.',b_warlordorc:'"추방자에게 법은 없다! 고르마가 법이다!"',b_fallen:'"황실의 개들이여... 기사의 맹세는 이미 썩었다."',
  b_ancient:'유적 깊은 곳에서 거대한 눈이 떠졌다.',b_mistwyrm:'안개 속에서 비룡의 울음소리가 울린다.',b_dragon:'"작은 것들이 감히 이그니스의 둥지에!"',b_abyss:'"발테르의 계약은 이행되었다. 이제 이 대륙은 심연의 것이다."'}[d.boss]||'강한 적이 나타났다!';
  const out=[[b.name,L]];if(d.boss2)out.unshift(['배신자 발테르','"철혈 맹약단의 생존자... 네 아비처럼 여기서 끝내 주마!"']);return out;}
function summarizeTro(list){const c={};for(const t of list)c[t]=(c[t]||0)+1;return Object.entries(c).map(([t,n])=>D.TROPHY[t].n+'×'+n).join(', ');}
function itemLine(it){const R=D.RARITY[it.rar];return `<span class="itemrow" style="display:inline-flex;margin:2px">${icon(it.ic,24)}<span><span class="nm" style="color:${shade(R.c,-.35)}">${it.name}${it.enh?' +'+it.enh:''}</span> <small>${R.n} · Lv${it.lv}${it.slot==='wpn'?(G.H2.includes(it.cls)?' · 두손':' · 한손'):it.slot==='off'?' · 보조':''}</small><br><span class="st">${statStr(it)}</span></span></span>`;}
const STN={hp:'HP',atk:'공격',mag:'마력',def:'방어',spd:'속도',crit:'치명',eva:'회피'};
function statStr(it){const m=1+.08*(it.enh||0);return Object.entries(it.st).map(([k,v])=>STN[k]+' '+(v>0?'+':'')+(k==='spd'||k==='crit'||k==='eva'?v:Math.round(v*m))).join(' · ')+(it.set?` <span style="color:#2a8a3a;font-weight:700">[${D.SETS[it.set].n} 세트] ${D.SETS[it.set].d}</span>`:'');}
function finishRun(how){const r=S().run;const dk=r.dk;const res=G.endRun(how);hideDmap();scene='dmap';hideBattleUI();MAP=null;
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
  if(res.dailyDone&&res.dailyDone.length||res.daily&&res.daily.length){const ds=[...(res.daily||[]),...(res.dailyDone||[])];h+=`<p class="good">📜 주간 의뢰 완료: ${ds.map(q=>q.n+' (+'+fmt(q.gold)+' G)').join(', ')}</p>`;}
  if(res.subs.length)h+=`<p class="good">❗ 의뢰 달성: ${res.subs.map(k=>D.SUBS[k].n).join(', ')} — 의뢰인에게 보고하세요.</p>`;
  if(res.main)h+=`<p class="good">★ 메인 퀘스트 「${res.main.n}」 완료!</p>`;
  h+=`<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="go" id="rOk">확인</button></div>`;
  sfx(how==='wipe'?'lose':'coin',.4);
  const back=S().loc;openPanelRaw(how==='wipe'?'귀환 — 전멸':'탐험 결과 · '+G.calStr(S().day-1,true),h,true);
  $('rOk').onclick=()=>{closePanel();fadeTo(()=>{enterWalk(back==='camp'?'camp':back,null);});};}

/* ================= 월드맵 ================= */
const WPOS={camp:[.2,.62],t1:[.36,.4],t2:[.55,.2],t3:[.87,.55],t4:[.56,.72],abyss:[.86,.18],t5:[.12,.2],t6:[.3,.88]};
let worldImg=null;
// 월드맵: 월드맵 요소(tileset·mountains·water) + 절벽 섬 + 구름
function worldArt(){if(worldImg)return worldImg;const w=480,h=300;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const TS=IMG.w_tiles,MT=IMG.w_mount,WA=IMG.w_water;let sd=7;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  // 바다
  if(WA){for(let j=0;j<h;j+=32)for(let i=0;i<w;i+=32)x.drawImage(WA,0,0,32,32,i,j,32,32);x.fillStyle='rgba(70,180,235,.5)';x.fillRect(0,0,w,h);}else{x.fillStyle='#32b8e8';x.fillRect(0,0,w,h);}
  // 땅 모양 (가면): 본섬 + 작은 섬들
  const m=document.createElement('canvas');m.width=w;m.height=h;const mx=m.getContext('2d');mx.fillStyle='#000';
  const blob=(cx,cy,rx,ry,n,j)=>{mx.beginPath();for(let i=0;i<=n;i++){const t=i/n*Math.PI*2,r=1+(R()-.5)*j;const px=cx+Math.cos(t)*rx*r,py=cy+Math.sin(t)*ry*r;i?mx.lineTo(px,py):mx.moveTo(px,py);}mx.closePath();mx.fill();};
  blob(240,150,190,110,28,.22);blob(120,200,90,60,14,.25);blob(360,90,90,60,14,.25);blob(250,235,110,45,14,.2);
  blob(440,250,26,18,10,.3);blob(30,40,22,14,8,.3);blob(455,40,18,12,8,.3);blob(40,268,20,13,8,.3);
  // 픽셀 단위로 정리
  const md=mx.getImageData(0,0,w,h).data;const land=(i,j)=>i>=0&&j>=0&&i<w&&j<h&&md[(j*w+i)*4+3]>128;
  const L=x.getImageData(0,0,w,h),d=L.data;const put=(i,j,col)=>{const k=(j*w+i)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255;};
  // 거품 → 절벽 → 풀 테두리
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){if(land(i,j))continue;
    let cl=0;for(let k=1;k<=7;k++)if(land(i,j-k)){cl=k;break;}
    if(cl){put(i,j,cl<=1?[96,62,38]:cl<=5?((i>>2)%3===0?[150,96,58]:[176,116,72]):[120,78,48]);continue;}
    let near=false;for(let dj=-2;dj<=2&&!near;dj++)for(let di=-2;di<=2;di++)if(land(i+di,j+dj)){near=true;break;}
    if(near)put(i,j,[220,244,250]);}
  x.putImageData(L,0,0);
  // 땅 질감 (풀·모래·눈)
  const tex=(sx,sy)=>{const t=document.createElement('canvas');t.width=t.height=16;t.getContext('2d').drawImage(TS,sx,sy,16,16,0,0,16,16);return x.createPattern(t,'repeat');};
  {const lc=document.createElement('canvas');lc.width=w;lc.height=h;const lx=lc.getContext('2d');lx.drawImage(m,0,0);lx.globalCompositeOperation='source-in';lx.fillStyle=TS?tex(14,16):'#5a8a2c';lx.fillRect(0,0,w,h);x.drawImage(lc,0,0);}
  const region=(cx,cy,rx,ry,pat,n)=>{const r=document.createElement('canvas');r.width=w;r.height=h;const rx2=r.getContext('2d');rx2.fillStyle='#000';rx2.beginPath();
    for(let i=0;i<=n;i++){const t=i/n*Math.PI*2,k=1+(R()-.5)*.35;const px=cx+Math.cos(t)*rx*k,py=cy+Math.sin(t)*ry*k;i?rx2.lineTo(px,py):rx2.moveTo(px,py);}rx2.fill();
    rx2.globalCompositeOperation='destination-in';rx2.drawImage(m,0,0);rx2.globalCompositeOperation='source-in';rx2.fillStyle=pat;rx2.fillRect(0,0,w,h);
    x.save();x.globalAlpha=1;x.drawImage(r,0,0);x.restore();};
  if(TS){region(360,240,70,32,tex(166,14),14);region(265,60,60,30,tex(200,20),12);region(425,75,55,40,'#3a2a4a',12);}
  const P=k=>[Math.round(WPOS[k][0]*w),Math.round(WPOS[k][1]*h)];
  const st=(img,sx,sy,sw,sh,dx,dy,s)=>{if(img)x.drawImage(img,sx,sy,sw,sh,Math.round(dx-sw*(s||1)/2),Math.round(dy-sh*(s||1)),Math.round(sw*(s||1)),Math.round(sh*(s||1)));};
  // 강과 호수
  x.strokeStyle='#4ec8f0';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(232,82);x.bezierCurveTo(215,130,265,160,238,200);x.bezierCurveTo(222,228,250,250,236,262);x.stroke();
  x.strokeStyle='#a8ecff';x.lineWidth=1;x.stroke();x.lineCap='butt';
  x.fillStyle='#4ec8f0';x.beginPath();x.ellipse(150,180,14,8,0,0,Math.PI*2);x.fill();x.fillStyle='#a8ecff';x.fillRect(144,177,6,1);
  // 산맥 (광산 지역)
  if(MT){st(MT,105,15,81,69,200,72,.75);st(MT,9,15,81,68,255,60,.7);st(MT,0,96,64,64,310,70,.7);}
  // 숲
  const FO=[[3,165,42,40],[50,161,42,43]];const forests=[[95,140],[60,190],[140,230],[180,120],[300,175],[330,250],[120,95],[205,250],[355,140],[80,170],[110,250],[300,130],[165,265],[285,215],[70,120]];
  for(const [fx,fy] of forests){const f=FO[(fx+fy)%2];st(TS,...f,fx,fy,.6);}
  // 사막 모래언덕 · 화산 · 탑
  st(TS,160,296,54,19,350,245,.8);st(TS,160,296,54,19,395,232,.6);
  const [ax,ay]=P('abyss');st(TS,147,249,42,35,ax,ay+10,.9);
  const g=x.createRadialGradient(ax,ay-8,2,ax,ay-8,26);g.addColorStop(0,'rgba(40,10,60,.85)');g.addColorStop(1,'rgba(80,30,120,0)');x.fillStyle=g;x.beginPath();x.arc(ax,ay-8,26,0,Math.PI*2);x.fill();
  // 길 (점선 흙길)
  x.strokeStyle='#d8a56a';x.lineWidth=3;x.setLineDash([5,4]);x.beginPath();
  for(const [a,b] of [['camp','t1'],['t1','t2'],['t1','t4'],['t4','t3'],['t2','t3'],['t3','abyss'],['t1','t5'],['t4','t6'],['camp','t6']]){const [x0,y0]=P(a),[x1,y1]=P(b);const mx2=(x0+x1)/2+(y1-y0)*.15,my2=(y0+y1)/2-(x1-x0)*.08;x.moveTo(x0,y0);x.quadraticCurveTo(mx2,my2,x1,y1);}x.stroke();x.setLineDash([]);
  // 장소 그림
  {const [px,py]=P('camp');st(TS,1,254,26,20,px,py+6,1);}
  {const [px,py]=P('t1');for(const [k,dx2] of [['gable_3',-12],['blue2_1',8]]){const im=IMG['bld_'+k];if(im)x.drawImage(im,px+dx2-12,py+4-im.height/2,24,im.height/2);}}
  {const [px,py]=P('t2');st(TS,35,250,39,35,px,py+8,.8);}
  {const [px,py]=P('t3');x.fillStyle='#8a5a32';x.fillRect(px+8,py-2,16,3);x.fillRect(px+20,py-2,3,10);const im=IMG.bld_red_2;if(im)x.drawImage(im,px-16,py+4-im.height/2,26,im.height/2);}
  {const [px,py]=P('t4');st(TS,103,297,29,31,px,py+8,1.1);st(TS,146,294,11,35,px-20,py+6,.8);st(TS,146,294,11,35,px+20,py+6,.8);}
  // 구름
  const cloud=(cx,cy,s)=>{x.fillStyle='rgba(255,255,255,.95)';const bs=[[0,0,14],[12,-6,12],[24,0,13],[-12,3,10],[36,4,9]];
    for(const [ox,oy,r] of bs){x.beginPath();x.arc(cx+ox*s,cy+oy*s,r*s,0,Math.PI*2);x.fill();}
    x.fillStyle='rgba(200,225,240,.9)';x.fillRect(cx-20*s,cy+8*s,64*s,4*s);};
  for(const [cx,cy,s] of [[20,20,.9],[460,12,.8],[470,140,.7],[10,140,.6],[30,290,.8],[200,292,.7],[330,8,.6],[455,285,.9],[120,10,.5],[405,110,.45]])cloud(cx,cy,s);
  worldImg=c.toDataURL();return worldImg;}
let eastImg=null;
function eastArt(){if(eastImg)return eastImg;const w=480,h=300;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const N=IMG.nj_nature,DS=IMG.nj_desert,HS=IMG.nj_house,FL=IMG.nj_floor,FD=IMG.nj_fdet,WA=IMG.w_water;let sd=11;const R=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  if(WA){for(let j=0;j<h;j+=32)for(let i=0;i<w;i+=32)x.drawImage(WA,0,0,32,32,i,j,32,32);x.fillStyle='rgba(70,180,235,.5)';x.fillRect(0,0,w,h);}else{x.fillStyle='#32b8e8';x.fillRect(0,0,w,h);}
  // 섬 모양: 서쪽 사막 섬 + 동쪽 큰 섬(북 설원·남 가을) + 작은 섬
  const m=document.createElement('canvas');m.width=w;m.height=h;const mx=m.getContext('2d');mx.fillStyle='#000';
  const blob=(cx,cy,rx,ry,n,j)=>{mx.beginPath();for(let i=0;i<=n;i++){const t=i/n*Math.PI*2,r=1+(R()-.5)*j;const px=cx+Math.cos(t)*rx*r,py=cy+Math.sin(t)*ry*r;i?mx.lineTo(px,py):mx.moveTo(px,py);}mx.closePath();mx.fill();};
  blob(150,165,88,98,22,.22);blob(345,150,105,112,24,.2);blob(250,150,30,40,10,.2);blob(440,262,20,14,8,.3);blob(60,40,18,12,8,.3);blob(230,272,22,12,8,.3);
  const md=mx.getImageData(0,0,w,h).data;const land=(i,j)=>i>=0&&j>=0&&i<w&&j<h&&md[(j*w+i)*4+3]>128;
  const L=x.getImageData(0,0,w,h),d=L.data;const put=(i,j,col)=>{const k=(j*w+i)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255;};
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){if(land(i,j))continue;let cl=0;for(let k=1;k<=6;k++)if(land(i,j-k)){cl=k;break;}
    if(cl){put(i,j,cl<=1?[96,62,38]:cl<=4?((i>>2)%3===0?[150,96,58]:[176,116,72]):[120,78,48]);continue;}
    let near=false;for(let dj=-2;dj<=2&&!near;dj++)for(let di=-2;di<=2;di++)if(land(i+di,j+dj)){near=true;break;}if(near)put(i,j,[220,244,250]);}
  x.putImageData(L,0,0);
  const pat=(tx,ty)=>{const t=document.createElement('canvas');t.width=t.height=16;if(FL)t.getContext('2d').drawImage(FL,tx*16,ty*16,16,16,0,0,16,16);return x.createPattern(t,'repeat');};
  // 지역별 바닥: 기본 가을(주황) → 서쪽 사막 → 동북 설원
  const region=(shape,fill)=>{const r=document.createElement('canvas');r.width=w;r.height=h;const rx2=r.getContext('2d');rx2.fillStyle='#000';rx2.beginPath();shape(rx2);rx2.fill();
    rx2.globalCompositeOperation='destination-in';rx2.drawImage(m,0,0);rx2.globalCompositeOperation='source-in';rx2.fillStyle=fill;rx2.fillRect(0,0,w,h);x.drawImage(r,0,0);};
  const wob=(cx,cy,rx,ry,n)=>g=>{for(let i=0;i<=n;i++){const t=i/n*Math.PI*2,k=1+(R()-.5)*.3;const px=cx+Math.cos(t)*rx*k,py=cy+Math.sin(t)*ry*k;i?g.lineTo(px,py):g.moveTo(px,py);}};
  region(g=>g.rect(0,0,w,h),pat(0,5));region(wob(150,165,120,130,18),pat(1,1));region(wob(350,70,150,80,18),pat(1,15));region(wob(255,150,28,40,8),pat(0,12));
  // 땅 위 장식 (섬 안쪽만)
  if(FD)for(let k=0;k<140;k++){const px=Math.floor(R()*w),py=Math.floor(R()*h);if(!land(px,py)||!land(px+12,py+12)||!land(px,py+14))continue;const col=x.getImageData(px+4,py+4,1,1).data;const snow=col[0]>230&&col[2]>230,sand=col[0]>240&&col[2]<180;
    const t=snow?[[10,0],[0,3]]:sand?[[9,0],[3,0]]:[[1,2],[6,2]];const e=t[k%2];x.drawImage(FD,e[0]*16,e[1]*16,16,16,px,py,16,16);}
  // 마을·지형 그림
  if(DS){x.drawImage(DS,0,0,48,48,118,150,40,40);x.drawImage(DS,48,0,48,80,150,130,40,66);for(const [px,py] of [[86,214],[178,224],[96,96],[190,96]])x.drawImage(DS,160,160,64,32,px,py,48,24);x.drawImage(DS,272,112,48,48,150,196,36,36);}
  if(HS&&N){x.drawImage(HS,192,0,64,48,310,64,52,40);x.drawImage(HS,0,80,48,32,322,106,36,24);for(const [px,py] of [[268,64],[396,60],[300,40],[410,110]])x.drawImage(N,128,0,32,32,px,py,28,28);x.drawImage(N,0,288,48,48,372,92,36,36);
    x.drawImage(HS,128,0,64,48,286,216,44,33);x.drawImage(HS,64,0,64,48,330,226,36,27);for(const [px,py] of [[372,200],[400,226],[262,192],[340,252]])x.drawImage(N,144,288,48,48,px,py,34,34);}
  // 뱃길·길
  x.strokeStyle='#d8a56a';x.lineWidth=3;x.setLineDash([5,4]);x.beginPath();x.moveTo(24,90);x.quadraticCurveTo(60,150,140,180);x.moveTo(170,180);x.quadraticCurveTo(255,150,330,110);x.moveTo(170,190);x.quadraticCurveTo(240,250,300,238);x.moveTo(310,232);x.quadraticCurveTo(350,170,335,118);x.stroke();x.setLineDash([]);
  if(IMG.nj_boat){x.drawImage(IMG.nj_boat,40,104,50,20);if(IMG.nj_sail)x.drawImage(IMG.nj_sail,58,84,19,27);}
  const cloud=(cx,cy,s)=>{x.fillStyle='rgba(255,255,255,.95)';for(const [ox,oy,r] of [[0,0,14],[12,-6,12],[24,0,13],[-12,3,10],[36,4,9]]){x.beginPath();x.arc(cx+ox*s,cy+oy*s,r*s,0,Math.PI*2);x.fill();}};
  for(const [cx,cy,s] of [[440,20,.7],[20,280,.6],[250,14,.5],[460,170,.5]])cloud(cx,cy,s);
  eastImg=c.toDataURL();return eastImg;}
const EPOS={west:[.03,.22],t7:[.31,.7],t8:[.7,.25],t9:[.66,.88]};
function worldPanel(tab){const s=S();const east=tab?tab==='east':!!(D.TOWNS[s.loc]&&D.TOWNS[s.loc].east);
  if(east){let h=tabs([['west','🗺 서방 왕국'],['east','⛩ 동방 대륙']],'east')+`<div style="position:relative;width:100%;aspect-ratio:16/10;background:url(${eastArt()}) center/cover;image-rendering:pixelated;border-radius:6px;overflow:hidden">`;
    for(const [k,ic,n] of [['west','⛵','서방으로 (항구)'],['t7','🐪',D.TOWNS.t7.n],['t9','🍁',D.TOWNS.t9.n],['t8','⛩',D.TOWNS.t8.n]]){const here=s.loc===k;h+=`<button class="wloc ${here?'sel':''}" data-k="${k}" style="position:absolute;left:${EPOS[k][0]*100}%;top:${EPOS[k][1]*100}%;transform:translate(${EPOS[k][0]<.25?'-10%':'-50%'},-50%);padding:3px 7px;font-size:12px;white-space:nowrap">${ic} ${n}</button>`;}
    h+='</div><div id="wInfo" style="margin-top:8px"></div>';openPanelRaw('🗺 동방 대륙',h);bindTabs(k=>worldPanel(k));
    const sel=k=>{$('pBody').querySelectorAll('.wloc').forEach(b=>b.classList.toggle('sel',b.dataset.k===k));if(k==='west'){$('wInfo').innerHTML=`<div class="card"><h4>⛵ 서방 왕국으로</h4><div class="sub">동방 상선을 타고 푸른물결 항구로 돌아갑니다. 뱃삯 ${fmt(shipFare())} G</div><div class="row" style="margin-top:6px"><button class="go" data-go="t3">배 타기</button></div></div>`;bindLocInfo('t3');}else{$('wInfo').innerHTML=locInfo(k);bindLocInfo(k);}};
    $('pBody').querySelectorAll('.wloc').forEach(b=>b.onclick=()=>sel(b.dataset.k));sel(D.TOWNS[s.loc]&&D.TOWNS[s.loc].east?s.loc:'t7');return;}
  const rk=G.rankIdx(s.rank)>=G.rankIdx('C');let h=(rk||D.TOWNS[s.loc]&&D.TOWNS[s.loc].east?tabs([['west','🗺 서방 왕국'],['east','⛩ 동방 대륙']],'west'):'')+`<div style="position:relative;width:100%;aspect-ratio:16/10;background:url(${worldArt()}) center/cover;image-rendering:pixelated;border-radius:6px;overflow:hidden">`;
  const locs=[['camp','⛺','집결지'],['t1','🌾',D.TOWNS.t1.n],['t2','⛏',D.TOWNS.t2.n],['t3','⚓',D.TOWNS.t3.n],['t4','🏰',D.TOWNS.t4.n],['t5','🌳',D.TOWNS.t5.n],['t6','🌋',D.TOWNS.t6.n]];
  if(G.dungOpen('d_abyss'))locs.push(['abyss','🌀','심연의 왕좌']);
  for(const [k,ic,n] of locs){const open=k==='abyss'||G.townOpen(k);const here=s.loc===k;
    h+=`<button class="wloc ${here?'sel':''}" data-k="${k}" style="position:absolute;left:${WPOS[k][0]*100}%;top:${WPOS[k][1]*100}%;transform:translate(${WPOS[k][0]>.75?'-92%':WPOS[k][0]<.25?'-10%':'-50%'},-50%);padding:3px 7px;font-size:12px;white-space:nowrap">${ic} ${n}${open?'':' <small>(무시)</small>'}</button>`;}
  h+='</div><div id="wInfo" style="margin-top:8px"></div>';
  openPanelRaw('🗺 월드맵',h);bindTabs(k=>worldPanel(k));
  const sel=k=>{$('pBody').querySelectorAll('.wloc').forEach(b=>b.classList.toggle('sel',b.dataset.k===k));$('wInfo').innerHTML=locInfo(k);bindLocInfo(k);};
  $('pBody').querySelectorAll('.wloc').forEach(b=>b.onclick=()=>sel(b.dataset.k));sel(s.loc==='run'?'camp':s.loc);}
function locInfo(k){const s=S();let h='';
  if(k==='camp'){h+=`<div class="card"><h4>⛺ 집결지 — ${D.CAMP_TIERS[s.camp.tier].n}</h4><div class="sub">용병들이 쉬는 내 거점. 건물을 짓고 꾸며서 성채 마을로 키웁니다.</div><div class="row" style="margin-top:6px"><button class="go" data-go="camp">집결지로 이동</button></div></div>`;
    const ds=['d_ruin','d_mist','d_nest'];h+=dungList(ds,'거점 직통 던전');}
  else if(k==='abyss'){h+=dungList(['d_abyss'],'최종 던전');}
  else{const t=D.TOWNS[k];const open=G.townOpen(k);
    h+=`<div class="card"><h4>${t.n} <small class="sub">${t.tag} · ${D.TIER[t.tier].n}</small></h4><div class="sub">${t.desc}</div>`;
    if(!open)h+=`<div class="bad" style="margin-top:4px;font-size:13px">⚠ 아직 ${t.req}등급이 아니라 무시당합니다 — 의뢰소·여관 고용·지역 던전은 ${t.req}등급부터. 구경과 상점은 가능.</div><div class="row" style="margin-top:6px"><button class="go" data-go="${k}">마을로 이동</button></div>`;
    else h+=`<div class="sub" style="margin-top:3px">대우: ${['무시','보통','존중','전설'][G.attitude(k)]} ${t.goodRank&&G.rankIdx(s.rank)<G.rankIdx(t.goodRank)?'· '+t.goodRank+'등급이 되면 대우가 달라집니다':''}</div><div class="row" style="margin-top:6px"><button class="go" data-go="${k}">마을로 이동</button></div>`;
    h+='</div>';h+=dungList(t.dung,'지역 던전');}
  return h;}
function dungList(ds,title){const s=S();let h=`<div class="sub" style="margin:8px 0 4px;font-weight:800">${title}</div><div class="col">`;
  for(const dk of ds){const d=D.DUNG[dk];const open=G.dungOpen(dk);let why='';
    if(!open){if(d.campTier)why=`집결지 ${d.campTier}단계 [${D.CAMP_TIERS[d.campTier].n}] 필요`;else if(d.unlock&&D.SUBS[d.unlock]){const q=D.SUBS[D.SUBS[d.unlock].req||d.unlock];why=`${D.TOWNS[q.town].n} 의뢰 「${q.n}」(${q.npc}) 완료 시 열림`;}else if(d.unlock){const m=D.MAIN.find(x=>x.id===d.unlock);why=m?`메인 퀘스트 「${m.n}」 단계에서 열림`:'';}else why=d.rank+'등급 필요';}
    const cl=(s.stats.clears||{})[dk]||0;
    h+=`<div class="itemrow" style="cursor:default"><div style="flex:1"><div class="nm">${d.n} <small class="sub">Lv.${d.lv[0]}~${d.lv[1]} · ${D.THEME[d.theme].n}${cl?' · 공략 '+cl+'회':''}</small></div><div class="st">${open?'보스: '+(D.BOSS[d.boss].n)+' · 예상 수익 약 '+fmt(D.TIER[d.tier].inc*d.dm)+' G':'🔒 '+why}</div></div>${open?`<button class="go" data-dk="${dk}">출정</button>`:''}</div>`;}
  return h+'</div>';}
function shipFare(){return Math.round(D.priceRef(Math.max(20,S().leader.lv))*.08/10)*10;}
function bindLocInfo(k){$('wInfo').querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const to=b.dataset.go;const s=S();const eTo=!!(D.TOWNS[to]&&D.TOWNS[to].east),eFrom=!!(D.TOWNS[s.loc]&&D.TOWNS[s.loc].east);
    if(eTo!==eFrom){const f=shipFare();if(s.gold<f)return toast('뱃삯이 부족합니다 ('+fmt(f)+' G)');G.addGold(-f);toast('⛵ 배를 타고 '+(eTo?'동방 대륙':'서방 왕국')+'으로 건너갑니다 (-'+fmt(f)+' G)');}
    closePanel();fadeTo(()=>enterWalk(to));});
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
  const name=l[0],text=CN(l[1]);$('dName').textContent=name==='나레이션'?'':name;$('dText').innerHTML=text;$('dlg').classList.remove('hidden');
  const f=$('dFace');const desc=faceFor(name);if(desc){f.style.display='';f.style.backgroundImage=`url(${desc.kind==='face'?'assets/faces/'+desc.k+'.png':portrait(desc,84,'f_'+name)})`;f.style.backgroundSize='100% 100%';}else f.style.display='none';
  $('dText').style.fontStyle=name==='나레이션'?'italic':'';}
$('dlg').onclick=()=>{sfx('click',.15);nextLine();};
function hash(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
const FACES_N={'접수원 메이':'Woman','촌장 오드릭':'OldMan','사냥꾼 리아':'Hunter','산적 두목 바르크':'FighterRed','길드장 볼드':'Master','광부 토비':'Caveman','옛 부관 가렛':'Knight','항구 관리관 니나':'Noble','밀수단 두목 렉스':'NinjaMasked','황성 경비병':'SamuraiBlue','황성 의뢰소 직원':'Inspector','황제 레오나르트':'Sultan','길드 마스터 아이언':'KnightGold','배신자 발테르':'SorcererBlack','농부 베니':'Villager','꽃집 아이 루루':'Child','대장장이 한나':'Cavegirl','목수 바드':'Villager2','진주 상인 마린':'Villager5','늙은 선원 펠':'OldMan2','학자 이브':'Shaman','귀족 영애 엘리제':'Princess','근위대장 로웰':'SamuraiRed','떠돌이 시인 안톤':'Villager3'};
const FACES_K=[['노아','Villager2'],['의사','Woman'],['정령사','Woman'],['기술자','Caveman'],['대마법사','SorcererBlack'],['대신','Sultan'],['훈장','OldMan2'],['손녀','Child'],['장로','OldMan'],['사냥꾼','Hunter'],['주막','Woman'],['아르칸','KnightGold'],['브란','Caveman'],['카심','Sultan'],['라일라','Woman'],['겐신','Master'],['텐구','NinjaMasked'],['시엔','Hunter'],['무녀','Princess'],['사령관','SamuraiRed'],['학자','OldMan'],['세공사','Cavegirl'],['하산','Villager5'],['자라','Villager3'],['사범','SamuraiRed'],['털옷','Hunter'],['요정 가루','Villager2'],['근위','Knight'],['의뢰소','Woman'],['접수','Woman'],['여관','Villager4'],['대장장이','Caveman'],['상인','Villager6'],['경비','SamuraiBlue'],['교관','FighterWhite'],['관리인','Inspector'],['할머니','OldWoman'],['노인','OldMan2']];
function faceFor(name){if(name==='나레이션')return null;if(name===S()?.leader?.name)return unitDesc(S().leader);
  if(FACES_N[name])return {kind:'face',k:FACES_N[name]};for(const [w,k] of FACES_K)if(name.includes(w))return {kind:'face',k};
  if(name.includes('발테르'))return {kind:'face',k:'SorcererBlack'};if(name.includes('가렛'))return {kind:'face',k:'Knight'};
  for(const k in D.BOSS)if(D.BOSS[k].n===name){return sprDesc(D.BOSS[k].spr,D.BOSS[k].tint);}
  if(name.includes('가렛'))return {kind:'human',look:{o:4,hair:'shorthair',hc:4},tool:true};
  if(name.includes('발테르'))return sprDesc('h_valter');
  if(name.includes('황제'))return {kind:'human',look:{o:8,hair:'longhair',hc:3}};
  const h=hash(name);return {kind:'human',look:{o:[0,1,2,3,6,7,8,9][h%8],hair:D.HAIRS[h%6],hc:(h>>3)%7}};}

/* ================= 패널 공용 ================= */
let panelOnClose=null;
function openPanelRaw(title,html,modal){title=CN(title);html=CN(html);$('pTitle').innerHTML=title;$('pBody').innerHTML=html;$('panel').classList.remove('hidden');$('panel').dataset.modal=modal?'1':'';$('pClose').style.display=modal?'none':'';$('pBody').scrollTop=0;}
function closePanel(){mgStop();clearTimeout(fishWait);$('panel').classList.add('hidden');const cb=panelOnClose;panelOnClose=null;hudRefresh();if(cb)cb();if(scene==='walk')setTimeout(mainTick,60);}
$('pClose').onclick=closePanel;$('panel').onclick=e=>{if(e.target===$('panel')&&!$('panel').dataset.modal)closePanel();};
function uiBusy(){return !$('panel').classList.contains('hidden')||!$('dlg').classList.contains('hidden');}
function confirmBox(msg,yes){openPanelRaw('확인',`<p>${msg}</p><div class="row" style="justify-content:flex-end"><button id="cNo">아니오</button><button class="go" id="cYes">예</button></div>`,true);$('cNo').onclick=()=>closePanel();$('cYes').onclick=()=>{closePanel();yes();};}
function tabs(list,cur,fn){return '<div class="tabs">'+list.map(([k,n])=>`<button data-tab="${k}" class="${k===cur?'sel':''}">${n}</button>`).join('')+'</div>';}
function bindTabs(fn){$('pBody').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>fn(b.dataset.tab));}
function openPanel(k,arg){if(k==='world')return worldPanel();if(k==='party')return partyPanel(arg);if(k==='bag')return bagPanel(arg);if(k==='quest')return questPanel();if(k==='menu')return menuPanel();}
document.querySelectorAll('#hud [data-p]').forEach(b=>b.onclick=()=>{if(scene==='battle')return;if((scene==='dg'||scene==='dmap')&&b.dataset.p==='world')return toast('던전 안에서는 지도를 열 수 없습니다. 입구나 모닥불에서 귀환하세요.');openPanel(b.dataset.p);});
$('goal').onclick=()=>openPanel('quest');

/* ================= 상단 정보 · 목표 · 가이드 ================= */
function hudRefresh(){const s=S();if(!s)return;const r=s.rank;$('hRank').textContent=r;$('hRank').style.color=shade(D.RANK_COLOR[r],-.35);
  $('hFame').textContent=fmt(s.fame);const p=D.PROMO[r];$('hFameN').textContent=p&&p.fame?'/ '+fmt(p.fame):'';
  $('hGold').textContent=fmt(s.gold);$('hDay').textContent=G.calStr(s.day,true);$('hDay').parentNode.title=G.calStr(s.day)+' ('+s.day+'일째)';
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
  if(act==='mine'&&!MAP.inside){fadeTo(()=>enterInterior({act:'minecave',name:'광산',t:'mine',x:o.x,y:o.y}));return;}
  if(act==='ore')return minePanel();
  if(act==='deep'){openPanelRaw('⬇ 깊은 갱도',`<p class="sub">괴물이 들끓는 안쪽 갱도. 용병단만 들어갈 수 있다.</p>`+dungList(MAP.town==='t6'?['d_ashmine','d_lavafort']:['d_mine','d_crystal'],'갱도로 들어가기'));bindLocInfo2();return;}
  if(act==='mine'){openPanelRaw('⛏ 회색바위 광산 입구',`<p class="sub">광부들이 곡괭이를 휘두르는 갱도 입구. 바깥 광맥은 누구나 캘 수 있지만, 안쪽 갱도는 괴물이 들끓어 용병만 들어갈 수 있다.</p><button class="go" id="mineGo" style="width:100%">⛏ 바깥 광맥 직접 캐기 (미니게임)</button>`+dungList(['d_mine','d_crystal'],'갱도로 들어가기'));bindLocInfo2();$('mineGo').onclick=()=>minePanel();return;}
  if(act==='fish')return fishPanel();
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
  if(D.TOWNS[tk]&&!G.townOpen(tk)&&['guild','inn','hq','arena','classhall'].includes(act)){const req=D.TOWNS[tk].req;
    const who={guild:'의뢰소 직원',inn:'여관 주인',hq:'길드 경비병',arena:'투기장 관리인',classhall:'전직 교관'}[act];
    const line={guild:`${s.rank}등급 용병단이요? 여긴 ${req}등급부터 의뢰를 받습니다. 구경만 하고 가세요.`,inn:`방은 내줄 수 있어도, 우리 용병들은 ${req}등급도 안 되는 단장 밑엔 안 갑니다.`,hq:`이름 없는 용병단은 본부 출입 금지다. ${req}등급이 되면 다시 오도록.`,arena:`투기장은 ${req}등급 이상 용병단만 출전할 수 있다.`,classhall:`${req}등급은 되어야 이곳 교관이 상대해 줍니다.`}[act];
    return say([[who,line],['나레이션',`(${req}등급이 되면 이용할 수 있습니다. 상점은 지금도 이용 가능 — 대신 값을 더 받습니다.)`]]);}
  if(act==='guild')return guildPanel(tk);
  if(act==='shop')return shopPanel(tk);
  if(act==='inn')return innPanel(tk,'hire');
  if(act==='smith'){if(G.attitude(tk)<2&&tk!=='t4'){return say([['대장장이','풋내기한테 내 망치를 맡길 순 없지. '+(D.TOWNS[tk].goodRank)+'등급은 되고 와.']]);}return smithPanel(tk);}
  if(act==='relic'){if(G.rankIdx(s.rank)<G.rankIdx('C'))return say([['유물 상인','C등급 이상 용병단에게만 유물을 보여 드립니다.']]);return shopPanel(tk,true);}
  if(act==='hq')return hqPanel();
  if(act==='arena')return arenaPanel();
  if(act==='guildboard')return guildPanel(tk);
  if(act==='casino'||act==='dice')return casinoPanel(act==='dice'?'dice':'oddeven');
  if(act==='pit')return pitPanel();
  if(act==='auction')return auctionPanel();
  if(act==='classhall')return classPanel();}


/* ----- 도박장: 홀짝 · 주사위 대결 ----- */
const DIE=['','⚀','⚁','⚂','⚃','⚄','⚅'];
function casinoPanel(tab,last){const s=S();tab=tab||'oddeven';s.casino=s.casino||{bet:100};const bets=[100,500,1000,5000,20000].filter(b=>b<=Math.max(100,s.gold));if(!bets.includes(s.casino.bet))s.casino.bet=bets[bets.length-1]||100;
  let h=tabs([['oddeven','🎲 홀짝'],['dice','🎯 주사위 대결']],tab);
  h+=`<p class="sub">${tab==='oddeven'?'딜러가 주사위 두 개를 굴립니다. 합이 홀수인지 짝수인지 맞히면 판돈의 <b>1.9배</b>.':'나와 딜러가 주사위 두 개씩 굴려 합이 큰 쪽이 이깁니다. 이기면 <b>2배</b>, 비기면 돌려받음.'} <span class="bad">돈을 잃을 수도 있어요!</span></p>`;
  h+=`<div class="row" style="flex-wrap:wrap;gap:4px"><b>판돈</b>${bets.map(b=>`<button data-bet="${b}" class="${s.casino.bet===b?'go':''}">${fmt(b)} G</button>`).join('')}</div>`;
  if(last)h+=`<div class="card" style="text-align:center;font-size:20px;margin:8px 0">${last}</div>`;
  h+=tab==='oddeven'?`<div class="grid2" style="margin-top:8px"><button class="go" data-pick="1" style="font-size:18px">홀 (홀수)</button><button class="go" data-pick="0" style="font-size:18px">짝 (짝수)</button></div>`:`<button class="go" id="dRoll" style="font-size:18px;width:100%;margin-top:8px">🎲 굴리기</button>`;
  h+=`<p class="sub" style="margin-top:6px">오늘 도박 결과: ${(s.casino.day===s.day?s.casino.net:0)>=0?'+':''}${fmt(s.casino.day===s.day?s.casino.net:0)} G · 보유 ${fmt(s.gold)} G</p>`;
  openPanelRaw('🎰 도박장',h);bindTabs(k=>casinoPanel(k));
  const rec=v=>{if(s.casino.day!==s.day){s.casino.day=s.day;s.casino.net=0;}s.casino.net+=v;};
  $('pBody').querySelectorAll('[data-bet]').forEach(b=>b.onclick=()=>{s.casino.bet=+b.dataset.bet;casinoPanel(tab,last);});
  const r=()=>1+Math.floor(Math.random()*6);
  $('pBody').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const bet=s.casino.bet;if(s.gold<bet)return toast('금화가 부족합니다');G.addGold(-bet);const a=r(),c=r(),odd=(a+c)%2===1,win=(+b.dataset.pick===1)===odd;
    let msg=`${DIE[a]} ${DIE[c]} = ${a+c} (${odd?'홀':'짝'}) — `;if(win){const g=Math.round(bet*1.9);G.addGold(g);rec(g-bet);msg+=`<b class="good">맞혔다! +${fmt(g)} G</b>`;s.casino.wins=(s.casino.wins||0)+1;sfx('coin',.5);}else{rec(-bet);msg+=`<b class="bad">빗나갔다... -${fmt(bet)} G</b>`;sfx('click',.3);}
    hudRefresh();casinoPanel('oddeven',msg);});
  const dr=$('dRoll');if(dr)dr.onclick=()=>{const bet=s.casino.bet;if(s.gold<bet)return toast('금화가 부족합니다');G.addGold(-bet);const a=r()+r(),d=r()+r();let msg=`나 ${a} : ${d} 딜러 — `;
    if(a>d){G.addGold(bet*2);rec(bet);msg+=`<b class="good">승리! +${fmt(bet*2)} G</b>`;s.casino.wins=(s.casino.wins||0)+1;sfx('coin',.5);}else if(a===d){G.addGold(bet);msg+='무승부, 판돈을 돌려받았다';}else{rec(-bet);msg+=`<b class="bad">패배... -${fmt(bet)} G</b>`;}
    hudRefresh();casinoPanel('dice',msg);};}
/* ----- 지하 투기장: 하루 한 번씩 난이도별 내기 시합 ----- */
function pitPanel(){const s=S();const lv=Math.max(5,s.leader.lv);s.pit=s.pit||{};const done=s.pit.day===s.day?s.pit.done||{}:{};
  const tiers=[['풋내기 시합',lv-2,1.0],['정예 시합',lv+2,1.8],['죽음의 시합',lv+6,3.2]];
  let h=`<p>도박장 지하, 피 냄새 나는 원형 투기장. 시합에 이기면 상금, 지면 아무것도 없다.</p><p class="sub">난이도마다 하루 한 번. 파티 HP는 가득 찬 상태로 시작합니다.</p><div class="col">`;
  tiers.forEach(([n,l,mul],i)=>{const prize=Math.round(D.priceRef(l)*mul);h+=`<div class="itemrow" style="cursor:default"><div style="flex:1"><div class="nm">⚔ ${n} <small>적 Lv${l}</small></div><div class="st">상금 ${fmt(prize)} G</div></div>${done[i]?'<span class="sub">오늘 끝남</span>':`<button class="go" data-pit="${i}">출전</button>`}</div>`;});
  h+=`<div class="itemrow" style="cursor:default"><div style="flex:1"><div class="nm">🎲 투사 내기 관전</div><div class="st">두 투사의 능력치를 보고 돈을 걸어 싸움을 구경</div></div><button class="go" id="pitBet">구경하기</button></div>`;
  openPanelRaw('🩸 지하 투기장',h+'</div>');$('pitBet').onclick=()=>pitBetPanel();
  $('pBody').querySelectorAll('[data-pit]').forEach(b=>b.onclick=()=>{const i=+b.dataset.pit,[n,l,mul]=tiers[i];const prize=Math.round(D.priceRef(l)*mul);
    D.EXAMS.pit={n:'지하 투기장 · '+n,lv:l,boss:null,adds:i===2?['champ','champ','examarcher','champ']:i===1?['champ','examarcher','champ']:['champ','examarcher'],town:MAP.town};
    if(s.pit.day!==s.day){s.pit={day:s.day,done:{}};}s.pit.done[i]=1;closePanel();
    special('pit',bt=>{if(bt.over===1){G.addGold(prize);G.addFame(5);G.chron&&G.chron(`지하 투기장 ${n} 승리 (상금 ${fmt(prize)} G)`);toast('🩸 승리! 상금 '+fmt(prize)+' G');sfx('levelup',.4);}else toast('지하 투기장에서 패배했다...');},true);});}

// 투사 내기: 두 투사의 능력치를 보고 돈을 건 뒤 실제 싸움을 관전
function pitBetPanel(){const s=S();const lv=Math.max(5,s.leader.lv);let st=s.pitbet;
  if(!st||st.day!==s.day||!st.pair){const jobs=['warrior','guard','archer','mage','priest'];const la=lv+Math.floor(Math.random()*5)-2,lb=lv+Math.floor(Math.random()*5)-2;
    const A=G.genMerc(Math.max(1,la),{job:jobs[Math.floor(Math.random()*4)]});A.grade=Math.min(3,1+Math.floor(Math.random()*3));
    const bk=['champ','examarcher','champ'][Math.floor(Math.random()*3)];st=s.pitbet={day:s.day,left:st&&st.day===s.day?st.left:3,pair:{A,bk,lb:Math.max(1,lb)}};}
  const A=st.pair.A,B=G.makeEnemy(st.pair.bk,st.pair.lb);const sa=G.statsOf(A),sb=B.st;
  const pw=x=>x.hp*Math.max(x.atk,x.mag)*(1+x.def/60)*(x.spd/30);const pa=pw(sa),pb=pw(sb);const oa=clamp(.92*(pa+pb)/pa,1.2,4),ob=clamp(.92*(pa+pb)/pb,1.2,4);
  const card=(t,nm,lv2,role,x,o,k)=>`<div class="card" style="flex:1;min-width:140px"><h4>${t}</h4><div><b>${nm}</b> <small>Lv${lv2} · ${role}</small></div>
    <div class="sub" style="font-size:12px;line-height:1.6">❤ 체력 ${fmt(x.hp)}<br>⚔ 공격 ${fmt(Math.max(x.atk,x.mag))}${x.mag>x.atk?' (마법)':''}<br>🛡 방어 ${fmt(x.def)}<br>💨 속도 ${Math.round(x.spd)}</div><div style="margin-top:4px">배당 <b class="good">×${o.toFixed(2)}</b></div></div>`;
  const amt=[.1,.3,.8].map(r=>Math.max(100,Math.round(D.priceRef(lv)*r/10)*10));
  let h=`<p class="sub">투기장 붉은 코너와 푸른 코너의 투사 중 이길 쪽에 돈을 걸고, 실제 싸움을 관전합니다. 오늘 남은 경기: <b>${st.left}</b>/3</p>
   <div class="row" style="gap:8px;align-items:stretch">${card('🟥 붉은 코너',A.name,A.lv,D.JOBS[A.job].n,sa,oa)}${card('🟦 푸른 코너',B.name,B.lv,{melee:'근접',ranged:'원거리',caster:'마법'}[B.role]||'',sb,ob)}</div>`;
  if(st.left>0){h+=`<div class="col" style="margin-top:8px">`;for(const side of ['A','B'])h+=`<div class="row" style="gap:6px;justify-content:center"><span style="width:84px">${side==='A'?'🟥 붉은':'🟦 푸른'}에</span>${amt.map(a=>`<button data-bet="${side}:${a}" ${s.gold<a?'disabled':''}>${fmt(a)} G</button>`).join('')}</div>`;h+='</div>';}
  else h+='<p class="sub" style="text-align:center">오늘 경기는 모두 끝났습니다. 내일 다시 오세요.</p>';
  h+=`<div class="row" style="margin-top:8px"><button id="pitBack">← 투기장으로</button></div>`;
  openPanelRaw('🎲 투사 내기',h);$('pitBack').onclick=()=>pitPanel();
  $('pBody').querySelectorAll('[data-bet]').forEach(b=>b.onclick=()=>{const [side,a]=b.dataset.bet.split(':');const amount=+a;if(s.gold<amount)return toast('금화가 부족합니다');
    G.addGold(-amount);st.left--;const odds=side==='A'?oa:ob;const pair=st.pair;st.pair=null;G.save();closePanel();
    fadeTo(()=>{hideWalkUI();startBattle([G.makeEnemy(pair.bk,pair.lb)],'투사 내기 · 관전','fort',bt=>{const aWon=bt.over===1;const win=(side==='A')===aWon;
      if(win){const pay=Math.round(amount*odds);G.addGold(pay);toast(`🎉 ${aWon?'붉은':'푸른'} 코너 승리! 배당금 +${fmt(pay)} G`);sfx('coin',.5);G.chron&&G.chron(`투사 내기 적중 (+${fmt(pay)} G)`);}
      else toast(`😵 ${aWon?'붉은':'푸른'} 코너 승리... 건 돈을 잃었다`);G.save();fadeTo(()=>enterWalk(S().loc));},{full:true,allies:[pair.A],watch:true});});});}

/* ----- 숙련도 ----- */
// 숙련도: 많이 할수록 등급이 오르고, 등급이 오르면 관련 능력치 +1
const MASTER_N=['견습','초보','숙련','전문','장인','달인','명인','전설'],MASTER_X=[5,15,30,50,80,120,170,230];
const MASTER_ST={mine:['STR','STR','AGI'],fish:['AGI','CHA','INT']};
function masterLv(x){let l=0;while(l<MASTER_X.length&&x>=MASTER_X[l])l++;return l;}
function masterStr(kind){const s=S(),x=(kind==='mine'?(s.mine||{}).xp:(s.fish||{}).total)||0,l=masterLv(x);return `${kind==='mine'?'채굴':'낚시'} 숙련 <b>${l?MASTER_N[l-1]:'입문'}</b> (${x}${l<MASTER_X.length?'/'+MASTER_X[l]:''})`;}
function masterGain(kind){const s=S();const o=kind==='mine'?s.mine:s.fish;const before=masterLv(o.xpPrev||0);const x=kind==='mine'?(o.xp=(o.xp||0)+1):o.total;o.xpPrev=x;const after=masterLv(x);
  if(after>before){const st=MASTER_ST[kind][(after-1)%3];s.leader[st]++;const nm={STR:'힘',AGI:'민첩',INT:'지력',CHA:'매력'}[st];G.chron(`${kind==='mine'?'채굴':'낚시'} 숙련 「${MASTER_N[after-1]}」 달성 — ${nm} +1`);
    setTimeout(()=>{toast(`🏅 ${kind==='mine'?'채굴':'낚시'} 숙련 「${MASTER_N[after-1]}」! ${nm} +1`);sfx('levelup',.5);},200);}}
/* ----- 미니게임: 채굴 (움직이는 표시가 광맥 위에 올 때 캐기) ----- */
let mgTimer=null,fishWait=null;function mgStop(){if(mgTimer){clearInterval(mgTimer);mgTimer=null;}}
function minePanel(msg){mgStop();const s=S();if(!(MAP&&MAP.cave))return toast('광산 안의 광맥에서만 캘 수 있어요');s.mine=s.mine||{};if(s.mine.day!==s.day){s.mine.day=s.day;s.mine.left=6;}const lv=Math.max(3,s.leader.lv);
  let h=`<p class="sub">막대가 <b style="color:#c08020">광맥(노란 칸)</b>에 올 때 <b>캐기!</b>를 누르세요. 한가운데(빨간 줄)면 보석! 오늘 남은 체력: <b>${s.mine.left}</b>/6<br>${masterStr('mine')} — 등급이 오를 때마다 힘·민첩이 오르고, 더 좋은 광석을 캘 수 있어요. 캔 광석은 대장간 강화에 씁니다.</p>${oreBar()}
  <div style="position:relative;height:34px;background:#5a4a3a;border-radius:6px;overflow:hidden;margin:8px 0" id="mBar"><div id="mZone" style="position:absolute;top:0;height:100%;background:#e8b84a"></div><div id="mCore" style="position:absolute;top:0;height:100%;width:4px;background:#e04040"></div><div id="mMark" style="position:absolute;top:-2px;width:6px;height:38px;background:#fff;box-shadow:0 0 4px #000"></div></div>
  ${msg?`<div class="card" style="text-align:center">${msg}</div>`:''}<button class="go" id="mHit" style="width:100%;font-size:18px" ${s.mine.left>0?'':'disabled'}>⛏ 캐기!</button>`;
  openPanelRaw('⛏ 광맥 캐기',h);if(s.mine.left<=0)return;
  const zw=18+Math.random()*10+masterLv((s.mine.xp)||0)*2,zx=5+Math.random()*(90-zw);$('mZone').style.left=zx+'%';$('mZone').style.width=zw+'%';$('mCore').style.left=(zx+zw/2)+'%';
  let p=0,dir=1,sp=1.6+Math.random()*1.4;mgTimer=setInterval(()=>{p+=dir*sp;if(p>=100||p<=0)dir*=-1;p=clamp(p,0,100);const mk=$('mMark');if(!mk)return mgStop();mk.style.left='calc('+p+'% - 3px)';},16);
  $('mHit').onclick=()=>{mgStop();s.mine.left--;const c=zx+zw/2;let m;
    const ml=masterLv((s.mine.xp)||0),volc=MAP.town==='t6';const O=(k,n)=>{G.addOre(k,n);return `${D.ORES[k].e} <b class="good">${D.ORES[k].n} +${n}</b>`;};
    if(Math.abs(p-c)<2.2){const g=Math.round(D.priceRef(lv)*.4);G.addGold(g);m=(volc?(ml>=5?O('flame',1):ml>=3?O('obsid',2):'🔥 화염 결정이 박혀 있지만 너무 단단하다! (숙련 「장인」 필요)'):(ml>=2?O('silver',2):O('iron',2)))+` · 💎 보석 +${fmt(g)} G`;sfx('levelup',.4);}
    else if(p>=zx&&p<=zx+zw){m=volc?(ml>=3?O('obsid',1):'🖤 흑요석이 단단해서 금만 갔다... (채굴 숙련 「숙련」 필요)'):(ml>=2&&Math.random()<.35?O('silver',1):O('iron',Math.random()<.4?2:1));sfx('coin',.4);}
    else{m='💨 돌만 부서졌다...';sfx('click',.3);}
    if(!m.startsWith('💨')){masterGain('mine');}if(m.includes('필요'))m=m;s.mine.total=(s.mine.total||0)+1;hudRefresh();G.save();minePanel(m);};}
/* ----- 미니게임: 낚시 (입질이 오면 빨리 누르기) ----- */
const FISH=[['멸치',.06,30],['고등어',.12,26],['도미',.22,18],['연어',.32,12],['참치',.6,7],['황금 잉어',1.4,3],['진주 조개',2.2,2]];
function fishPanel(msg){mgStop();const s=S();if(!(MAP&&MAP.labels.some(l=>l.act==='fish')))return toast('물가 낚시터에서만 낚시할 수 있어요');s.fish=s.fish||{total:0};if(s.fish.day!==s.day){s.fish.day=s.day;s.fish.left=8;}const lv=Math.max(3,s.leader.lv);
  let h=`<p class="sub">찌를 던지고 기다리다가 <b>"입질!"</b>이 뜨면 바로 <b>당기기!</b>를 누르세요. 너무 빨리 당기면 놓칩니다. 오늘 남은 미끼: <b>${s.fish.left}</b>/8 · <br>${masterStr('fish')} — 등급이 오를 때마다 민첩·매력·지력이 오릅니다.</p>
  <div class="card" id="fState" style="text-align:center;font-size:20px;min-height:40px">${msg||'🌊 잔잔한 바다...'}</div><div class="grid2"><button class="go" id="fCast" ${s.fish.left>0?'':'disabled'}>🎣 찌 던지기</button><button id="fPull" disabled>당기기!</button></div>`;
  openPanelRaw('🎣 부두 낚시',h);
  let bite=false;$('fCast').onclick=()=>{if(s.fish.left<=0)return;s.fish.left--;$('fCast').disabled=true;$('fPull').disabled=false;$('fState').textContent='🎣 ...기다리는 중';
    const t0=1200+Math.random()*2800;fishWait=setTimeout(()=>{if(!$('fState'))return;bite=true;$('fState').innerHTML='<b class="bad">❗ 입질! 지금!</b>';sfx('click',.5);fishWait=setTimeout(()=>{bite=false;if($('fState'))fishPanel('🐟 놓쳤다... 너무 늦었어');},850);},t0);};
  $('fPull').onclick=()=>{clearTimeout(fishWait);if(!bite){fishPanel('💦 너무 빨리 당겼다!');return;}
    let r=Math.random()*FISH.reduce((a,f)=>a+f[2],0),f=FISH[0];for(const x of FISH){r-=x[2];if(r<=0){f=x;break;}}const g=Math.max(10,Math.round(D.priceRef(lv)*f[1]*.4));G.addGold(g);s.fish.total++;masterGain('fish');sfx('coin',.4);hudRefresh();G.save();
    fishPanel(`🐟 <b>${f[0]}</b>을(를) 낚았다! <b class="good">+${fmt(g)} G</b>`);};}
/* ----- 비밀 경매장 (히든) ----- */
function auctionLots(){const s=S(),c=G.cal(),key=c.y+'-'+c.m;if(s.auc&&s.auc.key===key)return s.auc.lots;const lv=Math.max(8,s.leader.lv+4);const lots=[];
  const it=G.genItem(lv,4,pick(['wpn','arm','acc']));lots.push({k:'item',it,p:Math.round(it.val*1.6)});
  const sk=pick(Object.keys(D.SETS));const sp=G.genSetPiece(sk,lv,pick(['wpn','arm','acc']));lots.push({k:'item',it:sp,p:Math.round(sp.val*2)});
  const bks=Object.keys(D.BOOKS).filter(k=>D.BOOKS[k].who==='L');const bk=pick(bks);lots.push({k:'book',b:bk,p:G.bookPrice(bk)*2});
  lots.push({k:'elix',e:pick(['elix_str','elix_agi','elix_int','elix_cha']),n:2,p:Math.round(D.priceRef(lv)*5)});
  s.auc={key,lots};return lots;}
function auctionPanel(msg){const s=S();if(!G.auctionOpen())return say([['두건 쓴 중개인','...오늘은 장이 서지 않소. 다음 달 20일에 다시 오시오.']]);const lots=auctionLots();
  let h=`<p class="sub">"쉿. 여기서 본 물건은 바깥에 말하지 마시오." — 매달 20~22일에만 열리는 비밀 경매. 입찰하면 다른 손님이 값을 올릴 수도 있소.</p>${msg?`<div class="card" style="text-align:center">${msg}</div>`:''}<div class="col">`;
  lots.forEach((L,i)=>{const nm=L.k==='item'?itemLine(L.it):L.k==='book'?`📕 <b>스킬서: ${D.SKILLS[L.b].n}</b><br><small>${D.SKILLS[L.b].d}</small>`:`🧪 <b>${D.CONSUM[L.e].n} ×${L.n}</b>`;
    h+=`<div class="itemrow" style="cursor:default"><div style="flex:1">${nm}</div>${L.sold?'<b class="good">낙찰</b>':L.lost?'<span class="sub">유찰</span>':`<span class="price">${fmt(L.p)} G</span><button class="go" data-bid="${i}">입찰</button>`}</div>`;});
  openPanelRaw('🕯 비밀 경매장',h+'</div>');
  $('pBody').querySelectorAll('[data-bid]').forEach(b=>b.onclick=()=>{const L=lots[+b.dataset.bid];if(s.gold<L.p)return toast('금화가 부족합니다');
    if(Math.random()<.38&&!L.raised2){L.raised2=L.raised;L.raised=true;L.p=Math.round(L.p*1.18);G.save();return auctionPanel('🙋 다른 손님이 값을 올렸다! 새 가격 '+fmt(L.p)+' G');}
    G.addGold(-L.p);L.sold=true;if(L.k==='item'){if(G.invFull()){G.addGold(L.p);L.sold=false;return toast('가방이 가득 찼습니다');}G.addItem(Object.assign({},L.it,{id:'i'+Date.now()}));}else if(L.k==='book'){s.books=s.books||{};s.books[L.b]=(s.books[L.b]||0)+1;}else s.cons[L.e]=(s.cons[L.e]||0)+L.n;
    G.chron&&G.chron('비밀 경매장에서 낙찰');sfx('levelup',.4);hudRefresh();G.save();auctionPanel('🔨 낙찰!');});}
/* ----- 의뢰소 ----- */
function guildPanel(tk,tab){const s=S();const t=D.TOWNS[tk];
  const tm=G.talkMain(tk+':guild');if(tm){say(tm.talk,()=>guildPanel(tk));hudRefresh();return;}
  tab=tab||'dung';let h=tabs([['dung','던전'],['daily','주간 의뢰'],['exam','승급 심사']],tab);
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
function dailyHtml(){const s=S();let h=`<p class="sub">5일마다 새로 바뀝니다 (다음 갱신까지 ${Math.max(1,5-(s.day-(s.dailyDay||0)))}일). 완료하면 귀환할 때 자동으로 보상을 받습니다.</p><div class="col">`;
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
  const bk=Object.keys(D.BOOKS).filter(k=>tk!=='camp'&&!relic&&D.TOWNS[tk]&&D.TOWNS[D.BOOKS[k].town].tier<=D.TOWNS[tk].tier);
  let h=tk==='camp'?'':tabs([['pot','물약'],['gear','장비'],['book','스킬서'],['sell','팔기']].filter(x=>!(relic&&x[0]==='pot')&&!(x[0]==='book'&&!bk.length)),tab);
  if(tk!=='camp'){const a=G.attitude(tk);h+=`<p class="sub">"${G.townLine(tk,'merchant')}" ${a===0?'<span class="bad">(무시 대우: 가격 +'+Math.round((pm/(1-0)-1)*100)+'%)</span>':a>=2?'<span class="good">(우대 할인 적용)</span>':''}</p>`;}
  if(tab==='pot'){h+='<div class="col">';for(const k of ['potion','hipotion','feather']){const c=D.CONSUM[k];const pr=Math.round(D.priceRef(lvRef)*c.price*pm/10)*10;
      h+=`<div class="itemrow" style="cursor:default">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} <small>보유 ${s.cons[k]||0}</small></div><div class="st">${c.d}</div></div><span class="price">${fmt(pr)} G</span><button data-bc="${k}" data-p="${pr}">사기</button></div>`;}h+='</div>';}
  else if(tab==='gear'){const items=shopStock(tk,relic);h+='<div class="col">';items.forEach((it,i)=>{if(it.sold)return;const pr=Math.round(it.val*pm/10)*10;h+=`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1"></span><span class="price">${fmt(pr)} G</span><button data-bi="${i}" data-p="${pr}">사기</button></div>`;});h+='</div><p class="sub">장비 목록은 매일 바뀝니다.</p>';}
  else if(tab==='book'){h+='<p class="sub">스킬서를 사서 용병단 → 스킬 탭에서 배우세요. 단장은 기본 스킬 외에 추가 스킬 2칸을 쓸 수 있고, 용병은 기본 스킬을 스킬서 스킬로 바꿀 수 있어요.</p><div class="col">';
    for(const k of bk){const sk=D.SKILLS[k],B=D.BOOKS[k];const pr=Math.round(G.bookPrice(k)*pm/10)*10;const who=B.who==='L'?'단장':B.who.map(j=>D.JOBS[j].n).join('·')+' 용병';
      h+=`<div class="itemrow" style="cursor:default">${icon(sk.ic||D.I(18,0))}<div style="flex:1"><div class="nm">📕 ${sk.n} <small>${who} · 보유 ${(s.books||{})[k]||0}권${(s.leader.learned||[]).includes(k)?' · <span class="good">배움</span>':''}</small></div><div class="st">${sk.d}${sk.cd?' · 재사용 '+sk.cd+'초':''}</div></div><span class="price">${fmt(pr)} G</span><button data-bk="${k}" data-p="${pr}">사기</button></div>`;}h+='</div>';}
  else{h+=sellHtml();}
  openPanelRaw((relic?'💎 유물 상점':tk==='camp'?'🧪 보급 상점':'🛒 상점'),h);bindTabs(k=>shopPanel(tk,relic,k));
  $('pBody').querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{const e=G.buyBook(b.dataset.bk,+b.dataset.p);if(e)return toast(e);sfx('coin',.3);toast('📕 '+D.SKILLS[b.dataset.bk].n+' 스킬서를 샀습니다');shopPanel(tk,relic,'book');});
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
  else{h+=`<p>던전에 가지 않고 하루를 보냅니다.</p><ul class="sub"><li>중상 회복이 하루 진행됩니다</li><li>주간 의뢰는 5일마다 새로 바뀝니다</li><li>용병단 급여 ${fmt(G.upkeep())} G가 나갑니다${G.campTax()?' (자치 세금 +'+fmt(G.campTax())+' G)':''}</li></ul><button class="go" id="restGo">🌙 하루 쉬기</button>`;}
  openPanelRaw(tk==='camp'?(tab==='heal'?'🏥 의무실':'🍺 용병 주점'):'🛏 여관 · 치료소',h);bindTabs(k=>innPanel(tk,k));
  $('pBody').querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{const e=G.hire(tk,b.dataset.hire);if(e)return toast(e);const m=S().mercs[S().mercs.length-1];m.lvHire=m.lv;sfx('coin',.35);
    say([[m.name,{brave:'좋아, 싸울 곳만 있다면 어디든 간다!',cold:'계약 조건을 확인했습니다. 잘 부탁드립니다.',cheer:'와아, 잘 부탁해요 단장님!',greedy:'돈만 제때 주면 불만 없어.',coward:'저, 저도 열심히 할게요... 앞에는 안 서도 되죠?',loyal:'오늘부터 이 검은 단장님의 것입니다.'}[m.pers]]]);G.checkMain();innPanel(tk,'hire');});
  $('pBody').querySelectorAll('[data-heal]').forEach(b=>b.onclick=()=>{const e=G.treat(b.dataset.heal);if(e)return toast(e);sfx('levelup',.3);toast('치료 완료!');innPanel(tk,'heal');});
  if($('restGo'))$('restGo').onclick=()=>{const r=G.restDay();closePanel();toast(`🌙 하루가 지났습니다. 급여 -${fmt(r.upkeep-(r.unpaid||0))} G`);hudRefresh();if(scene==='walk')enterWalk(S().loc,{x:Math.floor(player.x/T),y:Math.floor(player.y/T)});};}

/* ----- 대장간 (강화) ----- */
function oreBar(){const s=S(),o=s.ores||{};return `<div class="card" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font-size:13px">${Object.entries(D.ORES).map(([k,v])=>`<span title="${v.d}">${v.e} ${v.n} <b>${o[k]||0}</b></span>`).join('')}</div>`;}
function smithPanel(tk){const s=S();const its=s.inv.slice().sort((a,b)=>(G.ownerOf(b.id)?1:0)-(G.ownerOf(a.id)?1:0));const ip=Math.round(D.priceRef(Math.max(5,s.leader.lv))*.06/10)*10;
  let h=`<p class="sub">강화할 때마다 능력치 +8% (최대 +10). 금화와 광석이 들고, 실패하면 둘 다 잃지만 단계는 내려가지 않습니다.<br>+1~3 철광석 · +4~6 은광석 · +7~8 흑요석 · +9~10 화염 결정 — 은광석부터는 직접 캐야 합니다.</p>${oreBar()}
  ${tk==='camp'?'':`<div class="row" style="justify-content:center;margin:4px 0 8px"><button id="buyIron">🪨 철광석 1개 사기 (${fmt(ip)} G)</button></div>`}<div class="col">`;
  for(const it of its){const o=G.ownerOf(it.id);const q=G.enhNeed(it);const e=it.enh||0;const have=q?((s.ores||{})[q.ore]||0):0;
    h+=`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1;font-size:11px" class="sub">${o?'장착: '+o.name:''}</span>${!q?'<b>최대</b>':`<span class="price">${fmt(q.gold)} G<br><small>${D.ORES[q.ore].e}${have}/${q.n} · ${Math.round(q.rate*100)}%</small></span><button data-enh="${it.id}" ${have<q.n||s.gold<q.gold?'class="dim"':''}>+${e+1}</button>`}</div>`;}
  openPanelRaw(tk==='camp'?'🔨 목재 대장간':'⚒ 대장간',h+'</div>');
  if($('buyIron'))$('buyIron').onclick=()=>{if(s.gold<ip)return toast('금화가 부족합니다');G.addGold(-ip);G.addOre('iron',1);sfx('coin',.3);hudRefresh();smithPanel(tk);};
  $('pBody').querySelectorAll('[data-enh]').forEach(b=>b.onclick=()=>{const r=G.enhance(b.dataset.enh);if(r==='ok'){sfx('levelup',.35);toast('✨ 강화 성공!');}else if(r==='fail'){sfx('lose',.3);toast('강화 실패... 광석이 부서졌다');}else toast(r);hudRefresh();G.save();smithPanel(tk);});}

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
function subRew(id){const q=D.SUBS[id],rw=q.reward,a=[];if(rw.gold)a.push('💰 '+fmt(rw.gold)+' G');if(rw.item)a.push('🧪 '+D.CONSUM[rw.item].n);
  if(rw.uniq)a.push('⚔ '+D.UNIQUE[rw.uniq].n+' (고유 장비)');if(rw.decor)a.push('🌼 장식 '+D.DECOR[rw.decor].n);
  a.push('⭐ 명성 +'+Math.round(60*D.TIER[D.TOWNS[q.town].tier].fameMul));a.push('🤝 '+D.TOWNS[q.town].n+' 평판 +15');return a.join(' · ');}
function subDialog(e){const s=S();const id=e.sub,q=D.SUBS[id];G.subCheck();const st=s.subs[id];
  if(!st&&q.req&&!(s.subs[q.req]&&s.subs[q.req].state==='claimed')){const rq=D.SUBS[q.req];say([[q.npc,`(${rq.npc}의 부탁을 먼저 들어주면 이야기해 볼게.)`],['나레이션',`먼저 ${D.TOWNS[rq.town].n}의 ${rq.npc} 의뢰 「${rq.n}」을(를) 끝내야 합니다.`]]);return;}
  if(!st){say([[q.npc,q.talk],['나레이션',`의뢰 「${q.n}」: ${q.goal}\n보상: ${subRew(id)}`]],()=>{confirmBox(`의뢰 「${q.n}」을(를) 받겠습니까?<br><span class="sub">${q.goal}</span><div style="margin-top:6px;font-size:13px"><b>보상</b> ${subRew(id)}</div>`,()=>{G.acceptSub(id);toast('의뢰 수락: '+q.n);hudRefresh();});});return;}
  if(st.state==='done'){const got=G.claimSub(id);sfx('levelup',.4);say([...(q.done||[[q.npc,'정말 고마워요! 약속한 보상이에요.']]),['나레이션','보상: '+got.join(', ')+' · '+D.TOWNS[q.town].n+' 호감 ↑']]);hudRefresh();return;}
  if(st.state==='claimed'){say([[q.npc,q.after||'덕분에 큰 도움이 됐어요. 철혈 맹약단, 응원할게요!']]);return;}
  say([[q.npc,`${q.goal} — 지금 ${st.prog}/${q.count}예요. 잘 부탁해요!`],['나레이션','보상: '+subRew(id)]]);}

function cqRew(q){const r=q.reward||{},a=[];if(r.gold)a.push(fmt(r.gold)+' G');if(r.item)a.push(D.CONSUM[r.item].n);if(r.decor)a.push('장식: '+D.DECOR[r.decor].n);a.push('대륙 모든 마을 호감');return a.join(', ');}
function cqDialog(e){const x=G.cqCur(e.cq);if(!x)return say([[e.name,'대륙에 평화가 찾아왔구려. 고맙소.']]);const {q,st}=x;const C=D.CQ[e.cq];const tag=`🌍 대륙 의뢰 「${C.n}」 ${st.i+1}/${C.steps.length}`;
  if(e.recv){const got=G.cqClaim(e.cq);sfx('levelup',.4);say([...q.done,['나레이션',`${tag} · ${q.n} 완료!\n보상: ${got.join(', ')}`]]);hudRefresh();G.save();return;}
  if(!st.state){if(!G.cqOk(q))return say([[q.npc,`아직은 맡길 수 없는 일이오. ${q.rank}등급이 되면 다시 찾아오시오.`]]);
    say([...q.talk,['나레이션',`${tag}\n${q.goal}\n보상: ${cqRew(q)}`]],()=>confirmBox(`${tag}<br><b>${q.n}</b><br><span class="sub">${q.goal}</span><div style="margin-top:6px;font-size:13px"><b>보상</b> ${cqRew(q)}</div>`,()=>{G.cqAccept(e.cq);toast('대륙 의뢰 수락: '+q.n);hudRefresh();G.save();if(q.type==='deliver')toast('📜 '+D.TOWNS[q.to].n+'의 '+q.toNpc+'에게 전해 주세요');}));return;}
  if(st.state==='done'){const got=G.cqClaim(e.cq);sfx('levelup',.4);say([...q.done,['나레이션',`${tag} · ${q.n} 완료!\n보상: ${got.join(', ')}`]]);hudRefresh();G.save();return;}
  say([[q.npc,q.type==='deliver'?`${D.TOWNS[q.to].n}의 ${q.toNpc}에게 잘 전해 주시오.`:`${q.goal} — 지금 ${st.prog}/${q.count}.`]]);}

/* ----- 집결지: 막사 · 건설 · 꾸미기 · 훈련소 ----- */
function tentPanel(){const s=S();let h=`<div class="grid3">
  <button data-a="party">👥 용병단 관리</button><button data-a="build">🔨 건설 · 꾸미기</button><button data-a="rest">🌙 하루 쉬기</button><button data-a="save">💾 저장</button><button data-a="world">🗺 월드맵 · 출정</button><button data-a="quest">📜 퀘스트</button></div>`;
  h+=dungList(['d_ruin','d_mist','d_nest'],'거점 직통 던전');
  openPanelRaw(s.camp.built.keep?'🏰 석조 본성':'⛺ 단장 막사',h);bindLocInfo2();
  $('pBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;if(a==='party')openPanel('party');else if(a==='build')buildPanel();else if(a==='rest')innPanel('camp','rest');else if(a==='save'){G.save();toast('💾 저장했습니다');}else if(a==='world')openPanel('world');else if(a==='quest')openPanel('quest');});}
function buildPanel(focus,tab){const s=S();tab=tab||'build';let h=tabs([['build','건설'],['decor','꾸미기'],['tier','거처 승급']],tab);
  if(tab==='build')h+=`<div class="card" style="display:flex;align-items:center;gap:8px"><div style="flex:1;font-size:13px">건물은 원하는 곳에 직접 놓습니다. 지은 건물 <b>이동·철거</b>, <b>길 깔기·없애기</b>도 할 수 있어요.${s.camp.tier>=3?' (3단계부터 땅이 넓어집니다)':''}</div><button class="go" id="bEdit">🏗 배치 편집</button></div>`;
  if(tab==='build'){h+='<div class="col">';const ks=Object.keys(D.BUILDS).filter(k=>D.BUILDS[k].tier<=s.camp.tier);
    for(const k of ks){const b=D.BUILDS[k];const done=s.camp.built[k];h+=`<div class="itemrow ${focus===k?'glow':''}" style="cursor:default">${icon(b.ic)}<div style="flex:1"><div class="nm">${b.n} <small class="sub">${b.tier}단계</small></div><div class="st">${b.d}</div></div>${done?'<b class="good">완료</b>':`<span class="price">${fmt(b.cost)} G</span><button class="go" data-b="${k}" ${s.gold>=b.cost?'':'disabled'}>건설</button>`}</div>`;}
    const nt=Object.keys(D.BUILDS).filter(k=>D.BUILDS[k].tier===s.camp.tier+1);if(nt.length)h+=`<p class="sub">다음 단계에서 지을 수 있는 건물: ${nt.map(k=>D.BUILDS[k].n).join(', ')}</p>`;h+='</div>';}
  else if(tab==='decor'){h+=`<p class="sub">꾸미기 점수 ${G.decorPts()} pt · 장식은 정해진 자리에 보기 좋게 놓입니다.</p><div class="col">`;
    for(const k in D.DECOR){const d=D.DECOR[k];const p=G.decorPrice(k);const n=s.camp.decor.filter(x=>x===k).length;
      h+=`<div class="itemrow" style="cursor:default">${icon(d.ic)}<div style="flex:1"><div class="nm">${d.n} <small>+${d.pt} pt · 보유 ${n}</small></div>${p?'':`<div class="st">${d.tier}단계부터</div>`}</div>${p?`<span class="price">${fmt(p)} G</span><button data-d="${k}" ${s.gold>=p?'':'disabled'}>설치</button>`:''}</div>`;}h+='</div>';}
  else{const nx=G.campNext();if(!nx)h+='<p class="good">최고 단계입니다!</p>';else{h+=`<div class="card"><h4>${nx.tier}단계 ${nx.name}</h4><div>등급 ${nx.rank} 이상: ${nx.rankOk?'✅':'❌'}</div>${nx.build.map(([k,ok])=>`<div>건설 [${D.BUILDS[k].n}]: ${ok?'✅':'❌'}</div>`).join('')}<div>꾸미기 ${nx.decor}/${nx.decorNeed} pt ${nx.decor>=nx.decorNeed?'✅':'❌'}</div><div>비용 ${fmt(nx.cost)} G ${s.gold>=nx.cost?'✅':'❌'}</div><div class="grew sub" style="margin-top:4px">✨ ${nx.reward}</div><button class="go" id="tUp" ${nx.ok?'':'disabled'} style="margin-top:6px">거처 승급</button></div>`;}}
  openPanelRaw('🔨 집결지 건설',h);bindTabs(k=>buildPanel(focus,k));
  $('pBody').querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const k=b.dataset.b;
    if(!CB[k]){const e=G.build(k);if(e)return toast(e);sfx('levelup',.4);toast('🔨 '+D.BUILDS[k].n+' 완공!');rebuildCamp();buildPanel(null,'build');return;}
    if(S().gold<D.BUILDS[k].cost)return toast('금화가 부족합니다');if(S().loc!=='camp')return toast('집결지에 가서 지을 수 있어요');edStart('place',k);});
  if($('bEdit'))$('bEdit').onclick=()=>edStart('move');
  $('pBody').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const e=G.buyDecor(b.dataset.d);if(e)return toast(e);sfx('coin',.35);toast('🌼 '+D.DECOR[b.dataset.d].n+' 설치!');rebuildCamp();buildPanel(null,'decor');});
  if($('tUp'))$('tUp').onclick=()=>{const e=G.campUpgrade();if(e)return toast(e);sfx('levelup',.5);closePanel();toast(`🎉 집결지가 [${D.CAMP_TIERS[S().camp.tier].n}](으)로 승급!`);enterWalk('camp');};}
function rebuildCamp(){if(scene==='walk'&&S().loc==='camp'){const px=Math.floor(player.x/T),py=Math.floor(player.y/T);enterWalk('camp',{x:px,y:py});if(isBlocked(MAP,px,py)){const [x,y]=freeTileNear(px,py,3);player.x=(x+.5)*T;player.y=(y+.5)*T;}}hudRefresh();}
function trainingPanel(){const s=S();let h='<p class="sub">교관은 전투에 나가지 않고 훈련소를 지킵니다. 대기 용병의 경험치 획득이 30% 늘어납니다. (영구 장애 용병에게 좋은 자리)</p><div class="col">';
  for(const m of s.mercs)h+=`<div class="itemrow" style="cursor:default"><img class="spr" src="${portrait(unitDesc(m),40)}" width="40" height="40"><div style="flex:1"><div class="nm">${m.name} <small>Lv${m.lv} ${D.JOBS[m.job].n}</small></div><div class="st">${m.instructor?'🎖 교관':m.dis?'영구 장애':m.seq?'후유증':'정상'}</div></div><button data-ins="${m.id}">${m.instructor?'교관 해제':'교관 임명'}</button></div>`;
  openPanelRaw('🎯 훈련소',h+'</div>');$('pBody').querySelectorAll('[data-ins]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.ins);m.instructor=!m.instructor;if(m.instructor){S().party=S().party.filter(x=>x!==m.id);say([[m.name,G.mercLine(m)]]);}trainingPanel();});}

/* ================= 용병단 · 장비 · 퀘스트 · 메뉴 ================= */
function statBlock(st){return `<div class="stat"><span>HP <b>${fmt(st.hp)}</b></span><span>공격 <b>${st.atk}</b></span><span>마력 <b>${st.mag}</b></span><span>방어 <b>${st.def}</b></span><span>속도 <b>${st.spd}</b></span><span>치명 <b>${st.crit}%</b></span><span>회피 <b>${st.eva}%</b></span>${st.cdr?`<span>쿨감 <b>${Math.round(st.cdr*100)}%</b></span>`:''}</div>`;}
function partyPanel(tab){const s=S();tab=tab||'leader';let h=tabs([['leader','단장'],['mercs',`용병 (${s.mercs.length}/${G.maxRoster()})`],['skill','스킬']],tab);
  if(tab==='skill'){const L=s.leader,c=D.LCLASS[L.cls];const bs=L.bsk||[];
    h+=`<div class="card"><h4>단장 스킬 <small class="sub">기본 ${c.skills.length}개 + 추가 칸 ${bs.length}/2</small></h4>`;
    for(const k of c.skills){const sk=D.SKILLS[k];h+=`<div style="font-size:12.5px">${icon(sk.ic,20)} <b>${sk.n}</b> <small class="sub">직업 기본</small> — ${sk.d}</div>`;}
    for(const k of (L.learned||[])){const sk=D.SKILLS[k],on=bs.includes(k);h+=`<div class="row" style="font-size:12.5px;margin-top:3px">${icon(sk.ic,20)}<div style="flex:1"><b>${sk.n}</b> ${on?'<span class="good">장착</span>':'<span class="sub">보관</span>'} — ${sk.d}</div><button data-eqs="${k}">${on?'빼기':'장착'}</button><button class="warn" data-fgs="${k}">지우기</button></div>`;}
    if(!(L.learned||[]).length)h+='<p class="sub" style="font-size:12px">아직 배운 추가 스킬이 없어요. 광산촌·항구·황성 상점에서 스킬서를 살 수 있습니다.</p>';h+='</div>';
    const books=Object.keys(s.books||{}).filter(k=>s.books[k]>0);
    h+=`<div class="card"><h4>보유 스킬서</h4>`;if(!books.length)h+='<p class="sub" style="font-size:12px">스킬서가 없습니다.</p>';
    for(const k of books){const sk=D.SKILLS[k],B=D.BOOKS[k];let ctl='';
      if(B.who==='L')ctl=(L.learned||[]).includes(k)?'<span class="sub">이미 배움</span>':`<button class="go" data-lrn="${k}">단장이 배우기</button>`;
      else{const ok=s.mercs.filter(m=>B.who.includes(m.job));ctl=ok.length?`<select data-sel="${k}">${ok.map(m=>`<option value="${m.id}">${m.name} (${D.JOBS[m.job].n})</option>`).join('')}</select><button class="go" data-lrn="${k}">배우기</button>`:`<span class="sub">${B.who.map(j=>D.JOBS[j].n).join('·')} 용병이 없음</span>`;}
      h+=`<div class="row" style="font-size:12.5px;margin-top:3px">📕<div style="flex:1"><b>${sk.n}</b> ×${s.books[k]} — ${sk.d}</div>${ctl}</div>`;}
    h+='</div><div class="card"><h4>용병 스킬</h4>';
    for(const m of s.mercs){const j=D.JOBS[m.job],k=m.sk2||j.skill,sk=D.SKILLS[k];h+=`<div class="row" style="font-size:12.5px"><div style="flex:1"><b>${m.name}</b> <small>${j.n}</small> — ${sk.n}${m.sk2?' <span class="good">(스킬서)</span>':''}</div>${m.sk2?`<button class="warn" data-fgm="${m.id}">지우기 (기본으로)</button>`:''}</div>`;}
    h+='<p class="sub" style="font-size:12px">스킬을 지우면 스킬서는 사라집니다.</p></div>';
    openPanelRaw('👥 철혈 맹약단',h);bindTabs(k=>partyPanel(k));
    $('pBody').querySelectorAll('[data-eqs]').forEach(b=>b.onclick=()=>{const e=G.equipBook(b.dataset.eqs);if(e)toast(e);partyPanel('skill');});
    $('pBody').querySelectorAll('[data-fgs]').forEach(b=>b.onclick=()=>confirmBox(`「${D.SKILLS[b.dataset.fgs].n}」을(를) 지울까요? 스킬서는 돌아오지 않습니다.`,()=>{G.forgetSkill(b.dataset.fgs);partyPanel('skill');}));
    $('pBody').querySelectorAll('[data-fgm]').forEach(b=>b.onclick=()=>confirmBox('이 용병의 스킬서 스킬을 지우고 기본 스킬로 되돌릴까요?',()=>{G.forgetSkill(null,b.dataset.fgm);partyPanel('skill');}));
    $('pBody').querySelectorAll('[data-lrn]').forEach(b=>b.onclick=()=>{const k=b.dataset.lrn,sel=$('pBody').querySelector(`[data-sel="${k}"]`);const e=G.learnBook(k,sel&&sel.value);if(e)return toast(e);sfx('levelup',.35);toast('✨ '+D.SKILLS[k].n+' 습득!');partyPanel('skill');});
    return;}
  if(tab==='leader'){const L=s.leader,c=D.LCLASS[L.cls],st=G.leaderStats();
    h+=`<div class="row" style="align-items:flex-start"><img class="spr" src="${portrait(unitDesc(L),72)}" width="72" height="72"><div style="flex:1"><h3 style="margin:0">${L.name} <small>Lv${L.lv} ${c.n}</small></h3><div style="font-size:12.5px">칭호 <select id="tSel">${G.titles().map(t=>`<option value="${t.k}" ${G.title()===t.n?'selected':''}>${t.n}</option>`).join('')}</select> <small class="sub">(${G.titles().length}/${G.TITLES.length}개 획득)</small></div>
      <div class="bar" style="margin:3px 0"><i style="width:${L.exp/G.expNeed(L.lv)*100}%;background:#5fb3ff"></i></div><small class="sub">경험치 ${fmt(L.exp)}/${fmt(G.expNeed(L.lv))}</small>${statBlock(st)}</div></div>`;
    h+=`<div class="card" style="margin-top:6px"><h4>능력치 ${L.pts?`<span class="good">(남은 포인트 ${L.pts})</span>`:''}</h4><div class="col">`;
    const ex={STR:'물리 공격력·최대 HP',AGI:'행동 속도·치명타·회피',INT:'마법·스킬 위력, 쿨타임 감소, 함정·보물 발견',CHA:'급여·고용비 할인, 상점 우대, 명성 증가, 수도의 무시 완화'};const nm={STR:'힘',AGI:'민첩',INT:'지력',CHA:'매력'};
    for(const k of ['STR','AGI','INT','CHA'])h+=`<div class="row"><b style="width:44px">${nm[k]}</b><b style="width:30px">${L[k]}</b><span class="sub" style="flex:1">${ex[k]}</span>${L.pts?`<button data-pt="${k}">+1</button>`:''}</div>`;
    h+='</div></div>';
    h+=`<div class="card"><h4>스킬</h4>${G.leaderSkills().map(k=>{const sk=D.SKILLS[k];return `<div style="font-size:12.5px">${icon(sk.ic,20)} <b>${sk.n}</b> ${sk.lv&&L.lv<sk.lv?`<span class="bad">(Lv${sk.lv} 해금)</span>`:''} — ${sk.d} <small class="sub">재사용 ${sk.cd}초</small></div>`;}).join('')}${c.passive?`<div style="font-size:12.5px">패시브: ${D.PASSIVE[c.passive]}</div>`:''}${!c.base?'<div class="sub" style="font-size:12px">C등급이 되면 황성의 전직의 전당에서 상위 직업으로 전직할 수 있습니다.</div>':''}</div>`;
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
  const tsel=$('tSel');if(tsel)tsel.onchange=()=>{S().title=tsel.value;G.save();toast('칭호: '+G.title());};
  $('pBody').querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{const L=S().leader;if(L.pts<=0)return;L.pts--;L[b.dataset.pt]++;sfx('click',.2);partyPanel('leader');});
  $('pBody').querySelectorAll('[data-p]').forEach(b=>b.onchange=()=>{const id=b.dataset.p;if(b.checked){if(s.party.length>=4){b.checked=false;return toast('출정 파티는 용병 4명까지입니다');}s.party.push(id);}else s.party=s.party.filter(x=>x!==id);G.checkMain();});
  $('pBody').querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>equipPanel(G.mercById(b.dataset.eq)));
  $('pBody').querySelectorAll('[data-ins2]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.ins2);m.instructor=!m.instructor;if(m.instructor)S().party=S().party.filter(x=>x!==m.id);partyPanel('mercs');});
  $('pBody').querySelectorAll('[data-cut]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.cut);m.wageCut=true;say([[m.name,m.pers==='greedy'?'몸이 이 꼴이 됐는데 급여까지 깎을 셈이야? ...하, 알았어. 먹고는 살아야지.':m.pers==='loyal'?'단장님의 뜻이라면 따르겠습니다.':'...알겠습니다. 받아들이죠.']]);partyPanel('mercs');});
  $('pBody').querySelectorAll('[data-fire]').forEach(b=>b.onclick=()=>{const m=G.mercById(b.dataset.fire);confirmBox(`${m.name}을(를) 해고하겠습니까? 장착 장비는 가방으로 돌아옵니다.`,()=>{say([[m.name,{brave:'흥, 다른 데서 더 센 놈들이랑 싸우지 뭐.',cold:'계약 종료, 확인했습니다.',cheer:'아쉽지만... 다들 잘 지내요!',greedy:'퇴직금은 없나? 쳇.',coward:'저, 저... 알겠어요...',loyal:'...언제든 부르시면 달려오겠습니다.'}[m.pers]]]);G.fire(m.id);partyPanel('mercs');if(scene==='walk'&&S().loc==='camp')rebuildCamp();});});
  bindEquip(s.leader,()=>partyPanel('leader'));}
function equipHtml(u){let h=`<div class="card"><h4>장비</h4><div class="slotbox">`;const nm={wpn:'무기',off:'보조 (방패)',arm:'방어구',acc1:'장신구 1',acc2:'장신구 2'};
  for(const sl of G.SLOTS){const it=u.eq[sl]&&G.itemById(u.eq[sl]);h+=`<div class="slot" data-slot="${sl}" data-u="${u===S().leader?'L':u.id}">${it?icon(it.ic,28):'<span class="ic32" style="width:28px;height:28px;opacity:.3;background:#a08060;border-radius:4px"></span>'}<div><b>${nm[sl]}</b><br>${it?`<span style="color:${shade(D.RARITY[it.rar].c,-.4)}">${it.name}${it.enh?' +'+it.enh:''}</span><br><small>${statStr(it)}</small>${G.gearWarn(u,it)?`<br><small class="bad">⚠ ${G.gearWarn(u,it)}</small>`:''}`:sl==='off'&&u.eq.wpn&&G.H2.includes((G.itemById(u.eq.wpn)||{}).cls)?'<small class="sub">두손 무기 사용 중</small>':'<small class="sub">비어 있음</small>'}</div></div>`;}
  return h+'</div><div class="sub" style="font-size:12px;margin-top:4px">칸을 누르면 바꿀 장비를 고를 수 있습니다.</div></div>';}
function bindEquip(u,re){$('pBody').querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const uu=b.dataset.u==='L'?S().leader:G.mercById(b.dataset.u);pickItem(uu,b.dataset.slot,re);});}
function equipPanel(m){const st=G.mercStats(m);openPanelRaw('🎒 '+m.name+' 장비',`<div class="row"><img class="spr" src="${portrait(unitDesc(m),56)}" width="56" height="56"><div>${D.JOBS[m.job].n} · 맞는 무기: ${D.JOBS[m.job].wpn.map(w=>D.WPN[w].n).join(', ')}${G.shieldOk(m)?' · 방패 가능':''}${statBlock(st)}</div></div>`+equipHtml(m)+'<button id="eBack">◀ 용병 목록</button>');
  bindEquip(m,()=>equipPanel(m));$('eBack').onclick=()=>partyPanel('mercs');}
function pickItem(u,slot,back){const s=S();const want=slot.startsWith('acc')?'acc':slot;const cur=u.eq[slot]&&G.itemById(u.eq[slot]);
  const list=s.inv.filter(i=>i.slot===want&&G.canEquip(u,i)&&i.id!==u.eq[slot]).sort((a,b)=>b.lv-a.lv||b.rar-a.rar);
  const why=slot==='off'&&u.eq.wpn&&G.H2.includes((G.itemById(u.eq.wpn)||{}).cls);
  let h=`<p>${u.name}의 ${({wpn:'무기',off:'보조 (방패)',arm:'방어구',acc1:'장신구 1',acc2:'장신구 2'})[slot]} — 현재: ${cur?itemLine(cur):'없음'}</p>${cur?'<button id="uneq">장비 해제</button>':''}<div class="col" style="margin-top:6px">`;
  if(slot==='wpn')h+='<p class="sub" style="font-size:12px">한손 무기(검·둔기·단검)는 보조 칸에 방패를 낄 수 있고, 두손 무기(도끼·활·지팡이)는 방패를 못 끼는 대신 공격력이 30% 높습니다.</p>';
  if(why)h+='<p class="bad">두손 무기를 들고 있어 방패를 낄 수 없습니다. 한손 무기로 바꾸세요.</p>';
  for(const it of (why?[]:list)){const o=G.ownerOf(it.id);const w=G.gearWarn(u,it);h+=`<div class="itemrow" data-pick="${it.id}">${itemLine(it)}${w?`<small class="bad" style="max-width:120px">⚠ ${w}</small>`:''}<span style="flex:1"></span><small class="sub">${o?'장착: '+o.name:''}</small><button>장착</button></div>`;}
  if(!list.length)h+='<p class="sub">장착할 수 있는 장비가 없습니다. 상점이나 던전에서 구하세요.'+'</p>';
  openPanelRaw('장비 고르기',h+'</div><button id="pkBack">◀ 돌아가기</button>');
  $('pBody').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{G.equip(u,b.dataset.pick,slot.startsWith('acc')?slot:null);sfx('click',.25);back();});
  if($('uneq'))$('uneq').onclick=()=>{G.unequip(u,slot);back();};$('pkBack').onclick=back;}
function bagPanel(tab){const s=S();tab=tab||'gear';let h=tabs([['gear',`장비 (${s.inv.filter(i=>!G.ownerOf(i.id)).length}/40)`],['use','소모품']],tab);
  if(tab==='gear'){const its=s.inv.slice().sort((a,b)=>b.lv-a.lv||b.rar-a.rar);h+='<div class="col">';
    for(const it of its){const o=G.ownerOf(it.id);h+=`<div class="itemrow" style="cursor:default">${itemLine(it)}<span style="flex:1"></span><small class="sub">${o?'장착: '+o.name:''}</small>${!o?`<button data-sell="${it.id}">팔기 ${fmt(Math.round(it.val*.25*(1+.15*(it.enh||0))))}G</button>`:''}</div>`;}
    h+='</div><p class="sub">장착은 용병단 창에서 각 인물의 장비 칸을 눌러 합니다.</p>';}
  else{h+='<div class="col">';for(const k in D.CONSUM){const c=D.CONSUM[k];const n=s.cons[k]||0;if(!n&&c.stat)continue;h+=`<div class="itemrow" style="cursor:default">${icon(c.ic)}<div style="flex:1"><div class="nm">${c.n} ×${n}</div><div class="st">${c.d}</div></div>${c.stat&&n?`<button data-use="${k}">사용</button>`:''}</div>`;}h+='</div>';}
  openPanelRaw('🎒 가방',oreBar()+h);bindTabs(k=>bagPanel(k));bindSell(()=>bagPanel('gear'));
  $('pBody').querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{G.useConsumable(b.dataset.use);sfx('levelup',.4);toast(D.CONSUM[b.dataset.use].d+'!');bagPanel('use');});}
function questPanel(){const s=S();const m=G.curMain();let h='<div class="card"><h4>★ 메인 — 《부러진 깃발의 후계자》</h4>';
  if(m)h+=`<div><b>${m.ch}장 · ${m.n}</b></div><div>${m.goal}</div>`;else h+='<div class="good">용병왕 등극! 메인 스토리를 모두 마쳤습니다.</div>';
  const ex=G.examReady();if(ex)h+=`<div class="sub">명성 ${fmt(s.fame)} / ${fmt(ex.fame)} ${ex.ok?'✅ 심사 가능 — '+D.TOWNS[ex.town].n+' 의뢰소':''}</div>`;
  h+=`<div class="sub" style="margin-top:4px">진행: ${D.MAIN.slice(0,s.main).map(x=>x.n).slice(-4).join(' → ')}</div></div>`;
  h+='<div class="card"><h4>🌍 대륙 의뢰</h4>';for(const c in D.CQ){const C=D.CQ[c],x=G.cqCur(c);h+=`<div style="font-size:13px;margin-bottom:4px"><b>${c==='west'?'서방':'동방'} — 「${C.n}」</b> <small class="sub">${C.d}</small><br>`;
    if(!x)h+='<span class="good">완료! 대륙에 평화가 찾아왔다.</span>';else{const {q,st}=x;const where=q.type==='deliver'&&st.state==='active'?`${D.TOWNS[q.to].n} · ${q.toNpc}`:`${D.TOWNS[q.town].n} · ${q.npc}`;
      h+=`${st.i+1}/${C.steps.length} <b>${q.n}</b> (${where}) — ${!st.state?(G.cqOk(q)?'의뢰인에게 말 걸기 (파란 「!」)':q.rank+'등급부터'):q.type==='deliver'?'📜 전달하러 가기':st.state==='done'?'<span class="good">완료! 보고하기</span>':q.goal+' '+st.prog+'/'+q.count}`;}
    h+='</div>';}h+='</div>';
  h+='<div class="card"><h4>❗ 마을 의뢰</h4>';let any=false;
  for(const id in s.subs){const q=D.SUBS[id],st=s.subs[id];if(st.state==='claimed')continue;any=true;h+=`<div style="font-size:13px">• <b>${q.n}</b> (${D.TOWNS[q.town].n} · ${q.npc}) — ${q.goal} <b>${st.state==='done'?'<span class="good">완료! 의뢰인에게 보고</span>':st.prog+'/'+q.count}</b><div class="sub" style="font-size:12px;margin-left:10px">보상: ${subRew(id)}</div></div>`;}
  if(!any)h+='<div class="sub">진행 중인 의뢰가 없습니다. 마을에서 머리 위에 「!」가 있는 사람에게 말을 걸어 보세요.</div>';h+='</div>';
  h+=`<div class="card"><h4>📌 주간 의뢰</h4>`+dailyHtml()+'</div>';
  if(G.rankIdx(s.rank)>=G.rankIdx('C')){const c=G.cal();h+=`<div class="card"><h4>❓ 히든 — 비밀 경매장</h4><div style="font-size:13px">소문에 따르면 매달 <b>20~22일</b>, ${c.m%2===0?'푸른물결 항구 뒷골목':'황성 지하'}에 두건 쓴 중개인이 나타난다고 한다. ${G.auctionOpen()?'<b class="good">지금 열려 있다!</b>':`(오늘은 ${G.calStr(s.day)})`}</div></div>`;}
  h+=`<div class="card"><h4>📖 철혈 맹약단 연대기 <small class="sub">칭호: ${G.title()}</small></h4><div class="col" style="max-height:260px;overflow:auto">${(s.chron||[]).slice().reverse().map(e=>`<div style="font-size:12.5px"><b class="sub">${G.calStr(e.day)}</b> — ${e.t}</div>`).join('')||'<div class="sub">아직 기록이 없습니다.</div>'}</div></div>`;
  openPanelRaw('📜 퀘스트 · 연대기',h);}
function menuPanel(){let h=`<div class="grid3"><button id="mSave">💾 저장 (슬롯 ${G.slot})</button><button id="mTitle">🏠 타이틀로</button><button id="mHelp">❓ 도움말</button></div>
  <div class="card" style="margin-top:8px"><h4>플레이 정보</h4><div class="sub">${G.calStr(S().day)} (${S().day}일째) · 탐험 ${S().stats.runs}회 · 플레이 ${Math.floor(S().playSec/60)}분 · 자동 저장: 탐험·이동할 때마다</div></div>
  <div class="card"><h4>⚔ 전투</h4><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="mQuick" ${S().flags.quickStart?'':'checked'}> 전투 전에 배치 화면 보기 (끄면 저장된 배치로 바로 시작)</label></div>`;
  openPanelRaw('⚙ 메뉴',h);$('mQuick').onchange=e=>{S().flags.quickStart=!e.target.checked;G.save();};$('mSave').onclick=()=>{G.save();toast('💾 저장했습니다');};$('mTitle').onclick=()=>{G.save();closePanel();showTitle();};$('mHelp').onclick=helpPanel;}
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
const HAIR_N={shorthair:'짧은 머리',longhair:'긴 머리',curlyhair:'곱슬머리',mophair:'더벅머리',spikeyhair:'삐죽머리',bowlhair:'바가지 머리',bald:'민머리'};
const OUTFIT_N=['붉은 옷','푸른 옷','초록 옷','보라 옷','강철 갑옷','검은 옷','흰 옷','가죽 옷','황금 옷','청록 옷'];
const OUTFIT_C=['#e93245','#3a6ad8','#3aa04a','#8a4ac8','#9aa4b0','#2a2a34','#f0ece0','#a06a3a','#e0b030','#2aa8a0'];
const HAIR_C=['#e07317','#94452a','#2a2228','#f0c860','#c8ccd4','#c83a2a','#2a3a7a'];
const SKIN_C=SKINS.map(k=>`rgb(${k[0]},${k[1]},${k[2]})`);
let ngAnim=0;
function newGameForm(n){const look={o:0,hair:'shorthair',hc:1,sk:0,fc:0};let cls='sword',oTouched=false;
  const sw=(k,arr,cols,names)=>`<div class="ngrow"><span class="ngl">${k}</span><div class="ngsw" data-k="${arr}">${cols.map((c,i)=>`<button class="sw" data-i="${i}" title="${names?names[i]:''}" style="background:${c}"></button>`).join('')}</div></div>`;
  const cy=(k,key,len)=>`<div class="ngrow"><span class="ngl">${k}</span><div class="ngcy"><button data-cy="${key}" data-d="-1">◀</button><b id="ngv_${key}"></b><button data-cy="${key}" data-d="1">▶</button></div></div>`;
  let h=`<div class="box" style="padding:12px"><div style="font-weight:900;margin-bottom:6px">단장의 이름</div><input id="ngName" maxlength="8" value="레온" style="width:100%;font:inherit;font-size:16px;padding:6px;border:2px solid #a07850;border-radius:4px;background:#fffaf0">
  <div style="font-weight:900;margin:10px 0 6px">용병단 이름</div><input id="ngComp" maxlength="10" value="철혈 맹약단" style="width:100%;font:inherit;font-size:16px;padding:6px;border:2px solid #a07850;border-radius:4px;background:#fffaf0">
  <div style="font-weight:900;margin:10px 0 6px">단장의 모습</div>
  <div class="ngwrap"><div class="ngprev"><canvas id="ngCv" width="120" height="120"></canvas><button id="ngRnd" class="small">🎲 무작위</button></div><div class="ngopts">
  ${sw('피부색','sk',SKIN_C,SKIN_N)}${cy('얼굴','fc')}${cy('머리 모양','hair')}${sw('머리색','hc',HAIR_C,D.HAIR_COLORS)}${sw('옷','o',OUTFIT_C,OUTFIT_N)}<div class="sub" id="ngOn" style="font-size:12px;margin-top:2px"></div></div></div>
  <div style="font-weight:900;margin:10px 0 6px">시작 직업</div><div class="col">`;
  for(const k of ['sword','bow','mage']){const c=D.LCLASS[k];h+=`<button class="ngc ${k==='sword'?'sel':''}" data-c="${k}" style="text-align:left"><b>${c.n}</b> <small>— ${c.desc}</small><br><small class="sub">전직: ${c.adv.map(a=>D.LCLASS[a].n).join(' / ')}</small></button>`;}
  h+=`</div><div class="row" style="justify-content:space-between;margin-top:10px"><button id="ngBack">◀ 뒤로</button><button class="go" id="ngGo">시작하기 ▶</button></div></div>`;
  $('tSlots').innerHTML=h;look.o=D.LCLASS.sword.outfit;
  const upd=()=>{$('ngv_fc').textContent=FACES[look.fc].n;$('ngv_hair').textContent=HAIR_N[look.hair];
    $('tSlots').querySelectorAll('.ngsw').forEach(g=>g.querySelectorAll('.sw').forEach(b=>b.classList.toggle('sel',+b.dataset.i===look[g.dataset.k])));
    $('ngOn').textContent=`${SKIN_N[look.sk]} · ${D.HAIR_COLORS[look.hc]} ${HAIR_N[look.hair]} · ${OUTFIT_N[look.o]}`;};
  $('tSlots').querySelectorAll('.ngsw .sw').forEach(b=>b.onclick=()=>{const k=b.parentNode.dataset.k;look[k]=+b.dataset.i;if(k==='o')oTouched=true;upd();sfx('click');});
  $('tSlots').querySelectorAll('[data-cy]').forEach(b=>b.onclick=()=>{const k=b.dataset.cy,d=+b.dataset.d;
    if(k==='fc')look.fc=(look.fc+d+FACES.length)%FACES.length;else{const HL=[...D.HAIRS,'bald'];const i=HL.indexOf(look.hair);look.hair=HL[(i+d+HL.length)%HL.length];}upd();sfx('click');});
  $('ngRnd').onclick=()=>{look.sk=ri(0,4);look.fc=ri(0,FACES.length-1);look.hair=pick(D.HAIRS);look.hc=ri(0,6);look.o=ri(0,9);oTouched=true;upd();sfx('click');};
  $('tSlots').querySelectorAll('.ngc').forEach(b=>b.onclick=()=>{cls=b.dataset.c;if(!oTouched)look.o=D.LCLASS[cls].outfit;upd();$('tSlots').querySelectorAll('.ngc').forEach(x=>x.classList.toggle('sel',x===b));});
  upd();const cv=$('ngCv'),cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;const id=++ngAnim;let t0=performance.now();
  const loop=now=>{if(id!==ngAnim||!document.body.contains(cv))return;const t=(now-t0)/1000;cx.clearRect(0,0,120,120);
    cx.fillStyle='rgba(60,40,20,.25)';cx.beginPath();cx.ellipse(60,106,26,7,0,0,Math.PI*2);cx.fill();
    const c=D.LCLASS[cls];const an=(t%6)<3.5?'idle':'walk';drawHuman(cx,look,an,t,60,106,4.6,{bow:c.atkType==='bow'&&!c.tool,staff:c.atkType==='magic',staffColor:'#ffcf5a'});requestAnimationFrame(loop);};
  requestAnimationFrame(loop);
  $('ngBack').onclick=()=>{ngAnim++;renderSlots();};$('ngGo').onclick=()=>{ngAnim++;G.slot=n;G.newGame(($('ngName').value||'레온').trim().slice(0,8),cls);G.S.leader.look=Object.assign({},look);G.S.company=($('ngComp').value||'철혈 맹약단').trim().slice(0,10)||'철혈 맹약단';G.S.slot=n;startGame(true);};}
function startGame(isNew){$('title').classList.add('hidden');const s=S();s.mainShown=isNew?-1:s.mainShown;if(s.run&&(s.run.special||!s.run.seed||!D.DUNG[s.run.dk])){s.run=null;if(s.loc==='run')s.loc='camp';for(const u of [s.leader,...s.mercs])u.hp=null;}
  if(s.run){// 던전 도중 저장 → 이어서
    hudRefresh();$('hud').classList.remove('hidden');fadeTo(()=>enterDungeon());return;}
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
  if(edOn()&&ptrs.size===1&&(ED.mode==='road'||ED.mode==='unroad')&&!uiBusy()){edTap(e.clientX,e.clientY,true);return;}
  if(edOn()&&ptrs.size===1&&downP&&!uiBusy()){const p=ptrs.values().next().value;if(ED.lp){ED.cx=(ED.cx??cam.x)-(p[0]-ED.lp[0])/cam.z;ED.cy=(ED.cy??cam.y)-(p[1]-ED.lp[1])/cam.z;const hw=W/2/cam.z,hh=H/2/cam.z;ED.cx=clamp(ED.cx,hw,MAP.w*T-hw);ED.cy=clamp(ED.cy,hh,MAP.h*T-hh);}ED.lp=[p[0],p[1]];return;}
  if(scene==='walk'&&e.pointerType==='mouse'&&MAP&&!uiBusy()){const h=hitWalk(e.clientX,e.clientY);if(h.npc&&h.npc!==hoverObj&&h.npc.kind==='merc'&&!h.npc.bubble)h.npc.bubble={text:G.mercLine(h.npc.ref,h.npc.place),t:3.5};hoverObj=h.npc||null;cv.style.cursor=h.npc||h.obj?'pointer':'default';}});
const endPtr=e=>{if(ED)ED.lp=null;const was=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=0;
  if(was&&downP&&ptrs.size===0){const d=Math.hypot(e.clientX-downP[0],e.clientY-downP[1]);if(d<12){if(scene==='walk')walkTap(e.clientX,e.clientY);else if(scene==='dg')dgTap(e.clientX,e.clientY);else if(scene==='battle')battleTap(e.clientX,e.clientY);}}if(!ptrs.size)downP=null;};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);downP=null;});
cv.addEventListener('wheel',e=>{e.preventDefault();userZoom=clamp(userZoom*(e.deltaY>0?.9:1.1),.6,1.9);},{passive:false});
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();keys.add(k);
  if(k==='escape'){if(!$('dlg').classList.contains('hidden'))nextLine();else if(!$('panel').classList.contains('hidden')&&!$('panel').dataset.modal)closePanel();}
  if((k===' '||k==='enter')&&!$('dlg').classList.contains('hidden')){e.preventDefault();nextLine();}
  if(scene==='battle'&&BT&&BT.b.prep&&(k==='Enter'||k===' ')){const g=$('bGo');if(g)g.click();}
  if(scene==='battle'&&BT&&!BT.b.prep&&/^[1-4]$/.test(k)){const bs=$('bCmd').querySelectorAll('button');const b=bs[+k-1];if(b&&!b.disabled)b.click();}});
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
  else if(scene==='dg'){updDungeon(dt);renderDungeon();}
  else if(scene==='dmap'){ctx.fillStyle='#1b120b';ctx.fillRect(0,0,W,H);}
  requestAnimationFrame(frame);}
window.__dbg=()=>({cqDialog,pitBetPanel,smithPanel,subDialog,enterInterior,leaveInterior,casinoPanel,pitPanel,auctionPanel,minePanel,fishPanel,questPanel,setZoom:z=>userZoom=z,cam,enterDungeon,dgTap,dgInteract,encounter,openAct,guildPanel,innPanel,shopPanel,buildPanel,partyPanel,worldPanel,hitWalk,walkTap,scene,S:S(),BT,MAP,player,G,D,openPanel,enterWalk,startBattle,departDungeon,finishRun,closePanel,say,special});
loadAll(()=>{showTitle();requestAnimationFrame(frame);});
setInterval(()=>{if(S()&&scene==='walk')G.save();},30000);
window.addEventListener('beforeunload',()=>{if(S())G.save();});
})();
