import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import ForgotPassword from "./pages/ForgotPassword";
import MainLayout from "./components/MainLayout";

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
const CvManagement = () => <div>Trang Quản lý CV</div>;
const AppliedJobs = () => <div>Trang Việc đã ứng tuyển</div>;
const FavoriteJobs = () => <div>Trang Việc yêu thích</div>;
const BlockedCompanies = () => <div>Trang Công ty đã chặn</div>;
const Subscription = () => <div>Trang Gói dịch vụ</div>;
const Messages = () => <div>Trang Nhắn tin</div>;
const Notifications = () => <div>Trang Thông báo</div>;
const ProfileEdit = () => <div>Trang Chỉnh sửa thông tin</div>;
const VipUpgrade = () => <div>Trang Nâng cấp VIP</div>;

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
        element={
          isAuthenticated ? (
            <Home />
          ) : isNewUser ? (
            <Navigate to="/choose-role" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <MainLayout />
          ) : isNewUser ? (
            <Navigate to="/choose-role" />
          ) : (
            <Navigate to="/login" />
          )
        }
      >
        <Route index element={<Home />} />
        <Route path="candidate/cvs" element={<CvManagement />} />
        <Route path="candidate/applied-jobs" element={<AppliedJobs />} />
        <Route path="candidate/favorite-jobs" element={<FavoriteJobs />} />
        <Route
          path="candidate/blocked-companies"
          element={<BlockedCompanies />}
        />
        <Route path="candidate/subscription" element={<Subscription />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile-edit" element={<ProfileEdit />} />
        <Route path="vip-upgrade" element={<VipUpgrade />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
