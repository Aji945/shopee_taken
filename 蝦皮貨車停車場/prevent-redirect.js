// 防止頁面跳轉腳本 - 在 document_start 時執行
(function() {
    console.log('🛡️ 防止跳轉腳本載入 (document_start)');
    
    // 立即注入防跳轉腳本到頁面上下文
    const script = document.createElement('script');
    script.textContent = `
        console.log('🔒 防跳轉腳本已注入到頁面');
        
        // 儲存原始方法
        const _open = window.open;
        const _assign = window.location.assign;
        const _replace = window.location.replace;
        const _href = Object.getOwnPropertyDescriptor(window.location, 'href');
        
        // 覆寫 window.open
        window.open = function(url, ...args) {
            console.log('🚫 [阻止] window.open:', url);
            if (!url || url === 'about:blank' || url === '') {
                console.log('🛡️ 已阻止開啟 about:blank');
                return window;
            }
            return _open.call(window, url, ...args);
        };
        
        // 覆寫 location.assign
        window.location.assign = function(url) {
            console.log('🚫 [阻止] location.assign:', url);
            if (!url || url === 'about:blank') {
                console.log('🛡️ 已阻止跳轉到 about:blank');
                return;
            }
            return _assign.call(window.location, url);
        };
        
        // 覆寫 location.replace
        window.location.replace = function(url) {
            console.log('🚫 [阻止] location.replace:', url);
            if (!url || url === 'about:blank') {
                console.log('🛡️ 已阻止跳轉到 about:blank');
                return;
            }
            return _replace.call(window.location, url);
        };
        
        // 覆寫 location.href
        Object.defineProperty(window.location, 'href', {
            get: _href.get,
            set: function(url) {
                console.log('🚫 [阻止] location.href 設定:', url);
                if (!url || url === 'about:blank') {
                    console.log('🛡️ 已阻止跳轉到 about:blank');
                    return;
                }
                return _href.set.call(this, url);
            },
            configurable: false
        });
        
        // 覆寫 document.write 和 document.writeln
        const _write = document.write;
        const _writeln = document.writeln;
        
        document.write = function(content) {
            console.log('🚫 [檢查] document.write');
            if (content && content.includes('about:blank')) {
                console.log('🛡️ 已阻止包含 about:blank 的內容');
                return;
            }
            return _write.call(document, content);
        };
        
        document.writeln = function(content) {
            console.log('🚫 [檢查] document.writeln');
            if (content && content.includes('about:blank')) {
                console.log('🛡️ 已阻止包含 about:blank 的內容');
                return;
            }
            return _writeln.call(document, content);
        };
        
        // 攔截所有 setTimeout 和 setInterval 中的跳轉
        const _setTimeout = window.setTimeout;
        const _setInterval = window.setInterval;
        
        window.setTimeout = function(func, delay, ...args) {
            if (typeof func === 'string' && func.includes('about:blank')) {
                console.log('🛡️ 已阻止 setTimeout 中的 about:blank 跳轉');
                return;
            }
            if (typeof func === 'function') {
                const funcStr = func.toString();
                if (funcStr.includes('about:blank')) {
                    console.log('🛡️ 已阻止 setTimeout 函數中的 about:blank 跳轉');
                    return;
                }
            }
            return _setTimeout.call(window, func, delay, ...args);
        };
        
        window.setInterval = function(func, delay, ...args) {
            if (typeof func === 'string' && func.includes('about:blank')) {
                console.log('🛡️ 已阻止 setInterval 中的 about:blank 跳轉');
                return;
            }
            if (typeof func === 'function') {
                const funcStr = func.toString();
                if (funcStr.includes('about:blank')) {
                    console.log('🛡️ 已阻止 setInterval 函數中的 about:blank 跳轉');
                    return;
                }
            }
            return _setInterval.call(window, func, delay, ...args);
        };
        
        // 阻止 eval 中的跳轉
        const _eval = window.eval;
        window.eval = function(code) {
            if (typeof code === 'string' && code.includes('about:blank')) {
                console.log('🛡️ 已阻止 eval 中的 about:blank');
                return;
            }
            return _eval.call(window, code);
        };
        
        // 阻止 Function 構造器中的跳轉
        const _Function = window.Function;
        window.Function = new Proxy(_Function, {
            construct: function(target, args) {
                const code = args.join('');
                if (code.includes('about:blank')) {
                    console.log('🛡️ 已阻止 Function 構造器中的 about:blank');
                    return function() {};
                }
                return new target(...args);
            }
        });
        
        console.log('✅ 所有防跳轉機制已啟用');
    `;
    
    // 確保腳本儘早執行
    if (document.documentElement) {
        document.documentElement.insertBefore(script, document.documentElement.firstChild);
    } else {
        // 如果 documentElement 還不存在，等待它
        const observer = new MutationObserver((mutations, obs) => {
            if (document.documentElement) {
                document.documentElement.insertBefore(script, document.documentElement.firstChild);
                obs.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
    
    // 額外的保護措施
    document.addEventListener('DOMContentLoaded', () => {
        // 移除任何 meta refresh 標籤
        const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
        if (metaRefresh) {
            console.log('🛡️ 移除 meta refresh 標籤');
            metaRefresh.remove();
        }
        
        // 阻止所有表單提交到 about:blank
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.action === 'about:blank' || !form.action) {
                console.log('🛡️ 阻止表單提交到 about:blank');
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
        
        // 阻止所有連結導向 about:blank
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && (link.href === 'about:blank' || link.target === '_blank')) {
                console.log('🛡️ 阻止連結導向 about:blank');
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
    });
})();