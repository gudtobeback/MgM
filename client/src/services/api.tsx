import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
//   withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to always return data
api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const apiEndpoints = {
  register: (body) => api.post(`/auth/register`, body),

  login: (body) => api.post(`/auth/login`, body),
};