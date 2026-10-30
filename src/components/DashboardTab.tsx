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
  ZapOff
} from 'lucide-react';
import { Room, AlertLog, ActivityLog } from '../types';

interface DashboardTabProps {
  rooms: Room[];
  alerts: AlertLog[];
  activities: ActivityLog[];
  onSelectRoom: (room: Room) => void;
  onNavigateToRooms: () => void;
  onTurnOffEmptyRooms: () => void;
  onResolveAlert: (alertId: string) => void;
  onTriggerRandomSmokeAlarm: () => void;
  onPushToDatabase?: () => Promise<void> | void;
  isPushingDb?: boolean;
  onOpenSchoolPowerModal?: () => void;
  dbRoomCount?: number;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  rooms,
  alerts,
  activities,
  onSelectRoom,
  onNavigateToRooms,
  onTurnOffEmptyRooms,
  onResolveAlert,
  onTriggerRandomSmokeAlarm,
  onPushToDatabase,
  isPushingDb,
  onOpenSchoolPowerModal,
  dbRoomCount,
}) => {
  // Tabs for alerts: default is 'unresolved' (only show active/new alerts, NEVER resolved ones)
  const [alertViewMode, setAlertViewMode] = useState<'unresolved' | 'resolved'>('unresolved');

  // Stats calculation
  const totalRooms = rooms.length;
  const poweredOnRooms = rooms.filter((r) => r.isPowerOn && !r.emergencyPowerCut).length;
  const emptyRooms = rooms.filter((r) => !r.isOccupied).length;
  const emptyPoweredOnRooms = rooms.filter((r) => !r.isOccupied && r.isPowerOn).length;
  
  // Active/unresolved vs resolved alerts
  const unresolvedAlerts = alerts.filter((a) => !a.isResolved);
  const resolvedAlerts = alerts.filter((a) => a.isResolved);
  const criticalAlarmCount = rooms.filter((r) => r.hasFireAlarm || r.smokeLevel > 300).length;

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
            <span>Tỷ lệ tải điện: {Math.round((poweredOnRooms / totalRooms) * 100)}%</span>
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

          {/* Button Tắt điện toàn trường */}
          {onOpenSchoolPowerModal && (
            <button
              onClick={onOpenSchoolPowerModal}
              title="Mở bảng điều khiển cắt điện toàn trường (Cầu dao tổng tất cả các tòa)"
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30"
            >
              <ZapOff className="w-3.5 h-3.5" />
              <span>Tắt điện toàn trường ({poweredOnRooms})</span>
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

      {/* ================= 2. CANH BAO MOI NHAT (ALERT LOGS) ================= */}
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

            <button
              onClick={onTriggerRandomSmokeAlarm}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 font-medium transition-colors whitespace-nowrap"
            >
              + Test cảnh báo
            </button>
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
