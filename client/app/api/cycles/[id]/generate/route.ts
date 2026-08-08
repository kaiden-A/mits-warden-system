import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => undefined);
  return proxy('POST', `/api/cycles/${id}/generate`, body);
}
