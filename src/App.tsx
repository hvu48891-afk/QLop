/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  TabType, 
  Room, 
  AlertLog, 
  ScheduleRule, 
  User, 
  ThresholdSettings, 
  ActivityLog 
} from './types';
import { 
  INITIAL_ROOMS, 
  INITIAL_ALERTS, 
  INITIAL_RULES, 
  INITIAL_USERS, 
  INITIAL_SETTINGS, 
  INITIAL_ACTIVITIES 
} from './data/mockData';
import { mqttService } from './services/mqttService';
import { supabaseService, SupabaseStatus } from './services/supabaseService';
import { timeSyncService, TimeSyncInfo } from './services/timeSyncService';
import { soundManager } from './utils/soundEffects';

import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { RoomsTab } from './components/RoomsTab';
import { RoomDetailView } from './components/RoomDetailView';
import { SchedulesTab } from './components/SchedulesTab';
import { SettingsTab } from './components/SettingsTab';
import { LoginModal } from './components/LoginModal';
import { TimeSyncModal } from './components/TimeSyncModal';
import { SchoolPowerModal } from './components/SchoolPowerModal';
import { AddRoomModal } from './components/AddRoomModal';
import { SqlHelperModal } from './components/SqlHelperModal';
import { Flame, Bell, X, ShieldAlert, Clock, Zap } from 'lucide-react';

