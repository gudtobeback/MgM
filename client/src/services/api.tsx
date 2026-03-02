import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const apiEndpoints = {
  register: (body) => api.post(`/auth/register`, body),

  login: (body) => api.post(`/auth/login`, body),

  refreshAccessToken: (body) => api.post(`/auth/refresh`, body),

  getCurrentUser: () => api.get(`/auth/me`),

  listOrganizations: () => api.get(`/organizations`),

  updateSubscription: (body) => api.patch(`/auth/subscription`, body),
};
