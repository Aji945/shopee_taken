// 彈出視窗腳本
class PopupController {
    constructor() {
        this.currentTab = null;
        this.init();
    }

    async init() {
        console.log('初始化彈出視窗');
        
        // 獲取當前標籤頁
        await this.getCurrentTab();
        
        // 檢查頁面狀態
        this.checkPageStatus();
        
        // 綁定事件
        this.bindEvents();
        
        // 載入設定
        this.loadSettings();
    }

    // 獲取當前標籤頁
    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
            console.log('當前標籤頁:', tab.url);
        } catch (error) {
            console.error('獲取當前標籤頁失敗:', error);
        }
    }

    // 檢查頁面狀態
    checkPageStatus() {
        if (!this.currentTab) {
            this.updateStatus('error', '無法檢測頁面', '請重新打開擴充套件');
            return;
        }

        if (this.currentTab.url.includes('pro.ajinerp.com/Common/PrintPage')) {
            this.updateStatus('success', '已連接到打印頁面', '擴充套件正在運行中');
            this.requestStats();
            document.getElementById('refreshBtn').textContent = '🔄 重新掃描';
        } else if (this.currentTab.url.includes('pro.ajinerp.com/Order/ShopeeDistribution')) {
            this.updateStatus('success', '已連接到訂單分配頁面', '可以掃描商品資訊');
            this.requestStats();
            document.getElementById('refreshBtn').textContent = '🔄 掃描訂單';
        } else if (this.currentTab.url === 'about:blank') {
            this.updateStatus('warning', '列印頁面（about:blank）', '此頁面無法使用擴充套件');
            document.getElementById('refreshBtn').textContent = '🔧 開啟重建工具';
            document.getElementById('printPageTip').style.display = 'block';
            
            // 顯示額外的按鈕
            this.addSecondaryButton();
        } else if (this.isRestrictedPage()) {
            this.updateStatus('warning', '受限制頁面', '此類頁面不支援腳本運行，請前往目標頁面');
            document.getElementById('refreshBtn').textContent = '🔗 前往打印頁面';
            document.getElementById('helpTip').style.display = 'block';
        } else {
            this.updateStatus('warning', '非目標頁面', '點擊按鈕可掃描此頁面或前往打印頁面');
            document.getElementById('refreshBtn').textContent = '🚚 掃描此頁面';
            document.getElementById('helpTip').style.display = 'block';
        }
    }

    // 檢查是否為受限制的頁面
    isRestrictedPage() {
        const url = this.currentTab.url;
        
        // 特殊處理：如果是 about:blank 但可能是列印頁面，先檢查是否有內容
        if (url === 'about:blank') {
            return false; // 不直接判定為受限制，讓掃描功能去處理
        }
        
        const restrictedPatterns = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'edge://',
            'opera://',
            'data:',
            'file://'
        ];
        
        return restrictedPatterns.some(pattern => url.startsWith(pattern)) || !url || url === '';
    }

    // 更新狀態顯示
    updateStatus(type, text, desc) {
        const statusIcon = document.getElementById('statusIcon');
        const statusText = document.getElementById('statusText');
        const statusDesc = document.getElementById('statusDesc');

        statusText.textContent = text;
        statusDesc.textContent = desc;

        switch (type) {
            case 'success':
                statusIcon.textContent = '✅';
                break;
            case 'warning':
                statusIcon.textContent = '⚠️';
                break;
            case 'error':
                statusIcon.textContent = '❌';
                break;
            case 'loading':
                statusIcon.textContent = '⏳';
                break;
            default:
                statusIcon.textContent = '🚚';
        }
    }

    // 綁定事件
    bindEvents() {
        // 掃描按鈕 - 支援任何頁面
        document.getElementById('refreshBtn').addEventListener('click', () => {
            if (this.currentTab.url.includes('pro.ajinerp.com/Common/PrintPage') || 
                this.currentTab.url.includes('pro.ajinerp.com/Order/ShopeeDistribution')) {
                this.refreshContent();
            } else if (this.currentTab.url === 'about:blank') {
                // about:blank 頁面開啟重建工具
                this.openRecreateTool();
            } else if (this.isRestrictedPage()) {
                this.goToPrintPage();
            } else {
                this.scanCurrentPage();
            }
        });

        // 設定按鈕
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        // 開關切換
        document.getElementById('autoUpdateSwitch').addEventListener('click', (e) => {
            this.toggleSwitch(e.currentTarget, 'autoUpdate');
        });

        document.getElementById('notificationSwitch').addEventListener('click', (e) => {
            this.toggleSwitch(e.currentTarget, 'showNotifications');
        });
    }

    // 切換開關
    toggleSwitch(switchElement, settingKey) {
        const isActive = switchElement.classList.contains('active');
        
        if (isActive) {
            switchElement.classList.remove('active');
        } else {
            switchElement.classList.add('active');
        }

        // 保存設定
        const settings = {};
        settings[settingKey] = !isActive;
        chrome.storage.sync.set(settings);

        console.log(`${settingKey} 設定為:`, !isActive);
    }

    // 載入設定
    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get(['autoUpdate', 'showNotifications']);
            
            // 更新開關狀態
            if (settings.autoUpdate !== false) { // 預設開啟
                document.getElementById('autoUpdateSwitch').classList.add('active');
            }
            
            if (settings.showNotifications !== false) { // 預設開啟
                document.getElementById('notificationSwitch').classList.add('active');
            }
        } catch (error) {
            console.error('載入設定失敗:', error);
        }
    }

    // 重新掃描內容
    async refreshContent() {
        this.updateStatus('loading', '重新掃描中...', '正在更新貨車位置資訊');
        
        try {
            // 向內容腳本發送重新掃描訊息
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'refresh'
            });
            
            this.updateStatus('success', '掃描完成', '貨車位置已更新');
            
            // 延遲請求統計資料
            setTimeout(() => {
                this.requestStats();
            }, 1000);
            
        } catch (error) {
            console.error('重新掃描失敗:', error);
            this.updateStatus('error', '掃描失敗', '請重新載入頁面');
        }
    }

    // 掃描當前頁面 - 強制啟動功能
    async scanCurrentPage() {
        // 先檢查是否為受限制頁面
        if (this.isRestrictedPage()) {
            this.updateStatus('warning', '受限制頁面', '此類頁面不支援腳本運行');
            document.getElementById('refreshBtn').textContent = '🔗 前往打印頁面';
            return;
        }
        
        this.updateStatus('loading', '正在掃描當前頁面...', '嘗試啟動貨車位置查詢功能');
        
        try {
            // 檢查是否有權限訪問當前標籤頁
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                func: function() {
                    return { success: true, url: window.location.href };
                }
            });
            
            // 注入內容腳本
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['content-script.js']
            });
            
            // 等待腳本載入
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 發送強制啟動訊息
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'forceScan'
            });
            
            if (response && response.success) {
                this.updateStatus('success', '掃描已啟動', '正在嘗試處理當前頁面');
                
                // 延遲請求統計資料
                setTimeout(() => {
                    this.requestStats();
                }, 3000);
            } else {
                throw new Error(response?.error || '頁面可能不包含可處理的商品資料');
            }
            
        } catch (error) {
            console.error('掃描當前頁面失敗:', error);
            
            if (error.message.includes('Cannot access contents') || 
                error.message.includes('Extension does not have permission')) {
                this.updateStatus('error', '權限不足', '此頁面不允許擴充套件運行');
                document.getElementById('refreshBtn').textContent = '🔗 前往打印頁面';
            } else if (error.message.includes('Could not establish connection')) {
                this.updateStatus('error', '連接失敗', '頁面可能不支援此功能');
                document.getElementById('refreshBtn').textContent = '🔗 前往打印頁面';
            } else {
                this.updateStatus('error', '掃描失敗', error.message || '請確認頁面是否載入完成');
                document.getElementById('refreshBtn').textContent = '🔗 前往打印頁面';
            }
        }
    }

    // 前往打印頁面
    goToPrintPage() {
        // 顯示提示訊息
        this.updateStatus('info', '正在前往打印頁面', '請在頁面載入完成後再次點擊擴充套件');
        
        // 先開啟目標頁面
        chrome.tabs.update(this.currentTab.id, {
            url: 'https://pro.ajinerp.com/Common/PrintPage'
        });
        
        // 設置提醒
        chrome.storage.local.set({
            showPrintPageTip: true,
            tipTimestamp: Date.now()
        });
        
        // 延遲關閉彈出視窗
        setTimeout(() => {
            window.close();
        }, 2000);
    }

    // 添加次要按鈕
    addSecondaryButton() {
        // 檢查是否已經添加
        if (document.getElementById('secondaryBtn')) {
            return;
        }
        
        const btnContainer = document.querySelector('.controls');
        const secondaryBtn = document.createElement('button');
        secondaryBtn.id = 'secondaryBtn';
        secondaryBtn.className = 'btn';
        secondaryBtn.textContent = '📋 查看最近掃描結果';
        secondaryBtn.onclick = () => this.showRecentScans();
        
        // 插入在設定按鈕之前
        const settingsBtn = document.getElementById('settingsBtn');
        btnContainer.insertBefore(secondaryBtn, settingsBtn);
    }

    // 開啟重建工具
    openRecreateTool() {
        // 開啟重建頁面
        chrome.tabs.create({
            url: chrome.runtime.getURL('recreate-page.html'),
            active: true
        });
        
        // 顯示提示
        this.updateStatus('info', '正在開啟重建工具', '請按照頁面指示操作');
        
        // 延遲關閉彈出視窗
        setTimeout(() => {
            window.close();
        }, 1500);
    }

    // 顯示最近掃描結果
    async showRecentScans() {
        this.updateStatus('loading', '載入中...', '正在讀取最近的掃描結果');
        
        try {
            const data = await chrome.storage.local.get('recentScans');
            const recentScans = data.recentScans || [];
            
            if (recentScans.length === 0) {
                this.updateStatus('info', '無掃描記錄', '請先在商品頁面進行掃描');
                return;
            }
            
            // 顯示最近的掃描結果
            const latestScan = recentScans[recentScans.length - 1];
            const scanTime = new Date(latestScan.timestamp).toLocaleString('zh-TW');
            
            this.updateStatus('success', '最近掃描結果', `掃描時間: ${scanTime}`);
            
            // 在統計面板顯示結果
            document.getElementById('totalCount').textContent = latestScan.total || 0;
            document.getElementById('foundCount').textContent = latestScan.found || 0;
            document.getElementById('missingCount').textContent = latestScan.missing || 0;
            document.getElementById('statsPanel').style.display = 'grid';
            
            // 創建一個簡易的結果列表
            if (latestScan.items && latestScan.items.length > 0) {
                const resultDiv = document.createElement('div');
                resultDiv.style.cssText = `
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 8px;
                    padding: 10px;
                    margin-top: 10px;
                    font-size: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                `;
                
                resultDiv.innerHTML = '<strong>貨車位置清單：</strong><br>';
                latestScan.items.forEach(item => {
                    resultDiv.innerHTML += `${item.product}: <strong>${item.location}</strong><br>`;
                });
                
                document.querySelector('.content').appendChild(resultDiv);
            }
            
        } catch (error) {
            console.error('讀取掃描記錄失敗:', error);
            this.updateStatus('error', '讀取失敗', '無法載入掃描記錄');
        }
    }

    // 請求統計資料
    async requestStats() {
        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getStats'
            });
            
            if (response && response.stats) {
                this.updateStats(response.stats);
            }
        } catch (error) {
            console.log('無法獲取統計資料，可能內容腳本尚未載入');
        }
    }

    // 更新統計資料
    updateStats(stats) {
        document.getElementById('totalCount').textContent = stats.total || 0;
        document.getElementById('foundCount').textContent = stats.found || 0;
        document.getElementById('missingCount').textContent = stats.missing || 0;
        
        document.getElementById('statsPanel').style.display = 'grid';
        
        // 更新狀態描述
        if (stats.total > 0) {
            const foundPercent = Math.round((stats.found / stats.total) * 100);
            this.updateStatus('success', '掃描完成', `找到 ${stats.found}/${stats.total} 個商品位置 (${foundPercent}%)`);
        }
    }

    // 打開設定頁面
    openSettings() {
        chrome.tabs.create({
            url: chrome.runtime.getURL('settings.html')
        });
        window.close();
    }
}

// 當彈出視窗載入完成時初始化
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});

// 監聽來自背景腳本或內容腳本的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('彈出視窗收到訊息:', request);
    
    if (request.action === 'updateStats') {
        // 可以在這裡處理統計資料更新
        console.log('統計資料更新:', request.stats);
    }
    
    sendResponse({ success: true });
});