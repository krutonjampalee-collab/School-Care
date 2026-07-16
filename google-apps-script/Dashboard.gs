/**
 * Smart Home Visit System : School Edition
 * Dashboard Analytics aggregator (Dashboard.gs)
 */

function getDashboardStats() {
  try {
    const students = getSheetData(SHEETS.STUDENTS);
    const teachers = getSheetData(SHEETS.TEACHERS);
    const visits = getSheetData(SHEETS.HOME_VISIT);
    const risks = getSheetData(SHEETS.RISK_GROUPS);
    
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    
    // Checked vs Unchecked
    const visitedStudentIds = new Set(visits.map(v => String(v.StudentID)));
    const visitedCount = visitedStudentIds.size;
    const unvisitedCount = Math.max(0, totalStudents - visitedCount);
    
    // Risk categorizations based on visits
    const riskLevels = { "ปกติ": 0, "เสี่ยง": 0, "มีปัญหา": 0, "เร่งด่วน": 0 };
    visits.forEach(v => {
      const level = v.RiskLevel || "ปกติ";
      if (riskLevels[level] !== undefined) {
        riskLevels[level]++;
      } else {
        riskLevels[level] = 1;
      }
    });
    
    // Include pending follow-ups counts
    const pendingFollowUps = risks.filter(r => r.Status === "Pending").length;
    
    // Class-wise statistics
    const classStats = {};
    students.forEach(s => {
      const cls = s.Classroom || "ไม่ระบุ";
      if (!classStats[cls]) {
        classStats[cls] = { total: 0, visited: 0 };
      }
      classStats[cls].total++;
      if (visitedStudentIds.has(String(s.StudentID))) {
        classStats[cls].visited++;
      }
    });
    
    return {
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        visitedCount,
        unvisitedCount,
        pendingFollowUps,
        riskLevels,
        classStats,
        visitRatio: totalStudents > 0 ? Math.round((visitedCount / totalStudents) * 100) : 0
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function getRecentLogs() {
  try {
    const logs = getSheetData(SHEETS.ACTIVITY_LOGS);
    // Return last 20 logs
    return { success: true, records: logs.slice(-20).reverse() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
