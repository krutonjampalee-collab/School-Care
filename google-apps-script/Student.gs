/**
 * Smart Home Visit System : School Edition
 * Student Management API (Student.gs)
 */

function queryStudents(page, search, limit = 50, filterClass = "") {
  try {
    const students = getSheetData(SHEETS.STUDENTS);
    let queried = students;
    
    // Filter by search terms (prefix, postfix match)
    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      queried = queried.filter(s => 
        String(s.StudentCode).includes(q) || 
        String(s.FirstName).toLowerCase().includes(q) || 
        String(s.LastName).toLowerCase().includes(q) || 
        String(s.CitizenID).includes(q)
      );
    }
    
    // Filter by classroom (e.g., M.1/1)
    if (filterClass && filterClass !== "") {
      queried = queried.filter(s => s.Classroom === filterClass);
    }
    
    // Pagination calculation
    const totalRecords = queried.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = queried.slice(startIndex, endIndex);
    
    return {
      success: true,
      records: paginated,
      totalCount: totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function saveStudent(studentData) {
  try {
    const now = new Date().toISOString();
    const students = getSheetData(SHEETS.STUDENTS);
    
    // Prevent duplicate StudentCode or CitizenID
    if (!studentData.StudentID) { // Insertion
      const codeExists = students.some(s => s.StudentCode === studentData.StudentCode);
      const citizenExists = students.some(s => s.CitizenID === studentData.CitizenID);
      
      if (codeExists) return { success: false, message: "รหัสนักเรียนซ้ำกันในระบบ" };
      if (citizenExists) return { success: false, message: "รหัสบัตรประชาชนซ้ำกันในระบบ" };
      
      const count = students.length + 1;
      studentData.StudentID = "STU" + String(count).padStart(5, "0");
      studentData.CreatedDate = now;
      studentData.UpdatedDate = now;
      
      appendToSheet(SHEETS.STUDENTS, studentData);
      logActivity(studentData.CreatedBy || "USER", "ADD_STUDENT", `เพิ่มข้อมูลนักเรียน: ${studentData.FirstName} ${studentData.LastName}`);
      return { success: true, message: "เพิ่มข้อมูลนักเรียนสำเร็จ" , studentId: studentData.StudentID };
    } else { // Editing
      studentData.UpdatedDate = now;
      const success = updateSheetRow(SHEETS.STUDENTS, "StudentID", studentData.StudentID, studentData);
      if (success) {
        logActivity("USER", "EDIT_STUDENT", `แก้ไขข้อมูลนักเรียน ID: ${studentData.StudentID}`);
        return { success: true, message: "แก้ไขข้อมูลสำเร็จ" };
      }
      return { success: false, message: "ไม่พบข้อมูลนักเรียนที่แก้ไข" };
    }
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteStudent(studentId) {
  try {
    const success = deleteSheetRow(SHEETS.STUDENTS, "StudentID", studentId);
    if (success) {
      logActivity("USER", "DELETE_STUDENT", `ลบชื่อนักเรียนมุ่งสู่นอกระบบ ID: ${studentId}`);
      return { success: true, message: "ลบข้อมูลสำเร็จ" };
    }
    return { success: false, message: "ลบข้อมูลล้มเหลว/ไม่พบตัวตน" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Handle import JSON data payload from client sides
 */
function importStudentsBulk(studentsList, creator) {
  try {
    const currentStudents = getSheetData(SHEETS.STUDENTS);
    const codeSet = new Set(currentStudents.map(s => String(s.StudentCode)));
    const citizenSet = new Set(currentStudents.map(s => String(s.CitizenID)));
    
    const now = new Date().toISOString();
    let numSynced = 0;
    let numError = 0;
    
    studentsList.forEach((s) => {
      if (codeSet.has(String(s.StudentCode)) || citizenSet.has(String(s.CitizenID))) {
        numError++;
        return; // skip duplicate entries
      }
      
      let nextId = "STU" + String(currentStudents.length + numSynced + 1).padStart(5, "0");
      let item = {
        StudentID: nextId,
        StudentCode: String(s.StudentCode),
        CitizenID: String(s.CitizenID),
        Prefix: s.Prefix || "",
        FirstName: s.FirstName || "",
        LastName: s.LastName || "",
        Gender: s.Gender || "",
        BirthDate: s.BirthDate || "",
        Age: s.Age || "",
        Grade: s.Grade || "",
        Classroom: s.Classroom || "",
        Number: s.Number || "",
        ParentName: s.ParentName || "",
        ParentPhone: s.ParentPhone || "",
        Address: s.Address || "",
        PhotoURL: s.PhotoURL || "",
        Status: s.Status || "Active",
        CreatedBy: creator || "ADMIN",
        CreatedDate: now,
        UpdatedDate: now
      };
      
      appendToSheet(SHEETS.STUDENTS, item);
      numSynced++;
    });
    
    logActivity(creator || "ADMIN", "IMPORT_STUDENTS", `นำเข้าไฟล์ประวัตินักเรียนสำเร็จ ${numSynced} คน (ข้อมูลซ้ำถูกข้าม ${numError} คน)`);
    return { success: true, count: numSynced, duplicate: numError };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Endpoint callback for Android API replication logic
 */
function handleSyncStudents(payload) {
  return importStudentsBulk(payload.students, payload.syncUser);
}
