/**
 * Utility function to parse CO and CO2 concentrations from air quality data
 * e.g. "CO:121ppm CO2:1366ppm" -> { co: 121, co2: 1366, coText: "121 ppm", co2Text: "1366 ppm" }
 */

export interface ParsedAirQuality {
  co: number;
  co2: number;
  coText: string;
  co2Text: string;
  isCoAlert: boolean;
  isCo2Alert: boolean;
  overallStatus: 'good' | 'moderate' | 'poor';
  overallStatusText: string;
}

export function parseAirQuality(raw?: string | null): ParsedAirQuality {
  if (!raw) {
    return {
      co: 0,
      co2: 400,
      coText: '-- ppm',
      co2Text: '-- ppm',
      isCoAlert: false,
      isCo2Alert: false,
      overallStatus: 'good',
      overallStatusText: 'Bình thường',
    };
  }

  const str = String(raw).trim();

  // Regex to extract CO2 first (so CO regex doesn't match the CO in CO2)
  const co2Match = str.match(/CO2[:\s]*([0-9.]+)/i);
  // Regex to extract CO specifically (preceded by start of string or space, followed by colon or space)
  const coMatch = str.match(/(?:^|[^0-9A-Za-z])CO[:\s]*([0-9.]+)/i);

  const co2 = co2Match ? parseFloat(co2Match[1]) : (str.toLowerCase().includes('tot') ? 450 : 800);
  const co = coMatch ? parseFloat(coMatch[1]) : (str.toLowerCase().includes('tot') ? 15 : 45);

  // CO safe threshold: < 50 ppm is normal, >= 50 ppm requires attention, >= 100 ppm is critical
  const isCoAlert = co >= 100;

  // CO2 safe threshold in classroom: < 1000 ppm is fresh, 1000-1400 ppm moderate, >= 1400 ppm poor (stuffy/drowsy)
  const isCo2Alert = co2 >= 1400;

  let overallStatus: 'good' | 'moderate' | 'poor' = 'good';
  let overallStatusText = 'Đạt chuẩn';

  if (co >= 100 || co2 >= 1400) {
    overallStatus = 'poor';
    overallStatusText = 'Kém (Cần thông gió)';
  } else if (co >= 50 || co2 >= 1000) {
    overallStatus = 'moderate';
    overallStatusText = 'Trung bình';
  }

  return {
    co,
    co2,
    coText: `${Math.round(co)} ppm`,
    co2Text: `${Math.round(co2)} ppm`,
    isCoAlert,
    isCo2Alert,
    overallStatus,
    overallStatusText,
  };
}
