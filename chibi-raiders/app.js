(()=>{"use strict";

const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SAVE_KEY="nerdora_chibi_raiders_v090";
const APP_VERSION="0.9.0";

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
{id:1,code:"1-1",name:"Portões do Vale",enemyLevel:1,scale:.58,power:"Muito fácil",rewards:{gold:600,exp:250,essence:2,shards:1}},
{id:2,code:"1-2",name:"Trilha dos Goblins",enemyLevel:2,scale:.68,power:"Fácil",rewards:{gold:760,exp:320,essence:3,shards:1}},
{id:3,code:"1-3",name:"Ruínas Rubras",enemyLevel:3,scale:.79,power:"Normal",rewards:{gold:940,exp:400,essence:4,shards:2}},
{id:4,code:"1-4",name:"Ponte do Crepúsculo",enemyLevel:4,scale:.91,power:"Desafio",rewards:{gold:1160,exp:500,essence:5,shards:2}},
{id:5,code:"1-5",name:"Guardião das Chamas",enemyLevel:5,scale:1.04,power:"Chefe",rewards:{gold:1500,exp:650,essence:8,shards:3}}
];

const SLOTS=[
{id:"F1",line:"front",label:"Frente 1"},{id:"F2",line:"front",label:"Frente 2"},
{id:"B1",line:"back",label:"Trás 1"},{id:"B2",line:"back",label:"Trás 2"},{id:"B3",line:"back",label:"Trás 3"}
];
const POS={F1:{x:57,y:18},F2:{x:57,y:59},B1:{x:4,y:4},B2:{x:4,y:37},B3:{x:4,y:70}};

function defaultSave(){
 const heroLevels={},shards={};
 HEROES.forEach(h=>{heroLevels[h.id]=1;shards[h.id]=0});
 return{
  gold:1200,accountExp:0,essence:0,unlockedStage:1,selectedStage:1,
  heroLevels,shards,
  formation:{F1:"quebra",F2:"valquiria",B1:"seraphina",B2:"umbra",B3:"crepusculo"}
 };
}
function loadSave(){
 const d=defaultSave();
 try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  return{
   ...d,...s,
   heroLevels:{...d.heroLevels,...(s.heroLevels||{})},
   shards:{...d.shards,...(s.shards||{})},
   formation:{...d.formation,...(s.formation||{})}
  };
 }catch{return d}
}
let save=loadSave(),formation={...save.formation},activeSlot="F1",selectedHero="seraphina",battle=null,deferred=null,reg=null;

