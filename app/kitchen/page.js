"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Brand, SectionIcon, TitleBlock } from "@/components/Brand";
const columns = [
  { status: "received", title: "รอรับออเดอร์", color: "orange", icon: "table", action: "รับออเดอร์", next: "preparing" },
  { status: "preparing", title: "กำลังทำออเดอร์", color: "blue", icon: "kitchen", action: "ทำออเดอร์เสร็จ", next: "ready" },
  { status: "ready", title: "พร้อมเสิร์ฟ", color: "green", icon: "menu", action: "เสร็จสิ้น", next: "served" },
];
export default function KitchenPage() {
  const [orders, setOrders] = useState([]), [message, setMessage] = useState("");
  useEffect(() => { loadOrders(); const channel = supabase.channel("kitchen-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders).subscribe(); return () => supabase.removeChannel(channel); }, []);
  async function loadOrders() { const { data, error } = await supabase.from("orders").select("*").neq("status", "served").order("created_at", { ascending: true }); if (error) setMessage(error.message); else setOrders(data || []); }
  async function updateStatus(id, status) { const { error } = await supabase.from("orders").update({ status }).eq("id", id); if (error) setMessage(error.message); else await loadOrders(); }
  return <main className="container kitchen-page"><div className="page-brand-row"><Brand compact /><span className="live-badge">● LIVE</span></div><div className="page-heading"><TitleBlock eyebrow="KITCHEN DISPLAY • REAL-TIME" title="จอจัดออเดอร์" description="ติดตามออเดอร์จากลูกค้าแบบเรียลไทม์" icon="kitchen" /></div>{message && <p className="notice error">{message}</p>}
    <div className="kitchen-grid">{columns.map((column) => { const columnOrders = orders.filter((o) => o.status === column.status); return <section className={`kitchen-column ${column.color}`} key={column.status}><div className="column-header"><div className="column-icon"><SectionIcon type={column.icon} /></div><div><h2>{column.title}</h2><span>{columnOrders.length} ออเดอร์</span></div></div>{!columnOrders.length && <div className="empty-column">ยังไม่มีออเดอร์</div>}{columnOrders.map((order) => <div className={`order-card ${column.color}`} key={order.id}><div className="order-top"><div><span className="table-tag">โต๊ะ {order.table_number}</span><small>{new Date(order.created_at).toLocaleString("th-TH")}</small></div><strong>#{String(order.id).slice(0, 5)}</strong></div><div className="order-items">{(order.items || []).map((item, i) => <div className="order-item" key={i}><span>{item.name}</span><strong>× {item.quantity}</strong></div>)}</div><div className="order-bottom"><strong>{Number(order.total).toLocaleString()} บาท</strong><button className={`status-action ${column.color}`} onClick={() => updateStatus(order.id, column.next)}>{column.action}</button></div></div>)}</section>; })}</div>
  </main>;
}
