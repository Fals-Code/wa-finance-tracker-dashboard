"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Target, LogOut, Wallet, X, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Sidebar({ isOpen, setOpen }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [waId, setWaId] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('wa_nama') || 'Pengguna');
    setWaId(localStorage.getItem('wa_session') || '');
  }, []);

  const menu = [
    { name: 'Ringkasan',  path: '/dashboard',             icon: LayoutDashboard },
    { name: 'Transaksi',  path: '/dashboard/transaksi',   icon: List },
    { name: 'Budget',     path: '/dashboard/budget',       icon: Target },
    { name: 'Target Tabungan', path: '/dashboard/goals',    icon: Wallet },
    { name: 'Tagihan Bersama', path: '/dashboard/split',   icon: Users },
  ];

  const handleLogout = () => {
    localStorage.removeItem('wa_session');
    localStorage.removeItem('wa_nama');
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 flex flex-col
        w-[260px] bg-white border-r border-slate-100 h-full
        transition-transform duration-300 md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-800 tracking-tight">Finance Tracker</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menu.map((m) => {
            const Icon = m.icon;
            const isActive = pathname === m.path;
            return (
              <Link
                key={m.path}
                href={m.path}
                onClick={() => setOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                {/* Active left border indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-600 rounded-full" />
                )}
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {m.name}
              </Link>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0 uppercase">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-400 font-mono leading-tight truncate">
                {waId.replace('@c.us', '').replace('@lid', '')}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
