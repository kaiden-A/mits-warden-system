import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy('GET', `/api/reports/${id}`);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxy('PATCH', `/api/reports/${id}`, body);
}
