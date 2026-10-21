// 离线缓存：页面和目录优先联网（方便更新），题目分片和图片包缓存优先，看过一次就留在手机里
const V = 'xingce-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'index.html', 'index.txt', 'manifest.webmanifest', 'icon-192.png']).catch(() => { })).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const data = /\/(t|i)\/\d+\.txt$/.test(u.pathname);
  if (data) {
    // 图片包的分段请求改成取整包：整包缓存后，之后每张图都不用再联网
    const req = r.headers.has('range') ? new Request(r.url) : r;
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(req, c)); } return res; })));
    return;
  }
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true })));
});
