/**
 * Smart Home Visit System : School Edition
 * Teacher Management API (Teacher.gs)
 */

function getTeachersList() {
  try {
    return { success: true, records: getSheetData(SHEETS.TEACHERS) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function saveTeacher(teacherData) {
  try {
    const now = new Date().toISOString();
    const teachers = getSheetData(SHEETS.TEACHERS);
    
    if (!teacherData.TeacherID) {
      // Validate code duplicate
      const duplicated = teachers.some(t => t.TeacherCode === teacherData.TeacherCode);
      if (duplicated) return { success: false, message: "รหัสวิทยฐานะนี้ซ้ำในระบบ" };
      
      const nextId = "T" + String(teachers.length + 1).padStart(3, "0");
      teacherData.TeacherID = nextId;
      teacherData.CreatedDate = now;
      teacherData.UpdatedDate = now;
      teacherData.Status = "Active";
      
      appendToSheet(SHEETS.TEACHERS, teacherData);
      logActivity("ADMIN", "ADD_TEACHER", `เพิ่มประวัติครูใหม่: ${teacherData.FullName}`);
      return { success: true, message: "เพิ่มประวัติครูสำเร็จ", id: nextId };
    } else {
      teacherData.UpdatedDate = now;
      const success = updateSheetRow(SHEETS.TEACHERS, "TeacherID", teacherData.TeacherID, teacherData);
      if (success) {
        logActivity("ADMIN", "EDIT_TEACHER", `แก้ไขประวัติครู: ${teacherData.FullName}`);
        return { success: true, message: "แก้ไขประวัติครูสำเร็จ" };
      }
      return { success: false, message: "ไม่พบประวัติระบุการบันทึก" };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteTeacher(teacherId) {
  try {
    const success = deleteSheetRow(SHEETS.TEACHERS, "TeacherID", teacherId);
    if (success) {
      logActivity("ADMIN", "DELETE_TEACHER", `ลบข้อมูลผู้สอนพ้นฐานการดูแล ID: ${teacherId}`);
      return { success: true, message: "ลบประวัติเวทียลุล่วง" };
    }
    return { success: false, message: "ลบล้มเหลวไม่พบรหัสผู้ใช้" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
