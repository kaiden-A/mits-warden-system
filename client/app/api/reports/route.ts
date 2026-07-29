import { NextRequest } from 'next/server';
import { proxy, urlFromReq } from '@/app/lib/backend';

export async function GET(request: NextRequest) {
  return proxy('GET', urlFromReq('/api/reports', request));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxy('POST', '/api/reports', body);
}
