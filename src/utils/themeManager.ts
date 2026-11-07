/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThemePalette {
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceAlpha: string;
  border: string;
  borderElevated: string;
  headerBg: string;
  sidebarBg: string;
}

export interface BackgroundThemeOption {
  id: string;
  name: string;
  nameEn: string;
  color: string; // Base background
  palette: ThemePalette;
  description: string;
  textColor: string;
}

export const PRESET_THEMES: BackgroundThemeOption[] = [
  {
    id: 'midnight',
    name: 'Tối Huyền Bí',
    nameEn: 'Midnight Slate (Mặc định)',
    color: '#020617',
    palette: {
      bg: '#020617',
      surface: '#0f172a',
      surfaceElevated: '#1e293b',
      surfaceAlpha: 'rgba(15, 23, 42, 0.85)',
      border: '#1e293b',
      borderElevated: '#334155',
      headerBg: 'rgba(2, 6, 23, 0.92)',
      sidebarBg: '#020617',
    },
    description: 'Tông đen đá phiến chuyên nghiệp, chuẩn trung tâm điều khiển IoT.',
    textColor: '#f8fafc',
  },
  {
    id: 'oled',
    name: 'Đen OLED Tuyệt Đối',
    nameEn: 'Pure OLED Black',
    color: '#000000',
    palette: {
      bg: '#000000',
      surface: '#0a0a0c',
      surfaceElevated: '#141417',
      surfaceAlpha: 'rgba(10, 10, 12, 0.90)',
      border: '#27272a',
      borderElevated: '#3f3f46',
      headerBg: 'rgba(0, 0, 0, 0.95)',
      sidebarBg: '#000000',
    },
    description: 'Đen tuyền 100% tiết kiệm pin tối đa, độ tương phản sắc nét nhất.',
    textColor: '#ffffff',
  },
  {
    id: 'navy',
    name: 'Xanh Biển Sâu',
    nameEn: 'Deep Tech Navy',
    color: '#020b18',
    palette: {
      bg: '#020b18',
      surface: '#071731',
      surfaceElevated: '#0e264c',
      surfaceAlpha: 'rgba(7, 23, 49, 0.88)',
      border: '#133568',
      borderElevated: '#1d4c94',
      headerBg: 'rgba(2, 11, 24, 0.94)',
      sidebarBg: '#020b18',
    },
    description: 'Sắc xanh hải quân công nghệ cao, mang lại cảm giác an ninh và hiện đại.',
    textColor: '#f0f9ff',
  },
  {
    id: 'emerald',
    name: 'Xanh Rừng Đêm',
    nameEn: 'Eco Dark Forest',
    color: '#02140f',
    palette: {
      bg: '#02140f',
      surface: '#05241b',
      surfaceElevated: '#0c372b',
      surfaceAlpha: 'rgba(5, 36, 27, 0.88)',
      border: '#114e3e',
      borderElevated: '#196d57',
      headerBg: 'rgba(2, 20, 15, 0.94)',
      sidebarBg: '#02140f',
    },
    description: 'Sắc xanh ngọc lục bảo sinh thái, biểu trưng cho năng lượng xanh và học đường.',
    textColor: '#ecfdf5',
  },
  {
    id: 'violet',
    name: 'Tím Không Gian',
    nameEn: 'Cosmic Violet',
    color: '#090717',
    palette: {
      bg: '#090717',
      surface: '#130f2f',
      surfaceElevated: '#1e1848',
      surfaceAlpha: 'rgba(19, 15, 47, 0.88)',
      border: '#2d2466',
      borderElevated: '#423594',
      headerBg: 'rgba(9, 7, 23, 0.94)',
      sidebarBg: '#090717',
    },
    description: 'Sắc tím ngân hà huyền ảo, tạo điểm nhấn sáng tạo và công nghệ tương lai.',
    textColor: '#faf5ff',
  },
  {
    id: 'charcoal',
    name: 'Xám Than Chì',
    nameEn: 'Charcoal Zinc',
    color: '#09090b',
    palette: {
      bg: '#09090b',
      surface: '#141418',
      surfaceElevated: '#1f1f24',
      surfaceAlpha: 'rgba(20, 20, 24, 0.88)',
      border: '#2e2e38',
      borderElevated: '#434351',
      headerBg: 'rgba(9, 9, 11, 0.94)',
      sidebarBg: '#09090b',
    },
    description: 'Tông xám than trung tính, sang trọng và giảm căng thẳng thị giác.',
    textColor: '#fafafa',
  },
  {
    id: 'steel',
    name: 'Xanh Thép Công Nghiệp',
    nameEn: 'Industrial Steel Blue',
    color: '#04111a',
    palette: {
      bg: '#04111a',
      surface: '#0a1e2d',
      surfaceElevated: '#112d42',
      surfaceAlpha: 'rgba(10, 30, 45, 0.88)',
      border: '#183f5c',
      borderElevated: '#24587f',
      headerBg: 'rgba(4, 17, 26, 0.94)',
      sidebarBg: '#04111a',
    },
    description: 'Tông xanh thép mát lạnh, vững chãi cho hệ thống giám sát kỹ thuật.',
    textColor: '#f1f5f9',
  },
  {
    id: 'dark-amber',
    name: 'Nâu Cà Phê Trầm',
    nameEn: 'Espresso Dark Warmth',
    color: '#110905',
    palette: {
      bg: '#110905',
      surface: '#1e110a',
      surfaceElevated: '#2d1a10',
      surfaceAlpha: 'rgba(30, 17, 10, 0.88)',
      border: '#432617',
      borderElevated: '#5d3621',
      headerBg: 'rgba(17, 9, 5, 0.94)',
      sidebarBg: '#110905',
    },
    description: 'Tông nâu ấm cúng, êm dịu ánh nhìn trong phòng giám sát làm việc lâu.',
    textColor: '#fffbeb',
  },
  {
    id: 'crimson',
    name: 'Đỏ Rượu Vang',
    nameEn: 'Deep Wine Crimson',
    color: '#120508',
    palette: {
      bg: '#120508',
      surface: '#200a11',
      surfaceElevated: '#30111b',
      surfaceAlpha: 'rgba(32, 10, 17, 0.88)',
      border: '#471927',
      borderElevated: '#632437',
      headerBg: 'rgba(18, 5, 8, 0.94)',
      sidebarBg: '#120508',
    },
    description: 'Tông đỏ trầm quyền uy, độc đáo và đậm chất giám sát an ninh cao cấp.',
    textColor: '#fff1f2',
  },
];

