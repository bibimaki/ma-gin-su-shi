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

    // สำหรับการเรียกเก็บเงิน ให้คำนวณยอดจากออเดอร์จริงบน server
    // และปิด session ของโต๊ะทันทีหลังสร้างคำขอสำเร็จ
    let billing = null;
    if (type === "bill") {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from("orders")
        .select("total")
        .eq("session_id", session.id);
      if (ordersError) throw ordersError;

      const subtotal = (orders || []).reduce((sum, order) => sum + Number(order.total || 0), 0);
      const vat = Math.round(subtotal * 0.07 * 100) / 100;
      const grandTotal = Math.round((subtotal + vat) * 100) / 100;
      billing = { subtotal, vat, grandTotal };
    }

    let requestRow = existing;
    let reused = Boolean(existing);

    if (!requestRow) {
      // Insert through a SECURITY DEFINER RPC that validates the QR session token.
      const { data: staffRequest, error: insertError } = await supabase.rpc(
        "create_staff_request",
        { p_token: token, p_type: type }
      );
      if (insertError) throw insertError;

      requestRow = Array.isArray(staffRequest) ? staffRequest[0] : staffRequest;
      if (!requestRow) throw new Error("ไม่สามารถสร้างคำขอได้");
      reused = false;
    }

    if (type === "bill") {
      const { error: closeError } = await supabaseAdmin
        .from("sessions")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", session.id)
        .eq("status", "open");
      if (closeError) throw closeError;
    }

    const title = type === "bill" ? "💳 ลูกค้าต้องการเรียกเก็บเงิน" : "🔔 ลูกค้าเรียกพนักงาน";
    const billText = billing
      ? `\n\n🧾 ยอดก่อน VAT: ${billing.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท\nVAT 7%: ${billing.vat.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท\n💰 ยอดสุทธิ: ${billing.grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`
      : "";
    await sendTelegramMessage(`${title}\n\n🪑 โต๊ะ: ${session.table_number}${billText}\n🕐 ${new Date().toLocaleString("th-TH")}`);

    return NextResponse.json({
      request: requestRow,
      reused,
      closed: type === "bill",
      billing,
      message: type === "bill" ? "พนักงานกำลังมา กรุณารอสักครู่" : "เรียกพนักงานแล้ว กรุณารอสักครู่",
    });
  } catch (error) {
    console.error("Staff request error:", error);
    return NextResponse.json({ message: error.message || "ไม่สามารถส่งคำขอได้" }, { status: 500 });
  }
}
