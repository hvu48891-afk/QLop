/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  DoorOpen, 
  Flame, 
  Thermometer, 
  Droplets, 
  Lightbulb, 
  Wind, 
  Tv, 
  Fan,
  Siren,
  Power, 
  Check, 
  AlertOctagon,
  ChevronRight,
  ShieldAlert,
  ZapOff,
  Plus,
  Database,
  Building,
  Trash2,
  WifiOff,
  Wifi,
  Cpu,
  Radio,
  Lock
} from 'lucide-react';
import { Room, User } from '../types';
import { parseAirQuality } from '../utils/airQuality';

interface RoomsTabProps {
  rooms: Room[];
  currentUser?: User | null;
  onSelectRoom: (room: Room) => void;
  onToggleRoomPower: (roomId: string, e: React.MouseEvent) => void;
  onToggleRelay?: (
    roomCode: string,
    relayType: 'relay1_den' | 'relay2_quat' | 'relay3_maychieu' | 'relay4_dieuhoa' | 'relay_alarm' | 'power_on' | 'auto_mode' | 'khan_cap',
    customState?: boolean
  ) => void;
  onTriggerSmoke: (roomId: string, e: React.MouseEvent, isTrigger?: boolean) => void;
  onOpenSchoolPowerModal?: () => void;
  onOpenAddRoomModal?: () => void;
  dbRoomCount?: number;
  onPushToDatabase?: () => void;
  onFetchFromDatabase?: () => void;
  isSyncingDb?: boolean;
  onDeleteRoom?: (roomId: string, e: React.MouseEvent) => void;
  onPurgeNonDbRooms?: () => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  rooms,
  currentUser,
  onSelectRoom,
  onToggleRoomPower,
  onToggleRelay,
  onTriggerSmoke,
  onOpenSchoolPowerModal,
  onOpenAddRoomModal,
  dbRoomCount,
  onPushToDatabase,
  onFetchFromDatabase,
  isSyncingDb,
  onDeleteRoom,
  onPurgeNonDbRooms,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const buildings = ['all', 'Tòa A', 'Tòa B', 'Tòa C'];

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.building.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBuilding = selectedBuilding === 'all' || r.building === selectedBuilding;

    let matchesStatus = true;
    if (selectedStatus === 'on') {
      matchesStatus = r.isPowerOn && !r.hasFireAlarm;
    } else if (selectedStatus === 'off') {
      matchesStatus = !r.isPowerOn && !r.hasFireAlarm;
    } else if (selectedStatus === 'alarm') {
      matchesStatus = r.hasFireAlarm || r.smokeLevel > 300;
    }

