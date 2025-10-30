import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", checkAuth, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;

    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, firebaseUid)
      .query("SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID");

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res
        .status(404)
        .json({ message: "User chưa có trong CSDL. Cần đăng ký role." });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.post("/register", checkAuth, async (req, res) => {
  const { roleID } = req.body;
  const { uid, email, name } = req.firebaseUser;

  if (!roleID) {
    return res.status(400).json({ message: "Vui lòng chọn vai trò (RoleID)." });
  }

  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, uid)
      .input("Email", sql.NVarChar, email)
      .input("DisplayName", sql.NVarChar, name || "Người dùng mới")
      .input("RoleID", sql.Int, roleID).query(`
        INSERT INTO Users (FirebaseUserID, Email, DisplayName, RoleID)
        VALUES (@FirebaseUserID, @Email, @DisplayName, @RoleID);
        SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID;
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo user", error: error.message });
  }
});

export default router;
