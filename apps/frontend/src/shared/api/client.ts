import axios from 'axios';
import { endExpiredSession, getToken } from '../auth/token';
import { config } from '../../config';

export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: false,
});

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// A 401 means our token is no longer accepted. Login and sign-up answer 401
// for a wrong password, so those are left for the form to show.
api.interceptors.response.use(undefined, (error) => {
  const url: string = error?.config?.url ?? '';
  if (error?.response?.status === 401 && !/\/(login|register)$/.test(url))
    endExpiredSession();
  return Promise.reject(error);
});
