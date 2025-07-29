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

  // 4️⃣ 建立 D+F 重複 key map
  const keyMap = {};
  newData.forEach((row, idx) => {
    const key = (row[3] || "").toString().trim() + "||" + (row[5] || "").toString().trim();
    if (!keyMap[key]) keyMap[key] = [];
    keyMap[key].push(idx);
  });

  // 5️⃣ 準備顏色
  const colorList = ["#ffe5e5", "#e0f7fa", "#e8f5e9", "#fff3e0", "#f3e5f5", "#e1f5fe", "#f9fbe7"];
  let colorIdx = 0;

  // 6️⃣ 包裝排序 + 上色資訊
  const coloredRows = newData.map((row, idx) => {
    const key = (row[3] || "").toString().trim() + "||" + (row[5] || "").toString().trim();
    const color = keyMap[key].length > 1 ? colorList[colorIdx % colorList.length] : null;
    return { row, key, color };
  });

  // 對 D 欄（index 3）排序
  coloredRows.sort((a, b) => {
    const d1 = a.row[3] || "";
    const d2 = b.row[3] || "";
    return d1.localeCompare(d2, "zh-Hant");
  });

  // 7️⃣ 寫回排序後資料
  summarySheet.getRange(startRow, 1, newRows.length, newRows[0].length)
              .setValues(coloredRows.map(r => r.row));

  // 8️⃣ 清除背景色、重新上色（僅當次新增範圍）
  summarySheet.getRange(startRow, 1, newRows.length, newRows[0].length).setBackground(null);

  const colorAssignment = {};
  coloredRows.forEach((r, i) => {
    if (!r.color) return;
    if (!colorAssignment[r.key]) {
      colorAssignment[r.key] = colorList[colorIdx % colorList.length];
      colorIdx++;
    }
    summarySheet.getRange(startRow + i, 1, 1, newRows[0].length).setBackground(colorAssignment[r.key]);
  });
}

function clearRangeA1toM_untilRealLastRowInD() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const dValues = sheet.getRange("D1:D").getDisplayValues(); // 使用「顯示值」抓實際顯示的內容（會抓到 #N/A）

  let lastRow = 0;
  for (let i = dValues.length - 1; i >= 0; i--) {
    const val = dValues[i][0].toString().trim();
    if (val !== "") {
      lastRow = i + 1;
      break;
    }
  }

  if (lastRow === 0) return;

  // 從 A1 ~ M{lastRow} 強制清除資料、格式、顏色
  const range = sheet.getRange(1, 1, lastRow, 13); // A1:M{lastRow}
  range.clear(); // 比 clearContent() 更強：會清掉格式與錯誤值
}




function clearDataAndShopeeHJRange() {
  syncFilterSheetsWithColorAndSort();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // -------- 1️⃣ 清空當前作用工作表 A:Z（依 A+B 欄最末列）--------
  const sheet = ss.getActiveSheet();
  const lastRowA = sheet.getRange("A:A").getLastRow();
  const lastRowB = sheet.getRange("B:B").getLastRow();
  const lastRow = Math.max(lastRowA, lastRowB);

  if (lastRow > 0) {
    sheet.getRange(1, 1, lastRow, 7).clearContent(); // A=1, Z=26 共26欄
  }

  sheet.getRange("A1").setValue("請先點X清除後，在這裡貼上，並按+");

  // -------- 2️⃣ 清空「蝦皮」工作表中 H1:L到最後有資料的列 --------
  const shopee = ss.getSheetByName("蝦皮");
  if (!shopee) {
    Logger.log("⚠️ 找不到名為『蝦皮』的工作表");
    return;
  }

  const rangeHJKL = shopee.getRange("H:L").getValues(); // 拿 H~L 全列資料
  let lastDataRow = 0;

  for (let i = rangeHJKL.length - 1; i >= 0; i--) {
    const row = rangeHJKL[i];
    if (row[0] !== "" || row[1] !== "" || row[2] !== "" || row[3] !== "" || row[4] !== "") {
      lastDataRow = i + 1; // 因為 index 是 0-based，要 +1 才是實際列號
      break;
    }
  }

  if (lastDataRow > 0) {
    shopee.getRange(1, 8, lastDataRow, 5).clearContent(); // 從 H1:L{last} 共 5欄
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


// Google Apps Script 代碼
// 需要部署為Web應用程式，允許匿名存取

// CORS 支援函式
function createCorsResponse(result, callback) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${result})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT)
      .setHeaders(headers);
  } else {
    return ContentService
      .createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

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
      
      return createCorsResponse(result, callback);
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      return createCorsResponse(result, callback);
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
      return createCorsResponse(result, callback);
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      return createCorsResponse(result, callback);
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
      return createCorsResponse(result, callback);
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      return createCorsResponse(result, callback);
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
      
      return createCorsResponse(result, callback);
    } catch (error) {
      const result = JSON.stringify({ success: false, error: error.toString() });
      return createCorsResponse(result, callback);
    }
  }
  
  const result = JSON.stringify({ message: "蝦皮檢貨系統 API 運行中" });
  return createCorsResponse(result, callback);
}