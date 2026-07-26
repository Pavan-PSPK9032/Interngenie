const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function api(path: string, options?: RequestInit) {
  const url = `${API_URL}${path}`;
  return fetch(url, options);
}
