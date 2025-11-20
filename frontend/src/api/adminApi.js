import apiClient from "./apiClient";

const getCandidates = () => {
  return apiClient.get("/admin/users/candidates");
};

const getEmployers = () => {
  return apiClient.get("/admin/users/employers");
};

const deleteUser = (uid) => {
  return apiClient.delete(`/admin/users/${uid}`);
};

const toggleBanUser = (uid, isBanned) => {
  return apiClient.put(`/admin/users/${uid}/ban`, { isBanned });
};

export const adminApi = {
  getCandidates,
  getEmployers,
  deleteUser,
  toggleBanUser,
};
