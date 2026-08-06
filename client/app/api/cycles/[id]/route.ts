import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy('GET', `/api/cycles/${id}`);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxy('PATCH', `/api/cycles/${id}`, body);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy('DELETE', `/api/cycles/${id}`);
}
