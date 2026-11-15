/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  ZapOff, 
  X, 
  Building2, 
  AlertTriangle,
  RotateCcw,
  ShieldAlert
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
  const [isProcessing, setIsProcessing] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

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

  const handleExecuteCut = () => {
    if (!confirmed || !isAdmin) return;
    setIsProcessing(true);
    setTimeout(() => {
      onSchoolWideCut('emergency');
      setIsProcessing(false);
      setConfirmed(false);
      onClose();
    }, 350);
  };

  const handleExecuteRestore = () => {
    if (!isAdmin) return;
    setIsProcessing(true);
    setTimeout(() => {
      onSchoolWideRestore();
      setIsProcessing(false);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-red-500/40 rounded-3xl shadow-2xl shadow-red-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/90 via-slate-950 to-slate-950 p-5 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-400 flex items-center justify-center shadow-lg shadow-red-600/20">
              <ZapOff className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white border border-red-400/50">
                  Cầu Dao Tổng • Chế Độ Khẩn Cấp
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleTimeString('vi-VN')}
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                NGẮT ĐIỆN KHẨN CẤP TOÀN TRƯỜNG
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
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Đang mở điện</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {poweredOnCount} <span className="text-xs text-slate-400 font-normal">/ {totalRooms} phòng</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Đã ngắt nguồn</p>
              <p className="text-2xl font-black text-red-400 font-mono mt-0.5">
                {totalRooms - poweredOnCount} <span className="text-xs text-slate-400 font-normal">phòng</span>
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

          {/* Fixed Emergency Mode Card */}
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500 text-white ring-1 ring-red-500/60 shadow-lg shadow-red-600/15 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                <span className="font-black text-sm text-red-200 uppercase tracking-wide">
                  Cắt Khẩn Cấp (Aptomat Tổng)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase">
                Mặc định khẩn cấp
              </span>
            </div>
            <p className="text-xs text-red-100/90 leading-relaxed">
              Ngắt tức thời toàn bộ nguồn điện của tất cả {totalRooms} phòng học, tự động ngắt và khóa cả 4 Relay (Đèn, Quạt, Máy chiếu, Điều hòa) trong Database Supabase khi có sự cố chập điện hoặc cần ngắt khẩn cấp.
            </p>
          </div>

          {/* Warning Message Box */}
          <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200 leading-relaxed">
              <strong className="text-white">CẢNH BÁO KHẨN CẤP:</strong> Thực thi Cầu dao tổng sẽ ngắt điện toàn bộ {totalRooms} phòng học, không cho phép kích hoạt lại cả 4 Relay cho đến khi Quản trị viên đóng điện khôi phục.
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-red-500/30 hover:border-red-500/60 cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 accent-red-600"
            />
            <span className="text-xs font-bold text-red-100">
              Tôi xác nhận thực thi lệnh CẮT ĐIỆN KHẨN CẤP toàn trường (Chế độ khẩn cấp)
            </span>
          </label>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Restore Button if rooms are cut/off */}
          {(poweredOnCount < totalRooms || emergencyCutRooms.length > 0) ? (
            <button
              onClick={handleExecuteRestore}
              disabled={isProcessing || !isAdmin}
              title={isAdmin ? "Khôi phục lại nguồn điện an toàn cho tất cả phòng học" : "Chỉ Quản trị viên (Admin) mới có quyền khôi phục nguồn điện toàn trường"}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isAdmin && !isProcessing
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300 active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-40 cursor-not-allowed select-none'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục điện toàn trường</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Thực hiện bởi: <strong className="text-slate-200">{currentUser?.name || 'Admin'}</strong></span>
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
              disabled={!confirmed || isProcessing || !isAdmin}
              title={!isAdmin ? 'Chỉ Quản trị viên (Admin) mới có quyền thực thi cắt điện khẩn cấp toàn trường' : undefined}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                confirmed && !isProcessing && isAdmin
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/35 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <ZapOff className="w-4 h-4" />
              <span>
                {!isAdmin
                  ? 'CHỈ DÀNH CHO ADMIN'
                  : isProcessing
                  ? 'ĐANG CẮT ĐIỆN KHẨN CẤP...'
                  : 'XÁC NHẬN CẮT ĐIỆN KHẨN CẤP'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
