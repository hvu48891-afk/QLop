/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Zap, 
  DoorClosed, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Clock, 
  TrendingUp, 
  Power, 
  ShieldCheck, 
  ChevronRight,
  Info,
  Building2,
  Sparkles,
  Database,
  UploadCloud,
  Check,
  ZapOff,
  Wind,
  Radio,
  Thermometer,
  Droplets,
  Cpu,
  Lock
} from 'lucide-react';
import { Room, AlertLog, ActivityLog, DbSensorData, User } from '../types';
import { parseAirQuality } from '../utils/airQuality';

interface DashboardTabProps {
  rooms: Room[];
  currentUser?: User | null;
  alerts: AlertLog[];
  activities: ActivityLog[];
  recentSensorLogs?: DbSensorData[];
  onSelectRoom: (room: Room) => void;
  onNavigateToRooms: () => void;
  onTurnOffEmptyRooms: () => void;
  onResolveAlert: (alertId: string) => void;
  onPushToDatabase?: () => Promise<void> | void;
  onSyncAlerts?: () => Promise<void> | void;
  onClearAllAlarms?: () => void;
  isPushingDb?: boolean;
  onOpenSchoolPowerModal?: () => void;
  dbRoomCount?: number;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  rooms,
  currentUser,
  alerts,
  activities,
  recentSensorLogs = [],
  onSelectRoom,
  onNavigateToRooms,
  onTurnOffEmptyRooms,
  onResolveAlert,
  onPushToDatabase,
  onSyncAlerts,
  onClearAllAlarms,
  isPushingDb,
  onOpenSchoolPowerModal,
  dbRoomCount,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  // Tabs for alerts: default is 'unresolved' (only show active/new alerts, NEVER resolved ones)
  const [alertViewMode, setAlertViewMode] = useState<'unresolved' | 'resolved'>('unresolved');

  // Stats calculation theo đúng đặc tả Supabase
  const totalRooms = rooms.length;
  const poweredOnRooms = rooms.filter((r) => r.status === 'on' || r.status === 'alert').length;
  const emptyRooms = rooms.filter((r) => r.status === 'off').length;
  const emptyPoweredOnRooms = rooms.filter((r) => r.status === 'off' && r.isPowerOn).length;
  
  // Active/unresolved vs resolved alerts, sắp xếp created_at giảm dần
  const sortedAlerts = [...alerts].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
  const unresolvedAlerts = sortedAlerts.filter((a) => !a.isResolved);
  const resolvedAlerts = sortedAlerts.filter((a) => a.isResolved);
  const criticalAlarmCount = rooms.filter((r) => r.status === 'alert' || r.hasFireAlarm || r.smokeLevel >= 350).length;

  const displayedAlerts = alertViewMode === 'unresolved' ? unresolvedAlerts : resolvedAlerts;

