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
  F:{fame:250, exam:'exam_f', next:'E'},
  E:{fame:900, exam:'exam_e', next:'D'},
  D:{fame:2600,exam:'exam_d', next:'C'},
  C:{fame:7500,exam:'exam_c', next:'B'},
  B:{fame:16000,exam:'exam_b',next:'A'},
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
  t2:{n:'회색바위 광산촌',tag:'광산 마을',tier:2,req:'E',goodRank:'D',size:2,roof:7,desc:'광부와 목수가 일하는 낙후된 산업 마을',
    dung:['d_mine','d_goblin','d_crystal'],shopLv:[10,20],extra:['smith']},
  t3:{n:'푸른물결 항구',tag:'항구 도시',tier:3,req:'D',goodRank:'C',size:3,roof:1,desc:'바다와 상선이 오가는 화려한 무역·관광 도시',
    dung:['d_dock','d_wreck','d_temple'],shopLv:[20,32],extra:['smith','relic']},
  t4:{n:'황성 아우렐리아',tag:'황성 / 수도',tier:4,req:'C',goodRank:'B',size:4,roof:4,desc:'메인 길드와 왕실이 있는 초대형 대도시',
    dung:['d_sewer','d_waste','d_fort'],shopLv:[32,45],extra:['smith','relic','hq','arena','classhall']}
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
  scarecrow:{n:'허수아비',pt:15,price:[0,2600,11000,42000],tier:2,ic:I(1,12),spr:'scarecrow'},
  windmill:{n:'풍차',pt:40,price:[0,9000,30000,100000],tier:2,ic:I(1,15),spr:'windmill',big:true},
  statue:{n:'영웅 석상',pt:35,price:[0,0,26000,90000],tier:3,ic:I(2,5),spr:'statue'},
  banner:{n:'용병단 깃발',pt:25,price:[0,0,16000,60000],tier:3,ic:I(2,10),spr:'banner'},
  well:{n:'돌 우물',pt:25,price:[0,0,15000,55000],tier:3,ic:I(7,10),spr:'well'}
};

