/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Plus,
  Trash2,
  Edit3,
  Play,
  Clock,
  Calendar,
  Repeat,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
  ListFilter,
  Tag,
} from 'lucide-react';
import {
  ScheduleRule,
  ScheduleScope,
  ScheduleAction,
  ScheduleType,
  EventCategory,
  Room,
} from '../types';

interface SchedulesTabProps {
  rules: ScheduleRule[];
  rooms: Room[];
  onToggleRule: (ruleId: string) => void;
  onSaveRule: (rule: ScheduleRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onTriggerRuleNow: (rule: ScheduleRule) => void;
  timeInfo?: import('../services/timeSyncService').TimeSyncInfo;
  onOpenTimeSyncModal?: () => void;
}

const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateVN = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
};

const CATEGORY_META: Record<
  EventCategory,
  { label: string; badge: string; pillBg: string; dot: string }
> = {
  ceremony: {
    label: 'Sự kiện / Lễ hội',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    pillBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
  },
  exam: {
    label: 'Lịch thi',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    pillBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  class: {
    label: 'Lớp học / Hội thảo',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    pillBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  maintenance: {
    label: 'Bảo trì điện',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    pillBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  holiday: {
    label: 'Ngày nghỉ lễ',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    pillBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
};

const ACTION_LABELS: Record<string, string> = {
  turn_off_all: 'Tắt toàn bộ điện',
  turn_off_ac_proj: 'Tắt điều hòa & máy chiếu',
  turn_on_ac: 'Bật điều hòa 24°C',
  mode_study: 'Bật chế độ học tập',
  mode_presentation: 'Bật chế độ sự kiện / trình chiếu',
};

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
  rules,
  rooms,
  onToggleRule,
  onSaveRule,
  onDeleteRule,
  onTriggerRuleNow,
  timeInfo,
  onOpenTimeSyncModal,
}) => {
  const activeNow = timeInfo ? timeInfo.currentTime : new Date();
  const todayISO = formatDateISO(activeNow);

  const [viewMode, setViewMode] = useState<'calendar' | 'rules'>('calendar');
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [ruleFilter, setRuleFilter] = useState<'all' | 'event' | 'recurring'>('all');

  const [calendarCursor, setCalendarCursor] = useState<Date>(() => {
    const base = timeInfo ? timeInfo.currentTime : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);

  // Form state
  const [formScheduleType, setFormScheduleType] = useState<ScheduleType>('event');
  const [formTitle, setFormTitle] = useState('');
  const [formEventDate, setFormEventDate] = useState<string>(todayISO);
  const [formEndTime, setFormEndTime] = useState<string>('');
  const [formCategory, setFormCategory] = useState<EventCategory>('ceremony');
  const [formScope, setFormScope] = useState<ScheduleScope>('building');
  const [formTargetId, setFormTargetId] = useState('Tòa A');
  const [formAction, setFormAction] = useState<ScheduleAction>('mode_presentation');
  const [formTime, setFormTime] = useState('07:30');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // T2 - T7

  const daysLabel = [
    { day: 1, label: 'Thứ 2', short: 'T2' },
    { day: 2, label: 'Thứ 3', short: 'T3' },
    { day: 3, label: 'Thứ 4', short: 'T4' },
    { day: 4, label: 'Thứ 5', short: 'T5' },
    { day: 5, label: 'Thứ 6', short: 'T6' },
    { day: 6, label: 'Thứ 7', short: 'T7' },
    { day: 0, label: 'Chủ nhật', short: 'CN' },
  ];

  // Phân loại rule theo lịch sự kiện (theo ngày) vs lịch định kỳ (theo thứ)
  const eventRules = useMemo(
    () =>
      rules
        .filter((r) => r.scheduleType === 'event' && Boolean(r.eventDate))
        .sort((a, b) => {
          const cmp = (a.eventDate || '').localeCompare(b.eventDate || '');
          return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
        }),
    [rules]
  );

  const recurringRules = useMemo(
    () =>
      rules
        .filter((r) => r.scheduleType !== 'event')
        .sort((a, b) => a.time.localeCompare(b.time)),
    [rules]
  );

  const upcomingEvents = useMemo(
    () => eventRules.filter((r) => (r.eventDate || '') >= todayISO),
    [eventRules, todayISO]
  );

  // Helper lấy sự kiện của 1 ngày cụ thể
  const getScheduleForDate = (dateObj: Date) => {
    const iso = formatDateISO(dateObj);
    const dow = dateObj.getDay();
    const dayEvents = eventRules.filter((r) => r.eventDate === iso);
    const dayRecurring = recurringRules.filter((r) => r.daysOfWeek.includes(dow));
    return { iso, dow, dayEvents, dayRecurring };
  };

  // Xây dựng lưới ngày cho Month view (42 ô: T2 -> CN)
  const monthGridDays = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstDow = firstOfMonth.getDay(); // 0=CN..6=T7
    const offsetFromMonday = firstDow === 0 ? 6 : firstDow - 1;
    const gridStart = new Date(year, month, 1 - offsetFromMonday);

    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
    }
    return cells;
  }, [calendarCursor]);

  // Xây dựng 7 ngày cho Week view dựa trên selectedDateISO
  const weekDays = useMemo(() => {
    const base = new Date(`${selectedDateISO}T00:00:00`);
    const dow = base.getDay();
    const offsetFromMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - offsetFromMonday);
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      arr.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    }
    return arr;
  }, [selectedDateISO]);

  const selectedDateObj = useMemo(() => new Date(`${selectedDateISO}T00:00:00`), [selectedDateISO]);
  const selectedDaySchedule = useMemo(
    () => getScheduleForDate(selectedDateObj),
    [selectedDateObj, eventRules, recurringRules]
  );

  const handleOpenCreateModal = (presetType: ScheduleType = 'event', presetDate?: string) => {
    setEditingRule(null);
    setFormScheduleType(presetType);
    setFormTitle('');
    setFormEventDate(presetDate || selectedDateISO || todayISO);
    setFormEndTime('');
    setFormCategory('ceremony');
    setFormScope('building');
    setFormTargetId('Tòa A');
    setFormAction(presetType === 'event' ? 'mode_presentation' : 'turn_off_all');
    setFormTime(presetType === 'event' ? '07:30' : '17:30');
    setFormDays([1, 2, 3, 4, 5, 6]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: ScheduleRule) => {
    setEditingRule(rule);
    const isEvt = rule.scheduleType === 'event' && Boolean(rule.eventDate);
    setFormScheduleType(isEvt ? 'event' : 'recurring');
    setFormTitle(rule.title);
    setFormEventDate(rule.eventDate || selectedDateISO || todayISO);
    setFormEndTime(rule.endTime || '');
    setFormCategory(rule.eventCategory || 'ceremony');
    setFormScope(rule.scope);
    setFormTargetId(rule.targetId);
    setFormAction(rule.action);
    setFormTime(rule.time);
    setFormDays(rule.daysOfWeek);
    setIsModalOpen(true);
  };

  const handleToggleDay = (d: number) => {
    if (formDays.includes(d)) {
      setFormDays(formDays.filter((x) => x !== d));
    } else {
      setFormDays([...formDays, d].sort());
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let targetName = 'Toàn bộ trường';
    if (formScope === 'building') {
      targetName = formTargetId;
    } else if (formScope === 'room') {
      const rm = rooms.find((r) => (r.code || r.id) === formTargetId);
      targetName = rm ? rm.name : formTargetId;
    }

    const actionLabel = ACTION_LABELS[formAction] || formAction;

    if (formScheduleType === 'event') {
      const evtDow = new Date(`${formEventDate}T00:00:00`).getDay();
      const desc = `Sự kiện ngày ${formatDateVN(formEventDate)} (${formTime}${
        formEndTime ? ` - ${formEndTime}` : ''
      }) • ${actionLabel} tại ${targetName}`;

      const newRule: ScheduleRule = {
        id: editingRule ? editingRule.id : `evt-${Date.now()}`,
        title: formTitle.trim(),
        scheduleType: 'event',
        eventDate: formEventDate,
        endTime: formEndTime || undefined,
        eventCategory: formCategory,
        scope: formScope,
        targetId: formTargetId,
        targetName,
        action: formAction,
        time: formTime,
        daysOfWeek: [evtDow],
        isEnabled: editingRule ? editingRule.isEnabled : true,
        description: desc,
      };
      onSaveRule(newRule);
      setSelectedDateISO(formEventDate);
      const evtDateObj = new Date(`${formEventDate}T00:00:00`);
      setCalendarCursor(new Date(evtDateObj.getFullYear(), evtDateObj.getMonth(), 1));
      setIsModalOpen(false);
      return;
    }

    const daysText =
      formDays.length === 7
        ? 'Hằng ngày'
        : formDays.length === 6 && !formDays.includes(0)
        ? 'Hằng ngày trừ Chủ nhật'
        : formDays.length === 5 && !formDays.includes(6) && !formDays.includes(0)
        ? 'Thứ 2 đến Thứ 6'
        : `Các ngày: ${formDays.map((d) => (d === 0 ? 'CN' : `T${d + 1}`)).join(', ')}`;

    const desc = `${actionLabel} tại ${targetName} vào lúc ${formTime} (${daysText})`;

    const newRule: ScheduleRule = {
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      title: formTitle.trim(),
      scheduleType: 'recurring',
      scope: formScope,
      targetId: formTargetId,
      targetName,
      action: formAction,
      time: formTime,
      daysOfWeek: formDays,
      isEnabled: editingRule ? editingRule.isEnabled : true,
      description: desc,
    };

    onSaveRule(newRule);
    setIsModalOpen(false);
  };

  const handlePrevMonth = () => {
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    const now = timeInfo ? timeInfo.currentTime : new Date();
    setCalendarCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateISO(formatDateISO(now));
  };

  const filteredRules = useMemo(() => {
    if (ruleFilter === 'event') return eventRules;
    if (ruleFilter === 'recurring') return recurringRules;
    return [...eventRules, ...recurringRules];
  }, [ruleFilter, eventRules, recurringRules]);

  const monthTitle = calendarCursor.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDateFullLabel = selectedDateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      {/* Top Header & View Mode Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-400" />
            Lịch sự kiện & Tự động hóa (Event Schedule)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tạo lịch sự kiện theo ngày cụ thể, lịch thi, bảo trì & quy tắc tự động điều khiển phòng học
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Switch tab */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Lịch sự kiện</span>
            </button>
            <button
              onClick={() => setViewMode('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'rules'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh sách ({rules.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal('event', selectedDateISO)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Sự Kiện</span>
          </button>
        </div>
      </div>

      {/* Realtime Engine Status & Time Sync Banner */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">
                Hệ thống Lập lịch Chạy theo Thời gian thực
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ngày & Giờ hiện tại:{' '}
              <strong className="text-slate-200 font-semibold capitalize">
                {activeNow.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </strong>
              {' — '}
              <strong className="text-orange-400 font-mono tabular-nums">
                {activeNow.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </strong>
              {' '}• Tự động kích hoạt đúng ngày & giờ sự kiện
            </p>
          </div>
        </div>

        {onOpenTimeSyncModal && (
          <button
            onClick={onOpenTimeSyncModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Repeat className="w-3.5 h-3.5 text-orange-400" />
            <span>Đồng bộ thời gian chuẩn NTP</span>
          </button>
        )}
      </div>

      {/* ================= VIEW 1: LỊCH SỰ KIỆN (MONTH / WEEK CALENDAR + DAY AGENDA) ================= */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          {/* Upcoming Events Strip */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h4 className="font-bold text-white text-sm">
                  Sự kiện sắp diễn ra ({upcomingEvents.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('event', todayISO)}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm sự kiện mới</span>
              </button>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {upcomingEvents.slice(0, 6).map((ev) => {
                  const cat = CATEGORY_META[ev.eventCategory || 'ceremony'] || CATEGORY_META.ceremony;
                  const isTodayEvt = ev.eventDate === todayISO;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        if (ev.eventDate) {
                          setSelectedDateISO(ev.eventDate);
                          const d = new Date(`${ev.eventDate}T00:00:00`);
                          setCalendarCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all hover:border-orange-500/50 ${
                        isTodayEvt
                          ? 'bg-orange-500/10 border-orange-500/40'
                          : 'bg-slate-950/70 border-slate-800'
                      } ${!ev.isEnabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${cat.badge}`}>
                          {cat.label}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-orange-400">
                          {isTodayEvt ? 'Hôm nay' : formatDateVN(ev.eventDate || '')} • {ev.time}
                        </span>
                      </div>
                      <p className="font-bold text-white text-xs truncate">{ev.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ev.targetName} • {ACTION_LABELS[ev.action] || ev.action}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>
                  Chưa có sự kiện theo ngày nào sắp tới. Chọn một ngày trên lịch hoặc bấm{' '}
                  <strong className="text-orange-300">+ Tạo Sự Kiện</strong> để lên lịch (họp, lễ, lịch thi, bảo trì...).
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('event', selectedDateISO)}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold whitespace-nowrap hover:bg-orange-500/30"
                >
                  + Tạo sự kiện ngày {formatDateVN(selectedDateISO)}
                </button>
              </div>
            )}
          </div>

          {/* Main Calendar + Selected Day Agenda */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* LEFT: Month / Week Calendar Grid */}
            <div className="xl:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
              {/* Calendar Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Tháng trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h4 className="font-bold text-white text-sm sm:text-base capitalize min-w-[140px] text-center">
                    {monthTitle}
                  </h4>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Tháng sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToday}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-orange-300 transition-colors"
                  >
                    Hôm nay
                  </button>
                </div>

                {/* Month / Week switcher */}
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      calendarView === 'month'
                        ? 'bg-orange-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      calendarView === 'week'
                        ? 'bg-orange-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Theo Tuần
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                  Sự kiện / Lễ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  Lịch thi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Bảo trì
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                  Lịch lặp định kỳ tuần
                </span>
              </div>

              {calendarView === 'month' ? (
                <div className="space-y-2">
                  {/* Weekday header */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {daysLabel.map((d) => (
                      <div key={d.day} className="py-1.5">
                        <span className="hidden sm:inline">{d.label}</span>
                        <span className="sm:hidden">{d.short}</span>
                      </div>
                    ))}
                  </div>

                  {/* Month cells */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {monthGridDays.map((cellDate) => {
                      const isCurrentMonth =
                        cellDate.getMonth() === calendarCursor.getMonth() &&
                        cellDate.getFullYear() === calendarCursor.getFullYear();
                      const { iso, dayEvents, dayRecurring } = getScheduleForDate(cellDate);
                      const isToday = iso === todayISO;
                      const isSelected = iso === selectedDateISO;
                      const activeRecurringCount = dayRecurring.filter((r) => r.isEnabled).length;
                      const activeEventCount = dayEvents.filter((r) => r.isEnabled).length;

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setSelectedDateISO(iso)}
                          className={`min-h-[78px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'bg-orange-500/15 border-orange-500 ring-1 ring-orange-500/40'
                              : isToday
                              ? 'bg-slate-950 border-orange-500/60'
                              : isCurrentMonth
                              ? 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                              : 'bg-slate-950/30 border-slate-900/60 opacity-45 hover:opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-xs font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center ${
                                isToday
                                  ? 'bg-orange-500 text-slate-950'
                                  : isSelected
                                  ? 'text-orange-300'
                                  : 'text-slate-300'
                              }`}
                            >
                              {cellDate.getDate()}
                            </span>
                            {activeEventCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-300">
                                {activeEventCount}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 w-full mt-1">
                            {dayEvents.slice(0, 2).map((ev) => {
                              const cat =
                                CATEGORY_META[ev.eventCategory || 'ceremony'] ||
                                CATEGORY_META.ceremony;
                              return (
                                <div
                                  key={ev.id}
                                  className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold truncate ${
                                    cat.pillBg
                                  } ${!ev.isEnabled ? 'opacity-45 line-through' : ''}`}
                                >
                                  {ev.time} {ev.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-[9px] text-orange-300 font-bold pl-1">
                                +{dayEvents.length - 2} sự kiện khác
                              </div>
                            )}
                            {dayEvents.length === 0 && activeRecurringCount > 0 && (
                              <div className="text-[9px] text-slate-400 font-medium px-1 truncate">
                                • {activeRecurringCount} lịch định kỳ
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* WEEK VIEW */
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
                  {weekDays.map((dayObj) => {
                    const { iso, dayEvents, dayRecurring } = getScheduleForDate(dayObj);
                    const isToday = iso === todayISO;
                    const isSelected = iso === selectedDateISO;
                    const dayShort = dayObj.toLocaleDateString('vi-VN', { weekday: 'short' });
                    const dayNum = dayObj.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    });

                    return (
                      <div
                        key={iso}
                        onClick={() => setSelectedDateISO(iso)}
                        className={`rounded-2xl border p-2.5 flex flex-col min-h-[180px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500'
                            : isToday
                            ? 'bg-slate-950 border-orange-500/50'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                          <div>
                            <span className="font-bold text-xs text-orange-300 block capitalize">
                              {dayShort}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{dayNum}</span>
                          </div>
                          {isToday && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500 text-slate-950 font-black">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          {dayEvents.map((ev) => {
                            const cat =
                              CATEGORY_META[ev.eventCategory || 'ceremony'] ||
                              CATEGORY_META.ceremony;
                            return (
                              <div
                                key={ev.id}
                                className={`p-2 rounded-xl border text-[11px] ${cat.pillBg} ${
                                  !ev.isEnabled ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="font-mono font-bold text-[10px]">{ev.time}</div>
                                <p className="font-bold truncate">{ev.title}</p>
                                <p className="text-[10px] opacity-80 truncate">{ev.targetName}</p>
                              </div>
                            );
                          })}

                          {dayRecurring
                            .filter((r) => r.isEnabled)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]"
                              >
                                <div className="font-mono font-bold text-orange-400 text-[10px]">
                                  {r.time} • Định kỳ
                                </div>
                                <p className="font-semibold text-slate-200 truncate">{r.title}</p>
                                <p className="text-[10px] text-slate-400 truncate">{r.targetName}</p>
                              </div>
                            ))}

                          {dayEvents.length === 0 &&
                            dayRecurring.filter((r) => r.isEnabled).length === 0 && (
                              <div className="text-[10px] text-slate-600 text-center py-6">
                                Trống lịch
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Selected Day Agenda Panel */}
            <div className="xl:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">
                    Chi tiết ngày đang chọn
                  </span>
                  <h4 className="font-bold text-white text-base capitalize mt-0.5">
                    {selectedDateFullLabel}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDaySchedule.dayEvents.length} sự kiện theo ngày •{' '}
                    {selectedDaySchedule.dayRecurring.filter((r) => r.isEnabled).length} lịch định kỳ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('event', selectedDateISO)}
                  className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Thêm</span>
                </button>
              </div>

              {/* Section 1: Sự kiện đặc biệt trong ngày */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    Sự kiện trong ngày
                  </span>
                </div>

                {selectedDaySchedule.dayEvents.length > 0 ? (
                  selectedDaySchedule.dayEvents.map((ev) => {
                    const cat =
                      CATEGORY_META[ev.eventCategory || 'ceremony'] || CATEGORY_META.ceremony;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-2xl border bg-slate-950/80 border-slate-800 space-y-2 ${
                          !ev.isEnabled ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${cat.badge}`}>
                            {cat.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-orange-400">
                            {ev.time}
                            {ev.endTime ? ` - ${ev.endTime}` : ''}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-bold text-white text-sm">{ev.title}</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ev.targetName} • {ACTION_LABELS[ev.action] || ev.action}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onTriggerRuleNow(ev)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 text-orange-400 fill-orange-400" />
                              Chạy ngay
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(ev)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Sửa sự kiện"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRule(ev.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400"
                              title="Xóa sự kiện"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onToggleRule(ev.id)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                              ev.isEnabled ? 'bg-orange-500' : 'bg-slate-800'
                            }`}
                            title={ev.isEnabled ? 'Đang bật' : 'Đang tắt'}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                ev.isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">Không có sự kiện đặc biệt nào trong ngày này.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal('event', selectedDateISO)}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300"
                    >
                      + Đặt lịch sự kiện cho ngày {formatDateVN(selectedDateISO)}
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Lịch tự động định kỳ thứ này */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-orange-400" />
                    Lịch định kỳ hằng tuần
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('recurring')}
                    className="text-[11px] text-slate-400 hover:text-orange-300 font-semibold"
                  >
                    + Lịch tuần
                  </button>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {selectedDaySchedule.dayRecurring.length > 0 ? (
                    selectedDaySchedule.dayRecurring.map((r) => (
                      <div
                        key={r.id}
                        className={`p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2 ${
                          !r.isEnabled ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-orange-400">
                              {r.time}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 truncate">
                              {r.targetName}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate mt-0.5">
                            {r.title}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onTriggerRuleNow(r)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400"
                            title="Thực thi ngay"
                          >
                            <Play className="w-3.5 h-3.5 fill-orange-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Sửa quy tắc"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-3">
                      Không có lịch định kỳ vào thứ này.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: RULES & EVENTS LIST ================= */}
      {viewMode === 'rules' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRuleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ruleFilter === 'all'
                    ? 'bg-orange-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({rules.length})
              </button>
              <button
                type="button"
                onClick={() => setRuleFilter('event')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ruleFilter === 'event'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sự kiện theo ngày ({eventRules.length})
              </button>
              <button
                type="button"
                onClick={() => setRuleFilter('recurring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ruleFilter === 'recurring'
                    ? 'bg-slate-800 text-orange-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lịch lặp tuần ({recurringRules.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateModal('recurring')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Repeat className="w-3.5 h-3.5 text-orange-400" />
              <span>+ Tạo Lịch lặp tuần</span>
            </button>
          </div>

          {filteredRules.length === 0 && (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <CalendarClock className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-bold text-white text-sm">
                Chưa có sự kiện hoặc quy tắc nào trong bảng schedules
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Mọi sự kiện và quy tắc bạn tạo sẽ được lưu trực tiếp vào bảng{' '}
                <code className="text-orange-300">schedules</code> trên Supabase và tự động thực thi đúng giờ.
              </p>
              <button
                onClick={() => handleOpenCreateModal('event', todayISO)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tạo Sự kiện đầu tiên</span>
              </button>
            </div>
          )}

          {filteredRules.map((rule) => {
            const isEvt = rule.scheduleType === 'event' && Boolean(rule.eventDate);
            const cat = CATEGORY_META[rule.eventCategory || 'ceremony'] || CATEGORY_META.ceremony;

            return (
              <div
                key={rule.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                  rule.isEnabled
                    ? 'bg-slate-900/95 border-slate-800 hover:border-slate-700 shadow-xl'
                    : 'bg-slate-950/60 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Time icon badge */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono shrink-0 border ${
                        !rule.isEnabled
                          ? 'bg-slate-800 text-slate-500 border-slate-700'
                          : isEvt
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      }`}
                    >
                      {isEvt ? <Calendar className="w-4 h-4 mb-0.5" /> : <Clock className="w-4 h-4 mb-0.5" />}
                      <span className="text-xs font-bold">{rule.time}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold text-white text-base">{rule.title}</h4>
                        {isEvt ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.badge}`}>
                            {cat.label} • {formatDateVN(rule.eventDate || '')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                            Lặp định kỳ
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-orange-300 border border-orange-500/20">
                          {rule.targetName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400">
                          {rule.scope === 'all'
                            ? 'Toàn bộ trường'
                            : rule.scope === 'building'
                            ? 'Theo Tòa nhà'
                            : 'Phòng đơn'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{rule.description}</p>

                      {/* Event date badge or weekday pills */}
                      {isEvt ? (
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-purple-300 font-mono">
                          <span>Ngày: {formatDateVN(rule.eventDate || '')}</span>
                          <span>•</span>
                          <span>
                            Giờ: {rule.time}
                            {rule.endTime ? ` → ${rule.endTime}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-2.5">
                          {daysLabel.map((d) => {
                            const isActive = rule.daysOfWeek.includes(d.day);
                            return (
                              <span
                                key={d.day}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                  isActive
                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold'
                                    : 'bg-slate-950/60 text-slate-600'
                                }`}
                              >
                                {d.short}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-0 border-slate-800/80">
                    <button
                      onClick={() => onTriggerRuleNow(rule)}
                      title="Kích hoạt thực thi ngay lập tức"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors active:scale-95"
                    >
                      <Play className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span className="hidden md:inline">Thực thi ngay</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      title="Chỉnh sửa"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      title="Xóa"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors relative ml-1 ${
                        rule.isEnabled ? 'bg-orange-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT EVENT OR RECURRING RULE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingRule
                  ? formScheduleType === 'event'
                    ? 'Chỉnh sửa Sự kiện'
                    : 'Chỉnh sửa Quy tắc lặp'
                  : 'Tạo Lịch Sự kiện / Quy tắc mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Loại lịch: Sự kiện theo ngày vs Lặp hằng tuần */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormScheduleType('event')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    formScheduleType === 'event'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Sự kiện theo ngày</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormScheduleType('recurring')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    formScheduleType === 'recurring'
                      ? 'bg-orange-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Lặp hằng tuần</span>
                </button>
              </div>

              {/* Tên sự kiện / quy tắc */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {formScheduleType === 'event'
                    ? 'Tên sự kiện (VD: Lễ kỷ niệm 20/11, Thi học kỳ, Bảo trì điện...)'
                    : 'Tên quy tắc (VD: Tắt toàn bộ điện tòa A sau giờ học)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formScheduleType === 'event' ? 'Nhập tên sự kiện...' : 'Nhập tên quy tắc...'
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Nếu là Sự kiện theo ngày */}
              {formScheduleType === 'event' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Ngày diễn ra sự kiện
                    </label>
                    <input
                      type="date"
                      required
                      value={formEventDate}
                      onChange={(e) => setFormEventDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Loại sự kiện
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="ceremony">Sự kiện / Lễ hội</option>
                      <option value="exam">Lịch thi</option>
                      <option value="class">Lớp học / Hội thảo</option>
                      <option value="maintenance">Bảo trì điện</option>
                      <option value="holiday">Ngày nghỉ lễ</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Phạm vi (Scope) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phạm vi áp dụng</label>
                  <select
                    value={formScope}
                    onChange={(e) => {
                      const sc = e.target.value as ScheduleScope;
                      setFormScope(sc);
                      if (sc === 'all') setFormTargetId('all');
                      else if (sc === 'building') setFormTargetId('Tòa A');
                      else if (sc === 'room') setFormTargetId(rooms[0]?.code || rooms[0]?.id || 'A201');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="building">Theo Tòa nhà</option>
                    <option value="all">Toàn bộ trường</option>
                    <option value="room">Theo Phòng học cụ thể</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Đối tượng mục tiêu
                  </label>
                  {formScope === 'all' ? (
                    <input
                      disabled
                      value="Toàn bộ các phòng học"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400"
                    />
                  ) : formScope === 'building' ? (
                    <select
                      value={formTargetId}
                      onChange={(e) => setFormTargetId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="Tòa A">Tòa nhà A</option>
                      <option value="Tòa B">Tòa nhà B</option>
                      <option value="Tòa C">Tòa nhà C</option>
                    </select>
                  ) : (
                    <select
                      value={formTargetId}
                      onChange={(e) => setFormTargetId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                    >
                      {rooms.map((r) => (
                        <option key={r.code || r.id} value={r.code || r.id}>
                          {r.name} ({r.building})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Hành động & Giờ thực thi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hành động thiết bị tự động
                  </label>
                  <select
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value as ScheduleAction)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="mode_presentation">Bật chế độ sự kiện / trình chiếu</option>
                    <option value="mode_study">Bật chế độ học tập (Đèn + Quạt)</option>
                    <option value="turn_on_ac">Bật điều hòa 24°C</option>
                    <option value="turn_off_ac_proj">Tắt điều hòa và máy chiếu</option>
                    <option value="turn_off_all">Tắt toàn bộ điện</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {formScheduleType === 'event' ? 'Giờ bắt đầu (HH:mm)' : 'Giờ thực thi (HH:mm)'}
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Giờ kết thúc (tùy chọn cho sự kiện) OR Lặp lại theo thứ */}
              {formScheduleType === 'event' ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giờ kết thúc dự kiến (tùy chọn)
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Lặp lại theo ngày trong tuần:
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {daysLabel.map((d) => {
                      const isChecked = formDays.includes(d.day);
                      return (
                        <button
                          type="button"
                          key={d.day}
                          onClick={() => handleToggleDay(d.day)}
                          className={`py-2 rounded-xl text-center font-bold text-xs transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-slate-950 shadow-md'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                >
                  {editingRule
                    ? 'Lưu thay đổi'
                    : formScheduleType === 'event'
                    ? 'Lưu sự kiện'
                    : 'Tạo quy tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
