"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { Brand, TitleBlock, SectionIcon } from "@/components/Brand";

export default function GenerateQRPage() {
  const [tableNumber, setTableNumber] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [qrUrl, setQrUrl] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function makeQR(url) {
    setOrderUrl(url);
    setQrUrl(await QRCode.toDataURL(url, { width: 420, margin: 2 }));
  }

  async function openTable() {
    const table = tableNumber.trim();
    const adultCount = Math.max(0, Number(adults) || 0);
    const childCount = Math.max(0, Number(children) || 0);
    if (!table) return (setMessage("กรุณากรอกหมายเลขโต๊ะ"), setMessageType("error"));
    if (adultCount + childCount < 1) return (setMessage("กรุณาระบุจำนวนลูกค้าอย่างน้อย 1 คน"), setMessageType("error"));

    setLoading(true); setMessage(""); setCopied(false);

    try {
      const response = await fetch("/api/sessions/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: table, adultCount, childCount }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "เปิดโต๊ะไม่สำเร็จ");

      const session = result.session;
      const url = `${window.location.origin}/order/${encodeURIComponent(table)}?token=${encodeURIComponent(session.token)}`;
      await makeQR(url);

      setAdults(session.adult_count ?? adultCount);
      setChildren(session.child_count ?? childCount);
      setMessage(result.reused ? "โต๊ะนี้เปิดใช้งานอยู่แล้ว จึงใช้ QR เดิม" : "เปิดโต๊ะและสร้าง QR เรียบร้อย");
      setMessageType(result.reused ? "info" : "success");
    } catch (error) {
      setMessage(error.message || "เกิดข้อผิดพลาด");
      setMessageType("error");
    } finally { setLoading(false); }
  }

  async function copyOrderLink() {
    if (!orderUrl) return;
    try { await navigator.clipboard.writeText(orderUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setMessage("คัดลอกไม่ได้ กรุณาคัดลอกลิงก์ด้วยตนเอง"); setMessageType("error"); }
  }

  return (
    <main className="container">
      <div className="page-brand-row"><Brand compact /><span className="staff-chip">STAFF</span></div>
      <div className="page-heading"><TitleBlock eyebrow="STAFF • TABLE SETUP" title="เปิดโต๊ะ / สร้าง QR" description="ระบุจำนวนลูกค้าก่อนสร้าง QR สำหรับโต๊ะ" icon="table" /></div>
      <div className="setup-layout">
        <div className="card setup-card">
          <div className="section-title"><span className="mini-icon"><SectionIcon type="table" /></span>ข้อมูลโต๊ะ</div>
          <label className="field-label">หมายเลขโต๊ะ<input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="เช่น 01 หรือ 20" /></label>
          <div className="people-grid">
            <label className="person-input adult"><span><SectionIcon type="dashboard" /> ผู้ใหญ่</span><input type="number" min="0" value={adults} onChange={(e) => setAdults(e.target.value)} /><small>คน</small></label>
            <label className="person-input child"><span><SectionIcon type="dashboard" /> เด็ก</span><input type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)} /><small>คน</small></label>
          </div>
          <div className="people-summary"><SectionIcon type="dashboard" /> <strong>รวม {Number(adults) + Number(children)} คน</strong></div>
          <button className="primary-button wide-button" onClick={openTable} disabled={loading}>{loading ? "กำลังสร้าง QR..." : "เปิดโต๊ะและสร้าง QR"}</button>
          {message && <p className={`notice ${messageType}`}>{message}</p>}
        </div>
        {qrUrl ? (
          <div className="card qr-card">
            <div className="section-title"><span className="mini-icon"><SectionIcon type="qr" /></span>QR สำหรับลูกค้า</div>
            <div className="qr-frame"><img src={qrUrl} alt={`QR โต๊ะ ${tableNumber}`} /></div>
            <h2>โต๊ะ {tableNumber}</h2>
            <p className="muted">ผู้ใหญ่ {adults} คน • เด็ก {children} คน</p>
            <div className="copy-box"><input value={orderUrl} readOnly aria-label="ลิงก์สั่งอาหาร" /><button className="copy-button" onClick={copyOrderLink}>{copied ? "✓ คัดลอกแล้ว" : "คัดลอกลิงก์"}</button></div>
          </div>
        ) : (
          <div className="card empty-qr"><div className="empty-icon"><SectionIcon type="qr" /></div><h2>QR จะปรากฏตรงนี้</h2><p className="muted">กรอกโต๊ะและจำนวนลูกค้า แล้วกดสร้าง QR</p></div>
        )}
      </div>
    </main>
  );
}
