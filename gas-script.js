function syncFilterSheetsWithColorAndSort() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName("統整記錄") || ss.insertSheet("統整記錄");
  const sourceSheets = ["缺量", "倉位錯", "要補貨", "有備註"];

  const now = new Date();
  const newRows = [];

  // 1️⃣ 撈取來源資料
  sourceSheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    data.slice(1).forEach(row => {
      newRows.push([now, name, ...row]);
    });
  });

  if (newRows.length === 0) return;

  // 2️⃣ 寫入統整記錄
  const lastRow = summarySheet.getLastRow();
  const startRow = lastRow + 1;
  const endRow = startRow + newRows.length - 1;
  summarySheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newRows);

  // 3️⃣ 抓出當次寫入的資料（僅排序這段）
  const newRange = summarySheet.getRange(startRow, 1, newRows.length, newRows[0].length);
  const newData = newRange.getValues();

  // 4️⃣ 檢查現有資料最後一列的顏色，決定起始顏色
  const colorList = ["#e3f2fd", "#fff3e0"]; // 淺藍和淺黃交替
  let colorIdx = 0;
  
  if (lastRow > 0) {
    // 檢查最後一列的背景色
    const lastRowBg = summarySheet.getRange(lastRow, 1).getBackground();
    if (lastRowBg === colorList[0]) {
      colorIdx = 1; // 如果最後一列是第一種顏色，新資料用第二種
    } else {
      colorIdx = 0; // 否則用第一種顏色
    }
  }

  // 5️⃣ 對 D 欄（index 3）排序
  newData.sort((a, b) => {
    const d1 = a[3] || "";
    const d2 = b[3] || "";
    return d1.localeCompare(d2, "zh-Hant");
  });

  // 5️⃣ 寫回排序後資料
  summarySheet.getRange(startRow, 1, newRows.length, newRows[0].length).setValues(newData);

  // 7️⃣ A欄時間相同的列數上色（交替顏色）
  let currentTimeMillis = null;
  let currentColor = colorList[colorIdx]; // 當前批次的顏色
  
  for (let i = 0; i < newData.length; i++) {
    const rowTime = newData[i][0]; // A欄時間
    const timeMillis = Math.floor(rowTime.getTime() / 1000); // 精確到秒
    
    // 如果時間改變，切換到下一個顏色
    if (currentTimeMillis !== null && timeMillis !== currentTimeMillis) {
      colorIdx = (colorIdx + 1) % colorList.length;
      currentColor = colorList[colorIdx];
    }
    
    currentTimeMillis = timeMillis;
    
    // 設定該列背景色（相同時間用相同顏色）
    summarySheet.getRange(startRow + i, 1, 1, newRows[0].length)
                .setBackground(currentColor);
  }
}

function clearRangeA1toM_untilRealLastRowInD() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dValues = sheet.getRange("D2:D").getDisplayValues(); // 使用「顯示值」抓實際顯示的內容（會抓到 #N/A）

  let lastRow = 0;
  for (let i = dValues.length - 1; i >= 0; i--) {
    const val = dValues[i][0].toString().trim();
    if (val !== "") {
      lastRow = i + 1;
      break;
    }
  }

  if (lastRow === 0) return;

  // 從 A1 ~ N{lastRow} 強制清除資料、格式、顏色
  const range = sheet.getRange(2, 1, lastRow, 14); // A1:N{lastRow}
  range.clear(); // 比 clearContent() 更強：會清掉格式與錯誤值
}

// 🔧 增強版清除函數
function clearDataAndShopeeHJRangeFixed() {
  try {
    console.log("🚀 開始執行清除作業...");
    
    // 先執行同步函數
    syncFilterSheetsWithColorAndSort();
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // -------- 1️⃣ 清空當前作用工作表 --------
    const sheet = ss.getActiveSheet();
    const lastRowA = sheet.getRange("A:A").getLastRow();
    const lastRowB = sheet.getRange("B:B").getLastRow();
    const lastRow = Math.max(lastRowA, lastRowB);

    console.log(`📋 當前工作表: ${sheet.getName()}, 最後列: ${lastRow}`);

    if (lastRow > 0) {
      sheet.getRange(1, 1, lastRow, 7).clearContent();
      console.log(`✅ 已清空 A1:G${lastRow}`);
    }

    sheet.getRange("A1").setValue("請先點X清除後，在這裡貼上，並按+");

    // -------- 2️⃣ 清空「蝦皮」工作表 --------
    const shopee = ss.getSheetByName("蝦皮");
    if (!shopee) {
      console.log("⚠️ 找不到名為『蝦皮』的工作表");
      return;
    }

    const lastDataRow = Math.max(
      shopee.getRange("H:H").getLastRow(),
      shopee.getRange("I:I").getLastRow(),
      shopee.getRange("J:J").getLastRow(),
      shopee.getRange("K:K").getLastRow(),
      shopee.getRange("L:L").getLastRow()
    );

    console.log(`📋 蝦皮工作表 H:L 最後列: ${lastDataRow}`);

    if (lastDataRow > 0) {
      shopee.getRange(1, 8, lastDataRow, 5).clearContent();
      console.log(`✅ 已清空蝦皮工作表 H1:L${lastDataRow}`);
    }
    
    console.log("🎉 所有清除作業完成！");
    
  } catch (error) {
    console.error(`❌ 執行錯誤: ${error.message}`);
    console.error(`錯誤堆疊: ${error.stack}`);
  }
}

