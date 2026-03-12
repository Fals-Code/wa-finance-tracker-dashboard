"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Wallet, LogIn } from "lucide-react";

function LoginContent() {
  const [waNumber, setWaNumber] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [step, setStep] = useState("input_number");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const autoId = searchParams.get("id");
    if (autoId) {
      setWaNumber(autoId.split("@")[0]);
      handleSendCode(null, autoId);
    }
  }, [searchParams]);

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async (e, overrideNum = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formattedDigits = waNumber.replace(/[^0-9]/g, "");
    let searchDigit = formattedDigits;

    if (searchDigit.startsWith("0")) {
      searchDigit = "62" + searchDigit.slice(1);
    }

    const newCode = generateCode();

    try {
      let query = supabase.from("user_profiles").select("*");

      if (overrideNum) {
        query = query.eq("wa_number", overrideNum);
      } else {
        query = query.ilike("wa_number", `${searchDigit}%`);
      }

      const { data: users, error: dbError } = await query;

      if (dbError || !users || users.length === 0) {
        setError("Nomor WA belum terdaftar. Chat bot WA terlebih dahulu.");
        setLoading(false);
        return;
      }

      const user = users[0];
      const foundWa = user.wa_number;

      // RATE LIMIT 30 DETIK
      if (user.authcode_created_at) {
        const createdAt = new Date(user.authcode_created_at);
        const diffSeconds = (Date.now() - createdAt.getTime()) / 1000;

        if (diffSeconds < 30) {
          setError(
            `Tunggu ${Math.ceil(
              30 - diffSeconds
            )} detik sebelum meminta kode baru.`
          );
          setLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          authcode: newCode,
          authcode_created_at: new Date(),
        })
        .eq("wa_number", foundWa);

      if (updateError) {
        throw new Error("Gagal mengirim kode.");
      }

      localStorage.setItem("temp_wa_id", foundWa);

      setStep("input_code");
      setSuccess("Kode login dikirim ke WhatsApp Anda.");
    } catch (err) {
      setError("Terjadi kesalahan saat mengirim kode.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const targetNum = localStorage.getItem("temp_wa_id");

    if (!targetNum) {
      setError("Sesi habis. Masukkan nomor lagi.");
      setStep("input_number");
      setLoading(false);
      return;
    }

    try {
      const { data: user, error: dbError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("wa_number", targetNum)
        .single();

      if (dbError || !user) {
        setError("User tidak ditemukan.");
        setLoading(false);
        return;
      }

      // EXPIRE CHECK (5 MENIT)
      const createdAt = new Date(user.authcode_created_at);
      const diffMinutes = (Date.now() - createdAt.getTime()) / 1000 / 60;

      if (diffMinutes > 5) {
        setError("Kode sudah kedaluwarsa. Silakan minta kode baru.");
        setLoading(false);
        return;
      }

      if (user.authcode !== authCode) {
        setError("Kode autentikasi salah.");
        setLoading(false);
        return;
      }

      // HAPUS OTP (SEKALI PAKAI)
      await supabase
        .from("user_profiles")
        .update({
          authcode: null,
          authcode_created_at: null,
        })
        .eq("wa_number", targetNum);

      localStorage.setItem("wa_session", user.wa_number);
      localStorage.setItem("wa_nama", user.nama);

      localStorage.removeItem("temp_wa_id");

      router.push("/dashboard");
    } catch (err) {
      setError("Terjadi kesalahan saat verifikasi.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Finance Tracker</h2>
        <p className="text-sm text-gray-500 mt-2">
          Masuk untuk melihat laporan keuanganmu
        </p>
      </div>

      {step === "input_number" ? (
        <form onSubmit={handleSendCode} className="space-y-6">
          <input
            type="text"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="08123456789"
            className="w-full px-4 py-3 border rounded-lg text-slate-900"
            required
          />

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading ? "Mengirim..." : "Dapatkan Kode Login"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <input
            type="text"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            placeholder="Kode OTP"
            maxLength={6}
            className="w-full px-4 py-3 border rounded-lg text-center text-xl tracking-widest text-slate-900"
          />

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            {loading ? "Memverifikasi..." : "Verifikasi & Masuk"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div>Memuat...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}