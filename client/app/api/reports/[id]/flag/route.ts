import { NextRequest } from 'next/server';
import { proxy } from '@/app/lib/backend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return proxy('POST', `/api/reports/${id}/flag`, body);
}
