/* AIDD Process Next — Service Worker
 * 完全静的・オフライン対応 PWA 用。外部依存なし。
 */
'use strict';

const CACHE_NAME = 'aidd-v1';

// プリキャッシュ対象の静的アセット（同一オリジン・相対パス）
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/tokens.css',
  './css/style.css',
  './js/scoring.js',
  './js/app.js',
  './data/questions.js',
  './data/sample-answers.js',
  './manifest.json',
  './icon.svg'
];

// install: 静的アセットをプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// activate: 旧バージョンのキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// fetch: 同一オリジンGETは cache-first、その他はネットワークへ素通し
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // GET 以外は介入しない
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // クロスオリジン（Google Fonts 等）はキャッシュせずネットワークへ素通し
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // 正常な同一オリジンレスポンスのみキャッシュ更新
          if (response && response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // ネットワーク失敗時のフォールバック
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return caches.match(request);
        });
    })
  );
});
