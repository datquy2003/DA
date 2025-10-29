import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "mssql";
import { sqlConfig } from "./src/config/db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Backend đã kết nối thành công!" });
});

// TODO: Import và sử dụng các routes (vd: /api/jobs, /api/users)
// import jobRoutes from './src/routes/jobRoutes.js';
// app.use('/api/jobs', jobRoutes);

// ----- Khởi động Server và Kết nối DB -----
app.listen(port, async () => {
  try {
    await sql.connect(sqlConfig);
    console.log("✅ Đã kết nối thành công tới CSDL (SQL Server)!");
    console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
  } catch (err) {
    console.error("❌ LỖI KHI KẾT NỐI CSDL:", err.message);
  }
});
