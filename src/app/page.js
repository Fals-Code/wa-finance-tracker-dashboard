"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Wallet } from "lucide-react";

function LoginContent() {
  const [waNumber, setWaNumber]   = useState("");
  const [authCode, setAuthCode]   = useState("");
  const [step, setStep]           = useState("input_number");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [countdown, setCountdown] = useState(0);

  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const autoId = searchParams.get("id");
    if (autoId) setWaNumber(autoId.split("@")[0]);
  }, [searchParams]);

  // Countdown timer rate-limit
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function normalizeWa(raw) {
    const digits = raw.replace(/[^0-9]/g, "");
    return digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  }

  // ─── KIRIM KODE: Update Supabase → Bot detect via Realtime → Kirim WA ──────
  // Fix: Tidak lagi POST ke /api/send-login-code (bot lokal tidak bisa diakses
  // dari Vercel). Cukup update authcode_requested di Supabase, bot sudah
  // subscribe Realtime dan akan otomatis kirim OTP ke WA.
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const searchDigit = normalizeWa(waNumber);

      // Cari user berdasarkan nomor WA
      const { data: users, error: dbError } = await supabase
        .from("user_profiles")
        .select("wa_number, authcode_created_at")
        .or(`wa_number.eq.${searchDigit}@c.us,wa_number.ilike.${searchDigit}%`)
        .limit(1);

      if (dbError || !users || users.length === 0) {
        setError("Nomor WA belum terdaftar. Chat bot WA terlebih dahulu.");
        setLoading(false);
        return;
      }

      const user = users[0];

      // Rate limit 30 detik
      if (user.authcode_created_at) {
        const diff = (Date.now() - new Date(user.authcode_created_at).getTime()) / 1000;
        if (diff < 30) {
          const sisa = Math.ceil(30 - diff);
          setError(`Tunggu ${sisa} detik sebelum minta kode baru.`);
          setCountdown(sisa);
          setLoading(false);
          return;
        }
      }

      const newCode = generateCode();

      // Update langsung ke Supabase
      // Bot sudah subscribe Realtime → otomatis kirim OTP ke WA
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          authcode: newCode,
          authcode_created_at: new Date().toISOString(),
          authcode_requested: true,
        })
        .eq("wa_number", user.wa_number);

      if (updateError) throw updateError;

      localStorage.setItem("temp_wa_id", user.wa_number);
      setStep("input_code");
      setSuccess("Kode OTP telah dikirim ke WhatsApp kamu!");

    } catch (err) {
      console.error("Send code error:", err);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFIKASI KODE ──────────────────────────────────────────────────────
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const targetNum = localStorage.getItem("temp_wa_id");
      if (!targetNum) {
        setError("Sesi habis. Masukkan nomor lagi.");
        setStep("input_number");
        setLoading(false);
        return;
      }

      const { data: user } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("wa_number", targetNum)
        .single();

      if (!user) {
        setError("User tidak ditemukan.");
        setLoading(false);
        return;
      }

      // Cek expire 10 menit
      const raw        = user.authcode_created_at;
      const normalized = raw?.endsWith("Z") ? raw : raw?.replace(" ", "T") + "Z";
      const diffMinutes = (Date.now() - new Date(normalized).getTime()) / 60000;

      if (diffMinutes > 10 || diffMinutes < -2) {
        setError("Kode sudah kedaluwarsa. Minta kode baru.");
        setLoading(false);
        return;
      }

      if (user.authcode !== authCode) {
        setError("Kode salah. Coba lagi.");
        setLoading(false);
        return;
      }

      // Hapus authcode setelah berhasil login
      await supabase
        .from("user_profiles")
        .update({ authcode: null, authcode_created_at: null, authcode_requested: false })
        .eq("wa_number", targetNum);

      localStorage.setItem("wa_session", user.wa_number);
      localStorage.setItem("wa_nama", user.nama || user.nama_user || targetNum.split("@")[0]);
      localStorage.removeItem("temp_wa_id");

      router.push("/dashboard");

    } catch (err) {
      console.error("Verify error:", err);
      setError("Terjadi kesalahan saat verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Finance Tracker</h2>
        <p className="text-sm text-gray-500 mt-2">Masuk untuk melihat laporan keuanganmu</p>
      </div>

      {step === "input_number" ? (

        /* ── FORM NOMOR WA ─────────────────────────────────────── */
        <form onSubmit={handleSendCode} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="08123456789 atau 628123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || countdown > 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors"
          >
            {loading
              ? "Mengirim..."
              : countdown > 0
              ? `Tunggu ${countdown}s`
              : "Kirim Kode OTP ke WA"}
          </button>

          <p className="text-xs text-center text-gray-400">
            Bot akan mengirim kode 6 digit ke WhatsApp kamu
          </p>
        </form>

      ) : (

        /* ── FORM KODE OTP ─────────────────────────────────────── */
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode OTP (6 digit)
            </label>
            <input
              type="text"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              autoFocus
            />
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <span>✅</span> {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || authCode.length < 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
          </button>

          <button
            type="button"
            onClick={() => { setStep("input_number"); setError(""); setAuthCode(""); setSuccess(""); }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
          >
            ← Ganti nomor
          </button>
        </form>

      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          <span>Memuat...</span>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}