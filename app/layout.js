import "./globals.css";

export const metadata = {
  title: "ซูชิวังหน้า | SUSHI WANGNA",
  description: "ระบบสั่งอาหาร QR และจัดการออเดอร์แบบเรียลไทม์สำหรับซูชิวังหน้า",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
