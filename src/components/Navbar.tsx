/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  CalendarClock,
  Settings,
  Cpu,
  Flame,
  Radio,
  Calendar,
  Clock,
} from 'lucide-react';
import { TabType, User } from '../types';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: User | null;
  activeAlarmCount: number;
  mqttStatus: { status: string; latency: number };
  timeInfo?: import('../services/timeSyncService').TimeSyncInfo;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  activeAlarmCount,
  mqttStatus,
  timeInfo,
}) => {
  const [nowFallback, setNowFallback] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowFallback(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeNow = timeInfo ? timeInfo.currentTime : nowFallback;
  const sidebarTime = activeNow.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const sidebarDate = activeNow.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: activeAlarmCount > 0 ? activeAlarmCount : null,
    },
    {
      id: 'rooms' as TabType,
      label: 'Lớp học',
      icon: DoorOpen,
      badge: activeAlarmCount > 0 ? 'Báo động' : null,
    },
    {
      id: 'schedules' as TabType,
      label: 'Lịch sự kiện',
      icon: CalendarClock,
    },
    {
      id: 'settings' as TabType,
      label: 'Cài đặt',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-64 theme-sidebar border-r p-4 select-none shrink-0 transition-colors duration-200">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3 px-2 py-2.5 mb-5 border-b theme-border pb-4">
          <div className="w-10 h-10 rounded-xl theme-accent-bg flex items-center justify-center shadow-sm shrink-0">
            <Cpu className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold theme-text text-[15px] tracking-tight leading-tight truncate">
              Smart Classroom
            </h1>
            <p className="text-[11px] theme-text-muted font-medium truncate">
              Quản lý phòng học IoT
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          <div className="px-3 pb-1.5 text-[11px] font-semibold theme-text-muted tracking-wide">
            Điều hướng
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-150 text-left whitespace-nowrap ${
                  isActive
                    ? 'theme-accent-soft border border-[var(--app-accent)]/30'
                    : 'theme-text-muted hover:theme-text hover:bg-[var(--app-surface-elevated)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isActive ? 'theme-accent-bg' : 'theme-inset theme-text-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className={isActive ? 'theme-text font-bold' : ''}>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-red-600 text-white shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Fire alarm callout if active */}
        {activeAlarmCount > 0 && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/15 border border-red-500/50 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-500 mb-1">
              <Flame className="w-4 h-4 animate-bounce" />
              <span>Cảnh báo khẩn cấp</span>
            </div>
            <p className="text-[11px] theme-text-secondary">
              Có <strong className="text-red-500 font-bold">{activeAlarmCount}</strong> phòng đang báo khói hoặc quá nhiệt.
            </p>
          </div>
        )}

        {/* Live Date & Time Sidebar Card */}
        <div className="mb-3 p-3 rounded-xl theme-inset border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium theme-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 theme-accent-text" />
              Giờ hệ thống
            </span>
            <span className="text-sm font-mono font-bold theme-accent-text tabular-nums">
              {sidebarTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] theme-text-secondary font-medium capitalize">
            <Calendar className="w-3.5 h-3.5 theme-text-muted shrink-0" />
            <span className="truncate">{sidebarDate}</span>
          </div>
        </div>

        {/* MQTT Status & User Footer */}
        <div className="mt-auto pt-3 border-t theme-border space-y-3">
          <div className="p-2.5 rounded-xl theme-inset border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold theme-text text-[11px] truncate">IoT Core Broker</p>
                <p className="text-[10px] theme-text-muted font-mono tabular-nums">
                  Độ trễ {mqttStatus.latency}ms
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-500 shrink-0">Live</span>
          </div>

          {currentUser && (
            <div className="flex items-center gap-2.5 px-1.5 py-0.5">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border theme-border shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold theme-text truncate">{currentUser.name}</p>
                <p className="text-[11px] theme-accent-text font-medium truncate">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 theme-header backdrop-blur-md border-t px-2 py-1.5">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                  isActive ? 'theme-accent-text' : 'theme-text-muted hover:theme-text'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      !
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
