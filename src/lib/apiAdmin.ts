import axios from "axios";

const apiAdmin = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000",
  withCredentials: false,
});

apiAdmin.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem("admin_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiAdmin.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (typeof window !== "undefined" && status && [401, 403].includes(status)) {
      window.localStorage.removeItem("admin_token");
      const segments = window.location.pathname.split("/").filter(Boolean);
      const locale = segments[0] ?? "fa";
      window.location.assign(`/${locale}/admin/login`);
    }
    return Promise.reject(error);
  },
);

export default apiAdmin;
