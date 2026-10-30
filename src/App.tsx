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
  ActivityLog,
  CurtainState
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
import { Flame, Bell, X, ShieldAlert, Clock, Zap, Loader2, AlertCircle, RefreshCw, Database, Terminal } from 'lucide-react';

export default function App() {
  // Navigation & Screen State
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Core Data State - Toàn bộ dữ liệu đọc từ Supabase thật
  const [rooms, setRooms] = useState<Room[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [rules, setRules] = useState<ScheduleRule[]>(INITIAL_RULES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [settings, setSettings] = useState<ThresholdSettings>(INITIAL_SETTINGS);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);

  // Trạng thái Loading & Lỗi kết nối Supabase
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

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
  const [autoScheduleToast, setAutoScheduleToast] = useState<{ title: string; time: string; action: string } | null>(null);

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
      const [fetchedRooms, fetchedAlerts, fetchedSchedules, fetchedSettings, fetchedProfiles] = await Promise.all([
        supabaseService.fetchRooms(),
        supabaseService.fetchAlerts(),
        supabaseService.fetchSchedules(),
        supabaseService.fetchSettings(),
        supabaseService.fetchProfiles(),
      ]);

      setRooms(fetchedRooms);
      setSupabaseStatus(prev => ({ ...prev, dbRoomCount: fetchedRooms.length }));

      if (fetchedAlerts.length > 0) {
        setAlerts(fetchedAlerts);
      }
      if (fetchedSchedules.length > 0) {
        setRules(fetchedSchedules);
      }
      if (fetchedSettings) {
        setSettings(fetchedSettings);
      }
      if (fetchedProfiles.length > 0) {
        setUsers(fetchedProfiles);
        setCurrentUser(fetchedProfiles[0]);
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
            next[index] = updatedRoom;
            return next;
          }
          return [...prev, updatedRoom];
        });
      },
      (newAlert: AlertLog) => {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === newAlert.id)) return prev;
          return [newAlert, ...prev];
        });
        if (settingsRef.current.soundEnabled) {
          soundManager.playAlarm();
        }
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

  // 4. CẢNH BÁO TỰ ĐỘNG THEO NGƯỠNG (Khi smoke_level >= smoke_threshold hoặc temp >= temp_threshold)
  useEffect(() => {
    rooms.forEach((room) => {
      const isExceeded = 
        room.smokeLevel >= settings.smokeThreshold || 
        room.temperature >= settings.highTempThreshold;

      if (isExceeded) {
        if (!activeAlertRoomsRef.current.has(room.code)) {
          activeAlertRoomsRef.current.add(room.code);
          // 1. Cập nhật status = 'alert' cho phòng đó trong bảng rooms
          supabaseService.setRoomAlert(room.code, true, room.isPowerOn);
          
          // 2. Thêm một dòng vào bảng alerts (chỉ thêm khi vừa vượt ngưỡng)
          const alertType = room.smokeLevel >= settings.smokeThreshold ? 'smoke' : 'temp_high';
          const alertMsg = room.smokeLevel >= settings.smokeThreshold
            ? `Cảm biến khói phát hiện nồng độ vượt ngưỡng (${room.smokeLevel} ppm >= ${settings.smokeThreshold} ppm)!`
            : `Cảm biến nhiệt độ phòng tăng cao (${room.temperature}°C >= ${settings.highTempThreshold}°C)!`;
          
          supabaseService.insertAlert({
            room_code: room.code,
            type: alertType,
            message: alertMsg,
            level: 'critical',
          }).then((newAlert) => {
            if (newAlert) {
              setAlerts((prev) => [newAlert, ...prev]);
            }
          });

          if (settings.soundEnabled) {
            soundManager.playAlarm();
          }

          logActivity(`⚠️ Kích hoạt cảnh báo tự động tại ${room.name}`, room.code, room.name);
        }
      } else {
        // Khi giá trị về dưới ngưỡng: trả status về 'on' (nếu power_on) hoặc 'off'
        if (activeAlertRoomsRef.current.has(room.code)) {
          activeAlertRoomsRef.current.delete(room.code);
          supabaseService.setRoomAlert(room.code, false, room.isPowerOn);
          logActivity(`Trạng thái phòng ${room.name} đã trở về an toàn`, room.code, room.name);
        }
      }
    });
  }, [rooms, settings.smokeThreshold, settings.highTempThreshold]);

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

  // CẬP NHẬT CHI TIẾT PHÒNG HỌC (GỌI UPDATE BẢNG ROOMS VỚI .eq('code', ...))
  const handleUpdateRoom = async (updated: Room) => {
    setRooms((prev) => prev.map((r) => (r.code === updated.code ? updated : r)));

    // Cập nhật lên Supabase theo đúng các cột
    await supabaseService.updateRoom(updated.code, {
      power_on: updated.isPowerOn,
      status: updated.hasFireAlarm ? 'alert' : updated.isPowerOn ? 'on' : 'off',
      light_on: updated.devices.light.isOn,
      light_mode: updated.devices.light.preset,
      ac_on: updated.devices.ac.isOn,
      ac_temp: updated.devices.ac.targetTemp,
      ac_mode: updated.devices.ac.mode,
      projector_on: updated.devices.projector.isOn,
      fan_on: updated.devices.fan.isOn,
      curtain: updated.devices.curtain,
    });

    logActivity(`Cập nhật trạng thái thiết bị ${updated.name}`, updated.code, updated.name);
  };

  // ĐIỀU KHIỂN RÈM CỬA (CẬP NHẬT CỘT curtain VỚI .eq('code', ...))
  const handleUpdateCurtain = async (roomCode: string, curtain: CurtainState) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.code === roomCode
          ? { ...r, devices: { ...r.devices, curtain } }
          : r
      )
    );
    await supabaseService.updateCurtain(roomCode, curtain);
    logActivity(`Điều khiển rèm ${roomCode}: ${curtain === 'up' ? 'Kéo lên' : curtain === 'down' ? 'Hạ xuống' : 'Dừng'}`, roomCode, `Phòng ${roomCode}`);
  };

  // BẬT / TẮT NGUỒN ĐIỆN PHÒNG (CẬP NHẬT CỘT power_on VỚI .eq('code', ...))
  const handleToggleRoomPower = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = rooms.find((r) => r.id === roomId || r.code === roomId);
    if (!target) return;

    const newState = !target.isPowerOn;
    if (settings.soundEnabled) {
      soundManager.playSwitch(newState);
    }

    setRooms((prev) =>
      prev.map((r) =>
        r.code === target.code
          ? {
              ...r,
              isPowerOn: newState,
              status: newState ? 'on' : 'off',
              emergencyPowerCut: false,
              devices: newState
                ? r.devices
                : {
                    ...r.devices,
                    light: { ...r.devices.light, isOn: false },
                    ac: { ...r.devices.ac, isOn: false },
                    projector: { ...r.devices.projector, isOn: false },
                    fan: { ...r.devices.fan, isOn: false },
                  },
              lastUpdated: 'Vừa xong',
            }
          : r
      )
    );

    await supabaseService.updatePower(target.code, newState);
    logActivity(`${newState ? 'Bật nguồn điện' : 'Tắt nguồn điện'} ${target.name}`, target.code, target.name);
  };

  // CÔNG TẮC KHẨN CẤP / CẮT NGUỒN ĐIỆN (CẬP NHẬT power_on)
  const handleEmergencyCut = async (roomId: string, cutOff: boolean) => {
    const target = rooms.find((r) => r.id === roomId || r.code === roomId);
    if (!target) return;

    const powerState = !cutOff;
    if (cutOff) {
      if (settings.soundEnabled) soundManager.playAlarm();
    } else {
      if (settings.soundEnabled) soundManager.playSwitch(true);
    }

    setRooms((prev) =>
      prev.map((r) =>
        r.code === target.code
          ? {
              ...r,
              emergencyPowerCut: cutOff,
              isPowerOn: powerState,
              status: powerState ? 'on' : 'off',
              lastUpdated: 'Vừa xong',
            }
          : r
      )
    );

    await supabaseService.updatePower(target.code, powerState);

    if (cutOff) {
      // Ghi cảnh báo khẩn cấp vào bảng alerts
      const newAlert = await supabaseService.insertAlert({
        room_code: target.code,
        type: 'power_leak',
        message: `Công tắc khẩn cấp đã ngắt toàn bộ điện phòng ${target.name}!`,
        level: 'critical',
      });
      if (newAlert) {
        setAlerts((prev) => [newAlert, ...prev]);
      }
    }

    logActivity(
      cutOff ? `⚠️ NGẮT ĐIỆN KHẨN CẤP ${target.name}` : `Khôi phục nguồn điện ${target.name}`,
      target.code,
      target.name
    );
  };

  // TẮT ĐIỆN TOÀN TRƯỜNG
  const handleSchoolWidePowerCut = async (mode: 'emergency' | 'soft') => {
    const updatedRooms = rooms.map((r) => ({
      ...r,
      isPowerOn: false,
      status: 'off' as const,
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

    // Cập nhật tất cả các phòng trên Supabase
    rooms.forEach((r) => {
      supabaseService.updatePower(r.code, false);
    });

    if (settings.soundEnabled) {
      if (mode === 'emergency') soundManager.playEmergencyCut();
      else soundManager.playSwitch(false);
    }

    const alertMsg = mode === 'emergency'
      ? `🚨 CẦU DAO TỔNG: ĐÃ NGẮT ĐIỆN KHẨN CẤP TOÀN TRƯỜNG (${rooms.length} phòng học)!`
      : `⚠️ ĐÃ TẮT TOÀN BỘ THIẾT BỊ ĐIỆN TOÀN TRƯỜNG (${rooms.length} phòng học)`;

    const newAlert = await supabaseService.insertAlert({
      room_code: 'ALL',
      type: 'power_leak',
      message: alertMsg,
      level: mode === 'emergency' ? 'critical' : 'warning',
    });
    if (newAlert) {
      setAlerts((prev) => [newAlert, ...prev]);
    }

    logActivity(alertMsg, 'ALL', 'Toàn trường');
    setDbSyncToast({
      message: `Đã thực thi ngắt điện toàn trường thành công!`,
      type: 'success',
    });
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
  const handleResolveAlert = (alertId: string) => {
    const resolvedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, isResolved: true, resolvedAt: resolvedTime }
          : a
      )
    );
  };

  // QUY TẮC LẬP LỊCH: BẬT/TẮT, THÊM, SỬA, XÓA TRONG BẢNG 'schedules'
  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const newEnabled = !rule.isEnabled;

    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: newEnabled } : r))
    );

    await supabaseService.toggleScheduleEnabled(ruleId, newEnabled);
    logActivity(`${newEnabled ? 'Bật' : 'Tắt'} quy tắc "${rule.title}"`, 'RULE', rule.title);
  };

  const handleSaveRule = async (savedRule: ScheduleRule) => {
    const exists = rules.some((r) => r.id === savedRule.id);
    if (exists) {
      setRules((prev) => prev.map((r) => (r.id === savedRule.id ? savedRule : r)));
      await supabaseService.updateSchedule(savedRule.id, {
        name: savedRule.title,
        scope: savedRule.scope,
        target: savedRule.targetId,
        action: savedRule.action,
        run_time: savedRule.time,
        days: savedRule.daysOfWeek,
        enabled: savedRule.isEnabled,
      });
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
        setRules((prev) => [savedRule, ...prev]);
      }
    }
    logActivity(`Lưu quy tắc "${savedRule.title}"`, 'RULE', savedRule.title);
  };

  const handleDeleteRule = async (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    await supabaseService.deleteSchedule(ruleId);
    if (rule) {
      logActivity(`Xóa quy tắc "${rule.title}"`, 'RULE', rule.title);
    }
  };

  // THỰC THI QUY TẮC
  const handleTriggerRuleNow = (rule: ScheduleRule, isAuto: boolean = false) => {
    if (settings.soundEnabled) {
      if (isAuto) soundManager.playSwitch(true);
      else soundManager.playClick();
    }

    let targetRooms = rooms;
    if (rule.scope === 'building') {
      targetRooms = rooms.filter((r) => r.building === rule.targetId || r.building.endsWith(rule.targetId));
    } else if (rule.scope === 'room') {
      targetRooms = rooms.filter((r) => r.code === rule.targetId);
    }

    targetRooms.forEach((r) => {
      if (rule.action === 'turn_off_all') {
        supabaseService.updatePower(r.code, false);
      } else if (rule.action === 'turn_on_ac') {
        supabaseService.updateAc(r.code, true, 24, 'cool');
      } else if (rule.action === 'turn_off_ac_proj') {
        supabaseService.updateRoom(r.code, { ac_on: false, projector_on: false });
      }
    });

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
    await supabaseService.updateSettings(newSettings.highTempThreshold, newSettings.smokeThreshold);
    logActivity('Cập nhật ngưỡng cảnh báo hệ thống (bảng settings id=1)', 'SYSTEM', 'Cài đặt');
    setDbSyncToast({
      message: 'Đã lưu ngưỡng cảnh báo thành công vào bảng settings!',
      type: 'success',
    });
    setTimeout(() => setDbSyncToast(null), 3000);
  };

  // THÊM/SỬA/XÓA USER
  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId || r.code === selectedRoomId);
  const activeAlarmCount = rooms.filter((r) => r.status === 'alert' || r.hasFireAlarm).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-orange-500 selection:text-slate-950">
      {/* Toast Alert Banner if active critical alert */}
      {activeCriticalRoom && (
        <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce border-2 border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide">
                CẢNH BÁO BÁO ĐỘNG: {activeCriticalRoom.name}
              </p>
              <p className="text-xs text-white/90">
                Nồng độ khói {activeCriticalRoom.smokeLevel} ppm / Nhiệt độ {activeCriticalRoom.temperature}°C vượt ngưỡng an toàn!
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedRoomId(activeCriticalRoom.code)}
            className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-slate-100"
          >
            Xem
          </button>
        </div>
      )}

      {/* Supabase Connection Toast */}
      {dbSyncToast && (
        <div className={`fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md ${
          dbSyncToast.type === 'error' ? 'bg-red-700 border-red-500' :
          dbSyncToast.type === 'info' ? 'bg-amber-600 border-amber-400' : 
          'bg-emerald-600 border-emerald-400/40'
        } text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border-2`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wide">
                SUPABASE DATABASE
              </p>
              <p className="text-xs text-white/95 leading-relaxed">{dbSyncToast.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {dbSyncToast.action && (
              <button
                onClick={() => {
                  dbSyncToast.action?.onClick();
                  setDbSyncToast(null);
                }}
                className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                {dbSyncToast.action.label}
              </button>
            )}
            <button
              onClick={() => setDbSyncToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-schedule Toast */}
      {autoScheduleToast && (
        <div className="fixed top-3 left-4 right-4 sm:left-auto sm:right-6 z-50 max-w-md bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border-2 border-orange-400">
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
            onSwitchUser={(u) => setCurrentUser(u)}
            onLogout={() => setCurrentUser(null)}
            onTriggerRandomSmokeAlarm={() => {}}
            onClearAllAlarms={() => {
              rooms.forEach(r => {
                if (r.status === 'alert') {
                  supabaseService.setRoomAlert(r.code, false, r.isPowerOn);
                }
              });
            }}
            activeAlarmCount={activeAlarmCount}
            mqttStatus={mqttStatus}
            supabaseStatus={supabaseStatus}
            timeInfo={timeInfo}
            onOpenTimeSyncModal={() => setIsTimeModalOpen(true)}
            onOpenSchoolPowerModal={() => setIsSchoolPowerModalOpen(true)}
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
                onBack={() => setSelectedRoomId(null)}
                onUpdateRoom={handleUpdateRoom}
                onEmergencyCut={handleEmergencyCut}
                onTriggerSmokeForRoom={(code) => {
                  supabaseService.setRoomAlert(code, true, true);
                }}
                onClearSmokeForRoom={(code) => {
                  supabaseService.setRoomAlert(code, false, true);
                }}
                onUpdateCurtain={handleUpdateCurtain}
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
                    onSelectRoom={(r) => setSelectedRoomId(r.code || r.id)}
                    onNavigateToRooms={() => setCurrentTab('rooms')}
                    onTurnOffEmptyRooms={handleTurnOffEmptyRooms}
                    onResolveAlert={handleResolveAlert}
                    onTriggerRandomSmokeAlarm={() => {}}
                    onPushToDatabase={loadAllSupabaseData}
                    isPushingDb={isPushingDb}
                    onOpenSchoolPowerModal={() => setIsSchoolPowerModalOpen(true)}
                    dbRoomCount={rooms.length}
                  />
                )}

                {/* 2. DANH SÁCH LỚP HỌC (Rooms) */}
                {currentTab === 'rooms' && (
                  <RoomsTab
                    rooms={rooms}
                    onSelectRoom={(r) => setSelectedRoomId(r.code || r.id)}
                    onToggleRoomPower={handleToggleRoomPower}
                    onTriggerSmoke={(roomId, e) => {
                      e.stopPropagation();
                      supabaseService.setRoomAlert(roomId, true, true);
                    }}
                    onOpenSchoolPowerModal={() => setIsSchoolPowerModalOpen(true)}
                    onOpenAddRoomModal={() => setIsAddRoomModalOpen(true)}
                    dbRoomCount={rooms.length}
                    onPushToDatabase={loadAllSupabaseData}
                    onFetchFromDatabase={loadAllSupabaseData}
                    isSyncingDb={isLoading}
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
                    onPushToDatabase={loadAllSupabaseData}
                    onFetchFromDatabase={loadAllSupabaseData}
                    onOpenSqlHelper={() => setIsSqlHelperModalOpen(true)}
                    isPushingDb={isLoading}
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
        onClose={() => setIsAddRoomModalOpen(false)}
        onAddRoom={async (newRoom) => {
          await supabaseService.updateRoom(newRoom.id, {
            code: newRoom.id,
            name: newRoom.name,
            building: newRoom.building === 'Tòa B' ? 'B' : 'A',
            power_on: false,
            status: 'off',
            temperature: 24,
            humidity: 60,
            smoke_level: 25,
            light_on: false,
            ac_on: false,
            projector_on: false,
            fan_on: false,
            curtain: 'stop',
          });
          loadAllSupabaseData();
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

      {/* Login Screen */}
      {!currentUser && (
        <LoginModal users={users} onLogin={(u) => setCurrentUser(u)} />
      )}
    </div>
  );
}
