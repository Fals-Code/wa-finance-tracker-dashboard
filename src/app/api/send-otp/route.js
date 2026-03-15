// src/app/api/send-otp/route.js
// Flow: Dashboard POST → update Supabase authcode → Bot detect via Realtime → Kirim WA

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Gunakan SERVICE ROLE KEY agar bisa bypass RLS.
// Set SUPABASE_SERVICE_ROLE_KEY di Vercel Project Settings → Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[send-otp] CRITICAL: Missing Supabase env vars!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { waNumber } = body;

    if (!waNumber) {
      return NextResponse.json({ error: "waNumber required" }, { status: 400 });
    }

    // Normalisasi: cari dengan berbagai variasi suffix
    const candidates = [
      `${waNumber}@c.us`,
      `${waNumber}@lid`,
    ];

    // Coba exact match dulu untuk @c.us dan @lid
    let foundUser = null;
    for (const candidate of candidates) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("wa_number, authcode_created_at")
        .eq("wa_number", candidate)
        .single();
      
      if (!error && data) {
        foundUser = data;
        break;
      }
    }

    // Fallback: ilike search jika exact match gagal
    if (!foundUser) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("wa_number, authcode_created_at")
        .ilike("wa_number", `${waNumber}%`)
        .limit(1);
      
      if (!error && data && data.length > 0) {
        foundUser = data[0];
      }
    }

    if (!foundUser) {
      return NextResponse.json(
        { error: "Nomor WA belum terdaftar. Chat bot WA terlebih dahulu." },
        { status: 404 }
      );
    }

    // Rate limit 30 detik
    if (foundUser.authcode_created_at) {
      const raw = foundUser.authcode_created_at;
      const normalized = raw?.endsWith("Z") ? raw : raw?.replace(" ", "T") + "Z";
      const diff = (Date.now() - new Date(normalized).getTime()) / 1000;
      if (diff < 30) {
        const sisa = Math.ceil(30 - diff);
        return NextResponse.json(
          { error: `Tunggu ${sisa} detik sebelum minta kode baru.`, countdown: sisa },
          { status: 429 }
        );
      }
    }

    // Generate kode
    const newCode = generateCode();

    // Update authcode — coba dengan authcode_requested dulu, fallback tanpa field itu
    const updatePayload = {
      authcode: newCode,
      authcode_created_at: new Date().toISOString(),
    };

    // Coba update dengan authcode_requested
    let updateResult = await supabase
      .from("user_profiles")
      .update({ ...updatePayload, authcode_requested: true })
      .eq("wa_number", foundUser.wa_number);

    // Jika gagal (misal kolom tidak ada), coba tanpa authcode_requested
    if (updateResult.error) {
      console.warn("[send-otp] Update with authcode_requested failed, trying without:", updateResult.error.message);
      
      updateResult = await supabase
        .from("user_profiles")
        .update(updatePayload)
        .eq("wa_number", foundUser.wa_number);
    }

    if (updateResult.error) {
      console.error("[send-otp] Final update error:", JSON.stringify(updateResult.error));
      return NextResponse.json(
        { 
          error: "Gagal menyimpan kode.",
          // hint untuk debugging — hapus di production setelah fix
          _debug: updateResult.error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wa_number: foundUser.wa_number,
      message: "Kode OTP telah dikirim ke WhatsApp kamu!",
    });

  } catch (err) {
    console.error("[send-otp] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error", _debug: err.message },
      { status: 500 }
    );
  }
}