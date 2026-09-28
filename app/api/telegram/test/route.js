import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  const result = await sendTelegramMessage(
    "🍣 SUSHI WANG NA\n\n✅ ทดสอบระบบ Telegram สำเร็จ\n\nระบบแจ้งเตือนพร้อมใช้งาน"
  );

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: "ส่ง Telegram ไม่สำเร็จ", detail: result },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "ส่ง Telegram สำเร็จ" });
}