function persist(){
 save.formation={...formation};
 localStorage.setItem(SAVE_KEY,JSON.stringify(save));
 renderResources();
}
function hero(id){return HEROES.find(h=>h.id===id)}
function stage(id=save.selectedStage){return STAGES.find(s=>s.id===id)||STAGES[0]}
function used(){return Object.values(formation).filter(Boolean)}
function accountLevel(){return 1+Math.floor(save.accountExp/1000)}
function levelCost(id){const lv=save.heroLevels[id]||1;return 250+lv*180}
function heroStats(h){
 const lv=save.heroLevels[h.id]||1;
 return{
  level:lv,
  hp:Math.round(h.hp*(1+.08*(lv-1))),
  pa:Math.round(h.pa*(1+.07*(lv-1))),
  ma:Math.round(h.ma*(1+.07*(lv-1))),
  pd:Math.round(h.pd*(1+.045*(lv-1))),
  md:Math.round(h.md*(1+.045*(lv-1))),
  sp:Math.round(h.sp*(1+.004*(lv-1))),
  cr:h.cr,dg:h.dg
 };
}
function show(id){
 document.querySelectorAll(".screen").forEach(e=>e.classList.remove("active"));
 $("#"+id).classList.add("active");
 $("#game").classList.toggle("battle-mode",id==="battleScreen");
 renderResources();
}
function renderResources(){
 const pairs=[
  ["homeGold",save.gold],["campaignGold",save.gold],["heroesGold",save.gold],
  ["homeAccountLevel",accountLevel()],["campaignExp",save.accountExp],["homeEssence",save.essence]
 ];
 pairs.forEach(([id,v])=>{const e=$("#"+id);if(e)e.textContent=v});
}
function renderCampaign(){
 const grid=$("#stageGrid");grid.innerHTML="";
 STAGES.forEach(s=>{
  const unlocked=s.id<=save.unlockedStage,sel=s.id===save.selectedStage;
  const b=document.createElement("button");
  b.className="stageCard"+(!unlocked?" locked":"")+(sel?" selected":"");
  b.disabled=!unlocked;
  b.innerHTML=`<div class="stageNode">${unlocked?s.code:"🔒"}</div>
   <div class="stageInfo"><b>Fase ${s.code} • ${s.name}</b><small>Inimigos Nv.${s.enemyLevel} • ${s.power}<br>Recompensa: 🪙${s.rewards.gold} • ⭐${s.rewards.exp} • ✨${s.rewards.essence}</small></div>
   <div class="stagePower"><strong>${unlocked?"JOGAR":"BLOQUEADA"}</strong><span>Força ×${s.scale.toFixed(2)}</span></div>`;
  b.onclick=()=>{save.selectedStage=s.id;persist();renderCampaign();renderFormation();show("formationScreen")};
  grid.appendChild(b);
 });
}
function renderFormation(){
 const s=stage();
 const info=$("#formationStageInfo");
 if(info)info.innerHTML=`<div><b>🗺️ Fase ${s.code} • ${s.name}</b><br><span>Inimigos Nv.${s.enemyLevel} • dificuldade ${s.power}</span></div><div class="badge">×${s.scale.toFixed(2)}</div>`;
 const board=$("#formationBoard");board.innerHTML="";
 SLOTS.forEach(slot=>{
  const h=formation[slot.id]?hero(formation[slot.id]):null,e=document.createElement("button");
  e.className="slot "+slot.line+(activeSlot===slot.id?" selected":"")+(h?" filled":"");
  e.dataset.slot=slot.id;
  e.innerHTML=h?`<span class="emoji">${h.emoji}</span><b>${h.name}</b><em>Nv.${save.heroLevels[h.id]} • ${slot.label}</em>`:`<span class="emoji">＋</span><b>${slot.label}</b><em>${slot.line==="front"?"Front-line":"Back-line"}</em>`;
  e.onclick=()=>{activeSlot=slot.id;renderFormation()};board.appendChild(e);
 });
 const roster=$("#roster");roster.innerHTML="";
 HEROES.forEach(h=>{
  const st=heroStats(h),e=document.createElement("button");
  e.className="rosterCard"+(used().includes(h.id)?" used":"");
  e.innerHTML=`<div class="rosterHead"><span class="avatar">${h.emoji}</span><div><b>${h.name}</b><div class="meta">Nv.${st.level} • ${h.role} • SPD ${st.sp}</div></div></div><div class="rosterStats"><span>HP ${st.hp}</span><span>ATQ ${Math.max(st.pa,st.ma)}</span><span>DEF ${Math.max(st.pd,st.md)}</span></div>`;
  e.onclick=()=>{Object.keys(formation).forEach(k=>{if(formation[k]===h.id)formation[k]=null});formation[activeSlot]=h.id;const i=SLOTS.findIndex(x=>x.id===activeSlot);activeSlot=SLOTS[Math.min(i+1,4)].id;persist();renderFormation()};
  roster.appendChild(e);
 });
 $("#selectedCount").textContent=used().length;
 $("#startBattle").disabled=used().length!==5;
}
function renderHeroes(){
 const grid=$("#heroManageGrid");grid.innerHTML="";
 HEROES.forEach(h=>{
  const st=heroStats(h),e=document.createElement("button");
  e.className="heroManageCard"+(selectedHero===h.id?" selected":"");
  e.innerHTML=`<div class="heroManageTop"><span class="heroManageEmoji">${h.emoji}</span><div><div class="heroManageName">${h.name}</div><div class="heroManageMeta">${h.role} • Nv.${st.level}</div></div></div><div class="heroManageBars"><span>HP ${st.hp}</span><span>ATQ ${Math.max(st.pa,st.ma)}</span></div>`;
  e.onclick=()=>{selectedHero=h.id;renderHeroes()};grid.appendChild(e);
 });
 const h=hero(selectedHero),st=heroStats(h),cost=levelCost(h.id),max=st.level>=20;
 $("#heroDetail").innerHTML=`<div class="heroDetailHeader"><div class="heroDetailAvatar">${h.emoji}</div><div class="heroDetailTitle"><h2>${h.name}</h2><p>${h.role} • ${h.line==="front"?"Front-line":"Back-line"} • ${h.type==="magic"?"Mágico":"Físico"}</p></div></div>
 <div class="heroStatGrid">
  <div class="heroStat"><span>HP Máximo</span><b>${st.hp}</b></div><div class="heroStat"><span>Velocidade</span><b>${st.sp}</b></div>
  <div class="heroStat"><span>ATQ Físico</span><b>${st.pa}</b></div><div class="heroStat"><span>ATQ Mágico</span><b>${st.ma}</b></div>
  <div class="heroStat"><span>DEF Física</span><b>${st.pd}</b></div><div class="heroStat"><span>DEF Mágica</span><b>${st.md}</b></div>
  <div class="heroStat"><span>Crítico</span><b>${Math.round(st.cr*100)}%</b></div><div class="heroStat"><span>Esquiva</span><b>${Math.round(st.dg*100)}%</b></div>
 </div>
 <div class="levelPanel"><div class="levelProgress"><b>Nível ${st.level}${max?" • MÁXIMO":""}</b><span>🪙 Ouro: ${save.gold}</span></div>
 <button id="levelUpBtn" class="btn primary levelUpBtn" ${max||save.gold<cost?"disabled":""}>${max?"Nível máximo":"⬆ Subir de Nível • 🪙 "+cost}</button>
 <div class="levelGain">Cada nível: +8% HP base • +7% Ataque base • +4,5% Defesa</div>
 <div class="shardLine">🧩 Fragmentos deste herói: <b>${save.shards[h.id]||0}</b> • Ultimate: <b>${h.ult.name}</b></div></div>`;
 const btn=$("#levelUpBtn");
 if(btn)btn.onclick=()=>levelUp(h.id);
}
function levelUp(id){
 const lv=save.heroLevels[id]||1,cost=levelCost(id);
 if(lv>=20||save.gold<cost)return;
 save.gold-=cost;save.heroLevels[id]=lv+1;persist();renderHeroes();renderFormation();
}

