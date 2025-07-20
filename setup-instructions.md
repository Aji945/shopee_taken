# 蝦皮檢貨系統設置說明

## 系統架構
現在系統使用**Google Apps Script**統一處理讀取和寫入操作，更加方便且安全。

## 設置步驟

### 1. 部署Google Apps Script

1. **創建專案**
   - 前往 https://script.google.com/
   - 點擊「新專案」
   - 將 `gas-script.js` 的完整內容貼入

2. **部署為Web應用程式**
   - 點擊「部署」→「新增部署作業」
   - 類型選擇「網頁應用程式」
   - 執行身分：選擇您的帳戶
   - 存取權限：「所有人」
   - 點擊「部署」並授權權限
   - **複製部署的Web App URL**

3. **更新HTML設定**
   - 開啟 `index.html`
   - 找到第405行：`const GAS_WEB_APP_URL = 'YOUR_DEPLOYED_GAS_WEB_APP_URL';`
   - 將 `YOUR_DEPLOYED_GAS_WEB_APP_URL` 替換為您剛複製的URL

### 2. 測試系統

1. 開啟 `index.html`
2. 系統會自動透過Google Apps Script讀取資料
3. 進行檢貨操作測試寫入功能

## 檔案說明

- `index.html` - 主要檢貨系統（已完成所有功能）
- `gas-script.js` - Google Apps Script後端代碼
- `setup-instructions.md` - 此設置說明

## 功能特色

✅ **已完成功能**
- **數據過濾**：自動過濾F欄位為空的資料
- **智能分組**：相同商品名稱集中顯示，不同選項分別列出
- **全新排版**：大尺寸卡片設計，更適合手機操作
- **三種檢貨狀態**：已檢貨/缺量/要補貨
- **狀態變色**：不同狀態顯示不同顏色
- **九宮格數字輸入**：缺量和庫存數量輸入
- **即時同步**：透過Google Apps Script讀寫
- **自動刷新**：每10秒背景更新
- **恢復功能**：一鍵重設狀態

## 資料結構

系統會讀取Google Sheets的A-J欄位：
- **A欄**：主貨號
- **B欄**：商品名稱（用於分組）
- **C欄**：選項貨號
- **D欄**：規格名稱（顯示為選項標題）
- **E欄**：儲位
- **F欄**：數量（為空則不顯示）
- **G欄**：備註
- **H欄**：檢貨狀態
- **I欄**：缺量數量
- **J欄**：庫存數量

## 使用說明

1. 完成Google Apps Script部署並更新URL
2. 開啟 `index.html` 
3. 系統自動加載並分組顯示商品
4. 點擊按鍵進行檢貨操作
5. 狀態會即時同步到Google Sheets