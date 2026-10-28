/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  DoorOpen, 
  CalendarClock, 
  Settings, 
  Cpu, 
  ShieldAlert, 
  Flame,
  Radio
} from 'lucide-react';
import { TabType, User } from '../types';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: User | null;
  activeAlarmCount: number;
  mqttStatus: { status: string; latency: number };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  activeAlarmCount,
  mqttStatus,
}) => {
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
      badgeColor: 'bg-red-500 animate-pulse',
    },
    {
      id: 'schedules' as TabType,
      label: 'Lập lịch',
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
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950 border-r border-slate-800/80 p-5 select-none shrink-0">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-800/60 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/20">
            <Cpu className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
              Smart Classroom
            </h1>
            <p className="text-xs text-slate-400 font-medium">Quản lý phòng học thông minh</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Quản Trị
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold text-white ${
                      item.badgeColor || 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Fire alarm callout if any active */}
        {activeAlarmCount > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-500/50 animate-pulse text-red-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-400 mb-1">
              <Flame className="w-4 h-4 text-red-500 animate-bounce" />
              <span>CẢNH BÁO KHẨN CẤP</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Có <strong className="text-red-400 font-bold">{activeAlarmCount}</strong> phòng đang phát tín hiệu khói / nhiệt cao!
            </p>
          </div>
        )}

        {/* MQTT Status Indicator Footer */}
        <div className="mt-auto pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="font-semibold text-slate-200 text-[11px]">IoT Core Broker</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-400" />
                  Độ trễ: {mqttStatus.latency}ms
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-semibold">
              Live
            </span>
          </div>

          {currentUser && (
            <div className="mt-3 flex items-center gap-2.5 px-2 py-1">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-orange-400 font-medium">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.4] text-orange-400' : 'stroke-[2]'
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                      !
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
