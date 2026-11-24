/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  X,
  Check,
  RotateCcw,
  Pipette,
  Sun,
  Moon,
  Sparkles,
  Grid,
  Square,
} from 'lucide-react';
import {
  PRESET_THEMES,
  ACCENT_OPTIONS,
  BackgroundThemeOption,
  BackgroundStyle,
  themeManager,
  generatePaletteFromHex,
} from '../utils/themeManager';

interface ThemeColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  customColor: string;
  currentAccentId?: string;
  currentBgStyle?: BackgroundStyle;
  onSelectTheme: (themeId: string, customHex?: string) => void;
  onSelectAccent?: (accentId: string) => void;
  onSelectBgStyle?: (style: BackgroundStyle) => void;
  onResetDefault: () => void;
}

export const ThemeColorModal: React.FC<ThemeColorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  customColor,
  currentAccentId = 'orange',
  currentBgStyle = 'ambient',
  onSelectTheme,
  onSelectAccent,
  onSelectBgStyle,
  onResetDefault,
}) => {
  const [selectedId, setSelectedId] = useState(currentThemeId);
  const [hexInput, setHexInput] = useState(customColor || '#070b14');
  const [modeFilter, setModeFilter] = useState<'all' | 'dark' | 'light'>('all');

  useEffect(() => {
    setSelectedId(currentThemeId);
    setHexInput(customColor || '#070b14');
  }, [currentThemeId, customColor, isOpen]);

  if (!isOpen) return null;

  const activePalette =
    selectedId === 'custom'
      ? generatePaletteFromHex(hexInput)
      : PRESET_THEMES.find((t) => t.id === selectedId)?.palette || themeManager.getEffectivePalette();

  const activeAccent =
    ACCENT_OPTIONS.find((a) => a.id === currentAccentId) || ACCENT_OPTIONS[0];

  const handlePickPreset = (preset: BackgroundThemeOption) => {
    setSelectedId(preset.id);
    onSelectTheme(preset.id);
  };

  const handleCustomColorChange = (newHex: string) => {
    setHexInput(newHex);
    setSelectedId('custom');
    onSelectTheme('custom', newHex);
  };

  const handleHexInputChange = (rawVal: string) => {
    const cleaned = '#' + rawVal.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(cleaned);
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      setSelectedId('custom');
      onSelectTheme('custom', cleaned);
    }
  };

  const filteredPresets = PRESET_THEMES.filter((t) =>
    modeFilter === 'all' ? true : t.mode === modeFilter
  );

  const quickSwatches = [
    { label: 'Midnight', hex: '#070b14' },
    { label: 'Navy', hex: '#041226' },
    { label: 'Forest', hex: '#041a12' },
    { label: 'Violet', hex: '#110a24' },
    { label: 'Wine', hex: '#1c0910' },
    { label: 'Alabaster', hex: '#f3f5f9' },
    { label: 'Sky Mist', hex: '#e8f2fe' },
    { label: 'Mint Soft', hex: '#eaf6f0' },
  ];

  const bgStyleOptions: { id: BackgroundStyle; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'ambient',
      label: 'Ánh sáng dịu',
      desc: 'Quầng sáng mềm theo màu nhấn',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: 'solid',
      label: 'Phẳng tối giản',
      desc: 'Nền đơn sắc sạch sẽ, tập trung',
      icon: <Square className="w-3.5 h-3.5" />,
    },
    {
      id: 'grid',
      label: 'Lưới kỹ thuật',
      desc: 'Đường lưới mảnh trung tâm IoT',
      icon: <Grid className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl theme-surface border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="theme-inset px-5 py-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: activeAccent.softBg, color: activeAccent.hex }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold theme-text tracking-tight">
                Tùy chỉnh Giao diện & Màu nền
              </h3>
              <p className="text-xs theme-text-muted">
                Chuyển đổi linh hoạt giữa nền Tối, nền Sáng, màu nhấn và hiệu ứng toàn trang web
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl theme-text-muted hover:theme-text hover:bg-[var(--app-surface-elevated)] transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Live Interactive Preview Strip */}
          <div
            className="rounded-xl border p-4 transition-colors duration-200"
            style={{
              backgroundColor: activePalette.bg,
              borderColor: activePalette.border,
              backgroundImage:
                currentBgStyle === 'ambient'
                  ? `radial-gradient(ellipse 80% 80% at 80% 0%, ${activeAccent.softBg}, transparent 65%)`
                  : currentBgStyle === 'grid'
                  ? `linear-gradient(to right, ${activePalette.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${activePalette.gridColor} 1px, transparent 1px)`
                  : 'none',
              backgroundSize: currentBgStyle === 'grid' ? '20px 20px' : 'auto',
            }}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeAccent.hex }}
                />
                <span className="text-xs font-bold" style={{ color: activePalette.text }}>
                  Xem trước trực tiếp · {activePalette.mode === 'light' ? 'Chế độ Sáng' : 'Chế độ Tối'}
                </span>
              </div>
              <span
                className="text-[11px] font-mono tabular-nums"
                style={{ color: activePalette.textMuted }}
              >
                {activePalette.bg}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Mini Sidebar Preview */}
              <div
                className="rounded-lg border p-2.5 flex items-center gap-2.5"
                style={{
                  backgroundColor: activePalette.sidebarBg,
                  borderColor: activePalette.border,
                }}
              >
                <div
                  className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: activeAccent.hex, color: activeAccent.contrastText }}
                >
                  SC
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: activePalette.text }}>
                    Thanh điều hướng
                  </p>
                  <p className="text-[10px] truncate" style={{ color: activePalette.textMuted }}>
                    Sidebar & Header
                  </p>
                </div>
              </div>

              {/* Mini Room Card Preview */}
              <div
                className="rounded-lg border p-2.5 flex items-center justify-between gap-2"
                style={{
                  backgroundColor: activePalette.surface,
                  borderColor: activePalette.border,
                }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: activePalette.text }}>
                    Phòng A201
                  </p>
                  <p
                    className="text-[11px] font-mono tabular-nums"
                    style={{ color: activePalette.textSecondary }}
                  >
                    25.4°C · 62%
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded-md text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: activeAccent.softBg, color: activeAccent.hex }}
                >
                  Đang mở
                </span>
              </div>

              {/* Mini Button Preview */}
              <div
                className="rounded-lg border p-2.5 flex items-center justify-between gap-2"
                style={{
                  backgroundColor: activePalette.surfaceInset,
                  borderColor: activePalette.border,
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: activePalette.textSecondary }}>
                  Màu nhấn chính
                </span>
                <span
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: activeAccent.hex, color: activeAccent.contrastText }}
                >
                  Lưu thay đổi
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Curated Presets with Light / Dark Filter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm theme-text">Bảng màu chuẩn hóa</h4>
                <p className="text-xs theme-text-muted">
                  Tự động cân bằng độ tương phản chữ, đường viền và bề mặt thẻ phòng học
                </p>
              </div>

              <div className="inline-flex items-center p-1 rounded-xl theme-inset border gap-1 self-start">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'dark', label: 'Nền Tối', icon: <Moon className="w-3 h-3" /> },
                  { id: 'light', label: 'Nền Sáng', icon: <Sun className="w-3 h-3" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModeFilter(tab.id as 'all' | 'dark' | 'light')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      modeFilter === tab.id
                        ? 'theme-accent-bg shadow-sm'
                        : 'theme-text-muted hover:theme-text'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPresets.map((preset) => {
                const isSelected = selectedId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePickPreset(preset)}
                    className="group p-3 rounded-xl border text-left transition-all flex items-center gap-3"
                    style={{
                      backgroundColor: preset.palette.bg,
                      borderColor: isSelected ? activeAccent.hex : preset.palette.border,
                      boxShadow: isSelected ? `0 0 0 1px ${activeAccent.hex}` : 'none',
                    }}
                  >
                    {/* Dual Swatch Preview */}
                    <div
                      className="w-11 h-11 rounded-lg border shrink-0 p-1.5 flex flex-col justify-between"
                      style={{
                        backgroundColor: preset.palette.surface,
                        borderColor: preset.palette.border,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: preset.palette.borderElevated }}
                        />
                        {isSelected ? (
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: activeAccent.hex, color: activeAccent.contrastText }}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : preset.mode === 'light' ? (
                          <Sun className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Moon className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                      <div
                        className="w-full h-2 rounded-sm"
                        style={{ backgroundColor: preset.palette.surfaceElevated }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-bold text-sm truncate"
                          style={{ color: preset.palette.text }}
                        >
                          {preset.name}
                        </span>
                        <span
                          className="text-[10px] font-mono uppercase shrink-0 tabular-nums"
                          style={{ color: preset.palette.textMuted }}
                        >
                          {preset.mode === 'light' ? 'Sáng' : 'Tối'} · {preset.color}
                        </span>
                      </div>
                      <p
                        className="text-[11px] leading-snug line-clamp-1 mt-0.5"
                        style={{ color: preset.palette.textSecondary }}
                      >
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Accent Color & Background Surface Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Accent Color Picker */}
            {onSelectAccent && (
              <div className="p-4 rounded-xl theme-inset border space-y-3">
                <div>
                  <h4 className="font-bold text-xs theme-text">Màu nhấn nút & thanh menu</h4>
                  <p className="text-[11px] theme-text-muted mt-0.5">
                    Đồng bộ cho mục đang chọn và các nút thao tác chính
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENT_OPTIONS.map((acc) => {
                    const isActive = currentAccentId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => onSelectAccent(acc.id)}
                        className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                          isActive
                            ? 'theme-surface font-bold'
                            : 'border-transparent hover:border-[var(--app-border-elevated)] theme-text-secondary'
                        }`}
                        style={isActive ? { borderColor: acc.hex } : undefined}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: acc.hex }}
                        >
                          {isActive && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </span>
                        <span className="truncate text-[11px]">{acc.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Background Style Selector */}
            {onSelectBgStyle && (
              <div className="p-4 rounded-xl theme-inset border space-y-3">
                <div>
                  <h4 className="font-bold text-xs theme-text">Hiệu ứng bề mặt nền</h4>
                  <p className="text-[11px] theme-text-muted mt-0.5">
                    Chọn độ sâu thị giác cho không gian làm việc
                  </p>
                </div>
                <div className="space-y-1.5">
                  {bgStyleOptions.map((opt) => {
                    const isActive = currentBgStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectBgStyle(opt.id)}
                        className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors ${
                          isActive
                            ? 'theme-surface font-semibold theme-text'
                            : 'border-transparent theme-text-muted hover:theme-text'
                        }`}
                        style={isActive ? { borderColor: activeAccent.hex } : undefined}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span style={{ color: isActive ? activeAccent.hex : undefined }}>
                            {opt.icon}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs block truncate">{opt.label}</span>
                            <span className="text-[10px] theme-text-muted block truncate">{opt.desc}</span>
                          </div>
                        </div>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 shrink-0" style={{ color: activeAccent.hex }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Custom Color Wheel (Works for BOTH Light & Dark colors) */}
          <div className="p-4 rounded-xl theme-inset border space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Pipette className="w-4 h-4 theme-accent-text" />
                <h4 className="font-bold text-sm theme-text">Tự chọn mã màu nền bất kỳ</h4>
              </div>
              <span className="text-[11px] font-mono theme-text-muted">
                {selectedId === 'custom'
                  ? `Đang dùng ${hexInput.toUpperCase()} (${activePalette.mode === 'light' ? 'Nền sáng' : 'Nền tối'})`
                  : 'Hỗ trợ cả màu tối và màu sáng'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : '#070b14'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-12 h-11 rounded-xl cursor-pointer border theme-border-strong bg-transparent p-0.5 shrink-0"
                  title="Chọn màu nền tùy ý"
                />
                <div className="text-xs">
                  <p className="font-semibold theme-text">Bảng pha màu tự do</p>
                  <p className="text-[11px] theme-text-muted">Tự động cân bằng chữ sáng/tối</p>
                </div>
              </div>

              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted font-mono text-sm">
                  #
                </span>
                <input
                  type="text"
                  value={hexInput.startsWith('#') ? hexInput.slice(1) : hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  placeholder="070b14"
                  maxLength={6}
                  className="w-full pl-7 pr-4 py-2 rounded-xl theme-input border font-mono text-sm uppercase tracking-wider"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {quickSwatches.map((swatch) => {
                const pal = generatePaletteFromHex(swatch.hex);
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => handleCustomColorChange(swatch.hex)}
                    className="p-2 rounded-lg border transition-transform hover:scale-[1.03] active:scale-95 text-center flex flex-col items-center gap-1"
                    style={{
                      backgroundColor: swatch.hex,
                      borderColor: pal.border,
                      color: pal.text,
                    }}
                  >
                    <span className="text-[10px] font-semibold truncate w-full">
                      {swatch.label}
                    </span>
                    <span className="text-[9px] font-mono opacity-75">{swatch.hex}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 theme-inset border-t flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetDefault();
              setSelectedId('midnight');
              setHexInput('#070b14');
            }}
            className="px-3.5 py-2 rounded-xl theme-elevated border theme-text-secondary hover:theme-text text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl theme-accent-bg font-bold text-xs tracking-wide transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Hoàn tất</span>
          </button>
        </div>
      </div>
    </div>
  );
};
