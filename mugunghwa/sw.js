/* 무궁화 꽃이 피었습니다 — 오프라인 실행용 서비스 워커
   - 화면(index.html): 인터넷 우선, 끊기거나 4초 넘게 느리면 저장본
   - AI 엔진·인식 모델: 한 번 받으면 기기에 저장해 두고 그대로 사용 (주소에 버전이 있어 바뀌지 않음)
   - 이미지·아이콘: 저장본을 바로 쓰고 뒤에서 새 파일로 갱신
   파일을 고쳐 다시 올릴 때는 VERSION 값을 바꿔 주세요. */
const VERSION = "2026.10.14g";
const SHELL = `mkh-shell-${VERSION}`;
const ENGINE = "mkh-engine-mp0.10.3";
const SHELL_FILES = [
  "./",
  "manifest.webmanifest",
  "assets/chulsa-front.webp",
  "assets/chulsa-back.webp",
  "assets/chulsa-body.webp",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

const isEngine = (url) =>
  url.pathname.includes("/lib/mediapipe/") ||
  url.pathname.includes("/models/") ||
  (url.hostname === "cdn.jsdelivr.net" && url.pathname.startsWith("/npm/@mediapipe/tasks-vision@")) ||
  (url.hostname === "storage.googleapis.com" && url.pathname.startsWith("/mediapipe-models/"));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith("mkh-") && k !== SHELL && k !== ENGINE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 화면: 인터넷 우선 → 실패하거나 느리면 저장본
async function pageNetworkFirst(request) {
  const cache = await caches.open(SHELL);
  const key = self.registration.scope;
  const network = fetch(request).then((res) => {
    if (res.ok && !res.redirected) cache.put(key, res.clone());
    return res;
  });
  network.catch(() => {}); // 오프라인일 때 콘솔 경고 방지 (아래에서 저장본으로 대체)
  const cached = await cache.match(key);
  if (!cached) return network;
  try {
    const res = await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    return res.ok ? res : cached;
  } catch {
    return cached;
  }
}

// AI 엔진·모델: 저장본 우선
async function engineCacheFirst(request) {
  const hit = await caches.match(request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(ENGINE);
    cache.put(request, res.clone());
  }
  return res;
}

// 이미지·아이콘 등: 저장본 바로 사용 + 뒤에서 갱신
async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => hit || Response.error());
  return hit || network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.mode === "navigate") {
    if (url.href.startsWith(self.registration.scope)) event.respondWith(pageNetworkFirst(request));
    return;
  }
  if (isEngine(url)) { event.respondWith(engineCacheFirst(request)); return; }
  if (url.href.startsWith(self.registration.scope)) event.respondWith(staleWhileRevalidate(request));
});

// 첫 방문처럼 서비스 워커가 늦게 켜진 경우, 화면이 알려 준 엔진·모델 주소를 뒤늦게라도 저장
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "warm" || !Array.isArray(data.urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(ENGINE);
    for (const u of data.urls) {
      try {
        const url = new URL(u);
        if (!isEngine(url) || await caches.match(u, { ignoreVary: true })) continue;
        const sameOrigin = url.origin === self.location.origin;
        const res = await fetch(new Request(u, { mode: sameOrigin ? "same-origin" : "cors", credentials: "omit" }));
        if (res.ok) await cache.put(u, res);
      } catch {}
    }
  })());
});
