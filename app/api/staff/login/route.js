import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const body = await request.json();
    const key = String(body.key || "");

    if (!process.env.STAFF_ACCESS_KEY) {
      return NextResponse.json({ message: "ยังไม่ได้ตั้งค่า STAFF_ACCESS_KEY ใน Vercel" }, { status: 500 });
    }

    if (!key || key !== process.env.STAFF_ACCESS_KEY) {
      return NextResponse.json({ message: "รหัสพนักงานไม่ถูกต้อง" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("sw_staff_access", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ message: error.message || "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}
