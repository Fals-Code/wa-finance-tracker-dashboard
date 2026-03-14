"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowDownRight, ArrowUpRight, Wallet, Target } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function DashboardOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const wa = localStorage.getItem('wa_session');
      if (!wa) return;

      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const bulanKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 1. Ambil Budget
      const { data: budgetData } = await supabase
        .from('user_budgets')
        .select('budget')
        .eq('wa_number', wa)
        .eq('bulan', bulanKey)
        .single();
      
      const budget = budgetData?.budget || 0;

      // 2. Ambil Transaksi Bulan Ini
      const { data: trx } = await supabase
        .from('transaksi')
        .select('nominal, tipe, kategori, tanggal')
        .eq('wa_number', wa)
        .gte('tanggal', firstDay);

      let totalMasuk = 0;
      let totalKeluar = 0;
      const categoryMap = {};

      (trx || []).forEach(t => {
        const nom = parseInt(t.nominal);
        if (t.tipe === 'masuk') {
          totalMasuk += nom;
        } else {
          totalKeluar += nom;
          categoryMap[t.kategori] = (categoryMap[t.kategori] || 0) + nom;
        }
      });

      const pieData = Object.keys(categoryMap).map(k => ({
        name: k || 'Lainnya',
        value: categoryMap[k]
      })).sort((a,b) => b.value - a.value);

      // 3. Ambil total saldo All Time (hanya opsional, ini simulasi sederhana dari bulan ini + asumsi jika ada riwayat. Untuk akurasi, ambil tanpa filter tanggal)
      const { data: allTrx } = await supabase
        .from('transaksi')
        .select('nominal, tipe')
        .eq('wa_number', wa);
      
      let saldo = 0;
      (allTrx || []).forEach(t => {
        if (t.tipe === 'masuk') saldo += parseInt(t.nominal);
        else saldo -= parseInt(t.nominal);
      });

      setData({
        saldo,
        totalMasuk,
        totalKeluar,
        budget,
        pieData
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const StatCard = ({ title, value, icon: Icon, colorClass, subtitle, warning }) => (
    <div className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border ${warning ? 'border-red-200' : 'border-slate-100'} flex flex-col gap-1 md:gap-2`}>
      <div className="flex items-center gap-3 text-slate-500 mb-1 md:mb-2">
        <div className={`p-1.5 md:p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-4 h-4 md:w-5 md:h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <span className="font-medium text-xs md:text-sm">{title}</span>
      </div>
      <h3 className={`text-2xl md:text-3xl font-bold ${warning ? 'text-red-600' : 'text-slate-800'}`}>
        {warning ? '- ' : ''}Rp {Math.abs(value).toLocaleString('id-ID')}
      </h3>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      {warning && <p className="text-xs text-red-500 font-medium mt-1">⚠️ Budget terlampaui!</p>}
    </div>
  );

  const sisaBudget = data.budget > 0 ? data.budget - data.totalKeluar : 0;
  const budgetPct = data.budget > 0 ? Math.round((data.totalKeluar / data.budget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Ringkasan Keuangan</h1>
        <p className="text-sm text-slate-500 font-medium">Bulan Ini</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Saldo (All Time)" 
          value={data.saldo} 
          icon={Wallet} 
          colorClass="bg-blue-600" 
        />
        <StatCard 
          title="Pemasukan Bulan Ini" 
          value={data.totalMasuk} 
          icon={ArrowUpRight} 
          colorClass="bg-emerald-500" 
        />
        <StatCard 
          title="Pengeluaran Bulan Ini" 
          value={data.totalKeluar} 
          icon={ArrowDownRight} 
          colorClass="bg-red-500" 
        />
        <StatCard 
          title="Sisa Budget Bulan Ini" 
          value={sisaBudget < 0 ? 0 : sisaBudget}
          icon={Target} 
          colorClass={budgetPct >= 90 ? "bg-red-500" : budgetPct >= 75 ? "bg-amber-500" : "bg-emerald-500"}
          subtitle={
            data.budget > 0 
              ? `${budgetPct}% terpakai dari Rp ${data.budget.toLocaleString('id-ID')}`
              : 'Belum set budget · Ketik "budget" di bot'
          }
          warning={sisaBudget < 0}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6">Pengeluaran per Kategori</h2>
          {data.pieData.length > 0 ? (
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400">
              <Target className="w-12 h-12 mb-3 text-slate-300" />
              <p>Belum ada pengeluaran bulan ini</p>
            </div>
          )}
        </div>

        {/* Minimal Bar Chart - Top Kategori */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 lg:border-slate-100">
          <h2 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6">Kategori Terbesar</h2>
          {data.pieData.length > 0 ? (
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pieData.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={80} />
                  <RechartsTooltip 
                     formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                     cursor={{fill: '#f1f5f9'}}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                    {data.pieData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex text-slate-400 items-center justify-center">
              Tidak ada data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
