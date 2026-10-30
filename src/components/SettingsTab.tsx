/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  Flame, 
  Thermometer, 
  Volume2, 
  VolumeX, 
  Check, 
  X, 
  Radio, 
  Info,
  KeyRound,
  ExternalLink,
  Save,
  Database
} from 'lucide-react';
import { ThresholdSettings, User, UserRole } from '../types';

interface SettingsTabProps {
  settings: ThresholdSettings;
  onUpdateSettings: (newSettings: ThresholdSettings) => void;
  users: User[];
  currentUser: User | null;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  mqttInfo: {
    brokerUrl: string;
    status: string;
    latency: number;
    activeSubscriptions: number;
    protocol: string;
  };
  supabaseInfo?: {
    isConnected: boolean;
    url: string;
    projectId: string;
    lastSync?: string;
    dbRoomCount?: number;
    rlsRestricted?: boolean;
  };
  roomsCount?: number;
  dbRoomCount?: number;
  onPushToDatabase?: () => Promise<void> | void;
  onFetchFromDatabase?: () => Promise<void> | void;
  onOpenSqlHelper?: () => void;
  isPushingDb?: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  mqttInfo,
  supabaseInfo,
  roomsCount = 12,
  dbRoomCount,
  onPushToDatabase,
  onFetchFromDatabase,
  onOpenSqlHelper,
  isPushingDb,
}) => {
  // Local state for sliders before saving
  const [tempThreshold, setTempThreshold] = useState(settings.highTempThreshold);
  const [smokeThreshold, setSmokeThreshold] = useState(settings.smokeThreshold);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [autoAlertOffHours, setAutoAlertOffHours] = useState(settings.autoAlertOffHours);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // User management modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('supervisor');
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>('active');

  const isAdmin = currentUser?.role === 'admin';

  const handleSaveThresholds = () => {
    onUpdateSettings({
      highTempThreshold: tempThreshold,
      smokeThreshold: smokeThreshold,
      soundEnabled,
      autoAlertOffHours,
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('supervisor');
    setUserStatus('active');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserStatus(u.status);
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: userName,
        email: userEmail,
        role: userRole,
        status: userStatus,
      });
    } else {
      onAddUser({
        name: userName,
        email: userEmail,
        role: userRole,
        status: userStatus,
        avatar: `https://images.unsplash.com/photo-${
          userRole === 'admin' ? '1534528741775-53994a69daeb' : '1580489944761-15a19d654956'
        }?w=150&auto=format&fit=crop&q=80`,
      });
    }
    setIsUserModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-12 max-w-5xl mx-auto">
      {/* Toast notification when saved */}
      {isSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Đã lưu thành công cấu hình hệ thống!</span>
        </div>
      )}

      {/* Permission alert for Supervisor */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0 text-amber-400" />
          <p>
            Bạn đang đăng nhập với vai trò <strong>Giám thị</strong>. Bạn có quyền xem cấu hình, nhưng chỉ <strong>Quản trị viên (Admin)</strong> mới có quyền thêm/xóa tài khoản người dùng hoặc thay đổi ngưỡng an toàn. Bạn có thể chuyển sang tài khoản Admin ở góc trên bên phải để thử nghiệm.
          </p>
        </div>
      )}

      {/* ================= 1. CẤU HÌNH NGƯỠNG CẢNH BÁO SENSOR ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cấu hình Ngưỡng Cảnh báo An toàn</h3>
              <p className="text-xs text-slate-400">
                Hệ thống tự động phát cảnh báo đỏ và ghi nhật ký khi cảm biến đo vượt ngưỡng này
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveThresholds}
            disabled={!isAdmin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-orange-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Lưu cấu hình</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ngưỡng Nhiệt độ */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-white text-xs">Ngưỡng Nhiệt độ Cao</span>
              </div>
              <span className="font-mono font-black text-orange-400 text-lg">
                {tempThreshold}°C
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Kích hoạt cảnh báo khi nhiệt độ phòng vượt quá mức cài đặt (bình thường 24-28°C).
            </p>

            <input
              type="range"
              min="30"
              max="50"
              step="1"
              disabled={!isAdmin}
              value={tempThreshold}
              onChange={(e) => setTempThreshold(Number(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30°C (Cảnh báo sớm)</span>
              <span>40°C (Khẩn cấp)</span>
              <span>50°C</span>
            </div>
          </div>

          {/* Ngưỡng Khói */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="font-bold text-white text-xs">Ngưỡng Nồng độ Khói / Khí gas</span>
              </div>
              <span className="font-mono font-black text-red-400 text-lg">
                {smokeThreshold} ppm
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Kích hoạt còi báo cháy và nhấp nháy đỏ khi nồng độ khói vượt mức này (an toàn &lt; 100 ppm).
            </p>

            <input
              type="range"
              min="150"
              max="800"
              step="25"
              disabled={!isAdmin}
              value={smokeThreshold}
              onChange={(e) => setSmokeThreshold(Number(e.target.value))}
              className="w-full accent-red-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>150 ppm (Rất nhạy)</span>
              <span>350 ppm (Khuyên dùng)</span>
              <span>800 ppm</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <p className="font-bold text-white text-xs">Âm thanh hiệu ứng & Còi cảnh báo</p>
              <p className="text-[11px] text-slate-400">Bật âm thanh khi bấm nút và có báo động</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <p className="font-bold text-white text-xs">Cảnh báo quên tắt điện sau 18:00</p>
              <p className="text-[11px] text-slate-400">Tự động gửi thông báo nếu phòng còn mở thiết bị</p>
            </div>
            <button
              onClick={() => setAutoAlertOffHours(!autoAlertOffHours)}
              className={`w-12 h-7 rounded-full p-1 transition-colors relative ${
                autoAlertOffHours ? 'bg-orange-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  autoAlertOffHours ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG & PHÂN QUYỀN ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Quản lý Tài khoản & Phân quyền</h3>
              <p className="text-xs text-slate-400">
                Danh sách cán bộ quản lý (Quản trị viên, Giám thị tòa nhà)
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-transform active:scale-95 shadow-md shadow-blue-600/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thêm tài khoản</span>
            </button>
          )}
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Họ và tên</th>
                <th className="py-3 px-3">Email liên hệ</th>
                <th className="py-3 px-3">Vai trò phân quyền</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-normal">
                                Bạn
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">Tạo: {u.createdAt}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300 font-mono">{u.email}</td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {u.role === 'admin' ? 'Quản trị viên' : 'Giám thị'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {u.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              title="Sửa tài khoản"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteUser(u.id)}
                              disabled={isCurrent}
                              title={isCurrent ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 3. THÔNG TIN KẾT NỐI IOT CORE / MQTT SERVICE ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Thông số Cổng kết nối IoT (MQTT Broker)</h3>
            <p className="text-xs text-slate-400">
              Kiến trúc pub/sub độc lập, sẵn sàng cắm nối phần cứng ThingsBoard / Blynk / ESP32
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Giao thức</p>
            <p className="font-bold text-white mt-0.5">{mqttInfo.protocol}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Trạng thái kết nối</p>
            <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              Connected (Online)
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Độ trễ ping</p>
            <p className="font-mono font-bold text-cyan-400 mt-0.5">{mqttInfo.latency} ms</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Topic Prefix</p>
            <p className="font-mono font-bold text-amber-400 mt-0.5">classroom/+/telemetry</p>
          </div>
        </div>
      </div>

      {/* ================= 4. THÔNG TIN CƠ SỞ DỮ LIỆU SUPABASE ================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cơ sở dữ liệu Supabase Cloud</h3>
              <p className="text-xs text-slate-400">
                Đã kết nối với Database <span className="font-mono text-emerald-400">{supabaseInfo?.projectId || 'cuygczfkktprkyosabtu'}</span>
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Đã kết nối
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Phòng học trong App</p>
            <p className="font-mono font-bold text-amber-400 text-sm mt-0.5">
              {roomsCount} phòng học
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Phòng trong Database</p>
            <p className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
              {dbRoomCount !== undefined ? `${dbRoomCount} phòng học` : 'Đang kiểm tra...'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Supabase Project ID</p>
            <p className="font-mono font-semibold text-white mt-0.5 truncate" title={supabaseInfo?.url}>
              {supabaseInfo?.projectId || 'cuygczfkktprkyosabtu'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <p className="text-slate-400 text-[10px]">Trạng thái đồng bộ</p>
            <p className="font-semibold text-cyan-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {dbRoomCount === roomsCount ? 'Khớp 100%' : 'Cần đồng bộ'}
            </p>
          </div>
        </div>

        {/* Cảnh báo số lượng phòng nếu chưa khớp */}
        {dbRoomCount !== undefined && dbRoomCount !== roomsCount && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-base">⚠️</span>
              <div>
                <p className="font-bold text-amber-300">
                  Số lượng phòng học đang lệch: App có {roomsCount} phòng, Database có {dbRoomCount} phòng.
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Bạn có thể chọn nạp phòng từ Database về App, hoặc đẩy danh sách phòng chuẩn từ App lên Database.
                </p>
              </div>
            </div>
            {onOpenSqlHelper && (
              <button
                type="button"
                onClick={onOpenSqlHelper}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] whitespace-nowrap transition-colors"
              >
                Mở lệnh SQL RLS
              </button>
            )}
          </div>
        )}

        {/* Nút bấm Đồng bộ dữ liệu phòng học vào Supabase */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white">Đồng bộ số liệu phòng học với Database</p>
            <p className="text-[11px] text-slate-400">
              Cập nhật {roomsCount} phòng học, trạng thái cảm biến, lịch trình tự động vào Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onFetchFromDatabase && (
              <button
                onClick={() => onFetchFromDatabase()}
                disabled={isPushingDb}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>NẠP TỪ DATABASE</span>
              </button>
            )}

            {onPushToDatabase && (
              <button
                onClick={() => onPushToDatabase()}
                disabled={isPushingDb}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                <Database className={`w-4 h-4 ${isPushingDb ? 'animate-spin' : ''}`} />
                <span>{isPushingDb ? 'Đang đồng bộ...' : 'ĐẨY LÊN DATABASE NGAY'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL: THÊM / SỬA TÀI KHOẢN ================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingUser ? 'Chỉnh sửa Tài khoản' : 'Thêm Người dùng mới'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Minh"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email trường</label>
                <input
                  type="email"
                  required
                  placeholder="minh.nguyen@school.edu.vn"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phân quyền</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="supervisor">Giám thị</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trạng thái</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
                >
                  {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
