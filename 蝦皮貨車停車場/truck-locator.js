// 貨車位置查詢系統
class TruckLocator {
    constructor() {
        this.printPageUrl = '';
        this.sheetId = '';
        this.shopeeData = [];
        this.refreshTimer = null;
        this.isAnalyzing = false;
        
        // Google Apps Script Web App URL (使用現有的)
        this.GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwFSPXkgQRDm4nUk4ctqrzKBjqeasJ0uSRpBYDNoqX4OlI_PLtiznjomf6viXkrPF4w/exec';
    }

    // 顯示狀態訊息
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.classList.remove('hidden');
    }

    // 隱藏狀態訊息
    hideStatus() {
        const statusEl = document.getElementById('status');
        statusEl.classList.add('hidden');
    }

    // JSONP 請求函數
    async jsonpRequest(url, params = {}) {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const script = document.createElement('script');
            
            const timeout = setTimeout(() => {
                reject(new Error('JSONP request timeout'));
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                delete window[callbackName];
            }, 10000);
            
            window[callbackName] = function(data) {
                clearTimeout(timeout);
                resolve(data);
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                delete window[callbackName];
            };
            
            const urlParams = new URLSearchParams({
                ...params,
                callback: callbackName
            });
            
            script.src = `${url}?${urlParams.toString()}`;
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('JSONP request failed'));
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        });
    }

    // 獲取蝦皮資料表數據
    async loadShopeeData() {
        try {
            this.showStatus('正在載入蝦皮資料表...', 'loading');
            
            const result = await this.jsonpRequest(this.GAS_WEB_APP_URL, {
                action: 'read',
                sheetId: this.sheetId
            });
            
            if (result && result.success && result.data && result.data.length > 1) {
                this.shopeeData = result.data.slice(1); // 跳過標題行
                console.log('成功載入蝦皮資料:', this.shopeeData.length, '筆');
                return true;
            } else {
                throw new Error(result?.error || '無法取得蝦皮資料');
            }
        } catch (error) {
            console.error('載入蝦皮資料失敗:', error);
            this.showStatus(`載入蝦皮資料失敗: ${error.message}`, 'error');
            return false;
        }
    }

    // 解析打印頁面內容
    async fetchPrintPageData() {
        try {
            this.showStatus('正在獲取打印頁面內容...', 'loading');
            
            // 由於跨域限制，這裡需要使用代理或者用戶手動提供內容
            // 先嘗試直接獲取，如果失敗則提示用戶
            const response = await fetch(this.printPageUrl, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            return this.parsePrintPageHTML(html);
            
        } catch (error) {
            console.error('獲取打印頁面失敗:', error);
            
            // 由於 CORS 限制，提示用戶手動輸入
            this.showStatus('由於跨域限制，請手動複製貼上頁面內容', 'error');
            return this.promptForManualInput();
        }
    }

    // 提示用戶手動輸入頁面內容
    async promptForManualInput() {
        const userInput = prompt(`由於瀏覽器跨域限制，無法直接讀取 ${this.printPageUrl}。

請：
1. 打開該網址
2. 按 Ctrl+A 全選內容
3. 按 Ctrl+C 複製
4. 將內容貼到下面的輸入框中

請貼上頁面HTML內容:`);
        
        if (!userInput) {
            throw new Error('用戶取消輸入');
        }
        
        return this.parsePrintPageHTML(userInput);
    }

    // 解析打印頁面 HTML
    parsePrintPageHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const products = [];
        
        // 查找所有 .printpage 區塊
        const printPages = doc.querySelectorAll('.printpage');
        
        printPages.forEach(page => {
            // 在每個 printpage 中查找商品表格
            const tables = page.querySelectorAll('table');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                let isProductSection = false;
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    
                    // 檢查是否是商品標題行
                    if (cells.length >= 3) {
                        const firstCell = cells[0]?.textContent?.trim() || '';
                        const secondCell = cells[1]?.textContent?.trim() || '';
                        
                        if (firstCell.includes('商品名稱') || secondCell.includes('商品名稱')) {
                            isProductSection = true;
                            return;
                        }
                        
                        // 如果已經進入商品區域，解析商品資料
                        if (isProductSection && cells.length >= 5) {
                            let productName = '';
                            let optionName = '';
                            let quantity = '';
                            
                            // 根據表格結構提取資料
                            if (cells.length >= 5) {
                                // 商品名稱通常在前兩欄合併
                                productName = (cells[0]?.textContent?.trim() || '') + 
                                            (cells[1]?.textContent?.trim() || '');
                                
                                // 選項名稱在第3-4欄
                                optionName = (cells[2]?.textContent?.trim() || '') + 
                                           (cells[3]?.textContent?.trim() || '');
                                
                                // 數量在最後一欄
                                quantity = cells[cells.length - 1]?.textContent?.trim() || '';
                            }
                            
                            // 清理和驗證資料
                            productName = productName.replace(/\s+/g, ' ').trim();
                            optionName = optionName.replace(/\s+/g, ' ').trim();
                            
                            // 如果商品名稱不為空且不是標題行
                            if (productName && 
                                !productName.includes('商品名稱') && 
                                !productName.includes('選項名稱') &&
                                !productName.includes('數量') &&
                                productName.length > 5) { // 商品名稱應該有一定長度
                                
                                products.push({
                                    productName: productName,
                                    optionName: optionName || '', // 可能為空
                                    quantity: quantity,
                                    found: false,
                                    truckLocation: ''
                                });
                            }
                        }
                    }
                });
            });
        });
        
        console.log('解析到的商品:', products);
        return products;
    }

    // 比對商品與蝦皮資料
    matchProducts(products) {
        const results = products.map(product => {
            // 在蝦皮資料中尋找匹配項
            const match = this.shopeeData.find(row => {
                const shoppeeProductName = (row[1] || '').trim(); // B欄位
                const shoppeeOptionName = (row[3] || '').trim();   // D欄位
                
                // 商品名稱必須完全匹配
                const productMatch = shoppeeProductName === product.productName;
                
                // 選項名稱匹配邏輯
                let optionMatch = false;
                if (!product.optionName && !shoppeeOptionName) {
                    // 兩者都沒有選項名稱
                    optionMatch = true;
                } else if (product.optionName && shoppeeOptionName) {
                    // 兩者都有選項名稱，需要完全匹配
                    optionMatch = shoppeeOptionName === product.optionName;
                } else {
                    // 一個有選項名稱，一個沒有，不匹配
                    optionMatch = false;
                }
                
                return productMatch && optionMatch;
            });
            
            if (match) {
                return {
                    ...product,
                    found: true,
                    truckLocation: match[11] || '未設定', // L欄位
                    rowIndex: this.shopeeData.indexOf(match)
                };
            } else {
                return {
                    ...product,
                    found: false,
                    truckLocation: ''
                };
            }
        });
        
        return results;
    }

    // 顯示分析結果
    displayResults(results) {
        const statsEl = document.getElementById('stats');
        const resultsEl = document.getElementById('results');
        const resultListEl = document.getElementById('resultList');
        
        // 統計數據
        const total = results.length;
        const found = results.filter(r => r.found).length;
        const notFound = total - found;
        
        // 更新統計
        document.getElementById('totalCount').textContent = total;
        document.getElementById('foundCount').textContent = found;
        document.getElementById('notFoundCount').textContent = notFound;
        
        // 顯示統計區域
        statsEl.classList.remove('hidden');
        
        // 生成結果列表
        const resultHTML = results.map(result => {
            const itemClass = result.found ? 'found' : 'not-found';
            
            return `
                <div class="result-item ${itemClass}">
                    <div class="product-name">${result.productName}</div>
                    ${result.optionName ? `<div class="option-name">選項：${result.optionName}</div>` : ''}
                    <div>
                        ${result.found 
                            ? `<span class="truck-location">🚚 ${result.truckLocation}</span>`
                            : `<span class="not-found-text">❌ 未找到對應位置</span>`
                        }
                        <span style="margin-left: 10px; color: #666; font-size: 12px;">數量：${result.quantity}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        resultListEl.innerHTML = resultHTML;
        resultsEl.classList.remove('hidden');
        
        this.showStatus(`分析完成！找到 ${found}/${total} 個商品的位置`, 'success');
    }

    // 開始分析
    async analyze() {
        if (this.isAnalyzing) {
            console.log('正在分析中，跳過');
            return;
        }
        
        this.isAnalyzing = true;
        
        try {
            // 獲取輸入參數
            this.printPageUrl = document.getElementById('printPageUrl').value.trim();
            this.sheetId = document.getElementById('sheetId').value.trim();
            
            if (!this.printPageUrl || !this.sheetId) {
                throw new Error('請填入打印頁面網址和 Google Sheets ID');
            }
            
            // 載入蝦皮資料
            const dataLoaded = await this.loadShopeeData();
            if (!dataLoaded) {
                return;
            }
            
            // 獲取並解析打印頁面
            const products = await this.fetchPrintPageData();
            if (!products || products.length === 0) {
                throw new Error('沒有找到商品資料');
            }
            
            // 比對商品
            const results = this.matchProducts(products);
            
            // 顯示結果
            this.displayResults(results);
            
        } catch (error) {
            console.error('分析失敗:', error);
            this.showStatus(`分析失敗: ${error.message}`, 'error');
        } finally {
            this.isAnalyzing = false;
        }
    }

    // 設置自動刷新
    setupAutoRefresh() {
        const interval = parseInt(document.getElementById('refreshInterval').value);
        
        this.stopAutoRefresh(); // 先停止現有的定時器
        
        if (interval > 0) {
            console.log(`設置自動刷新，間隔 ${interval} 秒`);
            this.refreshTimer = setInterval(() => {
                console.log('自動刷新...');
                this.analyze();
            }, interval * 1000);
        }
    }

    // 停止自動刷新
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('已停止自動刷新');
        }
    }
}

// 全域實例
const truckLocator = new TruckLocator();

// 全域函數
function startAnalysis() {
    truckLocator.analyze();
    truckLocator.setupAutoRefresh();
}

function stopAutoRefresh() {
    truckLocator.stopAutoRefresh();
    truckLocator.showStatus('已停止自動刷新', 'info');
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('貨車位置查詢系統已載入');
    truckLocator.showStatus('系統已就緒，請點擊「開始分析」按鈕', 'info');
});

// 頁面關閉時清理定時器
window.addEventListener('beforeunload', function() {
    truckLocator.stopAutoRefresh();
});