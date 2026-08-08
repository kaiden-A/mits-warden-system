'use client';

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.role === 'admin' || user.is_admin) router.replace('/overview');
    else router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="text-center">
        <div className="text-paper font-heading text-xl animate-pulse">Log Tugas</div>
        <p className="text-[#A3BCAE] text-xs font-mono mt-2">Maahad Integrasi Tahfiz Selangor Alam Impian (MITSAI)</p>
      </div>
    </div>
  );
}
