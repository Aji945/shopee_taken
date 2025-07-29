// about:blank 頁面處理器
class AboutBlankHandler {
    constructor() {
        this.shopeeData = [];
        this.isLoaded = false;
        this.GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwFSPXkgQRDm4nUk4ctqrzKBjqeasJ0uSRpBYDNoqX4OlI_PLtiznjomf6viXkrPF4w/exec';
        this.SHEET_ID = '1xja90NLxCTbQgxUSdx4nI0-BJXMLr0DHhu7Xln612vI';
        
        this.init();
    }
    
    async init() {
        console.log('🚚 About:blank 處理器已載入');
        console.log('🔍 當前URL:', window.location.href);
        
        if (this.isAboutBlankPage()) {
            console.log('✅ 偵測到 about:blank 頁面');
            await this.handleAboutBlankPage();
        }
    }
    
    // 檢查是否為 about:blank 頁面
    isAboutBlankPage() {
        const url = window.location.href;
        return url === 'about:blank' || url === '';
    }
    
    // 處理 about:blank 頁面
    async handleAboutBlankPage() {
        // 等待頁面內容載入
        await this.waitForContent();
        
        // 創建控制面板
        this.createControlPanel();
        
        // 載入蝦皮資料
        await this.loadShopeeData();
        
        // 自動開始處理
        setTimeout(() => {
            this.processCurrentPage();
        }, 2000);
    }
    
    // 等待頁面內容載入
    async waitForContent() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒
            
            const checkContent = () => {
                attempts++;
                const hasContent = document.body && document.body.children.length > 0;
                const hasText = document.body && document.body.textContent.trim().length > 0;
                
                console.log(`🔍 檢查內容 ${attempts}/${maxAttempts}: 有元素=${hasContent}, 有文字=${hasText}`);
                
                if (hasContent || hasText || attempts >= maxAttempts) {
                    resolve();
                } else {
                    setTimeout(checkContent, 100);
                }
            };
            
