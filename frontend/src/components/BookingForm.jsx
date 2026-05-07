import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent';

const BookingConfirmed = ({ booking, room, nights, total, onBookAgain }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
    <div className="max-w-lg w-full">
      {/* Success icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-5">
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">จองห้องพักสำเร็จ!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          ขอบคุณที่ใช้บริการ<br />
          เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการจองภายใน 24 ชั่วโมง
        </p>
      </div>

      {/* Booking summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-50">
          <span className="text-lg">🏨</span>
          <h2 className="font-semibold text-gray-700">สรุปการจอง</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ผู้จอง</span>
            <span className="font-medium text-gray-800">{booking.fullname}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">อีเมล</span>
            <span className="text-gray-700">{booking.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">เบอร์โทร</span>
            <span className="text-gray-700">{booking.phone}</span>
          </div>
          <div className="border-t border-gray-50 pt-3 mt-3">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">ห้องพัก</span>
              <span className="font-medium text-gray-800">{room?.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">เช็คอิน</span>
              <span className="text-gray-700">{new Date(booking.checkin).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">เช็คเอาท์</span>
              <span className="text-gray-700">{new Date(booking.checkout).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">จำนวนคืน</span>
              <span className="text-gray-700">{nights} คืน</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ผู้เข้าพัก</span>
              <span className="text-gray-700">{booking.guests} ท่าน</span>
            </div>
          </div>
          {total > 0 && (
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800">
              <span>ยอดรวมโดยประมาณ</span>
              <span className="text-blue-600 text-base">฿{total.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3 mb-6">
        <span className="text-xl mt-0.5">📞</span>
        <div className="text-sm text-amber-800">
          <div className="font-semibold mb-1">รอเจ้าหน้าที่ติดต่อกลับ</div>
          <p className="leading-relaxed">ทีมงานจะโทรยืนยันการจองไปที่ <span className="font-medium">{booking.phone}</span> หรือส่งอีเมลไปที่ <span className="font-medium">{booking.email}</span> ภายใน 24 ชั่วโมง</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onBookAgain}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          จองห้องพักเพิ่ม
        </button>
        <Link to="/"
          className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors text-center">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  </div>
);

const BookingForm = () => {
  const [rooms, setRooms]           = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [formData, setFormData]     = useState({
    fullname: '', email: '', phone: '',
    checkin: '', checkout: '', roomId: '', guests: 1, comment: ''
  });
  const [error, setError]   = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/rooms`)
      .then(r => setRooms(r.data))
      .catch(() => setError('ไม่สามารถดึงข้อมูลห้องพักได้'))
      .finally(() => setLoadingRooms(false));
  }, []);

  const selectedRoom = rooms.find(r => r.id === Number(formData.roomId));
  const nights = formData.checkin && formData.checkout
    ? Math.max(0, Math.ceil((new Date(formData.checkout) - new Date(formData.checkin)) / 86400000))
    : 0;
  const total = selectedRoom ? selectedRoom.price * nights : 0;

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const checkin = new Date(formData.checkin);
    const checkout = new Date(formData.checkout);
    const today = new Date(); today.setHours(0,0,0,0);
    if (checkin < today) return setError('กรุณาเลือกวันเช็คอินที่ยังไม่ผ่านมา');
    if (checkout <= checkin) return setError('วันเช็คเอาท์ต้องมาหลังวันเช็คอิน');
    if (!/^[0-9]{10}$/.test(formData.phone)) return setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก');
    if (!formData.roomId) return setError('กรุณาเลือกห้องพัก');
    if (Number(formData.guests) > (selectedRoom?.capacity || 1))
      return setError(`จำนวนผู้เข้าพักสูงสุดสำหรับห้องนี้คือ ${selectedRoom.capacity} ท่าน`);
    try {
      await axios.post(`${API_URL}/api/bookings`, formData);
      setConfirmedBooking({ ...formData });
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (confirmedBooking) {
    const confirmedRoom = rooms.find(r => r.id === Number(confirmedBooking.roomId));
    const confirmedNights = Math.max(0, Math.ceil(
      (new Date(confirmedBooking.checkout) - new Date(confirmedBooking.checkin)) / 86400000
    ));
    return (
      <BookingConfirmed
        booking={confirmedBooking}
        room={confirmedRoom}
        nights={confirmedNights}
        total={confirmedRoom ? confirmedRoom.price * confirmedNights : 0}
        onBookAgain={() => {
          setConfirmedBooking(null);
          setFormData({ fullname: '', email: '', phone: '', checkin: '', checkout: '', roomId: '', guests: 1, comment: '' });
        }}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">จองห้องพัก</h1>
        <p className="text-gray-500">กรอกข้อมูลด้านล่างเพื่อทำการจองห้องพัก</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">ข้อมูลผู้จอง</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล <span className="text-red-400">*</span></label>
                  <input type="text" name="fullname" value={formData.fullname} onChange={handleChange}
                    placeholder="กรอกชื่อ-นามสกุล" className={inp} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล <span className="text-red-400">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="example@email.com" className={inp} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์ <span className="text-red-400">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="0812345678" className={inp} required />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">วันที่เข้าพัก</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">วันเช็คอิน <span className="text-red-400">*</span></label>
                  <input type="date" name="checkin" value={formData.checkin} onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]} className={inp} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">วันเช็คเอาท์ <span className="text-red-400">*</span></label>
                  <input type="date" name="checkout" value={formData.checkout} onChange={handleChange}
                    min={formData.checkin || new Date().toISOString().split('T')[0]} className={inp} required />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">เลือกห้องพัก</h3>
              {loadingRooms ? (
                <div className="text-gray-400 text-sm py-4 text-center">กำลังโหลดห้องพัก...</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {rooms.map(room => (
                    <label key={room.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        Number(formData.roomId) === room.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'
                      }`}>
                      <input type="radio" name="roomId" value={room.id}
                        checked={Number(formData.roomId) === room.id}
                        onChange={handleChange} className="mt-0.5 accent-blue-600" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm">{room.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{room.description}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">👥 {room.capacity} ท่าน</span>
                          <span className="text-sm font-bold text-blue-600">฿{room.price.toLocaleString()}<span className="font-normal text-gray-400 text-xs">/คืน</span></span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนผู้เข้าพัก <span className="text-red-400">*</span></label>
                <input type="number" name="guests" value={formData.guests} onChange={handleChange}
                  min="1" max={selectedRoom?.capacity || 10} className={inp} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุเพิ่มเติม</label>
              <textarea name="comment" value={formData.comment} onChange={handleChange}
                placeholder="แจ้งความต้องการพิเศษ เช่น อาหารเช้า ที่จอดรถ..." rows={3}
                className={inp} />
            </div>

            <button type="submit" disabled={loadingRooms || !formData.roomId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              ยืนยันการจอง
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-700 mb-4">สรุปการจอง</h3>
            {selectedRoom ? (
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="font-medium text-gray-800 text-sm">{selectedRoom.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{selectedRoom.description}</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>ราคา/คืน</span>
                    <span>฿{selectedRoom.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>จำนวนคืน</span>
                    <span>{nights} คืน</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ผู้เข้าพัก</span>
                    <span>{formData.guests} ท่าน</span>
                  </div>
                  {formData.checkin && (
                    <div className="flex justify-between text-gray-600">
                      <span>เช็คอิน</span>
                      <span>{new Date(formData.checkin).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                  {formData.checkout && (
                    <div className="flex justify-between text-gray-600">
                      <span>เช็คเอาท์</span>
                      <span>{new Date(formData.checkout).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                </div>
                {nights > 0 && (
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800">
                    <span>ยอดรวมโดยประมาณ</span>
                    <span className="text-blue-600">฿{total.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">กรุณาเลือกห้องพัก</p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 space-y-1">
            <div className="font-semibold mb-2">📌 หมายเหตุ</div>
            <p>• ราคานี้เป็นราคาโดยประมาณ ราคาจริงอาจมีการเปลี่ยนแปลง</p>
            <p>• เจ้าหน้าที่จะติดต่อยืนยันการจองภายใน 24 ชั่วโมง</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
