const CLASSES = {
  Guerreiro:{icon:"⚔️",hp:120,mp:25,stats:{FOR:5,VIT:5,AGI:2,INT:1,PER:2,CAR:2},desc:"Resistência e força"},
  Mago:{icon:"🔮",hp:72,mp:90,stats:{FOR:1,VIT:2,AGI:2,INT:6,PER:4,CAR:2},desc:"Éter e conhecimento"},
  Assassino:{icon:"🗡️",hp:82,mp:45,stats:{FOR:3,VIT:2,AGI:6,INT:2,PER:4,CAR:2},desc:"Velocidade e crítico"},
  Curandeiro:{icon:"✨",hp:88,mp:78,stats:{FOR:1,VIT:3,AGI:2,INT:5,PER:3,CAR:4},desc:"Cura e suporte"},
  Invocador:{icon:"👹",hp:78,mp:82,stats:{FOR:1,VIT:2,AGI:2,INT:6,PER:3,CAR:3},desc:"Pactos e criaturas"},
  Caçador:{icon:"🏹",hp:92,mp:38,stats:{FOR:3,VIT:3,AGI:4,INT:2,PER:6,CAR:2},desc:"Rastros e precisão"}
};

const LOCATIONS = {
  "Estrada de Derenfall":{
    intro:"A chuva fina transforma a estrada em um espelho escuro. Derenfall surge adiante, cercada por campos abandonados. Não há fumaça nas chaminés, cães nas cercas ou vozes nos caminhos. Ainda assim, uma janela no andar superior da hospedaria permanece acesa.",
    quick:["Entrar na vila","Procurar rastros","Observar as casas"]
  },
  "Praça de Derenfall":{
    intro:"A praça está deserta. Uma carroça tombada bloqueia metade da rua. Portas permanecem abertas, comida esfria sobre uma mesa visível e o sino da igreja toca uma única vez — apesar de ninguém estar na torre.",
    quick:["Ir à igreja","Ir à hospedaria","Investigar a praça","Ir ao cemitério"]
  },
  "Igreja":{
    intro:"O interior da igreja cheira a madeira molhada e cera apagada. Três cordas descem da torre, mas uma delas está rompida e as engrenagens do sino estão travadas. Mesmo assim, o metal vibra suavemente.",
    quick:["Investigar o sino","Examinar o altar","Procurar passagem","Tocar o sino"]
  },
  "Hospedaria":{
    intro:"Canecas ainda contêm cerveja. Um prato de ensopado está morno. Sobre o balcão existe um livro-caixa aberto, escrito por várias mãos — mas a última assinatura termina apenas com a frase: 'Eu devia lembrar meu nome.'",
    quick:["Ler o livro-caixa","Procurar quartos","Examinar a cozinha","Voltar à praça"]
  },
  "Cemitério":{
    intro:"As lápides estão cobertas por uma película de chuva. Em algumas, os nomes parecem riscados não pela frente, mas de dentro da própria pedra.",
    quick:["Examinar lápides","Procurar pegadas","Abrir a capela","Voltar à praça"]
  },
  "Escola":{
    intro:"Carteiras pequenas permanecem alinhadas. Na parede, dezenas de desenhos infantis mostram a mesma casa impossível: paredes comuns, mas um céu violeta no lugar do teto.",
    quick:["Examinar desenhos","Procurar registros","Voltar à praça"]
  },
  "Poço":{
    intro:"O poço parece fundo demais. Quando alguém se aproxima, uma voz familiar sobe da escuridão — mas usa um detalhe sobre sua vida que está claramente errado.",
    quick:["Responder à voz","Baixar uma corda","Examinar o poço","Voltar à praça"]
  },
  "Capela Antiga":{
    intro:"Atrás do cemitério, uma construção quase engolida por raízes guarda pedras muito mais antigas que a vila. Sob musgo e argamassa existe um selo geométrico de Nhal.",
    quick:["Examinar o selo","Procurar entrada","Tocar o símbolo","Voltar ao cemitério"]
  },
  "Fenda Memorial":{
    intro:"A passagem sob a igreja não termina em terra. Ela se abre para uma paisagem que não deveria caber ali: ruas de Derenfall repetidas como lembranças imperfeitas, portas suspensas no vazio e vozes sem corpos chamando nomes esquecidos.",
    quick:["Seguir as vozes","Procurar moradores","Chamar o responsável","Examinar a Fenda"]
  },
  "Salão das Memórias":{
    intro:"Centenas de fios luminosos atravessam o salão como nervos. No centro, uma figura alta feita de máscaras incompletas segura lembranças como quem organiza livros. O Colecionador volta o rosto para o grupo.",
    quick:["Conversar com o Colecionador","Exigir os moradores","Atacar","Propor um acordo"]
  }
};

