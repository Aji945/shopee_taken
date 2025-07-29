// 內容腳本 - 在打印頁面上運行
class TruckLocationInjector {
    constructor() {
        this.shopeeData = [];
        this.isLoaded = false;
        this.GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwFSPXkgQRDm4nUk4ctqrzKBjqeasJ0uSRpBYDNoqX4OlI_PLtiznjomf6viXkrPF4w/exec';
        this.SHEET_ID = '1xja90NLxCTbQgxUSdx4nI0-BJXMLr0DHhu7Xln612vI';
        
        this.init();
    }

    async init() {
        console.log('🚚 蝦皮貨車位置查詢擴充套件已載入');
        console.log('🔍 當前URL:', window.location.href);
        
        // 檢查當前頁面狀態
        if (this.isBlankPage()) {
            console.log('⏳ 檢測到 about:blank，添加手動觸發按鈕...');
            this.addManualTriggerButton();
            this.waitForTargetPage();
            return;
        }
        
        if (!this.isTargetPage()) {
            console.log('❌ 非目標頁面，擴充套件待機中...');
            this.waitForTargetPage();
            return;
        }
        
        // 載入蝦皮資料
        await this.loadShopeeData();
        
        // 處理頁面商品
        this.processProductsOnPage();
        
        // 監控頁面變化
        this.observePageChanges();
        
        // 添加狀態指示器
        this.addStatusIndicator();
    }

    // 檢查是否為空白頁面
    isBlankPage() {
        const url = window.location.href;
        return url === 'about:blank' || url === '';
    }

