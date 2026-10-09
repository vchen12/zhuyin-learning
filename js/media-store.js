/**
 * MediaStore — 照片／錄音的 IndexedDB 共用存取（v5.6.1）
 *
 * 為什麼不用 localStorage：iOS Safari 的 localStorage 每個網站只有約 5MB（字串以 UTF-16 計，
 * 一張 900px 的 JPEG dataURL 就吃掉 300–500KB），存四、五張照片就會「儲存空間不足」，
 * 與 iPad 本身的容量無關。IndexedDB 存 Blob，額度以數百 MB 計。
 *
 * 用法：
 *   const store = await MediaStore.open('zhuyin-board');   // 不支援 IndexedDB 時回傳 null
 *   await store.put('iwant/pee/photo', blob);
 *   const blob = await store.get(key);  await store.del(key);
 *   await store.each('voyage/', (key, blob) => { ... });    // 依 key 前綴走訪
 *   MediaStore.dataUrlToBlob(dataUrl) → Blob
 * 相容 iOS 12：不用 ?. 與 ??。
 */
const MediaStore = (function () {
    'use strict';
    const STORE = 'media';

    function open(dbName) {
        return new Promise(function (resolve) {
            if (typeof indexedDB === 'undefined') { resolve(null); return; }
            let req;
            try { req = indexedDB.open(dbName, 1); } catch (e) { resolve(null); return; }
            req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
            req.onsuccess = function () { resolve(wrap(req.result)); };
            req.onerror = function () { resolve(null); };
            req.onblocked = function () { resolve(null); };
        });
    }

    function wrap(db) {
        function tx(mode, fn) {
            return new Promise(function (resolve) {
                let t;
                try { t = db.transaction(STORE, mode); } catch (e) { resolve(false); return; }
                const out = fn(t.objectStore(STORE));
                t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : true); };
                t.onerror = function () { resolve(false); };
                t.onabort = function () { resolve(false); };
            });
        }
        return {
            put: function (key, blob) { return tx('readwrite', function (s) { s.put(blob, key); }); },
            del: function (key) { return tx('readwrite', function (s) { s.delete(key); }); },
            get: function (key) {
                return new Promise(function (resolve) {
                    let t;
                    try { t = db.transaction(STORE, 'readonly'); } catch (e) { resolve(null); return; }
                    const r = t.objectStore(STORE).get(key);
                    r.onsuccess = function () { resolve(r.result || null); };
                    r.onerror = function () { resolve(null); };
                });
            },
            /** 走訪 key 以 prefix 開頭的每一筆（'' = 全部） */
            each: function (prefix, cb) {
                return new Promise(function (resolve) {
                    let t;
                    try { t = db.transaction(STORE, 'readonly'); } catch (e) { resolve(); return; }
                    const r = t.objectStore(STORE).openCursor();
                    r.onsuccess = function () {
                        const cur = r.result;
                        if (!cur) { resolve(); return; }
                        if (!prefix || String(cur.key).indexOf(prefix) === 0) cb(String(cur.key), cur.value);
                        cur.continue();
                    };
                    r.onerror = function () { resolve(); };
                });
            }
        };
    }

    /** dataURL → Blob（給舊資料遷移與裁切結果存檔用） */
    function dataUrlToBlob(dataUrl) {
        const i = dataUrl.indexOf(',');
        const meta = dataUrl.slice(0, i), b64 = dataUrl.slice(i + 1);
        const mime = (meta.match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream';
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
        return new Blob([u8], { type: mime });
    }
    function isDataUrl(s) { return typeof s === 'string' && s.indexOf('data:') === 0; }

    const api = { open: open, dataUrlToBlob: dataUrlToBlob, isDataUrl: isDataUrl };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
