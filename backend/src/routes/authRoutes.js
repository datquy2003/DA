import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const getUidsForProvider = (firebaseIdentities, providerId) => {
  return firebaseIdentities[providerId] || [];
};

router.get("/me", checkAuth, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const firebaseIdentities = req.firebaseUser.firebase.identities || {};
    const firebaseProviderIds = Object.keys(firebaseIdentities);

    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const userResult = await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .query("SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID");

      if (userResult.recordset.length === 0) {
        await transaction.commit();
        return res
          .status(404)
          .json({ message: "User chưa có trong CSDL. Cần đăng ký role." });
      }

      await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .query(
          "UPDATE Users SET LastLoginAt = GETDATE() WHERE FirebaseUserID = @FirebaseUserID"
        );

      const sqlResult = await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .query(
          "SELECT ProviderID FROM UserProviders WHERE FirebaseUserID = @FirebaseUserID"
        );

      const sqlProviderIds = sqlResult.recordset.map((row) => row.ProviderID);

      const hasPasswordInDB = sqlProviderIds.includes("password");
      const hasOAuthInToken = firebaseProviderIds.some(
        (p) => p === "google.com" || p === "facebook.com"
      );

      let providersToSync = [...firebaseProviderIds];

      if (hasOAuthInToken && !hasPasswordInDB) {
        providersToSync = providersToSync.filter((p) => p !== "email");
      }

      let providersChanged = false;
      const sortedSqlProviders = [...sqlProviderIds].sort();
      const sortedSyncProviders = [...providersToSync].sort();

      if (
        sortedSqlProviders.length !== sortedSyncProviders.length ||
        sortedSqlProviders.join(",") !== sortedSyncProviders.join(",")
      ) {
        providersChanged = true;
      }

      for (const sqlProviderId of sqlProviderIds) {
        if (!providersToSync.includes(sqlProviderId)) {
          if (
            sqlProviderId === "google.com" ||
            sqlProviderId === "facebook.com"
          ) {
            await transaction
              .request()
              .input("FirebaseUserID", sql.NVarChar, firebaseUid)
              .input("ProviderID", sql.NVarChar, sqlProviderId)
              .query(
                "DELETE FROM UserProviders WHERE FirebaseUserID = @FirebaseUserID AND ProviderID = @ProviderID"
              );
          }
        }
      }

      for (const providerId of providersToSync) {
        const providerUids = getUidsForProvider(firebaseIdentities, providerId);

        for (const providerUidToSave of providerUids) {
          if (!providerUidToSave) continue;

          await transaction
            .request()
            .input("FirebaseUserID", sql.NVarChar, firebaseUid)
            .input("ProviderID", sql.NVarChar, providerId)
            .input("ProviderUID", sql.NVarChar, providerUidToSave).query(`
              MERGE INTO UserProviders AS target
              USING (VALUES (@FirebaseUserID, @ProviderID, @ProviderUID)) AS source (FirebaseUserID, ProviderID, ProviderUID)
              ON (target.FirebaseUserID = source.FirebaseUserID AND target.ProviderID = source.ProviderID AND target.ProviderUID = source.ProviderUID)
              WHEN MATCHED THEN
                UPDATE SET LinkedAt = GETDATE()
              WHEN NOT MATCHED BY TARGET THEN
                INSERT (FirebaseUserID, ProviderID, ProviderUID, LinkedAt)
                VALUES (source.FirebaseUserID, source.ProviderID, source.ProviderUID, GETDATE());
            `);
        }
      }

      if (providersChanged) {
        await transaction
          .request()
          .input("FirebaseUserID", sql.NVarChar, firebaseUid)
          .query(
            "UPDATE Users SET UpdatedAt = GETDATE() WHERE FirebaseUserID = @FirebaseUserID"
          );
      }

      await transaction.commit();
      res.status(200).json(userResult.recordset[0]);
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
  const firebaseIdentities = firebase.identities || {};
  const firebaseProviderIds = Object.keys(firebaseIdentities);

  const hasPasswordInToken = firebaseProviderIds.includes("password");
  const hasOAuthInToken = firebaseProviderIds.some(
    (p) => p === "google.com" || p === "facebook.com"
  );

  let providersToSync = [...firebaseProviderIds];
  if (hasOAuthInToken && !hasPasswordInToken) {
    providersToSync = providersToSync.filter((p) => p !== "email");
  }

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
          INSERT INTO Users (FirebaseUserID, Email, DisplayName, RoleID, CreatedAt, UpdatedAt)
          VALUES (@FirebaseUserID, @Email, @DisplayName, @RoleID, GETDATE(), GETDATE());
          SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID;
        `);

      for (const providerId of providersToSync) {
        const providerUids = getUidsForProvider(firebaseIdentities, providerId);
        for (const providerUidToSave of providerUids) {
          if (!providerUidToSave) continue;

          await transaction
            .request()
            .input("FirebaseUserID", sql.NVarChar, uid)
            .input("ProviderID", sql.NVarChar, providerId)
            .input("ProviderUID", sql.NVarChar, providerUidToSave).query(`
              INSERT INTO UserProviders (FirebaseUserID, ProviderID, ProviderUID, LinkedAt)
              VALUES (@FirebaseUserID, @ProviderID, @ProviderUID, GETDATE());
            `);
        }
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
