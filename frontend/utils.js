// Simple utility functions for the frontend

/**
 * Gets JWT auth headers if a token exists in localStorage.
 * @returns {object} Headers object or an empty object.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * A wrapper around m.request that automatically adds Authorization headers.
 * @param {object} options - Mithril request options.
 * @returns {Promise} The Mithril request promise.
 */
export const apiRequest = (options) => {
  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders, ...options.headers };
  return m.request({ ...options, headers });
};

/**
 * Logs the user out by removing the token and redirecting to the login page.
 */
export const logout = () => {
  localStorage.removeItem('token');
  m.route.set('/app/login');
};