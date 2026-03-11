"use client";
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Basic Auth Check
    const wa = localStorage.getItem('wa_session');
    if (!wa) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
