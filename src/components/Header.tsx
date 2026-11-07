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
  FastForward,
  RefreshCw,
  Database,
  Palette
} from 'lucide-react';
import { User, TabType } from '../types';

interface HeaderProps {
  currentTab: TabType;
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
  onClearAllAlarms: () => void;
  activeAlarmCount: number;
  mqttStatus: { status: string; latency: number };
  supabaseStatus?: { isConnected: boolean; projectId: string; dbRoomCount?: number };
  timeInfo?: import('../services/timeSyncService').TimeSyncInfo;
  onOpenTimeSyncModal?: () => void;
  onOpenSchoolPowerModal?: () => void;
  onOpenThemeModal?: () => void;
  poweredOnCount?: number;
  onSyncDatabase?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  onClearAllAlarms,
  activeAlarmCount,
  mqttStatus,
  supabaseStatus,
  timeInfo,
  onOpenTimeSyncModal,
  onOpenSchoolPowerModal,
  onOpenThemeModal,
  poweredOnCount = 0,
  onSyncDatabase,
  isSyncing = false,
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
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>
              {supabaseStatus?.dbRoomCount !== undefined
                ? `DB: ${supabaseStatus.dbRoomCount} phòng`
                : 'Supabase Kết Nối'}
            </span>
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
          title="Đồng bộ giờ chuẩn NTP từ máy chủ thời gian thực"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 rounded-xl text-right transition-all group active:scale-95"
        >
          <Clock className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-bold text-orange-400">
              {timeInfo ? timeInfo.currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : currentTime}
            </span>
            <span className="text-[10px] text-slate-400 leading-none group-hover:text-orange-300 transition-colors">
              Giờ NTP Realtime
            </span>
          </div>
        </button>

        {/* Sync with Supabase Button */}
        {onSyncDatabase && (
          <button
            onClick={onSyncDatabase}
            disabled={isSyncing}
            title="Đồng bộ dữ liệu ngay từ cơ sở dữ liệu Supabase"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Đồng bộ DB</span>
          </button>
        )}

        {/* Change Entire Website Theme Color Button */}
        {onOpenThemeModal && (
          <button
            onClick={onOpenThemeModal}
            title="Đổi màu toàn bộ website (Navbar, Header, các thẻ phòng học và đường viền)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 text-slate-200 rounded-xl text-xs font-semibold transition-all active:scale-95 group shadow-sm"
          >
            <Palette className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Đổi màu web</span>
          </button>
        )}

        {/* Active Alarms Reset Button (chỉ hiển thị khi có sự cố thực tế) */}
        {activeAlarmCount > 0 && (
          <button
            onClick={onClearAllAlarms}
            title="Đặt lại và tắt toàn bộ còi báo động về an toàn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-400/50 text-xs font-bold transition-all active:scale-95 animate-bounce shadow-md shadow-red-600/30"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Tắt còi báo động ({activeAlarmCount})</span>
          </button>
        )}

        {/* Master School-wide Power Cut Button */}
        {onOpenSchoolPowerModal && (
          <button
            onClick={onOpenSchoolPowerModal}
            title="Mở bảng điều khiển cắt điện toàn trường (Cầu dao tổng tất cả các tòa)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              poweredOnCount > 0
                ? 'bg-red-950/40 hover:bg-red-900/60 border-red-500/40 text-red-200 shadow-sm'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <ZapOff className={`w-3.5 h-3.5 ${poweredOnCount > 0 ? 'text-red-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Cầu dao tổng trường</span>
            <span className="sm:hidden">Cầu dao</span>
            {poweredOnCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-900/80 border border-red-500/40 text-[10px] font-bold text-red-200 ml-0.5">
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

                  {allUsers.length > 1 && (
                    <>
                      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tài khoản Database khác:
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
                    </>
                  )}

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
