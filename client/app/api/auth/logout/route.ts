import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const cookieStore = request.cookies;
  const refreshToken = cookieStore.get('refreshToken')?.value;
  const token = cookieStore.get('token')?.value;

  if (refreshToken && token) {
    await fetch(`${BACKEND}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('token', '', { maxAge: 0, path: '/' });
  response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
  return response;
}
