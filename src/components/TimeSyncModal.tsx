/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  Radio, 
  RotateCcw, 
  FastForward, 
  Sparkles, 
  X, 
  Calendar,
  AlertCircle,
  Zap,
  Globe
} from 'lucide-react';
import { timeSyncService, TimeSyncInfo } from '../services/timeSyncService';
import { soundManager } from '../utils/soundEffects';

interface TimeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeInfo: TimeSyncInfo;
  soundEnabled: boolean;
}

export const TimeSyncModal: React.FC<TimeSyncModalProps> = ({
  isOpen,
  onClose,
  timeInfo,
  soundEnabled,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [targetTimeInput, setTargetTimeInput] = useState('17:29:50');
  const [speedMultiplier, setSpeedMultiplier] = useState(timeInfo.speedMultiplier || 1);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (soundEnabled) soundManager.playClick();
    try {
      await timeSyncService.syncWithServer();
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplySimulation = (timeStr?: string, multiplier?: number) => {
    const timeToSet = timeStr || targetTimeInput;
    const speed = multiplier ?? speedMultiplier;
    timeSyncService.setSimulationTime(timeToSet, speed);
    if (soundEnabled) soundManager.playClick();
  };

  const handleResetRealTime = () => {
    timeSyncService.resetToRealTime();
    if (soundEnabled) soundManager.playClick();
  };

  // Format digital clock
  const timeStr = timeInfo.currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = timeInfo.currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Đồng bộ Thời gian Thực (Real-time Clock Sync)
              </h3>
              <p className="text-xs text-slate-400">
                Chuẩn hóa thời gian toàn hệ thống theo máy chủ NTP và mô phỏng lịch tự động
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Live Digital Clock Display */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-900 border border-orange-500/30 text-center shadow-xl">
          {timeInfo.isSimulated && (
            <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              Đang mô phỏng giờ ({timeInfo.speedMultiplier}x)
            </span>
          )}

          <p className="text-xs font-semibold text-slate-400 capitalize mb-1">{dateStr}</p>
          <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest text-shadow">
            <span className="text-orange-400">{timeStr}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{timeInfo.sourceName}</span>
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Độ trễ RTT: <strong className="text-cyan-400">{timeInfo.rttMs} ms</strong>
            </span>

            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Sai lệch Offset: <strong className="text-emerald-400">
                {timeInfo.offsetMs >= 0 ? `+${timeInfo.offsetMs}` : timeInfo.offsetMs} ms
              </strong>
            </span>
          </div>
        </div>

        {/* Sync Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex-1 py-3 px-4 rounded-2xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ NTP...' : 'ĐỒNG BỘ GIỜ MÁY CHỦ CHUẨN (NTP SYNC)'}</span>
          </button>

          {timeInfo.isSimulated && (
            <button
              onClick={handleResetRealTime}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-orange-400" />
              <span>Về giờ thực</span>
            </button>
          )}
        </div>

        {syncSuccessToast && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Đã đồng bộ chính xác thời gian với máy chủ chuẩn quốc gia (Asia/Ho_Chi_Minh)!</span>
          </div>
        )}

        {/* Time Travel / Simulation Box for Schedule Rules Testing */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Mô phỏng Kiểm tra Quy tắc Lập lịch (Time Travel)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">Dành cho giám sát / demo</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Bạn có thể chỉnh giờ mô phỏng gần mốc hẹn giờ để xem hệ thống <strong>tự động chạy quy tắc trong thời gian thực</strong> mà không cần đợi đến giờ thực tế!
          </p>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => {
                setTargetTimeInput('17:29:50');
                handleApplySimulation('17:29:50', 1);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-left transition-all active:scale-95"
            >
              <span className="font-mono font-bold text-orange-400 text-xs block">17:29:50</span>
              <span className="text-[10px] text-slate-300">Tắt điện Tòa A (17:30)</span>
            </button>

            <button
              onClick={() => {
                setTargetTimeInput('06:44:50');
                handleApplySimulation('06:44:50', 1);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all active:scale-95"
            >
              <span className="font-mono font-bold text-cyan-400 text-xs block">06:44:50</span>
              <span className="text-[10px] text-slate-300">Bật điều hòa sáng (06:45)</span>
            </button>

            <button
              onClick={() => {
                setTargetTimeInput('11:44:50');
                handleApplySimulation('11:44:50', 1);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-left transition-all active:scale-95"
            >
              <span className="font-mono font-bold text-purple-400 text-xs block">11:44:50</span>
              <span className="text-[10px] text-slate-300">Nghỉ trưa tắt máy chiếu</span>
            </button>
          </div>

          {/* Custom Time Input & Speed Multiplier */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <label className="text-[10px] text-slate-400 block mb-1">
                Nhập giờ tùy chỉnh (HH:mm:ss):
              </label>
              <input
                type="text"
                placeholder="17:29:50"
                value={targetTimeInput}
                onChange={(e) => setTargetTimeInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="w-full sm:w-auto">
              <label className="text-[10px] text-slate-400 block mb-1">Tốc độ tua:</label>
              <div className="flex items-center gap-1">
                {[1, 5, 10, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpeedMultiplier(s);
                      if (timeInfo.isSimulated) {
                        timeSyncService.setSpeedMultiplier(s);
                      }
                    }}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      speedMultiplier === s
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-auto self-end">
              <button
                onClick={() => handleApplySimulation()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold text-xs transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
