(()=>{"use strict";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const APP_VERSION="3.0.0";
const SAVE_KEY="nerdora_chibi_raiders_v100";
const OLD_SAVE_KEY="nerdora_chibi_raiders_v090";

const HEROES=[
{id:"seraphina",name:"Seraphina",emoji:"👼",role:"Suporte",line:"back",style:"ranged",type:"magic",hp:1280,pa:70,ma:282,pd:96,md:168,sp:104,cr:.07,dg:.09,ult:{name:"Aurora Celestial",kind:"heal",ratio:1.45,effect:"shield"}},
{id:"espinho",name:"Espinho Rubro",emoji:"🌹",role:"Guerreiro",line:"front",style:"melee",type:"physical",hp:1610,pa:252,ma:82,pd:146,md:112,sp:98,cr:.13,dg:.07,ult:{name:"Jardim Carmesim",kind:"aoe",ratio:.76,effect:"bleed"}},
{id:"quebra",name:"Quebra-Muros",emoji:"🔨",role:"Tanque",line:"front",style:"melee",type:"physical",hp:2240,pa:195,ma:45,pd:218,md:144,sp:72,cr:.07,dg:.03,ult:{name:"Demolição Total",kind:"aoe",ratio:.70,effect:"break"}},
{id:"umbra",name:"Caçador Umbra",emoji:"🌑",role:"Assassino",line:"back",style:"ranged",type:"physical",hp:1110,pa:314,ma:86,pd:82,md:86,sp:134,cr:.22,dg:.16,ult:{name:"Execução do Eclipse",kind:"single",ratio:2.38,effect:"execute"}},
{id:"crepusculo",name:"Senhor do Crepúsculo",emoji:"🌘",role:"Mago",line:"back",style:"ranged",type:"magic",hp:1180,pa:68,ma:328,pd:78,md:142,sp:101,cr:.15,dg:.08,ult:{name:"Noite Sem Fim",kind:"aoe",ratio:.84,effect:"slow"}},
{id:"valquiria",name:"Valquíria de Gelo",emoji:"❄️",role:"Guerreira",line:"front",style:"melee",type:"physical",hp:1510,pa:244,ma:138,pd:136,md:124,sp:103,cr:.12,dg:.08,ult:{name:"Inverno Eterno",kind:"aoeMagic",ratio:.80,effect:"freeze"}},
{id:"relampago",name:"Lâmina Relâmpago",emoji:"⚡",role:"Assassina",line:"front",style:"melee",type:"physical",hp:1190,pa:306,ma:102,pd:92,md:84,sp:138,cr:.21,dg:.15,ult:{name:"Mil Cortes",kind:"multi",ratio:.62,hits:5}},
{id:"terra",name:"Guardião da Terra",emoji:"🛡️",role:"Tanque",line:"front",style:"melee",type:"physical",hp:2320,pa:184,ma:72,pd:226,md:160,sp:76,cr:.07,dg:.04,ult:{name:"Fortaleza Viva",kind:"aoe",ratio:.58,effect:"shield"}},
{id:"anao",name:"Canhoneiro Anão",emoji:"💣",role:"Atirador",line:"back",style:"ranged",type:"physical",hp:1240,pa:286,ma:70,pd:102,md:92,sp:91,cr:.17,dg:.07,ult:{name:"Bombardeio Real",kind:"aoe",ratio:.92,effect:"pierce"}},
{id:"fada",name:"Fada das Lâminas",emoji:"🧚",role:"Híbrida",line:"back",style:"ranged",type:"physical",hp:1130,pa:268,ma:172,pd:88,md:112,sp:129,cr:.18,dg:.18,ult:{name:"Tempestade Feérica",kind:"aoe",ratio:.72,effect:"haste"}}
];

const STAGES=[
{id:1,code:"1-1",name:"Portões do Vale",enemyLevel:1,scale:.58,power:"Muito fácil",rewards:{gold:600,exp:250,essence:2,diamonds:35,shards:1}},
{id:2,code:"1-2",name:"Trilha dos Goblins",enemyLevel:2,scale:.68,power:"Fácil",rewards:{gold:760,exp:320,essence:3,diamonds:45,shards:1}},
{id:3,code:"1-3",name:"Ruínas Rubras",enemyLevel:3,scale:.79,power:"Normal",rewards:{gold:940,exp:400,essence:4,diamonds:55,shards:2}},
{id:4,code:"1-4",name:"Ponte do Crepúsculo",enemyLevel:4,scale:.91,power:"Desafio",rewards:{gold:1160,exp:500,essence:5,diamonds:70,shards:2}},
{id:5,code:"1-5",name:"Guardião das Chamas",enemyLevel:5,scale:1.04,power:"Chefe",rewards:{gold:1500,exp:650,essence:8,diamonds:100,scrolls:1,shards:3}}
];

const GEAR={
steel_sword:{id:"steel_sword",name:"Espada de Aço",icon:"⚔️",slot:"weapon",rarity:"Comum",bonus:{pa:45}},
arcane_staff:{id:"arcane_staff",name:"Cajado Arcano",icon:"🪄",slot:"weapon",rarity:"Raro",bonus:{ma:58}},
storm_blade:{id:"storm_blade",name:"Lâmina da Tempestade",icon:"🗡️",slot:"weapon",rarity:"Épico",bonus:{pa:78,sp:3}},
iron_armor:{id:"iron_armor",name:"Armadura de Ferro",icon:"🥋",slot:"armor",rarity:"Comum",bonus:{pd:42,md:18}},
twilight_robe:{id:"twilight_robe",name:"Manto do Crepúsculo",icon:"🥻",slot:"armor",rarity:"Raro",bonus:{md:62,ma:24}},
guardian_plate:{id:"guardian_plate",name:"Placa do Guardião",icon:"🛡️",slot:"armor",rarity:"Épico",bonus:{pd:76,hp:180}},
guard_helm:{id:"guard_helm",name:"Elmo do Vale",icon:"🪖",slot:"helmet",rarity:"Comum",bonus:{hp:190,pd:18}},
ice_crown:{id:"ice_crown",name:"Coroa Glacial",icon:"👑",slot:"helmet",rarity:"Raro",bonus:{hp:270,md:32}},
moon_helm:{id:"moon_helm",name:"Elmo Lunar",icon:"🌙",slot:"helmet",rarity:"Épico",bonus:{hp:330,sp:4}},
lucky_charm:{id:"lucky_charm",name:"Amuleto da Sorte",icon:"🍀",slot:"accessory",rarity:"Comum",bonus:{pa:22,ma:22}},
nerdora_ring:{id:"nerdora_ring",name:"Anel Nerdora",icon:"💍",slot:"accessory",rarity:"Raro",bonus:{pa:36,ma:36}},
eclipse_orb:{id:"eclipse_orb",name:"Orbe do Eclipse",icon:"🔮",slot:"accessory",rarity:"Épico",bonus:{ma:54,sp:4}}
};
const SLOT_NAMES={weapon:"Arma",armor:"Armadura",helmet:"Elmo",accessory:"Acessório"};
const DROP_POOLS={
1:["steel_sword","iron_armor","guard_helm","lucky_charm"],
2:["steel_sword","arcane_staff","iron_armor","guard_helm","lucky_charm"],
3:["arcane_staff","twilight_robe","ice_crown","nerdora_ring","steel_sword"],
4:["storm_blade","twilight_robe","guardian_plate","ice_crown","nerdora_ring"],
5:["storm_blade","guardian_plate","moon_helm","eclipse_orb","ice_crown"]
};

const SHOP=[
{id:"potion_gold",icon:"🧪",name:"Poção de Treino",desc:"Use em um herói para subir 1 nível instantaneamente.",currency:"gold",price:450,type:"potion",qty:1},
{id:"sword_gold",icon:"⚔️",name:"Espada de Aço",desc:"+45 Ataque Físico.",currency:"gold",price:900,type:"gear",gear:"steel_sword"},
{id:"robe_arena",icon:"🥻",name:"Manto do Crepúsculo",desc:"+62 DEF Mágica e +24 ATQ Mágico.",currency:"arenaCoins",price:90,type:"gear",gear:"twilight_robe"},
{id:"ring_gold",icon:"💍",name:"Anel Nerdora",desc:"+36 ATQ Físico e +36 ATQ Mágico.",currency:"gold",price:1250,type:"gear",gear:"nerdora_ring"},
{id:"sera_shard",icon:"👼",name:"Fragmentos Seraphina ×10",desc:"Fragmentos para evolução futura.",currency:"arenaCoins",price:120,type:"shard",hero:"seraphina",qty:10},
{id:"light_shard",icon:"⚡",name:"Fragmentos Lâmina ×10",desc:"Fragmentos da Lâmina Relâmpago.",currency:"diamonds",price:160,type:"shard",hero:"relampago",qty:10},
{id:"scroll_arena",icon:"📜",name:"Pergaminho de Invocação",desc:"Uma invocação no Portal.",currency:"arenaCoins",price:150,type:"scroll",qty:1},
{id:"crown_diamond",icon:"👑",name:"Coroa Glacial",desc:"+270 HP e +32 DEF Mágica.",currency:"diamonds",price:220,type:"gear",gear:"ice_crown"}
];


const DAILY_MISSIONS=[
 {id:"arena3",icon:"🏟️",title:"Glória na Arena",desc:"Vença 3 batalhas na Arena hoje.",key:"arenaWins",target:3,reward:{gold:800,diamonds:100,contribution:40}},
 {id:"summon1",icon:"🔮",title:"Chamado do Portal",desc:"Faça pelo menos 1 invocação no Portal.",key:"summons",target:1,reward:{gold:400,diamonds:60,contribution:20}},
 {id:"level1",icon:"⬆️",title:"Treino Diário",desc:"Suba o nível de 1 herói.",key:"levelUps",target:1,reward:{gold:500,diamonds:40,contribution:20}},
 {id:"campaign2",icon:"🗺️",title:"Avanço do Capítulo",desc:"Vença 2 batalhas da Campanha.",key:"campaignWins",target:2,reward:{gold:600,diamonds:50,contribution:30}}
];

const ACHIEVEMENTS=[
 {id:"first_blood",icon:"⚔️",title:"Primeiros Passos",desc:"Conclua sua primeira batalha.",key:"battles",target:1,reward:{gold:500,diamonds:50}},
 {id:"veteran10",icon:"🛡️",title:"Veterano",desc:"Conclua 10 batalhas.",key:"battles",target:10,reward:{gold:1200,diamonds:100}},
 {id:"summoner10",icon:"🔮",title:"Invocador",desc:"Realize 10 invocações.",key:"summons",target:10,reward:{gold:900,diamonds:150}},
 {id:"trainer5",icon:"📈",title:"Treinador",desc:"Faça 5 melhorias de nível.",key:"levelUps",target:5,reward:{gold:1000,diamonds:100}},
 {id:"hero10",icon:"🌟",title:"Herói Experiente",desc:"Tenha um herói no nível 10.",key:"maxHeroLevel",target:10,reward:{gold:1500,diamonds:180}},
 {id:"arena1200",icon:"🏆",title:"Desafiante da Arena",desc:"Alcance 1200 de Rating.",key:"arenaRating",target:1200,reward:{gold:1500,diamonds:200}}
];



const HERO_AFFINITY={
 seraphina:{faction:"aurora",factionName:"Aurora",element:"Luz",icon:"☀️"},
 valquiria:{faction:"aurora",factionName:"Aurora",element:"Água",icon:"❄️"},
 terra:{faction:"aurora",factionName:"Aurora",element:"Terra",icon:"🌿"},
 anao:{faction:"aurora",factionName:"Aurora",element:"Fogo",icon:"🔥"},
 fada:{faction:"aurora",factionName:"Aurora",element:"Luz",icon:"✨"},
 espinho:{faction:"eclipse",factionName:"Eclipse",element:"Fogo",icon:"🔥"},
 quebra:{faction:"eclipse",factionName:"Eclipse",element:"Terra",icon:"🪨"},
 umbra:{faction:"eclipse",factionName:"Eclipse",element:"Trevas",icon:"🌑"},
 crepusculo:{faction:"eclipse",factionName:"Eclipse",element:"Trevas",icon:"🌘"},
 relampago:{faction:"eclipse",factionName:"Eclipse",element:"Fogo",icon:"⚡"}
};

const SYNERGY_RULES={
 3:{atk:.10,def:0,hp:0,crit:0,rage:0,label:"+10% ATQ"},
 4:{atk:.10,def:.10,hp:0,crit:0,rage:0,label:"+10% ATQ • +10% DEF"},
 5:{atk:.10,def:.10,hp:.20,crit:0,rage:0,label:"+10% ATQ • +10% DEF • +20% HP"}
};

const AWAKEN_MAX=5;
const AWAKEN_COSTS={
 0:{gold:2500,stones:3},1:{gold:4200,stones:5},2:{gold:6500,stones:8},3:{gold:9000,stones:12},4:{gold:13000,stones:18}
};
const AWAKEN_EFFECTS={
 seraphina:["Ultimate +8% potência","Aurora Celestial concede +10% ATQ à equipa","Bónus de ATQ sobe para +13%","Cura + escudo ganham potência adicional","Bónus de ATQ sobe para +18%"],
 quebra:["Ultimate +8% potência","Demolição Total atordoa 1 alvo","Atordoa até 2 inimigos","Quebra de DEF é ampliada","Atordoamento dura 2 ações no alvo principal"],
 espinho:["Ultimate +8% potência","Sangramento dura +1 rodada","Sangramento causa mais pressão","Ultimate ganha +12% crítico","Sangramento dura +2 rodadas"],
 umbra:["Ultimate +8% potência","Execução melhora contra alvos feridos","Limite de execução sobe para 45% HP","Recupera 25 Rage após Ultimate","Limite de execução sobe para 55% HP"],
 crepusculo:["Ultimate +8% potência","Noite Sem Fim drena 10 Rage","Lentidão é ampliada","Drena 20 Rage","Aplica lentidão reforçada em todos"],
 valquiria:["Ultimate +8% potência","Congela até 3 inimigos","Chance de congelamento reforçada","Ganha escudo próprio após Ultimate","Congela todos os inimigos vivos"],
 relampago:["Ultimate +8% potência","Mil Cortes ganha +1 golpe","Ganha +2 golpes no total","Recupera 20 Rage após Ultimate","Ganha +3 golpes no total"],
 terra:["Ultimate +8% potência","Fortaleza Viva cura 5% HP da equipa","Escudo da equipa é reforçado","Cura 8% HP","Escudo e cura atingem potência máxima"],
 anao:["Ultimate +8% potência","Bombardeio aplica Quebra de DEF","Quebra aumenta para 25%","Ganha +10% crítico na Ultimate","Quebra de DEF atinge 35%"],
 fada:["Ultimate +8% potência","Concede +15 Rage à equipa","Haste é reforçada","Concede +25 Rage","Haste + Rage atingem potência máxima"]
};

const AFK_CAP_MS=12*60*60*1000;
const AFK_RATES={goldPerMin:18,expPerMin:4,essencePerMin:.04};

const AUDIO_ASSETS={
 menu:"./audio/menu-theme.wav",
 battle:"./audio/battle-theme.wav",
 click:"./audio/ui-click.wav",
 impact:"./audio/impact.wav",
 ultimateReady:"./audio/ultimate-ready.wav",
 ultimate:"./audio/ultimate-cast.wav",
 reward:"./audio/reward.wav"
};

const CUTSCENES={
 stage5:[
  {hero:"seraphina",speaker:"Seraphina",text:"A presença adiante não pertence às criaturas comuns do vale. Todos, mantenham a formação."},
  {hero:"quebra",speaker:"Quebra-Muros",text:"Finalmente algo grande o bastante para testar o meu martelo. Eu abro caminho."},
  {hero:"crepusculo",speaker:"Senhor do Crepúsculo",text:"Não subestimem o fogo deste lugar. Há magia antiga misturada às chamas."},
  {hero:"seraphina",speaker:"Seraphina",text:"Então avançamos juntos. A vitória aqui abrirá o caminho para desafios muito maiores."}
 ],
 worldBoss:[
  {hero:"umbra",speaker:"Caçador Umbra",text:"O céu escureceu. Vorak voltou a despertar."},
  {hero:"seraphina",speaker:"Seraphina",text:"Não precisamos derrubá-lo de uma só vez. Cada golpe conta para toda a Guilda."},
  {hero:"quebra",speaker:"Quebra-Muros",text:"Ótimo. Quanto maior o monstro, mais fácil acertar."},
  {hero:"umbra",speaker:"Caçador Umbra",text:"Ataquem com tudo. Antes que o Vazio nos engula."}
 ]
};


const VIP_THRESHOLDS=[0,250,650,1200,2000,3000,4300,5900,7800,10000];
const BATTLE_PASS_TIERS=20;
const BATTLE_PASS_STEP=100;
const LIMITED_HERO_ID="seraphina";
const LIMITED_EVENT_END=Date.now()+7*24*60*60*1000;
const PETS=[
 {id:"drakko",name:"Drakko",emoji:"🐲",role:"Guardião de Rocha",unlock:"free",aura:"DEF Global",skill:"Escamas Ancestrais",desc:"Aumenta a Defesa de toda a equipa e cria escudos a cada 3 rodadas."},
 {id:"fenix",name:"Fênix Aurora",emoji:"🔥",role:"Guardião Celestial",unlock:"diamonds",price:900,aura:"ATQ + Cura",skill:"Renascimento Solar",desc:"Aumenta o Ataque da equipa e cura aliados a cada 3 rodadas."}
];
const CHAT_MESSAGES=[
 ["NekoBlade","invocou um herói 5★!","event"],["AstraBR","chegou ao Andar 38 da Torre.",""],
 ["KitsuneBR","procura membros para a Guilda Aurora Celeste.","guild"],["MagoPixel","causou 41.820 de dano em Vorak!","event"],
 ["YumiX","acabou de desbloquear a Fênix Aurora.",""],["DrakeZero","venceu 5 duelos seguidos na Arena.",""],
 ["LunaRaid","completou o Passe de Batalha Nv. 12.","event"],["AkiraGO","obteve Seraphina no banner limitado!","event"]
];

const STAR_COST={1:40,2:80,3:140,4:220};
const STAR_MULT={1:1,2:1.15,3:1.35,4:1.62,5:2.00};
const TOWER_MAX=50;
const WORLD_BOSS_MAX_HP=250000;
const BOSS_HERO={
 id:"vorak",name:"Vorak, Devorador do Vazio",emoji:"🐉",role:"Chefe Épico",line:"front",style:"melee",type:"physical",
 hp:WORLD_BOSS_MAX_HP,pa:1150,ma:920,pd:420,md:420,sp:82,cr:.12,dg:.02,
 ult:{name:"Cataclismo do Vazio",kind:"aoeMagic",ratio:.72,effect:"slow"}
};

const GUILDS=[
 {id:"violet",emblem:"🔮",name:"Ordem Violeta",motto:"Conhecimento antes da lâmina.",members:["NekoBlade","MagoPixel","LunaRaid","YumiX","RinArc"]},
 {id:"blades",emblem:"⚔️",name:"Lâminas do Vale",motto:"A vitória pertence aos que avançam.",members:["DrakeZero","KaitoBR","AkiraGO","RexNova","ShiroX"]},
 {id:"aurora",emblem:"✨",name:"Aurora Celeste",motto:"Nenhum aliado luta sozinho.",members:["KitsuneBR","MikaStar","SoraLux","AoiMoon","HanaGO"]}
];

const SLOTS=[
{id:"F1",line:"front",label:"Frente 1"},{id:"F2",line:"front",label:"Frente 2"},
{id:"B1",line:"back",label:"Trás 1"},{id:"B2",line:"back",label:"Trás 2"},{id:"B3",line:"back",label:"Trás 3"}
];
const POS={F1:{x:57,y:18},F2:{x:57,y:59},B1:{x:4,y:4},B2:{x:4,y:37},B3:{x:4,y:70}};

function todayKey(){const d=new Date(),p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())}
function blankEquipment(){return{weapon:null,armor:null,helmet:null,accessory:null}}
function defaultSave(){
 const heroLevels={},shards={},owned={},equipment={},stars={},awakening={};
 HEROES.forEach(h=>{heroLevels[h.id]=1;shards[h.id]=0;owned[h.id]=false;equipment[h.id]=blankEquipment();stars[h.id]=1;awakening[h.id]=0});
 ["quebra","valquiria","seraphina","umbra","crepusculo"].forEach(id=>owned[id]=true);
 return{
  gold:1500,diamonds:1200,scrolls:3,accountExp:0,essence:0,arenaCoins:0,arenaRating:1000,
  arenaDate:todayKey(),arenaAttempts:5,arenaDailyPoints:0,arenaDailyMax:5,
  missionDate:todayKey(),dailyCounters:{arenaWins:0,summons:0,levelUps:0,campaignWins:0},dailyClaimed:{},
  lifetime:{battles:0,arenaWins:0,campaignWins:0,summons:0,levelUps:0},achievementClaimed:{},
  guildId:null,guildContribution:0,guildAttack:0,guildDefense:0,guildHp:0,
  guildWarDate:todayKey(),guildWarAttempts:3,guildWarPoints:0,
  worldBossDate:todayKey(),worldBossAttempts:3,worldBossBest:0,worldBossLast:0,worldBossTotal:0,worldBossRemainingHp:WORLD_BOSS_MAX_HP,
  towerFloor:1,towerBest:0,abyssCrystals:0,awakeningStones:8,
  vipPoints:0,diamondsSpent:0,
  battlePassXp:0,battlePassPremium:false,battlePassFreeClaimed:{},battlePassPremiumClaimed:{},
  petsOwned:{drakko:true,fenix:false},petLevels:{drakko:1,fenix:1},petFeed:{drakko:0,fenix:0},activePet:"drakko",
  limitedEventEnd:Date.now()+7*24*60*60*1000,lastAfkClaim:Date.now(),audioMuted:false,storySeen:{},chatCollapsed:false,
  unlockedStage:1,selectedStage:1,heroLevels,shards,owned,equipment,stars,awakening,gearInventory:{},potions:0,
  formation:{F1:"quebra",F2:"valquiria",B1:"seraphina",B2:"umbra",B3:"crepusculo"}
 };
}
function normalizeSave(s){
 const d=defaultSave(),out={...d,...s};
 out.heroLevels={...d.heroLevels,...(s.heroLevels||{})};
 out.shards={...d.shards,...(s.shards||{})};
 out.owned={...d.owned,...(s.owned||{})};
 out.stars={...d.stars,...(s.stars||{})};
 out.awakening={...d.awakening,...(s.awakening||{})};
 out.storySeen={...(s.storySeen||{})};
 out.gearInventory={...(s.gearInventory||{})};
 out.equipment={};
 HEROES.forEach(h=>out.equipment[h.id]={...blankEquipment(),...((s.equipment||{})[h.id]||{})});
 out.formation={...d.formation,...(s.formation||{})};
 out.dailyCounters={...d.dailyCounters,...(s.dailyCounters||{})};
 out.dailyClaimed={...(s.dailyClaimed||{})};
 out.lifetime={...d.lifetime,...(s.lifetime||{})};
 out.achievementClaimed={...(s.achievementClaimed||{})};
 out.battlePassFreeClaimed={...(s.battlePassFreeClaimed||{})};
 out.battlePassPremiumClaimed={...(s.battlePassPremiumClaimed||{})};
 out.petsOwned={...d.petsOwned,...(s.petsOwned||{})};
 out.petLevels={...d.petLevels,...(s.petLevels||{})};
 out.petFeed={...d.petFeed,...(s.petFeed||{})};
 out.worldBossRemainingHp=clamp(Number(out.worldBossRemainingHp)||WORLD_BOSS_MAX_HP,0,WORLD_BOSS_MAX_HP);
 out.towerFloor=clamp(Number(out.towerFloor)||1,1,TOWER_MAX);
 out.towerBest=clamp(Number(out.towerBest)||0,0,TOWER_MAX);
 out.lastAfkClaim=Number(out.lastAfkClaim)||Date.now();
 out.awakeningStones=Number(out.awakeningStones)||0;
 out.vipPoints=Math.max(0,Number(out.vipPoints)||0);
 out.diamondsSpent=Math.max(0,Number(out.diamondsSpent)||0);out.limitedEventEnd=Number(out.limitedEventEnd)||Date.now()+7*24*60*60*1000;
 out.battlePassXp=Math.max(0,Number(out.battlePassXp)||0);
 out.guildWarAttempts=clamp(Number(out.guildWarAttempts)||0,0,3);
 out.guildWarPoints=Math.max(0,Number(out.guildWarPoints)||0);
 if(!PETS.some(p=>p.id===out.activePet)||!out.petsOwned[out.activePet])out.activePet="drakko";
 return out;
}
function loadSave(){
 try{
  const raw=localStorage.getItem(SAVE_KEY);
  if(raw)return normalizeSave(JSON.parse(raw));
  const oldRaw=localStorage.getItem(OLD_SAVE_KEY);
  if(oldRaw){
   const old=JSON.parse(oldRaw),m=defaultSave();
   ["gold","accountExp","essence","unlockedStage","selectedStage"].forEach(k=>{if(old[k]!=null)m[k]=old[k]});
   m.heroLevels={...m.heroLevels,...(old.heroLevels||{})};m.shards={...m.shards,...(old.shards||{})};m.formation={...m.formation,...(old.formation||{})};
   HEROES.forEach(h=>m.owned[h.id]=true);
   localStorage.setItem(SAVE_KEY,JSON.stringify(m));
   return m;
  }
 }catch(e){}
 return defaultSave();
}
let save=loadSave(),formation={...save.formation},activeSlot="F1",selectedHero="seraphina",selectedAwakeningHero="seraphina",selectedPet=save.activePet||"drakko",battle=null,deferred=null,reg=null,arenaOpponents=[],guildWarCastles=[],lastBattleMode="campaign",afkTicker=null,chatTimer=null,storyState=null;

function persist(){save.formation={...formation};localStorage.setItem(SAVE_KEY,JSON.stringify(save));renderResources();updateMissionIndicators()}
function hero(id){return HEROES.find(h=>h.id===id)}
function stage(id=save.selectedStage){return STAGES.find(s=>s.id===id)||STAGES[0]}
function used(){return Object.values(formation).filter(Boolean)}
function accountLevel(){return 1+Math.floor(save.accountExp/1000)}
function levelCost(id){const lv=save.heroLevels[id]||1;return 250+lv*180}
function gearBonus(id){
 const b={hp:0,pa:0,ma:0,pd:0,md:0,sp:0},eq=save.equipment[id]||{};
 Object.values(eq).filter(Boolean).forEach(gid=>{const g=GEAR[gid];if(g)Object.entries(g.bonus).forEach(([k,v])=>b[k]=(b[k]||0)+v)});
 return b;
}
function guildBonuses(){
 if(!save.guildId)return{atk:0,def:0,hp:0};
 return{atk:(save.guildAttack||0)*.01,def:(save.guildDefense||0)*.01,hp:(save.guildHp||0)*.015};
}
function guildBonuses(){
 if(!save.guildId)return{atk:0,def:0,hp:0};
 return{atk:(save.guildAttack||0)*.01,def:(save.guildDefense||0)*.01,hp:(save.guildHp||0)*.015};
}
function heroStats(h){
 const lv=save.heroLevels[h.id]||1,b=gearBonus(h.id),g=guildBonuses(),stars=clamp(save.stars[h.id]||1,1,5),sm=STAR_MULT[stars]||1;
 const hp=Math.round((Math.round(h.hp*(1+.08*(lv-1))*sm)+b.hp)*(1+g.hp));
 const pa=Math.round((Math.round(h.pa*(1+.07*(lv-1))*sm)+b.pa)*(1+g.atk));
 const ma=Math.round((Math.round(h.ma*(1+.07*(lv-1))*sm)+b.ma)*(1+g.atk));
 const pd=Math.round((Math.round(h.pd*(1+.045*(lv-1))*sm)+b.pd)*(1+g.def));
 const md=Math.round((Math.round(h.md*(1+.045*(lv-1))*sm)+b.md)*(1+g.def));
 return{level:lv,stars,hp,pa,ma,pd,md,sp:Math.round(h.sp*(1+.004*(lv-1)))+b.sp,cr:h.cr,dg:h.dg};
}
function addGear(id,qty=1){save.gearInventory[id]=(save.gearInventory[id]||0)+qty}
const SCREEN_ROUTES={
 lobby:{id:"homeScreen",nav:""},
 campanha:{id:"campaignScreen",nav:"",before:()=>renderCampaign()},
 formacao:{id:"formationScreen",nav:"synergy",before:()=>renderFormation()},
 sinergias:{id:"formationScreen",nav:"synergy",before:()=>renderFormation()},
 herois:{id:"heroesScreen",nav:"heroes",before:()=>renderHeroes()},
 equipamentos:{id:"heroesScreen",nav:"equipment",before:()=>renderHeroes()},
 portal:{id:"portalScreen",nav:"",before:()=>renderPortal()},
 arena:{id:"arenaScreen",nav:"",before:()=>renderArena()},
 loja:{id:"shopScreen",nav:"shop",before:()=>renderShop()},
 missoes:{id:"missionsScreen",nav:"missions",before:()=>renderMissions("daily")},
 guilda:{id:"guildScreen",nav:"",before:()=>renderGuild()},
 chefe:{id:"worldBossScreen",nav:"",before:()=>renderWorldBoss()},
 torre:{id:"towerScreen",nav:"",before:()=>renderTower()},
 afk:{id:"afkScreen",nav:"",before:()=>{startAfkTicker();renderAfk()}},
 despertar:{id:"awakeningScreen",nav:"",before:()=>renderAwakening()}
};
function routeFromScreenId(id){
 return Object.values(SCREEN_ROUTES).find(r=>r.id===id)||null;
}
function showScreen(nameOrId,options={}){
 const route=SCREEN_ROUTES[nameOrId]||routeFromScreenId(nameOrId)||{id:nameOrId,nav:""};
 const id=route.id,target=$("#"+id);
 if(!target){console.warn("[ScreenManager] Ecrã não encontrado:",nameOrId,id);return false}
 if(typeof route.before==="function"&&!options.skipRender)route.before();
 $$(".screen").forEach(e=>e.classList.remove("active"));
 target.classList.add("active");
 const game=$("#game");
 if(game){
  game.classList.toggle("battle-mode",id==="battleScreen");
  game.classList.toggle("lobby-mode",id==="homeScreen");
 }
 const nav=options.nav??route.nav??"";
 $$(".bottomNav button[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===nav));
 renderResources();updateMissionIndicators();
 if(typeof AudioEngine!=="undefined")AudioEngine.scene(id);
 return true;
}
function show(id){return showScreen(id)}
function backToLobby(){
 if(battle&&!battle.ended&&$("#battleScreen")?.classList.contains("active"))battle.ended=true;
 try{screen.orientation?.unlock?.()}catch{}
 showScreen("lobby");
}
function renderResources(){
 $("[data-res]").forEach(e=>{const k=e.dataset.res;if(k==="accountLevel")e.textContent=accountLevel();else e.textContent=save[k]??0});
 const v=vipLevel();if($("#vipTopLevel"))$("#vipTopLevel").textContent=v;if($("#portalVipLevel"))$("#portalVipLevel").textContent=v;
}

function vipLevel(){
 let level=1;
 for(let i=0;i<VIP_THRESHOLDS.length;i++)if(save.vipPoints>=VIP_THRESHOLDS[i])level=i+1;
 return clamp(level,1,10);
}
function vipAfkGoldBonus(){return vipLevel()*.02}
function arenaMaxAttempts(){const v=vipLevel();return 5+(v>=4?1:0)+(v>=8?1:0)}
function addVipPoints(points,reason=""){
 const before=vipLevel();save.vipPoints=Math.max(0,(save.vipPoints||0)+Math.max(0,Math.round(points||0)));
 const after=vipLevel();
 if(after>before){rewardFloat("👑 VIP "+after+" desbloqueado!","gold");toast("👑 Você alcançou VIP "+after);haptic([18,24,38])}
 return after;
}
function spendDiamonds(amount,reason=""){
 amount=Math.max(0,Math.round(amount||0));
 if(save.diamonds<amount)return false;
 save.diamonds-=amount;save.diamondsSpent=(save.diamondsSpent||0)+amount;addVipPoints(amount,reason);
 return true;
}
function renderVip(){
 const lv=vipLevel(),cur=VIP_THRESHOLDS[lv-1]||0,next=lv<10?VIP_THRESHOLDS[lv]:cur,span=Math.max(1,next-cur),pct=lv>=10?100:clamp((save.vipPoints-cur)/span*100,0,100);
 if($("#vipScreenLevel"))$("#vipScreenLevel").textContent=lv;
 if($("#vipSpent"))$("#vipSpent").textContent=(save.diamondsSpent||0).toLocaleString("pt-BR");
 if($("#vipPoints"))$("#vipPoints").textContent=(save.vipPoints||0).toLocaleString("pt-BR");
 if($("#vipTitle"))$("#vipTitle").textContent="VIP "+lv;
 if($("#vipDesc"))$("#vipDesc").textContent="Diamantes gastos e missões diárias aumentam seu status. As vantagens são aplicadas automaticamente aos sistemas do jogo.";
 if($("#vipProgress"))$("#vipProgress").innerHTML=`<div class="vipProgressTop"><b>VIP ${lv}</b><span>${lv>=10?"Nível máximo":(save.vipPoints-cur)+" / "+span+" para VIP "+(lv+1)}</span></div><div class="vipProgressBar"><i style="width:${pct}%"></i></div>`;
 const perks=[
  {need:1,title:"📦 Farm AFK",desc:"+"+Math.round(vipAfkGoldBonus()*100)+"% Ouro AFK no seu nível atual."},
  {need:4,title:"🏟️ Arena VIP 4",desc:"+1 tentativa diária de Arena."},
  {need:6,title:"🎫 Passe acelerado",desc:"+10% XP do Passe a partir do VIP 6."},
  {need:8,title:"⚔️ Arena VIP 8",desc:"+2 tentativas diárias no total."},
  {need:10,title:"👑 Prestígio VIP 10",desc:"+20% Ouro AFK e máximo de tentativas VIP."}
 ];
 if($("#vipPerks"))$("#vipPerks").innerHTML=perks.map(p=>`<div class="vipPerk ${lv>=p.need?"active":""}"><b>${lv>=p.need?"✓":"🔒"} ${p.title}</b><small>${p.desc}</small></div>`).join("");
 renderResources();
}
function addBattlePassXp(base,reason=""){
 const mult=vipLevel()>=6?1.10:1,amount=Math.max(1,Math.round(base*mult));
 save.battlePassXp=(save.battlePassXp||0)+amount;
 if($("#battlePassScreen")?.classList.contains("active"))renderBattlePass();
 return amount;
}
function battlePassUnlockedTier(){return clamp(Math.floor((save.battlePassXp||0)/BATTLE_PASS_STEP),0,BATTLE_PASS_TIERS)}
function passReward(tier,premium=false){
 if(premium){
  if(tier%5===0)return{type:"stones",qty:2+Math.floor(tier/10),label:"🌟 Pedras de Despertar"};
  if(tier%3===0)return{type:"shards",qty:15,label:"👼 Fragmentos de Seraphina"};
  return{type:"diamonds",qty:60+tier*5,label:"💎 Diamantes"};
 }
 if(tier%5===0)return{type:"scrolls",qty:1,label:"📜 Pergaminho"};
 if(tier%2===0)return{type:"gold",qty:500+tier*80,label:"🪙 Ouro"};
 return{type:"essence",qty:2+Math.ceil(tier/4),label:"✨ Essência"};
}
function grantPassReward(r){
 if(r.type==="gold")save.gold+=r.qty;
 else if(r.type==="diamonds")save.diamonds+=r.qty;
 else if(r.type==="scrolls")save.scrolls+=r.qty;
 else if(r.type==="essence")save.essence+=r.qty;
 else if(r.type==="stones")save.awakeningStones+=r.qty;
 else if(r.type==="shards")save.shards.seraphina=(save.shards.seraphina||0)+r.qty;
}
function claimPassReward(tier,premium=false){
 tier=Number(tier);if(tier<1||tier>BATTLE_PASS_TIERS||battlePassUnlockedTier()<tier)return;
 const map=premium?save.battlePassPremiumClaimed:save.battlePassFreeClaimed;
 if(premium&&!save.battlePassPremium)return toast("Desbloqueie o Passe Premium primeiro");
 if(map[tier])return;
 const r=passReward(tier,premium);grantPassReward(r);map[tier]=true;persist();renderBattlePass();renderResources();
 rewardFloat(r.label+" +"+r.qty,premium?"diamond":"gold");AudioEngine.sfx("reward");
}
function unlockPremiumPass(){
 if(save.battlePassPremium)return;
 if(!spendDiamonds(1200,"Passe Premium"))return toast("Diamantes insuficientes");
 save.battlePassPremium=true;persist();renderBattlePass();renderVip();toast("🎫 Passe Premium desbloqueado!");
}
function renderBattlePass(){
 const unlocked=battlePassUnlockedTier(),displayLevel=Math.min(BATTLE_PASS_TIERS,unlocked+1),within=(save.battlePassXp||0)%BATTLE_PASS_STEP;
 if($("#battlePassLevel"))$("#battlePassLevel").textContent=displayLevel;
 if($("#battlePassXp"))$("#battlePassXp").textContent=(save.battlePassXp||0).toLocaleString("pt-BR");
 if($("#battlePassProgressFill"))$("#battlePassProgressFill").style.width=(unlocked>=BATTLE_PASS_TIERS?100:within/BATTLE_PASS_STEP*100)+"%";
 if($("#battlePassProgressText"))$("#battlePassProgressText").textContent=unlocked>=BATTLE_PASS_TIERS?"Passe concluído":within+"/"+BATTLE_PASS_STEP+" XP";
 const premiumBtn=$("#unlockPremiumPass");if(premiumBtn){premiumBtn.disabled=save.battlePassPremium||save.diamonds<1200;premiumBtn.textContent=save.battlePassPremium?"✓ PREMIUM ATIVO":"Desbloquear Premium • 💎1.200"}
 const track=$("#battlePassTrack");if(!track)return;
 track.innerHTML=Array.from({length:BATTLE_PASS_TIERS},(_,i)=>i+1).map(t=>{
  const free=passReward(t,false),prem=passReward(t,true),open=unlocked>=t,fc=!!save.battlePassFreeClaimed[t],pc=!!save.battlePassPremiumClaimed[t];
  return `<div class="passTier ${open?"unlocked":""}"><div class="passLevel">Nv.${t}</div>
   <div class="passReward ${fc?"claimed":""} ${open?"":"locked"}"><div><b>GRÁTIS • ${free.label}</b><small>Quantidade: ${free.qty}</small></div><button class="btn claimPassBtn" data-tier="${t}" data-premium="0" ${!open||fc?"disabled":""}>${fc?"✓":"Resgatar"}</button></div>
   <div class="passReward premium ${pc?"claimed":""} ${open&&save.battlePassPremium?"":"locked"}"><div><b>PREMIUM • ${prem.label}</b><small>Quantidade: ${prem.qty}</small></div><button class="btn claimPassBtn" data-tier="${t}" data-premium="1" ${!open||pc||!save.battlePassPremium?"disabled":""}>${pc?"✓":"Resgatar"}</button></div></div>`;
 }).join("");
 $(".claimPassBtn").forEach(b=>b.addEventListener("click",()=>claimPassReward(b.dataset.tier,b.dataset.premium==="1")));
}
function petById(id){return PETS.find(p=>p.id===id)||PETS[0]}
function petAuraData(id=save.activePet){
 if(!id||!save.petsOwned[id])return null;
 const p=petById(id),lv=clamp(save.petLevels[id]||1,1,10);
 if(id==="drakko")return{pet:p,level:lv,def:.15+(lv-1)*.005,atk:0};
 return{pet:p,level:lv,def:0,atk:.10+(lv-1)*.005};
}
function applyPetAura(units){
 const aura=petAuraData();if(!aura)return units;
 units.forEach(u=>{u.basePd=Math.round(u.basePd*(1+aura.def));u.baseMd=Math.round(u.baseMd*(1+aura.def));u.pa=Math.round(u.pa*(1+aura.atk));u.ma=Math.round(u.ma*(1+aura.atk))});
 units.pet=aura;return units;
}
function petFeedNeed(id){const lv=save.petLevels[id]||1;return 3+Math.floor(lv/2)}
function feedPet(id){
 if(!save.petsOwned[id])return;
 const lv=save.petLevels[id]||1;if(lv>=10)return toast("Mascote no nível máximo");
 const gold=300+lv*140,ess=Math.max(1,Math.ceil(lv/3));
 if(save.gold<gold||save.essence<ess)return toast("Recursos insuficientes para alimentar");
 save.gold-=gold;save.essence-=ess;save.petFeed[id]=(save.petFeed[id]||0)+1;
 const need=petFeedNeed(id);
 if(save.petFeed[id]>=need){save.petFeed[id]=0;save.petLevels[id]=lv+1;rewardFloat("🐾 "+petById(id).name+" Nv."+(lv+1),"exp")}
 persist();renderPets();renderResources();
}
function unlockPet(id){
 const p=petById(id);if(save.petsOwned[id])return;
 if(p.unlock==="diamonds"){if(!spendDiamonds(p.price,"Mascote "+p.name))return toast("Diamantes insuficientes")}
 save.petsOwned[id]=true;save.activePet=id;selectedPet=id;persist();renderPets();renderVip();toast("🐾 "+p.name+" foi desbloqueado!");
}
function activatePet(id){if(!save.petsOwned[id])return;save.activePet=id;selectedPet=id;persist();renderPets();toast("🐾 "+petById(id).name+" equipado")}
function renderPets(){
 const grid=$("#petGrid"),detail=$("#petDetail");if(!grid||!detail)return;
 if(!PETS.some(p=>p.id===selectedPet))selectedPet=save.activePet||PETS[0].id;
 grid.innerHTML=PETS.map(p=>{const own=!!save.petsOwned[p.id],lv=save.petLevels[p.id]||1;return `<button class="petCard ${selectedPet===p.id?"selected":""} ${own?"":"locked"}" data-pet="${p.id}"><div class="petAvatar">${p.emoji}</div><div><b>${p.name}</b><small>${p.role} • ${own?"Nv."+lv:"Bloqueado"}</small></div>${save.activePet===p.id?'<span class="petActive">ATIVO</span>':""}</button>`}).join("");
 $(".petCard").forEach(b=>b.addEventListener("click",()=>{selectedPet=b.dataset.pet;renderPets()}));
 const p=petById(selectedPet),own=!!save.petsOwned[p.id],lv=save.petLevels[p.id]||1,aura=petAuraData(p.id),feed=save.petFeed[p.id]||0,need=petFeedNeed(p.id);
 const auraText=p.id==="drakko"?("+"+Math.round((aura?.def||.15)*100)+"% DEF Global"):("+"+Math.round((aura?.atk||.10)*100)+"% ATQ Global");
 detail.innerHTML=`<div class="petDetailHead"><div class="big">${p.emoji}</div><div><h2>${p.name}</h2><p>${p.role} • Nv.${lv}/10</p></div></div><p>${p.desc}</p>
 <div class="petAuraBox"><b>✨ Aura: ${auraText}</b><small>Habilidade automática: ${p.skill} • ativa a cada 3 rodadas.</small></div>
 ${own?`<div class="petAuraBox"><b>🍖 Alimentação ${feed}/${need}</b><small>Custo atual: 🪙 ${(300+lv*140).toLocaleString("pt-BR")} + ✨ ${Math.max(1,Math.ceil(lv/3))}</small></div><div class="petActions"><button id="feedPetBtn" class="btn primary" ${lv>=10?"disabled":""}>Alimentar</button><button id="activatePetBtn" class="btn gold" ${save.activePet===p.id?"disabled":""}>${save.activePet===p.id?"✓ Equipado":"Equipar"}</button></div>`:`<button id="unlockPetBtn" class="btn gold" style="width:100%">Desbloquear • 💎${p.price||0}</button>`}`;
 const f=$("#feedPetBtn"),act=$("#activatePetBtn"),unlock=$("#unlockPetBtn");
 if(f)f.addEventListener("click",()=>feedPet(p.id));if(act)act.addEventListener("click",()=>activatePet(p.id));if(unlock)unlock.addEventListener("click",()=>unlockPet(p.id));
 if($("#activePetBadge"))$("#activePetBadge").textContent=petById(save.activePet).emoji+" "+petById(save.activePet).name;
}
function renderChatState(){
 const chat=$("#globalChat");if(!chat)return;chat.classList.toggle("collapsed",!!save.chatCollapsed);if($("#chatChevron"))$("#chatChevron").textContent=save.chatCollapsed?"⌃":"⌄";
}
function pushChatMessage(seed=false){
 const box=$("#chatMessages");if(!box)return;
 const item=CHAT_MESSAGES[Math.floor(Math.random()*CHAT_MESSAGES.length)],row=document.createElement("div");
 row.className="chatMsg "+(item[2]||"");row.innerHTML="<b>"+item[0]+":</b> "+item[1];box.appendChild(row);
 while(box.children.length>5)box.removeChild(box.firstChild);
 if(!seed)row.animate?.([{opacity:0,transform:"translateY(5px)"},{opacity:1,transform:"none"}],{duration:220});
}
function startGlobalChat(){
 clearInterval(chatTimer);renderChatState();const box=$("#chatMessages");if(box&&!box.children.length){pushChatMessage(true);pushChatMessage(true);pushChatMessage(true)}
 chatTimer=setInterval(()=>{if(!document.hidden)pushChatMessage(false)},6500);
}
function toggleGlobalChat(){save.chatCollapsed=!save.chatCollapsed;persist();renderChatState()}
function dailyGuildWarReset(){
 if(save.guildWarDate!==todayKey()){save.guildWarDate=todayKey();save.guildWarAttempts=3;save.guildWarPoints=0;guildWarCastles=[];persist()}
}
function generateGuildWarCastles(){
 dailyGuildWarReset();if(guildWarCastles.length)return guildWarCastles;
 const names=["Fortaleza Rubra","Bastião Lunar","Cidadela de Ferro","Trono Abissal"];
 guildWarCastles=names.map((name,i)=>{
  const heroes=[...HEROES].sort(()=>Math.random()-.5).slice(0,5).map(h=>h.id),level=5+i*3,scale=.88+i*.14;
  return{id:"castle"+i,name,icon:i===3?"🏯":"🏰",level,scale,power:Math.round(9200*(scale+.35)),heroes,elite:i===3};
 });
 return guildWarCastles;
}
function guildWarHtml(){
 if(!save.guildId)return"";
 dailyGuildWarReset();const castles=generateGuildWarCastles();
 return `<div class="guildWar card"><div class="guildWarHeader"><div><h3>⚔️ Guerra de Guildas</h3><span>Mapa diário simulado • escolha um castelo inimigo</span></div><div class="warScore">🏅 ${save.guildWarPoints} • ⚔️ ${save.guildWarAttempts}/3</div></div><div class="warMap">${castles.map(c=>`<div class="warCastle ${c.elite?"elite":""}"><div class="castleIcon">${c.icon}</div><b>${c.name}</b><small>Defesa IA • Nv. médio ${c.level}</small><div class="warPower">Poder estimado ${c.power.toLocaleString("pt-BR")}</div><button class="btn guildWarBtn" data-castle="${c.id}" ${save.guildWarAttempts<1?"disabled":""}>⚔️ Atacar</button></div>`).join("")}</div></div>`;
}
function startGuildWarBattle(id){
 dailyGuildWarReset();const c=generateGuildWarCastles().find(x=>x.id===id);
 if(!c||save.guildWarAttempts<1)return toast("Sem ataques de Guerra hoje");
 if(used().length!==5)return toast("Monte uma formação com 5 heróis");
 save.guildWarAttempts--;persist();
 const enemies=SLOTS.map((slot,i)=>new Unit(hero(c.heroes[i]),"enemy",slot,{level:c.level,scale:c.scale}));
 lastBattleMode="guildWar";landscape();battle=new Battle(playerTeam(),enemies,{mode:"guildWar",castle:c,name:c.name});
 showScreen("battleScreen");$("#battleStageName").textContent="GUERRA • "+c.name;$("#battleLog").innerHTML="";battle.log("⚔️ Ataque de Guilda iniciado contra "+c.name+".");renderBattle();battle.loop();
}

function haptic(pattern=10){try{navigator.vibrate&&navigator.vibrate(pattern)}catch(e){}}
function rewardFloat(text,kind="gold",delay=0){
 const layer=$("#rewardFloatLayer");if(!layer)return;
 setTimeout(()=>{
  const e=document.createElement("div");e.className="rewardFloatItem "+kind;e.textContent=text;
  e.style.marginTop=(Math.random()*26-13)+"px";layer.appendChild(e);setTimeout(()=>e.remove(),1450);
 },delay);
}
function rewardBurst(items){
 items.forEach((it,i)=>rewardFloat(it.text,it.kind||"gold",i*150));
}


function affinityOf(id){return HERO_AFFINITY[id]||{faction:"neutral",factionName:"Neutro",element:"Arcano",icon:"✦"}}
function computeSynergy(ids){
 const counts={};ids.filter(Boolean).forEach(id=>{const a=affinityOf(id);counts[a.faction]=(counts[a.faction]||0)+1});
 const best=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 if(!best||best[1]<3)return{active:false,count:best?best[1]:0,faction:best?best[0]:null,label:"Sem aura ativa",atk:0,def:0,hp:0,crit:0,rage:0,critImmunity:0};
 const [faction,count]=best,base={...SYNERGY_RULES[Math.min(count,5)]},name=faction==="aurora"?"Aurora":"Eclipse";
 const out={active:true,count,faction,name,...base,critImmunity:0};
 if(count>=5&&faction==="aurora"){out.critImmunity=1;out.label+=""+" • 1º crítico anulado";}
 if(count>=5&&faction==="eclipse"){out.crit=.15;out.rage=15;out.label+=""+" • +15% CRIT • +15 Rage";}
 return out;
}
function applySynergy(units,syn){
 if(!syn||!syn.active)return units;
 units.forEach(u=>{
  u.maxHp=Math.round(u.maxHp*(1+syn.hp));u.hp=u.maxHp;
  u.pa=Math.round(u.pa*(1+syn.atk));u.ma=Math.round(u.ma*(1+syn.atk));
  u.basePd=Math.round(u.basePd*(1+syn.def));u.baseMd=Math.round(u.baseMd*(1+syn.def));
  u.cr=clamp(u.cr+(syn.crit||0),0,.85);u.rage=clamp((u.rage||0)+(syn.rage||0),0,100);
  u.critImmunity=syn.critImmunity||0;
 });
 units.synergy=syn;return units;
}
function renderSynergyPanel(){
 const el=$("#synergyPanel");if(!el)return;
 const syn=computeSynergy(used()),counts={aurora:0,eclipse:0};
 used().forEach(id=>counts[affinityOf(id).faction]=(counts[affinityOf(id).faction]||0)+1);
 el.innerHTML=`<div class="synergyTitle"><b>✨ Aura de Fação</b><span>${syn.active?syn.name+" • "+syn.count+"/5":"Ative com 3+ heróis da mesma fação"}</span></div>
 <div class="synergyBadges"><span class="synergyBadge ${counts.aurora>=3?"active":""}">☀️ Aurora ${counts.aurora}/5</span><span class="synergyBadge ${counts.eclipse>=3?"active":""}">🌘 Eclipse ${counts.eclipse}/5</span><span class="synergyBadge ${syn.active?"active":""}">${syn.active?syn.label:"3 = ATQ • 4 = DEF • 5 = efeito máximo"}</span></div>`;
}

function formatDuration(ms){
 const sec=Math.max(0,Math.floor(ms/1000)),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s2=sec%60;
 return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(s2).padStart(2,"0");
}
function afkSnapshot(now=Date.now()){
 const elapsed=clamp(now-(save.lastAfkClaim||now),0,AFK_CAP_MS),minutes=elapsed/60000,goldMult=1+vipAfkGoldBonus();
 return{elapsed,gold:Math.floor(minutes*AFK_RATES.goldPerMin*goldMult),exp:Math.floor(minutes*AFK_RATES.expPerMin),essence:Math.floor(minutes*AFK_RATES.essencePerMin),goldMult};
}
function renderAfk(){
 const r=afkSnapshot(),badge=$("#afkTimerBadge");
 if(badge)badge.textContent=formatDuration(r.elapsed);
 if($("#afkGold"))$("#afkGold").textContent=r.gold.toLocaleString("pt-BR");
 if($("#afkExp"))$("#afkExp").textContent=r.exp.toLocaleString("pt-BR");
 if($("#afkEssence"))$("#afkEssence").textContent=r.essence.toLocaleString("pt-BR");
 if($("#afkRateText"))$("#afkRateText").textContent="Taxa base: 🪙 "+AFK_RATES.goldPerMin+"/min • Bônus VIP +"+Math.round(vipAfkGoldBonus()*100)+"% • ⭐ "+AFK_RATES.expPerMin+"/min • ✨ ~"+Math.round(AFK_RATES.essencePerMin*60)+"/h";
 if($("#claimAfkBtn"))$("#claimAfkBtn").disabled=r.gold<1&&r.exp<1&&r.essence<1;
}
function claimAfk(auto=false){
 const r=afkSnapshot();if(r.gold<1&&r.exp<1&&r.essence<1){if(!auto)toast("O baú ainda está vazio");return false}
 save.gold+=r.gold;save.accountExp+=r.exp;save.essence+=r.essence;save.lastAfkClaim=Date.now();persist();renderAfk();
 rewardBurst([{text:"🪙 +"+r.gold,kind:"gold"},{text:"⭐ +"+r.exp+" EXP",kind:"exp"},{text:"✨ +"+r.essence,kind:"diamond"}]);
 if(!auto)toast("📦 Espólios AFK recolhidos");else toast("📦 Recompensas offline recebidas");
 AudioEngine.sfx("reward");haptic([10,20,25]);return true;
}
function processOfflineRewards(){const r=afkSnapshot();if(r.elapsed>=60000)setTimeout(()=>claimAfk(true),900)}
function startAfkTicker(){clearInterval(afkTicker);renderAfk();afkTicker=setInterval(()=>{if($("#afkScreen")?.classList.contains("active"))renderAfk()},1000)}

function awakeningEligible(id){return (save.heroLevels[id]||1)>=20||(save.stars[id]||1)>=5}
function awakeningCost(id){return AWAKEN_COSTS[clamp(save.awakening[id]||0,0,AWAKEN_MAX-1)]||{gold:0,stones:0}}
function renderAwakening(){
 if(!save.owned[selectedAwakeningHero])selectedAwakeningHero=HEROES.find(h=>save.owned[h.id])?.id||HEROES[0].id;
 const grid=$("#awakeningHeroGrid");if(!grid)return;grid.innerHTML="";
 HEROES.forEach(h=>{
  const own=save.owned[h.id],lv=save.awakening[h.id]||0,a=affinityOf(h.id),e=document.createElement("button");
  e.className="awakenHeroCard"+(selectedAwakeningHero===h.id?" selected":"")+(!own?" locked":"");
  e.innerHTML=`<div class="awakenHeroTop"><span>${own?h.emoji:"❔"}</span><div><b>${h.name}</b><small>${a.icon} ${a.element} • ${a.factionName}</small></div></div><div class="awakenLevel">🌟 Despertar ${lv}/${AWAKEN_MAX}</div>`;
  e.onclick=()=>{selectedAwakeningHero=h.id;renderAwakening()};grid.appendChild(e);
 });
 const h=hero(selectedAwakeningHero),own=save.owned[h.id],aw=save.awakening[h.id]||0,eligible=awakeningEligible(h.id),cost=awakeningCost(h.id),a=affinityOf(h.id);
 if(!own){$("#awakeningDetail").innerHTML='<div class="small">Invoque este herói primeiro para liberar o Despertar.</div>';return}
 const effects=AWAKEN_EFFECTS[h.id]||[];
 $("#awakeningDetail").innerHTML=`<div class="awakenHead"><div class="awakenAvatar">${h.emoji}</div><div><h2>${h.name}</h2><p>${a.icon} ${a.element} • Fação ${a.factionName}<br>${starString(save.stars[h.id]||1)} • Nv.${save.heroLevels[h.id]||1}</p></div></div>
 <div class="awakenReq ${eligible?"ready":""}">${eligible?"✓ Requisito cumprido":"🔒 Requer Nível 20 OU 5★"} • Ultimate: <b>${h.ult.name}</b></div>
 <div class="talentSteps">${effects.map((txt,i)=>`<div class="talentStep ${aw>i?"active":""}"><b>${aw>i?"✓":"○"} Despertar ${i+1}</b><small>${txt}</small></div>`).join("")}</div>
 <div class="awakenCost"><span>🪙 ${aw<AWAKEN_MAX?cost.gold.toLocaleString("pt-BR"):"—"}</span><span>🌟 ${aw<AWAKEN_MAX?cost.stones:"—"} Pedras</span></div>
 <button id="awakenHeroBtn" class="btn awakenBtn" style="width:100%;margin-top:8px" ${!eligible||aw>=AWAKEN_MAX||save.gold<cost.gold||save.awakeningStones<cost.stones?"disabled":""}>${aw>=AWAKEN_MAX?"DESPERTAR MÁXIMO":"Despertar para Nv."+(aw+1)}</button>`;
 const btn=$("#awakenHeroBtn");if(btn)btn.onclick=()=>awakenHero(h.id);
}
function awakenHero(id){
 const aw=save.awakening[id]||0;if(!awakeningEligible(id)||aw>=AWAKEN_MAX)return;
 const c=awakeningCost(id);if(save.gold<c.gold||save.awakeningStones<c.stones)return toast("Recursos de Despertar insuficientes");
 save.gold-=c.gold;save.awakeningStones-=c.stones;save.awakening[id]=aw+1;persist();renderAwakening();renderHeroes();
 rewardFloat("🌟 "+hero(id).name+" • Despertar "+(aw+1),"diamond");AudioEngine.sfx("reward");haptic([25,30,45]);
}

const AudioEngine={
 muted:!!save.audioMuted,unlocked:false,bgm:null,bgmKey:null,cache:{},pausedByVisibility:false,
 get(key,loop=false){
  if(!AUDIO_ASSETS[key])return null;
  if(!this.cache[key]){const a=new Audio(AUDIO_ASSETS[key]);a.preload="none";a.loop=loop;a.volume=loop ? .28 : .45;this.cache[key]=a}
  return this.cache[key];
 },
 unlock(){this.unlocked=true;this.updateButton()},
 stopBgm(){if(this.bgm){try{this.bgm.pause();this.bgm.currentTime=0}catch(e){}}this.bgm=null;this.bgmKey=null;this.pausedByVisibility=false},
 scene(screenId){
  const key=screenId==="battleScreen"?"battle":"menu";
  if(this.bgmKey===key&&this.bgm){
   if(!this.muted&&this.unlocked&&!document.hidden&&this.bgm.paused)this.bgm.play().catch(()=>{});
   return;
  }
  this.stopBgm();this.bgmKey=key;
  if(this.muted||!this.unlocked||document.hidden)return;
  const a=this.get(key,true);if(a){this.bgm=a;a.play().catch(()=>{})}
 },
 pauseForVisibility(){
  if(this.bgm&&!this.bgm.paused){
   this.pausedByVisibility=true;
   try{this.bgm.pause()}catch(e){}
  }else this.pausedByVisibility=false;
 },
 resumeFromVisibility(){
  if(document.hidden||this.muted||!this.unlocked)return;
  const current=$(".screen.active")?.id||"homeScreen";
  const desired=current==="battleScreen"?"battle":"menu";
  if(this.bgmKey!==desired||!this.bgm){this.scene(current);return}
  try{this.bgm.play().catch(()=>{})}catch(e){}
  this.pausedByVisibility=false;
 },
 fallbackTone(freq=440,dur=.045,vol=.018){
  if(this.muted||!this.unlocked||document.hidden)return;
  try{uiAudio=uiAudio||new (window.AudioContext||window.webkitAudioContext)();const o=uiAudio.createOscillator(),g=uiAudio.createGain();o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(uiAudio.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,uiAudio.currentTime+dur);o.stop(uiAudio.currentTime+dur)}catch(e){}
 },
 sfx(key){
  if(this.muted||!this.unlocked||document.hidden)return;
  const a=this.get(key,false);if(a){try{a.currentTime=0;a.play().catch(()=>this.fallbackTone(key==="impact"?180:key==="ultimateReady"?720:key==="ultimate"?260:520,key==="ultimate"?.14:.045))}catch(e){this.fallbackTone(520)}}else this.fallbackTone(520);
 },
 toggle(){
  this.muted=!this.muted;save.audioMuted=this.muted;persist();
  if(this.muted)this.stopBgm();
  else this.scene($(".screen.active")?.id||"homeScreen");
  this.updateButton();toast(this.muted?"🔇 Áudio desativado":"🔊 Áudio ativado");
 },
 updateButton(){const b=$("#muteBtn");if(b){b.textContent=this.muted?"🔇":"🔊";b.classList.toggle("muted",this.muted)}}
};


document.addEventListener("visibilitychange",()=>{
 if(document.hidden){
  AudioEngine.pauseForVisibility();
  save.lastVisibilityAt=Date.now();
  localStorage.setItem(SAVE_KEY,JSON.stringify(save));
 }else{
  // O ticker pode ser reduzido pelo navegador em segundo plano; Date.now()
  // recalcula imediatamente todo o período transcorrido quando o jogador volta.
  renderAfk();
  renderResources();
  AudioEngine.resumeFromVisibility();
 }
});
window.addEventListener("pageshow",()=>{
 renderAfk();
 renderResources();
 if(!document.hidden)AudioEngine.resumeFromVisibility();
});

function storyLineAvatar(id){const h=hero(id);return h?h.emoji:id==="vorak"?"🐉":"✨"}
function playCutscene(lines,key,onDone){
 if(key&&save.storySeen[key]){onDone();return}
 storyState={lines,index:0,key,onDone,typing:false,timer:null,full:""};$("#storyModal").classList.add("show");showStoryLine();
}
function showStoryLine(){
 const st=storyState;if(!st)return;const line=st.lines[st.index];if(!line){finishStory();return}
 clearInterval(st.timer);st.full=line.text;st.typing=true;$("#storyAvatar").textContent=storyLineAvatar(line.hero);$("#storySpeaker").textContent=line.speaker;$("#storyText").textContent="";
 let i=0;st.timer=setInterval(()=>{i++;$("#storyText").textContent=st.full.slice(0,i);if(i>=st.full.length){clearInterval(st.timer);st.typing=false}},22);
}
function nextStory(){
 const st=storyState;if(!st)return;
 if(st.typing){clearInterval(st.timer);$("#storyText").textContent=st.full;st.typing=false;return}
 st.index++;if(st.index>=st.lines.length)finishStory();else showStoryLine();
}
function finishStory(){
 const st=storyState;if(!st)return;clearInterval(st.timer);if(st.key){save.storySeen[st.key]=true;persist()}
 $("#storyModal").classList.remove("show");storyState=null;const cb=st.onDone;setTimeout(()=>cb&&cb(),120);
}
function skipStory(){finishStory()}
function campaignCutscene(stg,cb){if(stg.id===5)playCutscene(CUTSCENES.stage5,"campaign-stage-1-5",cb);else cb()}
function worldBossCutscene(cb){playCutscene(CUTSCENES.worldBoss,"worldboss-"+todayKey(),cb)}

let toastTimer=null;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}
function currencyIcon(c){return c==="gold"?"🪙":c==="diamonds"?"💎":"🏟️"}


function resetDailyMissions(){
 if(save.missionDate!==todayKey()){
  save.missionDate=todayKey();
  save.dailyCounters={arenaWins:0,summons:0,levelUps:0,campaignWins:0};
  save.dailyClaimed={};
  localStorage.setItem(SAVE_KEY,JSON.stringify(save));
 }
}
function trackEvent(key,amount=1){
 resetDailyMissions();
 save.lifetime[key]=(save.lifetime[key]||0)+amount;
 if(Object.prototype.hasOwnProperty.call(save.dailyCounters,key))save.dailyCounters[key]=(save.dailyCounters[key]||0)+amount;
 persist();
}
function achievementProgress(a){
 if(a.key==="maxHeroLevel")return Math.max(...Object.values(save.heroLevels||{a:1}));
 if(a.key==="arenaRating")return save.arenaRating||0;
 return (save.lifetime&&save.lifetime[a.key])||0;
}
function claimableDailyCount(){
 resetDailyMissions();
 return DAILY_MISSIONS.filter(m=>(save.dailyCounters[m.key]||0)>=m.target&&!save.dailyClaimed[m.id]).length;
}
function updateMissionIndicators(){
 const n=claimableDailyCount(),dot=$("#missionNavDot"),badge=$("#missionBadge");
 if(dot)dot.classList.toggle("show",n>0);
 if(badge){badge.textContent=n?String(n)+" prontas":"Diárias";badge.classList.toggle("ready",n>0)}
}
function rewardText(r){return "🪙"+(r.gold||0)+" • 💎"+(r.diamonds||0)+(r.contribution?" • 🤝"+r.contribution:"")}
function renderMissions(tab="daily"){
 resetDailyMissions();
 const daily=$("#dailyMissions"),ach=$("#achievementList"),dTab=$("#dailyTab"),aTab=$("#achievementTab");
 if(!daily||!ach)return;
 dTab.classList.toggle("active",tab==="daily");aTab.classList.toggle("active",tab==="achievements");
 daily.style.display=tab==="daily"?"grid":"none";ach.style.display=tab==="achievements"?"grid":"none";
 daily.innerHTML=DAILY_MISSIONS.map(m=>{
  const p=save.dailyCounters[m.key]||0,done=p>=m.target,claimed=!!save.dailyClaimed[m.id],pct=Math.min(100,p/m.target*100);
  return `<div class="missionCard ${done?"complete":""} ${claimed?"claimed":""}"><div class="missionTop"><div><b>${m.icon} ${m.title}</b><span>${m.desc}</span></div><div class="missionReward">${rewardText(m.reward)}</div></div><div class="missionBar"><i style="width:${pct}%"></i></div><div class="missionBottom"><span>${Math.min(p,m.target)}/${m.target}</span><button class="btn claimMissionBtn" data-id="${m.id}" ${!done||claimed?"disabled":""}>${claimed?"Resgatada":"Resgatar"}</button></div></div>`;
 }).join("");
 ach.innerHTML=ACHIEVEMENTS.map(a=>{
  const p=achievementProgress(a),done=p>=a.target,claimed=!!save.achievementClaimed[a.id],pct=Math.min(100,p/a.target*100);
  return `<div class="missionCard ${done?"complete":""} ${claimed?"claimed":""}"><div class="missionTop"><div><b>${a.icon} ${a.title}</b><span>${a.desc}</span></div><div class="missionReward">${rewardText(a.reward)}</div></div><div class="missionBar"><i style="width:${pct}%"></i></div><div class="missionBottom"><span>${Math.min(p,a.target)}/${a.target}</span><button class="btn claimAchievementBtn" data-id="${a.id}" ${!done||claimed?"disabled":""}>${claimed?"Obtida":"Resgatar"}</button></div></div>`;
 }).join("");
 $(".claimMissionBtn").forEach(b=>b.onclick=()=>claimDaily(b.dataset.id));
 $(".claimAchievementBtn").forEach(b=>b.onclick=()=>claimAchievement(b.dataset.id));
 updateMissionIndicators();renderResources();
}
function claimDaily(id){
 const m=DAILY_MISSIONS.find(x=>x.id===id);if(!m||save.dailyClaimed[id]||(save.dailyCounters[m.key]||0)<m.target)return;
 save.dailyClaimed[id]=true;save.gold+=m.reward.gold||0;save.diamonds+=m.reward.diamonds||0;save.guildContribution+=m.reward.contribution||0;
 addVipPoints(120,"Missão diária");const bp=addBattlePassXp(60,"Missão diária");
 persist();rewardBurst([{text:"🪙 +"+(m.reward.gold||0),kind:"gold"},{text:"💎 +"+(m.reward.diamonds||0),kind:"diamond"},{text:"👑 +120 VIP",kind:"gold"},{text:"🎫 +"+bp+" XP",kind:"exp"}]);
 renderMissions("daily");renderVip();renderBattlePass();dailyArenaReset();toast("🎯 Missão resgatada!");
}
function claimAchievement(id){
 const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a||save.achievementClaimed[id]||achievementProgress(a)<a.target)return;
 save.achievementClaimed[id]=true;save.gold+=a.reward.gold||0;save.diamonds+=a.reward.diamonds||0;
 persist();rewardBurst([{text:"🪙 +"+(a.reward.gold||0),kind:"gold"},{text:"💎 +"+(a.reward.diamonds||0),kind:"diamond"}]);renderMissions("achievements");toast("🏆 Conquista resgatada!");
}
function guildUpgradeCost(type){const lv=save[type]||0;return 80+lv*60}
function renderGuild(){
 const panel=$("#guildPanel");if(!panel)return;
 if(!save.guildId){
  panel.innerHTML=`<div class="guildIntro card"><div class="small">FACÇÕES DE NERDORA</div><h2>Escolha sua Guilda</h2><p>Entre em uma facção para liberar melhorias permanentes para todos os heróis. Ao entrar, você recebe 100 Moedas de Contribuição para começar.</p><div class="guildChoices">${GUILDS.map(g=>`<div class="guildChoice"><div class="guildEmblem">${g.emblem}</div><div><b>${g.name}</b><small>${g.motto}</small></div><button class="btn joinGuildBtn" data-id="${g.id}">Entrar</button></div>`).join("")}</div></div>`;
  $(".joinGuildBtn").forEach(b=>b.onclick=()=>joinGuild(b.dataset.id));return;
 }
 const g=GUILDS.find(x=>x.id===save.guildId)||GUILDS[0];
 const upgrades=[
  {key:"guildAttack",icon:"⚔️",name:"Ofensiva da Guilda",desc:"+1% ATQ Físico e Mágico por nível",lv:save.guildAttack||0},
  {key:"guildDefense",icon:"🛡️",name:"Muralha da Guilda",desc:"+1% DEF Física e Mágica por nível",lv:save.guildDefense||0},
  {key:"guildHp",icon:"❤️",name:"Vitalidade da Guilda",desc:"+1,5% HP por nível",lv:save.guildHp||0}
 ];
 panel.innerHTML=`<div class="guildMain card"><div class="small">SUA FACÇÃO</div><h2>${g.emblem} ${g.name}</h2><p>${g.motto}</p><div class="guildSummary"><div class="guildStat"><b>${save.guildContribution}</b><span>CONTRIBUIÇÃO</span></div><div class="guildStat"><b>+${save.guildAttack||0}%</b><span>ATAQUE</span></div><div class="guildStat"><b>+${save.guildDefense||0}%</b><span>DEFESA</span></div></div><div class="guildUpgradeGrid">${upgrades.map(u=>{const cost=guildUpgradeCost(u.key),max=u.lv>=10;return `<div class="guildUpgrade"><div><b>${u.icon} ${u.name} • Nv.${u.lv}</b><small>${u.desc}</small></div><button class="btn guildUpgradeBtn" data-key="${u.key}" ${max||save.guildContribution<cost?"disabled":""}>${max?"Máx.":"🤝 "+cost}</button></div>`}).join("")}</div><div class="guildMembers"><h3>Membros ativos</h3>${g.members.map((m,i)=>`<div class="guildMember"><span>${i===0?"👑":"•"} ${m}</span><span>Poder ${(9200-i*530).toLocaleString("pt-BR")}</span></div>`).join("")}</div></div>`;
 $(".guildUpgradeBtn").forEach(b=>b.onclick=()=>upgradeGuild(b.dataset.key));
}
function joinGuild(id){
 const g=GUILDS.find(x=>x.id===id);if(!g||save.guildId)return;
 save.guildId=id;save.guildContribution+=100;persist();renderGuild();renderHeroes();toast(g.emblem+" Você entrou na "+g.name);
}
function upgradeGuild(key){
 const lv=save[key]||0,cost=guildUpgradeCost(key);if(lv>=10||save.guildContribution<cost)return;
 save.guildContribution-=cost;save[key]=lv+1;persist();renderGuild();renderHeroes();renderFormation();toast("🛡️ Bônus da Guilda aumentado!");
}

