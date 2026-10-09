/**
 * 共用照片裁切模組 v1（v5.3.1）
 * 用法：PhotoCrop.open(fileOrDataUrl, { aspect: 1, outWidth: 600, title: '選臉孔' }).then(dataUrl => ...)
 *   - 回傳 JPEG dataURL；使用者取消回傳 null。
 *   - 拖曳移動、雙指／滾輪／滑桿縮放；「整張使用」直接等比縮至 outWidth 不裁切。
 *   - 自行注入 modal，頁面不需準備標記；不用 ?. / ??（iOS 12 相容）。
 */
(function (global) {
    'use strict';
    let el = null, canvas = null, ctx = null, slider = null, titleEl = null, hintEl = null;
    let img = null, resolveFn = null, opt = null;
    let viewW = 300, viewH = 300;
    let x = 0, y = 0, scale = 1, minScale = 1;
    const pointers = {};           // pointerId → {x,y}
    let lastDist = null;

    function ensure() {
        if (el) return;
        el = document.createElement('div');
        el.id = 'photoCropModal';
        el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:2147483100;padding:12px;';
        el.innerHTML =
            '<div style="background:#fff;border-radius:18px;padding:18px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:-apple-system,\'PingFang TC\',\'Noto Sans TC\',system-ui,sans-serif;color:#333;">' +
            '<div id="photoCropTitle" style="font-size:1.2rem;font-weight:800;text-align:center;margin-bottom:6px;">✂️ 裁切照片</div>' +
            '<div id="photoCropHint" style="font-size:.9rem;color:#666;text-align:center;margin-bottom:10px;">拖曳移動，滑桿或雙指縮放，把臉放進框裡</div>' +
            '<div style="display:flex;justify-content:center;"><canvas id="photoCropCanvas" style="border-radius:14px;border:3px solid #667eea;background:#eee;touch-action:none;max-width:100%;"></canvas></div>' +
            '<div style="display:flex;align-items:center;gap:10px;margin:12px 0;"><span style="font-size:1.1rem;">🔍</span><input id="photoCropZoom" type="range" min="0" max="100" value="0" style="flex:1;height:32px;accent-color:#667eea;"></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button id="photoCropCancel" style="flex:1;min-width:90px;padding:14px;border:none;border-radius:12px;background:#e0e0e0;color:#333;font-size:1rem;font-weight:700;">取消</button>' +
            '<button id="photoCropWhole" style="flex:1;min-width:90px;padding:14px;border:none;border-radius:12px;background:#90a4ae;color:#fff;font-size:1rem;font-weight:700;">整張使用</button>' +
            '<button id="photoCropOk" style="flex:1.4;min-width:120px;padding:14px;border:none;border-radius:12px;background:#667eea;color:#fff;font-size:1rem;font-weight:800;">✅ 確認裁切</button>' +
            '</div></div>';
        document.body.appendChild(el);
        canvas = el.querySelector('#photoCropCanvas');
        ctx = canvas.getContext('2d');
        slider = el.querySelector('#photoCropZoom');
        titleEl = el.querySelector('#photoCropTitle');
        hintEl = el.querySelector('#photoCropHint');
        el.querySelector('#photoCropCancel').addEventListener('click', () => finish(null));
        el.querySelector('#photoCropWhole').addEventListener('click', () => finish(exportWhole()));
        el.querySelector('#photoCropOk').addEventListener('click', () => finish(exportCrop()));
        slider.addEventListener('input', () => setScaleAround(sliderToScale(parseFloat(slider.value)), viewW / 2, viewH / 2));

        canvas.addEventListener('pointerdown', e => {
            e.preventDefault(); canvas.setPointerCapture(e.pointerId);
            pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
            lastDist = null;
        });
        canvas.addEventListener('pointermove', e => {
            if (!pointers[e.pointerId]) return;
            e.preventDefault();
            const ids = Object.keys(pointers);
            if (ids.length === 1) {
                x += e.clientX - pointers[e.pointerId].x;
                y += e.clientY - pointers[e.pointerId].y;
                pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
                clamp(); draw();
            } else if (ids.length >= 2) {
                pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
                const a = pointers[ids[0]], b = pointers[ids[1]];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                const rect = canvas.getBoundingClientRect();
                const k = viewW / rect.width;
                const cx = ((a.x + b.x) / 2 - rect.left) * k, cy = ((a.y + b.y) / 2 - rect.top) * k;
                if (lastDist) setScaleAround(scale * dist / lastDist, cx, cy);
                lastDist = dist;
            }
        });
        const up = e => { delete pointers[e.pointerId]; if (Object.keys(pointers).length < 2) lastDist = null; };
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', up);
        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect(); const k = viewW / rect.width;
            setScaleAround(scale * (e.deltaY > 0 ? 0.92 : 1.08), (e.clientX - rect.left) * k, (e.clientY - rect.top) * k);
        }, { passive: false });
    }

    function sliderToScale(v) { return minScale * Math.pow(4, v / 100); }           // 0→最小（填滿框）、100→4 倍
    function scaleToSlider(s) { return Math.max(0, Math.min(100, 100 * Math.log(s / minScale) / Math.log(4))); }
    function setScaleAround(ns, cx, cy) {
        ns = Math.max(minScale, Math.min(ns, minScale * 4));
        x = cx - (cx - x) * (ns / scale);
        y = cy - (cy - y) * (ns / scale);
        scale = ns;
        slider.value = scaleToSlider(scale);
        clamp(); draw();
    }
    function clamp() {   // 不讓框露出空白
        const w = img.width * scale, h = img.height * scale;
        x = Math.min(0, Math.max(viewW - w, x));
        y = Math.min(0, Math.max(viewH - h, y));
    }
    function draw() {
        ctx.clearRect(0, 0, viewW, viewH);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
    function exportCrop() {
        const outW = opt.outWidth, outH = Math.round(outW / opt.aspect);
        const c = document.createElement('canvas'); c.width = outW; c.height = outH;
        const k = outW / viewW;
        c.getContext('2d').drawImage(img, x * k, y * k, img.width * scale * k, img.height * scale * k);
        return c.toDataURL('image/jpeg', opt.quality);
    }
    function exportWhole() {
        const s = Math.min(1, opt.outWidth / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', opt.quality);
    }
    function finish(result) {
        el.style.display = 'none';
        Object.keys(pointers).forEach(k => delete pointers[k]);
        const r = resolveFn; resolveFn = null; img = null;
        if (r) r(result);
    }

    function toDataUrl(src) {
        if (typeof src === 'string') return Promise.resolve(src);
        return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(src); });
    }

    /**
     * @param {File|string} source
     * @param {{aspect?:number, outWidth?:number, title?:string, hint?:string, quality?:number}} options
     * @returns {Promise<string|null>}
     */
    function open(source, options) {
        ensure();
        opt = Object.assign({ aspect: 1, outWidth: 600, title: '✂️ 裁切照片', hint: '拖曳移動，滑桿或雙指縮放，把要的部分放進框裡', quality: 0.85 }, options || {});
        return toDataUrl(source).then(dataUrl => new Promise(resolve => {
            resolveFn = resolve;
            const im = new Image();
            im.onload = () => {
                img = im;
                viewW = 300; viewH = Math.round(300 / opt.aspect);
                canvas.width = viewW; canvas.height = viewH;
                canvas.style.width = Math.min(300, window.innerWidth - 80) + 'px';
                canvas.style.height = Math.round(Math.min(300, window.innerWidth - 80) / opt.aspect) + 'px';
                minScale = Math.max(viewW / im.width, viewH / im.height);
                scale = minScale;
                x = (viewW - im.width * scale) / 2; y = (viewH - im.height * scale) / 2;
                slider.value = 0;
                titleEl.textContent = opt.title; hintEl.textContent = opt.hint;
                el.style.display = 'flex';
                draw();
            };
            im.onerror = () => resolve(null);
            im.src = dataUrl;
        }));
    }

    global.PhotoCrop = { open: open };
})(typeof window !== 'undefined' ? window : globalThis);
