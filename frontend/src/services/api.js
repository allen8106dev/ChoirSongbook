import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({



  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cs_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const organizationId = localStorage.getItem('cs_active_org_id');
    if (organizationId) {
      config.headers['X-Organization-ID'] = organizationId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiService = {
  // --- Authentication ---
  auth: {
    loginGoogle: async (idToken) => {
      const response = await api.post('/auth/google', { id_token: idToken });
      return response.data;
    },
    loginSimulate: async (email) => {
      const response = await api.post('/auth/simulate', { email });
      return response.data;
    },
  },

  // --- Organizations ---
  organizations: {
    getAll: async () => {
      const response = await api.get('/organizations');
      return response.data;
    },
    getPublic: async (id) => {
      const response = await api.get(`/organizations/${id}/public`);
      return response.data;
    },
    create: async (name) => {
      const response = await api.post('/organizations', { name });
      return response.data;
    },
  },

  // --- Songs ---
  songs: {
    getAll: async () => {
      const response = await api.get('/songs');
      return response.data;
    },
    getOne: async (idOrNumber) => {
      const response = await api.get(`/songs/${idOrNumber}`);
      return response.data;
    },
    create: async (songData) => {
      const response = await api.post('/songs', songData);
      return response.data;
    },
    update: async (id, songData) => {
      const response = await api.put(`/songs/${id}`, songData);
      return response.data;
    },
    delete: async (id) => {
      const response = await api.delete(`/songs/${id}`);
      return response.data;
    },
    uploadAudio: async (id, file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/songs/${id}/audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  },


  // --- Categories ---
  categories: {
    getAll: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    create: async (name) => {
      const response = await api.post('/categories', { name });
      return response.data;
    },
    rename: async (oldName, newName) => {
      const response = await api.put(`/categories/${oldName}`, { name: newName });
      return response.data;
    },
    delete: async (name) => {
      const response = await api.delete(`/categories/${name}`);
      return response.data;
    },
  },

  // --- Languages ---
  languages: {
    getAll: async () => {
      const response = await api.get('/languages');
      return response.data;
    },
    create: async (name) => {
      const response = await api.post('/languages', { name });
      return response.data;
    },
    rename: async (oldName, newName) => {
      const response = await api.put(`/languages/${oldName}`, { name: newName });
      return response.data;
    },
    delete: async (name) => {
      const response = await api.delete(`/languages/${name}`);
      return response.data;
    },
  },

  // --- Admin Settings ---
  admin: {
    getEmails: async () => {
      const response = await api.get('/admin/emails');
      return response.data;
    },
    addEmail: async (email) => {
      const response = await api.post('/admin/emails', { email });
      return response.data;
    },
    deleteEmail: async (email) => {
      const response = await api.delete(`/admin/emails/${email}`);
      return response.data;
    },
  },

  // --- Favourites ---
  favourites: {
    getAll: async () => {
      const response = await api.get('/favourites');
      return response.data; // array of song IDs
    },
    add: async (songId) => {
      const response = await api.post(`/favourites/${songId}`);
      return response.data;
    },
    remove: async (songId) => {
      const response = await api.delete(`/favourites/${songId}`);
      return response.data;
    },
  },
};


export default api;
