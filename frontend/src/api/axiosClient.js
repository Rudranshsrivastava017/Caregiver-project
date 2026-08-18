import axios from 'axios';

// In-memory access token storage getter/setter module
let inMemoryAccessToken = null;

export const setMemoryToken = (token) => {
  inMemoryAccessToken = token;
};

export const getMemoryToken = () => {
  return inMemoryAccessToken;
};

// Central Axios client with credentials for HttpOnly refresh cookies
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token from memory
axiosClient.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle JWT Expiration & Auto Refresh via HttpOnly Cookie
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not retry refresh requests themselves to prevent infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register') &&
      !originalRequest.url.includes('/auth/google')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axiosClient.post('/auth/refresh');
        const newAccessToken = refreshResponse.data?.accessToken;

        if (newAccessToken) {
          setMemoryToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        setMemoryToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