function fillFormulasToGColumnAuto() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getRange("B:B").getLastRow();

  const formulas = [];
  for (let i = 0; i < lastRow - 4; i++) {
    const row = i + 5;
    formulas.push([`=IF(N${row}<>"" , N${row} & "+" & O${row}, "")`]);
  }

  if (formulas.length > 0) {
    sheet.getRange(5, 7, formulas.length, 1).setFormulas(formulas);
  }
}


function fillFormulasToGColumnAuto() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getRange("B:B").getLastRow();

  const formulas = [];
  for (let i = 0; i < lastRow - 4; i++) {
    const row = i + 5;
    formulas.push([`=IF(N${row}<>"" , N${row} & "+" & O${row}, "")`]);
  }

  if (formulas.length > 0) {
    sheet.getRange(5, 7, formulas.length, 1).setFormulas(formulas);
  }
}

function fillEColumnWithStorageLocation() {
  const startTime = new Date();
  console.log('開始處理...');
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getRange("B:B").getLastRow();
  
  if (lastRow < 5) {
    console.log('沒有資料需要處理');
    return;
  }
  
  // 批次讀取所有需要的資料（一次性讀取，大幅提升效能）
  const dataRange = sheet.getRange(5, 2, lastRow - 4, 3); // B, C, D 欄位
  const sourceData = dataRange.getValues();
  
  console.log(`讀取了 ${sourceData.length} 行資料`);
  
  // 開啟儲位表，指定「儲位表」工作表
  const storageSpreadsheet = SpreadsheetApp.openById('102GIGymYY1WHIIfX2pCk_zUFGwetUIBYObTGM0EvE8c');
  const storageSheet = storageSpreadsheet.getSheetByName('儲位表');
  
  if (!storageSheet) {
    console.error('找不到「儲位表」工作表');
    return;
  }
  
  // 批次讀取儲位表所有資料
  const storageData = storageSheet.getDataRange().getValues();
  console.log(`儲位表有 ${storageData.length} 行資料`);
  
  // 建立快速查詢的對應表（提升查詢效能）
  const storageMapByF = new Map(); // 以F欄位為key的對應表
  const storageMapByCD = new Map(); // 以C+D欄位組合為key的對應表
  
  // 預處理儲位表資料，建立查詢索引
  for (let j = 1; j < storageData.length; j++) { // 跳過標題行
    const row = storageData[j];
    const fValue = row[5]; // F欄位
    const cValue = row[2]; // C欄位
    const dValue = row[3]; // D欄位
    const gValue = row[6] || ""; // G欄位
    
    // 建立F欄位索引
    if (fValue && fValue !== "") {
      storageMapByF.set(fValue, gValue);
    }
    
    // 建立C+D欄位組合索引
    // 儲位表中的 (無規格型號) 對應到原始資料的空白
    let normalizedDValue = dValue;
    if (dValue === "(無規格型號)") {
      normalizedDValue = "";
    }
    const cdKey = `${cValue}|||${normalizedDValue}`; // 使用特殊分隔符避免衝突
    storageMapByCD.set(cdKey, gValue);
    
    // 同時建立反向索引：當儲位表是 (無規格型號) 時，也要能被空白查到
    if (dValue === "(無規格型號)") {
      const cdKeyForEmpty = `${cValue}|||`; // 空白選項名稱的key
      storageMapByCD.set(cdKeyForEmpty, gValue);
    }
  }
  
  console.log(`建立了 ${storageMapByF.size} 個F欄位索引，${storageMapByCD.size} 個C+D組合索引`);
  
  // 批次處理所有資料
  const results = [];
  for (let i = 0; i < sourceData.length; i++) {
    const bValue = sourceData[i][0]; // B欄位（商品名稱）
    const cValue = sourceData[i][1]; // C欄位
    const dValue = sourceData[i][2]; // D欄位（選項名稱）
    
    let storageLocation = "";
    
    if (cValue && cValue !== "") {
      // 情況1：C欄位有數值，用C欄位數值查詢F欄位索引
      storageLocation = storageMapByF.get(cValue) || "";
    } else {
      // 情況2：C欄位沒有數值，用B+D組合查詢
      // 處理空白選項名稱的情況
      let normalizedDValue = dValue || ""; // 確保undefined變成空字串
      const cdKey = `${bValue}|||${normalizedDValue}`;
      storageLocation = storageMapByCD.get(cdKey) || "";
      
      // 如果沒找到且選項名稱是空白，再試試看查詢 (無規格型號) 的組合
      if (!storageLocation && normalizedDValue === "") {
        const cdKeyForNoSpec = `${bValue}|||(無規格型號)`;
        storageLocation = storageMapByCD.get(cdKeyForNoSpec) || "";
      }
    }
    
    results.push([storageLocation]);
  }
  
  // 批次寫入結果（一次性寫入，大幅提升效能）
  if (results.length > 0) {
    sheet.getRange(5, 5, results.length, 1).setValues(results);
  }
  
  const endTime = new Date();
  const executionTime = (endTime - startTime) / 1000;
  console.log(`處理完成！共處理 ${results.length} 行資料，耗時 ${executionTime} 秒`);
}

