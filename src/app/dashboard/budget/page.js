"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, TrendingDown, Save, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const fmtRp = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0);

export default function BudgetPage() {
  const [budget, setBudget]       = useState('');
  const [totalKeluar, setKeluar]  = useState(0);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [alert, setAlert]         = useState(null);
  const [bulanNama, setBulan]     = useState('');

  useEffect(() => {
    async function fetchBudget() {
      const wa  = localStorage.getItem('wa_session');
      if (!wa) return;

      const now      = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const bulanKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setBulan(now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }));

      const [budRes, trxRes] = await Promise.all([
        supabase.from('user_budgets').select('budget').eq('wa_number', wa).eq('bulan', bulanKey).single(),
        supabase.from('transaksi').select('nominal').eq('wa_number', wa).eq('tipe', 'keluar').gte('tanggal', firstDay),
      ]);

      if (budRes.data?.budget) setBudget(budRes.data.budget.toString());
      const tKeluar = (trxRes.data || []).reduce((s, r) => s + parseInt(r.nominal || 0), 0);
      setKeluar(tKeluar);
      setLoading(false);
    }
    fetchBudget();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    const wa        = localStorage.getItem('wa_session');
    const now       = new Date();
    const bulanKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetVal = parseInt(budget.replace(/\D/g, '')) || 0;

    if (budgetVal <= 0) {
      setAlert({ type: 'error', msg: 'Masukkan nominal budget yang valid.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('user_budgets')
      .upsert({ wa_number: wa, bulan: bulanKey, budget: budgetVal }, { onConflict: 'wa_number,bulan' });

    setSaving(false);
    setAlert(error
      ? { type: 'error', msg: 'Gagal menyimpan. Coba lagi.' }
      : { type: 'success', msg: `Budget ${fmtRp(budgetVal)} berhasil disimpan!` }
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const numBudget  = parseInt(budget.replace(/\D/g, '')) || 0;
  const sisa       = numBudget - totalKeluar;
  const pct        = numBudget > 0 ? Math.min(100, Math.round((totalKeluar / numBudget) * 100)) : 0;
  const isOver     = sisa < 0;

  const barColor =
    pct >= 100 ? 'bg-red-500'
    : pct >= 90 ? 'bg-amber-500'
    : pct >= 75 ? 'bg-yellow-400'
    : 'bg-emerald-500';

  const pctColor =
    pct >= 90 ? 'text-red-600'
    : pct >= 75 ? 'text-amber-600'
    : 'text-emerald-600';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Manajemen Anggaran</h1>
        <p className="text-sm text-slate-400 mt-0.5">Atur batas pengeluaran bulanan • {bulanNama}</p>
      </div>

      {/* ── SET BUDGET FORM ────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          Budget Pengeluaran Bulan Ini
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-medium select-none">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={budget.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              onChange={e => setBudget(e.target.value.replace(/\./g, '').replace(/\D/g, ''))}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 text-lg font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            Angka tanpa titik, format Rupiah otomatis. Kamu juga bisa set budget lewat bot WA.
          </p>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {saving ? 'Menyimpan...' : 'Simpan Budget'}
            </button>

            {alert && (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                alert.type === 'success' ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {alert.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />
                }
                {alert.msg}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── PROGRESS ────────────────────────────────────────────── */}
      {numBudget > 0 && (
        <div className={`bg-white border rounded-2xl shadow-sm p-6 ${isOver ? 'border-red-200' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Penggunaan Budget</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {fmtRp(totalKeluar)} dari {fmtRp(numBudget)}
              </p>
            </div>
            <span className={`text-2xl font-bold ${pctColor}`}>{pct}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {isOver && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Pengeluaran melebihi budget sebesar {fmtRp(Math.abs(sisa))}! Kurangi pengeluaran.
            </div>
          )}
        </div>
      )}

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Total Terpakai</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmtRp(totalKeluar)}</p>
          {numBudget > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span className={`font-semibold ${pctColor}`}>{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className={`bg-white border rounded-2xl shadow-sm p-6 ${isOver ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${isOver ? 'bg-red-100' : 'bg-emerald-50'}`}>
              <Target className={`w-4 h-4 ${isOver ? 'text-red-500' : 'text-emerald-500'}`} />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Sisa Budget</h3>
          </div>
          <p className={`text-2xl font-bold ${isOver ? 'text-red-600' : 'text-slate-800'}`}>
            {isOver ? '- ' : ''}{fmtRp(Math.abs(sisa))}
          </p>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            {numBudget <= 0
              ? 'Budget belum diset. Isi form di atas untuk mulai.'
              : isOver
              ? '⚠️ Budget sudah terlampaui. Perhatikan pengeluaranmu!'
              : '✅ Masih aman. Jaga pengeluaran hingga akhir bulan!'}
          </p>
        </div>
      </div>
    </div>
  );
}
