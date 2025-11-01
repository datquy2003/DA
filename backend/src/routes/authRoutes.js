import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", checkAuth, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const providerData = req.firebaseUser.firebase.identities;

    const allProviders = Object.keys(providerData);
    const hasOAuth = allProviders.some(
      (p) => p === "google.com" || p === "facebook.com"
    );

    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const userResult = await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .query("SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID");

      if (userResult.recordset.length > 0) {
        for (const providerId in providerData) {
          if (providerId === "email" && hasOAuth) {
            continue;
          }

          const providerUid = providerData[providerId][0];
          await transaction
            .request()
            .input("FirebaseUserID", sql.NVarChar, firebaseUid)
            .input("ProviderID", sql.NVarChar, providerId)
            .input("ProviderUID", sql.NVarChar, providerUid).query(`
              MERGE INTO UserProviders AS target
              USING (VALUES (@FirebaseUserID, @ProviderID, @ProviderUID)) AS source (FirebaseUserID, ProviderID, ProviderUID)
              ON (target.FirebaseUserID = source.FirebaseUserID AND target.ProviderID = source.ProviderID)
              WHEN MATCHED THEN
                UPDATE SET ProviderUID = source.ProviderUID, LinkedAt = GETDATE()
              WHEN NOT MATCHED BY TARGET THEN
                INSERT (FirebaseUserID, ProviderID, ProviderUID, LinkedAt)
                VALUES (source.FirebaseUserID, source.ProviderID, source.ProviderUID, GETDATE());
            `);
        }

        await transaction.commit();
        res.status(200).json(userResult.recordset[0]);
      } else {
        await transaction.commit();
        res
          .status(404)
          .json({ message: "User chưa có trong CSDL. Cần đăng ký role." });
      }
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi đồng bộ /me", error: error.message });
  }
});

router.post("/register", checkAuth, async (req, res) => {
  const { roleID } = req.body;
  const { uid, email, name, firebase } = req.firebaseUser;
  const providerData = firebase.identities;

  const allProviders = Object.keys(providerData);
  const hasOAuth = allProviders.some(
    (p) => p === "google.com" || p === "facebook.com"
  );

  if (!roleID) {
    return res.status(400).json({ message: "Vui lòng chọn vai trò (RoleID)." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const userResult = await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, uid)
        .input("Email", sql.NVarChar, email)
        .input("DisplayName", sql.NVarChar, name || "Người dùng mới")
        .input("RoleID", sql.Int, roleID).query(`
          INSERT INTO Users (FirebaseUserID, Email, DisplayName, RoleID)
          VALUES (@FirebaseUserID, @Email, @DisplayName, @RoleID);
          SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID;
        `);

      for (const providerId in providerData) {
        if (providerId === "email" && hasOAuth) {
          continue;
        }

        const providerUid = providerData[providerId][0];
        await transaction
          .request()
          .input("FirebaseUserID", sql.NVarChar, uid)
          .input("ProviderID", sql.NVarChar, providerId)
          .input("ProviderUID", sql.NVarChar, providerUid).query(`
            INSERT INTO UserProviders (FirebaseUserID, ProviderID, ProviderUID, LinkedAt)
            VALUES (@FirebaseUserID, @ProviderID, @ProviderUID, GETDATE());
          `);
      }

      await transaction.commit();
      res.status(201).json(userResult.recordset[0]);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo user", error: error.message });
  }
});

export default router;
