import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    const tableNumber = String(body.tableNumber || "").trim();
    const token = String(body.token || "").trim();

    if (!tableNumber || !token) {
      return NextResponse.json({ message: "QR ไม่ถูกต้อง" }, { status: 400 });
    }

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id, table_number, adult_count, child_count, status, opened_at")
      .eq("table_number", tableNumber)
      .eq("token", token)
      .eq("status", "open")
      .maybeSingle();

    if (error) throw error;
    if (!session) {
      return NextResponse.json({ message: "QR นี้หมดอายุ หรือโต๊ะถูกปิดแล้ว" }, { status: 403 });
    }

    const response = NextResponse.json({
      ok: true,
      session: { id: session.id, table_number: session.table_number, adult_count: session.adult_count, child_count: session.child_count },
    });

    response.cookies.set("sw_session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Enter session error:", error);
    return NextResponse.json({ message: error.message || "ไม่สามารถเข้าโต๊ะได้" }, { status: 500 });
  }
}
