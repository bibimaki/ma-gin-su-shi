import Link from "next/link";
import { Brand, SectionIcon } from "@/components/Brand";

export default function HomePage() {
  return (
    <main className="container home-page">

      {/* =========================================
          TOP BAR
          โลโก้เล็ก + สถานะระบบ
      ========================================= */}
      <header className="site-topbar">
        <Brand compact />

        <span className="status-chip">
          <span className="status-dot"></span>
          ONLINE
        </span>
      </header>


      {/* =========================================
          HOW IT WORKS
          อยู่ใต้โลโก้เล็กทันที
      ========================================= */}
      <section className="flow-card">

        <div className="flow-heading">
          <div className="eyebrow">
            HOW IT WORKS
          </div>

          <h2>
            สั่งอาหารง่ายในไม่กี่ขั้นตอน
          </h2>
        </div>

        <div className="flow-steps">

          <span>
            <small>01</small>
            เปิดโต๊ะ
          </span>

          <b>→</b>

          <span>
            <small>02</small>
            สแกน QR
          </span>

          <b>→</b>

          <span>
            <small>03</small>
            สั่งอาหาร
          </span>

          <b>→</b>

          <span>
            <small>04</small>
            ครัวทำอาหาร
          </span>

          <b>→</b>

          <span>
            <small>05</small>
            เสิร์ฟ
          </span>

        </div>

      </section>


      {/* =========================================
          HERO
          ส่วนแนะนำร้าน + โลโก้ใหญ่
      ========================================= */}
      <section className="hero-card">

        <div className="hero-copy">

          <div className="eyebrow">
            SUSHI • JAPANESE RESTAURANT
          </div>

          <h1>
            ซูชิวังหน้า
          </h1>

          <p>
            อร่อยง่าย สั่งอาหารผ่าน QR
            <br />
            พร้อมระบบครัวแบบเรียลไทม์
          </p>

          <div className="hero-actions">

            <Link
              href="/order/20"
              className="hero-primary"
            >
              <SectionIcon type="menu" />
              ดูหน้าสั่งอาหาร
            </Link>

            <Link
              href="/generate-qr"
              className="hero-secondary"
            >
              <SectionIcon type="qr" />
              เปิดโต๊ะ / สร้าง QR
            </Link>

          </div>

        </div>


        {/* โลโก้ใหญ่ */}
        <div className="hero-brand-art">
          <Brand />
        </div>

      </section>


      {/* =========================================
          FEATURE CARDS
      ========================================= */}
      <section className="feature-grid">


        {/* จัดการโต๊ะ */}
        <Link
          href="/generate-qr"
          className="feature-card feature-red"
        >

          <div className="feature-icon">
            <SectionIcon type="table" />
          </div>

          <div>

            <h2>
              จัดการโต๊ะ
            </h2>

            <p>
              เปิดโต๊ะ ระบุจำนวนผู้ใหญ่และเด็ก
              พร้อมสร้าง QR สำหรับลูกค้า
            </p>

          </div>

        </Link>


        {/* จอครัว */}
        <Link
          href="/kitchen"
          className="feature-card feature-blue"
        >

          <div className="feature-icon">
            <SectionIcon type="kitchen" />
          </div>

          <div>

            <h2>
              จอครัว
            </h2>

            <p>
              รับออเดอร์ เปลี่ยนสถานะ
              และติดตามงานแบบเรียลไทม์
            </p>

          </div>

        </Link>


        {/* Dashboard */}
        <Link
          href="/dashboard"
          className="feature-card feature-gold"
        >

          <div className="feature-icon">
            <SectionIcon type="dashboard" />
          </div>

          <div>

            <h2>
              Dashboard
            </h2>

            <p>
              ดูยอดขาย จำนวนออเดอร์
              และโต๊ะที่กำลังใช้งาน
            </p>

          </div>

        </Link>


      </section>

    </main>
  );
}
