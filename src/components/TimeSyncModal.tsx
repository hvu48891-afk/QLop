/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Globe,
  ShieldCheck,
  Radio
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
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Đồng bộ Thời gian Thực (NTP Realtime Clock)
              </h3>
              <p className="text-xs text-slate-400">
                Chuẩn hóa thời gian thực tế toàn hệ thống theo máy chủ NTP quốc gia
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
            <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
            Thời gian thực tế 100% (Không mô phỏng)
          </span>

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

        {/* Sync Action Button */}
        <div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ NTP...' : 'ĐỒNG BỘ NGAY VỚI MÁY CHỦ NTP CHUẨN'}</span>
          </button>
        </div>

        {syncSuccessToast && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Đã đồng bộ chính xác thời gian thực tế với máy chủ chuẩn (Asia/Ho_Chi_Minh)!</span>
          </div>
        )}

        {/* System Time Operational Guarantee Notice */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chế độ Hoạt động Thực tế (Production Standard)</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Hệ thống luôn chạy theo giờ thực tế chuẩn của máy chủ và phần cứng IoT. Mọi quy tắc bật/tắt thiết bị theo lịch, cảnh báo cảm biến và ngắt điện sẽ tự động thực thi đúng theo thời gian thực 24/7.
          </p>
        </div>
      </div>
    </div>
  );
};
