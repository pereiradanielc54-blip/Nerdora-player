const CACHE="nerdora-chibi-raiders-pwa-v10.1.1";
self.addEventListener("install",event=>{self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith("nerdora-chibi-raiders-pwa-"))await caches.delete(key)}await self.clients.claim()})());});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const u=new URL(event.request.url);
 if(event.request.mode==="navigate"||u.pathname.endsWith("/version.json")||u.pathname.endsWith("/index.html")){
   event.respondWith(fetch(event.request,{cache:"no-store"}));
 }
});