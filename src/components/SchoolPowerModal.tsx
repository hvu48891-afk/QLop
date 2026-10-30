/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  PowerOff, 
  Zap, 
  ZapOff, 
  ShieldAlert, 
  X, 
  Check, 
  Building2, 
  Flame, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Room, User } from '../types';

interface SchoolPowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  currentUser: User | null;
  onSchoolWideCut: (mode: 'emergency' | 'soft') => void;
  onSchoolWideRestore: () => void;
}

export const SchoolPowerModal: React.FC<SchoolPowerModalProps> = ({
  isOpen,
  onClose,
  rooms,
  currentUser,
  onSchoolWideCut,
  onSchoolWideRestore,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'emergency' | 'soft'>('emergency');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Real-time calculations
  const totalRooms = rooms.length;
  const poweredOnRooms = rooms.filter((r) => r.isPowerOn && !r.emergencyPowerCut);
  const emergencyCutRooms = rooms.filter((r) => r.emergencyPowerCut);
  const poweredOnCount = poweredOnRooms.length;

  // Buildings stats
  const buildings = ['Tòa A', 'Tòa B', 'Tòa C'];
  const buildingBreakdown = buildings.map((b) => {
    const bRooms = rooms.filter((r) => r.building === b);
    const bOn = bRooms.filter((r) => r.isPowerOn && !r.emergencyPowerCut).length;
    return { name: b, total: bRooms.length, on: bOn };
  });

  // Current power draw
  const totalPowerKW = rooms.reduce((acc, r) => {
    if (!r.isPowerOn || r.emergencyPowerCut) return acc;
    let powerW = 0;
    if (r.devices.light.isOn) powerW += (r.devices.light.brightness / 100) * 240;
    if (r.devices.ac.isOn) powerW += 1600;
    if (r.devices.projector.isOn) powerW += 320;
    if (r.devices.fan.isOn) powerW += r.devices.fan.speed * 30;
    return acc + powerW;
  }, 0) / 1000;

  const handleExecuteCut = () => {
    if (!confirmed) return;
    setIsProcessing(true);
    setTimeout(() => {
      onSchoolWideCut(selectedMode);
      setIsProcessing(false);
      setConfirmed(false);
      onClose();
    }, 400);
  };

  const handleExecuteRestore = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onSchoolWideRestore();
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border-2 border-red-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Emergency Siren Theme */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 p-5 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center animate-pulse">
              <ZapOff className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/30 text-red-300 border border-red-500/40">
                  Cầu Dao Tổng Trường
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleTimeString('vi-VN')}
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                TẮT ĐIỆN TOÀN TRƯỜNG
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Overview Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Đang mở điện</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {poweredOnCount} <span className="text-xs text-slate-400 font-normal">/ {totalRooms} phòng</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Tải tức thời</p>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-0.5">
                {totalPowerKW.toFixed(1)} <span className="text-xs text-slate-400 font-normal">kW</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Đã ngắt khẩn cấp</p>
              <p className="text-2xl font-black text-red-400 font-mono mt-0.5">
                {emergencyCutRooms.length} <span className="text-xs text-slate-400 font-normal">phòng</span>
              </p>
            </div>
          </div>

          {/* Buildings Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-orange-400" />
              Tình trạng theo tòa nhà:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {buildingBreakdown.map((b) => (
                <div key={b.name} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <p className="text-xs font-bold text-white">{b.name}</p>
                  <p className="text-[11px] text-slate-400">
                    <span className={b.on > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {b.on}
                    </span> / {b.total} phòng mở
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chọn phương thức ngắt điện:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Emergency Breaker */}
              <button
                type="button"
                onClick={() => setSelectedMode('emergency')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedMode === 'emergency'
                    ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-sm text-red-200">Ngắt Khẩn Cấp (Aptomat)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cắt cầu dao khẩn cấp lập tức toàn bộ 9 phòng học. Khóa an toàn, phát chuông báo động và ghi log đỏ.
                </p>
              </button>

              {/* Option 2: Soft Shutoff */}
              <button
                type="button"
                onClick={() => setSelectedMode('soft')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedMode === 'soft'
                    ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <PowerOff className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-amber-200">Tắt Nhanh Tiết Kiệm</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tắt toàn bộ đèn, điều hòa, quạt và máy chiếu ở tất cả các phòng nhưng vẫn duy trì nguồn dự phòng.
                </p>
              </button>
            </div>
          </div>

          {/* Warning Message Box */}
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200/90 leading-relaxed">
              <span className="font-bold text-white">Lưu ý an toàn: </span>
              Lệnh này sẽ được phát qua mạng IoT (MQTT broker) tới toàn bộ các lớp học. Mọi buổi học, thuyết trình hoặc hoạt động đang diễn ra sẽ bị dừng ngay lập tức.
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900"
            />
            <span className="text-xs font-semibold text-slate-200">
              Tôi xác nhận thực hiện hành động này đối với toàn bộ các phòng học trong trường
            </span>
          </label>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Restore Button if rooms are cut/off */}
          {(poweredOnCount < totalRooms || emergencyCutRooms.length > 0) ? (
            <button
              onClick={handleExecuteRestore}
              disabled={isProcessing}
              title="Khôi phục lại nguồn điện an toàn cho tất cả phòng học"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục điện toàn trường</span>
            </button>
          ) : (
            <div className="hidden sm:block text-[11px] text-slate-500">
              Thực hiện bởi: <span className="text-slate-300 font-bold">{currentUser?.name || 'Giám thị'}</span>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleExecuteCut}
              disabled={!confirmed || isProcessing}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                confirmed && !isProcessing
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/30 active:scale-95 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <ZapOff className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'ĐANG NGẮT ĐIỆN...'
                  : selectedMode === 'emergency'
                  ? 'XÁC NHẬN CẮT ĐIỆN KHẨN CẤP'
                  : 'XÁC NHẬN TẮT HẾT THIẾT BỊ'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
