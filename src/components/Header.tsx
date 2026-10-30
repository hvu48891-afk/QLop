/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Bell, 
  ChevronDown, 
  Radio, 
  Sparkles,
  Zap,
  ZapOff,
  Clock,
  FastForward
} from 'lucide-react';
import { User, TabType } from '../types';

interface HeaderProps {
  currentTab: TabType;
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  onTriggerRandomSmokeAlarm: () => void;
  onClearAllAlarms: () => void;
  activeAlarmCount: number;
  mqttStatus: { status: string; latency: number };
  supabaseStatus?: { isConnected: boolean; projectId: string };
  timeInfo?: import('../services/timeSyncService').TimeSyncInfo;
  onOpenTimeSyncModal?: () => void;
  onOpenSchoolPowerModal?: () => void;
  poweredOnCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  onTriggerRandomSmokeAlarm,
  onClearAllAlarms,
  activeAlarmCount,
  mqttStatus,
  supabaseStatus,
  timeInfo,
  onOpenTimeSyncModal,
  onOpenSchoolPowerModal,
  poweredOnCount = 0,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabTitles: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Tổng quan giám sát',
      subtitle: 'Theo dõi điện năng, trạng thái an toàn & cảnh báo thời gian thực',
    },
    rooms: {
      title: 'Danh sách phòng học',
      subtitle: 'Giám sát và điều khiển thiết bị từng phòng (A201, 301, 302...)',
    },
    schedules: {
      title: 'Lập lịch & Tự động hóa',
      subtitle: 'Quy tắc hẹn giờ tắt/bật thiết bị, quản lý lịch học tiết kiệm điện',
    },
    settings: {
      title: 'Cài đặt hệ thống',
      subtitle: 'Ngưỡng cảnh báo cảm biến, phân quyền giám thị và kết nối IoT',
    },
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
            {tabTitles[currentTab].title}
          </h2>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-700 text-slate-300">
            <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            IoT Online
          </span>
          <span 
            title={`Supabase URL: https://${supabaseStatus?.projectId || 'cuygczfkktprkyosabtu'}.supabase.co`}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            Supabase DB Kết Nối
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
          {tabTitles[currentTab].subtitle}
        </p>
      </div>

      {/* Simulator Bar + Time + User dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Realtime Clock & Sync Button */}
        <button
          onClick={onOpenTimeSyncModal}
          title="Nhấn để đồng bộ giờ chuẩn NTP hoặc mô phỏng tua thời gian kiểm tra quy tắc"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 rounded-xl text-right transition-all group active:scale-95"
        >
          <Clock className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-orange-400">
                {timeInfo ? timeInfo.currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : currentTime}
              </span>
              {timeInfo?.isSimulated && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/40">
                  {timeInfo.speedMultiplier}x
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 leading-none group-hover:text-orange-300 transition-colors">
              {timeInfo?.isSimulated ? 'Đang mô phỏng' : 'Đồng bộ giờ NTP'}
            </span>
          </div>
        </button>

        {/* Quick Simulation Trigger Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={onTriggerRandomSmokeAlarm}
            title="Kích hoạt cảm biến khói ngẫu nhiên để kiểm tra giao diện cảnh báo đỏ nhấp nháy"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 active:scale-95 transition-all text-xs font-medium"
          >
            <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="hidden md:inline">Test</span> Báo khói
          </button>

          {activeAlarmCount > 0 && (
            <button
              onClick={onClearAllAlarms}
              title="Đặt lại cảm biến khói về ngưỡng an toàn"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 transition-all text-xs font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Tắt</span> Báo động
            </button>
          )}
        </div>

        {/* Master School-wide Power Cut Button */}
        {onOpenSchoolPowerModal && (
          <button
            onClick={onOpenSchoolPowerModal}
            title="Mở bảng điều khiển cắt điện toàn trường (Cầu dao tổng tất cả các tòa)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-md ${
              poweredOnCount > 0
                ? 'bg-red-950/80 hover:bg-red-900 border-red-500/60 text-red-200 hover:text-white shadow-red-950/40 ring-1 ring-red-500/40'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <ZapOff className={`w-3.5 h-3.5 ${poweredOnCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Tắt điện toàn trường</span>
            <span className="sm:hidden">Cắt điện</span>
            {poweredOnCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-[10px] font-black text-white ml-0.5">
                {poweredOnCount}
              </span>
            )}
          </button>
        )}

        {/* User Profile / Switcher Dropdown */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-orange-500/40"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.name.split(' ').slice(-2).join(' ')}
                </p>
                <p className="text-[10px] text-orange-400 font-medium leading-none">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="font-bold text-white text-sm">{currentUser.name}</p>
                    <p className="text-slate-400 text-[11px] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-md font-semibold text-[10px]">
                      {currentUser.role === 'admin' ? 'Quyền: Quản trị viên (Toàn quyền)' : 'Quyền: Giám thị (Điều khiển & Giám sát)'}
                    </span>
                  </div>

                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Đổi tài khoản mô phỏng:
                  </div>

                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-orange-500/15 text-orange-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-md object-cover" />
                        <div>
                          <p className="text-xs leading-tight">{u.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {u.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                          </p>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] text-orange-400 font-bold">Hiện tại</span>
                      )}
                    </button>
                  ))}

                  <div className="border-t border-slate-800/80 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
