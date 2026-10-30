/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Building2, Layers, Users, Zap, Check } from 'lucide-react';
import { Room } from '../types';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (newRoom: Room) => void;
  existingRoomIds: string[];
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  onAddRoom,
  existingRoomIds,
}) => {
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [building, setBuilding] = useState('Tòa A');
  const [floor, setFloor] = useState<number>(1);
  const [capacity, setCapacity] = useState<number>(45);
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = roomId.trim().toUpperCase();
    if (!cleanId) {
      setError('Vui lòng nhập mã phòng (VD: A301, B202, 401...)');
      return;
    }

    if (existingRoomIds.includes(cleanId)) {
      setError(`Mã phòng "${cleanId}" đã tồn tại trong hệ thống!`);
      return;
    }

    const name = roomName.trim() || `Phòng học ${cleanId}`;

    const newRoom: Room = {
      id: cleanId,
      name,
      building,
      floor,
      capacity,
      isPowerOn,
      isOccupied: isPowerOn,
      hasFireAlarm: false,
      smokeLevel: Math.floor(Math.random() * 20) + 25,
      temperature: 25.0,
      humidity: 60,
      emergencyPowerCut: false,
      lastUpdated: 'Vừa tạo',
      devices: {
        light: {
          isOn: isPowerOn,
          brightness: isPowerOn ? 85 : 0,
          preset: isPowerOn ? 'study' : 'off',
        },
        ac: {
          isOn: isPowerOn,
          targetTemp: 24,
          mode: 'cool',
          fanSpeed: 'med',
          timerMinutes: null,
        },
        projector: {
          isOn: false,
          inputSource: 'hdmi',
        },
        fan: {
          isOn: isPowerOn,
          speed: isPowerOn ? 2 : 0,
        },
      },
    };

    onAddRoom(newRoom);
    onClose();
    // Reset form
    setRoomId('');
    setRoomName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Thêm phòng học mới</h3>
              <p className="text-xs text-slate-400">Đồng bộ tự động vào cơ sở dữ liệu Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mã phòng <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: A305, B202, 401..."
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                if (!roomName) {
                  setRoomName(`Phòng học ${e.target.value.toUpperCase()}`);
                }
                setError('');
              }}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tên phòng học
            </label>
            <input
              type="text"
              placeholder="VD: Phòng học A305, Lab Lý..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Tòa nhà
              </label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="Tòa A">Tòa A</option>
                <option value="Tòa B">Tòa B</option>
                <option value="Tòa C">Tòa C</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Tầng
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value={1}>Tầng 1</option>
                <option value={2}>Tầng 2</option>
                <option value={3}>Tầng 3</option>
                <option value={4}>Tầng 4</option>
                <option value={5}>Tầng 5</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Sức chứa (học sinh)
              </label>
              <input
                type="number"
                min={10}
                max={200}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Trạng thái nguồn
              </label>
              <button
                type="button"
                onClick={() => setIsPowerOn(!isPowerOn)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isPowerOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isPowerOn ? 'bg-slate-950' : 'bg-slate-600'}`}></span>
                {isPowerOn ? 'Bật điện ngay' : 'Đang tắt điện'}
              </button>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Xác nhận thêm phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
