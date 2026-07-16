/**
 * Smart Home Visit System : School Edition
 * Home Visit Form Submission & Drive Upload (HomeVisit.gs)
 */

/**
 * Handle submission of Br.01 form including image/signature processing
 */
function submitHomeVisit(visitData) {
  try {
    const now = new Date().toISOString();
    const folderId = CONFIG.DRIVE_FOLDER_ID;
    
    // Process base64 uploads (Photos & Signatures) if provided
    let housePhotoUrl = visitData.HousePhoto || "";
    let familyPhotoUrl = visitData.FamilyPhoto || "";
    let visitPhotoUrl = visitData.VisitPhoto || "";
    let teacherSignUrl = visitData.TeacherSignature || "";
    let parentSignUrl = visitData.ParentSignature || "";
    
    const studentCode = visitData.StudentCode || "STU";
    
    if (housePhotoUrl.startsWith("data:image")) {
      housePhotoUrl = saveBase64ToDrive(housePhotoUrl, `house_${studentCode}_${Date.now()}.jpg`, folderId);
    }
    if (familyPhotoUrl.startsWith("data:image")) {
      familyPhotoUrl = saveBase64ToDrive(familyPhotoUrl, `family_${studentCode}_${Date.now()}.jpg`, folderId);
    }
    if (visitPhotoUrl.startsWith("data:image")) {
      visitPhotoUrl = saveBase64ToDrive(visitPhotoUrl, `visit_${studentCode}_${Date.now()}.jpg`, folderId);
    }
    if (teacherSignUrl.startsWith("data:image")) {
      teacherSignUrl = saveBase64ToDrive(teacherSignUrl, `sign_teacher_${studentCode}_${Date.now()}.png`, folderId);
    }
    if (parentSignUrl.startsWith("data:image")) {
      parentSignUrl = saveBase64ToDrive(parentSignUrl, `sign_parent_${studentCode}_${Date.now()}.png`, folderId);
    }
    
    const visits = getSheetData(SHEETS.HOME_VISIT);
    let nextVisitId = visitData.VisitID;
    
    const visitRecord = {
      VisitID: nextVisitId || "VIS" + String(visits.length + 1).padStart(5, "0"),
      StudentID: visitData.StudentID,
      TeacherID: visitData.TeacherID,
      VisitDate: visitData.VisitDate || now.substring(0, 10),
      VisitRound: visitData.VisitRound || "1",
      Latitude: visitData.Latitude || "",
      Longitude: visitData.Longitude || "",
      GPS: visitData.GPS || `${visitData.Latitude},${visitData.Longitude}`,
      HousePhoto: housePhotoUrl,
      FamilyPhoto: familyPhotoUrl,
      VisitPhoto: visitPhotoUrl,
      TeacherSignature: teacherSignUrl,
      ParentSignature: parentSignUrl,
      Summary: visitData.Summary || "",
      Suggestion: visitData.Suggestion || "",
      RiskLevel: visitData.RiskLevel || "ปกติ", // ปกติ / เสี่ยง / มีปัญหา / เร่งด่วน
      Status: "Visited",
      CreatedDate: visitData.CreatedDate || now,
      UpdatedDate: now
    };
    
    if (!nextVisitId) {
      appendToSheet(SHEETS.HOME_VISIT, visitRecord);
    } else {
      updateSheetRow(SHEETS.HOME_VISIT, "VisitID", nextVisitId, visitRecord);
    }
    
    // If student is categorized as 'เสี่ยง' / 'มีปัญหา' / 'เร่งด่วน', record in RiskGroups automatically!
    if (visitRecord.RiskLevel !== "ปกติ") {
      logRiskGroup({
        StudentID: visitRecord.StudentID,
        RiskType: "วิเคราะห์จากการเยี่ยมบ้าน (บร.01)",
        RiskLevel: visitRecord.RiskLevel,
        Description: visitRecord.Summary,
        ActionPlan: visitRecord.Suggestion,
        FollowUpDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // Next 15 days
        Status: "Pending"
      });
    }
    
    // Log activity
    logActivity(visitRecord.TeacherID, "HOME_VISIT_SUBMIT", `บันทึกแบบฟอร์ม บร.01 ของนักเรียน ID: ${visitRecord.StudentID} ระดับความเสี่ยง [${visitRecord.RiskLevel}]`);
    
    return { success: true, message: "บันทึกแบบฟอร์ม บร.01 เข้าสู่ระบบสำเร็จ", visitId: visitRecord.VisitID };
  } catch (err) {
    return { success: false, message: "เกิดข้อผิดพลาดในการบันทึกฟอร์ม: " + err.message };
  }
}

/**
 * Handle batch uploading of local offline visits synced from Android code
 */
function handleSyncHomeVisits(payload) {
  const results = [];
  if (payload && payload.visits) {
    payload.visits.forEach(v => {
      const result = submitHomeVisit(v);
      results.push(result);
    });
  }
  return results;
}

/**
 * Convert Base64 data string to Drive file and return shared viewer web link
 */
function saveBase64ToDrive(base64Str, filename, folderId) {
  try {
    const parts = base64Str.split(",");
    const metadata = parts[0];
    const base64Data = parts[1];
    const contentType = metadata.split(";")[0].split(":")[1];
    
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, contentType, filename);
    
    const parentFolder = DriveApp.getFolderById(folderId);
    const file = parentFolder.createFile(blob);
    
    // Set view sharing permission to enable loading in reports / admin viewports
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    
    // Get downloadable stream URL
    return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
  } catch (err) {
    // Return empty fallback on error
    return "";
  }
}

function logRiskGroup(riskObj) {
  try {
    const sheet = getDb().getSheetByName(SHEETS.RISK_GROUPS);
    const rows = sheet.getDataRange().getValues();
    
    const nextRiskId = "RSK" + String(rows.length).padStart(4, "0");
    const newRecord = {
      RiskID: nextRiskId,
      StudentID: riskObj.StudentID,
      RiskType: riskObj.RiskType,
      RiskLevel: riskObj.RiskLevel,
      Description: riskObj.Description,
      ActionPlan: riskObj.ActionPlan,
      FollowUpDate: riskObj.FollowUpDate,
      Status: "Pending"
    };
    
    appendToSheet(SHEETS.RISK_GROUPS, newRecord);
  } catch (err) {
    // Fail silently
  }
}