class Unit{
 constructor(h,team,slot,opt={}){
  const enemy=team==="enemy",lv=opt.level||1,scale=opt.scale||1,st=enemy?{
   hp:Math.round(h.hp*scale),pa:Math.round(h.pa*scale),ma:Math.round(h.ma*scale),
   pd:Math.round(h.pd*scale),md:Math.round(h.md*scale),sp:Math.round(h.sp*(.94+scale*.06)),cr:h.cr*.65,dg:h.dg*.60
  }:heroStats(h);
  Object.assign(this,{h,team,slot,level:enemy?lv:st.level,id:team+"_"+h.id+"_"+slot.id,name:h.name,emoji:h.emoji,role:h.role,style:h.style,type:h.type,
   maxHp:st.hp,pa:st.pa,ma:st.ma,basePd:st.pd,baseMd:st.md,baseSp:st.sp,cr:st.cr,dg:st.dg,hp:st.hp,rage:0,dead:false,shield:0,bleed:0,freeze:0,slow:0,haste:0,broken:0,queued:false});
 }
 get line(){return this.slot.line}
 get sp(){return Math.max(1,Math.round(this.baseSp*(1-this.slow+this.haste)))}
 get pd(){return Math.max(0,Math.round(this.basePd*(this.line==="front"?1.15:1)*(1-this.broken)))}
 get md(){return Math.max(0,Math.round(this.baseMd*(this.line==="front"?1.10:1)))}
 gain(v){if(!this.dead)this.rage=clamp(this.rage+v,0,100)}
}

