// 列印頁面檢測器 - 專門處理 about:blank 的列印頁面
class PrintPageDetector {
    constructor() {
        this.checkInterval = null;
        this.init();
    }

    init() {
        // 只在 about:blank 頁面運行
        if (window.location.href !== 'about:blank') {
            return;
        }

        console.log('🔍 列印頁面檢測器已載入 (about:blank)');
        
        // 等待頁面內容載入
        this.waitForPrintContent();
    }

    // 等待列印內容載入
    waitForPrintContent() {
        let attempts = 0;
        const maxAttempts = 30; // 30秒

        this.checkInterval = setInterval(() => {
            attempts++;
            
            // 檢查是否有列印內容的特徵
            if (this.isPrintPageContent()) {
                console.log('✅ 檢測到列印頁面內容');
                clearInterval(this.checkInterval);
                
                // 添加浮動控制面板
                this.addFloatingControl();
                
                // 自動嘗試載入
                setTimeout(() => {
                    console.log('🚀 自動啟動貨車位置查詢');
                    this.loadTruckLocator();
                }, 2000);
            } else if (attempts >= maxAttempts) {
                console.log('❌ 列印頁面檢測超時');
                clearInterval(this.checkInterval);
                
                // 即使超時也添加控制面板，讓用戶可以手動觸發
                this.addFloatingControl();
            }
        }, 1000);
    }

