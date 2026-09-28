"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Brand, SectionIcon, TitleBlock } from "@/components/Brand";

const TOTAL_TABLES = 30;

function makeTables(sessions, requests) {
  const map = new Map((sessions || []).map((s) => [String(s.table_number), s]));
  const reqMap = new Map();

  for (const r of requests || []) {
    const current = reqMap.get(r.session_id) || {};
    current[r.type] = r;
    reqMap.set(r.session_id, current);
  }

  return Array.from({ length: TOTAL_TABLES }, (_, i) => {
    const number = String(i + 1);
    const session = map.get(number) || null;
    return {
      number,
      session,
      requests: session ? (reqMap.get(session.id) || {}) : {},
    };
  });
}

export default function CustomerServicePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [key, setKey] = useState("");
  const [tables, setTables] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/staff/service", { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(data.message || "โหลดโต๊ะไม่ได้");
      setLoggedIn(true);
      setTables(makeTables(data.sessions, data.requests));
      setMessage("");
    } catch (e) {
      setMessage(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  async function login(e) {
    e.preventDefault();
    setLoginLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เข้าสู่ระบบไม่ได้");
      setKey("");
      setLoggedIn(true);
      await load();
    } catch (e) {
      setMessage(e.message || "เข้าสู่ระบบไม่ได้");
    } finally {
      setLoginLoading(false);
    }
  }

  async function callTable(tableNumber, type) {
    const action = `${tableNumber}-${type}`;
    setBusy(action);
    setMessage("");
    try {
      const res = await fetch("/api/staff/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ส่งคำขอไม่ได้");
      setMessage(type === "bill"
        ? `✓ โต๊ะ ${tableNumber} เรียกเก็บเงินแล้ว`
        : `✓ โต๊ะ ${tableNumber} เรียกพนักงานแล้ว`);
      await load();
    } catch (e) {
      setMessage(e.message || "ส่งคำขอไม่ได้");
    } finally {
      setBusy("");
    }
  }

  const openCount = useMemo(() => tables.filter((t) => t.session).length, [tables]);
  const staffCount = useMemo(() => tables.filter((t) => t.requests.staff).length, [tables]);
  const billCount = useMemo(() => tables.filter((t) => t.requests.bill).length, [tables]);

  if (!loggedIn && !loading) {
    return (
      <main className="container staff-service-page">
        <div className="page-brand-row"><Brand compact /><span className="staff-chip">STAFF</span></div>
        <div className="page-heading">
          <TitleBlock eyebrow="STAFF • CUSTOMER SERVICE" title="บริการลูกค้า" description="จัดการการเรียกพนักงานและเรียกเก็บเงินจากทุกโต๊ะ" icon="table" />
        </div>
        <form className="card staff-login-card" onSubmit={login}>
          <div className="section-title"><span className="mini-icon">🔐</span>เข้าสู่ระบบพนักงาน</div>
          <p className="muted">ใช้ STAFF_ACCESS_KEY ที่ตั้งไว้ใน Vercel</p>
          <input
            className="staff-key-input"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="รหัสพนักงาน"
            autoComplete="current-password"
          />
          <button className="primary-button wide-button" disabled={loginLoading}>
            {loginLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่หน้าบริการลูกค้า"}
          </button>
          {message && <p className="notice error">{message}</p>}
        </form>
      </main>
    );
  }

  if (loading) {
    return <main className="container loading-page"><Brand compact /><p>กำลังโหลดสถานะโต๊ะ...</p></main>;
  }

  return (
    <main className="container staff-service-page">
      <div className="page-brand-row">
        <Brand compact />
        <div className="staff-service-live"><span>● LIVE</span> อัปเดตทุก 5 วินาที</div>
      </div>

      <div className="page-heading">
        <TitleBlock eyebrow="STAFF • CUSTOMER SERVICE" title="บริการลูกค้าทุกโต๊ะ" description="กดเรียกพนักงานหรือเรียกเก็บเงินจากโต๊ะที่เปิดใช้งานได้ทันที" icon="table" />
      </div>

      <div className="service-stats">
        <div><strong>{openCount}</strong><span>โต๊ะกำลังใช้งาน</span></div>
        <div><strong>{staffCount}</strong><span>เรียกพนักงาน</span></div>
        <div><strong>{billCount}</strong><span>เรียกเก็บเงิน</span></div>
      </div>

      {message && <p className="notice info">{message}</p>}

      <section className="table-service-grid">
        {tables.map((table) => {
          const open = !!table.session;
          const staffPending = !!table.requests.staff;
          const billPending = !!table.requests.bill;

          return (
            <article className={`table-service-card ${open ? "open" : "closed"}`} key={table.number}>
              <div className="table-service-top">
                <div>
                  <span className="table-service-label">TABLE</span>
                  <h2>โต๊ะ {table.number}</h2>
                </div>
                <span className={`table-state ${open ? "active" : "idle"}`}>
                  {open ? "● เปิดอยู่" : "ปิดอยู่"}
                </span>
              </div>

              {open ? (
                <>
                  <div className="table-people">👥 ผู้ใหญ่ {table.session.adult_count} • เด็ก {table.session.child_count}</div>
                  <div className="table-request-status">
                    {staffPending && <span>🔔 รอพนักงาน</span>}
                    {billPending && <span>💳 รอเก็บเงิน</span>}
                    {!staffPending && !billPending && <span className="muted">ยังไม่มีคำขอ</span>}
                  </div>
                  <div className="table-service-actions">
                    <button
                      className="staff-button"
                      disabled={!!busy || staffPending}
                      onClick={() => callTable(table.number, "staff")}
                    >
                      {busy === `${table.number}-staff` ? "กำลังส่ง..." : staffPending ? "✓ เรียกแล้ว" : "🔔 เรียกพนักงาน"}
                    </button>
                    <button
                      className="bill-button"
                      disabled={!!busy || billPending}
                      onClick={() => callTable(table.number, "bill")}
                    >
                      {busy === `${table.number}-bill` ? "กำลังส่ง..." : billPending ? "✓ เรียกแล้ว" : "💳 เรียกเก็บเงิน"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="table-closed-note">ยังไม่มีลูกค้า / ยังไม่ได้เปิด QR</div>
              )}
            </article>
          );
        })}
      </section>

      <div className="service-footer-note">🔐 หน้านี้สำหรับพนักงานเท่านั้น • ใช้ STAFF_ACCESS_KEY • ระบบตรวจ Session ของโต๊ะก่อนสร้างคำขอ</div>
    </main>
  );
}
