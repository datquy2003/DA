import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "leaflet/dist/leaflet.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseRole from "./pages/ChooseRole";
import ForgotPassword from "./pages/ForgotPassword";
import MainLayout from "./components/MainLayout";
import ProfileEdit from "./pages/ProfileEdit";

const HomeCandidate = () => <div>Trang chủ ỨNG VIÊN (Role 4)</div>;
const HomeEmployer = () => <div>Trang chủ NHÀ TUYỂN DỤNG (Role 3)</div>;
const HomeAdmin = () => <div>Trang chủ ADMIN (Role 1 & 2)</div>;

const CvManagement = () => <div>Trang Quản lý CV</div>;
const AppliedJobs = () => <div>Trang Việc đã ứng tuyển</div>;
const FavoriteJobs = () => <div>Trang Việc yêu thích</div>;
const BlockedCompanies = () => <div>Trang Công ty đã chặn</div>;
const CandidateSubscription = () => <div>Trang Gói dịch vụ ỨNG VIÊN</div>;

const JobManagement = () => <div>Trang Quản lý tin tuyển dụng</div>;
const ApplicantManagement = () => <div>Trang Ứng viên ứng tuyển</div>;
const SearchCandidates = () => <div>Trang Tìm kiếm ứng viên</div>;
const EmployerSubscription = () => <div>Trang Gói VIP NHÀ TUYỂN DỤNG</div>;

const Messages = () => <div>Trang Nhắn tin</div>;
const Notifications = () => <div>Trang Thông báo</div>;
const VipUpgrade = () => <div>Trang Nâng cấp VIP (Chung)</div>;

const RoleBasedHome = () => {
  const { appUser } = useAuth();
  switch (appUser?.RoleID) {
    case 4:
      return <HomeCandidate />;
    case 3:
      return <HomeEmployer />;
    case 2:
    case 1:
      return <HomeAdmin />;
    default:
      return <div>Đang tải trang chủ...</div>;
  }
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
        path="/forgot-password"
        element={!firebaseUser ? <ForgotPassword /> : <Navigate to="/" />}
      />
      <Route
        path="/choose-role"
        element={isNewUser ? <ChooseRole /> : <Navigate to="/" />}
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
        <Route index element={<RoleBasedHome />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile-edit" element={<ProfileEdit />} />{" "}
        <Route path="vip-upgrade" element={<VipUpgrade />} />
        <Route path="candidate/cvs" element={<CvManagement />} />
        <Route path="candidate/applied-jobs" element={<AppliedJobs />} />
        <Route path="candidate/favorite-jobs" element={<FavoriteJobs />} />
        <Route
          path="candidate/blocked-companies"
          element={<BlockedCompanies />}
        />
        <Route
          path="candidate/subscription"
          element={<CandidateSubscription />}
        />
        <Route path="employer/jobs" element={<JobManagement />} />
        <Route path="employer/applicants" element={<ApplicantManagement />} />
        <Route
          path="employer/search-candidates"
          element={<SearchCandidates />}
        />
        <Route
          path="employer/subscription"
          element={<EmployerSubscription />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
