import React, { useState, useEffect } from "react";
import { profileApi } from "../../api/profileApi";
import toast from "react-hot-toast";

const CandidateProfileForm = () => {
  const [formData, setFormData] = useState({
    FullName: "",
    PhoneNumber: "",
    Birthday: "",
    Address: "",
    ProfileSummary: "",
    IsSearchable: false,
    SpecializationID: null,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const response = await profileApi.getCandidateProfile();
        const data = response.data;
        if (data) {
          setFormData({
            ...data,
            Birthday: data.Birthday ? data.Birthday.split("T")[0] : "",
          });
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          toast.error("Lỗi tải hồ sơ ứng viên.");
        }
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Đang lưu hồ sơ...");

    try {
      const dataToSubmit = {
        ...formData,
        Birthday: formData.Birthday || null,
      };
      await profileApi.updateCandidateProfile(dataToSubmit);
      toast.success("Cập nhật hồ sơ ứng viên thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div>Đang tải hồ sơ...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Hồ sơ Ứng viên</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên
          </label>
          <input
            name="FullName"
            type="text"
            value={formData.FullName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              name="PhoneNumber"
              type="tel"
              value={formData.PhoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày sinh
            </label>
            <input
              name="Birthday"
              type="date"
              value={formData.Birthday}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ
          </label>
          <input
            name="Address"
            type="text"
            value={formData.Address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chuyên môn (Sẽ làm dropdown sau)
          </label>
          <input
            type="text"
            value={formData.SpecializationID || ""}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giới thiệu bản thân (Mục tiêu nghề nghiệp)
          </label>
          <textarea
            name="ProfileSummary"
            rows="5"
            value={formData.ProfileSummary}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          ></textarea>
        </div>

        <div className="flex items-center">
          <input
            name="IsSearchable"
            type="checkbox"
            checked={formData.IsSearchable}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Cho phép nhà tuyển dụng tìm kiếm hồ sơ
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
      </form>
    </div>
  );
};

export default CandidateProfileForm;
