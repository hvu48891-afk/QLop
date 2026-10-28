/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Check, 
  Clock, 
  Calendar, 
  Repeat, 
  Layers, 
  Building2, 
  Power, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { ScheduleRule, ScheduleScope, ScheduleAction, Room } from '../types';

interface SchedulesTabProps {
  rules: ScheduleRule[];
  rooms: Room[];
  onToggleRule: (ruleId: string) => void;
  onSaveRule: (rule: ScheduleRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onTriggerRuleNow: (rule: ScheduleRule) => void;
}

export const SchedulesTab: React.FC<SchedulesTabProps> = ({
  rules,
  rooms,
  onToggleRule,
  onSaveRule,
  onDeleteRule,
  onTriggerRuleNow,
}) => {
  const [viewMode, setViewMode] = useState<'rules' | 'calendar'>('rules');
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formScope, setFormScope] = useState<ScheduleScope>('building');
  const [formTargetId, setFormTargetId] = useState('Tòa A');
  const [formAction, setFormAction] = useState<ScheduleAction>('turn_off_all');
  const [formTime, setFormTime] = useState('17:30');
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // T2 - T7

  const daysLabel = [
    { day: 1, label: 'Thứ 2' },
    { day: 2, label: 'Thứ 3' },
    { day: 3, label: 'Thứ 4' },
    { day: 4, label: 'Thứ 5' },
    { day: 5, label: 'Thứ 6' },
    { day: 6, label: 'Thứ 7' },
    { day: 0, label: 'Chủ nhật' },
  ];

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormTitle('');
    setFormScope('building');
    setFormTargetId('Tòa A');
    setFormAction('turn_off_all');
    setFormTime('17:30');
    setFormDays([1, 2, 3, 4, 5, 6]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: ScheduleRule) => {
    setEditingRule(rule);
    setFormTitle(rule.title);
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
      const rm = rooms.find((r) => r.id === formTargetId);
      targetName = rm ? rm.name : formTargetId;
    }

    const actionTextMap: Record<ScheduleAction, string> = {
      turn_off_all: 'Tắt toàn bộ điện',
      turn_off_ac_proj: 'Tắt điều hòa và máy chiếu',
      turn_on_ac: 'Bật làm mát điều hòa 24°C',
      mode_study: 'Bật chế độ học tập',
    };

    const daysText =
      formDays.length === 7
        ? 'Hằng ngày'
        : formDays.length === 6 && !formDays.includes(0)
        ? 'Hằng ngày trừ Chủ nhật'
        : formDays.length === 5 && !formDays.includes(6) && !formDays.includes(0)
        ? 'Thứ 2 đến Thứ 6'
        : `Các ngày: ${formDays.map((d) => (d === 0 ? 'CN' : `T${d + 1}`)).join(', ')}`;

    const desc = `${actionTextMap[formAction]} tại ${targetName} vào lúc ${formTime} (${daysText})`;

    const newRule: ScheduleRule = {
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      title: formTitle,
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

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      {/* Top Header & View Mode Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-400" />
            Lập lịch & Tự động hóa (Rule Automation)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cấu hình lịch tự động tắt mở thiết bị tiết kiệm điện năng cho toàn trường
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch tab */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'rules'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Danh sách Quy tắc
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lịch trực quan
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Rule Mới</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: RULES LIST ================= */}
      {viewMode === 'rules' && (
        <div className="space-y-3.5">
          {rules.map((rule) => {
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
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono shrink-0 ${
                        rule.isEnabled
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Clock className="w-4 h-4 mb-0.5" />
                      <span className="text-xs font-bold">{rule.time}</span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold text-white text-base">{rule.title}</h4>
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

                      {/* Days pills */}
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
                              {d.label.replace('Thứ ', 'T')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Toggle switch + Test button + Edit/Delete */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-0 border-slate-800/80">
                    <button
                      onClick={() => onTriggerRuleNow(rule)}
                      title="Chạy thử quy tắc ngay lập tức"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors active:scale-95"
                    >
                      <Play className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span className="hidden md:inline">Chạy thử</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      title="Sửa rule"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      title="Xóa rule"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Enable / Disable switch */}
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

      {/* ================= VIEW 2: CALENDAR PREVIEW ================= */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h4 className="font-bold text-white text-sm">
                Lịch biểu hoạt động tuần này (T2 - CN)
              </h4>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
              <span>Sự kiện tự động hóa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {daysLabel.map((d) => {
              // Find rules active on this day
              const dayRules = rules.filter(
                (r) => r.isEnabled && r.daysOfWeek.includes(d.day)
              );

              return (
                <div
                  key={d.day}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col min-h-[140px]"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                    <span className="font-bold text-xs text-orange-300">{d.label}</span>
                    <span className="text-[10px] text-slate-500">
                      {dayRules.length} sự kiện
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayRules.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => onTriggerRuleNow(r)}
                        title="Bấm để chạy thử rule"
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 cursor-pointer transition-colors text-[11px]"
                      >
                        <div className="font-mono font-bold text-orange-400 text-[10px]">
                          {r.time}
                        </div>
                        <p className="font-semibold text-slate-200 truncate">{r.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{r.targetName}</p>
                      </div>
                    ))}

                    {dayRules.length === 0 && (
                      <div className="text-[10px] text-slate-600 text-center py-4">
                        Trống lịch
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT RULE ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingRule ? 'Chỉnh sửa Quy tắc' : 'Tạo Quy tắc Tự động mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Tên rule */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên quy tắc (Ví dụ: Tắt toàn bộ điện tòa A sau giờ học)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên quy tắc..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Phạm vi (Scope) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phạm vi áp dụng
                  </label>
                  <select
                    value={formScope}
                    onChange={(e) => {
                      const sc = e.target.value as ScheduleScope;
                      setFormScope(sc);
                      if (sc === 'all') setFormTargetId('all');
                      else if (sc === 'building') setFormTargetId('Tòa A');
                      else if (sc === 'room') setFormTargetId(rooms[0]?.id || 'A201');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="building">Theo Tòa nhà</option>
                    <option value="all">Toàn bộ trường</option>
                    <option value="room">Theo Phòng học cụ thể</option>
                  </select>
                </div>

                {/* Chọn đối tượng theo scope */}
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
                        <option key={r.id} value={r.id}>
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
                  <label className="block text-slate-300 font-semibold mb-1">Hành động</label>
                  <select
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value as ScheduleAction)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="turn_off_all">Tắt toàn bộ điện</option>
                    <option value="turn_off_ac_proj">Tắt điều hòa và máy chiếu</option>
                    <option value="turn_on_ac">Bật điều hòa 24°C</option>
                    <option value="mode_study">Bật chế độ học tập</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giờ thực thi (HH:mm)
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

              {/* Lặp lại theo ngày trong tuần */}
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
                        {d.label.replace('Thứ ', 'T')}
                      </button>
                    );
                  })}
                </div>
              </div>

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
                  {editingRule ? 'Lưu thay đổi' : 'Tạo quy tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
