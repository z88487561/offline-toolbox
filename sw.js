/* 全能工作站 Service Worker —— 預先快取全部檔案，完全離線可用 */
const VERSION='19ff372fd4';
const CACHE='ws-'+VERSION;
const PRECACHE=["./", "README.md", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "lib/cropper.js", "lib/fabric.js", "lib/heic2any.js", "lib/jspdf.js", "lib/kjua.js", "lib/pako-inflate.js", "lib/pdf-lib.js", "lib/pdf.worker.js", "lib/pdfjs.js", "lib/sortable.js", "lib/utif.js", "manifest.webmanifest", "tools/compose.html", "tools/image.html", "tools/patch-compose.js", "tools/patch-image.js", "tools/patch-pdf.js", "tools/pdf.html", "tools/player.html", "tools/qr.html", "tools/record.html", "tools/viewer.html"];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE.map(u=>new Request(u,{cache:'reload'})))));
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k.startsWith('ws-')&&k!==CACHE&&k!=='ws-share-inbox') await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  // Web Share Target：把分享進來的檔案暫存，再導回首頁
  if(req.method==='POST'&&url.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      const fd=await req.formData();const c=await caches.open('ws-share-inbox');let n=0;
      for(const f of fd.getAll('files')){
        if(!(f instanceof File))continue;
        await c.put('/__share/'+(n++),new Response(f,{headers:{'x-name':encodeURIComponent(f.name),'content-type':f.type}}));
      }
      return Response.redirect('./?shared='+n,303);
    })());
    return;
  }
  if(req.method!=='GET'||url.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(req,{ignoreSearch:true});
    if(hit)return hit;
    try{
      const res=await fetch(req);
      if(res.ok&&res.type==='basic')c.put(req,res.clone());
      return res;
    }catch(err){
      if(req.mode==='navigate')return (await c.match('./index.html'))||Response.error();
      return Response.error();
    }
  })());
});
