/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeMode = 'dark' | 'light';
export type BackgroundStyle = 'solid' | 'ambient' | 'grid';

export interface ThemePalette {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceInset: string;
  surfaceElevated: string;
  surfaceAlpha: string;
  border: string;
  borderElevated: string;
  headerBg: string;
  sidebarBg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  shadow: string;
  gridColor: string;
}

export interface BackgroundThemeOption {
  id: string;
  name: string;
  nameEn: string;
  mode: ThemeMode;
  color: string;
  defaultAccent?: string;
  palette: ThemePalette;
  description: string;
}

export interface AccentOption {
  id: string;
  name: string;
  hex: string;
  hoverHex: string;
  softBg: string;
  contrastText: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'orange',
    name: 'Cam Năng Lượng',
    hex: '#f97316',
    hoverHex: '#fb923c',
    softBg: 'rgba(249, 115, 22, 0.14)',
    contrastText: '#ffffff',
  },
  {
    id: 'sky',
    name: 'Xanh Công Nghệ',
    hex: '#0ea5e9',
    hoverHex: '#38bdf8',
    softBg: 'rgba(14, 165, 233, 0.14)',
    contrastText: '#ffffff',
  },
  {
    id: 'emerald',
    name: 'Ngọc Lục Bảo',
    hex: '#10b981',
    hoverHex: '#34d399',
    softBg: 'rgba(16, 185, 129, 0.14)',
    contrastText: '#ffffff',
  },
  {
    id: 'indigo',
    name: 'Chàm Hiện Đại',
    hex: '#6366f1',
    hoverHex: '#818cf8',
    softBg: 'rgba(99, 102, 241, 0.14)',
    contrastText: '#ffffff',
  },
  {
    id: 'violet',
    name: 'Tím Hoàng Gia',
    hex: '#8b5cf6',
    hoverHex: '#a78bfa',
    softBg: 'rgba(139, 92, 246, 0.14)',
    contrastText: '#ffffff',
  },
  {
    id: 'rose',
    name: 'Đỏ San Hô',
    hex: '#f43f5e',
    hoverHex: '#fb7185',
    softBg: 'rgba(244, 63, 94, 0.14)',
    contrastText: '#ffffff',
  },
];

