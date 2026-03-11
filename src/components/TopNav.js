"use client";
import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';

export default function TopNav({ setSidebarOpen }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(localStorage.getItem('wa_nama') || 'User');
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={setSidebarOpen}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
            {userName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
