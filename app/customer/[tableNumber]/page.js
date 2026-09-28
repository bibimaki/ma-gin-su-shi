"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const statusMap = {
  received: ["🟡", "รับออเดอร์แล้ว"],
  preparing: ["🟠", "กำลังเตรียมอาหาร"],
  ready: ["🟢", "พร้อมเสิร์ฟ"],
  served: ["✅", "เสิร์ฟแล้ว"],
};

export default function CustomerPage() {
  const params = useParams();
  const tableNumber = decodeURIComponent(params.tableNumber);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState("");

  async function loadCustomer() {
    try {
      const res = await fetch("/api/customer", { cache: "no-store" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "โหลดข้อมูลไม่ได้");
      setData(result);
      setMessage("");
    } catch (e) { setMessage(e.message || "เกิดข้อผิดพลาด"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadCustomer();
    const timer = setInterval(loadCustomer, 4000);
    return () => clearInterval(timer);
  }, []);

  async function requestStaff(type) {
    setRequesting(type);
    try {
      const res = await fetch("/api/staff-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "ส่งคำขอไม่ได้");
      setMessage(type === "bill" ? "ส่งคำขอเรียกเก็บเงินแล้ว" : "เรียกพนักงานแล้ว");
      await loadCustomer();
    } catch (e) { setMessage(e.message || "เกิดข้อผิดพลาด"); }
    finally { setRequesting(""); }
  }

  if (loading) return <main className="container loading-page"><p>กำลังโหลดออเดอร์...</p></main>;
  if (!data) return <main className="container"><div className="card error-panel"><h1>โต๊ะ {tableNumber}</h1><p className="error">{message || "ไม่พบ Session"}</p></div></main>;

  const total = (data.orders || []).reduce((sum, o) => sum + Number(o.total), 0);
  const staffPending = data.requests?.some((r) => r.type === "staff");
  const billPending = data.requests?.some((r) => r.type === "bill");

  return (
    <main className="container customer-page">
      <div className="customer-header">
        <div><div className="eyebrow">SUSHI WANG NA</div><h1>โต๊ะ {data.session.table_number}</h1><p>ผู้ใหญ่ {data.session.adult_count} • เด็ก {data.session.child_count}</p></div>
      </div>
      <section className="card">
        <h2>🍱 ออเดอร์ของฉัน</h2>
        {!data.orders.length ? <p className="muted">ยังไม่มีออเดอร์</p> : data.orders.map((order) => {
          const [icon, label] = statusMap[order.status] || statusMap.received;
          return <div className="customer-order" key={order.id}>
            <div className="customer-order-top"><strong>{icon} {label}</strong><strong>{Number(order.total).toLocaleString()} บาท</strong></div>
            {order.items.map((item, i) => <div className="customer-item" key={i}><span>{item.name} × {item.quantity}</span><span>{(Number(item.price)*Number(item.quantity)).toLocaleString()} บาท</span></div>)}
          </div>;
        })}
        <div className="customer-total"><span>รวมทั้งหมด</span><strong>{total.toLocaleString()} บาท</strong></div>
      </section>
      <section className="customer-actions">
        <button className="staff-button" disabled={!!requesting || staffPending} onClick={() => requestStaff("staff")}>{requesting === "staff" ? "กำลังส่ง..." : staffPending ? "✓ เรียกพนักงานแล้ว" : "🔔 เรียกพนักงาน"}</button>
        <button className="bill-button" disabled={!!requesting || billPending} onClick={() => requestStaff("bill")}>{requesting === "bill" ? "กำลังส่ง..." : billPending ? "✓ เรียกเก็บเงินแล้ว" : "💳 เรียกเก็บเงิน"}</button>
      </section>
      {message && <p className="notice info">{message}</p>}
      <p className="muted customer-security-note">🔐 Session นี้ผูกกับโต๊ะจาก QR ไม่สามารถเลือกดูออเดอร์ของโต๊ะอื่นได้</p>
    </main>
  );
}
