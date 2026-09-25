(function(){
"use strict";
var APP_VERSION="35";
var $=function(id){return document.getElementById(id)};
var E={
home:$("home"),game:$("game"),name:$("name"),create:$("create"),openJoin:$("openJoin"),joinBox:$("joinBox"),room:$("roomInput"),join:$("join"),net:$("net"),bootSplash:$("bootSplash"),bootStatus:$("bootStatus"),bootProgressFill:$("bootProgressFill"),
code:$("code"),role:$("role"),copyCode:$("copyCode"),copyLink:$("copyLink"),players:$("players"),status:$("status"),leave:$("leave"),title:$("title"),count:$("count"),last:$("last"),card:$("card"),draw:$("draw"),bingo:$("bingo"),history:$("history"),winner:$("winner"),toast:$("toast"),modal:$("modal"),modalText:$("modalText"),closeModal:$("closeModal"),install:$("installApp"),voiceToggle:$("voiceToggle"),soundToggle:$("soundToggle"),musicToggle:$("musicToggle"),
winnerName:$("winnerName"),winnerCalls:$("winnerCalls"),winnerModeStat:$("winnerModeStat"),winnerPattern:$("winnerPattern"),confettiLayer:$("confettiLayer"),replayBtn:$("replayBtn"),replayInline:$("replayInline"),replayArea:$("replayArea"),replayVoteStatus:$("replayVoteStatus"),
roundState:$("roundState"),roundProgressFill:$("roundProgressFill"),recentCalls:$("recentCalls"),publicRooms:$("publicRooms"),publicRoomsHint:$("publicRoomsHint"),refreshRooms:$("refreshRooms"),
roomName:$("roomName"),modeSelect:$("modeSelect"),speedSelect:$("speedSelect"),maxPlayers:$("maxPlayers"),publicRoom:$("publicRoom"),roomDisplayName:$("roomDisplayName"),modeBadge:$("modeBadge"),readyBtn:$("readyBtn"),
scoreboard:$("scoreboard"),quickChat:$("quickChat"),chatFeed:$("chatFeed"),matchHistory:$("matchHistory"),nearBingo:$("nearBingo"),spectatorBanner:$("spectatorBanner"),eventBanner:$("eventBanner"),opponentsArea:$("opponentsArea"),opponentsGrid:$("opponentsGrid"),
achievements:$("achievements"),ruleText:$("ruleText"),profileMini:$("profileMini"),profileAvatar:$("profileAvatar"),profileName:$("profileName"),profileWins:$("profileWins"),profileXp:$("profileXp"),profileCoins:$("profileCoins"),themeSelect:$("themeSelect"),
countdownOverlay:$("countdownOverlay"),countdownValue:$("countdownValue"),drawStage:$("drawStage"),previewBall:$("previewBall"),emoteLayer:$("emoteLayer"),waitingRoomBanner:$("waitingRoomBanner"),waitingRoomCode:$("waitingRoomCode"),waitingPlayerCount:$("waitingPlayerCount"),
settingsBtn:$("settingsBtn"),settingsModal:$("settingsModal"),settingsClose:$("settingsClose"),musicVolumeRange:$("musicVolumeRange"),musicVolumeValue:$("musicVolumeValue"),effectsVolumeRange:$("effectsVolumeRange"),effectsVolumeValue:$("effectsVolumeValue"),voiceVolumeRange:$("voiceVolumeRange"),voiceVolumeValue:$("voiceVolumeValue"),voiceRateRange:$("voiceRateRange"),voiceRateValue:$("voiceRateValue"),vibrationSetting:$("vibrationSetting"),wakeLockSetting:$("wakeLockSetting"),reduceMotionSetting:$("reduceMotionSetting"),showOpponentsSetting:$("showOpponentsSetting"),confirmExitSetting:$("confirmExitSetting"),wakeLockInfo:$("wakeLockInfo"),testAudioBtn:$("testAudioBtn"),resetSettingsBtn:$("resetSettingsBtn"),
voiceChatSettingsSection:$("voiceChatSettingsSection"),voiceChatVolumeRange:$("voiceChatVolumeRange"),voiceChatVolumeValue:$("voiceChatVolumeValue"),voiceChatToggle:$("voiceChatToggle"),voiceChatMute:$("voiceChatMute"),voiceChatStatus:$("voiceChatStatus"),voiceChatCount:$("voiceChatCount"),roomSettingsBtn:$("roomSettingsBtn"),tauntToggle:$("tauntToggle"),tauntMenu:$("tauntMenu")
};
var PROFILE_KEY="bingoNerdoraProfileV24",NAME_KEY="bingoNerdoraName",SETTINGS_KEY="bingoNerdoraSettingsV31";
function defaultGameSettings(){return{musicVolume:35,effectsVolume:70,voiceVolume:90,voiceRate:100,voiceChatVolume:80,vibration:true,keepAwake:true,reduceMotion:false,showOpponents:true,confirmExit:true}}
function loadGameSettings(){try{return Object.assign(defaultGameSettings(),JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}"))}catch(e){return defaultGameSettings()}}
var THEME_META={
  neon:{label:"Neon",tagline:"Cidade do Futuro",color:"#09152d"},
  midnight:{label:"Midnight",tagline:"Sob o Luar",color:"#071126"},
  arcade:{label:"Arcade",tagline:"High Score",color:"#16081f"},
  nyan:{label:"Nyan",tagline:"Paws & Stars",color:"#251431"}
};
function loadProfile(){try{var p=JSON.parse(localStorage.getItem(PROFILE_KEY)||"{}");return Object.assign({wins:0,games:0,xp:0,coins:0,streak:0,bestStreak:0,achievements:[],theme:"neon"},p)}catch(e){return{wins:0,games:0,xp:0,coins:0,streak:0,bestStreak:0,achievements:[],theme:"neon"}}}
var P=loadProfile(),G=loadGameSettings(),S={
host:false,code:"",name:"",peer:null,hostConn:null,conns:new Map(),players:new Map(),card:[],marked:new Set([12]),called:[],bag:[],winner:null,id:"",joined:false,spectator:false,leaving:false,
autoTimer:null,countdownTimer:null,autoRunning:false,nextDrawAt:0,drawing:false,countdownStarting:false,roundStarted:false,round:1,event:null,lastEventReward:"",matchHistory:[],chat:[],replayVotes:new Set(),remoteReplayVotes:0,
voiceOn:localStorage.getItem("bingoVoice")!=="off",soundOn:localStorage.getItem("bingoSound")!=="off",musicOn:localStorage.getItem("bingoMusic")==="on",lastSpoken:"",
config:{roomName:"Sala Nerdora",public:true,mode:"line",speed:7000,maxPlayers:6}
};
var deferredInstallPrompt=null,isStandalone=window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true,audioCtx=null,musicTimer=null,musicStep=0,reconnectTimer=null,migrationTimer=null,wakeLockHandle=null,pwaRegistrationPromise=null,bootFinished=false;
var voiceChatEnabled=false,voiceChatMuted=false,voiceStream=null,voiceCalls=new Map(),voiceAudios=new Map(),voicePeerBound=null,voiceMeterCtx=null,voiceMeters=new Map(),voiceSpeakingPeers=new Set(),voiceMeterTimer=null,voiceRetryTimer=null;
var ARCADE_VIDEO_ID="Vec5yrhU-z0",ARCADE_START=20,ARCADE_END=320,ARCADE_VOLUME=24,arcadePlayer=null,arcadePlayerReady=false,arcadeApiPromise=null,arcadeLoopTimer=null;
var NYAN_VIDEO_ID="Uj93hicGDNc",NYAN_START=15,NYAN_END=315,NYAN_VOLUME=22,nyanPlayer=null,nyanPlayerReady=false,nyanLoopTimer=null;
var MIDNIGHT_VIDEO_ID="-IzeccGatmM",MIDNIGHT_START=0,MIDNIGHT_END=192,MIDNIGHT_VOLUME=20,midnightPlayer=null,midnightPlayerReady=false,midnightLoopTimer=null;
var NEON_AUDIO_SRC="./assets/neon-theme.mp3?v=29",NEON_VOLUME=.22,neonAudio=null;
var invite=(new URLSearchParams(location.search).get("room")||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
if(invite){E.room.value=invite;E.joinBox.classList.remove("hidden")}
var savedName=localStorage.getItem(NAME_KEY);if(savedName)E.name.value=savedName;
function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0))}
function musicVolumePct(){return clamp(G.musicVolume,0,100)}
function effectsVolumePct(){return clamp(G.effectsVolume,0,100)}
function voiceVolumePct(){return clamp(G.voiceVolume,0,100)}
function voiceRateMultiplier(){return clamp(G.voiceRate,80,120)/100}
function saveGameSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(G))}
function applyCurrentMusicVolume(){
  var v=musicVolumePct();
  if(arcadePlayerReady&&arcadePlayer)try{arcadePlayer.setVolume(v)}catch(e){}
  if(nyanPlayerReady&&nyanPlayer)try{nyanPlayer.setVolume(v)}catch(e){}
  if(midnightPlayerReady&&midnightPlayer)try{midnightPlayer.setVolume(v)}catch(e){}
  if(neonAudio)try{neonAudio.volume=v/100}catch(e){}
}
function applyVoiceChatVolume(){var v=clamp(G.voiceChatVolume,0,100)/100;voiceAudios.forEach(function(el){try{el.volume=v}catch(e){}})}
function updateSettingsUi(){
  if(!E.settingsModal)return;
  E.musicVolumeRange.value=musicVolumePct();E.musicVolumeValue.textContent=musicVolumePct()+"%";
  E.effectsVolumeRange.value=effectsVolumePct();E.effectsVolumeValue.textContent=effectsVolumePct()+"%";
  E.voiceVolumeRange.value=voiceVolumePct();E.voiceVolumeValue.textContent=voiceVolumePct()+"%";
  E.voiceRateRange.value=clamp(G.voiceRate,80,120);E.voiceRateValue.textContent=(clamp(G.voiceRate,80,120)/100).toFixed(2)+"×";
  E.voiceChatVolumeRange.value=clamp(G.voiceChatVolume,0,100);E.voiceChatVolumeValue.textContent=clamp(G.voiceChatVolume,0,100)+"%";
  var inRoom=E.game&&!E.game.classList.contains("hidden");E.voiceChatSettingsSection.classList.toggle("hidden",!inRoom);
  E.vibrationSetting.checked=!!G.vibration;E.wakeLockSetting.checked=!!G.keepAwake;E.reduceMotionSetting.checked=!!G.reduceMotion;E.showOpponentsSetting.checked=!!G.showOpponents;E.confirmExitSetting.checked=!!G.confirmExit;
  if(E.wakeLockInfo)E.wakeLockInfo.textContent=("wakeLock"in navigator)?"✓ Manter tela ligada é compatível com este navegador.":"ℹ Manter tela ligada não é suportado neste navegador.";
}
async function syncWakeLock(){
  if(!("wakeLock"in navigator))return;
  var should=!!G.keepAwake&&E.game&&!E.game.classList.contains("hidden")&&document.visibilityState==="visible";
  if(should&&!wakeLockHandle){try{wakeLockHandle=await navigator.wakeLock.request("screen");wakeLockHandle.addEventListener("release",function(){wakeLockHandle=null})}catch(e){}}
  if(!should&&wakeLockHandle){try{await wakeLockHandle.release()}catch(e){}wakeLockHandle=null}
}
function applyGameSettings(){
  document.body.classList.toggle("reduceMotion",!!G.reduceMotion);
  applyCurrentMusicVolume();applyVoiceChatVolume();updateSettingsUi();renderOpponents();syncWakeLock()
}
function openSettings(){updateSettingsUi();E.settingsModal.classList.remove("hidden");document.body.classList.add("settingsOpen")}
function closeSettings(){E.settingsModal.classList.add("hidden");document.body.classList.remove("settingsOpen")}
function haptic(kind){if(!G.vibration||!("vibrate"in navigator))return;try{if(kind==="win")navigator.vibrate([35,45,60,45,90]);else if(kind==="ball")navigator.vibrate(18);else if(kind==="mark")navigator.vibrate(10);else navigator.vibrate(8)}catch(e){}}
function saveProfile(){localStorage.setItem(PROFILE_KEY,JSON.stringify(P));renderProfile()}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function toast(t){E.toast.textContent=t;E.toast.classList.add("show");setTimeout(function(){E.toast.classList.remove("show")},2200)}
function net(t,ok){E.net.textContent=(ok?"● ":"○ ")+t;E.net.style.color=ok?"#7ef0b5":""}
function clean(){return E.name.value.trim().replace(/[<>]/g,"").slice(0,24)}
function code(){var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",s="";for(var i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s}
function pid(c){return"nerdora-bingo-"+c.toLowerCase()}
function rid(){return Math.random().toString(36).slice(2,10)}
function sh(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x}return a}
function makeCard(){var ranges=[[1,15],[16,30],[31,45],[46,60],[61,75]],out=[];for(var col=0;col<5;col++){var a=[];for(var n=ranges[col][0];n<=ranges[col][1];n++)a.push(n);sh(a);for(var r=0;r<5;r++)out[r*5+col]=a[r]}out[12]=0;return out}
function makeBag(){return sh(Array.from({length:75},function(_,i){return i+1}))}
function letter(n){return n<=15?"B":n<=30?"I":n<=45?"N":n<=60?"G":"O"}
function tone(n){return n<=15?"tone-b":n<=30?"tone-i":n<=45?"tone-n":n<=60?"tone-g":"tone-o"}
function label(n){return n?letter(n)+n:"LIVRE"}
function modeLabel(m){return{line:"Linha clássica",two:"Duas linhas",corners:"4 cantos",x:"X completo",border:"Moldura",blackout:"Cartela cheia",nerdora:"Modo Nerdora"}[m]||"Linha clássica"}
function modeRule(m){return{line:"Complete uma linha horizontal, vertical ou diagonal.",two:"Complete duas linhas diferentes.",corners:"Marque os quatro cantos da cartela.",x:"Complete as duas diagonais formando um X.",border:"Complete toda a moldura externa da cartela.",blackout:"Marque toda a cartela.",nerdora:"Complete uma linha e enfrente eventos especiais de Nerdora e Nyan."}[m]||""}
function linePatterns(){var a=[];for(var r=0;r<5;r++){var row=[];for(var c=0;c<5;c++)row.push(r*5+c);a.push(row)}for(var c2=0;c2<5;c2++){var col=[];for(var r2=0;r2<5;r2++)col.push(r2*5+c2);a.push(col)}a.push([0,6,12,18,24],[4,8,12,16,20]);return a}
var BASE_LINES=linePatterns(),CORNERS=[0,4,20,24],XPAT=[0,4,6,8,12,16,18,20,24],BORDER=[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24],BLACKOUT=Array.from({length:25},function(_,i){return i});
function completePattern(set,pat){return pat.every(function(i){return set.has(i)})}
function modeComplete(set,mode){set=new Set(set);set.add(12);if(mode==="two")return BASE_LINES.filter(function(p){return completePattern(set,p)}).length>=2;if(mode==="corners")return completePattern(set,CORNERS);if(mode==="x")return completePattern(set,XPAT);if(mode==="border")return completePattern(set,BORDER);if(mode==="blackout")return completePattern(set,BLACKOUT);return BASE_LINES.some(function(p){return completePattern(set,p)})}
function patternName(set,mode){set=new Set(set);set.add(12);if(mode==="two")return"Duas linhas completas";if(mode==="corners")return"Quatro cantos";if(mode==="x")return"X completo";if(mode==="border")return"Moldura completa";if(mode==="blackout")return"Cartela cheia";var idx=BASE_LINES.findIndex(function(p){return completePattern(set,p)});if(idx<5)return"Linha horizontal";if(idx<10)return"Linha vertical";return"Linha diagonal"}
function nearMode(set,mode){set=new Set(set);set.add(12);function missing(p){var c=0;p.forEach(function(i){if(!set.has(i))c++});return c}
if(mode==="two"){var done=BASE_LINES.filter(function(p){return missing(p)===0}).length;return done>=1&&BASE_LINES.some(function(p){return missing(p)===1})}
var pats=mode==="corners"?[CORNERS]:mode==="x"?[XPAT]:mode==="border"?[BORDER]:mode==="blackout"?[BLACKOUT]:BASE_LINES;return pats.some(function(p){return missing(p)===1})}
function allMarkedCalled(card,marks){for(var i of marks){if(i!==12&&S.called.indexOf(card[i])<0)return false}return true}
function bingoReady(){return!S.spectator&&!S.winner&&modeComplete(S.marked,S.config.mode)&&allMarkedCalled(S.card,S.marked)}
function valid(card,marked){var set=new Set(marked);set.add(12);return modeComplete(set,S.config.mode)&&allMarkedCalled(card,set)}
function playerNear(p){return!p.spectator&&nearMode(new Set(Array.isArray(p.marked)?p.marked:[12]),S.config.mode)}
function readConfig(){return{roomName:(E.roomName.value.trim()||("Sala de "+(clean()||"Nerdora"))).slice(0,28),public:!!E.publicRoom.checked,mode:E.modeSelect.value||"line",speed:Math.max(4000,Math.min(12000,Number(E.speedSelect.value)||7000)),maxPlayers:Math.max(2,Math.min(8,Number(E.maxPlayers.value)||6))}}
function renderProfile(){
  var theme=P.theme||"neon",meta=THEME_META[theme]||THEME_META.neon;
  document.body.dataset.theme=theme;
  if(E.themeSelect)E.themeSelect.value=theme;
  document.querySelectorAll("[data-theme-choice]").forEach(function(btn){btn.classList.toggle("isActive",btn.dataset.themeChoice===theme)});
  var themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.setAttribute("content",meta.color);
  var nm=clean()||savedName||"Jogador Nerdora";
  E.profileName.textContent=nm;E.profileAvatar.textContent=(nm[0]||"N").toUpperCase();E.profileWins.textContent=P.wins;E.profileXp.textContent=P.xp;E.profileCoins.textContent=P.coins;
  E.achievements.innerHTML="";
  var labels={first_game:"🎟️ Primeira partida",first_bingo:"🏆 Primeiro Bingo",speed_bingo:"⚡ Vitória relâmpago",streak3:"🔥 3 vitórias seguidas",social:"💬 Social",nyan:"🐾 Amigo do Nyan"};
  (P.achievements||[]).slice(-6).forEach(function(k){var b=document.createElement("span");b.textContent=labels[k]||k;E.achievements.appendChild(b)});
  if(!P.achievements.length)E.achievements.innerHTML='<small>Jogue para desbloquear conquistas.</small>'
}
function setTheme(theme,announce){
  if(!THEME_META[theme])theme="neon";
  if(P.theme===theme&&!announce){renderProfile();return}
  P.theme=theme;localStorage.setItem(PROFILE_KEY,JSON.stringify(P));
  document.body.classList.add("themeSwitching");renderProfile();refreshAudioButtons();
  if(S.musicOn){stopMusic();startMusic()}
  setTimeout(function(){document.body.classList.remove("themeSwitching")},520);
  if(announce)toast("Tema "+THEME_META[theme].label+" • "+THEME_META[theme].tagline)
}
function unlock(k){if(P.achievements.indexOf(k)<0){P.achievements.push(k);toast("🏅 Conquista: "+k.replace(/_/g," "));saveProfile()}}
function applyRoundReward(){if(!S.winner||S.spectator)return;var key=S.code+"-"+S.round;if(localStorage.getItem("bingoReward:"+key))return;localStorage.setItem("bingoReward:"+key,"1");P.games++;P.xp+=20;P.coins+=3;unlock("first_game");if(S.winner.id===S.id){P.wins++;P.xp+=80;P.coins+=10;P.streak++;P.bestStreak=Math.max(P.bestStreak,P.streak);unlock("first_bingo");if(S.called.length<=35)unlock("speed_bingo");if(P.streak>=3)unlock("streak3")}else P.streak=0;saveProfile()}
function getAudio(){if(!audioCtx)try{audioCtx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}if(audioCtx&&audioCtx.state==="suspended")audioCtx.resume();return audioCtx}
function beep(freq,dur,vol,type){var ctx=getAudio(),level=effectsVolumePct()/100;if(!ctx||level<=0)return;try{var o=ctx.createOscillator(),g=ctx.createGain(),gain=Math.max(.0002,(vol||.025)*level);o.type=type||"sine";o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(ctx.destination);var t=ctx.currentTime;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.start(t);o.stop(t+dur)}catch(e){}}
function sfx(kind){haptic(kind);if(!S.soundOn)return;if(kind==="mark"){beep(620,.08,.025,"sine")}else if(kind==="ball"){beep(420,.08,.025,"triangle");setTimeout(function(){beep(760,.12,.022,"sine")},80)}else if(kind==="win"){[523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,.28,.035,"sine")},i*110)})}else if(kind==="chat"){beep(840,.08,.018,"sine")}}
function ensureArcadeApi(){
  if(window.YT&&window.YT.Player)return Promise.resolve();
  if(arcadeApiPromise)return arcadeApiPromise;
  arcadeApiPromise=new Promise(function(resolve){
    var prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){if(typeof prev==="function")try{prev()}catch(e){}resolve()};
    var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";s.async=true;document.head.appendChild(s);
  });
  return arcadeApiPromise
}
function ensureArcadePlayer(){
  if(arcadePlayerReady&&arcadePlayer)return Promise.resolve(arcadePlayer);
  return ensureArcadeApi().then(function(){return new Promise(function(resolve){
    var host=document.getElementById("arcadeMusicHost");
    if(!host){host=document.createElement("div");host.id="arcadeMusicHost";host.setAttribute("aria-hidden","true");host.style.cssText="position:fixed;width:2px;height:2px;left:-9999px;bottom:0;opacity:.001;pointer-events:none;overflow:hidden";document.body.appendChild(host)}
    if(arcadePlayer){resolve(arcadePlayer);return}
    arcadePlayer=new YT.Player("arcadeMusicHost",{width:"2",height:"2",videoId:ARCADE_VIDEO_ID,playerVars:{controls:0,disablekb:1,playsinline:1,rel:0,modestbranding:1,start:ARCADE_START},events:{
      onReady:function(e){arcadePlayerReady=true;try{e.target.setVolume(musicVolumePct())}catch(x){}resolve(e.target)},
      onStateChange:function(e){if(window.YT&&e.data===YT.PlayerState.ENDED&&S.musicOn&&P.theme==="arcade")startArcadeMusic(true)}
    }})
  })})
}
function startArcadeLoopWatch(){
  clearInterval(arcadeLoopTimer);
  arcadeLoopTimer=setInterval(function(){
    if(!arcadePlayerReady||!arcadePlayer||!S.musicOn||P.theme!=="arcade")return;
    try{var t=arcadePlayer.getCurrentTime();if(t>=ARCADE_END||t<ARCADE_START-1){arcadePlayer.seekTo(ARCADE_START,true);arcadePlayer.playVideo()}}catch(e){}
  },650)
}
function startArcadeMusic(looping){
  if(!S.musicOn||P.theme!=="arcade")return;
  ensureArcadePlayer().then(function(p){
    try{p.setVolume(musicVolumePct());if(looping||p.getCurrentTime()<ARCADE_START||p.getCurrentTime()>=ARCADE_END)p.seekTo(ARCADE_START,true);p.playVideo();startArcadeLoopWatch()}catch(e){}
  }).catch(function(){toast("Não foi possível carregar a música Arcade.")})
}
function stopArcadeMusic(){clearInterval(arcadeLoopTimer);arcadeLoopTimer=null;if(arcadePlayerReady&&arcadePlayer)try{arcadePlayer.pauseVideo()}catch(e){}}
function ensureNyanPlayer(){
  if(nyanPlayerReady&&nyanPlayer)return Promise.resolve(nyanPlayer);
  return ensureArcadeApi().then(function(){return new Promise(function(resolve){
    var host=document.getElementById("nyanMusicHost");
    if(!host){host=document.createElement("div");host.id="nyanMusicHost";host.setAttribute("aria-hidden","true");host.style.cssText="position:fixed;width:2px;height:2px;left:-9999px;bottom:0;opacity:.001;pointer-events:none;overflow:hidden";document.body.appendChild(host)}
    if(nyanPlayer){resolve(nyanPlayer);return}
    nyanPlayer=new YT.Player("nyanMusicHost",{width:"2",height:"2",videoId:NYAN_VIDEO_ID,playerVars:{controls:0,disablekb:1,playsinline:1,rel:0,modestbranding:1,start:NYAN_START},events:{
      onReady:function(e){nyanPlayerReady=true;try{e.target.setVolume(musicVolumePct())}catch(x){}resolve(e.target)},
      onStateChange:function(e){if(window.YT&&e.data===YT.PlayerState.ENDED&&S.musicOn&&P.theme==="nyan")startNyanMusic(true)}
    }})
  })})
}
function startNyanLoopWatch(){
  clearInterval(nyanLoopTimer);
  nyanLoopTimer=setInterval(function(){
    if(!nyanPlayerReady||!nyanPlayer||!S.musicOn||P.theme!=="nyan")return;
    try{var t=nyanPlayer.getCurrentTime();if(t>=NYAN_END||t<NYAN_START-1){nyanPlayer.seekTo(NYAN_START,true);nyanPlayer.playVideo()}}catch(e){}
  },650)
}
function startNyanMusic(looping){
  if(!S.musicOn||P.theme!=="nyan")return;
  ensureNyanPlayer().then(function(p){
    try{p.setVolume(musicVolumePct());if(looping||p.getCurrentTime()<NYAN_START||p.getCurrentTime()>=NYAN_END)p.seekTo(NYAN_START,true);p.playVideo();startNyanLoopWatch()}catch(e){}
  }).catch(function(){toast("Não foi possível carregar a música do Nyan.")})
}
function stopNyanMusic(){clearInterval(nyanLoopTimer);nyanLoopTimer=null;if(nyanPlayerReady&&nyanPlayer)try{nyanPlayer.pauseVideo()}catch(e){}}
function ensureMidnightPlayer(){
  if(midnightPlayerReady&&midnightPlayer)return Promise.resolve(midnightPlayer);
  return ensureArcadeApi().then(function(){return new Promise(function(resolve){
    var host=document.getElementById("midnightMusicHost");
    if(!host){host=document.createElement("div");host.id="midnightMusicHost";host.setAttribute("aria-hidden","true");host.style.cssText="position:fixed;width:2px;height:2px;left:-9999px;bottom:0;opacity:.001;pointer-events:none;overflow:hidden";document.body.appendChild(host)}
    if(midnightPlayer){resolve(midnightPlayer);return}
    midnightPlayer=new YT.Player("midnightMusicHost",{width:"2",height:"2",videoId:MIDNIGHT_VIDEO_ID,playerVars:{controls:0,disablekb:1,playsinline:1,rel:0,modestbranding:1,start:MIDNIGHT_START},events:{
      onReady:function(e){midnightPlayerReady=true;try{e.target.setVolume(musicVolumePct())}catch(x){}resolve(e.target)},
      onStateChange:function(e){if(window.YT&&e.data===YT.PlayerState.ENDED&&S.musicOn&&P.theme==="midnight")startMidnightMusic(true)}
    }})
  })})
}
function startMidnightLoopWatch(){
  clearInterval(midnightLoopTimer);
  midnightLoopTimer=setInterval(function(){
    if(!midnightPlayerReady||!midnightPlayer||!S.musicOn||P.theme!=="midnight")return;
    try{var t=midnightPlayer.getCurrentTime();if(t>=MIDNIGHT_END){midnightPlayer.seekTo(MIDNIGHT_START,true);midnightPlayer.playVideo()}}catch(e){}
  },650)
}
function startMidnightMusic(reset){
  if(!S.musicOn||P.theme!=="midnight")return;
  ensureMidnightPlayer().then(function(p){
    try{p.setVolume(musicVolumePct());if(reset||p.getCurrentTime()>=MIDNIGHT_END)p.seekTo(MIDNIGHT_START,true);p.playVideo();startMidnightLoopWatch()}catch(e){}
  }).catch(function(){toast("Não foi possível carregar a música Midnight.")})
}
function stopMidnightMusic(){clearInterval(midnightLoopTimer);midnightLoopTimer=null;if(midnightPlayerReady&&midnightPlayer)try{midnightPlayer.pauseVideo()}catch(e){}}
function ensureNeonAudio(){
  if(neonAudio)return neonAudio;
  neonAudio=new Audio(NEON_AUDIO_SRC);
  neonAudio.loop=true;
  neonAudio.preload="auto";
  neonAudio.volume=musicVolumePct()/100;
  neonAudio.setAttribute("playsinline","");
  return neonAudio
}
function startNeonMusic(reset){
  if(!S.musicOn||P.theme!=="neon")return;
  var p=ensureNeonAudio();
  try{p.volume=musicVolumePct()/100;if(reset)p.currentTime=0;var playPromise=p.play();if(playPromise&&playPromise.catch)playPromise.catch(function(){})}catch(e){}
}
function stopNeonMusic(){if(!neonAudio)return;try{neonAudio.pause()}catch(e){}}
function startMusic(){
  stopMusic();
  if(!S.musicOn)return;
  if(P.theme==="arcade"){startArcadeMusic(true);return}
  if(P.theme==="nyan"){startNyanMusic(true);return}
  if(P.theme==="neon"){startNeonMusic(true);return}
  if(P.theme==="midnight"){startMidnightMusic(true);return}
  var seq=[220,277,330,277,247,330,370,330];
  musicTimer=setInterval(function(){beep(seq[musicStep++%seq.length],.55,.009,"sine")},1250)
}
function stopMusic(){clearInterval(musicTimer);musicTimer=null;stopArcadeMusic();stopNyanMusic();stopNeonMusic();stopMidnightMusic()}
function getPtVoice(){if(!("speechSynthesis"in window))return null;var vs=speechSynthesis.getVoices().filter(function(v){return(v.lang||"").toLowerCase().indexOf("pt")===0});if(!vs.length)return null;function score(v){var n=(v.name||"").toLowerCase(),l=(v.lang||"").toLowerCase(),s=0;if(l==="pt-br")s+=100;if(/google|natural|neural|premium|microsoft|online/.test(n))s+=60;return s}return vs.sort(function(a,b){return score(b)-score(a)})[0]}
function speakText(text,opts){if(!S.voiceOn||!("speechSynthesis"in window)||voiceVolumePct()<=0)return;opts=opts||{};try{var u=new SpeechSynthesisUtterance(text);u.lang="pt-BR";u.rate=clamp((opts.rate||.82)*voiceRateMultiplier(),.55,1.35);u.pitch=opts.pitch||.96;u.volume=voiceVolumePct()/100;var v=getPtVoice();if(v)u.voice=v;var duck=Math.max(1,Math.round(musicVolumePct()*.28)),duckedArcade=false,duckedNyan=false,duckedNeon=false,duckedMidnight=false;if(P.theme==="arcade"&&arcadePlayerReady&&arcadePlayer&&S.musicOn){try{arcadePlayer.setVolume(duck);duckedArcade=true}catch(e){}}if(P.theme==="nyan"&&nyanPlayerReady&&nyanPlayer&&S.musicOn){try{nyanPlayer.setVolume(duck);duckedNyan=true}catch(e){}}if(P.theme==="neon"&&neonAudio&&S.musicOn){try{neonAudio.volume=(musicVolumePct()/100)*.28;duckedNeon=true}catch(e){}}if(P.theme==="midnight"&&midnightPlayerReady&&midnightPlayer&&S.musicOn){try{midnightPlayer.setVolume(duck);duckedMidnight=true}catch(e){}}function restore(){var mv=musicVolumePct();if(duckedArcade&&arcadePlayerReady&&arcadePlayer)try{arcadePlayer.setVolume(mv)}catch(e){}if(duckedNyan&&nyanPlayerReady&&nyanPlayer)try{nyanPlayer.setVolume(mv)}catch(e){}if(duckedNeon&&neonAudio)try{neonAudio.volume=mv/100}catch(e){}if(duckedMidnight&&midnightPlayerReady&&midnightPlayer)try{midnightPlayer.setVolume(mv)}catch(e){}}u.onend=restore;u.onerror=restore;speechSynthesis.cancel();speechSynthesis.resume();setTimeout(function(){try{speechSynthesis.speak(u)}catch(e){restore()}},60)}catch(e){}}
function speakBall(n){if(!n||S.lastSpoken===label(n))return;S.lastSpoken=label(n);var names={B:"Bê",I:"I",N:"Ene",G:"Gê",O:"Ó"};speakText(names[letter(n)]+". "+n+".",{rate:.80,pitch:.94})}
function refreshAudioButtons(){E.voiceToggle.textContent=S.voiceOn?"🔊 Narração":"🔇 Narração";E.soundToggle.textContent=S.soundOn?"🔔 Efeitos":"🔕 Efeitos";E.musicToggle.textContent=S.musicOn?(P.theme==="arcade"?"👾 Música Arcade":P.theme==="nyan"?"🐾 Música Nyan":P.theme==="neon"?"🌃 Música Neon":P.theme==="midnight"?"🌙 Música Midnight":"🎵 Música"):"🎵 Música off";E.voiceToggle.classList.toggle("voiceOff",!S.voiceOn);E.soundToggle.classList.toggle("voiceOff",!S.soundOn);E.musicToggle.classList.toggle("voiceOff",!S.musicOn)}
function showEmote(msg,name){if(!E.emoteLayer)return;var d=document.createElement("div");d.className="floatingEmote";d.innerHTML='<strong>'+esc(name||"Jogador")+'</strong><span>'+esc(msg)+'</span>';E.emoteLayer.appendChild(d);setTimeout(function(){d.remove()},2200)}
function pushChat(name,msg){S.chat.push({name:name,msg:msg,at:Date.now()});S.chat=S.chat.slice(-6);renderChat();showEmote(msg,name);sfx("chat")}
function renderChat(){E.chatFeed.innerHTML="";S.chat.slice(-4).forEach(function(m){var d=document.createElement("div");d.className="chatLine";d.innerHTML='<strong>'+esc(m.name)+'</strong><span>'+esc(m.msg)+'</span>';E.chatFeed.appendChild(d)})}
function sendQuick(msg){if(!S.joined&&!S.host)return;if(S.host){pushChat(S.name,msg);broadcast({type:"chat",name:S.name,msg:msg})}else if(S.hostConn&&S.hostConn.open)S.hostConn.send({type:"chat",id:S.id,name:S.name,msg:msg});unlock("social")}