const CLUES = {
  silencio:{title:"Silêncio impossível",text:"A vila foi abandonada de forma abrupta, sem sinais normais de fuga ou combate."},
  livro:{title:"O nome ausente",text:"O livro-caixa da hospedaria registra atividades recentes, mas a última pessoa não consegue escrever o próprio nome."},
  sino:{title:"Sino sem mecanismo",text:"O sino toca mesmo com corda rompida e engrenagens travadas; reage à presença e a lembranças fortes."},
  lapides:{title:"Nomes por dentro",text:"Lápides parecem ter seus nomes apagados a partir do interior da pedra."},
  desenhos:{title:"Casa com céu dentro",text:"Crianças desenharam repetidamente um lugar impossível antes do desaparecimento."},
  nhal:{title:"Selo de Nhal",text:"A fundação antiga contém um selo de Nhal ligado a engenharia de Éter e isolamento de memória."},
  fundacao:{title:"Passagem sob a igreja",text:"Uma cavidade selada sob o altar leva para uma anomalia de Éter."},
  memoria:{title:"A Fenda captura vínculos",text:"A anomalia não parece matar pessoas; ela separa identidades e memórias autobiográficas."},
  colecionador:{title:"O Colecionador",text:"Uma entidade mantém as memórias de Derenfall para estabilizar a própria existência."}
};

const $ = (id)=>document.getElementById(id);
const ui = {
  landing:$("landing"),game:$("game"),playerName:$("playerName"),classGrid:$("classGrid"),
  showJoinBtn:$("showJoinBtn"),joinBox:$("joinBox"),roomCodeInput:$("roomCodeInput"),
  createRoomBtn:$("createRoomBtn"),joinRoomBtn:$("joinRoomBtn"),roomCode:$("roomCode"),
  copyInviteBtn:$("copyInviteBtn"),partyList:$("partyList"),connectionStatus:$("connectionStatus"),
  voiceBtn:$("voiceBtn"),voiceStatus:$("voiceStatus"),selfAvatar:$("selfAvatar"),selfName:$("selfName"),
  selfClass:$("selfClass"),selfStats:$("selfStats"),hpBar:$("hpBar"),mpBar:$("mpBar"),hpText:$("hpText"),mpText:$("mpText"),
  locationName:$("locationName"),worldDay:$("worldDay"),worldTime:$("worldTime"),storyLog:$("storyLog"),
  quickActions:$("quickActions"),actionInput:$("actionInput"),speechBtn:$("speechBtn"),rollBtn:$("rollBtn"),sendActionBtn:$("sendActionBtn"),
  objectiveText:$("objectiveText"),clueList:$("clueList"),mysteryBar:$("mysteryBar"),mysteryLabel:$("mysteryLabel"),
  chatLog:$("chatLog"),chatInput:$("chatInput"),chatSendBtn:$("chatSendBtn"),toast:$("toast"),
  diceOverlay:$("diceOverlay"),diceWho:$("diceWho"),diceResult:$("diceResult"),diceFormula:$("diceFormula"),audioMount:$("audioMount")
};

let selectedClass = localStorage.getItem("cn_class") || "Guerreiro";
let player = null;
let room = null;
let roomId = "";
let isHost = false;
let hostPeerId = null;
let p2pReady = false;
let localStream = null;
let participants = new Map();
let actions = {};
let state = null;
let storyRendered = 0;

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function normalize(s=""){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function clone(v){return JSON.parse(JSON.stringify(v));}
function nowLabel(){return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}
function toast(msg){ui.toast.textContent=msg;ui.toast.classList.add("show");setTimeout(()=>ui.toast.classList.remove("show"),2200);}
function randomCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<4;i++)s+=chars[Math.floor(Math.random()*chars.length)];return "NRD-"+s;}
function roomFromUrl(){return new URL(location.href).searchParams.get("room")?.toUpperCase()||"";}
function classData(){return CLASSES[player?.className||selectedClass]||CLASSES.Guerreiro;}

function renderClasses(){
  ui.classGrid.innerHTML="";
  Object.entries(CLASSES).forEach(([name,c])=>{
    const b=document.createElement("button");
    b.className="class-choice"+(name===selectedClass?" active":"");
    b.innerHTML=`<b>${c.icon} ${name}</b><small>${c.desc}</small>`;
    b.onclick=()=>{selectedClass=name;localStorage.setItem("cn_class",name);renderClasses();};
    ui.classGrid.appendChild(b);
  });
}

function buildPlayer(){
  const name=(ui.playerName.value.trim()||localStorage.getItem("cn_name")||"Aventureiro").slice(0,18);
  localStorage.setItem("cn_name",name);localStorage.setItem("cn_class",selectedClass);
  const c=CLASSES[selectedClass];
  return {id:"self",name,className:selectedClass,icon:c.icon,hp:c.hp,maxHp:c.hp,mp:c.mp,maxMp:c.mp,stats:clone(c.stats),voice:false};
}

