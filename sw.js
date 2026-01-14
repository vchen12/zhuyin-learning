// 注音符號學習樂園 Service Worker
// 版本號 - 更新此值會觸發快取更新
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `zhuyin-learning-${CACHE_VERSION}`;

// 需要快取的檔案清單（使用相對路徑以支援 GitHub Pages 子目錄部署）
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './level0/index.html',
  './level1/index.html',
  './level2/index.html',
  // 音檔
  './sounds/F1.mp3',
  './sounds/F2.mp3',
  './sounds/F3.mp3',
  './sounds/F4.mp3',
  './sounds/F5.mp3',
  './sounds/F6.mp3',
  './sounds/F7.mp3',
  './sounds/F8.mp3',
  './sounds/F9.mp3',
  './sounds/F10.mp3',
  './sounds/F11.mp3',
  './sounds/F12.mp3',
  './sounds/F13.mp3',
  './sounds/F14.mp3',
  './sounds/F15.mp3',
  './sounds/F16.mp3',
  './sounds/F17.mp3',
  './sounds/F18.mp3',
  './sounds/F19.mp3',
  './sounds/F20.mp3',
  './sounds/F21.mp3',
  './sounds/F22.mp3',
  './sounds/F23.mp3',
  './sounds/F24.mp3',
  './sounds/F25.mp3',
  './sounds/F26.mp3',
  './sounds/F27.mp3',
  './sounds/F28.mp3',
  './sounds/F29.mp3',
  './sounds/F30.mp3',
  './sounds/F31.mp3',
  './sounds/F32.mp3',
  './sounds/F33.mp3',
  './sounds/F34.mp3',
  './sounds/F35.mp3',
  './sounds/F36.mp3',
  './sounds/F37.mp3',
  // 圖示
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// 安裝事件 - 預先快取所有檔案
self.addEventListener('install', (event) => {
  console.log('[SW] 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 快取檔案中...');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] 安裝完成！');
        return self.skipWaiting(); // 立即啟用
      })
      .catch((error) => {
        console.error('[SW] 快取失敗:', error);
      })
  );
});

// 啟用事件 - 清理舊版快取
self.addEventListener('activate', (event) => {
  console.log('[SW] 啟用中...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] 刪除舊快取:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] 啟用完成！');
        return self.clients.claim(); // 控制所有頁面
      })
  );
});

// 攔截請求 - 快取優先策略
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果有快取，直接返回
        if (cachedResponse) {
          // 背景更新（stale-while-revalidate）
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {}); // 網路錯誤時忽略
          
          return cachedResponse;
        }

        // 沒有快取，嘗試從網路取得
        return fetch(event.request)
          .then((networkResponse) => {
            // 快取新資源
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // 網路錯誤且無快取，返回離線頁面（如果是 HTML）
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 處理推播訊息（未來擴充用）
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