/**
 * Helper to parse any hex color and calculate an entire harmonious dark theme palette
 */
export function generatePaletteFromHex(hex: string): ThemePalette {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  const r = isNaN(num) ? 2 : (num >> 16) & 255;
  const g = isNaN(num) ? 6 : (num >> 8) & 255;
  const b = isNaN(num) ? 23 : num & 255;

  // Convert to HSL
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

  const hue = Math.round(h * 360);
  // Ensure saturation is rich enough to reflect chosen tone but comfortable
  const sat = Math.min(85, Math.max(25, Math.round(s * 100)));

  return {
    bg: `hsl(${hue}, ${sat}%, 5%)`,
    surface: `hsl(${hue}, ${Math.max(15, sat - 5)}%, 9%)`,
    surfaceElevated: `hsl(${hue}, ${Math.max(15, sat - 10)}%, 15%)`,
    surfaceAlpha: `hsla(${hue}, ${Math.max(15, sat - 5)}%, 9%, 0.88)`,
    border: `hsl(${hue}, ${Math.max(15, sat - 10)}%, 22%)`,
    borderElevated: `hsl(${hue}, ${Math.max(15, sat - 10)}%, 32%)`,
    headerBg: `hsla(${hue}, ${sat}%, 5%, 0.94)`,
    sidebarBg: `hsl(${hue}, ${sat}%, 5%)`,
  };
}

const STORAGE_THEME_ID = 'school_iot_bg_theme_id';
const STORAGE_CUSTOM_COLOR = 'school_iot_bg_custom_color';

export class ThemeManager {
  private currentThemeId: string = 'midnight';
  private customColor: string = '#020617';

  constructor() {
    this.loadFromStorage();
  }

  public loadFromStorage(): { themeId: string; customColor: string; actualColor: string; palette: ThemePalette } {
    try {
      const savedThemeId = localStorage.getItem(STORAGE_THEME_ID);
      const savedCustomColor = localStorage.getItem(STORAGE_CUSTOM_COLOR);

      if (savedThemeId) {
        this.currentThemeId = savedThemeId;
      }
      if (savedCustomColor) {
        this.customColor = savedCustomColor;
      }
    } catch (e) {
      console.warn('[ThemeManager] Could not access localStorage', e);
    }

    const palette = this.getEffectivePalette();
    this.applyToDOM();

    return {
      themeId: this.currentThemeId,
      customColor: this.customColor,
      actualColor: palette.bg,
      palette,
    };
  }

  public setTheme(themeId: string, customHex?: string): ThemePalette {
    this.currentThemeId = themeId;
    if (customHex) {
      this.customColor = customHex;
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

  public resetToDefault(): ThemePalette {
    return this.setTheme('midnight');
  }

  public getEffectivePalette(): ThemePalette {
    if (this.currentThemeId === 'custom') {
      return generatePaletteFromHex(this.customColor || '#020617');
    }
    const found = PRESET_THEMES.find((t) => t.id === this.currentThemeId);
    if (found) {
      return found.palette;
    }
    return PRESET_THEMES[0].palette;
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

  public applyToDOM(): void {
    if (typeof document === 'undefined') return;
    const palette = this.getEffectivePalette();
    const root = document.documentElement;

    root.style.setProperty('--app-bg', palette.bg);
    root.style.setProperty('--app-surface', palette.surface);
    root.style.setProperty('--app-surface-elevated', palette.surfaceElevated);
    root.style.setProperty('--app-surface-alpha', palette.surfaceAlpha);
    root.style.setProperty('--app-border', palette.border);
    root.style.setProperty('--app-border-elevated', palette.borderElevated);
    root.style.setProperty('--app-header-bg', palette.headerBg);
    root.style.setProperty('--app-sidebar-bg', palette.sidebarBg);

    // Backward compatibility for any direct references
    root.style.setProperty('--app-bg-color', palette.bg);
    document.body.style.backgroundColor = palette.bg;
  }
}

export const themeManager = new ThemeManager();