    // 在空白頁面添加手動觸發按鈕
    addManualTriggerButton() {
        // 檢查是否已經添加過按鈕
        if (document.getElementById('truck-locator-manual-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'truck-locator-manual-btn';
        button.innerHTML = '🚚 啟動蝦皮貨車位置查詢';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
            transition: all 0.3s ease;
        `;

        // 添加懸停效果
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 16px rgba(72, 187, 120, 0.4)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 12px rgba(72, 187, 120, 0.3)';
        });

        // 點擊事件
        button.addEventListener('click', () => {
            console.log('🔘 手動觸發蝦皮貨車位置查詢');
            button.textContent = '⏳ 正在檢查頁面...';
            button.disabled = true;
            
            // 檢查當前頁面狀態
            this.manualCheck();
        });

        document.body.appendChild(button);
        console.log('✅ 已添加手動觸發按鈕');
    }

    // 手動檢查並嘗試初始化
    manualCheck() {
        const button = document.getElementById('truck-locator-manual-btn');
        
        if (this.isTargetPage()) {
            console.log('✅ 檢測到目標頁面，開始初始化...');
            button.textContent = '🚀 正在初始化...';
            
            setTimeout(() => {
                this.initTargetPage();
                button.textContent = '✅ 已啟動';
                button.style.background = 'linear-gradient(135deg, #38a169, #2f855a)';
                
                // 5秒後隱藏按鈕
                setTimeout(() => {
                    if (button.parentNode) {
                        button.parentNode.removeChild(button);
                    }
                }, 5000);
            }, 1000);
        } else {
            console.log('❌ 非目標頁面，繼續等待...');
            button.textContent = '❌ 非目標頁面';
            button.style.background = 'linear-gradient(135deg, #e53e3e, #c53030)';
            
            // 3秒後恢復按鈕
            setTimeout(() => {
                button.textContent = '🚚 啟動蝦皮貨車位置查詢';
                button.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
                button.disabled = false;
            }, 3000);
        }
    }

    // 檢查是否為目標頁面
    isTargetPage() {
        const url = window.location.href;
        return url.includes('pro.ajinerp.com/Common/PrintPage') || 
               url.includes('pro.ajinerp.com/Order/ShopeeDistribution');
    }

    // 等待頁面載入到目標URL
    waitForTargetPage() {
        let attempts = 0;
        const maxAttempts = 60; // 60秒
        
        const checkInterval = setInterval(() => {
            attempts++;
            const currentUrl = window.location.href;
            console.log(`🔍 檢查 ${attempts}/${maxAttempts}: ${currentUrl}`);
            
            if (this.isTargetPage()) {
                console.log('✅ 目標頁面已載入，開始初始化...');
                clearInterval(checkInterval);
                // 延遲一下確保頁面內容完全載入
                setTimeout(() => {
                    this.initTargetPage();
                }, 2000);
            } else if (attempts >= maxAttempts) {
                console.log('❌ 等待頁面載入超時');
                clearInterval(checkInterval);
            }
        }, 1000);
    }

    // 初始化目標頁面功能
    async initTargetPage() {
        console.log('🚀 開始初始化目標頁面功能...');
        
        // 載入蝦皮資料
        await this.loadShopeeData();
        
        // 處理頁面商品
        this.processProductsOnPage();
        
        // 監控頁面變化
        this.observePageChanges();
        
        // 添加狀態指示器
        this.addStatusIndicator();
    }

    // Fetch API 請求函數
    async fetchRequest(url, params = {}) {
        try {
            const urlParams = new URLSearchParams(params);
            const response = await fetch(`${url}?${urlParams.toString()}`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error(`網路請求失敗: ${error.message}`);
        }
    }

    // 載入蝦皮資料表數據
    async loadShopeeData() {
        try {
            console.log('🔄 載入蝦皮資料中...');
            
            const result = await this.fetchRequest(this.GAS_WEB_APP_URL, {
                action: 'read',
                sheetId: this.SHEET_ID
            });
            
            if (result && result.success && result.data && result.data.length > 1) {
                this.shopeeData = result.data.slice(1); // 跳過標題行
                this.isLoaded = true;
                console.log('✅ 成功載入蝦皮資料:', this.shopeeData.length, '筆');
                this.updateStatusIndicator('success', `已載入 ${this.shopeeData.length} 筆資料`);
                return true;
            } else {
                throw new Error(result?.error || '無法取得資料');
            }
        } catch (error) {
            console.error('❌ 載入蝦皮資料失敗:', error);
            this.updateStatusIndicator('error', `載入失敗: ${error.message}`);
            return false;
        }
    }

    // 處理頁面上的商品
    processProductsOnPage() {
        if (!this.isLoaded) {
            console.log('⏳ 資料尚未載入，稍後重試...');
            setTimeout(() => this.processProductsOnPage(), 2000);
            return;
        }

        console.log('🔍 開始處理頁面商品...');
        
        // 找到所有商品行
        const productRows = this.findProductRows();
        console.log('找到商品行數:', productRows.length);
        
        let processedCount = 0;
        let foundCount = 0;
        
        productRows.forEach(row => {
            const productInfo = this.extractProductInfo(row);
            if (productInfo) {
                processedCount++;
                const truckLocation = this.findTruckLocation(productInfo.productName, productInfo.optionName);
                
                if (truckLocation) {
                    foundCount++;
                    this.injectTruckLocation(row, truckLocation, productInfo.optionName);
                }
            }
        });
        
        console.log(`✅ 處理完成: ${processedCount} 個商品，找到 ${foundCount} 個位置`);
        this.updateStatusIndicator('info', `${foundCount}/${processedCount} 個商品已標記位置`);
        
        // 儲存掃描結果
        this.saveScanResults(processedCount, foundCount, productRows);
    }

    // 找到所有商品行
    findProductRows() {
        console.log('🔍 開始尋找商品行...');
        const rows = [];
        
        // 先嘗試各種可能的選擇器
        const possibleSelectors = [
            'tr.lh-2',           // 原來的選擇器
            'tr',                // 所有表格行
            'tbody tr',          // tbody內的行
            '.table tr',         // 表格類內的行
            '[class*="row"]',    // 包含row的class
            '[class*="item"]'    // 包含item的class
        ];
        
        let foundRows = [];
        for (const selector of possibleSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 選擇器 ${selector} 找到 ${elements.length} 個元素`);
            
            if (elements.length > 0) {
                foundRows = Array.from(elements);
                break;
            }
        }
        
        if (foundRows.length === 0) {
            console.log('❌ 未找到任何表格行，嘗試尋找其他結構...');
            // 如果沒有找到表格行，尋找其他可能的商品容器
            const containers = document.querySelectorAll('div, section, article');
            console.log('🔍 找到', containers.length, '個容器元素');
            return [];
        }
        
        foundRows.forEach((row, index) => {
            const cells = row.querySelectorAll('td, div, span');
            console.log(`🔍 第${index+1}行有 ${cells.length} 個子元素`);
            
            if (cells.length >= 3) { // 降低最低要求
                // 取得前幾個元素的文字內容
                const texts = Array.from(cells).slice(0, 5).map(cell => cell.textContent?.trim() || '');
                console.log(`🔍 第${index+1}行內容:`, texts);
                
                // 檢查是否是商品行（不是標題行）
                const firstCellText = texts[0];
                if (firstCellText && 
                    !firstCellText.includes('商品名稱') && 
                    !firstCellText.includes('選項名稱') &&
                    !firstCellText.includes('品名') &&
                    !firstCellText.includes('規格') &&
                    firstCellText.length > 3) {
                    rows.push(row);
                    console.log(`✅ 加入商品行: ${firstCellText.substring(0, 20)}...`);
                }
            }
        });
        
        console.log(`🔍 總共找到 ${rows.length} 個商品行`);
        return rows;
    }

