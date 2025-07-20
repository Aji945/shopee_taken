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
        if (values[i][1] === productName && values[i][3] === specName) {
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
        if (values[i][1] === productName && values[i][3] === specName) {
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