  // Approximate energy calculation (lights ~240W, AC ~1600W, projector ~320W, fan ~120W)
  const currentTotalPowerKW = rooms.reduce((acc, r) => {
    if (!r.isPowerOn || r.emergencyPowerCut) return acc;
    let powerW = 0;
    if (r.devices.light.isOn) powerW += (r.devices.light.brightness / 100) * 240;
    if (r.devices.ac.isOn) powerW += 1600;
    if (r.devices.projector.isOn) powerW += 320;
    if (r.devices.fan.isOn) powerW += r.devices.fan.speed * 30;
    return acc + powerW;
  }, 0) / 1000;

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      {/* ================= 1. STATS METRICS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Số phòng đang mở điện */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Đang mở điện
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {poweredOnRooms}
            </span>
            <span className="text-sm font-semibold text-slate-400">/ {totalRooms} phòng</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-amber-300">
            <span>Tỷ lệ tải điện: {totalRooms > 0 ? Math.round((poweredOnRooms / totalRooms) * 100) : 0}%</span>
          </div>
        </div>

        {/* Card 2: Số phòng trống */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Phòng đang trống
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <DoorClosed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">
              {emptyRooms}
            </span>
            <span className="text-sm font-semibold text-slate-400">phòng</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {emptyPoweredOnRooms > 0 ? (
              <span className="text-amber-400 font-medium">
                ⚠️ Có {emptyPoweredOnRooms} phòng trống còn mở điện
              </span>
            ) : (
              <span className="text-emerald-400">✓ Đã tắt điện các phòng trống</span>
            )}
          </div>
        </div>

        {/* Card 3: Cảnh báo khẩn cấp */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
            criticalAlarmCount > 0
              ? 'bg-red-950/80 border-red-500 animate-pulse ring-2 ring-red-500/40 text-red-200'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cảnh báo an toàn
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                criticalAlarmCount > 0
                  ? 'bg-red-500 text-white animate-bounce'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {criticalAlarmCount > 0 ? <Flame className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono ${
                criticalAlarmCount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {criticalAlarmCount}
            </span>
            <span className="text-xs text-slate-400">sự cố tức thời</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 truncate">
            {criticalAlarmCount > 0 ? 'Phát hiện khói / quá nhiệt!' : 'Tất cả cảm biến bình thường'}
          </p>
        </div>

        {/* Card 4: Công suất tức thời */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Công suất tức thời
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">
              {currentTotalPowerKW.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">kW</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Ước tính tiêu thụ: {(currentTotalPowerKW * 4.2).toFixed(1)} kWh hôm nay
          </p>
        </div>
      </div>

      {/* ================= QUICK ACTIONS BAR ================= */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Hành động nhanh & Đồng bộ</h4>
            <p className="text-xs text-slate-400">
              Kiểm soát năng lượng và đẩy dữ liệu trực tiếp vào Supabase Database
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button Đẩy dữ liệu vào Supabase */}
          {onPushToDatabase && (
            <button
              onClick={() => onPushToDatabase()}
              disabled={isPushingDb}
              title="Đẩy dữ liệu toàn bộ phòng học, cảnh báo và lịch trình hiện tại vào Supabase"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${isPushingDb ? 'animate-spin' : ''}`} />
              <span>{isPushingDb ? 'Đang đồng bộ...' : `Đồng bộ ${totalRooms} phòng lên DB`}</span>
            </button>
          )}

          {/* Button Tắt điện toàn trường (Cầu dao tổng) */}
          {onOpenSchoolPowerModal && (
            <button
              type="button"
              onClick={isAdmin ? onOpenSchoolPowerModal : undefined}
              disabled={!isAdmin}
              title={
                isAdmin
                  ? "Cầu dao tổng: Mở bảng điều khiển cắt/tắt điện toàn trường (Quản trị viên)"
                  : "Chỉ Quản trị viên (Admin) mới có quyền sử dụng Cầu dao tổng toàn trường!"
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                isAdmin
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-400 text-white shadow-red-600/25 ring-2 ring-red-400/50 active:scale-95 cursor-pointer animate-pulse'
                  : 'bg-slate-900/50 border border-slate-800 text-slate-500 opacity-40 cursor-not-allowed select-none'
              }`}
            >
              <ZapOff className={`w-3.5 h-3.5 ${isAdmin ? 'text-yellow-300 stroke-[2.5]' : 'text-slate-600'}`} />
              <span>Cầu dao tổng trường ({poweredOnRooms})</span>
              {!isAdmin && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
            </button>
          )}

          {emptyPoweredOnRooms > 0 && (
            <button
              onClick={onTurnOffEmptyRooms}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all active:scale-95"
            >
              Tắt điện {emptyPoweredOnRooms} phòng trống
            </button>
          )}

          <button
            onClick={onNavigateToRooms}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Xem chi tiết các phòng</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================= 2. BẢNG DỮ LIỆU CẢM BIẾN REALTIME (BẢNG sensor_data SUPABASE) ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Dữ liệu Cảm biến Realtime</h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                  <Database className="w-3 h-3 text-cyan-400" />
                  <span>bảng sensor_data</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Luồng dữ liệu vật lý gửi liên tục từ mạch ESP32 vào cơ sở dữ liệu Supabase (~3s/gói tin)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              <span>Đang nhận trực tiếp</span>
            </span>
          </div>
        </div>

        {/* Sensor Data Stream Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-2.5 px-3">Gói #ID</th>
                <th className="py-2.5 px-3">Thời gian ghi</th>
                <th className="py-2.5 px-3">Phòng</th>
                <th className="py-2.5 px-3">Nhiệt độ</th>
                <th className="py-2.5 px-3">Độ ẩm</th>
                <th className="py-2.5 px-3">Khí Gas</th>
                <th className="py-2.5 px-3">Cảm biến Lửa</th>
                <th className="py-2.5 px-3">Khí CO</th>
                <th className="py-2.5 px-3">Khí CO2</th>
                <th className="py-2.5 px-3">Trạng thái 4 Rơ-le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentSensorLogs.length > 0 ? (
                recentSensorLogs.slice(0, 8).map((log, idx) => {
                  const luaStr = String(log.lua || '').trim().toLowerCase();
                  const isFlame = luaStr === 'co' || luaStr === 'có' || luaStr === 'true' || luaStr === '1';
                  const gasVal = Number(log.gas) || 0;
                  const air = parseAirQuality(log.clkk);
                  const timeFormatted = log.created_at
                    ? new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Vừa xong';

                  return (
                    <tr
                      key={log.id || idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        idx === 0 ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">
                        #{log.id}
                        {idx === 0 && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-sans uppercase">
                            Mới
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {timeFormatted}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-white">
                        {log.room_code || 'A201'}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">
                        {Number(log.nhiet_do).toFixed(1)}°C
                      </td>
                      <td className="py-2.5 px-3 text-blue-300 font-bold">
                        {log.do_am}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          gasVal > 15 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-slate-300'
                        }`}>
                          {gasVal} ppm
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {isFlame ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] animate-bounce shadow">
                            <Flame className="w-3 h-3 fill-yellow-300" />
                            <span>CÓ LỬA!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ko có</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] font-mono ${
                          air.isCoAlert ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-amber-300'
                        }`}>
                          {air.coText}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] font-mono ${
                          air.isCo2Alert ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-emerald-300'
                        }`}>
                          {air.co2Text}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            log.relay1_den ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-500'
                          }`}>
                            Đèn: {log.relay1_den ? 'Bật' : 'Tắt'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            log.relay2_quat ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-500'
                          }`}>
                            Quạt: {log.relay2_quat ? 'Bật' : 'Tắt'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            log.relay3_maychieu ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-500'
                          }`}>
                            Chiếu: {log.relay3_maychieu ? 'Bật' : 'Tắt'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            log.relay4_dieuhoa ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-500'
                          }`}>
                            Lạnh: {log.relay4_dieuhoa ? 'Bật' : 'Tắt'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Radio className="w-5 h-5 text-slate-600 animate-pulse" />
                      <span>Đang kết nối luồng dữ liệu từ bảng sensor_data Supabase...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 3. CANH BAO MOI NHAT (ALERT LOGS) ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Header with Title and Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cảnh báo mới nhất (Realtime Log)</h3>
              <p className="text-xs text-slate-400">
                Chỉ hiển thị các sự cố đang phát sinh cần xử lý (cảnh báo đã giải quyết tự động ẩn)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setAlertViewMode('unresolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  alertViewMode === 'unresolved'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Cảnh báo mới</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  alertViewMode === 'unresolved' ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {unresolvedAlerts.length}
                </span>
              </button>

              <button
                onClick={() => setAlertViewMode('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  alertViewMode === 'resolved'
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Đã giải quyết</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {resolvedAlerts.length}
                </span>
              </button>
            </div>

            {/* Nút Đồng bộ lại cảnh báo */}
            {onSyncAlerts && (
              <button
                onClick={() => onSyncAlerts()}
                title="Đồng bộ lại toàn bộ danh sách cảnh báo từ cơ sở dữ liệu Supabase"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Đồng bộ cảnh báo</span>
              </button>
            )}

            {/* Nút Đặt lại tất cả cảnh báo về an toàn */}
            {onClearAllAlarms && (unresolvedAlerts.length > 0 || criticalAlarmCount > 0) && (
              <button
                onClick={onClearAllAlarms}
                title="Xóa toàn bộ cảnh báo và đặt lại an toàn cho tất cả các phòng trên Database"
                className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500/50 text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Đặt lại an toàn</span>
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {displayedAlerts.map((alert) => {
            let severityBadge = 'bg-slate-800 text-slate-300 border-slate-700';
            let cardBg = 'bg-slate-950/70 border-slate-800/80';

            if (alert.severity === 'critical') {
              severityBadge = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
              cardBg = 'bg-red-950/30 border-red-500/40 ring-1 ring-red-500/20';
            } else if (alert.severity === 'warning') {
              severityBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              cardBg = 'bg-amber-950/20 border-amber-500/30';
            } else if (alert.severity === 'resolved' || alert.isResolved) {
              severityBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              cardBg = 'bg-emerald-950/10 border-emerald-500/20';
            } else if (alert.severity === 'info') {
              severityBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            }

            const targetRoom = rooms.find((r) => r.id === alert.roomId);

            return (
              <div
                key={alert.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${cardBg}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.isResolved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : alert.severity === 'critical'
                        ? 'bg-red-500 text-white animate-bounce'
                        : alert.severity === 'warning'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {alert.isResolved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : alert.type === 'smoke' || alert.type === 'fire' ? (
                      <Flame className="w-4 h-4" />
                    ) : alert.type === 'gas' ? (
                      <Wind className="w-4 h-4 text-white" />
                    ) : alert.type === 'temp_high' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{alert.roomName}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                        {alert.building}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${severityBadge}`}
                      >
                        {alert.isResolved
                          ? 'Đã xử lý an toàn'
                          : alert.severity === 'critical'
                          ? 'Nguy hiểm'
                          : alert.severity === 'warning'
                          ? 'Cảnh báo'
                          : 'Chú ý'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Ghi nhận: {alert.timestamp}
                      </span>
                      {alert.resolvedAt && (
                        <span className="text-emerald-400 font-medium">
                          ✓ Xử lý lúc: {alert.resolvedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/80">
                  {targetRoom && (
                    <button
                      onClick={() => onSelectRoom(targetRoom)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      Xem phòng
                    </button>
                  )}

                  {!alert.isResolved ? (
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      title="Xác nhận sự cố đã được kiểm tra an toàn và ẩn khỏi danh sách cảnh báo mới"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận an toàn</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium px-2 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã giải quyết
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state when NO unresolved alerts */}
          {alertViewMode === 'unresolved' && unresolvedAlerts.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-white text-sm">Không có cảnh báo mới nào!</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tất cả phòng học an toàn. Các cảnh báo đã giải quyết được tự động ẩn khỏi danh sách này.
              </p>
              {resolvedAlerts.length > 0 && (
                <button
                  onClick={() => setAlertViewMode('resolved')}
                  className="mt-3 text-xs text-orange-400 hover:text-orange-300 font-semibold underline inline-block"
                >
                  Xem lịch sử {resolvedAlerts.length} cảnh báo đã xử lý →
                </button>
              )}
            </div>
          )}

          {/* Empty state when NO resolved alerts */}
          {alertViewMode === 'resolved' && resolvedAlerts.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
              <p className="font-bold text-white text-sm">Chưa có lịch sử cảnh báo đã giải quyết</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. NHẬT KÝ THAO TÁC GẦN ĐÂY (ACTIVITIES) ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Hoạt động điều khiển gần đây</h3>
            <p className="text-xs text-slate-400">
              Audit log các thao tác bật tắt thiết bị của giám thị và tự động hóa
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {activities.slice(0, 6).map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/70 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 font-semibold">{act.timestamp}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="font-bold text-slate-200">{act.user}:</span>
                <span className="text-slate-300">{act.action}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 font-mono text-[11px] font-semibold">
                {act.roomId}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
