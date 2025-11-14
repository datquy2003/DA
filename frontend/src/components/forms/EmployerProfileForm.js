import React, { useState, useEffect, useRef } from "react";
import { profileApi } from "../../api/profileApi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../utils/urlHelper";

const EmployerProfileForm = () => {
  // eslint-disable-next-line no-unused-vars
  const { firebaseUser } = useAuth();
  const [formData, setFormData] = useState({
    CompanyName: "",
    CompanyEmail: "",
    CompanyPhone: "",
    WebsiteURL: "",
    CompanyDescription: "",
    Address: "",
    City: "",
    Country: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const logoInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const response = await profileApi.getCompanyProfile();
        if (response.data) {
          setFormData(response.data);
          setLogoPreview(getImageUrl(response.data.LogoURL));
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          toast.error("Lỗi tải thông tin công ty.");
        }
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Đang cập nhật...");

    try {
      const formUpload = new FormData();

      for (const key in formData) {
        formUpload.append(key, formData[key]);
      }

      if (logoFile) {
        formUpload.append("logo", logoFile);
      }

      const response = await profileApi.updateCompanyProfile(formUpload);
      const updatedCompany = response.data;

      setFormData(updatedCompany);
      setLogoPreview(getImageUrl(updatedCompany.LogoURL));
      toast.success("Cập nhật thông tin công ty thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại.", { id: toastId });
    } finally {
      setLoading(false);
      setLogoFile(null);
    }
  };

  if (initialLoading) return <div>Đang tải hồ sơ công ty...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Thông tin Công ty</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <img
            src={logoPreview || "https://via.placeholder.com/150"}
            alt="Logo"
            className="w-24 h-24 object-contain border p-1"
          />
          <input
            type="file"
            accept="image/*"
            ref={logoInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => logoInputRef.current.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Chọn logo
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên công ty
          </label>
          <input
            name="CompanyName"
            type="text"
            value={formData.CompanyName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email công ty
            </label>
            <input
              name="CompanyEmail"
              type="email"
              value={formData.CompanyEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Điện thoại công ty
            </label>
            <input
              name="CompanyPhone"
              type="tel"
              value={formData.CompanyPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            name="WebsiteURL"
            type="url"
            value={formData.WebsiteURL || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thành phố
            </label>
            <input
              name="City"
              type="text"
              value={formData.City}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quốc gia
            </label>
            <input
              name="Country"
              type="text"
              value={formData.Country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả công ty
          </label>
          <textarea
            name="CompanyDescription"
            rows="5"
            value={formData.CompanyDescription}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu thông tin"}
        </button>
      </form>
    </div>
  );
};

export default EmployerProfileForm;
