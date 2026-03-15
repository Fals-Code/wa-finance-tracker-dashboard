"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Receipt, Calendar, 
  ChevronRight, ArrowLeft, MessageSquare 
} from 'lucide-react';

export default function SplitBillHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waId, setWaId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('wa_session');
    if (!id) {
      window.location.href = '/login';
      return;
    }
    setWaId(id);
    fetchHistory(id);
  }, []);

  async function fetchHistory(id) {
    try {
      const { data, error } = await supabase
        .from('split_bills')
        .select('*')
        .eq('wa_number', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching split history:', err);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
            <Users className="w-8 h-8" />
          </div>
          Riwayat Tagihan Bersama
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Lihat kembali rincian patungan yang pernah kamu buat</p>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
              <Receipt className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium">Belum ada riwayat split bill.</p>
            <p className="text-slate-400 text-sm">Kirim foto struk dengan caption "split" ke bot untuk memulai!</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-slate-400">
                        Pukul {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    AI Parsed
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Instruksi Kamu:
                    </p>
                    <div className="bg-slate-50 p-3 rounded-xl text-sm italic text-slate-600 border border-slate-100">
                      "{item.prompt}"
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="w-3 h-3" /> Hasil Perhitungan:
                    </p>
                    <div className="bg-indigo-50/50 p-4 rounded-xl text-sm font-mono text-slate-700 leading-relaxed whitespace-pre-wrap border border-indigo-50">
                      {item.result_text.length > 200 ? item.result_text.substring(0, 200) + '...' : item.result_text}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                  <button className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all group">
                    Lihat Hasil Lengkap <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