/* feedback sonoro e visual */
let uiAudio=null;
function uiClickSound(){AudioEngine.sfx("click")}
document.addEventListener("pointerdown",e=>{
 if(!AudioEngine.unlocked){
  AudioEngine.unlock();
  const current=$(".screen.active")?.id||"homeScreen";AudioEngine.scene(current);
 }
 const b=e.target.closest("button");if(!b||b.disabled)return;
 b.classList.remove("tapFx");void b.offsetWidth;b.classList.add("tapFx");setTimeout(()=>b.classList.remove("tapFx"),220);
 uiClickSound();haptic(7);
});

function starString(n){n=clamp(n||1,1,5);return "★".repeat(n)+"☆".repeat(5-n)}
function starUp(heroId){
 const cur=clamp(save.stars[heroId]||1,1,5);if(cur>=5)return;
 const cost=STAR_COST[cur]||9999,have=save.shards[heroId]||0;if(have<cost)return toast("Fragmentos insuficientes");
 save.shards[heroId]-=cost;save.stars[heroId]=cur+1;persist();renderHeroes();renderFormation();
 rewardFloat("⭐ "+hero(heroId).name+" agora tem "+(cur+1)+" estrelas!","gold");haptic([20,35,40]);
}
function dailyWorldBossReset(){
 if(save.worldBossDate!==todayKey()){
  save.worldBossDate=todayKey();save.worldBossAttempts=3;save.worldBossBest=0;save.worldBossLast=0;
  save.worldBossTotal=0;save.worldBossRemainingHp=WORLD_BOSS_MAX_HP;persist();
 }
}
function seededDailyNumbers(){
 const seedBase=Number(todayKey().replaceAll("-",""))||1;let x=(seedBase*1103515245+12345)>>>0;
 const rnd=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296};
 return Array.from({length:7},(_,i)=>({name:["AstraBR","KuroRaid","NekoKing","YumeGO","DrakeZero","MikaStar","AkiraGO"][i],damage:Math.round(5500+rnd()*29000)}));
}
function worldBossRanking(){
 const rows=seededDailyNumbers();
 if(save.worldBossBest>0)rows.push({name:"Você",damage:save.worldBossBest,you:true});
 return rows.sort((a,b)=>b.damage-a.damage).slice(0,8);
}
function renderWorldBoss(){
 dailyWorldBossReset();renderResources();
 const remaining=clamp(save.worldBossRemainingHp,0,WORLD_BOSS_MAX_HP),pct=remaining/WORLD_BOSS_MAX_HP*100;
 $("#bossAttemptsBadge").textContent=save.worldBossAttempts+"/3";
 $("#bossPreviewHp").textContent=remaining.toLocaleString("pt-BR")+" / "+WORLD_BOSS_MAX_HP.toLocaleString("pt-BR");
 $("#bossPreviewFill").style.width=pct+"%";
 $("#startWorldBoss").disabled=save.worldBossAttempts<1||remaining<=0||used().length!==5;
 $("#startWorldBoss").textContent=remaining<=0?"✅ Chefe derrotado hoje":save.worldBossAttempts<1?"Sem tentativas hoje":"🐉 Iniciar Raid";
 $("#worldBossRanking").innerHTML=worldBossRanking().map((r,i)=>`<div class="raidRankRow"><div class="pos">#${i+1}</div><div><b>${r.you?"⭐ ":""}${r.name}</b><small>${r.you?"Sua melhor tentativa":"Guilda rival"}</small></div><div class="damage">${r.damage.toLocaleString("pt-BR")}</div></div>`).join("");
}
function beginWorldBossBattle(){
 save.worldBossAttempts--;persist();
 const boss=new Unit(BOSS_HERO,"enemy",SLOTS[0],{level:50,scale:1});
 boss.maxHp=WORLD_BOSS_MAX_HP;boss.hp=save.worldBossRemainingHp;boss.id="enemy_vorak_F1";
 lastBattleMode="boss";landscape();battle=new Battle(playerTeam(),[boss],{mode:"boss",code:"Raid",name:BOSS_HERO.name,damage:0});
 show("battleScreen");$("#battleStageName").textContent="RAID • VORAK";$("#battleLog").innerHTML="";
 battle.log("🐉 Vorak desperta com "+boss.hp.toLocaleString("pt-BR")+" HP restante.");renderBattle();battle.loop();
}
function startWorldBossBattle(){
 dailyWorldBossReset();
 if(used().length!==5)return toast("Monte uma formação com 5 heróis");
 if(save.worldBossAttempts<1)return toast("Sem tentativas de Raid hoje");
 if(save.worldBossRemainingHp<=0)return toast("Vorak já foi derrotado hoje");
 worldBossCutscene(beginWorldBossBattle);
}
function bossRewardFor(damage){
 if(damage>=50000)return{gold:3200,diamonds:160,contribution:120,stones:3};
 if(damage>=25000)return{gold:2200,diamonds:110,contribution:90,stones:2};
 if(damage>=12000)return{gold:1500,diamonds:75,contribution:65,stones:1};
 if(damage>=5000)return{gold:950,diamonds:45,contribution:45,stones:1};
 return{gold:550,diamonds:25,contribution:25,stones:0};
}
function towerScale(floor){return .65+floor*.032}
function towerReward(floor){
 return{
  gold:350+floor*90,
  diamonds:15+Math.floor(floor/5)*20,
  crystals:3+Math.ceil(floor*.7)+(floor%5===0?10:0),
  contribution:8+Math.ceil(floor/3),
  stones:floor%5===0?1+Math.floor(floor/20):0
 };
}
function towerEnemyTeam(floor){
 const ids=Array.from({length:5},(_,i)=>HEROES[(floor*3+i*2)%HEROES.length].id);
 const sc=towerScale(floor),lv=Math.max(1,Math.ceil(floor/2));
 return SLOTS.map((slot,i)=>new Unit(hero(ids[i]),"enemy",slot,{level:lv,scale:sc}));
}
function renderTower(){
 const floor=clamp(save.towerFloor||1,1,TOWER_MAX),completed=save.towerBest>=TOWER_MAX;
 $("#towerTitle").textContent=completed?"Torre concluída • Andar 50":"Andar "+floor;
 $("#towerDesc").textContent=completed?"Você alcançou o topo. O Andar 50 pode ser repetido sem recompensa de primeira conclusão.":"Poder inimigo ×"+towerScale(floor).toFixed(2)+" • primeira conclusão concede recursos raros.";
 const start=Math.max(1,Math.min(floor-1,TOWER_MAX-4));
 $("#towerMilestones").innerHTML=Array.from({length:5},(_,i)=>start+i).filter(x=>x<=TOWER_MAX).map(fl=>{
  const rw=towerReward(fl),cleared=fl<=save.towerBest,current=fl===floor;
  return `<div class="towerFloorCard ${cleared?"cleared":""} ${current?"current":""}"><div class="towerFloorNo">${cleared?"✓":fl}</div><div><b>Andar ${fl}${fl%5===0?" • Elite":""}</b><small>Inimigos Nv.${Math.ceil(fl/2)} • força ×${towerScale(fl).toFixed(2)}</small></div><div class="towerReward">🔷 <strong>+${rw.crystals}</strong>🪙 ${rw.gold}${rw.stones?"<br>🌟 +"+rw.stones:""}</div></div>`;
 }).join("");
 $("#startTower").textContent=completed?"⚔️ Repetir Andar 50":"⚔️ Desafiar Andar "+floor;
 $("#startTower").disabled=used().length!==5;renderResources();
}
function startTowerBattle(){
 if(used().length!==5)return toast("Monte uma formação com 5 heróis");
 const floor=clamp(save.towerFloor||1,1,TOWER_MAX);
 lastBattleMode="tower";landscape();battle=new Battle(playerTeam(),towerEnemyTeam(floor),{mode:"tower",floor,name:"Torre do Abismo"});
 show("battleScreen");$("#battleStageName").textContent="ABISMO • ANDAR "+floor;$("#battleLog").innerHTML="";
 battle.log("🗼 Andar "+floor+" iniciado • força inimiga ×"+towerScale(floor).toFixed(2)+".");renderBattle();battle.loop();
}