function currentGamePeerId(){return S.peer&&S.peer.id?String(S.peer.id):""}
function renderVoiceChatStatus(){
  if(!E.voiceChatToggle)return;
  var connected=voiceAudios.size;
  E.voiceChatToggle.textContent=voiceChatEnabled?"🛑 Desativar voz":"🎙️ Ativar voz";
  E.voiceChatToggle.classList.toggle("active",voiceChatEnabled);
  E.voiceChatMute.classList.toggle("hidden",!voiceChatEnabled);
  E.voiceChatMute.textContent=voiceChatMuted?"🎤 Desmutar":"🔇 Mutar";
  E.voiceChatMute.classList.toggle("muted",voiceChatMuted);
  E.voiceChatStatus.textContent=!voiceChatEnabled?"Desativado":voiceChatMuted?"Microfone mutado":connected?"Conectado":"Aguardando outras pessoas";
  E.voiceChatCount.textContent=connected+(connected===1?" pessoa":" pessoas");
}
function findPlayerByPeer(peerId){return Array.from(S.players.values()).find(function(p){return p.peer===peerId})}
function updateVoiceSpeakingUi(){
  if(!E.players)return;
  Array.from(E.players.querySelectorAll(".playerPro")).forEach(function(row){
    var peer=row.dataset.peer||"",speaking=voiceSpeakingPeers.has(peer);
    row.classList.toggle("voiceSpeaking",speaking)
  })
}
function stopVoiceMeter(peerId){
  var m=voiceMeters.get(peerId);if(m){try{m.source.disconnect()}catch(e){}voiceMeters.delete(peerId)}
  voiceSpeakingPeers.delete(peerId);updateVoiceSpeakingUi()
}
function addVoiceMeter(peerId,stream){
  if(!stream||!stream.getAudioTracks().length)return;
  try{
    if(!voiceMeterCtx)voiceMeterCtx=new(window.AudioContext||window.webkitAudioContext)();
    var source=voiceMeterCtx.createMediaStreamSource(stream),analyser=voiceMeterCtx.createAnalyser();analyser.fftSize=512;source.connect(analyser);
    voiceMeters.set(peerId,{source:source,analyser:analyser,data:new Uint8Array(analyser.fftSize)});
    if(!voiceMeterTimer)voiceMeterTimer=setInterval(function(){
      voiceMeters.forEach(function(m,id){m.analyser.getByteTimeDomainData(m.data);var sum=0;for(var i=0;i<m.data.length;i++){var x=(m.data[i]-128)/128;sum+=x*x}var rms=Math.sqrt(sum/m.data.length),on=rms>.045;if(on)voiceSpeakingPeers.add(id);else voiceSpeakingPeers.delete(id)});
      updateVoiceSpeakingUi()
    },180)
  }catch(e){}
}
function attachVoiceStream(peerId,stream){
  if(!stream)return;
  var old=voiceAudios.get(peerId);if(old){try{old.pause();old.srcObject=null;old.remove()}catch(e){}}
  var audio=document.createElement("audio");audio.autoplay=true;audio.playsInline=true;audio.volume=clamp(G.voiceChatVolume,0,100)/100;audio.srcObject=stream;audio.dataset.voicePeer=peerId;audio.style.display="none";document.body.appendChild(audio);voiceAudios.set(peerId,audio);addVoiceMeter(peerId,stream);var pp=audio.play();if(pp&&pp.catch)pp.catch(function(){toast("Toque na tela para liberar o áudio do chat.")});
  renderVoiceChatStatus()
}
function removeVoicePeer(peerId){
  var call=voiceCalls.get(peerId);if(call){try{call.close()}catch(e){}voiceCalls.delete(peerId)}
  var audio=voiceAudios.get(peerId);if(audio){try{audio.pause();audio.srcObject=null;audio.remove()}catch(e){}voiceAudios.delete(peerId)}
  stopVoiceMeter(peerId);renderVoiceChatStatus()
}
function bindVoiceCall(call,incoming){
  if(!call||!call.peer)return;var peerId=String(call.peer),existing=voiceCalls.get(peerId),mine=currentGamePeerId();
  if(existing&&existing!==call){
    var shouldKeepOutgoing=mine&&mine.localeCompare(peerId)<0;
    if(incoming&&shouldKeepOutgoing){try{call.close()}catch(e){}return}
    try{existing.close()}catch(e){}voiceCalls.delete(peerId)
  }
  voiceCalls.set(peerId,call);
  call.on("stream",function(stream){attachVoiceStream(peerId,stream)});
  call.on("close",function(){if(voiceCalls.get(peerId)===call)voiceCalls.delete(peerId);var au=voiceAudios.get(peerId);if(au){try{au.pause();au.remove()}catch(e){}voiceAudios.delete(peerId)}stopVoiceMeter(peerId);renderVoiceChatStatus()});
  call.on("error",function(){if(voiceCalls.get(peerId)===call)voiceCalls.delete(peerId);renderVoiceChatStatus()})
}
function setupVoicePeer(peer){
  if(!peer||voicePeerBound===peer)return;voicePeerBound=peer;
  peer.on("call",function(call){
    if(!voiceChatEnabled||!voiceStream){try{call.close()}catch(e){}return}
    var peerId=String(call.peer),mine=currentGamePeerId(),existing=voiceCalls.get(peerId);
    if(existing&&mine&&mine.localeCompare(peerId)<0){try{call.close()}catch(e){}return}
    if(existing){try{existing.close()}catch(e){}voiceCalls.delete(peerId)}
    bindVoiceCall(call,true);try{call.answer(voiceStream)}catch(e){try{call.close()}catch(x){}}
  })
}
function ensureVoiceCalls(){
  if(!voiceChatEnabled||!voiceStream||!S.peer||!S.peer.open)return;
  var self=currentGamePeerId(),valid=new Set();
  S.players.forEach(function(p){
    var remote=String(p.peer||"");if(!remote||p.id===S.id||remote===self)return;valid.add(remote);
    if(voiceCalls.has(remote))return;
    try{var call=S.peer.call(remote,voiceStream,{metadata:{type:"bingo-voice",name:S.name,room:S.code}});bindVoiceCall(call,false)}catch(e){}
  });
  Array.from(voiceCalls.keys()).forEach(function(peerId){if(!valid.has(peerId))removeVoicePeer(peerId)});
  renderVoiceChatStatus()
}
async function startVoiceChat(){
  if(voiceChatEnabled)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast("Seu navegador não oferece suporte ao chat por voz.");return}
  try{
    voiceStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    voiceChatEnabled=true;voiceChatMuted=false;voiceStream.getAudioTracks().forEach(function(t){t.enabled=true});
    setupVoicePeer(S.peer);ensureVoiceCalls();clearInterval(voiceRetryTimer);voiceRetryTimer=setInterval(ensureVoiceCalls,2600);renderVoiceChatStatus();toast("🎙️ Chat por voz ativado.")
  }catch(e){voiceStream=null;voiceChatEnabled=false;renderVoiceChatStatus();toast("Permissão de microfone não foi concedida.")}
}
function stopVoiceChat(){
  voiceChatEnabled=false;voiceChatMuted=false;
  voiceCalls.forEach(function(call){try{call.close()}catch(e){}});voiceCalls.clear();
  voiceAudios.forEach(function(el){try{el.pause();el.srcObject=null;el.remove()}catch(e){}});voiceAudios.clear();
  voiceMeters.forEach(function(_,id){stopVoiceMeter(id)});voiceMeters.clear();voiceSpeakingPeers.clear();
  if(voiceMeterTimer){clearInterval(voiceMeterTimer);voiceMeterTimer=null}
  if(voiceRetryTimer){clearInterval(voiceRetryTimer);voiceRetryTimer=null}
  if(voiceStream){voiceStream.getTracks().forEach(function(t){try{t.stop()}catch(e){}});voiceStream=null}
  renderVoiceChatStatus()
}
function toggleVoiceMute(){
  if(!voiceChatEnabled||!voiceStream)return;voiceChatMuted=!voiceChatMuted;voiceStream.getAudioTracks().forEach(function(t){t.enabled=!voiceChatMuted});renderVoiceChatStatus();toast(voiceChatMuted?"Microfone mutado.":"Microfone ativado.")
}
function renderCard(){E.card.innerHTML="";E.card.classList.toggle("spectatorCard",S.spectator);S.card.forEach(function(n,i){var marked=S.marked.has(i),called=i===12||S.called.indexOf(n)>=0,b=document.createElement("button");b.className="cell"+(marked?" marked":"")+(marked&&!called?" pending":"")+(i===12?" free":"");b.disabled=S.spectator;if(i===12)b.innerHTML='<span class="nerdoraMark" aria-label="Nerdora">N</span>';else b.textContent=n;b.onclick=function(){if(i===12||S.spectator)return;S.marked.has(i)?S.marked.delete(i):S.marked.add(i);sfx("mark");renderCard();renderBingoState();sendMarks()};E.card.appendChild(b)});renderBingoState();renderNear()}
function renderNear(){var near=!S.spectator&&nearMode(S.marked,S.config.mode)&&!modeComplete(S.marked,S.config.mode);E.nearBingo.classList.toggle("hidden",!near);if(near)E.nearBingo.textContent="🔥 Falta 1 para "+modeLabel(S.config.mode)+"!";renderNyan()}
function renderHistory(){E.history.innerHTML="";var latest=S.called.length?S.called[0]:null;
  if(E.recentCalls){E.recentCalls.innerHTML="";var top=S.called.slice(0,5);if(!top.length){E.recentCalls.innerHTML='<span class="recentEmpty">Aguardando chamadas...</span>'}else top.forEach(function(n,idx){var b=document.createElement("span");b.className="recentBall "+tone(n)+(idx===0?" newest":"");b.innerHTML='<small>'+letter(n)+'</small><b>'+n+'</b>';E.recentCalls.appendChild(b)})}
  S.called.forEach(function(n,idx){var d=document.createElement("div");d.className="hball "+tone(n)+(idx===0?" current":"");d.innerHTML='<span class="hletter">'+letter(n)+'</span><span class="hnum">'+n+'</span>';E.history.appendChild(d)});E.last.textContent=latest?label(latest):"—";E.last.className="ball"+(latest?" "+tone(latest):"");if(latest){void E.last.offsetWidth;E.last.classList.add("ballPop");speakBall(latest)}E.count.textContent=S.called.length+" de 75 bolas";E.roundProgressFill.style.width=Math.min(100,S.called.length/75*100)+"%";E.title.textContent=S.winner?"Partida encerrada":latest?"Última bola: "+label(latest):"Aguardando início";renderCard();renderAutoState();renderEvent()}
