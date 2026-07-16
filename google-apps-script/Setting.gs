/**
 * Smart Home Visit System : School Edition
 * Setting Management System (Setting.gs)
 */

function getSystemSettings() {
  try {
    const config = getSheetData(SHEETS.CONFIG)[0] || {};
    const settings = getSheetData(SHEETS.SYSTEM_SETTINGS)[0] || {};
    return { success: true, schoolConfig: config, themeSettings: settings };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function updateSchoolSettings(schoolData) {
  try {
    const now = new Date().toISOString();
    schoolData.UpdatedDate = now;
    
    // Config sheet has only one row of actual configuration data
    const success = updateSheetRow(SHEETS.CONFIG, "SchoolName", CONFIG.SCHOOL_NAME, schoolData);
    if (success) {
      logActivity("ADMIN", "UPDATE_SETTINGS", "ปรับแก้ไขข้อมูลพื้นฐานโรงเรียน");
      return { success: true, message: "ปรับปรุงข้อมูลหน่วยงานสำเร็จ" };
    }
    
    // If update failed (maybe different school name set), rewrite row 2
    const sheet = getDb().getSheetByName(SHEETS.CONFIG);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (let c = 0; c < headers.length; c++) {
      if (schoolData[headers[c]] !== undefined) {
        sheet.getRange(2, c + 1).setValue(schoolData[headers[c]]);
      }
    }
    return { success: true, message: "ปรับปรุงข้อมูลสำเร็จ" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateThemeSettings(themeData) {
  try {
    themeData.UpdatedDate = new Date().toISOString();
    const success = updateSheetRow(SHEETS.SYSTEM_SETTINGS, "Theme", "Default", themeData);
    if (success) {
      logActivity("ADMIN", "UPDATE_THEME", "เปลี่ยนธีมและสีประจำระบบงาน");
      return { success: true, message: "ปรับปรุงอัตลักษณ์หน้าจอสำเร็จ" };
    }
    return { success: false, message: "ไม่สามารถบันทึกข้อมูลธีมได้" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
