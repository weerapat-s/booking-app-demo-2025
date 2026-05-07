import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_URL from '../config';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const justRegistered = location.state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/login`, formData);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/home');
    } catch (err) {
      setError(err.response?.data?.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
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
          <h1 className="text-3xl font-bold mb-3">LuxeStay Admin</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            ระบบจัดการโรงแรมครบครัน จัดการการจอง ห้องพัก และรายงานได้ในที่เดียว
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            {['📋 จัดการการจอง', '🏨 จัดการห้องพัก', '📊 ดูรายงาน', '⚡ อัปเดตสถานะ'].map(f => (
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
            <h1 className="text-xl font-bold text-gray-800 mt-2">LuxeStay Admin</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">เข้าสู่ระบบ</h2>
            <p className="text-gray-500 text-sm mb-6">กรอกข้อมูลเพื่อเข้าใช้งาน Admin Panel</p>

            {justRegistered && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-5">
                สมัครสมาชิกสำเร็จแล้ว! กรุณาเข้าสู่ระบบ
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้ใช้</label>
                <input type="text" value={formData.username} autoComplete="username"
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="กรอกชื่อผู้ใช้"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                <input type="password" value={formData.password} autoComplete="current-password"
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-2">
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="mt-5 p-3 bg-gray-50 rounded-xl text-xs text-gray-400 text-center">
              Default: <span className="font-mono text-gray-600">admin</span> /
              <span className="font-mono text-gray-600"> admin123</span>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">สมัครสมาชิก</Link>
            </p>
          </div>

          <div className="text-center mt-6">
            <Link to="/home" className="text-sm text-gray-400 hover:text-gray-600">← กลับหน้าหลัก</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
