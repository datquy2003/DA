import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import ForgotPassword from "./pages/ForgotPassword";

const Home = () => {
  const { appUser, logout } = useAuth();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Trang chủ</h1>
      <p>Chào mừng, {appUser?.DisplayName}!</p>
      <p>Vai trò của bạn là: {appUser?.RoleID}</p>
      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Đăng xuất
      </button>
    </div>
  );
};

function App() {
  const { firebaseUser, appUser } = useAuth();

  const isAuthenticated = firebaseUser && appUser;
  const isNewUser = firebaseUser && !appUser;

  return (
    <Routes>
      <Route
        path="/login"
        element={!firebaseUser ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!firebaseUser ? <Register /> : <Navigate to="/" />}
      />
      <Route
        path="/choose-role"
        element={isNewUser ? <ChooseRole /> : <Navigate to="/" />}
      />
      <Route
        path="/forgot-password"
        element={!firebaseUser ? <ForgotPassword /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} />}
      />
    </Routes>
  );
}

export default App;
