/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogOut,
  ChevronDown,
  ZapOff,
  Clock,
  RefreshCw,
  Palette,
  Lock,
  Calendar,
} from 'lucide-react';
import { User, TabType } from '../types';
import { themeManager } from '../utils/themeManager';

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
  actualBgColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  onClearAllAlarms,
  activeAlarmCount,
  supabaseStatus,
  timeInfo,
  onOpenTimeSyncModal,
  onOpenSchoolPowerModal,
  onOpenThemeModal,
  poweredOnCount = 0,
  onSyncDatabase,
  isSyncing = false,
  actualBgColor,
}) => {
  const [nowFallback, setNowFallback] = useState<Date>(() => new Date());
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const interval = setInterval(() => {
      setNowFallback(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeNow = timeInfo ? timeInfo.currentTime : nowFallback;
  const formattedTime = activeNow.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDateShort = activeNow.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedDateCompact = activeNow.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const tabTitles: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Tổng quan giám sát',
      subtitle: 'Theo dõi điện năng, an toàn PCCC và dữ liệu cảm biến thời gian thực',
    },
    rooms: {
      title: 'Danh sách phòng học',
      subtitle: 'Điều khiển nguồn điện, 4 kênh relay và theo dõi cảm biến từng phòng',
    },
    schedules: {
      title: 'Lịch sự kiện & Tự động hóa',
      subtitle: 'Quản lý lịch sự kiện theo ngày, lịch tuần và quy tắc bật/tắt tự động',
    },
    settings: {
      title: 'Cài đặt hệ thống',
      subtitle: 'Ngưỡng cảnh báo, giao diện, phân quyền tài khoản và kết nối Supabase',
    },
  };

  const accentHex = themeManager.getEffectiveAccent().hex;
  const canvasSwatch = actualBgColor || themeManager.getEffectiveBackgroundColor();

  return (
    <header className="sticky top-0 z-30 theme-header backdrop-blur-md border-b px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 transition-colors duration-200">
      {/* Page Title & Clean Inline Metadata */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg lg:text-xl font-extrabold theme-text tracking-tight truncate">
            {tabTitles[currentTab].title}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-xs theme-text-muted">
            <span aria-hidden="true">·</span>
            <span className="text-emerald-500 font-semibold">IoT Online</span>
            <span aria-hidden="true">·</span>
            <span
              title={`Supabase: https://${supabaseStatus?.projectId || 'cuygczfkktprkyosabtu'}.supabase.co`}
              className="font-mono tabular-nums"
            >
              {supabaseStatus?.dbRoomCount !== undefined
                ? `DB ${supabaseStatus.dbRoomCount} phòng`
                : 'Supabase đã kết nối'}
            </span>
          </div>
        </div>
        <p className="text-xs theme-text-muted mt-0.5 hidden sm:block truncate">
          {tabTitles[currentTab].subtitle}
        </p>
      </div>

      {/* Right Utility Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
        {/* Realtime Clock Button */}
        <button
          type="button"
          onClick={onOpenTimeSyncModal}
          title="Xem chi tiết & đồng bộ ngày giờ chuẩn NTP"
          className="flex items-center gap-2 px-3 py-1.5 theme-surface-flat hover:theme-elevated border rounded-xl text-right transition-colors whitespace-nowrap shrink-0"
        >
          <Clock className="w-4 h-4 theme-accent-text shrink-0" />
          <div className="flex flex-col items-end">
            <span className="text-xs sm:text-sm font-mono font-bold theme-accent-text leading-tight tabular-nums">
              {formattedTime}
            </span>
            <span className="text-[10px] theme-text-muted leading-tight flex items-center gap-1 tabular-nums">
              <Calendar className="w-2.5 h-2.5 hidden sm:inline" />
              <span className="hidden sm:inline">{formattedDateShort}</span>
              <span className="sm:hidden">{formattedDateCompact}</span>
            </span>
          </div>
        </button>

        {/* Sync Database Button */}
        {onSyncDatabase && (
          <button
            type="button"
            onClick={onSyncDatabase}
            disabled={isSyncing}
            title="Đồng bộ dữ liệu ngay từ Supabase"
            className="flex items-center gap-1.5 px-3 py-2 theme-surface-flat hover:theme-elevated border rounded-xl text-xs font-semibold theme-text-secondary hover:theme-text transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Đồng bộ DB</span>
          </button>
        )}

        {/* Rebuilt Theme / Background Switcher Trigger with Live Dual Swatch */}
        {onOpenThemeModal && (
          <button
            type="button"
            onClick={onOpenThemeModal}
            title="Tùy chỉnh màu nền (Tối / Sáng / Màu tự chọn & Màu nhấn)"
            className="flex items-center gap-2 px-3 py-2 theme-surface-flat hover:theme-elevated border rounded-xl text-xs font-semibold theme-text transition-colors whitespace-nowrap shrink-0"
          >
            <span
              className="w-4 h-4 rounded-full border theme-border-strong flex items-center justify-center shrink-0"
              style={{ backgroundColor: canvasSwatch }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: accentHex }}
              />
            </span>
            <Palette className="w-3.5 h-3.5 theme-accent-text sm:hidden" />
            <span className="hidden sm:inline">Đổi màu nền</span>
          </button>
        )}

        {/* Active Alarms Reset Button */}
        {activeAlarmCount > 0 && (
          <button
            type="button"
            onClick={onClearAllAlarms}
            title="Đặt lại toàn bộ cảnh báo về trạng thái an toàn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đặt lại ({activeAlarmCount})</span>
          </button>
        )}

        {/* Master School-wide Power Cut Button */}
        {onOpenSchoolPowerModal && (
          <button
            type="button"
            onClick={isAdmin ? onOpenSchoolPowerModal : undefined}
            disabled={!isAdmin}
            title={
              isAdmin
                ? 'Cầu dao tổng trường: Bảng điều khiển cắt điện toàn trường (Quản trị viên)'
                : 'Chỉ Quản trị viên (Admin) mới có quyền sử dụng Cầu dao tổng trường!'
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
              isAdmin
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-sm cursor-pointer'
                : 'theme-inset border theme-text-muted opacity-50 cursor-not-allowed select-none'
            }`}
          >
            <ZapOff className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-200' : 'theme-text-muted'}`} />
            <span className="hidden sm:inline">Cầu dao tổng</span>
            <span className="sm:hidden">Cầu dao</span>
            {isAdmin ? (
              poweredOnCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-black/25 text-[10px] font-mono tabular-nums text-amber-200">
                  {poweredOnCount}
                </span>
              )
            ) : (
              <Lock className="w-3 h-3 ml-0.5" />
            )}
          </button>
        )}

        {/* User Profile / Switcher Dropdown */}
        {currentUser && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-xl theme-surface-flat hover:theme-elevated border transition-colors whitespace-nowrap shrink-0"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border theme-border"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold theme-text leading-tight">
                  {currentUser.name.split(' ').slice(-2).join(' ')}
                </p>
                <p className="text-[10px] theme-accent-text font-medium leading-none">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 theme-text-muted" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 theme-surface border rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b theme-border mb-1">
                    <p className="font-bold theme-text text-sm">{currentUser.name}</p>
                    <p className="theme-text-muted text-[11px] truncate">{currentUser.email}</p>
                    <p className="mt-1 theme-accent-text font-semibold text-[11px]">
                      {currentUser.role === 'admin' ? 'Quyền: Quản trị viên (Toàn quyền)' : 'Quyền: Giám thị'}
                    </p>
                  </div>

                  {allUsers.length > 1 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-semibold theme-text-muted uppercase tracking-wider">
                        Chuyển tài khoản
                      </div>
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                            u.id === currentUser.id
                              ? 'theme-accent-soft font-bold'
                              : 'theme-text-secondary hover:bg-[var(--app-surface-elevated)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-md object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs leading-tight truncate">{u.name}</p>
                              <p className="text-[10px] theme-text-muted">
                                {u.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                              </p>
                            </div>
                          </div>
                          {u.id === currentUser.id && (
                            <span className="text-[10px] theme-accent-text font-bold shrink-0">Đang dùng</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  <div className="border-t theme-border mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 font-semibold transition-colors"
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
