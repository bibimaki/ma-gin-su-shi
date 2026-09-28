import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request) {
  try {
    const token = (await cookies()).get("sw_session_token")?.value;
    if (!token) return NextResponse.json({ message: "กรุณาเข้าโต๊ะผ่าน QR ก่อน" }, { status: 401 });

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, table_number, status")
      .eq("token", token)
      .eq("status", "open")
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return NextResponse.json({ message: "Session หมดอายุหรือโต๊ะถูกปิดแล้ว" }, { status: 403 });

    const body = await request.json();
    const type = body.type === "bill" ? "bill" : "staff";

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("staff_requests")
      .select("id, type, status, created_at")
      .eq("session_id", session.id)
      .eq("type", type)
      .eq("status", "pending")
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return NextResponse.json({ request: existing, reused: true });

    // Insert through a SECURITY DEFINER RPC that validates the QR session token.
    // This keeps RLS enabled and avoids exposing a broad staff_requests INSERT policy.
    const { data: staffRequest, error: insertError } = await supabase.rpc(
      "create_staff_request",
      { p_token: token, p_type: type }
    );
    if (insertError) throw insertError;

    const requestRow = Array.isArray(staffRequest) ? staffRequest[0] : staffRequest;
    if (!requestRow) throw new Error("ไม่สามารถสร้างคำขอได้");

    const title = type === "bill" ? "💳 ลูกค้าต้องการเรียกเก็บเงิน" : "🔔 ลูกค้าเรียกพนักงาน";
    await sendTelegramMessage(`${title}\n\n🪑 โต๊ะ: ${session.table_number}\n🕐 ${new Date().toLocaleString("th-TH")}`);

    return NextResponse.json({ request: requestRow, reused: false });
  } catch (error) {
    console.error("Staff request error:", error);
    return NextResponse.json({ message: error.message || "ไม่สามารถส่งคำขอได้" }, { status: 500 });
  }
}