function makeInitialState(){
  return {
    version:"0.1",
    campaign:"O Vilarejo Sem Amanhã",
    location:"Estrada de Derenfall",
    worldMinutes:18*60+40,
    day:1,
    escalation:0,
    clues:["silencio"],
    objective:"Descobrir o que aconteceu com os moradores de Derenfall.",
    ended:false,
    ending:null,
    story:[
      {id:crypto.randomUUID(),type:"master",who:"Mestre Máquina",text:"A chuva acompanha vocês pela última curva da estrada. Derenfall deveria estar se preparando para a noite — mas não há uma única pessoa nos campos, nos portões ou nas janelas.\n\nUma luz permanece acesa na hospedaria. Ao longe, a torre da igreja recorta o céu violeta da tempestade.",ts:Date.now()},
      {id:crypto.randomUUID(),type:"system",who:"Sistema",text:"Campanha iniciada. Vocês podem agir livremente; não existe uma sequência obrigatória de escolhas.",ts:Date.now()}
    ]
  };
}

function addStory(type,who,text,roll=null){
  if(!state)return;
  state.story.push({id:crypto.randomUUID(),type,who,text,roll,ts:Date.now()});
  if(state.story.length>180)state.story=state.story.slice(-180);
}

function saveHostState(){
  if(isHost&&state) localStorage.setItem("cn_room_"+roomId,JSON.stringify(state));
}

function loadHostState(){
  try{return JSON.parse(localStorage.getItem("cn_room_"+roomId))}catch{return null}
}

