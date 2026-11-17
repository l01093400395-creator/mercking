/* ==========================================================
   용병왕의 길 — 확장 데이터 (v2.0)
   성격 효과 · 시너지(인연) · 네임드 용병 · 파견 임무
   ========================================================== */
(function(D){
/* ---------- 성격 효과: st=능력치 배율(%), add=더하기, wage=급여 배율, gold=파티 금화 보너스 ---------- */
const PM={
  brave:{st:{atk:.06,def:-.04},fx:'공격 +6% · 방어 -4%'},
  cold:{add:{crit:4},fx:'치명 +4'},
  cheer:{st:{hp:.05},heal:1,fx:'체력 +5% · 부상 회복 1일 빠름'},
  greedy:{wage:1.1,gold:.05,fx:'파티 금화 +5% · 급여 +10%'},
  coward:{st:{spd:-.08},add:{eva:5},coward:1,fx:'적이 가장 나중에 노림 · 속도 -8% · 회피 +5'},
  loyal:{st:{def:.05},wage:.95,fx:'방어 +5% · 급여 -5%'}
};
for(const k in PM)if(D.PERS[k])Object.assign(D.PERS[k],PM[k]);

/* ---------- 시너지(인연): 출전 용병(단장 제외)의 직업·성격 수로 단계 결정 ---------- */
// th: 단계별 필요 인원, eff: 1단계 효과(단계만큼 곱함). st=배율, add=더하기, gold=금화 보너스
const SYN=[
  {id:'s_wall',n:'철벽 진형',ic:'🛡',job:'guard',th:[2,4,6],eff:{st:{def:.06}},d:'방패병 {n}명 → 전원 방어 +{def}%'},
  {id:'s_blade',n:'선봉대',ic:'⚔',job:'warrior',th:[2,4,6],eff:{st:{atk:.05}},d:'검사 {n}명 → 전원 공격 +{atk}%'},
  {id:'s_hawk',n:'매의 눈',ic:'🏹',job:'archer',th:[2,4,6],eff:{add:{crit:3}},d:'궁수 {n}명 → 전원 치명 +{crit}'},
  {id:'s_arcane',n:'마력 공명',ic:'✨',job:'mage',th:[2,4,6],eff:{st:{mag:.07}},d:'마법사 {n}명 → 전원 마력 +{mag}%'},
  {id:'s_choir',n:'성가대',ic:'🕊',job:'priest',th:[2,4,6],eff:{st:{hp:.05}},d:'성직자 {n}명 → 전원 체력 +{hp}%'},
  {id:'s_all',n:'균형 잡힌 부대',ic:'🌟',all:1,th:[5,10],eff:{st:{spd:.04,hp:.03}},d:'다섯 직업이 모두 {n}명 이상씩 → 속도 +{spd}% · 체력 +{hp}%'},
  {id:'s_fury',n:'피 끓는 전우',ic:'🔥',pers:'brave',th:[3,6],eff:{st:{atk:.04}},d:'호전적 {n}명 → 전원 공격 +{atk}%'},
  {id:'s_calm',n:'냉정한 지휘',ic:'❄',pers:'cold',th:[3,6],eff:{add:{crit:2},st:{def:.02}},d:'냉철함 {n}명 → 치명 +{crit} · 방어 +{def}%'},
  {id:'s_joy',n:'웃음꽃',ic:'🌼',pers:'cheer',th:[3,6],eff:{st:{hp:.04}},d:'낙천적 {n}명 → 전원 체력 +{hp}%'},
  {id:'s_gold',n:'한탕주의',ic:'💰',pers:'greedy',th:[2,4],eff:{gold:.06},d:'탐욕스러움 {n}명 → 금화 +{gold}%'},
  {id:'s_hide',n:'겁쟁이 동맹',ic:'🐇',pers:'coward',th:[3,6],eff:{add:{eva:4}},d:'겁쟁이 {n}명 → 전원 회피 +{eva}'},
  {id:'s_oath',n:'의형제',ic:'🤝',pers:'loyal',th:[3,6],eff:{st:{def:.04},add:{crit:1}},d:'의리파 {n}명 → 방어 +{def}% · 치명 +{crit}'}
];

/* ---------- 네임드 용병: 고유 외형(머리·색·피부 고정 + 금빛 테두리) + 전용 패시브 ---------- */
// aura=출전 파티 전원에게, self=본인에게. 등장: 주점 고용 목록·경매장에 아주 낮은 확률(각 1명씩 한 번만)
const NAMED=[
  {id:'n_leonic',name:'붉은 사자 레오닉',job:'warrior',sex:'m',pers:'brave',look:{hair:'spikeyhair',hc:2,sk:1},minRank:2,
    pas:'사자의 포효',pd:'출전 파티 전원 공격 +6%',aura:{st:{atk:.06}},self:{st:{atk:.12,hp:.1}},line:'"사자는 등을 보이지 않는다. 따라와라!"'},
  {id:'n_elysia',name:'서리 마녀 엘리시아',job:'mage',sex:'f',pers:'cold',look:{hair:'longhair',hc:5,sk:0},minRank:2,
    pas:'만년설',pd:'본인 마력 +25% · 스킬 충전 빠름',self:{st:{mag:.25},add:{cdr:.15}},line:'"차갑다고? 그게 내 장점이야."'},
  {id:'n_godwin',name:'불사의 방패 고드윈',job:'guard',sex:'m',pers:'loyal',look:{hair:'shorthair',hc:6,sk:2},minRank:2,
    pas:'불굴',pd:'전투마다 한 번 쓰러져도 체력 40%로 일어남 · 방어 +20%',self:{st:{def:.2,hp:.15}},undying:1,line:'"내가 서 있는 한, 아무도 못 지나간다."'},
  {id:'n_ciel',name:'바람의 궁수 시엘',job:'archer',sex:'f',pers:'cheer',look:{hair:'curlyhair',hc:4,sk:0},minRank:3,
    pas:'질풍',pd:'본인 속도 +20% · 치명 +12',self:{st:{spd:.2},add:{crit:12}},line:'"바람보다 빨리, 화살보다 정확히!"'},
  {id:'n_lumie',name:'성녀 루미에',job:'priest',sex:'f',pers:'loyal',look:{hair:'bowlhair',hc:3,sk:0},minRank:3,
    pas:'성녀의 가호',pd:'출전 파티 전원 체력 +8%',aura:{st:{hp:.08}},self:{st:{mag:.15}},line:'"상처는 제가 맡을게요. 앞만 보세요."'},
  {id:'n_kage',name:'그림자 칼날 카게',job:'warrior',sex:'m',pers:'cold',look:{hair:'mophair',hc:0,sk:3},minRank:3,
    pas:'그림자 걸음',pd:'본인 회피 +15 · 치명 +15',self:{add:{eva:15,crit:15}},line:'"…말은 필요 없다."'},
  {id:'n_baroque',name:'황금손 바로크',job:'guard',sex:'m',pers:'greedy',look:{hair:'curlyhair',hc:1,sk:1},minRank:2,
    pas:'미다스의 손',pd:'출전 파티 금화 +15% (급여도 비쌈)',gold:.15,self:{st:{def:.1}},line:'"금화 소리가 들리는군. 어디로 가면 되지?"'},
  {id:'n_bern',name:'노장 베른',job:'guard',sex:'m',pers:'loyal',look:{hair:'shorthair',hc:6,sk:1},minRank:4,
    pas:'백전노장',pd:'출전 파티 전원 방어 +6% · 치명 +3',aura:{st:{def:.06},add:{crit:3}},self:{st:{hp:.15}},line:'"전쟁이 서른 번째로군. 이번엔 이기는 쪽에 섰으면 좋겠어."'}
];

/* ---------- 파견 임무 (집결지 의뢰 게시판): 대기 용병을 보내면 며칠 뒤 보상 ---------- */
// lv: 최소 평균 레벨, n: 보낼 인원, days: 걸리는 날, exp: 1인당 경험치(레벨 비례 배율), gold: 등급 수입 배율, ore: 광석
const DISPATCH=[
  {id:'x_mine',n:'광산 채굴 지원',ic:'⛏',lv:5,n2:2,days:3,exp:.6,gold:.25,ore:{iron:[3,6],silver:[0,2]},d:'근처 광산 일꾼들을 돕고 광석을 나눠 받는다'},
  {id:'x_escort',n:'상단 호위',ic:'🐴',lv:10,n2:3,days:4,exp:.8,gold:.6,d:'대륙을 오가는 상단을 지킨다. 금화가 짭짤하다'},
  {id:'x_hunt',n:'마을 주변 마수 사냥',ic:'🐺',lv:15,n2:2,days:2,exp:1.1,gold:.3,d:'경험치 위주. 다치지는 않는다'},
  {id:'x_silver',n:'은광 갱도 정비',ic:'⚪',lv:22,n2:3,days:4,exp:.7,gold:.3,ore:{silver:[3,6],iron:[2,4]},d:'무너진 갱도를 손보고 은광석을 받는다'},
  {id:'x_train',n:'왕국군 교관 파견',ic:'🎖',lv:28,n2:2,days:5,exp:1.6,gold:.4,d:'신병을 가르치며 스스로도 단련한다'},
  {id:'x_obsid',n:'화산 흑요석 운반',ic:'🌋',lv:36,n2:4,days:5,exp:.9,gold:.5,ore:{obsid:[2,5],silver:[2,4]},d:'화산 광산에서 흑요석을 실어 나른다'},
  {id:'x_border',n:'국경 요새 수비',ic:'🏰',lv:42,n2:5,days:6,exp:1.3,gold:1.1,d:'요새를 지키며 큰 보수를 받는다'}
];


/* ---------- 식재료 ---------- */
// src: farm(밭 채집) forage(숲 채집) fish(낚시) drop(전투 전리품) shop(식재료 상점)
const INGR={
  cabbage:{n:'양배추',e:'🥬',src:'farm',p:40},pumpkin:{n:'호박',e:'🎃',src:'farm',p:60},wheat:{n:'밀',e:'🌾',src:'farm',p:30},carrot:{n:'당근',e:'🥕',src:'farm',p:35},
  mushroom:{n:'붉은 버섯',e:'🍄',src:'forage',p:50},bluemush:{n:'푸른 버섯',e:'🔵',src:'forage',p:90},
  fish:{n:'생선',e:'🐟',src:'fish',p:70},beast:{n:'마수 고기',e:'🍖',src:'drop',p:120},
  meat:{n:'고기',e:'🥩',src:'shop',p:90},milk:{n:'우유',e:'🥛',src:'shop',p:45},rice:{n:'쌀',e:'🍚',src:'shop',p:40},honey:{n:'꿀',e:'🍯',src:'shop',p:110},
  spice:{n:'향신료',e:'🧂',src:'shop',p:150},chili:{n:'사막 고추',e:'🌶',src:'shop',p:120},herb:{n:'숲 약초',e:'🌿',src:'shop',p:100},firepep:{n:'화염 고추',e:'🔥',src:'shop',p:220}
};
const FARM_CROPS=['cabbage','pumpkin','wheat','carrot'];
/* ---------- 요리법: 연회 1회 = 다음 던전 탐험 1회 동안 출정 파티 전원 버프 ---------- */
// how: start(처음부터) shop(그 마을 식재료 상점) hidden(첫 대화·서랍 탐색)
const RECIPES={
  bread:{n:'갓 구운 밀빵',e:'🍞',need:{wheat:3},buf:{st:{hp:.04}},how:'start'},
  stew:{n:'채소 스튜',e:'🍲',need:{cabbage:2,carrot:2},buf:{st:{hp:.06,def:.03}},how:'start'},
  pumpkinpie:{n:'호박 파이',e:'🥧',need:{pumpkin:2,wheat:1,milk:1},buf:{st:{hp:.05,def:.05}},how:'shop',towns:['t1','t4']},
  mushskew:{n:'버섯 꼬치구이',e:'🍢',need:{mushroom:3,meat:1},buf:{st:{atk:.07}},how:'shop',towns:['t1','t2','t5']},
  minerstew:{n:'광부의 고기 찜',e:'🍖',need:{meat:2,carrot:1,bluemush:1},buf:{st:{hp:.08,atk:.03}},how:'shop',towns:['t2']},
  fishgrill:{n:'항구식 생선 구이',e:'🐟',need:{fish:2,herb:1},buf:{add:{crit:4},st:{spd:.03}},how:'shop',towns:['t3','t4']},
  seafood:{n:'해물 냄비',e:'🦐',need:{fish:3,rice:1,spice:1},buf:{st:{hp:.07,mag:.05}},how:'shop',towns:['t3']},
  royalfeast:{n:'황실 만찬',e:'👑',need:{meat:2,fish:1,wheat:1,honey:1,spice:1},buf:{st:{atk:.06,mag:.06,hp:.06}},how:'shop',towns:['t4']},
  elfsalad:{n:'숲의 정령 샐러드',e:'🥗',need:{herb:2,cabbage:1,honey:1},buf:{st:{spd:.05},add:{eva:3}},how:'shop',towns:['t5']},
  firesoup:{n:'화염 내성 수프',e:'🌋',need:{firepep:1,bluemush:1,meat:1},buf:{st:{def:.08,hp:.04}},how:'shop',towns:['t6']},
  curry:{n:'사막 매운 카레',e:'🍛',need:{chili:2,rice:1,meat:1},buf:{st:{atk:.09}},how:'shop',towns:['t7']},
  snowbroth:{n:'설원 곰탕',e:'🥣',need:{meat:2,rice:1},buf:{st:{hp:.1}},how:'shop',towns:['t8']},
  maplecake:{n:'단풍 꿀떡',e:'🍡',need:{rice:2,honey:1},buf:{st:{mag:.08},add:{cdr:.05}},how:'shop',towns:['t9']},
  grandma:{n:'할머니의 비법 수프',e:'🫕',need:{cabbage:1,mushroom:1,milk:1},buf:{st:{hp:.08,def:.04}},how:'hidden'},
  beastroast:{n:'마수 통구이',e:'🍗',need:{beast:2,spice:1},buf:{st:{atk:.1,hp:.03}},how:'hidden'},
  luckypie:{n:'행운의 파이',e:'🍀',need:{pumpkin:1,honey:1,wheat:1},buf:{gold:.12},how:'hidden'},
  hunterjerky:{n:'사냥꾼 육포',e:'🥓',need:{beast:1,chili:1},buf:{add:{crit:6}},how:'hidden'}
};
/* ---------- 도면 (전문 대장간): 광석+금화로 특산 장비 제작 ---------- */
// cls=무기 종류(없으면 방어구/장신구), rar=희귀도, bonus=추가 능력치(레벨 비례 배율), how/towns는 요리법과 같음
const BLUEPRINTS={
  bp_iron:{n:'튼튼한 철검',slot:'wpn',cls:'sword',rar:1,ore:{iron:6},bonus:{def:.15},how:'shop',towns:['t1','t2']},
  bp_pick:{n:'광부의 전투 도끼',slot:'wpn',cls:'axe',rar:2,ore:{iron:8,silver:2},bonus:{hp:.2},how:'shop',towns:['t2']},
  bp_harpoon:{n:'선원의 갈고리 단검',slot:'wpn',cls:'dagger',rar:2,ore:{iron:6,silver:3},bonus:{crit:.2},how:'shop',towns:['t3']},
  bp_knight:{n:'근위 기사검',slot:'wpn',cls:'sword',rar:3,ore:{silver:6,iron:6},bonus:{atk:.12},how:'shop',towns:['t4']},
  bp_aegis:{n:'근위 대방패',slot:'off',rar:3,ore:{silver:5,iron:8},bonus:{def:.2},how:'shop',towns:['t4']},
  bp_scepter:{n:'궁정 마법사의 홀',slot:'wpn',cls:'staff',rar:3,ore:{silver:6},bonus:{mag:.12},how:'shop',towns:['t4']},
  bp_elfbow:{n:'은빛잎 장궁',slot:'wpn',cls:'bow',rar:3,ore:{silver:5},bonus:{spd:.15,crit:.1},how:'shop',towns:['t5']},
  bp_obsid:{n:'흑요석 대도끼',slot:'wpn',cls:'axe',rar:3,ore:{obsid:4,iron:6},bonus:{atk:.18},how:'shop',towns:['t6']},
  bp_obsblade:{n:'흑요석 마검',slot:'wpn',cls:'sword',rar:4,ore:{obsid:6,flame:1},bonus:{atk:.15,crit:.15},how:'shop',towns:['t6']},
  bp_scimitar:{n:'모래바람 시미터',slot:'wpn',cls:'sword',rar:3,ore:{silver:4,iron:6},bonus:{spd:.15,crit:.15},how:'shop',towns:['t7']},
  bp_dune:{n:'사막 유목민 단검',slot:'wpn',cls:'dagger',rar:3,ore:{silver:5},bonus:{eva:.2},how:'shop',towns:['t7']},
  bp_frost:{n:'서리꽃 지팡이',slot:'wpn',cls:'staff',rar:3,ore:{silver:6,obsid:1},bonus:{mag:.15},how:'shop',towns:['t8']},
  bp_fur:{n:'설원 모피 갑옷',slot:'arm',rar:3,ore:{silver:4,iron:8},bonus:{hp:.25},how:'shop',towns:['t8']},
  bp_katana:{n:'단풍 카타나',slot:'wpn',cls:'sword',rar:3,ore:{silver:6,iron:4},bonus:{crit:.25},how:'shop',towns:['t9']},
  bp_monk:{n:'산사 수도승의 둔기',slot:'wpn',cls:'mace',rar:3,ore:{silver:5,iron:6},bonus:{hp:.15,def:.1},how:'shop',towns:['t8','t9']},
  bp_relic:{n:'고대 왕의 반지',slot:'acc1',rar:4,ore:{silver:6,obsid:3},bonus:{atk:.1,mag:.1},how:'hidden'},
  bp_ghost:{n:'망령의 낫단검',slot:'wpn',cls:'dagger',rar:4,ore:{obsid:4,silver:4},bonus:{crit:.25,atk:.1},how:'hidden'},
  bp_saint:{n:'성녀의 철퇴',slot:'wpn',cls:'mace',rar:4,ore:{silver:8,flame:1},bonus:{mag:.15,hp:.1},how:'hidden'}
};
// 마을별 식재료 상점 품목 (대도시는 더 많음)
const GROCER={t1:['milk','meat','rice'],t2:['meat','milk','rice','spice'],t3:['rice','spice','herb','meat'],t4:['meat','milk','rice','honey','spice','herb','chili'],
  t5:['herb','honey','milk'],t6:['firepep','meat','spice','rice'],t7:['chili','rice','spice','meat','honey'],t8:['meat','rice','milk','honey'],t9:['rice','honey','herb','meat','milk']};
// 숨겨진 요리법·도면 — 마을 첫 대화(촌장·노인) 또는 민가 서랍·책장에서
const HIDDEN={t1:['grandma'],t2:['hunterjerky'],t3:['bp_ghost'],t4:['bp_relic'],t5:['luckypie'],t6:['beastroast'],t7:['hunterjerky'],t8:['bp_saint'],t9:['luckypie']};
/* ---------- 라이벌 용병단 ---------- */
const RIVAL={name:'검은 늑대단',boss:'단장 바르가스',
  lines:{auction:['"이 물건은 검은 늑대단이 가져가지."','"값을 올리지. 우리 단장님 취향이거든."','"풋내기들은 뒤로 빠져."'],
    snatch:['"아까 검은 늑대단이 와서 제일 좋은 용병을 데려갔수다. 금화를 아낌없이 뿌리더군."','"늑대단 놈들이 한발 빨랐어요. 영웅급 하나를 웃돈 주고 채 갔죠."'],
    rumor:['"검은 늑대단 소식 들었나? 또 던전 하나를 털었다더군."','"바르가스 단장은 돈이면 다 된다고 믿는 자야. 조심하게."','"늑대단이랑 맹약단 중 누가 먼저 S등급이 될지 내기가 붙었다네."']}};

/* ---------- 밤: 밤에만 나오는 사람·소문 ---------- */
const NIGHT={
  npcs:[{name:'야경꾼',mf:'worker',lines:['"밤엔 혼자 다니지 마시오. 요즘 그림자 같은 게 돌아다닌다니까."','"등불이 꺼진 골목엔 들어가지 마시게."','"맹약단이군. 오늘 밤은 조용하길 빌지."']},
    {name:'수상한 행상인',mf:'nobleman',lines:['"쉿… 밤에만 파는 물건이 있소. 지금은 매진이지만."','"비밀 경매? 매달 20일 즈음, 황성 아니면 항구 뒷골목이오."','"찢어진 지도 조각을 모으는 자들이 있다더군. 네 조각이면 보물이 나온대."']},
    {name:'별 보는 노인',mf:'oldman',lines:['"오늘 밤 별자리를 보니, 큰 축제가 머지않았구먼."','"달이 밝은 밤엔 숲의 버섯이 더 잘 자란다오."','"심연의 탑… 엔딩 너머에 끝없는 계단이 있다는 전설을 아나?"']}],
  rumor:['"밤에 주점 뒷골목에서 검은 늑대단 녀석들이 밀담을 나누더군."','"달밤에 고양이에게 생선을 주면 다음 날 은혜를 갚는다는 말이 있지."','"야경꾼 말로는 밤마다 서랍 뒤지는 도둑이 있대. 설마 자네는 아니겠지?"','"보물 지도의 ✕ 표시는 꼭 마을 안에 있다더군. 땅을 파 보라고."','"밤에만 핀다는 푸른 버섯은 값이 꽤 나가지."','"축제 전날 밤엔 다들 들떠서 잠을 안 자요."']};
/* ---------- 동물 교감 (동방 대륙·엘프 숲만: 닌자 에셋 사용 규칙) ---------- */
const PETS={t5:[['cat','숲고양이 루루']],t7:[['dog','오아시스 개 바크']],t8:[['cat','산사 고양이 하얀이']],t9:[['dog','단풍골 누렁이'],['cat','찻집 고양이 모찌']]};
/* ---------- 마을 축제: 달(0 새싹 1 햇살 2 수확 3 서리), 날짜 범위. 며칠 전부터 주민이 힌트 ---------- */
const FESTIVALS={
  t1:{n:'들꽃 축제',m:0,d:[12,14],hint:['"곧 들꽃 축제예요! 새싹달 12일부터 꽃길이 열려요."','"축제 때 쓸 꽃 화관을 엮고 있어요. 며칠 안 남았거든요."'],talk:'"들꽃 축제에 온 걸 환영해요! 이건 마을이 드리는 선물이에요."'},
  t2:{n:'광부의 불꽃제',m:2,d:[5,7],hint:['"수확달 초에 불꽃제가 열리지. 광부들이 1년 중 유일하게 곡괭이를 내려놓는 날이야."','"올해 불꽃제엔 은광석 캐기 대회도 한대."'],talk:'"불꽃제다! 맹약단도 한 잔 하고 가게. 선물로 광석 좀 챙겨 가."'},
  t3:{n:'바다의 날',m:1,d:[18,20],hint:['"햇살달 18일은 바다의 날이야. 어부들이 첫 그물을 나눠 주지."','"바다의 날이 다가오니 항구가 들썩들썩해."'],talk:'"바다의 날 축하하오! 오늘 잡은 생선 좀 가져가시오."'},
  t4:{n:'황제 탄신제',m:3,d:[1,3],hint:['"서리달 첫날은 황제 폐하 탄신제요. 황성이 금빛으로 물들지."','"탄신제 준비로 기사단이 바쁘네. 며칠 안 남았거든."'],talk:'"황제 폐하 만세! 탄신제 기념으로 황실이 하사하는 금화요."'},
  t5:{n:'달빛 정령제',m:1,d:[28,30],hint:['"햇살달 말에 달빛 정령제가 있어요. 정령들이 숲을 밝히죠."','"정령제가 머지않았어요. 버섯이 벌써 빛나기 시작했거든요."'],talk:'"달빛 정령제에 온 인간이라니, 귀한 손님이네요. 숲의 선물을 받아요."'},
  t6:{n:'불의 축제',m:2,d:[22,24],hint:['"수확달 22일 불의 축제! 화산에 감사하는 날이지."','"불의 축제 땐 흑요석을 나눠 준대. 놓치지 마."'],talk:'"불의 축제에 잘 왔소! 화산의 선물, 흑요석이오."'},
  t7:{n:'오아시스 대시장',m:0,d:[25,27],hint:['"새싹달 말엔 오아시스 대시장이 서요. 낙타 상단이 몰려오죠."','"대시장 때 향신료가 반값이라니까요. 며칠만 기다려요."'],talk:'"대시장에 온 걸 환영해요! 귀한 향신료 맛보기 드려요."'},
  t8:{n:'서리꽃 등불제',m:3,d:[15,17],hint:['"서리달 15일 밤, 산사에 등불 천 개가 켜져요."','"등불제가 다가오네요. 스님들이 등을 접느라 바빠요."'],talk:'"서리꽃 등불제에 오셨군요. 소원 등과 함께 공양 음식을 드립니다."'},
  t9:{n:'단풍 축제',m:2,d:[12,14],hint:['"수확달 12일부터 단풍 축제! 골짜기가 온통 붉게 물들어."','"단풍 축제 떡 빚을 쌀을 모으고 있어. 곧이야, 곧."'],talk:'"단풍 축제다! 축제 떡이랑 꿀 좀 가져가."'}
};
/* ---------- 보물 지도 · 유물 (집결지 전시 = 파티 영구 버프, 최대 3개) ---------- */
const RELICS=[
  {id:'r_crown',n:'잊힌 왕의 왕관',e:'👑',buf:{st:{hp:.05}},d:'출정 파티 체력 +5%'},
  {id:'r_banner',n:'초대 맹약단 깃발',e:'🚩',buf:{st:{atk:.04}},d:'출정 파티 공격 +4%'},
  {id:'r_orb',n:'정령의 수정구',e:'🔮',buf:{st:{mag:.05}},d:'출정 파티 마력 +5%'},
  {id:'r_shield',n:'거인의 방패 조각',e:'🛡',buf:{st:{def:.05}},d:'출정 파티 방어 +5%'},
  {id:'r_boot',n:'바람 장인의 장화',e:'👢',buf:{st:{spd:.04}},d:'출정 파티 속도 +4%'},
  {id:'r_eye',n:'용의 눈 보석',e:'💎',buf:{add:{crit:3}},d:'출정 파티 치명 +3'},
  {id:'r_coin',n:'황금 고대 주화',e:'🪙',buf:{gold:.08},d:'금화 +8%'},
  {id:'r_mask',n:'그림자 가면',e:'🎭',buf:{add:{eva:3}},d:'출정 파티 회피 +3'}
];
/* ---------- 심연의 탑 (엔딩 후 무한 웨이브) ---------- */
const TOWER={pool:['d_abyss','d_shrine','d_peak','d_lavafort'],bossEvery:5};

Object.assign(D,{SYN,NAMED,DISPATCH,INGR,FARM_CROPS,RECIPES,BLUEPRINTS,GROCER,HIDDEN,RIVAL,NIGHT,PETS,FESTIVALS,RELICS,TOWER});
})(window.GD);
