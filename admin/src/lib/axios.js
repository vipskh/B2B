import axios from "axios";
import { getDevUserId } from "./devUser";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// attach the impersonated dev user (auth temporarily off)
axiosInstance.interceptors.request.use((config) => {
  const id = getDevUserId();
  if (id) config.headers["x-dev-user-id"] = id;
  return config;
});

export default axiosInstance;
