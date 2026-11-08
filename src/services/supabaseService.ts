/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, SUPABASE_URL } from '../lib/supabase';
import { 
  Room, 
  DbRoom, 
  DbSensorData,
  DbAlert, 
  DbSchedule, 
  DbSettings, 
  DbProfile,
  AlertLog, 
  ScheduleRule, 
  User, 
  ThresholdSettings,
  LightPreset,
  AcMode
} from '../types';

export interface SupabaseStatus {
  isConnected: boolean;
  url: string;
  projectId: string;
  error?: string | null;
  lastSync?: string;
  isSyncing?: boolean;
  dbRoomCount?: number;
  rlsRestricted?: boolean;
}

export const DEFAULT_DB_ROOMS: DbRoom[] = [
  {
    id: '81747db3-421a-4f0e-80e8-2020e472ecf6',
    code: 'A201',
    name: 'Phòng học A201',
    building: 'A',
    status: 'off',
    temperature: 27.5,
    humidity: 83,
    smoke_level: 0,
    power_on: false,
    light_on: false,
    light_mode: 'off',
    ac_on: false,
    ac_temp: 24,
    ac_mode: 'cool',
    projector_on: false,
    fan_on: false,
    curtain: 'stop',
    air_quality: 'kem',
    flame: false,
    relay_alarm: false,
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_DB_SCHEDULES: DbSchedule[] = [
  {
    id: 1,
    name: 'Tắt toàn bộ điện tòa A sau giờ học',
    scope: 'building',
    target: 'A',
    action: 'turn_off_all',
    run_time: '17:30',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
  },
  {
    id: 2,
    name: 'Bật làm mát đón tiết học sáng',
    scope: 'all',
    target: 'all',
    action: 'turn_on_ac',
    run_time: '06:45',
    days: [1, 2, 3, 4, 5],
    enabled: true,
  },
  {
    id: 3,
    name: 'Tắt máy chiếu và điều hòa trưa',
    scope: 'all',
    target: 'all',
    action: 'turn_off_ac_proj',
    run_time: '11:45',
    days: [1, 2, 3, 4, 5],
    enabled: false,
  },
];

export interface WriteEvent {
  table: string;
  code?: string;
  action: string;
  success: boolean;
  rlsError?: boolean;
  error?: string;
  timestamp: string;
}

class SupabaseService {
  private status: SupabaseStatus = {
    isConnected: true,
    url: SUPABASE_URL,
    projectId: 'cuygczfkktprkyosabtu',
    error: null,
    dbRoomCount: 0,
    rlsRestricted: false,
  };

  private writeListeners: Array<(event: WriteEvent) => void> = [];
  private knownRoomsMap: Map<string, Room> = new Map();

  public subscribeWriteEvents(callback: (event: WriteEvent) => void): () => void {
    this.writeListeners.push(callback);
    return () => {
      this.writeListeners = this.writeListeners.filter((l) => l !== callback);
    };
  }

  private notifyWriteEvent(event: Omit<WriteEvent, 'timestamp'>) {
    const fullEvent: WriteEvent = { ...event, timestamp: new Date().toLocaleTimeString('vi-VN') };
    this.writeListeners.forEach((listener) => {
      try {
        listener(fullEvent);
      } catch (err) {
        console.error('[SupabaseService] Lỗi listener:', err);
      }
    });
  }

  public updateKnownRooms(rooms: Room[]) {
    rooms.forEach((r) => {
      this.knownRoomsMap.set(r.code || r.id, r);
    });
  }

  public buildInsertRoomPayload(code: string, fields: Partial<DbRoom>): any {
    const defaultRef = DEFAULT_DB_ROOMS.find((r) => r.code === code);
    const known = this.knownRoomsMap.get(code);

    return {
      code,
      name: fields.name || known?.name || defaultRef?.name || (code === 'A201' ? 'Phòng học A201 (Mạch thật)' : `Phòng ${code}`),
      building: fields.building || defaultRef?.building || (code.startsWith('B') ? 'B' : 'A'),
      status: fields.status || (fields.power_on ? 'on' : 'off'),
      temperature: fields.temperature ?? known?.temperature ?? defaultRef?.temperature ?? 25.5,
      humidity: fields.humidity ?? known?.humidity ?? defaultRef?.humidity ?? 60,
      smoke_level: fields.smoke_level ?? known?.smokeLevel ?? defaultRef?.smoke_level ?? 20,
      power_on: fields.power_on ?? known?.isPowerOn ?? defaultRef?.power_on ?? false,
      light_on: fields.light_on ?? known?.devices?.light?.isOn ?? defaultRef?.light_on ?? false,
      light_mode: fields.light_mode ?? known?.devices?.light?.preset ?? defaultRef?.light_mode ?? 'study',
      ac_on: fields.ac_on ?? known?.devices?.ac?.isOn ?? defaultRef?.ac_on ?? false,
      ac_temp: fields.ac_temp ?? known?.devices?.ac?.targetTemp ?? defaultRef?.ac_temp ?? 24,
      ac_mode: fields.ac_mode ?? known?.devices?.ac?.mode ?? defaultRef?.ac_mode ?? 'cool',
      projector_on: fields.projector_on ?? known?.devices?.projector?.isOn ?? defaultRef?.projector_on ?? false,
      fan_on: fields.fan_on ?? known?.devices?.fan?.isOn ?? defaultRef?.fan_on ?? false,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Helper chuyển đổi từ bản ghi Database DbRoom sang Room của ứng dụng
   */
  public mapDbRoomToRoom(row: DbRoom): Room {
    const code = row.code || 'A201';
    const isPower = Boolean(row.power_on);
    const isFlame = Boolean(row.flame);
    const status = row.status || (isPower ? 'on' : 'off');
    const isAlert = status === 'alert' || isFlame || (Number(row.smoke_level) || 0) >= 350;
    
    // Tách tầng từ mã phòng (VD: A201 -> 2, B102 -> 1, 301 -> 3)
    const digits = code.replace(/\D/g, '');
    const floor = digits.length >= 2 ? parseInt(digits.charAt(0), 10) : 1;

    // Kiểm tra mất kết nối nếu updated_at cũ hơn 30 giây
    let isDisconnected = false;
    if (row.updated_at) {
      const updatedTime = new Date(row.updated_at).getTime();
      const now = Date.now();
      if (!isNaN(updatedTime) && now - updatedTime > 30000) {
        isDisconnected = true;
      }
    }

    const buildingLabel = row.building === 'B' || row.building === 'Tòa B' ? 'Tòa B' : 'Tòa A';

    return {
      id: code,
      code,
      name: row.name || (code === 'A201' ? 'Phòng học A201' : `Phòng học ${code}`),
      building: buildingLabel,
      floor: floor || 1,
      capacity: 45,
      status: isAlert ? 'alert' : isPower ? 'on' : 'off',
      isPowerOn: isPower,
      isOccupied: isPower,
      hasFireAlarm: isAlert,
      smokeLevel: Number(row.smoke_level) || 0,
      temperature: Number(row.temperature) || 0,
      humidity: Number(row.humidity) || 0,
      curtain: (row.curtain as any) || 'stop',
      airQuality: row.air_quality || 'tot',
      flame: isFlame,
      relayAlarm: Boolean(row.relay_alarm),
      emergencyPowerCut: false,
      lastUpdated: isDisconnected ? 'Mất kết nối (>30s)' : 'Trực tuyến (Realtime)',
      updatedAt: row.updated_at || new Date().toISOString(),
      isDisconnected,
      devices: {
        light: {
          isOn: Boolean(row.light_on),
          brightness: row.light_on ? 85 : 0,
          preset: (row.light_mode as LightPreset) || 'study',
        },
        ac: {
          isOn: Boolean(row.ac_on),
          targetTemp: Number(row.ac_temp) || 24,
          mode: (row.ac_mode as AcMode) || 'cool',
          fanSpeed: 'med',
          timerMinutes: null,
        },
        projector: {
          isOn: Boolean(row.projector_on),
          inputSource: 'hdmi',
        },
        fan: {
          isOn: Boolean(row.fan_on),
          speed: row.fan_on ? 2 : 0,
        },
      },
    };
  }

  /**
   * Helper chuyển đổi DbAlert sang AlertLog
   */
  public mapDbAlertToAlert(row: DbAlert): AlertLog {
    const createdDate = row.created_at ? new Date(row.created_at) : new Date();
    const timeStr = !isNaN(createdDate.getTime()) 
      ? createdDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : 'Vừa xong';

    return {
      id: String(row.id),
      roomId: row.room_code,
      roomName: `Phòng ${row.room_code}`,
      building: row.room_code.startsWith('B') ? 'Tòa B' : 'Tòa A',
      type: row.type || 'smoke',
      message: row.message,
      severity: row.level === 'critical' ? 'critical' : 'warning',
      timestamp: timeStr,
      isResolved: false,
      createdAt: row.created_at,
    };
  }

  /**
   * Helper chuyển đổi DbSchedule sang ScheduleRule
   */
  public mapDbScheduleToRule(row: DbSchedule): ScheduleRule {
    return {
      id: String(row.id),
      title: row.name,
      name: row.name,
      scope: row.scope || 'all',
      targetId: row.target || 'all',
      targetName: row.target === 'all' ? 'Toàn trường' : `Tòa/Phòng ${row.target}`,
      action: row.action || 'turn_off_all',
      time: row.run_time || '17:30',
      daysOfWeek: Array.isArray(row.days) ? row.days : [1, 2, 3, 4, 5, 6],
      isEnabled: Boolean(row.enabled),
      description: `Quy tắc ${row.name} thực thi lúc ${row.run_time}`,
    };
  }

  /**
   * 1. Kiểm tra kết nối tới Supabase
   */
  public async checkConnection(): Promise<SupabaseStatus> {
    try {
      const { count, error } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
      if (error) {
        console.error('[Supabase checkConnection] Lỗi kết nối:', error.message);
        this.status = {
          ...this.status,
          isConnected: false,
          error: error.message,
          lastSync: new Date().toLocaleTimeString('vi-VN'),
        };
      } else {
        this.status = {
          ...this.status,
          isConnected: true,
          error: null,
          dbRoomCount: count ?? 0,
          lastSync: new Date().toLocaleTimeString('vi-VN'),
        };
      }
    } catch (err: any) {
      console.error('[Supabase checkConnection] Ngoại lệ kết nối:', err);
      this.status = {
        ...this.status,
        isConnected: false,
        error: err.message || 'Lỗi mạng khi kết nối Supabase',
      };
    }
    return this.status;
  }

  public getStatus(): SupabaseStatus {
    return this.status;
  }

  // ==========================================
  // ROOMS: Đọc và Cập nhật bảng 'rooms'
  // ==========================================

  /**
   * Tải toàn bộ phòng học từ bảng 'rooms' và đồng bộ với bảng 'sensor_data'
   */
  public async fetchRooms(): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.error('[Supabase fetchRooms] Lỗi tải bảng rooms:', error.message);
        this.status.rlsRestricted = true;
        return DEFAULT_DB_ROOMS.map((row) => this.mapDbRoomToRoom(row));
      }

      let roomsList: Room[] = [];
      if (data && data.length > 0) {
        this.status.dbRoomCount = data.length;
        this.status.rlsRestricted = false;
        roomsList = data.map((row: DbRoom) => this.mapDbRoomToRoom(row));
      } else {
        roomsList = DEFAULT_DB_ROOMS.map((row) => this.mapDbRoomToRoom(row));
      }

      // Nạp kèm dữ liệu cảm biến mới nhất từ bảng sensor_data
      try {
        const latestSensors = await this.fetchRecentSensorData(20);
        if (latestSensors && latestSensors.length > 0) {
          roomsList = roomsList.map((room) => {
            const matchedSensor = latestSensors.find((s) => s.room_code === room.code);
            return matchedSensor ? this.mergeSensorDataToRoom(room, matchedSensor) : room;
          });
        }
      } catch (sensorErr) {
        console.warn('[Supabase fetchRooms] Không đọc được sensor_data:', sensorErr);
      }

      return roomsList;
    } catch (err: any) {
      console.error('[Supabase fetchRooms] Thất bại khi đọc bảng rooms:', err);
      return DEFAULT_DB_ROOMS.map((row) => this.mapDbRoomToRoom(row));
    }
  }

  /**
   * Đọc danh sách bản ghi mới nhất từ bảng sensor_data (dữ liệu thật từ mạch cảm biến)
   */
  public async fetchRecentSensorData(limit: number = 20): Promise<DbSensorData[]> {
    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Supabase fetchRecentSensorData] Lỗi đọc sensor_data:', error.message);
        return [];
      }
      return (data as DbSensorData[]) || [];
    } catch (err) {
      console.error('[Supabase fetchRecentSensorData] Ngoại lệ:', err);
      return [];
    }
  }

  /**
   * Cập nhật thông số phòng học từ bản ghi sensor_data thời gian thực
   */
  public mergeSensorDataToRoom(room: Room, sensor: DbSensorData): Room {
    const luaStr = String(sensor.lua || '').trim().toLowerCase();
    const isFlame = luaStr === 'co' || luaStr === 'có' || luaStr === 'true' || luaStr === '1';
    const gasVal = Number(sensor.gas) || 0;
    const isAlert = isFlame || gasVal > 25;

    return {
      ...room,
      temperature: Number(sensor.nhiet_do) || room.temperature,
      humidity: Number(sensor.do_am) || room.humidity,
      smokeLevel: gasVal,
      airQuality: sensor.clkk || room.airQuality,
      flame: isFlame,
      status: isAlert ? 'alert' : room.isPowerOn ? 'on' : 'off',
      hasFireAlarm: isAlert,
      updatedAt: sensor.created_at || new Date().toISOString(),
      lastUpdated: 'Trực tuyến (Sensor)',
      isDisconnected: false,
      devices: {
        ...room.devices,
        light: {
          ...room.devices.light,
          isOn: Boolean(sensor.relay1_den),
        },
        fan: {
          ...room.devices.fan,
          isOn: Boolean(sensor.relay2_quat),
        },
        projector: {
          ...room.devices.projector,
          isOn: Boolean(sensor.relay3_maychieu),
        },
        ac: {
          ...room.devices.ac,
          isOn: Boolean(sensor.relay4_dieuhoa),
        },
      },
    };
  }

  /**
   * Điều khiển Rèm cửa thông minh (cột curtain trong bảng rooms)
   */
  public async updateCurtain(code: string, curtain: 'open' | 'close' | 'stop'): Promise<boolean> {
    return this.updateRoom(code, { curtain } as any);
  }

  /**
   * Điều khiển Relay còi báo động (cột relay_alarm trong bảng rooms)
   */
  public async updateRelayAlarm(code: string, relay_alarm: boolean): Promise<boolean> {
    return this.updateRoom(code, { relay_alarm } as any);
  }

  /**
   * Đẩy toàn bộ dữ liệu phòng học lên bảng rooms của Supabase
   */
  public async syncAllToDatabase(rooms: Room[]): Promise<{ success: boolean; error?: string }> {
    try {
      const dbRows = rooms.map((r, index) => ({
        id: index + 1,
        code: r.code || r.id,
        name: r.name,
        building: r.building.includes('B') ? 'B' : 'A',
        status: r.status,
        temperature: r.temperature,
        humidity: r.humidity,
        smoke_level: r.smokeLevel,
        power_on: r.isPowerOn,
        light_on: r.devices.light.isOn,
        light_mode: r.devices.light.preset,
        ac_on: r.devices.ac.isOn,
        ac_temp: r.devices.ac.targetTemp,
        ac_mode: r.devices.ac.mode,
        projector_on: r.devices.projector.isOn,
        fan_on: r.devices.fan.isOn,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('rooms').upsert(dbRows, { onConflict: 'code' });
      if (error) {
        console.error('[Supabase syncAllToDatabase] Lỗi:', error.message);
        this.status.rlsRestricted = true;
        return { success: false, error: error.message };
      }
      this.status.rlsRestricted = false;
      this.status.dbRoomCount = dbRows.length;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  }

  /**
   * Cập nhật bất kỳ cột nào của phòng theo mã 'code'
   * Dùng .eq('code', ...) theo đúng đặc tả yêu cầu.
   * Nếu phòng chưa tồn tại trong Supabase (hoặc bảng vừa tạo), tự động insert đầy đủ.
   */
  public async updateRoom(code: string, fields: Partial<DbRoom>): Promise<boolean> {
    try {
      const payload = {
        ...fields,
        updated_at: new Date().toISOString(),
      };

      // 1. Thử cập nhật theo code với .select() để kiểm tra kết quả thực tế
      const { data, error } = await supabase
        .from('rooms')
        .update(payload)
        .eq('code', code)
        .select();

      if (error) {
        console.error(`[Supabase updateRoom] Lỗi cập nhật phòng ${code}:`, error.message);
        const isRls = error.code === '42501' || 
                      error.message.toLowerCase().includes('row-level security') || 
                      error.message.toLowerCase().includes('policy');
        if (isRls) {
          this.status.rlsRestricted = true;
          this.status.error = 'Supabase đang bật RLS (42501) chặn quyền ghi: ' + error.message;
        }
        this.notifyWriteEvent({
          table: 'rooms',
          code,
          action: 'Cập nhật phòng ' + code,
          success: false,
          rlsError: isRls,
          error: error.message,
        });
        return false;
      }

      // 2. Nếu update thành công và có dòng bị ảnh hưởng
      if (data && data.length > 0) {
        this.status.rlsRestricted = false;
        this.status.error = null;
        this.notifyWriteEvent({
          table: 'rooms',
          code,
          action: 'Cập nhật phòng ' + code,
          success: true,
        });
        return true;
      }

      // 3. Nếu data rỗng: phòng này chưa có bản ghi trong bảng Supabase!
      // Tự động INSERT bản ghi phòng vào Supabase
      console.log(`[Supabase updateRoom] Phòng ${code} chưa có trong database, đang tạo mới bản ghi...`);
      const insertPayload = this.buildInsertRoomPayload(code, payload);
      const { data: insertedData, error: insertError } = await supabase
        .from('rooms')
        .insert([insertPayload])
        .select();

      if (insertError) {
        console.error(`[Supabase updateRoom] Lỗi tạo phòng mới ${code}:`, insertError.message);
        const isRls = insertError.code === '42501' || 
                      insertError.message.toLowerCase().includes('row-level security');
        if (isRls) {
          this.status.rlsRestricted = true;
          this.status.error = 'Supabase đang bật RLS (42501) chặn quyền ghi: ' + insertError.message;
        }
        this.notifyWriteEvent({
          table: 'rooms',
          code,
          action: 'Tạo mới phòng ' + code,
          success: false,
          rlsError: isRls,
          error: insertError.message,
        });
        return false;
      }

      this.status.rlsRestricted = false;
      this.status.error = null;
      this.notifyWriteEvent({
        table: 'rooms',
        code,
        action: 'Tạo mới và lưu phòng ' + code,
        success: true,
      });
      return true;
    } catch (err: any) {
      console.error(`[Supabase updateRoom] Ngoại lệ khi cập nhật phòng ${code}:`, err);
      this.notifyWriteEvent({
        table: 'rooms',
        code,
        action: 'Cập nhật phòng ' + code,
        success: false,
        error: err?.message || 'Lỗi ngoại lệ mạng Supabase',
      });
      return false;
    }
  }

  /**
   * Kiểm tra trực tiếp quyền ghi vào Supabase
   */
  public async testWriteAccess(): Promise<{ canWrite: boolean; rlsRestricted: boolean; error?: string }> {
    try {
      const testPayload = {
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('rooms')
        .update(testPayload)
        .eq('code', 'A201')
        .select();

      if (error) {
        const isRls = error.code === '42501' || error.message.toLowerCase().includes('row-level security');
        this.status.rlsRestricted = isRls;
        this.status.error = error.message;
        return { canWrite: false, rlsRestricted: isRls, error: error.message };
      }

      this.status.rlsRestricted = false;
      this.status.error = null;
      return { canWrite: true, rlsRestricted: false };
    } catch (err: any) {
      return { canWrite: false, rlsRestricted: false, error: err.message };
    }
  }

  /**
   * Cập nhật điều khiển Đèn: light_on, light_mode
   */
  public async updateLight(code: string, light_on: boolean, light_mode?: LightPreset): Promise<boolean> {
    const payload: Partial<DbRoom> = { light_on };
    if (light_mode) payload.light_mode = light_mode;
    return this.updateRoom(code, payload);
  }

  /**
   * Cập nhật điều khiển Điều hòa: ac_on, ac_temp, ac_mode
   */
  public async updateAc(code: string, ac_on: boolean, ac_temp?: number, ac_mode?: AcMode): Promise<boolean> {
    const payload: Partial<DbRoom> = { ac_on };
    if (ac_temp !== undefined) payload.ac_temp = ac_temp;
    if (ac_mode) payload.ac_mode = ac_mode;
    return this.updateRoom(code, payload);
  }

  /**
   * Cập nhật điều khiển Máy chiếu: projector_on
   */
  public async updateProjector(code: string, projector_on: boolean): Promise<boolean> {
    return this.updateRoom(code, { projector_on });
  }

  /**
   * Cập nhật điều khiển Quạt: fan_on
   */
  public async updateFan(code: string, fan_on: boolean): Promise<boolean> {
    return this.updateRoom(code, { fan_on });
  }

  /**
   * Cập nhật Công tắc Điện phòng / Cắt điện khẩn cấp: power_on
   */
  public async updatePower(code: string, power_on: boolean): Promise<boolean> {
    return this.updateRoom(code, {
      power_on,
      status: power_on ? 'on' : 'off',
      // Nếu tắt điện thì tắt các thiết bị
      ...(power_on ? {} : { light_on: false, ac_on: false, projector_on: false, fan_on: false }),
    });
  }

  /**
   * Cập nhật trạng thái alert / báo cháy của phòng học
   */
  public async setRoomAlert(
    code: string, 
    isAlert: boolean, 
    powerOnState: boolean, 
    smokeLevel?: number
  ): Promise<boolean> {
    const level = isAlert ? (smokeLevel ?? 520) : (smokeLevel ?? 0);

    // Nếu kích hoạt báo cháy, ghi ngay bản ghi vào bảng alerts của Supabase
    if (isAlert) {
      try {
        await this.insertAlert({
          room_code: code,
          type: 'fire',
          message: `🚨 BÁO CHÁY KHẨN CẤP tại phòng ${code}! Cảm biến phát hiện khói ${level} ppm.`,
          level: 'critical',
        });
      } catch (err) {
        console.warn(`[Supabase] Không thể ghi cảnh báo cháy phòng ${code}:`, err);
      }
    } else {
      // Khi tắt cảnh báo an toàn, xóa các cảnh báo liên quan của phòng trong bảng alerts
      await this.clearAlertsForRoom(code);
    }

    return this.updateRoom(code, {
      status: isAlert ? 'alert' : powerOnState ? 'on' : 'off',
      smoke_level: level,
      flame: isAlert,
      relay_alarm: isAlert,
    });
  }

  /**
   * Xóa phòng học khỏi bảng 'rooms' theo mã 'code'
   * Đồng thời xóa các bản ghi cảnh báo liên quan trong bảng 'alerts'
   */
  public async deleteRoom(code: string): Promise<{ success: boolean; error?: string; rlsError?: boolean }> {
    try {
      // 1. Xóa cảnh báo liên quan đến phòng trong bảng alerts
      try {
        await supabase.from('alerts').delete().eq('room_code', code);
      } catch (alertErr) {
        console.warn(`[Supabase deleteRoom] Không thể xóa alerts phòng ${code}:`, alertErr);
      }

      // 2. Xóa phòng khỏi bảng rooms
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('code', code);

      if (error) {
        console.error(`[Supabase deleteRoom] Lỗi xóa phòng ${code}:`, error.message);
        const isRls = error.code === '42501' || error.message.toLowerCase().includes('row-level security');
        if (isRls) {
          this.status.rlsRestricted = true;
          this.status.error = error.message;
        }
        this.notifyWriteEvent({
          table: 'rooms',
          code,
          action: 'Xóa phòng ' + code,
          success: false,
          rlsError: isRls,
          error: error.message,
        });
        return { success: false, error: error.message, rlsError: isRls };
      }

      // Xóa khỏi cache nội bộ
      this.knownRoomsMap.delete(code);
      this.status.rlsRestricted = false;
      this.notifyWriteEvent({
        table: 'rooms',
        code,
        action: 'Xóa phòng ' + code,
        success: true,
      });

      return { success: true };
    } catch (err: any) {
      console.error(`[Supabase deleteRoom] Ngoại lệ khi xóa phòng ${code}:`, err);
      return { success: false, error: err?.message || 'Lỗi ngoại lệ mạng Supabase' };
    }
  }

  // ==========================================
  // ALERTS: Đọc và Ghi bảng 'alerts'
  // ==========================================

  /**
   * Lấy danh sách cảnh báo mới nhất từ bảng 'alerts', sắp xếp created_at giảm dần
   */
  public async fetchAlerts(): Promise<AlertLog[]> {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Supabase fetchAlerts] Lỗi tải bảng alerts:', error.message);
        return [];
      }

      if (data) {
        return data.map((row: DbAlert) => this.mapDbAlertToAlert(row));
      }
      return [];
    } catch (err) {
      console.error('[Supabase fetchAlerts] Ngoại lệ tải alerts:', err);
      return [];
    }
  }

  /**
   * Thêm cảnh báo mới vào bảng 'alerts'
   */
  public async insertAlert(alert: {
    room_code: string;
    type: string;
    message: string;
    level: 'warning' | 'critical';
  }): Promise<AlertLog | null> {
    try {
      const newAlertRow = {
        room_code: alert.room_code,
        type: alert.type,
        message: alert.message,
        level: alert.level,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert([newAlertRow])
        .select()
        .single();

      if (error) {
        console.error('[Supabase insertAlert] Lỗi ghi cảnh báo vào bảng alerts:', error.message);
        return null;
      }
      return data ? this.mapDbAlertToAlert(data) : null;
    } catch (err) {
      console.error('[Supabase insertAlert] Ngoại lệ ghi alert:', err);
      return null;
    }
  }

  /**
   * Xóa một bản ghi cảnh báo khỏi bảng 'alerts'
   */
  public async deleteAlert(alertId: string | number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error(`[Supabase deleteAlert] Lỗi xóa alert ${alertId}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[Supabase deleteAlert] Ngoại lệ:`, err);
      return false;
    }
  }

  /**
   * Xóa toàn bộ cảnh báo của một phòng học cụ thể trong bảng 'alerts'
   */
  public async clearAlertsForRoom(roomCode: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('room_code', roomCode);

      if (error) {
        console.error(`[Supabase clearAlertsForRoom] Lỗi xóa alerts phòng ${roomCode}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[Supabase clearAlertsForRoom] Ngoại lệ:`, err);
      return false;
    }
  }

  /**
   * Xóa toàn bộ cảnh báo trong bảng 'alerts'
   */
  public async clearAllAlerts(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('[Supabase clearAllAlerts] Lỗi xóa bảng alerts:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase clearAllAlerts] Ngoại lệ:', err);
      return false;
    }
  }

  // ==========================================
  // SCHEDULES: Đọc / Thêm / Sửa / Xóa bảng 'schedules'
  // ==========================================

  /**
   * Tải toàn bộ quy tắc lập lịch từ bảng 'schedules'
   */
  public async fetchSchedules(): Promise<ScheduleRule[]> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('[Supabase fetchSchedules] Lỗi tải bảng schedules:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((row: DbSchedule) => this.mapDbScheduleToRule(row));
      }
      return DEFAULT_DB_SCHEDULES.map((row) => this.mapDbScheduleToRule(row));
    } catch (err) {
      console.error('[Supabase fetchSchedules] Ngoại lệ tải schedules:', err);
      return DEFAULT_DB_SCHEDULES.map((row) => this.mapDbScheduleToRule(row));
    }
  }

  /**
   * Bật/tắt cột enabled trong bảng 'schedules'
   */
  public async toggleScheduleEnabled(id: string | number, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ enabled })
        .eq('id', id);

      if (error) {
        console.error('[Supabase toggleScheduleEnabled] Lỗi đổi trạng thái schedule:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase toggleScheduleEnabled] Ngoại lệ schedule toggle:', err);
      return false;
    }
  }

  /**
   * Thêm quy tắc lập lịch mới vào bảng 'schedules'
   */
  public async insertSchedule(rule: Omit<DbSchedule, 'id'>): Promise<ScheduleRule | null> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([rule])
        .select()
        .single();

      if (error) {
        console.error('[Supabase insertSchedule] Lỗi thêm schedule:', error.message);
        return null;
      }
      return data ? this.mapDbScheduleToRule(data) : null;
    } catch (err) {
      console.error('[Supabase insertSchedule] Ngoại lệ insert schedule:', err);
      return null;
    }
  }

  /**
   * Cập nhật quy tắc lập lịch trong bảng 'schedules'
   */
  public async updateSchedule(id: string | number, rule: Partial<DbSchedule>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('schedules')
        .update(rule)
        .eq('id', id);

      if (error) {
        console.error('[Supabase updateSchedule] Lỗi cập nhật schedule:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase updateSchedule] Ngoại lệ update schedule:', err);
      return false;
    }
  }

  /**
   * Xóa quy tắc lập lịch khỏi bảng 'schedules'
   */
  public async deleteSchedule(id: string | number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase deleteSchedule] Lỗi xóa schedule:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase deleteSchedule] Ngoại lệ delete schedule:', err);
      return false;
    }
  }

  // ==========================================
  // SETTINGS: Đọc và Sửa bảng 'settings' (id = 1)
  // ==========================================

  /**
   * Đọc ngưỡng nhiệt độ và khói từ bảng 'settings' (dòng id = 1)
   */
  public async fetchSettings(): Promise<ThresholdSettings | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('[Supabase fetchSettings] Lỗi tải settings:', error.message);
        return null;
      }

      if (data) {
        return {
          highTempThreshold: Number(data.temp_threshold) || 35,
          smokeThreshold: Number(data.smoke_threshold) || 350,
          autoAlertOffHours: true,
          soundEnabled: true,
        };
      }
      return null;
    } catch (err) {
      console.error('[Supabase fetchSettings] Ngoại lệ fetch settings:', err);
      return null;
    }
  }

  /**
   * Cập nhật ngưỡng nhiệt độ và khói trong bảng 'settings' (dòng id = 1)
   */
  public async updateSettings(temp_threshold: number, smoke_threshold: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          temp_threshold,
          smoke_threshold,
        });

      if (error) {
        console.error('[Supabase updateSettings] Lỗi cập nhật settings (id=1):', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase updateSettings] Ngoại lệ update settings:', err);
      return false;
    }
  }

  // ==========================================
  // PROFILES: Đọc, Thêm, Sửa, Xóa bảng 'profiles'
  // ==========================================

  public async fetchProfiles(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('[Supabase fetchProfiles] Lỗi tải profiles:', error.message);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((p: any) => {
          const cleanName = (p.full_name || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

          // Lấy họ và tên tiếng Việt để sinh email chuẩn
          const words = (p.full_name || '').trim().split(/\s+/);
          let emailPrefix = cleanName;
          if (words.length >= 2) {
            const firstName = words[words.length - 1]
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            const lastName = words[0]
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            emailPrefix = `${firstName}.${lastName}`;
          }

          const defaultMail = `${emailPrefix || 'user'}@school.edu.vn`;

          return {
            id: String(p.id),
            name: p.full_name || 'Người dùng',
            email: p.email || defaultMail,
            role: p.role === 'admin' ? 'admin' : 'supervisor',
            avatar: `https://images.unsplash.com/photo-${p.role === 'admin' ? '1534528741775-53994a69daeb' : '1580489944761-15a19d654956'}?w=150&auto=format&fit=crop&q=80`,
            status: 'active',
            createdAt: 'Database Supabase',
          };
        });
      }
      return [];
    } catch (err) {
      console.error('[Supabase fetchProfiles] Ngoại lệ fetch profiles:', err);
      return [];
    }
  }

  /**
   * Thêm người dùng mới vào bảng 'profiles' và đẩy trực tiếp vào Supabase Database
   */
  public async insertProfile(user: { full_name: string; role: 'admin' | 'supervisor'; email?: string; password?: string }): Promise<User | null> {
    try {
      const cleanName = (user.full_name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      const userEmail = user.email || `${cleanName || 'user'}@school.edu.vn`;
      const userPassword = user.password && user.password.length >= 6 ? user.password : 'School@123456';

      let authUserId: string | null = null;

      // 1. Đăng ký qua Supabase Auth để tạo id hợp lệ trong auth.users
      try {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: userEmail,
          password: userPassword,
          options: {
            data: {
              full_name: user.full_name,
              role: user.role,
            },
          },
        });

        if (!authErr && authData.user) {
          authUserId = authData.user.id;
        } else if (authErr) {
          console.warn('[Supabase insertProfile] Supabase Auth signUp note:', authErr.message);
        }
      } catch (authEx) {
        console.warn('[Supabase insertProfile] Auth exception:', authEx);
      }

      // 2. Chèn / Cập nhật vào bảng public.profiles
      const targetId = authUserId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'u-' + Date.now());

      const profilePayload = {
        id: targetId,
        full_name: user.full_name,
        role: user.role,
      };

      // Thử cập nhật trước nếu trigger Auth đã tự tạo dòng trong profiles
      if (authUserId) {
        const { data: updatedProfile, error: updateErr } = await supabase
          .from('profiles')
          .update({ full_name: user.full_name, role: user.role })
          .eq('id', authUserId)
          .select()
          .maybeSingle();

        if (!updateErr && updatedProfile) {
          this.notifyWriteEvent({
            table: 'profiles',
            action: `Đã lưu tài khoản [${user.full_name}] vào Database Supabase`,
            success: true,
          });

          return {
            id: String(updatedProfile.id),
            name: updatedProfile.full_name,
            email: userEmail,
            role: updatedProfile.role === 'admin' ? 'admin' : 'supervisor',
            avatar: `https://images.unsplash.com/photo-${updatedProfile.role === 'admin' ? '1534528741775-53994a69daeb' : '1580489944761-15a19d654956'}?w=150&auto=format&fit=crop&q=80`,
            status: 'active',
            createdAt: 'Database Supabase',
          };
        }
      }

      // Thử upsert trực tiếp vào bảng profiles
      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (insertError) {
        console.warn('[Supabase insertProfile] Lỗi upsert profiles:', insertError.message);
        const isFkOrRls = insertError.code === '23503' || insertError.code === '42501' || insertError.message.toLowerCase().includes('foreign key');
        this.notifyWriteEvent({
          table: 'profiles',
          action: `Lưu tài khoản [${user.full_name}]`,
          success: false,
          rlsError: isFkOrRls,
          error: isFkOrRls ? 'Bảng profiles đang bị chặn bởi khóa ngoại. Bấm "Mở quyền SQL" để chạy lệnh mở khóa!' : insertError.message,
        });
      } else {
        this.notifyWriteEvent({
          table: 'profiles',
          action: `Đã lưu tài khoản [${user.full_name}] (${user.role}) vào Database Supabase`,
          success: true,
        });
      }

      const finalId = (insertedData && insertedData.id) || targetId;
      return {
        id: String(finalId),
        name: (insertedData && insertedData.full_name) || user.full_name,
        email: userEmail,
        role: user.role,
        avatar: `https://images.unsplash.com/photo-${user.role === 'admin' ? '1534528741775-53994a69daeb' : '1580489944761-15a19d654956'}?w=150&auto=format&fit=crop&q=80`,
        status: 'active',
        createdAt: 'Database Supabase',
      };
    } catch (err: any) {
      console.error('[Supabase insertProfile] Ngoại lệ:', err);
      return null;
    }
  }

  /**
   * Cập nhật thông tin profile trong bảng 'profiles'
   */
  public async updateProfile(id: string, updates: { full_name?: string; role?: 'admin' | 'supervisor' }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('[Supabase updateProfile] Lỗi cập nhật profile:', error.message);
        return false;
      }
      this.notifyWriteEvent({
        table: 'profiles',
        action: `Cập nhật thông tin tài khoản (id: ${id.slice(0, 8)}...)`,
        success: true,
      });
      return true;
    } catch (err) {
      console.error('[Supabase updateProfile] Ngoại lệ update profile:', err);
      return false;
    }
  }

  /**
   * Xóa profile khỏi bảng 'profiles'
   */
  public async deleteProfile(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase deleteProfile] Lỗi xóa profile:', error.message);
        return false;
      }
      this.notifyWriteEvent({
        table: 'profiles',
        action: `Xóa tài khoản khỏi Database (id: ${id.slice(0, 8)}...)`,
        success: true,
      });
      return true;
    } catch (err) {
      console.error('[Supabase deleteProfile] Ngoại lệ delete profile:', err);
      return false;
    }
  }

  // ==========================================
  // REALTIME: Subscribe postgres_changes cho rooms & alerts
  // ==========================================

  /**
   * Thiết lập Realtime Channel cho bảng 'rooms' và 'alerts'
   */
  /**
   * Thiết lập Realtime Channel cho bảng 'rooms', 'sensor_data' và 'alerts'
   */
  public subscribeRealtime(
    onRoomChange: (updatedRoom: Room) => void,
    onAlertChange: (newAlert: AlertLog) => void,
    onSensorDataChange?: (sensor: DbSensorData) => void
  ) {
    try {
      const channel = supabase
        .channel('smart-classroom-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms' },
          (payload) => {
            if (payload.new) {
              const mapped = this.mapDbRoomToRoom(payload.new as DbRoom);
              onRoomChange(mapped);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sensor_data' },
          (payload) => {
            if (payload.new) {
              const sensor = payload.new as DbSensorData;
              onSensorDataChange?.(sensor);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'alerts' },
          (payload) => {
            if (payload.new) {
              const mappedAlert = this.mapDbAlertToAlert(payload.new as DbAlert);
              const msgLower = (mappedAlert.message || '').toLowerCase();
              if (!msgLower.includes('phòng này đã ngắt điện') &&
                  !msgLower.includes('[test') &&
                  !msgLower.includes('test cảnh báo')) {
                onAlertChange(mappedAlert);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Realtime connected
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('[Supabase subscribeRealtime] Lỗi đăng ký Realtime:', err);
      return () => {};
    }
  }
}

export const supabaseService = new SupabaseService();
