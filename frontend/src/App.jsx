import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BookingForm      from './components/BookingForm';
import BookingList      from './components/BookingList';
import BookingCreate    from './components/BookingCreate';
import BookingEdit      from './components/BookingEdit';
import AdminDashboard   from './components/AdminDashboard';
import AdminLayout      from './components/AdminLayout';
import RoomsManagement  from './components/RoomsManagement';
import Reports          from './components/Reports';
import ProtectedRoute   from './components/ProtectedRoute';
import Login            from './components/Login';
import Register         from './components/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"        element={<Navigate to="/login" replace />} />
          <Route path="/home"    element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/booking" element={<PublicLayout><BookingForm /></PublicLayout>} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin"
            element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/bookings"
            element={<ProtectedRoute><AdminLayout><BookingList /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/bookings/new"
            element={<ProtectedRoute><AdminLayout><BookingCreate /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/bookings/edit/:id"
            element={<ProtectedRoute><AdminLayout><BookingEdit /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/rooms"
            element={<ProtectedRoute><AdminLayout><RoomsManagement /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/reports"
            element={<ProtectedRoute><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />
    <main className="flex-1">{children}</main>
    <footer className="bg-gray-900 text-gray-400 text-center text-xs py-4">
      © 2025 Hotel Booking System · ระบบจองห้องพักออนไลน์
    </footer>
  </div>
);

const UserMenu = ({ user, logout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = (user.username?.[0] || 'U').toUpperCase();
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${isAdmin ? 'bg-gray-900' : 'bg-blue-600'}`}>
          {initial}
        </div>
        <span className="text-sm text-gray-700 font-medium hidden sm:block max-w-[100px] truncate">
          {user.username}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${isAdmin ? 'bg-gray-900' : 'bg-blue-600'}`}>
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{user.username}</div>
                <div className={`text-xs font-medium mt-0.5 ${isAdmin ? 'text-gray-500' : 'text-blue-600'}`}>
                  {isAdmin ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {isAdmin ? (
              <Link to="/admin" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-base">🛡️</span> Admin Panel
              </Link>
            ) : (
              <Link to="/booking" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-base">🏨</span> จองห้องพัก
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-50 py-1.5">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavBar = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-width mx-auto px-4 sm:px-6" style={{ maxWidth: 1100 }}>
        <div className="flex justify-between items-center h-16">
          <Link to="/home" className="flex items-center gap-2 font-bold text-gray-800 text-lg">
            <span className="text-2xl">🏨</span> LuxeStay
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/home" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">หน้าแรก</Link>
            <Link to="/booking" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">จองห้องพัก</Link>
            {user ? (
              <UserMenu user={user} logout={logout} />
            ) : (
              <>
                <Link to="/register" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">
                  สมัครสมาชิก
                </Link>
                <Link to="/login"
                  className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage = () => (
  <div>
    {/* Hero */}
    <div className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 50%)' }} />
      <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-blue-500/20 text-blue-300 text-xs font-medium px-3 py-1 rounded-full mb-6">
          ✨ ระบบจองห้องพักออนไลน์
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
          พักผ่อนอย่างสะดวกสบาย<br />
          <span className="text-blue-400">จองง่าย ราคาโปร่งใส</span>
        </h1>
        <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
          เลือกห้องพักที่ถูกใจ จองออนไลน์ได้ทันที ไม่ต้องโทรหาเจ้าหน้าที่
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/booking"
            className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            จองห้องพักเลย →
          </Link>
          <a href="/home#rooms"
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-colors text-sm">
            ดูห้องพัก
          </a>
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
        {[
          { num: '3+', label: 'ประเภทห้องพัก' },
          { num: '24/7', label: 'บริการออนไลน์' },
          { num: '100%', label: 'ปลอดภัย' },
        ].map(s => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-blue-600">{s.num}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Room types */}
    <div id="rooms" className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">ห้องพักของเรา</h2>
      <p className="text-gray-500 text-center text-sm mb-10">เลือกห้องพักที่เหมาะกับคุณ</p>
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: '🛏️', name: 'ห้องมาตรฐาน', desc: 'เหมาะสำหรับ 1-2 ท่าน พร้อมสิ่งอำนวยความสะดวกครบครัน', price: '1,200', cap: '2 ท่าน', color: 'from-sky-50 to-blue-50' },
          { icon: '🌟', name: 'ห้องดีลักซ์', desc: 'พื้นที่กว้างขวาง วิวสวย เหมาะสำหรับ 2-3 ท่าน', price: '1,800', cap: '3 ท่าน', color: 'from-violet-50 to-purple-50' },
          { icon: '👑', name: 'ห้องสวีท', desc: 'ห้องพักหรู ขนาดใหญ่ เหมาะสำหรับครอบครัว', price: '2,500', cap: '4 ท่าน', color: 'from-amber-50 to-yellow-50' },
        ].map(r => (
          <div key={r.name} className={`bg-gradient-to-br ${r.color} rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-shadow`}>
            <div className="text-4xl mb-3">{r.icon}</div>
            <h3 className="font-bold text-gray-800 mb-1">{r.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{r.desc}</p>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xl font-bold text-gray-800">฿{r.price}</span>
                <span className="text-xs text-gray-400"> / คืน</span>
              </div>
              <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-500 border">👥 {r.cap}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-10">
        <Link to="/booking"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl transition-colors">
          จองห้องพักเลย
        </Link>
      </div>
    </div>

    {/* Features */}
    <div className="bg-gray-900 text-white py-16 px-6">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h2 className="text-2xl font-bold mb-2">ทำไมต้องเลือกเรา?</h2>
      </div>
      <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
        {[
          { icon: '⚡', t: 'จองเร็ว ทำได้ทันที', d: 'ไม่ต้องรอ ไม่ต้องโทร กรอกฟอร์มเสร็จก็จองได้เลย' },
          { icon: '🔒', t: 'ปลอดภัย มั่นใจได้', d: 'ข้อมูลของคุณถูกเข้ารหัสและเก็บอย่างปลอดภัย' },
          { icon: '📱', t: 'ใช้งานได้ทุกอุปกรณ์', d: 'รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์' },
        ].map(f => (
          <div key={f.t} className="bg-white/5 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="font-semibold mb-2">{f.t}</div>
            <div className="text-gray-400 text-sm">{f.d}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default App;
