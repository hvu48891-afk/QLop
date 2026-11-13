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
  UserRole,
  ThresholdSettings, 
  ActivityLog,
  DbSensorData,
  DbRelayControl
} from './types';
import { 
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
import { ThemeColorModal } from './components/ThemeColorModal';
import { themeManager } from './utils/themeManager';
import { Flame, Bell, X, ShieldAlert, Clock, Zap, Loader2, AlertCircle, RefreshCw, Database, Terminal, Trash2, Palette } from 'lucide-react';

export default function App() {
  // Navigation & Screen State
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Core Data State - Toàn bộ dữ liệu đọc từ Supabase thật
  const [rooms, setRooms] = useState<Room[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<ThresholdSettings>(INITIAL_SETTINGS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [recentSensorLogs, setRecentSensorLogs] = useState<DbSensorData[]>([]);

  // Trạng thái Loading & Lỗi kết nối Supabase
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Trạng thái xóa phòng học
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<boolean>(false);

  // MQTT Connection Info (phục vụ hiển thị tương thích)
  const [mqttStatus, setMqttStatus] = useState(mqttService.getConnectionInfo());
  // Supabase Database Connection Info
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>(supabaseService.getStatus());
  const [isPushingDb, setIsPushingDb] = useState(false);
  const [dbSyncToast, setDbSyncToast] = useState<{ 
    message: string; 
    type: 'success' | 'info' | 'error'; 
    action?: { label: string; onClick: () => void } 
  } | null>(null);

  // Real-time Synchronized Time State
  const [timeInfo, setTimeInfo] = useState<TimeSyncInfo>(timeSyncService.getTimeInfo());
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isSchoolPowerModalOpen, setIsSchoolPowerModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isSqlHelperModalOpen, setIsSqlHelperModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [autoScheduleToast, setAutoScheduleToast] = useState<{ title: string; time: string; action: string } | null>(null);

  // Theme & Background Color State
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => themeManager.getCurrentThemeId());
  const [customBgColor, setCustomBgColor] = useState<string>(() => themeManager.getCustomColor());
  const [actualBgColor, setActualBgColor] = useState<string>(() => themeManager.getEffectiveBackgroundColor());

  // Keep refs for freshness
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
    supabaseService.updateKnownRooms(rooms);
  }, [rooms]);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Lắng nghe kết quả ghi dữ liệu vào Supabase
  useEffect(() => {
    const unsub = supabaseService.subscribeWriteEvents((evt) => {
      if (evt.success) {
        setDbSyncToast({
          message: `✓ Đã lưu thay đổi vào Supabase (${evt.action})`,
          type: 'success',
        });
        setSupabaseStatus((prev) => ({ ...prev, rlsRestricted: false }));
        setTimeout(() => setDbSyncToast(null), 3500);
      } else if (evt.rlsError) {
        setDbSyncToast({
          message: `⚠️ Lỗi RLS (42501): Supabase đang chặn quyền ghi. Bấm xem lệnh SQL để mở!`,
          type: 'error',
          action: {
            label: 'Mở quyền SQL',
            onClick: () => setIsSqlHelperModalOpen(true),
          },
        });
        setSupabaseStatus((prev) => ({ ...prev, rlsRestricted: true }));
      } else {
        setDbSyncToast({
          message: `Lỗi ghi Supabase: ${evt.error}`,
          type: 'error',
        });
        setTimeout(() => setDbSyncToast(null), 5000);
      }
    });
    return unsub;
  }, []);

  // Theo dõi các phòng đang trong trạng thái cảnh báo vượt ngưỡng để tránh ghi log lặp lại liên tục
  const activeAlertRoomsRef = useRef<Set<string>>(new Set());

  // Track executed rules by minute to prevent repeated triggers
  const executedMinutesRef = useRef<Record<string, boolean>>({});

  // 1. TẢI DỮ LIỆU BAN ĐẦU TỪ SUPABASE THẬT
  const loadAllSupabaseData = async () => {
    setIsLoading(true);
    setSupabaseError(null);
    try {
      // Kiểm tra kết nối
      const status = await supabaseService.checkConnection();
      setSupabaseStatus(status);

      // Tải song song các bảng dữ liệu
      const [fetchedRooms, fetchedAlerts, fetchedSchedules, fetchedSettings, fetchedProfiles, fetchedSensors] = await Promise.all([
        supabaseService.fetchRooms(),
        supabaseService.fetchAlerts(),
        supabaseService.fetchSchedules(),
        supabaseService.fetchSettings(),
        supabaseService.fetchProfiles(),
        supabaseService.fetchRecentSensorData(25),
      ]);

      setRooms(fetchedRooms);
      setSupabaseStatus(prev => ({ ...prev, dbRoomCount: fetchedRooms.length }));
      setRecentSensorLogs(fetchedSensors || []);

      const cleanAlerts = fetchedAlerts.filter(
        (a) => !a.message.toLowerCase().includes('phòng này đã ngắt điện') &&
               !a.message.toLowerCase().includes('cảm biến khói phát hiện nồng độ vượt ngưỡng (25 ppm') &&
               !a.message.toLowerCase().includes('[test') &&
               !a.message.toLowerCase().includes('test cảnh báo')
      );
      setAlerts(cleanAlerts);
      setRules(fetchedSchedules);
      if (fetchedSettings) {
        setSettings(fetchedSettings);
      }
      setUsers(fetchedProfiles);

      // Phục hồi phiên đăng nhập nếu người dùng đã đăng nhập trước đó
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('smart_classroom_user_id') : null;
      if (savedUserId) {
        const matched = fetchedProfiles.find((p) => p.id === savedUserId);
        if (matched) {
          setCurrentUser(matched);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }

      // Khởi tạo activeAlertRoomsRef cho các phòng đang alert
      fetchedRooms.forEach(r => {
        if (r.status === 'alert') {
          activeAlertRoomsRef.current.add(r.code);
        }
      });

    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến cơ sở dữ liệu Supabase';
      console.error('[App loadAllSupabaseData] Lỗi tải dữ liệu Supabase:', err);
      setSupabaseError(msg);
      setDbSyncToast({
        message: `Lỗi kết nối Supabase: ${msg}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSupabaseData();
  }, []);

  // 2. SUPABASE REALTIME SUBSCRIPTION (postgres_changes)
  // Tự động nhận dữ liệu thay đổi từ mạch phần cứng hoặc người dùng khác
  useEffect(() => {
    const unsubscribe = supabaseService.subscribeRealtime(
      (updatedRoom: Room) => {
        setRooms((prev) => {
          const index = prev.findIndex((r) => r.code === updatedRoom.code);
          if (index >= 0) {
            const next = [...prev];
            const existing = next[index];
            next[index] = existing.relayControl
              ? supabaseService.mergeRelayControlToRoom(updatedRoom, existing.relayControl)
              : updatedRoom;
            return next;
          }
          return [...prev, updatedRoom];
        });
      },
      (newAlert: AlertLog) => {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === newAlert.id || a.message === newAlert.message)) return prev;
          return [newAlert, ...prev];
        });
        if (settingsRef.current.soundEnabled) {
          soundManager.playAlarm();
        }
      },
      (sensorData) => {
        // Lưu vào danh sách telemetry logs gần nhất (bảng sensor_data)
        setRecentSensorLogs((prev) => [sensorData, ...prev.filter((s) => s.id !== sensorData.id)].slice(0, 25));

        // Cập nhật tức thì dữ liệu cảm biến thực tế từ bảng sensor_data
        setRooms((prev) => {
          return prev.map((r) => {
            if (r.code === sensorData.room_code || (!sensorData.room_code && r.code === 'A201')) {
              return supabaseService.mergeSensorDataToRoom(r, sensorData);
            }
            return r;
          });
        });

        // Chỉ tạo cảnh báo thực tế khi cảm biến trong bảng sensor_data phát hiện Lửa hoặc Khí gas
        const luaStr = String(sensorData.lua || '').trim().toLowerCase();
        const isFlame = luaStr === 'co' || luaStr === 'có' || luaStr === 'true' || luaStr === '1';
        const gasVal = Number(sensorData.gas) || 0;
        if (isFlame) {
          const flameAlert: AlertLog = {
            id: `sensor-flame-${sensorData.id}`,
            roomId: sensorData.room_code || 'A201',
            roomName: `Phòng ${sensorData.room_code || 'A201'}`,
            building: 'Tòa A',
            type: 'fire',
            message: `Phát hiện lửa tại phòng ${sensorData.room_code || 'A201'}`,
            severity: 'critical',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isResolved: false,
            createdAt: sensorData.created_at,
          };
          setAlerts((prev) => [flameAlert, ...prev.filter((a) => a.id !== flameAlert.id)]);
          if (settingsRef.current.soundEnabled) {
            soundManager.playFireSiren();
          }
        } else if (gasVal > 15) {
          const gasAlert: AlertLog = {
            id: `sensor-gas-${sensorData.id}`,
            roomId: sensorData.room_code || 'A201',
            roomName: `Phòng ${sensorData.room_code || 'A201'}`,
            building: 'Tòa A',
            type: 'gas',
            message: `Khí gas phòng ${sensorData.room_code || 'A201'} vượt ngưỡng: ${gasVal}%`,
            severity: 'critical',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isResolved: false,
            createdAt: sensorData.created_at,
          };
          setAlerts((prev) => [gasAlert, ...prev.filter((a) => a.id !== gasAlert.id)]);
          if (settingsRef.current.soundEnabled) {
            soundManager.playAlarm();
          }
        }
      },
      (rc: DbRelayControl) => {
        setRooms((prev) =>
          prev.map((r) =>
            r.code === rc.room_code || (!rc.room_code && r.code === 'A201')
              ? supabaseService.mergeRelayControlToRoom(r, rc)
              : r
          )
        );
      },
      async () => {
        const latestSchedules = await supabaseService.fetchSchedules();
        setRules(latestSchedules);
      },
      async () => {
        const latestSettings = await supabaseService.fetchSettings();
        if (latestSettings) setSettings(latestSettings);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 3. KIỂM TRA MẤT KẾT NỐI (Nếu updated_at cũ hơn 30 giây)
  useEffect(() => {
    const connectionChecker = setInterval(() => {
      const now = Date.now();
      setRooms((prev) => {
        let changed = false;
        const next = prev.map((r) => {
          if (!r.updatedAt) return r;
          const updatedTime = new Date(r.updatedAt).getTime();
          const isDisconnected = !isNaN(updatedTime) && (now - updatedTime > 30000);
          if (r.isDisconnected !== isDisconnected) {
            changed = true;
            return {
              ...r,
              isDisconnected,
              lastUpdated: isDisconnected ? 'Mất kết nối (>30s)' : 'Trực tuyến (Realtime)',
            };
          }
          return r;
        });
        return changed ? next : prev;
      });
    }, 5000);

    return () => clearInterval(connectionChecker);
  }, []);

  // 4. ĐỒNG BỘ ĐỊNH KỲ DỮ LIỆU CẢM BIẾN (sensor_data) VÀ BẢNG LỆNH RƠ-LE (relay_control)
  useEffect(() => {
    const sensorPoller = setInterval(async () => {
      try {
        const [sensors, relayControls] = await Promise.all([
          supabaseService.fetchRecentSensorData(15),
          supabaseService.fetchRelayControls(),
        ]);

        if (sensors && sensors.length > 0) {
          setRecentSensorLogs((prev) => {
            const map = new Map<number, DbSensorData>();
            sensors.forEach((s) => map.set(s.id, s));
            prev.forEach((s) => {
              if (!map.has(s.id)) map.set(s.id, s);
            });
            return Array.from(map.values()).slice(0, 25);
          });
        }

        // Cập nhật thông số cảm biến & phản hồi relay_control mới nhất cho các phòng
        setRooms((prev) =>
          prev.map((r) => {
            let nextRoom = r;
            if (sensors && sensors.length > 0) {
              const matchedSensor = sensors.find((s) => s.room_code === r.code || (!s.room_code && r.code === 'A201'));
              if (matchedSensor) {
                nextRoom = supabaseService.mergeSensorDataToRoom(nextRoom, matchedSensor);
              }
            }
            if (relayControls && relayControls.length > 0) {
              const matchedRc = relayControls.find((rc) => rc.room_code === r.code || (!rc.room_code && r.code === 'A201'));
              if (matchedRc) {
                nextRoom = supabaseService.mergeRelayControlToRoom(nextRoom, matchedRc);
              }
            }
            return nextRoom;
          })
        );
      } catch (e) {
        // Bỏ qua lỗi ngắt quãng mạng nền
      }
    }, 6000);

    return () => clearInterval(sensorPoller);
  }, []);

  // 5. ĐỒNG BỘ THỜI GIAN THẬT & TỰ ĐỘNG HÓA LẬP LỊCH
  useEffect(() => {
    const unsubscribeTime = timeSyncService.subscribe((currentTime, info) => {
      setTimeInfo(info);

      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      const currentHHmm = `${hours}:${minutes}`;
      const currentDayOfWeek = currentTime.getDay(); // 0=CN..6=T7

      const activeRules = rulesRef.current;
      activeRules.forEach((rule) => {
        if (!rule.isEnabled) return;
        if (!rule.daysOfWeek.includes(currentDayOfWeek)) return;
        if (rule.time !== currentHHmm) return;

        const triggerKey = `${rule.id}-${currentHHmm}-${currentTime.getDate()}`;
        if (executedMinutesRef.current[triggerKey]) return;

        executedMinutesRef.current[triggerKey] = true;
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

  // Toast Alert Banner nếu có phòng đang báo động đỏ
  const activeCriticalRoom = rooms.find((r) => r.status === 'alert' || r.hasFireAlarm || r.smokeLevel >= settings.smokeThreshold);

  // HELPER GHI ACTIVITY LOG
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
  };

  // CẬP NHẬT CHI TIẾT PHÒNG HỌC (GỌI UPDATE BẢNG ROOMS VÀ ĐỒNG BỘ BẢNG RELAY_CONTROL)
  const handleUpdateRoom = async (updated: Room) => {
    const prevRoom = roomsRef.current.find((r) => r.code === updated.code || r.id === updated.id);
    const roomCode = updated.code || updated.id;

    roomsRef.current = roomsRef.current.map((r) => (r.code === roomCode ? updated : r));
    setRooms((prev) => prev.map((r) => (r.code === roomCode ? updated : r)));

    const relaysChanged =
      !prevRoom ||
      prevRoom.devices.light.isOn !== updated.devices.light.isOn ||
      prevRoom.devices.fan.isOn !== updated.devices.fan.isOn ||
      prevRoom.devices.projector.isOn !== updated.devices.projector.isOn ||
      prevRoom.devices.ac.isOn !== updated.devices.ac.isOn ||
      prevRoom.relayAlarm !== updated.relayAlarm;

    if (relaysChanged) {
      const rcRes = await supabaseService.updateRelayControl(roomCode, {
        relay1_den: updated.devices.light.isOn,
        relay2_quat: updated.devices.fan.isOn,
        relay3_maychieu: updated.devices.projector.isOn,
        relay4_dieuhoa: updated.devices.ac.isOn,
        khan_cap: updated.relayAlarm,
        auto_mode: false,
      });
      if (rcRes.row) {
        setRooms((prev) =>
          prev.map((r) => (r.code === roomCode ? supabaseService.mergeRelayControlToRoom(r, rcRes.row!) : r))
        );
      }
    }

    // Cập nhật lên Supabase theo đúng các cột trong bảng rooms
    await supabaseService.updateRoom(roomCode, {
      power_on: updated.isPowerOn,
      status: updated.hasFireAlarm ? 'alert' : updated.isPowerOn ? 'on' : 'off',
      light_on: updated.devices.light.isOn,
      light_mode: updated.devices.light.preset,
      ac_on: updated.devices.ac.isOn,
      ac_temp: updated.devices.ac.targetTemp,
      ac_mode: updated.devices.ac.mode,
      projector_on: updated.devices.projector.isOn,
      fan_on: updated.devices.fan.isOn,
      relay_alarm: updated.relayAlarm,
    });

    logActivity(`Cập nhật trạng thái thiết bị ${updated.name}`, roomCode, updated.name);
  };

  // THAO TÁC BẬT / TẮT TRỰC TIẾP CÁC RƠ-LE TRONG BẢNG relay_control (RELAY 1, 2, 3, 4, KHẨN CẤP, AUTO MODE, CẦU DAO)
  const handleToggleRelay = async (
    roomCode: string,
    relayType: 'relay1_den' | 'relay2_quat' | 'relay3_maychieu' | 'relay4_dieuhoa' | 'relay_alarm' | 'power_on' | 'auto_mode' | 'khan_cap',
    customState?: boolean
  ) => {
    const targetRoom = roomsRef.current.find((r) => r.code === roomCode || r.id === roomCode);
    if (!targetRoom) return;

    const targetCode = targetRoom.code || targetRoom.id;
    let newState: boolean;
    const updatedDevices = { ...targetRoom.devices };
    let newPowerOn = targetRoom.isPowerOn;
    let newRelayAlarm = targetRoom.relayAlarm;
    const currentAutoMode = targetRoom.relayControl?.auto_mode ?? false;
    let nextAutoMode = false; // Mặc định khi bấm tay sẽ chuyển auto_mode = false
    let label = '';

    if (relayType === 'relay1_den') {
      newState = customState !== undefined ? customState : !targetRoom.devices.light.isOn;
      updatedDevices.light = {
        ...updatedDevices.light,
        isOn: newState,
        brightness: newState ? (updatedDevices.light.brightness || 85) : 0,
        preset: newState ? (updatedDevices.light.preset === 'off' ? 'study' : updatedDevices.light.preset) : 'off',
      };
      label = `Relay 1 (Đèn): ${newState ? 'BẬT' : 'TẮT'}`;
    } else if (relayType === 'relay2_quat') {
      newState = customState !== undefined ? customState : !targetRoom.devices.fan.isOn;
      updatedDevices.fan = {
        ...updatedDevices.fan,
        isOn: newState,
        speed: newState ? (updatedDevices.fan.speed || 2) : 0,
      };
      label = `Relay 2 (Quạt): ${newState ? 'BẬT' : 'TẮT'}`;
    } else if (relayType === 'relay3_maychieu') {
      newState = customState !== undefined ? customState : !targetRoom.devices.projector.isOn;
      updatedDevices.projector = {
        ...updatedDevices.projector,
        isOn: newState,
      };
      label = `Relay 3 (Máy chiếu): ${newState ? 'BẬT' : 'TẮT'}`;
    } else if (relayType === 'relay4_dieuhoa') {
      newState = customState !== undefined ? customState : !targetRoom.devices.ac.isOn;
      updatedDevices.ac = {
        ...updatedDevices.ac,
        isOn: newState,
      };
      label = `Relay 4 (Điều hòa): ${newState ? 'BẬT' : 'TẮT'}`;
    } else if (relayType === 'relay_alarm' || relayType === 'khan_cap') {
      newState = customState !== undefined ? customState : !(targetRoom.relayControl?.khan_cap ?? targetRoom.relayAlarm);
      newRelayAlarm = newState;
      nextAutoMode = currentAutoMode;
      label = `Khẩn cấp / Còi Báo Động: ${newState ? 'BẬT' : 'TẮT'}`;
    } else if (relayType === 'auto_mode') {
      newState = customState !== undefined ? customState : !currentAutoMode;
      nextAutoMode = newState;
      label = `Chế độ Auto (relay_control): ${newState ? 'TỰ ĐỘNG' : 'THỦ CÔNG'}`;
    } else if (relayType === 'power_on') {
      newState = customState !== undefined ? customState : !targetRoom.isPowerOn;
      newPowerOn = newState;
      if (!newState) {
        updatedDevices.light = { ...updatedDevices.light, isOn: false, brightness: 0, preset: 'off' };
        updatedDevices.fan = { ...updatedDevices.fan, isOn: false, speed: 0 };
        updatedDevices.projector = { ...updatedDevices.projector, isOn: false };
        updatedDevices.ac = { ...updatedDevices.ac, isOn: false };
      } else {
        nextAutoMode = currentAutoMode;
      }
      label = `Cầu dao nguồn: ${newState ? 'BẬT' : 'TẮT'}`;
    } else {
      return;
    }

    if (settings.soundEnabled) soundManager.playSwitch(newState);

    const optimisticRc: DbRelayControl = {
      id: targetRoom.relayControl?.id ?? 0,
      room_code: targetCode,
      auto_mode: nextAutoMode,
      relay1_den: updatedDevices.light.isOn,
      relay2_quat: updatedDevices.fan.isOn,
      relay3_maychieu: updatedDevices.projector.isOn,
      relay4_dieuhoa: updatedDevices.ac.isOn,
      khan_cap: newRelayAlarm,
      updated_at: new Date().toISOString(),
      state_relay1_den: targetRoom.relayControl?.state_relay1_den ?? false,
      state_relay2_quat: targetRoom.relayControl?.state_relay2_quat ?? false,
      state_relay3_maychieu: targetRoom.relayControl?.state_relay3_maychieu ?? false,
      state_relay4_dieuhoa: targetRoom.relayControl?.state_relay4_dieuhoa ?? false,
      state_updated_at: targetRoom.relayControl?.state_updated_at,
    };

    const updatedRoom: Room = {
      ...targetRoom,
      devices: updatedDevices,
      isPowerOn: newPowerOn,
      relayAlarm: newRelayAlarm,
      relayControl: optimisticRc,
      status: targetRoom.hasFireAlarm ? 'alert' : newPowerOn ? 'on' : 'off',
      lastUpdated: 'Vừa xong',
      updatedAt: new Date().toISOString(),
    };

    // Cập nhật UI tức thì 0ms và đồng bộ ref tránh race-condition khi bấm liên tiếp
    roomsRef.current = roomsRef.current.map((r) => (r.code === targetCode ? updatedRoom : r));
    setRooms((prev) => prev.map((r) => (r.code === targetCode ? updatedRoom : r)));

    // Ghi đồng bộ vào bảng relay_control và bảng rooms trên Supabase
    const { roomUpdated, relayControlRow } = await supabaseService.toggleRelay(
      targetCode,
      relayType,
      newState
    );

    if (relayControlRow) {
      setRooms((prev) =>
        prev.map((r) => (r.code === targetCode ? supabaseService.mergeRelayControlToRoom(r, relayControlRow) : r))
      );
    }

    if (roomUpdated) {
      logActivity(`[relay_control] ${label} phòng ${targetRoom.name}`, targetCode, targetRoom.name);
      setDbSyncToast({
        message: `✓ Đã cập nhật ${label} vào bảng relay_control!`,
        type: 'success',
      });
      setTimeout(() => setDbSyncToast(null), 3000);
    } else {
      // Khôi phục lại trạng thái cũ nếu ghi Database thất bại
      roomsRef.current = roomsRef.current.map((r) => (r.code === targetCode ? targetRoom : r));
      setRooms((prev) => prev.map((r) => (r.code === targetCode ? targetRoom : r)));
    }
  };

  // BẬT / TẮT NGUỒN ĐIỆN PHÒNG (CẬP NHẬT CỘT power_on VỚI .eq('code', ...))
  const handleToggleRoomPower = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = roomsRef.current.find((r) => r.id === roomId || r.code === roomId);
    if (!target) return;

    const targetCode = target.code || target.id;
    const newState = !target.isPowerOn;
    if (settings.soundEnabled) {
      soundManager.playSwitch(newState);
    }

    const updatedRoom: Room = {
      ...target,
      isPowerOn: newState,
      status: newState ? 'on' : 'off',
      emergencyPowerCut: false,
      devices: newState
        ? target.devices
        : {
            ...target.devices,
            light: { ...target.devices.light, isOn: false, brightness: 0, preset: 'off' },
            ac: { ...target.devices.ac, isOn: false },
            projector: { ...target.devices.projector, isOn: false },
            fan: { ...target.devices.fan, isOn: false, speed: 0 },
          },
      relayControl:
        !newState && target.relayControl
          ? {
              ...target.relayControl,
              relay1_den: false,
              relay2_quat: false,
              relay3_maychieu: false,
              relay4_dieuhoa: false,
              auto_mode: false,
            }
          : target.relayControl,
      lastUpdated: 'Vừa xong',
    };

    roomsRef.current = roomsRef.current.map((r) => (r.code === targetCode ? updatedRoom : r));
    setRooms((prev) => prev.map((r) => (r.code === targetCode ? updatedRoom : r)));

    await supabaseService.updatePower(targetCode, newState);
    logActivity(`${newState ? 'Bật nguồn điện' : 'Tắt nguồn điện'} ${target.name}`, targetCode, target.name);
  };

  // CÔNG TẮC KHẨN CẤP / CẮT NGUỒN ĐIỆN (CẬP NHẬT power_on & relay_control)
  const handleEmergencyCut = async (roomId: string, cutOff: boolean) => {
    const target = roomsRef.current.find((r) => r.id === roomId || r.code === roomId);
    if (!target) return;

    const targetCode = target.code || target.id;
    const powerState = !cutOff;
    if (settings.soundEnabled) {
      soundManager.playSwitch(powerState);
    }

    const updatedRoom: Room = {
      ...target,
      emergencyPowerCut: false,
      isPowerOn: powerState,
      status: powerState ? 'on' : 'off',
      devices: powerState
        ? target.devices
        : {
            ...target.devices,
            light: { ...target.devices.light, isOn: false, brightness: 0, preset: 'off' },
            ac: { ...target.devices.ac, isOn: false },
            projector: { ...target.devices.projector, isOn: false },
            fan: { ...target.devices.fan, isOn: false, speed: 0 },
          },
      relayControl:
        !powerState && target.relayControl
          ? {
              ...target.relayControl,
              relay1_den: false,
              relay2_quat: false,
              relay3_maychieu: false,
              relay4_dieuhoa: false,
              auto_mode: false,
            }
          : target.relayControl,
      lastUpdated: 'Vừa xong',
    };

    roomsRef.current = roomsRef.current.map((r) => (r.code === targetCode ? updatedRoom : r));
    setRooms((prev) => prev.map((r) => (r.code === targetCode ? updatedRoom : r)));

    await supabaseService.updatePower(targetCode, powerState);

    logActivity(
      cutOff ? `Tắt nguồn điện ${target.name}` : `Bật nguồn điện ${target.name}`,
      targetCode,
      target.name
    );
  };

  // CẮT / TẮT ĐIỆN TOÀN TRƯỜNG
  const handleSchoolWidePowerCut = async (mode: 'emergency' | 'soft') => {
    const isEmergency = mode === 'emergency';
    const updatedRooms = rooms.map((r) => ({
      ...r,
      isPowerOn: false,
      status: 'off' as const,
      emergencyPowerCut: isEmergency,
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

    // Cập nhật tất cả các phòng trên Supabase
    rooms.forEach((r) => {
      supabaseService.updatePower(r.code, false);
    });

    if (isEmergency) {
      if (settings.soundEnabled) {
        soundManager.playEmergencyCut();
      }
      const newAlert = await supabaseService.insertAlert({
        room_code: 'ALL',
        type: 'power_leak',
        message: `🚨 [CẦU DAO TỔNG] Đã ngắt điện khẩn cấp toàn trường (${rooms.length} phòng học) bởi ${currentUser?.name || 'Giám thị'}!`,
        level: 'critical',
      });
      if (newAlert) {
        setAlerts((prev) => [newAlert, ...prev]);
      }
      logActivity(`🚨 CẮT ĐIỆN KHẨN CẤP TOÀN TRƯỜNG (${rooms.length} phòng học)`, 'ALL', 'Toàn trường');
      setDbSyncToast({
        message: `ĐÃ CẮT ĐIỆN KHẨN CẤP TOÀN BỘ ${rooms.length} PHÒNG HỌC!`,
        type: 'error',
      });
    } else {
      if (settings.soundEnabled) {
        soundManager.playSwitch(false);
      }
      logActivity(`Đã tắt toàn bộ thiết bị điện toàn trường (${rooms.length} phòng học) - Giờ nghỉ`, 'ALL', 'Toàn trường');
      setDbSyncToast({
        message: `Đã tắt thiết bị điện toàn trường thành công!`,
        type: 'success',
      });
    }
    setTimeout(() => setDbSyncToast(null), 4000);
  };

  // KHÔI PHỤC ĐIỆN TOÀN TRƯỜNG
  const handleSchoolWidePowerRestore = async () => {
    const updatedRooms = rooms.map((r) => ({
      ...r,
      isPowerOn: true,
      status: 'on' as const,
      emergencyPowerCut: false,
      lastUpdated: 'Vừa xong',
    }));

    setRooms(updatedRooms);

    rooms.forEach((r) => {
      supabaseService.updatePower(r.code, true);
    });

    if (settings.soundEnabled) soundManager.playSwitch(true);

    logActivity(`⚡ Khôi phục nguồn điện an toàn cho toàn bộ ${rooms.length} phòng học`, 'ALL', 'Toàn trường');
    setDbSyncToast({
      message: `Đã cấp điện an toàn cho toàn bộ phòng học!`,
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 4000);
  };

  // ĐỒNG BỘ ĐẨY DỮ LIỆU LÊN SUPABASE
  const handlePushAllToDatabase = async () => {
    setIsPushingDb(true);
    const result = await supabaseService.syncAllToDatabase(rooms);
    if (result.success) {
      setDbSyncToast({
        message: `Đã đồng bộ thành công ${rooms.length} phòng học vào Database Supabase!`,
        type: 'success',
      });
      loadAllSupabaseData();
    } else {
      setDbSyncToast({
        message: `Không thể đẩy dữ liệu lên Database (${result.error || 'RLS đang chặn'}). Hãy mở lệnh SQL RLS để cấp quyền!`,
        type: 'info',
        action: {
          label: 'Xem lệnh SQL',
          onClick: () => setIsSqlHelperModalOpen(true),
        },
      });
    }
    setIsPushingDb(false);
    setTimeout(() => setDbSyncToast(null), 5000);
  };

  // XÓA PHÒNG HỌC (XÓA KHỎI UI & DATABASE SUPABASE)
  const handleRequestDeleteRoom = (roomIdOrCode: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentUser?.role !== 'admin') {
      setDbSyncToast({
        message: 'Quyền bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền xóa phòng học!',
        type: 'error',
      });
      setTimeout(() => setDbSyncToast(null), 4000);
      return;
    }
    const target = rooms.find((r) => r.code === roomIdOrCode || r.id === roomIdOrCode);
    if (target) {
      setRoomToDelete(target);
    }
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    if (currentUser?.role !== 'admin') {
      setDbSyncToast({
        message: 'Quyền bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền xóa phòng học!',
        type: 'error',
      });
      setTimeout(() => setDbSyncToast(null), 4000);
      setRoomToDelete(null);
      return;
    }
    const target = roomToDelete;
    const targetCode = target.code || target.id;
    const targetName = target.name;
    setIsDeletingRoom(true);

    // 1. Cập nhật state UI ngay lập tức
    setRooms((prev) => prev.filter((r) => r.code !== targetCode && r.id !== targetCode));
    if (selectedRoomId === targetCode || selectedRoomId === target.id) {
      setSelectedRoomId(null);
    }
    setRoomToDelete(null);

    // 2. Gọi Supabase xóa khỏi bảng rooms và alerts
    const result = await supabaseService.deleteRoom(targetCode);
    setIsDeletingRoom(false);

    if (result.success) {
      setDbSyncToast({
        message: `✓ Đã xóa thành công ${targetName} khỏi Database Supabase!`,
        type: 'success',
      });
      logActivity(`Xóa vĩnh viễn phòng ${targetName} khỏi hệ thống`, targetCode, targetName);
    } else {
      setDbSyncToast({
        message: `Lỗi xóa phòng trên Supabase: ${result.error}`,
        type: 'error',
      });
      // Tải lại dữ liệu nếu xóa thất bại
      loadAllSupabaseData();
    }
    setTimeout(() => setDbSyncToast(null), 4000);
  };

  // TẮT ĐIỆN PHÒNG TRỐNG
  const handleTurnOffEmptyRooms = () => {
    const emptyPoweredRooms = rooms.filter((r) => r.status === 'off' || (!r.isOccupied && r.isPowerOn));
    emptyPoweredRooms.forEach((r) => {
      supabaseService.updatePower(r.code, false);
    });

    setRooms((prev) =>
      prev.map((r) => {
        if (!r.isOccupied && r.isPowerOn) {
          return {
            ...r,
            isPowerOn: false,
            status: 'off',
            devices: {
              ...r.devices,
              light: { ...r.devices.light, isOn: false },
              ac: { ...r.devices.ac, isOn: false },
              projector: { ...r.devices.projector, isOn: false },
              fan: { ...r.devices.fan, isOn: false },
            },
          };
        }
        return r;
      })
    );

    if (settings.soundEnabled) soundManager.playSwitch(false);
    logActivity(`Tắt điện ${emptyPoweredRooms.length} phòng trống`, 'MULTIPLE', 'Nhiều phòng');
  };

  // XÁC NHẬN GIẢI QUYẾT CẢNH BÁO
  const handleResolveAlert = async (alertId: string) => {
    const resolvedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const targetAlert = alerts.find((a) => a.id === alertId);

    // 1. Cập nhật ngay local state
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, isResolved: true, resolvedAt: resolvedTime }
          : a
      )
    );

    // 2. Xóa khỏi bảng alerts trong Supabase
    await supabaseService.deleteAlert(alertId);

    // 3. Nếu không còn cảnh báo chưa giải quyết nào cho phòng này, đưa phòng về an toàn
    if (targetAlert) {
      const roomCode = targetAlert.roomId;
      const remainingRoomAlerts = alerts.filter(
        (a) => a.roomId === roomCode && a.id !== alertId && !a.isResolved
      );

      if (remainingRoomAlerts.length === 0) {
        const targetRoom = rooms.find((r) => r.code === roomCode || r.id === roomCode);
        if (targetRoom) {
          activeAlertRoomsRef.current.delete(roomCode);
          setRooms((prev) =>
            prev.map((r) =>
              r.code === targetRoom.code || r.id === targetRoom.id
                ? {
                    ...r,
                    status: r.isPowerOn ? 'on' : 'off',
                    hasFireAlarm: false,
                    smokeLevel: 0,
                    flame: false,
                    relayAlarm: false,
                  }
                : r
            )
          );
          await supabaseService.setRoomAlert(targetRoom.code, false, targetRoom.isPowerOn, 0);
        }
      }
    }

    setDbSyncToast({
      message: '✓ Đã xác nhận an toàn và đồng bộ vào Database Supabase!',
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 3000);
  };

  // ĐỒNG BỘ LẠI CẢNH BÁO TỪ DATABASE VÀ BẢNG SENSOR_DATA
  const handleSyncAlerts = async () => {
    setDbSyncToast({
      message: 'Đang đồng bộ cảnh báo với Database Supabase...',
      type: 'info',
    });
    try {
      const [fetchedAlerts, fetchedSensors, fetchedRooms] = await Promise.all([
        supabaseService.fetchAlerts(),
        supabaseService.fetchRecentSensorData(25),
        supabaseService.fetchRooms(),
      ]);

      setRecentSensorLogs(fetchedSensors || []);

      // Lấy bản ghi sensor mới nhất theo từng phòng
      const latestSensorByRoom: Record<string, any> = {};
      fetchedSensors.forEach((s) => {
        const code = s.room_code || 'A201';
        if (!latestSensorByRoom[code]) {
          latestSensorByRoom[code] = s;
        }
      });

      // Kiểm tra tính nhất quán giữa phòng trong Database và cảm biến
      for (const room of fetchedRooms) {
        const latestSensor = latestSensorByRoom[room.code];
        const luaStr = String(latestSensor?.lua || '').trim().toLowerCase();
        const hasSensorFlame = luaStr === 'co' || luaStr === 'có' || luaStr === 'true' || luaStr === '1';
        const sensorGas = Number(latestSensor?.gas) || 0;
        const isSensorDangerous = hasSensorFlame || sensorGas > 25;

        // Nếu phòng trong DB đang ở trạng thái alert hoặc flame/relay_alarm nhưng sensor bình thường:
        if ((room.status === 'alert' || room.flame || room.relayAlarm) && !isSensorDangerous) {
          await supabaseService.setRoomAlert(room.code, false, room.isPowerOn, 0);
          await supabaseService.clearAlertsForRoom(room.code);
        }
      }

      // Tải lại rooms và alerts mới nhất sau khi tự động chuẩn hóa
      const [finalRooms, finalAlerts] = await Promise.all([
        supabaseService.fetchRooms(),
        supabaseService.fetchAlerts(),
      ]);

      const cleanAlerts = finalAlerts.filter(
        (a) => !a.message.toLowerCase().includes('phòng này đã ngắt điện') &&
               !a.message.toLowerCase().includes('cảm biến khói phát hiện nồng độ vượt ngưỡng (25 ppm') &&
               !a.message.toLowerCase().includes('[test') &&
               !a.message.toLowerCase().includes('test cảnh báo')
      );

      setRooms(finalRooms);
      setAlerts(cleanAlerts);
      activeAlertRoomsRef.current.clear();
      finalRooms.forEach((r) => {
        if (r.status === 'alert') activeAlertRoomsRef.current.add(r.code);
      });

      setDbSyncToast({
        message: `✓ Đã đồng bộ cảnh báo thành công (${cleanAlerts.filter((a) => !a.isResolved).length} cảnh báo đang kích hoạt)!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('[handleSyncAlerts] Lỗi đồng bộ cảnh báo:', err);
      setDbSyncToast({
        message: `Lỗi đồng bộ cảnh báo: ${err?.message || 'Không thể kết nối Supabase'}`,
        type: 'error',
      });
    }
    setTimeout(() => setDbSyncToast(null), 3500);
  };

  // TẮT TẤT CẢ CÁC CẢNH BÁO / ĐẶT LẠI CẢM BIẾN AN TOÀN
  const handleClearAllAlarms = async () => {
    // 1. Xóa toàn bộ cảnh báo trong bảng alerts của Supabase
    await supabaseService.clearAllAlerts();

    // 2. Đặt lại tất cả các phòng trên Supabase
    for (const r of rooms) {
      if (r.status === 'alert' || r.hasFireAlarm || r.smokeLevel > 0 || r.flame || r.relayAlarm) {
        await supabaseService.setRoomAlert(r.code, false, r.isPowerOn, 0);
      }
    }

    // 3. Cập nhật state phòng trên web
    setRooms((prev) =>
      prev.map((r) =>
        r.status === 'alert' || r.hasFireAlarm || r.flame || r.relayAlarm || r.smokeLevel > 0
          ? {
              ...r,
              status: r.isPowerOn ? 'on' : 'off',
              hasFireAlarm: false,
              smokeLevel: 0,
              flame: false,
              relayAlarm: false,
              temperature: Math.min(r.temperature, 26),
              lastUpdated: 'Vừa xong',
            }
          : r
      )
    );

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) => (a.isResolved ? a : { ...a, isResolved: true, resolvedAt: nowTime }))
    );

    activeAlertRoomsRef.current.clear();

    if (settings.soundEnabled) {
      soundManager.playSwitch(true);
    }

    logActivity('✓ Đã tắt còi và đặt lại toàn bộ cảnh báo về trạng thái an toàn', 'ALL', 'Toàn trường');
    setDbSyncToast({
      message: '✓ Đã xóa sạch cảnh báo và đưa toàn bộ phòng học về an toàn trong Database!',
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 3000);
  };

  // KÍCH HOẠT BÁO CHÁY PHÒNG HỌC (Manual Call Point hoặc Cảm biến khói vượt ngưỡng)
  const handleTriggerFireAlarmForRoom = async (roomCode: string, autoCutPower: boolean = false) => {
    const targetRoom = rooms.find((r) => r.code === roomCode || r.id === roomCode);
    if (!targetRoom) return;

    const newPowerState = autoCutPower ? false : targetRoom.isPowerOn;

    // 1. Cập nhật ngay local state cho phản hồi tức thì 0ms
    setRooms((prev) =>
      prev.map((r) =>
        r.code === targetRoom.code || r.id === targetRoom.id
          ? {
              ...r,
              status: 'alert',
              hasFireAlarm: true,
              smokeLevel: Math.max(r.smokeLevel, 550),
              temperature: Math.max(r.temperature, 42.5),
              isPowerOn: newPowerState,
              emergencyPowerCut: autoCutPower ? true : r.emergencyPowerCut,
              devices: autoCutPower
                ? {
                    ...r.devices,
                    light: { ...r.devices.light, isOn: false },
                    ac: { ...r.devices.ac, isOn: false },
                    projector: { ...r.devices.projector, isOn: false },
                    fan: { ...r.devices.fan, isOn: false },
                  }
                : r.devices,
              lastUpdated: 'Vừa xong',
            }
          : r
      )
    );

    // 2. Phát âm thanh còi hú báo cháy
    if (settings.soundEnabled) {
      soundManager.playFireSiren();
    }

    // 3. Đồng bộ vào Supabase
    await supabaseService.setRoomAlert(targetRoom.code, true, newPowerState, 550);

    // 4. Ghi bản ghi cảnh báo
    const alertMsg = `🚨 BÁO CHÁY KHẨN CẤP tại ${targetRoom.name}! Nồng độ khói 550 ppm. Còi hú đang phát tín hiệu.${
      autoCutPower ? ' Hệ thống đã tự động ngắt điện phòng.' : ''
    }`;
    const newAlert = await supabaseService.insertAlert({
      room_code: targetRoom.code,
      type: 'fire',
      message: alertMsg,
      level: 'critical',
    });

    if (newAlert) {
      setAlerts((prev) => [newAlert, ...prev]);
    }

    logActivity(`🔥 Báo cháy khẩn cấp tại ${targetRoom.name}`, targetRoom.code, targetRoom.name);
    setDbSyncToast({
      message: `🚨 Đang báo cháy tại ${targetRoom.name}! Còi báo động đang kêu.`,
      type: 'error',
    });
  };

  // TẮT BÁO CHÁY & ĐẶT LẠI TRẠNG THÁI AN TOÀN CHO PHÒNG HỌC
  const handleClearFireAlarmForRoom = async (roomCode: string) => {
    const targetRoom = rooms.find((r) => r.code === roomCode || r.id === roomCode);
    if (!targetRoom) return;

    setRooms((prev) =>
      prev.map((r) =>
        r.code === targetRoom.code || r.id === targetRoom.id
          ? {
              ...r,
              status: r.isPowerOn ? 'on' : 'off',
              hasFireAlarm: false,
              smokeLevel: 0,
              flame: false,
              relayAlarm: false,
              temperature: Math.min(r.temperature, 26.5),
              lastUpdated: 'Vừa xong',
            }
          : r
      )
    );

    // Xóa toàn bộ cảnh báo của phòng khỏi bảng alerts và reset bảng rooms trong Supabase
    await supabaseService.clearAlertsForRoom(targetRoom.code);
    await supabaseService.setRoomAlert(targetRoom.code, false, targetRoom.isPowerOn, 0);

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) =>
        (a.roomId === targetRoom.code || a.roomId === targetRoom.id) && !a.isResolved
          ? { ...a, isResolved: true, resolvedAt: nowTime }
          : a
      )
    );

    activeAlertRoomsRef.current.delete(targetRoom.code);

    if (settings.soundEnabled) {
      soundManager.playSwitch(true);
    }

    logActivity(`✓ Đã tắt còi và đặt lại an toàn cho ${targetRoom.name}`, targetRoom.code, targetRoom.name);
    setDbSyncToast({
      message: `Đã khôi phục trạng thái an toàn cho ${targetRoom.name} trong Database!`,
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 3000);
  };

  // QUY TẮC LẬP LỊCH: BẬT/TẮT, THÊM, SỬA, XÓA TRONG BẢNG 'schedules'
  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const newEnabled = !rule.isEnabled;

    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: newEnabled } : r))
    );

    const ok = await supabaseService.toggleScheduleEnabled(ruleId, newEnabled);
    if (ok) {
      logActivity(`${newEnabled ? 'Bật' : 'Tắt'} quy tắc "${rule.title}"`, 'RULE', rule.title);
    } else {
      const fresh = await supabaseService.fetchSchedules();
      setRules(fresh);
    }
  };

  const handleSaveRule = async (savedRule: ScheduleRule) => {
    const exists = rules.some((r) => r.id === savedRule.id);
    if (exists) {
      setRules((prev) => prev.map((r) => (r.id === savedRule.id ? savedRule : r)));
      const ok = await supabaseService.updateSchedule(savedRule.id, {
        name: savedRule.title,
        scope: savedRule.scope,
        target: savedRule.targetId,
        action: savedRule.action,
        run_time: savedRule.time,
        days: savedRule.daysOfWeek,
        enabled: savedRule.isEnabled,
      });
      if (!ok) {
        const fresh = await supabaseService.fetchSchedules();
        setRules(fresh);
        return;
      }
    } else {
      const inserted = await supabaseService.insertSchedule({
        name: savedRule.title,
        scope: savedRule.scope,
        target: savedRule.targetId,
        action: savedRule.action,
        run_time: savedRule.time,
        days: savedRule.daysOfWeek,
        enabled: savedRule.isEnabled,
      });
      if (inserted) {
        setRules((prev) => [inserted, ...prev]);
      } else {
        return;
      }
    }
    logActivity(`Lưu quy tắc "${savedRule.title}" vào Supabase`, 'RULE', savedRule.title);
  };

  const handleDeleteRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    const ok = await supabaseService.deleteSchedule(ruleId);
    if (ok) {
      if (rule) {
        logActivity(`Xóa quy tắc "${rule.title}" khỏi Supabase`, 'RULE', rule.title);
      }
    } else {
      const fresh = await supabaseService.fetchSchedules();
      setRules(fresh);
    }
  };

  // THỰC THI QUY TẮC (ĐỒNG BỘ CẢ relay_control VÀ rooms)
  const handleTriggerRuleNow = async (rule: ScheduleRule, isAuto: boolean = false) => {
    if (settings.soundEnabled) {
      if (isAuto) soundManager.playSwitch(true);
      else soundManager.playClick();
    }

    let targetRooms = roomsRef.current;
    if (rule.scope === 'building') {
      targetRooms = targetRooms.filter((r) => r.building === rule.targetId || r.building.endsWith(rule.targetId));
    } else if (rule.scope === 'room') {
      targetRooms = targetRooms.filter((r) => r.code === rule.targetId || r.id === rule.targetId);
    }

    for (const r of targetRooms) {
      const code = r.code || r.id;
      if (rule.action === 'turn_off_all') {
        await supabaseService.updatePower(code, false);
      } else if (rule.action === 'turn_on_ac') {
        await supabaseService.updateAc(code, true, 24, 'cool');
      } else if (rule.action === 'turn_off_ac_proj') {
        await supabaseService.updateRelayControl(code, {
          relay3_maychieu: false,
          relay4_dieuhoa: false,
          auto_mode: false,
        });
        await supabaseService.updateRoom(code, { ac_on: false, projector_on: false });
      } else if (rule.action === 'mode_study') {
        await supabaseService.updateRelayControl(code, {
          relay1_den: true,
          relay2_quat: true,
          auto_mode: false,
        });
        await supabaseService.updateRoom(code, {
          power_on: true,
          status: 'on',
          light_on: true,
          light_mode: 'study',
          fan_on: true,
        });
      }
    }

    const refreshed = await supabaseService.fetchRooms();
    setRooms(refreshed);

    logActivity(
      isAuto
        ? `⚡ [Tự động thời gian thực ${rule.time}] Thực thi quy tắc "${rule.title}"`
        : `Thực thi thủ công quy tắc "${rule.title}"`,
      'AUTOMATION',
      rule.targetName
    );
  };

  // CẬP NHẬT CÀI ĐẶT: ĐỌC/SỬA temp_threshold & smoke_threshold TRONG BẢNG 'settings' (id = 1)
  const handleUpdateSettings = async (newSettings: ThresholdSettings) => {
    setSettings(newSettings);
    const ok = await supabaseService.updateSettings(newSettings.highTempThreshold, newSettings.smokeThreshold);
    if (ok) {
      logActivity('Cập nhật ngưỡng cảnh báo hệ thống (bảng settings id=1)', 'SYSTEM', 'Cài đặt');
      setDbSyncToast({
        message: 'Đã lưu ngưỡng cảnh báo thành công vào bảng settings!',
        type: 'success',
      });
    } else {
      setDbSyncToast({
        message: 'Không thể lưu cài đặt vào bảng settings (kiểm tra quyền RLS)!',
        type: 'error',
      });
    }
    setTimeout(() => setDbSyncToast(null), 3500);
  };

  // ĐĂNG KÝ VÀ LƯU VÀO DATABASE SUPABASE (BẢNG PROFILES)
  const handleRegisterUser = async (userData: { full_name: string; email: string; role: UserRole; password?: string }): Promise<User | null> => {
    const created = await supabaseService.insertProfile({
      full_name: userData.full_name,
      role: userData.role,
      email: userData.email,
      password: userData.password,
    });
    if (created) {
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === created.id || u.email === created.email);
        if (exists) return prev.map((u) => (u.id === created.id ? created : u));
        return [...prev, created];
      });
      logActivity(`Tạo tài khoản mới [${created.name}] vai trò [${created.role}] vào Supabase`, 'USER', created.name);
      return created;
    }
    return null;
  };

  // THÊM/SỬA/XÓA USER (ĐỒNG BỘ VÀO BẢNG PROFILES SUPABASE)
  const handleAddUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (currentUser?.role !== 'admin') {
      setDbSyncToast({ message: 'Chỉ Quản trị viên (Admin) mới có quyền thêm tài khoản!', type: 'error' });
      return;
    }
    const created = await supabaseService.insertProfile({
      full_name: userData.name,
      role: userData.role,
      email: userData.email,
    });
    if (created) {
      setUsers((prev) => [...prev, created]);
      setDbSyncToast({ message: `Đã thêm tài khoản [${created.name}] vào Database!`, type: 'success' });
      setTimeout(() => setDbSyncToast(null), 3500);
      logActivity(`Admin thêm tài khoản [${created.name}]`, 'USER', created.name);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (currentUser?.role !== 'admin') {
      setDbSyncToast({ message: 'Chỉ Quản trị viên (Admin) mới có quyền sửa tài khoản!', type: 'error' });
      return;
    }
    const oldUser = users.find((u) => u.id === updatedUser.id);
    const isPromoted = oldUser && oldUser.role !== 'admin' && updatedUser.role === 'admin';
    const isDemoted = oldUser && oldUser.role === 'admin' && updatedUser.role !== 'admin';

    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    const ok = await supabaseService.updateProfile(updatedUser.id, {
      full_name: updatedUser.name,
      role: updatedUser.role,
    });

    if (!ok) {
      const freshProfiles = await supabaseService.fetchProfiles();
      setUsers(freshProfiles);
      return;
    }

    const msg = isPromoted
      ? `✓ Đã cấp quyền Quản trị viên (Admin) cho [${updatedUser.name}] và lưu vào Database!`
      : isDemoted
      ? `Đã chuyển vai trò của [${updatedUser.name}] thành Giám thị trong Database!`
      : `Đã cập nhật tài khoản [${updatedUser.name}] trong Database!`;

    setDbSyncToast({ message: msg, type: 'success' });
    setTimeout(() => setDbSyncToast(null), 3500);
    logActivity(`Admin phân quyền cho [${updatedUser.name}]: ${updatedUser.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}`, 'USER', updatedUser.name);
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.role !== 'admin') {
      setDbSyncToast({ message: 'Chỉ Quản trị viên (Admin) mới có quyền xóa tài khoản!', type: 'error' });
      return;
    }
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    const ok = await supabaseService.deleteProfile(userId);
    if (!ok) {
      const freshProfiles = await supabaseService.fetchProfiles();
      setUsers(freshProfiles);
      return;
    }
    setDbSyncToast({ message: `Đã xóa tài khoản khỏi Database!`, type: 'success' });
    setTimeout(() => setDbSyncToast(null), 3500);
    if (target) {
      logActivity(`Admin xóa tài khoản [${target.name}]`, 'USER', target.name);
    }
  };

  // THAY ĐỔI MÀU TOÀN BỘ WEBSITE
  const handleSelectTheme = (themeId: string, customHex?: string) => {
    setCurrentThemeId(themeId);
    if (customHex) {
      setCustomBgColor(customHex);
    }
    const appliedPalette = themeId === 'custom' && customHex 
      ? themeManager.setCustomColor(customHex) 
      : themeManager.setTheme(themeId, customHex);
    setActualBgColor(appliedPalette.bg);

    const themeName = themeId === 'custom' 
      ? `màu tự do (${customHex})` 
      : themeId === 'oled' 
      ? 'Đen OLED Tuyệt Đối' 
      : themeId === 'navy' 
      ? 'Xanh Biển Sâu' 
      : themeId === 'emerald' 
      ? 'Xanh Rừng Đêm' 
      : themeId === 'violet' 
      ? 'Tím Không Gian' 
      : themeId === 'charcoal' 
      ? 'Xám Than Chì' 
      : themeId === 'steel'
      ? 'Xanh Thép Công Nghiệp'
      : themeId === 'dark-amber'
      ? 'Nâu Cà Phê Trầm'
      : themeId === 'crimson'
      ? 'Đỏ Rượu Vang'
      : themeId;

    logActivity(`Đổi màu toàn bộ website sang [${themeName}]`, 'THEME', 'Giao diện');
    setDbSyncToast({
      message: `Đã đổi màu toàn bộ website sang [${themeName}]!`,
      type: 'info',
    });
    setTimeout(() => setDbSyncToast(null), 3000);
  };

  const handleResetDefaultTheme = () => {
    const defaultPalette = themeManager.resetToDefault();
    setCurrentThemeId('midnight');
    setCustomBgColor('#020617');
    setActualBgColor(defaultPalette.bg);

    logActivity('Khôi phục giao diện toàn bộ website mặc định (Midnight Slate)', 'THEME', 'Giao diện');
    setDbSyncToast({
      message: 'Đã khôi phục giao diện toàn bộ website về mặc định (Midnight Slate)!',
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 3000);
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId || r.code === selectedRoomId);
  const activeAlarmCount = rooms.filter((r) => r.status === 'alert' || r.hasFireAlarm).length;

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col antialiased selection:bg-orange-500 selection:text-slate-950 transition-colors duration-300"
      style={{ backgroundColor: actualBgColor }}
    >
      {/* CẢNH BÁO KHẨN CẤP AN TOÀN (BÁO CHÁY / KHÓI / QUÁ NHIỆT) */}
      {activeCriticalRoom && (
        <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-lg bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border-2 border-red-400 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 animate-spin shrink-0">
              <Flame className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                <span>🚨 CẢNH BÁO BÁO CHÁY KHẨN CẤP!</span>
              </p>
              <p className="text-xs text-white/95 font-bold">
                Phát hiện sự cố cháy tại {activeCriticalRoom.name} (Khói: {activeCriticalRoom.smokeLevel} ppm, Nhiệt độ: {activeCriticalRoom.temperature.toFixed(1)}°C)
              </p>
              <p className="text-[11px] text-red-100 mt-0.5">
                Cảm biến PCCC vượt ngưỡng an toàn. Còi hú đang phát tín hiệu cảnh báo sơ tán.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedRoomId(activeCriticalRoom.code || activeCriticalRoom.id)}
              className="px-3 py-1.5 bg-white text-red-700 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors shadow active:scale-95 whitespace-nowrap"
            >
              Xem phòng
            </button>
            <button
              onClick={() => handleClearFireAlarmForRoom(activeCriticalRoom.code || activeCriticalRoom.id)}
              className="px-3 py-1 bg-red-800/90 hover:bg-red-900 text-white rounded-xl text-[11px] font-semibold transition-colors active:scale-95 whitespace-nowrap"
            >
              Tắt còi
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-screen">
        {/* Navigation Sidebar / Mobile Nav */}
        <Navbar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setSelectedRoomId(null);
          }}
          currentUser={currentUser}
          activeAlarmCount={activeAlarmCount}
          mqttStatus={mqttStatus}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            currentTab={currentTab}
            currentUser={currentUser}
            allUsers={users}
            onSwitchUser={(u) => {
              setCurrentUser(u);
              localStorage.setItem('smart_classroom_user_id', u.id);
            }}
            onLogout={() => {
              setCurrentUser(null);
              localStorage.removeItem('smart_classroom_user_id');
            }}
            onClearAllAlarms={handleClearAllAlarms}
            activeAlarmCount={activeAlarmCount}
            mqttStatus={mqttStatus}
            supabaseStatus={supabaseStatus}
            timeInfo={timeInfo}
            onOpenTimeSyncModal={() => setIsTimeModalOpen(true)}
            onOpenSchoolPowerModal={() => {
              if (currentUser?.role === 'admin') {
                setIsSchoolPowerModalOpen(true);
              }
            }}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            poweredOnCount={rooms.filter((r) => r.status === 'on' || r.status === 'alert').length}
            onSyncDatabase={loadAllSupabaseData}
            isSyncing={isLoading}
          />

          {/* Banner cảnh báo RLS nếu database đang chặn ghi */}
          {supabaseStatus?.rlsRestricted && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-2xl bg-orange-950/80 border border-orange-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-orange-200 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-orange-300">
                    Supabase đang chặn quyền ghi dữ liệu (Lỗi RLS 42501)
                  </p>
                  <p className="text-xs text-orange-200/90 mt-0.5">
                    PostgreSQL Row Level Security đang khóa quyền thêm/sửa bảng rooms. Chỉnh sửa công tắc/thiết bị trên web chưa thể lưu vào database cho đến khi chạy lệnh SQL mở quyền.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setIsSqlHelperModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/30 transition-all active:scale-95"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Mở quyền SQL (15 giây)</span>
                </button>
              </div>
            </div>
          )}

          {/* Banner lỗi kết nối nếu có */}
          {supabaseError && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-red-300">Không thể tải dữ liệu từ Supabase Database</p>
                  <p className="text-xs text-red-200/90 mt-0.5">{supabaseError}</p>
                </div>
              </div>
              <button
                onClick={loadAllSupabaseData}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {/* Main Body View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-400 shadow-xl">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-white text-base">Đang tải dữ liệu từ Supabase Cloud...</h4>
                  <p className="text-xs text-slate-400 mt-1">Đồng bộ các bảng rooms, alerts, schedules và settings</p>
                </div>
              </div>
            ) : selectedRoom ? (
              <RoomDetailView
                room={selectedRoom}
                currentUser={currentUser}
                onBack={() => setSelectedRoomId(null)}
                onUpdateRoom={handleUpdateRoom}
                onToggleRelay={handleToggleRelay}
                onEmergencyCut={handleEmergencyCut}
                onTriggerSmokeForRoom={(code, autoCutPower) => {
                  handleTriggerFireAlarmForRoom(code, autoCutPower);
                }}
                onClearSmokeForRoom={(code) => {
                  handleClearFireAlarmForRoom(code);
                }}
                onDeleteRoom={currentUser?.role === 'admin' ? handleRequestDeleteRoom : undefined}
                soundEnabled={settings.soundEnabled}
              />
            ) : (
              <>
                {/* 1. TỔNG QUAN (Dashboard) */}
                {currentTab === 'dashboard' && (
                  <DashboardTab
                    rooms={rooms}
                    currentUser={currentUser}
                    alerts={alerts}
                    activities={activities}
                    recentSensorLogs={recentSensorLogs}
                    onSelectRoom={(r) => setSelectedRoomId(r.code || r.id)}
                    onNavigateToRooms={() => setCurrentTab('rooms')}
                    onTurnOffEmptyRooms={handleTurnOffEmptyRooms}
                    onResolveAlert={handleResolveAlert}
                    onPushToDatabase={handlePushAllToDatabase}
                    onSyncAlerts={handleSyncAlerts}
                    onClearAllAlarms={handleClearAllAlarms}
                    isPushingDb={isPushingDb}
                    onOpenSchoolPowerModal={() => {
                      if (currentUser?.role === 'admin') {
                        setIsSchoolPowerModalOpen(true);
                      }
                    }}
                    dbRoomCount={rooms.length}
                  />
                )}

                {/* 2. DANH SÁCH LỚP HỌC (Rooms) */}
                {currentTab === 'rooms' && (
                  <RoomsTab
                    rooms={rooms}
                    currentUser={currentUser}
                    onSelectRoom={(r) => setSelectedRoomId(r.code || r.id)}
                    onToggleRoomPower={handleToggleRoomPower}
                    onToggleRelay={handleToggleRelay}
                    onTriggerSmoke={(roomId, e, isTrigger) => {
                      e.stopPropagation();
                      if (isTrigger === false) {
                        handleClearFireAlarmForRoom(roomId);
                      } else {
                        handleTriggerFireAlarmForRoom(roomId, false);
                      }
                    }}
                    onOpenSchoolPowerModal={() => {
                      if (currentUser?.role === 'admin') {
                        setIsSchoolPowerModalOpen(true);
                      }
                    }}
                    onOpenAddRoomModal={currentUser?.role === 'admin' ? () => setIsAddRoomModalOpen(true) : undefined}
                    dbRoomCount={rooms.length}
                    onPushToDatabase={handlePushAllToDatabase}
                    onFetchFromDatabase={loadAllSupabaseData}
                    isSyncingDb={isPushingDb || isLoading}
                    onDeleteRoom={currentUser?.role === 'admin' ? handleRequestDeleteRoom : undefined}
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
                    onUpdateSettings={handleUpdateSettings}
                    users={users}
                    currentUser={currentUser}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    mqttInfo={mqttStatus}
                    supabaseInfo={supabaseStatus}
                    roomsCount={rooms.length}
                    dbRoomCount={supabaseStatus.dbRoomCount}
                    onPushToDatabase={handlePushAllToDatabase}
                    onFetchFromDatabase={loadAllSupabaseData}
                    onOpenSqlHelper={() => setIsSqlHelperModalOpen(true)}
                    isPushingDb={isPushingDb || isLoading}
                    currentThemeId={currentThemeId}
                    customColor={customBgColor}
                    onSelectTheme={handleSelectTheme}
                    onResetDefaultTheme={handleResetDefaultTheme}
                    onOpenThemeModal={() => setIsThemeModalOpen(true)}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Real-time Time Synchronization Modal */}
      <TimeSyncModal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        timeInfo={timeInfo}
        soundEnabled={settings.soundEnabled}
      />

      {/* School-wide Master Power Cut Modal */}
      <SchoolPowerModal
        isOpen={isSchoolPowerModalOpen}
        onClose={() => setIsSchoolPowerModalOpen(false)}
        rooms={rooms}
        currentUser={currentUser}
        onSchoolWideCut={handleSchoolWidePowerCut}
        onSchoolWideRestore={handleSchoolWidePowerRestore}
      />

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        isAdmin={currentUser?.role === 'admin'}
        onClose={() => setIsAddRoomModalOpen(false)}
        onAddRoom={async (newRoom) => {
          if (currentUser?.role !== 'admin') {
            setDbSyncToast({
              message: 'Chỉ Quản trị viên (Admin) mới có quyền thêm phòng học mới!',
              type: 'error',
            });
            setTimeout(() => setDbSyncToast(null), 4000);
            return;
          }
          const buildingCode = newRoom.building.includes('B') ? 'B' : newRoom.building.includes('C') ? 'C' : 'A';
          const roomSaved = await supabaseService.updateRoom(newRoom.id, {
            code: newRoom.id,
            name: newRoom.name,
            building: buildingCode,
            power_on: newRoom.isPowerOn,
            status: newRoom.isPowerOn ? 'on' : 'off',
            temperature: 24,
            humidity: 60,
            smoke_level: 0,
            light_on: newRoom.devices.light.isOn,
            ac_on: newRoom.devices.ac.isOn,
            projector_on: false,
            fan_on: newRoom.devices.fan.isOn,
            flame: false,
            relay_alarm: false,
          });
          await supabaseService.updateRelayControl(newRoom.id, {
            auto_mode: false,
            relay1_den: newRoom.devices.light.isOn,
            relay2_quat: newRoom.devices.fan.isOn,
            relay3_maychieu: false,
            relay4_dieuhoa: newRoom.devices.ac.isOn,
            khan_cap: false,
          });
          if (roomSaved) {
            logActivity(`Thêm phòng học mới [${newRoom.name}] vào Supabase`, newRoom.id, newRoom.name);
            loadAllSupabaseData();
          }
        }}
        existingRoomIds={rooms.map((r) => r.code || r.id)}
      />

      {/* SQL Helper Modal */}
      <SqlHelperModal
        isOpen={isSqlHelperModalOpen}
        onClose={() => setIsSqlHelperModalOpen(false)}
        projectId={supabaseStatus.projectId}
        onSuccessVerified={() => {
          setSupabaseStatus((prev) => ({ ...prev, rlsRestricted: false }));
          loadAllSupabaseData();
        }}
      />

      {/* Background Color Customization Modal */}
      <ThemeColorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={currentThemeId}
        customColor={customBgColor}
        onSelectTheme={handleSelectTheme}
        onResetDefault={handleResetDefaultTheme}
      />

      {/* Login Screen (Bắt buộc đăng nhập mỗi khi vào web nếu chưa có session) */}
      {!currentUser && (
        <LoginModal 
          users={users} 
          onLogin={(u) => {
            setCurrentUser(u);
            if (typeof window !== 'undefined') {
              localStorage.setItem('smart_classroom_user_id', u.id);
            }
          }} 
          onRegisterUser={handleRegisterUser}
        />
      )}

      {/* Delete Room Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-red-500/40 shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa phòng học</h3>
                <p className="text-xs text-slate-400">Xóa vĩnh viễn khỏi Database Supabase</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa phòng <strong className="text-white">{roomToDelete.name} ({roomToDelete.code || roomToDelete.id})</strong>? 
              Bản ghi phòng học và toàn bộ cảnh báo liên quan sẽ bị xóa trực tiếp khỏi cơ sở dữ liệu Supabase.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRoomToDelete(null)}
                disabled={isDeletingRoom}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDeleteRoom}
                disabled={isDeletingRoom}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {isDeletingRoom ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang xóa...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
