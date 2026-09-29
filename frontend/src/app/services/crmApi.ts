/**
 * crmApi.ts - Axios client for the CRM pipeline modules
 * (campaigns, source files, confirmation, commercial, technique, admin…).
 *
 * Uses the same token and base URL as api.ts. Responses are normalised to camelCase:
 * the call-analysis modules answer in snake_case (see [SnakeCaseJson] on the backend)
 * while the pipeline modules answer in camelCase, and these pages are written for camelCase.
 */
import axios from 'axios';
import { API_BASE, getToken, removeToken } from './api';

const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function camelize<T = any>(value: any): T {
  if (Array.isArray(value)) return value.map(camelize) as T;
  if (value && typeof value === 'object' && !(value instanceof Blob) && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [toCamel(k), camelize(v)])) as T;
  }
  return value;
}

export const crmApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

crmApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

crmApi.interceptors.response.use(
  (response) => {
    if (response.config.responseType !== 'blob' && response.config.responseType !== 'arraybuffer') {
      response.data = camelize(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = crmApi;
export default crmApi;
