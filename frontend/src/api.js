import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://memo-backend-auoi.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getManuals = () => api.get('/manuals');
export const getManualById = (id) => api.get(`/manuals/${id}`);
export const createManual = (data) => api.post('/manuals', data);
export const updateManual = (id, data) => api.put(`/manuals/${id}`, data);
export const addComment = (id, commentData) => api.post(`/manuals/${id}/comments`, commentData);
