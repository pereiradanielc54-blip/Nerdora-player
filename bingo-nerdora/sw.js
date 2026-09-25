const CACHE="bingo-nerdora-v36";
const VERSION="36";
const CORE=["./","./index.html","./style.css","./app.js","./extras.js","./manifest.json","./icon.svg","./assets/bingo-cover.webp","./assets/neon-theme.mp3"];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>Promise.allSettled(CORE.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="GET_VERSION"&&event.source){
    event.source.postMessage({type:"APP_VERSION",version:VERSION});
  }
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  const networkFirst=req.mode==="navigate"||/\.(?:html|js|css|json)$/.test(url.pathname);
  if(networkFirst){
    event.respondWith(
      fetch(req,{cache:"no-store"}).then(res=>{
        if(res&&res.ok){
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy));
        }
        return res;
      }).catch(()=>caches.match(req,{ignoreSearch:true}).then(hit=>hit||caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req,{ignoreSearch:true}).then(hit=>{
      if(hit)return hit;
      return fetch(req).then(res=>{
        if(res&&res.ok){
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy));
        }
        return res;
      });
    })
  );
});