function worldTime(){
  if(!state)return {day:1,time:"--:--"};
  const total=state.worldMinutes;
  const extra=Math.floor(total/(24*60));
  const m=total%(24*60);
  return {day:state.day+extra,time:String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")};
}

function advanceTime(mins=5){
  state.worldMinutes+=mins;
  const danger=Math.floor((state.worldMinutes-(18*60+40))/80);
  if(danger>state.escalation) state.escalation=Math.min(5,danger);
}

function renderSelf(){
  const c=classData();
  ui.selfAvatar.textContent=(player.name[0]||"N").toUpperCase();
  ui.selfName.textContent=player.name;
  ui.selfClass.textContent=c.icon+" "+player.className+(isHost?" • Anfitrião":"");
  ui.hpText.textContent=player.hp+"/"+player.maxHp;ui.mpText.textContent=player.mp+"/"+player.maxMp;
  ui.hpBar.style.width=(player.hp/player.maxHp*100)+"%";ui.mpBar.style.width=(player.mp/player.maxMp*100)+"%";
  ui.selfStats.innerHTML=Object.entries(player.stats).map(([k,v])=>`<span>${k}<b>${v}</b></span>`).join("");
}

function renderParty(){
  const all=[{...player,id:"self",isHost},...Array.from(participants.values())];
  const seen=new Set();ui.partyList.innerHTML="";
  all.filter(p=>{const key=p.peerId||p.id||p.name;if(seen.has(key))return false;seen.add(key);return true}).forEach(p=>{
    const el=document.createElement("div");el.className="party-person";
    el.dataset.peer=p.peerId||"self";
    el.innerHTML=`<div class="mini-avatar">${esc((p.name||"?")[0].toUpperCase())}</div><span class="dot"></span><div><strong>${esc(p.name||"Jogador")}${p.isHost?" 👑":""}</strong><small>${esc(p.icon||"⚔️")} ${esc(p.className||"Aventureiro")}${p.voice?" • voz ativa":""}</small></div>`;
    ui.partyList.appendChild(el);
  });
}

function renderStory(){
  if(!state)return;
  if(storyRendered>state.story.length){ui.storyLog.innerHTML="";storyRendered=0}
  for(let i=storyRendered;i<state.story.length;i++){
    const e=state.story[i],div=document.createElement("article");div.className="story-entry "+e.type;
    div.innerHTML=`<div class="entry-head"><strong>${esc(e.who)}</strong><span>${new Date(e.ts||Date.now()).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span></div><p>${esc(e.text)}</p>${e.roll?`<span class="roll-line">🎲 ${esc(e.roll)}</span>`:""}`;
    ui.storyLog.appendChild(div);
  }
  storyRendered=state.story.length;
  ui.storyLog.scrollTop=ui.storyLog.scrollHeight;
}

function renderClues(){
  if(!state)return;
  const list=state.clues.map(id=>CLUES[id]).filter(Boolean);
  ui.clueList.innerHTML=list.length?list.map(c=>`<div class="clue"><b>✦ ${esc(c.title)}</b>${esc(c.text)}</div>`).join(""):`<p class="muted">Nenhuma pista registrada.</p>`;
}

function renderQuick(){
  if(!state)return;
  const q=LOCATIONS[state.location]?.quick||["Investigar","Observar ao redor","Conversar com o grupo"];
  ui.quickActions.innerHTML="";
  q.forEach(label=>{const b=document.createElement("button");b.textContent=label;b.onclick=()=>submitIntent(label);ui.quickActions.appendChild(b)});
}

function renderState(){
  if(!state)return;
  ui.locationName.textContent=state.location;
  const wt=worldTime();ui.worldDay.textContent="Dia "+wt.day;ui.worldTime.textContent=wt.time;
  ui.objectiveText.textContent=state.objective;
  const labels=["Silêncio","Ecos","Substituições","Vazamento","Ancoragem","Propagação"];
  ui.mysteryLabel.textContent=labels[state.escalation]||"Instável";
  ui.mysteryBar.style.width=(8+state.escalation*18)+"%";
  renderStory();renderClues();renderQuick();
}

function addClue(id){
  if(!state.clues.includes(id)){state.clues.push(id);const c=CLUES[id];if(c)addStory("system","Pista descoberta",c.title+": "+c.text)}
}

function statFor(text){
  const n=normalize(text);
  if(/forca|arrom|quebr|ergu|segur|atac/.test(n))return "FOR";
  if(/mag|eter|ritual|selo|arcano|estud/.test(n))return "INT";
  if(/corr|esquiv|furt|silenc|subir|saltar/.test(n))return "AGI";
  if(/convenc|persu|engan|falar|negoci/.test(n))return "CAR";
  return "PER";
}

function rollCheck(actor,text,df=12,forcedStat=null){
  const stat=forcedStat||statFor(text),bonus=actor.stats?.[stat]||0,d20=1+Math.floor(Math.random()*20),total=d20+bonus;
  const result={d20,bonus,total,stat,df,success:total>=df,critical:d20===20,fumble:d20===1};
  const formula=`1d20 (${d20}) + ${stat} ${bonus>=0?"+":""}${bonus} = ${total} vs DF ${df}`;
  showDice(actor.name,d20,formula);return {...result,formula};
}

function showDice(who,result,formula){
  ui.diceWho.textContent=who;ui.diceResult.textContent=result;ui.diceFormula.textContent=formula;
  ui.diceOverlay.classList.remove("hidden");setTimeout(()=>ui.diceOverlay.classList.add("hidden"),1300);
  if(actions.sendRoll&&p2pReady) try{actions.sendRoll({who,result,formula})}catch{}
}

function moveTo(dest){
  state.location=dest;advanceTime(6);
  addStory("master","Mestre Máquina",LOCATIONS[dest]?.intro||("Vocês chegam a "+dest+"."));
}

function inferDestination(text){
  const n=normalize(text);
  if(/igreja|altar|sino/.test(n))return "Igreja";
  if(/hosped|taverna|estalagem/.test(n))return "Hospedaria";
  if(/cemiter|lapide/.test(n))return "Cemitério";
  if(/escola|desenho/.test(n))return "Escola";
  if(/poco/.test(n))return "Poço";
  if(/capela antiga|selo de nhal/.test(n))return "Capela Antiga";
  if(/praca|centro da vila|entrar na vila/.test(n))return "Praça de Derenfall";
  return null;
}

function resolveInvestigate(actor,text){
  const loc=state.location,n=normalize(text),r=rollCheck(actor,text,12);
  let result="";
  if(loc==="Estrada de Derenfall"){
    result=r.success?"Entre a lama vocês encontram marcas de carroça e passos interrompidos perto do portão. Ninguém parece ter fugido pela estrada. O abandono aconteceu de dentro para fora.":"A chuva destruiu quase todos os rastros. Ainda assim, algo não combina: não existem marcas suficientes para uma evacuação.";
    addClue("silencio");
  } else if(loc==="Praça de Derenfall"){
    result=r.success?"A carroça caiu enquanto ainda estava sendo descarregada. Nada foi saqueado. Em várias casas, tarefas foram interrompidas no mesmo intervalo de tempo.":"O lugar parece congelado no meio de uma rotina. Não há sinais de batalha nem de retirada organizada.";
    addClue("silencio");
  } else if(loc==="Hospedaria"){
    result=r.success?"No livro-caixa, a escrita final começa firme e termina tremendo: 'Cobrei dois quartos. Preparei a ceia. Meu nome é...' Depois há dezenas de tentativas vazias.":"O livro-caixa confirma que a hospedaria funcionava poucas horas atrás. A última assinatura está estranhamente incompleta.";
    addClue("livro");
  } else if(loc==="Igreja"){
    if(/passagem|altar|chao|subsolo|fundacao/.test(n)||r.success){
      result=r.success?"Sob o altar, a pedra responde com um eco oco. Um encaixe circular esconde uma abertura lacrada por símbolos quase apagados. O ar que sobe dali é frio e cheira a chuva antiga.":"Você percebe que o piso ao redor do altar não pertence à construção original. Há algo sob a igreja, mas o mecanismo de acesso ainda não está claro.";
      addClue("fundacao");
    }else{
      result="O mecanismo do sino está travado. Ainda assim, o bronze vibra quando vocês mencionam pessoas desaparecidas.";
    }
    addClue("sino");
  } else if(loc==="Cemitério"){
    result=r.success?"Ao limpar uma lápide, vocês veem que o nome não foi raspado pela superfície: pequenas fissuras partem de dentro das letras, como se a própria pedra tivesse esquecido quem deveria registrar.":"Várias lápides têm nomes parcialmente apagados de um modo que ferramenta nenhuma explicaria.";
    addClue("lapides");
  } else if(loc==="Escola"){
    result=r.success?"Datas nos desenhos mostram que a 'casa com céu dentro' começou a aparecer semanas antes do desaparecimento. Crianças diferentes desenharam portas suspensas e uma figura feita de rostos.":"Os desenhos repetem a mesma arquitetura impossível vezes demais para ser coincidência.";
    addClue("desenhos");
  } else if(loc==="Capela Antiga"){
    result=r.success?"O selo corresponde a técnicas proibidas de Nhal para separar memória de matéria. Uma linha do símbolo aponta diretamente para a fundação da igreja.":"O símbolo é muito antigo e foi deliberadamente coberto por reformas posteriores.";
    addClue("nhal");
    if(r.success)addClue("fundacao");
  } else if(loc==="Poço"){
    result=r.success?"A voz não vem do fundo. O som nasce alguns centímetros acima da água, como uma lembrança reproduzida no lugar errado.":"A voz tenta imitar alguém importante, mas erra detalhes íntimos.";
    addClue("memoria");
  } else if(loc==="Fenda Memorial"){
    result=r.success?"As ruas repetidas não são cópias físicas: cada uma está ligada a uma lembrança de algum morador. Vocês encontram silhuetas humanas caminhando sem reconhecer seus próprios lares.":"Vocês encontram moradores vivos, mas eles olham para suas casas como se fossem cenários desconhecidos.";
    addClue("memoria");
  } else if(loc==="Salão das Memórias"){
    result=r.success?"Os fios luminosos saem das máscaras do Colecionador e se conectam às lembranças dos moradores. Destruí-lo sem preparar a devolução pode romper parte desses vínculos.":"O Colecionador não parece apenas guardar as memórias; ele depende delas.";
    addClue("colecionador");
  } else result="Vocês examinam o local com cuidado. O ambiente oferece detalhes úteis, mas nenhuma conclusão definitiva.";
  if(r.critical)result+=" Um detalhe adicional se destaca com clareza extraordinária.";
  if(r.fumble)result+=" Ao procurar, vocês também provocam um ruído ou deixam um sinal de sua presença.";
  addStory("master","Mestre Máquina",result,r.formula);advanceTime(7);
}

function resolveAction(actor,text){
  const n=normalize(text.trim());
  if(!n)return;
  if(state.ended){addStory("master","Mestre Máquina","Esta campanha já alcançou um desfecho nesta sala. O grupo pode continuar interpretando o epílogo ou criar uma nova sala.");return}

  if(/sair da vila|ir embora|abandonar derenfall|seguir viagem/.test(n)){
    state.escalation=Math.min(5,state.escalation+1);advanceTime(75);
    addStory("master","Mestre Máquina","Vocês deixam Derenfall para trás. A estrada continua aberta — o mundo não os impede. Horas depois, porém, um viajante cruza o caminho sem lembrar de onde veio. A anomalia não ficou confinada à vila.");
    state.objective="Decidir se retornam a Derenfall ou acompanham a propagação da anomalia.";return;
  }

  if(state.location==="Igreja" && /tocar|puxar.*sino|sino/.test(n) && !/investig|exam/.test(n)){
    advanceTime(3);addClue("sino");
    addStory("master","Mestre Máquina","Quando vocês forçam a corda rompida, o sino toca sem que o badalo se mova. Por um instante, cada aventureiro se lembra de uma casa da infância. Sob o altar, alguma coisa responde com três batidas abafadas.");
    addClue("fundacao");return;
  }

  if(/descer|entrar.*passagem|subsolo|cripta|abrir.*fundacao/.test(n) && (state.location==="Igreja"||state.location==="Capela Antiga")){
    if(state.clues.includes("fundacao")){moveTo("Fenda Memorial");state.objective="Encontrar os moradores e descobrir quem controla a Fenda.";addClue("memoria")}
    else addStory("master","Mestre Máquina","Vocês procuram uma descida, mas ainda não identificaram onde a estrutura antiga foi selada. A igreja e a capela parecem os melhores pontos para investigar.");
    return;
  }

  if(state.location==="Fenda Memorial" && /seguir.*vozes|procurar.*morador|chamar|avancar|continuar|responsavel/.test(n)){
    const r=rollCheck(actor,text,11,"PER");advanceTime(8);
    addStory("master","Mestre Máquina",r.success?"Seguindo ecos que repetem nomes incompletos, vocês atravessam uma porta suspensa e chegam a um salão atravessado por fios de luz. Uma criatura feita de máscaras se ergue no centro.\n\n— Vocês ainda carregam seus nomes — ela diz. — Que desperdício.":"As ruas se repetem e tentam separar o grupo usando vozes conhecidas. Vocês conseguem permanecer juntos, mas chegam ao coração da Fenda depois de perder a noção de distância.",r.formula);
    moveTo("Salão das Memórias");addClue("colecionador");state.objective="Decidir como recuperar as memórias de Derenfall.";return;
  }

  if(state.location==="Salão das Memórias"){
    if(/negoci|acordo|convers|pergunt|falar/.test(n)){
      advanceTime(4);
      addStory("master","Colecionador","— Posso devolver cada pessoa. Posso devolver quase tudo. Mas uma memória que realmente tenha peso deve ficar comigo. Uma lembrança oferecida voluntariamente por alguém que ainda sabe quem é.");
      state.objective="Escolher entre negociar, tentar selar a Fenda ou enfrentar o Colecionador.";return;
    }
    if(/selar|ritual|selo/.test(n)){
      const r=rollCheck(actor,text,16,"INT");advanceTime(12);
      if(r.success && state.clues.includes("nhal")){
        addStory("master","Mestre Máquina","Usando o padrão de Nhal como âncora, vocês redirecionam os fios de memória para os próprios moradores. O Colecionador grita à medida que deixa de ser necessário. A Fenda se fecha sem cortar os vínculos que aprisionava.",r.formula);
        finishEnding("Selo de Nhal","Os moradores retornam com a maior parte das memórias preservada. A existência de tecnologia de Nhal, porém, agora é um segredo que outras facções podem desejar.");
      }else{
        addStory("master","Mestre Máquina","O ritual começa, mas a Fenda resiste. O padrão precisa de uma âncora melhor — talvez conhecimento de Nhal, um objeto ligado à vila ou ajuda adicional.",r.formula);
      }return;
    }
    if(/atac|destruir|matar|golpe/.test(n)){
      const r=rollCheck(actor,text,14,"FOR");advanceTime(5);
      if(r.success){
        addStory("master","Mestre Máquina","O golpe rompe parte das máscaras. Os fios de luz enlouquecem e centenas de vozes gritam nomes diferentes. O Colecionador pode ser destruído, mas agora está claro que algumas lembranças se perderão no colapso.",r.formula);
        state.objective="Continuar o ataque e aceitar as perdas, ou mudar de estratégia antes do colapso.";
        if(r.critical)finishEnding("Ruptura do Colecionador","O golpe crítico destrói o núcleo da entidade. Os moradores retornam, mas alguns perdem lembranças importantes. Derenfall sobrevive diferente.");
      }else addStory("master","Mestre Máquina","A entidade dobra o espaço e o ataque atravessa uma lembrança em vez do corpo. Ela agora considera o grupo uma ameaça direta.",r.formula);
      return;
    }
    if(/ofere|memoria|lembranca|sacrific/.test(n)){
      addStory("master","Mestre Máquina","O Colecionador aceita a oferta. Um fio de luz deixa o aventureiro e se junta às máscaras. Imediatamente, centenas de moradores começam a lembrar seus nomes. A lembrança oferecida, porém, não volta.");
      finishEnding("O Preço de uma Lembrança","Derenfall é devolvida quase intacta. Um aventureiro deixa a Fenda com uma ausência pessoal que poderá reaparecer como consequência em campanhas futuras.");return;
    }
  }

  const dest=inferDestination(text);
  if(dest && dest!==state.location && (/ir|entrar|seguir|andar|voltar|visitar|aproxim/.test(n)||n===normalize(dest)||n.includes("ir a"))){
    moveTo(dest);return;
  }

  if(/investig|procur|exam|observar|rastre|escut|ler|analis|vasculh/.test(n)){resolveInvestigate(actor,text);return}

  if(state.location==="Estrada de Derenfall" && /entrar|vila|portao/.test(n)){moveTo("Praça de Derenfall");return}

  const r=/tentar|forcar|convenc|saltar|escalar|arrombar|enganar/.test(n)?rollCheck(actor,text,12):null;
  advanceTime(r?5:2);
  addStory("master","Mestre Máquina",r
    ? (r.success?"A tentativa funciona e muda a situação a favor de vocês. O mundo reage ao método escolhido, não a uma rota pré-definida.":"A tentativa não alcança exatamente o resultado desejado, mas produz informação e uma nova condição para agir. A cena continua aberta.")
    : "A ação é possível. O ambiente reage de forma coerente, e nenhum caminho obrigatório é imposto. Descrevam como desejam aproveitar essa mudança.",
    r?.formula||null);
}

function finishEnding(title,text){
  state.ended=true;state.ending=title;state.objective="Desfecho alcançado: "+title;
  addStory("system","DESFECHO — "+title,text);
}

function processIntent(payload){
  if(!isHost||!state)return;
  const actor=payload.player||player;
  addStory("player",actor.name,payload.text);
  resolveAction(actor,payload.text);
  saveHostState();renderState();broadcastState();
}

function submitIntent(text=null){
  const val=(text??ui.actionInput.value).trim();if(!val)return;
  ui.actionInput.value="";
  if(isHost)processIntent({text:val,player});
  else if(actions.sendIntent&&p2pReady){actions.sendIntent({text:val,player:{...player,id:undefined}});addLocalPending(val)}
  else toast("Ainda aguardando conexão com o anfitrião.");
}

function addLocalPending(text){toast("Ação enviada ao Mestre Máquina");}

function broadcastState(target=null){
  if(!isHost||!actions.sendState||!p2pReady)return;
  try{actions.sendState(state,target?target:undefined)}catch(e){console.warn(e)}
}

function hello(target=null){
  if(!actions.sendHello||!p2pReady)return;
  const data={name:player.name,className:player.className,icon:player.icon,stats:player.stats,hp:player.hp,maxHp:player.maxHp,mp:player.mp,maxMp:player.maxMp,voice:!!localStream,isHost};
  try{actions.sendHello(data,target?target:undefined)}catch{}
}

async function connectP2P(){
  ui.connectionStatus.textContent="conectando";
  try{
    const {joinRoom}=await import("https://esm.sh/@trystero-p2p/torrent");
    room=joinRoom({appId:"cronicas-de-nerdora-web-alpha-v01"},roomId);

    const helloAction=room.makeAction("hello");
    const stateAction=room.makeAction("state");
    const intentAction=room.makeAction("intent");
    const chatAction=room.makeAction("chat");
    const rollAction=room.makeAction("roll");

    actions={
      sendHello:(data,target)=>helloAction.send(data,target?{target}:undefined),
      sendState:(data,target)=>stateAction.send(data,target?{target}:undefined),
      sendIntent:(data,target)=>intentAction.send(data,target?{target}:undefined),
      sendChat:(data,target)=>chatAction.send(data,target?{target}:undefined),
      sendRoll:(data,target)=>rollAction.send(data,target?{target}:undefined)
    };

    p2pReady=true;
    ui.connectionStatus.textContent="online";
    ui.connectionStatus.classList.add("online");

    room.onPeerJoin = peerId=>{
      if(isHost){
        hostPeerId="self";
        setTimeout(()=>broadcastState(peerId),200);
        setTimeout(()=>hello(peerId),250);
      }else{
        setTimeout(()=>hello(peerId),200);
      }
      if(localStream) room.addStream(localStream,{target:peerId});
    };

    room.onPeerLeave = peerId=>{
      participants.delete(peerId);
      renderParty();
      toast("Um jogador saiu da sala.");
    };

    helloAction.onMessage = (data,{peerId})=>{
      participants.set(peerId,{...data,peerId});
      if(data.isHost)hostPeerId=peerId;
      renderParty();
      if(isHost)broadcastState(peerId);
    };

    stateAction.onMessage = (incoming,{peerId})=>{
      if(isHost)return;
      if(hostPeerId&&peerId!==hostPeerId)return;
      hostPeerId=peerId;
      state=incoming;
      renderState();
    };

    intentAction.onMessage = (data,{peerId})=>{
      if(isHost){
        const p=participants.get(peerId);
        processIntent({
          text:data.text,
          player:{...(data.player||p||{}),name:(data.player?.name||p?.name||"Aventureiro")}
        });
      }
    };

    chatAction.onMessage = (data,{peerId})=>{
      appendChat(data.name||participants.get(peerId)?.name||"Jogador",data.text,false);
    };

    rollAction.onMessage = data=>{
      showDice(data.who,data.result,data.formula);
    };

    room.onPeerStream = (stream,peerId)=>{
      let audio=document.querySelector(`audio[data-peer="${peerId}"]`);
      if(!audio){
        audio=document.createElement("audio");
        audio.autoplay=true;
        audio.playsInline=true;
        audio.dataset.peer=peerId;
        ui.audioMount.appendChild(audio);
      }
      audio.srcObject=stream;
      audio.play?.().catch(()=>{});
    };

    hello();
    if(isHost)broadcastState();
  }catch(err){
    console.warn("P2P indisponível",err);
    ui.connectionStatus.textContent="modo local";
    toast("Conexão P2P indisponível. A sala continua em modo local.");
  }
}

async function toggleVoice(){
  if(localStream){
    localStream.getTracks().forEach(t=>t.stop());localStream=null;player.voice=false;
    ui.voiceBtn.classList.remove("active");ui.voiceStatus.textContent="Microfone desligado";hello();renderParty();return;
  }
  try{
    localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    player.voice=true;ui.voiceBtn.classList.add("active");ui.voiceStatus.textContent="Microfone ativo";
    if(room)room.addStream(localStream);
    hello();renderParty();
  }catch{toast("Não foi possível acessar o microfone.");}
}

function appendChat(name,text,broadcast=false){
  const d=document.createElement("div");d.className="chat-msg";d.innerHTML=`<strong>${esc(name)}</strong><p>${esc(text)}</p>`;ui.chatLog.appendChild(d);ui.chatLog.scrollTop=ui.chatLog.scrollHeight;
  if(broadcast&&actions.sendChat&&p2pReady)actions.sendChat({name,text});
}

function sendChat(){
  const t=ui.chatInput.value.trim();if(!t)return;ui.chatInput.value="";appendChat(player.name,t,true);
}

function startSpeech(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast("Ditado não é suportado neste navegador.");return}
  const rec=new SR();rec.lang="pt-BR";rec.interimResults=false;rec.maxAlternatives=1;
  ui.speechBtn.textContent="🔴 Ouvindo...";
  rec.onresult=e=>{ui.actionInput.value=(ui.actionInput.value+" "+e.results[0][0].transcript).trim()};
  rec.onerror=()=>toast("Não consegui reconhecer a fala.");
  rec.onend=()=>ui.speechBtn.textContent="🎤 Ditar";rec.start();
}

