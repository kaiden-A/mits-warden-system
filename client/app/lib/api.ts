let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiGet(path: string, searchParams?: Record<string, string>) {
  const url = new URL(path, window.location.origin);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  let res = await fetch(url.toString());
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await fetch(url.toString());
  }
  return handleResponse(res);
}

export async function apiPost(path: string, body?: unknown) {
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  };
  let res = await fetch(path, opts);
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await fetch(path, opts);
  }
  return handleResponse(res);
}

export async function apiPatch(path: string, body?: unknown) {
  const opts: RequestInit = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  };
  let res = await fetch(path, opts);
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await fetch(path, opts);
  }
  return handleResponse(res);
}

export async function apiDelete(path: string) {
  const opts: RequestInit = { method: 'DELETE' };
  let res = await fetch(path, opts);
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await fetch(path, opts);
  }
  if (!res.ok) return handleResponse(res);
  return null;
}

export async function apiPut(path: string, body?: unknown) {
  const opts: RequestInit = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  };
  let res = await fetch(path, opts);
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) res = await fetch(path, opts);
  }
  return handleResponse(res);
}