function makeMiniSvg(marks){var ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 106 106");svg.classList.add("opponentMiniSvgV24");var set=new Set(Array.isArray(marks)?marks:[]);for(var row=0;row<5;row++)for(var col=0;col<5;col++){var idx=row*5+col,r=document.createElementNS(ns,"rect"),free=idx===12,marked=!free&&set.has(idx);r.setAttribute("x",String(2+col*21));r.setAttribute("y",String(2+row*21));r.setAttribute("width","18");r.setAttribute("height","18");r.setAttribute("rx","4");r.setAttribute("class","opMiniRectV24"+(free?" free":"")+(marked?" marked":""));svg.appendChild(r)}return svg}
function renderOpponents(){if(!G.showOpponents){E.opponentsArea.classList.add("hidden");E.opponentsGrid.innerHTML="";return}var others=Array.from(S.players.values()).filter(function(p){return p.id!==S.id&&!p.spectator}).slice(0,7);E.opponentsArea.classList.toggle("hidden",!others.length);E.opponentsGrid.innerHTML="";others.forEach(function(p){var d=document.createElement("div");d.className="opponentCardV24";var near=p.near?'<span class="opNear">🔥 Quase!</span>':"";d.innerHTML='<div class="opponentCardHead"><div class="avatar mini">'+esc((p.name||"?")[0].toUpperCase())+'</div><div><strong>'+esc(p.name)+'</strong><small>'+(Array.isArray(p.marked)?Math.max(0,p.marked.length-1):0)+' marcações</small></div>'+near+'</div>';d.appendChild(makeMiniSvg(p.marked));E.opponentsGrid.appendChild(d)})}
function renderPlayers(){E.players.innerHTML="";var arr=Array.from(S.players.values()).sort(function(a,b){return Number(b.host)-Number(a.host)||String(a.name).localeCompare(String(b.name))});arr.forEach(function(p){var d=document.createElement("div");d.className="player playerPro";d.dataset.peer=p.peer||((p.id===S.id)?currentGamePeerId():"");var status=p.spectator?"👀 espectador":p.host?"★ host":p.ready?"✓ pronto":"○ aguardando";d.innerHTML='<div class="avatar">'+esc((p.name||"?")[0].toUpperCase())+'</div><div class="playerInfo"><span>'+esc(p.name)+(p.id===S.id?' <small>(você)</small>':"")+'</span><small>'+status+(p.near?" • 🔥 quase Bingo":"")+'</small></div><div class="playerScore">'+(p.score||0)+' pts</div>';E.players.appendChild(d)});var me=S.players.get(S.id);S.spectator=!!(me&&me.spectator);E.readyBtn.classList.toggle("hidden",S.host||S.roundStarted||S.spectator||!S.joined);if(!S.host&&!S.roundStarted&&!S.spectator&&me){E.readyBtn.textContent=me.ready?"✓ Pronto!":"✓ Estou pronto";E.readyBtn.classList.toggle("isReady",!!me.ready)}E.spectatorBanner.classList.toggle("hidden",!S.spectator);renderOpponents();renderScoreboard();ensureVoiceCalls();updateVoiceSpeakingUi()}
function renderScoreboard(){E.scoreboard.innerHTML="";var arr=Array.from(S.players.values()).filter(function(p){return!p.spectator}).sort(function(a,b){return(b.wins||0)-(a.wins||0)||(b.score||0)-(a.score||0)}).slice(0,6);arr.forEach(function(p,i){var d=document.createElement("div");d.className="scoreRow";var medal=["🥇","🥈","🥉"][i]||"•";d.innerHTML='<span>'+medal+'</span><strong>'+esc(p.name)+'</strong><em>'+(p.wins||0)+'V • '+(p.score||0)+' pts</em>';E.scoreboard.appendChild(d)});if(!arr.length)E.scoreboard.innerHTML='<small>Sem pontuação ainda.</small>'}
function renderMatchHistory(){E.matchHistory.innerHTML="";S.matchHistory.slice(-4).reverse().forEach(function(m){var d=document.createElement("div");d.className="matchRow";d.innerHTML='<strong>'+esc(m.winner)+'</strong><span>'+esc(modeLabel(m.mode))+' • '+m.calls+' bolas</span>';E.matchHistory.appendChild(d)});if(!S.matchHistory.length)E.matchHistory.innerHTML='<small>Ainda não houve vencedor nesta sala.</small>'}
function renderEvent(){if(!S.event){E.eventBanner.classList.add("hidden");return}E.eventBanner.classList.remove("hidden");E.eventBanner.innerHTML='<strong>'+esc(S.event.icon||"✨")+' '+esc(S.event.title)+'</strong><span>'+esc(S.event.text)+'</span>';if(S.event.id!==S.lastEventReward){S.lastEventReward=S.event.id;if(!S.spectator&&S.event.reward==="coin"){P.coins+=2;saveProfile();unlock("nyan")}if(!S.spectator&&S.event.reward==="xp"){P.xp+=5;saveProfile()}}}
function renderNyan(){var box=document.querySelector(".nyanCompanion small");if(!box)return;if(S.winner)box.textContent="Nyan está comemorando o Bingo!";else if(!E.nearBingo.classList.contains("hidden"))box.textContent="Nyan percebeu: falta muito pouco! 🔥";else if(S.event)box.textContent=S.event.title+" está ativo.";else if(S.autoRunning)box.textContent="Nyan acompanha cada bola chamada.";else box.textContent="Ele está esperando a próxima rodada."}
function renderBingoState(){var ok=bingoReady();E.bingo.classList.toggle("hidden",!ok);E.bingo.disabled=!ok}
function awardMarkScore(p,marks){if(!p||p.spectator||!Array.isArray(p.card))return;p.score=p.score||0;var scored=new Set(Array.isArray(p.scoredMarks)?p.scoredMarks:[]);marks.forEach(function(i){if(i===12||scored.has(i))return;var n=p.card[i];if(n&&S.called.indexOf(n)>=0){scored.add(i);p.score+=2}});p.scoredMarks=Array.from(scored)}
function scoreCalledMarks(){if(!S.host)return;S.players.forEach(function(p){awardMarkScore(p,Array.isArray(p.marked)?p.marked:[]);S.players.set(p.id,p)})}
function sendMarks(){var marks=Array.from(S.marked);if(S.host){var me=S.players.get(S.id);if(me){me.marked=marks;awardMarkScore(me,marks);me.near=playerNear(me);S.players.set(S.id,me);sync()}}else if(S.hostConn&&S.hostConn.open)S.hostConn.send({type:"mark",id:S.id,marked:marks})}
function publicPlayers(){return Array.from(S.players.values()).map(function(p){return{id:p.id,name:p.name,host:!!p.host,peer:p.peer||"",marked:Array.isArray(p.marked)?p.marked:[12],ready:!!p.ready,score:p.score||0,wins:p.wins||0,spectator:!!p.spectator,near:!!p.near}})}
function broadcast(m){S.conns.forEach(function(c){if(c.open)try{c.send(m)}catch(e){}})}
function statePacket(){return{type:"state",called:S.called,calledOrder:"newest-first",winner:S.winner,players:publicPlayers(),autoRunning:S.autoRunning,nextDrawAt:S.nextDrawAt,roundStarted:S.roundStarted,config:S.config,event:S.event,matchHistory:S.matchHistory,round:S.round,replayVotes:S.replayVotes.size,chat:S.chat.slice(-6)}}
function sync(){if(S.host){S.players.forEach(function(p){p.near=playerNear(p)});if(!S.roundStarted&&!S.winner)lobbyRegisterNow();broadcast(statePacket())}renderHistory();renderPlayers();renderWinner();renderBingoState();renderMatchHistory();renderChat()}
function launchConfetti(){E.confettiLayer.innerHTML="";var colors=["#43d9ff","#a66bff","#ff58b8","#58e7a0","#ffad55","#fff"];for(var i=0;i<60;i++){var p=document.createElement("i");p.className="confettiPiece";p.style.left=Math.random()*100+"%";p.style.background=colors[i%colors.length];p.style.setProperty("--dur",2.8+Math.random()*2.3+"s");p.style.setProperty("--rot",Math.random()*360+"deg");p.style.setProperty("--drift",-110+Math.random()*220+"px");p.style.animationDelay=Math.random()*.7+"s";E.confettiLayer.appendChild(p)}}
function finishRound(winnerId){if(!S.host||S.winner)return;var w=S.players.get(winnerId);if(!w)return;var bonus=Math.max(0,75-S.called.length)*2;S.players.forEach(function(p){if(!p.spectator)p.score=(p.score||0)+20});w.score=(w.score||0)+100+bonus;w.wins=(w.wins||0)+1;S.players.set(w.id,w);S.winner={id:w.id,name:w.name,gain:120+bonus,pattern:patternName(new Set(w.marked||[]),S.config.mode)};S.matchHistory.push({winner:w.name,calls:S.called.length,mode:S.config.mode,round:S.round});S.matchHistory=S.matchHistory.slice(-8);S.replayVotes=new Set();S.autoRunning=false;clearInterval(S.autoTimer);S.autoTimer=null;S.nextDrawAt=0;lobbyUnregister();sync()}
function renderWinner(){if(!S.winner){E.winner.classList.add("hidden");E.replayArea.classList.add("hidden");E.draw.disabled=false;E.modal.dataset.w="";return}E.winner.classList.remove("hidden");E.winner.textContent="🏆 "+S.winner.name+" fez BINGO!";E.replayArea.classList.remove("hidden");E.draw.disabled=true;E.bingo.classList.add("hidden");E.status.textContent="Partida encerrada.";E.modalText.textContent=S.winner.name+" venceu e recebeu +"+(S.winner.gain||100)+" pontos nesta rodada.";E.winnerName.textContent=S.winner.name+" venceu!";E.winnerCalls.textContent=S.called.length;E.winnerModeStat.textContent=modeLabel(S.config.mode);E.winnerPattern.textContent=S.winner.pattern||"Padrão concluído";var active=Array.from(S.players.values()).filter(function(p){return!p.spectator}).length,need=Math.max(1,Math.ceil(active/2)),votes=S.host?S.replayVotes.size:S.remoteReplayVotes;E.replayVoteStatus.textContent=votes+" de "+need+" votos para revanche";var majority=votes>=need;E.replayBtn.textContent=S.host?(majority?"🔄 Maioria quer revanche • Iniciar":"🔄 Votar e jogar novamente"):"🔄 Votar por revanche";E.replayInline.textContent=E.replayBtn.textContent;if(E.modal.dataset.w!==S.winner.id){E.modal.dataset.w=S.winner.id;launchConfetti();E.modal.classList.remove("hidden");S.lastSpoken="";speakText("Bingo! "+S.winner.name+" venceu a partida!",{rate:.84,pitch:1.02});sfx("win");applyRoundReward()}}
function resetRoundUi(){S.lastSpoken="";E.modal.classList.add("hidden");E.modal.dataset.w="";E.confettiLayer.innerHTML="";E.replayArea.classList.add("hidden");E.nearBingo.classList.add("hidden")}
function restartRound(){if(!S.host)return;clearInterval(S.autoTimer);S.autoTimer=null;S.autoRunning=false;S.nextDrawAt=0;S.called=[];S.bag=makeBag();S.winner=null;S.event=null;S.roundStarted=false;S.drawing=false;S.countdownStarting=false;S.round++;S.replayVotes=new Set();S.card=makeCard();S.marked=new Set([12]);var me=S.players.get(S.id);if(me){me.card=S.card;me.marked=[12];me.scoredMarks=[];me.ready=true;me.spectator=false;me.near=false;S.players.set(S.id,me)}var deliveries=[];S.players.forEach(function(p){if(p.id===S.id)return;p.card=makeCard();p.marked=[12];p.scoredMarks=[];p.ready=false;p.spectator=false;p.near=false;deliveries.push({peer:p.peer,card:p.card})});var packetBase={called:[],calledOrder:"newest-first",winner:null,players:publicPlayers(),autoRunning:false,nextDrawAt:0,roundStarted:false,config:S.config,event:null,matchHistory:S.matchHistory,round:S.round,replayVotes:0,chat:S.chat.slice(-6)};deliveries.forEach(function(x){var conn=S.conns.get(x.peer);if(conn&&conn.open)conn.send(Object.assign({type:"new_round",card:x.card},packetBase))});resetRoundUi();E.status.textContent="Nova partida pronta. Todos receberam novas cartelas.";lobbyRegisterNow();sync();toast("Nova rodada criada sem sair da sala.")}
function voteReplay(){if(!S.winner)return;if(S.host){var active=Array.from(S.players.values()).filter(function(p){return!p.spectator}).length,need=Math.max(1,Math.ceil(active/2));if(S.replayVotes.size>=need){restartRound();return}S.replayVotes.add(S.id);sync();if(S.replayVotes.size>=need)toast("Maioria alcançada. Toque novamente para iniciar a revanche.")}else if(S.hostConn&&S.hostConn.open){S.hostConn.send({type:"replay_vote",id:S.id});toast("Seu voto de revanche foi enviado.")}}
function maybeEvent(){if(S.called.length===0||S.called.length%8!==0)return;var evs=[
{icon:"🐾",title:"Nyan Sortudo",text:"Todos ganham +2 Otaku Coins locais.",reward:"coin"},
{icon:"⚡",title:"Pulso Nerdora",text:"A próxima chamada chega com energia dobrada.",reward:"xp"},
{icon:"🌌",title:"Portal Roxo",text:"O cenário entrou no modo multiverso.",reward:"visual"},
{icon:"🎯",title:"Momento de tensão",text:"Veja quem está chegando perto do Bingo.",reward:"visual"}
],e=evs[Math.floor(Math.random()*evs.length)];var evId=S.round+"-"+S.called.length;S.event=Object.assign({id:evId},e);setTimeout(function(){if(S.host&&S.event&&S.event.id===evId){S.event=null;sync()}},6500)}
function showDrawAnimation(n){E.previewBall.textContent=label(n);E.previewBall.className="previewBall "+tone(n);E.drawStage.classList.remove("hidden");sfx("ball");setTimeout(function(){E.drawStage.classList.add("hidden")},1050)}
function draw(){if(!S.host||S.winner||S.drawing)return;if(!S.bag.length){stopAuto(true);toast("Todas as bolas foram sorteadas.");return}if(!S.roundStarted){S.roundStarted=true;lobbyUnregister()}var n=S.bag.pop();S.drawing=true;broadcast({type:"ball_preview",n:n});showDrawAnimation(n);setTimeout(function(){S.called.unshift(n);scoreCalledMarks();S.drawing=false;S.nextDrawAt=S.autoRunning?Date.now()+S.config.speed:0;maybeEvent();sync()},850)}
function allReady(){return Array.from(S.players.values()).filter(function(p){return!p.host&&!p.spectator}).every(function(p){return p.ready})}
function showCountdown(until){E.countdownOverlay.classList.remove("hidden");clearInterval(S.countdownTimer);function tick(){var left=Math.ceil((until-Date.now())/1000);if(left>0){E.countdownValue.textContent=left;sfx(left===1?"ball":"mark")}else{E.countdownValue.textContent="BINGO NERDORA!";setTimeout(function(){E.countdownOverlay.classList.add("hidden")},650);clearInterval(S.countdownTimer)}}tick();S.countdownTimer=setInterval(tick,150)}
function beginCountdown(){if(!S.host||S.winner||S.countdownStarting)return;if(!allReady()){var wait=Array.from(S.players.values()).filter(function(p){return!p.host&&!p.spectator&&!p.ready}).map(function(p){return p.name});toast("Aguardando: "+wait.join(", "));return}S.countdownStarting=true;var until=Date.now()+3200;broadcast({type:"countdown",until:until});showCountdown(until);setTimeout(function(){S.countdownStarting=false;startAutoNow()},3250)}
function startAutoNow(){if(!S.host||S.winner)return;S.roundStarted=true;lobbyUnregister();S.autoRunning=true;clearInterval(S.autoTimer);S.autoTimer=setInterval(draw,S.config.speed);draw();sync()}
function stopAuto(announce){clearInterval(S.autoTimer);S.autoTimer=null;S.autoRunning=false;S.nextDrawAt=0;sync();if(announce)toast("Sorteio pausado.")}
function toggleAuto(){if(!S.host)return;if(S.autoRunning)stopAuto(true);else if(!S.roundStarted)beginCountdown();else startAutoNow()}
function updateCountdownText(){if(S.winner)return;if(S.autoRunning&&S.nextDrawAt){var left=Math.max(0,Math.ceil((S.nextDrawAt-Date.now())/1000));E.status.textContent="Sorteio ativo • próxima bola em "+left+"s"}else if(S.host)E.status.textContent=S.roundStarted?"Sorteio pausado.":"Sala pronta • aguardando jogadores.";else if(S.joined)E.status.textContent=S.spectator?"Assistindo à rodada atual.":S.roundStarted?"Sorteio pausado pelo host.":"Marque “Estou pronto” para começar."}
function renderWaitingRoom(){if(!E.waitingRoomBanner)return;var active=Array.from(S.players.values()).filter(function(p){return!p.spectator}).length,max=S.config.maxPlayers||6,show=S.host&&!S.roundStarted&&!S.winner;E.waitingRoomBanner.classList.toggle("hidden",!show);if(show){E.waitingRoomCode.textContent=S.code||"------";E.waitingPlayerCount.textContent=active+"/"+max;E.waitingRoomBanner.classList.toggle("hasGuests",active>1)}}
function renderAutoState(){renderWaitingRoom();E.roomDisplayName.textContent=S.config.roomName;E.modeBadge.textContent=modeLabel(S.config.mode);E.ruleText.textContent=modeRule(S.config.mode);if(S.host)E.draw.textContent=S.autoRunning?"Pausar sorteio":S.roundStarted?"Continuar sorteio":"Iniciar partida";E.roundState.textContent=S.winner?"Encerrada":S.autoRunning?"Sorteio ativo":S.roundStarted?"Pausado":"Aguardando";E.roundState.classList.toggle("active",S.autoRunning&&!S.winner);E.roundState.classList.toggle("ended",!!S.winner);updateCountdownText()}
function bingo(){if(!bingoReady()){toast("O padrão ainda não está válido.");return}if(S.host)finishRound(S.id);else if(S.hostConn&&S.hostConn.open)S.hostConn.send({type:"claim",id:S.id,marked:Array.from(S.marked)})}
function toggleReady(){var me=S.players.get(S.id);if(!me||S.host||S.roundStarted||S.spectator)return;me.ready=!me.ready;S.players.set(S.id,me);renderPlayers();if(S.hostConn&&S.hostConn.open)S.hostConn.send({type:"ready",id:S.id,ready:me.ready})}
function roomPacketForWelcome(){return Object.assign(statePacket(),{type:"welcome"})}
function hostConn(conn){conn.on("open",function(){S.conns.set(conn.peer,conn)});conn.on("data",function(d){if(!d||typeof d!=="object")return;if(d.type==="join"){var id=String(d.id||rid()).slice(0,24),nm=String(d.name||"Jogador").slice(0,24),old=S.players.get(id),active=Array.from(S.players.values()).filter(function(p){return!p.spectator}).length;if(!old&&!S.roundStarted&&active>=S.config.maxPlayers){conn.send({type:"reject_join",reason:"Sala lotada."});return}var spectator=old?!!old.spectator:!!S.roundStarted,card=Array.isArray(d.card)&&d.card.length===25?d.card:makeCard();var p={id:id,name:nm,host:false,peer:conn.peer,card:card,marked:Array.isArray(d.marked)?d.marked:[12],ready:old?!!old.ready:false,score:old?old.score||0:0,wins:old?old.wins||0:0,scoredMarks:old&&Array.isArray(old.scoredMarks)?old.scoredMarks:[],spectator:spectator,near:false};p.near=playerNear(p);S.players.set(id,p);conn.send(roomPacketForWelcome());sync()}
if(d.type==="mark"){var p1=S.players.get(d.id);if(p1){p1.marked=Array.isArray(d.marked)?d.marked.filter(function(i){return Number.isInteger(i)&&i>=0&&i<25}):[12];awardMarkScore(p1,p1.marked);p1.near=playerNear(p1);S.players.set(p1.id,p1);sync()}}
if(d.type==="ready"){var p2=S.players.get(d.id);if(p2&&!S.roundStarted&&!p2.spectator){p2.ready=!!d.ready;S.players.set(p2.id,p2);sync()}}
if(d.type==="claim"){var p3=S.players.get(d.id);if(p3&&!S.winner&&valid(p3.card,new Set(Array.isArray(d.marked)?d.marked:[])))finishRound(p3.id);else conn.send({type:"reject"})}
if(d.type==="chat"){var nm2=(S.players.get(d.id)||{}).name||d.name||"Jogador",msg=String(d.msg||"").slice(0,32);pushChat(nm2,msg);broadcast({type:"chat",name:nm2,msg:msg})}
if(d.type==="replay_vote"){S.replayVotes.add(d.id);sync();var active2=Array.from(S.players.values()).filter(function(p){return!p.spectator}).length;if(S.replayVotes.size>=Math.max(1,Math.ceil(active2/2)))toast("Maioria quer revanche!")}}
);conn.on("close",function(){var p=Array.from(S.players.values()).find(function(x){return x.peer===conn.peer});if(p){p.peer="";S.players.set(p.id,p)}S.conns.delete(conn.peer);removeVoicePeer(String(conn.peer));sync()})}
function applyState(d){S.called=Array.isArray(d.called)?d.called.slice():[];if(d.calledOrder!=="newest-first")S.called.reverse();S.winner=d.winner||null;S.autoRunning=!!d.autoRunning;S.nextDrawAt=Number(d.nextDrawAt)||0;S.roundStarted=!!d.roundStarted||S.called.length>0;S.config=Object.assign(S.config,d.config||{});S.event=d.event||null;S.matchHistory=Array.isArray(d.matchHistory)?d.matchHistory:[];S.round=Number(d.round)||S.round;S.remoteReplayVotes=Number(d.replayVotes)||0;S.chat=Array.isArray(d.chat)?d.chat.slice(-6):S.chat;S.players=new Map((d.players||[]).map(function(p){return[p.id,p]}));var me=S.players.get(S.id);S.spectator=!!(me&&me.spectator);renderHistory();renderPlayers();renderWinner();renderMatchHistory();renderChat();applyRoundReward()}
function clientMsg(d){if(!d||typeof d!=="object")return;if(d.type==="welcome"||d.type==="state"){if(d.type==="welcome"){S.joined=true;net("conectado",true);E.status.textContent="Conectado ao anfitrião."}applyState(d)}
if(d.type==="new_round"){S.card=Array.isArray(d.card)&&d.card.length===25?d.card:makeCard();S.marked=new Set([12]);S.spectator=false;resetRoundUi();applyState(d);toast("Nova rodada! Você recebeu outra cartela.")}
if(d.type==="ball_preview"){showDrawAnimation(Number(d.n)||0)}
if(d.type==="countdown")showCountdown(Number(d.until)||Date.now()+3000)
if(d.type==="chat"){pushChat(d.name||"Jogador",String(d.msg||"").slice(0,32))}
if(d.type==="reject"){toast("Seu Bingo ainda não é válido.")}
if(d.type==="reject_join"){toast(d.reason||"Não foi possível entrar.");setTimeout(function(){location.href=location.pathname},1300)}}
function connectGuestPeer(){var p=new Peer(undefined,{debug:0});S.peer=p;setupVoicePeer(p);p.on("open",function(){setupVoicePeer(p);connectToHost();ensureVoiceCalls()});p.on("error",function(){net("erro");E.status.textContent="Falha de conexão."})}
function connectToHost(){if(S.leaving||S.host||!S.peer||!S.peer.open)return;var c=S.peer.connect(pid(S.code),{reliable:true});S.hostConn=c;var opened=false;c.on("open",function(){opened=true;clearTimeout(reconnectTimer);c.send({type:"join",id:S.id,name:S.name,card:S.card,marked:Array.from(S.marked),reconnect:S.joined});net("conectado",true)});c.on("data",clientMsg);c.on("close",function(){S.hostConn=null;if(S.leaving)return;net("reconectando");E.status.textContent="Host desconectado • tentando recuperar a sala...";handleHostDisconnect()});c.on("error",function(){});setTimeout(function(){if(!opened&&!S.leaving){try{c.close()}catch(e){}handleHostDisconnect()}},3500)}
function handleHostDisconnect(){clearTimeout(migrationTimer);clearTimeout(reconnectTimer);reconnectTimer=setTimeout(connectToHost,850);var candidates=Array.from(S.players.values()).filter(function(p){return!p.host&&!p.spectator}).sort(function(a,b){return String(a.id).localeCompare(String(b.id))});if(candidates.length&&candidates[0].id===S.id){migrationTimer=setTimeout(function(){if(!(S.hostConn&&S.hostConn.open))becomeMigratedHost()},5200)}}
function becomeMigratedHost(){if(S.host||S.leaving)return;var old=Array.from(S.players.values()).find(function(p){return p.host});if(old)S.players.delete(old.id);S.host=true;S.hostConn=null;var me=S.players.get(S.id)||{id:S.id,name:S.name};me.host=true;me.ready=true;me.spectator=false;me.card=S.card;me.marked=Array.from(S.marked);S.players.set(S.id,me);S.bag=makeBag().filter(function(n){return S.called.indexOf(n)<0});try{S.peer&&S.peer.destroy()}catch(e){}function open(){var p=new Peer(pid(S.code),{debug:0});S.peer=p;setupVoicePeer(p);p.on("open",function(){net("host recuperado",true);E.role.textContent="Você assumiu como anfitrião";E.draw.classList.remove("hidden");p.on("connection",hostConn);S.autoRunning=false;S.nextDrawAt=0;sync();toast("Você assumiu a sala após a saída do host.")});p.on("connection",hostConn);p.on("error",function(e){if(e&&e.type==="unavailable-id")setTimeout(open,1200)})}setTimeout(open,500)}
function gameUI(){renderVoiceChatStatus();E.code.textContent=S.code;E.role.textContent=S.host?"Você é o anfitrião • aguardando jogadores":"Você entrou como jogador";E.draw.classList.toggle("hidden",!S.host);E.bingo.classList.add("hidden");if(!Array.isArray(S.card)||S.card.length!==25)S.card=makeCard();S.marked=new Set([12]);renderHistory();renderPlayers();renderMatchHistory();E.home.classList.add("hidden");E.game.classList.remove("hidden");E.game.classList.remove("sceneEnter");void E.game.offsetWidth;E.game.classList.add("sceneEnter");syncWakeLock();setTimeout(function(){E.game.classList.remove("sceneEnter")},520)}
function createPeerHost(){var p=new Peer(pid(S.code),{debug:0});S.peer=p;setupVoicePeer(p);p.on("open",function(id){var me=S.players.get(S.id);if(me){me.peer=String(id||p.id||"");S.players.set(S.id,me)}net("sala online",true);E.status.textContent="Sala online. Convide seus amigos.";lobbyRegisterNow();ensureVoiceCalls()});p.on("connection",hostConn);p.on("error",function(e){if(e&&e.type==="unavailable-id"){try{p.destroy()}catch(x){}S.code=code();E.code.textContent=S.code;createPeerHost()}else{net("erro");E.status.textContent="Erro de conexão."}})}
function createRoom(){var nm=clean();if(!nm){toast("Digite seu nome para criar a sala.");E.name.focus();return}getAudio();localStorage.setItem(NAME_KEY,nm);S.host=true;S.name=nm;S.code=code();S.id="host-"+rid();S.config=readConfig();S.called=[];S.bag=makeBag();S.winner=null;S.roundStarted=false;S.round=1;S.matchHistory=[];S.chat=[];S.replayVotes=new Set();S.card=makeCard();S.marked=new Set([12]);S.players=new Map([[S.id,{id:S.id,name:nm,host:true,peer:"",card:S.card,marked:[12],ready:true,score:0,wins:0,scoredMarks:[],spectator:false,near:false}]]);gameUI();E.status.textContent="Sala criada • aguardando jogadores entrarem.";net("abrindo sala");renderWaitingRoom();toast("Sala criada! Você já entrou como anfitrião.");createPeerHost()}
function joinRoom(){var nm=clean(),cd=E.room.value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);if(!nm){toast("Digite seu nome.");return}if(cd.length!==6){toast("Digite o código de 6 caracteres.");return}getAudio();localStorage.setItem(NAME_KEY,nm);S.host=false;S.name=nm;S.code=cd;S.id="p-"+rid();S.called=[];S.winner=null;S.roundStarted=false;S.card=makeCard();S.marked=new Set([12]);S.players=new Map([[S.id,{id:S.id,name:nm,host:false,marked:[12],ready:false,score:0,wins:0,spectator:false}]]);gameUI();net("conectando");connectGuestPeer()}
function requestReplay(){voteReplay()}
function copy(t,msg){if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){toast(msg)}).catch(function(){prompt("Copie:",t)});else prompt("Copie:",t)}
function setupParallax(){var root=document.documentElement,raf=0,px=0,py=0,sy=0;if(G.reduceMotion||window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;function apply(){raf=0;root.style.setProperty("--px",px.toFixed(1)+"px");root.style.setProperty("--py",py.toFixed(1)+"px");root.style.setProperty("--scroll-py",sy.toFixed(1)+"px")}function req(){if(!raf)raf=requestAnimationFrame(apply)}window.addEventListener("pointermove",function(e){px=(e.clientX/window.innerWidth-.5)*18;py=(e.clientY/window.innerHeight-.5)*12;req()},{passive:true});window.addEventListener("scroll",function(){sy=Math.min(18,window.scrollY*.025);req()},{passive:true})}
function setupInstall(){if(!E.install)return;if(isStandalone)E.install.classList.add("hidden");else setTimeout(function(){if(!isStandalone)E.install.classList.remove("hidden")},1800);window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredInstallPrompt=e;E.install.classList.remove("hidden")});E.install.onclick=async function(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();try{await deferredInstallPrompt.userChoice}catch(e){}deferredInstallPrompt=null;E.install.classList.add("hidden")}else toast("No Chrome, use ⋮ → Instalar app.")}}
function setupPwa(){
  if(!("serviceWorker"in navigator))return Promise.resolve(null);
  if(pwaRegistrationPromise)return pwaRegistrationPromise;
  pwaRegistrationPromise=navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).then(function(reg){try{reg.update()}catch(e){}return reg}).catch(function(){return null});
  return pwaRegistrationPromise
}
function bootStep(text,pct){if(E.bootStatus)E.bootStatus.textContent=text;if(E.bootProgressFill)E.bootProgressFill.style.width=Math.max(0,Math.min(100,pct||0))+"%"}
function finishBoot(text){
  if(bootFinished)return;bootFinished=true;bootStep(text||"Tudo pronto!",100);
  setTimeout(function(){if(E.bootSplash){E.bootSplash.classList.add("isLeaving");setTimeout(function(){E.bootSplash.classList.add("hidden")},520)}},260)
}
function versionNumber(v){var n=parseInt(String(v||"0").replace(/\D+/g,""),10);return Number.isFinite(n)?n:0}
function promiseTimeout(p,ms){return Promise.race([p,new Promise(function(resolve){setTimeout(function(){resolve(null)},ms)})])}
async function checkLatestVersion(){
  var safety=setTimeout(function(){finishBoot("Jogo pronto! A verificação continuará na próxima abertura.")},6500);
  bootStep("Verificando a versão mais recente...",18);
  try{
    if(navigator.onLine){
      var checkUrl="./index.html?__nerdora_update="+Date.now();
      var controller=window.AbortController?new AbortController():null;
      var abortTimer=controller?setTimeout(function(){try{controller.abort()}catch(e){}},3200):null;
      var res=await fetch(checkUrl,{cache:"no-store",headers:{"Cache-Control":"no-cache"},signal:controller?controller.signal:undefined});
      if(abortTimer)clearTimeout(abortTimer);
      if(res&&res.ok){
        bootStep("Comparando atualizações...",42);
        var html=await res.text(),match=html.match(/data-app-version=["']([^"']+)["']/i),
            remote=match&&match[1]?String(match[1]):APP_VERSION,
            localN=versionNumber(APP_VERSION),remoteN=versionNumber(remote),
            attempted=sessionStorage.getItem("bingoNerdoraUpdateAttempt");
        if(remoteN>localN&&attempted!==remote){
          bootStep("Nova versão encontrada • atualizando...",68);
          sessionStorage.setItem("bingoNerdoraUpdateAttempt",remote);
          try{var reg0=await promiseTimeout(setupPwa(),1800);if(reg0)await promiseTimeout(reg0.update(),1800)}catch(e){}
          clearTimeout(safety);
          var u=new URL(location.href);u.searchParams.set("v",remote);u.searchParams.set("fresh",Date.now().toString());
          setTimeout(function(){location.replace(u.toString())},260);
          return false
        }
        if(remoteN<=localN){
          sessionStorage.removeItem("bingoNerdoraUpdateAttempt");
          bootStep(remoteN<localN?"Servidor sincronizando • mantendo versão atual...":"Você já está na versão mais recente.",58)
        }else if(attempted===remote){
          bootStep("Atualização já aplicada • abrindo jogo...",62)
        }
      }
    }else bootStep("Sem internet • abrindo versão salva...",48);
  }catch(e){
    bootStep(navigator.onLine?"Verificação indisponível • abrindo versão atual...":"Sem internet • abrindo versão salva...",55)
  }
  bootStep("Sincronizando arquivos do jogo...",74);
  try{
    var reg=await promiseTimeout(setupPwa(),1600);
    if(reg){await promiseTimeout(reg.update(),1600);bootStep("Arquivos sincronizados...",90)}
  }catch(e){}
  clearTimeout(safety);
  finishBoot(navigator.onLine?"Jogo atualizado e pronto!":"Modo offline pronto!");
  return true
}
function setupControls(){refreshAudioButtons();
function themedMusicGestureUnlock(){if(S.musicOn&&P.theme==="arcade")startArcadeMusic(false);if(S.musicOn&&P.theme==="nyan")startNyanMusic(false);if(S.musicOn&&P.theme==="neon")startNeonMusic(false);if(S.musicOn&&P.theme==="midnight")startMidnightMusic(false);document.removeEventListener("pointerdown",themedMusicGestureUnlock)}
document.addEventListener("pointerdown",themedMusicGestureUnlock,{passive:true});
function unlockRemoteVoiceAudio(){voiceAudios.forEach(function(el){var p=el.play();if(p&&p.catch)p.catch(function(){})})}
document.addEventListener("pointerdown",unlockRemoteVoiceAudio,{passive:true});
E.voiceToggle.onclick=function(){S.voiceOn=!S.voiceOn;localStorage.setItem("bingoVoice",S.voiceOn?"on":"off");refreshAudioButtons();if(S.voiceOn)speakText("Narração Nerdora ativada.")};E.soundToggle.onclick=function(){S.soundOn=!S.soundOn;localStorage.setItem("bingoSound",S.soundOn?"on":"off");refreshAudioButtons();if(S.soundOn)sfx("mark")};E.musicToggle.onclick=function(){S.musicOn=!S.musicOn;localStorage.setItem("bingoMusic",S.musicOn?"on":"off");refreshAudioButtons();if(S.musicOn){startMusic();if(P.theme==="arcade")toast("👾 Música Arcade ativada.");if(P.theme==="nyan")toast("🐾 Música Nyan ativada.");if(P.theme==="neon")toast("🌃 Música Neon ativada.");if(P.theme==="midnight")toast("🌙 Música Midnight ativada.")}else stopMusic()};E.themeSelect.onchange=function(){setTheme(E.themeSelect.value,true)};
document.querySelectorAll("[data-theme-choice]").forEach(function(btn){btn.onclick=function(){setTheme(btn.dataset.themeChoice,true)}});
E.name.addEventListener("input",renderProfile);
if(E.quickChat)E.quickChat.querySelectorAll("button").forEach(function(b){b.onclick=function(){sendQuick(b.dataset.chat||b.textContent)}});
document.querySelectorAll("[data-taunt]").forEach(function(b){b.onclick=function(){sendQuick(b.dataset.taunt||b.textContent);if(E.tauntMenu)E.tauntMenu.classList.add("hidden")}});
if(E.tauntToggle)E.tauntToggle.onclick=function(){E.tauntMenu.classList.toggle("hidden")};
E.settingsBtn.onclick=openSettings;E.roomSettingsBtn.onclick=openSettings;E.settingsClose.onclick=closeSettings;E.voiceChatToggle.onclick=function(){voiceChatEnabled?stopVoiceChat():startVoiceChat()};E.voiceChatMute.onclick=toggleVoiceMute;E.settingsModal.onclick=function(ev){if(ev.target===E.settingsModal)closeSettings()};
function bindRange(el,key,label,format){el.oninput=function(){G[key]=Number(el.value);saveGameSettings();label.textContent=format(G[key]);applyCurrentMusicVolume()}}
bindRange(E.musicVolumeRange,"musicVolume",E.musicVolumeValue,function(v){return v+"%"});
bindRange(E.effectsVolumeRange,"effectsVolume",E.effectsVolumeValue,function(v){return v+"%"});
bindRange(E.voiceVolumeRange,"voiceVolume",E.voiceVolumeValue,function(v){return v+"%"});
bindRange(E.voiceRateRange,"voiceRate",E.voiceRateValue,function(v){return(Number(v)/100).toFixed(2)+"×"});
bindRange(E.voiceChatVolumeRange,"voiceChatVolume",E.voiceChatVolumeValue,function(v){applyVoiceChatVolume();return v+"%"});
function bindToggle(el,key,after){el.onchange=function(){G[key]=!!el.checked;saveGameSettings();if(after)after();applyGameSettings()}}
bindToggle(E.vibrationSetting,"vibration");
bindToggle(E.wakeLockSetting,"keepAwake",syncWakeLock);
bindToggle(E.reduceMotionSetting,"reduceMotion");
bindToggle(E.showOpponentsSetting,"showOpponents",renderOpponents);
bindToggle(E.confirmExitSetting,"confirmExit");
E.testAudioBtn.onclick=function(){getAudio();sfx("mark");speakText("Teste de áudio Nerdora.",{rate:.84});if(S.musicOn)applyCurrentMusicVolume();else toast("Ative Música para testar a trilha do tema.")};
E.resetSettingsBtn.onclick=function(){G=defaultGameSettings();saveGameSettings();applyGameSettings();toast("Configurações restauradas.")};
document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&!E.settingsModal.classList.contains("hidden"))closeSettings()});
document.addEventListener("visibilitychange",syncWakeLock);
applyGameSettings()}
function setupEvents(){E.openJoin.onclick=function(){E.room.focus();E.joinBox.scrollIntoView({behavior:"smooth",block:"center"})};E.create.onclick=createRoom;E.join.onclick=joinRoom;E.draw.onclick=toggleAuto;E.bingo.onclick=bingo;E.readyBtn.onclick=toggleReady;E.leave.onclick=function(){if(G.confirmExit&&S.roundStarted&&!S.winner&&!confirm("Sair da sala? Você pode perder o andamento desta rodada."))return;S.leaving=true;stopVoiceChat();if(S.host)lobbyUnregister();if(wakeLockHandle)try{wakeLockHandle.release()}catch(e){}try{S.peer&&S.peer.destroy()}catch(e){}location.href=location.pathname};E.copyCode.onclick=function(){copy(S.code,"Código copiado.")};E.copyLink.onclick=function(){var u=new URL(location.href);u.search="";u.searchParams.set("room",S.code);copy(u.toString(),"Convite copiado.")};E.closeModal.onclick=function(){E.modal.classList.add("hidden")};E.replayBtn.onclick=requestReplay;E.replayInline.onclick=requestReplay;E.room.onkeydown=function(e){if(e.key==="Enter")joinRoom()};if(E.refreshRooms)E.refreshRooms.onclick=lobbyRefresh;window.addEventListener("beforeunload",function(){S.leaving=true;stopVoiceChat();if(S.host)lobbyUnregister();clearInterval(S.autoTimer);clearInterval(musicTimer);clearInterval(arcadeLoopTimer);clearInterval(nyanLoopTimer);clearInterval(midnightLoopTimer);if(arcadePlayerReady&&arcadePlayer)try{arcadePlayer.stopVideo()}catch(e){}if(nyanPlayerReady&&nyanPlayer)try{nyanPlayer.stopVideo()}catch(e){}if(midnightPlayerReady&&midnightPlayer)try{midnightPlayer.stopVideo()}catch(e){}if(neonAudio)try{neonAudio.pause()}catch(e){}if(wakeLockHandle)try{wakeLockHandle.release()}catch(e){}try{S.peer&&S.peer.destroy()}catch(e){}})}
// Public P2P lobby
var LOBBY_REGISTRY_ID="nerdora-bingo-public-registry-v2",LOBBY_TTL=15000,lobbyPeer=null,lobbyConn=null,lobbyRegistryPeer=null,lobbyRegistryRooms=new Map(),lobbyRegistryClients=new Set(),lobbyHeartbeatTimer=null,lobbyCleanupTimer=null;
function lobbySafeSend(c,m){if(c&&c.open)try{c.send(m);return true}catch(e){}return false}
function lobbyRoomPayload(){return{code:S.code,name:S.config.roomName||S.name,host:S.name,players:Array.from(S.players.values()).filter(function(p){return!p.spectator}).length,max:S.config.maxPlayers,mode:S.config.mode,speed:S.config.speed,public:S.config.public,started:S.roundStarted,updated:Date.now()}}
function lobbyVisibleRooms(){return Array.from(lobbyRegistryRooms.values()).filter(function(r){return r&&r.public&&!r.started&&r.code&&Date.now()-(r.updated||0)<LOBBY_TTL}).sort(function(a,b){return(b.updated||0)-(a.updated||0)}).slice(0,4)}
function lobbyBroadcast(){var m={type:"rooms",rooms:lobbyVisibleRooms()};lobbyRegistryClients.forEach(function(c){if(!lobbySafeSend(c,m))lobbyRegistryClients.delete(c)})}
function lobbyRegistryHandle(c){lobbyRegistryClients.add(c);c.on("data",function(d){if(!d||typeof d!=="object")return;if(d.type==="subscribe"||d.type==="list")lobbySafeSend(c,{type:"rooms",rooms:lobbyVisibleRooms()});if(d.type==="register"&&d.room&&d.room.code){d.room.updated=Date.now();lobbyRegistryRooms.set(String(d.room.code),d.room);lobbyBroadcast()}if(d.type==="unregister"){lobbyRegistryRooms.delete(String(d.code||""));lobbyBroadcast()}});c.on("close",function(){lobbyRegistryClients.delete(c)})}
function lobbyBecomeRegistry(){if(lobbyRegistryPeer)return;var rp=new Peer(LOBBY_REGISTRY_ID,{debug:0});lobbyRegistryPeer=rp;rp.on("connection",lobbyRegistryHandle);rp.on("open",function(){clearInterval(lobbyCleanupTimer);lobbyCleanupTimer=setInterval(function(){var now=Date.now(),changed=false;lobbyRegistryRooms.forEach(function(r,k){if(now-(r.updated||0)>LOBBY_TTL){lobbyRegistryRooms.delete(k);changed=true}});if(changed)lobbyBroadcast()},4000);setTimeout(lobbyConnect,250)});rp.on("error",function(e){if(e&&e.type==="unavailable-id"){try{rp.destroy()}catch(x){}lobbyRegistryPeer=null;setTimeout(lobbyConnect,400)}})}
function lobbyRender(rooms){var list=Array.isArray(rooms)?rooms.slice(0,4):[];E.publicRooms.innerHTML="";if(!list.length){E.publicRooms.innerHTML='<div class="roomsEmpty"><strong>Nenhuma sala aguardando</strong><span>Crie uma sala ou entre usando um código.</span></div>';return}list.forEach(function(r){var row=document.createElement("div");row.className="publicRoomCard";row.innerHTML='<div class="publicRoomInfo"><div class="publicRoomTop"><strong>'+esc(r.name||"Sala Nerdora")+'</strong><span class="waitingBadge">Aguardando</span></div><div class="publicRoomMeta"><span>'+esc(r.code)+'</span><span>•</span><span>'+esc(modeLabel(r.mode))+'</span><span>•</span><span>'+(r.players||1)+'/'+(r.max||6)+'</span></div></div>';var b=document.createElement("button");b.className="joinPublicBtn";b.textContent="Entrar";b.onclick=function(){E.room.value=r.code;if(!clean()){E.name.focus();toast("Digite seu nome primeiro.");return}joinRoom()};row.appendChild(b);E.publicRooms.appendChild(row)})}
function lobbyConnect(){if(!lobbyPeer||!lobbyPeer.open||lobbyConn&&lobbyConn.open)return;var c=lobbyPeer.connect(LOBBY_REGISTRY_ID,{reliable:true});lobbyConn=c;var opened=false;c.on("open",function(){opened=true;lobbySafeSend(c,{type:"subscribe"});lobbyRegisterNow()});c.on("data",function(d){if(d&&d.type==="rooms")lobbyRender(d.rooms)});c.on("close",function(){lobbyConn=null;setTimeout(lobbyConnect,1200)});setTimeout(function(){if(!opened){try{c.close()}catch(e){}lobbyConn=null;lobbyBecomeRegistry()}},1400)}
function lobbyStart(){if(typeof Peer==="undefined")return;var p=new Peer(undefined,{debug:0});lobbyPeer=p;p.on("open",function(){lobbyConnect();clearInterval(lobbyHeartbeatTimer);lobbyHeartbeatTimer=setInterval(function(){if(lobbyConn&&lobbyConn.open){lobbySafeSend(lobbyConn,{type:"subscribe"});lobbyRegisterNow()}else lobbyConnect()},4000)})}
function lobbyRegisterNow(){if(S.host&&S.code&&S.config.public&&!S.roundStarted&&!S.winner&&lobbyConn&&lobbyConn.open)lobbySafeSend(lobbyConn,{type:"register",room:lobbyRoomPayload()})}
function lobbyUnregister(){if(S.code&&lobbyConn&&lobbyConn.open)lobbySafeSend(lobbyConn,{type:"unregister",code:S.code})}
function lobbyRefresh(){if(lobbyConn&&lobbyConn.open)lobbySafeSend(lobbyConn,{type:"list"});else lobbyConnect()}
renderProfile();setupParallax();setupInstall();setupControls();setupEvents();lobbyStart();if(S.musicOn)startMusic();checkLatestVersion();
})();