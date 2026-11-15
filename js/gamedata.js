/* ==========================================================
   용병왕의 길 — 게임 데이터 (gamedata.js)
   직업·성격·대사·경제·던전·몬스터·아이템·퀘스트·집결지
   ========================================================== */
window.GD=(function(){
'use strict';
const I=(r,c)=>r*16+c; // Raven Fantasy Icons 32x32, 16열

/* ---------- 등급 ---------- */
const RANKS=['F','E','D','C','B','A','S'];
// 다음 등급 승급 조건: 명성 + 승급 심사(전투)
const PROMO={
  F:{fame:1500, exam:'exam_f', next:'E'},
  E:{fame:8500, exam:'exam_e', next:'D'},
  D:{fame:34000,exam:'exam_d', next:'C'},
  C:{fame:76000,exam:'exam_c', next:'B'},
  B:{fame:140000,exam:'exam_b',next:'A'},
  A:{fame:0,   exam:'final',  next:'S'}
};
const RANK_COLOR={F:'#9a8f80',E:'#7fbf6a',D:'#5fa8e8',C:'#b07ae8',B:'#e8a23a',A:'#ff6a5a',S:'#ffe066'};

/* ---------- 티어별 경제 (요청서 5.2 표) ---------- */
// inc: 던전 1회 평균 수익, up: 유지비 기준, build: 건물 단가 범위, fameMul: 명성 배수
const TIER=[null,
  {n:'1티어',inc:1000,  up:300,   build:[1500,2500],     fameMul:1,  lv:[1,10]},
  {n:'2티어',inc:5000,  up:1500,  build:[8000,12000],    fameMul:2.5,lv:[10,20]},
  {n:'3티어',inc:25000, up:7000,  build:[40000,60000],   fameMul:6,  lv:[20,32]},
  {n:'4티어',inc:120000,up:35000, build:[200000,350000], fameMul:14, lv:[32,45]},
  {n:'심연', inc:250000,up:60000, build:[0,0],           fameMul:25, lv:[44,50]}
];
// 레벨 기준 가격 곡선: 5레벨 1,000 → 15레벨 약 4,300 → 26레벨 약 21,000 → 38레벨 약 126,000
const priceRef=L=>Math.max(500,Math.round(1000*Math.pow(1.158,L-5)));
// 용병 1회 급여 (레벨·등급)
const GRADES=[
  {n:'일반',c:'#d8d0c0',m:1,  w:1},
  {n:'고급',c:'#7fd06a',m:1.1,w:1.25},
  {n:'희귀',c:'#5fb3ff',m:1.22,w:1.6},
  {n:'영웅',c:'#c07aff',m:1.38,w:2.1}
];
const POTENTIAL=[{n:'평범',m:1,c:'#bbb'},{n:'우수',m:1.15,c:'#8fd0ff'},{n:'천재',m:1.32,c:'#ffd166'}];
const wageOf=(L,g)=>Math.round(45*Math.pow(1.158,L-1)*GRADES[g].w/5)*5;

/* ---------- 직업 ---------- */
// row: front(전열) / back(후열). wpn: 장착 가능한 무기 분류
const JOBS={
  warrior:{n:'검사',row:'front',wpn:['sword','axe'],outfit:0,tool:true,
    b:{hp:110,atk:14,mag:4,def:8,spd:30,crit:6,eva:4},g:{hp:18,atk:3.0,mag:.4,def:1.6,spd:.22},
    skill:'whirl',atkType:'slash',desc:'전열 근접 딜러. 앞의 적 둘을 휩쓴다'},
  guard:{n:'방패병',row:'front',wpn:['sword','mace'],outfit:4,tool:true,
    b:{hp:145,atk:10,mag:3,def:12,spd:26,crit:3,eva:2},g:{hp:24,atk:2.2,mag:.3,def:2.4,spd:.18},
    skill:'taunt',atkType:'slash',desc:'단단한 벽. 적의 공격을 끌어온다'},
  archer:{n:'궁수',row:'back',wpn:['bow'],outfit:2,tool:false,
    b:{hp:85,atk:15,mag:4,def:5,spd:34,crit:10,eva:7},g:{hp:13,atk:3.2,mag:.4,def:1.0,spd:.3},
    skill:'volley',atkType:'bow',desc:'후열 원거리. 빠르고 치명타가 잦다'},
  mage:{n:'마도사',row:'back',wpn:['staff'],outfit:1,tool:false,
    b:{hp:75,atk:5,mag:17,def:4,spd:28,crit:5,eva:4},g:{hp:11,atk:.6,mag:3.5,def:.9,spd:.24},
    skill:'fireball',atkType:'magic',desc:'후열 광역 마법. 몸이 약하다'},
  priest:{n:'사제',row:'back',wpn:['staff'],outfit:6,tool:false,
    b:{hp:85,atk:5,mag:14,def:6,spd:29,crit:4,eva:4},g:{hp:13,atk:.5,mag:2.8,def:1.2,spd:.24},
    skill:'prayer',atkType:'magic',heal:true,desc:'치유 담당. 다친 동료를 먼저 돌본다'}
};
const JOB_KEYS=Object.keys(JOBS);

/* ---------- 단장 직업 (3기본 → 6상위) ---------- */
const LCLASS={
  sword:{n:'용병 검사',row:'front',wpn:['sword','axe','mace'],main:'STR',outfit:0,tool:true,atkType:'slash',skills:['smash','warcry'],adv:['berserker','guardian'],desc:'근접 밸런스형. 힘이 주력'},
  bow:{n:'정찰 궁수',row:'back',wpn:['bow','dagger'],main:'AGI',outfit:7,tool:false,atkType:'bow',skills:['aimshot','binding'],adv:['assassin','sniper'],desc:'원거리·속도형. 민첩이 주력'},
  mage:{n:'전투 마도사',row:'back',wpn:['staff'],main:'INT',outfit:3,tool:false,atkType:'magic',skills:['blast','frostlance'],adv:['archmage','warlord'],desc:'광역·지력형. 지력이 주력'},
  berserker:{n:'광전사',base:'sword',row:'front',wpn:['sword','axe','mace'],outfit:5,tool:true,atkType:'slash',skills:['smash','warcry','frenzy'],passive:'bloodthirst',desc:'HP가 낮을수록 공격력·흡혈 폭증 (피의 갈증)'},
  guardian:{n:'수호 기사',base:'sword',row:'front',wpn:['sword','mace'],outfit:4,tool:true,atkType:'slash',skills:['smash','warcry','phalanx'],passive:'bulwark',desc:'적 도발과 아군 전체 보호막 (철벽 방진)'},
  assassin:{n:'그림자 암살자',base:'bow',row:'front',wpn:['dagger','bow'],outfit:5,tool:true,atkType:'slash',skills:['aimshot','binding','vital'],passive:'shadow',desc:'보스·후열 즉결 처형 (급소 찌르기)'},
  sniper:{n:'명사수',base:'bow',row:'back',wpn:['bow'],outfit:2,tool:false,atkType:'bow',skills:['aimshot','binding','pierce'],passive:'eagle',desc:'관통 사격·시전 차단·방어력 감소 (관통 화살)'},
  archmage:{n:'원소 대마도사',base:'mage',row:'back',wpn:['staff'],outfit:3,tool:false,atkType:'magic',skills:['blast','frostlance','meteor'],passive:'element',desc:'적 전체 초고화력 폭격 (메테오)'},
  warlord:{n:'군단 지휘관',base:'mage',row:'back',wpn:['staff','sword'],outfit:8,tool:false,atkType:'magic',skills:['blast','frostlance','command'],passive:'tactics',desc:'아군 공속·스킬 충전 2배 (총공격 명령)'}
};
const PASSIVE={
  bloodthirst:'잃은 HP에 비례해 공격력 최대 +80%, 피해의 15% 흡혈',
  bulwark:'방어력 +25%, 아군이 받는 피해 일부를 대신 막음',
  shadow:'치명타 +15%, 회피 +8%',
  eagle:'공격이 적 방어를 20% 무시',
  element:'마법 위력 +20%',
  tactics:'용병 전원 공격력 +10%'
};

/* ---------- 스킬 ---------- */
// t: one(단일) all(전체) front2(전열 둘) self ally allies / mul: 배율 / st: atk|mag
const SKILLS={
  // 단장 스킬 (쿨타임 초)
  smash:{n:'강타',ic:I(90,6),t:'one',mul:2.2,st:'atk',cd:6,fx:'slash',d:'적 하나에게 강한 일격 (공격력 220%)'},
  warcry:{n:'전투 함성',ic:I(2,10),t:'allies',buff:{atk:.25},dur:10,cd:18,lv:6,fx:'buff',d:'아군 전체 공격력 +25% (10초)'},
  aimshot:{n:'조준 사격',ic:I(92,11),t:'one',mul:2.4,st:'atk',crit:.5,cd:6,fx:'arrow',d:'적 하나를 정조준 (240%, 치명타 +50%)'},
  binding:{n:'속박 화살',ic:I(92,10),t:'one',mul:1.2,st:'atk',slow:.5,dur:6,cd:12,lv:6,fx:'arrow',d:'적의 행동 게이지 50% 감소 + 6초 둔화'},
  blast:{n:'화염 폭발',ic:I(16,0),t:'all',mul:1.2,st:'mag',cd:9,fx:'Explosion',d:'적 전체 화염 (마력 120%)'},
  frostlance:{n:'냉기 창',ic:I(10,4),t:'one',mul:2.4,st:'mag',freeze:3,cd:10,lv:6,fx:'Ice',d:'적 하나 240% + 3초 빙결'},
  frenzy:{n:'광폭 난무',ic:I(91,9),t:'one',hits:3,mul:1.1,st:'atk',cd:9,fx:'slash',d:'3연속 베기 (각 110%) — 피의 갈증과 함께'},
  phalanx:{n:'철벽 방진',ic:I(132,3),t:'allies',shield:.25,taunt:6,cd:16,fx:'buff',d:'6초 도발 + 아군 전체에 최대 HP 25% 보호막'},
  vital:{n:'급소 찌르기',ic:I(90,3),t:'one',mul:4,st:'atk',exec:.25,cd:12,fx:'slash',d:'400% 일격. HP 25% 이하 적은 즉시 처형'},
  pierce:{n:'관통 화살',ic:I(94,10),t:'all',mul:1.6,st:'atk',armorBreak:.3,interrupt:true,dur:8,cd:12,fx:'arrow',d:'적 전체 관통 160% + 방어력 30% 감소 + 시전 차단'},
  meteor:{n:'메테오',ic:I(16,3),t:'all',mul:3,st:'mag',cd:20,fx:'Explosion',d:'적 전체에 운석 낙하 (마력 300%)'},
  command:{n:'총공격 명령',ic:I(2,11),t:'allies',haste:1,dur:8,cd:20,fx:'buff',d:'8초 동안 아군 행동·스킬 충전 속도 2배'},
  // 스킬서로 배우는 단장 스킬 (상위 마을 상점에서 구매)
  b_double:{n:'이연격',ic:I(90,7),t:'one',hits:2,mul:1.4,st:'atk',cd:7,fx:'slash',d:'적 하나를 두 번 벤다 (각 140%)'},
  b_quake:{n:'대지 가르기',ic:I(91,9),t:'all',mul:1.3,st:'atk',cd:12,fx:'Explosion',d:'땅을 내리쳐 적 전체 공격 (공격력 130%)'},
  b_heal:{n:'응급 처치',ic:I(17,4),t:'healall',mul:.9,st:'mag',cd:15,fx:'heal',d:'아군 전체 회복 (마력 90%)'},
  b_guard:{n:'방어 태세',ic:I(132,1),t:'self',taunt:5,buff:{def:.6},dur:6,cd:14,fx:'buff',d:'5초 도발 + 6초 동안 방어 +60%'},
  b_chain:{n:'연쇄 번개',ic:I(10,5),t:'rand3',mul:1.4,st:'mag',cd:9,fx:'Explosion',d:'무작위 적 셋에게 번개 (마력 140%)'},
  b_snipe:{n:'저격',ic:I(94,11),t:'one',mul:3.2,st:'atk',crit:.3,cd:11,fx:'arrow',d:'먼 거리에서 정밀 사격 (320%, 치명 +30%)'},
  b_rally:{n:'결속의 외침',ic:I(2,12),t:'allies',buff:{atk:.15,def:.2},dur:10,cd:20,fx:'buff',d:'아군 전체 공격 +15%, 방어 +20% (10초)'},
  b_storm:{n:'질풍',ic:I(10,6),t:'allies',haste:1,dur:5,cd:24,fx:'buff',d:'5초 동안 아군 행동 속도 2배'},
  b_frostfield:{n:'서리 폭풍',ic:I(10,3),t:'all',mul:1.6,st:'mag',cd:16,fx:'Ice',d:'적 전체 냉기 (마력 160%)'},
  b_execute:{n:'처형',ic:I(94,12),t:'one',mul:2.5,st:'atk',exec:.2,cd:14,fx:'slash',d:'250% 일격. HP 20% 이하 적은 즉시 처형'},
  // 스킬서로 바꾸는 용병 스킬 (기본 스킬 대신 자동 발동)
  m_cleave:{n:'대지 강타',t:'all',mul:1.0,st:'atk',fx:'Explosion',d:'적 전체 공격 (공격력 100%)'},
  m_shout:{n:'수호의 외침',t:'allies',shield:.15,taunt:4,fx:'buff',d:'4초 도발 + 아군 전체 최대 HP 15% 보호막'},
  m_snipe:{n:'급소 사격',t:'one',mul:2.6,st:'atk',crit:.3,fx:'arrow',d:'적 하나 260% 정밀 사격'},
  m_meteor:{n:'작은 운석',t:'all',mul:1.3,st:'mag',fx:'Explosion',d:'적 전체 운석 (마력 130%)'},
  m_bless:{n:'축복',t:'allies',buff:{atk:.2,def:.15},dur:8,fx:'buff',d:'아군 전체 공격 +20%, 방어 +15% (8초)'},
  // 용병 스킬 (스킬 게이지 100에 자동 발동)
  whirl:{n:'회전 베기',t:'front2',mul:1.5,st:'atk',fx:'slash'},
  taunt:{n:'도발',t:'self',taunt:6,buff:{def:.4},dur:6,fx:'buff'},
  volley:{n:'연사',t:'rand3',mul:.9,st:'atk',fx:'arrow'},
  fireball:{n:'화염구',t:'all',mul:.9,st:'mag',fx:'Explosion'},
  prayer:{n:'치유의 기도',t:'healall',mul:.6,st:'mag',fx:'heal'},
  // 몬스터 스킬
  m_strike:{n:'강한 공격',t:'one',mul:1.8,st:'atk',fx:'slash'},
  m_aoe:{n:'광역 공격',t:'all',mul:.75,st:'atk',fx:'Explosion'},
  m_fire:{n:'불꽃',t:'all',mul:.85,st:'mag',fx:'Explosion'},
  m_heal:{n:'치유',t:'healall',mul:.8,st:'mag',fx:'heal'},
  m_roar:{n:'포효',t:'allies',buff:{atk:.3},dur:8,fx:'buff'},
  m_bite:{n:'물어뜯기',t:'one',mul:1.5,st:'atk',bleed:.04,dur:6,fx:'slash'},
  m_spike:{n:'바위 가시',t:'all',mul:.9,st:'atk',fx:'RockSpike'},
  m_tide:{n:'해일',t:'all',mul:1,st:'mag',fx:'WaterPillar'},
  m_abyss:{n:'심연의 파동',t:'all',mul:.95,st:'mag',fx:'Spark'}
};

/* ---------- 성격 & 대사 ---------- */
const PERS={
  brave:{n:'호전적',d:'싸움을 즐긴다. 출정을 반긴다'},
  cold:{n:'냉철함',d:'감정을 드러내지 않는다'},
  cheer:{n:'낙천적',d:'어떤 상황에서도 웃는다'},
  greedy:{n:'탐욕스러움',d:'돈이 최고. 급여에 민감하다'},
  coward:{n:'겁쟁이',d:'다치는 걸 무서워한다'},
  loyal:{n:'의리파',d:'단장을 끝까지 따른다'}
};
const PERS_KEYS=Object.keys(PERS);
// LINES[성격][상태] — 상태: ok(정상) inj(중상 치료 중) seq(후유증) dis(영구 장애) ins(교관) fire(모닥불) bar(주점) train(훈련소) shop(상점)
const LINES={
  brave:{
    ok:['칼날이 근질근질하군. 단장, 다음 출정은 언제야?','몸이 굳겠어. 아무 던전이나 좋으니 데려가 줘!','지난번 놈들은 너무 약했어. 더 센 놈 없나?','피가 끓는다! 오늘 같은 날은 싸워야지!'],
    inj:['쳇, 이 정도 상처로 눕다니... 금방 털고 일어날 거야.','붕대 따위 귀찮아! 빨리 전장으로 보내줘!'],
    seq:['다리가 좀 무거워도 칼은 무겁지 않아.','이 흉터? 훈장이지. 다음엔 내가 갚아준다.'],
    dis:['반쪽 몸이라도 아직 싸울 수 있어... 싸우게 해 줘.','젠장, 예전 같지 않아. 그래도 등은 보이지 않는다.'],
    ins:['힘 빼지 마! 허수아비도 베지 못하면 괴물은 어떻게 베냐!','내 몫까지 싸워라. 그게 교관의 명령이다!'],
    fire:['모닥불 앞에선 칼을 가는 게 최고지.','불꽃 보니까 지난 보스전이 생각나는군. 크하하!'],
    bar:['한 잔 더! 내일은 더 세게 싸울 거니까!'],train:['하압! 허수아비라도 봐주진 않는다!'],shop:['더 큰 칼 없어? 이건 이쑤시개잖아.']},
  cold:{
    ok:['준비는 끝났습니다. 명령만 내리십시오.','적의 습성은 이미 파악해 두었습니다.','감정은 전투에 방해될 뿐입니다.','다음 던전의 지도를 검토했습니다. 함정 위치가 수상하군요.'],
    inj:['회복까지 계산상 이틀. 그 전에 출정은 비효율적입니다.','상처는 정보입니다. 같은 실수는 반복하지 않겠습니다.'],
    seq:['다리가 조금 절뚝거리지만, 임무 수행에는 지장 없습니다.','속도가 15% 떨어졌군요. 위치 선정으로 보완하겠습니다.'],
    dis:['능력치가 크게 떨어졌습니다. 냉정하게 판단하셔도 원망하지 않겠습니다.','계약을 어떻게 하실지, 합리적으로 결정하십시오.'],
    ins:['자세가 0.5초 늦습니다. 다시.','실전에서 그 실수는 곧 죽음이다. 반복해라.'],
    fire:['...불은 생각을 정리하기에 좋습니다.'],bar:['술은 판단을 흐립니다. 물로 하죠.'],train:['동작을 분해해서 연습하는 중입니다.'],shop:['가격 대비 성능이 나쁘군요. 다음에 오죠.']},
  cheer:{
    ok:['오늘 날씨 끝내준다! 던전 가기 딱 좋은 날이야!','단장님 얼굴 보니까 기분이 좋아지네요~','다들 웃자고! 웃는 놈이 오래 사는 법이라니까!','이번 보수로 맛있는 거 사 먹어야지~'],
    inj:['하하... 좀 아프긴 한데, 침대가 푹신해서 괜찮아요!','다쳐도 밥은 맛있네! 금방 나을게요~'],
    seq:['좀 절뚝거려도 춤은 출 수 있다구요! 보실래요?','흉터 생겼어요. 멋있죠? 그쵸?'],
    dis:['팔이 예전 같진 않지만... 웃을 수는 있잖아요. 헤헤.','괜찮아요, 괜찮아요! 할 수 있는 걸 하면 되죠!'],
    ins:['잘했어! 아주 잘했어! 이제 한 번만 더~!','실수해도 괜찮아, 웃으면서 다시 해 보자!'],
    fire:['모닥불엔 고기지! 누가 고기 좀 가져와 봐~','별이 엄청 많다~ 저거 다 금화면 좋겠다!'],bar:['건배! 우리 용병단을 위하여~!'],train:['허수아비야 미안~ 오늘도 맞아 줘!'],shop:['우와, 이거 반짝반짝해! 사 주세요~']},
  greedy:{
    ok:['이번 의뢰 보수는 두둑하겠지? 내 몫은 확실히 챙겨줘!','금화 소리만큼 아름다운 노래는 없지.','보물 상자는 내가 먼저 연다. 알지?','급여 날이 언제였더라... 아, 아직 멀었나.'],
    inj:['치료비는 당연히 용병단 부담이지? 그렇지?','다친 만큼 위험 수당 줘야 하는 거 알지?'],
    seq:['몸이 이 꼴인데 보너스는 없어?','후유증 수당이라는 게 있다던데, 우리 용병단엔 없나?'],
    dis:['몸이 이 꼴이 됐는데 급여까지 깎을 셈이야? 나도 먹고살아야지!','이 몸으로 어디 가서 일자리를 구하라고... 책임져.'],
    ins:['교관 수당은 따로 나오는 거지? 그럼 열심히 가르쳐 주지.','잘 배워서 돈 많이 벌어와라. 내 연금이 걸려 있으니까.'],
    fire:['불 쬐는 것도 공짜니까 좋네.'],bar:['술값은 단장이 내는 거지?'],train:['훈련하면 급여 올려주는 거 맞지?'],shop:['깎아 줘. 아니면 안 사.']},
  coward:{
    ok:['저, 저기... 이번 던전은 무섭지 않은 곳이죠?','다들 앞에 서 주시면... 저는 뒤에서 열심히 할게요.','어젯밤 괴물 꿈 꿨어요... 길몽이겠죠?','단장님 옆에 있으면 조금 안심이 돼요.'],
    inj:['으으... 저번 던전 괴물 눈빛이 아직도 생생해... 치료비 좀 넉넉히 써줘...','다시는 안 다치고 싶어요... 정말로요...'],
    seq:['다리가 떨리는 게 후유증 때문인지 무서워서인지 모르겠어요...','또 쓰러지면 어떡하죠... 무서워요...'],
    dis:['이제 정말 못 싸울 것 같아요... 버리지만 말아 주세요...','이렇게 될 줄 알았어요... 흑...'],
    ins:['조, 조심해요! 다치면 엄청 아파요! 진짜로!','방어부터 배워요. 방어가 제일 중요해요!'],
    fire:['불 옆이 제일 안전한 것 같아요... 여기 있을게요.'],bar:['술 마시면 용기가 난다던데... 한 모금만...'],train:['허, 허수아비도 무섭게 생겼네요...'],shop:['방어구... 제일 두꺼운 걸로 주세요.']},
  loyal:{
    ok:['단장님이 가는 곳이라면 지옥이라도 따라가겠습니다.','철혈 맹약단의 깃발, 반드시 다시 세웁시다.','명령만 내리십시오. 제 검은 단장님의 것입니다.','동료들은 제가 지키겠습니다. 걱정 마십시오.'],
    inj:['면목 없습니다... 곧 다시 일어나 곁을 지키겠습니다.','이 정도 상처, 단장님의 짐이 되진 않겠습니다.'],
    seq:['몸이 조금 무거워졌지만, 맹세는 가벼워지지 않았습니다.','후유증 따위로 물러서지 않겠습니다.'],
    dis:['한쪽 팔을 못 쓰게 됐지만... 단장님이 부르신다면 끝까지 검을 쥐겠습니다.','몸은 망가졌어도 충성은 그대로입니다.'],
    ins:['내가 단장님께 배운 걸 그대로 너희에게 전한다. 잘 들어라.','동료를 지키는 검이 진짜 검이다. 명심해라.'],
    fire:['예전 맹약단도 이렇게 모닥불에 둘러앉았다고 들었습니다.'],bar:['단장님께 건배!'],train:['단장님을 지키려면 더 강해져야 합니다.'],shop:['단장님 장비부터 챙기시죠.']}
};
// 직업 한마디 (정상 상태에서 가끔)
const JOB_LINES={
  warrior:['검날 손질은 끝났어.','앞은 내가 맡는다.'],guard:['방패 뒤에 숨어. 다 막아줄게.','방패가 찌그러졌네... 수리비 나오나?'],
  archer:['바람 방향만 맞으면 백 걸음도 맞춘다.','화살이 모자라면 큰일인데.'],mage:['마력이 차오르는 게 느껴져.','책 좀 조용히 읽게 해 줘.'],
  priest:['다치면 바로 말해요. 참으면 더 아파요.','신께서 우리를 지켜보고 계십니다.']
};
const GRADE_LINES={3:['영웅 대우를 받으려면 그만한 무대가 필요하지.'],2:['내 실력이면 이 정도 대우는 당연하지.']};

/* ---------- 이름 ---------- */
const NAMES_M=['로안','가렛','브란','케일','도윈','하울','레닉','마테오','세드릭','알렌','이반','토르','바렌','에릭','루카스','데인','오스본','카일','펠릭스','그렌','라일','휴고','니콜','브람','조슈','레오','타일러','벤','아론','지크'];
const NAMES_F=['리나','에다','미라','세라','아냐','카렌','루시','엘라','니아','소피','베라','이리스','마야','로제','델라','엠마','하나','클로에','유나','테사','릴리','노라','아이린','셀린'];
const SURN=['','','','','·철검','·바람','·잿빛','·은빛','·붉은','·외눈','·떠돌이','·북부의','·늑대','·새벽'];

/* ---------- 몬스터 ---------- */
// spr: 스프라이트 키, role: melee|ranged|caster|healer, s: 능력치 배율 [hp,atk,mag,def,spd], sk: 스킬, tro: 전리품
const MON={
  rat:{n:'들쥐',spr:'n_rat',role:'melee',s:[.55,.7,.2,.5,1.15],tro:'t_hide'},
  wolf:{n:'회색 늑대',spr:'n_hyena',role:'melee',s:[.75,.95,.2,.6,1.25],sk:'m_bite',tro:'t_fang'},
  boar:{n:'멧돼지',spr:'n_boar',role:'melee',s:[1.2,.9,.2,1.1,.85],tro:'t_hide'},
  slime:{n:'슬라임',spr:'n_slime',role:'melee',s:[.9,.7,.4,.7,.85],tro:'t_jelly'},
  bandit:{n:'산적',spr:'h_bandit',role:'melee',s:[.95,1,.2,.85,1],sk:'m_strike',tro:'t_coin'},
  banditarcher:{n:'산적 궁수',spr:'h_bandit2',role:'ranged',s:[.7,1.05,.2,.6,1.05],tro:'t_coin'},
  goblin:{n:'고블린',spr:'goblin',role:'melee',s:[.85,1,.2,.8,1.1],sk:'m_strike',tro:'t_ore'},
  goblinsham:{n:'고블린 주술사',spr:'goblin',tint:'chief',role:'healer',s:[.7,.5,1,.6,1],sk:'m_heal',tro:'t_ore'},
  bat:{n:'동굴 박쥐',spr:'n_bat',role:'melee',s:[.6,.85,.2,.5,1.4],tro:'t_wing'},
  mole:{n:'거대 두더지',spr:'n_mole',role:'melee',s:[1.15,.95,.2,1.05,.9],tro:'t_hide'},
  spider:{n:'동굴 거미',spr:'n_spider',role:'melee',s:[.8,1,.2,.7,1.2],sk:'m_bite',tro:'t_silk'},
  crystal:{n:'수정 정령',spr:'n_skull',role:'caster',s:[.8,.4,1.1,.9,.95],sk:'m_spike',tro:'t_crystal'},
  skeleton:{n:'해골 병사',spr:'skeleton',role:'melee',s:[.9,1,.2,.95,1],sk:'m_strike',tro:'t_bone'},
  pirate:{n:'해적',spr:'h_pirate',role:'melee',s:[1,1.05,.2,.85,1.05],sk:'m_strike',tro:'t_coin'},
  smuggler:{n:'밀수꾼',spr:'h_smug',role:'ranged',s:[.75,1.05,.2,.65,1.1],tro:'t_coin'},
  octopus:{n:'바다 문어',spr:'n_octopus',role:'caster',s:[.85,.5,1,.75,.95],sk:'m_tide',tro:'t_pearl'},
  lizard:{n:'도마뱀인',spr:'n_lizard',role:'melee',s:[1,1.05,.2,1,1],tro:'t_scale'},
  drowned:{n:'수몰된 해골',spr:'skeleton',tint:'drown',role:'melee',s:[1,1,.3,1,.95],tro:'t_bone'},
  spirit:{n:'망령',spr:'n_spirit',role:'caster',s:[.7,.4,1.15,.6,1.1],sk:'m_tide',tro:'t_ecto'},
  srat:{n:'시궁쥐',spr:'n_ratblack',role:'melee',s:[.7,.9,.2,.6,1.25],sk:'m_bite',tro:'t_hide'},
  outcast:{n:'추방자',spr:'h_outcast',role:'melee',s:[1,1.05,.2,.9,1],sk:'m_strike',tro:'t_coin'},
  outmage:{n:'추방 마법사',spr:'h_outmage',role:'caster',s:[.75,.4,1.15,.65,1],sk:'m_fire',tro:'t_crystal'},
  orc:{n:'오크 전사',spr:'orc',role:'melee',s:[1.25,1.15,.2,1,.95],sk:'m_strike',tro:'t_tusk'},
  dknight:{n:'타락한 기사',spr:'dknight',role:'melee',s:[1.15,1.1,.3,1.25,.95],sk:'m_strike',tro:'t_steel'},
  eye:{n:'감시의 눈',spr:'n_eye',role:'caster',s:[.7,.4,1.1,.7,1.05],sk:'m_fire',tro:'t_ecto'},
  snake:{n:'안개 뱀',spr:'n_snake',role:'melee',s:[.8,1,.2,.7,1.25],sk:'m_bite',tro:'t_scale'},
  reptile:{n:'비룡 새끼',spr:'n_reptile',role:'melee',s:[1.1,1.1,.4,1,1.05],tro:'t_scale'},
  flam:{n:'불꽃 정령',spr:'n_flam',role:'caster',s:[.75,.4,1.2,.65,1.1],sk:'m_fire',tro:'t_ember'},
  abflam:{n:'심연의 불꽃',spr:'n_flam',tint:'ab',role:'caster',s:[.8,.4,1.05,.75,1.05],sk:'m_abyss',tro:'t_abyss'},
  abeye:{n:'심연의 눈',spr:'n_eye',tint:'ab',role:'caster',s:[.8,.4,1.05,.8,1],sk:'m_abyss',tro:'t_abyss'},
  aborc:{n:'심연 오크',spr:'aorc',role:'melee',s:[1.35,1.2,.2,1.1,.95],sk:'m_strike',tro:'t_abyss'},
  examiner:{n:'길드 시험관',spr:'h_exam',role:'melee',s:[1.1,1.05,.3,1,1],sk:'m_strike'},
  examarcher:{n:'시험관 궁수',spr:'h_exam2',role:'ranged',s:[.8,1.05,.3,.7,1.05]},
  exammage:{n:'시험관 마도사',spr:'h_exam3',role:'caster',s:[.8,.4,1.1,.7,1],sk:'m_fire'},
  champ:{n:'투기장 투사',spr:'h_champ',role:'melee',s:[1.15,1.1,.3,1.05,1.05],sk:'m_strike'},
  royal:{n:'근위 기사',spr:'h_royal',role:'melee',s:[1.1,1.05,.3,1.15,1],sk:'m_strike'}
};
// 보스 (s 배율이 크고, 보스 전용 스킬)
// --- 엘프 숲 · 화산 도시 몬스터 (닌자 어드벤처 몬스터 시트) ---
Object.assign(MON,{
  mboar:{n:'단풍 멧돼지',spr:'n_boar',role:'melee',s:[1.25,1.05,.25,1.1,.95],sk:'m_strike',tro:'t_hide'},
  mowl:{n:'대숲 부엉이',spr:'n_owl',role:'ranged',s:[.85,1.15,.45,.7,1.3],tro:'t_wing'},
  mpanda:{n:'대숲 판다 무사',spr:'n_panda',role:'melee',s:[1.7,1.25,.25,1.3,.85],sk:'m_aoe',tro:'t_hide'},
  mushroom2:{n:'독버섯 요정',spr:'n_mushroom2',role:'caster',s:[.8,.6,1.1,.7,.95],sk:'m_spike',tro:'t_jelly'},
  larva:{n:'숲 애벌레',spr:'n_larva',role:'melee',s:[1.1,.8,.2,.9,.8],tro:'t_silk'},
  butterfly:{n:'홀림 나비',spr:'n_butterfly',role:'caster',s:[.6,.5,1.2,.5,1.4],sk:'m_heal',tro:'t_wing'},
  owl:{n:'밤숲 올빼미',spr:'n_owl',role:'ranged',s:[.8,1.1,.4,.6,1.3],tro:'t_wing'},
  spirit2:{n:'달빛 정령',spr:'n_spirit2',role:'caster',s:[.8,.5,1.3,.6,1.1],sk:'m_fire',tro:'t_ecto'},
  axolot:{n:'호수 도롱뇽',spr:'n_axolot',role:'melee',s:[1,.95,.4,.8,1],tro:'t_scale'},
  racoon:{n:'도둑 너구리',spr:'n_racoon',role:'melee',s:[.85,1.1,.2,.6,1.4],sk:'m_strike',tro:'t_coin'},
  panda:{n:'성난 판다',spr:'n_panda',role:'melee',s:[1.6,1.2,.2,1.2,.8],sk:'m_aoe',tro:'t_hide'},
  bamboo:{n:'대나무 정령',spr:'n_bamboo',role:'melee',s:[1.1,1,.5,1.1,.9],tro:'t_bone'},
  flam2:{n:'푸른 불꽃',spr:'n_flam2',role:'caster',s:[.8,.5,1.3,.6,1.15],sk:'m_fire',tro:'t_ember'},
  lizard2:{n:'용암 도마뱀',spr:'n_lizard2',role:'melee',s:[1.1,1.1,.2,1,1.05],sk:'m_bite',tro:'t_scale'},
  reptile2:{n:'화산 렙틸',spr:'n_reptile2',role:'melee',s:[1.3,1.15,.2,1.15,.95],sk:'m_strike',tro:'t_scale'},
  skullblue:{n:'잿불 해골',spr:'n_skullblue',role:'caster',s:[.8,.6,1.25,.7,1.1],sk:'m_fire',tro:'t_bone'},
  beast2:{n:'흑요석 야수',spr:'n_beast2',role:'melee',s:[1.6,1.25,.2,1.3,.85],sk:'m_aoe',tro:'t_steel'},
  dragonling:{n:'새끼 화룡',spr:'n_dragon',role:'caster',s:[1.2,.8,1.4,1,1.1],sk:'m_fire',tro:'t_ember'}});
// --- 동방 대륙 몬스터 ---
Object.assign(MON,{
  cobra:{n:'사막 코브라',spr:'n_snake3',role:'melee',s:[1.1,1.15,.2,.9,1.2],sk:'m_bite',tro:'t_scale'},
  sandsnail:{n:'모래 달팽이',spr:'n_mollusc',role:'melee',s:[1.6,.9,.2,1.5,.7],tro:'t_pearl'},
  sandrat:{n:'모래 쥐 떼',spr:'n_mouse',role:'melee',s:[.8,1,.2,.6,1.5],tro:'t_hide'},
  rockeye:{n:'바위 외눈',spr:'n_cyclope2',role:'melee',s:[1.8,1.3,.2,1.4,.8],sk:'m_spike',tro:'t_steel'},
  curseeye:{n:'저주의 눈',spr:'n_eye2',role:'caster',s:[.9,.5,1.4,.7,1.1],sk:'m_fire',tro:'t_ecto'},
  dskull:{n:'사막 해골',spr:'n_skull',role:'caster',s:[.9,.6,1.3,.8,1],sk:'m_fire',tro:'t_bone'},
  kappa:{n:'갓파',spr:'n_kappagreen',role:'melee',s:[1.2,1.15,.3,1.1,1.05],sk:'m_strike',tro:'t_scale'},
  kappared:{n:'붉은 갓파',spr:'n_kappared',role:'melee',s:[1.4,1.3,.3,1.2,1.05],sk:'m_aoe',tro:'t_scale'},
  snowbear:{n:'설원 곰',spr:'n_bear',role:'melee',s:[1.9,1.3,.2,1.3,.85],sk:'m_bite',tro:'t_hide'},
  wisp:{n:'도깨비불',spr:'n_lanterngreen',role:'caster',s:[.8,.5,1.4,.6,1.2],sk:'m_fire',tro:'t_ecto'},
  lantern:{n:'붉은 등롱 요괴',spr:'n_lanternred',role:'caster',s:[1,.6,1.5,.8,1.05],sk:'m_fire',tro:'t_ecto'},
  snowspirit:{n:'눈의 정령',spr:'n_spirit',role:'healer',s:[.9,.5,1.2,.7,1.1],sk:'m_heal',tro:'t_ecto'}});
const BOSS={
  b_slime:{n:'거대 슬라임',spr:'b_giantslime',role:'melee',s:[3.2,.95,.6,1,.8],sk:'m_aoe',tro:'t_jelly'},
  b_wolf:{n:'잿빛 갈기',spr:'n_hyena',scale:2.6,role:'melee',s:[3.6,1.35,.3,1,1.2],sk:'m_bite',tro:'t_fang'},
  b_bark:{n:'산적 두목 바르크',spr:'h_boss1',scale:1.5,role:'melee',s:[4,1.3,.3,1.15,1],sk:'m_aoe',tro:'t_coin'},
  b_toad:{n:'독두꺼비 여왕',spr:'b_giantfrog',role:'caster',s:[4.2,.8,1.2,1.1,.9],sk:'m_spike',tro:'t_jelly'},
  b_gchief:{n:'고블린 족장 그룩',spr:'goblin',tint:'chief',scale:1.7,role:'melee',s:[4.4,1.35,.3,1.15,1],sk:'m_roar',tro:'t_ore'},
  b_cyclops:{n:'수정 외눈 거인',spr:'b_demoncyclop',role:'melee',s:[5,1.4,.5,1.3,.85],sk:'m_spike',tro:'t_crystal'},
  b_smug:{n:'밀수단 두목 렉스',spr:'h_boss2',scale:1.5,role:'melee',s:[4.2,1.35,.3,1.15,1.05],sk:'m_aoe',tro:'t_coin'},
  b_kraken:{n:'심해의 크라켄',spr:'b_squidred',role:'caster',s:[5,1,1.3,1.2,.9],sk:'m_tide',tro:'t_pearl'},
  b_wraith:{n:'수몰된 망령왕',spr:'b_giantspirit',role:'caster',s:[4.6,.6,1.45,1.1,1],sk:'m_tide',tro:'t_ecto'},
  b_ratking:{n:'하수로의 쥐왕',spr:'n_ratblack',scale:2.6,role:'melee',s:[4.4,1.35,.3,1.1,1.15],sk:'m_bite',tro:'t_hide'},
  b_warlordorc:{n:'추방자 군주 고르마',spr:'orc',scale:1.6,role:'melee',s:[5,1.45,.3,1.2,.95],sk:'m_roar',tro:'t_tusk'},
  b_fallen:{n:'타락한 기사단장 모르간',spr:'b_giantredsamurai',role:'melee',s:[5.4,1.5,.5,1.35,1],sk:'m_aoe',tro:'t_steel'},
  b_ancient:{n:'고대의 눈',spr:'n_eye',scale:2.6,role:'caster',s:[4.4,.6,1.4,1.1,1],sk:'m_fire',tro:'t_ecto'},
  b_mistwyrm:{n:'안개 비룡',spr:'n_reptile',scale:2.6,role:'melee',s:[5,1.45,.6,1.2,1.05],sk:'m_aoe',tro:'t_scale'},
  b_mushking:{n:'버섯왕 포르치니',spr:'n_mushroom2',scale:2.6,role:'caster',s:[4.4,.9,1.3,1.1,.9],sk:'m_spike',tro:'t_jelly'},
  b_racoonking:{n:'숲의 너구리왕 탄',spr:'b_giantracoon',role:'melee',s:[4.8,1.35,.4,1.2,1.05],sk:'m_aoe',tro:'t_coin'},
  b_bamboo:{n:'시든 세계수의 대나무 거인',spr:'b_giantbamboo',role:'melee',s:[5.2,1.4,.6,1.35,.85],sk:'m_spike',tro:'t_bone'},
  b_flamking:{n:'화염 정령왕 이프르',spr:'b_giantflam',role:'caster',s:[5,1,1.6,1.1,1],sk:'m_fire',tro:'t_ember'},
  b_lavacyclop:{n:'용암 외눈 거인',spr:'b_demoncyclop2',role:'melee',s:[5.6,1.5,.5,1.4,.85],sk:'m_spike',tro:'t_steel'},
  b_wyvern:{n:'용암 비룡 볼카',spr:'n_dragon',scale:2.8,role:'caster',s:[5.8,1.25,1.6,1.3,1],sk:'m_fire',tro:'t_ember'},
  b_sandking:{n:'모래 대왕뱀 샤이',spr:'n_snake3',scale:3,role:'melee',s:[6,1.4,.4,1.3,1.05],sk:'m_bite',tro:'t_scale'},
  b_suneye:{n:'태양신의 눈',spr:'n_eye2',scale:3,role:'caster',s:[5.6,.9,1.8,1.2,1],sk:'m_fire',tro:'t_ecto'},
  b_frogking:{n:'오아시스 두꺼비 군주',spr:'b_frog2',role:'caster',s:[5.8,1.1,1.6,1.4,.9],sk:'m_spike',tro:'t_jelly'},
  b_mapletengu:{n:'붉은 단풍 텐구',spr:'b_tengured',role:'caster',s:[5.6,1.2,1.5,1.3,1.05],sk:'m_fire',tro:'t_wing'},
  b_bearking:{n:'흰 이빨 설곰왕',spr:'n_bear',scale:3,role:'melee',s:[6,1.5,.3,1.5,.9],sk:'m_aoe',tro:'t_hide'},
  b_tengu:{n:'푸른 텐구',spr:'b_tengub',role:'caster',s:[6,1.2,1.8,1.3,1.1],sk:'m_fire',tro:'t_ecto'},
  b_shogun:{n:'얼어붙은 쇼군',spr:'b_bluesamurai',role:'melee',s:[6.6,1.6,.6,1.6,1],sk:'m_aoe',tro:'t_steel'},
  b_dragon:{n:'화염룡 이그니스',spr:'n_flam',scale:3,role:'caster',s:[6,1.2,1.6,1.3,1],sk:'m_fire',tro:'t_ember'},
  b_valter:{n:'배신자 발테르 공작',spr:'h_valter',scale:1.4,role:'caster',s:[3,.8,1.2,1.1,1],sk:'m_abyss',tro:'t_abyss'},
  b_abyss:{n:'심연의 군주',spr:'b_tengured',role:'caster',s:[6,1.3,1.4,1.3,1],sk:'m_abyss',tro:'t_abyss'},
  b_examF:{n:'노병 시험관 하울',spr:'h_exam',scale:1.35,role:'melee',s:[3.4,1.2,.3,1.1,1],sk:'m_strike'},
  b_examE:{n:'광산 감독관 브록',spr:'h_exam',scale:1.4,role:'melee',s:[3.8,1.3,.3,1.2,1],sk:'m_aoe'},
  b_examD:{n:'항만 경비대장 세라',spr:'h_exam2',scale:1.4,role:'ranged',s:[3.8,1.3,.3,1.1,1.1],sk:'m_strike'},
  b_examC:{n:'황실 시험관 레이븐',spr:'h_exam3',scale:1.4,role:'caster',s:[4.2,.6,1.4,1.2,1.05],sk:'m_fire'},
  b_champ:{n:'투기장 챔피언 가이우스',spr:'h_champ',scale:1.5,role:'melee',s:[5,1.45,.3,1.25,1.05],sk:'m_aoe'},
  b_class:{n:'전직 시험관 마스터 오린',spr:'h_exam',scale:1.4,role:'melee',s:[4.4,1.35,.3,1.2,1.05],sk:'m_strike'}
};
// 전리품 (귀환 시 자동 판매). v: 기준 가격 배율(priceRef(적 레벨) × v)
const TROPHY={
  t_hide:{n:'짐승 가죽',ic:I(12,9),v:.025},t_fang:{n:'늑대 송곳니',ic:I(14,6),v:.03},t_jelly:{n:'슬라임 젤리',ic:I(10,1),v:.025},t_coin:{n:'훔친 금화',ic:I(9,15),v:.035},
  t_ore:{n:'철광석',ic:I(13,1),v:.03},t_wing:{n:'박쥐 날개',ic:I(16,1),v:.025},t_silk:{n:'거미줄 실타래',ic:I(13,12),v:.03},t_crystal:{n:'마력 수정',ic:I(10,0),v:.04},
  t_bone:{n:'오래된 뼈',ic:I(13,13),v:.025},t_pearl:{n:'바다 진주',ic:I(23,14),v:.04},t_scale:{n:'비늘',ic:I(15,1),v:.03},t_ecto:{n:'영혼의 정수',ic:I(10,6),v:.04},
  t_tusk:{n:'오크 엄니',ic:I(14,8),v:.035},t_steel:{n:'검은 강철 조각',ic:I(13,4),v:.04},t_ember:{n:'용의 불씨',ic:I(10,4),v:.05},t_abyss:{n:'심연의 파편',ic:I(10,7),v:.05}
};

/* ---------- 지역 · 던전 ---------- */
// req: 들어갈 수 있는 최소 등급 / 연결 퀘스트 / 3종 고유 던전
const TOWNS={
  t1:{n:'들꽃 마을',tag:'초보 마을',tier:1,req:'F',size:1,roof:2,desc:'농장과 초원의 소규모 시골 마을',
    dung:['d_forest','d_wolf','d_camp'],bgm:'town',shopLv:[1,10],
    extra:[]},
  t2:{n:'회색바위 광산촌',tag:'광산 마을',tier:2,req:'F',goodRank:'D',size:2,roof:7,desc:'광부와 목수가 일하는 낙후된 산업 마을',
    dung:['d_mine','d_goblin','d_crystal'],shopLv:[10,20],extra:['smith']},
  t3:{n:'푸른물결 항구',tag:'항구 도시',tier:3,req:'E',goodRank:'C',size:3,roof:1,desc:'바다와 상선이 오가는 화려한 무역·관광 도시',
    dung:['d_dock','d_wreck','d_temple'],shopLv:[20,32],extra:['smith','relic']},
  t4:{n:'황성 아우렐리아',tag:'황성 / 수도',tier:4,req:'D',goodRank:'B',size:4,roof:4,desc:'메인 길드와 왕실이 있는 초대형 대도시',
    dung:['d_sewer','d_waste','d_fort'],shopLv:[32,45],extra:['smith','relic','hq','arena','classhall']},
  t5:{n:'은빛잎 숲마을',tag:'엘프 숲',tier:3,req:'E',goodRank:'C',size:3,roof:5,desc:'거대한 나무와 언덕 위에 집을 지은 엘프와 숲지기의 마을',
    dung:['d_grove','d_moonlake','d_elfroot'],shopLv:[24,34],extra:['smith','relic']},
  t6:{n:'불칼 요새도시',tag:'화산 도시',tier:4,req:'D',goodRank:'B',size:3,roof:6,desc:'용암 강 옆, 대륙 최고의 대장장이들이 모인 요새',
    dung:['d_ashmine','d_lavafort','d_crater'],shopLv:[36,46],extra:['smith','relic']},
  t7:{n:'모래바람 오아시스',tag:'동방 · 사막 도시',tier:4,req:'C',goodRank:'A',size:3,roof:0,nj:'desert',east:true,desc:'바다 건너 동방 대륙. 야자수와 둥근 지붕이 늘어선 사막 무역 도시',
    dung:['d_dune','d_tomb','d_oasisdeep'],shopLv:[42,48],extra:['smith','relic']},
  t9:{n:'단풍골',tag:'동방 · 시골 마을',tier:4,req:'C',goodRank:'A',size:2,roof:0,nj:'rural',east:true,desc:'붉은 초가지붕과 단풍나무, 호박밭이 펼쳐진 동방의 시골 마을',
    dung:['d_maple'],shopLv:[42,47],extra:['smith']},
  t8:{n:'서리꽃 산사',tag:'동방 · 설원 마을',tier:5,req:'B',goodRank:'S',size:3,roof:0,nj:'snow',east:true,desc:'눈 덮인 산 위, 무사와 수도승이 사는 고요한 산사 마을',
    dung:['d_snowpass','d_shrine','d_peak'],shopLv:[46,50],extra:['smith','relic']}
};
const DUNG={
  d_forest:{n:'속삭이는 숲길',town:'t1',tier:1,lv:[1,3],dm:.8, floors:5,theme:'forest',pool:['rat','slime','wolf'],elite:['boar'],boss:'b_slime',rank:'F'},
  d_wolf:{n:'늑대 소굴',town:'t1',tier:1,lv:[4,6],dm:.95,floors:6,theme:'forest',pool:['wolf','rat','boar'],elite:['wolf'],boss:'b_wolf',rank:'F',unlock:'m1_3'},
  d_camp:{n:'버려진 야영지',town:'t1',tier:1,lv:[7,9],dm:1.1, floors:6,theme:'camp',pool:['bandit','banditarcher','wolf'],elite:['bandit'],boss:'b_bark',rank:'F',unlock:'m1_4'},
  d_mine:{n:'폐쇄된 제1갱도',town:'t2',tier:2,lv:[10,13],dm:.85,floors:6,theme:'cave',pool:['bat','mole','spider'],elite:['mole'],boss:'b_toad',rank:'E'},
  d_goblin:{n:'고블린 야영지',town:'t2',tier:2,lv:[13,16],dm:1,floors:7,theme:'camp',pool:['goblin','goblinsham','goblin'],elite:['goblin'],boss:'b_gchief',rank:'E',unlock:'m2_3'},
  d_crystal:{n:'깊은 수정 동굴',town:'t2',tier:2,lv:[16,19],dm:1.15,floors:7,theme:'crystal',pool:['crystal','bat','spider','goblin'],elite:['crystal'],boss:'b_cyclops',rank:'E',unlock:'m2_4'},
  d_dock:{n:'안개 낀 부두 창고',town:'t3',tier:3,lv:[20,24],dm:.85,floors:7,theme:'dock',pool:['smuggler','pirate','srat'],elite:['pirate'],boss:'b_smug',rank:'D'},
  d_wreck:{n:'해적선 잔해',town:'t3',tier:3,lv:[24,28],dm:1,floors:7,theme:'sea',pool:['pirate','skeleton','octopus'],elite:['skeleton'],boss:'b_kraken',rank:'D',unlock:'m3_3',goodOnly:true},
  d_temple:{n:'수몰된 신전',town:'t3',tier:3,lv:[28,31],dm:1.15,floors:8,theme:'temple',pool:['drowned','spirit','lizard','octopus'],elite:['drowned'],boss:'b_wraith',rank:'D',unlock:'m3_4'},
  d_sewer:{n:'수도 지하 하수로',town:'t4',tier:4,lv:[32,36],dm:.85,floors:7,theme:'sewer',pool:['srat','srat','slime','outcast'],elite:['srat'],boss:'b_ratking',rank:'C'},
  d_waste:{n:'추방자의 황무지',town:'t4',tier:4,lv:[36,40],dm:1,floors:8,theme:'waste',pool:['outcast','outmage','orc'],elite:['orc'],boss:'b_warlordorc',rank:'C',unlock:'m4_3'},
  d_fort:{n:'타락한 기사단 요새',town:'t4',tier:4,lv:[40,44],dm:1.15,floors:8,theme:'fort',pool:['dknight','orc','outmage','eye'],elite:['dknight'],boss:'b_fallen',rank:'C',unlock:'m4_5'},
  d_grove:{n:'이끼 덮인 버섯 숲',town:'t5',tier:3,lv:[25,28],dm:.9,floors:7,theme:'forest',pool:['mushroom2','larva','butterfly','larva'],elite:['owl'],boss:'b_mushking',rank:'D'},
  d_moonlake:{n:'달빛 정령의 호수',town:'t5',tier:3,lv:[28,31],dm:1,floors:7,theme:'mist',pool:['spirit2','axolot','owl','butterfly'],elite:['racoon'],boss:'b_racoonking',rank:'D',unlock:'s5_2'},
  d_elfroot:{n:'시든 세계수 뿌리',town:'t5',tier:3,lv:[31,34],dm:1.15,floors:8,theme:'ruin',pool:['bamboo','panda','mushroom2','racoon'],elite:['panda'],boss:'b_bamboo',rank:'D',unlock:'s5_3'},
  d_ashmine:{n:'잿빛 용암 갱도',town:'t6',tier:4,lv:[36,39],dm:.9,floors:7,theme:'volcano',pool:['flam2','lizard2','skullblue','lizard2'],elite:['beast2'],boss:'b_flamking',rank:'D'},
  d_lavafort:{n:'불칼 감옥 요새',town:'t6',tier:4,lv:[39,42],dm:1,floors:8,theme:'fort',pool:['reptile2','skullblue','dknight','lizard2'],elite:['dknight'],boss:'b_lavacyclop',rank:'C',unlock:'s6_2'},
  d_crater:{n:'분화구의 심장',town:'t6',tier:4,lv:[42,45],dm:1.15,floors:8,theme:'volcano',pool:['dragonling','flam2','reptile2','beast2'],elite:['dragonling'],boss:'b_wyvern',rank:'C',unlock:'s6_3'},
  d_dune:{n:'끝없는 모래 언덕',town:'t7',tier:4,lv:[38,41],dm:.9,floors:7,theme:'waste',pool:['cobra','sandrat','sandsnail','cobra'],elite:['rockeye'],boss:'b_sandking',rank:'C'},
  d_tomb:{n:'왕의 무덤 피라미드',town:'t7',tier:4,lv:[41,44],dm:1.05,floors:8,theme:'temple',pool:['dskull','curseeye','sandsnail','cobra'],elite:['rockeye'],boss:'b_suneye',rank:'C',unlock:'m4_11'},
  d_oasisdeep:{n:'오아시스 지하 수로',town:'t7',tier:4,lv:[44,47],dm:1.15,floors:8,theme:'sewer',pool:['kappa','kappared','sandsnail','curseeye'],elite:['kappared'],boss:'b_frogking',rank:'C',unlock:'s7_3'},
  d_maple:{n:'단풍 대숲',town:'t9',tier:4,lv:[42,45],dm:1.0,floors:7,theme:'forest',pool:['mboar','mowl','kappa','wisp'],elite:['mpanda'],boss:'b_mapletengu',rank:'C'},
  d_snowpass:{n:'눈보라 고개',town:'t8',tier:5,lv:[45,47],dm:.85,floors:8,theme:'mist',pool:['snowbear','wisp','snowspirit','snowbear'],elite:['snowbear'],boss:'b_bearking',rank:'B'},
  d_shrine:{n:'버려진 산사',town:'t8',tier:5,lv:[47,49],dm:.95,floors:8,theme:'ruin',pool:['lantern','wisp','kappared','dskull'],elite:['lantern'],boss:'b_tengu',rank:'B',unlock:'m5_5'},
  d_peak:{n:'천년설 봉우리',town:'t8',tier:5,lv:[49,50],dm:1.05,floors:9,theme:'crystal',pool:['snowbear','snowspirit','rockeye','curseeye'],elite:['rockeye'],boss:'b_shogun',rank:'B',unlock:'m5_6'},
  // 집결지 직통 던전
  d_ruin:{n:'고대 유적 지하통로',town:'camp',tier:2,lv:[15,19],dm:1.3,floors:7,theme:'ruin',pool:['skeleton','spider','crystal'],elite:['skeleton'],boss:'b_ancient',campTier:2},
  d_mist:{n:'안개 협곡 소굴',town:'camp',tier:3,lv:[27,31],dm:1.3,floors:8,theme:'mist',pool:['snake','lizard','reptile'],elite:['reptile'],boss:'b_mistwyrm',campTier:3},
  d_nest:{n:'용의 둥지',town:'camp',tier:4,lv:[42,46],dm:1.3,floors:8,theme:'volcano',pool:['reptile','flam','lizard'],elite:['flam'],boss:'b_dragon',campTier:4},
  d_abyss:{n:'심연의 왕좌',town:'abyss',tier:5,lv:[45,49],dm:1,floors:9,theme:'abyss',pool:['abflam','abeye','aborc','dknight'],elite:['aborc'],boss:'b_abyss',boss2:'b_valter',rank:'A',unlock:'m5_2'}
};
// 전투 배경 테마 [하늘/벽, 바닥, 바닥2, 장식색]
const THEME={
  forest:{n:'숲',bg:['#2f5a3a','#4c8a46','#3f7a3c'],deco:'tree'},camp:{n:'야영지',bg:['#4a5a3a','#8a7a4a','#7a6a3e'],deco:'tent'},
  cave:{n:'갱도',bg:['#2a2420','#5a4a3a','#4a3c30'],deco:'rock'},crystal:{n:'수정 동굴',bg:['#1e2440','#3e4a6a','#34405e'],deco:'crystal'},
  dock:{n:'부두',bg:['#3a4a5a','#7a6248','#6a5440'],deco:'crate'},sea:{n:'난파선',bg:['#1f4a6a','#6a5034','#5a4430'],deco:'crate'},
  temple:{n:'수몰 신전',bg:['#173a46','#3f6a6a','#365c5c'],deco:'pillar'},sewer:{n:'하수로',bg:['#232a26','#4a5448','#3e463c'],deco:'pillar'},
  waste:{n:'황무지',bg:['#6a5440','#a0845a','#927650'],deco:'rock'},fort:{n:'요새',bg:['#2a2430','#5a5460','#4c4652'],deco:'pillar'},
  ruin:{n:'고대 유적',bg:['#2e2a24','#6a6050','#5c5244'],deco:'pillar'},mist:{n:'안개 협곡',bg:['#4a5a5e','#6a7a6a','#5e6e5e'],deco:'rock'},
  volcano:{n:'화산',bg:['#3a1a14','#6a3424','#5a2c20'],deco:'rock'},abyss:{n:'심연',bg:['#140c22','#3a2450','#301e44'],deco:'crystal'}
};

/* ---------- 승급 심사 · 특수 전투 ---------- */
const EXAMS={
  exam_f:{n:'F→E 승급 심사',lv:9,boss:'b_examF',adds:['examiner','examarcher'],town:'t1',d:'길드 시험관 일행과의 모의 전투'},
  exam_e:{n:'E→D 승급 심사',lv:19,boss:'b_examE',adds:['examiner','exammage','examiner'],town:'t2',d:'광산 감독관이 직접 실력을 본다'},
  exam_d:{n:'D→C 승급 심사',lv:31,boss:'b_examD',adds:['examarcher','examiner','exammage'],town:'t3',d:'항만 경비대와의 합동 훈련'},
  exam_c:{n:'C→B 대토벌전',lv:44,boss:'b_fallen',adds:['dknight','dknight','outmage'],town:'t4',d:'타락한 기사단장을 토벌하면 정식 길드 인가'},
  exam_b:{n:'B→A 심연 전초 돌파',lv:47,boss:'b_valter',adds:['abflam','aborc','abeye'],town:'t4',d:'심연으로 향하는 문을 지키는 군대를 돌파'},
  classtest:{n:'전직 시험',lv:34,boss:'b_class',adds:['examiner','exammage'],town:'t4',d:'수도 길드 전직 시험'},
  arena1:{n:'투기장 1회전',lv:38,boss:null,adds:['champ','champ','examarcher'],town:'t4'},
  arena2:{n:'투기장 2회전',lv:40,boss:null,adds:['champ','royal','exammage','champ'],town:'t4'},
  arena3:{n:'투기장 결승',lv:42,boss:'b_champ',adds:['royal','royal'],town:'t4'}
};

/* ---------- 아이템 ---------- */
// 무기 분류 [이름, 아이콘 블록 행, 열]  아이콘 블록: 1~2단계 90행, 3~4단계 95행, 5단계 100행
const WB=r=>r<=1?90:r<=3?95:100;
const WPN={
  sword:{n:'검',ic:[[0,6],[0,7],[0,8],[0,12],[0,15]],names:['낡은 검','철검','강철 장검','기사검','룬 대검','미스릴 성검']},
  axe:{n:'도끼',ic:[[1,7],[1,8],[1,9],[1,10],[1,10]],names:['손도끼','전투 도끼','양날 도끼','대도끼','파괴의 도끼','미스릴 도끼']},
  mace:{n:'둔기',ic:[[2,0],[2,3],[2,4],[4,1],[4,1]],names:['곤봉','철퇴','전쟁 망치','모닝스타','심판의 망치','미스릴 망치']},
  bow:{n:'활',ic:[[2,10],[2,11],[4,9],[4,10],[4,11]],names:['사냥용 단궁','장궁','복합궁','매의 활','폭풍 장궁','미스릴 활']},
  dagger:{n:'단검',ic:[[0,3],[4,0],[0,13],[0,13],[4,0]],names:['녹슨 단검','찌르개','쌍날 단검','그림자 단검','독사의 송곳니','미스릴 단검']},
  staff:{n:'지팡이',ic:[[3,3],[3,4],[3,5],[3,7],[3,9]],names:['떡갈나무 지팡이','마법 지팡이','현자의 지팡이','보주 지팡이','룬 지팡이','별빛 지팡이']}
};
const ARMS={
  heavy:{n:'중갑',ic:[I(120,1),I(120,0),I(120,7),I(120,6),I(117,3)],names:['누빔 갑옷','사슬 갑옷','판금 갑옷','기사단 갑옷','용린 갑옷','미스릴 판금'],m:{def:1.25,hp:1.1,eva:-2}},
  light:{n:'경갑',ic:[I(123,5),I(123,6),I(123,7),I(123,10),I(123,11)],names:['천 조끼','가죽 갑옷','단단한 가죽 갑옷','정찰병 갑옷','그림자 경갑','미스릴 경갑'],m:{def:.9,hp:.9,eva:4}},
  robe:{n:'로브',ic:[I(126,2),I(126,3),I(126,4),I(126,0),I(126,1)],names:['수습생 로브','마법사 로브','현자의 로브','대마도사 로브','별자리 로브','미스릴 로브'],m:{def:.7,hp:.8,mag:1}}
};
const ACCS={
  ring:{n:'반지',ic:[I(115,2),I(115,3),I(115,4),I(115,5),I(115,7)],names:['구리 반지','은반지','루비 반지','사파이어 반지','왕가의 반지','미스릴 반지'],st:['atk','crit']},
  amulet:{n:'목걸이',ic:[I(115,8),I(129,0),I(115,9),I(136,4),I(136,0)],names:['나무 부적','은 목걸이','수호의 목걸이','현자의 목걸이','성녀의 목걸이','미스릴 목걸이'],st:['mag','hp']},
  shield:{n:'방패',ic:[I(132,0),I(132,2),I(132,3),I(132,5),I(132,6)],names:['나무 방패','철 방패','강철 방패','기사 방패','탑 방패','미스릴 방패'],st:['def','hp']},
  cape:{n:'망토',ic:[I(114,1),I(114,0),I(114,1),I(114,0),I(114,0)],names:['낡은 망토','여행자 망토','바람 망토','용병단 망토','그림자 망토','왕의 망토'],st:['spd','eva']}
};
const RARITY=[
  {n:'일반',c:'#e2dccc',m:1},{n:'고급',c:'#7fd06a',m:1.15},{n:'희귀',c:'#5fb3ff',m:1.32},{n:'영웅',c:'#c07aff',m:1.55},{n:'전설',c:'#ffb02e',m:1.85}
];

// ---------- 아이템 다양화 (Raven 아이콘 2192개 중 확장 사용) ----------
// 무기: 블록(철 90 / 금 95 / 청 100) 안의 [행 오프셋, 열] + 이름 (같은 순서)
const WVAR={
  sword:{ic:[[0,0],[0,6],[0,7],[0,8],[0,14],[0,15],[4,0],[4,3],[4,5],[4,13],[0,2],[4,2]],nm:['장검','검','바스타드 소드','기사검','브로드소드','대검','세검','양날검','클레이모어','롱소드','곡도','시미터']},
  dagger:{ic:[[0,3],[0,1],[4,7],[4,8],[4,12],[0,12]],nm:['단검','식칼','찌르개','스틸레토','쿠크리','송곳 단검']},
  axe:{ic:[[1,7],[1,8],[1,9],[1,10]],nm:['손도끼','전투 도끼','양날 도끼','대도끼']},
  mace:{ic:[[1,15],[2,0],[2,3],[2,4],[4,1],[2,1]],nm:['망치','철퇴','전쟁 망치','대망치','모닝스타','도리깨']},
  bow:{ic:[[2,10],[2,11],[4,9],[4,10],[4,11]],nm:['단궁','장궁','복합궁','곡궁','전투 활']},
  staff:{ic:[[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[2,5]],nm:['완드','마법봉','보주 지팡이','현자의 지팡이','룬 지팡이','수정 지팡이','별 지팡이','불꽃 지팡이','고목 지팡이']}
};
const WMAT=['낡은','철','강철','기사단','룬','미스릴'];
// 방어구·장신구: 단계별 아이콘 후보 + 재질(단계) + 명사
const GVAR={
  heavy:{ic:[[[120,0],[120,1],[120,8],[120,15]],[[120,3],[120,5],[120,9],[120,12]],[[120,4],[120,11],[120,14],[128,0]],[[120,6],[120,13],[117,11],[117,13]],[[116,7],[116,10],[118,0],[118,12],[117,4]]],mat:['누빔','사슬','판금','기사단','용린','미스릴'],nm:['갑옷','흉갑','전신갑','판갑']},
  light:{ic:[[[123,0],[123,5],[123,12],[126,2]],[[123,7],[123,3],[126,8],[123,13]],[[126,3],[126,9],[123,9],[123,15]],[[126,10],[126,11],[126,14],[126,15]],[[114,0],[114,1],[126,13],[126,12]]],mat:['천','가죽','단단한 가죽','정찰병','그림자','미스릴'],nm:['조끼','갑옷','튜닉','코트']},
  robe:{ic:[[[130,0],[130,1],[131,0],[131,1]],[[130,2],[130,4],[131,4],[130,9]],[[130,3],[130,10],[131,9],[130,12]],[[130,13],[130,14],[131,13],[131,15]],[[130,15],[131,14],[130,11],[131,12]]],mat:['수습생','마법사','현자','대마도사','별자리','미스릴'],nm:['로브','법의','예복','망토 로브']},
  ring:{ic:[[[115,2],[115,3]],[[115,4],[136,9]],[[115,5],[136,10],[128,13]],[[115,6],[136,12],[128,15]],[[136,11],[136,13]]],mat:['구리','은','루비','사파이어','왕가의','미스릴'],nm:['반지','인장 반지','고리']},
  amulet:{ic:[[[129,0],[129,1],[115,7]],[[115,8],[115,9],[136,8]],[[115,10],[136,0],[136,2]],[[136,4],[136,5],[136,6]],[[136,1],[136,3],[136,7]]],mat:['나무','은','수호의','현자의','성녀의','미스릴'],nm:['부적','목걸이','펜던트']},
  shield:{ic:[[[132,0],[132,1]],[[134,7],[134,4]],[[134,0],[134,15]],[[134,3],[134,6]],[[134,12],[134,5]]],mat:['나무','철','강철','기사','탑','미스릴'],nm:['방패','원형 방패','카이트 실드']},
  cape:{ic:[[[129,5],[129,6]],[[129,8],[129,9]],[[125,14],[125,15]],[[130,7],[131,7]],[[130,12],[131,12]]],mat:['낡은','여행자','바람','용병단','그림자','왕의'],nm:['망토','외투','케이프']}
};
// 옵션: 앞말(희귀 이상 1개) · 뒷말(영웅 이상 1개)
const AFFIX_PRE=[{n:'예리한',k:'crit'},{n:'묵직한',k:'atk'},{n:'날렵한',k:'spd'},{n:'단단한',k:'def'},{n:'신비한',k:'mag'},{n:'질긴',k:'hp'},{n:'유연한',k:'eva'}];
const AFFIX_SUF=[{n:'곰의',k:'hp'},{n:'매의',k:'crit'},{n:'거인의',k:'atk'},{n:'현자의',k:'mag'},{n:'바람의',k:'spd'},{n:'수호자의',k:'def'},{n:'그림자의',k:'eva'}];
// 세트 장비 (보스 처치 시 낮은 확률로 그 지역 세트 조각)
const SETS={
  wolf:{n:'늑대 사냥꾼',town:'t1',p:{wpn:{cls:'bow',n:'늑대 사냥꾼의 활',ic:I(106,2)},arm:{cls:'light',n:'늑대 가죽 갑옷',ic:I(126,8)},acc:{cls:'cape',n:'늑대 털 망토',ic:I(129,8)}},b2:{crit:4},b3:{spd:3,eva:4},d:'2세트: 치명 +4 / 3세트: 속도 +3, 회피 +4'},
  miner:{n:'광부 길드',town:'t2',p:{wpn:{cls:'axe',n:'광부 길드의 곡괭이 도끼',ic:I(110,2)},arm:{cls:'heavy',n:'광부 길드 강철 앞치마',ic:I(120,6)},acc:{cls:'ring',n:'광맥 탐지 반지',ic:I(128,13)}},b2:{def:6},b3:{hp:60,atk:6},d:'2세트: 방어 +6 / 3세트: 체력 +60, 공격 +6'},
  pirate:{n:'해적왕',town:'t3',p:{wpn:{cls:'sword',n:'해적왕의 곡도',ic:I(108,1)},arm:{cls:'light',n:'해적왕의 코트',ic:I(126,14)},acc:{cls:'amulet',n:'해적왕의 금화 목걸이',ic:I(136,6)}},b2:{crit:3,atk:5},b3:{eva:5,spd:2},d:'2세트: 치명 +3, 공격 +5 / 3세트: 회피 +5, 속도 +2'},
  elf:{n:'세계수 수호자',town:'t5',p:{wpn:{cls:'bow',n:'세계수 장궁',ic:I(106,10)},arm:{cls:'light',n:'은빛잎 경갑',ic:I(126,9)},acc:{cls:'amulet',n:'세계수 잎 부적',ic:I(136,2)}},b2:{spd:2,eva:4},b3:{atk:9,crit:4},d:'2세트: 속도 +2, 회피 +4 / 3세트: 공격 +9, 치명 +4'},
  forge:{n:'불칼 장인',town:'t6',p:{wpn:{cls:'axe',n:'불칼 장인의 대도끼',ic:I(109,8)},arm:{cls:'heavy',n:'용암 담금 판갑',ic:I(120,11)},acc:{cls:'ring',n:'화로의 반지',ic:I(136,10)}},b2:{atk:8,def:6},b3:{hp:90,crit:4},d:'2세트: 공격 +8, 방어 +6 / 3세트: 체력 +90, 치명 +4'},
  sultan:{n:'술탄의 사막',town:'t7',p:{wpn:{cls:'sword',n:'술탄의 시미터',ic:I(110,9)},arm:{cls:'light',n:'사막 바람 로브',ic:I(126,13)},acc:{cls:'amulet',n:'태양의 목걸이',ic:I(136,7)}},b2:{spd:3,crit:4},b3:{atk:12,eva:5},d:'2세트: 속도 +3, 치명 +4 / 3세트: 공격 +12, 회피 +5'},
  shogun:{n:'설원 무사',town:'t8',p:{wpn:{cls:'sword',n:'설화 카타나',ic:I(111,6)},arm:{cls:'heavy',n:'서리 무사 갑주',ic:I(117,13)},acc:{cls:'cape',n:'눈꽃 하오리',ic:I(131,12)}},b2:{def:10,hp:80},b3:{atk:14,crit:6},d:'2세트: 방어 +10, 체력 +80 / 3세트: 공격 +14, 치명 +6'},
  royal:{n:'황실 근위',town:'t4',p:{wpn:{cls:'sword',n:'황실 근위 기사검',ic:I(107,9)},arm:{cls:'heavy',n:'황실 근위 판갑',ic:I(118,12)},acc:{cls:'shield',n:'황실 근위 방패',ic:I(134,6)}},b2:{def:8,hp:40},b3:{atk:10,def:8},d:'2세트: 방어 +8, 체력 +40 / 3세트: 공격 +10, 방어 +8'}
};

// 스킬서: town = 이 마을부터 상점에 나옴, p = 가격 배수, who = 'L'(단장) 또는 배울 수 있는 용병 직업
const BOOKS={
  b_double:{town:'t2',p:3,who:'L'},b_guard:{town:'t2',p:3,who:'L'},b_heal:{town:'t2',p:4,who:'L'},m_cleave:{town:'t2',p:3,who:['warrior']},m_shout:{town:'t2',p:3,who:['guard']},
  b_chain:{town:'t3',p:4,who:'L'},b_snipe:{town:'t3',p:4,who:'L'},b_quake:{town:'t3',p:5,who:'L'},m_snipe:{town:'t3',p:4,who:['archer']},m_meteor:{town:'t3',p:4,who:['mage']},
  b_rally:{town:'t4',p:6,who:'L'},b_storm:{town:'t4',p:7,who:'L'},b_frostfield:{town:'t4',p:6,who:'L'},b_execute:{town:'t4',p:7,who:'L'},m_bless:{town:'t4',p:5,who:['priest','mage']}
};
// 고유 장비 (퀘스트 보상 등)
const UNIQUE={
  u_oath:{n:'맹약단의 녹슨 검',slot:'wpn',cls:'sword',ic:I(108,7),lv:6,st:{atk:20,crit:5},d:'철혈 맹약단 창단 단장이 쓰던 검'},
  u_hunter:{n:'숲 사냥꾼의 활',slot:'wpn',cls:'bow',ic:I(106,2),lv:8,st:{atk:22,spd:2},d:'들꽃 마을 사냥꾼의 가보'},
  u_lantern:{n:'광부의 등불 부적',slot:'acc',cls:'amulet',ic:I(5,2),lv:14,st:{mag:18,hp:60},d:'어둠 속에서도 길을 비춘다'},
  u_gruk:{n:'그룩의 투박한 도끼',slot:'wpn',cls:'axe',ic:I(106,4),lv:17,st:{atk:52,crit:4},d:'고블린 족장이 휘두르던 도끼'},
  u_pearl:{n:'인어의 눈물',slot:'acc',cls:'amulet',ic:I(23,14),lv:26,st:{mag:40,hp:200},d:'바다가 품은 진주'},
  u_captain:{n:'블랙솔트 선장의 코트',slot:'arm',cls:'light',ic:I(123,11),lv:28,st:{def:40,hp:320,eva:6},d:'수많은 해전을 견딘 코트'},
  u_crown:{n:'황실 근위 방패',slot:'acc',cls:'shield',ic:I(132,6),lv:40,st:{def:70,hp:700},d:'황실이 인정한 자에게만 내려진다'},
  u_champion:{n:'챔피언의 월계관 망토',slot:'acc',cls:'cape',ic:I(114,0),lv:42,st:{spd:6,eva:8,crit:8},d:'투기장 우승자의 상징'},
  u_iron:{n:'철혈의 깃발검',slot:'wpn',cls:'sword',ic:I(107,9),lv:46,st:{atk:150,crit:10},d:'다시 세운 철혈 맹약단의 상징'}
};
// 소모품
const CONSUM={
  potion:{n:'회복 물약',ic:I(17,8),heal:.3,price:.07,d:'던전 지도에서 사용: 파티 전체 HP 30% 회복'},
  hipotion:{n:'상급 회복 물약',ic:I(17,12),heal:.6,price:.16,d:'던전 지도에서 사용: 파티 전체 HP 60% 회복'},
  feather:{n:'부활의 깃털',ic:I(16,3),revive:.4,price:.25,d:'쓰러진 동료 1명을 HP 40%로 일으킴 (던전 안)'},
  elix_str:{n:'힘의 비약',ic:I(9,1),stat:'STR',d:'단장 힘 영구 +2'},
  elix_agi:{n:'민첩의 비약',ic:I(9,3),stat:'AGI',d:'단장 민첩 영구 +2'},
  elix_int:{n:'지력의 비약',ic:I(9,5),stat:'INT',d:'단장 지력 영구 +2'},
  elix_cha:{n:'매력의 비약',ic:I(9,9),stat:'CHA',d:'단장 매력 영구 +2'}
};

/* ---------- 집결지 ---------- */
// 단계별 건물. plot: 집결지 지도의 건설 부지 키
const CAMP_TIERS=[null,
  {n:'황무지 야영지',need:null},
  {n:'소규모 마을',need:{rank:'E',build:['bunk','board','store'],decor:60,cost:3000},
    reward:'행상인과 주민 5명이 오가기 시작 · 직통 던전 [고대 유적 지하통로] 해금'},
  {n:'자치 영지',need:{rank:'D',build:['clinic','forge','gravel'],decor:160,cost:20000},
    reward:'상인·주민 12명 왕래 · 매일 자치 세금 · 직통 던전 [안개 협곡 소굴] 해금'},
  {n:'용병왕의 성채',need:{rank:'C',build:['tavern','training','slab','fountain'],decor:320,cost:100000},
    reward:'대도시급 주민과 마차 상시 왕래 · 직통 최종 던전 [용의 둥지] 해금'}
];
const BUILDS={
  bunk:{n:'용병 숙소 (텐트 보수)',tier:1,cost:1500,plot:'p_bunk',d:'용병 보유 한도 4 → 6명',ic:I(1,3)},
  board:{n:'의뢰 게시판',tier:1,cost:1500,plot:'p_board',d:'집결지에서 일일 퀘스트 확인 · 일일 퀘스트 +1개',ic:I(18,9)},
  store:{n:'보급 상점',tier:1,cost:2500,plot:'p_store',d:'집결지에서 물약 구입 (10% 할인)',ic:I(17,8)},
  clinic:{n:'의무실',tier:2,cost:9000,plot:'p_clinic',d:'중상 치료비 50% 할인 · 자연 회복 하루 단축',ic:I(17,4)},
  forge:{n:'목재 대장간',tier:2,cost:11000,plot:'p_forge',d:'집결지에서 장비 강화 (강화비 15% 할인)',ic:I(7,13)},
  gravel:{n:'자갈길',tier:2,cost:8000,plot:null,decor:40,d:'흙길을 자갈길로 정비 (꾸미기 +40)',ic:I(13,0)},
  tavern:{n:'용병 주점',tier:3,cost:45000,plot:'p_tavern',d:'희귀 이상 용병 등장 확률 증가 · 보유 한도 +2',ic:I(8,10)},
  training:{n:'훈련소',tier:3,cost:50000,plot:'p_training',d:'교관 임명 가능 · 대기 용병도 경험치 50% 획득',ic:I(91,9)},
  slab:{n:'석판 도로',tier:3,cost:40000,plot:null,decor:60,d:'자갈길을 석판 도로로 정비 (꾸미기 +60)',ic:I(13,2)},
  fountain:{n:'분수 광장',tier:3,cost:60000,plot:'p_fountain',decor:70,d:'집결지 중앙에 분수 (꾸미기 +70)',ic:I(10,2)},
  keep:{n:'석조 본성',tier:4,cost:300000,plot:'p_keep',decor:100,d:'단장 텐트를 석조 본성으로 (꾸미기 +100)',ic:I(2,1)},
  hall:{n:'영웅의 전당',tier:4,cost:250000,plot:'p_hall',d:'파티 전원 모든 능력치 +10%',ic:I(2,4)},
  plaza:{n:'대리석 광장',tier:4,cost:200000,plot:null,decor:90,d:'광장을 대리석으로 (꾸미기 +90)',ic:I(13,6)}
};
// 꾸미기 (정해진 장식 자리에 차례대로 놓임)
const DECOR={
  flowers:{n:'꽃밭',pt:10,price:[300,1500,7000,30000],tier:1,ic:I(15,10),spr:'flowers'},
  fence:{n:'나무 울타리',pt:8,price:[250,1200,6000,26000],tier:1,ic:I(2,13),spr:'fence'},
  barrel:{n:'술통 더미',pt:8,price:[250,1200,6000,26000],tier:1,ic:I(7,3),spr:'barrel'},
  crops:{n:'채소밭',pt:12,price:[400,1800,8000,34000],tier:1,ic:I(15,4),spr:'crops'},
  lantern:{n:'등불',pt:14,price:[0,2400,10000,40000],tier:2,ic:I(5,2),spr:'lantern'},
  scarecrow:{n:'건초 더미',pt:15,price:[0,2600,11000,42000],tier:2,ic:I(1,12),spr:'scarecrow'},
  windmill:{n:'풍차',pt:40,price:[0,9000,30000,100000],tier:2,ic:I(1,15),spr:'windmill',big:true},
  statue:{n:'영웅 석상',pt:35,price:[0,0,26000,90000],tier:3,ic:I(2,5),spr:'statue'},
  banner:{n:'용병단 깃발',pt:25,price:[0,0,16000,60000],tier:3,ic:I(2,10),spr:'banner'},
  well:{n:'돌 우물',pt:25,price:[0,0,15000,55000],tier:3,ic:I(7,10),spr:'well'}
};

/* ---------- 마을 NPC 대사 (태도 단계별) ---------- */
// 태도: 0 무시 / 1 보통 / 2 존중 / 3 전설
const ORES={iron:{n:'철광석',e:'🪨',d:'회색바위 광산 바깥 광맥',ml:0,price:400},silver:{n:'은광석',e:'⚪',d:'회색바위 광산 (채굴 숙련 「초보」부터)',ml:2},obsid:{n:'흑요석',e:'🖤',d:'불칼 화산 광산 (채굴 숙련 「숙련」부터)',ml:3},flame:{n:'화염 결정',e:'🔥',d:'불칼 화산 광산 깊은 곳 (채굴 숙련 「장인」부터)',ml:5}};
const TOWN_TALK={
  t1:{guard:[['어이, 용병이라고? 사고만 치지 마.','이 마을에서 칼 뽑으면 바로 쫓아낸다.','몰락한 맹약단 얘기는 들었다. 여긴 조용한 곳이야.'],
            ['오늘도 순찰 수고하네, 단장.','숲길이 조용해졌어. 자네들 덕인가?','밤에 늑대 울음이 줄었더군.'],
            ['마을 수호자님! 덕분에 밤길이 편해졌습니다.','수호자님 오셨다! 다들 인사해!','이제 경비 서는 게 심심할 지경입니다, 하하.'],
            ['전설의 단장님이 우리 마을 출신이라니, 자랑스럽습니다!','단장님 덕에 들꽃 마을이 지도에 실렸답니다!','용병왕의 고향 마을, 그게 우리입니다!']],
      folk:[['낯선 얼굴이네? 우리 마을은 조용한 곳이야.','용병이면... 밭일은 안 하겠네?','우물물이 참 시원해. 마셔 봐.','저 망토 좀 봐, 다 해졌네.'],
            ['산적 때문에 걱정이 많았는데, 와 줘서 고마워.','숲에서 슬라임 젤리 좀 구해 오면 잼 만들어 줄게.','요즘 양들이 숲 쪽으로 자꾸 가.','여관 수프 먹어 봤어? 할머니 손맛이야.'],
            ['우리 마을의 수호자님이다! 사과 하나 드세요!','애들이 다 용병 놀이만 해요. 단장님 따라 한대요.','수호자님 집결지 구경 가도 돼요?','올해 수확은 수호자님 덕에 풍년이야!'],
            ['전설의 단장님! 사인 한 장만요!','우리 손주가 커서 단장님 용병단에 들어간대요!','마을 잔치 때 단장님 이야기만 해요.','단장님이 처음 왔을 때 기억나요. 그땐 다 해진 망토였는데!']],
      merchant:[['외상은 안 돼. 현금만.','물건 고장 내면 물어내야 해.','구경은 공짜야. 사는 건 아니고.'],
            ['어서 와! 오늘 들어온 물건 좋아.','물약 챙겨 가. 숲은 생각보다 위험해.','단골 되면 덤 줄게.'],
            ['수호자님껜 특별히 깎아 드리지!','수호자님 오신다고 새 물건 들여놨어요!','이거 수호자님 전용으로 빼 둔 거예요.'],
            ['전설의 단장님께 물건을 팔다니, 영광입니다!','단장님이 산 가게라고 간판에 써 붙였어요!','가게 이름을 맹약 잡화로 바꿀까 봐요.']]},
  t2:{guard:[['풋내기는 광산에 짐만 된다. 돌아가.','곡괭이 소리 방해하지 마라.','갱도 근처 얼쩡대지 마.'],
            ['흠... 실력은 좀 있나 보군.','고블린 놈들 냄새가 또 난다. 조심해.','갱도 입구는 해 지면 닫는다.'],
            ['갱도를 지켜 줘서 고맙소, 단장.','광부들이 단장 이름을 노래로 부르더군.','당신 용병단이면 갱도 열쇠를 맡겨도 되겠어.'],
            ['광산촌 전체가 단장님께 빚을 졌습니다!','단장님 이름을 새 갱도에 붙였답니다!','광산촌 경비대가 단장님께 경례!']],
      folk:[['또 떠돌이 용병인가. 곡괭이도 못 들 것 같은데.','먼지 마시기 싫으면 입 가려.','여긴 일하는 사람들 마을이야.','손이 너무 고운데? 진짜 용병 맞아?'],
            ['고블린 얘기 들었어? 무서운 세상이야.','화로 불은 꺼지면 안 돼. 하루 종일 지펴야 해.','오늘은 철광석이 잘 나왔대.','대장간 망치 소리가 자장가야.'],
            ['당신 덕에 다시 광산에 들어갈 수 있게 됐어!','우리 애가 단장님 같은 용병이 되겠대.','광부 여관에서 단장님 자리 비워 둬요.','덕분에 수정 동굴까지 길이 뚫렸어!'],
            ['전설의 단장님! 우리 광산촌의 영웅이시죠!','단장님 칼은 우리 광산 철로 만든 거 맞죠?','광산촌 아이들은 다 단장님 흉내 내요.','오늘 캔 첫 광석은 단장님께 바칩니다!']],
      merchant:[['풋내기한테 팔 물건은 비싸게 받는다.','칼날 무디게 쓰는 놈한텐 안 팔아.','돈 없으면 광석이라도 가져와.'],
            ['돈만 있으면 손님이지.','좋은 쇠는 좋은 값을 받아.','갱도 가면 등불은 필수야.'],
            ['단골 대우 해 드리지.','단장님 오시면 화로부터 지핍니다.','이번에 벼린 칼날 한번 보실래요?'],
            ['단장님 물건은 최상품으로만!','광산촌 최고의 강철, 단장님께 먼저!','단장님 무기를 벼린 대장간이란 게 우리 자랑이에요.']]},
  t3:{guard:[['부두 짐꾼이면 저쪽 하역장으로 가.','항구에선 소매치기 조심해.','배 타려면 통행증부터.'],
            ['신분증은 확인했다. 지나가.','안개 끼는 날엔 창고 쪽 가지 마.','해적 깃발 보이면 바로 알려.'],
            ['C등급 용병단이라... 해상 호위를 부탁할 만하군.','단장 덕에 밤바다가 조용해.','선장들이 당신 용병단을 찾더군.'],
            ['전설의 단장님! 항구가 안전한 건 단장님 덕분입니다!','단장님 배가 들어온다! 길 비켜!','항구 등대에 단장님 깃발을 걸었습니다!']],
      folk:[['여기는 관광객과 상인의 도시야. 흙먼지는 털고 다녀.','갈매기한테 빵 뺏기지 마.','촌사람이 항구는 처음이지?','짠내 나지? 금방 익숙해져.'],
            ['해적 얘기만 나오면 다들 쉬쉬하더라.','저녁노을 질 때 부두가 제일 예뻐.','언덕 위 등대에서 보면 바다가 끝이 없어.','진주 상인이 또 값을 올렸대.'],
            ['해적을 소탕했다는 그 용병단이에요?','덕분에 고깃배가 다시 나가요!','단장님 얘기가 뱃노래에 나와요.','수몰된 신전 얘기, 진짜예요?'],
            ['전설의 단장님이다! 다들 길을 비켜!','바다 건너에서도 단장님 이름을 안대요!','단장님 초상화가 여관에 걸렸어요!','다음 축제 주인공은 단장님이래요!']],
      merchant:[['구경만 할 거면 나가 줄래?','바다 건너 온 물건이라 비싸.','흥정은 안 받아.'],
            ['좋은 물건은 비싼 법이지.','오늘 배가 들어와서 물건이 많아.','진주 하나 어때?'],
            ['귀한 손님이 오셨네. 유물 보러 오셨수?','단장님 위해 남겨 둔 물건이 있어요.','단골 손님께는 바다 건너 소식도 알려 드리지.'],
            ['단장님을 위해 숨겨 둔 보물이 있습니다!','단장님이 산 물건이라면 값이 두 배로 뛰어요!','항구 최고의 물건은 단장님 몫!']]},
  t4:{guard:[['촌구석 흙먼지 묻히지 마라. 하수구 쥐잡이나 하든가.','황궁 계단 근처엔 얼씬도 마라.','수도에선 칼을 칼집에 넣고 다녀라.'],
            ['...용병 주제에 수도를 활보하는군.','투기장 출전하려면 등록부터 해.','훈련장 구경은 울타리 밖에서만.'],
            ['정식 길드 인가 용병단이시군요. 실례했습니다.','근위대장님이 단장 얘기를 하시더군요.','훈련병들이 단장님 검술을 따라 합니다.'],
            ['전설의 단장님! 황성의 문은 언제나 열려 있습니다!','근위대 전원, 단장님께 경례!','황제 폐하께서도 단장님 이름을 아십니다!']],
      folk:[['어머, 냄새. 시골에서 왔나 봐.','수도는 처음이지? 길 잃지 마.','저 용병 옷차림 좀 봐.','귀족 거리는 저쪽이 아니야.'],
            ['용병단이 수도에 자리 잡으려면 한참 걸릴걸?','투기장 경기 봤어? 피가 끓더라!','하수도에서 이상한 소리가 난대.','운하 돌다리 위에서 보는 노을이 최고야.'],
            ['그 투기장 우승자? 대단하다!','우리 집 애가 단장님 그림을 그렸어요.','귀족들도 단장님 얘기를 하더라고요.','근위대 훈련 보셨어요? 단장님 흉내래요.'],
            ['용병왕! 용병왕이다! 만세!','단장님 동상 앞에서 사람들이 소원을 빌어요!','황성 아이들 꿈이 전부 용병이 됐대요.','오늘 황성 축제가 단장님 기념일이래요!']],
      merchant:[['우리 가게는 귀족 전용이야.','손님 신발에 흙 묻었어.','값을 물어볼 거면 살 생각은 없는 거지?'],
            ['돈만 있다면야... 들어오시오.','수도 물가는 원래 이래.','귀족 납품 물건이라 품질은 보장하지.'],
            ['B등급 용병단이라니, 우대해 드리죠.','단장님 이름으로 외상 장부를 열어 드릴까요?','황실 납품 물건, 단장님께만 보여 드려요.'],
            ['용병왕 폐하... 아니, 단장님! 최고급으로 모시겠습니다!','단장님 단골 가게라고 귀족들이 줄을 서요!','황성 최고의 물건, 값은 됐습니다!']]}
};
Object.assign(TOWN_TALK,{
  t7:{guard:[['서방 사람이군. 낙타 냄새 나는 곳에 잘 왔다.','시장에서 소매치기 조심해라.'],['모래폭풍이 오면 바로 건물 안으로.','피라미드 근처엔 함부로 가지 마라.'],['서방의 용병단이 꽤 하는군.','술탄께서 너희 이야기를 들으셨다.'],['모래의 영웅이여, 오아시스가 그대를 환영한다!','사막 경비대 전원, 경례!']],
      folk:[['바다 건너에서 왔다고? 신기하네!','물 한 모금이 금보다 비싼 곳이야.'],['야자 열매 먹어 봤어?','낙타 상단이 내일 떠난대.','피라미드에서 밤마다 이상한 빛이 나.'],['모래 대왕뱀을 잡은 그 용병단!','당신 덕에 상단 길이 안전해졌어요!'],['서방에서 온 전설의 단장님!','오아시스 축제의 주인공이세요!']],
      merchant:[['서방 금화? 환전 수수료는 비싸.','구경은 공짜, 만지면 돈.'],['향신료, 비단, 사막 장미 있어요!','동방 칼날 한번 보세요.'],['단골에게 사막의 보물을!','이건 술탄께 바치던 물건이에요.'],['전설의 단장께 최고급을!','값은 됐어요, 오아시스를 구해 주셨잖아요.']]},
  t9:{guard:[['단풍골에 온 걸 환영하오. 칼은 칼집에 넣어 두시오.','밤엔 대숲 쪽으로 가지 마시오.'],['호박 도둑은 내가 잡소!','서방 용병이 우리 마을에? 반갑구려.'],['당신 이름이 동방까지 들려왔소.','덕분에 마을이 조용하오.']],
      folk:[['올해 호박이 아주 실하게 열렸어요!','단풍 구경 왔어요?'],['주막 단풍주 꼭 마셔 봐요.','대숲에서 이상한 웃음소리가 들려요.'],['영웅님이다! 우리 마을에 또 와 줘요!','아이들이 당신 흉내를 내며 놀아요.']],
      merchant:[['말린 호박이랑 밤 있어요.','동방 짚신, 튼튼해요.'],['서방 금화도 받아요, 조금 깎아서.','대숲 죽순, 오늘 캔 거예요.'],['단골 영웅님께는 덤!','최고 품질만 드려요.']]},
  t8:{guard:[['...산사에 무슨 일로 왔나.','칼을 뽑으면 그 칼로 너를 벤다.'],['눈보라 고개를 넘어왔다니, 실력은 있군.','텐구가 산사를 노린다.'],['무사도는 국경을 가리지 않지. 인정한다.','쇼군의 망령 소문, 들었나?'],['서방의 대무사여, 산사가 고개 숙인다.','그대의 검은 전설이 되었다.']],
      folk:[['춥지요? 따뜻한 차 한잔 해요.','눈 밟는 소리가 좋지 않나요?'],['산사 종소리는 마음을 비워 줘요.','설곰이 마을 근처까지 내려왔대요.','벚꽃이 눈 속에서 피는 곳이에요.'],['텐구를 쫓아낸 분이시죠?','아이들이 서방 검술을 흉내 내요.'],['천년설 봉우리를 정복한 분!','산사 벽화에 단장님 모습을 그린대요!']],
      merchant:[['서방 물건은 잘 안 팔려요.','눈 녹은 물로 담근 술, 한 병?'],['동방 비단 부적이에요.','설원 곰 털옷, 따뜻해요.'],['손님 같은 무사께는 특별히.','이건 쇼군 시절 명검이에요.'],['전설의 무사께 바치는 칼입니다.','산사의 보물, 단장님께!']]},
  t5:{guard:[['숲을 해치면 화살이 날아갈 거요.','이방인은 세계수 언덕에 오르지 마시오.'],['나무를 베지 않는다면 환영하오.','버섯 숲에 독포자가 퍼지고 있소.'],['숲지기들이 당신을 믿기 시작했소.','세계수께서 당신을 반기실 거요.'],['숲의 친구, 맹약단 단장이여!','엘프 궁수대가 단장께 경의를!']],
      folk:[['인간은 시끄럽다니까.','발소리 좀 줄여 주겠어요?'],['호수에 달빛 정령이 산대요.','버섯 수프 먹어 봤어요? 향이 끝내줘요.','나무 위 집은 바람이 불면 살짝 흔들려요.'],['단장님 덕에 숲이 다시 숨을 쉬어요!','세계수 잎이 다시 반짝여요!'],['인간 중에 이런 영웅이 있다니!','숲의 노래에 단장님 이름이 들어갔어요!']],
      merchant:[['숲의 물건은 숲의 값으로.','흥정은 나무에게나 하시오.'],['요정 가루 한 병 어때요?','엘프 활은 가볍고 정확하죠.'],['친구에게는 특별한 물건을.','달빛 이슬, 귀한 거예요.'],['세계수의 친구께 최고급을!','값은 됐어요, 숲을 구해 주셨잖아요.']]},
  t6:{guard:[['약골은 용암에 녹는다. 돌아가라.','불칼 요새는 쇠와 불의 도시다.'],['쓸 만한 칼이군. 어디서 벼렸지?','갱도 쪽에 불정령이 늘었다.'],['요새 대장장이들이 당신 무기를 탐내더군.','감옥 요새 놈들이 조용해졌어.'],['불칼의 영웅, 맹약단 단장!','요새 전체가 단장께 망치로 경례!']],
      folk:[['덥지? 여기선 겨울도 덥다고.','재 묻은 손 털고 다녀.'],['용암 강 옆에선 물을 꼭 챙겨.','오늘도 화로 수백 개가 타고 있어.','대장장이 길드 시험은 진짜 어렵대.'],['분화구 비룡을 잡았다는 그 용병단?','단장님 무기를 벼린 대장간이 어디래요?'],['불칼 요새의 수호자님!','단장님 이름을 새긴 망치가 팔린대요!']],
      merchant:[['불에 안 탄 돈만 받아.','칼 모르는 놈은 칼 사지 마.'],['흑요석 칼날 한번 볼래?','불칼 강철은 대륙 최고야.'],['단골에겐 담금질 한 번 더 해 주지.','이건 용암에서 갓 꺼낸 칼날이야.'],['영웅의 무기는 내가 벼린다!','최고의 강철, 단장님께!']]}});
// 생김새(사람 종류)별 혼잣말 — 어느 마을이든
const TYPE_TALK={
  oldman:['내가 젊었을 땐 말이야, 맹약단이 최고였지.','허리가 쑤시는 걸 보니 비가 오겠군.','젊은이, 서두르면 넘어지는 법이야.','옛날 황금기 맹약단 깃발을 아직 기억하네.'],
  oldwoman:['밥은 먹고 다니우?','에구, 우리 손주 또래네.','감기 조심해요, 바람이 차.','뜨개질하던 털실이 어디 갔나...'],
  villagerman:['오늘 장사 잘되려나.','아내가 장 보러 오래서 왔어요.','저녁엔 여관에서 한잔해야지.','요즘 물가가 올라서 큰일이야.'],
  villagerwoman:['아이들 밥할 시간이네.','빨래 널기 좋은 날씨야.','시장에 새 천이 들어왔대요!','이웃집 고양이가 또 없어졌대.'],
  peasant:['씨앗 뿌릴 때가 됐어.','올해 비가 적당해서 다행이야.','허수아비가 새를 못 쫓네.','밭일 끝나면 낮잠이 최고지.'],
  worker:['오늘 할당량 채우려면 바쁘다!','곡괭이 날이 또 나갔네.','갱도 안은 여름에도 서늘해.','점심은 광부 도시락이지!'],
  nobleman:['흠, 오늘 무도회에 입을 옷이...','용병이라... 쓸모 있으면 고용해 주지.','황궁 연회에 초대받았다네.','투기장 내기에서 또 졌군.'],
  noblewoman:['어머, 새 보석이 나왔대요.','정원의 장미가 피었답니다.','용병단 단장이 저렇게 생겼군요.','오늘 차 모임에 늦겠어요.'],
  princess:['성 밖은 정말 넓구나!','근위대 몰래 나온 거니까 비밀이에요.','언젠가 용병단처럼 모험을 떠나 보고 싶어요.'],
  queen:['백성들이 평안해 보여 다행이군요.','용병단의 활약, 황궁에서도 듣고 있어요.']
};
// 마을별 주민 생김새 구성 (Minifolks 마을 사람들) — 일부는 기존 사람 그림과 섞어서
const TOWN_FOLK={t1:['peasant','peasant','villagerman','villagerwoman','oldman','oldwoman'],t2:['worker','worker','worker','villagerman','villagerwoman','oldman'],
  t3:['villagerman','villagerwoman','villagerwoman','oldwoman','oldman','noblewoman'],t4:['nobleman','noblewoman','noblewoman','villagerman','villagerwoman','oldman']};
Object.assign(TOWN_FOLK,{t9:['villager','villager2','villager3','woman','oldwoman','oldman','child','hunter'],t7:['villager','villager2','villager3','woman','mangreen','oldman','child','noble'],t8:['monk','monk2','eskimo','ninjaeskimo','oldwoman','oldman2','woman','child'],t5:['villagerwoman','villagerman','noblewoman','oldwoman','peasant'],t6:['worker','worker','villagerman','oldman','worker']});



/* ---------- 메인 스토리 ---------- */
// type: talk(장소·NPC와 대화) / clear(던전 보스 처치) / hire(용병 수) / fame / exam / camp(집결지 단계) / arena / classup / win
const MAIN=[
  {id:'m1_1',ch:1,n:'재기의 불씨',type:'talk',at:'t1:guild',goal:'들꽃 마을 의뢰소에 용병단 등록하기',
    talk:[['접수원 메이','어서 오세요. 용병단 등록이요? 이름이... 철혈 맹약단?! 그 몰락한...'],
          ['접수원 메이','아, 아니에요! 등록은 됐습니다. F등급부터 시작이에요. 여관에서 용병을 구하고, 속삭이는 숲길부터 가 보세요.']]},
  {id:'m1_2',ch:1,n:'동료를 찾아서',type:'hire',count:3,goal:'여관에서 용병을 고용해 파티 3명 이상 만들기',
    talk:[['접수원 메이','혼자서는 던전에 못 들어가요. 여관 주인 한스 씨에게 가 보세요.']]},
  {id:'m1_3',ch:1,n:'숲의 속삭임',type:'clear',d:'d_forest',goal:'속삭이는 숲길의 보스 처치',
    talk:[['촌장 오드릭','숲길에 거대한 슬라임이 자리 잡아 약초꾼들이 못 들어가고 있소.'],['촌장 오드릭','해결해 준다면 마을이 용병단을 믿게 될 것이오.']],
    done:[['촌장 오드릭','정말 해냈군! 그런데... 요즘 늑대들이 마을 가축을 노린다네. 늑대 소굴도 부탁하오.']]},
  {id:'m1_4',ch:1,n:'잿빛 갈기',type:'clear',d:'d_wolf',goal:'늑대 소굴의 우두머리 「잿빛 갈기」 처치',
    done:[['사냥꾼 리아','늑대 우두머리를 잡았다고? 그럼 그 늑대들을 몰아낸 게 산적들이었단 말이야...'],['사냥꾼 리아','버려진 야영지에 산적단이 숨어 있어. 마을의 골칫거리지.']]},
  {id:'m1_5',ch:1,n:'산적 소탕',type:'clear',d:'d_camp',goal:'버려진 야영지의 「산적 두목 바르크」 처치',
    done:[['산적 두목 바르크','크윽... 철혈 맹약단? 그 깃발... 광산촌의 가렛이란 놈이 같은 문양을 갖고 있었지...'],
          ['나레이션','옛 부관 가렛의 이름이다. 그가 살아 있다!'],['접수원 메이','대단해요! 명성이 쌓이면 승급 심사를 받을 수 있어요.']]},
  {id:'m1_6',ch:1,n:'첫 승급',type:'exam',exam:'exam_f',goal:'명성 1,500 달성 후 의뢰소에서 F→E 승급 심사 통과',
    done:[['접수원 메이','축하해요! 이제 E등급이에요. 회색바위 광산촌으로 가는 길이 열렸어요.'],['나레이션','이제 [회색바위 광산촌]에서 의뢰를 받을 수 있다.']]},
  {id:'m2_1',ch:2,n:'강철의 맹세',type:'talk',at:'t2:guild',goal:'광산촌 길드장 만나기',
    talk:[['길드장 볼드','E등급? 풋내기는 광산에 짐만 된다.'],['길드장 볼드','...뭐, 제1갱도에 독두꺼비가 눌러앉아 광부들이 쉬고 있지. 해결하면 사람 취급은 해 주마.']]},
  {id:'m2_2',ch:2,n:'막힌 갱도',type:'clear',d:'d_mine',goal:'폐쇄된 제1갱도의 「독두꺼비 여왕」 처치',
    done:[['길드장 볼드','흠. 갱도를 뚫었군. 고블린 야영지 토벌 임시 허가를 내주지.'],['길드장 볼드','그리고 집결지가 아직 텐트 몇 개라며? 목수들이 일감을 찾고 있으니 집결지를 키워 봐.']]},
  {id:'m2_3',ch:2,n:'집결지 확장',type:'camp',tier:2,goal:'집결지를 2단계 [소규모 마을]로 승급',
    done:[['나레이션','행상인과 주민들이 집결지에 오가기 시작했다. 거점 직통 던전 [고대 유적 지하통로]가 열렸다.']]},
  {id:'m2_4',ch:2,n:'고블린 군단',type:'clear',d:'d_goblin',goal:'고블린 야영지의 「고블린 족장 그룩」 처치',
    done:[['광부 토비','고블린들이 끌고 간 사람 중에 이상한 노인이 있었어요. 수정 동굴 깊은 곳에 갇혔대요!'],['나레이션','그 노인이... 가렛일까?']]},
  {id:'m2_5',ch:2,n:'옛 부관',type:'clear',d:'d_crystal',goal:'깊은 수정 동굴의 「수정 외눈 거인」 처치',
    done:[['옛 부관 가렛','...그 눈빛, 그 깃발. 단장님의 자제분이시군요. 살아 계셨다니.'],['옛 부관 가렛','황실은 우리를 버렸습니다. 발테르 공작이 우리 공을 가로채고 누명을 씌웠지요.'],
          ['옛 부관 가렛','이 늙은 몸, 다시 맹약단의 검이 되겠습니다.'],['나레이션','영웅 등급 용병 [가렛]이 합류했다!']]},
  {id:'m2_6',ch:2,n:'인정받는 자',type:'exam',exam:'exam_e',goal:'명성 8,500 달성 후 E→D 승급 심사 통과',
    done:[['길드장 볼드','D등급이라... 인정하지. 넌 풋내기가 아니다. 대장간도 마음껏 써라.'],['나레이션','이제 [푸른물결 항구]에서 정식 의뢰를 받을 수 있다.']]},
  {id:'m3_1',ch:3,n:'검은 파도',type:'talk',at:'t3:guild',goal:'항구 의뢰소에서 일감 받기',
    talk:[['항구 관리관 니나','D등급 용병단? 고급 의뢰는 C등급부터야. 지금은 부두 짐 나르기 정도만 줄 수 있어.'],['항구 관리관 니나','...아, 부두 창고에 밀수꾼이 판친다는데. 그거라도 할래?']]},
  {id:'m3_2',ch:3,n:'안개 속 창고',type:'clear',d:'d_dock',goal:'안개 낀 부두 창고의 「밀수단 두목 렉스」 처치',
    done:[['밀수단 두목 렉스','우린 심부름꾼일 뿐이야! 돈은 황성의 높으신 분이 대고... 해적선과 거래했지!'],['항구 관리관 니나','해적선 잔해 조사 의뢰를 특별히 열어 줄게. 집결지도 더 키워 둬.']]},
  {id:'m3_3',ch:3,n:'자치 영지',type:'camp',tier:3,goal:'집결지를 3단계 [자치 영지]로 승급'},
  {id:'m3_4',ch:3,n:'난파선의 괴물',type:'clear',d:'d_wreck',goal:'해적선 잔해의 「심해의 크라켄」 처치',
    done:[['옛 부관 가렛','해적선 금고의 장부... 발테르 공작의 문장이 찍혀 있습니다!'],['옛 부관 가렛','나머지 장부는 수몰된 신전으로 옮겨졌다고 적혀 있군요.']]},
  {id:'m3_5',ch:3,n:'수몰된 진실',type:'clear',d:'d_temple',goal:'수몰된 신전의 「수몰된 망령왕」 처치',
    done:[['나레이션','신전 제단 아래, 발테르 공작이 심연의 존재와 맺은 계약서가 있었다.'],['옛 부관 가렛','맹약단을 무너뜨린 것도 이 계약 때문이었군요... 황성으로 가야 합니다.']]},
  {id:'m3_7',ch:3,n:'세계수의 맹약',type:'talk',at:'t5:guild',goal:'은빛잎 숲마을 의뢰소에서 숲지기 장로 만나기',
    talk:[['숲지기 장로 엘라리온','...그 깃발. 철혈 맹약단이로군. 인간들은 잊었겠지만, 숲은 기억하네.'],['숲지기 장로 엘라리온','그대들의 「맹약」은 원래 우리 엘프와 맺은 봉인의 맹약이었소. 대륙에는 심연을 막는 봉인이 셋 있지. 세계수 뿌리, 동방 사막의 피라미드, 그리고 천년설 봉우리.'],['숲지기 장로 엘라리온','맹약단이 사라진 뒤 봉인을 지킬 자가 없었소. 지금 버섯 숲에 독포자가 번져 세계수가 시들고 있다네. 그대가 정말 아르칸의 핏줄이라면, 막아 주게.'],['옛 부관 가렛','아르칸... 단장님의 이름입니다. 마지막 원정 전에 이 숲에 들르셨던 이유가 이거였군요.']]},
  {id:'m3_8',ch:3,n:'독포자의 근원',type:'clear',d:'d_grove',goal:'이끼 덮인 버섯 숲의 「버섯왕 포르치니」 처치',
    done:[['숲지기 장로 엘라리온','버섯왕의 독은... 심연의 기운이었소. 누군가 세계수 봉인을 일부러 갉아먹게 한 것이오.'],['옛 부관 가렛','발테르의 계약서에 적힌 「봉인을 하나씩 무너뜨린다」는 말이 이것이었군요.'],['숲지기 장로 엘라리온','아르칸은 십 년 전, 부러진 검을 들고 남쪽 화산 도시로 간다 했소. 검을 다시 벼려야 한다면서.']]},
  {id:'m3_6',ch:3,n:'항구의 인정',type:'exam',exam:'exam_d',goal:'명성 34,000 달성 후 D→C 승급 심사 통과',
    done:[['항구 관리관 니나','C등급 축하해! 이제 해상 호위·유적 의뢰도 맡길 수 있어. 유물 상점도 열어 줄게.'],['나레이션','이제 [황성 아우렐리아]에서 의뢰를 받을 수 있다.']]},
  {id:'m4_1',ch:4,n:'무시당하는 이방인',type:'talk',at:'t4:guild',goal:'황성 의뢰소 방문',
    talk:[['황성 경비병','촌구석 흙먼지 묻히지 마라.'],['황성 의뢰소 직원','C등급? 메인 길드는 B등급부터 출입이에요. 지금 드릴 수 있는 건... 하수구 쥐잡기 정도네요.']]},
  {id:'m4_2',ch:4,n:'하수구 쥐잡기',type:'clear',d:'d_sewer',goal:'수도 지하 하수로의 「하수로의 쥐왕」 처치',
    done:[['황성 의뢰소 직원','...정말 해치웠네요? 추방자의 황무지 토벌도 맡겨 볼게요. 그리고 전직 시험장에도 가 보세요.']]},
  {id:'m4_3',ch:4,n:'추방자의 군주',type:'clear',d:'d_waste',goal:'추방자의 황무지의 「추방자 군주 고르마」 처치'},
  {id:'m4_4',ch:4,n:'용병왕의 성채',type:'camp',tier:4,goal:'집결지를 4단계 [용병왕의 성채]로 승급'},
  {id:'m4_5',ch:4,n:'왕실 투기장',type:'arena',goal:'왕실 투기장 3연전 우승',
    done:[['황제 레오나르트','훌륭하다! 그 깃발... 철혈 맹약단인가. 짐이 그대들을 오해했던 모양이군.'],['황제 레오나르트','타락한 기사단 요새를 토벌하라. 성공하면 정식 길드 인가를 내리겠다.']]},
  {id:'m4_7',ch:4,n:'부러진 맹약의 검',type:'talk',at:'t6:guild',goal:'불칼 요새도시 의뢰소에서 대장장이 길드장 만나기',
    talk:[['대장장이 길드장 브란','그 칼자루 문장... 내가 벼린 「맹약의 검」이야! 십 년 전 아르칸이 그 검을 부러진 채로 들고 왔었지.'],['대장장이 길드장 브란','다시 벼려 달라더니, 발테르의 사냥개들이 쫓는다며 검 조각을 잿빛 갱도 깊은 곳에 숨기고는 바다 건너 동방으로 떠났어.'],['대장장이 길드장 브란','갱도엔 지금 불정령들이 들끓지. 조각을 찾아오면 내가 다시 벼려 주마.']]},
  {id:'m4_8',ch:4,n:'잿불 속의 편지',type:'clear',d:'d_ashmine',goal:'잿빛 용암 갱도의 「화염 정령왕 이프르」 처치',
    done:[['나레이션','정령왕이 지키던 낡은 상자 안에, 부러진 검 조각과 아르칸의 편지가 들어 있었다.'],['편지 — 아르칸','「황제의 명은 봉인을 지키던 맹약단을 국경 전쟁으로 돌리라는 것이었다. 그 명을 올린 자는 발테르 공작. 명을 따르면 봉인이 무너진다.」'],['편지 — 아르칸','「나는 명을 어기기로 했다. 발테르는 이것을 반역이라 부를 것이고, 맹약단은 해체되겠지. 하지만 맹약은 지킨다. 사막의 봉인이 위험하다. 동방으로 간다.」'],['옛 부관 가렛','...그래서였군요. 우리는 배신자가 아니었습니다. 명령을 어긴 건, 대륙을 지키기 위해서였어요.'],['대장장이 길드장 브란','검은 내가 다시 벼려 두마. 동방으로 가라. 항구에서 배를 타면 된다.']]},
  {id:'m4_9',ch:4,n:'바다 건너 동방으로',type:'talk',at:'t7:guild',goal:'동방 대륙 「모래바람 오아시스」 의뢰소에서 상단장 만나기',
    talk:[['상단장 카심','서방의 검사 아르칸? 알다마다! 십 년 전 우리 상단과 함께 사막을 건넜소. 피라미드에 봉인이 있다면서.'],['상단장 카심','그런데 요즘 모래 대왕뱀이 상단 길을 막고 있소. 길부터 뚫어 준다면 피라미드까지 안내하리다.']]},
  {id:'m4_10',ch:4,n:'모래 위의 길',type:'clear',d:'d_dune',goal:'끝없는 모래 언덕의 「모래 대왕뱀 샤이」 처치',
    done:[['상단장 카심','길이 열렸소! 피라미드는... 아르칸이 마지막으로 들어간 곳이오. 그 뒤로 그를 본 사람은 없소.']]},
  {id:'m4_11',ch:4,n:'무덤 속 벽화',type:'clear',d:'d_tomb',goal:'왕의 무덤 피라미드의 「태양신의 눈」 처치',
    done:[['나레이션','피라미드 깊은 곳, 사막의 봉인은 이미 깨져 있었다. 벽에는 칼끝으로 새긴 글씨가 남아 있었다.'],['벽의 글씨 — 아르칸','「늦었다. 심연 교단이 먼저 왔다. 교단의 돈줄은 서방의 공작, 발테르. 마지막 봉인은 북쪽 설산 천년설 봉우리. 그곳에서 끝을 낸다.」'],['점성술사 라일라','별이 말해요... 그 사람, 아직 살아 있어요. 차갑고 하얀 곳에서 잠들어 있어요.'],['옛 부관 가렛','단장님이 살아 계신다... 하지만 먼저 서방에서 정식 인가부터 받아야 합니다. 그래야 동방 산사도 우리를 받아 줄 겁니다.']]},
  {id:'m4_6',ch:4,n:'대토벌전',type:'exam',exam:'exam_c',goal:'명성 76,000 달성 후 대토벌전(C→B) 승리',
    done:[['황제 레오나르트','정식 길드 인가를 내린다. 철혈 맹약단, 다시 일어서라.'],['나레이션','B등급! 메인 길드 출입과 황실 의뢰가 열렸다.']]},
  {id:'m5_1',ch:5,n:'심연의 그림자',type:'talk',at:'t4:hq',goal:'메인 길드에서 황실 의뢰 받기',
    talk:[['길드 마스터 아이언','발테르 공작이 사라졌다. 심연의 문을 열고 군대를 끌어들이고 있어.'],['길드 마스터 아이언','명성을 쌓아 A등급이 되면 심연 전초 돌파를 맡기겠다.']]},
  {id:'m5_4',ch:5,n:'눈 덮인 산사',type:'talk',at:'t8:guild',goal:'동방 「서리꽃 산사」 의뢰소에서 주지 스님 만나기',
    talk:[['산사 주지 겐신','아르칸 공 말인가. 십 년 전 이 산사에 왔었소. 쇼군의 원령이 마지막 봉인을 갉아먹고 있었지.'],['산사 주지 겐신','그는 봉우리에 올라가... 스스로 얼음 속에 들어가 살아 있는 봉인이 되었소. 그 뒤로 십 년, 그는 잠든 채 심연을 막고 있다오.'],['산사 주지 겐신','하지만 버려진 산사에 텐구가 둥지를 틀고 봉우리 길을 막았소. 먼저 산사를 되찾아 주시오.']]},
  {id:'m5_5',ch:5,n:'텐구의 둥지',type:'clear',d:'d_shrine',goal:'버려진 산사의 「푸른 텐구」 처치',
    done:[['푸른 텐구','어리석은 것... 그 인간이 깨어나면 봉인도 깨진다! 심연의 주인께서 그걸 기다리고 계신다!'],['산사 주지 겐신','맹약의 검이 있다면... 아르칸 공 대신 검으로 새 봉인을 세울 수 있소. 브란이 다시 벼린 그 검 말이오.'],['나레이션','불칼 요새에서 다시 벼린 맹약의 검이 배편으로 도착했다.']]},
  {id:'m5_6',ch:5,n:'천년설의 단장',type:'clear',d:'d_peak',goal:'천년설 봉우리의 「얼어붙은 쇼군」 처치',
    done:[['나레이션','쇼군의 원령이 흩어지고, 맹약의 검이 얼음에 꽂히자 새 봉인이 빛났다. 얼음이 갈라지며 한 사내가 눈을 떴다.'],['전대 단장 아르칸','...내 깃발을 든 젊은 단장이라니. 십 년이나 잤나 보군.'],['전대 단장 아르칸','미안하다. 맹약단을 지키지 못했다. 하지만 네가 다시 세웠구나.'],['전대 단장 아르칸','발테르가 심연의 문을 열 준비를 마쳤을 거다. 서방으로 돌아가 끝을 내자. 이번엔 함께.'],['나레이션','영웅 등급 용병 [아르칸]이 합류했다!']]},
  {id:'m5_2',ch:5,n:'심연 전초',type:'exam',exam:'exam_b',goal:'명성 140,000 달성 후 심연 전초 돌파 (B→A)',
    done:[['나레이션','심연으로 향하는 문이 열렸다. 월드맵에 [심연의 왕좌]가 나타났다.']]},
  {id:'m5_3',ch:5,n:'용병왕의 대관식',type:'clear',d:'d_abyss',goal:'심연의 왕좌에서 발테르와 「심연의 군주」 격파',
    done:[['배신자 발테르','이럴 수가... 몰락한 용병 따위에게...'],['옛 부관 가렛','단장님. 맹약단의 깃발이... 다시 대륙에 휘날립니다.'],['황제 레오나르트','대륙은 그대를 「용병왕」이라 부를 것이다.']]}
];
// 1회성 서브 퀘스트
const SUBS={
  s1_1:{town:'t1',npc:'농부 베니',n:'잃어버린 양떼',type:'kill',d:'d_forest',count:12,goal:'속삭이는 숲길에서 적 12마리 처치',reward:{gold:600,item:'elix_str'},talk:'숲으로 도망간 양들이 괴물한테 잡아먹힐까 걱정이야...'},
  s1_2:{town:'t1',npc:'사냥꾼 리아',n:'사냥꾼의 시험',type:'elite',d:'d_wolf',count:2,goal:'늑대 소굴에서 정예 2회 처치',reward:{gold:800,uniq:'u_hunter'},talk:'정예 늑대를 잡아 오면 우리 집 가보를 줄게.'},
  s1_3:{town:'t1',npc:'꽃집 아이 루루',n:'꽃밭을 만들어 줘',type:'decor',count:40,goal:'집결지 꾸미기 점수 40 달성',reward:{gold:500,decor:'flowers'},talk:'용병단 집결지가 너무 삭막하대요! 꽃을 심어 주세요!'},
  s2_1:{town:'t2',npc:'대장장이 한나',n:'광석 수집',type:'trophy',tro:'t_ore',count:10,goal:'철광석 10개 모으기 (귀환 시 판매 전에 확인)',reward:{gold:3000,item:'elix_agi'},talk:'좋은 철이 있어야 좋은 칼이 나오지.'},
  s2_2:{town:'t2',npc:'광부 토비',n:'갱도의 등불',type:'kill',d:'d_mine',count:20,goal:'폐쇄된 제1갱도에서 적 20마리 처치',reward:{gold:4000,uniq:'u_lantern'},talk:'갱도가 무서워서 들어갈 수가 없어...'},
  s2_3:{town:'t2',npc:'목수 바드',n:'든든한 거점',type:'camp',count:2,goal:'집결지 2단계 달성',reward:{gold:5000,decor:'windmill'},talk:'집결지를 키우면 내가 풍차를 하나 올려 주지.'},
  s3_1:{town:'t3',npc:'진주 상인 마린',n:'바다의 보물',type:'chest',count:5,goal:'던전 보물 상자 5개 열기',reward:{gold:15000,uniq:'u_pearl'},talk:'보물 상자에서 진주가 나온다는 소문 알아?'},
  s3_2:{town:'t3',npc:'늙은 선원 펠',n:'선장의 코트',type:'clear',d:'d_wreck',count:1,goal:'해적선 잔해 보스 처치',reward:{gold:12000,uniq:'u_captain'},talk:'블랙솔트 선장의 코트가 그 배에 있을 거야.'},
  s3_3:{town:'t3',npc:'학자 이브',n:'고대의 지식',type:'clear',d:'d_ruin',count:1,goal:'고대 유적 지하통로 보스 처치',reward:{gold:16000,item:'elix_int'},talk:'유적의 문양을 조사하고 싶어요.'},
  s4_1:{town:'t4',npc:'귀족 영애 엘리제',n:'귀족의 품격',type:'decor',count:250,goal:'집결지 꾸미기 점수 250 달성',reward:{gold:60000,item:'elix_cha'},talk:'용병단이라도 품격은 있어야죠. 집결지를 아름답게 꾸며 보세요.'},
  s4_2:{town:'t4',npc:'근위대장 로웰',n:'황실 근위의 증표',type:'kill',d:'d_fort',count:30,goal:'타락한 기사단 요새에서 적 30마리 처치',reward:{gold:120000,uniq:'u_crown'},talk:'타락한 옛 동료들을 쉬게 해 주시오.'},
  s4_3:{town:'t4',npc:'떠돌이 시인 안톤',n:'용의 노래',type:'clear',d:'d_nest',count:1,goal:'용의 둥지 보스 처치',reward:{gold:200000,uniq:'u_iron'},talk:'용을 쓰러뜨린 이야기를 노래로 남기고 싶소!'},
  s1_4:{town:'t1',npc:'방앗간 할머니 도라',spr:'oldwoman',n:'겨울 채비',type:'trophy',tro:'t_hide',count:6,goal:'짐승 가죽 6장 모으기 (귀환 시 판매 전에 확인)',reward:{gold:900,item:'hipotion'},talk:'겨울이 오기 전에 아이들 털옷을 지어야 하는데... 가죽이 모자라.'},
  s1_5:{town:'t1',npc:'촌장 오스윈',spr:'oldman',req:'s1_1',n:'마을의 깃발',type:'clear',d:'d_camp',count:1,goal:'버려진 야영지 보스 처치',reward:{gold:1500,decor:'banner'},talk:'양떼를 찾아 준 그대라면 믿을 수 있겠군. 야영지 산적 두목을 쫓아내 주게. 마을 깃발을 하나 내어 주지.'},
  s2_4:{town:'t2',npc:'광산 감독관 브론',spr:'worker',n:'고블린 퇴치',type:'clear',d:'d_goblin',count:1,goal:'고블린 야영지 보스 처치',reward:{gold:6000,item:'elix_str'},talk:'고블린 놈들이 곡괭이를 훔쳐 가! 대장을 잡아 줘.'},
  s2_5:{town:'t2',npc:'수정 세공사 엘라',spr:'villagerwoman',req:'s2_1',n:'빛나는 등불',type:'trophy',tro:'t_crystal',count:8,goal:'마력 수정 8개 모으기 (귀환 시 판매 전에 확인)',reward:{gold:9000,decor:'lantern'},talk:'한나 언니가 당신 얘기를 하던걸요. 수정만 있으면 꺼지지 않는 등불을 만들 수 있어요.'},
  s3_4:{town:'t3',npc:'부두 감독 마르코',spr:'villagerman',n:'안개 속 밀수꾼',type:'kill',d:'d_dock',count:25,goal:'안개 낀 부두 창고에서 적 25마리 처치',reward:{gold:10000,item:'hipotion'},talk:'창고에 밀수꾼들이 들끓어. 짐을 못 내리겠어.'},
  s3_5:{town:'t3',npc:'등대지기 소피',spr:'oldwoman',req:'s3_1',n:'등대의 진주',type:'trophy',tro:'t_pearl',count:6,goal:'바다 진주 6개 모으기 (귀환 시 판매 전에 확인)',reward:{gold:14000,decor:'well'},talk:'진주를 등대 렌즈에 박으면 빛이 더 멀리 간다우. 마린이 그러더구먼.'},
  s4_4:{town:'t4',npc:'황녀 세레나',spr:'princess',n:'용병단의 위용',type:'hire',count:12,goal:'용병 12명 모으기',reward:{gold:80000,decor:'statue'},talk:'저 몰래 나온 거예요! 큰 용병단을 보고 싶어요. 용병이 열두 명은 넘어야 큰 용병단이죠?'},
  s4_5:{town:'t4',npc:'왕실 재무관 헤르만',spr:'nobleman',n:'하수도의 쥐',type:'kill',d:'d_sewer',count:30,goal:'수도 지하 하수로에서 적 30마리 처치',reward:{gold:70000,item:'elix_int'},talk:'하수도 괴물 때문에 금고 지하실이 위험하오. 처리해 주면 후하게 쳐 주지.'},
  s5_1:{town:'t5',npc:'숲지기 장로 엘라리온',spr:'oldman',n:'독포자의 숲',type:'clear',d:'d_grove',count:1,goal:'이끼 덮인 버섯 숲 보스 처치',reward:{gold:30000,item:'elix_int'},talk:'인간의 용병단이라... 버섯 숲에 독포자가 퍼져 세계수가 시들고 있소. 버섯왕을 멈춰 주시오.'},
  s5_2:{town:'t5',npc:'궁수 대장 시엔',spr:'villagerwoman',req:'s5_1',n:'호수의 도둑들',type:'kill',d:'d_moonlake',count:30,goal:'달빛 정령의 호수에서 적 30마리 처치',reward:{gold:42000,decor:'statue'},talk:'장로님이 당신을 인정했어요. 호수의 너구리들이 정령의 이슬을 훔쳐 가요. 혼내 주세요!'},
  s5_3:{town:'t5',npc:'세계수의 무녀 루미',spr:'princess',req:'s5_2',n:'세계수의 뿌리',type:'clear',d:'d_elfroot',count:1,goal:'시든 세계수 뿌리의 대나무 거인 처치',reward:{gold:60000,item:'elix_cha'},talk:'세계수 뿌리 깊은 곳에 무언가가 똬리를 틀었어요. 숲 전체가 아파해요...'},
  s5_4:{town:'t5',npc:'요정 가루 상인 핀',spr:'villagerman',n:'반짝이는 날개',type:'trophy',tro:'t_wing',count:10,goal:'날개 10장 모으기 (귀환 시 판매 전에 확인)',reward:{gold:36000,item:'hipotion'},talk:'나비 날개 가루로 요정 가루를 만들어요. 열 장만 구해 줄래요?'},
  s6_1:{town:'t6',npc:'대장장이 길드장 브란',spr:'worker',n:'불의 갱도',type:'clear',d:'d_ashmine',count:1,goal:'잿빛 용암 갱도의 화염 정령왕 처치',reward:{gold:160000,item:'elix_str'},talk:'갱도에 불정령이 들어앉아 광석을 못 캐! 정령왕을 꺼 버려.'},
  s6_2:{town:'t6',npc:'요새 사령관 이그나',spr:'noblewoman',req:'s6_1',n:'감옥 요새 탈환',type:'kill',d:'d_lavafort',count:35,goal:'불칼 감옥 요새에서 적 35마리 처치',reward:{gold:220000,decor:'banner'},talk:'감옥 요새가 반란군과 괴물에게 넘어갔다. 길드장이 너를 추천하더군.'},
  s6_3:{town:'t6',npc:'늙은 화산 학자 오르',spr:'oldman',req:'s6_2',n:'분화구의 심장',type:'clear',d:'d_crater',count:1,goal:'분화구의 심장에서 용암 비룡 처치',reward:{gold:300000,item:'elix_agi'},talk:'분화구가 깨어나고 있어. 그 중심에 비룡이 알을 품었지. 막지 않으면 도시가 잿더미가 될 거야.'},
  s6_4:{town:'t6',npc:'흑요석 세공사 미라',spr:'villagerwoman',n:'검은 강철',type:'trophy',tro:'t_steel',count:10,goal:'검은 강철 조각 10개 모으기 (귀환 시 판매 전에 확인)',reward:{gold:180000,decor:'lantern'},talk:'흑요석 야수 몸에서 나오는 검은 강철이 최고의 재료예요.'},
  s7_1:{town:'t7',npc:'상단장 카심',spr:'nj:noble',n:'모래 위의 길',type:'clear',d:'d_dune',count:1,goal:'끝없는 모래 언덕의 모래 대왕뱀 처치',reward:{gold:500000,item:'elix_agi'},talk:'서방의 용병이라고? 마침 잘 왔소. 대왕뱀이 상단 길을 막아 낙타가 다 굶고 있소.'},
  s7_2:{town:'t7',npc:'점성술사 라일라',spr:'nj:woman',req:'s7_1',n:'저주받은 무덤',type:'kill',d:'d_tomb',count:35,goal:'왕의 무덤 피라미드에서 적 35마리 처치',reward:{gold:650000,decor:'statue'},talk:'별이 경고해요. 피라미드의 저주가 깨어났어요. 무덤 속 망령들을 잠재워 주세요.'},
  s7_3:{town:'t7',npc:'오아시스 수호자 하산',spr:'nj:mangreen',req:'s7_2',n:'마르는 오아시스',type:'clear',d:'d_oasisdeep',count:1,goal:'오아시스 지하 수로의 두꺼비 군주 처치',reward:{gold:800000,item:'elix_str'},talk:'오아시스 물이 줄어들고 있소. 지하 수로에 무언가가 물길을 막았소!'},
  s7_4:{town:'t7',npc:'사막 장미 상인 자라',spr:'nj:villager2',n:'사막의 진주',type:'trophy',tro:'t_pearl',count:10,goal:'진주 10개 모으기 (귀환 시 판매 전에 확인)',reward:{gold:450000,item:'hipotion'},talk:'모래 달팽이 껍데기 속 진주가 술탄 궁에서 인기예요!'},
  s9_1:{town:'t9',npc:'촌장 할머니 순이',spr:'nj:oldwoman',n:'호박밭 지키기',type:'kill',d:'d_maple',count:25,goal:'단풍 대숲에서 적 25마리 처치',reward:{gold:520000,item:'hipotion'},talk:'대숲 멧돼지들이 밤마다 내려와 호박밭을 다 파헤쳐요. 젊은 용병 양반, 좀 도와줘요.'},
  s9_2:{town:'t9',npc:'사냥꾼 도윤',spr:'nj:hunter',req:'s9_1',n:'붉은 텐구의 장난',type:'clear',d:'d_maple',count:1,goal:'단풍 대숲의 붉은 단풍 텐구 처치',reward:{gold:700000,item:'elix_agi'},talk:'숲 깊은 곳 텐구가 길 잃은 아이들을 홀린다오. 예전에 서방에서 온 붉은 망토 기사가 그놈을 쫓아냈었는데...'},
  s9_3:{town:'t9',npc:'주막 주인 막순',spr:'nj:woman',req:'s9_2',n:'단풍주 재료',type:'trophy',tro:'t_wing',count:8,goal:'깃털 8개 모으기 (귀환 시 판매 전에 확인)',reward:{gold:480000,decor:'statue'},talk:'단풍주에 부엉이 깃털로 향을 내요. 아르칸이라는 손님도 이 술을 참 좋아했죠. 눈 덮인 산으로 떠나기 전날 밤에...'},
  s8_1:{town:'t8',npc:'산사 주지 겐신',spr:'nj:monk',n:'눈보라 너머',type:'clear',d:'d_snowpass',count:1,goal:'눈보라 고개의 설곰왕 처치',reward:{gold:900000,item:'elix_int'},talk:'눈보라 고개에 설곰왕이 나타나 순례자들이 오지 못하오. 마음을 비우고 다녀오시오.'},
  s8_2:{town:'t8',npc:'검술 사범 아야메',spr:'nj:samuraiblue',req:'s8_1',n:'산사의 요괴',type:'kill',d:'d_shrine',count:40,goal:'버려진 산사에서 요괴 40마리 처치',reward:{gold:1100000,decor:'banner'},talk:'서방의 검이 얼마나 날카로운지 보고 싶군. 버려진 산사의 요괴들을 베어 와라.'},
  s8_3:{town:'t8',npc:'눈의 무녀 유키',spr:'nj:princess',req:'s8_2',n:'천년설의 쇼군',type:'clear',d:'d_peak',count:1,goal:'천년설 봉우리의 얼어붙은 쇼군 처치',reward:{gold:1400000,item:'elix_cha'},talk:'봉우리 위, 천 년 전 쇼군의 원한이 얼어 있어요. 그를 쉬게 해 주세요.'},
  s8_4:{town:'t8',npc:'털옷 장인 노리',spr:'nj:eskimo',n:'따뜻한 겨울',type:'trophy',tro:'t_hide',count:15,goal:'짐승 가죽 15장 모으기 (귀환 시 판매 전에 확인)',reward:{gold:700000,decor:'lantern'},talk:'설곰 가죽으로 마을 아이들 털옷을 지어 주고 싶어요.'},
};
// 일일 퀘스트 틀
const DAILY=[
  {type:'kill',n:'토벌 의뢰',goal:(d,c)=>`${d}에서 적 ${c}마리 처치`,count:[10,16]},
  {type:'elite',n:'정예 사냥',goal:(d,c)=>`${d}에서 정예 ${c}회 처치`,count:[1,1]},
  {type:'chest',n:'보물 탐사',goal:(d,c)=>`던전 보물 상자 ${c}개 열기`,count:[2,2]},
  {type:'clear',n:'보스 토벌',goal:(d,c)=>`${d}의 보스 처치`,count:[1,1]},
  {type:'floor',n:'깊은 탐사',goal:(d,c)=>`던전 방 ${c}개 돌파`,count:[6,8]}
];

/* ---------- 스프라이트 정의 ---------- */
// h_* : 사람 (base 옷 색 행, 머리 모양, 머리 색 행, 도구 표시)
const HUMAN_LOOK={
  h_bandit:{o:7,hair:'mophair',hc:2,tool:true},h_bandit2:{o:7,hair:'bowlhair',hc:1,tool:false,bow:true},
  h_pirate:{o:9,hair:'spikeyhair',hc:2,tool:true},h_smug:{o:5,hair:'shorthair',hc:1,tool:false,bow:true},
  h_outcast:{o:7,hair:'curlyhair',hc:4,tool:true},h_outmage:{o:3,hair:'longhair',hc:4,tool:false,staff:true},
  h_exam:{o:4,hair:'shorthair',hc:4,tool:true},h_exam2:{o:2,hair:'longhair',hc:3,tool:false,bow:true},h_exam3:{o:1,hair:'curlyhair',hc:6,tool:false,staff:true},
  h_champ:{o:0,hair:'spikeyhair',hc:5,tool:true},h_royal:{o:8,hair:'shorthair',hc:3,tool:true},
  h_boss1:{o:0,hair:'mophair',hc:2,tool:true},h_boss2:{o:5,hair:'spikeyhair',hc:2,tool:true},h_valter:{o:3,hair:'longhair',hc:4,tool:false,staff:true}
};
const HAIRS=['shorthair','longhair','curlyhair','mophair','spikeyhair','bowlhair'];
const HAIR_COLORS=['주황','갈색','검정','금발','은발','적발','남색'];

/* ---------- 마을/집결지 주민 대사 ---------- */
const CAMP_VISITOR=['좋은 거점이네요. 장사가 잘 되겠어요.','철혈 맹약단이 다시 일어선다는 소문, 사실이었군요!','여기 물건 좀 팔아도 될까요?','밤에도 모닥불이 꺼지지 않네요. 든든해요.','용병단 덕분에 이 근처 길이 안전해졌어요.'];

// ===== v1.7 주민 대사 대폭 추가 (마을·종족·대륙별 말투) — 단계: 0 낯섦 · 1 알아봄 · 2 신뢰 · 3 영웅 =====
const FOLK_MORE={
 // 서방 인간 · 들꽃 마을 (시골 농촌, 소박)
 t1:[['양들이 요즘 자꾸 숲 쪽으로 가려고 해서 걱정이야.','처음 보는 얼굴인데, 용병이라고?','우리 마을은 큰일이 별로 없어. 그게 좋은 거지.','밀 수확이 끝나면 축제를 해. 그때 또 와.','방앗간 할머니 빵은 진짜 맛있어.','숲길엔 해 지기 전에만 다녀.','촌장님은 무뚝뚝해도 정이 많은 분이야.','저기 꽃밭은 루루가 혼자 가꾸는 거래.'],
   ['어제 숲길에서 괴물 잡은 사람 맞지?','맹약단? 옛날에 아빠가 그 이름 말한 적 있어.','우리 집 닭이 알을 두 개나 낳았어! 좋은 징조래.','베니 아저씨가 너 칭찬하더라.','요즘 산적이 덜 보여. 다 너 덕분인가?','마을 아이들이 막대기 들고 용병 놀이해.','리아 언니가 너랑 사냥 가 보고 싶대.','다음 장날엔 뭐 사 갈 거야?'],
   ['맹약단 깃발을 보면 마음이 놓여.','우리 마을 출신 용병단이라고 자랑하고 다녀!','촌장님이 너 오면 꼭 차 대접하래.','여기 사람들 다 네 편이야.','바쁘면 그냥 쉬다 가. 마을 우물물 시원해.','루루가 꽃 한 송이 주고 싶대.','너희 집결지 소식 들었어. 엄청 커졌다며!','이제 밤에도 문 안 잠그고 자.'],
   ['들꽃 마을의 영웅이 왔다!','내 손자한테 네 이야기를 해 주고 있어.','마을 입구에 네 이름 새긴 표지판 세우재.','용병왕이 우리 마을에서 시작했다니, 믿기지 않아.','영웅님, 우리 빵 좀 가져가요!','축제 때 영웅님 자리 비워 둘게요.','모두가 네 이야기를 노래로 불러.','처음 왔을 때 그 꼬마 견습생이 이렇게 될 줄이야!']],
 // 서방 인간 · 회색바위 광산 (광부, 거칠지만 의리)
 t2:[['어이, 곡괭이 없으면 저리 비켜.','광산 일은 목숨 걸고 하는 거야.','먼지 먹기 싫으면 입 가리고 다녀.','오늘도 무너지지 않길 빌어.','갱도 안에서 휘파람 불면 재수 없대.','철값이 또 떨어졌어. 젠장.','대장장이 한나는 성질이 불같아. 조심해.','광부 노래 알아? 쿵쿵 망치 박자!'],
   ['어, 갱도 괴물 잡았다던 그 용병?','토비가 너한테 고맙다더라.','오늘은 철광석이 잘 나와. 기분 좋네.','광석은 결 따라 캐야 잘 쪼개져.','고블린 놈들 요즘 조용해졌어.','맹약단도 곡괭이 쓸 줄 알아? 하하.','저녁에 술 한잔 하자고. 광부식으로.','은광석은 결이 하얗게 반짝여. 기억해 둬.'],
   ['맹약단이면 광산 어디든 들어가도 돼.','우리 광부들 다 너 편이야.','수정 등불이 마을 밤길을 비춰. 좋지?','네 덕에 갱도 사고가 줄었어.','한나가 너 장비는 공짜로 봐 준대. 진짜야.','은광석 캘 때는 손목을 조금 비틀어.','다들 맹약단 휘장을 작업복에 달고 다녀.','갱도 끝에서 메아리가 울려도 이젠 안 무서워.'],
   ['광산의 수호신이 오셨다!','광부 노래에 네 이름이 들어갔어.','우리 아들이 커서 맹약단 들어간대.','회색바위는 영원히 맹약단 편이다!','네가 캔 광석으로 만든 칼, 가보로 삼았어.','영웅님 오셨다! 다들 모자 벗어!','갱도 입구에 네 곡괭이 걸어 두자.','이 마을에서 너 모르는 사람은 없어.']],
 // 서방 인간 · 푸른물결 항구 (뱃사람, 활기)
 t3:[['배 들어온다! 길 비켜!','소금 냄새 좋지? 이게 항구야.','밀수꾼 조심해. 지갑 꽉 쥐고.','오늘 바람이 세. 배 나가긴 글렀어.','생선 사요, 생선! 아침에 잡은 거!','등대 불빛 보면 마음이 놓여.','뱃사람은 미신을 믿어. 휘파람 금지!','바다 건너 동방 상선이 가끔 와.'],
   ['부두 창고 정리한 용병이지?','마르코 감독이 너 칭찬하더라.','오늘 고등어가 많이 잡혔어. 하나 먹을래?','펠 영감님 옛날 이야기 들어 봤어? 길어.','등대 할머니가 너 기다리던데.','진주 한 알이면 한 달 먹고살아.','바다 사나이는 약속을 지키지.','해적선 잔해 소문 들었어? 무섭더라.'],
   ['맹약단 배는 공짜로 정박하게 해 줄게.','항구 사람들이 너희 휘장 보고 인사해.','폭풍 오는 날엔 맹약단이 부두를 지켜 준대.','동방 상선도 너희 이야기를 하더라.','오늘 잡은 제일 큰 물고기, 너한테 줄게.','마린이 진주 목걸이 하나 만들어 준대.','항구 술집에 맹약단 전용 자리가 생겼어.','바다도 너희 편이야. 요즘 잔잔하잖아.'],
   ['푸른물결의 영웅이다! 깃발 올려!','뱃노래에 네 이름이 들어갔어.','동방까지 네 소문이 퍼졌대.','항구 사람 모두가 너한테 빚졌어.','등대 렌즈에 네 문장을 새겼어.','영웅님 배는 언제나 1번 부두야!','바다의 신도 너를 축복할 거야.','아이들이 바닷가에서 네 흉내를 내.']],
 // 서방 인간 · 황성 (귀족·도시민, 격식)
 t4:[['용병 따위가 황성에 무슨 일이오?','소매치기가 많으니 조심하시오.','황궁 근처에선 칼을 뽑지 마시오.','황성의 물가는 비싸오. 각오하시오.','귀족 나리들 마차 지나가니 비켜요!','하수도 냄새가 또 올라오는군.','투기장 시합 보러 가는 길이오?','황제 폐하 만세! ...라고 해 두지.'],
   ['하수로 괴물을 정리했다던 용병단이오?','근위대장이 그대 이름을 묻더군.','투기장에서 꽤 이름을 날렸다지.','맹약단... 옛 이름이 다시 들리는군.','시장 물건 값을 좀 깎아 드리리다.','황녀님이 몰래 나와서 용병 구경을 하신다더군.','발테르 공작 소문 들었소? 수상하오.','도시에도 그대 같은 사람이 필요하오.'],
   ['정식 길드 인가를 받았다니 축하하오.','근위대가 맹약단과 합동 훈련을 한다오.','귀족들도 그대 앞에선 고개를 숙이오.','황성 사람들은 맹약단을 믿소.','시장 상인들이 그대 단골 할인을 해 준다오.','황녀님이 맹약단 휘장을 달고 계셨소!','투기장 우승 이야기, 아직도 회자되오.','황성의 밤이 안전해졌소.'],
   ['용병왕 폐하... 아니, 아직은 단장님이시군!','황제 폐하께서 그대를 국빈으로 맞으라 하셨소.','황성 광장에 그대 동상이 세워졌소.','역사책에 그대 이름이 오를 것이오.','귀족들이 그대와 식사 한 끼를 바란다오.','황성의 모든 문이 그대에게 열려 있소.','시인들이 그대의 노래를 짓고 있소.','어린 기사들이 그대를 꿈꾸오.']],
 // 엘프 · 은빛잎 숲마을 (고풍스러운 말투, 인간을 낮춰 봄 → 존중)
 t5:[['인간이여, 발소리를 줄이시오.','숲은 그대를 아직 모르오.','나무 한 그루도 함부로 꺾지 마시오.','짧게 사는 종족은 늘 서두르는구려.','세계수의 잎이 떨리오. 불길한 징조요.','그대의 쇠 냄새가 숲을 놀라게 하오.','우리 말을 배우려면 백 년은 걸릴 것이오.','정령들이 그대를 경계하오.'],
   ['버섯 숲을 정화한 인간이 그대요?','장로께서 그대 이야기를 하셨소.','인간치고는 예의를 아는구려.','달빛 호수의 이슬이 다시 맑아졌소.','그대의 활 솜씨, 나쁘지 않소.','숲의 노래를 들어 보겠소? 귀를 기울이시오.','엘프의 시간으로는 찰나지만, 기억해 두겠소.','정령들이 그대에게 길을 내어 주기 시작했소.'],
   ['숲의 벗이여, 어서 오시오.','세계수가 그대를 기억하오.','엘프 아이들이 인간 친구가 생겼다며 좋아하오.','그대에게는 숲길의 비밀을 알려 주리다.','맹약단은 옛 맹약을 지키는 자들이오.','그대 덕분에 숲이 다시 숨을 쉬오.','엘프의 술을 한 잔 들겠소? 이슬로 빚었소.','정령들이 그대 이름을 속삭이오.'],
   ['세계수의 수호자가 오셨소!','천 년 뒤에도 엘프는 그대를 노래하리다.','숲의 모든 생명이 그대에게 고개를 숙이오.','그대는 인간이지만, 우리의 형제요.','세계수 잎으로 엮은 관을 바치겠소.','그대의 이름을 세계수 껍질에 새겼소.','엘프 역사에 인간 영웅은 그대가 처음이오.','숲은 언제나 그대의 집이오.']],
 // 드워프풍 대장장이 · 불칼 요새도시 (거칠고 직설적)
 t6:[['약골은 용암에 녹는다! 돌아가!','망치 소리가 시끄럽다고? 귀를 막아!','불 앞에서 땀 안 흘리는 놈은 대장장이가 아냐.','여기선 강철이 법이다.','화산이 또 기침을 하는군. 흥!','맹약단? 칼 하나 제대로 들 줄은 아나?','흑요석은 차갑게 식혀야 단단해져.','술은 화주다! 목이 타야 술이지!'],
   ['오, 갱도 정령왕을 꺼 버린 녀석이군!','네 칼 좀 보자. ...흠, 쓸 만하군.','브란 길드장이 네 얘길 하더라.','망치질 한번 해 볼래? 손목 나간다!','요새 반란군 소식 들었어? 시끄럽다.','흑요석 광맥은 숙련된 놈만 캘 수 있어.','이 동네 화주 한잔 하고 가라!','네 갑옷, 조금만 손보면 훨씬 낫겠어.'],
   ['맹약단 칼은 우리가 벼린다! 자랑이지!','요새 사람들 다 네 편이다.','화산 광산에서 화염 결정 캤다며? 대단해!','네가 오면 화로가 더 뜨겁게 타는 것 같아.','길드장이 너한테 비법 하나 알려 준대.','맹약단 깃발을 화로 거리에 걸었다!','우리 대장장이들 망치 박자로 너를 환영한다!','강철은 거짓말을 안 해. 너도 그렇고.'],
   ['불칼 요새의 영웅이다! 망치를 들어라!','네 이름을 새긴 칼을 요새 보물로 삼았다.','화산도 너를 보면 잠잠해지는 것 같아.','대장장이 노래에 네가 나온다!','영웅의 칼은 공짜로 벼려 주지! 평생!','용암 강 다리에 네 이름을 붙였다.','이 요새는 너를 위해 불을 지핀다.','강철보다 단단한 단장, 너다!']],
 // 동방 사막 · 모래바람 오아시스 (상인의 화려한 말투)
 t7:[['오, 바다 건너온 손님이여! 구경은 공짜요!','모래폭풍이 오면 바로 천막 안으로!','이 사막에서 물은 금보다 비싸오.','낙타는 사흘을 굶어도 걷는다오.','서방 금화? 환전 수수료가 좀 붙소.','별이 밝은 밤엔 사막도 아름답소.','소매치기 조심! 여긴 바자르요.','피라미드엔 함부로 다가가지 마시오.'],
   ['대왕뱀을 쓰러뜨린 서방의 용사여!','카심 상단장이 그대를 귀한 손님이라 했소.','오늘은 향신료가 싸게 들어왔소. 한번 보시오.','라일라 점성술사가 그대 별을 읽었다더군.','오아시스 물이 맑아졌소. 그대 덕이오?','사막 장미 한 송이, 행운을 드리리다.','술탄께서 서방 용병에게 관심을 보이신다오.','모래 위의 발자국은 금방 사라지지만, 이름은 남소.'],
   ['사막의 벗이여! 차 한잔 드시오!','그대에게는 모든 값을 반으로 해 드리리다.','상단들이 맹약단 깃발을 달고 다닌다오.','술탄궁 연회에 그대 자리가 있소.','바자르 아이들이 그대 노래를 부르오.','그대가 지나간 길엔 도적이 안 나타난다오.','오아시스의 물처럼 귀한 분이오.','라일라가 그대 별이 가장 밝게 빛난다 했소.'],
   ['모래바람의 영웅이시여! 만세!','그대의 이름이 천 개의 상단에 퍼졌소.','술탄께서 그대에게 황금 낙타를 하사하셨소.','사막의 별들이 그대를 축복하오.','피라미드 벽에 새 벽화가 생겼소. 그대의 것이오!','바자르의 모든 상인이 그대에게 머리를 숙이오.','그대는 사막의 전설이 되었소.','모래도 그대의 이름을 기억하오.']],
 // 동방 시골 · 단풍골 (충청도풍 느긋한 사투리)
 t9:[['어이구, 객지 사람이구먼유.','천천히 댕겨유. 급할 거 하나도 없슈.','호박밭 밟으면 할매한테 혼나유.','대숲 쪽은 밤에 가지 말어유.','단풍 구경 왔슈? 지금이 제철이여.','우리 마을은 조용한 게 자랑이여유.','주막 단풍주 한 사발 하고 가유.','텐구가 아이들 홀린다는 소문이 있어유.'],
   ['아, 대숲 멧돼지 잡아 준 양반이구먼유!','순이 할매가 고맙다고 떡 해 준대유.','올해 호박이 실하게 열렸슈.','도윤이가 사냥 같이 가자고 하던디유.','서방 사람도 다 나쁜 건 아니구먼유.','막순이 주막에 손님이 늘었슈.','밤 한 줌 가져가유. 군밤 해 먹어유.','마을 개도 이젠 안 짖네유, 허허.'],
   ['맹약단 양반들은 우리 식구여유.','할매가 맹약단 오면 상 차리라 했슈.','아이들이 단풍잎으로 맹약단 깃발 만들었슈.','대숲이 조용해져서 나무하러 가기 좋아유.','우리 마을에 오면 그냥 쉬다 가유.','주막에 영웅님 전용 자리 있슈.','올 가을엔 풍년이여유. 다 덕분이여.','아르칸 양반 이야기, 할매한테 들어 봐유.'],
   ['단풍골의 은인이 오셨슈!','마을 잔치 열어야 쓰겄네유!','영웅님 이름으로 단풍나무 심었슈.','우리 손주가 크면 맹약단 간대유.','온 마을이 영웅님 편이여유.','단풍주 첫 잔은 언제나 영웅님 거여유.','이 은혜를 어찌 다 갚을까유.','동방 끝까지 영웅님 소문이 퍼졌슈.']],
 // 동방 산사 · 서리꽃 산사 (무사·승려의 절제된 말투)
 t8:[['...마음이 어지러운 자는 산을 오르지 못하오.','칼을 뽑으면 그 칼로 너를 벤다.','눈보라 고개를 넘었다니 실력은 있군.','산사에서는 목소리를 낮추시오.','차가운 바람이 마음을 맑게 하오.','서방의 검은 무겁기만 하다 들었소.','나무아미... 손님인가.','수행은 끝이 없소.'],
   ['설곰왕을 베었다지. 놀랍군.','주지 스님께서 그대를 기다리셨소.','서방의 검도 나름의 도가 있구려.','아야메 사범이 한 수 겨루고 싶다 하오.','따뜻한 차 한 잔 드시오. 생강차요.','산사 종소리가 그대를 반기오.','유키 무녀가 그대 운명을 보았다 하오.','눈 위의 발자국이 곧 수행이오.'],
   ['맹약단의 검은 바르오.','산사의 문은 그대에게 늘 열려 있소.','수행승들이 그대를 본받으려 하오.','그대의 검에서 고요함이 느껴지오.','온천 여관 주인이 그대를 위해 물을 데웠소.','쇼군의 원한이 그대 덕에 옅어졌소.','아이들이 그대 검술 흉내를 내오.','차가운 산에도 따뜻한 이가 있구려.'],
   ['천년설의 수호자께 예를 올리오.','산사의 역사에 그대 이름을 새겼소.','봉우리의 눈도 그대 앞에서는 녹는 듯하오.','그대는 이미 큰 도를 이루었소.','동방 무사들이 그대를 스승이라 부르오.','종을 세 번 울려 그대를 맞이하오.','그대가 지킨 봉인이 천 년을 가리다.','이 산은 영원히 그대를 기억하오.']]
};
// 경비·상인 대사 보강 (영웅 단계)
const GUARD_MORE={t5:['숲의 수호자께 길을 비켜라!','엘프 경비대가 그대에게 예를 표하오.'],t6:['요새 경비대, 영웅께 경례!','네가 오면 경비 설 맛이 난다!'],t7:['사막의 영웅이시여, 지나가시오!','술탄 근위대가 그대를 호위하겠소.'],t9:['영웅님 오셨슈! 문 열어유!','우리 마을 경비가 다 영웅님 팬이여유.'],t8:['수호자께서 오셨다. 문을 열어라.','산사 무사들이 고개를 숙이오.']};
const MERCH_MORE={t5:['숲의 수호자께는 이슬 값만 받겠소.','세계수 수액, 그대에게만 드리리다.'],t6:['영웅 할인! 망치 걸고 약속하지!','화염 결정 장비, 영웅께 먼저 보여 주지.'],t7:['영웅께는 모든 물건 반값이오!','술탄도 못 산 물건, 그대에게 드리리다.'],t9:['영웅님은 그냥 가져가유!','떡이랑 군밤 덤이여유.'],t8:['수호자께 바치는 부적이오.','값은 마음으로 받겠소.']};
// 대륙 공통 소문 (단계별) — 서방/동방 분위기 차이
const CONT_TALK={
 west:[['요즘 서방 곳곳 땅이 잿빛으로 변한대.','왕국 전령들이 바쁘게 뛰어다니더라.','발테르 공작 영지 쪽은 가지 말래.','밤하늘에 검은 줄이 생긴 걸 봤어.'],
       ['맹약단이라는 용병단이 다시 생겼대.','다른 마을에서도 맹약단 이야기를 하더라.','잿빛 이끼를 조사하는 학자들이 있대.','왕국 우편 마차가 맹약단을 찾더라.'],
       ['서방 어느 마을을 가도 맹약단 칭찬이야.','맹약단이 마을과 마을을 잇고 있대.','잿빛 균열을 막는 게 맹약단이래.','황성에서도 맹약단을 부른대.'],
       ['서방 왕국 전체가 맹약단을 믿어.','균열이 닫히고 땅이 다시 푸르러졌어!','어느 마을에서든 맹약단 깃발이 휘날려.','용병왕 전설은 서방 모든 아이가 알아.']],
 east:[['서방 사람이 바다를 건너왔다는군.','사막에 모래폭풍이 잦아졌소.','동방의 봉인이 흔들린다는 소문이오.','산 위의 종이 밤에 혼자 울렸다지.'],
       ['서방 용병단이 동방에서도 일을 한다더군.','사막과 산사 사이 길에 요괴가 줄었소.','단풍골 사람들이 서방 손님 칭찬을 하오.','술탄궁에서 서방 용병을 찾는다 하오.'],
       ['동방 세 마을이 맹약단 덕에 다시 이어졌소.','사막 상단이 단풍골까지 다닌다오.','산사와 술탄궁이 서신을 주고받는다더군.','맹약단은 동방의 벗이오.'],
       ['동방 대륙 전체가 맹약단을 칭송하오.','모래폭풍도 요괴도 잠잠해졌소.','봉인이 다시 단단해졌다 하오.','바다 건너 온 영웅의 이야기가 전설이 되었소.']]};

// ===== v1.7 마을 의뢰: 마을마다 이어지는 이야기 (req로 순서, done=보고 대사, after=끝난 뒤 대사) =====
const SUB_STORY={
 // 들꽃 마을 — 베니 가족과 촌장 이야기
 s1_1:{talk:'숲으로 도망간 양들이 괴물한테 잡아먹힐까 걱정이야... 우리 어머니(방앗간 도라)도 밤새 잠을 못 주무셔.',done:[['농부 베니','양들이 돌아왔어! 어머니가 꼭 인사하고 싶대. 방앗간에 들러 줘.']],after:'양들이 이제 숲 근처엔 안 가. 고마워!'},
 s1_4:{req:'s1_1',talk:'우리 베니 양을 찾아 줬다며? 고마워서 어쩌나. 그런데 겨울이 오는데 손주들 털옷 지을 가죽이 모자라...',done:[['방앗간 할머니 도라','이걸로 손주들 털옷을 지을 수 있겠어. 그런데 손녀 리아가 늑대 사냥을 혼자 가겠다고 고집이야. 좀 말려 주게.']],after:'털옷이 아주 따뜻해. 고맙네.'},
 s1_2:{req:'s1_4',talk:'할머니가 말리라고 했지? 소용없어. 양을 물어 간 건 늑대 소굴 정예 놈들이야. 같이 잡으면 우리 집 가보를 줄게.',done:[['사냥꾼 리아','같이 싸워 보니 알겠다. 넌 믿을 만해. 촌장님께 너를 추천해 둘게.']],after:'다음 사냥도 같이 가자!'},
 s1_5:{req:'s1_2',talk:'리아가 그대를 추천하더군. 야영지 산적 두목 때문에 마을 장이 못 서고 있네. 쫓아내 주면 마을 깃발을 하나 내어 주지.',done:[['촌장 오스윈','들꽃 마을은 그대에게 빚을 졌네. 루루가 그대에게 줄 게 있다며 기다리고 있어.']],after:'장이 다시 서니 마을이 살아나는군.'},
 s1_3:{req:'s1_5',talk:'촌장 할아버지가 그러는데 맹약단 집결지가 너무 삭막하대요! 고마운 마음으로 꽃을 심어 드리고 싶어요!',done:[['꽃집 아이 루루','우와, 집결지가 꽃밭이 됐어요! 들꽃 마을 사람들 모두 맹약단을 사랑해요!']],after:'꽃에 물 주는 거 잊지 마세요!'},
 // 회색바위 — 토비와 엘라의 결혼 이야기
 s2_2:{talk:'나, 갱도가 무서워서 들어갈 수가 없어... 그런데 다음 달에 엘라랑 결혼하려면 돈을 벌어야 해. 갱도 괴물 좀 쫓아 줘.',done:[['광부 토비','다시 갱도에 들어갈 수 있어! 누나(대장장이 한나)한테 네 얘기 했더니 일을 맡기고 싶대.']],after:'엘라한테 청혼할 용기가 생겼어!'},
 s2_1:{req:'s2_2',talk:'동생 토비를 구해 줬다며. 고맙다. 그 녀석 결혼 선물로 좋은 칼 한 자루 벼려 주고 싶은데, 철이 모자라.',done:[['대장장이 한나','좋은 철이야. 그런데 그 고블린 놈들이 토비 곡괭이를 훔쳐 갔다더군. 감독관 브론한테 가 봐.']],after:'칼이 잘 나왔어. 토비가 좋아하겠지.'},
 s2_4:{req:'s2_1',talk:'한나가 보냈나? 고블린 놈들이 곡괭이를 몽땅 훔쳐 가! 토비 녀석 아버지 유품 곡괭이까지. 대장을 잡아 줘.',done:[['광산 감독관 브론','곡괭이를 되찾았다! 토비 녀석 울더군. 엘라가 결혼식 등불을 만들고 싶다던데.']],after:'갱도 일이 다시 순조롭다.'},
 s2_5:{req:'s2_4',talk:'토비 아버지 곡괭이를 찾아 주셨다고요... 결혼식 날 꺼지지 않는 수정 등불을 밝히고 싶어요. 마력 수정이 필요해요.',done:[['수정 세공사 엘라','등불이 완성됐어요! 결혼식에 꼭 와 주세요. 목수 바드 아저씨가 축하 선물을 준비한대요.']],after:'토비랑 저, 행복하게 살게요.'},
 s2_3:{req:'s2_5',talk:'토비 결혼식 하객들이 맹약단 이야기만 하더군. 집결지를 키우면 내가 결혼 기념 풍차를 하나 올려 주지.',done:[['목수 바드','풍차가 돈다! 토비와 엘라도 와서 보고 갔다. 회색바위는 맹약단을 잊지 않을 거야.']],after:'풍차가 잘 돌지? 내 솜씨야.'},
 // 푸른물결 항구 — 해적 블랙솔트의 과거와 펠 영감의 속죄
 s3_4:{talk:'창고에 밀수꾼들이 들끓어. 짐을 못 내리겠어. 그런데 놈들, 옛날 블랙솔트 해적단 문신을 하고 있더라고.',done:[['부두 감독 마르코','블랙솔트 문신... 그걸 아는 사람은 늙은 펠 영감뿐이야. 한번 물어봐.']],after:'부두가 조용해졌어. 고마워.'},
 s3_2:{req:'s3_4',talk:'...블랙솔트. 나는 그 배의 일등항해사였네. 선장 코트 안주머니에 내가 숨긴 편지가 있어. 그걸 찾아 주게.',done:[['늙은 선원 펠','편지가 그대로 있군... 딸 마린에게 보내지 못한 편지라네. 그 애한테 직접 전해 줄 용기가 없어.']],after:'바다는 사람을 용서하지 않지만, 딸은 다를지도.'},
 s3_1:{req:'s3_2',talk:'아버지 편지를 가져왔다고요? ...아버지가 해적이었다니. 생각할 시간이 필요해요. 그동안 보물 상자에서 진주를 찾아 줄래요?',done:[['진주 상인 마린','편지를 읽었어요. 아버지를 용서해 보려고요. 등대 할머니가 우리 둘을 화해시키고 싶대요.']],after:'아버지랑 요즘 같이 저녁을 먹어요.'},
 s3_5:{req:'s3_1',talk:'마린과 펠을 이어 줬다며? 고맙구먼. 진주를 등대 렌즈에 박으면 빛이 더 멀리 간다우. 그 빛으로 바다에서 길 잃은 배들을 집에 보내고 싶어.',done:[['등대지기 소피','등대가 다시 밝게 빛나. 그런데 학자 이브가 펠의 편지에 이상한 문양이 있다고 하더라.']],after:'등대 불빛이 동방까지 닿는대.'},
 s3_3:{req:'s3_5',talk:'펠 씨 편지 끝에 그려진 문양... 고대 유적의 봉인 문양이에요! 블랙솔트가 유적에서 무언가를 훔쳤던 거예요. 유적 지하통로를 조사해 주세요.',done:[['학자 이브','유적의 봉인은 비어 있었어요. 누군가 심연의 조각을 가져갔어요... 발테르 공작의 문장이 찍힌 상자 흔적이 있어요.']],after:'심연의 조각에 대해 계속 조사할게요.'},
 // 황성 — 재무관의 의심과 황녀의 신뢰
 s4_5:{talk:'하수도 괴물 때문에 금고 지하실이 위험하오. 그런데 이상하오. 금고의 금이 조금씩 사라지고 있소.',done:[['왕실 재무관 헤르만','하수로에서 금괴가 나왔소! 누군가 몰래 빼돌린 거요. 근위대장 로웰에게 보고하겠소.']],after:'금고가 안전해졌소. 고맙소.'},
 s4_2:{req:'s4_5',talk:'재무관 보고를 들었소. 빼돌린 금이 타락한 기사단 요새로 흘러갔소. 그곳엔 내 옛 동료들이... 그들을 쉬게 해 주시오.',done:[['근위대장 로웰','요새의 기사들이 발테르의 금으로 매수당했었군. 이 사실을 황녀님께 알려야겠소.']],after:'옛 동료들이 이제 편히 쉬겠지.'},
 s4_4:{req:'s4_2',talk:'로웰 대장이 다 말해 줬어요. 아버지 신하들이 배신을 했다니... 저는 믿을 수 있는 큰 용병단이 필요해요. 열두 명은 넘어야 해요!',done:[['황녀 세레나','이렇게 든든한 용병단이라니! 엘리제가 맹약단을 위한 연회를 열고 싶대요.']],after:'맹약단만 있으면 무섭지 않아요.'},
 s4_1:{req:'s4_4',talk:'황녀님의 부탁이에요. 맹약단 집결지에서 연회를 열고 싶은데, 귀족들을 부르려면 품격 있게 꾸며야 해요.',done:[['귀족 영애 엘리제','귀족들이 감탄했어요! 시인 안톤이 맹약단의 노래를 짓고 싶대요. 그런데 용 이야기가 있어야 한다나요.']],after:'연회는 대성공이었어요.'},
 s4_3:{req:'s4_1',talk:'연회에서 맹약단 이야기를 들었소! 하지만 진짜 전설에는 용이 있어야지. 용의 둥지 주인을 쓰러뜨린 이야기를 노래로 남기고 싶소!',done:[['떠돌이 시인 안톤','「철혈의 깃발, 용의 날개를 꺾다」... 이 노래는 서방 모든 술집에서 불릴 것이오!']],after:'내 노래, 들어 봤소? 히트작이오.'},
 // 은빛잎 숲마을 — 세계수를 지키는 엘프들
 s5_1:{done:[['숲지기 장로 엘라리온','버섯왕이 쓰러졌소. 인간에게 감사하는 날이 올 줄이야. 궁수 대장 시엔이 그대를 시험하고 싶다 하오.']],after:'세계수가 조금 생기를 되찾았소.'},
 s5_2:{done:[['궁수 대장 시엔','이슬이 돌아왔어요. 무녀 루미님이 세계수 뿌리에서 이상한 기운을 느꼈대요.']],after:'다음엔 활쏘기 시합을 해요.'},
 s5_3:{done:[['세계수의 무녀 루미','뿌리가 다시 숨을 쉬어요. 핀이 축제에 쓸 요정 가루를 만들고 싶대요. 도와줄래요?']],after:'세계수가 당신 이름을 기억해요.'},
 s5_4:{req:'s5_3',talk:'세계수가 살아났으니 축제를 열어야죠! 나비 날개 가루로 요정 가루를 만들어요. 열 장만 구해 줄래요?',done:[['요정 가루 상인 핀','축제 날 밤, 숲 전체가 반짝일 거예요. 인간 손님은 당신이 처음이에요!']],after:'축제 정말 예뻤죠?'},
 // 불칼 요새도시 — 대장장이 길드와 요새의 자존심
 s6_1:{done:[['대장장이 길드장 브란','정령왕이 꺼졌다! 이제 광석이 다시 나온다. 사령관 이그나가 너를 보자더군.']],after:'네 칼은 언제든 내가 손봐 주지.'},
 s6_2:{done:[['요새 사령관 이그나','감옥 요새를 되찾았다. 그런데 반란군 수감자 중에 분화구가 깨어난다고 떠드는 노학자가 있더군. 오르라는 자다.']],after:'요새 경비가 단단해졌다.'},
 s6_3:{done:[['늙은 화산 학자 오르','분화구가 잠들었어! 아무도 내 말을 안 믿었는데... 고맙네. 세공사 미라가 이 일을 기념하고 싶다더군.']],after:'화산은 당분간 조용할 거야.'},
 s6_4:{req:'s6_3',talk:'분화구를 잠재운 영웅이라고요? 그 이야기를 새긴 검은 강철 등불을 만들고 싶어요. 재료를 구해 주세요.',done:[['흑요석 세공사 미라','완성! 이 등불은 요새 정문에 걸어 둘게요. 불칼 요새의 자존심이에요.']],after:'등불이 밤새 꺼지지 않아요.'},
 // 모래바람 오아시스 — 상단과 오아시스를 지키는 사람들
 s7_1:{done:[['상단장 카심','길이 뚫렸소! 점성술사 라일라가 별에서 불길한 것을 보았다 하오.']],after:'상단이 다시 다닌다오.'},
 s7_2:{done:[['점성술사 라일라','망령들이 잠들었어요. 그런데 별이 또 말해요... 오아시스 물이 마르고 있다고. 하산에게 가 보세요.']],after:'당신 별은 오늘도 밝아요.'},
 s7_3:{done:[['오아시스 수호자 하산','물이 다시 솟는다! 자라가 오아시스 축제에 쓸 진주를 찾고 있소.']],after:'오아시스는 사막의 심장이오.'},
 s7_4:{req:'s7_3',talk:'오아시스가 살아났으니 축제를 해야죠! 술탄궁에 바칠 진주 장식을 만들 거예요. 모래 달팽이 껍데기 속 진주가 필요해요.',done:[['사막 장미 상인 자라','술탄께서 기뻐하셨어요! 맹약단 이름이 술탄궁 연회에서 불렸답니다.']],after:'사막 장미 한 송이 드릴게요.'},
 // 단풍골 — 할머니와 손녀, 그리고 아르칸이 머물던 마을
 s9_1:{done:[['촌장 할머니 순이','호박밭이 살았구먼유! 사냥꾼 도윤이가 대숲 짐승 가죽으로 마을 겨울 준비를 한대유.']],after:'호박죽 한 그릇 먹고 가유.'},
 s9_2:{req:'s9_1',n:'대숲의 겨울 준비',type:'trophy',tro:'t_hide',count:8,goal:'짐승 가죽 8장 모으기 (귀환 시 판매 전에 확인)',reward:{gold:640000,item:'elix_agi'},talk:'할매 말 들었슈. 겨울 오기 전에 마을 사람들 덮을 가죽이 모자라유. 대숲 짐승 가죽 좀 구해 줘유.',done:[['사냥꾼 도윤','이걸로 마을 겨울은 끄떡없슈. 주막 막순이가 할 이야기가 있다던디유.']],after:'다음엔 같이 사냥 가유.'},
 s9_3:{done:[['주막 주인 막순','단풍주가 잘 익었어요. ...아르칸 그 양반, 떠나기 전날 밤 이 술을 마시며 "내 아이가 언젠가 올 거요"라고 했죠. 그게 당신이었군요. 순이 할매 손녀 단비가 당신을 찾아요.']],after:'단풍주 한 잔 따라 드릴게요.'},
 s9_4:{town:'t9',npc:'할매 손녀 단비',spr:'nj:child',req:'s9_3',n:'잃어버린 혼수함',type:'chest',count:6,goal:'던전 보물 상자 6개 열기',reward:{gold:560000,decor:'lantern'},talk:'할매 혼수함을 도깨비들이 숨겨 버렸어요... 할매가 시집올 때 가져온 거래요. 상자를 뒤지다 보면 나올지도 몰라요!',done:[['할매 손녀 단비','찾았다! 할매가 울었어요. 안에 할매랑 할아버지 젊을 때 그림이 있었어요. 고마워요, 언니 오빠!']],after:'할매가 요즘 매일 웃어요.'},
 // 서리꽃 산사 — 수행자들
 s8_1:{done:[['산사 주지 겐신','순례자들이 다시 올라오오. 아야메 사범이 그대 검을 시험하고 싶어 하오.']],after:'마음이 맑아 보이오.'},
 s8_2:{done:[['검술 사범 아야메','...인정하지. 서방의 검에도 도가 있다. 유키 무녀가 봉우리의 원한을 걱정하고 있다.']],after:'언제든 다시 겨루자.'},
 s8_3:{done:[['눈의 무녀 유키','쇼군이 드디어 잠들었어요. 털옷 장인 노리가 수행승 아이들 걱정을 하고 있어요.']],after:'봉우리의 눈이 부드러워졌어요.'},
 s8_4:{req:'s8_3',talk:'봉우리가 조용해지니 동자승들이 밖에서 놀아요. 설곰 가죽으로 아이들 털옷을 지어 주고 싶어요.',done:[['털옷 장인 노리','아이들이 털옷 입고 눈사람을 만들어요. 그 눈사람 이름이 당신 이름이에요.']],after:'따뜻하지요? 산사의 겨울은 길어요.'}
};
for(const k in SUB_STORY){if(SUBS[k])Object.assign(SUBS[k],SUB_STORY[k]);else SUBS[k]=SUB_STORY[k];}
// 마을 의뢰 순서 재배치 (NPC 자리 순서 = 이야기 순서)
{const ord={t1:['s1_1','s1_4','s1_2','s1_5','s1_3'],t2:['s2_2','s2_1','s2_4','s2_5','s2_3'],t3:['s3_4','s3_2','s3_1','s3_5','s3_3'],t4:['s4_5','s4_2','s4_4','s4_1','s4_3']};
 const cp=Object.assign({},SUBS);for(const k in SUBS)delete SUBS[k];const done=new Set();
 for(const tk of ['t1','t2','t3','t4','t5','t6','t7','t9','t8']){const ks=ord[tk]||Object.keys(cp).filter(k=>cp[k].town===tk).sort();for(const k of ks){SUBS[k]=cp[k];done.add(k);}}
 for(const k in cp)if(!done.has(k))SUBS[k]=cp[k];}

// ===== 대륙 의뢰: 대륙의 모든 마을을 잇는 큰 이야기 (전달·토벌·수집) =====
// type: deliver(to 마을의 toNpc에게 전달) / kill / clear / elite / trophy
const CQ={
 west:{n:'잿빛 균열',d:'서방 곳곳의 땅이 잿빛으로 시든다. 마을과 마을을 이어 원인을 쫓아라.',steps:[
  {town:'t1',npc:'약초꾼 해롤드',spr:'villagerman',rank:'F',n:'시드는 숲',type:'kill',d:'d_forest',count:15,goal:'속삭이는 숲길에서 적 15마리 처치',talk:[['약초꾼 해롤드','숲 가장자리 풀이 잿빛으로 시들고 있네. 괴물들도 사나워졌어. 우선 숲길의 괴물을 줄여 주게.']],done:[['약초꾼 해롤드','괴물 몸에서 잿빛 가루가 나왔군... 이건 내가 알 수 있는 게 아니야.']],reward:{gold:900}},
  {town:'t1',npc:'약초꾼 해롤드',spr:'villagerman',rank:'F',n:'잿빛 가루 전달',type:'deliver',to:'t2',toNpc:'광산 의사 마틸다',toSpr:'villagerwoman',goal:'잿빛 가루 봉투를 회색바위 광산의 의사 마틸다에게 전달',talk:[['약초꾼 해롤드','회색바위 광산에 광물 독을 잘 아는 의사 마틸다가 있네. 이 가루를 전해 주게.']],done:[['광산 의사 마틸다','이 가루... 요즘 광부들 기침 원인하고 똑같아요! 갱도 깊은 곳에서 퍼지는 거예요.']],reward:{gold:1500,item:'potion'}},
  {town:'t2',npc:'광산 의사 마틸다',spr:'villagerwoman',rank:'E',n:'잿빛 기침',type:'kill',d:'d_mine',count:30,goal:'폐쇄된 제1갱도에서 적 30마리 처치',talk:[['광산 의사 마틸다','갱도 괴물들이 잿빛 결정을 몸에 달고 다녀요. 괴물을 쓰러뜨려 결정을 모아 주세요.']],done:[['광산 의사 마틸다','이 결정, 자연에서 생긴 게 아니에요. 바다 밑 유적 쪽 기운과 닮았대요.']],reward:{gold:5000,item:'elix_str'}},
  {town:'t2',npc:'광산 의사 마틸다',spr:'villagerwoman',rank:'E',n:'결정 전달',type:'deliver',to:'t3',toNpc:'해양 학자 노아',toSpr:'villagerman',goal:'잿빛 결정을 푸른물결 항구의 해양 학자 노아에게 전달',talk:[['광산 의사 마틸다','항구의 학자 노아가 바다 유적을 연구해요. 결정을 가져가 보여 주세요.']],done:[['해양 학자 노아','틀림없어. 가라앉은 신전에서 나오는 기운이야. 신전 밑에 뭔가 갈라진 게 있어.']],reward:{gold:6000}},
  {town:'t3',npc:'해양 학자 노아',spr:'villagerman',rank:'D',n:'바다 밑의 틈',type:'clear',d:'d_temple',count:1,goal:'가라앉은 신전 보스 처치',talk:[['해양 학자 노아','신전 깊은 곳 보스가 균열을 지키고 있어. 쓰러뜨리면 균열을 볼 수 있을 거야.']],done:[['해양 학자 노아','균열이었어! 심연의 균열. 이게 서방 곳곳에 퍼지고 있다면... 엘프들은 알고 있을지도 몰라.']],reward:{gold:16000,item:'elix_int'}},
  {town:'t3',npc:'해양 학자 노아',spr:'villagerman',rank:'D',n:'학자의 보고서',type:'deliver',to:'t5',toNpc:'정령사 아엘',toSpr:'villagerwoman',goal:'균열 보고서를 은빛잎 숲마을의 정령사 아엘에게 전달',talk:[['해양 학자 노아','엘프 정령사 아엘에게 이 보고서를 전해 줘. 엘프는 천 년 전 균열을 기억할 거야.']],done:[['정령사 아엘','...이 기운, 기억하오. 천 년 전 맹약이 막았던 그것이오. 세계수 뿌리에도 번지고 있소.']],reward:{gold:18000}},
  {town:'t5',npc:'정령사 아엘',spr:'villagerwoman',rank:'D',n:'뿌리의 잿빛',type:'kill',d:'d_elfroot',count:40,goal:'시든 세계수 뿌리에서 적 40마리 처치',talk:[['정령사 아엘','뿌리를 갉는 것들을 없애 주시오. 그 사이 나는 균열을 막을 결계 수액을 모으겠소.']],done:[['정령사 아엘','세계수 수액이오. 이것을 강철과 함께 벼리면 균열을 막는 결계석이 되오. 불칼 요새의 대장장이들만 할 수 있소.']],reward:{gold:45000,item:'elix_agi'}},
  {town:'t5',npc:'정령사 아엘',spr:'villagerwoman',rank:'D',n:'세계수 수액 전달',type:'deliver',to:'t6',toNpc:'요새 기술자 콜트',toSpr:'worker',goal:'세계수 수액을 불칼 요새도시의 기술자 콜트에게 전달',talk:[['정령사 아엘','엘프가 드워프 대장장이에게 부탁을 하다니... 세상이 바뀌는구려. 이것을 전해 주시오.']],done:[['요새 기술자 콜트','엘프 수액이라고? 허! 좋다. 결계석을 벼려 주지. 대신 재료가 많이 든다!']],reward:{gold:50000}},
  {town:'t6',npc:'요새 기술자 콜트',spr:'worker',rank:'C',n:'결계석 재료',type:'trophy',tro:'t_steel',count:12,goal:'검은 강철 조각 12개 모으기 (귀환 시 판매 전에 확인)',talk:[['요새 기술자 콜트','결계석 틀은 검은 강철로만 버틴다. 흑요석 야수 몸에서 나오는 그거 말이야.']],done:[['요새 기술자 콜트','완성이다! 결계석 다섯 개. 이건 황성의 대마법사 오렐리아만 다룰 수 있어.']],reward:{gold:150000,item:'elix_str'}},
  {town:'t6',npc:'요새 기술자 콜트',spr:'worker',rank:'C',n:'결계석 호송',type:'deliver',to:'t4',toNpc:'대마법사 오렐리아',toSpr:'noblewoman',goal:'결계석을 황성의 대마법사 오렐리아에게 전달',talk:[['요새 기술자 콜트','무거우니 조심해! 황성까지 안전하게 전해 줘.']],done:[['대마법사 오렐리아','결계석이군요. 서방의 모든 마을이 힘을 모았어요. 마지막 균열은 타락한 기사단 요새 지하에 있어요.']],reward:{gold:160000}},
  {town:'t4',npc:'대마법사 오렐리아',spr:'noblewoman',rank:'B',n:'균열 봉인',type:'clear',d:'d_fort',count:1,goal:'타락한 기사단 요새 보스 처치 (결계석 설치)',talk:[['대마법사 오렐리아','요새 보스를 쓰러뜨리면 제가 결계석을 박아 균열을 닫겠어요. 서방의 운명이 달렸어요.']],done:[['대마법사 오렐리아','균열이 닫혔어요! 서방의 땅이 다시 푸르게 돌아올 거예요.'],['나레이션','들꽃 마을부터 황성까지, 서방의 모든 마을이 맹약단의 이름을 부른다. (서방 대륙 의뢰 완료)']],reward:{gold:400000,item:'elix_cha',decor:'statue'}}]},
 east:{n:'흔들리는 봉인',d:'동방 대륙에 모래폭풍과 요괴가 들끓는다. 사막·단풍골·산사를 이어 봉인을 다시 세워라.',steps:[
  {town:'t7',npc:'술탄의 대신 자파르',spr:'nj:noble',rank:'C',n:'멈추지 않는 모래폭풍',type:'kill',d:'d_dune',count:40,goal:'끝없는 모래 언덕에서 적 40마리 처치',talk:[['술탄의 대신 자파르','서방의 용사여, 모래폭풍이 그치지 않소. 폭풍 속 괴물들을 줄여 주면 원인을 찾을 수 있을 것이오.']],done:[['술탄의 대신 자파르','폭풍의 눈에서 부적 조각이 나왔소. 이 문양은 단풍골 쪽 것이오.']],reward:{gold:520000}},
  {town:'t7',npc:'술탄의 대신 자파르',spr:'nj:noble',rank:'C',n:'술탄의 친서',type:'deliver',to:'t9',toNpc:'훈장 선비 윤호',toSpr:'nj:oldman',goal:'술탄의 친서를 단풍골의 훈장 선비 윤호에게 전달',talk:[['술탄의 대신 자파르','단풍골의 학자 윤호에게 술탄의 친서와 부적 조각을 전해 주시오.']],done:[['훈장 선비 윤호','허, 술탄께서 친서를... 이 부적은 대숲 요괴들이 봉인을 갉을 때 떨어뜨리는 것이오.']],reward:{gold:560000,item:'hipotion'}},
  {town:'t9',npc:'훈장 선비 윤호',spr:'nj:oldman',rank:'C',n:'대숲 요괴 토벌',type:'elite',d:'d_maple',count:3,goal:'단풍 대숲에서 정예 3회 처치',talk:[['훈장 선비 윤호','대숲의 우두머리 요괴들이 부적을 모으고 있소. 정예를 쓰러뜨려 부적을 되찾아 주시오.']],done:[['훈장 선비 윤호','부적을 다시 이으니 봉인 서약서가 되었소. 이것은 산사 주지께 가야 하오.']],reward:{gold:640000,item:'elix_int'}},
  {town:'t9',npc:'훈장 선비 윤호',spr:'nj:oldman',rank:'C',n:'봉인 서약서',type:'deliver',to:'t8',toNpc:'산사 사범 하쿠',toSpr:'nj:samurai',goal:'봉인 서약서를 서리꽃 산사의 사범 하쿠에게 전달',talk:[['훈장 선비 윤호','산사로 가는 길은 험하오. 서약서를 젖지 않게 품에 넣어 가시오.']],done:[['산사 사범 하쿠','서약서군. 그러나 고개의 눈보라 요괴들이 봉인 의식을 방해하고 있소.']],reward:{gold:700000}},
  {town:'t8',npc:'산사 사범 하쿠',spr:'nj:samurai',rank:'B',n:'의식의 길',type:'kill',d:'d_snowpass',count:50,goal:'눈보라 고개에서 적 50마리 처치',talk:[['산사 사범 하쿠','의식이 끝날 때까지 고개를 지켜 주시오.']],done:[['산사 사범 하쿠','의식이 끝났소. 봉인의 마지막 고리는 사막 오아시스 아래에 있소. 술탄궁에 알려 주시오.']],reward:{gold:1000000,item:'elix_str'}},
  {town:'t8',npc:'산사 사범 하쿠',spr:'nj:samurai',rank:'B',n:'산사의 답신',type:'deliver',to:'t7',toNpc:'술탄의 대신 자파르',toSpr:'nj:noble',goal:'산사의 답신을 모래바람 오아시스의 대신 자파르에게 전달',talk:[['산사 사범 하쿠','이 답신을 사막의 대신에게. 동방 세 마을이 한마음이 되었다고 전해 주시오.']],done:[['술탄의 대신 자파르','산사와 단풍골이 함께라니! 마지막 고리, 오아시스 지하로 가 주시오.']],reward:{gold:1000000}},
  {town:'t7',npc:'술탄의 대신 자파르',spr:'nj:noble',rank:'B',n:'오아시스 아래의 고리',type:'clear',d:'d_oasisdeep',count:1,goal:'오아시스 지하 수로의 두꺼비 군주 처치',talk:[['술탄의 대신 자파르','두꺼비 군주가 마지막 고리를 삼키고 있소. 그것을 되찾으면 봉인이 완성되오.']],done:[['술탄의 대신 자파르','봉인이 다시 섰소! 모래폭풍이 그쳤소!'],['나레이션','사막과 단풍골, 산사의 사람들이 같은 노래를 부른다. (동방 대륙 의뢰 완료)']],reward:{gold:2000000,item:'elix_cha',decor:'statue'}}]}};

// ===== 메인: 단풍골 연결 (피라미드 → 단풍골 → 서방 인가) =====
{const i=MAIN.findIndex(m=>m.id==='m4_11');const m11=MAIN[i];
 const g=m11.done.pop();// 가렛의 "서방 인가" 대사는 단풍골 뒤로
 MAIN.splice(i+1,0,
  {id:'m4_12',ch:4,n:'붉은 망토의 행방',type:'talk',at:'t9:guild',goal:'동방 「단풍골」 의뢰소에서 아르칸의 흔적 찾기',
   talk:[['촌장 할머니 순이','붉은 망토 기사 말이여? 알지유. 피라미드에서 다 죽어 가는 몸으로 우리 마을에 왔었슈. 한 달을 묵었지유.'],['촌장 할머니 순이','떠나면서 지도 한 장을 주막에 맡겼는디... 대숲 텐구 놈이 그걸 훔쳐 가 버렸슈.'],['옛 부관 가렛','단장님 지도... 설산으로 가는 길이 적혀 있을 겁니다.']]},
  {id:'m4_13',ch:4,n:'텐구가 훔친 지도',type:'clear',d:'d_maple',goal:'단풍 대숲의 「붉은 단풍 텐구」 처치',
   done:[['나레이션','텐구의 둥지에서 낡은 지도가 나왔다. 뒷면에 칼끝으로 쓴 글이 있었다.'],['지도 뒷면 — 아르칸','「내 아이에게. 네가 깃발을 들었다면, 천년설 봉우리로 와라. 하지만 먼저 서방에서 이름을 되찾아라.」'],g]});}

return {I,RANKS,PROMO,RANK_COLOR,TIER,priceRef,GRADES,POTENTIAL,wageOf,JOBS,JOB_KEYS,LCLASS,PASSIVE,SKILLS,PERS,PERS_KEYS,LINES,JOB_LINES,GRADE_LINES,
  ORES,NAMES_M,NAMES_F,SURN,MON,BOSS,TROPHY,TOWNS,DUNG,THEME,EXAMS,WB,WPN,ARMS,ACCS,RARITY,UNIQUE,CONSUM,CAMP_TIERS,BUILDS,DECOR,TOWN_TALK,MAIN,SUBS,DAILY,HUMAN_LOOK,HAIRS,HAIR_COLORS,CAMP_VISITOR,TYPE_TALK,TOWN_FOLK,WVAR,WMAT,GVAR,AFFIX_PRE,AFFIX_SUF,SETS,BOOKS,FOLK_MORE,GUARD_MORE,MERCH_MORE,CONT_TALK,CQ};
})();
