const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export const getImageUrl = (url) => {
  if (!url) {
    return null;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${BACKEND_URL}${url}`;
};