async function enterGame(code,host){
  player=buildPlayer();isHost=host;roomId=code.toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,12);
  if(!roomId)return toast("Digite um código de sala válido.");
  if(isHost){state=loadHostState()||makeInitialState();hostPeerId="self"}else state=null;
  participants.clear();storyRendered=0;
  const url=new URL(location.href);url.searchParams.set("room",roomId);history.replaceState({}, "", url);
  ui.roomCode.textContent=roomId;ui.landing.classList.remove("active");ui.game.classList.add("active");
  renderSelf();renderParty();if(state)renderState();
  await connectP2P();
  if(!isHost&&!state){
    ui.locationName.textContent="Aguardando anfitrião";
    ui.storyLog.innerHTML=`<article class="story-entry system"><div class="entry-head"><strong>Sistema</strong></div><p>Você entrou na sala ${esc(roomId)}. Aguardando o anfitrião sincronizar a campanha.</p></article>`;
  }
}

function soloRoll(){
  const d=1+Math.floor(Math.random()*20);showDice(player?.name||"Jogador",d,"1d20 = "+d);
  if(isHost&&state){addStory("system","Rolagem livre",(player?.name||"Jogador")+" rolou um D20.",`1d20 = ${d}`);renderState();broadcastState()}
}

function setupTabs(){
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active");
  });
}

