const BASE_URL = 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const mensaje = data?.message || `Error ${response.status} en ${path}`;
    throw new Error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
  }

  return data;
}