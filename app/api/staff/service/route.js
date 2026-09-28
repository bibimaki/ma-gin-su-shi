import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

async function requireStaff() {
  const cookie = (await cookies()).get("sw_staff_access")?.value;
  if (cookie !== "1") {
    return false;
  }
  return true;
}

export async function GET() {
  try {
    if (!(await requireStaff())) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบพนักงาน" }, { status: 401 });
    }

    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, table_number, adult_count, child_count, status, opened_at")
      .eq("status", "open")
      .order("table_number", { ascending: true });

    if (sessionError) throw sessionError;

    const openSessions = sessions || [];
    const ids = openSessions.map((s) => s.id);

    let requests = [];
    if (ids.length) {
      const { data, error } = await supabaseAdmin
        .from("staff_requests")
        .select("id, session_id, type, status, created_at")
        .in("session_id", ids)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      requests = data || [];
    }

    return NextResponse.json({ sessions: openSessions, requests });
  } catch (error) {
    console.error("Staff service GET error:", error);
    return NextResponse.json({ message: error.message || "โหลดโต๊ะไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await requireStaff())) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบพนักงาน" }, { status: 401 });
    }

    const body = await request.json();
    const tableNumber = String(body.tableNumber || "").trim();
    const type = body.type === "bill" ? "bill" : "staff";

    if (!tableNumber) {
      return NextResponse.json({ message: "ไม่พบหมายเลขโต๊ะ" }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, table_number, adult_count, child_count, status")
      .eq("table_number", tableNumber)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ message: `โต๊ะ ${tableNumber} ยังไม่ได้เปิด Session` }, { status: 404 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("staff_requests")
      .select("id, session_id, type, status, created_at")
      .eq("session_id", session.id)
      .eq("type", type)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json({ request: existing, reused: true });
    }

    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from("staff_requests")
      .insert({
        session_id: session.id,
        type,
        status: "pending",
      })
      .select("id, session_id, type, status, created_at")
      .single();

    if (insertError) throw insertError;

    const title = type === "bill"
      ? "💳 พนักงานเรียกเก็บเงินจากโต๊ะ"
      : "🔔 พนักงานเรียกบริการที่โต๊ะ";

    await sendTelegramMessage(
      `🍣 SUSHI WANG NA\n\n${title}\n\n🪑 โต๊ะ: ${session.table_number}\n👥 ผู้ใหญ่ ${session.adult_count} • เด็ก ${session.child_count}\n🕐 ${new Date().toLocaleString("th-TH")}`
    );

    return NextResponse.json({ request: requestRow, reused: false });
  } catch (error) {
    console.error("Staff service POST error:", error);
    return NextResponse.json({ message: error.message || "ส่งคำขอไม่สำเร็จ" }, { status: 500 });
  }
}
