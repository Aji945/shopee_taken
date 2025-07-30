// 蝦皮貨車停車場 - 主控台自動掃描版本
// 執行後自動掃描頁面並插入貨車位置

(function() {
    'use strict';
    
    // 全域設定
    const CONFIG = {
        SHEET_ID: '1xja90NLxCTbQgxUSdx4nI0-BJXMLr0DHhu7Xln612vI',
        GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwFSPXkgQRDm4nUk4ctqrzKBjqeasJ0uSRpBYDNoqX4OlI_PLtiznjomf6viXkrPF4w/exec'
    };
    
    // 注入樣式
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .truck-location-badge {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
                margin-left: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                white-space: nowrap;
                vertical-align: middle;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .truck-location-badge.not-found {
                background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            }
            
            .truck-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 100000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
            }
            
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
            
            .truck-toast.success {
                border-left: 4px solid #48bb78;
            }
            
            .truck-toast.error {
                border-left: 4px solid #f56565;
            }
            
            .truck-toast.loading {
                border-left: 4px solid #667eea;
            }
        `;
        document.head.appendChild(style);
    };
    
    // 顯示提示訊息
    const showToast = (message, type = 'info') => {
        // 移除舊的提示
        document.querySelectorAll('.truck-toast').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = `truck-toast ${type}`;
        toast.innerHTML = `
            ${type === 'loading' ? '⏳' : type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        if (type !== 'loading') {
            setTimeout(() => toast.remove(), 3000);
        }
        
        return toast;
    };
    
    // JSONP 請求
    const jsonpRequest = (url, params = {}) => {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonp_${Date.now()}`;
            const script = document.createElement('script');
            
            const timeout = setTimeout(() => {
                reject(new Error('請求超時'));
                script.remove();
                delete window[callbackName];
            }, 10000);
            
            window[callbackName] = (data) => {
                clearTimeout(timeout);
                resolve(data);
                script.remove();
                delete window[callbackName];
            };
            
            const urlParams = new URLSearchParams({
                ...params,
                callback: callbackName
            });
            
            script.src = `${url}?${urlParams.toString()}`;
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('請求失敗'));
                script.remove();
                delete window[callbackName];
            };
            
            document.head.appendChild(script);
        });
    };
    
    // 掃描頁面商品
    const scanPageProducts = () => {
        const products = [];
        
        // 策略1：尋找列印頁面的表格
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                
                if (cells.length >= 3) {
                    let productName = '';
                    let optionName = '';
                    let quantity = '';
                    let optionCellIndex = -1;
                    
                    // 根據不同的表格格式解析
                    if (cells.length === 5) {
                        productName = (cells[0].textContent + cells[1].textContent).trim();
                        optionName = (cells[2].textContent + cells[3].textContent).trim();
                        quantity = cells[4].textContent.trim();
                        optionCellIndex = 2; // 選項名稱在第3個格子（索引2）
                    } else if (cells.length === 3) {
                        productName = cells[0].textContent.trim();
                        optionName = cells[1].textContent.trim();
                        quantity = cells[2].textContent.trim();
                        optionCellIndex = 1; // 選項名稱在第2個格子（索引1）
                    } else {
                        // 其他格式：假設最後一欄是數量
                        const allText = Array.from(cells).map(c => c.textContent.trim());
                        quantity = allText[allText.length - 1];
                        productName = allText.slice(0, -1).join(' ');
                        optionCellIndex = Math.max(0, cells.length - 2); // 倒數第二格
                    }
                    
                    // 清理資料
                    productName = productName.replace(/\s+/g, ' ').trim();
                    optionName = optionName.replace(/\s+/g, ' ').trim();
                    
                    // 過濾有效商品
                    if (productName && 
                        !productName.includes('商品名稱') && 
                        !productName.includes('選項名稱') &&
                        !productName.includes('數量') &&
                        productName.length > 5) {
                        
                        products.push({
                            element: row,
                            productName: productName,
                            optionName: optionName,
                            quantity: quantity,
                            found: false,
                            truckLocation: '',
                            optionCellIndex: optionCellIndex
                        });
                    }
                }
            });
        });
        
        console.log('掃描到的商品:', products);
        return products;
    };
    
    // 在選項名稱欄位插入貨車位置標籤
    const insertTruckLocationBadge = (row, result, optionCellIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > optionCellIndex) {
            const optionCell = cells[optionCellIndex];
            
            // 檢查是否已經包含貨車位置標籤
            if (!optionCell.querySelector('.truck-location-badge')) {
                // 創建貨車位置標籤
                const badge = document.createElement('span');
                badge.className = `truck-location-badge ${result.found ? '' : 'not-found'}`;
                badge.textContent = result.found ? `🚚 ${result.truckLocation}` : '';
                
                // 將標籤添加到儲存格內容後面
                optionCell.appendChild(badge);
            }
        }
    };
    
    // 主掃描函數
    const scanPage = async () => {
        const loadingToast = showToast('正在掃描頁面...', 'loading');
        
        try {
            // 1. 掃描頁面商品
            const products = scanPageProducts();
            
            if (products.length === 0) {
                throw new Error('未在頁面上找到商品資料');
            }
            
            loadingToast.remove();
            showToast(`找到 ${products.length} 個商品，正在查詢位置...`, 'loading');
            
            // 2. 載入蝦皮資料
            const result = await jsonpRequest(CONFIG.GAS_WEB_APP_URL, {
                action: 'read',
                sheetId: CONFIG.SHEET_ID
            });
            
            if (!result || !result.success || !result.data) {
                throw new Error('無法載入蝦皮資料');
            }
            
            const shopeeData = result.data.slice(1);
            
            // 3. 比對商品
            let foundCount = 0;
            products.forEach(product => {
                const match = shopeeData.find(row => {
                    const shoppeeProductName = (row[1] || '').trim();
                    const shoppeeOptionName = (row[3] || '').trim();
                    
                    const productMatch = shoppeeProductName === product.productName;
                    const optionMatch = (!product.optionName && !shoppeeOptionName) ||
                                      (shoppeeOptionName === product.optionName);
                    
                    return productMatch && optionMatch;
                });
                
                if (match) {
                    product.found = true;
                    product.truckLocation = match[11] || '未設定';
                    foundCount++;
                } else {
                    product.found = false;
                    product.truckLocation = '';
                }
                
                // 在選項名稱欄位插入貨車位置標籤
                if (product.optionCellIndex >= 0) {
                    insertTruckLocationBadge(product.element, product, product.optionCellIndex);
                }
            });
            
            // 移除載入提示
            document.querySelectorAll('.truck-toast').forEach(t => t.remove());
            
            // 顯示結果統計
            showToast(
                `掃描完成！找到 ${foundCount}/${products.length} 個商品的位置`,
                foundCount > 0 ? 'success' : 'error'
            );
            
            // 在控制台輸出詳細結果
            console.log('=== 掃描結果 ===');
            console.table(products.map(p => ({
                商品名稱: p.productName,
                選項: p.optionName,
                數量: p.quantity,
                貨車位置: p.found ? p.truckLocation : '未找到',
                狀態: p.found ? '✅' : '❌'
            })));
            
        } catch (error) {
            document.querySelectorAll('.truck-toast').forEach(t => t.remove());
            showToast(`掃描失敗: ${error.message}`, 'error');
            console.error('掃描失敗:', error);
        }
    };
    
    // 初始化並自動執行
    console.log('🚚 貨車位置掃描工具啟動中...');
    injectStyles();
    
    // 立即執行掃描
    setTimeout(scanPage, 500);
    
})();