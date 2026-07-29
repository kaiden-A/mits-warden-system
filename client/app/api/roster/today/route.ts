import { proxy } from '@/app/lib/backend';

export async function GET() {
  return proxy('GET', '/api/roster/today');
}
