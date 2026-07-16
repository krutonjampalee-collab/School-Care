/**
 * Smart Home Visit System : School Edition
 * Report Engine & Exporter (Report.gs)
 */

function generateVisitReportSummary(classroom) {
  try {
    const students = getSheetData(SHEETS.STUDENTS);
    const visits = getSheetData(SHEETS.HOME_VISIT);
    const visitsMap = {};
    
    visits.forEach(v => {
      visitsMap[String(v.StudentID)] = v;
    });
    
    let filteredStudents = students;
    if (classroom && classroom !== "") {
      filteredStudents = students.filter(s => s.Classroom === classroom);
    }
    
    const compilation = filteredStudents.map(s => {
      const visit = visitsMap[String(s.StudentID)];
      return {
        StudentCode: s.StudentCode,
        FullName: `${s.Prefix}${s.FirstName} ${s.LastName}`,
        Classroom: s.Classroom,
        Number: s.Number,
        Visited: visit ? "เยี่ยมแล้ว" : "ยังไม่ได้เยี่ยม",
        VisitDate: visit ? visit.VisitDate : "-",
        RiskLevel: visit ? visit.RiskLevel : "-",
        GPS: visit ? visit.GPS : "-",
        Summary: visit ? visit.Summary : "-"
      };
    });
    
    return { success: true, records: compilation };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Creates an offline/online backup snapshot file
 */
function backupDatabaseJson() {
  try {
    const data = {};
    for (const key in SHEETS) {
      data[SHEETS[key]] = getSheetData(SHEETS[key]);
    }
    const filename = `backup_visit_system_${Date.now()}.json`;
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const file = folder.createFile(filename, JSON.stringify(data), MimeType.PLAIN_TEXT);
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    
    // Log Backup task
    appendToSheet(SHEETS.REPORTS, {
      ReportID: "BCK" + Date.now(),
      ReportName: `Backup Database (System Full JSON)`,
      GeneratedBy: "ADMIN",
      GeneratedDate: new Date().toISOString(),
      FileURL: file.getUrl()
    });
    
    return { success: true, url: file.getUrl(), filename: filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