/* ---------- 마을 NPC 대사 (태도 단계별) ---------- */
// 태도: 0 무시 / 1 보통 / 2 존중 / 3 전설
const TOWN_TALK={
  t1:{guard:[['어이, 용병이라고? 사고만 치지 마.'],['오늘도 순찰 수고하네, 단장.'],['마을 수호자님! 덕분에 밤길이 편해졌습니다.'],['전설의 단장님이 우리 마을 출신이라니, 자랑스럽습니다!']],
      folk:[['낯선 얼굴이네? 우리 마을은 조용한 곳이야.'],['산적 때문에 걱정이 많았는데, 와 줘서 고마워.'],['우리 마을의 수호자님이다! 사과 하나 드세요!'],['전설의 단장님! 사인 한 장만요!']],
      merchant:[['외상은 안 돼. 현금만.'],['어서 와! 오늘 들어온 물건 좋아.'],['수호자님껜 특별히 깎아 드리지!'],['전설의 단장님께 물건을 팔다니, 영광입니다!']]},
  t2:{guard:[['풋내기는 광산에 짐만 된다. 돌아가.'],['흠... 실력은 좀 있나 보군.'],['갱도를 지켜 줘서 고맙소, 단장.'],['광산촌 전체가 단장님께 빚을 졌습니다!']],
      folk:[['또 떠돌이 용병인가. 곡괭이도 못 들 것 같은데.'],['고블린 얘기 들었어? 무서운 세상이야.'],['당신 덕에 다시 광산에 들어갈 수 있게 됐어!'],['전설의 단장님! 우리 광산촌의 영웅이시죠!']],
      merchant:[['풋내기한테 팔 물건은 비싸게 받는다.'],['돈만 있으면 손님이지.'],['단골 대우 해 드리지.'],['단장님 물건은 최상품으로만!']]},
  t3:{guard:[['부두 짐꾼이면 저쪽 하역장으로 가.'],['신분증은 확인했다. 지나가.'],['C등급 용병단이라... 해상 호위를 부탁할 만하군.'],['전설의 단장님! 항구가 안전한 건 단장님 덕분입니다!']],
      folk:[['여기는 관광객과 상인의 도시야. 흙먼지는 털고 다녀.'],['해적 얘기만 나오면 다들 쉬쉬하더라.'],['해적을 소탕했다는 그 용병단이에요?'],['전설의 단장님이다! 다들 길을 비켜!']],
      merchant:[['구경만 할 거면 나가 줄래?'],['좋은 물건은 비싼 법이지.'],['귀한 손님이 오셨네. 유물 보러 오셨수?'],['단장님을 위해 숨겨 둔 보물이 있습니다!']]},
  t4:{guard:[['촌구석 흙먼지 묻히지 마라. 하수구 쥐잡이나 하든가.'],['...용병 주제에 수도를 활보하는군.'],['정식 길드 인가 용병단이시군요. 실례했습니다.'],['전설의 단장님! 황성의 문은 언제나 열려 있습니다!']],
      folk:[['어머, 냄새. 시골에서 왔나 봐.'],['용병단이 수도에 자리 잡으려면 한참 걸릴걸?'],['그 투기장 우승자? 대단하다!'],['용병왕! 용병왕이다! 만세!']],
      merchant:[['우리 가게는 귀족 전용이야.'],['돈만 있다면야... 들어오시오.'],['B등급 용병단이라니, 우대해 드리죠.'],['용병왕 폐하... 아니, 단장님! 최고급으로 모시겠습니다!']]}
};

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
  {id:'m1_6',ch:1,n:'첫 승급',type:'exam',exam:'exam_f',goal:'명성 250 달성 후 의뢰소에서 F→E 승급 심사 통과',
    done:[['접수원 메이','축하해요! 이제 E등급이에요. 회색바위 광산촌으로 가는 길이 열렸어요.'],['나레이션','월드맵에 [회색바위 광산촌]이 열렸다.']]},
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
  {id:'m2_6',ch:2,n:'인정받는 자',type:'exam',exam:'exam_e',goal:'명성 900 달성 후 E→D 승급 심사 통과',
    done:[['길드장 볼드','D등급이라... 인정하지. 넌 풋내기가 아니다. 대장간도 마음껏 써라.'],['나레이션','월드맵에 [푸른물결 항구]가 열렸다.']]},
  {id:'m3_1',ch:3,n:'검은 파도',type:'talk',at:'t3:guild',goal:'항구 의뢰소에서 일감 받기',
    talk:[['항구 관리관 니나','D등급 용병단? 고급 의뢰는 C등급부터야. 지금은 부두 짐 나르기 정도만 줄 수 있어.'],['항구 관리관 니나','...아, 부두 창고에 밀수꾼이 판친다는데. 그거라도 할래?']]},
  {id:'m3_2',ch:3,n:'안개 속 창고',type:'clear',d:'d_dock',goal:'안개 낀 부두 창고의 「밀수단 두목 렉스」 처치',
    done:[['밀수단 두목 렉스','우린 심부름꾼일 뿐이야! 돈은 황성의 높으신 분이 대고... 해적선과 거래했지!'],['항구 관리관 니나','해적선 잔해 조사 의뢰를 특별히 열어 줄게. 집결지도 더 키워 둬.']]},
  {id:'m3_3',ch:3,n:'자치 영지',type:'camp',tier:3,goal:'집결지를 3단계 [자치 영지]로 승급'},
  {id:'m3_4',ch:3,n:'난파선의 괴물',type:'clear',d:'d_wreck',goal:'해적선 잔해의 「심해의 크라켄」 처치',
    done:[['옛 부관 가렛','해적선 금고의 장부... 발테르 공작의 문장이 찍혀 있습니다!'],['옛 부관 가렛','나머지 장부는 수몰된 신전으로 옮겨졌다고 적혀 있군요.']]},
  {id:'m3_5',ch:3,n:'수몰된 진실',type:'clear',d:'d_temple',goal:'수몰된 신전의 「수몰된 망령왕」 처치',
    done:[['나레이션','신전 제단 아래, 발테르 공작이 심연의 존재와 맺은 계약서가 있었다.'],['옛 부관 가렛','맹약단을 무너뜨린 것도 이 계약 때문이었군요... 황성으로 가야 합니다.']]},
  {id:'m3_6',ch:3,n:'항구의 인정',type:'exam',exam:'exam_d',goal:'명성 2,600 달성 후 D→C 승급 심사 통과',
    done:[['항구 관리관 니나','C등급 축하해! 이제 해상 호위·유적 의뢰도 맡길 수 있어. 유물 상점도 열어 줄게.'],['나레이션','월드맵에 [황성 아우렐리아]가 열렸다.']]},
  {id:'m4_1',ch:4,n:'무시당하는 이방인',type:'talk',at:'t4:guild',goal:'황성 의뢰소 방문',
    talk:[['황성 경비병','촌구석 흙먼지 묻히지 마라.'],['황성 의뢰소 직원','C등급? 메인 길드는 B등급부터 출입이에요. 지금 드릴 수 있는 건... 하수구 쥐잡기 정도네요.']]},
  {id:'m4_2',ch:4,n:'하수구 쥐잡기',type:'clear',d:'d_sewer',goal:'수도 지하 하수로의 「하수로의 쥐왕」 처치',
    done:[['황성 의뢰소 직원','...정말 해치웠네요? 추방자의 황무지 토벌도 맡겨 볼게요. 그리고 전직 시험장에도 가 보세요.']]},
  {id:'m4_3',ch:4,n:'추방자의 군주',type:'clear',d:'d_waste',goal:'추방자의 황무지의 「추방자 군주 고르마」 처치'},
  {id:'m4_4',ch:4,n:'용병왕의 성채',type:'camp',tier:4,goal:'집결지를 4단계 [용병왕의 성채]로 승급'},
  {id:'m4_5',ch:4,n:'왕실 투기장',type:'arena',goal:'왕실 투기장 3연전 우승',
    done:[['황제 레오나르트','훌륭하다! 그 깃발... 철혈 맹약단인가. 짐이 그대들을 오해했던 모양이군.'],['황제 레오나르트','타락한 기사단 요새를 토벌하라. 성공하면 정식 길드 인가를 내리겠다.']]},
  {id:'m4_6',ch:4,n:'대토벌전',type:'exam',exam:'exam_c',goal:'명성 7,500 달성 후 대토벌전(C→B) 승리',
    done:[['황제 레오나르트','정식 길드 인가를 내린다. 철혈 맹약단, 다시 일어서라.'],['나레이션','B등급! 메인 길드 출입과 황실 의뢰가 열렸다.']]},
  {id:'m5_1',ch:5,n:'심연의 그림자',type:'talk',at:'t4:hq',goal:'메인 길드에서 황실 의뢰 받기',
    talk:[['길드 마스터 아이언','발테르 공작이 사라졌다. 심연의 문을 열고 군대를 끌어들이고 있어.'],['길드 마스터 아이언','명성을 쌓아 A등급이 되면 심연 전초 돌파를 맡기겠다.']]},
  {id:'m5_2',ch:5,n:'심연 전초',type:'exam',exam:'exam_b',goal:'명성 16,000 달성 후 심연 전초 돌파 (B→A)',
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
  s4_3:{town:'t4',npc:'떠돌이 시인 안톤',n:'용의 노래',type:'clear',d:'d_nest',count:1,goal:'용의 둥지 보스 처치',reward:{gold:200000,uniq:'u_iron'},talk:'용을 쓰러뜨린 이야기를 노래로 남기고 싶소!'}
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

return {I,RANKS,PROMO,RANK_COLOR,TIER,priceRef,GRADES,POTENTIAL,wageOf,JOBS,JOB_KEYS,LCLASS,PASSIVE,SKILLS,PERS,PERS_KEYS,LINES,JOB_LINES,GRADE_LINES,
  NAMES_M,NAMES_F,SURN,MON,BOSS,TROPHY,TOWNS,DUNG,THEME,EXAMS,WB,WPN,ARMS,ACCS,RARITY,UNIQUE,CONSUM,CAMP_TIERS,BUILDS,DECOR,TOWN_TALK,MAIN,SUBS,DAILY,HUMAN_LOOK,HAIRS,HAIR_COLORS,CAMP_VISITOR};
})();
