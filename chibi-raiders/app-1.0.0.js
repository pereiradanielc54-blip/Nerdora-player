(()=>{"use strict";

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const APP_VERSION="1.0.0";
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

function persist(){save.formation={...formation};localStorage.setItem(SAVE_KEY,JSON.stringify(save));renderResources()}
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
function heroStats(h){
 const lv=save.heroLevels[h.id]||1,b=gearBonus(h.id);
 return{level:lv,hp:Math.round(h.hp*(1+.08*(lv-1)))+b.hp,pa:Math.round(h.pa*(1+.07*(lv-1)))+b.pa,ma:Math.round(h.ma*(1+.07*(lv-1)))+b.ma,pd:Math.round(h.pd*(1+.045*(lv-1)))+b.pd,md:Math.round(h.md*(1+.045*(lv-1)))+b.md,sp:Math.round(h.sp*(1+.004*(lv-1)))+b.sp,cr:h.cr,dg:h.dg};
}
function addGear(id,qty=1){save.gearInventory[id]=(save.gearInventory[id]||0)+qty}
function show(id){$$(".screen").forEach(e=>e.classList.remove("active"));$("#"+id).classList.add("active");$("#game").classList.toggle("battle-mode",id==="battleScreen");renderResources()}
function renderResources(){
 $$("[data-res]").forEach(e=>{const k=e.dataset.res;if(k==="accountLevel")e.textContent=accountLevel();else e.textContent=save[k]??0});
}
let toastTimer=null;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}
function currencyIcon(c){return c==="gold"?"🪙":c==="diamonds"?"💎":"🏟️"}

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
function levelUp(id){const lv=save.heroLevels[id]||1,cost=levelCost(id);if(lv>=20||save.gold<cost)return;save.gold-=cost;save.heroLevels[id]=lv+1;persist();renderHeroes();renderFormation();toast("⬆ "+hero(id).name+" subiu para Nv."+(lv+1))}
function usePotion(id){if(save.potions<1||(save.heroLevels[id]||1)>=20)return;save.potions--;save.heroLevels[id]++;persist();renderHeroes();renderFormation();toast("🧪 Nível aumentado com Poção")}
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
 persist();renderSummonResults(results);renderHeroes();renderFormation();
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
 damage(a,t,type,ratio,opt={}){if(!t||t.dead)return;if(!opt.noDodge&&Math.random()<t.dg){this.log("💨 "+t.name+" esquivou.","dodge");float(t,"ESQUIVA","dodge");return}const atk=type==="magic"?a.ma:a.pa,def=opt.pierce?0:(type==="magic"?t.md:t.pd),mit=def/(def+600);let n=atk*ratio*(.94+Math.random()*.12)*(1-mit);if(t.shield)n*=1-t.shield;const crit=Math.random()<a.cr;if(crit)n*=1.5;n=Math.max(1,Math.round(n));t.hp=Math.max(0,t.hp-n);a.gain(25);t.gain(15);this.log((opt.ult?"💥 ULTIMATE • ":"")+(crit?"💢 CRÍTICO • ":"")+a.name+" causou "+n+" em "+t.name+".",opt.ult?"ultimate":crit?"crit":"");float(t,"-"+n,opt.ult?"ult":crit?"crit":"hit");if(!t.hp)this.kill(t,a);renderBattle()}
 kill(t,k){if(t.dead)return;t.dead=true;t.hp=0;if(k)k.gain(25);this.log("☠️ "+t.name+" foi derrotado.","death")}
 heal(a,t,r){if(!t||t.dead)return;const n=Math.min(t.maxHp-t.hp,Math.round(Math.max(a.ma,a.pa*.55)*r));t.hp+=n;this.log("💚 "+a.name+" curou "+t.name+" em "+n+" HP.");float(t,"+"+n,"heal")}
 async basic(u){const t=this.targetFor(u);if(!t)return;this.target=t;this.log("⚔️ "+u.name+" ataca "+t.name+".");renderBattle();await this.delay(650);this.damage(u,t,u.type,1)}
 async ult(u){if(u.rage<100||u.dead)return;u.rage=0;u.queued=false;const z=u.h.ult;banner(u.emoji+" "+z.name+"!");this.log("━━━━━━━━ 💥 ULTIMATE • "+u.name+" usa "+z.name+"! ━━━━━━━━","ultimate");await this.delay(900);if(z.kind==="heal"){this.living(this.allies(u)).forEach(t=>this.heal(u,t,z.ratio));if(z.effect==="shield")this.living(this.allies(u)).forEach(t=>t.shield=Math.max(t.shield,.32))}else if(z.kind==="single"){const t=this.weak(this.enemies(u));let r=z.ratio;if(z.effect==="execute"&&t&&t.hp/t.maxHp<.35)r*=1.35;this.damage(u,t,u.type,r,{ult:true,noDodge:true})}else if(z.kind==="multi"){for(let i=0;i<(z.hits||5);i++){const t=this.weak(this.enemies(u));if(!t)break;this.damage(u,t,u.type,z.ratio,{ult:true,noDodge:true});await this.delay(220)}}else{const typ=z.kind==="aoeMagic"?"magic":u.type;for(const t of [...this.living(this.enemies(u))]){this.damage(u,t,typ,z.ratio,{ult:true,noDodge:true,pierce:z.effect==="pierce"});await this.delay(220)}}if(z.effect==="bleed")this.living(this.enemies(u)).forEach(t=>t.bleed=3);if(z.effect==="break")this.living(this.enemies(u)).forEach(t=>t.broken=.30);if(z.effect==="slow")this.living(this.enemies(u)).forEach(t=>t.slow=.22);if(z.effect==="freeze")this.living(this.enemies(u)).slice(0,2).forEach(t=>t.freeze=1);if(z.effect==="shield")this.living(this.allies(u)).forEach(t=>t.shield=Math.max(t.shield,.42));if(z.effect==="haste")this.living(this.allies(u)).forEach(t=>t.haste=.20);renderBattle()}
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
function float(u,t,c){const e=document.querySelector('[data-card="'+u.id+'"]');if(!e)return;const a=$("#arena").getBoundingClientRect(),r=e.getBoundingClientRect(),d=document.createElement("div");d.className="floatText "+c;d.textContent=t;d.style.left=(r.left-a.left+r.width/2)+"px";d.style.top=(r.top-a.top+20)+"px";$("#arena").appendChild(d);setTimeout(()=>d.remove(),820)}
function banner(t){const b=$("#ultBanner");b.textContent=t;b.classList.remove("show");void b.offsetWidth;b.classList.add("show")}

/* RESULTADOS */
function rollGearDrop(s){const pool=DROP_POOLS[s.id]||DROP_POOLS[1];return pool[Math.floor(Math.random()*pool.length)]}
function grantCampaignRewards(s){
 const r=s.rewards;save.gold+=r.gold;save.accountExp+=r.exp;save.essence+=r.essence;save.diamonds+=r.diamonds||0;save.scrolls+=r.scrolls||0;
 const team=used(),shardHero=team[(s.id-1)%team.length]||"seraphina";save.shards[shardHero]=(save.shards[shardHero]||0)+r.shards;
 const gearId=rollGearDrop(s);addGear(gearId,1);if(s.id<STAGES.length)save.unlockedStage=Math.max(save.unlockedStage,s.id+1);persist();return{...r,shardHero,gearId};
}
function finishBattle(win,ctx){
 const next=$("#nextStageBtn"),retry=$("#retryBtn");$("#resultBadge").textContent=win?"🏆":"💀";$("#resultTitle").textContent=win?"Vitória!":"Derrota";
 if(ctx.mode==="arena"){
  const o=ctx.opponent;$("#resultStage").textContent="Arena • "+o.name;
  if(win){const gain=20+Math.max(0,Math.round((o.rating-save.arenaRating)/25));save.arenaRating+=gain;save.arenaCoins+=25;save.arenaDailyPoints+=gain;persist();$("#resultText").textContent="Vitória na Arena! Ranking e Moedas de Arena recebidos.";$("#resultRewards").innerHTML=`<span class="reward">🏆 Rating<strong>+${gain}</strong></span><span class="reward">🏟️ Moedas<strong>+25</strong></span>`;}
  else{const loss=Math.min(8,Math.max(3,Math.round((save.arenaRating-o.rating)/40)+5));save.arenaRating=Math.max(800,save.arenaRating-loss);save.arenaCoins+=5;persist();$("#resultText").textContent="Derrota na Arena. Você ainda recebeu uma pequena recompensa de participação.";$("#resultRewards").innerHTML=`<span class="reward">🏆 Rating<strong>-${loss}</strong></span><span class="reward">🏟️ Moedas<strong>+5</strong></span>`;}
  next.style.display="none";retry.style.display="none";$("#resultMenuBtn").textContent="Voltar à Arena";$("#resultModal").classList.add("show");return;
 }
 const s=ctx;$("#resultStage").textContent="Fase "+s.code+" • "+s.name;$("#resultMenuBtn").textContent="Voltar ao menu";
 if(win){const rw=grantCampaignRewards(s),sh=hero(rw.shardHero),g=GEAR[rw.gearId];$("#resultText").textContent=s.id<5?"Próxima fase desbloqueada. O equipamento recebido já está no inventário.":"Capítulo 1 concluído!";$("#resultRewards").innerHTML=`<span class="reward">🪙 Ouro<strong>+${rw.gold}</strong></span><span class="reward">⭐ EXP<strong>+${rw.exp}</strong></span><span class="reward">💎 Diamantes<strong>+${rw.diamonds}</strong></span><span class="reward">${sh.emoji} Fragmentos<strong>+${rw.shards}</strong></span><span class="reward gearReward">🎁 Equipamento<strong class="dropName">${g.icon} ${g.name}</strong></span>${rw.scrolls?'<span class="reward">📜 Pergaminho<strong>+1</strong></span>':""}`;next.style.display=s.id<STAGES.length?"":"none";retry.style.display="none";}
 else{$("#resultText").textContent="Melhore níveis/equipamentos ou ajuste a formação e tente novamente.";$("#resultRewards").innerHTML='<span class="reward">Sem recompensas<strong>—</strong></span>';next.style.display="none";retry.style.display="";}
 $("#resultModal").classList.add("show");
}
function closeResult(){$("#resultModal").classList.remove("show");try{screen.orientation?.unlock?.()}catch{}}
function goNextStage(){const s=stage();if(s.id>=STAGES.length)return;save.selectedStage=s.id+1;persist();closeResult();renderFormation();show("formationScreen")}
function retryStage(){closeResult();if(lastBattleMode==="arena")renderArena();else startBattle()}
function goResultMenu(){closeResult();if(lastBattleMode==="arena"){generateArenaOpponents();renderArena();show("arenaScreen")}else{renderCampaign();renderHeroes();show("homeScreen")}}

/* NAVEGAÇÃO */
$("#goCampaign").onclick=()=>{renderCampaign();show("campaignScreen")};$("#campaignBack").onclick=()=>show("homeScreen");
$("#goFormation").onclick=()=>{renderFormation();show("formationScreen")};$("#formationBack").onclick=()=>show("homeScreen");
$("#goHeroes").onclick=()=>{renderHeroes();show("heroesScreen")};$("#heroesBack").onclick=()=>show("homeScreen");
$("#goPortal").onclick=()=>{renderPortal();show("portalScreen")};$("#portalBack").onclick=()=>show("homeScreen");
$("#goArena").onclick=()=>{renderArena();show("arenaScreen")};$("#arenaBack").onclick=()=>show("homeScreen");$("#refreshArena").onclick=()=>{generateArenaOpponents();renderArena()};
$("#goShop").onclick=()=>{renderShop();show("shopScreen")};$("#shopBack").onclick=()=>show("homeScreen");
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
if("serviceWorker"in navigator){addEventListener("load",()=>{navigator.serviceWorker.register("./sw-1.0.0.js",{scope:"./",updateViaCache:"none"}).then(r=>{reg=r;r.update().catch(()=>{})}).catch(()=>{});checkUpdate(false)})}else addEventListener("load",()=>checkUpdate(false));
setTimeout(()=>hideSplash(0),3500);
$("#installAppBtn").onclick=install;$("#splashInstallBtn").onclick=install;$("#checkUpdateBtn").onclick=async()=>{const has=await checkUpdate(true);if(has)updateNow()};$("#splashUpdateBtn").onclick=updateNow;

dailyArenaReset();renderResources();renderCampaign();renderFormation();renderHeroes();renderPortal();renderShop();
})();