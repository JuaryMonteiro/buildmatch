// src/services/api.js

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Utilitário base ────────────────────────────────
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('buildmatch_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('buildmatch_token');
    localStorage.removeItem('buildmatch_user');
    window.location.reload();
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

// ── AUTH ───────────────────────────────────────────
export const authAPI = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/api/auth/me'),
  changePassword: (body) => request('/api/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
};

// ── PROFESSIONALS ──────────────────────────────────
export const professionalsAPI = {
  list:   (params = {}) => request('/api/professionals?' + new URLSearchParams(params)),
  search: (q)           => request(`/api/professionals/search?q=${encodeURIComponent(q)}`),
  get:    (id)          => request(`/api/professionals/${id}`),
  update: (id, body)    => request(`/api/professionals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  availability: (id)    => request(`/api/professionals/${id}/availability`),
};

// ── PROJECTS ───────────────────────────────────────
export const projectsAPI = {
  list:   (params = {}) => request('/api/projects?' + new URLSearchParams(params)),
  get:    (id)          => request(`/api/projects/${id}`),
  create: (body)        => request('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body)    => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancel: (id)          => request(`/api/projects/${id}`, { method: 'DELETE' }),
};

// ── MESSAGES ───────────────────────────────────────
export const messagesAPI = {
  conversations: ()            => request('/api/messages/conversations'),
  history:       (projectId)   => request(`/api/messages/project/${projectId}`),
  send:          (projectId, body) => request(`/api/messages/project/${projectId}`, { method: 'POST', body: JSON.stringify(body) }),
};

// ── REVIEWS ────────────────────────────────────────
export const reviewsAPI = {
  list:   (professionalId) => request(`/api/reviews/professional/${professionalId}`),
  create: (body)           => request('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
  reply:  (id, reply)      => request(`/api/reviews/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
};

// ── SCHEDULES ──────────────────────────────────────
export const schedulesAPI = {
  list:   (professionalId) => request(`/api/schedules/professional/${professionalId}`),
  create: (body)           => request('/api/schedules', { method: 'POST', body: JSON.stringify(body) }),
  cancel: (id)             => request(`/api/schedules/${id}`, { method: 'DELETE' }),
};

// ── PORTFOLIO ──────────────────────────────────────
export const portfolioAPI = {
  list:   (professionalId) => request(`/api/portfolio/professional/${professionalId}`),
  create: (body)           => request('/api/portfolio', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body)       => request(`/api/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id)             => request(`/api/portfolio/${id}`, { method: 'DELETE' }),
};

// ── USERS ──────────────────────────────────────────
export const usersAPI = {
  get:    (id)       => request(`/api/users/${id}`),
  update: (id, body) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};