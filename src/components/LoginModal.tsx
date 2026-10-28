/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cpu, ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('admin.an@school.edu.vn');
  const [password, setPassword] = useState('••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      onLogin(matched);
    } else {
      // Fallback to first user
      onLogin(users[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Brand */}
        <div>
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/25 mb-4">
            <Cpu className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Smart Classroom</h2>
          <p className="text-xs text-slate-400 mt-1">
            Hệ thống Quản lý phòng học thông minh – Trường THPT Chuyên
          </p>
        </div>

        {/* Quick 1-click Mock Accounts */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-left">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Đăng nhập nhanh một chạm:
          </p>
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => onLogin(u)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 hover:border-orange-500/40 text-left transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <p className="font-bold text-white text-xs">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    u.role === 'admin'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {u.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Regular Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email đăng nhập</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>VÀO HỆ THỐNG</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          Chế độ chạy thử nghiệm IoT SmartEdu • Phiên bản 2.4.0
        </p>
      </div>
    </div>
  );
};
