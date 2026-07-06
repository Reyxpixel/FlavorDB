export function apiPath(path) {
  const base = process.env.REACT_APP_API_BASE || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
