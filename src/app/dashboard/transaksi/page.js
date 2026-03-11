"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ArrowDownRight, ArrowUpRight, FileText } from 'lucide-react';

export default function TransaksiPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, masuk, keluar

  useEffect(() => {
    async function fetchTrx() {
      const wa = localStorage.getItem('wa_session');
      if (!wa) return;

      const { data } = await supabase
        .from('transaksi')
        .select('*')
        .eq('wa_number', wa)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      setTransaksi(data || []);
      setLoading(false);
    }
    fetchTrx();
  }, []);

  const filteredData = transaksi.filter(t => {
    const matchType = filterType === 'all' || t.tipe === filterType;
    const matchSearch = (t.judul || t.nama_toko || '').toLowerCase().includes(search.toLowerCase()) || 
                        (t.kategori || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
         <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
            />
          </div>
          
          {/* Filter */}
          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 w-full border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none bg-white transition-all cursor-pointer"
            >
              <option value="all">Semua Tipe</option>
              <option value="keluar">Pengeluaran</option>
              <option value="masuk">Pemasukan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Judul / Toko</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{t.judul || t.nama_toko || '-'}</p>
                      {t.catatan && <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{t.catatan}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {t.kategori || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className={`inline-flex items-center justify-end w-full gap-1 font-semibold ${t.tipe === 'masuk' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {t.tipe === 'masuk' ? '+' : '-'} Rp {parseInt(t.nominal).toLocaleString('id-ID')}
                        {t.tipe === 'masuk' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 text-slate-300 mb-3" />
                      <p>Tidak ada transaksi ditemukan.</p>
                      <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
