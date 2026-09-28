const CACHE="nerdora-chibi-raiders-pwa-v9.1.1";
const CORE=["./","./index.html","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key!==CACHE&&key.startsWith("nerdora-chibi-raiders-pwa-"))await caches.delete(key)}await self.clients.claim()})());});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 if(req.mode==="navigate"){
   event.respondWith(fetch(req,{cache:"no-store"}).catch(()=>caches.match("./index.html")));
   return;
 }
 event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});return res;}).catch(()=>caches.match(req)));
});