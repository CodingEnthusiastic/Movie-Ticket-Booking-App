/**
 * ============================================================================
 * API SERVICE (frontend/src/api.ts)
 * ============================================================================
 *
 * For vibe coders:
 * Axios is a library for sending HTTP requests (GET, POST, PUT, DELETE) to our backend.
 *
 * An "Interceptor" is like an automatic stamp:
 * Before ANY request leaves the browser, this interceptor checks if the user is
 * logged in (has a JWT token in localStorage). If yes, it stamps:
 * "Authorization: Bearer <token>" onto the request headers automatically!
 */

import axios from 'axios';

// Backend API URL (can be customized via VITE_API_URL in production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT token to every outgoing API call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yozigo_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: If backend returns 401 Unauthorized, handle token expiration gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend reports token expired or invalid on a protected route
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Don't auto-clear on failed login/signup attempts
      if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
        localStorage.removeItem('yozigo_token');
        localStorage.removeItem('yozigo_user');
      }
    }
    return Promise.reject(error);
  }
);
