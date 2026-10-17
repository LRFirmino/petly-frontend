// Thin fetch wrapper around the petshop backend.
//
// By default it talks to "/api", which the Vite dev server proxies to
// http://localhost:8080 (see vite.config.js). Override with VITE_API_URL.

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'pawsclaws.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. O backend está rodando?', 0);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? 'Ocorreu um erro inesperado.',
      response.status,
      data?.details,
    );
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  register: (payload) =>
    request('/auth/register', { method: 'POST', body: payload, auth: false }),

  me: () => request('/auth/me'),

  dashboardSummary: () => request('/dashboard/summary'),

  clients: () => request('/clients'),
  clientsSummary: () => request('/clients/summary'),
  createClient: (payload) => request('/clients', { method: 'POST', body: payload }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: 'PUT', body: payload }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  pets: (clientId) =>
    request(`/pets${clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''}`),

  appointments: (from, to) =>
    request(
      from && to
        ? `/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        : '/appointments',
    ),
  createAppointment: (payload) => request('/appointments', { method: 'POST', body: payload }),
  updateAppointment: (id, payload) => request(`/appointments/${id}`, { method: 'PUT', body: payload }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  services: () => request('/services'),
  createService: (payload) => request('/services', { method: 'POST', body: payload }),
  updateService: (id, payload) => request(`/services/${id}`, { method: 'PUT', body: payload }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  combos: () => request('/combos'),
  createCombo: (payload) => request('/combos', { method: 'POST', body: payload }),
  updateCombo: (id, payload) => request(`/combos/${id}`, { method: 'PUT', body: payload }),
  deleteCombo: (id) => request(`/combos/${id}`, { method: 'DELETE' }),

  team: () => request('/team'),
  createTeamMember: (payload) => request('/team', { method: 'POST', body: payload }),
  updateTeamMember: (id, payload) => request(`/team/${id}`, { method: 'PUT', body: payload }),
  deleteTeamMember: (id) => request(`/team/${id}`, { method: 'DELETE' }),

  reports: () => request('/reports/summary'),

  users: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: payload }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  petshop: () => request('/petshop'),
  updatePetshop: (payload) => request('/petshop', { method: 'PUT', body: payload }),

  // Administração da plataforma (equipe Petly).
  platformPetshops: () => request('/platform/petshops'),
  createPlatformPetshop: (payload) => request('/platform/petshops', { method: 'POST', body: payload }),
  setPlatformPetshopActive: (id, active) =>
    request(`/platform/petshops/${id}/active?active=${active}`, { method: 'PUT' }),
  platformPetshopUsers: (id) => request(`/platform/petshops/${id}/users`),
  createPlatformPetshopUser: (id, payload) =>
    request(`/platform/petshops/${id}/users`, { method: 'POST', body: payload }),
};
