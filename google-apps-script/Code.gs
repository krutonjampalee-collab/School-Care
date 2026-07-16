/**
 * Smart Home Visit System : School Edition
 * Core Orchestrator (Code.gs)
 */

function doGet(e) {
  // Always verify database structure on access
  initDatabase();
  
  const template = HtmlService.createTemplateFromFile("index");
  // Set global setup variables for UI rendering
  template.systemName = CONFIG.SYSTEM_NAME;
  template.schoolName = CONFIG.SCHOOL_NAME;
  
  return template.evaluate()
    .setTitle(CONFIG.SYSTEM_NAME)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utility function to dynamically pull partial templates in App Script Spark Views
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    return `<!-- Failed to include: ${filename} (Does it exist?) -->`;
  }
}

/**
 * Common entry endpoint for JSON-RPC API called from Android Native App clients
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;
    let response = { success: false, data: null, error: "Action Unknown" };

    switch (action) {
      case "sync_students":
        response = { success: true, data: handleSyncStudents(payload) };
        break;
      case "sync_home_visits":
        response = { success: true, data: handleSyncHomeVisits(payload) };
        break;
      case "get_initial_data":
        response = { success: true, data: {
          config: getSheetData(SHEETS.CONFIG),
          teachers: getSheetData(SHEETS.TEACHERS),
          students: getSheetData(SHEETS.STUDENTS),
          visits: getSheetData(SHEETS.HOME_VISIT)
        }};
        break;
      default:
        break;
    }
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
