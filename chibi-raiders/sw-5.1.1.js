const CACHE_NAME="nerdora-chibi-raiders-v5.1.1-nav-boss-hotfix";
const FALLBACK="./index-5.1.1.html";
const CORE=[
 "./index-5.1.1.html",
 "./styles-5.1.1.css",
 "./app-5.1.1.js",
 "./heroes/hero-atlas-21-40.js",
 "./heroes/21-zelador-das-catacumbas.js",
 "./heroes/22-bardo-de-taverna.js",
 "./heroes/23-cacador-de-insetos.js",
 "./heroes/24-alquimista-louco.js",
 "./heroes/25-gladiador-das-areias.js",
 "./heroes/26-engenhoqueiro-goblin.js",
 "./heroes/27-monge-do-punho-de-ferro.js",
 "./heroes/28-sereia-dos-recifes.js",
 "./heroes/29-cavaleiro-da-peste.js",
 "./heroes/30-samurai-espectral.js",
 "./heroes/31-domador-de-feras.js",
 "./heroes/32-maquinista-do-juizo-final.js",
 "./heroes/33-valkyria-do-trovao.js",
 "./heroes/34-senhor-dos-pesadelos.js",
 "./heroes/35-sacerdotisa-da-lua-sangrenta.js",
 "./heroes/36-mestre-das-marionetes.js",
 "./heroes/37-guardiao-do-templo-ancestral.js",
 "./heroes/38-atiradora-de-cristal-kinesis.js",
 "./heroes/39-tita-do-nucleo-magmatico.js",
 "./heroes/40-rainha-do-espelho-dimensional.js",
 "./manifest.webmanifest",
 "./version.json",
 "./icon-192.webp",
 "./icon-512.webp",
 "./assets/heroes/hero_atlas_20.webp",
 "./audio/menu-theme.wav",
 "./audio/battle-theme.wav",
 "./audio/ui-click.wav",
 "./audio/impact.wav",
 "./audio/ultimate-ready.wav",
 "./audio/ultimate-cast.wav",
 "./audio/reward.wav"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",e=>{if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.endsWith("/version.json")){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match("./version.json")));return}
 if(e.request.mode==="navigate"){
  const stable=u.pathname.endsWith("/index.html")||u.pathname.endsWith("/chibi-raiders/");
  if(stable){e.respondWith(caches.match(FALLBACK).then(c=>c||fetch(FALLBACK,{cache:"no-store"})));return}
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request).then(x=>x||caches.match(FALLBACK))));return;
 }
 e.respondWith(caches.match(e.request).then(cached=>{
  const net=fetch(e.request,{cache:"no-store"}).then(r=>{if(r&&r.ok){const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,x))}return r}).catch(()=>cached);
  return cached||net;
 }));
});