            checkContent();
        });
    }
    
    // 創建控制面板
    createControlPanel() {
        // 檢查是否已經存在
        if (document.getElementById('about-blank-control-panel')) {
            return;
        }
        
        const panel = document.createElement('div');
        panel.id = 'about-blank-control-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                min-width: 250px;
            ">
                <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">
                    🚚 蝦皮貨車位置查詢
                </div>
                <div id="panel-status" style="margin-bottom: 10px; font-size: 12px;">
                    正在初始化...
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button id="btn-process" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">🔄 處理頁面</button>
                    <button id="btn-export" style="
                        background: #17a2b8;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">📤 匯出HTML</button>
                    <button id="btn-minimize" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">➖ 最小化</button>
                </div>
                <div id="panel-stats" style="margin-top: 10px; font-size: 11px; opacity: 0.9; display: none;">
                    總商品: <span id="total-count">0</span> | 
                    已標記: <span id="found-count">0</span> | 
                    未找到: <span id="missing-count">0</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 綁定事件
        document.getElementById('btn-process').addEventListener('click', () => {
            this.processCurrentPage();
        });
        
        document.getElementById('btn-export').addEventListener('click', () => {
            this.exportCurrentPage();
        });
        
        document.getElementById('btn-minimize').addEventListener('click', () => {
            this.togglePanelSize();
        });
        
        console.log('✅ 控制面板已創建');
    }
    
    // 更新面板狀態
    updatePanelStatus(message, type = 'info') {
        const statusEl = document.getElementById('panel-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#ffffff';
        }
    }
    
    // 切換面板大小
    togglePanelSize() {
        const panel = document.getElementById('about-blank-control-panel');
        const isMinimized = panel.dataset.minimized === 'true';
        
        if (isMinimized) {
            panel.style.height = 'auto';
            panel.style.overflow = 'visible';
            panel.dataset.minimized = 'false';
            document.getElementById('btn-minimize').textContent = '➖ 最小化';
        } else {
            panel.style.height = '40px';
            panel.style.overflow = 'hidden';
            panel.dataset.minimized = 'true';
            document.getElementById('btn-minimize').textContent = '➕ 展開';
        }
    }
    
    // 載入蝦皮資料
    async loadShopeeData() {
        try {
            this.updatePanelStatus('正在載入蝦皮資料...', 'info');
            
            const response = await fetch(`${this.GAS_WEB_APP_URL}?action=read&sheetId=${this.SHEET_ID}`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result && result.success && result.data && result.data.length > 1) {
                this.shopeeData = result.data.slice(1); // 跳過標題行
                this.isLoaded = true;
                this.updatePanelStatus(`已載入 ${this.shopeeData.length} 筆資料`, 'success');
                console.log('✅ 成功載入蝦皮資料:', this.shopeeData.length, '筆');
                return true;
            } else {
                throw new Error(result?.error || '無法取得資料');
            }
        } catch (error) {
            console.error('❌ 載入蝦皮資料失敗:', error);
            this.updatePanelStatus(`載入失敗: ${error.message}`, 'error');
            return false;
        }
    }
    
    // 處理當前頁面
    processCurrentPage() {
        if (!this.isLoaded) {
            this.updatePanelStatus('資料尚未載入，請稍候...', 'error');
            return;
        }
        
        this.updatePanelStatus('正在處理頁面...', 'info');
        
        // 尋找商品行
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
        
        // 更新統計
        this.updateStats(processedCount, foundCount);
        
        if (foundCount > 0) {
            this.updatePanelStatus(`處理完成！標記了 ${foundCount}/${processedCount} 個商品`, 'success');
        } else {
            this.updatePanelStatus(`處理完成，但未找到匹配的貨車位置`, 'info');
        }
        
        console.log(`✅ 處理完成: ${processedCount} 個商品，找到 ${foundCount} 個位置`);
    }
    
    // 尋找商品行
    findProductRows() {
        const rows = [];
        
        // 嘗試多種選擇器
        const selectors = ['tr', 'tbody tr', '.table tr', '[class*="row"]', 'div[style*="display"]'];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    // 檢查是否包含商品相關文字且長度合理
                    if (text && text.length > 10 && text.length < 500) {
                        const cells = el.querySelectorAll('td, div, span');
                        if (cells.length >= 2) {
                            rows.push(el);
                        }
                    }
                });
                
                if (rows.length > 0) break;
            }
        }
        
        // 如果還是找不到，嘗試直接在文字中尋找
        if (rows.length === 0) {
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent?.trim();
                if (text && text.includes('【') && text.includes('】') && el.children.length <= 5) {
                    rows.push(el);
                }
            });
        }
        
        return rows;
    }
    
    // 提取商品資訊
    extractProductInfo(element) {
        let productName = '';
        let optionName = '';
        
        const text = element.textContent?.trim() || '';
        
        // 嘗試從文字中解析商品名稱和選項
        const productMatch = text.match(/【([^】]+)】\s*([^【]*?)(?=【|$)/);
        if (productMatch) {
            productName = productMatch[1].trim();
            optionName = productMatch[2].trim();
        } else {
            // 備用解析方法
            const cells = element.querySelectorAll('td, div, span');
            if (cells.length >= 2) {
                productName = cells[0]?.textContent?.trim() || '';
                optionName = cells[1]?.textContent?.trim() || '';
            } else {
                // 從單一文字中分割
                const parts = text.split(/\s+/);
                if (parts.length >= 2) {
                    productName = parts[0];
                    optionName = parts.slice(1).join(' ');
                }
            }
        }
        
        // 清理文字
        productName = productName.replace(/【|】/g, '').trim();
        optionName = optionName.replace(/【|】/g, '').trim();
        
        if (!productName || productName.length < 3) return null;
        
        return {
            productName: productName,
            optionName: optionName || '',
            element: element
        };
    }
    
    // 查找貨車位置
    findTruckLocation(productName, optionName) {
        const match = this.shopeeData.find(row => {
            const shoppeeProductName = (row[1] || '').trim(); // B欄位
            const shoppeeOptionName = (row[3] || '').trim();   // D欄位
            
            const productMatch = shoppeeProductName === productName;
            
            let optionMatch = false;
            if (!optionName && !shoppeeOptionName) {
                optionMatch = true;
            } else if (optionName && shoppeeOptionName) {
                optionMatch = shoppeeOptionName === optionName;
            }
            
            return productMatch && optionMatch;
        });
        
        if (match) {
            return match[11] || ''; // L欄位
        }
        
        return null;
    }
    
    // 注入貨車位置標記
    injectTruckLocation(element, truckLocation, optionName) {
        // 檢查是否已經注入過
        if (element.querySelector('.truck-location-badge')) {
            return;
        }
        
        // 創建貨車位置標籤
        const badge = document.createElement('span');
        badge.className = 'truck-location-badge';
        badge.innerHTML = ` <span style="
            background: #28a745;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
        ">🚚 ${truckLocation}</span>`;
        
        // 添加到元素末尾
        element.appendChild(badge);
        
        // 為整個元素添加樣式
        element.style.backgroundColor = '#e8f5e9';
        element.style.border = '1px solid #28a745';
        element.style.borderRadius = '4px';
        element.style.padding = '2px';
        element.style.margin = '1px 0';
        
        console.log(`✅ 已標記: ${truckLocation} (${optionName})`);
    }
    
    // 更新統計資料
    updateStats(total, found) {
        const missing = total - found;
        
        document.getElementById('total-count').textContent = total;
        document.getElementById('found-count').textContent = found;
        document.getElementById('missing-count').textContent = missing;
        document.getElementById('panel-stats').style.display = 'block';
    }
    
    // 匯出當前頁面HTML
    exportCurrentPage() {
        try {
            // 獲取完整的HTML
            const fullHTML = document.documentElement.outerHTML;
            
            // 創建下載
            const blob = new Blob([fullHTML], { type: 'text/html; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `shopee-truck-locations-${new Date().getTime()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // 清理URL
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            this.updatePanelStatus('HTML已匯出！可在本機開啟使用', 'success');
            
        } catch (error) {
            console.error('匯出HTML失敗:', error);
            this.updatePanelStatus('匯出失敗: ' + error.message, 'error');
        }
    }
}

// 當頁面載入完成時啟動 about:blank 處理器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AboutBlankHandler();
    });
} else {
    new AboutBlankHandler();
}