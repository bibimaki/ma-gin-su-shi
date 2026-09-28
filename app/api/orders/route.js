import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sw_session_token")?.value;
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
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ message: "กรุณาเลือกอาหาร" }, { status: 400 });

    const ids = [...new Set(items.map((item) => String(item.id || "")).filter(Boolean))];
    const { data: menuRows, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, price, is_available")
      .in("id", ids)
      .eq("is_available", true);

    if (menuError) throw menuError;

    const menuMap = new Map((menuRows || []).map((item) => [String(item.id), item]));
    const safeItems = items.map((item) => {
      const menu = menuMap.get(String(item.id));
      if (!menu) throw new Error(`ไม่พบเมนู: ${item.name || item.id}`);
      const quantity = Math.min(99, Math.max(1, Number(item.quantity) || 1));
      return { id: menu.id, name: menu.name, price: Number(menu.price), quantity };
    });

    const total = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        session_id: session.id,
        table_number: session.table_number,
        items: safeItems,
        total,
        status: "received",
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    const itemText = safeItems.map((item) => `• ${item.name} × ${item.quantity}`).join("\n");
    await sendTelegramMessage(
      `🍣 SUSHI WANG NA\n🔔 มีออเดอร์ใหม่!\n\n🪑 โต๊ะ: ${session.table_number}\n\n🍱 รายการอาหาร\n${itemText}\n\n💰 ยอดรวม: ${total.toLocaleString()} บาท`
    );

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ message: error.message || "ส่งออเดอร์ไม่สำเร็จ" }, { status: 500 });
  }
}