function dailyArenaReset(){
 const max=arenaMaxAttempts();
 if(save.arenaDate!==todayKey()){
  save.arenaDate=todayKey();save.arenaAttempts=max;save.arenaDailyPoints=0;save.arenaDailyMax=max;persist();return;
 }
 const oldMax=Number(save.arenaDailyMax)||5;
 if(max>oldMax){save.arenaAttempts+=max-oldMax;save.arenaDailyMax=max;persist()}
 else if(!save.arenaDailyMax)save.arenaDailyMax=max;
}
function arenaTier(){
 const r=save.arenaRating;
 if(r>=1600)return["Diamante","tierDiamond"];if(r>=1350)return["Ouro","tierGold"];if(r>=1150)return["Prata","tierSilver"];return["Bronze","tierBronze"];
}

/* CAMPANHA */
function renderCampaign(){
 const grid=$("#stageGrid");grid.innerHTML="";
 STAGES.forEach(s=>{
  const unlocked=s.id<=save.unlockedStage,sel=s.id===save.selectedStage,b=document.createElement("button");
  b.className="stageCard"+(!unlocked?" locked":"")+(sel?" selected":"");b.disabled=!unlocked;
  b.innerHTML=`<div class="stageNode">${unlocked?s.code:"🔒"}</div><div class="stageInfo"><b>Fase ${s.code} • ${s.name}</b><small>Inimigos Nv.${s.enemyLevel} • ${s.power}<br>🪙${s.rewards.gold} • ⭐${s.rewards.exp} • 💎${s.rewards.diamonds} • 🎁 Equipamento</small></div><div class="stagePower"><strong>${unlocked?"JOGAR":"BLOQUEADA"}</strong><span>Força ×${s.scale.toFixed(2)}</span></div>`;
  b.onclick=()=>{save.selectedStage=s.id;persist();renderCampaign();renderFormation();show("formationScreen")};grid.appendChild(b);
 });
}

