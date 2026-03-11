import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Wallet, LogIn } from 'lucide-react';

function LoginContent() {
  const [waNumber, setWaNumber] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [step, setStep] = useState('input_number'); // 'input_number' | 'input_code'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const autoId = searchParams.get('id');
    if (autoId) {
      setWaNumber(autoId.split('@')[0]);
      // Optional: Auto-trigger send code if ID is present
      handleSendCode(null, autoId);
    }
  }, [searchParams]);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const formatNumber = (num) => {
    let formatted = num.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.slice(1);
    }
    if (!formatted.endsWith('@c.us')) {
      formatted += '@c.us';
    }
    return formatted;
  };

  const handleSendCode = async (e, overrideNum = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formattedDigits = waNumber.replace(/[^0-9]/g, '');
    let searchDigit = formattedDigits;
    if (searchDigit.startsWith('0')) {
      searchDigit = '62' + searchDigit.slice(1);
    }
    
    const targetNum = overrideNum || searchDigit;
    const newCode = generateCode();

    try {
      // 1. Check if user exists (Flexible matching)
      let query = supabase.from('user_profiles').select('wa_number');
      
      if (overrideNum) {
        query = query.eq('wa_number', overrideNum);
      } else {
        // Search for ID starting with the digits (supports @c.us, @lid, etc.)
        query = query.ilike('wa_number', `${searchDigit}%`);
      }

      const { data: users, error: dbError } = await query;

      if (dbError || !users || users.length === 0) {
        setError('Nomor WA belum terdaftar. Silakan chat bot WA terlebih dahulu.');
        setLoading(false);
        return;
      }

      // Use the first match (usually unique number part)
      const foundWa = users[0].wa_number;

      // 2. Update authcode (this triggers the bot via Realtime)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ authcode: newCode })
        .eq('wa_number', foundWa);

      if (updateError) {
        throw new Error('Gagal mengirim kode. Coba lagi nanti.');
      }

      // Store the ACTUAL full ID for verification step
      localStorage.setItem('temp_wa_id', foundWa);

      setStep('input_code');
      setSuccess('Kode autentikasi telah dikirim ke WhatsApp Anda.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const targetNum = localStorage.getItem('temp_wa_id');

    if (!targetNum) {
      setError('Sesi kedaluwarsa. Silakan ulangi masukkan nomor.');
      setStep('input_number');
      setLoading(false);
      return;
    }

    try {
      const { data: user, error: dbError } = await supabase
        .from('user_profiles')
        .select('nama, authcode, wa_number')
        .eq('wa_number', targetNum)
        .single();

      if (dbError || !user) {
        setError('Data tidak ditemukan.');
        setLoading(false);
        return;
      }

      if (user.authcode !== authCode) {
        setError('Kode autentikasi salah. Silakan periksa kembali.');
        setLoading(false);
        return;
      }

      // Clear authcode after success
      await supabase.from('user_profiles').update({ authcode: null }).eq('wa_number', targetNum);

      // Set session
      localStorage.setItem('wa_session', user.wa_number);
      localStorage.setItem('wa_nama', user.nama);
      localStorage.removeItem('temp_wa_id');
      
      router.push('/dashboard');
    } catch (err) {
      setError('Terjadi kesalahan saat verifikasi.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Finance Tracker</h2>
        <p className="text-sm text-gray-500 mt-2">Masuk untuk melihat laporan keuanganmu</p>
      </div>

      {step === 'input_number' ? (
        <form onSubmit={handleSendCode} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="08123456789"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Gunakan nomor WA yang sudah terdaftar di bot</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
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
                Dapatkan Kode Login
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kode Autentikasi
            </label>
            <input
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Masukkan 6 digit kode"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-2xl tracking-widest font-bold text-slate-900"
              required
            />
            <p className="text-xs text-center text-gray-500 mt-2">Masukkan kode yang dikirim bot ke nomor {waNumber}</p>
          </div>

          {success && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center font-medium border border-green-100">
              {success}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-3">
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
                  Verifikasi & Masuk
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep('input_number')}
              className="w-full text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Ganti Nomor
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div className="text-slate-500">Memuat...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
