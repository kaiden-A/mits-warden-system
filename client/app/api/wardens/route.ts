import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function GET() {
  return proxy('GET', '/api/wardens');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxy('POST', '/api/wardens', body);
}
