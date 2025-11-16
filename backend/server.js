import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "mssql";
import { sqlConfig } from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import candidateRoutes from "./src/routes/candidateRoutes.js";
import companyRoutes from "./src/routes/companyRoutes.js";
import utilsRoutes from "./src/routes/utilsRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/utils", utilsRoutes);

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Backend đã kết nối thành công!" });
});

app.listen(port, async () => {
  try {
    await sql.connect(sqlConfig);
    console.log("✅ Đã kết nối thành công tới CSDL (SQL Server)!");
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
  } catch (err) {
    console.error("❌ LỖI KHI KẾT NỐI CSDL:", err.message);
  }
});
