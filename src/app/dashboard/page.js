"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowDownRight, ArrowUpRight, Wallet, Target,
  TrendingUp, TrendingDown, Calendar, Activity,
  AlertTriangle, CheckCircle2, Clock, Zap, Brain, Heart, Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';

// ─── Warna kategori ───────────────────────────────────────────────────────────
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

// ─── Formatter ────────────────────────────────────────────────────────────────
const fmtRp = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val || 0);

const fmtShort = (val) => {
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000)     return `Rp ${(val / 1_000).toFixed(0)}k`;
  return `Rp ${val}`;
};

// ─── Komponen Badge Status Budget ────────────────────────────────────────────
function BudgetBadge({ pct }) {
  if (pct === 0) return null;
  if (pct >= 100) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Budget habis!
    </span>
  );
  if (pct >= 90) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Hampir habis
    </span>
  );
  if (pct >= 75) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
      <Activity className="w-3 h-3" /> {pct}% terpakai
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Aman · {pct}%
    </span>
  );
}

function HealthScoreCard({ score, savingRate }) {
  const getLabel = (s) => {
    if (s >= 80) return { text: 'Sangat Sehat', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (s >= 60) return { text: 'Cukup Sehat', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (s >= 40) return { text: 'Perlu Perhatian', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { text: 'Kurang Sehat', color: 'text-red-600', bg: 'bg-red-50' };
  };
  const label = getLabel(score);

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 shadow-sm ${label.bg} border-current opacity-90`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Heart className={`w-5 h-5 ${label.color} fill-current`} />
          </div>
          <h3 className="font-bold text-slate-800">Financial Health</h3>
        </div>
        <div className={`text-2xl font-black ${label.color}`}>{score}/100</div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-600">
          <span>{label.text}</span>
          <span>Saving Rate: {savingRate}%</span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${score >= 60 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
            style={{ width: `${score}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

function BrainyInsights({ data }) {
  const insights = [
    {
      title: 'Peluang Nabung',
      desc: `Bulan ini kamu sudah menyisihkan ${data.health.savingRate}% pendapatan. Mantap!`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Prediksi Pengeluaran',
      desc: `Di akhir bulan nanti, total pengeluaranmu diprediksi ${fmtRp(data.prediksiAkhir)}.`,
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Brainy Insights</h3>
          <p className="text-xs text-slate-500">Analisis otomatis oleh AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item, i) => (
          <div key={i} className={`p-4 rounded-xl border border-transparent hover:border-slate-100 transition-all ${item.bg}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-1.5 rounded-lg bg-white shadow-sm ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all border border-slate-200">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Tanya Detail ke AI Coach
      </button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, subtitle, badge, variant = 'default' }) {
  const variants = {
    default : 'bg-white border-slate-100',
    danger  : 'bg-red-50 border-red-200',
    success : 'bg-emerald-50 border-emerald-100',
    warning : 'bg-amber-50 border-amber-100',
  };
  const iconBg = {
    default : 'bg-blue-50 text-blue-600',
    danger  : 'bg-red-100 text-red-600',
    success : 'bg-emerald-100 text-emerald-600',
    warning : 'bg-amber-100 text-amber-700',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-sm p-5 md:p-6 flex flex-col gap-3 ${variants[variant]}`}>
      {/* Decorative bg circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-5 bg-current" />

      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${iconBg[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className={`text-2xl md:text-3xl font-bold tracking-tight ${variant === 'danger' ? 'text-red-600' : 'text-slate-800'}`}>
          {value}
        </p>
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          {trend !== undefined && trend !== null && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {trend >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Mini Progress Bar ─────────────────────────────────────────────────────────
function MiniBar({ value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Generate last 7 days for area chart ─────────────────────────────────────
function buildDailyData(rows) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    days.push({ key, label, keluar: 0, masuk: 0 });
  }
  rows.forEach(r => {
    const entry = days.find(d => d.key === r.tanggal);
    if (entry) {
      if (r.tipe === 'masuk') entry.masuk += parseInt(r.nominal || 0);
      else entry.keluar += parseInt(r.nominal || 0);
    }
  });
  return days;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? '☀️ Selamat pagi' : hour < 17 ? '🌤 Selamat siang' : '🌙 Selamat malam');
    setUserName(localStorage.getItem('wa_nama') || 'Pengguna');
  }, []);

  useEffect(() => {
    async function fetchData() {
      const wa = localStorage.getItem('wa_session');
      if (!wa) return;

      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const bulanKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const bulanNama = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

      // Ambil data paralel
      const [budgetRes, trxRes, allTrxRes] = await Promise.all([
        supabase.from('user_budgets').select('budget')
          .eq('wa_number', wa).eq('bulan', bulanKey).single(),
        supabase.from('transaksi').select('nominal,tipe,kategori,tanggal,judul,nama_toko,deskripsi')
          .eq('wa_number', wa).gte('tanggal', firstDay).order('tanggal', { ascending: true }),
        supabase.from('transaksi').select('nominal,tipe')
          .eq('wa_number', wa)
      ]);

      const budget  = budgetRes.data?.budget || 0;
      const rows    = trxRes.data || [];
      const allRows = allTrxRes.data || [];

      // Hitung totals bulan ini
      let totalMasuk = 0, totalKeluar = 0;
      const categoryMap = {};
      rows.forEach(t => {
        const nom = parseInt(t.nominal);
        if (t.tipe === 'masuk') totalMasuk += nom;
        else {
          totalKeluar += nom;
          const kat = t.kategori || 'Lain-lain';
          categoryMap[kat] = (categoryMap[kat] || 0) + nom;
        }
      });

      // All time saldo
      let saldo = 0;
      allRows.forEach(t => {
        const nom = parseInt(t.nominal || 0);
        if (t.tipe === 'masuk') saldo += nom;
        else saldo -= nom;
      });

      // Pie data
      const pieData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Daily chart data (7 hari)
      const dailyData = buildDailyData(rows);

      // Budget info
      const budgetPct = budget > 0 ? Math.min(100, Math.round((totalKeluar / budget) * 100)) : 0;
      const sisaBudget = budget > 0 ? budget - totalKeluar : 0;

      // Sisa hari bulan ini
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const sisaHari = lastDayOfMonth - now.getDate();

      // Rata-rata pengeluaran harian
      const rataHari = now.getDate() > 0 ? Math.round(totalKeluar / now.getDate()) : 0;

      // Prediksi akhir bulan
      const prediksiAkhir = rataHari * lastDayOfMonth;

      // --- NEW: Financial Health Score Calculation ---
      // Saving Rate (40%)
      const savingRateVal = totalMasuk > 0 ? Math.max(0, (totalMasuk - totalKeluar) / totalMasuk) : 0;
      const savingScore = Math.min(40, savingRateVal * 100 * 0.4 * 2);

      // Budget Discipline (30%)
      let budgetScore = 30;
      if (budget > 0) {
        const usage = totalKeluar / budget;
        if (usage > 1) budgetScore = Math.max(0, 30 - (usage - 1) * 30);
        else if (usage > 0.9) budgetScore = 20;
      }

      // Activity (30%)
      const activityScore = Math.min(30, (rows.length / 20) * 30);
      const totalScore = Math.round(savingScore + budgetScore + activityScore);

      setData({
        saldo, totalMasuk, totalKeluar,
        budget, budgetPct, sisaBudget,
        pieData, dailyData,
        bulanNama, sisaHari, rataHari, prediksiAkhir,
        txCount: rows.length,
        health: {
          score: totalScore,
          savingRate: Math.round(savingRateVal * 100)
        }
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 animate-pulse">Memuat data keuangan...</p>
      </div>
    );
  }

  if (!data) return null;

  const budgetVariant =
    data.budgetPct >= 100 ? 'danger'
    : data.budgetPct >= 90 ? 'warning'
    : 'success';

  return (
    <div className="space-y-6 pb-8">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-sm text-slate-400 font-medium">{greeting},</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{userName} 👋</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Periode: {data.bulanNama} · {data.txCount} transaksi · ⏳ sisa {data.sisaHari} hari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full">
            📊 Live
          </span>
        </div>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Saldo Keseluruhan"
          value={fmtRp(data.saldo)}
          icon={Wallet}
          variant={data.saldo < 0 ? 'danger' : 'default'}
          subtitle="Akumulasi semua waktu"
        />

        <StatCard
          title="Pemasukan Bulan Ini"
          value={fmtRp(data.totalMasuk)}
          icon={ArrowUpRight}
          variant="success"
          subtitle={data.txCount > 0 ? `${data.txCount} transaksi total` : 'Belum ada data'}
        />

        <StatCard
          title="Pengeluaran Bulan Ini"
          value={fmtRp(data.totalKeluar)}
          icon={ArrowDownRight}
          variant={data.totalKeluar > data.totalMasuk && data.totalMasuk > 0 ? 'danger' : 'default'}
          subtitle={`Rata-rata ${fmtShort(data.rataHari)}/hari`}
        />

        <StatCard
          title={data.budget > 0 ? 'Sisa Budget' : 'Budget Bulanan'}
          value={data.budget > 0 ? fmtRp(Math.max(0, data.sisaBudget)) : 'Belum diset'}
          icon={Target}
          variant={budgetVariant}
          badge={<BudgetBadge pct={data.budgetPct} />}
          subtitle={
            data.budget > 0
              ? `${fmtShort(data.totalKeluar)} dari ${fmtShort(data.budget)} (${data.budgetPct}%)`
              : 'Ketik "budget" di bot untuk mengatur'
          }
        />
      </div>

      {/* ── BUDGET PROGRESS BAR (hanya kalau budget sudah diset) ── */}
      {data.budget > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-700">Progress Budget {data.bulanNama}</h3>
              <p className="text-xs text-slate-400">
                {fmtRp(data.totalKeluar)} digunakan dari {fmtRp(data.budget)}
              </p>
            </div>
            <span className={`text-2xl font-bold ${
              data.budgetPct >= 100 ? 'text-red-600'
              : data.budgetPct >= 90 ? 'text-amber-600'
              : data.budgetPct >= 75 ? 'text-yellow-600'
              : 'text-emerald-600'
            }`}>
              {data.budgetPct}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                data.budgetPct >= 100 ? 'bg-red-500'
                : data.budgetPct >= 90 ? 'bg-amber-500'
                : data.budgetPct >= 75 ? 'bg-yellow-400'
                : 'bg-emerald-500'
              }`}
              style={{ width: `${data.budgetPct}%` }}
            />
          </div>
          {data.sisaBudget < 0 && (
            <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pengeluaran melebihi budget sebesar {fmtRp(Math.abs(data.sisaBudget))}
            </p>
          )}
          {data.prediksiAkhir > 0 && data.budget > 0 && data.sisaHari > 0 && (
            <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-400" />
              Prediksi pengeluaran akhir bulan: {fmtRp(data.prediksiAkhir)}
              {data.prediksiAkhir > data.budget && (
                <span className="text-red-500 font-medium ml-1">(⚠️ akan melebihi budget!)</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── CHARTS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Area Chart - 7 Hari */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-slate-800">Arus Kas 7 Hari Terakhir</h2>
              <p className="text-xs text-slate-400">Pengeluaran & Pemasukan harian</p>
            </div>
            <Clock className="w-4 h-4 text-slate-300" />
          </div>
          {data.dailyData.some(d => d.keluar > 0 || d.masuk > 0) ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={fmtShort}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="keluar"
                    name="Pengeluaran"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#colorKeluar)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="masuk"
                    name="Pemasukan"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorMasuk)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    formatter={(val) => (
                      <span className="text-slate-500">{val}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Activity className="w-10 h-10" />
              <p className="text-sm">Belum ada transaksi minggu ini</p>
            </div>
          )}
        </div>

        {/* Pie Chart - Kategori */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">Distribusi Kategori</h2>
            <p className="text-xs text-slate-400">Pengeluaran bulan ini</p>
          </div>
          {data.pieData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [fmtRp(value), '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(val) => (
                      <span className="text-slate-500 truncate max-w-[80px] inline-block">{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-slate-300 gap-2">
              <Target className="w-10 h-10" />
              <p className="text-sm">Belum ada pengeluaran</p>
            </div>
          )}
        </div>
      </div>

      {/* ── KATEGORI BREAKDOWN ───────────────────────────────────── */}
      {data.pieData.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-slate-800">Rincian per Kategori</h2>
              <p className="text-xs text-slate-400">Proporsi pengeluaran bulan ini</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.pieData.slice(0, 6).map((item, i) => {
              const pct = data.totalKeluar > 0
                ? Math.round((item.value / data.totalKeluar) * 100)
                : 0;
              return (
                <div key={item.name} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{pct}%</span>
                  </div>
                  <MiniBar
                    value={item.value}
                    max={data.totalKeluar}
                    color={`bg-[${COLORS[i % COLORS.length]}]`}
                  />
                  <p className="text-xs text-slate-400 text-right">{fmtRp(item.value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BAR CHART Top 5 Kategori ─────────────────────────────── */}
      {data.pieData.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
          <div className="mb-5">
            <h2 className="font-bold text-slate-800">Top 5 Pengeluaran Terbesar</h2>
            <p className="text-xs text-slate-400">Kategori dengan pengeluaran terbanyak</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.pieData.slice(0, 5)}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={fmtShort}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  width={100}
                />
                <RechartsTooltip
                  formatter={(value) => [fmtRp(value), 'Pengeluaran']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {data.pieData.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── QUICK SUMMARY FOOTER ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Rata-rata/hari',
            value: fmtShort(data.rataHari),
            icon: '📅',
            sub: 'Pengeluaran harian',
          },
          {
            label: 'Prediksi akhir bulan',
            value: fmtShort(data.prediksiAkhir),
            icon: '🔮',
            sub: data.budget > 0
              ? data.prediksiAkhir > data.budget ? '⚠️ Melebihi budget' : '✅ Dalam budget'
              : 'Berdasarkan rata-rata',
          },
          {
            label: 'Sisa hari',
            value: `${data.sisaHari} hari`,
            icon: '⏳',
            sub: `Hingga akhir ${data.bulanNama}`,
          },
          {
            label: 'Jml transaksi',
            value: data.txCount,
            icon: '🧾',
            sub: `Bulan ${data.bulanNama}`,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 text-center"
          >
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="text-lg font-bold text-slate-800">{item.value}</p>
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

    </div>
  );
}