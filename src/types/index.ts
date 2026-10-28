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
export type AcMode = 'cool' | 'fan' | 'dry' | 'auto';
export type AcFanSpeed = 'low' | 'med' | 'high';
export type ProjectorInput = 'hdmi' | 'airplay' | 'typec';

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
}

export interface Room {
  id: string; // e.g. "A201"
  name: string;
  building: string; // "Tòa A", "Tòa B", "Tòa C"
  floor: number;
  capacity: number;
  isPowerOn: boolean;
  isOccupied: boolean;
  hasFireAlarm: boolean;
  smokeLevel: number; // ppm (0 - 1000)
  temperature: number; // °C
  humidity: number; // %
  devices: RoomDevices;
  emergencyPowerCut: boolean;
  lastUpdated: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'resolved';
export type AlertType = 'smoke' | 'fire' | 'temp_high' | 'device_left_on' | 'power_leak';

export interface AlertLog {
  id: string;
  roomId: string;
  roomName: string;
  building: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  isResolved: boolean;
  resolvedAt?: string;
}

export type ScheduleScope = 'all' | 'building' | 'room';
export type ScheduleAction = 
  | 'turn_off_all' 
  | 'turn_off_ac_proj' 
  | 'mode_study' 
  | 'turn_on_ac';

export interface ScheduleRule {
  id: string;
  title: string;
  scope: ScheduleScope;
  targetId: string; // 'all' | 'Tòa A' | 'Tòa B' | 'A201' etc.
  targetName: string;
  action: ScheduleAction;
  time: string; // "17:30"
  daysOfWeek: number[]; // 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
  isEnabled: boolean;
  description: string;
}

export interface ThresholdSettings {
  highTempThreshold: number; // e.g. 35 °C
  smokeThreshold: number; // e.g. 350 ppm
  autoAlertOffHours: boolean; // after 18:00 alert if devices on
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
