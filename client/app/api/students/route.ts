import { NextResponse } from 'next/server';

const STUDENT_BASE = process.env.STUDENT_API_URL;
const PAGE_SIZE = 200;

interface Student {
  id: number;
  ic_number: string;
  name: string;
  gender: 'male' | 'female';
  tingkatan: number;
  kelas: string;
  birth_year: number;
  year: number;
}

async function fetchPage(offset: number): Promise<Student[]> {
  const url = `${STUDENT_BASE}/api/v1/students?limit=${PAGE_SIZE}&offset=${offset}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Student API error: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function GET(): Promise<NextResponse> {
  try {
    const first = await fetchPage(0);
    const items = [...first];
    if (first.length === PAGE_SIZE) {
      let offset = PAGE_SIZE;
      let page = await fetchPage(offset);
      while (page.length > 0) {
        items.push(...page);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
        page = await fetchPage(offset);
      }
    }
    return NextResponse.json({ total: items.length, items });
  } catch (err) {
    return NextResponse.json(
      { total: 0, items: [], error: err instanceof Error ? err.message : 'Failed to load students' },
      { status: 502 }
    );
  }
}