    return matchesSearch && matchesBuilding && matchesStatus;
  });

  const countA = rooms.filter(r => r.building === 'Tòa A').length;
  const countB = rooms.filter(r => r.building === 'Tòa B').length;
  const countC = rooms.filter(r => r.building === 'Tòa C').length;

  return (
    <div className="space-y-5 pb-24 lg:pb-12">
      {/* Summary Header: Classroom Inventory & Database Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>{rooms.length} Phòng học</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                Toàn trường
              </span>
            </h3>

            {/* DB Room Count Badge */}
            <div
              title={`Số phòng học lưu trong Supabase: ${dbRoomCount ?? 'Chưa rõ'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                dbRoomCount === rooms.length
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>DB: {dbRoomCount !== undefined ? `${dbRoomCount} phòng` : 'Đã kết nối'}</span>
              {dbRoomCount === rooms.length && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300">
              Tòa A: <strong className="text-white">{countA}</strong> phòng
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300">
              Tòa B: <strong className="text-white">{countB}</strong> phòng
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300">
              Tòa C: <strong className="text-white">{countC}</strong> phòng
            </span>
            <span className="text-slate-500">•</span>
            <span>Hiển thị: <strong className="text-orange-400 font-mono">{filteredRooms.length}</strong> phòng</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Chỉ hiển thị nút Thêm phòng học cho tài khoản Quản trị viên (Admin) */}
          {isAdmin && onOpenAddRoomModal && (
            <button
              onClick={onOpenAddRoomModal}
              title="Thêm phòng học mới vào hệ thống (Chỉ Quản trị viên)"
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/20 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm phòng học</span>
            </button>
          )}

          {onPushToDatabase && (
            <button
              onClick={onPushToDatabase}
              disabled={isSyncingDb}
              title="Đồng bộ danh sách phòng học hiện tại vào Supabase Database"
              className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <Database className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
              <span>{isSyncingDb ? 'Đang đồng bộ...' : 'Đẩy lên DB'}</span>
            </button>
          )}

          {onFetchFromDatabase && (
            <button
              onClick={onFetchFromDatabase}
              title="Tải danh sách phòng học từ Supabase về hệ thống"
              className="flex-1 md:flex-none px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nạp từ DB</span>
            </button>
          )}

          {/* Chỉ hiển thị nút Xóa phòng ngoài DB cho Quản trị viên (Admin) */}
          {isAdmin && onPurgeNonDbRooms && (
            <button
              onClick={onPurgeNonDbRooms}
              title="Xóa tất cả các phòng không có trong Database Supabase (Chỉ Quản trị viên)"
              className="flex-1 md:flex-none px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xoá phòng ngoài DB</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số phòng (301, A201, B101...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Building Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {buildings.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBuilding(b)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBuilding === b
                  ? 'bg-orange-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {b === 'all' ? 'Tất cả tòa' : b}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(() => {
            const fireAlarmCount = rooms.filter(
              (r) => r.status === 'alert' || r.hasFireAlarm || r.smokeLevel >= 350
            ).length;
            return [
              { id: 'all', label: `Tất cả (${rooms.length})` },
              { id: 'on', label: 'Đang mở' },
              { id: 'off', label: 'Tắt điện' },
              { 
                id: 'alarm', 
                label: fireAlarmCount > 0 ? `🔥 Báo cháy (${fireAlarmCount})` : '🔥 Báo cháy',
                isFire: fireAlarmCount > 0
              },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === st.id
                    ? st.id === 'alarm' && fireAlarmCount > 0
                      ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30'
                      : 'bg-slate-200 text-slate-950 font-bold'
                    : st.id === 'alarm' && fireAlarmCount > 0
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ));
          })()}
        </div>

        {/* Master School Power Cut Trigger (Sáng khi ở Admin, các cấp quyền khác thì không nhấn được) */}
        {onOpenSchoolPowerModal && (
          <button
            type="button"
            onClick={isAdmin ? onOpenSchoolPowerModal : undefined}
            disabled={!isAdmin}
            title={
              isAdmin
                ? "Cầu dao tổng trường: Mở bảng điều khiển tắt/cắt điện toàn trường (Quản trị viên)"
                : "Chỉ Quản trị viên (Admin) mới có quyền sử dụng Cầu dao tổng toàn trường!"
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap ${
              isAdmin
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-400 text-white shadow-red-600/30 ring-2 ring-red-400/50 active:scale-95 cursor-pointer animate-pulse'
                : 'bg-slate-900/50 border border-slate-800 text-slate-500 opacity-40 cursor-not-allowed select-none'
            }`}
          >
            <ZapOff className={`w-3.5 h-3.5 ${isAdmin ? 'text-yellow-300 stroke-[2.5]' : 'text-slate-600'}`} />
            <span>Cầu dao tổng trường</span>
            {!isAdmin && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
          </button>
        )}
      </div>

      {/* Grid of Classrooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
        {filteredRooms.map((room) => {
          const isAlarm = room.status === 'alert' || room.hasFireAlarm || room.smokeLevel >= 350;
          const isPowerOn = room.status === 'on' || (room.isPowerOn && room.status !== 'off');

          // Card Background & Border Style as specified:
          // off = xám
          // on = sáng
          // alert = đỏ nhấp nháy
          let cardStyle = 'bg-slate-900/60 border-slate-800 text-slate-400';
          if (isAlarm) {
            cardStyle =
              'bg-red-950/90 border-red-500 ring-2 ring-red-500 animate-pulse text-red-100 shadow-2xl shadow-red-500/30';
          } else if (isPowerOn) {
            cardStyle =
              'bg-gradient-to-b from-slate-900 to-slate-900/90 border-amber-500/50 shadow-xl shadow-amber-500/10 text-slate-200 ring-1 ring-amber-500/20';
          }

          const isHardwareRoom = room.code === 'A201';

          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`group relative rounded-3xl p-5 border transition-all duration-200 cursor-pointer hover:scale-[1.02] flex flex-col justify-between ${cardStyle}`}
            >
              {/* Header inside Room Card */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                      isAlarm
                        ? 'bg-red-600 text-white animate-bounce'
                        : isPowerOn
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isAlarm ? <Flame className="w-6 h-6" /> : room.code || room.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                        {room.name}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>

                      {isHardwareRoom && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          <span>Mạch thật A201</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">
                        {room.building} • Tầng {room.floor}
                      </p>

                      {/* Nhãn "Mất kết nối" nếu updated_at cũ hơn 30 giây */}
                      {room.isDisconnected ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold flex items-center gap-1">
                          <WifiOff className="w-3 h-3 text-red-400" />
                          <span>Mất kết nối</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-emerald-400" />
                          <span>Realtime</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons on card (Fire Alarm, Delete & Power) */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* Nút Tắt còi khẩn cấp khi phòng có sự cố báo cháy thực tế */}
                  {isAlarm && (
                    <button
                      onClick={(e) => onTriggerSmoke(room.code || room.id, e, false)}
                      title="Tắt còi báo cháy và khôi phục an toàn cho phòng này"
                      className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-red-600/40 animate-bounce active:scale-95 transition-all"
                    >
                      <Flame className="w-3.5 h-3.5 animate-spin" />
                      <span>Tắt còi</span>
                    </button>
                  )}

                  {isAdmin && onDeleteRoom && (
                    <button
                      onClick={(e) => onDeleteRoom(room.code || room.id, e)}
                      title="Xóa phòng học này khỏi hệ thống và Database Supabase (Quản trị viên)"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-500/40 transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Direct Power Switch Button on card */}
                  <button
                    onClick={(e) => onToggleRoomPower(room.id, e)}
                    title={isPowerOn ? 'Tắt điện phòng (power_on: false)' : 'Bật điện phòng (power_on: true)'}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isPowerOn
                        ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Power className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Status Alert Badge if fire alarm */}
              {isAlarm && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-xs font-bold flex items-center justify-between gap-1.5 shadow-lg shadow-red-600/30 animate-pulse">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Flame className="w-4 h-4 shrink-0 animate-bounce text-yellow-300" />
                    <span className="truncate">🚨 BÁO CHÁY! Khói: {room.smokeLevel} ppm</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-black uppercase tracking-wider shrink-0">
                    CÒI ĐANG HÚ
                  </span>
                </div>
              )}

              {/* Sensors summary (Nhiệt độ, Độ ẩm, Khí gas, Lửa, CO & CO2 từ bảng sensor_data & rooms) */}
              {(() => {
                const air = parseAirQuality(room.airQuality);
                return (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 my-2 py-2 px-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-left">
                    <div className="flex items-center gap-1 min-w-0">
                      <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-400 leading-none">Nhiệt độ</p>
                        <p className="text-[11px] font-bold text-white font-mono mt-0.5 truncate">
                          {room.temperature.toFixed(1)}°C
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 min-w-0">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-400 leading-none">Độ ẩm</p>
                        <p className="text-[11px] font-bold text-white font-mono mt-0.5 truncate">
                          {Math.round(room.humidity)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 min-w-0">
                      <Wind className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-400 leading-none">Khí gas</p>
                        <p className={`text-[11px] font-bold font-mono mt-0.5 truncate ${room.smokeLevel > 15 ? 'text-red-400' : 'text-slate-200'}`}>
                          {room.smokeLevel} ppm
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 min-w-0">
                      <Flame className={`w-3.5 h-3.5 shrink-0 ${room.flame ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-400 leading-none">Lửa</p>
                        <p className={`text-[11px] font-bold mt-0.5 truncate ${room.flame ? 'text-red-400 font-black animate-pulse' : 'text-slate-200'}`}>
                          {room.flame ? 'CÓ LỬA' : 'Ko có'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 min-w-0">
                      <Wind className={`w-3.5 h-3.5 shrink-0 ${air.isCoAlert ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-400 leading-none">Khí CO</p>
                        <p className={`text-[11px] font-bold font-mono mt-0.5 truncate ${air.isCoAlert ? 'text-red-400' : 'text-amber-300'}`}>
                          {air.coText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 min-w-0">
                      <Radio className={`w-3.5 h-3.5 shrink-0 ${air.isCo2Alert ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[8px] text-slate-400 leading-none">Khí CO2</p>
                        <p className={`text-[11px] font-bold font-mono mt-0.5 truncate ${air.isCo2Alert ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {air.co2Text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Relay Quick Controls Bar (4 Relays + Alarm Relay) */}
              <div 
                className="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-800/80 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* R1: Đèn */}
                  <button
                    type="button"
                    onClick={() => onToggleRelay && onToggleRelay(room.code || room.id, 'relay1_den')}
                    title={room.devices.light.isOn ? 'Relay 1 (Đèn): Đang BẬT. Bấm để tắt.' : 'Relay 1 (Đèn): Đang TẮT. Bấm để bật.'}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      room.devices.light.isOn
                        ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3 stroke-[2.2]" />
                    <span>R1</span>
                  </button>

                  {/* R2: Quạt */}
                  <button
                    type="button"
                    onClick={() => onToggleRelay && onToggleRelay(room.code || room.id, 'relay2_quat')}
                    title={room.devices.fan.isOn ? 'Relay 2 (Quạt): Đang BẬT. Bấm để tắt.' : 'Relay 2 (Quạt): Đang TẮT. Bấm để bật.'}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      room.devices.fan.isOn
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <Fan className={`w-3 h-3 stroke-[2.2] ${room.devices.fan.isOn ? 'animate-spin' : ''}`} />
                    <span>R2</span>
                  </button>

                  {/* R3: Máy chiếu */}
                  <button
                    type="button"
                    onClick={() => onToggleRelay && onToggleRelay(room.code || room.id, 'relay3_maychieu')}
                    title={room.devices.projector.isOn ? 'Relay 3 (Máy chiếu): Đang BẬT. Bấm để tắt.' : 'Relay 3 (Máy chiếu): Đang TẮT. Bấm để bật.'}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      room.devices.projector.isOn
                        ? 'bg-purple-500 text-white shadow-sm shadow-purple-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <Tv className="w-3 h-3 stroke-[2.2]" />
                    <span>R3</span>
                  </button>

                  {/* R4: Điều hòa */}
                  <button
                    type="button"
                    onClick={() => onToggleRelay && onToggleRelay(room.code || room.id, 'relay4_dieuhoa')}
                    title={room.devices.ac.isOn ? 'Relay 4 (Điều hòa): Đang BẬT. Bấm để tắt.' : 'Relay 4 (Điều hòa): Đang TẮT. Bấm để bật.'}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      room.devices.ac.isOn
                        ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <Wind className="w-3 h-3 stroke-[2.2]" />
                    <span>R4</span>
                  </button>

                  {/* R5 / Còi Báo Động */}
                  <button
                    type="button"
                    onClick={() => onToggleRelay && onToggleRelay(room.code || room.id, 'khan_cap')}
                    title={room.relayAlarm ? 'Còi báo động đang HÚ. Bấm để tắt.' : 'Còi báo động đang TẮT. Bấm để test còi.'}
                    className={`px-1.5 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      room.relayAlarm
                        ? 'bg-red-600 text-white animate-bounce shadow-sm shadow-red-600/40'
                        : 'bg-slate-800/80 text-red-400/80 hover:text-red-300 border border-slate-700/60'
                    }`}
                  >
                    <Siren className={`w-3 h-3 stroke-[2.2] ${room.relayAlarm ? 'animate-spin' : ''}`} />
                    <span>Còi</span>
                  </button>

                  {/* Auto Mode Toggle */}
                  {room.relayControl && (
                    <button
                      type="button"
                      onClick={() => onToggleRelay && onToggleRelay(room.code || room.id, 'auto_mode')}
                      title={
                        room.relayControl.auto_mode
                          ? 'auto_mode đang BẬT (Tự động theo cảm biến). Bấm để chuyển Thủ công.'
                          : 'auto_mode đang TẮT (Thủ công). Bấm để bật Tự động.'
                      }
                      className={`px-1.5 py-1 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                        room.relayControl.auto_mode
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      <span>{room.relayControl.auto_mode ? 'Auto' : 'Tay'}</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 shrink-0 font-medium ml-2">
                  {room.isOccupied ? '👥 Có lớp' : '🚪 Trống'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <DoorOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">Không tìm thấy phòng học phù hợp</h4>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng thử điều chỉnh lại bộ lọc tòa nhà hoặc từ khóa tìm kiếm.
          </p>
        </div>
      )}
    </div>
  );
};
