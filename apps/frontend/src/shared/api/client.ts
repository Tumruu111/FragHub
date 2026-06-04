import axios from 'axios';
import { getToken } from '../auth/token';
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
