"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Wallet, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [waNumber, setWaNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let formattedWa = waNumber.replace(/[^0-9]/g, '');
    if (formattedWa.startsWith('0')) {
      formattedWa = '62' + formattedWa.slice(1);
    }
    const fullWa = formattedWa + '@c.us';

    // Cek apakah user exist di DB
    const { data: user, error: dbError } = await supabase
      .from('user_profiles')
      .select('nama')
      .eq('wa_number', fullWa)
      .single();

    if (dbError || !user) {
      setError('Nomor WA belum terdaftar. Silakan chat bot WA terlebih dahulu.');
      setLoading(false);
      return;
    }

    // Set session (sementara JS LocalStorage)
    localStorage.setItem('wa_session', fullWa);
    localStorage.setItem('wa_nama', user.nama);
    
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Finance Tracker</h2>
          <p className="text-sm text-gray-500 mt-2">Masuk untuk melihat laporan keuanganmu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="08123456789"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Gunakan nomor WA yang sudah terdaftar di bot</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Masuk Dashboard
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
