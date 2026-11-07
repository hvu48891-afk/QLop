import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  Loader2, 
  Database,
  Sparkles,
  Info
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegisterUser?: (userData: { full_name: string; email: string; role: UserRole; password?: string }) => Promise<User | null>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin, onRegisterUser }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const existingAdmin = users.find((u) => u.role === 'admin');
  const hasAdmin = Boolean(existingAdmin);
  const [regRole, setRegRole] = useState<UserRole>('supervisor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const input = email.trim().toLowerCase();
    if (!input) {
      setLoginError('Vui lòng nhập Email hoặc Tên tài khoản!');
      return;
    }

    if (users.length === 0) {
      setLoginError('Chưa có tài khoản nào trong Database. Vui lòng chuyển sang tab "Thêm tài khoản DB" để tạo tài khoản mới!');
      return;
    }

    const cleanInput = input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Tìm kiếm trong danh sách profiles đã tải từ Supabase
    const matched = users.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();
      const uCleanName = uName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const uId = (u.id || '').toLowerCase();

      return (
        uEmail === input ||
        uName === input ||
        uCleanName === cleanInput ||
        uId === input ||
        uEmail.split('@')[0] === input ||
        uName.includes(input) ||
        uCleanName.includes(cleanInput) ||
        (input === 'admin' && (u.role === 'admin' || uCleanName.includes('admin')))
      );
    });

    if (matched) {
      onLogin(matched);
    } else {
      setLoginError(`Tài khoản "${email}" không tồn tại trong Database Supabase! Vui lòng kiểm tra lại hoặc chuyển sang tab "Thêm tài khoản DB" để tạo mới.`);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg('');
    setRegSuccessMsg('');

    if (!fullName.trim() || !regEmail.trim()) {
      setRegErrorMsg('Vui lòng điền đầy đủ họ tên và email!');
      return;
    }

    // Kiểm tra quy định: chỉ cho phép 1 tài khoản quản trị viên được đăng ký
    const targetRole: UserRole = hasAdmin ? 'supervisor' : regRole;
    if (hasAdmin && regRole === 'admin') {
      setRegErrorMsg(`Hệ thống chỉ cho phép duy nhất 1 Quản trị viên tự đăng ký (${existingAdmin?.name}). Tài khoản của bạn sẽ được tạo với vai trò Giám thị, sau đó cần được Quản trị viên cấp quyền!`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onRegisterUser) {
        const createdUser = await onRegisterUser({
          full_name: fullName.trim(),
          email: regEmail.trim(),
          role: targetRole,
          password: regPassword,
        });

        if (createdUser) {
          const roleTitle = createdUser.role === 'admin' ? 'Quản trị viên' : 'Giám thị';
          setRegSuccessMsg(`✓ Đã tạo thành công tài khoản [${createdUser.name}] với vai trò [${roleTitle}] và lưu vào Database!`);
          setTimeout(() => {
            onLogin(createdUser);
          }, 1200);
        } else {
          setRegErrorMsg('Không thể lưu vào database. Vui lòng thử lại!');
        }
      }
    } catch (err: any) {
      setRegErrorMsg(err?.message || 'Lỗi khi tạo tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25 mb-3">
            <Cpu className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Smart Classroom IoT</h2>
          <p className="text-xs text-slate-400">
            Hệ thống Quản lý và Điều khiển Phòng học Thông minh • THPT Chuyên
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 font-mono">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supabase Cloud Database Sync</span>
          </div>
        </div>

        {/* Tab Switcher: Đăng nhập vs Tạo tài khoản */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegErrorMsg('');
              setRegSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tài khoản DB</span>
          </button>
        </div>

        {/* TAB 1: FORM ĐĂNG NHẬP */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {/* Supabase Database Accounts Notice */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-left flex items-start gap-2.5">
              <Database className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Xác thực tài khoản Database Supabase: </span>
                Vui lòng nhập Email hoặc Tên tài khoản của bạn để đăng nhập vào hệ thống điều khiển phòng học.
              </div>
            </div>

            {/* Error banner */}
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email hoặc Tên tài khoản Database</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="VD: Vũ Trí Hiếu hoặc email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: THÊM TÀI KHOẢN MỚI VÀO DATABASE */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left text-xs">
            {regSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            {regErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{regErrorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Họ và tên cán bộ</label>
              <input
                type="text"
                required
                placeholder="VD: Họ và tên của bạn"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email đăng nhập</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="VD: email@school.edu.vn"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu (tùy chọn)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Thông báo chính sách 1 Quản trị viên */}
            {hasAdmin && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold text-amber-200">Chính sách Phân quyền Quản trị viên</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Hệ thống chỉ cho phép duy nhất 1 Quản trị viên tự đăng ký (Hiện tại: <strong className="text-white">{existingAdmin?.name}</strong>).
                    Tài khoản mới đăng ký bắt buộc là <strong className="text-blue-300">Giám thị</strong>. Nếu cần quyền Quản trị, vui lòng liên hệ Admin để được cấp quyền!
                  </p>
                </div>
              </div>
            )}

            {/* Phân quyền tài khoản (Role Selection) */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">
                Phân quyền tài khoản (Role-based access)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    if (!hasAdmin) setRegRole('admin');
                  }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    hasAdmin
                      ? 'opacity-60 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                      : regRole === 'admin'
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500 cursor-pointer'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs flex items-center gap-1.5 ${hasAdmin ? 'text-slate-500' : 'text-amber-400'}`}>
                      <ShieldCheck className="w-4 h-4" />
                      Quản trị viên (Admin)
                    </span>
                    <input
                      type="radio"
                      name="role"
                      disabled={hasAdmin}
                      checked={!hasAdmin && regRole === 'admin'}
                      onChange={() => !hasAdmin && setRegRole('admin')}
                      className="accent-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    {hasAdmin
                      ? `Đã đăng ký bởi [${existingAdmin?.name}]. Cần Admin cấp quyền.`
                      : 'Toàn quyền: Thêm & xóa phòng học, cấu hình ngưỡng nhiệt/khói, quản lý tài khoản.'}
                  </p>
                </div>

                <div
                  onClick={() => setRegRole('supervisor')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    regRole === 'supervisor'
                      ? 'bg-blue-500/15 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      Giám thị (Supervisor)
                      {hasAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold ml-1">
                          Mặc định
                        </span>
                      )}
                    </span>
                    <input
                      type="radio"
                      name="role"
                      checked={regRole === 'supervisor'}
                      onChange={() => setRegRole('supervisor')}
                      className="accent-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                    Giám sát & Điều khiển thiết bị khi học; có thể được Admin cấp quyền Quản trị sau này.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm tracking-wide shadow-xl shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu vào Supabase...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>TẠO TÀI KHOẢN & LƯU VÀO DATABASE</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Phân quyền RBAC chuẩn IoT</span>
          <span className="text-orange-400/80">THPT Chuyên • SmartEdu</span>
        </div>
      </div>
    </div>
  );
};