class Battle{
 constructor(p,e,stageData){
  this.p=p;this.e=e;this.stage=stageData;this.round=0;this.q=[];this.i=0;this.current=null;this.target=null;
  this.speed=1;this.paused=false;this.mode="manual";this.ended=false;this.logN=0;
 }
 living(a){return a.filter(x=>!x.dead)}
 enemies(u){return u.team==="player"?this.e:this.p}
 allies(u){return u.team==="player"?this.p:this.e}
 log(t,c=""){const x=document.createElement("div");x.className=c;x.textContent=String(++this.logN).padStart(2,"0")+" • "+t;$("#battleLog").appendChild(x);$("#battleLog").scrollTop=$("#battleLog").scrollHeight}
 async delay(ms=1750){let left=ms/this.speed,last=performance.now();while(left>0&&!this.ended){await new Promise(r=>setTimeout(r,50));if(this.paused){last=performance.now();continue}const n=performance.now();left-=n-last;last=n}}
 roundStart(){
  this.round++;
  [...this.p,...this.e].forEach(u=>{if(u.dead)return;if(u.bleed){u.bleed--;const d=Math.round(u.maxHp*.03);u.hp=Math.max(0,u.hp-d);this.log("🩸 "+u.name+" sofreu "+d+" de sangramento.");if(!u.hp)this.kill(u,null)}u.slow=Math.max(0,u.slow-.06);u.haste=Math.max(0,u.haste-.06);u.broken=Math.max(0,u.broken-.08);u.shield=Math.max(0,u.shield-.08)});
  this.q=[...this.living(this.p),...this.living(this.e)].sort((a,b)=>b.sp-a.sp||a.name.localeCompare(b.name));this.i=0;
  this.log("🔄 Rodada "+this.round+": iniciativa recalculada por Speed.","round");renderBattle();
 }
 valid(u){const a=this.living(this.enemies(u));if(u.style==="melee"){const f=a.filter(x=>x.line==="front");if(f.length)return f}return a}
 targetFor(u){const a=this.valid(u);if(!a.length)return null;let total=a.reduce((s,x)=>s+(x.line==="front"?1.8:.65),0),r=Math.random()*total;for(const x of a){r-=x.line==="front"?1.8:.65;if(r<=0)return x}return a[0]}
 weak(a){return this.living(a).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0]}
 damage(a,t,type,ratio,opt={}){
  if(!t||t.dead)return;
  if(!opt.noDodge&&Math.random()<t.dg){this.log("💨 "+t.name+" esquivou.","dodge");float(t,"ESQUIVA","dodge");return}
  const atk=type==="magic"?a.ma:a.pa,def=opt.pierce?0:(type==="magic"?t.md:t.pd),mit=def/(def+600);
  let n=atk*ratio*(.94+Math.random()*.12)*(1-mit);if(t.shield)n*=1-t.shield;
  const crit=Math.random()<a.cr;if(crit)n*=1.5;n=Math.max(1,Math.round(n));
  t.hp=Math.max(0,t.hp-n);a.gain(25);t.gain(15);
  this.log((opt.ult?"💥 ULTIMATE • ":"")+(crit?"💢 CRÍTICO • ":"")+a.name+" causou "+n+" em "+t.name+".",opt.ult?"ultimate":crit?"crit":"");
  float(t,"-"+n,opt.ult?"ult":crit?"crit":"hit");if(!t.hp)this.kill(t,a);renderBattle();
 }
 kill(t,k){if(t.dead)return;t.dead=true;t.hp=0;if(k)k.gain(25);this.log("☠️ "+t.name+" foi derrotado.","death")}
 heal(a,t,r){if(!t||t.dead)return;const n=Math.min(t.maxHp-t.hp,Math.round(Math.max(a.ma,a.pa*.55)*r));t.hp+=n;this.log("💚 "+a.name+" curou "+t.name+" em "+n+" HP.");float(t,"+"+n,"heal")}
 async basic(u){const t=this.targetFor(u);if(!t)return;this.target=t;this.log("⚔️ "+u.name+" ataca "+t.name+".");renderBattle();await this.delay(650);this.damage(u,t,u.type,1)}
 async ult(u){
  if(u.rage<100||u.dead)return;u.rage=0;u.queued=false;const z=u.h.ult;
  banner(u.emoji+" "+z.name+"!");this.log("━━━━━━━━ 💥 ULTIMATE • "+u.name+" usa "+z.name+"! ━━━━━━━━","ultimate");await this.delay(900);
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
 check(){
  const p=this.living(this.p).length,e=this.living(this.e).length;if(p&&e)return false;if(this.ended)return true;
  this.ended=true;setTimeout(()=>finishBattle(!!p,this.stage),250);return true;
 }
 async loop(){
  this.roundStart();
  while(!this.ended){
   if(this.paused){await this.delay(100);continue}
   if(this.check())break;
   if(this.mode==="auto"){const r=this.living(this.p).find(x=>x.rage>=100);if(r){await this.ult(r);await this.delay(1750);continue}}
   if(this.i>=this.q.length){this.roundStart();await this.delay(1000);continue}
   const u=this.q[this.i++];if(u.dead)continue;this.current=u;this.target=null;$("#actionLabel").textContent="Vez de "+u.name;renderBattle();
   if(u.freeze){u.freeze--;this.log("❄️ "+u.name+" está congelado e perde a ação.");await this.delay(1750)}
   else if(u.team==="enemy"&&u.rage>=100)await this.ult(u);
   else if(u.team==="player"&&this.mode==="manual"&&u.queued&&u.rage>=100)await this.ult(u);
   else await this.basic(u);
   this.current=null;this.target=null;renderBattle();if(this.check())break;await this.delay(1750);
  }
 }
}

