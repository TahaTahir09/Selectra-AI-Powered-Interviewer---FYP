import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/users/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type: 'candidate' | 'organization';
  date_joined: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  user_type: 'candidate' | 'organization';
}

export interface OrganizationDetails {
  id: number;
  organization_name: string;
  address: string;
  contact_number: string;
  contact_person: string;
  legal_document_url?: string;
  website_link?: string;
  company_description?: string;
}

export interface JobPost {
  id: number;
  job_title: string;
  job_description: string;
  required_skills: string[];
  experience_required?: string;
  qualification?: string;
  responsibilities?: string;
  benefits?: string;
  employment_type?: string;
  location?: string;
  salary_range?: string;
  application_link: string;
  pre_assessment_questions?: string[];
  status: 'active' | 'inactive' | 'closed';
  created_at: string;
  application_count?: number;
}

export interface Application {
  id: number;
  job_post: number;
  candidate_name: string;
  candidate_email: string;
  cv_url?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Interview {
  id: number;
  application: number;
  scheduled_date?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  interview_type?: string;
  notes?: string;
}

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/users/auth/login/', credentials);
    const { access, refresh } = response.data;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/users/register/', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await api.get('/users/profile/');
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/users/profile/', data);
    return response.data;
  },
};

// Organization API
export const organizationAPI = {
  create: async (data: Omit<OrganizationDetails, 'id'>) => {
    const response = await api.post('/organizations/', data);
    return response.data;
  },

  getDetails: async () => {
    const response = await api.get('/organizations/');
    return response.data;
  },

  update: async (id: number, data: Partial<OrganizationDetails>) => {
    const response = await api.patch(`/organizations/${id}/`, data);
    return response.data;
  },
};

// Job Post API
export const jobAPI = {
  list: async (params?: { search?: string; ordering?: string }) => {
    const response = await api.get('/core/jobs/', { params });
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/core/jobs/${id}/`);
    return response.data;
  },

  create: async (data: Omit<JobPost, 'id' | 'created_at' | 'application_count'>) => {
    const response = await api.post('/core/jobs/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<JobPost>) => {
    const response = await api.patch(`/core/jobs/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/core/jobs/${id}/`);
  },

  getApplications: async (id: number) => {
    const response = await api.get(`/core/jobs/${id}/applications/`);
    return response.data;
  },
};

// Application API
export const applicationAPI = {
  list: async () => {
    const response = await api.get('/core/applications/');
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/core/applications/${id}/`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post('/core/applications/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.post(`/core/applications/${id}/update_status/`, { status });
    return response.data;
  },
};

// Interview API
export const interviewAPI = {
  list: async () => {
    const response = await api.get('/core/interviews/');
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/core/interviews/${id}/`);
    return response.data;
  },

  create: async (data: Omit<Interview, 'id'>) => {
    const response = await api.post('/core/interviews/', data);
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.post(`/core/interviews/${id}/update_status/`, { status });
    return response.data;
  },
};

export default api;
