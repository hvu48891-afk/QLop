/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Database, ShieldAlert, ExternalLink, Terminal } from 'lucide-react';

interface SqlHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const SqlHelperModal: React.FC<SqlHelperModalProps> = ({
  isOpen,
  onClose,
  projectId = 'cuygczfkktprkyosabtu',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- ============================================================
-- SQL CHO PHÉP WEB APP ĐỒNG BỘ 2 CHIỀU VỚI DATABASE SUPABASE
-- Dán vào Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Bảng phòng học (rooms)
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access rooms" ON public.rooms;
CREATE POLICY "Public access rooms" ON public.rooms
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Bảng cảnh báo (alerts)
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access alerts" ON public.alerts;
CREATE POLICY "Public access alerts" ON public.alerts
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Bảng lịch trình tự động (schedules)
ALTER TABLE IF EXISTS public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access schedules" ON public.schedules;
CREATE POLICY "Public access schedules" ON public.schedules
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Bảng nhật ký hoạt động (activity_logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id text PRIMARY KEY,
  timestamp text,
  user_name text,
  action text,
  room_id text,
  room_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access activity_logs" ON public.activity_logs;
CREATE POLICY "Public access activity_logs" ON public.activity_logs
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Mở quyền ghi Supabase (RLS Policy)</h3>
              <p className="text-xs text-slate-400">Giúp đồng bộ số lượng phòng học 2 chiều giữa App và Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Tại sao cần thực hiện bước này?</p>
              <p className="mt-1 text-slate-300">
                Supabase mặc định kích hoạt <strong>Row Level Security (RLS)</strong> khi tạo bảng. Nếu chưa có Policy cho khóa công khai (Publishable/Anon key), Database sẽ từ chối thêm mới phòng học hoặc ghi đè dữ liệu.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" /> Câu lệnh SQL 1-Click
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {sqlCode}
            </pre>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <p className="font-bold text-slate-200">Cách dán vào Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Truy cập <a href={`https://supabase.com/dashboard/project/${projectId}/sql`} target="_blank" rel="noopener noreferrer" className="text-orange-400 underline inline-flex items-center gap-0.5">Supabase SQL Editor <ExternalLink className="w-3 h-3" /></a></li>
              <li>Bấm <strong>New Query</strong></li>
              <li>Dán đoạn mã trên vào và bấm <strong>Run</strong></li>
              <li>Quay lại ứng dụng và bấm <strong>"Đồng bộ ngay với Database"</strong>!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
