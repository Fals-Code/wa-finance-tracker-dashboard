"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Target, TrendingDown, Save } from 'lucide-react';

export default function BudgetPage() {
  const [budget, setBudget] = useState('');
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    async function fetchBudget() {
      const wa = localStorage.getItem('wa_session');
      if (!wa) return;

      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const bulanKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: bData } = await supabase
        .from('user_budgets')
        .select('budget')
        .eq('wa_number', wa)
        .eq('bulan', bulanKey)
        .single();
      
      const { data: trx } = await supabase
        .from('transaksi')
        .select('nominal')
        .eq('wa_number', wa)
        .eq('tipe', 'keluar')
        .gte('tanggal', firstDay);

      const tKeluar = (trx || []).reduce((s, r) => s + parseInt(r.nominal), 0);
      
      if (bData?.budget) setBudget(bData.budget.toString());
      setTotalKeluar(tKeluar);
      setLoading(false);
    }
    fetchBudget();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    const wa = localStorage.getItem('wa_session');
    const now = new Date();
    const bulanKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetVal = parseInt(budget.replace(/\D/g, '')) || 0;

    const { error } = await supabase
      .from('user_budgets')
      .upsert({ wa_number: wa, bulan: bulanKey, budget: budgetVal }, { onConflict: 'wa_number,bulan' });

    setSaving(false);
    if (error) {
      setAlert({ type: 'error', msg: 'Gagal menyimpan budget.' });
    } else {
      setAlert({ type: 'success', msg: 'Budget berhasil diperbarui!' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
         <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const numBudget = parseInt(budget.replace(/\D/g, '')) || 0;
  const sisa = numBudget - totalKeluar;
  const terpakaiPct = numBudget > 0 ? Math.min(Math.round((totalKeluar / numBudget) * 100), 100) : 0;
  
  let colorClass = 'bg-blue-500';
  if (terpakaiPct >= 90) colorClass = 'bg-red-500';
  else if (terpakaiPct >= 75) colorClass = 'bg-amber-500';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Manajemen Anggaran</h1>
      <p className="text-slate-500">Atur batas pengeluaran bulananmu agar pengeluaran lebih terkendali.</p>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Budget Pengeluaran Bulan Ini
            </label>
            <div className="relative max-w-sm">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium font-mono">Rp</span>
              <input
                type="text"
                value={budget.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                onChange={(e) => setBudget(e.target.value.replace(/\./g, ''))}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 text-lg font-semibold border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-400">Sisipkan angka tanpa titik, otomatis akan terformat.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Budget
            </button>
            
            {alert && (
              <span className={`text-sm font-medium ${alert.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                {alert.msg}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-slate-700">Terpakai Bulan Ini</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">
            Rp {totalKeluar.toLocaleString('id-ID')}
          </p>
          
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">Progress</span>
              <span className={terpakaiPct >= 90 ? 'text-red-600' : 'text-slate-700'}>{terpakaiPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                style={{ width: `${terpakaiPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <Target className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-700">Sisa Budget</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${sisa < 0 ? 'text-red-600' : 'text-slate-800'}`}>
            Rp {sisa.toLocaleString('id-ID')}
          </p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {sisa < 0 
              ? 'Oops! Pengeluaranmu sudah melebihi budget yang dianggarkan. Kurangi pengeluaran agar keuangan stabil.' 
              : 'Masih ada sisa budget. Jangan lupa menabung sisa uang ini di akhir bulan!'}
          </p>
        </div>
      </div>
    </div>
  );
}
