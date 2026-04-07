const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const makeUrl = (path) => {
  const normalizedBase = BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const parseJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const request = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, ...rest } = options;
  const response = await fetch(makeUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const errorMessage =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (payload == null) {
    return {
      success: true,
      data: null,
      message: 'Request succeeded with empty response.',
    };
  }

  return payload;
};
