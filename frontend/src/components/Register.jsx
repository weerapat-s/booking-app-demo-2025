import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm)
      return setError('รหัสผ่านไม่ตรงกัน');
    if (form.password.length < 6)
      return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/register`, {
        username: form.username,
        password: form.password,
        name:     form.name  || undefined,
        email:    form.email || undefined,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 items-center justify-center p-12">
        <div className="text-white text-center max-w-sm">
          <div className="text-7xl mb-6">🏨</div>
          <h1 className="text-3xl font-bold mb-3">LuxeStay</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            สมัครสมาชิกเพื่อจองห้องพัก ติดตามสถานะการจอง และรับสิทธิพิเศษสำหรับสมาชิก
          </p>
          <div className="mt-8 space-y-3 text-left">
            {['✅ ติดตามสถานะการจองได้ทันที', '🔔 รับการแจ้งเตือนอัปเดต', '⭐ สิทธิพิเศษสำหรับสมาชิก', '🔒 ข้อมูลปลอดภัย เข้ารหัสทุกขั้นตอน'].map(f => (
              <div key={f} className="bg-white/10 rounded-xl px-4 py-3 text-sm text-gray-300">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🏨</span>
            <h1 className="text-xl font-bold text-gray-800 mt-2">LuxeStay</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">สมัครสมาชิก</h2>
            <p className="text-gray-500 text-sm mb-6">สร้างบัญชีเพื่อเริ่มจองห้องพัก</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ-นามสกุล</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="กรอกชื่อ-นามสกุล (ไม่บังคับ)"
                  autoComplete="name" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อผู้ใช้ <span className="text-red-400">*</span>
                </label>
                <input type="text" name="username" value={form.username} onChange={handleChange}
                  placeholder="ตัวอักษร/ตัวเลข อย่างน้อย 3 ตัว"
                  autoComplete="username" className={inp} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="example@email.com (ไม่บังคับ)"
                  autoComplete="email" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  รหัสผ่าน <span className="text-red-400">*</span>
                </label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  autoComplete="new-password" className={inp} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ยืนยันรหัสผ่าน <span className="text-red-400">*</span>
                </label>
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password" className={inp} required />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2">
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">เข้าสู่ระบบ</Link>
            </p>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← กลับหน้าหลัก</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