function playerTeam(){return SLOTS.map(s=>new Unit(hero(formation[s.id]),"player",s))}
function enemyFormation(s){
 const comps=[
  ["terra","espinho","crepusculo","anao","fada"],
  ["quebra","valquiria","umbra","crepusculo","seraphina"],
  ["terra","relampago","espinho","anao","fada"],
  ["quebra","valquiria","relampago","crepusculo","umbra"],
  ["terra","quebra","valquiria","crepusculo","relampago"]
 ];
 const ids=comps[s.id-1]||comps[0];return Object.fromEntries(SLOTS.map((slot,i)=>[slot.id,ids[i]]));
}
function enemyTeam(s){const form=enemyFormation(s);return SLOTS.map(slot=>new Unit(hero(form[slot.id]),"enemy",slot,{level:s.enemyLevel,scale:s.scale}))}
async function landscape(){try{await screen.orientation?.lock?.("landscape")}catch{}}
function startBattle(){
 if(used().length!==5)return;
 const s=stage();landscape();battle=new Battle(playerTeam(),enemyTeam(s),s);
 show("battleScreen");$("#battleStageName").textContent="FASE "+s.code;$("#battleLog").innerHTML="";
 battle.log("⚔️ Fase "+s.code+" iniciada • Inimigos Nv."+s.enemyLevel+".");renderBattle();battle.loop();
}
function quick(){if(used().length!==5){renderFormation();show("formationScreen");return}startBattle()}
function pos(u){const p=POS[u.slot.id];return u.team==="player"?"left:"+p.x+"%;top:"+p.y+"%;":"right:"+p.x+"%;top:"+p.y+"%;"}
function card(u){
 const hp=clamp(u.hp/u.maxHp*100,0,100),r=clamp(u.rage,0,100),ready=r>=100&&!u.dead;
 const st=(u.shield?"🛡️":"")+(u.bleed?"🩸":"")+(u.freeze?"❄️":"")+(u.slow?"🐌":"")+(u.broken?"🔨":"");
 return `<div class="combatCard ${u.team}${battle.current===u?" active":""}${battle.target===u?" targeted":""}${u.dead?" dead":""}" data-card="${u.id}" style="${pos(u)}">
 <div class="ccTop"><span class="lineTag ${u.line}">${u.line==="front"?"FRONT-LINE":"BACK-LINE"}</span><span class="ccLevel">Nv.${u.level}</span><span class="statusIcons">${st}</span></div>
 <div class="ccHero"><div class="ccAvatar">${u.emoji}</div><div class="ccIdentity"><div class="ccName">${u.name}</div><div class="ccRole">${u.role} • SPD ${u.sp}</div></div></div>
 <div class="barMeta"><span>HP</span><b>${Math.ceil(u.hp)}/${u.maxHp}</b></div><div class="bar hp"><i style="width:${hp}%"></i></div>
 <div class="barMeta"><span>RAGE</span><b>${Math.floor(r)}/100</b></div><div class="bar rage"><i style="width:${r}%"></i></div>
 ${u.team==="player"?`<button class="ultBtn ${ready?"ready":""}${u.queued?" queued":""}" data-uid="${u.id}" ${(!ready||battle.mode==="auto"||u.dead)?"disabled":""}>${battle.mode==="auto"?"AUTO":u.queued?"ULTIMATE ARMADA":"ULTIMATE"}</button>`:`<div class="enemyAuto">${ready?"💥 ULTIMATE PRONTA":"ULTIMATE AUTO"}</div>`}
 </div>`;
}
function renderBattle(){
 if(!battle)return;
 ["playerArea","enemyArea"].forEach(id=>$("#"+id).querySelectorAll(".combatCard").forEach(x=>x.remove()));
 battle.e.forEach(u=>$("#enemyArea").insertAdjacentHTML("beforeend",card(u)));battle.p.forEach(u=>$("#playerArea").insertAdjacentHTML("beforeend",card(u)));
 document.querySelectorAll(".ultBtn[data-uid]").forEach(b=>b.onclick=()=>{const u=battle.p.find(x=>x.id===b.dataset.uid);if(u&&u.rage>=100){u.queued=!u.queued;battle.log((u.queued?"⏳ ":"↩️ ")+u.name+(u.queued?": Ultimate armada.":": Ultimate cancelada."),"ultimate");renderBattle()}});
 $("#roundLabel").textContent="Rodada "+(battle.round||1);$("#modeBtn").textContent="ULT: "+battle.mode.toUpperCase();$("#modeBtn").classList.toggle("active",battle.mode==="auto");
 $("#speed1").classList.toggle("active",battle.speed===1);$("#speed2").classList.toggle("active",battle.speed===2);$("#pauseBtn").classList.toggle("active",battle.paused);
 $("#pauseBtn").textContent=battle.paused?"▶ CONTINUAR":"Ⅱ PAUSA";$("#battleState").textContent=battle.paused?"PAUSADO":battle.ended?"FINALIZADO":"EM BATALHA";
 $("#turnOrder").innerHTML=battle.q.map((u,i)=>`<span class="turnChip${i<battle.i?" done":""}${battle.current===u?" current":""}">${u.emoji} ${u.name.split(" ")[0]} <b>${u.sp}</b></span>`).join("");
}
function float(u,t,c){const e=document.querySelector('[data-card="'+u.id+'"]');if(!e)return;const a=$("#arena").getBoundingClientRect(),r=e.getBoundingClientRect(),d=document.createElement("div");d.className="floatText "+c;d.textContent=t;d.style.left=(r.left-a.left+r.width/2)+"px";d.style.top=(r.top-a.top+20)+"px";$("#arena").appendChild(d);setTimeout(()=>d.remove(),820)}
function banner(t){const b=$("#ultBanner");b.textContent=t;b.classList.remove("show");void b.offsetWidth;b.classList.add("show")}

