# Sushi Wang Na — QR Ordering System

เวอร์ชันนี้ปรับภาพลักษณ์ร้านให้สมจริงขึ้น โดยใช้โลโก้ Sushi Wang Na ที่ผู้ใช้ให้มาเป็น Brand หลักของระบบ

## สิ่งที่เพิ่ม
- โลโก้ร้านที่ `public/brand/logo.jpg`
- favicon/app icon ที่ `app/icon.jpg`
- Brand header ในหน้าแรก, เปิดโต๊ะ, ลูกค้าสั่งอาหาร, จอครัว และ Dashboard
- เปลี่ยน emoji หัวข้อหลักเป็น SVG icons ที่คุมสี/ขนาดได้
- ปรับหน้าแรกเป็นร้านอาหารจริงมากขึ้น พร้อม flow การใช้งาน
- ปรับ header ลูกค้าและจอครัวให้มี branding เดียวกัน
- คงฟังก์ชันเดิม: เปิดโต๊ะ, ผู้ใหญ่/เด็ก, QR, คัดลอกลิงก์, เพิ่ม/ลดจำนวน, ส่งออเดอร์, Realtime kitchen, dashboard

## Assets
Next.js เสิร์ฟไฟล์ static จาก `public` โดยอ้างอิงจาก root URL เช่น `public/brand/logo.jpg` ใช้ในเว็บด้วย `/brand/logo.jpg` ตามแนวทางของ Next.js

## Deploy
1. นำไฟล์ใน ZIP ไปแทนไฟล์ใน GitHub repository เดิม
2. Commit changes
3. Vercel จะ Deploy ใหม่จาก GitHub
4. Environment Variables ของ Supabase ใน Vercel ใช้ค่าของเดิมได้

> ไม่ได้รวม `.env.local` และ secret keys ใน ZIP