    // 檢查是否為列印頁面內容
    isPrintPageContent() {
        // 檢查頁面是否包含表格或商品相關內容
        const indicators = [
            'table',
            'tr',
            '.lh-2',
            '[class*="product"]',
            '[class*="item"]',
            'img[src*="barcode"]',  // 條碼圖片
            'img[src*="qrcode"]',    // QR碼圖片
            'canvas'                 // Canvas元素（可能用於條碼）
        ];

        for (const selector of indicators) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // 進一步檢查內容
                for (const element of elements) {
                    const text = element.textContent || '';
                    if (text.length > 10) { // 有實際內容
                        console.log('🔍 找到列印內容指標:', selector, text.substring(0, 50));
                        return true;
                    }
                }
            }
        }

        // 檢查是否有物流標籤相關內容
        const bodyText = document.body?.textContent || '';
        const logisticsKeywords = ['物流', '訂單編號', '收件編號', '建良', '三民', 'B2C', 'Y05'];
        
        for (const keyword of logisticsKeywords) {
            if (bodyText.includes(keyword)) {
                console.log('🔍 檢測到物流標籤關鍵字:', keyword);
                return true;
            }
        }

        // 檢查是否有足夠的文字內容
        if (bodyText.length > 50) {
            console.log('🔍 檢測到足夠的頁面內容');
            return true;
        }

        return false;
    }

    // 添加浮動控制面板
    addFloatingControl() {
        // 檢查是否已經添加過
        if (document.getElementById('truck-floating-control')) {
            return;
        }

        const controlPanel = document.createElement('div');
        controlPanel.id = 'truck-floating-control';
        controlPanel.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 12px;
                padding: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                cursor: move;
                user-select: none;
                min-width: 200px;
                animation: slideIn 0.5s ease-out;
            " id="control-content">
                <style>
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    #scan-print-btn:hover {
                        transform: scale(1.05);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }
                    #scan-print-btn:active {
                        transform: scale(0.98);
                    }
                </style>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 20px;">🚚</span>
                    <span style="font-weight: bold;">貨車位置查詢</span>
                </div>
                <div style="font-size: 11px; opacity: 0.8; margin-bottom: 10px;">
                    ⚡ 列印頁面專用控制
                </div>
                <button id="scan-print-btn" style="
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.3s;
                    font-size: 14px;
                ">🔍 掃描此頁面</button>
                <div id="scan-status" style="
                    margin-top: 10px;
                    font-size: 12px;
                    text-align: center;
                    display: none;
                "></div>
                <div style="
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255,255,255,0.3);
                    font-size: 10px;
                    opacity: 0.7;
                    text-align: center;
                ">可拖動此面板</div>
            </div>
        `;

        document.body.appendChild(controlPanel);

        // 添加拖拽功能
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (e.target.id === 'scan-print-btn') return;
            
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === controlPanel || e.target.parentNode === controlPanel) {
                isDragging = true;
            }
        };

        const dragEnd = (e) => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                controlPanel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };

        controlPanel.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // 掃描按鈕點擊事件
        document.getElementById('scan-print-btn').addEventListener('click', () => {
            const btn = document.getElementById('scan-print-btn');
            const status = document.getElementById('scan-status');
            
            btn.textContent = '⏳ 掃描中...';
            btn.disabled = true;
            status.style.display = 'block';
            status.textContent = '正在載入貨車位置資料...';

            // 延遲執行載入，確保 UI 更新
            setTimeout(() => {
                this.loadTruckLocator();
                
                setTimeout(() => {
                    btn.textContent = '✅ 已完成';
                    status.textContent = '貨車位置已標記';
                    
                    // 5秒後恢復按鈕
                    setTimeout(() => {
                        btn.textContent = '🔍 重新掃描';
                        btn.disabled = false;
                        status.style.display = 'none';
                    }, 5000);
                }, 2000);
            }, 100);
        });

        console.log('✅ 已添加浮動控制面板');
    }

    // 載入貨車位置查詢功能
    async loadTruckLocator() {
        try {
            // 動態載入主要的內容腳本邏輯
            const script = document.createElement('script');
            script.textContent = await this.getTruckLocatorCode();
            document.head.appendChild(script);
            
            console.log('✅ 貨車位置查詢功能已載入到列印頁面');
            
        } catch (error) {
            console.error('❌ 載入貨車位置查詢功能失敗:', error);
        }
    }

    // 獲取貨車位置查詢的核心代碼
    async getTruckLocatorCode() {
        return `
        // 列印頁面專用的貨車位置查詢
        class PrintPageTruckLocator {
            constructor() {
                this.shopeeData = [];
                this.isLoaded = false;
                this.GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwFSPXkgQRDm4nUk4ctqrzKBjqeasJ0uSRpBYDNoqX4OlI_PLtiznjomf6viXkrPF4w/exec';
                this.SHEET_ID = '1xja90NLxCTbQgxUSdx4nI0-BJXMLr0DHhu7Xln612vI';
                
                this.init();
            }

            async init() {
                console.log('🚚 列印頁面貨車位置查詢已啟動');
                
                // 載入蝦皮資料
                await this.loadShopeeData();
                
                // 處理頁面商品
                this.processProductsOnPage();
                
                // 添加狀態指示器
                this.addStatusIndicator();
            }

            // Fetch API 請求函數
            async fetchRequest(url, params = {}) {
                try {
                    const urlParams = new URLSearchParams(params);
                    const response = await fetch(url + '?' + urlParams.toString(), {
                        method: 'GET',
                        mode: 'cors'
                    });
                    
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }
                    
                    const data = await response.json();
                    return data;
                } catch (error) {
                    throw new Error('網路請求失敗: ' + error.message);
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
                        this.updateStatusIndicator('success', '已載入 ' + this.shopeeData.length + ' 筆資料');
                        return true;
                    } else {
                        throw new Error(result?.error || '無法取得資料');
                    }
                } catch (error) {
                    console.error('❌ 載入蝦皮資料失敗:', error);
                    this.updateStatusIndicator('error', '載入失敗: ' + error.message);
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

                console.log('🔍 開始處理列印頁面商品...');
                
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
                
                console.log('✅ 處理完成: ' + processedCount + ' 個商品，找到 ' + foundCount + ' 個位置');
                this.updateStatusIndicator('info', foundCount + '/' + processedCount + ' 個商品已標記位置');
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
                    console.log('🔍 選擇器 ' + selector + ' 找到 ' + elements.length + ' 個元素');
                    
                    if (elements.length > 0) {
                        foundRows = Array.from(elements);
                        break;
                    }
                }
                
                if (foundRows.length === 0) {
                    console.log('❌ 未找到任何表格行');
                    return [];
                }
                
                foundRows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td, div, span');
                    
                    if (cells.length >= 3) {
                        // 取得前幾個元素的文字內容
                        const texts = Array.from(cells).slice(0, 5).map(cell => cell.textContent?.trim() || '');
                        
                        // 檢查是否是商品行（不是標題行）
                        const firstCellText = texts[0];
                        if (firstCellText && 
                            !firstCellText.includes('商品名稱') && 
                            !firstCellText.includes('選項名稱') &&
                            !firstCellText.includes('品名') &&
                            !firstCellText.includes('規格') &&
                            firstCellText.length > 3) {
                            rows.push(row);
                        }
                    }
                });
                
                console.log('🔍 總共找到 ' + rows.length + ' 個商品行');
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
                productName = productName.replace(/\\s+/g, ' ').trim();
                optionName = optionName.replace(/\\s+/g, ' ').trim();
                
                // 移除可能的屬性殘留和表情符號
                optionName = optionName.replace(/^'="|"$/g, '').trim();
                
                if (!productName || productName.length < 5) return null;
                
                return {
                    productName: productName,
                    optionName: optionName || '',
                    row: row
                };
            }

            // 查找貨車位置
            findTruckLocation(productName, optionName) {
                const match = this.shopeeData.find(row => {
                    const shoppeeProductName = (row[1] || '').trim();
                    const shoppeeOptionName = (row[3] || '').trim();
                    
                    // 商品名稱必須完全匹配
                    const productMatch = shoppeeProductName === productName;
                    
                    // 選項名稱匹配邏輯
                    let optionMatch = false;
                    if (!optionName && !shoppeeOptionName) {
                        optionMatch = true;
                    } else if (optionName && shoppeeOptionName) {
                        optionMatch = shoppeeOptionName === optionName;
                    }
                    
                    return productMatch && optionMatch;
                });
                
                if (match) {
                    const truckLocation = match[11] || '';
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
                truckBadge.innerHTML = '<span class="truck-icon">🚚</span> ' + truckLocation;
                truckBadge.style.cssText = 
                    'display: inline-block;' +
                    'background: #48bb78;' +
                    'color: white;' +
                    'padding: 2px 6px;' +
                    'border-radius: 4px;' +
                    'font-size: 12px;' +
                    'margin-left: 8px;' +
                    'font-weight: bold;';
                
                // 添加到選項欄位中
                optionCell.appendChild(truckBadge);
                
                // 為整行添加已找到的樣式
                row.style.backgroundColor = '#e8f5e9';
                row.classList.add('truck-location-found');
                
                console.log('✅ 已標記: ' + truckLocation + ' (' + optionName + ')');
            }

            // 添加狀態指示器
            addStatusIndicator() {
                const indicator = document.createElement('div');
                indicator.id = 'truck-locator-status';
                indicator.className = 'truck-status-indicator';
                indicator.innerHTML = 
                    '<div class="status-content">' +
                        '<span class="status-icon">🚚</span>' +
                        '<span class="status-text">初始化中...</span>' +
                    '</div>';
                
                indicator.style.cssText = 
                    'position: fixed;' +
                    'top: 10px;' +
                    'right: 10px;' +
                    'z-index: 10000;' +
                    'background: rgba(255, 255, 255, 0.95);' +
                    'border: 1px solid #ddd;' +
                    'border-radius: 8px;' +
                    'padding: 8px 12px;' +
                    'font-size: 12px;' +
                    'box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                
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
        }

        // 啟動列印頁面貨車位置查詢
        new PrintPageTruckLocator();
        `;
    }
}

// 啟動列印頁面檢測器
new PrintPageDetector();