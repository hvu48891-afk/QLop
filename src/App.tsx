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
import { soundManager } from './utils/soundEffects';

import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { RoomsTab } from './components/RoomsTab';
import { RoomDetailView } from './components/RoomDetailView';
import { SchedulesTab } from './components/SchedulesTab';
import { SettingsTab } from './components/SettingsTab';
import { LoginModal } from './components/LoginModal';
import { Flame, Bell, X, ShieldAlert } from 'lucide-react';

export default function App() {
  // Navigation & Screen State
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Core Data State
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
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

  // Connect to Supabase on mount
  useEffect(() => {
    supabaseService.checkConnection().then((status) => {
      setSupabaseStatus(status);
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

  // Active Toast Alert Banner
  const [toastAlert, setToastAlert] = useState<{
    id: string;
    roomName: string;
    message: string;
    type: 'smoke' | 'temp';
  } | null>(null);

  // Keep a ref for rooms to access fresh state in MQTT callbacks
  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Keep ref for settings
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

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
  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
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

    const alertItem = alerts.find((a) => a.id === alertId);
    if (alertItem) {
      logActivity(`Xác nhận xử lý an toàn cảnh báo tại ${alertItem.roomName}`, alertItem.roomId, alertItem.roomName);
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

  // TRIGGER RULE IMMEDIATELY (TEST BUTTON)
  const handleTriggerRuleNow = (rule: ScheduleRule) => {
    if (settings.soundEnabled) soundManager.playClick();

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

    logActivity(`Thực thi thủ công quy tắc "${rule.title}"`, 'automation', rule.targetName);
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

      {/* Main Layout Container */}
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
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mock Login Screen if logged out */}
      {!currentUser && (
        <LoginModal users={users} onLogin={(u) => setCurrentUser(u)} />
      )}
    </div>
  );
}
