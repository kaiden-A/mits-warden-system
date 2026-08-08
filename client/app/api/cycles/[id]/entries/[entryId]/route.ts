import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await params;
  const body = await request.json();
  return proxy('PATCH', `/api/cycles/${id}/entries/${entryId}`, body);
}
