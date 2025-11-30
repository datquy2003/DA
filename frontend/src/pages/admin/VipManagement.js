import React, { useState, useEffect } from "react";
import { vipApi } from "../../api/vipApi";
import {
  FiPackage,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiBriefcase,
  FiUser,
  FiClock,
  FiZap,
} from "react-icons/fi";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const VipPackageModal = ({ pkgToEdit, roleId, onClose, onSuccess }) => {
  const [mode, setMode] = useState("SUBSCRIPTION");

  const [formData, setFormData] = useState({
    PlanName: "",
    Price: "",
    DurationInDays: "30",
    Features: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkgToEdit) {
      const isSub = pkgToEdit.DurationInDays && pkgToEdit.DurationInDays > 0;
      setMode(isSub ? "SUBSCRIPTION" : "ONE_TIME");

      setFormData({
        PlanName: pkgToEdit.PlanName,
        Price: formatNumber(pkgToEdit.Price.toString()),
        DurationInDays: pkgToEdit.DurationInDays || "30",
        Features: pkgToEdit.Features || "",
      });
    } else {
      setMode("SUBSCRIPTION");
      setFormData({
        PlanName: "",
        Price: "",
        DurationInDays: "30",
        Features: "",
      });
    }
  }, [pkgToEdit]);

  const formatNumber = (value) => {
    if (!value) return "";
    const number = value.replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "Price") {
      value = formatNumber(value);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanedFeatures = formData.Features.split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "")
        .join("\n");

      const payload = {
        ...formData,
        RoleID: roleId,
        Price: parseFloat(formData.Price.replace(/\./g, "")),
        DurationInDays:
          mode === "SUBSCRIPTION" ? parseInt(formData.DurationInDays) : 0,
        PlanType: mode,
        Features: cleanedFeatures,
      };

      if (pkgToEdit) {
        await vipApi.updateVipPackage(pkgToEdit.PlanID, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await vipApi.createVipPackage(payload);
        toast.success("Thêm mới thành công!");
      }

      onSuccess();
    } catch (error) {
      const msg = error.response?.data?.message || "Có lỗi xảy ra.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 border-b bg-gray-50">
          <h3 className="flex items-center text-lg font-bold text-gray-800">
            {pkgToEdit ? "Cập nhật gói/dịch vụ" : "Thêm gói/dịch vụ mới"}
          </h3>
          <button onClick={onClose}>
            <FiX size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="vipForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Loại hình dịch vụ
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode("SUBSCRIPTION")}
                  className={`flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    mode === "SUBSCRIPTION"
                      ? "bg-white shadow text-blue-600 ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiClock className="mr-1.5" /> Gói Định Kỳ
                </button>
                <button
                  type="button"
                  onClick={() => setMode("ONE_TIME")}
                  className={`flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    mode === "ONE_TIME"
                      ? "bg-white shadow text-purple-600 ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiZap className="mr-1.5" /> Mua 1 Lần
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {mode === "SUBSCRIPTION"
                  ? "Dành cho các gói duy trì theo thời gian."
                  : "Dành cho các tính năng trả phí dùng xong là hết."}
              </p>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Tên gói / Dịch vụ
              </label>
              <input
                type="text"
                name="PlanName"
                required
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.PlanName}
                onChange={handleChange}
                placeholder="Nhập tên gói / dịch vụ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={mode === "ONE_TIME" ? "col-span-2" : ""}>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Giá (VNĐ)
                </label>
                <input
                  type="text"
                  name="Price"
                  required
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Price}
                  onChange={handleChange}
                  placeholder="Nhập giá tiền"
                />
              </div>

              {mode === "SUBSCRIPTION" && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Thời hạn (Ngày)
                  </label>
                  <input
                    type="number"
                    name="DurationInDays"
                    required
                    min="1"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.DurationInDays}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Các tính năng (Hiển thị cho người dùng)
              </label>
              <textarea
                name="Features"
                rows="5"
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.Features}
                onChange={handleChange}
                placeholder="Nhập các tính năng"
              ></textarea>
              <p className="mt-1 text-xs text-gray-500">
                Xuống dòng để tạo gạch đầu dòng.
              </p>
            </div>
          </form>
        </div>

        <div className="flex justify-end flex-shrink-0 gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            form="vipForm"
            type="submit"
            disabled={loading}
            className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Lưu lại"}
          </button>
        </div>
      </div>
    </div>
  );
};

const VipManagement = () => {
  const [activeTab, setActiveTab] = useState(3);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await vipApi.getVipPackages(activeTab);
      setPackages(res.data || []);
    } catch (error) {
      if (error.response?.status !== 404) toast.error("Lỗi kết nối server.");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa Gói Dịch Vụ",
      message: "Bạn có chắc chắn muốn xóa không?",
      isDanger: true,
      confirmText: "Xóa",
      onClose: () => setConfirmModal({ ...confirmModal, isOpen: false }),
      onConfirm: async () => {
        try {
          await vipApi.deleteVipPackage(id);
          toast.success("Đã xóa.");
          fetchPackages();
        } catch (error) {
          toast.error("Xóa thất bại.");
        }
      },
    });
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.PlanName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <h1 className="flex items-center text-2xl font-bold text-gray-800">
            <FiPackage className="mr-2 text-blue-600" /> Quản lý Gói & Dịch Vụ
          </h1>

          <div className="flex items-center w-full gap-4 md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm tên gói..."
                className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute text-gray-400 left-3 top-3" />
            </div>

            <button
              onClick={() => {
                setEditingPkg(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 whitespace-nowrap"
            >
              <FiPlus className="mr-2" /> Thêm mới
            </button>
          </div>
        </div>

        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab(3)}
            className={`flex items-center px-6 py-3 font-medium transition-colors ${
              activeTab === 3
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <FiBriefcase className="mr-2" /> Công ty
          </button>
          <button
            onClick={() => setActiveTab(4)}
            className={`flex items-center px-6 py-3 font-medium transition-colors ${
              activeTab === 4
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FiUser className="mr-2" /> Ứng Viên
          </button>
        </div>

        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Tên Gói / Dịch Vụ
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    Thời hạn
                  </th>
                  <th className="w-1/3 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Tính năng
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.length > 0 ? (
                  filteredPackages.map((pkg) => {
                    const isSubscription = pkg.PlanType === "SUBSCRIPTION";
                    return (
                      <tr
                        key={pkg.PlanID}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {pkg.PlanName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isSubscription ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <FiClock className="mr-1" /> Định kỳ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <FiZap className="mr-1" /> Mua 1 lần
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600 whitespace-nowrap">
                          {formatCurrency(pkg.Price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-600 whitespace-nowrap">
                          {isSubscription
                            ? `${pkg.DurationInDays} ngày`
                            : "---"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <ul className="pl-5 space-y-1 list-disc">
                            {pkg.Features.split("\n").map((line, idx) => (
                              <li key={idx}>{line}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setEditingPkg(pkg);
                                setIsModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.PlanID)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Chưa có gói dịch vụ nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <VipPackageModal
          pkgToEdit={editingPkg}
          roleId={activeTab}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPackages();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        confirmText={confirmModal.confirmText}
      />
    </>
  );
};

export default VipManagement;