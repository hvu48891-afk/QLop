/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SUPABASE_URL } from './supabaseClient';

export interface TimeSyncInfo {
  currentTime: Date;
  offsetMs: number;
  rttMs: number;
  source: 'worldtime' | 'supabase' | 'local' | 'simulation';
  sourceName: string;
  isSimulated: boolean;
  speedMultiplier: number;
  lastSyncedAt: string | null;
}

type TimeListener = (currentTime: Date, info: TimeSyncInfo) => void;

class TimeSyncService {
  private offsetMs: number = 0; // Sai lệch so với đồng hồ client local
  private simulationBaseTime: Date | null = null;
  private simulationStartLocal: number = 0;
  private speedMultiplier: number = 1;
  private isSimulated: boolean = false;
  private rttMs: number = 18;
  private source: 'worldtime' | 'supabase' | 'local' | 'simulation' = 'supabase';
  private sourceName: string = 'Máy chủ Supabase (Asia/Ho_Chi_Minh)';
  private lastSyncedAt: string | null = null;
  private listeners: TimeListener[] = [];
  private tickerInterval: any = null;

  constructor() {
    this.startTicker();
    // Tự động đồng bộ giờ chuẩn khi khởi tạo
    setTimeout(() => {
      this.syncWithServer();
    }, 500);
  }

  /**
   * Lấy thời gian thực tế chuẩn xác đã được đồng bộ với máy chủ NTP/Supabase
   */
  public getCurrentTime(): Date {
    // Luôn lấy thời gian thực tế, không dùng mô phỏng
    return new Date(Date.now() + this.offsetMs);
  }

  /**
   * Đồng bộ thời gian với máy chủ chuẩn (NTP / Supabase HTTP / WorldTime API)
   */
  public async syncWithServer(): Promise<TimeSyncInfo> {
    const startTime = Date.now();
    let syncedTime: Date | null = null;
    let newSource: 'worldtime' | 'supabase' | 'local' = 'supabase';
    let newSourceName = 'Máy chủ Supabase (Asia/Ho_Chi_Minh)';

    try {
      // 1. Thử lấy Date header từ Supabase server endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        cache: 'no-store',
      });

      const serverDateHeader = response.headers.get('date');
      const endTime = Date.now();
      const rtt = endTime - startTime;

      if (serverDateHeader) {
        const serverTimestamp = new Date(serverDateHeader).getTime();
        // Bù trừ nửa RTT (One-way delay estimate)
        const adjustedServerTime = serverTimestamp + Math.round(rtt / 2);
        this.offsetMs = adjustedServerTime - endTime;
        this.rttMs = Math.max(1, rtt);
        this.source = 'supabase';
        this.sourceName = 'Máy chủ Supabase Cloud (UTC+7)';
        syncedTime = new Date(adjustedServerTime);
      } else {
        throw new Error('No server Date header');
      }
    } catch {
      // 2. Dự phòng: Thử đồng bộ qua WorldTimeAPI công cộng
      try {
        const wtStart = Date.now();
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh', {
          cache: 'no-store',
        });
        const data = await res.json();
        const wtEnd = Date.now();
        const rtt = wtEnd - wtStart;
        if (data && data.utc_datetime) {
          const serverTimestamp = new Date(data.utc_datetime).getTime();
          const adjustedServerTime = serverTimestamp + Math.round(rtt / 2);
          this.offsetMs = adjustedServerTime - wtEnd;
          this.rttMs = Math.max(1, rtt);
          this.source = 'worldtime';
          this.sourceName = 'NTP Internet Time (Asia/Ho_Chi_Minh)';
          syncedTime = new Date(adjustedServerTime);
        } else {
          throw new Error('WorldTimeAPI failed');
        }
      } catch {
        // 3. Fallback: Local system clock
        this.offsetMs = 0;
        this.rttMs = 5;
        this.source = 'local';
        this.sourceName = 'Đồng hồ máy trạm chuẩn (Local Client)';
        syncedTime = new Date();
      }
    }

    this.isSimulated = false;
    this.speedMultiplier = 1;
    this.simulationBaseTime = null;
    this.lastSyncedAt = new Date().toLocaleTimeString('vi-VN');

    const info = this.getTimeInfo();
    this.notifyListeners(info);
    return info;
  }

  /**
   * Tính năng mô phỏng đã bị tắt theo yêu cầu (Chỉ sử dụng thời gian thực tế)
   */
  public setSimulationTime(_targetTimeStr: string, _speedMultiplier: number = 1): TimeSyncInfo {
    // Khóa tính năng mô phỏng: luôn giữ thời gian thực tế
    return this.resetToRealTime();
  }

  /**
   * Đặt lại về thời gian chuẩn thực tế
   */
  public resetToRealTime(): TimeSyncInfo {
    this.isSimulated = false;
    this.simulationBaseTime = null;
    this.speedMultiplier = 1;
    this.source = 'supabase';
    this.sourceName = 'Máy chủ Supabase Cloud (UTC+7)';
    const info = this.getTimeInfo();
    this.notifyListeners(info);
    return info;
  }

  /**
   * Thay đổi tốc độ thời gian (1x, 5x, 10x, 30x)
   */
  public setSpeedMultiplier(multiplier: number): void {
    if (this.isSimulated && this.simulationBaseTime) {
      // Cập nhật mốc tính toán hiện tại
      const currentSim = this.getCurrentTime();
      this.simulationBaseTime = currentSim;
      this.simulationStartLocal = Date.now();
    }
    this.speedMultiplier = multiplier;
    this.notifyListeners(this.getTimeInfo());
  }

  public getTimeInfo(): TimeSyncInfo {
    return {
      currentTime: this.getCurrentTime(),
      offsetMs: this.offsetMs,
      rttMs: this.rttMs,
      source: this.source,
      sourceName: this.sourceName,
      isSimulated: this.isSimulated,
      speedMultiplier: this.speedMultiplier,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  public subscribe(listener: TimeListener): () => void {
    this.listeners.push(listener);
    listener(this.getCurrentTime(), this.getTimeInfo());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(info: TimeSyncInfo): void {
    this.listeners.forEach((listener) => {
      try {
        listener(info.currentTime, info);
      } catch (err) {
        console.error('[TimeSyncService listener error]:', err);
      }
    });
  }

  private startTicker(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      const info = this.getTimeInfo();
      this.notifyListeners(info);
    }, 1000);
  }
}

export const timeSyncService = new TimeSyncService();
