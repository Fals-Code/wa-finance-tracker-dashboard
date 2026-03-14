// src/app/api/send-otp/route.js
// ✅ API Route ini berjalan di Vercel (server-side), bukan di bot lokal.
// Flow: Dashboard POST ke sini → update Supabase → Bot detect via Realtime → Kirim WA

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Gunakan SERVICE ROLE KEY (bukan anon key) agar bisa bypass RLS
// Tambahkan SUPABASE_SERVICE_ROLE_KEY di Vercel environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { waNumber } = await request.json();

    if (!waNumber) {
      return NextResponse.json({ error: "waNumber required" }, { status: 400 });
    }

    // Cari user
    const { data: users, error: dbError } = await supabase
      .from("user_profiles")
      .select("wa_number, authcode_created_at")
      .or(`wa_number.eq.${waNumber}@c.us,wa_number.ilike.${waNumber}%`)
      .limit(1);

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Nomor WA belum terdaftar. Chat bot WA terlebih dahulu." },
        { status: 404 }
      );
    }

    const user = users[0];

    // Rate limit 30 detik
    if (user.authcode_created_at) {
      const diff =
        (Date.now() - new Date(user.authcode_created_at).getTime()) / 1000;
      if (diff < 30) {
        const sisa = Math.ceil(30 - diff);
        return NextResponse.json(
          { error: `Tunggu ${sisa} detik sebelum minta kode baru.`, countdown: sisa },
          { status: 429 }
        );
      }
    }

    // Generate kode di server (aman!)
    const newCode = generateCode();

    // Update Supabase → Bot akan detect via Realtime dan kirim WA
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        authcode: newCode,
        authcode_created_at: new Date().toISOString(),
        authcode_requested: true,
      })
      .eq("wa_number", user.wa_number);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Gagal menyimpan kode." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      wa_number: user.wa_number,
      message: "Kode OTP telah dikirim ke WhatsApp kamu!",
    });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}