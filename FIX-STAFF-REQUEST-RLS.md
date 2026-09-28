# แก้ปัญหา staff_requests RLS

1. เปิด Supabase > SQL Editor
2. รัน `supabase/migration_fix_staff_requests_rls.sql` เพียงครั้งเดียว
3. Deploy ZIP นี้ขึ้น GitHub repo เดิม
4. Redeploy Vercel
5. เปิด QR โต๊ะใหม่/เข้าโต๊ะเดิมที่ยัง open แล้วกด `เรียกพนักงาน`

เวอร์ชันนี้ไม่ปิด RLS และไม่เปิด policy แบบ `WITH CHECK (true)` ให้ลูกค้าสร้าง request แทนโต๊ะอื่น
