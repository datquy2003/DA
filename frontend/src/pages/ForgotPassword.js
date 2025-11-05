import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setMessage(
        "Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư (kể cả spam)."
      );
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Không tìm thấy tài khoản nào được đăng ký với email này.");
      } else {
        setError("Gửi email thất bại. Vui lòng thử lại.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Quên Mật khẩu
        </h2>
        {message && (
          <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email đã đăng ký"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-semibold disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi Email Đặt Lại"}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-700">
          Nhớ mật khẩu?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-semibold"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};
export default ForgotPassword;
