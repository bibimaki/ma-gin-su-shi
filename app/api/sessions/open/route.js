import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    const tableNumber = String(body.tableNumber || "").trim();
    const adultCount = Math.max(0, Number(body.adultCount) || 0);
    const childCount = Math.max(0, Number(body.childCount) || 0);

    if (!tableNumber) return NextResponse.json({ message: "กรุณากรอกหมายเลขโต๊ะ" }, { status: 400 });
    if (adultCount + childCount < 1) return NextResponse.json({ message: "กรุณาระบุจำนวนลูกค้าอย่างน้อย 1 คน" }, { status: 400 });

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("sessions")
      .select("id, table_number, adult_count, child_count, status, opened_at, token")
      .eq("table_number", tableNumber)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return NextResponse.json({ session: existing, reused: true });

    const token = crypto.randomBytes(32).toString("base64url");
    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .insert({
        table_number: tableNumber,
        adult_count: adultCount,
        child_count: childCount,
        status: "open",
        token,
      })
      .select("id, table_number, adult_count, child_count, status, opened_at, token")
      .single();

    if (error) throw error;
    return NextResponse.json({ session, reused: false });
  } catch (error) {
    console.error("Open session error:", error);
    return NextResponse.json({ message: error.message || "เปิดโต๊ะไม่สำเร็จ" }, { status: 500 });
  }
}
