/**
 * 防止頁面縮放和選取（適合兒童操作）
 * 在所有頁面引入此檔案即可
 */

(function() {
    'use strict';

    // 防止雙指縮放（iOS Safari）
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
    }, { passive: false });

    // 防止雙擊縮放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // 防止觸控移動時縮放（多指觸控）
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // 防止滑鼠滾輪縮放（Ctrl+滾輪）
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // 防止鍵盤縮放（Ctrl/Cmd + +/-/0）
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
            e.preventDefault();
        }
    });

    // 防止文字選取（避免兒童誤觸進入選取模式）
    document.addEventListener('selectstart', function(e) {
        // 只在非輸入元素上防止選取
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // 防止長按彈出選單
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // 防止 iOS Safari 的橡皮筋效果（過度滾動）
    document.body.addEventListener('touchmove', function(e) {
        // 檢查是否在可滾動容器內
        let target = e.target;
        let isScrollable = false;

        while (target && target !== document.body) {
            const style = window.getComputedStyle(target);
            const overflowY = style.getPropertyValue('overflow-y');
            const overflowX = style.getPropertyValue('overflow-x');

            if (overflowY === 'auto' || overflowY === 'scroll' ||
                overflowX === 'auto' || overflowX === 'scroll') {
                if (target.scrollHeight > target.clientHeight ||
                    target.scrollWidth > target.clientWidth) {
                    isScrollable = true;
                    break;
                }
            }
            target = target.parentElement;
        }

        // 如果不在可滾動容器內，且是多指觸控，則阻止預設行為
        if (!isScrollable && e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    console.log('✅ 防縮放保護已啟用');
})();