/* FORMAÇÃO */
function renderFormation(){
 const stg=stage(),info=$("#formationStageInfo");
 info.innerHTML=`<div><b>🗺️ Fase ${stg.code} • ${stg.name}</b><br><span>Inimigos Nv.${stg.enemyLevel} • ${stg.power}</span></div><div class="badge">×${stg.scale.toFixed(2)}</div>`;
 const board=$("#formationBoard");board.innerHTML="";
 SLOTS.forEach(slot=>{
  const h=formation[slot.id]?hero(formation[slot.id]):null,e=document.createElement("button");
  e.className="slot "+slot.line+(activeSlot===slot.id?" selected":"")+(h?" filled":"");e.dataset.slot=slot.id;
  e.innerHTML=h?`<span class="emoji">${h.emoji}</span><b>${h.name}</b><em>Nv.${save.heroLevels[h.id]} • ${affinityOf(h.id).factionName}</em>`:`<span class="emoji">＋</span><b>${slot.label}</b><em>${slot.line==="front"?"Front-line":"Back-line"}</em>`;
  e.onclick=()=>{activeSlot=slot.id;renderFormation()};board.appendChild(e);
 });
 const roster=$("#roster");roster.innerHTML="";
 HEROES.filter(h=>save.owned[h.id]).forEach(h=>{
  const st=heroStats(h),a=affinityOf(h.id),e=document.createElement("button");e.className="rosterCard"+(used().includes(h.id)?" used":"");
  e.innerHTML=`<div class="rosterHead"><span class="avatar">${h.emoji}</span><div><b>${h.name}</b><div class="meta">Nv.${st.level} • ${h.role} • SPD ${st.sp}</div><span class="factionTag ${a.faction}">${a.icon} ${a.factionName} • ${a.element}</span></div></div><div class="rosterStats"><span>HP ${st.hp}</span><span>ATQ ${Math.max(st.pa,st.ma)}</span><span>DEF ${Math.max(st.pd,st.md)}</span></div>`;
  e.onclick=()=>{Object.keys(formation).forEach(k=>{if(formation[k]===h.id)formation[k]=null});formation[activeSlot]=h.id;const i=SLOTS.findIndex(x=>x.id===activeSlot);activeSlot=SLOTS[Math.min(i+1,4)].id;persist();renderFormation()};roster.appendChild(e);
 });
 $("#selectedCount").textContent=used().length;$("#startBattle").disabled=used().length!==5;renderSynergyPanel();
}

