import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;

  try {
    const pool = await sql.connect(sqlConfig);

    const profileResult = await pool
      .request()
      .input("UserID", sql.NVarChar, firebaseUid)
      .query("SELECT * FROM CandidateProfiles WHERE UserID = @UserID");

    if (profileResult.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ." });
    }

    const profile = profileResult.recordset[0];

    const specsResult = await pool
      .request()
      .input("CandidateID", sql.NVarChar, firebaseUid).query(`
        SELECT s.SpecializationID, s.SpecializationName, s.CategoryID
        FROM CandidateSpecializations cs
        JOIN Specializations s ON cs.SpecializationID = s.SpecializationID
        WHERE cs.CandidateID = @CandidateID
      `);

    profile.Specializations = specsResult.recordset;

    res.status(200).json(profile);
  } catch (error) {
    console.error("Lỗi GET /candidates/me:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

router.put("/me", checkAuth, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid;
  const {
    FullName,
    PhoneNumber,
    Birthday,
    Address,
    ProfileSummary,
    IsSearchable,
    SpecializationIDs,
  } = req.body;

  if (
    SpecializationIDs &&
    Array.isArray(SpecializationIDs) &&
    SpecializationIDs.length > 5
  ) {
    return res
      .status(400)
      .json({ message: "Bạn chỉ được chọn tối đa 5 chuyên môn." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      await transaction
        .request()
        .input("UserID", sql.NVarChar, firebaseUid)
        .input("FullName", sql.NVarChar, FullName || null)
        .input("PhoneNumber", sql.NVarChar, PhoneNumber || null)
        .input("Birthday", sql.Date, Birthday || null)
        .input("Address", sql.NVarChar, Address || null)
        .input("ProfileSummary", sql.NText, ProfileSummary || null)
        .input("IsSearchable", sql.Bit, IsSearchable ?? 0).query(`
          MERGE INTO CandidateProfiles AS target
          USING (VALUES (@UserID)) AS source (UserID)
          ON (target.UserID = source.UserID)
          WHEN MATCHED THEN
            UPDATE SET 
              FullName = @FullName,
              PhoneNumber = @PhoneNumber,
              Birthday = @Birthday,
              Address = @Address,
              ProfileSummary = @ProfileSummary,
              IsSearchable = @IsSearchable
          WHEN NOT MATCHED BY TARGET THEN
            INSERT (UserID, FullName, PhoneNumber, Birthday, Address, ProfileSummary, IsSearchable)
            VALUES (@UserID, @FullName, @PhoneNumber, @Birthday, @Address, @ProfileSummary, @IsSearchable);
        `);

      if (SpecializationIDs && Array.isArray(SpecializationIDs)) {
        await transaction
          .request()
          .input("CandidateID", sql.NVarChar, firebaseUid)
          .query(
            "DELETE FROM CandidateSpecializations WHERE CandidateID = @CandidateID"
          );

        for (const specId of SpecializationIDs) {
          await transaction
            .request()
            .input("CandidateID", sql.NVarChar, firebaseUid)
            .input("SpecializationID", sql.Int, specId).query(`
              INSERT INTO CandidateSpecializations (CandidateID, SpecializationID)
              VALUES (@CandidateID, @SpecializationID)
            `);
        }
      }

      await transaction.commit();
      res.status(200).json({ message: "Cập nhật hồ sơ thành công." });
    } catch (transError) {
      await transaction.rollback();
      console.error("Transaction Error:", transError);
      throw transError;
    }
  } catch (error) {
    console.error("Lỗi PUT /candidates/me:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật hồ sơ." });
  }
});

export default router;