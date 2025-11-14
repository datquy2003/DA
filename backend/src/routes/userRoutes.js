import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";
import path from "path";

const router = express.Router();

const normalizePath = (p) => (p ? p.replace(/\\/g, "/") : null);

router.put(
  "/me/base",
  checkAuth,
  uploadAvatar.single("photo"),
  async (req, res) => {
    const { displayName } = req.body;
    const firebaseUid = req.firebaseUser.uid;

    if (!displayName) {
      return res.status(400).json({ message: "DisplayName là bắt buộc." });
    }

    try {
      const pool = await sql.connect(sqlConfig);

      const userResult = await pool
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .query(
          "SELECT PhotoURL FROM Users WHERE FirebaseUserID = @FirebaseUserID"
        );

      let newPhotoURL = userResult.recordset[0]?.PhotoURL;

      if (req.file) {
        const relativePath = path.relative(process.cwd(), req.file.path);
        newPhotoURL = "/" + normalizePath(relativePath);
      }

      await pool
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .input("DisplayName", sql.NVarChar, displayName)
        .input("PhotoURL", sql.NVarChar, newPhotoURL).query(`
          UPDATE Users 
          SET 
            DisplayName = @DisplayName, 
            PhotoURL = @PhotoURL, 
            UpdatedAt = GETDATE()
          WHERE FirebaseUserID = @FirebaseUserID;
        `);

      const result = await pool
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid).query(`
          SELECT DisplayName, PhotoURL 
          FROM Users 
          WHERE FirebaseUserID = @FirebaseUserID;
        `);

      res.status(200).json(result.recordset[0]);
    } catch (error) {
      console.error("Lỗi khi cập nhật /users/me/base:", error.message);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }
);

export default router;
