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

    // 延遲綁定 touchmove，等 DOM 載入後判斷頁面類型
    function setupTouchMoveHandler() {
        const isGamePage = !!document.querySelector('.game-area');

        document.addEventListener('touchmove', function(e) {
            // 多指觸控：一律禁止（防縮放）
            if (e.touches.length > 1) {
                e.preventDefault();
                return;
            }

            // 遊戲頁面：單指觸控只在可捲動容器內允許
            if (isGamePage && !isInScrollableContainer(e.target)) {
                e.preventDefault();
            }
            // 非遊戲頁面：單指觸控允許正常捲動（只擋縮放）
        }, { passive: false });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupTouchMoveHandler);
    } else {
        setupTouchMoveHandler();
    }

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
    // 9. 頁面樣式（遊戲頁鎖定 vs. 設定頁允許捲動）
    // ========================================
    const forceStyle = document.createElement('style');

    // 判斷是否為遊戲頁面（有 .game-area 元素）
    // DOMContentLoaded 後再判斷，確保 DOM 已載入
    function applyPageLockStyle() {
        const isGamePage = !!document.querySelector('.game-area');

        if (isGamePage) {
            // 遊戲頁面：完全鎖定，不允許任何捲動
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
                .game-area {
                    overflow: hidden !important;
                    max-height: calc(100dvh - 60px) !important;
                }
            `;
        } else {
            // 非遊戲頁面（設定頁、選單頁等）：允許正常捲動，只防縮放
            forceStyle.textContent = `
                html, body {
                    overscroll-behavior: none !important;
                    touch-action: manipulation !important;
                }
                [data-scrollable], .scrollable {
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
            `;
        }
    }

    document.head.appendChild(forceStyle);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPageLockStyle);
    } else {
        applyPageLockStyle();
    }

    // ========================================
    // 10. 遊戲頁面：偵測並修正意外的頁面偏移
    // ========================================
    function setupScrollReset() {
        const isGamePage = !!document.querySelector('.game-area');
        if (!isGamePage) return; // 非遊戲頁面不需要強制重置捲動

        let resetScrollTimer = null;
        window.addEventListener('scroll', function() {
            if (resetScrollTimer) clearTimeout(resetScrollTimer);
            resetScrollTimer = setTimeout(() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }, 50);
        }, { passive: true });

        setInterval(() => {
            if (window.scrollX !== 0 || window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupScrollReset);
    } else {
        setupScrollReset();
    }

    console.log('✅ 防縮放保護已啟用 v4.0.2');
})();