/* HERÓIS / EQUIPAMENTOS */
function bonusText(g){return Object.entries(g.bonus).map(([k,v])=>({hp:"HP",pa:"ATQ F",ma:"ATQ M",pd:"DEF F",md:"DEF M",sp:"SPD"}[k]+" +"+v)).join(" • ")}
function rarityClass(r){return r==="Épico"?"gearEpic":r==="Raro"?"gearRare":""}
function renderHeroes(){
 const grid=$("#heroManageGrid");grid.innerHTML="";
 HEROES.forEach(h=>{
  const own=save.owned[h.id],st=heroStats(h),e=document.createElement("button");
  e.className="heroManageCard"+(selectedHero===h.id?" selected":"")+(!own?" locked":"");
  e.innerHTML=`<div class="heroManageTop"><span class="heroManageEmoji">${own?h.emoji:"❔"}</span><div><div class="heroManageName">${h.name}</div><div class="heroManageMeta">${h.role} • ${own?"Nv."+st.level:"Não obtido"} • ${affinityOf(h.id).element}</div></div></div><div class="heroManageBars"><span>HP ${own?st.hp:"—"}</span><span>ATQ ${own?Math.max(st.pa,st.ma):"—"}</span></div><div class="heroOwnership">${own?starString(st.stars)+" • 🧩 "+(save.shards[h.id]||0):"🔒 Invoque no Portal"}</div>`;
  e.onclick=()=>{selectedHero=h.id;renderHeroes()};grid.appendChild(e);
 });
 const h=hero(selectedHero),own=save.owned[h.id],st=heroStats(h),cost=levelCost(h.id),max=st.level>=20;
 if(!own){
  $("#heroDetail").innerHTML=`<div class="heroDetailHeader"><div class="heroDetailAvatar">❔</div><div class="heroDetailTitle"><h2>${h.name}</h2><p>${h.role} • ainda não obtido</p></div></div><div class="levelPanel"><p class="small">Este herói pode ser obtido no Portal de Invocação. Duplicatas futuras serão convertidas em Fragmentos.</p><button class="btn portalBtn" id="heroToPortal" style="width:100%">🔮 Ir ao Portal</button></div>`;
  $("#heroToPortal").onclick=()=>{renderPortal();show("portalScreen")};return;
 }
 const eq=save.equipment[h.id];
 const equipHtml=Object.keys(SLOT_NAMES).map(slot=>{
  const gid=eq[slot],g=gid?GEAR[gid]:null;
  return `<div class="equipSlot"><div class="equipSlotTitle">${SLOT_NAMES[slot]}</div><b class="${g?rarityClass(g.rarity):""}">${g?g.icon+" "+g.name:"Vazio"}</b><small>${g?bonusText(g):"Sem bônus"}</small>${g?`<button class="btn ghost unequipBtn" data-slot="${slot}">Remover</button>`:""}</div>`;
 }).join("");
 const inv=Object.entries(save.gearInventory).filter(([,q])=>q>0).map(([gid,q])=>({g:GEAR[gid],q})).filter(x=>x.g);
 const invHtml=inv.length?inv.map(({g,q})=>`<div class="gearRow"><div class="gearIcon">${g.icon}</div><div><b class="${rarityClass(g.rarity)}">${g.name} ×${q}</b><small>${SLOT_NAMES[g.slot]} • ${bonusText(g)}</small></div><button class="btn equipBtn" data-gear="${g.id}">Equipar</button></div>`).join(""):'<div class="small">Nenhum equipamento no inventário. Vença fases ou visite a Loja.</div>';
 const stars=st.stars,starCost=stars<5?STAR_COST[stars]:0,have=save.shards[h.id]||0,starPct=stars>=5?100:Math.min(100,have/starCost*100);
 $("#heroDetail").innerHTML=`<div class="heroDetailHeader"><div class="heroDetailAvatar">${h.emoji}</div><div class="heroDetailTitle"><h2>${h.name}</h2><p>${h.role} • ${h.line==="front"?"Front-line":"Back-line"} • ${h.type==="magic"?"Mágico":"Físico"}</p><div class="heroAffinityLine"><span class="factionTag ${affinityOf(h.id).faction}">${affinityOf(h.id).icon} ${affinityOf(h.id).factionName}</span><span class="factionTag">${affinityOf(h.id).element}</span></div><div class="starLine">${starString(stars)}</div><div class="awakenMini">🌟 Despertar ${save.awakening[h.id]||0}/${AWAKEN_MAX}</div></div></div>
 <div class="heroStatGrid"><div class="heroStat"><span>HP Máximo</span><b>${st.hp}</b></div><div class="heroStat"><span>Velocidade</span><b>${st.sp}</b></div><div class="heroStat"><span>ATQ Físico</span><b>${st.pa}</b></div><div class="heroStat"><span>ATQ Mágico</span><b>${st.ma}</b></div><div class="heroStat"><span>DEF Física</span><b>${st.pd}</b></div><div class="heroStat"><span>DEF Mágica</span><b>${st.md}</b></div></div>
 <div class="starPanel"><div class="starPanelTop"><b>⭐ Evolução de Estrelas</b><span>${stars}/5</span></div><div class="starProgress"><i style="width:${starPct}%"></i></div><button id="starUpBtn" class="btn gold" ${stars>=5||have<starCost?"disabled":""}>${stars>=5?"5★ MÁXIMO":"Evoluir para "+(stars+1)+"★ • 🧩 "+starCost}</button><div class="starBonus">${stars>=5?"Atributos base no multiplicador máximo ×2,00":"Próximo multiplicador: ×"+STAR_MULT[stars+1].toFixed(2)} • Fragmentos: ${have}</div></div>
 <button id="heroAwakenShortcut" class="btn awakenBtn" style="width:100%;margin-top:9px">🌟 Talentos e Despertar</button><div class="levelPanel"><div class="levelProgress"><b>Nível ${st.level}${max?" • MÁXIMO":""}</b><span>🪙 ${save.gold}</span></div><button id="levelUpBtn" class="btn primary levelUpBtn" ${max||save.gold<cost?"disabled":""}>${max?"Nível máximo":"⬆ Subir de Nível • 🪙 "+cost}</button><button id="usePotionBtn" class="btn ghost levelUpBtn" style="margin-top:6px" ${max||save.potions<1?"disabled":""}>🧪 Usar Poção de Treino (${save.potions})</button><div class="shardLine">Ultimate: <b>${h.ult.name}</b></div></div>
 <div class="equipPanel"><h3>Equipamentos</h3><div class="equipGrid">${equipHtml}</div><div class="inventoryTitle">Inventário de equipamentos</div><div class="gearInventory">${invHtml}</div></div>`;
 $("#starUpBtn").onclick=()=>starUp(h.id);$("#heroAwakenShortcut").onclick=()=>{selectedAwakeningHero=h.id;renderAwakening();show("awakeningScreen")};$("#levelUpBtn").onclick=()=>levelUp(h.id);$("#usePotionBtn").onclick=()=>usePotion(h.id);
 $$(".unequipBtn").forEach(b=>b.onclick=()=>unequip(h.id,b.dataset.slot));
 $$(".equipBtn").forEach(b=>b.onclick=()=>equip(h.id,b.dataset.gear));
}
function levelUp(id){
 const lv=save.heroLevels[id]||1,cost=levelCost(id);if(lv>=20||save.gold<cost)return;
 save.gold-=cost;save.heroLevels[id]=lv+1;trackEvent("levelUps",1);renderHeroes();renderFormation();toast("⬆ "+hero(id).name+" subiu para Nv."+(lv+1));
}
function usePotion(id){
 if(save.potions<1||(save.heroLevels[id]||1)>=20)return;
 save.potions--;save.heroLevels[id]++;trackEvent("levelUps",1);renderHeroes();renderFormation();toast("🧪 Nível aumentado com Poção");
}
function equip(heroId,gearId){
 const g=GEAR[gearId];if(!g||(save.gearInventory[gearId]||0)<1)return;
 const slot=g.slot,old=save.equipment[heroId][slot];if(old)addGear(old,1);
 save.gearInventory[gearId]--;save.equipment[heroId][slot]=gearId;persist();renderHeroes();renderFormation();toast(g.icon+" "+g.name+" equipado");
}
function unequip(heroId,slot){const gid=save.equipment[heroId][slot];if(!gid)return;addGear(gid,1);save.equipment[heroId][slot]=null;persist();renderHeroes();renderFormation();toast("Equipamento removido")}

