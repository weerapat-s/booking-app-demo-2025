import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const POLL_MS = 15000;

const RoomsManagement = () => {
  const { token, logout } = useAuth();
  const [rooms, setRooms]   = useState([]);
  const [form, setForm]     = useState({ roomType: '', name: '', description: '', capacity: 1, price: 0 });
  const [editId, setEditId] = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const timerRef = useRef(null);

  const fetchRooms = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/rooms`);
      setRooms(res.data);
      setLastUpdated(new Date());
      setIsOnline(true);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) logout();
      else { setError('ไม่สามารถดึงข้อมูลห้องพักได้'); setIsOnline(false); }
    } finally { setLoading(false); }
  }, [logout]);

  useEffect(() => {
    fetchRooms(true);
    timerRef.current = setInterval(() => fetchRooms(false), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchRooms]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === 'capacity' || name === 'price' ? Number(value) : value }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ roomType: '', name: '', description: '', capacity: 1, price: 0 });
    setError('');
    setShowForm(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/rooms/${editId}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/rooms`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      resetForm();
      fetchRooms(false);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = room => {
    setEditId(room.id);
    setForm({ roomType: room.roomType, name: room.name, description: room.description, capacity: room.capacity, price: room.price });
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (!window.confirm('ยืนยันการลบห้องพักนี้?')) return;
    try {
      await axios.delete(`${API_URL}/api/rooms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchRooms(false);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการห้องพัก</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-gray-500 text-sm">{rooms.length} ห้องพักในระบบ</p>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {isOnline ? 'LIVE' : 'ออฟไลน์'}
              {lastUpdated && ` · ${lastUpdated.toLocaleTimeString('th-TH')}`}
            </span>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + เพิ่มห้องพักใหม่
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* Form modal-like panel */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-700 text-lg">
              {editId ? '✏️ แก้ไขห้องพัก' : '➕ เพิ่มห้องพักใหม่'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type <span className="text-red-400">*</span></label>
              <input type="text" name="roomType" value={form.roomType} onChange={handleChange} required
                placeholder="เช่น standard, deluxe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <p className="text-xs text-gray-400 mt-1">ตัวอักษรไม่ซ้ำ ใช้สำหรับระบุประเภท</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อห้องพัก <span className="text-red-400">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                placeholder="เช่น ห้องมาตรฐาน"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                placeholder="รายละเอียดห้องพัก..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ความจุ (ท่าน) <span className="text-red-400">*</span></label>
              <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min="1" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท/คืน) <span className="text-red-400">*</span></label>
              <input type="number" name="price" value={form.price} onChange={handleChange} min="0" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                {editId ? 'บันทึกการแก้ไข' : 'เพิ่มห้องพัก'}
              </button>
              <button type="button" onClick={resetForm}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm">
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms grid */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🏨</div>
          <p>ยังไม่มีห้องพักในระบบ</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-blue-500 hover:underline text-sm">
            + เพิ่มห้องพักแรก
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{room.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                    {room.roomType}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(room)}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50">
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(room.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50">
                    ลบ
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{room.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="text-sm text-gray-500">
                  👥 รองรับ <span className="font-medium text-gray-700">{room.capacity}</span> ท่าน
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-800">฿{room.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400"> / คืน</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomsManagement;
