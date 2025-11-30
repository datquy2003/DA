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

const checkSuperAdminRole = async (req, res, next) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool
      .request()
      .input("FirebaseUserID", sql.NVarChar, req.firebaseUser.uid)
      .query("SELECT RoleID FROM Users WHERE FirebaseUserID = @FirebaseUserID");

    const roleID = result.recordset[0]?.RoleID;

    if (roleID === 2) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Chỉ Super Admin mới có quyền này." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Lỗi kiểm tra quyền Super Admin." });
  }
};

router.get("/users/no-role", checkAuth, checkAdminRole, async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        FirebaseUserID, Email, DisplayName, PhotoURL, IsVerified, IsBanned, CreatedAt, LastLoginAt
      FROM Users
      WHERE RoleID IS NULL
      ORDER BY CreatedAt DESC
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách người dùng chưa chọn role." });
  }
});

router.get(
  "/users/:uid/subscriptions",
  checkAuth,
  checkAdminRole,
  async (req, res) => {
    const { uid } = req.params;
    try {
      const pool = await sql.connect(sqlConfig);
      const result = await pool.request().input("UserID", sql.NVarChar, uid)
        .query(`
        SELECT 
          us.SubscriptionID, us.StartDate, us.EndDate, us.Status, us.PaymentTransactionID,
          sp.PlanName, sp.Price, sp.PlanType, sp.DurationInDays
        FROM UserSubscriptions us
        JOIN SubscriptionPlans sp ON us.PlanID = sp.PlanID
        WHERE us.UserID = @UserID
        ORDER BY us.StartDate DESC
      `);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Lỗi lấy lịch sử VIP:", error);
      res.status(500).json({ message: "Lỗi server." });
    }
  }
);

router.get("/users/candidates", checkAuth, checkAdminRole, async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request().query(`
      SELECT 
        u.FirebaseUserID, u.Email, u.DisplayName, u.PhotoURL, u.IsVerified, u.IsBanned, u.CreatedAt, u.LastLoginAt,
        cp.FullName, cp.PhoneNumber, cp.Address, cp.ProfileSummary, cp.Birthday,
        (
          SELECT TOP 1 sp.PlanName 
          FROM UserSubscriptions us 
          JOIN SubscriptionPlans sp ON us.PlanID = sp.PlanID 
          WHERE us.UserID = u.FirebaseUserID AND us.Status = 1 AND us.EndDate > GETDATE()
          ORDER BY us.EndDate DESC
        ) AS CurrentVIP
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
        u.FirebaseUserID, u.Email, u.DisplayName, u.PhotoURL, u.IsVerified, u.IsBanned, u.CreatedAt, u.LastLoginAt,
        c.CompanyName, c.CompanyEmail, c.CompanyPhone, c.WebsiteURL, c.LogoURL, c.Address as CompanyAddress, c.City, c.Country, c.CompanyDescription,
        (
          SELECT TOP 1 sp.PlanName 
          FROM UserSubscriptions us 
          JOIN SubscriptionPlans sp ON us.PlanID = sp.PlanID 
          WHERE us.UserID = u.FirebaseUserID AND us.Status = 1 AND us.EndDate > GETDATE()
          ORDER BY us.EndDate DESC
        ) AS CurrentVIP
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

router.get(
  "/system-admins",
  checkAuth,
  checkSuperAdminRole,
  async (req, res) => {
    try {
      const pool = await sql.connect(sqlConfig);
      const result = await pool.request().query(`
        SELECT FirebaseUserID, Email, DisplayName, PhotoURL, IsBanned, CreatedAt, LastLoginAt, IsVerified
      FROM Users
      WHERE RoleID = 1
      ORDER BY CreatedAt DESC
    `);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("Lỗi lấy danh sách admin:", error);
      res.status(500).json({ message: "Lỗi server." });
    }
  }
);

router.post(
  "/system-admins",
  checkAuth,
  checkSuperAdminRole,
  async (req, res) => {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    try {
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: false,
      });

      const pool = await sql.connect(sqlConfig);
      await pool
        .request()
        .input("FirebaseUserID", sql.NVarChar, userRecord.uid)
        .input("Email", sql.NVarChar, email)
        .input("DisplayName", sql.NVarChar, displayName)
        .input("RoleID", sql.Int, 1)
        .input("IsVerified", sql.Bit, 0).query(`
          INSERT INTO Users (FirebaseUserID, Email, DisplayName, RoleID, IsVerified, CreatedAt, UpdatedAt)
          VALUES (@FirebaseUserID, @Email, @DisplayName, @RoleID, @IsVerified, GETDATE(), GETDATE())
        `);

      res
        .status(201)
        .json({ message: "Tạo tài khoản Admin thành công!", user: userRecord });
    } catch (error) {
      console.error("Lỗi tạo admin:", error);
      if (error.code === "auth/email-already-exists") {
        return res.status(400).json({ message: "Email này đã được sử dụng." });
      }
      res.status(500).json({ message: "Lỗi server khi tạo Admin." });
    }
  }
);

export default router;