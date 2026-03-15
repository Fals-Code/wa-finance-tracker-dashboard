"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, ArrowDownRight, ArrowUpRight, FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 15;

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[40, 48, 28, 24].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className={`h-4 bg-slate-100 rounded-full animate-pulse w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Category badge colors ─────────────────────────────────────────────────────
const KAT_COLORS = {
  'Makanan & Minuman': 'bg-orange-50 text-orange-700',
  'Transportasi':      'bg-blue-50 text-blue-700',
  'Kesehatan':         'bg-green-50 text-green-700',
  'Hiburan':           'bg-purple-50 text-purple-700',
  'Belanja Online':    'bg-pink-50 text-pink-700',
  'Tagihan':           'bg-red-50 text-red-700',
  'Investasi':         'bg-emerald-50 text-emerald-700',
};

function KatBadge({ kategori }) {
  const cls = KAT_COLORS[kategori] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {kategori || 'Lain-lain'}
    </span>
  );
}

export default function TransaksiPage() {
  const [transaksi, setTransaksi]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterBulan, setFilterBulan] = useState('');
  const [page, setPage]             = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const wa = localStorage.getItem('wa_session');
    if (!wa) return;

    let query = supabase
      .from('transaksi')
      .select('id,tanggal,judul,nama_toko,deskripsi,kategori,nominal,tipe,catatan,created_at')
      .eq('wa_number', wa)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    const { data } = await query;
    setTransaksi(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const wa = localStorage.getItem('wa_session');
    if (!wa) return;

    const channel = supabase
      .channel('transaksi-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transaksi',
        filter: `wa_number=eq.${wa}`,
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = transaksi.filter(t => {
    const matchType  = filterType === 'all' || t.tipe === filterType;
    const label      = (t.judul || t.nama_toko || t.deskripsi || '').toLowerCase();
    const matchSearch = label.includes(search.toLowerCase()) ||
                        (t.kategori || '').toLowerCase().includes(search.toLowerCase());

    let matchBulan = true;
    if (filterBulan) {
      matchBulan = t.tanggal?.startsWith(filterBulan);
    }
    return matchType && matchSearch && matchBulan;
  });

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v) => { setSearch(v); setPage(0); };
  const handleType   = (v) => { setFilterType(v); setPage(0); };
  const handleBulan  = (v) => { setFilterBulan(v); setPage(0); };

  // Build month options from data
  const bulanOptions = [...new Set(transaksi.map(t => t.tanggal?.slice(0, 7)).filter(Boolean))].sort().reverse();

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="space-y-5 pb-8">

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} transaksi{search || filterType !== 'all' || filterBulan ? ' ditemukan' : ''}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 px-3 py-2 rounded-xl transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── FILTERS ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, toko, atau kategori..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-white"
          />
        </div>

        {/* Tipe filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={filterType}
            onChange={e => handleType(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none appearance-none cursor-pointer transition-all"
          >
            <option value="all">Semua Tipe</option>
            <option value="keluar">Pengeluaran</option>
            <option value="masuk">Pemasukan</option>
          </select>
        </div>

        {/* Bulan filter */}
        {bulanOptions.length > 0 && (
          <select
            value={filterBulan}
            onChange={e => handleBulan(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none appearance-none cursor-pointer transition-all"
          >
            <option value="">Semua Bulan</option>
            {bulanOptions.map(b => (
              <option key={b} value={b}>
                {new Date(b + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── TABLE ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Tanggal</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Transaksi</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Kategori</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginated.length > 0 ? (
                paginated.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap text-xs font-medium">
                      {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 max-w-[260px]">
                      <p className="font-medium text-slate-800 truncate">
                        {t.judul || t.nama_toko || t.deskripsi || '—'}
                      </p>
                      {t.catatan && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{t.catatan}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <KatBadge kategori={t.kategori} />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className={`font-semibold tabular-nums text-sm ${
                        t.tipe === 'masuk' ? 'text-emerald-600' : 'text-slate-700'
                      }`}>
                        {t.tipe === 'masuk' ? '+' : '−'} Rp {parseInt(t.nominal).toLocaleString('id-ID')}
                      </span>
                      <span className="ml-1.5 text-slate-300">
                        {t.tipe === 'masuk' ? <ArrowUpRight className="w-3.5 h-3.5 inline text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 inline text-slate-300" />}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-600">Tidak ada transaksi</p>
                        <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Halaman {page + 1} dari {totalPages} · {filtered.length} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
