import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Leads API
export const leadsAPI = {
    create: (data) => api.post('/leads', data),
    getAll: (status) => api.get('/leads', { params: { status } }),
    getOne: (id) => api.get(`/leads/${id}`),
    update: (id, data) => api.put(`/leads/${id}`, data),
    delete: (id) => api.delete(`/leads/${id}`),
    getStats: () => api.get('/leads/stats/summary'),
};

// Contacts API
export const contactsAPI = {
    create: (data) => api.post('/contacts', data),
    getAll: (leadId) => api.get('/contacts', { params: { lead_id: leadId } }),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`),
};

// Templates API
export const templatesAPI = {
    create: (data) => api.post('/templates', data),
    getAll: () => api.get('/templates'),
    update: (id, data) => api.put(`/templates/${id}`, data),
    delete: (id) => api.delete(`/templates/${id}`),
};

// AI API
export const aiAPI = {
    researchCompany: (data) => api.post('/ai/research', data),
    discoverContacts: (data) => api.post('/ai/discover-contacts', data),
    generateEmail: (leadId, templateId) => 
        api.post(`/ai/generate-email?lead_id=${leadId}${templateId ? `&template_id=${templateId}` : ''}`),
};

export default api;
