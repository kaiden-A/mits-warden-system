import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL;

export async function proxy(method: string, path: string, body?: unknown) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body as BodyInit : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json();
  return NextResponse.json(data, { status: res.status });
}

export function urlFromReq(base: string, req: Request): string {
  const url = new URL(req.url);
  return base + url.search;
}