/* PORTAL */
function renderPortal(){
 renderResources();
 const end=save.limitedEventEnd||(save.limitedEventEnd=Date.now()+7*24*60*60*1000);
 const left=Math.max(0,end-Date.now()),d=Math.floor(left/86400000),h=Math.floor((left%86400000)/3600000);
 if($("#eventDays"))$("#eventDays").textContent=d+"d "+h+"h";
 if($("#portalVipLevel"))$("#portalVipLevel").textContent=vipLevel();
}
function rollBannerHero(type="standard"){
 if(type!=="event")return HEROES[Math.floor(Math.random()*HEROES.length)];
 const pool=[...HEROES,hero(LIMITED_HERO_ID)];
 return pool[Math.floor(Math.random()*pool.length)];
}
function summonFromBanner(count,type="standard"){
 const price=type==="event"?(count===1?250:2200):(count===1?200:1800);
 if(type==="standard"&&count===1&&save.scrolls>0)save.scrolls--;
 else if(!spendDiamonds(price,type==="event"?"Banner limitado":"Invocação padrão"))return toast("Diamantes insuficientes");
 const results=[];
 for(let n=0;n<count;n++){
  const h=rollBannerHero(type),isNew=!save.owned[h.id];
  if(isNew)save.owned[h.id]=true;else save.shards[h.id]=(save.shards[h.id]||0)+20;
  results.push({h,isNew,featured:type==="event"&&h.id===LIMITED_HERO_ID});
 }
 trackEvent("summons",count);persist();renderSummonResults(results);renderHeroes();renderFormation();renderMissions("daily");renderPortal();renderVip();
}
function summon(count){summonFromBanner(count,"standard")}
function renderSummonResults(results){
 const root=$("#summonResults");if(!root)return;
 root.innerHTML=results.map(x=>'<div class="summonCard '+(x.isNew?'new':'')+' '+(x.featured?'featured':'')+'"><div class="bigEmoji">'+x.h.emoji+'</div><b>'+x.h.name+'</b><span>'+x.h.role+'</span><div class="newTag">'+(x.featured?'✨ DESTAQUE • ':'')+(x.isNew?'NOVO HERÓI':'DUPLICATA • +20 🧩')+'</div></div>').join("");
}

/* ARENA */
const ARENA_NAMES=["KitsuneBR","MagoPixel","AkiraGO","NekoBlade","OtakuPrime","YumiX","DrakeZero","LunaRaid","KaitoBR"];
function generateArenaOpponents(){
 dailyArenaReset();arenaOpponents=[];
 const offsets=[-55,10,75];
 offsets.forEach((off,i)=>{
  const ids=[...HEROES].sort(()=>Math.random()-.5).slice(0,5).map(h=>h.id);
  const rating=Math.max(850,save.arenaRating+off+Math.floor(Math.random()*31)-15);
  arenaOpponents.push({id:"opp"+i,name:ARENA_NAMES[Math.floor(Math.random()*ARENA_NAMES.length)],rating,level:Math.max(1,Math.floor((rating-800)/170)),scale:.72+rating/5000,heroes:ids});
 });
}
function renderArena(){
 dailyArenaReset();if(!arenaOpponents.length)generateArenaOpponents();
 const [tier,cls]=arenaTier();$("#arenaTierBadge").textContent=tier;$("#arenaTierBadge").className="badge "+cls;$("#arenaRankTitle").textContent=tier+" • Hoje +"+save.arenaDailyPoints;$("#arenaAttempts").textContent=save.arenaAttempts;if($("#arenaMaxAttempts"))$("#arenaMaxAttempts").textContent=arenaMaxAttempts();
 $("#arenaOpponents").innerHTML=arenaOpponents.map(o=>`<div class="opponentCard"><div class="opponentTop"><div class="opponentName"><b>${o.name}</b><span>Formação IA • Nv. médio ${o.level}</span></div><div class="opponentRating"><b>🏆 ${o.rating}</b><span>Rating</span></div></div><div class="opponentTeam">${o.heroes.map(id=>`<span class="opponentUnit">${hero(id).emoji}</span>`).join("")}</div><button class="btn arenaBtn duelBtn" data-id="${o.id}" ${save.arenaAttempts<1?"disabled":""}>⚔️ Desafiar</button></div>`).join("");
 $$(".duelBtn").forEach(b=>b.onclick=()=>startArenaBattle(arenaOpponents.find(o=>o.id===b.dataset.id)));
 renderResources();
}
function startArenaBattle(o){
 if(!o||save.arenaAttempts<1)return toast("Sem tentativas de Arena hoje");
 if(used().length!==5)return toast("Monte uma formação com 5 heróis");
 save.arenaAttempts--;persist();
 const enemyMap=Object.fromEntries(SLOTS.map((s,i)=>[s.id,o.heroes[i]]));
 const enemies=SLOTS.map(s=>new Unit(hero(enemyMap[s.id]),"enemy",s,{level:o.level,scale:o.scale}));
 lastBattleMode="arena";landscape();battle=new Battle(playerTeam(),enemies,{mode:"arena",code:"Arena",name:o.name,opponent:o});
 show("battleScreen");$("#battleStageName").textContent="ARENA • "+o.name;$("#battleLog").innerHTML="";battle.log("🏟️ Duelo de Arena iniciado contra "+o.name+".");renderBattle();battle.loop();
}

/* LOJA */
function renderShop(){
 $("#shopGrid").innerHTML=SHOP.map(x=>`<div class="shopItem"><div class="shopIcon">${x.icon}</div><h3>${x.name}</h3><p>${x.desc}</p><div class="shopPrice">${currencyIcon(x.currency)} ${x.price}</div><button class="btn buyBtn" data-id="${x.id}" ${save[x.currency]<x.price?"disabled":""}>Comprar</button></div>`).join("");
 $$(".buyBtn").forEach(b=>b.onclick=()=>buyShop(b.dataset.id));renderResources();
}
function buyShop(id){
 const x=SHOP.find(a=>a.id===id);if(!x||save[x.currency]<x.price)return toast("Saldo insuficiente");
 if(x.currency==="diamonds"){if(!spendDiamonds(x.price,"Loja"))return toast("Saldo insuficiente")}else save[x.currency]-=x.price;
 if(x.type==="potion")save.potions+=(x.qty||1);
 if(x.type==="gear")addGear(x.gear,1);
 if(x.type==="shard")save.shards[x.hero]=(save.shards[x.hero]||0)+(x.qty||1);
 if(x.type==="scroll")save.scrolls+=(x.qty||1);
 persist();renderShop();renderHeroes();renderVip();toast("🛒 Compra realizada: "+x.name);
}

