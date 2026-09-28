import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const token = (await cookies()).get("sw_session_token")?.value;
    if (!token) return NextResponse.json({ message: "ไม่พบ Session ของโต๊ะนี้" }, { status: 401 });

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id, table_number, adult_count, child_count, status, opened_at")
      .eq("token", token)
      .eq("status", "open")
      .maybeSingle();

    if (error) throw error;
    if (!session) return NextResponse.json({ message: "Session หมดอายุหรือโต๊ะถูกปิดแล้ว" }, { status: 403 });

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, session_id, table_number, items, total, status, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    if (ordersError) throw ordersError;

    const { data: requests, error: requestsError } = await supabaseAdmin
      .from("staff_requests")
      .select("id, type, status, created_at")
      .eq("session_id", session.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (requestsError) throw requestsError;

    return NextResponse.json({ session, orders: orders || [], requests: requests || [] });
  } catch (error) {
    console.error("Customer data error:", error);
    return NextResponse.json({ message: error.message || "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
