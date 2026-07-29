import { NextRequest } from 'next/server';
import { proxy, urlFromReq } from '@/app/lib/backend';

export async function GET(request: NextRequest) {
  return proxy('GET', urlFromReq('/api/roster', request));
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return proxy('PUT', '/api/roster', body);
}