/* COMBATE */
class Unit{
 constructor(h,team,slot,opt={}){
  const enemy=team==="enemy",lv=opt.level||1,scale=opt.scale||1,st=enemy?{hp:Math.round(h.hp*scale),pa:Math.round(h.pa*scale),ma:Math.round(h.ma*scale),pd:Math.round(h.pd*scale),md:Math.round(h.md*scale),sp:Math.round(h.sp*(.94+scale*.06)),cr:h.cr*.65,dg:h.dg*.60}:heroStats(h);
  Object.assign(this,{
   h,team,slot,level:enemy?lv:st.level,id:team+"_"+h.id+"_"+slot.id,name:h.name,emoji:h.emoji,role:h.role,style:h.style,type:h.type,
   maxHp:st.hp,pa:st.pa,ma:st.ma,basePd:st.pd,baseMd:st.md,baseSp:st.sp,cr:st.cr,dg:st.dg,hp:st.hp,rage:0,dead:false,
   shield:0,bleed:0,freeze:0,stun:0,slow:0,haste:0,broken:0,queued:false,readyAlerted:false,
   atkBuff:0,atkBuffRounds:0,critImmunity:0,awakening:enemy?0:(save.awakening[h.id]||0)
  });
 }
 get line(){return this.slot.line}
 get sp(){return Math.max(1,Math.round(this.baseSp*(1-this.slow+this.haste)))}
 get pd(){return Math.max(0,Math.round(this.basePd*(this.line==="front"?1.15:1)*(1-this.broken)))}
 get md(){return Math.max(0,Math.round(this.baseMd*(this.line==="front"?1.10:1)))}
 gain(v){if(!this.dead)this.rage=clamp(this.rage+v,0,100)}
}
class Battle{
 constructor(p,e,context){this.p=p;this.e=e;this.context=context;this.synergy=p.synergy||null;this.round=0;this.q=[];this.i=0;this.current=null;this.target=null;this.speed=1;this.paused=false;this.mode="manual";this.ended=false;this.logN=0;this.synergyLogged=false}
 living(a){return a.filter(x=>!x.dead)}enemies(u){return u.team==="player"?this.e:this.p}allies(u){return u.team==="player"?this.p:this.e}
 log(t,c=""){const x=document.createElement("div");x.className=c;x.textContent=String(++this.logN).padStart(2,"0")+" • "+t;$("#battleLog").appendChild(x);$("#battleLog").scrollTop=$("#battleLog").scrollHeight}
 async delay(ms=1750){let left=ms/this.speed,last=performance.now();while(left>0&&!this.ended){await new Promise(r=>setTimeout(r,50));if(this.paused){last=performance.now();continue}const n=performance.now();left-=n-last;last=n}}
 roundStart(){
  this.round++;
  [...this.p,...this.e].forEach(u=>{
   if(u.dead)return;
   if(u.bleed){u.bleed--;const d=Math.round(u.maxHp*.03);u.hp=Math.max(0,u.hp-d);this.log("🩸 "+u.name+" sofreu "+d+" de sangramento.");if(!u.hp)this.kill(u,null)}
   if(u.atkBuffRounds>0){u.atkBuffRounds--;if(u.atkBuffRounds<=0)u.atkBuff=0}
   u.slow=Math.max(0,u.slow-.06);u.haste=Math.max(0,u.haste-.06);u.broken=Math.max(0,u.broken-.08);u.shield=Math.max(0,u.shield-.08)
  });
  this.q=[...this.living(this.p),...this.living(this.e)].sort((a,b)=>b.sp-a.sp||a.name.localeCompare(b.name));this.i=0;
  this.log("🔄 Rodada "+this.round+": iniciativa recalculada por Speed.","round");renderBattle();
 }
 valid(u){const a=this.living(this.enemies(u));if(u.style==="melee"){const f=a.filter(x=>x.line==="front");if(f.length)return f}return a}
 targetFor(u){const a=this.valid(u);if(!a.length)return null;let total=a.reduce((sum,x)=>sum+(x.line==="front"?1.8:.65),0),r=Math.random()*total;for(const x of a){r-=x.line==="front"?1.8:.65;if(r<=0)return x}return a[0]}
 weak(a){return this.living(a).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0]}
 damage(a,t,type,ratio,opt={}){
  if(!t||t.dead)return;
  if(!opt.noDodge&&Math.random()<t.dg){this.log("💨 "+t.name+" esquivou.","dodge");renderBattle();requestAnimationFrame(()=>{float(t,"ESQUIVA!","dodge",-8);fxCard(t,"dodgeFx")});AudioEngine.fallbackTone(760,.05,.02);haptic(8);return}
  const rawAtk=type==="magic"?a.ma:a.pa,atk=rawAtk*(1+(a.atkBuff||0)),def=opt.pierce?0:(type==="magic"?t.md:t.pd),mit=def/(def+600);
  let n=atk*ratio*(.94+Math.random()*.12)*(1-mit);if(t.shield)n*=1-t.shield;
  let crit=Math.random()<a.cr;
  if(crit&&t.critImmunity>0){t.critImmunity--;crit=false;this.log("☀️ Aura protegeu "+t.name+" do primeiro crítico.","ultimate");renderBattle();requestAnimationFrame(()=>float(t,"CRÍTICO ANULADO","critText",-18))}
  if(crit)n*=1.5;n=Math.max(1,Math.round(n));
  const before=t.hp,actual=Math.min(before,n);t.hp=Math.max(0,t.hp-n);a.gain(25);t.gain(15);
  if(this.context.mode==="boss"&&a.team==="player"&&t.h.id==="vorak")this.context.damage=(this.context.damage||0)+actual;
  this.log((opt.ult?"💥 ULTIMATE • ":"")+(crit?"💢 CRÍTICO • ":"")+a.name+" causou "+n+" em "+t.name+".",opt.ult?"ultimate":crit?"crit":"");
  if(!t.hp)this.kill(t,a);renderBattle();
  requestAnimationFrame(()=>{float(t,"-"+n,opt.ult?"ult":"damage",10);if(crit)float(t,"CRÍTICO!","critText",-18);fxCard(t,(crit||opt.ult||n>t.maxHp*.22)?"hitHard":"hitLight")});
  AudioEngine.sfx("impact");if(crit||opt.ult)haptic(crit?[18,22,30]:[12,18,12]);
 }
 kill(t,k){if(t.dead)return;t.dead=true;t.hp=0;if(k)k.gain(25);this.log("☠️ "+t.name+" foi derrotado.","death")}
 heal(a,t,r){if(!t||t.dead)return;const n=Math.min(t.maxHp-t.hp,Math.round(Math.max(a.ma,a.pa*.55)*r));t.hp+=n;this.log("💚 "+a.name+" curou "+t.name+" em "+n+" HP.");renderBattle();requestAnimationFrame(()=>float(t,"+"+n,"heal"))}
 async basic(u){const t=this.targetFor(u);if(!t)return;this.target=t;this.log("⚔️ "+u.name+" ataca "+t.name+".");renderBattle();await this.delay(650);this.damage(u,t,u.type,1)}
 async ult(u){
  if(u.rage<100||u.dead)return;
  u.rage=0;u.readyAlerted=false;u.queued=false;
  const z=u.h.ult,aw=u.awakening||0,ratio=z.ratio*(1+aw*.08);
  banner(u.emoji+" "+z.name+"!");this.log("━━━━━━━━ 💥 ULTIMATE • "+u.name+" usa "+z.name+(aw?" • Despertar "+aw:"")+"! ━━━━━━━━","ultimate");
  AudioEngine.sfx("ultimate");renderBattle();requestAnimationFrame(()=>{fxCard(u,"ultimateCast");fxUltimateScreen();haptic([20,25,45])});await this.delay(900);

  if(z.kind==="heal"){
   this.living(this.allies(u)).forEach(t=>this.heal(u,t,ratio));
   if(z.effect==="shield")this.living(this.allies(u)).forEach(t=>t.shield=Math.max(t.shield,.32+aw*.025));
  }else if(z.kind==="single"){
   const t=this.weak(this.enemies(u));let r=ratio;
   if(z.effect==="execute"&&t){const threshold=.35+(aw>=2?.10:0)+(aw>=5?.10:0);if(t.hp/t.maxHp<threshold)r*=1.35}
   this.damage(u,t,u.type,r,{ult:true,noDodge:true});
  }else if(z.kind==="multi"){
   const extra=(aw>=1?1:0)+(aw>=3?1:0)+(aw>=5?1:0);
   for(let i=0;i<(z.hits||5)+extra;i++){const t=this.weak(this.enemies(u));if(!t)break;this.damage(u,t,u.type,ratio,{ult:true,noDodge:true});await this.delay(220)}
  }else{
   const typ=z.kind==="aoeMagic"?"magic":u.type;
   for(const t of [...this.living(this.enemies(u))]){this.damage(u,t,typ,ratio,{ult:true,noDodge:true,pierce:z.effect==="pierce"});await this.delay(220)}
  }

  if(z.effect==="bleed")this.living(this.enemies(u)).forEach(t=>t.bleed=Math.max(t.bleed,3+(u.h.id==="espinho"&&aw>=1?1:0)+(u.h.id==="espinho"&&aw>=5?1:0)));
  if(z.effect==="break")this.living(this.enemies(u)).forEach(t=>t.broken=Math.max(t.broken,.30));
  if(z.effect==="slow")this.living(this.enemies(u)).forEach(t=>t.slow=Math.max(t.slow,.22+(u.h.id==="crepusculo"&&aw>=2?.08:0)));
  if(z.effect==="freeze"){const count=u.h.id==="valquiria"&&aw>=5?99:u.h.id==="valquiria"&&aw>=1?3:2;this.living(this.enemies(u)).slice(0,count).forEach(t=>t.freeze=1)}
  if(z.effect==="shield")this.living(this.allies(u)).forEach(t=>t.shield=Math.max(t.shield,.42+aw*.025));
  if(z.effect==="haste")this.living(this.allies(u)).forEach(t=>t.haste=Math.max(t.haste,.20+aw*.025));

  if(aw>0&&u.h.id==="seraphina"){
   const boost=.10+(aw>=3?.03:0)+(aw>=5?.05:0);this.living(this.allies(u)).forEach(t=>{t.atkBuff=Math.max(t.atkBuff,boost);t.atkBuffRounds=2});this.log("☀️ Despertar: equipa recebe +"+Math.round(boost*100)+"% ATQ.","ultimate");
  }
  if(aw>0&&u.h.id==="quebra"){
   const targets=this.living(this.enemies(u)).slice(0,aw>=2?2:1);targets.forEach((t,i)=>t.stun=Math.max(t.stun,aw>=5&&i===0?2:1));this.log("🔨 Despertar: impacto causa Atordoamento.","ultimate");
  }
  if(aw>0&&u.h.id==="crepusculo"){const drain=aw>=3?20:10;this.living(this.enemies(u)).forEach(t=>t.rage=Math.max(0,t.rage-drain));this.log("🌘 Despertar: "+drain+" Rage drenada dos inimigos.","ultimate")}
  if(aw>=3&&u.h.id==="relampago")u.gain(20);
  if(aw>0&&u.h.id==="terra"){
   const pct=aw>=4?.08:.05;this.living(this.allies(u)).forEach(t=>{const n=Math.round(t.maxHp*pct);t.hp=Math.min(t.maxHp,t.hp+n)});this.log("🌿 Despertar: Fortaleza restaura "+Math.round(pct*100)+"% HP.","ultimate");
  }
  if(aw>0&&u.h.id==="anao"){const br=aw>=5?.35:aw>=2?.25:.18;this.living(this.enemies(u)).forEach(t=>t.broken=Math.max(t.broken,br));this.log("💣 Despertar: armaduras inimigas foram quebradas.","ultimate")}
  if(aw>0&&u.h.id==="fada"){const rg=aw>=4?25:15;this.living(this.allies(u)).forEach(t=>t.gain(rg));this.log("🧚 Despertar: aliados recebem +"+rg+" Rage.","ultimate")}
  renderBattle();
 }
 check(){const p=this.living(this.p).length,e=this.living(this.e).length;if(p&&e)return false;if(this.ended)return true;this.ended=true;setTimeout(()=>finishBattle(!!p,this.context),250);return true}
 async loop(){
  if(this.synergy?.active&&!this.synergyLogged){this.synergyLogged=true;this.log("✨ Aura "+this.synergy.name+" ativa: "+this.synergy.label+".","ultimate")}
  this.roundStart();
  while(!this.ended){
   if(this.paused){await this.delay(100);continue}
   if(this.check())break;
   if(this.mode==="auto"){const r=this.living(this.p).find(x=>x.rage>=100);if(r){await this.ult(r);await this.delay(1750);continue}}
   if(this.i>=this.q.length){this.roundStart();await this.delay(1000);continue}
   const u=this.q[this.i++];if(u.dead)continue;this.current=u;this.target=null;$("#actionLabel").textContent="Vez de "+u.name;renderBattle();
   if(u.stun){u.stun--;this.log("💫 "+u.name+" está atordoado e perde a ação.");await this.delay(1750)}
   else if(u.freeze){u.freeze--;this.log("❄️ "+u.name+" está congelado e perde a ação.");await this.delay(1750)}
   else if(u.team==="enemy"&&u.rage>=100)await this.ult(u);
   else if(u.team==="player"&&this.mode==="manual"&&u.queued&&u.rage>=100)await this.ult(u);
   else await this.basic(u);
   this.current=null;this.target=null;renderBattle();if(this.check())break;await this.delay(1750);
  }
 }
}

function playerTeam(){
 const units=SLOTS.map(slot=>new Unit(hero(formation[slot.id]),"player",slot));
 return applySynergy(units,computeSynergy(used()));
}
function campaignEnemyFormation(stg){const comps=[["terra","espinho","crepusculo","anao","fada"],["quebra","valquiria","umbra","crepusculo","seraphina"],["terra","relampago","espinho","anao","fada"],["quebra","valquiria","relampago","crepusculo","umbra"],["terra","quebra","valquiria","crepusculo","relampago"]];const ids=comps[stg.id-1]||comps[0];return Object.fromEntries(SLOTS.map((slot,i)=>[slot.id,ids[i]]))}
function campaignEnemyTeam(stg){const form=campaignEnemyFormation(stg);return SLOTS.map(slot=>new Unit(hero(form[slot.id]),"enemy",slot,{level:stg.enemyLevel,scale:stg.scale}))}
async function landscape(){try{await screen.orientation?.lock?.("landscape")}catch{}}
function beginCampaignBattle(stg){
 lastBattleMode="campaign";landscape();battle=new Battle(playerTeam(),campaignEnemyTeam(stg),{mode:"campaign",...stg});
 show("battleScreen");$("#battleStageName").textContent="FASE "+stg.code;$("#battleLog").innerHTML="";
 battle.log("⚔️ Fase "+stg.code+" iniciada • Inimigos Nv."+stg.enemyLevel+".");renderBattle();battle.loop();
}
function startBattle(){
 if(used().length!==5)return;
 const stg=stage();campaignCutscene(stg,()=>beginCampaignBattle(stg));
}
function quick(){if(used().length!==5){renderFormation();show("formationScreen");return}startBattle()}
function pos(u){if(u.h.id==="vorak")return"right:18%;top:27%;";const p=POS[u.slot.id];return u.team==="player"?"left:"+p.x+"%;top:"+p.y+"%;":"right:"+p.x+"%;top:"+p.y+"%;"}
function card(u){
 const hp=clamp(u.hp/u.maxHp*100,0,100),r=clamp(u.rage,0,100),ready=r>=100&&!u.dead,st=(u.shield?"🛡️":"")+(u.bleed?"🩸":"")+(u.freeze?"❄️":"")+(u.stun?"💫":"")+(u.atkBuff?"⚔️":"")+(u.slow?"🐌":"")+(u.broken?"🔨":"");
 const bossCls=u.h.id==="vorak"?" worldBossCard":"";
 return `<div class="combatCard ${u.team}${bossCls}${battle.current===u?" active":""}${battle.target===u?" targeted":""}${u.dead?" dead":""}" data-card="${u.id}" style="${pos(u)}"><div class="ccTop"><span class="lineTag ${u.line}">${u.h.id==="vorak"?"WORLD BOSS":u.line==="front"?"FRONT-LINE":"BACK-LINE"}</span><span class="ccLevel">Nv.${u.level}</span><span class="statusIcons">${st}</span></div><div class="ccHero"><div class="ccAvatar">${u.emoji}</div><div class="ccIdentity"><div class="ccName">${u.name}</div><div class="ccRole">${u.role} • SPD ${u.sp}</div></div></div><div class="barMeta"><span>HP</span><b>${Math.ceil(u.hp).toLocaleString("pt-BR")}/${u.maxHp.toLocaleString("pt-BR")}</b></div><div class="bar hp"><i style="width:${hp}%"></i></div><div class="barMeta"><span>RAGE</span><b>${Math.floor(r)}/100</b></div><div class="bar rage"><i style="width:${r}%"></i></div>${u.team==="player"?`<button class="ultBtn ${ready?"ready":""}${u.queued?" queued":""}" data-uid="${u.id}" ${(!ready||battle.mode==="auto"||u.dead)?"disabled":""}>${battle.mode==="auto"?"AUTO":u.queued?"ULTIMATE ARMADA":"ULTIMATE"}</button>`:`<div class="enemyAuto">${ready?"💥 ULTIMATE PRONTA":"ULTIMATE AUTO"}</div>`}</div>`;
}
function renderBattle(){
 if(!battle)return;
 ["playerArea","enemyArea"].forEach(id=>$("#"+id).querySelectorAll(".combatCard").forEach(x=>x.remove()));
 battle.e.forEach(u=>$("#enemyArea").insertAdjacentHTML("beforeend",card(u)));battle.p.forEach(u=>$("#playerArea").insertAdjacentHTML("beforeend",card(u)));
 $(".ultBtn[data-uid]").forEach(b=>b.onclick=()=>{const u=battle.p.find(x=>x.id===b.dataset.uid);if(u&&u.rage>=100){u.queued=!u.queued;battle.log((u.queued?"⏳ ":"↩️ ")+u.name+(u.queued?": Ultimate armada.":": Ultimate cancelada."),"ultimate");renderBattle()}}); battle.p.forEach(u=>{if(u.rage>=100&&!u.dead&&!u.readyAlerted){u.readyAlerted=true;AudioEngine.sfx("ultimateReady");haptic(10)}if(u.rage<100)u.readyAlerted=false});
 $("#roundLabel").textContent="Rodada "+(battle.round||1);$("#modeBtn").textContent="ULT: "+battle.mode.toUpperCase();$("#modeBtn").classList.toggle("active",battle.mode==="auto");
 $("#speed1").classList.toggle("active",battle.speed===1);$("#speed2").classList.toggle("active",battle.speed===2);$("#pauseBtn").classList.toggle("active",battle.paused);
 $("#pauseBtn").textContent=battle.paused?"▶ CONTINUAR":"Ⅱ PAUSA";$("#battleState").textContent=battle.paused?"PAUSADO":battle.ended?"FINALIZADO":"EM BATALHA";
 $("#turnOrder").innerHTML=battle.q.map((u,i)=>`<span class="turnChip${i<battle.i?" done":""}${battle.current===u?" current":""}">${u.emoji} ${u.name.split(" ")[0]} <b>${u.sp}</b></span>`).join(""); const aura=$("#teamAuraLabel");if(aura)aura.textContent=battle.synergy?.active?("✨ "+battle.synergy.name+" "+battle.synergy.count+"/5"):"SEM AURA";
 const bossMode=battle.context.mode==="boss",hud=$("#bossRaidHud");hud.classList.toggle("show",bossMode);
 if(bossMode){
  const b=battle.e[0],pct=clamp(b.hp/b.maxHp*100,0,100);
  $("#bossRaidBarFill").style.width=pct+"%";$("#bossRaidHp").textContent=Math.ceil(b.hp).toLocaleString("pt-BR")+" / "+b.maxHp.toLocaleString("pt-BR");
  $("#bossRaidDamage").textContent="DANO "+Math.round(battle.context.damage||0).toLocaleString("pt-BR");$("#bossRaidRound").textContent="Rodada "+(battle.round||1);
 }
}
function float(u,t,c,offset=0){const e=document.querySelector('[data-card="'+u.id+'"]');if(!e)return;const a=$("#arena").getBoundingClientRect(),r=e.getBoundingClientRect(),d=document.createElement("div");d.className="floatText "+c;d.textContent=t;d.style.left=(r.left-a.left+r.width/2)+"px";d.style.top=(r.top-a.top+20+offset)+"px";$("#arena").appendChild(d);setTimeout(()=>d.remove(),1000)}
function fxCard(u,cls){const e=document.querySelector('[data-card="'+u.id+'"]');if(!e)return;e.classList.remove(cls);void e.offsetWidth;e.classList.add(cls);setTimeout(()=>e.classList.remove(cls),720)}
function fxUltimateScreen(){const a=$("#arena");if(!a)return;a.classList.remove("ultScreenFlash");void a.offsetWidth;a.classList.add("ultScreenFlash");setTimeout(()=>a.classList.remove("ultScreenFlash"),700)}
function banner(t){const b=$("#ultBanner");b.textContent=t;b.classList.remove("show");void b.offsetWidth;b.classList.add("show")}

