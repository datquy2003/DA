import admin from "../config/firebaseAdmin.js";

export const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có quyền truy cập. Vui lòng cung cấp token." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Lỗi xác thực token:", error);
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};
