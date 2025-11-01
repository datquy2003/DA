import express from "express";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// === CẬP NHẬT API [GET] /me (Đã thêm logic lọc 'email') ===
// ======================================================
router.get("/me", checkAuth, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;
    const providerData = req.firebaseUser.firebase.identities;

    // === LOGIC MỚI BẮT ĐẦU TẠI ĐÂY ===
    // 1. Lấy danh sách tất cả các key provider (vd: ['google.com', 'email'])
    const allProviders = Object.keys(providerData);
    // 2. Kiểm tra xem có provider OAuth (Google/Facebook) nào không
    const hasOAuth = allProviders.some(
      (p) => p === "google.com" || p === "facebook.com"
    );
    // === LOGIC MỚI KẾT THÚC ===

    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. KIỂM TRA BẢNG "CHA" (Users) TRƯỚC
      const userResult = await transaction
        .request()
        .input("FirebaseUserID", sql.NVarChar, firebaseUid)
        .query("SELECT * FROM Users WHERE FirebaseUserID = @FirebaseUserID");

      if (userResult.recordset.length > 0) {
        // 2. NẾU USER TỒN TẠI (Đăng nhập cũ) -> ĐỒNG BỘ BẢNG "CON" (UserProviders)
        for (const providerId in providerData) {
          // === LOGIC MỚI: BỎ QUA 'email' NẾU CÓ OAUTH ===
          if (providerId === "email" && hasOAuth) {
            continue; // Bỏ qua vòng lặp này, không thêm 'email'
          }
          // === HẾT LOGIC MỚI ===

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
        // 3. NẾU USER KHÔNG TỒN TẠI (Đăng nhập lần đầu) -> BÁO 404
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

// ======================================================
// === CẬP NHẬT API [POST] /register (Đã thêm logic lọc 'email') ===
// ======================================================
router.post("/register", checkAuth, async (req, res) => {
  const { roleID } = req.body;
  const { uid, email, name, firebase } = req.firebaseUser;
  const providerData = firebase.identities;

  // === LOGIC MỚI BẮT ĐẦU TẠI ĐÂY ===
  const allProviders = Object.keys(providerData);
  const hasOAuth = allProviders.some(
    (p) => p === "google.com" || p === "facebook.com"
  );
  // === LOGIC MỚI KẾT THÚC ===

  if (!roleID) {
    return res.status(400).json({ message: "Vui lòng chọn vai trò (RoleID)." });
  }

  try {
    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. TẠO BẢN GHI "CHA" (Users) TRƯỚC
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

      // 2. TẠO BẢN GHI "CON" (UserProviders) NGAY SAU ĐÓ
      for (const providerId in providerData) {
        // === LOGIC MỚI: BỎ QUA 'email' NẾU CÓ OAUTH ===
        if (providerId === "email" && hasOAuth) {
          continue; // Bỏ qua vòng lặp này, không thêm 'email'
        }
        // === HẾT LOGIC MỚI ===

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