/* RESULTADOS */
function rollGearDrop(s){const pool=DROP_POOLS[s.id]||DROP_POOLS[1];return pool[Math.floor(Math.random()*pool.length)]}
function grantCampaignRewards(s){
 const r=s.rewards;save.gold+=r.gold;save.accountExp+=r.exp;save.essence+=r.essence;save.diamonds+=r.diamonds||0;save.scrolls+=r.scrolls||0;
 const team=used(),shardHero=team[(s.id-1)%team.length]||"seraphina";save.shards[shardHero]=(save.shards[shardHero]||0)+r.shards;
 const gearId=rollGearDrop(s);addGear(gearId,1);if(s.id<STAGES.length)save.unlockedStage=Math.max(save.unlockedStage,s.id+1);persist();return{...r,shardHero,gearId};
}
function finishBattle(win,ctx){
 trackEvent("battles",1);
 const next=$("#nextStageBtn"),retry=$("#retryBtn");$("#resultBadge").textContent=win?"🏆":"💀";$("#resultTitle").textContent=win?"Vitória!":"Derrota";
 if(ctx.mode==="boss"){
  const boss=battle.e[0],damage=Math.round(ctx.damage||0),rw=bossRewardFor(damage);
  save.worldBossRemainingHp=Math.max(0,Math.round(boss.hp));save.worldBossLast=damage;save.worldBossBest=Math.max(save.worldBossBest||0,damage);save.worldBossTotal=(save.worldBossTotal||0)+damage;
  save.gold+=rw.gold;save.diamonds+=rw.diamonds;save.guildContribution+=rw.contribution;save.awakeningStones+=(rw.stones||0);
  if(save.worldBossRemainingHp<=0){save.diamonds+=250;rw.bonus=250}
  persist();renderWorldBoss();
  $("#resultBadge").textContent=save.worldBossRemainingHp<=0?"🐲":"🐉";$("#resultTitle").textContent=save.worldBossRemainingHp<=0?"Chefe Derrotado!":"Raid Concluída";
  $("#resultStage").textContent="Vorak • Dano "+damage.toLocaleString("pt-BR");
  $("#resultText").textContent="Sua pontuação diária foi registrada no ranking. Quanto maior o dano, melhores as recompensas.";
  $("#resultRewards").innerHTML=`<span class="reward">💥 Dano<strong>${damage.toLocaleString("pt-BR")}</strong></span><span class="reward">🪙 Ouro<strong>+${rw.gold}</strong></span><span class="reward">💎 Diamantes<strong>+${rw.diamonds}</strong></span><span class="reward">🤝 Contribuição<strong>+${rw.contribution}</strong></span>${rw.stones?`<span class="reward">🌟 Pedras<strong>+${rw.stones}</strong></span>`:""}${rw.bonus?'<span class="reward">🐲 Abate<strong>💎 +250</strong></span>':""}`;
  rewardBurst([{text:"💥 "+damage.toLocaleString("pt-BR")+" dano",kind:"diamond"},{text:"🪙 +"+rw.gold,kind:"gold"},{text:"💎 +"+(rw.diamonds+(rw.bonus||0)),kind:"diamond"},{text:rw.stones?"🌟 +"+rw.stones+" Pedras":"",kind:"crystal"}].filter(x=>x.text));
  next.style.display="none";retry.style.display="none";$("#resultMenuBtn").textContent="Voltar ao Chefe Épico";$("#resultModal").classList.add("show");return;
 }
 if(ctx.mode==="tower"){
  const fl=ctx.floor,firstClear=fl>save.towerBest;
  $("#resultStage").textContent="Torre do Abismo • Andar "+fl;$("#resultMenuBtn").textContent="Voltar à Torre";
  if(win){
   let rw={gold:0,diamonds:0,crystals:0,contribution:0,stones:0};
   if(firstClear){rw=towerReward(fl);save.gold+=rw.gold;save.diamonds+=rw.diamonds;save.abyssCrystals+=rw.crystals;save.guildContribution+=rw.contribution;save.awakeningStones+=(rw.stones||0);save.towerBest=Math.max(save.towerBest,fl);save.towerFloor=Math.min(TOWER_MAX,fl+1);persist()}
   $("#resultTitle").textContent=fl===TOWER_MAX&&firstClear?"Topo Conquistado!":"Andar Concluído!";
   $("#resultText").textContent=firstClear?"Recompensa de primeira conclusão recebida.":"Este andar já havia sido concluído; nenhuma recompensa rara adicional foi concedida.";
   $("#resultRewards").innerHTML=firstClear?`<span class="reward">🔷 Cristais<strong>+${rw.crystals}</strong></span><span class="reward">🪙 Ouro<strong>+${rw.gold}</strong></span><span class="reward">💎 Diamantes<strong>+${rw.diamonds}</strong></span><span class="reward">🤝 Contribuição<strong>+${rw.contribution}</strong></span>${rw.stones?`<span class="reward">🌟 Pedras<strong>+${rw.stones}</strong></span>`:""}`:'<span class="reward">Repetição<strong>Sem prêmio raro</strong></span>';
   if(firstClear)rewardBurst([{text:"🔷 +"+rw.crystals+" Cristais",kind:"crystal"},{text:"🪙 +"+rw.gold,kind:"gold"},{text:"💎 +"+rw.diamonds,kind:"diamond"},{text:rw.stones?"🌟 +"+rw.stones+" Pedras":"",kind:"crystal"}].filter(x=>x.text));
   next.textContent=fl<TOWER_MAX?"Próximo andar →":"Topo alcançado";next.style.display=fl<TOWER_MAX?"":"none";retry.style.display="none";
  }else{
   $("#resultText").textContent="A Torre fica mais forte a cada piso. Evolua estrelas, equipamentos e Guilda para continuar.";
   $("#resultRewards").innerHTML='<span class="reward">Andar não concluído<strong>—</strong></span>';next.style.display="none";retry.style.display="";
  }
  renderTower();$("#resultModal").classList.add("show");return;
 }
 if(ctx.mode==="arena"){
  const o=ctx.opponent;$("#resultStage").textContent="Arena • "+o.name;
  if(win){const gain=20+Math.max(0,Math.round((o.rating-save.arenaRating)/25));save.arenaRating+=gain;save.arenaCoins+=25;save.arenaDailyPoints+=gain;save.guildContribution+=20;save.dailyCounters.arenaWins=(save.dailyCounters.arenaWins||0)+1;save.lifetime.arenaWins=(save.lifetime.arenaWins||0)+1;persist();$("#resultText").textContent="Vitória na Arena! Ranking, Moedas da Arena e contribuição recebidos.";$("#resultRewards").innerHTML=`<span class="reward">🏆 Rating<strong>+${gain}</strong></span><span class="reward">🏟️ Moedas<strong>+25</strong></span><span class="reward">🤝 Contribuição<strong>+20</strong></span>`;rewardBurst([{text:"🏟️ +25",kind:"gold"},{text:"🏆 +"+gain,kind:"exp"}])}
  else{const loss=Math.min(8,Math.max(3,Math.round((save.arenaRating-o.rating)/40)+5));save.arenaRating=Math.max(800,save.arenaRating-loss);save.arenaCoins+=5;save.guildContribution+=5;persist();$("#resultText").textContent="Derrota na Arena. Você recebeu uma pequena recompensa de participação.";$("#resultRewards").innerHTML=`<span class="reward">🏆 Rating<strong>-${loss}</strong></span><span class="reward">🏟️ Moedas<strong>+5</strong></span><span class="reward">🤝 Contribuição<strong>+5</strong></span>`;}
  renderMissions("daily");next.style.display="none";retry.style.display="none";$("#resultMenuBtn").textContent="Voltar à Arena";$("#resultModal").classList.add("show");return;
 }
 const stg=ctx;$("#resultStage").textContent="Fase "+stg.code+" • "+stg.name;$("#resultMenuBtn").textContent="Voltar ao menu";next.textContent="Próxima fase →";
 if(win){
  const rw=grantCampaignRewards(stg),sh=hero(rw.shardHero),g=GEAR[rw.gearId],cont=10+stg.id*3;
  save.guildContribution+=cont;save.dailyCounters.campaignWins=(save.dailyCounters.campaignWins||0)+1;save.lifetime.campaignWins=(save.lifetime.campaignWins||0)+1;persist();
  $("#resultText").textContent=stg.id<5?"Próxima fase desbloqueada. O equipamento recebido já está no inventário.":"Capítulo 1 concluído!";
  $("#resultRewards").innerHTML=`<span class="reward">🪙 Ouro<strong>+${rw.gold}</strong></span><span class="reward">⭐ EXP<strong>+${rw.exp}</strong></span><span class="reward">💎 Diamantes<strong>+${rw.diamonds}</strong></span><span class="reward">${sh.emoji} Fragmentos<strong>+${rw.shards}</strong></span><span class="reward">🤝 Contribuição<strong>+${cont}</strong></span><span class="reward gearReward">🎁 Equipamento<strong class="dropName">${g.icon} ${g.name}</strong></span>${rw.scrolls?'<span class="reward">📜 Pergaminho<strong>+1</strong></span>':""}`;
  rewardBurst([{text:"🪙 +"+rw.gold,kind:"gold"},{text:"⭐ +"+rw.exp+" EXP",kind:"exp"},{text:"💎 +"+rw.diamonds,kind:"diamond"}]);
  next.style.display=stg.id<5?"":"none";retry.style.display="none";
 }else{$("#resultText").textContent="Melhore níveis/equipamentos ou ajuste a formação e tente novamente.";$("#resultRewards").innerHTML='<span class="reward">Sem recompensas<strong>—</strong></span>';next.style.display="none";retry.style.display=""}
 renderMissions("daily");$("#resultModal").classList.add("show");
}
function closeResult(){$("#resultModal").classList.remove("show");try{screen.orientation?.unlock?.()}catch{}}
function goNextStage(){
 if(lastBattleMode==="tower"){closeResult();renderTower();show("towerScreen");return}
 const stg=stage();if(stg.id>=STAGES.length)return;save.selectedStage=stg.id+1;persist();closeResult();renderFormation();show("formationScreen");
}
function retryStage(){
 closeResult();
 if(lastBattleMode==="arena"){renderArena();show("arenaScreen");return}
 if(lastBattleMode==="boss"){renderWorldBoss();show("worldBossScreen");return}
 if(lastBattleMode==="tower"){startTowerBattle();return}
 startBattle();
}
function goResultMenu(){
 closeResult();
 if(lastBattleMode==="arena"){generateArenaOpponents();renderArena();show("arenaScreen");return}
 if(lastBattleMode==="boss"){renderWorldBoss();show("worldBossScreen");return}
 if(lastBattleMode==="tower"){renderTower();show("towerScreen");return}
 renderCampaign();renderHeroes();show("homeScreen");
}

/* NAVEGAÇÃO */
function setBottomNavActive(key){
 $$(".bottomNav button[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===key));
}
function openNav(key){
 const map={campaign:"campanha",heroes:"herois",equipment:"equipamentos",portal:"portal",arena:"arena",shop:"loja",missions:"missoes",synergy:"sinergias"};
 const route=map[key]||key;return showScreen(route);
}
function bindClick(id,handler){
 const el=$("#"+id);
 if(!el){console.warn("[UI] Botão não encontrado:",id);return false}
 el.addEventListener("click",handler);
 return true;
}
function bindLobbyRoutes(){
 const routes={
  goCampaign:"campanha",
  goPortal:"portal",
  goArena:"arena",
  goTower:"torre",
  goWorldBoss:"chefe",
  goHeroes:"herois",
  goEquipment:"equipamentos",
  goShop:"loja",
  goMissions:"missoes",
  goSynergy:"sinergias",
  goFormation:"formacao",
  goGuild:"guilda",
  goAfk:"afk",
  goAwakening:"despertar"
 };
 Object.entries(routes).forEach(([id,route])=>bindClick(id,()=>showScreen(route)));
 bindClick("quickBattle",()=>quick());
}
function bindBackToLobby(){
 ["campaignBack","heroesBack","portalBack","arenaBack","shopBack","missionsBack","guildBack","worldBossBack","towerBack","afkBack","awakeningBack","formationBack"]
  .forEach(id=>bindClick(id,backToLobby));
 bindClick("battleBack",backToLobby);
}
function bindStaticControls(){
 bindLobbyRoutes();bindBackToLobby();
 bindClick("refreshArena",()=>{generateArenaOpponents();renderArena()});
 bindClick("missionsGuildBtn",()=>showScreen("guilda"));
 bindClick("startWorldBoss",()=>startWorldBossBattle());
 bindClick("startTower",()=>startTowerBattle());
 bindClick("claimAfkBtn",()=>claimAfk(false));
 bindClick("muteBtn",()=>AudioEngine.toggle());
 bindClick("storyNext",()=>nextStory());bindClick("storySkip",()=>skipStory());
 const storyBoxEl=$("#storyBox");if(storyBoxEl)storyBoxEl.addEventListener("click",e=>{if(!e.target.closest("button"))nextStory()});
 bindClick("dailyTab",()=>renderMissions("daily"));bindClick("achievementTab",()=>renderMissions("achievements"));
 bindClick("startBattle",()=>startBattle());bindClick("summonOne",()=>summon(1));bindClick("summonTen",()=>summon(10));
 bindClick("speed1",()=>{if(battle){battle.speed=1;renderBattle()}});
 bindClick("speed2",()=>{if(battle){battle.speed=2;renderBattle()}});
 bindClick("pauseBtn",()=>{if(battle&&!battle.ended){battle.paused=!battle.paused;renderBattle()}});
 bindClick("modeBtn",()=>{if(battle&&!battle.ended){battle.mode=battle.mode==="manual"?"auto":"manual";battle.log("🤖 Ultimate: "+battle.mode.toUpperCase(),"ultimate");renderBattle()}});
 bindClick("nextStageBtn",()=>goNextStage());bindClick("retryBtn",()=>retryStage());bindClick("resultMenuBtn",()=>goResultMenu());
 bindClick("installAppBtn",()=>install());bindClick("splashInstallBtn",()=>install());
 bindClick("checkUpdateBtn",async()=>{const has=await checkUpdate(true);if(has)updateNow()});
 bindClick("splashUpdateBtn",()=>updateNow());
}
bindStaticControls();

/* PWA / UPDATE */
let remoteVersionInfo=null;
function status(t){const e=$("#updateStatus");if(e)e.textContent=t}
function hideSplash(ms=300){setTimeout(()=>{const x=$("#updateSplash");if(x){x.classList.add("hidden");setTimeout(()=>x.remove(),350)}},ms)}
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))}
async function fetchVersion(){const req=fetch("./version.json?ts="+Date.now(),{cache:"no-store"});const res=await Promise.race([req,timeout(2500)]);if(!res.ok)throw new Error("version");return res.json()}
async function checkUpdate(showMsg=false){
 const n=$("#homeUpdateNotice");
 try{const v=await fetchVersion();remoteVersionInfo=v;if(v.version&&v.version!==APP_VERSION){status("Nova versão "+v.version+" disponível.");const b=$("#splashUpdateBtn");if(b)b.style.display="";if(n){n.innerHTML='Nova versão <b>'+v.version+'</b> disponível.';n.classList.add("show")}const chk=$("#checkUpdateBtn");if(chk)chk.textContent="⬆ Atualizar para v"+v.version;hideSplash(650);return true}status("Nerdora Chibi Raiders v"+APP_VERSION+" está atualizado.");if(showMsg&&n){n.textContent="Você já está na versão "+APP_VERSION+".";n.classList.add("show")}}
 catch(e){status("v"+APP_VERSION+" pronta. Verificação online indisponível.");if(showMsg&&n){n.textContent="Não foi possível consultar atualizações agora.";n.classList.add("show")}}
 hideSplash(550);return false;
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;const a=$("#installAppBtn"),b=$("#splashInstallBtn");if(a)a.style.display="";if(b)b.style.display=""});
async function install(){if(!deferred){const n=$("#homeUpdateNotice");if(n){n.textContent='Abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.';n.classList.add("show")}return}deferred.prompt();await deferred.userChoice;deferred=null}
async function updateNow(){status("Abrindo a nova versão…");try{const v=remoteVersionInfo||await fetchVersion();if(v.entry){location.replace(v.entry+(v.entry.includes("?")?"&":"?")+"update="+Date.now());return}}catch(e){}location.reload()}
if("serviceWorker"in navigator){addEventListener("load",()=>{navigator.serviceWorker.register("./sw-3.0.0.js",{scope:"./",updateViaCache:"none"}).then(r=>{reg=r;r.update().catch(()=>{})}).catch(()=>{});checkUpdate(false)})}else addEventListener("load",()=>checkUpdate(false));
setTimeout(()=>hideSplash(0),3500);

resetDailyMissions();dailyArenaReset();dailyWorldBossReset();renderResources();renderCampaign();renderFormation();renderHeroes();renderPortal();renderShop();renderMissions("daily");renderGuild();renderWorldBoss();renderTower();renderAwakening();renderAfk();AudioEngine.updateButton();updateMissionIndicators();startAfkTicker();processOfflineRewards();showScreen("lobby",{skipRender:true});
})();