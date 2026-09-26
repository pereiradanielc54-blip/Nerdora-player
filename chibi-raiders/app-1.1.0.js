(()=>{"use strict";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const APP_VERSION="1.1.0";
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

function todayKey(){return new Date().toISOString().slice(0,10)}
function blankEquipment(){return{weapon:null,armor:null,helmet:null,accessory:null}}
function defaultSave(){
 const heroLevels={},shards={},owned={},equipment={};
 HEROES.forEach(h=>{heroLevels[h.id]=1;shards[h.id]=0;owned[h.id]=false;equipment[h.id]=blankEquipment()});
 ["quebra","valquiria","seraphina","umbra","crepusculo"].forEach(id=>owned[id]=true);
 return{
  gold:1500,diamonds:1200,scrolls:3,accountExp:0,essence:0,arenaCoins:0,arenaRating:1000,
  arenaDate:todayKey(),arenaAttempts:5,arenaDailyPoints:0,
  missionDate:todayKey(),dailyCounters:{arenaWins:0,summons:0,levelUps:0,campaignWins:0},dailyClaimed:{},
  lifetime:{battles:0,arenaWins:0,campaignWins:0,summons:0,levelUps:0},achievementClaimed:{},
  guildId:null,guildContribution:0,guildAttack:0,guildDefense:0,guildHp:0,
  unlockedStage:1,selectedStage:1,heroLevels,shards,owned,equipment,gearInventory:{},potions:0,
  formation:{F1:"quebra",F2:"valquiria",B1:"seraphina",B2:"umbra",B3:"crepusculo"}
 };
}
function normalizeSave(s){
 const d=defaultSave(),out={...d,...s};
 out.heroLevels={...d.heroLevels,...(s.heroLevels||{})};
 out.shards={...d.shards,...(s.shards||{})};
 out.owned={...d.owned,...(s.owned||{})};
 out.gearInventory={...(s.gearInventory||{})};
 out.equipment={};
 HEROES.forEach(h=>out.equipment[h.id]={...blankEquipment(),...((s.equipment||{})[h.id]||{})});
 out.formation={...d.formation,...(s.formation||{})};
 out.dailyCounters={...d.dailyCounters,...(s.dailyCounters||{})};
 out.dailyClaimed={...(s.dailyClaimed||{})};
 out.lifetime={...d.lifetime,...(s.lifetime||{})};
 out.achievementClaimed={...(s.achievementClaimed||{})};
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
let save=loadSave(),formation={...save.formation},activeSlot="F1",selectedHero="seraphina",battle=null,deferred=null,reg=null,arenaOpponents=[],lastBattleMode="campaign";

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
function heroStats(h){
 const lv=save.heroLevels[h.id]||1,b=gearBonus(h.id),g=guildBonuses();
 const hp=Math.round((Math.round(h.hp*(1+.08*(lv-1)))+b.hp)*(1+g.hp));
 const pa=Math.round((Math.round(h.pa*(1+.07*(lv-1)))+b.pa)*(1+g.atk));
 const ma=Math.round((Math.round(h.ma*(1+.07*(lv-1)))+b.ma)*(1+g.atk));
 const pd=Math.round((Math.round(h.pd*(1+.045*(lv-1)))+b.pd)*(1+g.def));
 const md=Math.round((Math.round(h.md*(1+.045*(lv-1)))+b.md)*(1+g.def));
 return{level:lv,hp,pa,ma,pd,md,sp:Math.round(h.sp*(1+.004*(lv-1)))+b.sp,cr:h.cr,dg:h.dg};
}
function addGear(id,qty=1){save.gearInventory[id]=(save.gearInventory[id]||0)+qty}
function show(id){
 $$(".screen").forEach(e=>e.classList.remove("active"));
 const screen=$("#"+id);if(screen)screen.classList.add("active");
 $("#game").classList.toggle("battle-mode",id==="battleScreen");
 const navMap={campaignScreen:"campaign",formationScreen:"campaign",heroesScreen:"heroes",portalScreen:"portal",arenaScreen:"arena",shopScreen:"shop",missionsScreen:"missions"};
 const active=navMap[id]||"";
 $$(".bottomNav button[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===active));
 renderResources();updateMissionIndicators();
}
function renderResources(){
 $$("[data-res]").forEach(e=>{const k=e.dataset.res;if(k==="accountLevel")e.textContent=accountLevel();else e.textContent=save[k]??0});
}
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
 persist();renderMissions("daily");toast("🎯 Missão resgatada!");
}
function claimAchievement(id){
 const a=ACHIEVEMENTS.find(x=>x.id===id);if(!a||save.achievementClaimed[id]||achievementProgress(a)<a.target)return;
 save.achievementClaimed[id]=true;save.gold+=a.reward.gold||0;save.diamonds+=a.reward.diamonds||0;
 persist();renderMissions("achievements");toast("🏆 Conquista resgatada!");
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
function uiClickSound(){
 try{
  uiAudio=uiAudio||new (window.AudioContext||window.webkitAudioContext)();
  const o=uiAudio.createOscillator(),g=uiAudio.createGain();
  o.type="sine";o.frequency.setValueAtTime(520,uiAudio.currentTime);o.frequency.exponentialRampToValueAtTime(360,uiAudio.currentTime+.035);
  g.gain.setValueAtTime(.022,uiAudio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,uiAudio.currentTime+.04);
  o.connect(g);g.connect(uiAudio.destination);o.start();o.stop(uiAudio.currentTime+.045);
 }catch(e){}
}
document.addEventListener("pointerdown",e=>{
 const b=e.target.closest("button");if(!b||b.disabled)return;
 b.classList.remove("tapFx");void b.offsetWidth;b.classList.add("tapFx");setTimeout(()=>b.classList.remove("tapFx"),220);
 uiClickSound();try{navigator.vibrate&&navigator.vibrate(7)}catch(err){}
});

function dailyArenaReset(){
 if(save.arenaDate!==todayKey()){save.arenaDate=todayKey();save.arenaAttempts=5;save.arenaDailyPoints=0;persist()}
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
 const s=stage(),info=$("#formationStageInfo");
 info.innerHTML=`<div><b>🗺️ Fase ${s.code} • ${s.name}</b><br><span>Inimigos Nv.${s.enemyLevel} • ${s.power}</span></div><div class="badge">×${s.scale.toFixed(2)}</div>`;
 const board=$("#formationBoard");board.innerHTML="";
 SLOTS.forEach(slot=>{
  const h=formation[slot.id]?hero(formation[slot.id]):null,e=document.createElement("button");
  e.className="slot "+slot.line+(activeSlot===slot.id?" selected":"")+(h?" filled":"");e.dataset.slot=slot.id;
  e.innerHTML=h?`<span class="emoji">${h.emoji}</span><b>${h.name}</b><em>Nv.${save.heroLevels[h.id]} • ${slot.label}</em>`:`<span class="emoji">＋</span><b>${slot.label}</b><em>${slot.line==="front"?"Front-line":"Back-line"}</em>`;
  e.onclick=()=>{activeSlot=slot.id;renderFormation()};board.appendChild(e);
 });
 const roster=$("#roster");roster.innerHTML="";
 HEROES.filter(h=>save.owned[h.id]).forEach(h=>{
  const st=heroStats(h),e=document.createElement("button");e.className="rosterCard"+(used().includes(h.id)?" used":"");
  e.innerHTML=`<div class="rosterHead"><span class="avatar">${h.emoji}</span><div><b>${h.name}</b><div class="meta">Nv.${st.level} • ${h.role} • SPD ${st.sp}</div></div></div><div class="rosterStats"><span>HP ${st.hp}</span><span>ATQ ${Math.max(st.pa,st.ma)}</span><span>DEF ${Math.max(st.pd,st.md)}</span></div>`;
  e.onclick=()=>{Object.keys(formation).forEach(k=>{if(formation[k]===h.id)formation[k]=null});formation[activeSlot]=h.id;const i=SLOTS.findIndex(x=>x.id===activeSlot);activeSlot=SLOTS[Math.min(i+1,4)].id;persist();renderFormation()};roster.appendChild(e);
 });
 $("#selectedCount").textContent=used().length;$("#startBattle").disabled=used().length!==5;
}

/* HERÓIS / EQUIPAMENTOS */
function bonusText(g){return Object.entries(g.bonus).map(([k,v])=>({hp:"HP",pa:"ATQ F",ma:"ATQ M",pd:"DEF F",md:"DEF M",sp:"SPD"}[k]+" +"+v)).join(" • ")}
function rarityClass(r){return r==="Épico"?"gearEpic":r==="Raro"?"gearRare":""}
function renderHeroes(){
 const grid=$("#heroManageGrid");grid.innerHTML="";
 HEROES.forEach(h=>{
  const own=save.owned[h.id],st=heroStats(h),e=document.createElement("button");
  e.className="heroManageCard"+(selectedHero===h.id?" selected":"")+(!own?" locked":"");
  e.innerHTML=`<div class="heroManageTop"><span class="heroManageEmoji">${own?h.emoji:"❔"}</span><div><div class="heroManageName">${h.name}</div><div class="heroManageMeta">${h.role} • ${own?"Nv."+st.level:"Não obtido"}</div></div></div><div class="heroManageBars"><span>HP ${own?st.hp:"—"}</span><span>ATQ ${own?Math.max(st.pa,st.ma):"—"}</span></div><div class="heroOwnership">${own?"🧩 "+(save.shards[h.id]||0)+" fragmentos":"🔒 Invoque no Portal"}</div>`;
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
 $("#heroDetail").innerHTML=`<div class="heroDetailHeader"><div class="heroDetailAvatar">${h.emoji}</div><div class="heroDetailTitle"><h2>${h.name}</h2><p>${h.role} • ${h.line==="front"?"Front-line":"Back-line"} • ${h.type==="magic"?"Mágico":"Físico"}</p><div class="starLine">★☆☆☆☆</div></div></div>
 <div class="heroStatGrid"><div class="heroStat"><span>HP Máximo</span><b>${st.hp}</b></div><div class="heroStat"><span>Velocidade</span><b>${st.sp}</b></div><div class="heroStat"><span>ATQ Físico</span><b>${st.pa}</b></div><div class="heroStat"><span>ATQ Mágico</span><b>${st.ma}</b></div><div class="heroStat"><span>DEF Física</span><b>${st.pd}</b></div><div class="heroStat"><span>DEF Mágica</span><b>${st.md}</b></div></div>
 <div class="levelPanel"><div class="levelProgress"><b>Nível ${st.level}${max?" • MÁXIMO":""}</b><span>🪙 ${save.gold}</span></div><button id="levelUpBtn" class="btn primary levelUpBtn" ${max||save.gold<cost?"disabled":""}>${max?"Nível máximo":"⬆ Subir de Nível • 🪙 "+cost}</button><button id="usePotionBtn" class="btn ghost levelUpBtn" style="margin-top:6px" ${max||save.potions<1?"disabled":""}>🧪 Usar Poção de Treino (${save.potions})</button><div class="shardLine">🧩 Fragmentos: <b>${save.shards[h.id]||0}</b> • Ultimate: <b>${h.ult.name}</b></div></div>
 <div class="equipPanel"><h3>Equipamentos</h3><div class="equipGrid">${equipHtml}</div><div class="inventoryTitle">Inventário de equipamentos</div><div class="gearInventory">${invHtml}</div></div>`;
 $("#levelUpBtn").onclick=()=>levelUp(h.id);$("#usePotionBtn").onclick=()=>usePotion(h.id);
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
function renderPortal(){renderResources()}
function summon(count){
 let results=[];
 if(count===1){
  if(save.scrolls>0)save.scrolls--;else if(save.diamonds>=200)save.diamonds-=200;else{return toast("Faltam Pergaminhos ou Diamantes")}
 }else{
  if(save.diamonds<1800)return toast("Diamantes insuficientes");save.diamonds-=1800;
 }
 for(let i=0;i<count;i++){
  const h=HEROES[Math.floor(Math.random()*HEROES.length)],isNew=!save.owned[h.id];
  if(isNew)save.owned[h.id]=true;else save.shards[h.id]=(save.shards[h.id]||0)+20;
  results.push({h,isNew});
 }
 trackEvent("summons",count);renderSummonResults(results);renderHeroes();renderFormation();renderMissions("daily");
}
function renderSummonResults(results){
 $("#summonResults").innerHTML=results.map(({h,isNew})=>`<div class="summonCard ${isNew?"new":""}"><div class="bigEmoji">${h.emoji}</div><b>${h.name}</b><span>${h.role}</span><div class="newTag">${isNew?"NOVO HERÓI":"DUPLICATA • +20 🧩"}</div></div>`).join("");
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
 const [tier,cls]=arenaTier();$("#arenaTierBadge").textContent=tier;$("#arenaTierBadge").className="badge "+cls;$("#arenaRankTitle").textContent=tier+" • Hoje +"+save.arenaDailyPoints;$("#arenaAttempts").textContent=save.arenaAttempts;
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
 save[x.currency]-=x.price;
 if(x.type==="potion")save.potions+=(x.qty||1);
 if(x.type==="gear")addGear(x.gear,1);
 if(x.type==="shard")save.shards[x.hero]=(save.shards[x.hero]||0)+(x.qty||1);
 if(x.type==="scroll")save.scrolls+=(x.qty||1);
 persist();renderShop();renderHeroes();toast("🛒 Compra realizada: "+x.name);
}

/* COMBATE */
class Unit{
 constructor(h,team,slot,opt={}){
  const enemy=team==="enemy",lv=opt.level||1,scale=opt.scale||1,st=enemy?{hp:Math.round(h.hp*scale),pa:Math.round(h.pa*scale),ma:Math.round(h.ma*scale),pd:Math.round(h.pd*scale),md:Math.round(h.md*scale),sp:Math.round(h.sp*(.94+scale*.06)),cr:h.cr*.65,dg:h.dg*.60}:heroStats(h);
  Object.assign(this,{h,team,slot,level:enemy?lv:st.level,id:team+"_"+h.id+"_"+slot.id,name:h.name,emoji:h.emoji,role:h.role,style:h.style,type:h.type,maxHp:st.hp,pa:st.pa,ma:st.ma,basePd:st.pd,baseMd:st.md,baseSp:st.sp,cr:st.cr,dg:st.dg,hp:st.hp,rage:0,dead:false,shield:0,bleed:0,freeze:0,slow:0,haste:0,broken:0,queued:false});
 }
 get line(){return this.slot.line}get sp(){return Math.max(1,Math.round(this.baseSp*(1-this.slow+this.haste)))}get pd(){return Math.max(0,Math.round(this.basePd*(this.line==="front"?1.15:1)*(1-this.broken)))}get md(){return Math.max(0,Math.round(this.baseMd*(this.line==="front"?1.10:1)))}gain(v){if(!this.dead)this.rage=clamp(this.rage+v,0,100)}
}
class Battle{
 constructor(p,e,context){this.p=p;this.e=e;this.context=context;this.round=0;this.q=[];this.i=0;this.current=null;this.target=null;this.speed=1;this.paused=false;this.mode="manual";this.ended=false;this.logN=0}
 living(a){return a.filter(x=>!x.dead)}enemies(u){return u.team==="player"?this.e:this.p}allies(u){return u.team==="player"?this.p:this.e}
 log(t,c=""){const x=document.createElement("div");x.className=c;x.textContent=String(++this.logN).padStart(2,"0")+" • "+t;$("#battleLog").appendChild(x);$("#battleLog").scrollTop=$("#battleLog").scrollHeight}
 async delay(ms=1750){let left=ms/this.speed,last=performance.now();while(left>0&&!this.ended){await new Promise(r=>setTimeout(r,50));if(this.paused){last=performance.now();continue}const n=performance.now();left-=n-last;last=n}}
 roundStart(){this.round++;[...this.p,...this.e].forEach(u=>{if(u.dead)return;if(u.bleed){u.bleed--;const d=Math.round(u.maxHp*.03);u.hp=Math.max(0,u.hp-d);this.log("🩸 "+u.name+" sofreu "+d+" de sangramento.");if(!u.hp)this.kill(u,null)}u.slow=Math.max(0,u.slow-.06);u.haste=Math.max(0,u.haste-.06);u.broken=Math.max(0,u.broken-.08);u.shield=Math.max(0,u.shield-.08)});this.q=[...this.living(this.p),...this.living(this.e)].sort((a,b)=>b.sp-a.sp||a.name.localeCompare(b.name));this.i=0;this.log("🔄 Rodada "+this.round+": iniciativa recalculada por Speed.","round");renderBattle()}
 valid(u){const a=this.living(this.enemies(u));if(u.style==="melee"){const f=a.filter(x=>x.line==="front");if(f.length)return f}return a}
 targetFor(u){const a=this.valid(u);if(!a.length)return null;let total=a.reduce((s,x)=>s+(x.line==="front"?1.8:.65),0),r=Math.random()*total;for(const x of a){r-=x.line==="front"?1.8:.65;if(r<=0)return x}return a[0]}
 weak(a){return this.living(a).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0]}
 damage(a,t,type,ratio,opt={}){
  if(!t||t.dead)return;
  if(!opt.noDodge&&Math.random()<t.dg){
   this.log("💨 "+t.name+" esquivou.","dodge");
   float(t,"ESQUIVA!","dodge",-8);fxCard(t,"dodgeFx");return;
  }
  const atk=type==="magic"?a.ma:a.pa,def=opt.pierce?0:(type==="magic"?t.md:t.pd),mit=def/(def+600);
  let n=atk*ratio*(.94+Math.random()*.12)*(1-mit);if(t.shield)n*=1-t.shield;
  const crit=Math.random()<a.cr;if(crit)n*=1.5;n=Math.max(1,Math.round(n));
  t.hp=Math.max(0,t.hp-n);a.gain(25);t.gain(15);
  this.log((opt.ult?"💥 ULTIMATE • ":"")+(crit?"💢 CRÍTICO • ":"")+a.name+" causou "+n+" em "+t.name+".",opt.ult?"ultimate":crit?"crit":"");
  if(!t.hp)this.kill(t,a);
  renderBattle();
  requestAnimationFrame(()=>{
   float(t,"-"+n,opt.ult?"ult":"damage",10);
   if(crit)float(t,"CRÍTICO!","critText",-18);
   fxCard(t,(crit||opt.ult||n>t.maxHp*.22)?"hitHard":"hitLight");
  });
 }

 kill(t,k){if(t.dead)return;t.dead=true;t.hp=0;if(k)k.gain(25);this.log("☠️ "+t.name+" foi derrotado.","death")}
 heal(a,t,r){if(!t||t.dead)return;const n=Math.min(t.maxHp-t.hp,Math.round(Math.max(a.ma,a.pa*.55)*r));t.hp+=n;this.log("💚 "+a.name+" curou "+t.name+" em "+n+" HP.");float(t,"+"+n,"heal")}
 async basic(u){const t=this.targetFor(u);if(!t)return;this.target=t;this.log("⚔️ "+u.name+" ataca "+t.name+".");renderBattle();await this.delay(650);this.damage(u,t,u.type,1)}
 async ult(u){
  if(u.rage<100||u.dead)return;
  u.rage=0;u.queued=false;const z=u.h.ult;
  banner(u.emoji+" "+z.name+"!");
  this.log("━━━━━━━━ 💥 ULTIMATE • "+u.name+" usa "+z.name+"! ━━━━━━━━","ultimate");
  renderBattle();requestAnimationFrame(()=>{fxCard(u,"ultimateCast");fxUltimateScreen()});
  await this.delay(900);
  if(z.kind==="heal"){this.living(this.allies(u)).forEach(t=>this.heal(u,t,z.ratio));if(z.effect==="shield")this.living(this.allies(u)).forEach(t=>t.shield=Math.max(t.shield,.32))}
  else if(z.kind==="single"){const t=this.weak(this.enemies(u));let r=z.ratio;if(z.effect==="execute"&&t&&t.hp/t.maxHp<.35)r*=1.35;this.damage(u,t,u.type,r,{ult:true,noDodge:true})}
  else if(z.kind==="multi"){for(let i=0;i<(z.hits||5);i++){const t=this.weak(this.enemies(u));if(!t)break;this.damage(u,t,u.type,z.ratio,{ult:true,noDodge:true});await this.delay(220)}}
  else{const typ=z.kind==="aoeMagic"?"magic":u.type;for(const t of [...this.living(this.enemies(u))]){this.damage(u,t,typ,z.ratio,{ult:true,noDodge:true,pierce:z.effect==="pierce"});await this.delay(220)}}
  if(z.effect==="bleed")this.living(this.enemies(u)).forEach(t=>t.bleed=3);
  if(z.effect==="break")this.living(this.enemies(u)).forEach(t=>t.broken=.30);
  if(z.effect==="slow")this.living(this.enemies(u)).forEach(t=>t.slow=.22);
  if(z.effect==="freeze")this.living(this.enemies(u)).slice(0,2).forEach(t=>t.freeze=1);
  if(z.effect==="shield")this.living(this.allies(u)).forEach(t=>t.shield=Math.max(t.shield,.42));
  if(z.effect==="haste")this.living(this.allies(u)).forEach(t=>t.haste=.20);
  renderBattle();
 }

 check(){const p=this.living(this.p).length,e=this.living(this.e).length;if(p&&e)return false;if(this.ended)return true;this.ended=true;setTimeout(()=>finishBattle(!!p,this.context),250);return true}
 async loop(){this.roundStart();while(!this.ended){if(this.paused){await this.delay(100);continue}if(this.check())break;if(this.mode==="auto"){const r=this.living(this.p).find(x=>x.rage>=100);if(r){await this.ult(r);await this.delay(1750);continue}}if(this.i>=this.q.length){this.roundStart();await this.delay(1000);continue}const u=this.q[this.i++];if(u.dead)continue;this.current=u;this.target=null;$("#actionLabel").textContent="Vez de "+u.name;renderBattle();if(u.freeze){u.freeze--;this.log("❄️ "+u.name+" está congelado e perde a ação.");await this.delay(1750)}else if(u.team==="enemy"&&u.rage>=100)await this.ult(u);else if(u.team==="player"&&this.mode==="manual"&&u.queued&&u.rage>=100)await this.ult(u);else await this.basic(u);this.current=null;this.target=null;renderBattle();if(this.check())break;await this.delay(1750)}}
}

function playerTeam(){return SLOTS.map(s=>new Unit(hero(formation[s.id]),"player",s))}
function campaignEnemyFormation(s){const comps=[["terra","espinho","crepusculo","anao","fada"],["quebra","valquiria","umbra","crepusculo","seraphina"],["terra","relampago","espinho","anao","fada"],["quebra","valquiria","relampago","crepusculo","umbra"],["terra","quebra","valquiria","crepusculo","relampago"]];const ids=comps[s.id-1]||comps[0];return Object.fromEntries(SLOTS.map((slot,i)=>[slot.id,ids[i]]))}
function campaignEnemyTeam(s){const form=campaignEnemyFormation(s);return SLOTS.map(slot=>new Unit(hero(form[slot.id]),"enemy",slot,{level:s.enemyLevel,scale:s.scale}))}
async function landscape(){try{await screen.orientation?.lock?.("landscape")}catch{}}
function startBattle(){if(used().length!==5)return;const s=stage();lastBattleMode="campaign";landscape();battle=new Battle(playerTeam(),campaignEnemyTeam(s),{mode:"campaign",...s});show("battleScreen");$("#battleStageName").textContent="FASE "+s.code;$("#battleLog").innerHTML="";battle.log("⚔️ Fase "+s.code+" iniciada • Inimigos Nv."+s.enemyLevel+".");renderBattle();battle.loop()}
function quick(){if(used().length!==5){renderFormation();show("formationScreen");return}startBattle()}
function pos(u){const p=POS[u.slot.id];return u.team==="player"?"left:"+p.x+"%;top:"+p.y+"%;":"right:"+p.x+"%;top:"+p.y+"%;"}
function card(u){const hp=clamp(u.hp/u.maxHp*100,0,100),r=clamp(u.rage,0,100),ready=r>=100&&!u.dead,st=(u.shield?"🛡️":"")+(u.bleed?"🩸":"")+(u.freeze?"❄️":"")+(u.slow?"🐌":"")+(u.broken?"🔨":"");return `<div class="combatCard ${u.team}${battle.current===u?" active":""}${battle.target===u?" targeted":""}${u.dead?" dead":""}" data-card="${u.id}" style="${pos(u)}"><div class="ccTop"><span class="lineTag ${u.line}">${u.line==="front"?"FRONT-LINE":"BACK-LINE"}</span><span class="ccLevel">Nv.${u.level}</span><span class="statusIcons">${st}</span></div><div class="ccHero"><div class="ccAvatar">${u.emoji}</div><div class="ccIdentity"><div class="ccName">${u.name}</div><div class="ccRole">${u.role} • SPD ${u.sp}</div></div></div><div class="barMeta"><span>HP</span><b>${Math.ceil(u.hp)}/${u.maxHp}</b></div><div class="bar hp"><i style="width:${hp}%"></i></div><div class="barMeta"><span>RAGE</span><b>${Math.floor(r)}/100</b></div><div class="bar rage"><i style="width:${r}%"></i></div>${u.team==="player"?`<button class="ultBtn ${ready?"ready":""}${u.queued?" queued":""}" data-uid="${u.id}" ${(!ready||battle.mode==="auto"||u.dead)?"disabled":""}>${battle.mode==="auto"?"AUTO":u.queued?"ULTIMATE ARMADA":"ULTIMATE"}</button>`:`<div class="enemyAuto">${ready?"💥 ULTIMATE PRONTA":"ULTIMATE AUTO"}</div>`}</div>`}
function renderBattle(){if(!battle)return;["playerArea","enemyArea"].forEach(id=>$("#"+id).querySelectorAll(".combatCard").forEach(x=>x.remove()));battle.e.forEach(u=>$("#enemyArea").insertAdjacentHTML("beforeend",card(u)));battle.p.forEach(u=>$("#playerArea").insertAdjacentHTML("beforeend",card(u)));$$(".ultBtn[data-uid]").forEach(b=>b.onclick=()=>{const u=battle.p.find(x=>x.id===b.dataset.uid);if(u&&u.rage>=100){u.queued=!u.queued;battle.log((u.queued?"⏳ ":"↩️ ")+u.name+(u.queued?": Ultimate armada.":": Ultimate cancelada."),"ultimate");renderBattle()}});$("#roundLabel").textContent="Rodada "+(battle.round||1);$("#modeBtn").textContent="ULT: "+battle.mode.toUpperCase();$("#modeBtn").classList.toggle("active",battle.mode==="auto");$("#speed1").classList.toggle("active",battle.speed===1);$("#speed2").classList.toggle("active",battle.speed===2);$("#pauseBtn").classList.toggle("active",battle.paused);$("#pauseBtn").textContent=battle.paused?"▶ CONTINUAR":"Ⅱ PAUSA";$("#battleState").textContent=battle.paused?"PAUSADO":battle.ended?"FINALIZADO":"EM BATALHA";$("#turnOrder").innerHTML=battle.q.map((u,i)=>`<span class="turnChip${i<battle.i?" done":""}${battle.current===u?" current":""}">${u.emoji} ${u.name.split(" ")[0]} <b>${u.sp}</b></span>`).join("")}
function float(u,t,c,offset=0){
 const e=document.querySelector('[data-card="'+u.id+'"]');if(!e)return;
 const a=$("#arena").getBoundingClientRect(),r=e.getBoundingClientRect(),d=document.createElement("div");
 d.className="floatText "+c;d.textContent=t;d.style.left=(r.left-a.left+r.width/2)+"px";d.style.top=(r.top-a.top+20+offset)+"px";
 $("#arena").appendChild(d);setTimeout(()=>d.remove(),1000);
}
function fxCard(u,cls){
 const e=document.querySelector('[data-card="'+u.id+'"]');if(!e)return;
 e.classList.remove(cls);void e.offsetWidth;e.classList.add(cls);setTimeout(()=>e.classList.remove(cls),720);
}
function fxUltimateScreen(){
 const a=$("#arena");if(!a)return;a.classList.remove("ultScreenFlash");void a.offsetWidth;a.classList.add("ultScreenFlash");setTimeout(()=>a.classList.remove("ultScreenFlash"),700);
}
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
 if(ctx.mode==="arena"){
  const o=ctx.opponent;$("#resultStage").textContent="Arena • "+o.name;
  if(win){
   const gain=20+Math.max(0,Math.round((o.rating-save.arenaRating)/25));
   save.arenaRating+=gain;save.arenaCoins+=25;save.arenaDailyPoints+=gain;save.guildContribution+=20;
   save.dailyCounters.arenaWins=(save.dailyCounters.arenaWins||0)+1;save.lifetime.arenaWins=(save.lifetime.arenaWins||0)+1;persist();
   $("#resultText").textContent="Vitória na Arena! Ranking, Moedas da Arena e contribuição recebidos.";
   $("#resultRewards").innerHTML=`<span class="reward">🏆 Rating<strong>+${gain}</strong></span><span class="reward">🏟️ Moedas<strong>+25</strong></span><span class="reward">🤝 Contribuição<strong>+20</strong></span>`;
  }else{
   const loss=Math.min(8,Math.max(3,Math.round((save.arenaRating-o.rating)/40)+5));
   save.arenaRating=Math.max(800,save.arenaRating-loss);save.arenaCoins+=5;save.guildContribution+=5;persist();
   $("#resultText").textContent="Derrota na Arena. Você recebeu uma pequena recompensa de participação.";
   $("#resultRewards").innerHTML=`<span class="reward">🏆 Rating<strong>-${loss}</strong></span><span class="reward">🏟️ Moedas<strong>+5</strong></span><span class="reward">🤝 Contribuição<strong>+5</strong></span>`;
  }
  renderMissions("daily");next.style.display="none";retry.style.display="none";$("#resultMenuBtn").textContent="Voltar à Arena";$("#resultModal").classList.add("show");return;
 }
 const s=ctx;$("#resultStage").textContent="Fase "+s.code+" • "+s.name;$("#resultMenuBtn").textContent="Voltar ao menu";
 if(win){
  const rw=grantCampaignRewards(s),sh=hero(rw.shardHero),g=GEAR[rw.gearId],cont=10+s.id*3;
  save.guildContribution+=cont;save.dailyCounters.campaignWins=(save.dailyCounters.campaignWins||0)+1;save.lifetime.campaignWins=(save.lifetime.campaignWins||0)+1;persist();
  $("#resultText").textContent=s.id<5?"Próxima fase desbloqueada. O equipamento recebido já está no inventário.":"Capítulo 1 concluído!";
  $("#resultRewards").innerHTML=`<span class="reward">🪙 Ouro<strong>+${rw.gold}</strong></span><span class="reward">⭐ EXP<strong>+${rw.exp}</strong></span><span class="reward">💎 Diamantes<strong>+${rw.diamonds}</strong></span><span class="reward">${sh.emoji} Fragmentos<strong>+${rw.shards}</strong></span><span class="reward">🤝 Contribuição<strong>+${cont}</strong></span><span class="reward gearReward">🎁 Equipamento<strong class="dropName">${g.icon} ${g.name}</strong></span>${rw.scrolls?'<span class="reward">📜 Pergaminho<strong>+1</strong></span>':""}`;
  next.style.display=s.id<STAGES.length?"":"none";retry.style.display="none";
 }else{
  $("#resultText").textContent="Melhore níveis/equipamentos ou ajuste a formação e tente novamente.";
  $("#resultRewards").innerHTML='<span class="reward">Sem recompensas<strong>—</strong></span>';next.style.display="none";retry.style.display="";
 }
 renderMissions("daily");$("#resultModal").classList.add("show");
}
function closeResult(){$("#resultModal").classList.remove("show");try{screen.orientation?.unlock?.()}catch{}}
function goNextStage(){const s=stage();if(s.id>=STAGES.length)return;save.selectedStage=s.id+1;persist();closeResult();renderFormation();show("formationScreen")}
function retryStage(){closeResult();if(lastBattleMode==="arena")renderArena();else startBattle()}
function goResultMenu(){closeResult();if(lastBattleMode==="arena"){generateArenaOpponents();renderArena();show("arenaScreen")}else{renderCampaign();renderHeroes();show("homeScreen")}}

/* NAVEGAÇÃO */
function openNav(key){
 const map={
  campaign:()=>{renderCampaign();show("campaignScreen")},
  heroes:()=>{renderHeroes();show("heroesScreen")},
  portal:()=>{renderPortal();show("portalScreen")},
  arena:()=>{renderArena();show("arenaScreen")},
  shop:()=>{renderShop();show("shopScreen")},
  missions:()=>{renderMissions("daily");show("missionsScreen")}
 };
 if(map[key])map[key]();
}
$$(".bottomNav button[data-nav]").forEach(b=>b.onclick=()=>openNav(b.dataset.nav));

$("#goCampaign").onclick=()=>openNav("campaign");$("#campaignBack").onclick=()=>show("homeScreen");
$("#goFormation").onclick=()=>{renderFormation();show("formationScreen")};$("#formationBack").onclick=()=>show("homeScreen");
$("#goHeroes").onclick=()=>openNav("heroes");$("#heroesBack").onclick=()=>show("homeScreen");
$("#goPortal").onclick=()=>openNav("portal");$("#portalBack").onclick=()=>show("homeScreen");
$("#goArena").onclick=()=>openNav("arena");$("#arenaBack").onclick=()=>show("homeScreen");$("#refreshArena").onclick=()=>{generateArenaOpponents();renderArena()};
$("#goShop").onclick=()=>openNav("shop");$("#shopBack").onclick=()=>show("homeScreen");
$("#goMissions").onclick=()=>openNav("missions");$("#missionsBack").onclick=()=>show("homeScreen");
$("#goGuild").onclick=()=>{renderGuild();show("guildScreen")};$("#guildBack").onclick=()=>show("homeScreen");
$("#missionsGuildBtn").onclick=()=>{renderGuild();show("guildScreen")};
$("#dailyTab").onclick=()=>renderMissions("daily");$("#achievementTab").onclick=()=>renderMissions("achievements");
$("#startBattle").onclick=startBattle;$("#quickBattle").onclick=quick;$("#summonOne").onclick=()=>summon(1);$("#summonTen").onclick=()=>summon(10);
$("#battleBack").onclick=()=>{if(battle)battle.ended=true;try{screen.orientation?.unlock?.()}catch{}if(lastBattleMode==="arena"){renderArena();show("arenaScreen")}else{renderCampaign();show("campaignScreen")}};
$("#speed1").onclick=()=>{if(battle){battle.speed=1;renderBattle()}};$("#speed2").onclick=()=>{if(battle){battle.speed=2;renderBattle()}};
$("#pauseBtn").onclick=()=>{if(battle&&!battle.ended){battle.paused=!battle.paused;renderBattle()}};
$("#modeBtn").onclick=()=>{if(battle&&!battle.ended){battle.mode=battle.mode==="manual"?"auto":"manual";battle.log("🤖 Ultimate: "+battle.mode.toUpperCase(),"ultimate");renderBattle()}};
$("#nextStageBtn").onclick=goNextStage;$("#retryBtn").onclick=retryStage;$("#resultMenuBtn").onclick=goResultMenu;

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
if("serviceWorker"in navigator){addEventListener("load",()=>{navigator.serviceWorker.register("./sw-1.1.0.js",{scope:"./",updateViaCache:"none"}).then(r=>{reg=r;r.update().catch(()=>{})}).catch(()=>{});checkUpdate(false)})}else addEventListener("load",()=>checkUpdate(false));
setTimeout(()=>hideSplash(0),3500);
$("#installAppBtn").onclick=install;$("#splashInstallBtn").onclick=install;$("#checkUpdateBtn").onclick=async()=>{const has=await checkUpdate(true);if(has)updateNow()};$("#splashUpdateBtn").onclick=updateNow;

resetDailyMissions();dailyArenaReset();renderResources();renderCampaign();renderFormation();renderHeroes();renderPortal();renderShop();renderMissions("daily");renderGuild();updateMissionIndicators();
})();