import express from "express";
import { checkAuth } from "../middleware/authMiddleware.js";
import axios from "axios"; // <-- Import axios

const router = express.Router();

// KHÔNG CẦN Google Maps Client nữa
// const mapsClient = new Client({});

/**
 * @route   POST /api/utils/geocode
 * @desc    Chuyển địa chỉ (string) thành kinh độ, vĩ độ (DÙNG OPENSTREETMAP)
 * @access  Private
 */
router.post("/geocode", checkAuth, async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ message: "Vui lòng cung cấp địa chỉ." });
  }

  // --- THAY THẾ LOGIC CỦA GOOGLE BẰNG NOMINATIM ---
  try {
    // Mã hóa địa chỉ để dùng trong URL
    const encodedAddress = encodeURIComponent(address);

    // URL của API Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

    const response = await axios.get(nominatimUrl, {
      headers: {
        "User-Agent": "JOB_APPLICATION/1.0 (taquocviet1011@gmail.com)",
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];

      const location = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };

      res.status(200).json(location);
    } else {
      res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }
  } catch (error) {
    console.error("Lỗi Nominatim Geocoding:", error.message);
    res.status(500).json({ message: "Lỗi khi gọi API Geocoding." });
  }
});

export default router;