function grantRewards(s){
 const r=s.rewards;save.gold+=r.gold;save.accountExp+=r.exp;save.essence+=r.essence;
 const team=used();const shardHero=team[(s.id-1)%team.length]||"seraphina";save.shards[shardHero]=(save.shards[shardHero]||0)+r.shards;
 if(s.id<STAGES.length)save.unlockedStage=Math.max(save.unlockedStage,s.id+1);
 persist();
 return{...r,shardHero};
}
function finishBattle(win,s){
 const next=$("#nextStageBtn"),retry=$("#retryBtn");
 $("#resultBadge").textContent=win?"🏆":"💀";$("#resultTitle").textContent=win?"Vitória!":"Derrota";
 $("#resultStage").textContent="Fase "+s.code+" • "+s.name;
 if(win){
  const rw=grantRewards(s),sh=hero(rw.shardHero);
  $("#resultText").textContent=s.id<5?"A próxima fase foi desbloqueada. Use o Ouro para fortalecer os heróis antes de continuar.":"Capítulo 1 concluído!";
  $("#resultRewards").innerHTML=`<span class="reward">🪙 Ouro<strong>+${rw.gold}</strong></span><span class="reward">⭐ EXP de Conta<strong>+${rw.exp}</strong></span><span class="reward">✨ Essência<strong>+${rw.essence}</strong></span><span class="reward">${sh.emoji} Fragmentos<strong>+${rw.shards}</strong></span>`;
  next.style.display=s.id<STAGES.length?"":"none";retry.style.display="none";
 }else{
  $("#resultText").textContent="Melhore os seus heróis ou ajuste Front-line/Back-line e tente novamente.";
  $("#resultRewards").innerHTML='<span class="reward">Sem recompensas<strong>—</strong></span>';
  next.style.display="none";retry.style.display="";
 }
 $("#resultModal").classList.add("show");
}
function closeResult(){ $("#resultModal").classList.remove("show");try{screen.orientation?.unlock?.()}catch{} }
function goNextStage(){
 const s=stage();if(s.id>=STAGES.length)return;
 save.selectedStage=s.id+1;persist();closeResult();renderFormation();show("formationScreen");
}
function retryStage(){closeResult();startBattle()}
function goMenu(){closeResult();renderCampaign();renderHeroes();show("homeScreen")}

