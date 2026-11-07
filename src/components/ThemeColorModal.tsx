/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Palette, 
  X, 
  Check, 
  RotateCcw, 
  Sliders, 
  Pipette, 
  Layers
} from 'lucide-react';
import { PRESET_THEMES, BackgroundThemeOption } from '../utils/themeManager';

interface ThemeColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  customColor: string;
  onSelectTheme: (themeId: string, customHex?: string) => void;
  onResetDefault: () => void;
}

export const ThemeColorModal: React.FC<ThemeColorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  customColor,
  onSelectTheme,
  onResetDefault,
}) => {
  const [selectedId, setSelectedId] = useState(currentThemeId);
  const [hexInput, setHexInput] = useState(customColor || '#020617');

  React.useEffect(() => {
    setSelectedId(currentThemeId);
    setHexInput(customColor || '#020617');
  }, [currentThemeId, customColor, isOpen]);

  if (!isOpen) return null;

  const handlePickPreset = (preset: BackgroundThemeOption) => {
    setSelectedId(preset.id);
    onSelectTheme(preset.id);
  };

  const handleCustomColorChange = (newHex: string) => {
    setHexInput(newHex);
    setSelectedId('custom');
    onSelectTheme('custom', newHex);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setSelectedId('custom');
      onSelectTheme('custom', val);
    }
  };

  const quickCustomSwatches = [
    { label: 'Deep Abyss', hex: '#020b18' },
    { label: 'Midnight Teal', hex: '#011c1d' },
    { label: 'Dark Plum', hex: '#160820' },
    { label: 'Dark Moss', hex: '#081c0f' },
    { label: 'Ashen Stone', hex: '#111418' },
    { label: 'Eclipse Blue', hex: '#0a192f' },
    { label: 'Ruby Wine', hex: '#1c080d' },
    { label: 'Warm Espresso', hex: '#1c1008' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-inner">
              <Palette className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 border border-orange-500/20">
                  Giao diện hệ thống
                </span>
                <span className="text-xs text-slate-400 font-mono">Realtime Live Theme</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                ĐỔI MÀU TOÀN BỘ WEBSITE
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
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Note informing user that the entire website changes */}
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3 text-orange-200 text-xs">
            <Layers className="w-5 h-5 text-orange-400 shrink-0" />
            <p>
              Khi chọn màu, hệ thống sẽ tự động đồng bộ màu cho <strong>toàn bộ trang web</strong>: Thanh điều hướng (Navbar), Thanh tiêu đề (Header), Các thẻ phòng học (Cards), Bảng điều khiển và đường viền.
            </p>
          </div>

          {/* Section 1: Curated Themes Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Bảng chủ đề màu chuẩn hóa (Curated Themes)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Mỗi chủ đề phối màu hoàn hảo giữa nền, thẻ hiển thị và viền bảo vệ thị giác
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_THEMES.map((preset) => {
                const isSelected = selectedId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePickPreset(preset)}
                    className={`group relative p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/40 shadow-xl'
                        : 'border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
                    }`}
                    style={{ backgroundColor: preset.palette.bg }}
                  >
                    {/* Visual Color Preview: Mini Card inside Base */}
                    <div 
                      className="w-12 h-12 rounded-xl border shrink-0 shadow-lg p-1.5 flex flex-col justify-between transition-transform group-hover:scale-105"
                      style={{ 
                        backgroundColor: preset.palette.surface, 
                        borderColor: preset.palette.border 
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: preset.palette.borderElevated }} 
                        />
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div 
                        className="w-full h-2 rounded-sm" 
                        style={{ backgroundColor: preset.palette.surfaceElevated }} 
                      />
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-white truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">
                          {preset.color}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Color Wheel & HEX Input */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pipette className="w-4 h-4 text-orange-400" />
                <h4 className="font-bold text-sm text-white">Tự pha màu cho cả website</h4>
              </div>
              {selectedId === 'custom' && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-full">
                  Đang dùng màu tự chọn ({hexInput})
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Color Picker Native Box */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative group cursor-pointer">
                  <input
                    type="color"
                    value={hexInput.length === 7 ? hexInput : '#020617'}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-14 h-12 rounded-2xl cursor-pointer border-2 border-slate-700 group-hover:border-orange-500 bg-transparent p-0 transition-colors"
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-white/10" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Vòng xoay màu phổ quát</p>
                  <p className="text-[11px] text-slate-400">Tự động tính toán bề mặt thẻ & viền</p>
                </div>
              </div>

              {/* Hex Code Input */}
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Mã màu HEX (#RRGGBB):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                    #
                  </span>
                  <input
                    type="text"
                    value={hexInput.startsWith('#') ? hexInput.slice(1) : hexInput}
                    onChange={(e) => handleHexInputChange({ ...e, target: { ...e.target, value: '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6) } })}
                    placeholder="020617"
                    maxLength={6}
                    className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-orange-500 uppercase tracking-wider"
                  />
                </div>
              </div>
            </div>

            {/* Quick Swatches Suggestions */}
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-2">Các gam màu không gian sâu phổ biến:</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {quickCustomSwatches.map((swatch) => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => handleCustomColorChange(swatch.hex)}
                    className="p-2 rounded-xl border border-slate-800 hover:border-slate-600 transition-all text-center flex flex-col items-center gap-1 group active:scale-95"
                    style={{ backgroundColor: swatch.hex }}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-mono text-slate-300 truncate w-full">
                      {swatch.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetDefault();
              setSelectedId('midnight');
              setHexInput('#020617');
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định (Midnight)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs tracking-wide transition-transform active:scale-95 flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Áp dụng & Đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