function boot(){
  renderClasses();setupTabs();
  ui.playerName.value=localStorage.getItem("cn_name")||"";
  const incoming=roomFromUrl();if(incoming){ui.roomCodeInput.value=incoming;ui.joinBox.classList.remove("hidden")}
  ui.showJoinBtn.onclick=()=>ui.joinBox.classList.toggle("hidden");
  ui.createRoomBtn.onclick=()=>enterGame(randomCode(),true);
  ui.joinRoomBtn.onclick=()=>enterGame(ui.roomCodeInput.value,false);
  ui.sendActionBtn.onclick=()=>submitIntent();
  ui.actionInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitIntent()}});
  ui.rollBtn.onclick=soloRoll;ui.voiceBtn.onclick=toggleVoice;ui.speechBtn.onclick=startSpeech;
  ui.chatSendBtn.onclick=sendChat;ui.chatInput.addEventListener("keydown",e=>{if(e.key==="Enter")sendChat()});
  ui.copyInviteBtn.onclick=async()=>{
    const url=new URL(location.href);url.searchParams.set("room",roomId);
    try{await navigator.clipboard.writeText(url.toString());toast("Link da sala copiado.");}catch{toast("Código da sala: "+roomId)}
  };
  ui.diceOverlay.onclick=()=>ui.diceOverlay.classList.add("hidden");
}

boot();
