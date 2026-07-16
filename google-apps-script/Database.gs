/**
 * Smart Home Visit System : School Edition
 * Database Initializer & Access Library (Database.gs)
 */

function getDb() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * Automatically inspects and creates missing sheets on first load
 */
function initDatabase() {
  const ss = getDb();
  
  const tables = {
    [SHEETS.CONFIG]: [
      "SchoolName", "SchoolCode", "DirectorName", "AcademicYear", "Semester", 
      "LogoURL", "FooterText", "Phone", "Email", "Website", "Address", "CreatedDate", "UpdatedDate"
    ],
    [SHEETS.USERS]: [
      "UserID", "TeacherID", "Username", "Password", "Email", "FullName", 
      "Position", "Role", "Phone", "ProfileImage", "Status", "LastLogin", "CreatedDate", "UpdatedDate"
    ],
    [SHEETS.TEACHERS]: [
      "TeacherID", "TeacherCode", "Prefix", "FullName", "Position", "Department", 
      "Phone", "Email", "ProfileImage", "AssignedGrade", "AssignedRoom", "Status", "CreatedDate", "UpdatedDate"
    ],
    [SHEETS.STUDENTS]: [
      "StudentID", "StudentCode", "CitizenID", "Prefix", "FirstName", "LastName", 
      "Gender", "BirthDate", "Age", "Grade", "Classroom", "Number", "ParentName", 
      "ParentPhone", "Address", "PhotoURL", "Status", "CreatedBy", "CreatedDate", "UpdatedDate"
    ],
    [SHEETS.HOME_VISIT]: [
      "VisitID", "StudentID", "TeacherID", "VisitDate", "VisitRound", "Latitude", "Longitude", 
      "GPS", "HousePhoto", "FamilyPhoto", "VisitPhoto", "TeacherSignature", "ParentSignature", 
      "Summary", "Suggestion", "RiskLevel", "Status", "CreatedDate", "UpdatedDate"
    ],
    [SHEETS.RISK_GROUPS]: [
      "RiskID", "StudentID", "RiskType", "RiskLevel", "Description", "ActionPlan", "FollowUpDate", "Status"
    ],
    [SHEETS.NOTIFICATIONS]: [
      "NotifyID", "Title", "Message", "UserID", "Status", "CreatedDate"
    ],
    [SHEETS.REPORTS]: [
      "ReportID", "ReportName", "GeneratedBy", "GeneratedDate", "FileURL"
    ],
    [SHEETS.ACTIVITY_LOGS]: [
      "LogID", "UserID", "Action", "Detail", "IPAddress", "Timestamp"
    ],
    [SHEETS.SYSTEM_SETTINGS]: [
      "Theme", "DarkMode", "PrimaryColor", "SecondaryColor", "LogoURL", "BannerURL", "FooterText", "UpdatedDate"
    ]
  };

  for (let tableName in tables) {
    let sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
      let headers = tables[tableName];
      sheet.appendRow(headers);
      
      // Styling Header Row
      let configRange = sheet.getRange(1, 1, 1, headers.length);
      configRange.setFontWeight("bold");
      configRange.setBackground("#1a73e8");
      configRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      
      // Apply column dimensions
      for (let i = 1; i <= headers.length; i++) {
        sheet.setColumnWidth(i, 150);
      }
      
      // Seed default/test data for critical lists
      seedDefaultData(tableName, sheet);
    }
  }
  return "Database synchronized successfully.";
}

function seedDefaultData(tableName, sheet) {
  const now = new Date().toISOString();
  if (tableName === SHEETS.CONFIG) {
    sheet.appendRow([
      CONFIG.SCHOOL_NAME, "10101234", "นางสมใจ นอบน้อม", "2569", "1",
      "https://cdn-icons-png.flaticon.com/512/2201/2201501.png", "ติดต่อโรงเรียน แผนกงานแนะแนว", 
      "02-123-4567", "school@example.ac.th", "www.school.example.ac.th", "กรุงเทพมหานคร", now, now
    ]);
  } else if (tableName === SHEETS.USERS) {
    // Default Admin User: admin / admin1234
    sheet.appendRow([
      "U001", "T001", "admin", "admin1234", "admin@school.ac.th", "นายสมศักดิ์ รักเรียน",
      "ครูใหญ่", "Admin", "081-234-5678", "", "Active", "", now, now
    ]);
  } else if (tableName === SHEETS.SYSTEM_SETTINGS) {
    sheet.appendRow([
      "Default", "false", "#1a73e8", "#34a853", 
      "https://cdn-icons-png.flaticon.com/512/2201/2201501.png", "", "ระบบดูแลช่วยเหลือและเยี่ยมบ้าน บร.01", now
    ]);
  }
}

/**
 * Clean data model helper for CRUD operations
 */
function getSheetData(sheetName) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    obj.rowNumber = i + 1; // 1-based, index 0 is header so row 2 is index 1
    data.push(obj);
  }
  return data;
}

function appendToSheet(sheetName, dataObj) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = [];
  for (let i = 0; i < headers.length; i++) {
    newRow.push(dataObj[headers[i]] !== undefined ? dataObj[headers[i]] : "");
  }
  sheet.appendRow(newRow);
  return true;
}

function updateSheetRow(sheetName, idColumnName, idValue, updateObj) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idColIndex = headers.indexOf(idColumnName);
  if (idColIndex === -1) return false;
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIndex]) === String(idValue)) {
      for (const key in updateObj) {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updateObj[key]);
        }
      }
      return true;
    }
  }
  return false;
}

function deleteSheetRow(sheetName, idColumnName, idValue) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) return false;
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idColIndex = headers.indexOf(idColumnName);
  if (idColIndex === -1) return false;
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idColIndex]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}