    // 提取商品資訊
    extractProductInfo(row) {
        const cells = row.querySelectorAll('td, div, span');
        if (cells.length < 3) return null;
        
        // 商品名稱（第1個元素）
        let productName = cells[0]?.textContent?.trim() || '';
        
        // 選項名稱（第2個元素）
        let optionName = cells[1]?.textContent?.trim() || '';
        
        // 清理文字
        productName = productName.replace(/\s+/g, ' ').trim();
        optionName = optionName.replace(/\s+/g, ' ').trim();
        
        // 移除可能的屬性殘留和表情符號
        optionName = optionName.replace(/^'="|"$/g, '').trim();
        
        if (!productName || productName.length < 5) return null;
        
        console.log(`📝 提取商品資訊: 
商品名稱: "${productName}"
選項名稱: "${optionName}"`);
        
        return {
            productName: productName,
            optionName: optionName || '', // 可能為空
            row: row
        };
    }

    // 查找貨車位置
    findTruckLocation(productName, optionName) {
        const match = this.shopeeData.find(row => {
            const shoppeeProductName = (row[1] || '').trim(); // B欄位
            const shoppeeOptionName = (row[3] || '').trim();   // D欄位
            
            // 商品名稱必須完全匹配
            const productMatch = shoppeeProductName === productName;
            
            // 選項名稱匹配邏輯
            let optionMatch = false;
            if (!optionName && !shoppeeOptionName) {
                // 兩者都沒有選項名稱
                optionMatch = true;
            } else if (optionName && shoppeeOptionName) {
                // 兩者都有選項名稱，需要完全匹配
                optionMatch = shoppeeOptionName === optionName;
            }
            
            return productMatch && optionMatch;
        });
        
        if (match) {
            const truckLocation = match[11] || ''; // L欄位
            return truckLocation;
        }
        
        return null;
    }

    // 注入貨車位置資訊
    injectTruckLocation(row, truckLocation, optionName) {
        const cells = row.querySelectorAll('td, div, span');
        if (cells.length < 2) return;
        
        // 找到選項名稱的欄位（第2個元素）
        const optionCell = cells[1];
        
        if (!optionCell) return;
        
        // 檢查是否已經注入過
        if (optionCell.querySelector('.truck-location-badge')) {
            return;
        }
        
        // 創建貨車位置標籤
        const truckBadge = document.createElement('div');
        truckBadge.className = 'truck-location-badge';
        truckBadge.innerHTML = `<span class="truck-icon">🚚</span> ${truckLocation}`;
        truckBadge.style.cssText = `
            display: inline-block;
            background: #48bb78;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 8px;
            font-weight: bold;
        `;
        
        // 添加到選項欄位中
        optionCell.appendChild(truckBadge);
        
        // 為整行添加已找到的樣式
        row.style.backgroundColor = '#e8f5e9';
        row.classList.add('truck-location-found');
        
        console.log(`✅ 已標記: ${truckLocation} (${optionName})`);
    }

    // 監控頁面變化
    observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldReprocess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 檢查是否有新的商品行
                            if (node.matches && node.matches('tr.lh-2')) {
                                shouldReprocess = true;
                            } else if (node.querySelectorAll && node.querySelectorAll('tr.lh-2').length > 0) {
                                shouldReprocess = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReprocess) {
                console.log('🔄 檢測到頁面變化，重新處理商品...');
                setTimeout(() => this.processProductsOnPage(), 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 添加狀態指示器
    addStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'truck-locator-status';
        indicator.className = 'truck-status-indicator';
        indicator.innerHTML = `
            <div class="status-content">
                <span class="status-icon">🚚</span>
                <span class="status-text">初始化中...</span>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // 點擊可重新載入
        indicator.addEventListener('click', () => {
            this.updateStatusIndicator('loading', '重新載入中...');
            this.loadShopeeData().then(() => {
                this.processProductsOnPage();
            });
        });
    }

    // 更新狀態指示器
    updateStatusIndicator(type, message) {
        const indicator = document.getElementById('truck-locator-status');
        if (!indicator) return;
        
        const statusText = indicator.querySelector('.status-text');
        const statusIcon = indicator.querySelector('.status-icon');
        
        if (statusText) statusText.textContent = message;
        
        // 更新圖示和樣式
        indicator.className = `truck-status-indicator status-${type}`;
        
        switch (type) {
            case 'loading':
                statusIcon.textContent = '⏳';
                break;
            case 'success':
                statusIcon.textContent = '✅';
                break;
            case 'error':
                statusIcon.textContent = '❌';
                break;
            case 'info':
                statusIcon.textContent = '🚚';
                break;
        }
        
        // 成功或資訊狀態 3 秒後自動淡出
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                indicator.style.opacity = '0.7';
            }, 3000);
        } else {
            indicator.style.opacity = '1';
        }
    }

    // 儲存掃描結果
    async saveScanResults(total, found, productRows) {
        try {
            // 收集找到的商品和位置
            const items = [];
            productRows.forEach(row => {
                const badge = row.querySelector('.truck-location-badge');
                if (badge) {
                    const productInfo = this.extractProductInfo(row);
                    if (productInfo) {
                        const location = badge.textContent.replace('🚚', '').trim();
                        items.push({
                            product: productInfo.productName,
                            option: productInfo.optionName,
                            location: location
                        });
                    }
                }
            });

            // 建立掃描記錄
            const scanResult = {
                timestamp: Date.now(),
                url: window.location.href,
                total: total,
                found: found,
                missing: total - found,
                items: items
            };

            // 讀取現有記錄
            const data = await chrome.storage.local.get('recentScans');
            let recentScans = data.recentScans || [];
            
            // 添加新記錄（最多保留10筆）
            recentScans.push(scanResult);
            if (recentScans.length > 10) {
                recentScans = recentScans.slice(-10);
            }

            // 儲存更新的記錄
            await chrome.storage.local.set({ recentScans: recentScans });
            console.log('✅ 掃描結果已儲存');

        } catch (error) {
            console.error('❌ 儲存掃描結果失敗:', error);
        }
    }
}

// 當頁面載入完成時啟動
let truckInjector = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        truckInjector = new TruckLocationInjector();
    });
} else {
    truckInjector = new TruckLocationInjector();
}

// 監聽來自重建頁面的掃描事件
document.addEventListener('scanTruckLocations', (event) => {
    console.log('🔔 收到重建頁面的掃描請求:', event.detail);
    
    if (event.detail.action === 'scan' && event.detail.source === 'recreate-page') {
        if (!truckInjector) {
            truckInjector = new TruckLocationInjector();
        }
        
        // 強制重新掃描
        setTimeout(() => {
            truckInjector.loadShopeeData().then(() => {
                truckInjector.processProductsOnPage();
            });
        }, 500);
    }
});

// 監聽來自彈出視窗的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔔 收到訊息:', request);
    
    switch (request.action) {
        case 'refresh':
            if (truckInjector) {
                truckInjector.updateStatusIndicator('loading', '重新載入中...');
                truckInjector.loadShopeeData().then(() => {
                    truckInjector.processProductsOnPage();
                });
            }
            sendResponse({ success: true });
            break;
            
        case 'forceScan':
            console.log('🚀 強制掃描當前頁面');
            // 創建新的實例或重新初始化
            if (!truckInjector) {
                truckInjector = new TruckLocationInjector();
            }
            
            // 強制初始化目標頁面功能
            truckInjector.initTargetPage().then(() => {
                sendResponse({ success: true, message: '強制掃描已啟動' });
            }).catch(error => {
                console.error('強制掃描失敗:', error);
                sendResponse({ success: false, error: error.message });
            });
            
            return true; // 異步回應
            
        case 'getStats':
            if (truckInjector) {
                const productRows = truckInjector.findProductRows();
                let foundCount = 0;
                
                productRows.forEach(row => {
                    if (row.querySelector('.truck-location-badge')) {
                        foundCount++;
                    }
                });
                
                sendResponse({
                    success: true,
                    stats: {
                        total: productRows.length,
                        found: foundCount,
                        missing: productRows.length - foundCount
                    }
                });
            } else {
                sendResponse({ success: false, error: '擴充套件尚未初始化' });
            }
            break;
            
        default:
            sendResponse({ success: false, error: '未知的動作' });
    }
    
    return true; // 保持訊息通道開放以進行異步回應
});