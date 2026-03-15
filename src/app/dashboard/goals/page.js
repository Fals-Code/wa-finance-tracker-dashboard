"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Target, Wallet, Calendar, Plus, 
  ChevronRight, Trophy, TrendingUp, AlertCircle 
} from 'lucide-react';

const fmtRp = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waId, setWaId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('wa_session');
    if (!id) {
      window.location.href = '/login';
      return;
    }
    setWaId(id);
    fetchGoals(id);
  }, []);

  async function fetchGoals(id) {
    try {
      const { data, error } = await supabase
        .from('saving_goals')
        .select('*')
        .eq('wa_number', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
              <Target className="w-8 h-8" />
            </div>
            Target Tabungan
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Wujudkan impianmu dengan menabung secara disiplin</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95">
          <Plus className="w-5 h-5" />
          Target Baru
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Target</p>
            <p className="text-xl font-black text-slate-800">{goals.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tercapai</p>
            <p className="text-xl font-black text-slate-800">{goals.filter(g => g.is_completed).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tabungan</p>
            <p className="text-xl font-black text-slate-800">{fmtRp(goals.reduce((s, g) => s + g.current_amount, 0))}</p>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Plus className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada target tabungan.</p>
            <p className="text-slate-400 text-sm">Mulai buat target pertamamu lewat bot atau tombol di atas.</p>
          </div>
        ) : (
          goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            return (
              <div key={goal.id} className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{goal.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Dibuat: {new Date(goal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  {goal.is_completed ? (
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Lunas
                    </div>
                  ) : (
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                      On Progress
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Terkumpul</p>
                      <p className="text-2xl font-black text-slate-800">{fmtRp(goal.current_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Target</p>
                      <p className="text-lg font-bold text-slate-600">{fmtRp(goal.target_amount)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${goal.is_completed ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-blue-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference">
                      {pct}%
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400">Sisa: {fmtRp(Math.max(0, goal.target_amount - goal.current_amount))}</span>
                    <button className="text-indigo-600 hover:gap-2 flex items-center gap-1 transition-all group/btn">
                      Detail <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-indigo-50 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 border border-indigo-100">
        <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-xl font-black text-indigo-900 mb-2">💡 Tips Menabung Cerdas</h4>
          <p className="text-indigo-700/80 font-medium">
            Tiap kali kamu mencatat "Simpanan" atau "Pemasukan" lewat bot WA, progres target tabunganmu akan otomatis terisi. 
            Coba ketik <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800 text-sm">Simpan buat laptop 100k</code> di bot!
          </p>
        </div>
      </div>
    </div>
  );
}
