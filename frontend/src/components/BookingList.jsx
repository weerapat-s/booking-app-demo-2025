import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const POLL_MS = 10000;

const statusLabel = { pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก', completed: 'เสร็จสิ้น' };
const statusColor = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const { token, logout } = useAuth();
  const timerRef = useRef(null);

  const fetchBookings = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
      setLastUpdated(new Date());
      setIsOnline(true);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) logout();
      else { setError('ไม่สามารถดึงข้อมูลได้'); setIsOnline(false); }
    } finally { setLoading(false); }
  }, [token, logout]);

  useEffect(() => {
    fetchBookings(true);
    timerRef.current = setInterval(() => fetchBookings(false), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchBookings]);

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบการจองนี้?')) return;
    try {
      await axios.delete(`${API_URL}/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings();
    } catch { alert('เกิดข้อผิดพลาดในการลบ'); }
  };

  const handleStatusChange = async (booking, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/bookings/${booking.id}`,
        { ...booking, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
    } catch { alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ'); }
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.fullname.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search);
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">กำลังโหลด...</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">การจองทั้งหมด</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-gray-500 text-sm">{bookings.length} รายการ</p>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {isOnline ? 'LIVE' : 'ออฟไลน์'}
              {lastUpdated && ` · ${lastUpdated.toLocaleTimeString('th-TH')}`}
            </span>
          </div>
        </div>
        <Link to="/admin/bookings/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + เพิ่มการจองใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
          <option value="all">สถานะทั้งหมด</option>
          {Object.entries(statusLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(search || filterStatus !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterStatus('all'); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2">
            ล้างตัวกรอง ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">ผู้จอง</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">ห้องพัก</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden lg:table-cell">วันเช็คอิน</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden lg:table-cell">วันเช็คเอาท์</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">ผู้เข้าพัก</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">สถานะ</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">ไม่พบข้อมูลการจอง</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 font-mono text-xs">{b.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{b.fullname}</div>
                    <div className="text-xs text-gray-400">{b.email}</div>
                    <div className="text-xs text-gray-400">{b.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    {b.room?.name || b.roomtype}
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                    {new Date(b.checkin).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                    {new Date(b.checkout).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                    {b.guests} ท่าน
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={b.status}
                      onChange={e => handleStatusChange(b, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 ${statusColor[b.status]}`}>
                      {Object.entries(statusLabel).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/admin/bookings/edit/${b.id}`}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium">แก้ไข</Link>
                      <button onClick={() => handleDelete(b.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            แสดง {filtered.length} จาก {bookings.length} รายการ
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;
