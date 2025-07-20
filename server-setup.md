# 本地Web伺服器設置說明

## 問題說明
當直接開啟HTML檔案時（file://），瀏覽器會阻擋CORS請求。需要透過HTTP伺服器運行。

## 解決方案

### 方案一：使用Python內建伺服器（推薦）

1. **開啟命令提示字元**
   ```bash
   cd C:\Users\power\Downloads\shopee_taken
   ```

2. **啟動HTTP伺服器**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # 或者 Python 2
   python -m SimpleHTTPServer 8000
   ```

3. **開啟瀏覽器**
   - 前往：http://localhost:8000
   - 點擊 index.html

### 方案二：使用Node.js serve

1. **安裝serve**
   ```bash
   npm install -g serve
   ```

2. **啟動伺服器**
   ```bash
   cd C:\Users\power\Downloads\shopee_taken
   serve -s . -p 8000
   ```

3. **開啟瀏覽器**
   - 前往：http://localhost:8000

### 方案三：使用VS Code Live Server

1. **安裝Live Server擴充功能**
2. **右鍵點擊index.html**
3. **選擇「Open with Live Server」**

## 目前狀態

- ✅ **直接開啟HTML**：會載入測試資料，功能正常但無法連接Google Sheets
- ✅ **透過HTTP伺服器**：可以正常連接Google Sheets進行讀取和寫入

## 測試資料

當無法連接Google Sheets時，系統會自動載入測試資料：
- 測試商品A（紅色-L、藍色-M）
- 測試商品B（綠色-S）

您可以使用這些測試資料來測試UI功能。

## 部署說明

正式使用時請：
1. 透過HTTP伺服器運行
2. 確保Google Apps Script已正確部署
3. 更新GAS_WEB_APP_URL為正確的部署URL