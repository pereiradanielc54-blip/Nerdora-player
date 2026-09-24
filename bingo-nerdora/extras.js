(function(){
var voiceBtn=document.getElementById("voiceToggle"),installBtn=document.getElementById("installBtn"),last=document.getElementById("last"),bg=document.querySelector(".nerdoraBg");
var voiceOn=localStorage.getItem("bingoVoice")!=="off",lastSpoken="",deferredPrompt=null;
function refreshVoice(){if(!voiceBtn)return;voiceBtn.textContent=voiceOn?"🔊 Voz":"🔇 Voz";voiceBtn.classList.toggle("voiceOff",!voiceOn)}
function getVoice(){if(!("speechSynthesis" in window))return null;var vs=speechSynthesis.getVoices();return vs.find(function(v){return (v.lang||"").toLowerCase()==="pt-br"})||vs.find(function(v){return (v.lang||"").toLowerCase().indexOf("pt")===0})||null}
function speakText(text){if(!voiceOn||!("speechSynthesis" in window))return;var u=new SpeechSynthesisUtterance(text);u.lang="pt-BR";u.rate=.88;u.pitch=1;var v=getVoice();if(v)u.voice=v;speechSynthesis.cancel();speechSynthesis.speak(u)}
function speakBallLabel(label){var m=/^([BINGO])(\d{1,2})$/.exec(label);if(!m||label===lastSpoken)return;lastSpoken=label;var names={B:"Bê",I:"I",N:"Ene",G:"Gê",O:"Ó"};speakText(names[m[1]]+", "+Number(m[2]))}
refreshVoice();
if(voiceBtn)voiceBtn.onclick=function(){voiceOn=!voiceOn;localStorage.setItem("bingoVoice",voiceOn?"on":"off");refreshVoice();if(voiceOn)speakText("Voz ativada")};
if(last){new MutationObserver(function(){var t=(last.textContent||"").trim();if(t&&t!=="—")speakBallLabel(t)}).observe(last,{childList:true,characterData:true,subtree:true})}
function parallax(x,y){if(!bg)return;bg.style.setProperty("--px",x+"px");bg.style.setProperty("--py",y+"px")}
window.addEventListener("pointermove",function(e){parallax(((e.clientX/window.innerWidth)-.5)*18,((e.clientY/window.innerHeight)-.5)*12)},{passive:true});
window.addEventListener("deviceorientation",function(e){if(e.gamma==null||e.beta==null)return;parallax(Math.max(-14,Math.min(14,e.gamma/3)),Math.max(-10,Math.min(10,(e.beta-45)/5)))},{passive:true});
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredPrompt=e;if(installBtn)installBtn.classList.remove("hidden")});
if(installBtn)installBtn.onclick=async function(){if(!deferredPrompt){alert("No Android, abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.");return}deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(e){}deferredPrompt=null;installBtn.classList.add("hidden")};
if(window.matchMedia("(display-mode: standalone)").matches&&installBtn)installBtn.classList.add("hidden");
if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
})();