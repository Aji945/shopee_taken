function clearDataAndShopeeHJRange() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // -------- 1️⃣ 清空當前作用工作表 A:Z（依 A+B 欄最末列）--------
  const sheet = ss.getActiveSheet();
  const lastRowA = sheet.getRange("A:A").getLastRow();
  const lastRowB = sheet.getRange("B:B").getLastRow();
  const lastRow = Math.max(lastRowA, lastRowB);

  if (lastRow > 0) {
    sheet.getRange(1, 1, lastRow, 26).clearContent(); // A=1, Z=26 共26欄
  }

  sheet.getRange("A1").setValue("請先點X清除後，在這裡貼上，並按+");

  // -------- 2️⃣ 清空「蝦皮」工作表中 H1:J到最後有資料的列 --------
  const shopee = ss.getSheetByName("蝦皮");
  if (!shopee) {
    Logger.log("⚠️ 找不到名為『蝦皮』的工作表");
    return;
  }

  const rangeHJ = shopee.getRange("H:J").getValues(); // 拿 H~J 全列資料
  let lastDataRow = 0;

  for (let i = rangeHJ.length - 1; i >= 0; i--) {
    const row = rangeHJ[i];
    if (row[0] !== "" || row[1] !== "" || row[2] !== "") {
      lastDataRow = i + 1; // 因為 index 是 0-based，要 +1 才是實際列號
      break;
    }
  }

  if (lastDataRow > 0) {
    shopee.getRange(1, 8, lastDataRow, 3).clearContent(); // 從 H1:J{last} 共 3欄
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
      const values = sheet.getRange('A:J').getValues();
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
      const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
      const values = sheet.getRange('A:J').getValues();
      
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
      
      const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
      const values = sheet.getRange('A:J').getValues();
      
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
      
      const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
      const values = sheet.getRange('A:J').getValues();
      
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
      
      // 清除H、I、J欄位
      const ranges = [`H${targetRow}`, `I${targetRow}`, `J${targetRow}`];
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
      
      const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
      const values = sheet.getRange('A:J').getValues();
      
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