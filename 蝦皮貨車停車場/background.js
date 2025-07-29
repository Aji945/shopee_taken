// 背景腳本 - 處理擴充套件的後台邏輯

chrome.runtime.onInstalled.addListener((details) => {
    console.log('蝦皮貨車位置查詢擴充套件已安裝');
    
    if (details.reason === 'install') {
        // 首次安裝時的歡迎訊息
        chrome.notifications.create({
            type: 'basic',
            title: '蝦皮貨車位置查詢',
            message: '擴充套件已安裝！前往打印頁面即可自動顯示貨車位置。'
        });
    }
});

// 處理擴充套件圖示點擊 - 由於只在 PrintPage 運作，此功能已簡化
chrome.action.onClicked.addListener((tab) => {
    // 顯示提示訊息
    chrome.notifications.create({
        type: 'basic',
        title: '蝦皮貨車位置查詢',
        message: '此擴充套件僅在打印頁面 (pro.ajinerp.com/Common/PrintPage) 自動運作'
    });
});

// 監聽來自內容腳本的訊息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到來自內容腳本的訊息:', request);
    
    switch (request.action) {
        case 'updateBadge':
            // 更新擴充套件圖示上的徽章
            chrome.action.setBadgeText({
                text: request.count ? request.count.toString() : '',
                tabId: sender.tab.id
            });
            chrome.action.setBadgeBackgroundColor({
                color: request.found ? '#48bb78' : '#f56565',
                tabId: sender.tab.id
            });
            break;
            
        case 'showNotification':
            // 顯示通知
            chrome.notifications.create({
                type: 'basic',
                title: request.title || '蝦皮貨車位置查詢',
                message: request.message
            });
            break;
            
        case 'logError':
            // 記錄錯誤
            console.error('內容腳本錯誤:', request.error);
            break;
    }
    
    sendResponse({ success: true });
});

// 當標籤頁更新時重置徽章
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        tab.url && 
        tab.url.includes('pro.ajinerp.com/Common/PrintPage')) {
        // 重置徽章
        chrome.action.setBadgeText({ text: '', tabId: tabId });
        console.log('PrintPage 已載入，擴充套件將自動運作');
    }
});

// 清理通知
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.notifications.clear(notificationId);
});

// 處理擴充套件更新
chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log('擴充套件有新版本可用:', details.version);
    
    chrome.notifications.create({
        type: 'basic',
        title: '蝦皮貨車位置查詢 - 更新可用',
        message: `新版本 ${details.version} 已可用，請重新啟動瀏覽器以更新。`
    });
});