// 測試讀取儲位表工作表
function testStorageSheetAccess() {
  try {
    const storageSpreadsheet = SpreadsheetApp.openById('102GIGymYY1WHIIfX2pCk_zUFGwetUIBYObTGM0EvE8c');
    const storageSheet = storageSpreadsheet.getSheetByName('儲位表');
    
    if (!storageSheet) {
      console.log('找不到「儲位表」工作表，可用的工作表有：');
      storageSpreadsheet.getSheets().forEach(sheet => {
        console.log('- ' + sheet.getName());
      });
      return '找不到「儲位表」工作表';
    }
    
    console.log('成功存取儲位表工作表：' + storageSheet.getName());
    
    // 測試讀取資料
    const firstCell = storageSheet.getRange('A1').getValue();
    console.log('儲位表A1儲存格內容：' + firstCell);
    
    // 測試讀取幾行資料來確認結構
    const testData = storageSheet.getRange('A1:G3').getValues();
    console.log('儲位表前3行資料：');
    testData.forEach((row, index) => {
      console.log(`第${index + 1}行: ${row.join(' | ')}`);
    });
    
    return '儲位表工作表權限設置成功！';
  } catch (error) {
    console.error('權限設置失敗：' + error.toString());
    return '權限設置失敗：' + error.toString();
  }
}

// 整合函數：同時處理G欄位和E欄位
function fillFormulasAndStorageLocation() {
  console.log('=== 開始執行整合處理 ===');
  
  const startTime = new Date();
  
  // 處理G欄位公式
  console.log('正在處理G欄位公式...');
  fillFormulasToGColumnAuto();
  
  // 處理E欄位儲位資訊
  console.log('正在處理E欄位儲位資訊...');
  fillEColumnWithStorageLocation();
  
  const endTime = new Date();
  const totalTime = (endTime - startTime) / 1000;
  console.log(`=== 全部處理完成！總耗時 ${totalTime} 秒 ===`);
}


