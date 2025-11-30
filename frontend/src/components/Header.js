import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/urlHelper";

import {
  FiBell,
  FiMessageSquare,
  FiChevronDown,
  FiEdit,
  FiStar,
  FiLogOut,
  FiBriefcase,
  FiFileText,
  FiHeart,
  FiSlash,
  FiPackage,
  FiHome,
  FiClipboard,
  FiUsers,
  FiSearch,
} from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";

const HeaderNavLink = ({ to, children }) => {
  const activeClass = "text-blue-600 font-semibold border-b-2 border-blue-600";
  const inactiveClass = "text-gray-600 hover:text-blue-600";

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `${
          isActive ? activeClass : inactiveClass
        } h-full flex items-center px-2`
      }
    >
      {children}
    </NavLink>
  );
};

const ProfileMenu = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { appUser, logout, firebaseUser } = useAuth();
  const dropdownRef = useRef(null);
  const isAdmin = appUser?.RoleID === 1 || appUser?.RoleID === 2;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const photoToDisplay = getImageUrl(
    appUser?.PhotoURL || firebaseUser?.photoURL
  );

  return (
    <div className="flex items-center space-x-5">
      {!isAdmin && (
        <Link
          to="/messages"
          className="relative text-gray-600 hover:text-blue-600"
        >
          <FiMessageSquare size={24} />
        </Link>
      )}
      {!isAdmin && (
        <Link
          to="/notifications"
          className="relative text-gray-600 hover:text-blue-600"
        >
          <FiBell size={24} />
        </Link>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
        >
          {photoToDisplay ? (
            <img
              src={photoToDisplay}
              alt="Avatar"
              className="object-cover rounded-full w-7 h-7"
            />
          ) : (
            <FaUserCircle size={28} className="text-gray-400" />
          )}
          <span className="hidden text-sm font-medium md:block">
            {appUser?.DisplayName || "Tài khoản"}
          </span>
          <FiChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 z-50 w-56 py-1 mt-2 bg-white border rounded-md shadow-lg">
            <Link
              to="/profile-edit"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsDropdownOpen(false)}
            >
              <FiEdit className="mr-2" /> Chỉnh sửa thông tin
            </Link>
            {!isAdmin && (
              <Link
                to="/vip-upgrade"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FiStar className="mr-2" /> Nâng cấp VIP
              </Link>
            )}
            <div className="my-1 border-t"></div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
            >
              <FiLogOut className="mr-2" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidateHeader = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex h-full space-x-6">
          <HeaderNavLink to="/">
            <FiHome className="mr-1.5" /> Trang chủ
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/cvs">
            <FiFileText className="mr-1.5" /> Quản lý CV
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/applied-jobs">
            <FiBriefcase className="mr-1.5" /> Việc đã ứng tuyển
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/favorite-jobs">
            <FiHeart className="mr-1.5" /> Việc yêu thích
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/blocked-companies">
            <FiSlash className="mr-1.5" /> Công ty đã chặn
          </HeaderNavLink>
          <HeaderNavLink to="/candidate/subscription">
            <FiPackage className="mr-1.5" /> Gói VIP
          </HeaderNavLink>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
};

const EmployerHeader = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex h-full space-x-6">
          <HeaderNavLink to="/">
            <FiHome className="mr-1.5" /> Trang chủ
          </HeaderNavLink>
          <HeaderNavLink to="/employer/jobs">
            <FiClipboard className="mr-1.5" /> Quản lý tin
          </HeaderNavLink>
          <HeaderNavLink to="/employer/applicants">
            <FiUsers className="mr-1.5" /> Ứng viên
          </HeaderNavLink>
          <HeaderNavLink to="/employer/search-candidates">
            <FiSearch className="mr-1.5" /> Tìm kiếm
          </HeaderNavLink>
          <HeaderNavLink to="/employer/subscription">
            <FiPackage className="mr-1.5" /> Gói VIP
          </HeaderNavLink>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
};

const AdminHeader = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex h-full space-x-6">
          <HeaderNavLink to="/admin/users">
            <FiHome className="mr-1.5" /> Trang chủ
          </HeaderNavLink>
        </div>
        <ProfileMenu />
      </div>
    </nav>
  );
};

const Header = () => {
  const { appUser } = useAuth();

  switch (appUser?.RoleID) {
    case 4:
      return <CandidateHeader />;
    case 3:
      return <EmployerHeader />;
    case 2:
      return <AdminHeader />;
    case 1:
      return <AdminHeader />;
    default:
      return null;
  }
};

export default Header;