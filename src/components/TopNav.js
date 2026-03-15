"use client";
import { useEffect, useState } from 'react';
import { Bell, Menu, Home, List, Target } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ROUTE_LABELS = {
  '/dashboard':             { label: 'Ringkasan',  icon: Home },
  '/dashboard/transaksi':   { label: 'Transaksi',  icon: List },
  '/dashboard/budget':      { label: 'Budget',      icon: Target },
};

export default function TopNav({ setSidebarOpen }) {
  const [userName, setUserName] = useState('');
  const [waId, setWaId]         = useState('');
  const pathname               = usePathname();

  useEffect(() => {
    setUserName(localStorage.getItem('wa_nama') || 'Pengguna');
    setWaId(localStorage.getItem('wa_session') || '');
  }, []);

  const route = ROUTE_LABELS[pathname] || { label: 'Dashboard', icon: Home };
  const RouteIcon = route.icon;

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left: Hamburger + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={setSidebarOpen}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-slate-600">
          <RouteIcon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">{route.label}</span>
        </div>
      </div>

      {/* Right: Bell + Avatar */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-all"
          title="Notifikasi (coming soon)"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase flex-shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-xs font-semibold text-slate-700">{userName}</span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">
              {waId.replace('@c.us', '').replace('@lid', '')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
