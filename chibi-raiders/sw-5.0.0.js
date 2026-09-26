const CACHE_NAME="nerdora-chibi-raiders-v5.0.0-ui-routing-heroes";
const FALLBACK="./index-5.0.0.html";
const CORE=[
 "./index-5.0.0.html",
 "./styles-5.0.0.css",
 "./app-5.0.0.js",
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
self.addEventListener("install",e=>{
 e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",e=>{if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.endsWith("/version.json")){
  e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match("./version.json")));
  return;
 }
 if(e.request.mode==="navigate"){
  const stable=u.pathname.endsWith("/index.html")||u.pathname.endsWith("/chibi-raiders/");
  if(stable){
   e.respondWith(caches.match(FALLBACK).then(c=>c||fetch(FALLBACK,{cache:"no-store"})));
   return;
  }
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{
   const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,x));return r;
  }).catch(()=>caches.match(e.request).then(x=>x||caches.match(FALLBACK))));
  return;
 }
 e.respondWith(caches.match(e.request).then(cached=>{
  const net=fetch(e.request,{cache:"no-store"}).then(r=>{
   if(r&&r.ok){const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,x))}
   return r;
  }).catch(()=>cached);
  return cached||net;
 }));
});