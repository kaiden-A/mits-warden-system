import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy('POST', `/api/reports/${id}/submit`);
}