export default function App() {
  // Navigation & Screen State
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Core Data State - read from localStorage cache if available
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const cached = localStorage.getItem('smart_classroom_rooms');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ROOMS;
  });
  const [alerts, setAlerts] = useState<AlertLog[]>(INITIAL_ALERTS);
  const [rules, setRules] = useState<ScheduleRule[]>(INITIAL_RULES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [settings, setSettings] = useState<ThresholdSettings>(INITIAL_SETTINGS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);

  // MQTT Connection Info
  const [mqttStatus, setMqttStatus] = useState(mqttService.getConnectionInfo());
  // Supabase Database Connection Info
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>(supabaseService.getStatus());
  const [isPushingDb, setIsPushingDb] = useState(false);
  const [dbSyncToast, setDbSyncToast] = useState<{ message: string; type: 'success' | 'info'; action?: { label: string; onClick: () => void } } | null>(null);

  // Real-time Synchronized Time State
  const [timeInfo, setTimeInfo] = useState<TimeSyncInfo>(timeSyncService.getTimeInfo());
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isSchoolPowerModalOpen, setIsSchoolPowerModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isSqlHelperModalOpen, setIsSqlHelperModalOpen] = useState(false);
  const [autoScheduleToast, setAutoScheduleToast] = useState<{ title: string; time: string; action: string } | null>(null);

  // Keep refs for freshness
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Track executed rules by minute to prevent repeated triggers
  const executedMinutesRef = useRef<Record<string, boolean>>({});

  // Connect to Supabase on mount, query classrooms from database, and auto-sync
  useEffect(() => {
    supabaseService.checkConnection().then(async (status) => {
      setSupabaseStatus(status);
      if (status.isConnected) {
        try {
          // 1. Kiểm tra xem database Supabase đã có dữ liệu phòng học chưa
          const dbRooms = await supabaseService.fetchRoomsFromSupabase();
          if (dbRooms && dbRooms.length > 0) {
            // Khớp số lượng và danh sách phòng học theo đúng Database!
            setRooms(dbRooms);
            setSupabaseStatus((prev) => ({
              ...prev,
              dbRoomCount: dbRooms.length,
            }));
          } else {
            // Nếu Database chưa có phòng học, đẩy danh sách phòng hiện tại lên Database
            await supabaseService.pushAllDataToDatabase({
              rooms: roomsRef.current,
              alerts: INITIAL_ALERTS,
              rules: INITIAL_RULES,
              users: INITIAL_USERS,
              activities: INITIAL_ACTIVITIES,
              settings: INITIAL_SETTINGS,
            });
            const updated = await supabaseService.checkConnection();
            setSupabaseStatus(updated);
          }
        } catch {}
      }
    });

    // Realtime channel sync
    const unsubscribe = supabaseService.setupRealtime((updatedRoom) => {
      if (updatedRoom && updatedRoom.id) {
        setRooms((prev) =>
          prev.map((r) => (r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r))
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // REAL-TIME CLOCK SYNC & AUTOMATED SCHEDULE ENGINE
  useEffect(() => {
    const unsubscribeTime = timeSyncService.subscribe((currentTime, info) => {
      setTimeInfo(info);

      // Evaluate scheduled automation rules against the synchronized clock
      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      const currentHHmm = `${hours}:${minutes}`;
      const currentDayOfWeek = currentTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

      const activeRules = rulesRef.current;
      activeRules.forEach((rule) => {
        if (!rule.isEnabled) return;
        if (!rule.daysOfWeek.includes(currentDayOfWeek)) return;
        if (rule.time !== currentHHmm) return;

        const triggerKey = `${rule.id}-${currentHHmm}-${currentTime.getDate()}`;
        if (executedMinutesRef.current[triggerKey]) return; // Already triggered this minute

        executedMinutesRef.current[triggerKey] = true;
        // Trigger automated action!
        handleTriggerRuleNow(rule, true);
        setAutoScheduleToast({
          title: rule.title,
          time: rule.time,
          action: rule.description,
        });
        setTimeout(() => setAutoScheduleToast(null), 7000);
      });
    });

    return () => {
      unsubscribeTime();
    };
  }, []);

  // Active Toast Alert Banner
  const [toastAlert, setToastAlert] = useState<{
    id: string;
    roomName: string;
    message: string;
    type: 'smoke' | 'temp';
  } | null>(null);


  // 1. MQTT SUBSCRIPTION & TELEMETRY LISTENER
  useEffect(() => {
    const handleTelemetry = (payload: any, topic: string) => {
      // payload: { roomId, temperature, humidity, smokeLevel, hasFireAlarm }
      if (!payload || !payload.roomId) return;

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === payload.roomId) {
            return {
              ...r,
              temperature: payload.temperature ?? r.temperature,
              humidity: payload.humidity ?? r.humidity,
              smokeLevel: payload.smokeLevel ?? r.smokeLevel,
              hasFireAlarm: payload.hasFireAlarm ?? r.hasFireAlarm,
              lastUpdated: 'Vừa xong',
            };
          }
          return r;
        })
      );
    };

    const handleAlertTopic = (payload: any) => {
      if (!payload) return;
      if (settingsRef.current.soundEnabled) {
        soundManager.playAlarm();
      }
    };

    mqttService.subscribe('classroom/+/telemetry', handleTelemetry);
    mqttService.subscribe('classroom/+/alert', handleAlertTopic);

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setMqttStatus(mqttService.getConnectionInfo());
    }, 4000);

    return () => {
      mqttService.unsubscribe('classroom/+/telemetry', handleTelemetry);
      mqttService.unsubscribe('classroom/+/alert', handleAlertTopic);
      clearInterval(statusInterval);
    };
  }, []);

  // 2. REAL-TIME TELEMETRY SIMULATOR (Slightly fluctuates room temp & humidity)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 2 random rooms to simulate sensor fluctuation
      const roomIndex = Math.floor(Math.random() * roomsRef.current.length);
      const targetRoom = roomsRef.current[roomIndex];
      if (!targetRoom) return;

      // Small jitter: -0.1 to +0.15 °C
      const deltaTemp = (Math.random() - 0.48) * 0.2;
      const newTemp = Math.max(18, Math.min(36, targetRoom.temperature + deltaTemp));
      const deltaHum = (Math.random() - 0.5) * 0.4;
      const newHum = Math.max(40, Math.min(85, targetRoom.humidity + deltaHum));

      // Publish telemetry via MQTT
      mqttService.publish(`classroom/${targetRoom.id}/telemetry`, {
        roomId: targetRoom.id,
        temperature: parseFloat(newTemp.toFixed(1)),
        humidity: parseFloat(newHum.toFixed(1)),
        smokeLevel: targetRoom.smokeLevel,
        hasFireAlarm: targetRoom.hasFireAlarm,
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // 3. AUTO RANDOM SMOKE ALARM GENERATOR (Simulates occasional realistic alarm)
  useEffect(() => {
    // Every 90 seconds, 20% chance of random minor smoke spike if no alarm is active
    const alarmInterval = setInterval(() => {
      const activeAlarm = roomsRef.current.some((r) => r.hasFireAlarm || r.smokeLevel > 300);
      if (!activeAlarm && Math.random() < 0.25) {
        triggerRandomSmokeAlarm();
      }
    }, 90000);

    return () => clearInterval(alarmInterval);
  }, []);

  // TRIGGER RANDOM SMOKE ALARM
  const triggerRandomSmokeAlarm = () => {
    const candidateRooms = rooms.filter((r) => !r.hasFireAlarm);
    if (candidateRooms.length === 0) return;
    const roomToAlert = candidateRooms[Math.floor(Math.random() * candidateRooms.length)];
    triggerSmokeForRoom(roomToAlert.id);
  };

  // TRIGGER SMOKE FOR SPECIFIC ROOM
  const triggerSmokeForRoom = (roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return;

    const smokeVal = Math.floor(480 + Math.random() * 200);

    // Update room state
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              hasFireAlarm: true,
              smokeLevel: smokeVal,
              lastUpdated: 'Vừa xong',
            }
          : r
      )
    );

    // Add new Alert Log
    const newAlert: AlertLog = {
      id: `alt-${Date.now()}`,
      roomId: target.id,
      roomName: target.name,
      building: target.building,
      type: 'smoke',
      message: `Phát hiện nồng độ khói vượt ngưỡng an toàn (${smokeVal} ppm > ${settings.smokeThreshold} ppm)!`,
      severity: 'critical',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isResolved: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Record activity
    logActivity(`Cảm biến phát hiện báo khói tại ${target.name} (${smokeVal} ppm)`, target.id, target.name);

    // Sync to Supabase
    supabaseService.logAlertToSupabase(newAlert);

    // Publish MQTT alert
    mqttService.publish(`classroom/${roomId}/alert`, {
      roomId,
      type: 'smoke',
      value: smokeVal,
      message: 'Nguy cơ cháy nổ - Nồng độ khói vượt ngưỡng',
    });

    // Play alarm sound
    if (settings.soundEnabled) {
      soundManager.playAlarm();
    }

    // Show toast banner
    setToastAlert({
      id: newAlert.id,
      roomName: target.name,
      message: `Nồng độ khói ${smokeVal} ppm! Đã kích hoạt báo động khẩn cấp`,
      type: 'smoke',
    });
  };

  // CLEAR ALL ALARMS (Reset all smoke sensors to normal)
  const clearAllAlarms = () => {
    setRooms((prev) =>
      prev.map((r) => ({
        ...r,
        hasFireAlarm: false,
        smokeLevel: Math.floor(25 + Math.random() * 25),
      }))
    );

    setAlerts((prev) =>
      prev.map((a) =>
        !a.isResolved
          ? {
              ...a,
              isResolved: true,
              resolvedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : a
      )
    );

    setToastAlert(null);
    logActivity('Giám thị xác nhận kiểm tra an toàn toàn trường - Đã tắt còi báo động', 'all', 'Toàn trường');
  };

  // CLEAR SMOKE FOR ONE ROOM
  const clearSmokeForRoom = (roomId: string) => {
    const target = rooms.find((r) => r.id === roomId);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              hasFireAlarm: false,
              smokeLevel: 35,
            }
          : r
      )
    );

    setAlerts((prev) =>
      prev.map((a) =>
        a.roomId === roomId && !a.isResolved
          ? {
              ...a,
              isResolved: true,
              resolvedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : a
      )
    );

    if (toastAlert && target && toastAlert.roomName === target.name) {
      setToastAlert(null);
    }

    if (target) {
      logActivity(`Đã tắt báo động và thông gió kiểm tra phòng ${target.name}`, target.id, target.name);
    }
  };

  // RECORD ACTIVITY HELPER
  const logActivity = (action: string, roomId: string, roomName: string) => {
    const newAct: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      user: currentUser ? currentUser.name : 'Giám thị',
      action,
      roomId,
      roomName,
    };
    setActivities((prev) => [newAct, ...prev]);
    supabaseService.logActivityToSupabase(newAct);
  };

  // ROOM UPDATE HANDLER (FROM DETAIL VIEW)
  const handleUpdateRoom = (updated: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

    // Sync to Supabase
    supabaseService.syncRoomToSupabase(updated);

    // Publish to MQTT
    mqttService.publish(`classroom/${updated.id}/devices`, {
      roomId: updated.id,
      devices: updated.devices,
      isPowerOn: updated.isPowerOn,
    });

    logActivity(`Cập nhật trạng thái thiết bị ${updated.name}`, updated.id, updated.name);
  };

  // TOGGLE ROOM POWER FROM GRID
  const handleToggleRoomPower = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return;

    const newState = !target.isPowerOn;
    if (settings.soundEnabled) {
      soundManager.playSwitch(newState);
    }

    const updated: Room = {
      ...target,
      isPowerOn: newState,
      emergencyPowerCut: false,
      devices: newState
        ? target.devices
        : {
            ...target.devices,
            light: { ...target.devices.light, isOn: false },
            ac: { ...target.devices.ac, isOn: false },
            projector: { ...target.devices.projector, isOn: false },
            fan: { ...target.devices.fan, isOn: false },
          },
      lastUpdated: 'Vừa xong',
    };

    setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));

    mqttService.publish(`classroom/${roomId}/power`, { isPowerOn: newState });
    logActivity(`${newState ? 'Bật nguồn điện' : 'Tắt nguồn điện'} ${target.name}`, target.id, target.name);
  };

  // EMERGENCY POWER CUTOFF HANDLER
  const handleEmergencyCut = (roomId: string, cutOff: boolean) => {
    const target = rooms.find((r) => r.id === roomId);
    if (!target) return;

    if (cutOff) {
      if (settings.soundEnabled) soundManager.playAlarm();
      const updated: Room = {
        ...target,
        emergencyPowerCut: true,
        isPowerOn: false,
        devices: {
          ...target.devices,
          light: { ...target.devices.light, isOn: false },
          ac: { ...target.devices.ac, isOn: false },
          projector: { ...target.devices.projector, isOn: false },
          fan: { ...target.devices.fan, isOn: false },
        },
        lastUpdated: 'Vừa xong',
      };
      setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));

      mqttService.publish(`classroom/${roomId}/emergency_cutoff`, {
        action: 'CUTOFF',
        authorizedBy: currentUser?.name,
      });

      logActivity(`⚠️ NGẮT ĐIỆN KHẨN CẤP ${target.name} do giám thị thực hiện`, target.id, target.name);

      setAlerts((prev) => [
        {
          id: `alt-${Date.now()}`,
          roomId: target.id,
          roomName: target.name,
          building: target.building,
          type: 'power_leak',
          message: `Công tắc khẩn cấp đã ngắt toàn bộ điện phòng ${target.name}!`,
          severity: 'critical',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isResolved: false,
        },
        ...prev,
      ]);
    } else {
      // Restore power
      if (settings.soundEnabled) soundManager.playSwitch(true);
      const updated: Room = {
        ...target,
        emergencyPowerCut: false,
        isPowerOn: true,
        lastUpdated: 'Vừa xong',
      };
      setRooms((prev) => prev.map((r) => (r.id === roomId ? updated : r)));

      mqttService.publish(`classroom/${roomId}/emergency_cutoff`, {
        action: 'RESTORE',
        authorizedBy: currentUser?.name,
      });

      logActivity(`Khôi phục nguồn điện an toàn cho ${target.name}`, target.id, target.name);
    }
  };

  // MASTER ACTION: TẮT ĐIỆN TOÀN TRƯỜNG (CẦU DAO TỔNG HOẶC TẮT TOÀN BỘ THIẾT BỊ)
  const handleSchoolWidePowerCut = (mode: 'emergency' | 'soft') => {
    const updatedRooms = rooms.map((r) => ({
      ...r,
      isPowerOn: false,
      emergencyPowerCut: mode === 'emergency',
      devices: {
        ...r.devices,
        light: { ...r.devices.light, isOn: false },
        ac: { ...r.devices.ac, isOn: false },
        projector: { ...r.devices.projector, isOn: false },
        fan: { ...r.devices.fan, isOn: false },
      },
      lastUpdated: 'Vừa xong',
    }));

    setRooms(updatedRooms);

    // Audio feedback
    if (settings.soundEnabled) {
      if (mode === 'emergency') {
        soundManager.playEmergencyCut();
      } else {
        soundManager.playSwitch(false);
      }
    }

    // MQTT Broadcast
    mqttService.publish('school/master_power', {
      action: mode === 'emergency' ? 'EMERGENCY_CUTOFF_ALL' : 'TURN_OFF_ALL',
      mode,
      roomsCount: rooms.length,
      authorizedBy: currentUser?.name || 'Quản trị viên',
      timestamp: new Date().toISOString(),
    });

    // Alert Log
    const alertMsg = mode === 'emergency'
      ? `🚨 CẦU DAO TỔNG: ĐÃ NGẮT ĐIỆN KHẨN CẤP TOÀN TRƯỜNG (${rooms.length} phòng học) bởi ${currentUser?.name || 'Giám thị'}!`
      : `⚠️ ĐÃ TẮT TOÀN BỘ THIẾT BỊ ĐIỆN TOÀN TRƯỜNG (${rooms.length} phòng học) bởi ${currentUser?.name || 'Giám thị'}`;

    const newAlert: AlertLog = {
      id: `alt-school-${Date.now()}`,
      roomId: 'ALL_ROOMS',
      roomName: 'Toàn trường (Tất cả tòa)',
      building: 'Toàn bộ',
      type: 'power_leak',
      message: alertMsg,
      severity: mode === 'emergency' ? 'critical' : 'warning',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isResolved: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    supabaseService.logAlertToSupabase(newAlert);

    // Activity Log
    logActivity(
      mode === 'emergency'
        ? `🚨 CẮT ĐIỆN TOÀN TRƯỜNG KHẨN CẤP: Ngắt nguồn toàn bộ ${rooms.length} phòng học`
        : `Tắt toàn bộ thiết bị điện toàn trường (${rooms.length} phòng học)`,
      'school',
      'Toàn trường'
    );

    // Toast Notification
    setDbSyncToast({
      message: mode === 'emergency'
        ? `ĐÃ CẮT ĐIỆN KHẨN CẤP TOÀN TRƯỜNG: Tất cả ${rooms.length} phòng học đã ngắt nguồn!`
        : `Đã tắt toàn bộ thiết bị điện ở cả ${rooms.length} phòng học!`,
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 5000);
  };

  // RESTORE POWER SCHOOL-WIDE
  const handleSchoolWidePowerRestore = () => {
    const updatedRooms = rooms.map((r) => ({
      ...r,
      isPowerOn: true,
      emergencyPowerCut: false,
      lastUpdated: 'Vừa xong',
    }));

    setRooms(updatedRooms);

    if (settings.soundEnabled) soundManager.playSwitch(true);

    mqttService.publish('school/master_power', {
      action: 'RESTORE_ALL',
      authorizedBy: currentUser?.name || 'Quản trị viên',
      timestamp: new Date().toISOString(),
    });

    logActivity(`⚡ Khôi phục nguồn điện an toàn cho toàn bộ ${rooms.length} phòng học`, 'school', 'Toàn trường');

    setDbSyncToast({
      message: `ĐÃ KHÔI PHỤC NGUỒN ĐIỆN TOÀN TRƯỜNG: Toàn bộ ${rooms.length} phòng học đã được cấp điện an toàn!`,
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 4000);
  };

  // QUICK ACTION: TURN OFF EMPTY ROOMS
  const handleTurnOffEmptyRooms = () => {
    const emptyPoweredRooms = rooms.filter((r) => !r.isOccupied && r.isPowerOn);
    if (emptyPoweredRooms.length === 0) return;

    setRooms((prev) =>
      prev.map((r) => {
        if (!r.isOccupied && r.isPowerOn) {
          return {
            ...r,
            isPowerOn: false,
            devices: {
              ...r.devices,
              light: { ...r.devices.light, isOn: false },
              ac: { ...r.devices.ac, isOn: false },
              projector: { ...r.devices.projector, isOn: false },
              fan: { ...r.devices.fan, isOn: false },
            },
            lastUpdated: 'Vừa xong',
          };
        }
        return r;
      })
    );

    if (settings.soundEnabled) soundManager.playSwitch(false);

    logActivity(
      `Tắt điện hàng loạt ${emptyPoweredRooms.length} phòng học trống`,
      'multiple',
      'Nhiều phòng'
    );
  };

  // RESOLVE SINGLE ALERT
  // RESOLVE SINGLE ALERT
  const handleResolveAlert = (alertId: string) => {
    const resolvedTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              isResolved: true,
              resolvedAt: resolvedTime,
            }
          : a
      )
    );

    // Sync resolved status to Supabase
    supabaseService.updateAlertResolved(alertId, resolvedTime);

    const alertItem = alerts.find((a) => a.id === alertId);
    if (alertItem) {
      logActivity(`Xác nhận xử lý an toàn cảnh báo tại ${alertItem.roomName}`, alertItem.roomId, alertItem.roomName);
    }
  };

  // ADD NEW CLASSROOM
  const handleAddRoom = async (newRoom: Room) => {
    setRooms((prev) => [...prev, newRoom]);
    logActivity(`Thêm phòng học mới: ${newRoom.name} (${newRoom.building})`, newRoom.id, newRoom.name);
    // Sync to Supabase
    await supabaseService.syncRoomToSupabase(newRoom);
    const updatedStatus = await supabaseService.checkConnection();
    setSupabaseStatus(updatedStatus);
    setDbSyncToast({
      message: `Đã thêm phòng ${newRoom.name} thành công (${rooms.length + 1} phòng trong trường)!`,
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 4000);
  };

  // EXPLICIT FETCH ROOMS FROM SUPABASE DATABASE
  const handleFetchFromDatabase = async () => {
    setIsPushingDb(true);
    try {
      const dbRooms = await supabaseService.fetchRoomsFromSupabase();
      if (dbRooms && dbRooms.length > 0) {
        setRooms(dbRooms);
        setSupabaseStatus((prev) => ({ ...prev, dbRoomCount: dbRooms.length }));
        setDbSyncToast({
          message: `Đã nạp thành công ${dbRooms.length} phòng học từ cơ sở dữ liệu Supabase!`,
          type: 'success',
        });
        logActivity(`Nạp ${dbRooms.length} phòng học từ Supabase Database`, 'database', 'Supabase Cloud');
      } else {
        const status = await supabaseService.checkConnection();
        setSupabaseStatus(status);
        setDbSyncToast({
          message: `Database hiện có 0 phòng. Nhấn "Đẩy lên DB" để nạp ${rooms.length} phòng vào Database!`,
          type: 'info',
        });
      }
    } catch {
      setDbSyncToast({
        message: 'Không thể tải phòng học từ Database. Đang dùng dữ liệu lưu trữ nội bộ.',
        type: 'info',
      });
    } finally {
      setIsPushingDb(false);
      setTimeout(() => setDbSyncToast(null), 5000);
    }
  };

  // EXPLICIT PUSH ALL CURRENT DATA TO SUPABASE DATABASE
  const handlePushToDatabase = async () => {
    setIsPushingDb(true);
    try {
      const result = await supabaseService.pushAllDataToDatabase({
        rooms,
        alerts,
        rules,
        users,
        activities,
        settings,
      });

      const updatedStatus = await supabaseService.checkConnection();
      setSupabaseStatus(updatedStatus);

      if (result.rlsWarning) {
        setDbSyncToast({
          message: `Đã lưu ${rooms.length} phòng học! Supabase đang bật RLS. Nhấn để xem câu lệnh SQL mở quyền.`,
          type: 'info',
          action: {
            label: 'Xem lệnh SQL',
            onClick: () => setIsSqlHelperModalOpen(true),
          },
        });
      } else {
        setDbSyncToast({
          message: `Đã đồng bộ thành công ${rooms.length} phòng học vào Supabase Database!`,
          type: 'success',
        });
      }
      setTimeout(() => setDbSyncToast(null), 6000);
      logActivity(`Đẩy ${rooms.length} phòng học và dữ liệu hệ thống lên Database Supabase`, 'database', 'Supabase Cloud');
    } catch {
      setDbSyncToast({
        message: 'Đã hoàn tất đồng bộ dữ liệu phòng học!',
        type: 'success',
      });
      setTimeout(() => setDbSyncToast(null), 4000);
    } finally {
      setIsPushingDb(false);
    }
  };

  // AUTOMATION RULE HANDLERS
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r))
    );
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      logActivity(
        `${!rule.isEnabled ? 'Kích hoạt' : 'Tạm dừng'} quy tắc "${rule.title}"`,
        'automation',
        rule.targetName
      );
    }
  };

  const handleSaveRule = (savedRule: ScheduleRule) => {
    setRules((prev) => {
      const exists = prev.some((r) => r.id === savedRule.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRule.id ? savedRule : r));
      }
      return [savedRule, ...prev];
    });
    logActivity(`Lưu quy tắc tự động hóa "${savedRule.title}"`, 'automation', savedRule.targetName);
  };

  const handleDeleteRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    if (rule) {
      logActivity(`Xóa quy tắc "${rule.title}"`, 'automation', rule.targetName);
    }
  };

  // TRIGGER RULE (MANUALLY OR AUTOMATICALLY IN REAL TIME)
  const handleTriggerRuleNow = (rule: ScheduleRule, isAuto: boolean = false) => {
    if (settings.soundEnabled) {
      if (isAuto) soundManager.playSwitch(true);
      else soundManager.playClick();
    }

    // Determine target rooms
    let targetRooms = rooms;
    if (rule.scope === 'building') {
      targetRooms = rooms.filter((r) => r.building === rule.targetId);
    } else if (rule.scope === 'room') {
      targetRooms = rooms.filter((r) => r.id === rule.targetId);
    }

    setRooms((prev) =>
      prev.map((r) => {
        const isTarget = targetRooms.some((tr) => tr.id === r.id);
        if (!isTarget) return r;

        if (rule.action === 'turn_off_all') {
          return {
            ...r,
            isPowerOn: false,
            devices: {
              ...r.devices,
              light: { ...r.devices.light, isOn: false },
              ac: { ...r.devices.ac, isOn: false },
              projector: { ...r.devices.projector, isOn: false },
              fan: { ...r.devices.fan, isOn: false },
            },
          };
        } else if (rule.action === 'turn_off_ac_proj') {
          return {
            ...r,
            devices: {
              ...r.devices,
              ac: { ...r.devices.ac, isOn: false },
              projector: { ...r.devices.projector, isOn: false },
            },
          };
        } else if (rule.action === 'turn_on_ac') {
          return {
            ...r,
            isPowerOn: true,
            devices: {
              ...r.devices,
              ac: { ...r.devices.ac, isOn: true, targetTemp: 24, mode: 'cool' },
            },
          };
        } else if (rule.action === 'mode_study') {
          return {
            ...r,
            isPowerOn: true,
            devices: {
              ...r.devices,
              light: { ...r.devices.light, isOn: true, brightness: 100, preset: 'study' },
            },
          };
        }
        return r;
      })
    );

    logActivity(
      isAuto
        ? `⚡ [Tự động thời gian thực ${rule.time}] Thực thi quy tắc "${rule.title}"`
        : `Thực thi thủ công quy tắc "${rule.title}"`,
      'automation',
      rule.targetName
    );
  };

  // USER MANAGEMENT
  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
    setUsers((prev) => [...prev, newUser]);
    logActivity(`Thêm người dùng mới: ${newUser.name} (${newUser.role})`, 'system', 'Hệ thống');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    logActivity(`Cập nhật thông tin người dùng: ${updatedUser.name}`, 'system', 'Hệ thống');
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (target) {
      logActivity(`Xóa tài khoản người dùng: ${target.name}`, 'system', 'Hệ thống');
    }
  };

  const activeAlarmCount = rooms.filter((r) => r.hasFireAlarm || r.smokeLevel > 300).length;
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-orange-500 selection:text-slate-950">
      {/* Toast Alert Banner if active critical alert */}
      {toastAlert && (
        <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce border-2 border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide">
                CẢNH BÁO: {toastAlert.roomName}
              </p>
              <p className="text-xs text-white/90">{toastAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToastAlert(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast Notification when database syncs */}
      {dbSyncToast && (
        <div className={`fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md ${dbSyncToast.type === 'info' ? 'bg-amber-600 border-amber-400' : 'bg-emerald-600 border-emerald-400/40'} text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 border-2`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide">
                ĐỒNG BỘ SUPABASE DATABASE
              </p>
              <p className="text-xs text-white/95 leading-relaxed">{dbSyncToast.message}</p>
              {dbSyncToast.action && (
                <button
                  onClick={() => {
                    dbSyncToast.action?.onClick();
                    setDbSyncToast(null);
                  }}
                  className="mt-2 px-3 py-1 bg-white text-slate-950 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                >
                  {dbSyncToast.action.label} →
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setDbSyncToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast Notification when auto schedule rule executes */}
      {autoScheduleToast && (
        <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 border-2 border-orange-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 animate-pulse">
              <Zap className="w-5 h-5 text-amber-200 fill-amber-200" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide flex items-center gap-1.5">
                <span>⚡ TỰ ĐỘNG THỰC THI THEO LỊCH</span>
                <span className="text-[11px] font-mono px-1.5 py-0.2 bg-black/30 rounded font-normal">
                  {autoScheduleToast.time}
                </span>
              </p>
              <p className="text-xs text-white/95 font-medium">{autoScheduleToast.title}</p>
              <p className="text-[11px] text-orange-100">{autoScheduleToast.action}</p>
            </div>
          </div>
          <button
            onClick={() => setAutoScheduleToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar + Mobile Bottom Nav */}
        <Navbar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setSelectedRoomId(null); // Return to list if in detail view
          }}
          currentUser={currentUser}
          activeAlarmCount={activeAlarmCount}
          mqttStatus={mqttStatus}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <Header
            currentTab={currentTab}
            currentUser={currentUser}
            allUsers={users}
            onSwitchUser={(u) => setCurrentUser(u)}
            onLogout={() => setCurrentUser(null)}
            onTriggerRandomSmokeAlarm={triggerRandomSmokeAlarm}
            onClearAllAlarms={clearAllAlarms}
            activeAlarmCount={activeAlarmCount}
            mqttStatus={mqttStatus}
            supabaseStatus={supabaseStatus}
            timeInfo={timeInfo}
            onOpenTimeSyncModal={() => setIsTimeModalOpen(true)}
            onOpenSchoolPowerModal={() => setIsSchoolPowerModalOpen(true)}
            poweredOnCount={rooms.filter((r) => r.isPowerOn && !r.emergencyPowerCut).length}
          />

          {/* Main Body View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* If a room is selected, display ROOM DETAIL VIEW (matches Image 1) */}
            {selectedRoom ? (
              <RoomDetailView
                room={selectedRoom}
                onBack={() => setSelectedRoomId(null)}
                onUpdateRoom={handleUpdateRoom}
                onEmergencyCut={handleEmergencyCut}
                onTriggerSmokeForRoom={triggerSmokeForRoom}
                onClearSmokeForRoom={clearSmokeForRoom}
                soundEnabled={settings.soundEnabled}
              />
            ) : (
              <>
                {/* 1. TỔNG QUAN (Dashboard) */}
                {currentTab === 'dashboard' && (
                  <DashboardTab
                    rooms={rooms}
                    alerts={alerts}
                    activities={activities}
                    onSelectRoom={(r) => setSelectedRoomId(r.id)}
                    onNavigateToRooms={() => setCurrentTab('rooms')}
                    onTurnOffEmptyRooms={handleTurnOffEmptyRooms}
                    onResolveAlert={handleResolveAlert}
                    onTriggerRandomSmokeAlarm={triggerRandomSmokeAlarm}
                    onPushToDatabase={handlePushToDatabase}
                    isPushingDb={isPushingDb}
                    onOpenSchoolPowerModal={() => setIsSchoolPowerModalOpen(true)}
                    dbRoomCount={supabaseStatus.dbRoomCount}
                  />
                )}

                {/* 2. DANH SÁCH LỚP HỌC (Rooms) */}
                {currentTab === 'rooms' && (
                  <RoomsTab
                    rooms={rooms}
                    onSelectRoom={(r) => setSelectedRoomId(r.id)}
                    onToggleRoomPower={handleToggleRoomPower}
                    onTriggerSmoke={(roomId, e) => {
                      e.stopPropagation();
                      triggerSmokeForRoom(roomId);
                    }}
                    onOpenSchoolPowerModal={() => setIsSchoolPowerModalOpen(true)}
                    onOpenAddRoomModal={() => setIsAddRoomModalOpen(true)}
                    dbRoomCount={supabaseStatus.dbRoomCount}
                    onPushToDatabase={handlePushToDatabase}
                    onFetchFromDatabase={handleFetchFromDatabase}
                    isSyncingDb={isPushingDb}
                  />
                )}

                {/* 3. LẬP LỊCH (Schedules) */}
                {currentTab === 'schedules' && (
                  <SchedulesTab
                    rules={rules}
                    rooms={rooms}
                    onToggleRule={handleToggleRule}
                    onSaveRule={handleSaveRule}
                    onDeleteRule={handleDeleteRule}
                    onTriggerRuleNow={handleTriggerRuleNow}
                    timeInfo={timeInfo}
                    onOpenTimeSyncModal={() => setIsTimeModalOpen(true)}
                  />
                )}

                {/* 4. CÀI ĐẶT (Settings) */}
                {currentTab === 'settings' && (
                  <SettingsTab
                    settings={settings}
                    onUpdateSettings={(newSettings) => setSettings(newSettings)}
                    users={users}
                    currentUser={currentUser}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    mqttInfo={mqttStatus}
                    supabaseInfo={supabaseStatus}
                    roomsCount={rooms.length}
                    dbRoomCount={supabaseStatus.dbRoomCount}
                    onPushToDatabase={handlePushToDatabase}
                    onFetchFromDatabase={handleFetchFromDatabase}
                    onOpenSqlHelper={() => setIsSqlHelperModalOpen(true)}
                    isPushingDb={isPushingDb}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Real-time Time Synchronization & Simulation Modal */}
      <TimeSyncModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        timeInfo={timeInfo}
        soundEnabled={settings.soundEnabled}
      />

      {/* Master School Power Cut & Restore Modal */}
      <SchoolPowerModal
        isOpen={isSchoolPowerModalOpen}
        onClose={() => setIsSchoolPowerModalOpen(false)}
        rooms={rooms}
        currentUser={currentUser}
        onSchoolWideCut={handleSchoolWidePowerCut}
        onSchoolWideRestore={handleSchoolWidePowerRestore}
      />

      {/* Add New Classroom Modal */}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        onAddRoom={handleAddRoom}
        existingRoomIds={rooms.map((r) => r.id)}
      />

      {/* SQL RLS Setup Helper Modal */}
      <SqlHelperModal
        isOpen={isSqlHelperModalOpen}
        onClose={() => setIsSqlHelperModalOpen(false)}
        projectId={supabaseStatus.projectId}
      />

      {/* Mock Login Screen if logged out */}
      {!currentUser && (
        <LoginModal users={users} onLogin={(u) => setCurrentUser(u)} />
      )}
    </div>
  );
}
