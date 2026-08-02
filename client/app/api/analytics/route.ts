import { NextRequest } from 'next/server';
import { proxy, urlFromReq } from '@/app/lib/backend';

export async function GET(request: NextRequest) {
  return proxy('GET', urlFromReq('/api/analytics', request));
}
