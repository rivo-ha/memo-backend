import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const verifySitePassword = (data) => api.post('/auth/verify-site', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

export const getManuals = () => api.get('/manuals');
export const getManualById = (id) => api.get(`/manuals/${id}`);
export const createManual = (data) => api.post('/manuals', data);
export const updateManual = (id, data) => api.put(`/manuals/${id}`, data);
export const addComment = (id, commentData) => api.post(`/manuals/${id}/comments`, commentData);
export const updateComment = (manualId, commentId, data) => api.put(`/manuals/${manualId}/comments/${commentId}`, data);
export const deleteComment = (manualId, commentId, password) => api.delete(`/manuals/${manualId}/comments/${commentId}`, { data: { password } });
export const reviewManualWithAI = (data) => api.post('/ai/review', data);
export const reviseManualWithAI = (data) => api.post('/ai/revise', data);
export const searchWithAI = (query) => api.post('/ai/search', { query });
