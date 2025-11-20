import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import admin from "../config/firebaseAdmin.js";

const router = express.Router();

const checkAdminRole = async (req, res, next) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, req.firebaseUser.uid)
      .query("SELECT RoleID FROM Users WHERE FirebaseUserID = @FirebaseUserID");

    const roleID = result.recordset[0]?.RoleID;

    if (roleID === 1 || roleID === 2) {
      next();
    } else {
      return res.status(403).json({ message: "Bạn không có quyền truy cập." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi kiểm tra quyền admin." });
  }
};

router.get("/users/candidates", checkAuth, checkAdminRole, async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        u.FirebaseUserID, u.Email, u.DisplayName, u.PhotoURL, u.IsVerified, u.IsBanned, u.CreatedAt,
        cp.FullName, cp.PhoneNumber, cp.Address, cp.ProfileSummary, cp.Birthday
      FROM Users u
      LEFT JOIN CandidateProfiles cp ON u.FirebaseUserID = cp.UserID
      WHERE u.RoleID = 4
      ORDER BY u.CreatedAt DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy danh sách ứng viên." });
  }
});

router.get("/users/employers", checkAuth, checkAdminRole, async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        u.FirebaseUserID, u.Email, u.DisplayName, u.PhotoURL, u.IsVerified, u.IsBanned, u.CreatedAt,
        c.CompanyName, c.CompanyEmail, c.CompanyPhone, c.WebsiteURL, c.LogoURL, c.Address as CompanyAddress, c.City, c.Country, c.CompanyDescription
      FROM Users u
      LEFT JOIN Companies c ON u.FirebaseUserID = c.OwnerUserID
      WHERE u.RoleID = 3
      ORDER BY u.CreatedAt DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi lấy danh sách nhà tuyển dụng." });
  }
});

router.delete("/users/:uid", checkAuth, async (req, res) => {
  const { uid } = req.params;

  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, uid)
      .query("DELETE FROM Users WHERE FirebaseUserID = @FirebaseUserID");

    await admin.auth().deleteUser(uid);

    res.status(200).json({ message: "Đã xóa tài khoản thành công." });
  } catch (error) {
    console.error("Lỗi khi xóa user:", error);
    res.status(500).json({ message: "Lỗi server khi xóa tài khoản." });
  }
});

router.put("/users/:uid/ban", checkAuth, async (req, res) => {
  const { uid } = req.params;
  const { isBanned } = req.body;

  try {
    const pool = await sql.connect(sqlConfig);
    await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, uid)
      .input("IsBanned", sql.Bit, isBanned)
      .query(
        "UPDATE Users SET IsBanned = @IsBanned WHERE FirebaseUserID = @FirebaseUserID"
      );

    await admin.auth().updateUser(uid, { disabled: isBanned });

    res.status(200).json({
      message: isBanned ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.",
    });
  } catch (error) {
    console.error("Lỗi ban user:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;
