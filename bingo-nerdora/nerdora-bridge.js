(function(){
"use strict";
var params=new URLSearchParams(location.search);
if(params.get("embed")!=="nerdora"||window.parent===window)return;

var state={profile:null,friends:[]};
document.body.classList.add("nerdoraEmbedded");

function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function safeUrl(value){try{var u=new URL(String(value||""));return /^https?:$/.test(u.protocol)?u.href:""}catch(e){return""}}
function roomCode(){
  var el=document.getElementById("code"),v=el?String(el.textContent||""):"";
  v=v.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
  return v.length===6?v:"";
}
function profileName(){
  return state.profile&&state.profile.publicName?state.profile.publicName:"Jogador Nerdora";
}
function ensureHandle(){
  var info=document.querySelector("#profileMini .profileMiniInfo"),existing=document.getElementById("nerdoraProfileHandle");
  if(!info||existing)return existing;
  var small=document.createElement("small");small.id="nerdoraProfileHandle";small.className="nerdoraProfileHandle";
  var name=document.getElementById("profileName");if(name&&name.nextSibling)info.insertBefore(small,name.nextSibling);else info.appendChild(small);
  return small
}
function applyProfile(){
  if(!state.profile)return;
  var name=String(state.profile.publicName||state.profile.username||"Jogador Nerdora").trim().slice(0,24),
      photo=safeUrl(state.profile.photoUrl),
      username=String(state.profile.username||"").replace(/^@/,"").slice(0,24),
      input=document.getElementById("name"),
      pName=document.getElementById("profileName"),
      avatar=document.getElementById("profileAvatar"),
      handle=ensureHandle();
  if(input){input.value=name;input.readOnly=true;input.setAttribute("aria-readonly","true")}
  if(pName)pName.textContent=name;
  if(handle){handle.textContent=username?"@"+username:"";handle.style.display=username?"block":"none"}
  if(avatar){
    avatar.classList.toggle("nerdoraProfilePhoto",!!photo);
    if(photo){avatar.textContent="";avatar.style.backgroundImage='url("'+photo.replace(/"/g,"%22")+'")'}
    else{avatar.style.backgroundImage="";avatar.textContent=(name[0]||"N").toUpperCase()}
  }
  try{localStorage.setItem("bingoNerdoraName",name)}catch(e){}
}
function friendRow(friend){
  var row=document.createElement("div");row.className="nerdoraBridgeFriend";
  var avatar=document.createElement("div");avatar.className="nerdoraBridgeAvatar";
  var photo=safeUrl(friend.photoUrl);
  if(photo){avatar.classList.add("hasPhoto");avatar.style.backgroundImage='url("'+photo.replace(/"/g,"%22")+'")'}
  else avatar.textContent=String(friend.publicName||friend.username||"N").charAt(0).toUpperCase();
  var info=document.createElement("span");info.innerHTML="<strong>"+esc(friend.publicName||friend.username||"Amigo")+"</strong><small>@"+esc(friend.username||"nerdora")+"</small>";
  var btn=document.createElement("button");btn.type="button";btn.className="nerdoraBridgeInvite";
  var code=roomCode();
  btn.textContent=code?"Convidar":"Entre em sala";
  btn.disabled=!code;
  btn.onclick=function(){
    var current=roomCode();if(!current)return;
    btn.disabled=true;btn.textContent="Enviando...";
    window.parent.postMessage({type:"NERDORA_BINGO_INVITE",username:String(friend.username||""),roomCode:current,roomName:(document.getElementById("roomDisplayName")||{}).textContent||"Sala Nerdora",senderName:profileName()},"*");
    setTimeout(function(){if(btn.disabled){btn.disabled=false;btn.textContent="Convidar"}},3500)
  };
  row.appendChild(avatar);row.appendChild(info);row.appendChild(btn);return row
}
function makePanel(id,title,subtitle,compact){
  var section=document.createElement("section");section.id=id;section.className="nerdoraBridgeFriends"+(compact?" compact":"");
  section.innerHTML='<div class="nerdoraBridgeHead"><div><span>AMIGOS NERDORA</span><strong>'+esc(title)+'</strong></div><small>'+esc(subtitle)+'</small></div><div class="nerdoraBridgeList"></div>';
  return section
}
function ensurePanels(){
  var profile=document.getElementById("profileMini");
  if(profile&&!document.getElementById("nerdoraBridgeLobbyFriends")){
    var lobby=makePanel("nerdoraBridgeLobbyFriends","Sua turma","Crie ou entre em uma sala para convidar",false);
    profile.insertAdjacentElement("afterend",lobby)
  }
  var code=document.getElementById("code"),aside=code&&code.closest("aside");
  if(aside&&!document.getElementById("nerdoraBridgeRoomFriends")){
    var room=makePanel("nerdoraBridgeRoomFriends","Convidar para esta sala","via Nerdora",true);
    var actions=aside.querySelector(".actions.small");if(actions)actions.insertAdjacentElement("afterend",room);else aside.appendChild(room)
  }
}
function renderFriends(){
  ensurePanels();
  ["nerdoraBridgeLobbyFriends","nerdoraBridgeRoomFriends"].forEach(function(id){
    var panel=document.getElementById(id);if(!panel)return;
    var list=panel.querySelector(".nerdoraBridgeList");if(!list)return;
    list.innerHTML="";
    var friends=(state.friends||[]).slice(0,16);
    if(!friends.length){list.innerHTML='<div class="nerdoraBridgeEmpty">Seus amigos do Nerdora aparecerão aqui.</div>';return}
    friends.forEach(function(f){list.appendChild(friendRow(f))})
  })
}
function applyContext(data){
  var p=data&&data.profile||{};
  state.profile={
    publicName:String(p.publicName||p.displayName||p.username||"Jogador Nerdora").slice(0,50),
    username:String(p.username||"").replace(/^@/,"").slice(0,24),
    photoUrl:safeUrl(p.photoUrl),
    userId:String(p.userId||"")
  };
  state.friends=Array.isArray(data&&data.friends)?data.friends.map(function(f){return{
    userId:String(f.userId||""),
    username:String(f.username||"").replace(/^@/,"").slice(0,24),
    publicName:String(f.publicName||f.username||"Amigo").slice(0,50),
    photoUrl:safeUrl(f.photoUrl)
  }}).filter(function(f){return!!f.username}):[];
  document.body.classList.add("nerdoraLinked");applyProfile();renderFriends()
}

window.addEventListener("message",function(ev){
  if(ev.source!==window.parent||!ev.data||typeof ev.data!=="object")return;
  if(ev.data.type==="NERDORA_BINGO_CONTEXT")applyContext(ev.data);
  if(ev.data.type==="NERDORA_BINGO_INVITE_RESULT"){
    var msg=ev.data.ok?"💜 Convite enviado para @"+String(ev.data.username||"amigo"):(ev.data.error||"Não foi possível enviar o convite.");
    if(typeof window.toast==="function")window.toast(msg);
    else{var t=document.getElementById("toast");if(t){t.textContent=msg;t.classList.remove("hidden");setTimeout(function(){t.classList.add("hidden")},1800)}}
    document.querySelectorAll(".nerdoraBridgeInvite").forEach(function(b){b.disabled=!roomCode();b.textContent=roomCode()?"Convidar":"Entre em sala"})
  }
  if(ev.data.type==="NERDORA_BINGO_COPY_RESULT"){
    var msg2=ev.data.ok?"Convite copiado.":"Não foi possível copiar o convite.";
    var t2=document.getElementById("toast");if(t2){t2.textContent=msg2;t2.classList.remove("hidden");setTimeout(function(){t2.classList.add("hidden")},1600)}
  }
});

document.addEventListener("click",function(ev){
  var target=ev.target&&ev.target.closest?ev.target.closest("#copyLink"):null;
  if(!target)return;
  var code=roomCode();if(!code)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  window.parent.postMessage({type:"NERDORA_BINGO_COPY_INVITE",roomCode:code},"*")
},true);

var observer=new MutationObserver(function(){
  applyProfile();renderFriends()
});
observer.observe(document.body,{subtree:true,childList:true,characterData:true});

applyProfile();renderFriends();
window.parent.postMessage({type:"NERDORA_BINGO_READY",version:"40"},"*");
})();