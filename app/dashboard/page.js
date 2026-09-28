"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Brand, SectionIcon, TitleBlock } from "@/components/Brand";
export default function DashboardPage() {
  const [orders, setOrders] = useState([]), [sessions, setSessions] = useState([]), [loading, setLoading] = useState(true), [message, setMessage] = useState("");
  useEffect(() => { loadDashboard(); }, []);
  async function loadDashboard() { setLoading(true); const start = new Date(); start.setHours(0,0,0,0); const [ordersResult, sessionsResult] = await Promise.all([supabase.from("orders").select("*").gte("created_at", start.toISOString()), supabase.from("sessions").select("*")]); if (ordersResult.error || sessionsResult.error) setMessage(ordersResult.error?.message || sessionsResult.error?.message); else { setOrders(ordersResult.data || []); setSessions(sessionsResult.data || []); } setLoading(false); }
  const sales = orders.filter((o) => ["ready","served"].includes(o.status)).reduce((sum,o) => sum + Number(o.total),0);
  const activeTables = sessions.filter((s) => s.status === "open").length;
  const itemCount = orders.reduce((sum,o) => sum + (o.items || []).reduce((n,item) => n + Number(item.quantity),0),0);
  if (loading) return <main className="container loading-page"><Brand compact /><p>กำลังโหลด Dashboard...</p></main>;
  return <main className="container dashboard-page"><div className="page-brand-row"><Brand compact /><span className="staff-chip">STAFF • DAILY</span></div><div className="page-heading"><TitleBlock eyebrow="BUSINESS DASHBOARD" title="ภาพรวมร้านวันนี้" description="สรุปยอดขายและสถานะโต๊ะของซูชิวังหน้า" icon="dashboard" /></div>{message && <p className="notice error">{message}</p>}
    <div className="stats-grid"><div className="stat-card red"><div className="stat-icon"><SectionIcon type="dashboard" /></div><span>ยอดขายวันนี้</span><strong>{sales.toLocaleString()} บาท</strong></div><div className="stat-card blue"><div className="stat-icon"><SectionIcon type="menu" /></div><span>จำนวนออเดอร์</span><strong>{orders.length}</strong></div><div className="stat-card gold"><div className="stat-icon"><SectionIcon type="table" /></div><span>โต๊ะที่ใช้งาน</span><strong>{activeTables}</strong></div><div className="stat-card green"><div className="stat-icon"><SectionIcon type="cart" /></div><span>จำนวนรายการอาหาร</span><strong>{itemCount}</strong></div></div>
    <div className="card dashboard-note"><div className="mini-icon"><SectionIcon type="dashboard" /></div><div><h2>ระบบพร้อมใช้งาน</h2><p className="muted">ข้อมูลออเดอร์และโต๊ะถูกอ่านจาก Supabase ตามสถานะปัจจุบันของระบบ</p></div></div>
  </main>;
}
