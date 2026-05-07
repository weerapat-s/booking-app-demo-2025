import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const POLL_MS = 10000;

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const statusLabel = { pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก', completed: 'เสร็จสิ้น' };
const statusColor = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([
        axios.get(`${API_URL}/api/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/rooms`),
      ]);
      setBookings(b.data);
      setRooms(r.data);
      setLastUpdated(new Date());
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    load();
    timerRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [load, token]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-lg">กำลังโหลด...</div>
    </div>
  );

  const stats = bookings.reduce(
    (acc, b) => { acc.total++; acc[b.status] = (acc[b.status] || 0) + 1; return acc; },
    { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  );

  const revenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => {
      const nights = Math.max(1, Math.ceil((new Date(b.checkout) - new Date(b.checkin)) / 86400000));
      return sum + (b.room?.price || 0) * nights;
    }, 0);

  const handleStatusChange = async (booking, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/bookings/${booking.id}`, { ...booking, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } });
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
    } catch { alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ'); }
  };

  const recent = [...bookings].slice(0, 8);
  const today = bookings.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ภาพรวมระบบ</h1>
          <p className="text-gray-500 text-sm mt-1">ข้อมูล ณ วันนี้</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span>{isOnline ? 'LIVE' : 'ออฟไลน์'}</span>
          {lastUpdated && (
            <span className="text-gray-400">
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="การจองทั้งหมด" value={stats.total}
          sub={`วันนี้ ${today} รายการ`} color="bg-blue-50" />
        <StatCard icon="⏳" label="รอดำเนินการ" value={stats.pending}
          sub="ต้องการการยืนยัน" color="bg-yellow-50" />
        <StatCard icon="✅" label="ยืนยันแล้ว" value={stats.confirmed}
          sub={`เสร็จสิ้น ${stats.completed} รายการ`} color="bg-green-50" />
        <StatCard icon="💰" label="รายได้ (ยืนยัน+เสร็จ)" value={`฿${revenue.toLocaleString()}`}
          sub={`${rooms.length} ประเภทห้องพัก`} color="bg-purple-50" />
      </div>

      {/* Status breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">สถานะการจอง</h2>
          <div className="space-y-3">
            {['pending','confirmed','completed','cancelled'].map(s => {
              const count = stats[s] || 0;
              const pct = stats.total ? Math.round(count / stats.total * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s]}`}>
                      {statusLabel[s]}
                    </span>
                    <span className="font-medium text-gray-700">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      s === 'pending' ? 'bg-yellow-400' :
                      s === 'confirmed' ? 'bg-green-400' :
                      s === 'completed' ? 'bg-blue-400' : 'bg-red-400'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">ห้องพักในระบบ</h2>
          {rooms.length === 0 ? (
            <p className="text-gray-400 text-sm">ยังไม่มีห้องพัก</p>
          ) : (
            <div className="space-y-3">
              {rooms.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{r.name}</div>
                    <div className="text-xs text-gray-400">รองรับ {r.capacity} ท่าน</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-700 text-sm">฿{r.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">/ คืน</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/rooms" className="mt-3 inline-block text-xs text-blue-500 hover:underline">
            จัดการห้องพัก →
          </Link>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">การจองล่าสุด</h2>
          <Link to="/admin/bookings" className="text-xs text-blue-500 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">ชื่อ</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">ห้อง</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">เช็คอิน</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">สถานะ</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-gray-800">{b.fullname}</div>
                    <div className="text-xs text-gray-400">{b.email}</div>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 hidden md:table-cell">{b.room?.name || b.roomtype}</td>
                  <td className="py-2.5 px-3 text-gray-600 hidden lg:table-cell">
                    {new Date(b.checkin).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={b.status}
                      onChange={e => handleStatusChange(b, e.target.value)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 ${statusColor[b.status]}`}>
                      {Object.entries(statusLabel).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link to={`/admin/bookings/edit/${b.id}`}
                      className="text-blue-500 hover:text-blue-700 text-xs">แก้ไข</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="text-center py-8 text-gray-400">ยังไม่มีข้อมูลการจอง</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
