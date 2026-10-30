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
  onSuccessVerified?: () => void;
}

export const SqlHelperModal: React.FC<SqlHelperModalProps> = ({
  isOpen,
  onClose,
  projectId = 'cuygczfkktprkyosabtu',
  onSuccessVerified,
}) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const sqlCode = `-- ============================================================
-- SQL CHO PHÉP WEB APP ĐỒNG BỘ 2 CHIỀU VỚI DATABASE SUPABASE
-- Dán vào: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. TẮT RLS ĐỂ WEB & PHẦN CỨNG TOÀN QUYỀN ĐỌC GHI (KHUYÊN DÙNG)
ALTER TABLE IF EXISTS public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. CẤP TOÀN QUYỀN TRUY CẬP CHO ANON VÀ AUTHENTICATED
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. NẾU MUỐN GIỮ RLS, TẠO POLICY MỞ CHO TẤT CẢ:
DROP POLICY IF EXISTS "Public access rooms" ON public.rooms;
CREATE POLICY "Public access rooms" ON public.rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access alerts" ON public.alerts;
CREATE POLICY "Public access alerts" ON public.alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access schedules" ON public.schedules;
CREATE POLICY "Public access schedules" ON public.schedules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access settings" ON public.settings;
CREATE POLICY "Public access settings" ON public.settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTestWrite = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { supabaseService } = await import('../services/supabaseService');
      const res = await supabaseService.testWriteAccess();
      if (res.canWrite) {
        setTestResult({
          success: true,
          message: 'Tuyệt vời! Quyền ghi Supabase đã được mở thành công. Mọi thao tác trên web sẽ lưu thẳng vào database!',
        });
        if (onSuccessVerified) onSuccessVerified();
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Database vẫn đang chặn quyền ghi (RLS 42501). Hãy chắc chắn bạn đã bấm nút "Run" trong Supabase SQL Editor.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Lỗi khi kiểm tra kết nối',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Mở quyền ghi Supabase (Khắc phục lỗi RLS 42501)</h3>
              <p className="text-xs text-slate-400">Giúp mọi chỉnh sửa công tắc, thiết bị trên Web lưu thẳng vào Supabase</p>
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
              <p className="font-bold text-amber-300">Nguyên nhân database chưa thay đổi:</p>
              <p className="mt-1 text-slate-300">
                Supabase mặc định kích hoạt <strong>Row Level Security (RLS)</strong> khi tạo bảng. Do đó khóa công khai (Publishable/Anon key) bị Postgres từ chối ghi dữ liệu với mã lỗi <strong>42501</strong>. Bạn chỉ cần chạy lệnh SQL dưới đây 1 lần duy nhất để mở quyền ghi.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" /> Câu lệnh SQL 1-Click
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-48">
              {sqlCode}
            </pre>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <p className="font-bold text-slate-200">Các bước thực hiện (mất khoảng 15 giây):</p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>
                Bấm sao chép mã SQL ở trên, sau đó truy cập:
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1 font-semibold"
                >
                  Mở Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Dán mã vào ô truy vấn rồi bấm nút <strong>RUN</strong> màu xanh.</li>
              <li>Quay lại đây và bấm nút <strong>"Kiểm tra lại quyền ghi"</strong> bên dưới.</li>
            </ol>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                  : 'bg-red-500/15 border-red-500/30 text-red-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <p>{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleTestWrite}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            {testing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang kiểm tra...
              </span>
            ) : (
              'Kiểm tra lại quyền ghi'
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
