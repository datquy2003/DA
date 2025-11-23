import React, { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import { getImageUrl } from "../../utils/urlHelper";
import {
  FiSearch,
  FiBriefcase,
  FiUser,
  FiPhone,
  FiMapPin,
  FiLock,
  FiUnlock,
  FiTrash2,
  FiInfo,
  FiX,
  FiGlobe,
  FiCalendar,
  FiMail,
  FiHelpCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const UserDetailModal = ({ user, type, onClose }) => {
  if (!user) return null;

  const isEmployer = type === "employers";
  const isNoRole = type === "no-role";
  const avatarUrl = getImageUrl(isEmployer ? user.LogoURL : user.PhotoURL);

  let title = "Hồ sơ Ứng viên";
  let TypeIcon = FiUser;
  if (isEmployer) {
    title = "Chi tiết Công ty";
    TypeIcon = FiBriefcase;
  } else if (isNoRole) {
    title = "Tài khoản chưa phân loại";
    TypeIcon = FiHelpCircle;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <TypeIcon className="mr-2" /> {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-200 rounded-full"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
            <img
              src={avatarUrl || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4 md:mb-0 md:mr-6 bg-gray-100"
            />
            <div className="text-center md:text-left flex-1 pt-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {isEmployer
                  ? user.CompanyName
                  : user.FullName || user.DisplayName}
              </h2>
              <p className="text-gray-500 mb-3">{user.Email}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.IsVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.IsVerified ? "Đã xác thực" : "Chưa xác thực"}
                </span>
                {user.IsBanned && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Đang bị khóa
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                  ID: {user.FirebaseUserID}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                Thông tin liên hệ
              </h4>

              <InfoItem
                icon={<FiMail />}
                label="Email đăng nhập"
                value={user.Email}
              />

              {!isNoRole && (
                <>
                  <InfoItem
                    icon={<FiPhone />}
                    label="Số điện thoại"
                    value={isEmployer ? user.CompanyPhone : user.PhoneNumber}
                  />
                  <InfoItem
                    icon={<FiMapPin />}
                    label="Địa chỉ"
                    value={isEmployer ? user.CompanyAddress : user.Address}
                  />
                </>
              )}

              {isEmployer && (
                <InfoItem
                  icon={<FiGlobe />}
                  label="Website"
                  value={user.WebsiteURL}
                  isLink
                />
              )}

              <InfoItem
                icon={<FiCalendar />}
                label="Ngày tham gia"
                value={new Date(user.CreatedAt).toLocaleDateString("vi-VN", {
                  timeZone: "UTC",
                })}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                {isEmployer ? "Thông tin doanh nghiệp" : "Thông tin cá nhân"}
              </h4>

              {isNoRole ? (
                <p className="text-sm text-gray-500 italic">
                  Tài khoản này chưa hoàn tất việc chọn vai trò (Ứng viên/Nhà
                  tuyển dụng). Chưa có thông tin hồ sơ chi tiết.
                </p>
              ) : isEmployer ? (
                <>
                  <InfoItem
                    label="Tên người đại diện"
                    value={user.DisplayName}
                  />
                  <InfoItem label="Thành phố" value={user.City} />
                  <InfoItem label="Quốc gia" value={user.Country} />
                </>
              ) : (
                <>
                  <InfoItem label="Tên hiển thị" value={user.DisplayName} />
                  <InfoItem
                    label="Ngày sinh"
                    value={
                      user.Birthday
                        ? new Date(user.Birthday).toLocaleDateString("vi-VN", {
                            timeZone: "UTC",
                          })
                        : null
                    }
                  />
                </>
              )}
            </div>

            {!isNoRole && (
              <div className="col-span-1 md:col-span-2 mt-2">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">
                  {isEmployer ? "Mô tả công ty" : "Giới thiệu bản thân"}
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto border border-gray-100">
                  {isEmployer
                    ? user.CompanyDescription || "Chưa có mô tả"
                    : user.ProfileSummary || "Chưa có giới thiệu"}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value, isLink }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 mb-1 flex items-center">
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </span>
    {isLink && value ? (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-blue-600 hover:underline truncate"
      >
        {value}
      </a>
    ) : (
      <span className="text-sm font-medium text-gray-900 break-words">
        {value || "---"}
      </span>
    )}
  </div>
);

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("employers");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false,
    confirmText: "Xác nhận",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === "candidates") {
        response = await adminApi.getCandidates();
      } else if (activeTab === "no-role") {
        response = await adminApi.getUsersNoRole();
      } else {
        response = await adminApi.getEmployers();
      }
      setData(response.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedUser(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const confirmDelete = (uid) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa tài khoản",
      message:
        "Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này không? Hành động này không thể hoàn tác.",
      isDanger: true,
      confirmText: "Xóa vĩnh viễn",
      onConfirm: () => performDelete(uid),
    });
  };

  const performDelete = async (uid) => {
    try {
      await adminApi.deleteUser(uid);
      toast.success("Đã xóa tài khoản thành công.");
      setData(data.filter((user) => user.FirebaseUserID !== uid));
      if (selectedUser?.FirebaseUserID === uid) setSelectedUser(null);
    } catch (error) {
      toast.error("Xóa thất bại.");
    }
  };

  const confirmToggleBan = (uid, currentStatus) => {
    const newStatus = !currentStatus;
    const actionName = newStatus ? "Khóa tài khoản" : "Mở khóa tài khoản";

    setConfirmModal({
      isOpen: true,
      title: actionName,
      message: newStatus
        ? "Người dùng sẽ bị đăng xuất ngay lập tức và không thể truy cập hệ thống. Bạn có chắc chắn không?"
        : "Tài khoản này sẽ được kích hoạt trở lại. Bạn có chắc chắn không?",
      isDanger: newStatus, // Khóa thì màu đỏ, mở khóa màu xanh
      confirmText: newStatus ? "Khóa ngay" : "Mở khóa",
      onConfirm: () => performToggleBan(uid, newStatus),
    });
  };

  const performToggleBan = async (uid, newStatus) => {
    try {
      await adminApi.toggleBanUser(uid, newStatus);
      toast.success(`Thao tác thành công.`);

      const newData = data.map((user) =>
        user.FirebaseUserID === uid ? { ...user, IsBanned: newStatus } : user
      );
      setData(newData);

      if (selectedUser?.FirebaseUserID === uid) {
        setSelectedUser({ ...selectedUser, IsBanned: newStatus });
      }
    } catch (error) {
      toast.error("Thao tác thất bại.");
    }
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
  };

  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.DisplayName?.toLowerCase().includes(term) ||
      item.Email?.toLowerCase().includes(term) ||
      item.FullName?.toLowerCase().includes(term) ||
      item.CompanyName?.toLowerCase().includes(term)
    );
  });

  const StatusBadge = ({ isVerified }) => {
    if (isVerified)
      return (
        <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
          Đã xác thực
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">
        Chưa xác thực
      </span>
    );
  };

  return (
    <>
      <div className="space-y-6 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Người dùng
          </h1>
          <div className="relative w-80">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab("employers")}
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${
              activeTab === "employers"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiBriefcase className="mr-2" /> Công ty
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${
              activeTab === "candidates"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiUser className="mr-2" /> Ứng Viên
          </button>
          <button
            onClick={() => setActiveTab("no-role")}
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${
              activeTab === "no-role"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiHelpCircle className="mr-2" /> Chưa phân loại
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông tin tài khoản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === "employers"
                        ? "Thông tin Công ty"
                        : activeTab === "candidates"
                        ? "Hồ sơ cá nhân"
                        : "Thông tin bổ sung"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((user) => (
                      <tr
                        key={user.FirebaseUserID}
                        className={`transition-colors ${
                          user.IsBanned
                            ? "bg-gray-200 text-gray-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className={`h-10 w-10 rounded-full object-cover border ${
                                  user.IsBanned ? "opacity-50 grayscale" : ""
                                }`}
                                src={
                                  getImageUrl(user.PhotoURL) ||
                                  "https://via.placeholder.com/40"
                                }
                                alt=""
                              />
                            </div>
                            <div className="ml-4">
                              <div
                                className={`text-sm font-medium ${
                                  user.IsBanned
                                    ? "text-gray-600"
                                    : "text-gray-900"
                                }`}
                              >
                                {user.DisplayName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.Email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {activeTab === "employers" ? (
                            user.CompanyName ? (
                              <div className="flex items-start space-x-3">
                                <img
                                  src={
                                    getImageUrl(user.LogoURL) ||
                                    "https://via.placeholder.com/40"
                                  }
                                  alt="Logo"
                                  className={`w-10 h-10 object-contain border rounded bg-white ${
                                    user.IsBanned ? "opacity-50 grayscale" : ""
                                  }`}
                                />
                                <div>
                                  <div
                                    className={`text-sm font-medium ${
                                      user.IsBanned
                                        ? "text-gray-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {user.CompanyName}
                                  </div>
                                  <a
                                    href={user.WebsiteURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`text-xs hover:underline block ${
                                      user.IsBanned
                                        ? "text-gray-500 pointer-events-none"
                                        : "text-blue-500"
                                    }`}
                                  >
                                    {user.WebsiteURL}
                                  </a>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                                    <FiMapPin className="mr-1" />{" "}
                                    {user.CompanyAddress || "Chưa cập nhật"}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Chưa cập nhật hồ sơ
                              </span>
                            )
                          ) : activeTab === "candidates" ? (
                            user.FullName ? (
                              <div>
                                <div
                                  className={`text-sm font-medium ${
                                    user.IsBanned
                                      ? "text-gray-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {user.FullName}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center">
                                  <FiMapPin className="mr-1" />{" "}
                                  {user.Address || "Chưa cập nhật"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                Chưa cập nhật hồ sơ
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Chưa chọn vai trò
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm flex items-center">
                            <FiPhone className="mr-2 text-gray-400" />
                            {activeTab === "employers"
                              ? user.CompanyPhone || "---"
                              : activeTab === "candidates"
                              ? user.PhoneNumber || "---"
                              : "---"}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <StatusBadge isVerified={user.IsVerified} />
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3 items-center">
                            <button
                              onClick={() => handleViewDetail(user)}
                              className={`mr-1 ${
                                user.IsBanned
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-blue-600 hover:text-blue-900"
                              }`}
                              title="Xem chi tiết"
                              disabled={user.IsBanned}
                            >
                              <FiInfo size={20} />
                            </button>

                            <button
                              onClick={() =>
                                confirmToggleBan(
                                  user.FirebaseUserID,
                                  user.IsBanned
                                )
                              }
                              className={`${
                                user.IsBanned
                                  ? "text-gray-600 hover:text-gray-800"
                                  : "text-yellow-600 hover:text-yellow-900"
                              }`}
                              title={
                                user.IsBanned ? "Mở khóa" : "Khóa tài khoản"
                              }
                            >
                              {user.IsBanned ? (
                                <FiUnlock size={18} />
                              ) : (
                                <FiLock size={18} />
                              )}
                            </button>

                            <button
                              onClick={() => confirmDelete(user.FirebaseUserID)}
                              className="text-red-600 hover:text-red-900"
                              title="Xóa tài khoản"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          type={activeTab}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />
    </>
  );
};

export default UserManagement;
