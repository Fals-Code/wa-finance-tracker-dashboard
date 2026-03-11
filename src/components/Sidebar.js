"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, List, Target, LogOut, Wallet, X } from 'lucide-react';

export default function Sidebar({ isOpen, setOpen }) {
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
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setOpen(false)}
      />

      <div className={`
        fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col h-full z-50
        transition-transform duration-300 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
             <Wallet className="w-6 h-6" />
             Finance Tracker
          </h1>
          <button onClick={() => setOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 px-4 space-y-2">
          {menu.map((m) => {
            const Icon = m.icon;
            const isActive = pathname === m.path;
            return (
              <Link key={m.path} href={m.path} onClick={() => setOpen(false)}
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
    </>
  );
}
