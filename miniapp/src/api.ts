import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const uploadFile = async (
  file: File,
  fields: { category: string; orderId?: string; customerId?: string },
): Promise<void> => {
  const form = new FormData();

  form.append('category', fields.category);

  if (fields.orderId) {
    form.append('orderId', fields.orderId);
  }

  if (fields.customerId) {
    form.append('customerId', fields.customerId);
  }

  form.append('file', file);

  const token = localStorage.getItem('accessToken');

  const response = await fetch('/api/v1/files', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text.slice(0, 200)}`);
  }
};