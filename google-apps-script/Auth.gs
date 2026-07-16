/**
 * Smart Home Visit System : School Edition
 * Authentication & Security Manager (Auth.gs)
 */

function verifyLogin(usernameOrEmail, password) {
  try {
    const users = getSheetData(SHEETS.USERS);
    const user = users.find(u => 
      (u.Username === usernameOrEmail || u.Email === usernameOrEmail) && 
      u.Password === password
    );
    
    if (!user) {
      return { success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }
    
    if (user.Status !== "Active") {
      return { success: false, message: "บัญชีของคุณรอการอนุมัติการใช้งานจาก Admin" };
    }
    
    // Track Last Login
    const timestamp = new Date().toISOString();
    updateSheetRow(SHEETS.USERS, "UserID", user.UserID, { LastLogin: timestamp });
    
    // Log activity
    logActivity(user.UserID, "LOGIN", `ผู้ใช้ ${user.FullName} เข้าสู่ระบบสำเร็จ`);
    
    return {
      success: true,
      user: {
        userId: user.UserID,
        teacherId: user.TeacherID,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
        position: user.Position,
        phone: user.Phone,
        profileImage: user.ProfileImage
      }
    };
  } catch (e) {
    return { success: false, message: "เกิดข้อผิดพลาด: " + e.message };
  }
}

function registerUser(registerData) {
  try {
    const users = getSheetData(SHEETS.USERS);
    
    // Duplication Check
    const exists = users.some(u => u.Username === registerData.Username || u.Email === registerData.Email);
    if (exists) {
      return { success: false, message: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว" };
    }
    
    const count = users.length + 1;
    const nextUserId = "U" + String(count).padStart(3, "0");
    const now = new Date().toISOString();
    
    const newUser = {
      UserID: nextUserId,
      TeacherID: registerData.TeacherID || "",
      Username: registerData.Username,
      Password: registerData.Password,
      Email: registerData.Email,
      FullName: registerData.FullName,
      Position: registerData.Position || "ครูผู้ช่วย",
      Role: registerData.Role || "Teacher",
      Phone: registerData.Phone || "",
      ProfileImage: registerData.ProfileImage || "",
      Status: "Pending", // Default awaiting approval for Teachers
      LastLogin: "",
      CreatedDate: now,
      UpdatedDate: now
    };
    
    appendToSheet(SHEETS.USERS, newUser);
    
    // Notify Admin
    addNotification("สมัครสมาชิกรออนุมัติ", `ผู้ใช้ ${newUser.FullName} รอการอนุมัติสิทธิ์เข้าใช้งาน`, "U001");
    logActivity("SYSTEM", "REGISTER", `ครู ${newUser.FullName} ลงทะเบียนเข้าใช้ระบบ สังกัด TeacherID : ${newUser.TeacherID}`);
    
    return { success: true, message: "ลงทะเบียนสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติการใช้งาน" };
  } catch (e) {
    return { success: false, message: "ลงทะเบียนล้มเหลว: " + e.message };
  }
}

function getPendingUsers() {
  const users = getSheetData(SHEETS.USERS);
  return users.filter(u => u.Status === "Pending");
}

function approveUser(userId, approveState) {
  try {
    const timestamp = new Date().toISOString();
    const success = updateSheetRow(SHEETS.USERS, "UserID", userId, { 
      Status: approveState ? "Active" : "Rejected",
      UpdatedDate: timestamp
    });
    
    if (success) {
      logActivity("ADMIN", "APPROVE_USER", `อนุมัติผู้ใช้ ID: ${userId} เป็น ${approveState ? "Active" : "Rejected"}`);
      return { success: true, message: "ปรับปรุงสถานะผู้ใช้เรียบร้อยแล้ว" };
    }
    return { success: false, message: "ไม่พบผู้ใช้ที่ระบุ" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
