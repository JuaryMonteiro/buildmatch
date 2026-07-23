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

  if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/register') {
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
  resendVerification: (email) => request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  // GET com query string (corrigido — o backend é GET /verify-email?token=...)
  verifyEmail: (token) => fetch(`${BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Erro na verificação');
    return data;
  }),
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword:  (token, newPassword) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
};

// ── PROFESSIONALS ──────────────────────────────────
export const professionalsAPI = {
  list:   (params = {}) => request('/api/professionals?' + new URLSearchParams(params)),
  search: (q) => request(`/api/professionals/search?q=${encodeURIComponent(q)}`),
  get:    (id)          => request(`/api/professionals/${id}`),
  update: (id, body)    => request(`/api/professionals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  availability: (id)    => request(`/api/professionals/${id}/availability`),
  getMeta:      ()      => Promise.resolve({ categories: [], specialties: [] }),
  uploadVerificationDoc: (document) => request('/api/professionals/verification-doc', { method: 'POST', body: JSON.stringify({ document }) }),
};

// ── PROJECTS ───────────────────────────────────────
export const projectsAPI = {
  list:   (params = {}) => request('/api/projects?' + new URLSearchParams(params)),
  get:    (id)          => request(`/api/projects/${id}`),
  create: (body)        => request('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body)    => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancel: (id, reason)  => request(`/api/projects/${id}`, { method: 'DELETE', body: reason ? JSON.stringify({ reason }) : undefined }),
  acceptDirect: (id)    => request(`/api/projects/${id}/accept`, { method: 'POST' }),
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
  list:     (professionalId) => request(`/api/schedules/professional/${professionalId}`),
  create:   (body)           => request('/api/schedules', { method: 'POST', body: JSON.stringify(body) }),
  cancel:   (id)             => request(`/api/schedules/${id}`, { method: 'DELETE' }),
  mine:     ()               => request('/api/schedules/mine'),
  mineAsClient: ()           => request('/api/schedules/mine/client'),
  book:     (id)             => request(`/api/schedules/book/${id}`, { method: 'PUT' }),
  accept:   (id)             => request(`/api/schedules/${id}/accept`, { method: 'PUT' }),
  reject:   (id)             => request(`/api/schedules/${id}/reject`, { method: 'PUT' }),
  complete: (id)             => request(`/api/schedules/${id}/complete`, { method: 'PUT' }),
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

// ── ADDRESSES ──────────────────────────────────────
export const addressesAPI = {
  list:      ()         => request('/api/addresses'),
  create:    (body)     => request('/api/addresses',      { method: 'POST',   body: JSON.stringify(body) }),
  update:    (id, body) => request(`/api/addresses/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  delete:    (id)       => request(`/api/addresses/${id}`, { method: 'DELETE' }),
};

// ── NOTIFICATIONS ──────────────────────────────────
export const notificationsAPI = {
  list:         ()   => request('/api/notifications'),
  unreadCount:  ()   => request('/api/notifications/unread-count'),
  markRead:     (id) => request(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead:  ()   => request('/api/notifications/read-all',   { method: 'PUT' }),
  delete:       (id) => request(`/api/notifications/${id}`,      { method: 'DELETE' }),
};

// ── REVIEWS UPDATES ────────────────────────────────
reviewsAPI.listClient = (clientId) => request(`/api/reviews/client/${clientId}`);
reviewsAPI.createClient = (body) => request('/api/reviews/client', { method: 'POST', body: JSON.stringify(body) });
reviewsAPI.replyClient = (id, reply) => request(`/api/reviews/client/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) });

// ── PROPOSALS ──────────────────────────────────────
export const proposalsAPI = {
  listByProject: (projectId) => request(`/api/proposals/project/${projectId}`),
  listMy:        ()          => request('/api/proposals/my'),
  create:        (body)      => request('/api/proposals', { method: 'POST', body: JSON.stringify(body) }),
  accept:        (id)        => request(`/api/proposals/${id}/accept`, { method: 'PUT' }),
  reject:        (id)        => request(`/api/proposals/${id}/reject`, { method: 'PUT' }),
  counter:       (id, body)  => request(`/api/proposals/${id}/counter`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ── CONTRACTS ──────────────────────────────────────
export const contractsAPI = {
  getByProject: (projectId) => request(`/api/contracts/project/${projectId}`),
  sign:         (id, documentBase64) => request(`/api/contracts/${id}/sign`, { method: 'PUT', body: JSON.stringify({ document: documentBase64 }) }),
  getPdfUrl:    (id)        => `${BASE_URL}/api/contracts/${id}/pdf`,
};

// ── MILESTONES ─────────────────────────────────────
export const milestonesAPI = {
  list:     (contractId) => request(`/api/milestones/contract/${contractId}`),
  create:   (body)       => request('/api/milestones', { method: 'POST', body: JSON.stringify(body) }),
  complete: (id)         => request(`/api/milestones/${id}/complete`, { method: 'PUT' }),
  release:  (id)         => request(`/api/milestones/${id}/release`, { method: 'PUT' }),
};

// ── PAYMENTS ───────────────────────────────────────
export const paymentsAPI = {
  list:    (projectId) => request(`/api/payments/project/${projectId}`),
  create:  (body)      => request('/api/payments', { method: 'POST', body: JSON.stringify(body) }),
  approve: (id)        => request(`/api/payments/${id}/approve`, { method: 'PUT' }),
  reject:  (id)        => request(`/api/payments/${id}/reject`, { method: 'PUT' }),
};

// ── DISPUTES ───────────────────────────────────────
export const disputesAPI = {
  list:    (projectId) => request(`/api/disputes/project/${projectId}`),
  create:  (body)      => request('/api/disputes', { method: 'POST', body: JSON.stringify(body) }),
  resolve: (id, body)  => request(`/api/disputes/${id}/resolve`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ── CATEGORIES ─────────────────────────────────────
export const categoriesAPI = {
  list:   ()         => request('/api/categories'),
  create: (body)     => request('/api/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id)       => request(`/api/categories/${id}`, { method: 'DELETE' }),
};

// ── FAQS ───────────────────────────────────────────
export const faqsAPI = {
  list:   (type)     => request(`/api/faqs${type ? `?type=${type}` : ''}`),
  create: (body)     => request('/api/faqs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/faqs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id)       => request(`/api/faqs/${id}`, { method: 'DELETE' }),
};

// ── ADMIN ──────────────────────────────────────────
export const adminAPI = {
  getPendingProfessionals: () => request('/api/admin/professionals/pending'),
  approveProfessional: (id) => request(`/api/admin/professionals/${id}/approve`, { method: 'POST' }),
  rejectProfessional: (id) => request(`/api/admin/professionals/${id}/reject`, { method: 'POST' }),
};