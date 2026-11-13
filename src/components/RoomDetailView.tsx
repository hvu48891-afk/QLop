/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Power, 
  Cpu,
  Lightbulb, 
  Wind, 
  Tv, 
  Fan, 
  Flame, 
  Thermometer, 
  Droplets, 
  Sliders, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Volume2,
  Share2,
  ShieldAlert,
  Trash2,
  Siren,
  Bell,
  ShieldCheck,
  ZapOff,
  PhoneCall,
  Check,
  AlertOctagon,
  Radio,
  FlameKindling,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { Room, LightPreset, AcMode, AcFanSpeed, ProjectorInput, User } from '../types';
import { soundManager } from '../utils/soundEffects';
import { supabaseService } from '../services/supabaseService';
import { parseAirQuality } from '../utils/airQuality';

interface RoomDetailViewProps {
  room: Room;
  currentUser?: User | null;
  onBack: () => void;
  onUpdateRoom: (updated: Room) => void;
  onToggleRelay?: (
    roomCode: string,
    relayType: 'relay1_den' | 'relay2_quat' | 'relay3_maychieu' | 'relay4_dieuhoa' | 'relay_alarm' | 'power_on' | 'auto_mode' | 'khan_cap',
    customState?: boolean
  ) => void;
  onEmergencyCut: (roomId: string, cutOff: boolean) => void;
  onTriggerSmokeForRoom: (roomId: string, autoCutPower?: boolean) => void;
  onClearSmokeForRoom: (roomId: string) => void;
  onDeleteRoom?: (roomCode: string) => void;
  soundEnabled: boolean;
}

