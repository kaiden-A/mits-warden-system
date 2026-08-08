import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxy('PATCH', `/api/wardens/${id}/admin`, body);
}
