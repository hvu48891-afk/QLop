/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, AlertLog, ScheduleRule, User, ThresholdSettings, ActivityLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'ThS. Nguyễn Văn An',
    email: 'admin.an@school.edu.vn',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '15/01/2026',
  },
  {
    id: 'u2',
    name: 'Trần Thị Mai (Giám thị Tòa A)',
    email: 'mai.tran@school.edu.vn',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '01/03/2026',
  },
  {
    id: 'u3',
    name: 'Lê Hoàng Nam (Giám thị Tòa B-C)',
    email: 'nam.le@school.edu.vn',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    createdAt: '10/05/2026',
  },
];

export const INITIAL_ROOMS: Room[] = [];

export const INITIAL_ALERTS: AlertLog[] = [];

export const INITIAL_RULES: ScheduleRule[] = [
  {
    id: 'rule-01',
    title: 'Tắt toàn bộ điện sau giờ học',
    scope: 'all',
    targetId: 'all',
    targetName: 'Toàn trường',
    action: 'turn_off_all',
    time: '17:30',
    daysOfWeek: [1, 2, 3, 4, 5, 6], // T2 -> T7 (trừ Chủ nhật)
    isEnabled: true,
    description: 'Tắt toàn bộ điện vào lúc 17:30 hằng ngày trừ Chủ nhật',
  },
  {
    id: 'rule-02',
    title: 'Bật làm mát đón tiết học sáng',
    scope: 'all',
    targetId: 'all',
    targetName: 'Toàn bộ phòng học',
    action: 'turn_on_ac',
    time: '06:45',
    daysOfWeek: [1, 2, 3, 4, 5], // T2 -> T6
    isEnabled: true,
    description: 'Khởi động điều hòa 24°C trước 15 phút vào lớp',
  },
  {
    id: 'rule-03',
    title: 'Tắt máy chiếu và điều hòa trưa',
    scope: 'all',
    targetId: 'all',
    targetName: 'Toàn bộ phòng học',
    action: 'turn_off_ac_proj',
    time: '11:45',
    daysOfWeek: [1, 2, 3, 4, 5],
    isEnabled: false,
    description: 'Tắt máy chiếu và điều hòa giải lao trưa để tiết kiệm điện năng',
  },
];

export const INITIAL_SETTINGS: ThresholdSettings = {
  highTempThreshold: 35,
  smokeThreshold: 350,
  autoAlertOffHours: true,
  soundEnabled: true,
};

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    timestamp: 'Hôm nay',
    user: 'Hệ thống',
    action: 'Đã kết nối và đồng bộ với cơ sở dữ liệu Supabase',
    roomId: 'SYSTEM',
    roomName: 'Toàn trường',
  },
];

