/**
 * Smart Home Visit System : School Edition
 * Audits & Logging Utilities (Utility.gs)
 */

function logActivity(userId, action, detail) {
  try {
    const logs = getSheetData(SHEETS.ACTIVITY_LOGS);
    const nextLogId = "LOG" + String(logs.length + 1).padStart(5, "0");
    const timestamp = new Date().toISOString();
    
    const newLog = {
      LogID: nextLogId,
      UserID: userId || "SYSTEM",
      Action: action,
      Detail: detail,
      IPAddress: "127.0.0.1", // Standard inside App Script context
      Timestamp: timestamp
    };
    appendToSheet(SHEETS.ACTIVITY_LOGS, newLog);
    return true;
  } catch (err) {
    return false;
  }
}

function addNotification(title, message, targetUserId) {
  try {
    const notifications = getSheetData(SHEETS.NOTIFICATIONS);
    const nextNotifyId = "NOT" + String(notifications.length + 1).padStart(5, "0");
    const now = new Date().toISOString();
    
    const newNotification = {
      NotifyID: nextNotifyId,
      Title: title,
      Message: message,
      UserID: targetUserId || "ALL",
      Status: "Unread",
      CreatedDate: now
    };
    appendToSheet(SHEETS.NOTIFICATIONS, newNotification);
    return true;
  } catch (err) {
    return false;
  }
}

function getNotificationsForUser(userId) {
  try {
    const list = getSheetData(SHEETS.NOTIFICATIONS);
    return { success: true, records: list.filter(n => n.UserID === userId || n.UserID === "ALL") };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
