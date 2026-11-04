/* BVI hub offline shell. Bump VERSION to force everyone onto a fresh cache. */
const VERSION="bvihub-v2";
const SHELL=["hub.html","baths.jpg","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
const CDN=["www.gstatic.com","fonts.googleapis.com","fonts.gstatic.com"];
const MINE=/\/(hub\.html|baths\.jpg|manifest\.webmanifest|icon-192\.png|icon-512\.png|apple-touch-icon\.png)$/;
self.addEventListener("install",(e)=>{ e.waitUntil(caches.open(VERSION).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:"reload"})).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener("activate",(e)=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
async function check(client,build){
  try{
    const r=await fetch("hub.html",{cache:"no-store"});
    if(!r || !r.ok) return;
    const t=await r.clone().text(), m=t.match(/const BUILD="([^"]+)"/);
    if(m && build && m[1]!==build){ const c=await caches.open(VERSION); await c.put("hub.html",r); client.postMessage({type:"updated"}); }
  }catch(e){}
}
self.addEventListener("message",(e)=>{ if(e.data && e.data.type==="check" && e.source) e.waitUntil(check(e.source,e.data.build)); });
self.addEventListener("fetch",(e)=>{
  const req=e.request; if(req.method!=="GET") return;
  const url=new URL(req.url);
  const mine=url.origin===location.origin && MINE.test(url.pathname);
  const cdn=CDN.includes(url.hostname);
  if(!mine && !cdn) return;
  e.respondWith(caches.open(VERSION).then(async(c)=>{
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(r=>{ if(r && (r.ok||r.type==="opaque")) c.put(req,r.clone()); return r; }).catch(()=>null);
    return hit || (await net) || Response.error();
  }));
});