/* Navegação */
$("#goCampaign").onclick=()=>{renderCampaign();show("campaignScreen")};
$("#campaignBack").onclick=()=>show("homeScreen");
$("#goFormation").onclick=()=>{renderFormation();show("formationScreen")};
$("#goHeroes").onclick=()=>{renderHeroes();show("heroesScreen")};
$("#heroesBack").onclick=()=>show("homeScreen");
$("#formationBack").onclick=()=>show("homeScreen");
$("#startBattle").onclick=startBattle;
$("#quickBattle").onclick=quick;
$("#battleBack").onclick=()=>{if(battle)battle.ended=true;try{screen.orientation?.unlock?.()}catch{}renderCampaign();show("campaignScreen")};
$("#speed1").onclick=()=>{if(battle){battle.speed=1;renderBattle()}};
$("#speed2").onclick=()=>{if(battle){battle.speed=2;renderBattle()}};
$("#pauseBtn").onclick=()=>{if(battle&&!battle.ended){battle.paused=!battle.paused;renderBattle()}};
$("#modeBtn").onclick=()=>{if(battle&&!battle.ended){battle.mode=battle.mode==="manual"?"auto":"manual";battle.log("🤖 Ultimate: "+battle.mode.toUpperCase(),"ultimate");renderBattle()}};
$("#nextStageBtn").onclick=goNextStage;
$("#retryBtn").onclick=retryStage;
$("#resultMenuBtn").onclick=goMenu;

/* PWA / atualização */
function status(t){if($("#updateStatus"))$("#updateStatus").textContent=t}
function hideSplash(ms=500){setTimeout(()=>{const x=$("#updateSplash");if(x){x.classList.add("hidden");setTimeout(()=>x.remove(),350)}},ms)}
async function checkUpdate(showMsg=false){
 const n=$("#homeUpdateNotice");
 try{
  const r=await fetch("./version.json?ts="+Date.now(),{cache:"no-store"}),v=await r.json();
  if(v.version&&v.version!==APP_VERSION){status("Nova versão "+v.version+" disponível.");$("#splashUpdateBtn").style.display="";if(n){n.textContent="Nova versão "+v.version+" disponível.";n.classList.add("show")}return true}
  status("Nerdora Chibi Raiders v"+APP_VERSION+" está atualizado.");
  if(showMsg&&n){n.textContent="Você já está na versão "+APP_VERSION+".";n.classList.add("show")}hideSplash(650);
 }catch{status("v"+APP_VERSION+" pronta.");hideSplash(700)}
 return false;
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("#installAppBtn").style.display="";$("#splashInstallBtn").style.display=""});
async function install(){
 if(!deferred){const n=$("#homeUpdateNotice");n.textContent='Abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.';n.classList.add("show");return}
 deferred.prompt();await deferred.userChoice;deferred=null;
}
async function updateNow(){
 status("Baixando atualização…");
 if(reg){await reg.update();if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});else setTimeout(()=>location.reload(),700)}else location.reload();
}
if("serviceWorker"in navigator){
 addEventListener("load",async()=>{try{reg=await navigator.serviceWorker.register("./sw.js",{scope:"./"});await reg.update()}catch{}checkUpdate(false)});
 navigator.serviceWorker.addEventListener("controllerchange",()=>location.reload());
}else addEventListener("load",()=>checkUpdate(false));
$("#installAppBtn").onclick=install;$("#splashInstallBtn").onclick=install;$("#checkUpdateBtn").onclick=()=>checkUpdate(true);$("#splashUpdateBtn").onclick=updateNow;

renderResources();renderCampaign();renderFormation();renderHeroes();
})();