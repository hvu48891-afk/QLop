/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type LightPreset = 'study' | 'presentation' | 'exam' | 'off';
export type AcMode = 'cool' | 'fan';
export type AcFanSpeed = 'low' | 'med' | 'high';
export type ProjectorInput = 'hdmi' | 'airplay' | 'typec';
export type CurtainState = 'up' | 'down' | 'stop';

export interface RoomDevices {
  light: {
    isOn: boolean;
    brightness: number; // 0 - 100
    preset: LightPreset;
  };
  ac: {
    isOn: boolean;
    targetTemp: number; // 16 - 30
    mode: AcMode;
    fanSpeed: AcFanSpeed;
    timerMinutes: number | null;
  };
  projector: {
    isOn: boolean;
    inputSource: ProjectorInput;
  };
  fan: {
    isOn: boolean;
    speed: number; // 1 - 4
  };
  curtain: CurtainState;
}

export interface Room {
  id: string; // e.g. "A201" (maps to code)
  code: string; // e.g. "A201"
  name: string;
  building: string; // "A" | "B" | "Tòa A" | "Tòa B"
  floor: number;
  capacity: number;
  status: 'off' | 'on' | 'alert';
  isPowerOn: boolean;
  isOccupied: boolean;
  hasFireAlarm: boolean;
  smokeLevel: number; // ppm (0 - 1000)
  temperature: number; // °C
  humidity: number; // %
  devices: RoomDevices;
  emergencyPowerCut: boolean;
  lastUpdated: string;
  updatedAt: string;
  isDisconnected?: boolean; // Nếu updated_at cũ hơn 30 giây
}

// Supabase Database Row Types (Khớp chính xác cấu trúc database thực tế)
export interface DbRoom {
  id: number | string;
  code: string; // e.g. 'A201'
  name: string;
  building: string; // 'A' | 'B'
  status: 'off' | 'on' | 'alert';
  temperature: number;
  humidity: number;
  smoke_level: number;
  power_on: boolean;
  light_on: boolean;
  light_mode: 'study' | 'presentation' | 'exam' | 'off';
  ac_on: boolean;
  ac_temp: number;
  ac_mode: 'cool' | 'fan';
  projector_on: boolean;
  fan_on: boolean;
  curtain: 'up' | 'down' | 'stop';
  updated_at: string;
}

export interface DbAlert {
  id: string | number;
  room_code: string;
  type: string;
  message: string;
  level: 'warning' | 'critical';
  created_at: string;
}

export interface DbSchedule {
  id: string | number;
  name: string;
  scope: 'all' | 'building' | 'room';
  target: string;
  action: string;
  run_time: string; // "17:30"
  days: number[]; // 0=CN..6=T7
  enabled: boolean;
}

export interface DbSettings {
  id: number; // Luôn = 1
  temp_threshold: number;
  smoke_threshold: number;
}

export interface DbProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'supervisor';
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'resolved';
export type AlertType = 'smoke' | 'fire' | 'temp_high' | 'device_left_on' | 'power_leak';

export interface AlertLog {
  id: string;
  roomId: string;
  roomName: string;
  building: string;
  type: AlertType | string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt?: string;
}

export type ScheduleScope = 'all' | 'building' | 'room';
export type ScheduleAction = 
  | 'turn_off_all' 
  | 'turn_off_ac_proj' 
  | 'mode_study' 
  | 'turn_on_ac'
  | string;

export interface ScheduleRule {
  id: string;
  title: string;
  name?: string;
  scope: ScheduleScope;
  targetId: string; // 'all' | 'A' | 'B' | 'A201'
  targetName: string;
  action: ScheduleAction;
  time: string; // "17:30"
  daysOfWeek: number[]; // 0=CN..6=T7
  isEnabled: boolean;
  description: string;
}

export interface ThresholdSettings {
  highTempThreshold: number; // e.g. 35 °C
  smokeThreshold: number; // e.g. 350 ppm
  autoAlertOffHours: boolean;
  soundEnabled: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  roomId: string;
  roomName: string;
}

export type TabType = 'dashboard' | 'rooms' | 'schedules' | 'settings';
