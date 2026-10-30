/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Power, 
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
  Blinds,
  ArrowUp,
  ArrowDown,
  Square
} from 'lucide-react';
import { Room, LightPreset, AcMode, AcFanSpeed, ProjectorInput, CurtainState } from '../types';
import { soundManager } from '../utils/soundEffects';

interface RoomDetailViewProps {
  room: Room;
  onBack: () => void;
  onUpdateRoom: (updated: Room) => void;
  onEmergencyCut: (roomId: string, cutOff: boolean) => void;
  onTriggerSmokeForRoom: (roomId: string) => void;
  onClearSmokeForRoom: (roomId: string) => void;
  onUpdateCurtain?: (roomCode: string, curtain: CurtainState) => void;
  soundEnabled: boolean;
}

export const RoomDetailView: React.FC<RoomDetailViewProps> = ({
  room,
  onBack,
  onUpdateRoom,
  onEmergencyCut,
  onTriggerSmokeForRoom,
  onClearSmokeForRoom,
  onUpdateCurtain,
  soundEnabled,
}) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

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

  // LIGHT CONTROLS
  const handleToggleLight = () => {
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

  // AC CONTROLS
  const handleToggleAc = () => {
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

  // PROJECTOR
  const handleToggleProjector = () => {
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

  // FAN
  const handleToggleFan = () => {
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

  // CURTAIN CONTROLS (Lên / Xuống / Dừng)
  const handleCurtain = (action: CurtainState) => {
    playClick();
    if (onUpdateCurtain) {
      onUpdateCurtain(room.code, action);
    }
    onUpdateRoom({
      ...room,
      devices: {
        ...room.devices,
        curtain: action,
      },
    });
  };

  const isAlarm = room.hasFireAlarm || room.smokeLevel > 300;

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
              onClick={() => onClearSmokeForRoom(room.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs animate-bounce shadow-lg shadow-red-600/30"
            >
              <Flame className="w-4 h-4 animate-spin" />
              <span>ĐANG BÁO KHÓI! BẤM ĐỂ TẮT</span>
            </button>
          ) : (
            <button
              onClick={() => onTriggerSmokeForRoom(room.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 text-xs font-medium transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Test báo khói phòng này</span>
            </button>
          )}

          {/* Master power status pill */}
          <div
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
              room.emergencyPowerCut
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : room.isPowerOn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                room.emergencyPowerCut
                  ? 'bg-red-500 animate-ping'
                  : room.isPowerOn
                  ? 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
            <span>
              {room.emergencyPowerCut
                ? 'NGẮT ĐIỆN KHẨN CẤP'
                : room.isPowerOn
                ? 'ĐANG MỞ ĐIỆN'
                : 'ĐÃ TẮT ĐIỆN'}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency banner if power cut */}
      {room.emergencyPowerCut && (
        <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-200 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-300 text-sm sm:text-base">
                PHÒNG ĐANG Ở CHẾ ĐỘ NGẮT ĐIỆN KHẨN CẤP!
              </p>
              <p className="text-xs text-slate-300">
                Toàn bộ nguồn điện tổng bị cô lập vì lý do an toàn. Nhấn nút bên phải để cấp lại điện.
              </p>
            </div>
          </div>
          <button
            onClick={() => onEmergencyCut(room.id, false)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shrink-0 transition-transform active:scale-95"
          >
            CẤP LẠI ĐIỆN PHÒNG
          </button>
        </div>
      )}

      {/* ================= 1. SENSOR METRICS CARD (LARGE TEMP & HUMIDITY) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Temperature Card */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Nhiệt độ phòng
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {room.temperature.toFixed(1)}
            </span>
            <span className="text-2xl font-bold text-orange-400">°C</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Trạng thái: {room.temperature > 32 ? 'Nhiệt độ cao' : 'Mát mẻ, dễ chịu'}
          </p>
        </div>

        {/* Humidity Card */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Độ ẩm không khí
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {Math.round(room.humidity)}
            </span>
            <span className="text-2xl font-bold text-cyan-400">%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            Độ ẩm tiêu chuẩn lớp học (50% - 70%)
          </p>
        </div>

        {/* Smoke / Air Quality Card */}
        <div
          className={`sm:col-span-2 lg:col-span-1 relative overflow-hidden p-5 rounded-2xl border shadow-lg transition-all ${
            isAlarm
              ? 'bg-red-950/80 border-red-500 animate-pulse ring-2 ring-red-500/50'
              : 'bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cảm biến khói & Cháy
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAlarm
                  ? 'bg-red-500 text-white animate-bounce'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                isAlarm ? 'text-red-400 font-mono' : 'text-white'
              }`}
            >
              {room.smokeLevel}
            </span>
            <span className="text-sm font-semibold text-slate-400">ppm</span>
          </div>
          <p
            className={`text-xs mt-2 font-medium flex items-center gap-1.5 ${
              isAlarm ? 'text-red-300 font-bold' : 'text-emerald-400'
            }`}
          >
            {isAlarm ? '⚠️ PHÁT HIỆN NỒNG ĐỘ KHÓI BẤT THƯỜNG!' : '✓ Nồng độ an toàn (< 350 ppm)'}
          </p>
        </div>
      </div>

      {/* ================= 2. HỆ THỐNG ĐÈN CHIẾU SÁNG (LIGHTS) ================= */}
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

        {/* Rèm cửa thông minh (Smart Curtains - Lên / Dừng / Xuống) */}
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-md shadow-blue-500/10"
                >
                  <Blinds className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Rèm cửa thông minh</h3>
                  <p className="text-xs text-slate-400">
                    Trạng thái:{' '}
                    <strong className="text-blue-300">
                      {room.devices.curtain === 'up'
                        ? 'Đang mở (Lên)'
                        : room.devices.curtain === 'down'
                        ? 'Đang đóng (Xuống)'
                        : 'Đang dừng'}
                    </strong>
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-slate-800 text-xs text-slate-300 font-mono">
                Cột DB: curtain
              </span>
            </div>

            {/* 3 Nút: Lên / Dừng / Xuống */}
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">
                Chế độ rèm cửa
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleCurtain('up')}
                  disabled={room.emergencyPowerCut}
                  className={`py-3 px-4 text-xs rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    room.devices.curtain === 'up'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                      : 'bg-slate-950/70 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                  } disabled:opacity-40 active:scale-95`}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  <span>Kéo Lên (Up)</span>
                </button>

                <button
                  onClick={() => handleCurtain('stop')}
                  disabled={room.emergencyPowerCut}
                  className={`py-3 px-4 text-xs rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    room.devices.curtain === 'stop'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400'
                      : 'bg-slate-950/70 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                  } disabled:opacity-40 active:scale-95`}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Dừng (Stop)</span>
                </button>

                <button
                  onClick={() => handleCurtain('down')}
                  disabled={room.emergencyPowerCut}
                  className={`py-3 px-4 text-xs rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    room.devices.curtain === 'down'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                      : 'bg-slate-950/70 text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-800'
                  } disabled:opacity-40 active:scale-95`}
                >
                  <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                  <span>Hạ Xuống (Down)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ================= 6. NÚT TẮT/MỞ ĐIỆN KHẨN CẤP (EMERGENCY POWER CUTOFF) ================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/70 to-slate-900 border-2 border-red-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
            <Power className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-black text-white text-base sm:text-lg">
              CÔNG TẮC KHẨN CẤP PHÒNG {room.id}
            </h4>
            <p className="text-xs text-slate-300">
              Ngắt ly lập tức toàn bộ rơ-le điện nguồn của phòng trong trường hợp phát hiện sự cố, cháy nổ.
            </p>
          </div>
        </div>

        {room.emergencyPowerCut ? (
          <button
            onClick={() => onEmergencyCut(room.id, false)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wide shadow-xl active:scale-95 transition-all uppercase"
          >
            KHÔI PHỤC NGUỒN ĐIỆN
          </button>
        ) : (
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-red-600/25 active:scale-95 transition-all uppercase animate-pulse"
          >
            TẮT ĐIỆN KHẨN CẤP
          </button>
        )}
      </div>

      {/* ================= MODAL XÁC NHẬN CẮT ĐIỆN KHẨN CẤP ================= */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">XÁC NHẬN NGẮT ĐIỆN KHẨN CẤP?</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Bạn sắp <strong className="text-red-400">CẮT TOÀN BỘ NGUỒN ĐIỆN</strong> của{' '}
                <strong>{room.name}</strong>. Mọi thiết bị chiếu sáng, điều hòa, máy chiếu và quạt sẽ ngừng hoạt động ngay lập tức.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300 text-left">
              ⚠️ Hành động này sẽ được ghi vào Nhật ký an toàn trường học.
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-colors"
              >
                HỦY BỎ
              </button>
              <button
                onClick={() => {
                  setShowEmergencyModal(false);
                  onEmergencyCut(room.id, true);
                }}
                className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm transition-transform active:scale-95 shadow-lg shadow-red-600/30"
              >
                CẮT ĐIỆN NGAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
