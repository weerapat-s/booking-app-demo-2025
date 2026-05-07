import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const POLL_MS = 30000;

const statusLabel = { pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก', completed: 'เสร็จสิ้น' };
const statusColor = { pending: 'bg-yellow-400', confirmed: 'bg-green-400', cancelled: 'bg-red-400', completed: 'bg-blue-400' };
const statusBadge = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700' };

const Reports = () => {
  const { token, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [exporting, setExporting] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const timerRef = useRef(null);

  const fetchReport = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true);
    axios.get(`${API_URL}/api/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setBookings(r.data.bookings); setLastUpdated(new Date()); setIsOnline(true); setError(null); })
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) logout();
        else { setError('ไม่สามารถดึงข้อมูลรายงานได้'); setIsOnline(false); }
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  useEffect(() => {
    fetchReport(true);
    timerRef.current = setInterval(() => fetchReport(false), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchReport]);

  const exportReport = async (format) => {
    setExporting(format);
    try {
      const res = await axios.get(`${API_URL}/api/reports/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', res.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g,'') || `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { setError('ไม่สามารถดาวน์โหลดไฟล์ได้'); }
    finally { setExporting(''); }
  };

  const byRoom   = bookings.reduce((a, b) => { const k = b.room?.name || b.roomtype; a[k] = (a[k]||0)+1; return a; }, {});
  const byStatus = bookings.reduce((a, b) => { a[b.status] = (a[b.status]||0)+1; return a; }, {});
  const nights   = bookings.reduce((a, b) => a + Math.max(0, Math.ceil((new Date(b.checkout)-new Date(b.checkin))/86400000)), 0);
  const revenue  = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((a, b) => a + (b.room?.price || 0) * Math.max(1, Math.ceil((new Date(b.checkout)-new Date(b.checkin))/86400000)), 0);

  const maxByRoom = Math.max(...Object.values(byRoom), 1);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">กำลังสร้างรายงาน...</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายงานการจอง</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-gray-500 text-sm">ข้อมูลสถิติและสรุปผลการจองทั้งหมด</p>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {isOnline ? 'LIVE' : 'ออฟไลน์'}
              {lastUpdated && ` · ${lastUpdated.toLocaleTimeString('th-TH')}`}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportReport('csv')} disabled={!!exporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-xl">
            {exporting === 'csv' ? '⏳' : '📥'} CSV
          </button>
          <button onClick={() => exportReport('json')} disabled={!!exporting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-xl">
            {exporting === 'json' ? '⏳' : '📥'} JSON
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📋', label: 'การจองทั้งหมด', value: bookings.length, color: 'bg-blue-50 text-blue-600' },
          { icon: '🌙', label: 'จำนวนคืนรวม', value: nights, color: 'bg-purple-50 text-purple-600' },
          { icon: '💰', label: 'รายได้ (ยืนยัน+เสร็จ)', value: `฿${revenue.toLocaleString()}`, color: 'bg-green-50 text-green-600' },
          { icon: '⏳', label: 'รอดำเนินการ', value: byStatus.pending || 0, color: 'bg-yellow-50 text-yellow-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${k.color}`}>{k.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-800">{k.value}</div>
              <div className="text-xs text-gray-500">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-5">สถานะการจอง</h3>
          <div className="space-y-4">
            {['confirmed','pending','completed','cancelled'].map(s => {
              const count = byStatus[s] || 0;
              const pct   = bookings.length ? Math.round(count / bookings.length * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[s]}`}>
                      {statusLabel[s]}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${statusColor[s]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By room */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-5">การจองตามห้องพัก</h3>
          {Object.keys(byRoom).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(byRoom).sort((a,b) => b[1]-a[1]).map(([room, count]) => {
                const pct = Math.round(count / maxByRoom * 100);
                return (
                  <div key={room}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-gray-700 font-medium">{room}</span>
                      <span className="text-sm font-semibold text-gray-700">{count} <span className="text-gray-400 font-normal">ครั้ง</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-4">การจองล่าสุด 10 รายการ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">ชื่อผู้จอง</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">ห้องพัก</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">เช็คอิน</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">คืน</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">สถานะ</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium hidden md:table-cell">มูลค่า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.slice(0,10).map(b => {
                const n = Math.max(1, Math.ceil((new Date(b.checkout)-new Date(b.checkin))/86400000));
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-800">{b.fullname}</div>
                      <div className="text-xs text-gray-400">{b.email}</div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 hidden md:table-cell">{b.room?.name || b.roomtype}</td>
                    <td className="py-2.5 px-3 text-gray-600 hidden lg:table-cell">{new Date(b.checkin).toLocaleDateString('th-TH')}</td>
                    <td className="py-2.5 px-3 text-gray-600 hidden lg:table-cell">{n}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[b.status]}`}>
                        {statusLabel[b.status]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right hidden md:table-cell">
                      {b.room?.price ? (
                        <span className="font-medium text-gray-700">฿{(b.room.price * n).toLocaleString()}</span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">ยังไม่มีข้อมูลการจอง</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
