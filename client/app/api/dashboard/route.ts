import { NextRequest } from 'next/server';
import { proxy, urlFromReq } from '@/app/lib/backend';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get('admin') === '1';
  const path = isAdmin ? '/api/dashboard/admin' : '/api/dashboard';
  return proxy('GET', path);
}
