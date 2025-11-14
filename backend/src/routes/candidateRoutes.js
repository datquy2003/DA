import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .query("SELECT * FROM CandidateProfiles WHERE UserID = @UserID");

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hồ sơ ứng viên." });
    }

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi GET /candidates/me:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.put("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;
  const {
    SpecializationID,
    FullName,
    PhoneNumber,
    Birthday,
    Address,
    ProfileSummary,
    IsSearchable,
  } = req.body;

  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .input("SpecializationID", sql.Int, SpecializationID || null)
      .input("FullName", sql.NVarChar, FullName || null)
      .input("PhoneNumber", sql.NVarChar, PhoneNumber || null)
      .input("Birthday", sql.Date, Birthday || null)
      .input("Address", sql.NVarChar, Address || null)
      .input("ProfileSummary", sql.NText, ProfileSummary || null)
      .input("IsSearchable", sql.Bit, IsSearchable || 0).query(`
        MERGE INTO CandidateProfiles AS target
        USING (VALUES (@UserID)) AS source (UserID)
        ON (target.UserID = source.UserID)
        WHEN MATCHED THEN
          UPDATE SET 
            SpecializationID = @SpecializationID,
            FullName = @FullName,
            PhoneNumber = @PhoneNumber,
            Birthday = @Birthday,
            Address = @Address,
            ProfileSummary = @ProfileSummary,
            IsSearchable = @IsSearchable
        WHEN NOT MATCHED BY TARGET THEN
          INSERT (UserID, SpecializationID, FullName, PhoneNumber, Birthday, Address, ProfileSummary, IsSearchable)
          VALUES (@UserID, @SpecializationID, @FullName, @PhoneNumber, @Birthday, @Address, @ProfileSummary, @IsSearchable)
        OUTPUT inserted.*;
      `);

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Lỗi khi PUT /candidates/me:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

export default router;
