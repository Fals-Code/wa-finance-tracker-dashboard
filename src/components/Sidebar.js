"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Target, LogOut, Wallet } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    { name: 'Ringkasan', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', path: '/dashboard/transaksi', icon: List },
    { name: 'Budget', path: '/dashboard/budget', icon: Target },
  ];

  const handleLogout = () => {
    localStorage.removeItem('wa_session');
    localStorage.removeItem('wa_nama');
    window.location.href = '/';
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full hidden md:flex">
      <div className="p-6 border-b border-slate-100 mb-4">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
           <Wallet className="w-6 h-6" />
           Finance Tracker
        </h1>
      </div>
      <div className="flex-1 px-4 space-y-2">
        {menu.map((m) => {
          const Icon = m.icon;
          const isActive = pathname === m.path;
          return (
            <Link key={m.path} href={m.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon className="w-5 h-5" />
              {m.name}
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t border-slate-100">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