export const RoomDetailView: React.FC<RoomDetailViewProps> = ({
  room,
  currentUser,
  onBack,
  onUpdateRoom,
  onToggleRelay,
  onEmergencyCut,
  onTriggerSmokeForRoom,
  onClearSmokeForRoom,
  onDeleteRoom,
  soundEnabled,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [autoCutPowerOnFire, setAutoCutPowerOnFire] = useState(true);

  // Helper sound player
  const playClick = () => {
    if (soundEnabled) soundManager.playClick();
  };
  const playSwitch = (state: boolean) => {
    if (soundEnabled) soundManager.playSwitch(state);
  };

  // Toggle main master room power
  const handleToggleRoomPower = () => {
    const newState = !room.isPowerOn;
    playSwitch(newState);
    onUpdateRoom({
      ...room,
      isPowerOn: newState,
      // If turned off, devices turn off
      devices: newState
        ? room.devices
        : {
            ...room.devices,
            light: { ...room.devices.light, isOn: false },
            ac: { ...room.devices.ac, isOn: false },
            projector: { ...room.devices.projector, isOn: false },
            fan: { ...room.devices.fan, isOn: false },
          },
      lastUpdated: 'Vừa xong',
    });
  };

  // RELAY 1: ĐÈN CHIẾU SÁNG (light_on / relay1_den)
  const handleToggleLight = () => {
    if (onToggleRelay) {
      onToggleRelay(room.code || room.id, 'relay1_den');
      return;
    }
    const newState = !room.devices.light.isOn;
    playSwitch(newState);
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        light: {
          ...room.devices.light,
          isOn: newState,
          brightness: newState ? (room.devices.light.brightness || 80) : 0,
        },
      },
    });
  };

  const handleLightPreset = (preset: LightPreset) => {
    playClick();
    let brightness = 80;
    let isOn = true;

    if (preset === 'study') {
      brightness = 100;
    } else if (preset === 'presentation') {
      brightness = 40;
    } else if (preset === 'exam') {
      brightness = 100;
    } else if (preset === 'off') {
      isOn = false;
      brightness = 0;
    }

    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        light: {
          isOn,
          brightness,
          preset,
        },
      },
    });
  };

  // RELAY 4: ĐIỀU HÒA (ac_on / relay4_dieuhoa)
  const handleToggleAc = () => {
    if (onToggleRelay) {
      onToggleRelay(room.code || room.id, 'relay4_dieuhoa');
      return;
    }
    const newState = !room.devices.ac.isOn;
    playSwitch(newState);
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        ac: {
          ...room.devices.ac,
          isOn: newState,
        },
      },
    });
  };

  const handleChangeTemp = (delta: number) => {
    playClick();
    const current = room.devices.ac.targetTemp;
    const newTemp = Math.min(30, Math.max(16, current + delta));
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        ac: {
          ...room.devices.ac,
          targetTemp: newTemp,
        },
      },
    });
  };

  const handleAcMode = (mode: AcMode) => {
    playClick();
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        ac: {
          ...room.devices.ac,
          mode,
          isOn: true,
        },
      },
    });
  };

  const handleAcTimer = (minutes: number | null) => {
    playClick();
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        ac: {
          ...room.devices.ac,
          timerMinutes: minutes,
        },
      },
    });
  };

  // RELAY 3: MÁY CHIẾU (projector_on / relay3_maychieu)
  const handleToggleProjector = () => {
    if (onToggleRelay) {
      onToggleRelay(room.code || room.id, 'relay3_maychieu');
      return;
    }
    const newState = !room.devices.projector.isOn;
    playSwitch(newState);
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        projector: {
          ...room.devices.projector,
          isOn: newState,
        },
      },
    });
  };

  const handleProjectorSource = (source: ProjectorInput) => {
    playClick();
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        projector: {
          ...room.devices.projector,
          inputSource: source,
        },
      },
    });
  };

  // RELAY 2: QUẠT THÔNG GIÓ (fan_on / relay2_quat)
  const handleToggleFan = () => {
    if (onToggleRelay) {
      onToggleRelay(room.code || room.id, 'relay2_quat');
      return;
    }
    const newState = !room.devices.fan.isOn;
    playSwitch(newState);
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        fan: {
          ...room.devices.fan,
          isOn: newState,
          speed: newState ? (room.devices.fan.speed || 2) : 0,
        },
      },
    });
  };

  const handleFanSpeed = (speed: number) => {
    playClick();
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        fan: {
          isOn: true,
          speed,
        },
      },
    });
  };

  // RELAY CÒI BÁO ĐỘNG (relay_alarm)
  const handleToggleAlarmRelay = () => {
    if (onToggleRelay) {
      onToggleRelay(room.code || room.id, 'relay_alarm');
      return;
    }
    const newState = !room.relayAlarm;
    playSwitch(newState);
    onUpdateRoom({
      ...room,
      relayAlarm: newState,
    });
  };

  const isAlarm = room.hasFireAlarm || Boolean(room.flame) || room.smokeLevel > 300;

  return (
    <div className="pb-24 lg:pb-12 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Bar Navigation & Room Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
            title="Quay lại danh sách phòng"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {room.name}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-orange-400 border border-orange-500/20">
                {room.building} - Tầng {room.floor}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sức chứa: {room.capacity} chỗ • {room.isOccupied ? '👥 Đang có lớp học' : '🚪 Phòng đang trống'}
            </p>
          </div>
        </div>

        {/* Action badges & Simulators */}
        <div className="flex items-center gap-2">
          {isAlarm ? (
            <button
              onClick={() => onClearSmokeForRoom(room.code || room.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs animate-bounce shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            >
              <Flame className="w-4 h-4 animate-spin" />
              <span>ĐANG BÁO CHÁY! BẤM ĐỂ TẮT CÒI</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PCCC An toàn</span>
            </div>
          )}

          {/* Delete room button (Admin only) */}
          {isAdmin && onDeleteRoom && (
            <button
              onClick={() => onDeleteRoom(room.code || room.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs font-semibold transition-all active:scale-95"
              title="Xóa phòng học này khỏi hệ thống và database (Quản trị viên)"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Xóa phòng</span>
            </button>
          )}

          {/* Master power status pill */}
          <div
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
              room.isPowerOn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                room.isPowerOn ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span>
              {room.isPowerOn ? 'ĐANG MỞ ĐIỆN' : 'ĐÃ TẮT ĐIỆN'}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Fire Strobe Banner if alarm active */}
      {isAlarm && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white shadow-2xl border-2 border-red-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
              <Flame className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-black tracking-wider uppercase">
                  🚨 BÁO ĐỘNG KHẨN CẤP
                </span>
                <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md">
                  Khói: {room.smokeLevel} ppm • Nhiệt độ: {room.temperature.toFixed(1)}°C
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">
                PHÁT HIỆN BÁO CHÁY TẠI {room.name.toUpperCase()}!
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                Còi hú báo động và đèn chớp đang phát tín hiệu cảnh báo. Đề nghị sơ tán học sinh theo lối cầu thang {room.building}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => onClearSmokeForRoom(room.code || room.id)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-red-600 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>TẮT CÒI & ĐẶT LẠI AN TOÀN</span>
            </button>

            {room.isPowerOn && (
              <button
                onClick={() => onEmergencyCut(room.id, true)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs border border-white/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <ZapOff className="w-4 h-4 text-amber-300" />
                <span>CẮT ĐIỆN PHÒNG</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= 1. SENSOR METRICS CARD (DỮ LIỆU THỰC TẾ TỪ BẢNG SENSOR_DATA & ROOMS) ================= */}
      {(() => {
        const airInfo = parseAirQuality(room.airQuality);
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Temperature */}
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Nhiệt độ
                </span>
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Thermometer className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                  {room.temperature.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-orange-400">°C</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {room.temperature > 32 ? 'Nhiệt độ cao' : 'Tiêu chuẩn'}
              </p>
            </div>

            {/* Card 2: Humidity */}
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Độ ẩm
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Droplets className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                  {Math.round(room.humidity)}
                </span>
                <span className="text-lg font-bold text-cyan-400">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                Lớp học (50-70%)
              </p>
            </div>

            {/* Card 3: Gas Concentration */}
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Khí gas
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  room.smokeLevel > 15 ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Wind className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                  room.smokeLevel > 15 ? 'text-red-400 animate-pulse' : 'text-white'
                }`}>
                  {room.smokeLevel}
                </span>
                <span className="text-xs font-semibold text-slate-400">ppm</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${room.smokeLevel > 15 ? 'bg-red-400' : 'bg-emerald-400'}`} />
                {room.smokeLevel > 15 ? 'Khí gas cảnh báo!' : 'Khí gas an toàn'}
              </p>
            </div>

            {/* Card 4: Flame Sensor */}
            <div className={`relative overflow-hidden p-4 rounded-2xl border shadow-lg flex flex-col justify-between transition-all ${
              room.flame 
                ? 'bg-red-950/80 border-red-500 animate-pulse ring-2 ring-red-500/50' 
                : 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Cảm biến Lửa
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  room.flame ? 'bg-red-600 text-white animate-bounce' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className={`text-xl font-black uppercase tracking-wide ${
                  room.flame ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}>
                  {room.flame ? '🚨 CÓ LỬA!' : 'Ko có'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${room.flame ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                {room.flame ? 'Phát hiện ngọn lửa!' : 'An toàn'}
              </p>
            </div>

            {/* Card 5: Carbon Monoxide (CO) */}
            <div className={`relative overflow-hidden p-4 rounded-2xl border shadow-lg flex flex-col justify-between transition-all ${
              airInfo.isCoAlert 
                ? 'bg-red-950/40 border-red-500/80 ring-1 ring-red-500/40' 
                : 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Khí CO
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  airInfo.isCoAlert
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <Wind className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                  airInfo.isCoAlert ? 'text-red-400' : 'text-amber-300'
                }`}>
                  {airInfo.co}
                </span>
                <span className="text-xs font-semibold text-slate-400">ppm</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  airInfo.isCoAlert ? 'bg-red-400 animate-ping' : 'bg-emerald-400'
                }`} />
                {airInfo.isCoAlert ? 'CO cảnh báo!' : 'CO đạt chuẩn'}
              </p>
            </div>

            {/* Card 6: Carbon Dioxide (CO2) */}
            <div className={`relative overflow-hidden p-4 rounded-2xl border shadow-lg flex flex-col justify-between transition-all ${
              airInfo.isCo2Alert 
                ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/40' 
                : 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Khí CO2
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  airInfo.isCo2Alert
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                  airInfo.isCo2Alert ? 'text-amber-300' : 'text-emerald-400'
                }`}>
                  {airInfo.co2}
                </span>
                <span className="text-xs font-semibold text-slate-400">ppm</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  airInfo.isCo2Alert ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {airInfo.isCo2Alert ? 'Cần thông gió/bật quạt' : 'CO2 trong lành'}
              </p>
            </div>
          </div>
        );
      })()}

      {/* ================= 2. HỆ THỐNG BÁO CHÁY & AN TOÀN PCCC PHÒNG HỌC ================= */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl transition-all ${
        isAlarm 
          ? 'bg-red-950/40 border-red-500/80 ring-2 ring-red-500/40 shadow-red-500/20' 
          : 'bg-slate-900/95 border-slate-800'
      }`}>
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isAlarm 
                ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/40' 
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              <Flame className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Hệ thống Báo Cháy & An Toàn PCCC Phòng Học
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  isAlarm 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isAlarm ? '🚨 CÒI HÚ ĐANG KÊU (95dB)' : '✓ SẴN SÀNG AN TOÀN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Giám sát cảm biến khói quang điện MQ-2, cảm biến nhiệt độ gia tăng và nút chuông báo cháy khẩn cấp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isAlarm ? (
              <button
                onClick={() => onClearSmokeForRoom(room.code || room.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Đặt lại an toàn</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Đầu dò PCCC Online
              </span>
            )}
          </div>
        </div>

        {/* Emergency Manual Call Point (Hộp chuông đập kính báo cháy khẩn cấp) */}
        <div className={`p-4 sm:p-5 rounded-2xl border mb-5 transition-all ${
          isAlarm 
            ? 'bg-red-950/80 border-red-500' 
            : 'bg-gradient-to-r from-red-950/30 via-slate-950/80 to-slate-950/80 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Siren className={`w-4 h-4 ${isAlarm ? 'text-red-400 animate-spin' : 'text-emerald-400'}`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Giám sát an toàn PCCC & Còi báo động thực tế
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Tiêu chuẩn TCVN 5738:2021
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isAlarm ? (
              <button
                onClick={() => onClearSmokeForRoom(room.code || room.id)}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-red-600 font-black text-xs tracking-wider uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>🛑 TẮT CÒI BÁO CHÁY & KHÔI PHỤC AN TOÀN</span>
              </button>
            ) : (
              <div className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hệ thống giám sát thực tế đang hoạt động bình thường</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Dữ liệu từ cảm biến thực 24/7</span>
              </div>
            )}

            {/* Auto Power Cut Option */}
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:border-orange-500/40 transition-colors shrink-0">
              <input
                type="checkbox"
                checked={autoCutPowerOnFire}
                onChange={(e) => setAutoCutPowerOnFire(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
              <span className="text-[11px] font-medium">
                Tự động ngắt điện phòng khi có báo cháy
              </span>
            </label>
          </div>
        </div>

        {/* 4 Real-time PCCC Monitoring Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {/* Card 1: Cảm biến khói quang điện */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400">Đầu báo khói quang</span>
              <Flame className={`w-4 h-4 ${isAlarm ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black font-mono ${isAlarm ? 'text-red-400' : 'text-white'}`}>
                  {room.smokeLevel}
                </span>
                <span className="text-xs text-slate-400">ppm</span>
              </div>
              {/* Level indicator bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    room.smokeLevel >= 350 ? 'bg-red-500' : room.smokeLevel >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (room.smokeLevel / 600) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {room.smokeLevel >= 350 ? '⚠️ Nguy hiểm vượt ngưỡng' : '✓ Nồng độ an toàn (< 350)'}
              </p>
            </div>
          </div>

          {/* Card 2: Đầu báo nhiệt độ gia tăng */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400">Đầu báo nhiệt độ</span>
              <Thermometer className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">
                  {room.temperature.toFixed(1)}
                </span>
                <span className="text-xs text-orange-400">°C</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    room.temperature >= 45 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, (room.temperature / 60) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {room.temperature >= 45 ? '⚠️ Quá nhiệt phòng' : '✓ Nhiệt độ phòng ổn định'}
              </p>
            </div>
          </div>

          {/* Card 3: Còi hú & Đèn chớp */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400">Còi hú & Đèn chớp</span>
              <Bell className={`w-4 h-4 ${isAlarm ? 'text-red-400 animate-spin' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {isAlarm ? 'Đang phát tín hiệu' : 'Chế độ chờ (Standby)'}
              </p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Âm lượng: 95 dB
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-[10px] text-slate-400">
                  {isAlarm ? 'Đèn chớp đỏ nhấp nháy' : 'Hệ thống sẵn sàng'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Bình chữa cháy tại chỗ */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400">Bình chữa cháy</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                01 Bình bột + 01 CO2
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Vị trí: Cửa phòng {room.name}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Kiểm định đạt chuẩn
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Evacuation & Emergency Hotline Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Hướng dẫn thoát hiểm:</span>
              <span className="text-slate-400 ml-1">
                Lối cầu thang bộ {room.building} (Tầng {room.floor}). Không dùng thang máy khi có sự cố cháy.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-400">Hotline PCCC:</span>
            <span className="px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 font-black font-mono">
              114
            </span>
          </div>
        </div>
      </div>

      {/* ================= BẢNG ĐIỀU KHIỂN RƠ-LE THỰC TẾ (4 KÊNH RELAY + RELAY BÁO ĐỘNG + CẦU DAO) ================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-bl-full" />

        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Cpu className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                  Bảng Điều Khiển Rơ-le Phần Cứng 220V • Phòng {room.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  4 RƠ-LE + CÒI BÁO ĐỘNG
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Thao tác đóng/ngắt trực tiếp rơ-le vi điều khiển ESP32 và đồng bộ trạng thái tức thì vào Database Supabase
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onToggleRelay && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onToggleRelay(room.code || room.id, 'auto_mode');
                }}
                title="Chuyển chế độ Tự động (auto_mode) hoặc Thủ công trong bảng relay_control"
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all active:scale-95 ${
                  room.relayControl?.auto_mode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{room.relayControl?.auto_mode ? 'AUTO MODE: BẬT' : 'CHẾ ĐỘ THỦ CÔNG'}</span>
              </button>
            )}
            <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>relay_control: {room.code || room.id}</span>
            </div>
          </div>
        </div>

        {/* 6 Relay Cards (Relay 1 to 4 + Relay Alarm + Master Power) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
          {/* 1. RELAY 1: ĐÈN CHIẾU SÁNG */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            room.devices.light.isOn
              ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  KÊNH 1 (R1)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  relay_control.relay1_den
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  room.devices.light.isOn
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Lightbulb className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Đèn Chiếu Sáng</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${room.devices.light.isOn ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                    <span>{room.devices.light.isOn ? 'Lệnh: Đang BẬT (ON)' : 'Lệnh: Đang TẮT (OFF)'}</span>
                  </p>
                  {room.relayControl?.state_relay1_den !== undefined && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      ESP32 thực tế:{' '}
                      <span className={room.relayControl.state_relay1_den ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {room.relayControl.state_relay1_den ? 'Đang BẬT' : 'Đang TẮT'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleLight}
              disabled={room.emergencyPowerCut}
              className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                room.devices.light.isOn
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Power className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{room.devices.light.isOn ? 'TẮT RELAY 1' : 'BẬT RELAY 1'}</span>
            </button>
          </div>

          {/* 2. RELAY 2: QUẠT THÔNG GIÓ */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            room.devices.fan.isOn
              ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                  KÊNH 2 (R2)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  relay_control.relay2_quat
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  room.devices.fan.isOn
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Fan className={`w-5 h-5 stroke-[2.2] ${room.devices.fan.isOn ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Quạt Thông Gió</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${room.devices.fan.isOn ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <span>{room.devices.fan.isOn ? 'Lệnh: Đang BẬT (ON)' : 'Lệnh: Đang TẮT (OFF)'}</span>
                  </p>
                  {room.relayControl?.state_relay2_quat !== undefined && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      ESP32 thực tế:{' '}
                      <span className={room.relayControl.state_relay2_quat ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {room.relayControl.state_relay2_quat ? 'Đang BẬT' : 'Đang TẮT'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleFan}
              disabled={room.emergencyPowerCut}
              className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                room.devices.fan.isOn
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Power className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{room.devices.fan.isOn ? 'TẮT RELAY 2' : 'BẬT RELAY 2'}</span>
            </button>
          </div>

          {/* 3. RELAY 3: MÁY CHIẾU */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            room.devices.projector.isOn
              ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
                  KÊNH 3 (R3)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  relay_control.relay3_maychieu
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  room.devices.projector.isOn
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Tv className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Máy Chiếu Lớp Học</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${room.devices.projector.isOn ? 'bg-purple-400 animate-ping' : 'bg-slate-600'}`} />
                    <span>{room.devices.projector.isOn ? 'Lệnh: Đang BẬT (ON)' : 'Lệnh: Đang TẮT (OFF)'}</span>
                  </p>
                  {room.relayControl?.state_relay3_maychieu !== undefined && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      ESP32 thực tế:{' '}
                      <span className={room.relayControl.state_relay3_maychieu ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {room.relayControl.state_relay3_maychieu ? 'Đang BẬT' : 'Đang TẮT'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleProjector}
              disabled={room.emergencyPowerCut}
              className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                room.devices.projector.isOn
                  ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Power className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{room.devices.projector.isOn ? 'TẮT RELAY 3' : 'BẬT RELAY 3'}</span>
            </button>
          </div>

          {/* 4. RELAY 4: ĐIỀU HÒA KHÔNG KHÍ */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            room.devices.ac.isOn
              ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                  KÊNH 4 (R4)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  relay_control.relay4_dieuhoa
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  room.devices.ac.isOn
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Wind className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Điều Hòa Không Khí</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${room.devices.ac.isOn ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                    <span>{room.devices.ac.isOn ? `Lệnh: Đang BẬT (${room.devices.ac.targetTemp}°C)` : 'Lệnh: Đang TẮT (OFF)'}</span>
                  </p>
                  {room.relayControl?.state_relay4_dieuhoa !== undefined && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      ESP32 thực tế:{' '}
                      <span className={room.relayControl.state_relay4_dieuhoa ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {room.relayControl.state_relay4_dieuhoa ? 'Đang BẬT' : 'Đang TẮT'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleAc}
              disabled={room.emergencyPowerCut}
              className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                room.devices.ac.isOn
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Power className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{room.devices.ac.isOn ? 'TẮT RELAY 4' : 'BẬT RELAY 4'}</span>
            </button>
          </div>

          {/* 5. RELAY 5: CÒI BÁO ĐỘNG PCCC */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            room.relayAlarm
              ? 'bg-red-950/60 border-red-500 shadow-xl shadow-red-500/30 ring-2 ring-red-500 animate-pulse'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                  room.relayAlarm ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  KHẨN CẤP / CÒI
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  relay_control.khan_cap
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  room.relayAlarm
                    ? 'bg-red-600 text-white animate-bounce shadow-lg shadow-red-600/40'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Siren className={`w-5 h-5 stroke-[2.2] ${room.relayAlarm ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Còi Hú Báo Cháy</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${room.relayAlarm ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                    <span className={room.relayAlarm ? 'text-red-400 font-bold' : ''}>
                      {room.relayAlarm ? '🚨 CÒI ĐANG HÚ' : 'Chế độ chờ (OFF)'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleAlarmRelay}
              className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                room.relayAlarm
                  ? 'bg-white hover:bg-slate-100 text-red-600 shadow-xl'
                  : 'bg-slate-800 hover:bg-red-950/40 text-red-300 hover:text-red-200 border border-red-500/30'
              }`}
            >
              <Siren className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{room.relayAlarm ? '🛑 TẮT CÒI BÁO ĐỘNG' : 'TEST CÒI BÁO ĐỘNG'}</span>
            </button>
          </div>

          {/* 6. CẦU DAO NGUỒN PHÒNG (POWER_ON) */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            room.isPowerOn
              ? 'bg-slate-900 border-slate-700'
              : 'bg-red-950/40 border-red-500/60'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                  room.isPowerOn ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  CẦU DAO TỔNG
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  rooms.power_on
                </span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  room.isPowerOn
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  <Power className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Nguồn Điện Phòng</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${room.isPowerOn ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    <span>{room.isPowerOn ? 'Phòng đang có điện (ON)' : 'ĐÃ NGẮT ĐIỆN (OFF)'}</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onEmergencyCut(room.id, room.isPowerOn)}
              className={`w-full mt-3 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                room.isPowerOn
                  ? 'bg-red-600/90 hover:bg-red-500 text-white shadow-md shadow-red-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              <Power className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{room.isPowerOn ? 'NGẮT NGUỒN PHÒNG' : 'ĐÓNG ĐIỆN PHÒNG'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. HỆ THỐNG ĐÈN CHIẾU SÁNG (LIGHTS) ================= */}
      <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                room.devices.light.isOn
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Lightbulb className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Hệ thống chiếu sáng</h3>
              <p className="text-xs text-slate-400">
                {room.devices.light.isOn
                  ? `Đang bật • Độ sáng: ${room.devices.light.brightness}%`
                  : 'Đang tắt'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleLight}
            disabled={room.emergencyPowerCut}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${
              room.devices.light.isOn ? 'bg-amber-500' : 'bg-slate-800'
            } ${room.emergencyPowerCut ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                room.devices.light.isOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4 Chế độ nhanh (Quick Presets) */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">
            Chế độ ánh sáng nhanh:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'study', label: 'Học tập', desc: 'Sáng 100% trắng', icon: '📖' },
              { id: 'presentation', label: 'Thuyết trình', desc: 'Giảm 40% đèn trước', icon: '📽️' },
              { id: 'exam', label: 'Thi đấu / Kiểm tra', desc: 'Ánh sáng tập trung', icon: '✍️' },
              { id: 'off', label: 'Tắt hết', desc: 'Tắt toàn bộ đèn', icon: '🌑' },
            ].map((p) => {
              const isSelected = room.devices.light.isOn && room.devices.light.preset === p.id;
              const isOffSelected = !room.devices.light.isOn && p.id === 'off';
              const active = isSelected || isOffSelected;
              return (
                <button
                  key={p.id}
                  onClick={() => handleLightPreset(p.id as LightPreset)}
                  disabled={room.emergencyPowerCut}
                  className={`p-3 rounded-2xl text-left border transition-all active:scale-95 ${
                    active
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{p.icon}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="font-bold text-xs leading-tight text-white">{p.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider Độ sáng */}
        {room.devices.light.isOn && (
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Điều chỉnh độ sáng tùy chỉnh:</span>
              <span className="font-mono font-bold text-amber-400">
                {room.devices.light.brightness}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={room.devices.light.brightness}
              onChange={(e) => {
                onUpdateRoom({
                  ...room,
                  devices: {
                    ...room.devices,
                    light: {
                      ...room.devices.light,
                      brightness: Number(e.target.value),
                    },
                  },
                });
              }}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* ================= 3. ĐIỀU HÒA KHÔNG KHÍ (AIR CONDITIONER) ================= */}
      <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                room.devices.ac.isOn
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Wind className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Hệ thống điều hòa</h3>
              <p className="text-xs text-slate-400">
                {room.devices.ac.isOn
                  ? `Đang chạy – ${
                      room.devices.ac.mode === 'cool'
                        ? 'Làm mát'
                        : room.devices.ac.mode === 'fan'
                        ? 'Chỉ quạt'
                        : room.devices.ac.mode === 'dry'
                        ? 'Hút ẩm'
                        : 'Tự động'
                    }`
                  : 'Đang tắt'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleAc}
            disabled={room.emergencyPowerCut}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${
              room.devices.ac.isOn ? 'bg-cyan-500' : 'bg-slate-800'
            } ${room.emergencyPowerCut ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                room.devices.ac.isOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Temperature Set Controller (+ / -) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Nhiệt độ cài đặt
              </p>
              <p className="text-3xl font-black text-cyan-400 mt-1 font-mono">
                {room.devices.ac.targetTemp}°C
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleChangeTemp(-1)}
                disabled={!room.devices.ac.isOn || room.emergencyPowerCut}
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-40"
              >
                −
              </button>
              <button
                onClick={() => handleChangeTemp(1)}
                disabled={!room.devices.ac.isOn || room.emergencyPowerCut}
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Modes */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-center">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
              Chế độ hoạt động
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cool', label: 'Làm mát' },
                { id: 'fan', label: 'Quạt gió' },
                { id: 'dry', label: 'Hút ẩm' },
                { id: 'auto', label: 'Tự động' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleAcMode(m.id as AcMode)}
                  disabled={!room.devices.ac.isOn || room.emergencyPowerCut}
                  className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
                    room.devices.ac.isOn && room.devices.ac.mode === m.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  } disabled:opacity-40`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hẹn giờ tắt (Timer) */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>
              Hẹn giờ tắt máy:{' '}
              <strong className="text-white">
                {room.devices.ac.timerMinutes ? `${room.devices.ac.timerMinutes} phút` : 'Chưa đặt'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[30, 60, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => handleAcTimer(mins)}
                disabled={!room.devices.ac.isOn || room.emergencyPowerCut}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  room.devices.ac.timerMinutes === mins
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                } disabled:opacity-40`}
              >
                {mins === 60 ? '1 giờ' : mins === 120 ? '2 giờ' : `${mins}p`}
              </button>
            ))}
            {room.devices.ac.timerMinutes && (
              <button
                onClick={() => handleAcTimer(null)}
                className="px-2.5 py-1 text-xs rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 4. MÁY CHIẾU & QUẠT TRẦN (PROJECTOR & FAN) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Máy chiếu (Projector) */}
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    room.devices.projector.isOn
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-md shadow-purple-500/10'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Tv className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Máy chiếu</h3>
                  <p className="text-xs text-slate-400">
                    {room.devices.projector.isOn ? 'Đang chiếu hình ảnh' : 'Đang tắt'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleProjector}
                disabled={room.emergencyPowerCut}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 relative ${
                  room.devices.projector.isOn ? 'bg-purple-500' : 'bg-slate-800'
                } ${room.emergencyPowerCut ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    room.devices.projector.isOn ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Input Sources */}
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">
                Nguồn vào màn hình
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hdmi', label: 'HDMI 1' },
                  { id: 'airplay', label: 'Không dây' },
                  { id: 'typec', label: 'Type-C' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleProjectorSource(s.id as ProjectorInput)}
                    disabled={!room.devices.projector.isOn || room.emergencyPowerCut}
                    className={`py-2 text-xs rounded-xl font-semibold transition-all ${
                      room.devices.projector.isOn && room.devices.projector.inputSource === s.id
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800'
                    } disabled:opacity-40`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quạt trần (Ceiling Fan) */}
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    room.devices.fan.isOn
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Fan className={`w-5 h-5 ${room.devices.fan.isOn ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Quạt trần thông gió</h3>
                  <p className="text-xs text-slate-400">
                    {room.devices.fan.isOn
                      ? `Đang quay • Tốc độ: Cấp ${room.devices.fan.speed}`
                      : 'Đang tắt'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleFan}
                disabled={room.emergencyPowerCut}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 relative ${
                  room.devices.fan.isOn ? 'bg-emerald-500' : 'bg-slate-800'
                } ${room.emergencyPowerCut ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    room.devices.fan.isOn ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Fan speeds */}
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">
                Cấp độ gió
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleFanSpeed(spd)}
                    disabled={!room.devices.fan.isOn || room.emergencyPowerCut}
                    className={`py-2 text-xs rounded-xl font-bold transition-all ${
                      room.devices.fan.isOn && room.devices.fan.speed === spd
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800'
                    } disabled:opacity-40`}
                  >
                    Cấp {spd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ================= 6. CÔNG TẮC ĐIỆN NGUỒN PHÒNG ================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            room.isPowerOn 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <Power className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base sm:text-lg">
              CÔNG TẮC NGUỒN {room.name}
            </h4>
            <p className="text-xs text-slate-400">
              {room.isPowerOn 
                ? 'Phòng đang có điện. Bấm để tắt nguồn toàn bộ thiết bị trong phòng.' 
                : 'Phòng đang tắt điện. Bấm để bật lại nguồn điện cho phòng.'}
            </p>
          </div>
        </div>

        {room.isPowerOn ? (
          <button
            onClick={() => onEmergencyCut(room.id, true)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/25 active:scale-95 transition-all uppercase flex items-center justify-center gap-2"
          >
            <Power className="w-4 h-4 text-white" />
            <span>NGẮT ĐIỆN PHÒNG</span>
          </button>
        ) : (
          <button
            onClick={() => onEmergencyCut(room.id, false)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/25 active:scale-95 transition-all uppercase flex items-center justify-center gap-2"
          >
            <Power className="w-4 h-4 text-white" />
            <span>BẬT ĐIỆN PHÒNG</span>
          </button>
        )}
      </div>
    </div>
  );
};
