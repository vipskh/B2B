import axios from "axios";

// localhost works in the iOS simulator / web. For a physical device (Expo Go),
// set EXPO_PUBLIC_API_URL to your computer's LAN IP, e.g. http://192.168.1.20:3000/api
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

// Storefront app: auth is off and there is no role-switcher — the backend treats
// header-less requests as the demo buyer, so the app just opens to products.
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// kept as a hook so existing call sites (`const api = useApi()`) don't change
export const useApi = () => api;