// Google Apps Script 代碼
// 需要部署為Web應用程式，允許匿名存取

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, sheetId, range, value, ranges } = data;
    
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    
    if (action === 'update') {
      sheet.getRange(range).setValue(value);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'clear') {
      ranges.forEach(r => sheet.getRange(r).clearContent());
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'read') {
      const values = sheet.getRange('A:L').getValues();
      // 過濾空行和F欄位為空或非數字的資料
      const filteredData = values.filter((row, index) => {
        if (index === 0) return true; // 保留標題行
        const quantity = row[5];
        if (!quantity || quantity.toString().trim() === '') return false;
        // 檢查是否為數字
        return !isNaN(Number(quantity));
      });
      
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          data: filteredData 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  
  if (action === 'read') {
    try {
      const sheetId = e.parameter.sheetId;
      if (!sheetId) {
        throw new Error('缺少 sheetId 參數');
      }
      
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      if (!spreadsheet) {
        throw new Error('找不到指定的 Google Sheets');
      }
      
      const sheet = spreadsheet.getSheetByName("蝦皮");
      if (!sheet) {
        throw new Error('找不到「蝦皮」工作表，請確認工作表名稱是否正確');
      }
      
      const values = sheet.getRange('A:L').getValues();
      
      // 過濾空行和F欄位為空或非數字的資料
      const filteredData = values.filter((row, index) => {
        if (index === 0) return true; // 保留標題行
        const quantity = row[5];
        if (!quantity || quantity.toString().trim() === '') return false;
        // 檢查是否為數字
        return !isNaN(Number(quantity));
      });
      
      const result = JSON.stringify({ 
        success: true, 
        data: filteredData 
      });
      
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  if (action === 'update') {
    try {
      const sheetId = e.parameter.sheetId;
      const productName = e.parameter.productName;
      const specName = e.parameter.specName;
      const column = e.parameter.column;
      const value = e.parameter.value;
      
      const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("蝦皮");
      const values = sheet.getRange('A:L').getValues();
      
      // 根據B欄位(商品名稱)和D欄位(規格名稱)找到對應的列
      let targetRow = -1;
      for (let i = 1; i < values.length; i++) {
        const rowProductName = values[i][1] || '';
        const rowSpecName = values[i][3] || '';
        
        // 使用trim()去除前後空格，並進行嚴格比較
        if (rowProductName.trim() === productName.trim() && rowSpecName.trim() === specName.trim()) {
          targetRow = i + 1; // +1因為陣列從0開始，Excel從1開始
          break;
        }
      }
      
      if (targetRow === -1) {
        throw new Error(`找不到商品: ${productName} - ${specName}`);
      }
      
      const range = `${column}${targetRow}`;
      sheet.getRange(range).setValue(value);
      
      const result = JSON.stringify({ success: true, updatedRow: targetRow });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  if (action === 'clear') {
    try {
      const sheetId = e.parameter.sheetId;
      const productName = e.parameter.productName;
      const specName = e.parameter.specName;
      
      const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("蝦皮");
      const values = sheet.getRange('A:L').getValues();
      
      // 根據B欄位(商品名稱)和D欄位(規格名稱)找到對應的列
      let targetRow = -1;
      for (let i = 1; i < values.length; i++) {
        const rowProductName = values[i][1] || '';
        const rowSpecName = values[i][3] || '';
        
        // 使用trim()去除前後空格，並進行嚴格比較
        if (rowProductName.trim() === productName.trim() && rowSpecName.trim() === specName.trim()) {
          targetRow = i + 1; // +1因為陣列從0開始，Excel從1開始
          break;
        }
      }
      
      if (targetRow === -1) {
        throw new Error(`找不到商品: ${productName} - ${specName}`);
      }
      
      // 清除H、I、J、K、L欄位
      const ranges = [`H${targetRow}`, `I${targetRow}`, `J${targetRow}`, `K${targetRow}`, `L${targetRow}`];
      ranges.forEach(r => sheet.getRange(r).clearContent());
      
      const result = JSON.stringify({ success: true, clearedRow: targetRow });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  if (action === 'batchUpdate') {
    try {
      const sheetId = e.parameter.sheetId;
      const productName = e.parameter.productName;
      const specName = e.parameter.specName;
      const updates = JSON.parse(e.parameter.updates);
      
      const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("蝦皮");
      const values = sheet.getRange('A:L').getValues();
      
      // 根據B欄位(商品名稱)和D欄位(規格名稱)找到對應的列
      let targetRows = [];
      for (let i = 1; i < values.length; i++) {
        const rowProductName = values[i][1] || '';
        const rowSpecName = values[i][3] || '';
        
        // 使用trim()去除前後空格，並進行嚴格比較
        if (rowProductName.trim() === productName.trim() && rowSpecName.trim() === specName.trim()) {
          targetRows.push(i + 1); // +1因為陣列從0開始，Excel從1開始
        }
      }
      
      if (targetRows.length === 0) {
        throw new Error(`找不到商品: ${productName} - ${specName}`);
      }
      
      // 批次更新所有匹配的行
      const updateOperations = [];
      targetRows.forEach(targetRow => {
        Object.keys(updates).forEach(column => {
          const range = `${column}${targetRow}`;
          updateOperations.push({
            range: range,
            value: updates[column]
          });
        });
      });
      
      // 執行批次更新
      updateOperations.forEach(op => {
        sheet.getRange(op.range).setValue(op.value);
      });
      
      const result = JSON.stringify({ 
        success: true, 
        updatedRows: targetRows,
        operationsCount: updateOperations.length
      });
      
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      if (callback) {
        return ContentService
          .createTextOutput(`${callback}(${result})`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } else {
        return ContentService
          .createTextOutput(result)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  const result = JSON.stringify({ message: "蝦皮檢貨系統 API 運行中" });
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${result})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService
      .createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON);
  }
}