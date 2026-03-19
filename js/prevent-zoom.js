/**
 * 防止頁面縮放、捲動和選取（適合兒童與失語症患者操作）
 * v4.0.1 - 強化 iPad 保護
 *
 * 核心原則：
 * 1. 頁面永遠固定在一屏內，不允許任何捲動
 * 2. 完全禁止所有縮放行為（雙指、雙擊、鍵盤）
 * 3. 只有明確標示 data-scrollable 的容器內才允許捲動
 */

(function() {
    'use strict';

    // ========================================
    // 1. 設定 viewport meta（強制覆蓋）
    // ========================================
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // ========================================
    // 2. 防止所有縮放手勢（iOS Safari）
    // ========================================
    document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });

    // ========================================
    // 3. 防止雙擊縮放
    // ========================================
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 350) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // ========================================
    // 4. 防止觸控移動時縮放或捲動
    // ========================================
    function isInScrollableContainer(target) {
        while (target && target !== document.body && target !== document.documentElement) {
            // 明確標記允許捲動的容器
            if (target.hasAttribute('data-scrollable')) return true;
            if (target.classList && target.classList.contains('scrollable')) return true;

            const style = window.getComputedStyle(target);
            const overflowY = style.getPropertyValue('overflow-y');
            const overflowX = style.getPropertyValue('overflow-x');

            if ((overflowY === 'auto' || overflowY === 'scroll') &&
                target.scrollHeight > target.clientHeight + 2) {
                return true;
            }
            if ((overflowX === 'auto' || overflowX === 'scroll') &&
                target.scrollWidth > target.clientWidth + 2) {
                return true;
            }
            target = target.parentElement;
        }
        return false;
    }

    document.addEventListener('touchmove', function(e) {
        // 多指觸控：一律禁止（防縮放）
        if (e.touches.length > 1) {
            e.preventDefault();
            return;
        }

        // 單指觸控：只在可捲動容器內允許
        if (!isInScrollableContainer(e.target)) {
            e.preventDefault();
        }
    }, { passive: false });

    // ========================================
    // 5. 防止滑鼠滾輪縮放（Ctrl+滾輪）
    // ========================================
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // ========================================
    // 6. 防止鍵盤縮放（Ctrl/Cmd + +/-/0）
    // ========================================
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
            e.preventDefault();
        }
    });

    // ========================================
    // 7. 防止文字選取（避免兒童誤觸選取模式）
    // ========================================
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // ========================================
    // 8. 防止長按彈出選單
    // ========================================
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // ========================================
    // 9. 強制 body 樣式（防止意外捲動）
    // ========================================
    const forceStyle = document.createElement('style');
    forceStyle.textContent = `
        html, body {
            overflow: hidden !important;
            overscroll-behavior: none !important;
            touch-action: manipulation !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
            height: 100dvh !important;
        }
        /* 確保遊戲區域不會溢出 */
        .game-area {
            overflow: hidden !important;
            max-height: calc(100dvh - 60px) !important;
        }
        /* 允許特定容器捲動 */
        [data-scrollable], .scrollable {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
        }
    `;
    document.head.appendChild(forceStyle);

    // ========================================
    // 10. 偵測並修正意外的頁面偏移
    // ========================================
    let resetScrollTimer = null;
    window.addEventListener('scroll', function() {
        if (resetScrollTimer) clearTimeout(resetScrollTimer);
        resetScrollTimer = setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 50);
    }, { passive: true });

    // 定期確認頁面沒有偏移（每 2 秒）
    setInterval(() => {
        if (window.scrollX !== 0 || window.scrollY !== 0) {
            window.scrollTo(0, 0);
        }
    }, 2000);

    console.log('✅ 防縮放/防捲動保護已啟用 v4.0.1');
})();
