(function(){
var bg=document.querySelector(".nerdoraBg");
function parallax(x,y){if(!bg)return;bg.style.setProperty("--px",x+"px");bg.style.setProperty("--py",y+"px")}
window.addEventListener("pointermove",function(e){parallax(((e.clientX/window.innerWidth)-.5)*18,((e.clientY/window.innerHeight)-.5)*12)},{passive:true});
window.addEventListener("deviceorientation",function(e){if(e.gamma==null||e.beta==null)return;parallax(Math.max(-14,Math.min(14,e.gamma/3)),Math.max(-10,Math.min(10,(e.beta-45)/5)))},{passive:true});
})();