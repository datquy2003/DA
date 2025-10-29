import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("Đang tải...");

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    axios
      .get(`${apiUrl}/api/test`)
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Lỗi khi gọi API:", error);
        setMessage("Kết nối đến Backend thất bại!");
      });
  }, [apiUrl]);
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Trang web Tìm kiếm việc làm</h1>
      <p>
        Trạng thái kết nối: <strong>{message}</strong>
      </p>
    </div>
  );
}

export default App;