export const PRESET_THEMES: BackgroundThemeOption[] = [
  // ================= DARK THEMES =================
  {
    id: 'midnight',
    name: 'Tối Huyền Bí',
    nameEn: 'Midnight Slate',
    mode: 'dark',
    color: '#070b14',
    defaultAccent: 'orange',
    palette: {
      mode: 'dark',
      bg: '#070b14',
      surface: '#0e1525',
      surfaceInset: '#0a101d',
      surfaceElevated: '#172136',
      surfaceAlpha: 'rgba(14, 21, 37, 0.90)',
      border: '#1e293b',
      borderElevated: '#334155',
      headerBg: 'rgba(7, 11, 20, 0.86)',
      sidebarBg: '#090e1a',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      shadow: '0 10px 30px -12px rgba(0, 0, 0, 0.55)',
      gridColor: 'rgba(148, 163, 184, 0.05)',
    },
    description: 'Tông đen đá phiến sâu sắc, cân bằng tương phản cao cho trung tâm IoT.',
  },
  {
    id: 'navy',
    name: 'Xanh Biển Sâu',
    nameEn: 'Deep Ocean Navy',
    mode: 'dark',
    color: '#040e1d',
    defaultAccent: 'sky',
    palette: {
      mode: 'dark',
      bg: '#040e1d',
      surface: '#091930',
      surfaceInset: '#061224',
      surfaceElevated: '#11294b',
      surfaceAlpha: 'rgba(9, 25, 48, 0.90)',
      border: '#173660',
      borderElevated: '#234c85',
      headerBg: 'rgba(4, 14, 29, 0.86)',
      sidebarBg: '#051123',
      text: '#f0f9ff',
      textSecondary: '#bae6fd',
      textMuted: '#7dd3fc',
      shadow: '0 10px 30px -12px rgba(2, 11, 24, 0.65)',
      gridColor: 'rgba(56, 189, 248, 0.05)',
    },
    description: 'Xanh hải quân công nghệ, dịu mắt khi giám sát liên tục nhiều giờ.',
  },
  {
    id: 'oled',
    name: 'Đen Carbon OLED',
    nameEn: 'Obsidian Carbon',
    mode: 'dark',
    color: '#050507',
    defaultAccent: 'orange',
    palette: {
      mode: 'dark',
      bg: '#050507',
      surface: '#0e0e12',
      surfaceInset: '#09090c',
      surfaceElevated: '#18181f',
      surfaceAlpha: 'rgba(14, 14, 18, 0.92)',
      border: '#23232c',
      borderElevated: '#363645',
      headerBg: 'rgba(5, 5, 7, 0.88)',
      sidebarBg: '#07070a',
      text: '#fafafa',
      textSecondary: '#d4d4d8',
      textMuted: '#a1a1aa',
      shadow: '0 10px 30px -12px rgba(0, 0, 0, 0.75)',
      gridColor: 'rgba(255, 255, 255, 0.04)',
    },
    description: 'Đen tuyền tinh giản cho màn hình OLED với đường viền sắc nét.',
  },
  {
    id: 'emerald',
    name: 'Xanh Rừng Đêm',
    nameEn: 'Eco Dark Forest',
    mode: 'dark',
    color: '#03130e',
    defaultAccent: 'emerald',
    palette: {
      mode: 'dark',
      bg: '#03130e',
      surface: '#07221a',
      surfaceInset: '#041913',
      surfaceElevated: '#0e362a',
      surfaceAlpha: 'rgba(7, 34, 26, 0.90)',
      border: '#13493a',
      borderElevated: '#1d6953',
      headerBg: 'rgba(3, 19, 14, 0.86)',
      sidebarBg: '#041711',
      text: '#ecfdf5',
      textSecondary: '#a7f3d0',
      textMuted: '#6ee7b7',
      shadow: '0 10px 30px -12px rgba(2, 20, 15, 0.65)',
      gridColor: 'rgba(16, 185, 129, 0.05)',
    },
    description: 'Sắc xanh ngọc lục bảo sinh thái, thân thiện cho học đường thông minh.',
  },
  {
    id: 'violet',
    name: 'Tím Không Gian',
    nameEn: 'Twilight Indigo',
    mode: 'dark',
    color: '#090717',
    defaultAccent: 'violet',
    palette: {
      mode: 'dark',
      bg: '#090717',
      surface: '#120f2c',
      surfaceInset: '#0d0a21',
      surfaceElevated: '#1d1844',
      surfaceAlpha: 'rgba(18, 15, 44, 0.90)',
      border: '#2c2463',
      borderElevated: '#41358f',
      headerBg: 'rgba(9, 7, 23, 0.86)',
      sidebarBg: '#0b091c',
      text: '#faf5ff',
      textSecondary: '#ddd6fe',
      textMuted: '#a78bfa',
      shadow: '0 10px 30px -12px rgba(9, 7, 23, 0.7)',
      gridColor: 'rgba(167, 139, 250, 0.05)',
    },
    description: 'Tím chàm hiện đại tạo điểm nhấn sang trọng, nổi bật bảng thông số.',
  },
  {
    id: 'espresso',
    name: 'Nâu Trầm Ấm',
    nameEn: 'Warm Espresso',
    mode: 'dark',
    color: '#110a07',
    defaultAccent: 'orange',
    palette: {
      mode: 'dark',
      bg: '#110a07',
      surface: '#1c120d',
      surfaceInset: '#150d09',
      surfaceElevated: '#2b1c15',
      surfaceAlpha: 'rgba(28, 18, 13, 0.90)',
      border: '#3f281d',
      borderElevated: '#593a2b',
      headerBg: 'rgba(17, 10, 7, 0.86)',
      sidebarBg: '#140c09',
      text: '#fef3c7',
      textSecondary: '#e7d5c5',
      textMuted: '#b89f8d',
      shadow: '0 10px 30px -12px rgba(17, 10, 7, 0.7)',
      gridColor: 'rgba(249, 115, 22, 0.04)',
    },
    description: 'Tông nâu ấm áp giảm ánh sáng xanh, êm dịu khi trực ban ban đêm.',
  },

  // ================= LIGHT THEMES =================
  {
    id: 'alabaster',
    name: 'Sáng Tinh Khôi',
    nameEn: 'Crisp Alabaster',
    mode: 'light',
    color: '#f3f5f9',
    defaultAccent: 'indigo',
    palette: {
      mode: 'light',
      bg: '#f3f5f9',
      surface: '#ffffff',
      surfaceInset: '#f8fafc',
      surfaceElevated: '#e9eef5',
      surfaceAlpha: 'rgba(255, 255, 255, 0.92)',
      border: '#dde3ec',
      borderElevated: '#c5cfdd',
      headerBg: 'rgba(255, 255, 255, 0.88)',
      sidebarBg: '#ffffff',
      text: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      shadow: '0 6px 24px -10px rgba(15, 23, 42, 0.08)',
      gridColor: 'rgba(15, 23, 42, 0.04)',
    },
    description: 'Nền sáng sạch sẽ, sắc nét chuẩn phòng điều hành ban ngày.',
  },
  {
    id: 'sky',
    name: 'Xanh Mây Nhẹ',
    nameEn: 'Soft Cloud Blue',
    mode: 'light',
    color: '#edf4fc',
    defaultAccent: 'sky',
    palette: {
      mode: 'light',
      bg: '#edf4fc',
      surface: '#ffffff',
      surfaceInset: '#f5f9ff',
      surfaceElevated: '#e1ecfa',
      surfaceAlpha: 'rgba(255, 255, 255, 0.92)',
      border: '#d1e1f5',
      borderElevated: '#b5cde9',
      headerBg: 'rgba(255, 255, 255, 0.88)',
      sidebarBg: '#f9fcff',
      text: '#0c1b33',
      textSecondary: '#2d4466',
      textMuted: '#5b7599',
      shadow: '0 6px 24px -10px rgba(12, 27, 51, 0.08)',
      gridColor: 'rgba(14, 165, 233, 0.05)',
    },
    description: 'Xanh da trời nhẹ nhàng thoáng đãng, dễ nhìn dưới ánh sáng lớp học.',
  },
  {
    id: 'sage',
    name: 'Xanh Bạc Hà Nhẹ',
    nameEn: 'Mint Sage Light',
    mode: 'light',
    color: '#edf6f2',
    defaultAccent: 'emerald',
    palette: {
      mode: 'light',
      bg: '#edf6f2',
      surface: '#ffffff',
      surfaceInset: '#f4faf7',
      surfaceElevated: '#dff0e8',
      surfaceAlpha: 'rgba(255, 255, 255, 0.92)',
      border: '#cfe3da',
      borderElevated: '#b1d0c2',
      headerBg: 'rgba(255, 255, 255, 0.88)',
      sidebarBg: '#f8fcfa',
      text: '#0c2119',
      textSecondary: '#264b3d',
      textMuted: '#537a6b',
      shadow: '0 6px 24px -10px rgba(12, 33, 25, 0.08)',
      gridColor: 'rgba(16, 185, 129, 0.05)',
    },
    description: 'Tông xanh bạc hà tươi mát, thư giãn thị giác cho giáo viên và giám thị.',
  },
  {
    id: 'ivory',
    name: 'Kem Thanh Lịch',
    nameEn: 'Warm Ivory Paper',
    mode: 'light',
    color: '#f6f3ec',
    defaultAccent: 'orange',
    palette: {
      mode: 'light',
      bg: '#f6f3ec',
      surface: '#fffefb',
      surfaceInset: '#faf7f2',
      surfaceElevated: '#ede7dc',
      surfaceAlpha: 'rgba(255, 254, 251, 0.94)',
      border: '#e4ddd0',
      borderElevated: '#cfc4b2',
      headerBg: 'rgba(255, 254, 251, 0.88)',
      sidebarBg: '#fcfaf6',
      text: '#1f1912',
      textSecondary: '#473d31',
      textMuted: '#786b5b',
      shadow: '0 6px 24px -10px rgba(31, 25, 18, 0.08)',
      gridColor: 'rgba(249, 115, 22, 0.05)',
    },
    description: 'Màu giấy kem ấm áp, chống chói lóa giống màn hình đọc sách.',
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 7, g: 11, b: 20 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf:
        h = (gf - bf) / d + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = (bf - rf) / d + 2;
        break;
      case bf:
        h = (rf - gf) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generates an accessible dark OR light palette directly from any custom HEX color.
 * Respects the user's chosen brightness & hue instead of clamping everything to near-black.
 */
export function generatePaletteFromHex(hex: string): ThemePalette {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const luminance = getRelativeLuminance(r, g, b);
  const isLight = luminance > 0.34;

  if (isLight) {
    // Light custom canvas: clean bright surface with crisp dark text
    const bgLightness = Math.max(88, Math.min(97, l));
    const sat = Math.min(55, s);
    return {
      mode: 'light',
      bg: `hsl(${h}, ${sat}%, ${bgLightness}%)`,
      surface: '#ffffff',
      surfaceInset: `hsl(${h}, ${Math.min(45, sat)}%, ${Math.min(98, bgLightness + 2)}%)`,
      surfaceElevated: `hsl(${h}, ${Math.min(50, sat)}%, ${Math.max(82, bgLightness - 5)}%)`,
      surfaceAlpha: 'rgba(255, 255, 255, 0.92)',
      border: `hsl(${h}, ${Math.min(35, sat)}%, ${Math.max(76, bgLightness - 11)}%)`,
      borderElevated: `hsl(${h}, ${Math.min(35, sat)}%, ${Math.max(66, bgLightness - 20)}%)`,
      headerBg: 'rgba(255, 255, 255, 0.88)',
      sidebarBg: `hsl(${h}, ${Math.min(40, sat)}%, ${Math.min(99, bgLightness + 3)}%)`,
      text: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      shadow: '0 6px 24px -10px rgba(15, 23, 42, 0.09)',
      gridColor: `hsla(${h}, 40%, 25%, 0.05)`,
    };
  }

  // Dark custom canvas: preserves hue & real depth up to ~28% lightness
  const bgLightness = Math.max(4, Math.min(26, l));
  const sat = Math.min(80, s);
  const surfaceL = Math.min(32, bgLightness + 5);
  const insetL = Math.min(29, bgLightness + 2);
  const elevatedL = Math.min(39, bgLightness + 10);
  const borderL = Math.min(46, bgLightness + 15);
  const borderElevatedL = Math.min(56, bgLightness + 24);

  return {
    mode: 'dark',
    bg: `hsl(${h}, ${sat}%, ${bgLightness}%)`,
    surface: `hsl(${h}, ${Math.max(12, sat - 6)}%, ${surfaceL}%)`,
    surfaceInset: `hsl(${h}, ${Math.max(12, sat - 4)}%, ${insetL}%)`,
    surfaceElevated: `hsl(${h}, ${Math.max(10, sat - 10)}%, ${elevatedL}%)`,
    surfaceAlpha: `hsla(${h}, ${Math.max(12, sat - 6)}%, ${surfaceL}%, 0.90)`,
    border: `hsl(${h}, ${Math.max(12, sat - 10)}%, ${borderL}%)`,
    borderElevated: `hsl(${h}, ${Math.max(12, sat - 10)}%, ${borderElevatedL}%)`,
    headerBg: `hsla(${h}, ${sat}%, ${bgLightness}%, 0.88)`,
    sidebarBg: `hsl(${h}, ${sat}%, ${Math.min(28, bgLightness + 1)}%)`,
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    shadow: '0 10px 30px -12px rgba(0, 0, 0, 0.55)',
    gridColor: 'rgba(255, 255, 255, 0.045)',
  };
}

const STORAGE_THEME_ID = 'school_iot_bg_theme_id';
const STORAGE_CUSTOM_COLOR = 'school_iot_bg_custom_color';
const STORAGE_ACCENT_ID = 'school_iot_accent_id';
const STORAGE_BG_STYLE = 'school_iot_bg_style';

export class ThemeManager {
  private currentThemeId: string = 'midnight';
  private customColor: string = '#070b14';
  private accentId: string = 'orange';
  private bgStyle: BackgroundStyle = 'ambient';

  constructor() {
    this.loadFromStorage();
  }

  public loadFromStorage(): {
    themeId: string;
    customColor: string;
    accentId: string;
    bgStyle: BackgroundStyle;
    actualColor: string;
    palette: ThemePalette;
  } {
    try {
      const savedThemeId = localStorage.getItem(STORAGE_THEME_ID);
      const savedCustomColor = localStorage.getItem(STORAGE_CUSTOM_COLOR);
      const savedAccentId = localStorage.getItem(STORAGE_ACCENT_ID);
      const savedBgStyle = localStorage.getItem(STORAGE_BG_STYLE) as BackgroundStyle | null;

      if (savedThemeId) {
        this.currentThemeId = savedThemeId;
      }
      if (savedCustomColor) {
        this.customColor = savedCustomColor;
      }
      if (savedAccentId && ACCENT_OPTIONS.some((a) => a.id === savedAccentId)) {
        this.accentId = savedAccentId;
      }
      if (savedBgStyle && ['solid', 'ambient', 'grid'].includes(savedBgStyle)) {
        this.bgStyle = savedBgStyle;
      }
    } catch (e) {
      console.warn('[ThemeManager] Could not access localStorage', e);
    }

    const palette = this.getEffectivePalette();
    this.applyToDOM();

    return {
      themeId: this.currentThemeId,
      customColor: this.customColor,
      accentId: this.accentId,
      bgStyle: this.bgStyle,
      actualColor: palette.bg,
      palette,
    };
  }

  public setTheme(themeId: string, customHex?: string): ThemePalette {
    this.currentThemeId = themeId;
    if (customHex) {
      this.customColor = customHex;
    } else {
      const preset = PRESET_THEMES.find((t) => t.id === themeId);
      if (preset?.defaultAccent && this.currentThemeId !== 'custom') {
        this.accentId = preset.defaultAccent;
        try {
          localStorage.setItem(STORAGE_ACCENT_ID, this.accentId);
        } catch {
          // ignore
        }
      }
    }

    try {
      localStorage.setItem(STORAGE_THEME_ID, themeId);
      if (customHex) {
        localStorage.setItem(STORAGE_CUSTOM_COLOR, customHex);
      }
    } catch (e) {
      console.warn('[ThemeManager] Could not save to localStorage', e);
    }

    const palette = this.getEffectivePalette();
    this.applyToDOM();
    return palette;
  }

  public setCustomColor(hexColor: string): ThemePalette {
    this.currentThemeId = 'custom';
    this.customColor = hexColor;

    try {
      localStorage.setItem(STORAGE_THEME_ID, 'custom');
      localStorage.setItem(STORAGE_CUSTOM_COLOR, hexColor);
    } catch (e) {
      console.warn('[ThemeManager] Could not save to localStorage', e);
    }

    const palette = this.getEffectivePalette();
    this.applyToDOM();
    return palette;
  }

  public setAccent(accentId: string): AccentOption {
    const found = ACCENT_OPTIONS.find((a) => a.id === accentId) || ACCENT_OPTIONS[0];
    this.accentId = found.id;
    try {
      localStorage.setItem(STORAGE_ACCENT_ID, found.id);
    } catch (e) {
      console.warn('[ThemeManager] Could not save accent', e);
    }
    this.applyToDOM();
    return found;
  }

  public setBgStyle(style: BackgroundStyle): BackgroundStyle {
    this.bgStyle = style;
    try {
      localStorage.setItem(STORAGE_BG_STYLE, style);
    } catch (e) {
      console.warn('[ThemeManager] Could not save bgStyle', e);
    }
    this.applyToDOM();
    return style;
  }

  public resetToDefault(): ThemePalette {
    this.accentId = 'orange';
    this.bgStyle = 'ambient';
    try {
      localStorage.setItem(STORAGE_ACCENT_ID, 'orange');
      localStorage.setItem(STORAGE_BG_STYLE, 'ambient');
    } catch {
      // ignore
    }
    return this.setTheme('midnight');
  }

  public getEffectivePalette(): ThemePalette {
    if (this.currentThemeId === 'custom') {
      return generatePaletteFromHex(this.customColor || '#070b14');
    }
    const found = PRESET_THEMES.find((t) => t.id === this.currentThemeId);
    if (found) {
      return found.palette;
    }
    return PRESET_THEMES[0].palette;
  }

  public getEffectiveAccent(): AccentOption {
    return ACCENT_OPTIONS.find((a) => a.id === this.accentId) || ACCENT_OPTIONS[0];
  }

  public getEffectiveBackgroundColor(): string {
    return this.getEffectivePalette().bg;
  }

  public getCurrentThemeId(): string {
    return this.currentThemeId;
  }

  public getCustomColor(): string {
    return this.customColor;
  }

  public getAccentId(): string {
    return this.accentId;
  }

  public getBgStyle(): BackgroundStyle {
    return this.bgStyle;
  }

  public applyToDOM(): void {
    if (typeof document === 'undefined') return;
    const palette = this.getEffectivePalette();
    const accent = this.getEffectiveAccent();
    const root = document.documentElement;

    root.setAttribute('data-theme-mode', palette.mode);
    root.setAttribute('data-bg-style', this.bgStyle);
    if (palette.mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    root.style.setProperty('--app-bg', palette.bg);
    root.style.setProperty('--app-surface', palette.surface);
    root.style.setProperty('--app-surface-inset', palette.surfaceInset);
    root.style.setProperty('--app-surface-elevated', palette.surfaceElevated);
    root.style.setProperty('--app-surface-alpha', palette.surfaceAlpha);
    root.style.setProperty('--app-border', palette.border);
    root.style.setProperty('--app-border-elevated', palette.borderElevated);
    root.style.setProperty('--app-header-bg', palette.headerBg);
    root.style.setProperty('--app-sidebar-bg', palette.sidebarBg);
    root.style.setProperty('--app-text', palette.text);
    root.style.setProperty('--app-text-secondary', palette.textSecondary);
    root.style.setProperty('--app-text-muted', palette.textMuted);
    root.style.setProperty('--app-shadow', palette.shadow);
    root.style.setProperty('--app-grid-color', palette.gridColor);

    // Accent tokens
    root.style.setProperty('--app-accent', accent.hex);
    root.style.setProperty('--app-accent-hover', accent.hoverHex);
    root.style.setProperty('--app-accent-soft', accent.softBg);
    root.style.setProperty('--app-accent-contrast', accent.contrastText);

    // Background image based on bgStyle
    let bgImage = 'none';
    let bgSize = 'auto';
    if (this.bgStyle === 'ambient') {
      const glowAlpha = palette.mode === 'light' ? '0.10' : '0.14';
      const { r, g, b } = hexToRgb(accent.hex);
      bgImage = `radial-gradient(ellipse 80% 50% at 65% -10%, rgba(${r}, ${g}, ${b}, ${glowAlpha}), transparent 65%), radial-gradient(ellipse 50% 40% at 10% 95%, rgba(${r}, ${g}, ${b}, ${palette.mode === 'light' ? '0.06' : '0.07'}), transparent 60%)`;
    } else if (this.bgStyle === 'grid') {
      bgImage = `linear-gradient(to right, ${palette.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${palette.gridColor} 1px, transparent 1px)`;
      bgSize = '32px 32px';
    }
    root.style.setProperty('--app-bg-image', bgImage);
    root.style.setProperty('--app-bg-size', bgSize);

    // Backward compatibility
    root.style.setProperty('--app-bg-color', palette.bg);
    document.body.style.backgroundColor = palette.bg;
    document.body.style.color = palette.text;
  }
}

export const themeManager = new ThemeManager();
