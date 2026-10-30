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
  Power, 
  Check, 
  AlertOctagon,
  ChevronRight,
  ShieldAlert,
  ZapOff,
  Plus,
  Database,
  Building
} from 'lucide-react';
import { Room } from '../types';

interface RoomsTabProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
  onToggleRoomPower: (roomId: string, e: React.MouseEvent) => void;
  onTriggerSmoke: (roomId: string, e: React.MouseEvent) => void;
  onOpenSchoolPowerModal?: () => void;
  onOpenAddRoomModal?: () => void;
  dbRoomCount?: number;
  onPushToDatabase?: () => void;
  onFetchFromDatabase?: () => void;
  isSyncingDb?: boolean;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  rooms,
  onSelectRoom,
  onToggleRoomPower,
  onTriggerSmoke,
  onOpenSchoolPowerModal,
  onOpenAddRoomModal,
  dbRoomCount,
  onPushToDatabase,
  onFetchFromDatabase,
  isSyncingDb,
}) => {
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
          {onOpenAddRoomModal && (
            <button
              onClick={onOpenAddRoomModal}
              title="Thêm phòng học mới vào hệ thống"
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

          {onFetchFromDatabase && dbRoomCount !== undefined && dbRoomCount > 0 && (
            <button
              onClick={onFetchFromDatabase}
              title="Tải danh sách phòng học từ Supabase về hệ thống"
              className="flex-1 md:flex-none px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nạp từ DB</span>
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
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'on', label: 'Đang mở' },
            { id: 'off', label: 'Tắt điện' },
            { id: 'alarm', label: 'Báo khói' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st.id
                  ? 'bg-slate-200 text-slate-950 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Master School Power Cut Trigger */}
        {onOpenSchoolPowerModal && (
          <button
            onClick={onOpenSchoolPowerModal}
            title="Mở bảng điều khiển cắt điện toàn trường"
            className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 whitespace-nowrap"
          >
            <ZapOff className="w-3.5 h-3.5" />
            <span>Tắt điện toàn trường</span>
          </button>
        )}
      </div>

      {/* Grid of Classrooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
        {filteredRooms.map((room) => {
          const isAlarm = room.hasFireAlarm || room.smokeLevel > 300;
          const isPowerOn = room.isPowerOn && !room.emergencyPowerCut;

          // Card Background & Border Style as specified:
          // Xám = tắt điện
          // Sáng/vàng = đang bật
          // Đỏ nhấp nháy (animation) = có cháy/khói
          let cardStyle = 'bg-slate-900/60 border-slate-800 text-slate-400';
          if (isAlarm) {
            cardStyle =
              'bg-red-950/90 border-red-500 ring-2 ring-red-500 animate-pulse text-red-100 shadow-2xl shadow-red-500/30';
          } else if (isPowerOn) {
            cardStyle =
              'bg-gradient-to-b from-slate-900 to-slate-900/90 border-amber-500/50 shadow-xl shadow-amber-500/5 text-slate-200 ring-1 ring-amber-500/20';
          }

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
                    {isAlarm ? <Flame className="w-6 h-6" /> : room.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                      {room.name}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-slate-400">
                      {room.building} • Tầng {room.floor}
                    </p>
                  </div>
                </div>

                {/* Direct Power Switch Button on card */}
                <button
                  onClick={(e) => onToggleRoomPower(room.id, e)}
                  title={isPowerOn ? 'Tắt điện phòng' : 'Bật điện phòng'}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isPowerOn
                      ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Power className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Status Alert Badge if any */}
              {isAlarm && (
                <div className="mb-3 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>CẢNH BÁO KHÓI/CHÁY ({room.smokeLevel} ppm)</span>
                </div>
              )}

              {room.emergencyPowerCut && !isAlarm && (
                <div className="mb-3 px-3 py-1 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Đã ngắt điện khẩn cấp</span>
                </div>
              )}

              {/* Sensors summary (Temp & Humidity) */}
              <div className="grid grid-cols-2 gap-2 my-2 py-2 px-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 leading-none">Nhiệt độ</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      {room.temperature.toFixed(1)}°C
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 leading-none">Độ ẩm</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      {Math.round(room.humidity)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Devices active indicators bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    title={room.devices.light.isOn ? 'Đèn đang bật' : 'Đèn tắt'}
                    className={`p-1.5 rounded-lg ${
                      room.devices.light.isOn
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-800/60 text-slate-600'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                  </span>

                  <span
                    title={room.devices.ac.isOn ? 'Điều hòa đang bật' : 'Điều hòa tắt'}
                    className={`p-1.5 rounded-lg ${
                      room.devices.ac.isOn
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800/60 text-slate-600'
                    }`}
                  >
                    <Wind className="w-3.5 h-3.5" />
                  </span>

                  <span
                    title={room.devices.projector.isOn ? 'Máy chiếu đang bật' : 'Máy chiếu tắt'}
                    className={`p-1.5 rounded-lg ${
                      room.devices.projector.isOn
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-800/60 text-slate-600'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                  </span>
                </div>

                <span className="text-[11px] text-slate-400">
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
